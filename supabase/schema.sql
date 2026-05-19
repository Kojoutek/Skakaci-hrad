-- Skákací hrady
create table if not exists castles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_per_day integer not null default 100, -- záloha v Kč
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Zákazníci
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Rezervace
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  castle_id uuid not null references castles(id),
  customer_id uuid not null references customers(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  total_deposit integer not null, -- celková záloha v Kč
  note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jednotlivé dny rezervace
create table if not exists reservation_days (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique(reservation_id, day)
);

-- Index pro rychlé vyhledání obsazených dnů
create index if not exists idx_reservation_days_day on reservation_days(day);
create index if not exists idx_reservation_days_reservation_id on reservation_days(reservation_id);

-- Trigger pro updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reservations_updated_at
  before update on reservations
  for each row execute function update_updated_at();

-- Výchozí hrad
insert into castles (name, description, price_per_day) values (
  'Skákací hrad',
  'Velký skákací hrad pro děti, ideální na narozeninové oslavy a firemní akce.',
  100
) on conflict do nothing;

-- RLS policies
alter table castles enable row level security;
alter table customers enable row level security;
alter table reservations enable row level security;
alter table reservation_days enable row level security;

-- Veřejné čtení hradů
create policy "castles_public_read" on castles for select using (true);

-- Veřejné čtení obsazených dnů (jen datum, bez osobních údajů)
create policy "reservation_days_public_read" on reservation_days for select using (
  exists (
    select 1 from reservations r
    where r.id = reservation_days.reservation_id
    and r.status in ('pending', 'confirmed')
  )
);

-- Vkládání rezervací a zákazníků (veřejné)
create policy "customers_insert" on customers for insert with check (true);
create policy "reservations_insert" on reservations for insert with check (true);
create policy "reservation_days_insert" on reservation_days for insert with check (true);

-- Admin má přístup ke všemu (service role nebo authenticated user)
create policy "customers_admin" on customers for all using (auth.role() = 'authenticated');
create policy "reservations_admin" on reservations for all using (auth.role() = 'authenticated');
create policy "reservation_days_admin_read" on reservation_days for select using (auth.role() = 'authenticated');
