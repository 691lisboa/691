-- 691.pt — persistência das coordenadas usadas pelos botões Waze.
-- Seguro para executar mais de uma vez no SQL Editor do Supabase.

alter table public.bookings
  add column if not exists recolha_lat double precision,
  add column if not exists recolha_lon double precision,
  add column if not exists destino_lat double precision,
  add column if not exists destino_lon double precision;

alter table public.bookings drop constraint if exists bookings_recolha_lat_range;
alter table public.bookings add constraint bookings_recolha_lat_range check (recolha_lat is null or recolha_lat between -90 and 90);
alter table public.bookings drop constraint if exists bookings_recolha_lon_range;
alter table public.bookings add constraint bookings_recolha_lon_range check (recolha_lon is null or recolha_lon between -180 and 180);
alter table public.bookings drop constraint if exists bookings_destino_lat_range;
alter table public.bookings add constraint bookings_destino_lat_range check (destino_lat is null or destino_lat between -90 and 90);
alter table public.bookings drop constraint if exists bookings_destino_lon_range;
alter table public.bookings add constraint bookings_destino_lon_range check (destino_lon is null or destino_lon between -180 and 180);
