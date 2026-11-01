"""Rebuild migrated projects for the shared Experiments domain."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parent.parent
projects=json.loads((ROOT/'scripts/project-paths.json').read_text())
requested=sys.argv[1:] or list(projects.values())
for folder,slug in projects.items():
 if slug in requested or folder in requested:
  print(f'Building /{slug}/',flush=True)
  subprocess.run(['npm','run','build'],cwd=ROOT/folder,check=True)
