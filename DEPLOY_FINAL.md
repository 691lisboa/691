# 691.pt — Deploy final

1. No Supabase SQL Editor, executar `supabase_migration_2026-09-12_route_coords.sql`.
2. Fazer deploy normal no Render (`npm install && npm run build`).
3. Confirmar no log: `691 static audit: OK`, Supabase ativo, Bot Telegram ativo e Webhook configurado.
4. Teste final: criar reserva escolhendo uma sugestão para recolha e destino → Aceitar → Waze Recolha → Cheguei → Waze Destino.

A migração é segura para executar novamente e o backend mantém fallback caso ela ainda não esteja aplicada.
