"""Preview the same project subpaths used by Vercel, without exposing source files."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
ROOT=Path(__file__).resolve().parent.parent
PROJECTS={slug:folder for folder,slug in json.loads((ROOT/'scripts/project-paths.json').read_text()).items()}
PROJECTS.update({'stillwater-diorama':'stillwater-diorama','little-spider':'little-spider','ctg-explorer':'ctg-explorer'})
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  clean=unquote(urlsplit(path).path).lstrip('/')
  slug,_,rest=clean.partition('/')
  if slug in PROJECTS:
   root=ROOT/PROJECTS[slug]/'dist'
   target=root/(rest or 'index.html')
   if slug=='simforge' and rest and '.' not in rest:target=root/'index.html'
  else:target=ROOT/(clean or 'index.html')
  if not target.resolve().is_relative_to(ROOT):return str(ROOT/'404')
  return str(target)
ThreadingHTTPServer(('127.0.0.1',4180),Handler).serve_forever()
