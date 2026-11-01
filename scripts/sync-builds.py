"""Copy the production build of each project that keeps its own Git repository into builds/.

Those projects are left out of this repository, so a Git-connected Vercel deploy would not
see their dist folders. Their builds are committed under builds/<folder>/ instead, and
vercel.json routes their public paths there. Run this after rebuilding any of them.
"""
from pathlib import Path
import shutil,sys
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'builds'
nested=sorted(p.name for p in ROOT.iterdir() if p.is_dir() and (p/'.git').exists() and (p/'dist/index.html').is_file())
requested=sys.argv[1:] or nested
for folder in nested:
 if folder not in requested:continue
 target=OUT/folder
 shutil.rmtree(target,ignore_errors=True)
 shutil.copytree(ROOT/folder/'dist',target,ignore=shutil.ignore_patterns('*.map','.DS_Store'))
 size=sum(f.stat().st_size for f in target.rglob('*') if f.is_file())
 print(f'Synced {folder}/dist -> builds/{folder} ({size/2**20:.1f} MB)')
