#!/usr/bin/env python3
"""Download cumulative backup totals; exporting never resets the counter."""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent
endpoint = 'https://experiments-visit-backup.fazley111.workers.dev'
token = os.environ.get('COUNTER_ADMIN_TOKEN') or (root / '.admin-token').read_text().strip()
request = Request(endpoint + '/admin/export', headers={
    'Authorization': 'Bearer ' + token,
    'User-Agent': 'Mozilla/5.0 (compatible; ExperimentsCounterExport/1.0)'
})
with urlopen(request, timeout=20) as response:
    data = json.load(response)
if data.get('schemaVersion') != 1 or data.get('source') != 'experiments-cloudflare-2026-10-10-v1':
    raise SystemExit('Unexpected export format')
destination = root / 'exports'
destination.mkdir(exist_ok=True)
path = destination / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.json')
path.write_text(json.dumps(data, indent=2) + '\n')
os.chmod(path, 0o600)
print(path)
