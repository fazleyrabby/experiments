from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parent.parent
projects=json.loads((ROOT/'gallery/projects.json').read_text())
cards=[]
for i,p in enumerate(projects):
 slug,title,category,description=(html.escape(p[x]) for x in ['slug','title','category','description'])
 cards.append(f'''<li class="project" data-category="{category}"><a href="/{slug}/" aria-label="Explore {title}"><div class="preview"><img src="/gallery/previews/{slug}.webp" alt="{title} project preview" width="1280" height="720" {'fetchpriority="high"' if i==0 else 'loading="lazy"'} decoding="async"><span class="open" aria-hidden="true">Explore ↗</span></div><div class="project-heading"><h3>{title}</h3><span class="category">{category}</span></div><p class="description">{description}</p></a></li>''')
filters=''.join(f'<button type="button" data-filter="{x}" aria-pressed="{str(x=="All").lower()}">{x}</button>' for x in ['All','Objects','Worlds','Play'])
page=(ROOT/'gallery/page-template.html').read_text().replace('COUNT',str(len(projects))).replace('CARDS','\n'.join(cards))
(ROOT/'index.html').write_text(page)
print(f'Built gallery: {len(projects)} projects')
