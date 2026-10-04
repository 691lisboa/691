from playwright.sync_api import sync_playwright
svg=open('airport.svg').read()
html=f'<html><body style="margin:0;background:#000">{svg}</body></html>'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':800},device_scale_factor=2)
    pg.set_content(html); pg.wait_for_timeout(500)
    pg.screenshot(path='airport.png',clip={'x':0,'y':0,'width':1200,'height':800}); b.close()
