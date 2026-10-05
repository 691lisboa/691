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

## Idioma automático e cabeçalho
- O site mantém versões PT e EN separadas para SEO, mas a escolha inicial é automática pela língua principal do navegador/telemóvel.
- `pt-*` abre a versão PT; restantes línguas abrem EN. Crawlers não são redirecionados, preservando as duas versões indexáveis.
- Não existe botão EN/PT nem menu móvel. No topo ficam apenas os ícones de contacto definidos para cada tipo de página.

## Foto real do aeroporto
- A homepage e a página do aeroporto usam uma fotografia real do Aeroporto Humberto Delgado, em Lisboa.
- A origem está em `src/assets/orig/aeroporto.jpg`; as variantes responsivas são geradas em WebP em `public/assets/img/`.
- Para substituir a fotografia, coloque uma nova imagem com pelo menos 1920 px de largura e execute `python3 tools/images.py`, depois `python3 tools/assets.py` e `npm run build`.

## Estrutura de URLs
PT: `/`, `/taxi-aeroporto-lisboa/`, `/taxi-lisboa/`, `/viagens-portugal/` (+ sintra, fatima, nazare, porto, evora), `/legal.html`
EN: `/en/`, `/en/lisbon-airport-taxi/`, `/en/lisbon-taxi/`, `/en/trips-portugal/` (+ destinos), `/en/legal.html`
Redirecionamentos 301 automáticos: `/lisbon-airport-taxi/` → `/en/lisbon-airport-taxi/`, `/manifest.json` → `/manifest.webmanifest`.
