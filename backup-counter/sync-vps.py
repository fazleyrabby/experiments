#!/usr/bin/env python3
"""Mirror the Cloudflare visit ledger into the inspected VPS SQLite counter."""
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT.parent / 'data' / 'views.db'
ENDPOINT = 'https://experiments-visit-backup.fazley111.workers.dev'
SOURCE = 'experiments-cloudflare-2026-10-10-v1'
PROJECTS = {'experiments', 'pocket-liquid-hourglass', 'bubble-wrap', 'sticker-peel', 'molten-glass', 'jelly-cube', 'zipper', 'light-switch-wall', 'scratch-card', 'wax-seal', 'pocket-thunderstorm', 'gummy-squish', 'little-spider'}
TOKEN = (ROOT / '.admin-token').read_text().strip()

def api(path, payload=None):
    headers = {
        'Authorization': 'Bearer ' + TOKEN,
        'User-Agent': 'Mozilla/5.0 (compatible; ExperimentsCounterSync/1.0)',
        'Content-Type': 'application/json'
    }
    request = Request(ENDPOINT + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers)
    with urlopen(request, timeout=20) as response:
        return json.load(response)

def save(name, data):
    target = ROOT / name
    temporary = ROOT / (name + '.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    os.chmod(temporary, 0o600)
    temporary.replace(target)

snapshot = api('/admin/export')
rows = snapshot.get('projects', [])
if snapshot.get('schemaVersion') != 1 or snapshot.get('source') != SOURCE:
    raise SystemExit('Invalid backup source/version')
if len(rows) != len(PROJECTS) or {row.get('project') for row in rows} != PROJECTS:
    raise SystemExit('Invalid project list')
if any(type(row.get('total')) is not int or not 0 <= row['total'] <= 9007199254740991 for row in rows):
    raise SystemExit('Invalid backup totals')
save('latest-export.json', snapshot)
if not DATABASE.is_file():
    raise SystemExit('Existing VPS database required')

db = sqlite3.connect(DATABASE.resolve().as_uri() + '?mode=rw', uri=True, timeout=30)
try:
    if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='experiment_backup_imports'").fetchone():
        backup_dir = DATABASE.parent / 'backups'
        backup_dir.mkdir(exist_ok=True)
        backup_path = backup_dir / ('views-before-cloudflare-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.db')
        with sqlite3.connect(backup_path) as backup:
            db.backup(backup)
        os.chmod(backup_path, 0o600)
    db.execute('BEGIN IMMEDIATE')
    db.execute('CREATE TABLE IF NOT EXISTS experiment_backup_imports (source TEXT NOT NULL, project TEXT NOT NULL, imported_total INTEGER NOT NULL, baseline_total INTEGER NOT NULL, PRIMARY KEY (source, project))')
    columns = {row[1] for row in db.execute('PRAGMA table_info(experiment_backup_imports)')}
    if 'baseline_total' not in columns:
        db.execute('ALTER TABLE experiment_backup_imports ADD COLUMN baseline_total INTEGER NOT NULL DEFAULT 0')
    results = []
    for row in rows:
        project, backup_total = row['project'], row['total']
        current_row = db.execute('SELECT views FROM project_views WHERE project=? AND key=?', (project, 'visitors')).fetchone()
        current = current_row[0] if current_row else 0
        previous = db.execute('SELECT imported_total FROM experiment_backup_imports WHERE source=? AND project=?', (SOURCE, project)).fetchone()
        imported = previous[0] if previous else 0
        if backup_total < imported or current < imported:
            raise ValueError('Counter regression; manual reconciliation required: ' + project)
        baseline = current - imported
        delta = backup_total - imported
        db.execute('INSERT INTO project_views(project, key, views) VALUES (?, ?, 0) ON CONFLICT(project, key) DO NOTHING', (project, 'visitors'))
        if delta:
            db.execute('UPDATE project_views SET views=views+?, updated_at=CURRENT_TIMESTAMP WHERE project=? AND key=?', (delta, project, 'visitors'))
        db.execute('INSERT INTO experiment_backup_imports(source,project,imported_total,baseline_total) VALUES (?,?,?,?) ON CONFLICT(source,project) DO UPDATE SET imported_total=excluded.imported_total,baseline_total=excluded.baseline_total', (SOURCE, project, backup_total, baseline))
        results.append({'project': project, 'added': delta, 'baseline': baseline, 'backupVisits': backup_total, 'views': baseline + backup_total})
    db.commit()
except Exception:
    db.rollback()
    raise
finally:
    db.close()

# This follows the DB commit. Retrying after an interrupted baseline update
# imports no duplicate visits, then repairs the public displayed total.
for row in results:
    api('/admin/baseline', {'project': row['project'], 'baseline': row['baseline']})
status = {'syncedAt': datetime.now(timezone.utc).isoformat(), 'projects': results}
save('last-sync.json', status)
print(json.dumps(status))
