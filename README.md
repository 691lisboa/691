# 691.pt — site final (PT + EN)

Site estático, sem dependências. Node ≥ 20.

```bash
npm start        # serve public/ na porta 5000 (PORT=...)
npm run build    # regenera public/ a partir de content/ + src/
npm test         # build + auditoria (links, SEO, imagens, a11y estática)
```

## Onde editar
- **Textos (PT e EN):** `content/site.mjs` → depois `npm run build`.
- **Estilos:** `src/css/site.css` · **JS:** `src/js/site.js` · **Service worker:** `src/js/sw.js`.
- **Texto legal:** `content/legal.json`.

## Trocar a foto do aeroporto por uma foto real
1. Guarde a foto (3:2, mínimo 1920 px de largura) como `src/assets/orig/aeroporto.webp` (apague `aeroporto.png`; ajuste a extensão em `tools/images.py` se usar .jpg).
2. `python3 tools/images.py` (gera as variantes responsivas — requer Pillow)
3. `python3 tools/assets.py` (regenera as imagens de partilha OG — requer Playwright/Chromium)
4. `npm run build`

A imagem atual é uma ilustração original (`tools/airport.svg`), criada porque não foi possível obter uma fotografia real.

## Estrutura de URLs
PT: `/`, `/taxi-aeroporto-lisboa/`, `/taxi-lisboa/`, `/viagens-portugal/` (+ sintra, fatima, nazare, porto, evora), `/legal.html`
EN: `/en/`, `/en/lisbon-airport-taxi/`, `/en/lisbon-taxi/`, `/en/trips-portugal/` (+ destinos), `/en/legal.html`
Redirecionamentos 301 automáticos: `/lisbon-airport-taxi/` → `/en/lisbon-airport-taxi/`, `/manifest.json` → `/manifest.webmanifest`.
