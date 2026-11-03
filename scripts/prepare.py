#!/usr/bin/env python3
"""Copy the self-contained starter and validate/apply a content JSON patch."""
import argparse,json,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ALLOWED=set("ABCDEFGHIJKLMNOPQRSTUVWXYZ 0124.,!'-/")
def configure(target,patch=None):
 p=target/'content.json';c=json.loads(p.read_text())
 if patch:
  for k,v in patch.items():
   if k not in c:raise ValueError(f'Unknown content field: {k}')
   if k=='palette':c[k].update(v)
   else:c[k]=v
 lengths={'title':2,'brand':2,'opening':3,'dance':3,'heroLeft':2,'heroRight':2,'endNote':3}
 for k,n in lengths.items():
  if not isinstance(c[k],list) or len(c[k])!=n:raise ValueError(f'{k} requires {n} strings')
 for row in c['title']:
  if not isinstance(row,str) or not re.fullmatch('[A-Z]{2,7}',row):raise ValueError('Starter title: two rows of 2–7 uppercase Latin letters. For CJK/custom titles, adapt the glyph renderer; do not silently transliterate user copy.')
 for k,v in c.items():
  if k=='palette':continue
  for value in v if isinstance(v,list) else [v]:
   if not isinstance(value,str):raise ValueError(f'{k} must contain text')
   missing=set(value)-ALLOWED
   if missing:raise ValueError(f'{k}: unsupported glyphs {missing}. Add licensed glyphs or drawn paths before rendering.')
 limits={'header':24,'subheader':24,'footerLeft':38,'footerRight':20,'tagline':40}
 for k,n in limits.items():
  if len(c[k])>n:raise ValueError(f'{k} exceeds starter layout limit {n}; re-layout it explicitly')
 for k,vs in c.items():
  if isinstance(vs,list) and k!='title' and any(len(x)>10 for x in vs):raise ValueError(f'{k}: side labels support up to 10 characters per line; re-layout longer copy')
 for k,v in c['palette'].items():
  if not re.fullmatch('#[0-9A-Fa-f]{6}',v):raise ValueError(f'Invalid color {k}: {v}')
 cues=json.loads((target/'cues.json').read_text());cues['beats']=[x for x in cues['beats'] if not x['name'].startswith('letter')]
 n=sum(map(len,c['title']))
 cues['beats'] += [{'frame':184+round(i/(n-1)*14)*2,'name':f'letter{i+1}'} for i in range(n)]
 cues['beats'].sort(key=lambda x:x['frame'])
 p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
 (target/'content.js').write_text('window.FILM_CONFIG = '+json.dumps(c,ensure_ascii=False)+';\n')
 (target/'cues.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2)+'\n')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('destination',type=Path);ap.add_argument('--content',type=Path);ap.add_argument('--update',action='store_true');a=ap.parse_args()
 if not a.update:
  if a.destination.exists():raise SystemExit('Destination exists. Choose a new folder or use --update to apply content only.')
  shutil.copytree(ROOT/'assets/starter',a.destination)
  shutil.copy2(ROOT/'scripts/render.cjs',a.destination/'render.cjs')
 configure(a.destination,json.loads(a.content.read_text()) if a.content else None)
 print(a.destination.resolve())
if __name__=='__main__':main()
