# 691.pt — Auditoria final / freeze 2026-09-12

Estado: **FINAL / production freeze candidate**.

## Correções finais incluídas

- Service Worker com cache final `691-final-20260912-1` e estratégia network-first para ficheiros locais, evitando frontend antigo após deploy.
- JSON-LD `TaxiService` embebido diretamente na homepage.
- Um único H1 semântico e acessível, sem alterar o visual aprovado.
- PWA com ícones PNG 192/512 e Apple Touch 180px.
- Autocomplete com dropdown opaco, coordenadas exatas e semântica ARIA combobox/listbox.
- Waze com deep link oficial por latitude/longitude (`navigate=yes`) e `utm_source=691.pt`; fallback por morada.
- Persistência opcional e retrocompatível das coordenadas no Supabase.
- Migração SQL idempotente: `supabase_migration_2026-09-12_route_coords.sql`.
- Limite de payload Socket.IO (64 KiB) e compressão WebSocket desativada para reduzir superfície de DoS.
- Auditoria estática reforçada para validar SEO, PWA, Waze, migração, acessibilidade e versões críticas de dependências.
- Pacote final distribuído sem `.git` e sem `node_modules`.

## Dependências críticas bloqueadas no package-lock

- express 4.22.2
- body-parser 1.20.8
- qs 6.16.0
- socket.io 4.8.3
- socket.io-parser 4.2.7
- engine.io 6.6.9
- ws 8.21.3
- grammy 1.41.0
- dotenv 17.4.2
- web-push 3.6.7

## Validação

- `npm run build` → `691 static audit: OK`
- `npm test` → `691 static audit: OK`
- Sem segredos reais incluídos no pacote; apenas `.env.example`.

## Único passo externo ao código

Numa base Supabase já existente, executar uma vez no SQL Editor:

`supabase_migration_2026-09-12_route_coords.sql`

Depois reiniciar/redeployar o serviço. Sem essa migração o sistema continua funcional graças ao fallback, mas as coordenadas Waze não ficam persistidas através de um restart do Render.
