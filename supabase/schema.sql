-- =============================================================================
--  L'AURUM Restaurant OS — схема базы данных Supabase (PostgreSQL)
--  Как применить: Supabase Dashboard → SQL Editor → New query → вставьте ВЕСЬ
--  файл → Run. Скрипт можно запускать повторно (idempotent).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. ПОЛЬЗОВАТЕЛИ И РОЛИ (RBAC)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default 'Гость',
  phone          text,
  email          text,
  login          text unique,
  role           text not null default 'guest'
                 check (role in ('guest','cook','waiter','hostess','accountant','boss','admin')),
  bonus_balance  numeric(12,2) not null default 0,
  hourly_rate    numeric(12,2) not null default 0,
  is_active      boolean not null default true,
  is_anonymous   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. ЗАЛ: ЗОНЫ И СТОЛЫ
-- -----------------------------------------------------------------------------
create table if not exists public.zones (
  id                 text primary key default gen_random_uuid()::text,
  name               text not null,
  is_vip             boolean not null default false,
  deposit_per_guest  numeric(12,2) not null default 0,   -- фиксированный депозит за гостя
  deposit_per_table  numeric(12,2) not null default 0,   -- депозит за стол (VIP)
  map_x numeric not null default 0, map_y numeric not null default 0,
  map_w numeric not null default 30, map_h numeric not null default 30,
  created_at         timestamptz not null default now()
);

