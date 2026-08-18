-- 691.pt — limpeza final da antiga funcionalidade GPS do motorista.
-- Seguro para executar mais de uma vez.

drop index if exists public.idx_bookings_driver_token;
alter table public.bookings drop column if exists driver_token_hash;
