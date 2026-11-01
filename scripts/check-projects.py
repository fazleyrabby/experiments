"""Check published entry points and bundled asset URLs against the Vercel routes."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json,re
ROOT=Path(__file__).resolve().parent.parent
routes=json.loads((ROOT/'vercel.json').read_text())['routes']
projects=json.loads((ROOT/'gallery/projects.json').read_text())
def resolve(url):
 path=unquote(urlsplit(url).path)
 for route in routes:
  if 'src' not in route:continue
  match=re.fullmatch(route['src'],path)
  if match and 'dest' in route:
   target=route['dest']
   for i,group in enumerate(match.groups(),1):target=target.replace('$'+str(i),group or '')
   return ROOT/target.lstrip('/')
 return ROOT/path.lstrip('/')
checked=0
for p in projects:
 url='/'+p['slug']+'/'
 entry=resolve(url)
 if entry.is_dir():entry=entry/'index.html'
 assert entry.is_file(),f'Missing project {url}: {entry}'
 for asset in re.findall(r'(?:src|href)=[\"\x27]([^\"\x27]+)',entry.read_text()):
  if asset.startswith(('http:','https:','data:','#','mailto:','javascript:')):continue
  if not re.search(r'\.(js|css|svg|png|webp|woff2?)(?:\?|$)',asset):continue
  target=resolve(asset if asset.startswith('/') else url+asset)
  assert target.is_file(),f'Missing {url} asset {asset}: {target}'
  checked+=1
 assert (ROOT/'gallery/previews'/f"{p['slug']}.webp").is_file(),f"Missing preview {p['slug']}"
print(f'{len(projects)} project links and {checked} entry assets verified')
