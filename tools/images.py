#!/usr/bin/env python3
"""Gera variantes responsivas (webp) e o manifesto images.json a partir de src/assets/orig."""
import json, os
from PIL import Image, ImageFilter
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src/assets/orig'); OUT=os.path.join(ROOT,'public/assets/img')
os.makedirs(OUT,exist_ok=True)
names={'lisboa':'webp','aeroporto':'png','sintra':'webp','fatima':'webp','nazare':'webp','porto':'webp','evora':'webp','taxi':'webp'}
targets=[480,768,1280,1920]
manifest={}
for n,ext in names.items():
    im=Image.open(f'{SRC}/{n}.{ext}').convert('RGB'); sw,sh=im.size
    native=sw
    widths=[w for w in targets if w<=native]
    # imagens de origem pequenas: uma variante ampliada (1280) para heros
    if native<1280: widths.append(1280)
    if native>=1280 and native not in widths and native<1920: widths.append(native)
    widths=sorted(set(widths))
    manifest[n]={'ratio':[sw,sh],'variants':[]}
    for w in widths:
        h=round(sh*w/sw)
        r=im.resize((w,h),Image.LANCZOS)
        if w>native: r=r.filter(ImageFilter.UnsharpMask(radius=1.4,percent=60,threshold=2))
        q=80 if w<=768 else 76
        fp=f'{OUT}/{n}-{w}.webp'; r.save(fp,'WEBP',quality=q,method=6)
        manifest[n]['variants'].append({'w':w,'h':h,'kb':round(os.path.getsize(fp)/1024)})
json.dump(manifest,open(f'{ROOT}/content/images.json','w'),indent=1)
for n,m in manifest.items(): print(n,[(v['w'],v['kb']) for v in m['variants']])
