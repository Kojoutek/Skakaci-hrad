-- Enable Row-Level Security on all public tables
alter table castles enable row level security;
alter table customers enable row level security;
alter table reservations enable row level security;
alter table reservation_days enable row level security;

-- Veřejné čtení hradů
create policy if not exists "castles_public_read" on castles for select using (true);

-- Veřejné čtení obsazených dnů (jen datum, bez osobních údajů)
create policy if not exists "reservation_days_public_read" on reservation_days for select using (
  exists (
    select 1 from reservations r
    where r.id = reservation_days.reservation_id
    and r.status in ('pending', 'confirmed')
  )
);

-- Vkládání rezervací a zákazníků (veřejné)
create policy if not exists "customers_insert" on customers for insert with check (true);
create policy if not exists "reservations_insert" on reservations for insert with check (true);
create policy if not exists "reservation_days_insert" on reservation_days for insert with check (true);

-- Admin má přístup ke všemu (authenticated user)
create policy if not exists "customers_admin" on customers for all using (auth.role() = 'authenticated');
create policy if not exists "reservations_admin" on reservations for all using (auth.role() = 'authenticated');
create policy if not exists "reservation_days_admin_read" on reservation_days for select using (auth.role() = 'authenticated');
