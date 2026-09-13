# 691.pt — Auditoria final / freeze 2026-09-13

Estado: **FINAL / production freeze candidate**.

## Correções finais incluídas

- Homepage preservada visualmente, mantendo a fotografia real do táxi do 691.pt.
- Interface pública uniformizada em **PT/EN** no formulário, páginas de marketing, Legal/Privacidade, acompanhamento de reserva, offline e mensagens do backend.
- Páginas SEO estáticas e indexáveis para **Sintra, Fátima, Nazaré, Porto e Évora**, cada uma com título, descrição, canonical, H1 e CTA próprios.
- URLs antigas `?destino=` redirecionadas permanentemente para os novos URLs estáticos.
- Sitemap atualizado com os destinos individuais.
- CSS consolidado: homepage em `site.css`, landings em `landing-site.css`; ficheiros CSS obsoletos eliminados.
- Assets mobile dedicados para o hero e cartões de destinos, reduzindo o peso transferido em ecrãs pequenos.
- Sintra e Fátima voltaram a imagens de um local concreto, evitando composições visuais de dois destinos diferentes.
- Nazaré e Porto mantêm imagens de alta resolução, agora recomprimidas para WebP mais eficiente.
- Email técnico removido de toda a interface pública; o contacto público permanece por telefone/WhatsApp e canais legais.
- Leaflet continua apenas na página de acompanhamento onde o mapa é funcional; não é carregado na homepage.
- Fonte Inter variável 100–900, validação de data/hora, ARIA de erros e alvos tácteis reforçados.
- Service Worker atualizado para `691-final-20260913-world-final-1`.
- `push-map.js`, `landing.css`, `index.css`, `premium.css`, `landing-premium.css` e `brand-fix.css` obsoletos removidos.

## Segurança e operação

- CSP, HSTS, X-Frame-Options, Referrer-Policy e Permissions-Policy preservados.
- Webhook Telegram protegido, chat autorizado e transições de reserva validadas no servidor.
- Reserva/cancelamento protegidos por token; páginas privadas com `no-store`.
- Supabase mantém-se como persistência; Web Push e Waze preservados.
- Nenhum segredo real é incluído no pacote.

## Validação final

- `npm run build` → **691 static audit: OK**
- JavaScript/TypeScript: verificação de sintaxe OK.
- Sitemap, páginas estáticas, canonicals, assets responsivos e ausência de email público validados pelo audit.
- `npm audit` depende de acesso ao registry; no ambiente de preparação o registry pode estar indisponível por DNS. O deploy Render anterior reportou `found 0 vulnerabilities` para este lockfile.

## Deploy

Build: `npm install && npm run build`  
Start: `npx tsx server/index.ts`  
Node: 22.x

Para bases Supabase existentes, manter aplicada a migração `supabase_migration_2026-09-12_route_coords.sql`.
