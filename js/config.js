/* =========================================================================
   L'AURUM Restaurant OS — конфигурация
   =========================================================================
   ВСТАВЬТЕ СЮДА ДАННЫЕ ВАШЕГО ПРОЕКТА SUPABASE
   (Supabase Dashboard → Project Settings → API):

     SUPABASE_URL      → "Project URL"          (https://xxxx.supabase.co)
     SUPABASE_ANON_KEY → "anon / public" key     (длинная строка eyJhbGciOi...)

   Пока здесь стоят значения TODO, сайт работает в ДЕМО-режиме на localStorage
   (все функции доступны, данные хранятся в браузере).
   Как только вы вставите ключи и выполните supabase/schema.sql —
   все данные будут сохраняться в базе данных Supabase (PostgreSQL).

   ⚠️ Никогда не вставляйте сюда service_role key — только anon key!
   ========================================================================= */
window.LAURUM_CONFIG = {
  SUPABASE_URL: "TODO_YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "TODO_YOUR_SUPABASE_ANON_KEY",

  // Логин сотрудника превращается в email вида login@STAFF_EMAIL_DOMAIN
  // (Supabase Auth работает по email). Можно указать домен вашего ресторана.
  STAFF_EMAIL_DOMAIN: "staff.laurum.kz",

  // Бизнес-правила ресторана
  CURRENCY: "₸",
  PREPAY_PERCENT: 50,          // предоплата = 50% от стоимости предзаказанных блюд
  FREE_CANCEL_HOURS: 24,       // бесплатная отмена брони не позднее чем за 24 часа
  SLOT_DURATION_MIN: 120,      // длительность брони стола (для проверки пересечений)
  CASHBACK_PERCENT: 5,         // кэшбэк бонусами от оплаченного счёта
  BONUS_MAX_PERCENT: 30,       // бонусами можно оплатить до 30% счёта
  WELCOME_BONUS: 2000,         // приветственные бонусы при регистрации (демо-режим)
  OPEN_HOUR: 12,               // часы работы (для слотов бронирования)
  CLOSE_HOUR: 23
};
