#!/usr/bin/env python3
"""Import cumulative totals into an EXISTING SQLite counter table atomically.

Run only after identifying the VPS database and making a database backup.
Use explicit table/column names from its actual schema. No schema is guessed.
"""
import argparse
import json
import re
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('snapshot', type=Path)
parser.add_argument('--database', type=Path, required=True)
parser.add_argument('--table', required=True)
parser.add_argument('--project-column', required=True)
parser.add_argument('--count-column', required=True)
parser.add_argument('--key-column')
parser.add_argument('--key-value', default='visitors')
args = parser.parse_args()

def identifier(value):
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', value):
        raise SystemExit('Invalid SQL identifier')
    return '"' + value + '"'

table = identifier(args.table)
project_column = identifier(args.project_column)
count_column = identifier(args.count_column)
key_column = identifier(args.key_column) if args.key_column else None
data = json.loads(args.snapshot.read_text())
projects = {'pocket-liquid-hourglass', 'bubble-wrap', 'sticker-peel', 'molten-glass', 'jelly-cube', 'zipper', 'light-switch-wall', 'scratch-card', 'wax-seal', 'pocket-thunderstorm'}
if data.get('schemaVersion') != 1 or data.get('source') != 'experiments-cloudflare-2026-10-10-v1':
    raise SystemExit('Unexpected export source/version')
rows = data.get('projects', [])
if len(rows) != len(projects) or {r.get('project') for r in rows} != projects:
    raise SystemExit('Export must contain each of the ten experiments once')
if any(type(r.get('total')) is not int or r['total'] < 0 for r in rows):
    raise SystemExit('Invalid totals')
if not args.database.is_file():
    raise SystemExit('Existing database required')

connection = sqlite3.connect(args.database.resolve().as_uri() + '?mode=rw', uri=True)
try:
    connection.execute('BEGIN IMMEDIATE')
    connection.execute('CREATE TABLE IF NOT EXISTS experiment_backup_imports (source TEXT NOT NULL, project TEXT NOT NULL, imported_total INTEGER NOT NULL, PRIMARY KEY (source, project))')
    changes = []
    for row in rows:
        project, total = row['project'], row['total']
        previous = connection.execute('SELECT imported_total FROM experiment_backup_imports WHERE source = ? AND project = ?', (data['source'], project)).fetchone()
        imported = previous[0] if previous else 0
        if total < imported:
            raise ValueError('Older snapshot than the last import: ' + project)
        delta = total - imported
        if delta:
            where = f'{project_column} = ?'
            values = [delta, project]
            if key_column:
                where += f' AND {key_column} = ?'
                values.append(args.key_value)
            # Existing rows only: missing/ambiguous rows abort the whole import.
            cursor = connection.execute(f'UPDATE {table} SET {count_column} = {count_column} + ? WHERE {where}', values)
            if cursor.rowcount != 1:
                raise ValueError('Expected exactly one existing counter row: ' + project)
        connection.execute('INSERT INTO experiment_backup_imports VALUES (?, ?, ?) ON CONFLICT(source, project) DO UPDATE SET imported_total = excluded.imported_total', (data['source'], project, total))
        changes.append((project, delta))
    connection.commit()
    for project, delta in changes:
        print(f'{project}: +{delta}')
except Exception:
    connection.rollback()
    raise
finally:
    connection.close()
