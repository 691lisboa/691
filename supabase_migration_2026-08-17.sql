-- 691.pt — ajuste da base já criada
-- A tabela push_subscriptions foi criada sem unicidade por client_id.
-- O servidor mantém uma subscrição ativa por clientId.

create unique index if not exists idx_push_client_unique
  on public.push_subscriptions (client_id);

create index if not exists idx_push_endpoint
  on public.push_subscriptions (endpoint);
