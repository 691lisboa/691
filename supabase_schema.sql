-- 691 Lisboa — produção / Supabase Free
-- Este esquema corresponde ao código atual do 691.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    booking_id text not null unique,
    nome text not null,
    telefone text not null,
    data date not null,
    hora time not null,
    recolha text not null,
    destino text not null,
    client_id text not null,
    lang text not null default 'pt',
    status text not null default 'pending'
        check (status in ('pending','accepted','onway','arrived','completed','rejected','cancelled')),
    telegram_message_id bigint,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    accepted_at timestamptz,
    onway_at timestamptz,
    arrived_at timestamptz,
    completed_at timestamptz,
    cancelled_at timestamptz
);

create index if not exists idx_bookings_client_id on public.bookings (client_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_date on public.bookings (data);
create index if not exists idx_bookings_created_at on public.bookings (created_at desc);

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    client_id text not null,
    endpoint text not null unique,
    subscription jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists idx_push_client_unique on public.push_subscriptions (client_id);
create index if not exists idx_push_endpoint on public.push_subscriptions (endpoint);

create table if not exists public.booking_events (
    id uuid primary key default gen_random_uuid(),
    booking_id text not null references public.bookings (booking_id) on delete cascade,
    status text not null check (status in ('pending','accepted','onway','arrived','completed','rejected','cancelled')),
    message text,
    created_at timestamptz not null default now()
);

create index if not exists idx_booking_events_booking_id on public.booking_events (booking_id);
create index if not exists idx_booking_events_created_at on public.booking_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.booking_events enable row level security;

-- Sem policies públicas: o browser não acede diretamente aos dados.
-- O backend usa SUPABASE_SERVICE_ROLE_KEY.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('bookings','push_subscriptions','booking_events')
order by table_name;
