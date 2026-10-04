#!/usr/bin/env python3
"""Gera favicons/ícones PWA e imagens Open Graph (1200x630) com Chromium + Inter local."""
import json, os, subprocess, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT=f'file://{ROOT}/src/static/fonts/inter-latin-wght-normal.woff2'
STATIC=f'{ROOT}/src/static'; OG=f'{ROOT}/public/assets/og'; IMG=f'{ROOT}/public/assets/img'
os.makedirs(OG,exist_ok=True)
FACE=f"@font-face{{font-family:Inter;src:url({FONT}) format('woff2');font-weight:100 900}}"
def icon_html(size,safe=1.0,bg=True):
    fs=size*0.34*safe
    return f"""<html><style>{FACE}html,body{{margin:0}}body{{width:{size}px;height:{size}px;background:{'#0b1015' if bg else 'transparent'};display:grid;place-items:center;overflow:hidden}}
.l{{font:900 {fs}px/1 Inter;color:#fff;letter-spacing:-.075em;display:flex;align-items:flex-end}}.d{{width:{fs*.2}px;height:{fs*.2}px;border-radius:50%;background:#18c861;margin:0 {fs*.03}px {fs*.1}px {fs*.04}px}}.p{{font-size:{fs*.4}px;font-weight:800;letter-spacing:-.02em;margin-bottom:{fs*.04}px}}</style>
<body><div class="l">691<span class="d"></span><span class="p">pt</span></div></body></html>"""
data=json.loads(subprocess.check_output(['node','-e',"""
import('./content/site.mjs').then(({T,IMAGES,DEST_KEYS})=>{const out=[];for(const lang of ['pt','en']){const t=T[lang];
const add=(key,h1,eyebrow,img)=>out.push({key,lang,h1,eyebrow,img});
add('home',t.pages.home.h1,t.pages.home.eyebrow,'lisboa');
for(const k of ['airport','lisbon','portugal'])add(k,t.pages[k].h1,t.pages[k].eyebrow,IMAGES[k].img);
for(const k of DEST_KEYS)add(k,t.dest[k].h1,(lang==='pt'?'Lisboa → ':'Lisbon → ')+t.dest[k].name,IMAGES[k].img);}
console.log(JSON.stringify(out))})"""],cwd=ROOT,text=True))
pos={'home':'50% 60%','airport':'50% 72%','lisbon':'50% 60%','portugal':'50% 45%','sintra':'50% 45%','fatima':'50% 50%','nazare':'40% 55%','porto':'50% 55%','evora':'50% 45%'}
def og_html(d):
    n=d['img']; vs=sorted(int(f.split('-')[-1].split('.')[0]) for f in os.listdir(IMG) if f.startswith(n+'-'))
    w=[v for v in vs if v>=1200][0]
    fs=66 if len(d['h1'])<60 else 56
    return f"""<html><style>{FACE}html,body{{margin:0}}body{{width:1200px;height:630px;position:relative;overflow:hidden;font-family:Inter;color:#fff;background:#0b1015}}
img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:{pos[d['key']]}}}
.o{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,16,21,.35) 0%,rgba(11,16,21,.25) 35%,rgba(11,16,21,.93) 100%),linear-gradient(90deg,rgba(11,16,21,.7),rgba(11,16,21,0) 75%)}}
.logo{{position:absolute;left:64px;top:48px;font:900 56px/1 Inter;letter-spacing:-.075em;display:flex;align-items:flex-end}}.logo i{{width:13px;height:13px;border-radius:50%;background:#18c861;margin:0 3px 7px 4px}}.logo span{{font-size:26px;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}}
.t{{position:absolute;left:64px;right:64px;bottom:60px}}.e{{font:800 20px/1 Inter;letter-spacing:.14em;text-transform:uppercase;color:#18c861;margin-bottom:18px}}
h1{{margin:0;font:850 {fs}px/1.04 Inter;letter-spacing:-.04em;max-width:1000px}}
.b{{position:absolute;right:64px;top:56px;background:#18c861;color:#06210f;font:800 22px/1 Inter;padding:16px 24px;border-radius:14px}}</style>
<body><img src="file://{IMG}/{n}-{w}.webp"><div class="o"></div><div class="logo">691<i></i><span>pt</span></div><div class="b">{'WhatsApp +351 928 158 158'}</div>
<div class="t"><div class="e">{d['eyebrow']}</div><h1>{d['h1']}</h1></div></body></html>"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--allow-file-access-from-files'])
    def shot(html,path,w,h,fmt='png',q=None,transparent=False):
        tmp=f'{ROOT}/tools/_tmp.html'; open(tmp,'w').write(html); pg=b.new_page(viewport={'width':w,'height':h}); pg.goto('file://'+tmp); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(300)
        kw=dict(path=path,type=fmt)
        if q: kw['quality']=q
        if transparent: kw['omit_background']=True
        pg.screenshot(**kw); pg.close()
    shot(icon_html(32),f'{STATIC}/favicon-32.png',32,32)
    shot(icon_html(180),f'{STATIC}/apple-touch-icon.png',180,180)
    shot(icon_html(192),f'{STATIC}/icon-192.png',192,192)
    shot(icon_html(512),f'{STATIC}/icon-512.png',512,512)
    shot(icon_html(512,safe=0.78),f'{STATIC}/icon-maskable-512.png',512,512)
    for d in data:
        shot(og_html(d),f'{OG}/{d["key"]}-{d["lang"]}.jpg',1200,630,'jpeg',82)
    b.close()
os.path.exists(f'{ROOT}/tools/_tmp.html') and os.remove(f'{ROOT}/tools/_tmp.html')
print('ok',len(data),'og')
