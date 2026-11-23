-- ============================================================================
-- ВОСТОК ХАУС — ПОЛНАЯ СХЕМА SUPABASE (БД + STORAGE + REALTIME + RLS)
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Скрипт идемпотентный: можно безопасно запускать повторно
-- ============================================================================

-- 1. Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Таблица профилей пользователей (клиенты и персонал)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  full_name TEXT NOT NULL DEFAULT 'Гость',
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'cashier', 'kitchen', 'courier', 'admin')),
  is_on_shift BOOLEAN NOT NULL DEFAULT false,
  bonus_balance INT NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Триггер автоматического создания профиля при регистрации в Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, is_on_shift)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('customer', 'cashier', 'kitchen', 'courier', 'admin')
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'customer'
    END,
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('cashier', 'kitchen', 'courier', 'admin')
      THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Категории меню
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 4. Блюда меню (цены в тенге ₸)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('p-' || extract(epoch from now())::bigint::text || '-' || substr(md5(random()::text), 1, 4)),
  category_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base_price INT NOT NULL,
  weight_grams INT NOT NULL DEFAULT 350,
  calories INT NOT NULL DEFAULT 550,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_hit BOOLEAN NOT NULL DEFAULT false,
  is_spicy BOOLEAN NOT NULL DEFAULT false,
  is_veg BOOLEAN NOT NULL DEFAULT false,
  sizes JSONB NOT NULL DEFAULT '[{"label":"Стандарт","mult":1,"g":350},{"label":"Большая","mult":1.35,"g":500},{"label":"На компанию","mult":2.2,"g":900}]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Добавки к блюдам
CREATE TABLE IF NOT EXISTS public.addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true
);

-- 6. Склад и ингредиенты
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY DEFAULT ('i-' || substr(md5(random()::text), 1, 6)),
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL DEFAULT 'кг',
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Промокоды
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  min_order_amount INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 8. Заказы (Доставка или В зале со свободной посадкой)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ord-' || (extract(epoch from now()) * 1000)::bigint::text),
  order_number INT NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'dine_in', 'pickup')),
  address TEXT,
  comment TEXT,
  payment_method TEXT NOT NULL DEFAULT 'card',
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'failed', 'pending')),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'cooking', 'ready', 'delivering', 'completed', 'cancelled')),
  cancel_reason TEXT,
  promo_code TEXT,
  discount_amount INT NOT NULL DEFAULT 0,
  total_amount INT NOT NULL,
  courier_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Позиции заказа (для детальной аналитики и попозиционной готовности на KDS)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  size_label TEXT NOT NULL DEFAULT 'Стандарт',
  base_option TEXT,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL,
  total_price INT NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT false
);

-- 10. Журнал платежей (оплата прошла / оплата не прошла)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INT,
  customer_name TEXT,
  amount INT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  scenario TEXT NOT NULL CHECK (scenario IN ('success', 'failed')),
  bank_code TEXT NOT NULL,
  bank_message TEXT NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUPABASE STORAGE: Бакет menu-images для загрузки фотографий блюд персоналом
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read menu-images" ON storage.objects;
CREATE POLICY "Public read menu-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone upload menu-images" ON storage.objects;
CREATE POLICY "Anyone upload menu-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone update menu-images" ON storage.objects;
CREATE POLICY "Anyone update menu-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone delete menu-images" ON storage.objects;
CREATE POLICY "Anyone delete menu-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — открытый доступ для работы с GitHub Pages
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'categories', 'products', 'addons',
    'inventory', 'promo_codes', 'orders', 'order_items', 'payment_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- REALTIME (Мгновенная синхронизация между сайтом клиента и сайтом персонала)
-- ============================================================================
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'products', 'inventory', 'orders', 'order_items', 'payment_logs'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (SEED) — Восточная кухня, цены в тенге (₸)
-- ============================================================================
INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('plov', 'Плов и рис', 1),
  ('grill', 'Шашлык и мангал', 2),
  ('bakery', 'Самса и выпечка', 3),
  ('manti', 'Манты и лагман', 4),
  ('soups', 'Супы и шурпа', 5),
  ('snacks', 'Салаты и закуски', 6),
  ('drinks', 'Десерты и напитки', 7)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.addons (id, name, price, is_available) VALUES
  ('a-1', 'Дополнительная баранина (80 г)', 950, true),
  ('a-2', 'Казы (конская колбаса, 50 г)', 890, true),
  ('a-3', 'Соус Ткемали сливовый', 350, true),
  ('a-4', 'Соус Наршараб (гранатовый)', 390, true),
  ('a-5', 'Домашняя сметана с зеленью', 350, true),
  ('a-6', 'Острый стручковый перец', 250, true),
  ('a-7', 'Перепелиные яйца (3 шт)', 450, true),
  ('a-8', 'Маринованный красный лук с сумахом', 300, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

INSERT INTO public.promo_codes (code, discount_percent, min_order_amount, is_active) VALUES
  ('VOSTOK10', 10, 3000, true),
  ('PLOV20', 20, 6000, true),
  ('NAURYZ15', 15, 4500, true)
ON CONFLICT (code) DO UPDATE SET discount_percent = EXCLUDED.discount_percent, min_order_amount = EXCLUDED.min_order_amount;

INSERT INTO public.inventory (id, name, unit, quantity, min_threshold) VALUES
  ('i-1', 'Рис Девзира и Лазер', 'кг', 42.5, 10),
  ('i-2', 'Баранина (мякоть и корейка)', 'кг', 28.0, 8),
  ('i-3', 'Говядина (вырезка)', 'кг', 34.0, 10),
  ('i-4', 'Мука высший сорт', 'кг', 55.0, 15),
  ('i-5', 'Гранатовый соус Наршараб', 'л', 3.2, 4),
  ('i-6', 'Кинза, райхан и зелень', 'кг', 1.2, 1.5),
  ('i-7', 'Жёлтая самаркандская морковь', 'кг', 38.0, 12),
  ('i-8', 'Казы и курдюк', 'кг', 14.5, 5),
  ('i-9', 'Сыр Сулугуни', 'кг', 11.0, 4),
  ('i-10', 'Чай листовой и горный чабрец', 'кг', 6.4, 2)
ON CONFLICT (name) DO NOTHING;