create table if not exists public.tables (
  id         text primary key default gen_random_uuid()::text,
  zone_id    text not null references public.zones(id) on delete cascade,
  label      text not null,
  seats      int  not null default 2,
  x          numeric not null default 50,   -- координаты на схеме зала, %
  y          numeric not null default 50,
  shape      text not null default 'round' check (shape in ('round','rect')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. МЕНЮ, СКЛАД, ТЕХКАРТЫ
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null, sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id           text primary key default gen_random_uuid()::text,
  category_id  text references public.categories(id) on delete set null,
  title        text not null,
  description  text,
  composition  text,
  price        numeric(12,2) not null check (price >= 0),
  weight       text,
  kcal int, protein numeric, fat numeric, carbs numeric,
  allergens    text[] not null default '{}',       -- gluten, lactose, nuts, eggs, fish, shellfish, sesame
  options      jsonb  not null default '{}'::jsonb, -- {"doneness":true,"remove":["лук"]}
  upsell       text[] not null default '{}',       -- id рекомендуемых блюд
  image        text,
  cook_time    int not null default 15,            -- норматив приготовления, мин
  in_stock     boolean not null default true,      -- false = стоп-лист
  is_signature boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.ingredients (
  id text primary key default gen_random_uuid()::text,
  name text not null, unit text not null default 'kg',
  stock_qty numeric(12,3) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  min_qty numeric(12,3) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tech_cards (            -- технологические карты
  id text primary key default gen_random_uuid()::text,
  dish_id text not null references public.dishes(id) on delete cascade,
  ingredient_id text not null references public.ingredients(id) on delete cascade,
  qty numeric(12,3) not null,                              -- расход на 1 порцию
  created_at timestamptz not null default now(),
  unique (dish_id, ingredient_id)
);

create table if not exists public.happy_hours (            -- динамические цены
  id text primary key default gen_random_uuid()::text,
  title text not null,
  days int[] not null default '{1,2,3,4,5,6,7}',           -- 1=Пн … 7=Вс
  start_time time not null, end_time time not null,
  discount_pct int not null check (discount_pct between 1 and 90),
  category_id text references public.categories(id) on delete cascade,  -- null = всё меню
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. БРОНИРОВАНИЯ С ДЕПОЗИТОМ
-- -----------------------------------------------------------------------------
create table if not exists public.reservations (
  id              text primary key default gen_random_uuid()::text,
  code            text not null,
  guest_id        uuid references public.profiles(id) on delete set null,
  guest_name      text not null,
  guest_phone     text not null,
  table_id        text not null references public.tables(id),
  visit_date      date not null,
  visit_time      time not null,
  guests_count    int  not null check (guests_count > 0),
  comment         text,
  preorder        jsonb not null default '[]'::jsonb,       -- предзаказ блюд к приходу
  preorder_total  numeric(12,2) not null default 0,
  deposit_amount  numeric(12,2) not null default 0,
  deposit_status  text not null default 'pending'
                  check (deposit_status in ('pending','paid','applied','refunded','forfeited','waived')),
  status          text not null default 'pending_payment'
                  check (status in ('pending_payment','confirmed','seated','completed','cancelled','no_show')),
  refund_amount   numeric(12,2) not null default 0,
  paid_at timestamptz, seated_at timestamptz, cancelled_at timestamptz,
  created_by      uuid,
  created_at      timestamptz not null default now()
);
create index if not exists reservations_date_idx on public.reservations(visit_date, table_id);

-- -----------------------------------------------------------------------------
-- 5. ЗАКАЗЫ И ПОЗИЦИИ (живой трекер по каждому блюду)
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id              text primary key default gen_random_uuid()::text,
  code            text not null,
  table_id        text references public.tables(id),
  reservation_id  text references public.reservations(id) on delete set null,
  guest_id        uuid references public.profiles(id) on delete set null,
  guest_name      text,
  waiter_id       uuid references public.profiles(id) on delete set null,
  source          text not null default 'waiter' check (source in ('waiter','qr','reservation')),
  status          text not null default 'open' check (status in ('open','bill_requested','paid','cancelled')),
  subtotal        numeric(12,2) not null default 0,
  deposit_applied numeric(12,2) not null default 0,         -- зачтённый депозит брони
  bonus_used      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,         -- к оплате
  paid_amount     numeric(12,2) not null default 0,         -- оплачено (поддержка деления счёта)
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id          text primary key default gen_random_uuid()::text,
  order_id    text not null references public.orders(id) on delete cascade,
  dish_id     text references public.dishes(id) on delete set null,
  table_id    text,
  title       text not null,
  price       numeric(12,2) not null,                       -- цена с учётом счастливых часов
  qty         int not null default 1 check (qty > 0),
  options     jsonb not null default '{}'::jsonb,           -- прожарка, «без лука»
  comment     text,
  status      text not null default 'accepted'
              check (status in ('accepted','cooking','ready','served','cancelled')),
  norm_min    int not null default 15,
  cook_id     uuid references public.profiles(id) on delete set null,
  waiter_id   uuid references public.profiles(id) on delete set null,
  refunded    boolean not null default false,
  started_at timestamptz, ready_at timestamptz, served_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- -----------------------------------------------------------------------------
-- 6. ФИНАНСЫ, КАЧЕСТВО, ЛОЯЛЬНОСТЬ, ПЕРСОНАЛ
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id             text primary key default gen_random_uuid()::text,
  type           text not null check (type in ('deposit','order','refund','deposit_refund','deposit_forfeit','compensation')),
  amount         numeric(12,2) not null check (amount >= 0),
  method         text not null default 'card',               -- card | cash | terminal | bonus
  status         text not null default 'success',
  reservation_id text references public.reservations(id) on delete set null,
  order_id       text references public.orders(id) on delete set null,
  complaint_id   text,
  guest_id       uuid references public.profiles(id) on delete set null,
  meta           jsonb not null default '{}'::jsonb,
  created_by     uuid,
  created_at     timestamptz not null default now()
);

create table if not exists public.reviews (
  id            text primary key default gen_random_uuid()::text,
  order_item_id text references public.order_items(id) on delete cascade,
  order_id      text references public.orders(id) on delete cascade,
  dish_id       text references public.dishes(id) on delete cascade,
  cook_id       uuid references public.profiles(id) on delete set null,
  guest_id      uuid references public.profiles(id) on delete set null,
  rating        int not null check (rating between 1 and 5),
  tags          text[] not null default '{}',
  comment       text,
  created_at    timestamptz not null default now(),
  unique (order_item_id, guest_id)
);

create table if not exists public.complaints (              -- «Проблема с блюдом / Возврат»
  id                text primary key default gen_random_uuid()::text,
  code              text not null,
  order_item_id     text references public.order_items(id) on delete cascade,
  order_id          text references public.orders(id) on delete cascade,
  dish_id           text references public.dishes(id) on delete set null,
  cook_id           uuid references public.profiles(id) on delete set null,
  guest_id          uuid references public.profiles(id) on delete set null,
  table_id          text,
  reason            text not null,
  description       text,
  photo_url         text,                                     -- фото (data URL или Storage)
  preferred         text default 'manager',                   -- manager | refund | bonus
  amount            numeric(12,2) not null default 0,
  status            text not null default 'open' check (status in ('open','refunded','compensated','rejected')),
  resolution_amount numeric(12,2) not null default 0,
  handled_by        uuid, resolved_at timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.service_calls (           -- вызов официанта / счёт / алерт
  id         text primary key default gen_random_uuid()::text,
  table_id   text, order_id text,
  guest_id   uuid references public.profiles(id) on delete set null,
  type       text not null check (type in ('waiter','bill','complaint')),
  note       text,
  status     text not null default 'new' check (status in ('new','accepted','done')),
  handled_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.write_offs (              -- складские списания
  id            text primary key default gen_random_uuid()::text,
  ingredient_id text references public.ingredients(id) on delete set null,
  dish_id       text, complaint_id text,
  qty           numeric(12,3) not null,
  reason        text not null check (reason in ('sale','complaint','spoilage','supply')),
  cost          numeric(12,2) not null default 0,
  created_by    uuid,
  created_at    timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id         text primary key default gen_random_uuid()::text,
  guest_id   uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null,                         -- + начисление, − списание
  reason     text not null,
  order_id   text,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (                  -- смены для расчёта зарплаты
  id         text primary key default gen_random_uuid()::text,
  staff_id   uuid not null references public.profiles(id) on delete cascade,
  shift_date date not null,
  hours      numeric(5,2) not null check (hours > 0 and hours <= 24),
  created_by uuid,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. ФУНКЦИИ-ПОМОЩНИКИ ДЛЯ RLS
-- -----------------------------------------------------------------------------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid() and is_active), 'anon')
$$;
create or replace function public.is_staff() returns boolean language sql stable as $$
  select public.my_role() in ('cook','waiter','hostess','accountant','boss','admin') $$;
create or replace function public.is_manager() returns boolean language sql stable as $$
  select public.my_role() in ('boss','admin') $$;
create or replace function public.is_finance() returns boolean language sql stable as $$
  select public.my_role() in ('accountant','boss','admin') $$;

-- -----------------------------------------------------------------------------
-- 8. ТРИГГЕРЫ БИЗНЕС-ЛОГИКИ
-- -----------------------------------------------------------------------------
-- 8.1 Профиль создаётся автоматически при регистрации (всегда с ролью guest!)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email, login, is_anonymous)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Гость'),
          coalesce(new.raw_user_meta_data->>'phone', new.phone),
          new.email,
          nullif(new.raw_user_meta_data->>'login',''),
          coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8.2 Защита: пользователь не может сам поменять себе роль, бонусы, ставку
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or current_setting('laurum.internal', true) = '1' or public.is_manager() then
    if public.my_role() = 'admin' and new.role = 'boss' and old.role <> 'boss' then
      raise exception 'Только владелец может назначить роль boss';
    end if;
    return new;
  end if;
  new.role := old.role; new.bonus_balance := old.bonus_balance;
  new.hourly_rate := old.hourly_rate; new.is_active := old.is_active;
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

-- 8.3 Бонусный счёт пересчитывается по журналу лояльности
create or replace function public.apply_loyalty() returns trigger
language plpgsql security definer set search_path = public as $$
declare bal numeric;
begin
  perform set_config('laurum.internal', '1', true);
  update public.profiles set bonus_balance = bonus_balance + new.amount
   where id = new.guest_id returning bonus_balance into bal;
  if bal < 0 then raise exception 'Недостаточно бонусов'; end if;
  perform set_config('laurum.internal', '0', true);
  return new;
end $$;
drop trigger if exists loyalty_apply on public.loyalty_transactions;
create trigger loyalty_apply after insert on public.loyalty_transactions
  for each row execute function public.apply_loyalty();

-- 8.4 Кэшбэк 5% после полной оплаты счёта
create or replace function public.order_cashback() returns trigger
language plpgsql security definer set search_path = public as $$
declare amt numeric;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and new.guest_id is not null then
    amt := round((new.paid_amount + new.deposit_applied) * 0.05);
    if amt > 0 then
      insert into public.loyalty_transactions (guest_id, amount, reason, order_id)
      values (new.guest_id, amt, 'Кэшбэк 5% за заказ ' || new.code, new.id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_cashback on public.orders;
create trigger orders_cashback after update on public.orders
  for each row execute function public.order_cashback();

-- 8.5 Автоматическое складское списание по техкартам при заказе блюда
create or replace function public.order_item_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare tc record;
begin
  for tc in select t.ingredient_id, t.qty, i.cost_per_unit
              from public.tech_cards t join public.ingredients i on i.id = t.ingredient_id
             where t.dish_id = new.dish_id loop
    update public.ingredients set stock_qty = stock_qty - tc.qty * new.qty where id = tc.ingredient_id;
    insert into public.write_offs (ingredient_id, dish_id, qty, reason, cost)
    values (tc.ingredient_id, new.dish_id, tc.qty * new.qty, 'sale', tc.qty * new.qty * tc.cost_per_unit);
  end loop;
  return new;
end $$;
drop trigger if exists order_items_stock on public.order_items;
create trigger order_items_stock after insert on public.order_items
  for each row execute function public.order_item_stock();

-- 8.6 Запрет двойного бронирования одного стола (окно 2 часа)
create or replace function public.check_reservation_overlap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('cancelled','no_show','completed') then return new; end if;
  if exists (select 1 from public.reservations r
              where r.table_id = new.table_id and r.id <> new.id
                and r.visit_date = new.visit_date
                and r.status not in ('cancelled','no_show','completed')
                and abs(extract(epoch from (r.visit_time - new.visit_time))) < 7200) then
    raise exception 'Стол уже забронирован на это время';
  end if;
  return new;
end $$;
drop trigger if exists reservations_overlap on public.reservations;
create trigger reservations_overlap before insert or update on public.reservations
  for each row execute function public.check_reservation_overlap();

-- 8.7 Занятые слоты (гость видит занятость, но не чужие персональные данные)
create or replace function public.busy_slots(p_date date)
returns table (table_id text, visit_time time)
language sql stable security definer set search_path = public as $$
  select r.table_id, r.visit_time from public.reservations r
   where r.visit_date = p_date and r.status not in ('cancelled','no_show','completed')
$$;
grant execute on function public.busy_slots(date) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (жёсткое разграничение прав)
-- -----------------------------------------------------------------------------
do $$
declare t text; p record;
begin
  foreach t in array array['profiles','zones','tables','categories','dishes','ingredients','tech_cards',
    'happy_hours','reservations','orders','order_items','transactions','reviews','complaints',
    'service_calls','write_offs','loyalty_transactions','shifts'] loop
    execute format('alter table public.%I enable row level security', t);
    -- удаляем старые политики, чтобы скрипт можно было запускать повторно
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end $$;

-- Профили
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_manager());

-- Публичные справочники: читают все, меняет владелец/админ
create policy zones_read on public.zones for select using (true);
create policy zones_write on public.zones for all using (public.is_manager()) with check (public.is_manager());
create policy tables_read on public.tables for select using (true);
create policy tables_write on public.tables for all using (public.is_manager()) with check (public.is_manager());
create policy categories_read on public.categories for select using (true);
create policy categories_write on public.categories for all using (public.is_manager()) with check (public.is_manager());
create policy dishes_read on public.dishes for select using (true);
create policy dishes_write on public.dishes for all using (public.is_manager()) with check (public.is_manager());
create policy dishes_stoplist on public.dishes for update using (public.my_role() = 'cook');  -- повар ведёт стоп-лист
create policy hh_read on public.happy_hours for select using (true);
create policy hh_write on public.happy_hours for all using (public.is_manager()) with check (public.is_manager());
create policy reviews_read on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (guest_id = auth.uid());

-- Склад и персонал: бухгалтер и владелец
create policy ingredients_read on public.ingredients for select using (public.is_staff());
create policy ingredients_write on public.ingredients for all using (public.is_finance()) with check (public.is_finance());
create policy tech_read on public.tech_cards for select using (public.is_staff());
create policy tech_write on public.tech_cards for all using (public.is_finance()) with check (public.is_finance());
create policy wo_read on public.write_offs for select using (public.is_staff());
create policy wo_write on public.write_offs for insert with check (public.is_finance());
create policy shifts_read on public.shifts for select using (public.is_finance() or staff_id = auth.uid());
create policy shifts_write on public.shifts for all using (public.is_finance()) with check (public.is_finance());

-- Брони, заказы: гость видит только свои, персонал — все
create policy res_select on public.reservations for select using (guest_id = auth.uid() or public.is_staff());
create policy res_insert on public.reservations for insert with check (guest_id = auth.uid() or public.is_staff());
create policy res_update on public.reservations for update using (guest_id = auth.uid() or public.is_staff());
create policy orders_select on public.orders for select using (guest_id = auth.uid() or public.is_staff());
create policy orders_insert on public.orders for insert with check (guest_id = auth.uid() or public.is_staff());
create policy orders_update on public.orders for update using (guest_id = auth.uid() or public.is_staff());
create policy items_select on public.order_items for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.guest_id = auth.uid()));
create policy items_insert on public.order_items for insert with check (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.guest_id = auth.uid()));
create policy items_update on public.order_items for update using (public.is_staff());

-- Финансы
create policy tx_select on public.transactions for select using (guest_id = auth.uid() or public.is_staff());
create policy tx_insert on public.transactions for insert with check (guest_id = auth.uid() or public.is_staff());

-- Жалобы, вызовы, лояльность
create policy complaints_select on public.complaints for select using (guest_id = auth.uid() or public.is_staff());
create policy complaints_insert on public.complaints for insert with check (guest_id = auth.uid());
create policy complaints_update on public.complaints for update using (public.is_staff());
create policy calls_select on public.service_calls for select using (guest_id = auth.uid() or public.is_staff());
create policy calls_insert on public.service_calls for insert with check (guest_id = auth.uid() or public.is_staff());
create policy calls_update on public.service_calls for update using (public.is_staff());
create policy loyalty_select on public.loyalty_transactions for select using (guest_id = auth.uid() or public.is_staff());
create policy loyalty_insert on public.loyalty_transactions for insert with check (
  (guest_id = auth.uid() and amount < 0) or public.my_role() in ('waiter','accountant','boss','admin'));

-- -----------------------------------------------------------------------------
-- 10. REALTIME (живой трекер, KDS, уведомления официанта)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles','dishes','reservations','orders','order_items','service_calls',
                           'complaints','transactions','reviews','loyalty_transactions','ingredients','happy_hours'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 11. СТАРТОВЫЕ ДАННЫЕ (зал, меню, склад, техкарты, счастливые часы)
-- -----------------------------------------------------------------------------
insert into public.zones (id, name, is_vip, deposit_per_guest, deposit_per_table, map_x, map_y, map_w, map_h) values
  ('z-hall',    'Основной зал',  false,  5000,     0,  2,  4, 56, 60),
  ('z-chef',    'Chef''s Table', false, 15000,     0, 60,  4, 38, 28),
  ('z-vip',     'VIP-кабинеты',  true,       0, 60000, 60, 36, 38, 28),
  ('z-terrace', 'Терраса',       false,  5000,     0,  2, 68, 96, 28)
on conflict (id) do nothing;

insert into public.tables (id, zone_id, label, seats, x, y, shape) values
  ('T1','z-hall','1',2,12,22,'round'), ('T2','z-hall','2',2,28,22,'round'), ('T3','z-hall','3',4,46,22,'rect'),
  ('T4','z-hall','4',4,12,48,'rect'),  ('T5','z-hall','5',6,30,48,'rect'),  ('T6','z-hall','6',4,48,48,'rect'),
  ('C1','z-chef','Chef',6,79,19,'rect'),
  ('V1','z-vip','VIP 1',10,70,51,'rect'), ('V2','z-vip','VIP 2',8,88,51,'rect'),
  ('T7','z-terrace','7',2,14,83,'round'), ('T8','z-terrace','8',4,36,83,'rect'),
  ('T9','z-terrace','9',4,60,83,'rect'),  ('T10','z-terrace','10',2,84,83,'round')
on conflict (id) do nothing;

insert into public.categories (id, name, sort) values
  ('c-starters','Закуски',1), ('c-steaks','Стейки и гриль',2), ('c-mains','Горячее',3),
  ('c-sides','Гарниры',4), ('c-desserts','Десерты',5), ('c-drinks','Напитки и вино',6)
on conflict (id) do nothing;

insert into public.dishes (id, category_id, title, description, composition, price, weight, kcal, protein, fat, carbs, allergens, options, upsell, image, cook_time, is_signature, in_stock) values
 ('d-burrata','c-starters','Буррата с томатами','Сливочная буррата из Апулии и томаты черри конфи','Буррата, томаты черри, базилик, оливковое масло, соль Мэлдон',6900,'220 г',410,18,32,9,'{lactose}','{"remove":["базилик"]}','{d-wine-white}','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',8,false,true),
 ('d-tartare','c-starters','Тартар из говядины','Мраморная вырезка, желток и гренки на закваске','Говяжья вырезка, желток, каперсы, шалот, дижонская горчица, хлеб',7900,'180 г',380,26,24,12,'{gluten,eggs}','{"remove":["каперсы","лук шалот"]}','{d-wine-red}','https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',10,true,true),
 ('d-tuna','c-starters','Тунец татаки','Обожжённый тунец с соусом понзу','Тунец, понзу, кунжут, авокадо, микрозелень',8900,'170 г',290,28,14,8,'{fish,sesame}','{"remove":["кунжут"]}','{d-wine-white}','https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80',10,false,true),
 ('d-ribeye','c-steaks','Рибай Prime','30 дней сухого вызревания, гриль на углях','Рибай зернового откорма, соль Мэлдон, сливочное масло с травами',18900,'350 г',890,62,70,0,'{lactose}','{"doneness":true,"remove":["масло с травами"]}','{d-fries,d-wine-red,d-greens}','https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80',20,true,true),
 ('d-filet','c-steaks','Филе-миньон','Нежнейшая вырезка с соусом демиглас','Говяжья вырезка, демиглас, печёный чеснок',16500,'220 г',520,48,34,4,'{}','{"doneness":true,"remove":["чеснок","соус демиглас"]}','{d-puree,d-wine-red}','https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',18,false,true),
 ('d-lamb','c-steaks','Каре ягнёнка','Новозеландский ягнёнок с розмарином','Каре ягнёнка, розмарин, мятный соус',15900,'300 г',640,44,48,6,'{}','{"doneness":true,"remove":["мятный соус"]}','{d-greens,d-wine-red}','https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',22,false,true),
 ('d-salmon','c-mains','Лосось с киноа','Стейк лосося, киноа и соус биск','Лосось, киноа, соус биск, сливки',9800,'280 г',560,38,30,28,'{fish,lactose}','{"remove":["соус биск"]}','{d-wine-white}','https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',15,false,true),
 ('d-risotto','c-mains','Ризотто с белыми грибами','Карнароли, белые грибы, трюфельное масло','Рис карнароли, белые грибы, пармезан, сливочное масло',7400,'260 г',520,14,22,64,'{lactose}','{"remove":["пармезан"]}','{d-wine-white}','https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80',18,true,true),
 ('d-pasta','c-mains','Тальятелле с морепродуктами','Домашняя паста, креветки, мидии, сливочный соус','Паста тальятелле, морепродукты, сливки, чеснок',8900,'300 г',610,32,24,62,'{gluten,shellfish,lactose}','{"remove":["чеснок"]}','{d-wine-white}','https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80',14,false,true),
 ('d-fries','c-sides','Картофель фри с трюфелем','Хрустящий картофель и пармезан','Картофель, трюфельное масло, пармезан',2400,'150 г',420,6,22,48,'{lactose}','{"remove":["пармезан"]}','{}','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80',8,false,true),
 ('d-puree','c-sides','Картофельное пюре','Бархатное пюре на сливочном масле','Картофель, молоко, сливочное масло',1900,'180 г',260,4,14,30,'{lactose}','{}','{}','',6,false,true),
 ('d-greens','c-sides','Овощи гриль','Сезонные овощи на углях','Цукини, перец, баклажан, оливковое масло',2200,'200 г',150,4,8,16,'{}','{}','{}','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',8,false,true),
 ('d-fondant','c-desserts','Шоколадный фондан','Горячий шоколадный кекс с жидким центром','Шоколад Valrhona 70%, яйца, мука, сливочное масло',3900,'140 г',480,8,30,44,'{gluten,lactose,eggs}','{}','{d-coffee}','https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',12,true,true),
 ('d-cheesecake','c-desserts','Чизкейк с фисташкой','Нью-йоркский чизкейк с сицилийской фисташкой','Сливочный сыр, фисташка, яйца, песочное тесто',3600,'160 г',450,9,28,38,'{nuts,lactose,gluten,eggs}','{}','{d-coffee}','https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80',5,false,true),
 ('d-wine-red','c-drinks','Château Margaux, бокал','Бордо, Premier Grand Cru Classé','Каберне Совиньон, Мерло',15000,'150 мл',125,0,0,4,'{}','{}','{}','https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',2,false,true),
 ('d-wine-white','c-drinks','Chablis Premier Cru, бокал','Шабли, минеральное и свежее','Шардоне',9000,'150 мл',120,0,0,3,'{}','{}','{}','https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80',2,false,true),
 ('d-lemonade','c-drinks','Домашний лимонад','Цитрус, мята, газированная вода','Лимон, лайм, мята, сироп',1800,'400 мл',140,0,0,34,'{}','{}','{}','',3,false,true),
 ('d-coffee','c-drinks','Капучино','Спешелти-зерно, обжарка Алматы','Эспрессо, молоко',1400,'250 мл',120,6,5,9,'{lactose}','{}','{d-fondant}','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',3,false,true)
on conflict (id) do nothing;

insert into public.ingredients (id, name, unit, stock_qty, cost_per_unit, min_qty) values
 ('i-ribeye','Рибай (говядина)','кг',12,14000,3), ('i-tender','Вырезка говяжья','кг',8,16000,2),
 ('i-lamb','Каре ягнёнка','кг',6,12000,2), ('i-salmon','Лосось','кг',7,9000,2), ('i-tuna','Тунец','кг',4,12000,1),
 ('i-burrata','Буррата','шт',20,2200,6), ('i-tomato','Томаты черри','кг',5,2500,1), ('i-rice','Рис карнароли','кг',6,3000,1),
 ('i-mushroom','Белые грибы','кг',3,15000,1), ('i-parmesan','Пармезан','кг',4,9000,1), ('i-pasta','Паста тальятелле','кг',5,2000,1),
 ('i-seafood','Морепродукты микс','кг',4,11000,1), ('i-potato','Картофель','кг',30,300,5), ('i-veg','Овощи сезонные','кг',10,1200,3),
 ('i-choc','Шоколад Valrhona','кг',3,12000,0.5), ('i-cream','Сливки / сливочный сыр','кг',6,3500,1), ('i-pistachio','Фисташка','кг',2,18000,0.5),
 ('i-flour','Мука / тесто','кг',10,400,2), ('i-eggs','Яйца','шт',120,60,30), ('i-wine-red','Вино красное (750 мл)','бут',24,30000,6),
 ('i-wine-white','Вино белое (750 мл)','бут',24,18000,6), ('i-lemon','Цитрусовые','кг',5,1500,1), ('i-coffee','Кофе зерно','кг',3,12000,0.5),
 ('i-milk','Молоко','л',20,600,5), ('i-butter','Масло сливочное','кг',5,5000,1)
on conflict (id) do nothing;

insert into public.tech_cards (dish_id, ingredient_id, qty) values
 ('d-burrata','i-burrata',1), ('d-burrata','i-tomato',0.1),
 ('d-tartare','i-tender',0.15), ('d-tartare','i-eggs',1), ('d-tartare','i-flour',0.05),
 ('d-tuna','i-tuna',0.15), ('d-tuna','i-veg',0.05),
 ('d-ribeye','i-ribeye',0.4), ('d-ribeye','i-butter',0.03),
 ('d-filet','i-tender',0.25), ('d-filet','i-butter',0.03),
 ('d-lamb','i-lamb',0.35), ('d-lamb','i-veg',0.05),
 ('d-salmon','i-salmon',0.2), ('d-salmon','i-rice',0.06), ('d-salmon','i-cream',0.05),
 ('d-risotto','i-rice',0.1), ('d-risotto','i-mushroom',0.08), ('d-risotto','i-parmesan',0.03), ('d-risotto','i-butter',0.02),
 ('d-pasta','i-pasta',0.12), ('d-pasta','i-seafood',0.15), ('d-pasta','i-cream',0.05),
 ('d-fries','i-potato',0.25), ('d-fries','i-parmesan',0.01),
 ('d-puree','i-potato',0.25), ('d-puree','i-milk',0.05), ('d-puree','i-butter',0.03),
 ('d-greens','i-veg',0.25),
 ('d-fondant','i-choc',0.06), ('d-fondant','i-eggs',2), ('d-fondant','i-flour',0.03), ('d-fondant','i-butter',0.04),
 ('d-cheesecake','i-cream',0.12), ('d-cheesecake','i-pistachio',0.03), ('d-cheesecake','i-eggs',1), ('d-cheesecake','i-flour',0.04),
 ('d-wine-red','i-wine-red',0.2), ('d-wine-white','i-wine-white',0.2),
 ('d-lemonade','i-lemon',0.08), ('d-coffee','i-coffee',0.018), ('d-coffee','i-milk',0.15)
on conflict (dish_id, ingredient_id) do nothing;

insert into public.happy_hours (id, title, days, start_time, end_time, discount_pct, category_id) values
 ('hh-day','Счастливые часы: −20% на всё меню','{1,2,3,4}','15:00','18:00',20,null),
 ('hh-late','Поздний десерт: −15%','{1,2,3,4,5,6,7}','22:00','23:59',15,'c-desserts')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 12. НАЗНАЧЕНИЕ ПЕРВОГО ВЛАДЕЛЬЦА (выполните ОТДЕЛЬНО после регистрации)
--   1) Зарегистрируйтесь на сайте (index.html → Кабинет → Регистрация) своим email
--   2) Выполните в SQL Editor, подставив свой email:
--
--   update public.profiles set role = 'boss', login = 'boss' where email = 'ВАШ_EMAIL@mail.com';
--
--   После этого входите в staff.html по email и паролю и создавайте сотрудников.
-- -----------------------------------------------------------------------------
