/* =========================================================================
   L'AURUM Restaurant OS — Гибридное ядро БД (Supabase PostgreSQL + LocalStorage)
   ========================================================================= */

const STORAGE_KEY = "laurum_os_db_v3";

export const ROLE_LABELS = {
  guest: "Гость ресторана",
  cook: "Повар (KDS)",
  waiter: "Официант / Хостес",
  hostess: "Хостес",
  accountant: "Бухгалтер / Склад",
  boss: "Босс / Владелец",
  admin: "Администратор"
};

export const ALLERGEN_LABELS = {
  gluten: "Глютен",
  lactose: "Лактоза",
  nuts: "Орехи",
  eggs: "Яйца",
  fish: "Рыба",
  shellfish: "Морепродукты",
  sesame: "Кунжут"
};

export const DONENESS_LIST = [
  "Rare",
  "Medium Rare",
  "Medium",
  "Medium Well",
  "Well Done"
];

export const REVIEW_TAGS = [
  "Идеально",
  "Нежная текстура",
  "Красивая подача",
  "Пересолено",
  "Остыло",
  "Маленькая порция",
  "Не та прожарка",
  "Долго ждали"
];

export const COMPLAINT_REASONS = [
  "Холодное / остывшее блюдо",
  "Не соответствует степени прожарки",
  "Ошибка в заказе (не учтён комментарий)",
  "Пересолено / пережарено",
  "Посторонний предмет",
  "Маленькая порция / несвежий ингредиент"
];

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayStr(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().split("T")[0];
}

function createSeedDatabase() {
  const today = todayStr(0);
  return {
    profiles: [
      {
        id: "u-boss",
        full_name: "Арман Султанов",
        phone: "+7 701 000 00 01",
        email: "boss@staff.laurum.kz",
        login: "boss",
        password_demo: "boss123",
        role: "boss",
        bonus_balance: 0,
        hourly_rate: 6000,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: "u-chef",
        full_name: "Лоран Вальтер (Шеф)",
        phone: "+7 701 000 00 02",
        email: "chef@staff.laurum.kz",
        login: "chef",
        password_demo: "chef123",
        role: "cook",
        bonus_balance: 0,
        hourly_rate: 4800,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 25).toISOString()
      },
      {
        id: "u-cook2",
        full_name: "Данияр Алиев (Су-шеф)",
        phone: "+7 701 000 00 03",
        email: "cook2@staff.laurum.kz",
        login: "cook2",
        password_demo: "cook123",
        role: "cook",
        bonus_balance: 0,
        hourly_rate: 3800,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: "u-waiter",
        full_name: "Айгерим Нурланова",
        phone: "+7 701 000 00 04",
        email: "waiter@staff.laurum.kz",
        login: "waiter",
        password_demo: "waiter123",
        role: "waiter",
        bonus_balance: 0,
        hourly_rate: 2800,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 18).toISOString()
      },
      {
        id: "u-accountant",
        full_name: "Мадина Касымова",
        phone: "+7 701 000 00 05",
        email: "accountant@staff.laurum.kz",
        login: "accountant",
        password_demo: "acc123",
        role: "accountant",
        bonus_balance: 0,
        hourly_rate: 4200,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString()
      },
      {
        id: "u-guest-demo",
        full_name: "Алия Сатпаева",
        phone: "+7 701 555 01 01",
        email: "aliya@guest.kz",
        login: "aliya",
        password_demo: "1234",
        role: "guest",
        bonus_balance: 4500,
        hourly_rate: 0,
        is_active: true,
        favorites: ["d-ribeye", "d-burrata", "d-fondant"],
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ],

    zones: [
      { id: "z-hall", name: "Основной светлый зал", is_vip: false, deposit_per_guest: 5000, deposit_per_table: 0, map_x: 2, map_y: 4, map_w: 56, map_h: 60 },
      { id: "z-chef", name: "Chef's Table (Открытая кухня)", is_vip: false, deposit_per_guest: 15000, deposit_per_table: 0, map_x: 60, map_y: 4, map_w: 38, map_h: 28 },
      { id: "z-vip", name: "Приватные VIP-лоджии", is_vip: true, deposit_per_guest: 0, deposit_per_table: 60000, map_x: 60, map_y: 36, map_w: 38, map_h: 28 },
      { id: "z-terrace", name: "Оливковая терраса", is_vip: false, deposit_per_guest: 5000, deposit_per_table: 0, map_x: 2, map_y: 68, map_w: 96, map_h: 28 }
    ],

    tables: [
      { id: "T1", zone_id: "z-hall", label: "Стол 1", seats: 2, x: 13, y: 22, shape: "round", is_active: true },
      { id: "T2", zone_id: "z-hall", label: "Стол 2", seats: 2, x: 30, y: 22, shape: "round", is_active: true },
      { id: "T3", zone_id: "z-hall", label: "Стол 3", seats: 4, x: 47, y: 22, shape: "rect", is_active: true },
      { id: "T4", zone_id: "z-hall", label: "Стол 4", seats: 4, x: 13, y: 48, shape: "rect", is_active: true },
      { id: "T5", zone_id: "z-hall", label: "Стол 5", seats: 6, x: 30, y: 48, shape: "rect", is_active: true },
      { id: "T6", zone_id: "z-hall", label: "Стол 6", seats: 4, x: 47, y: 48, shape: "rect", is_active: true },
      { id: "C1", zone_id: "z-chef", label: "Chef's 1", seats: 6, x: 79, y: 18, shape: "rect", is_active: true },
      { id: "V1", zone_id: "z-vip", label: "VIP Ложа 1", seats: 10, x: 70, y: 50, shape: "rect", is_active: true },
      { id: "V2", zone_id: "z-vip", label: "VIP Ложа 2", seats: 8, x: 88, y: 50, shape: "rect", is_active: true },
      { id: "T7", zone_id: "z-terrace", label: "Терраса 7", seats: 2, x: 15, y: 82, shape: "round", is_active: true },
      { id: "T8", zone_id: "z-terrace", label: "Терраса 8", seats: 4, x: 38, y: 82, shape: "rect", is_active: true },
      { id: "T9", zone_id: "z-terrace", label: "Терраса 9", seats: 4, x: 62, y: 82, shape: "rect", is_active: true },
      { id: "T10", zone_id: "z-terrace", label: "Терраса 10", seats: 2, x: 85, y: 82, shape: "round", is_active: true }
    ],

    categories: [
      { id: "c-starters", name: "Закуски и Raw Bar", sort: 1 },
      { id: "c-steaks", name: "Стейки и Гриль", sort: 2 },
      { id: "c-mains", name: "Основной курс", sort: 3 },
      { id: "c-sides", name: "Гарниры", sort: 4 },
      { id: "c-desserts", name: "Десерты", sort: 5 },
      { id: "c-drinks", name: "Винная карта и Бар", sort: 6 }
    ],

    dishes: [
      {
        id: "d-burrata",
        category_id: "c-starters",
        title: "Буррата из Апулии с томатами конфи",
        description: "Сливочная фермерская буррата, сладкие узбекские томаты конфи, песто из базилика и масло холодного отжима.",
        composition: "Буррата, томаты черри, зелёный базилик, оливковое масло Extra Virgin, морская соль Мэлдон",
        price: 6900,
        weight: "220 г",
        kcal: 410, protein: 18, fat: 32, carbs: 9,
        allergens: ["lactose"],
        options: { doneness: false, remove: ["базилик", "чесночное масло", "соль Мэлдон"] },
        upsell: ["d-wine-white", "d-lemonade"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
        cook_time: 8,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-tartare",
        category_id: "c-starters",
        title: "Тартар из мраморной вырезки с бриошью",
        description: "Рубленая вручную говяжья вырезка Prime, фермерский желток конфи, каперсы и тёплая бриошь.",
        composition: "Вырезка говяжья, перепелиный желток, лук шалот, каперсы, дижонская горчица, бриошь",
        price: 7900,
        weight: "190 г",
        kcal: 380, protein: 26, fat: 24, carbs: 12,
        allergens: ["gluten", "eggs"],
        options: { doneness: false, remove: ["лук шалот", "каперсы", "дижонская горчица"] },
        upsell: ["d-wine-red", "d-fries"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
        cook_time: 10,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-tuna",
        category_id: "c-starters",
        title: "Татаки из голубого тунца с авокадо",
        description: "Слегка обожжённый тунец Bluefin, крем из спелого авокадо, цитрусовый понзу и белый кунжут.",
        composition: "Филе голубого тунца, авокадо Хасс, соус понзу, кунжут, микрозелень кинзы",
        price: 8900,
        weight: "175 г",
        kcal: 290, protein: 28, fat: 14, carbs: 8,
        allergens: ["fish", "sesame"],
        options: { doneness: false, remove: ["кунжут", "кинза", "соус понзу"] },
        upsell: ["d-wine-white"],
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80",
        cook_time: 10,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-ribeye",
        category_id: "c-steaks",
        title: "Стейк Рибай Prime Dry-Aged 30 дней",
        description: "Мраморный рибай зернового откорма 180 дней на углях хоспера с ароматным маслом и тимьяном.",
        composition: "Говядина Рибай Prime, сливочное масло с травами, печёный чеснок, розовая гималайская соль",
        price: 18900,
        weight: "350 г",
        kcal: 890, protein: 62, fat: 70, carbs: 0,
        allergens: ["lactose"],
        options: { doneness: true, remove: ["масло с травами", "печёный чеснок", "перец горошком"] },
        upsell: ["d-fries", "d-greens", "d-wine-red"],
        image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
        cook_time: 20,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-filet",
        category_id: "c-steaks",
        title: "Филе-миньон с трюфельным демигласом",
        description: "Центральный медальон вырезки, приготовленный до бархатной сочности, с редукцией из портвейна.",
        composition: "Говяжья вырезка, соус демиглас, чёрный трюфель, микротимьян",
        price: 16500,
        weight: "220 г",
        kcal: 520, protein: 48, fat: 34, carbs: 4,
        allergens: [],
        options: { doneness: true, remove: ["соус демиглас", "трюфельное масло"] },
        upsell: ["d-puree", "d-wine-red"],
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
        cook_time: 18,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-lamb",
        category_id: "c-steaks",
        title: "Каре ягнёнка на травах Прованса",
        description: "Нежное каре новозеландского ягнёнка с корочкой из фисташек и соусом из садовой мяты.",
        composition: "Каре ягнёнка, розмарин, мятный жу, дроблёная фисташка",
        price: 15900,
        weight: "300 г",
        kcal: 640, protein: 44, fat: 48, carbs: 6,
        allergens: ["nuts"],
        options: { doneness: true, remove: ["фисташковая корочка", "мятный соус", "розмарин"] },
        upsell: ["d-greens", "d-wine-red"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
        cook_time: 22,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-salmon",
        category_id: "c-mains",
        title: "Фарерский лосось с кремом из цветной капусты",
        description: "Стейк дикого лосося с хрустящей корочкой, киноа и шафрановым соусом велюте.",
        composition: "Филе лосося, белая киноа, сливки 33%, цветная капуста, шафран",
        price: 9800,
        weight: "270 г",
        kcal: 560, protein: 38, fat: 30, carbs: 28,
        allergens: ["fish", "lactose"],
        options: { doneness: false, remove: ["сливочный соус", "шафран"] },
        upsell: ["d-wine-white", "d-greens"],
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
        cook_time: 15,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-risotto",
        category_id: "c-mains",
        title: "Ризотто Карнароли с белыми грибами",
        description: "Кремовое ризотто на выдержанном пармезане Reggiano 24 мес. с лесными белыми грибами.",
        composition: "Рис карнароли, белые грибы, пармезан, сливочное масло, лук шалот, белое вино",
        price: 7400,
        weight: "260 г",
        kcal: 520, protein: 14, fat: 22, carbs: 64,
        allergens: ["lactose"],
        options: { doneness: false, remove: ["пармезан", "лук шалот", "петрушка"] },
        upsell: ["d-wine-white"],
        image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80",
        cook_time: 18,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-pasta",
        category_id: "c-mains",
        title: "Тальятелле ручной работы с лангустинами",
        description: "Домашняя паста на желтках с аргентинскими лангустинами в томатно-сливочном биске.",
        composition: "Мука твёрдых сортов, яйца, лангустины, сливки, томаты Сан-Марцано, чеснок",
        price: 8900,
        weight: "300 г",
        kcal: 610, protein: 32, fat: 24, carbs: 62,
        allergens: ["gluten", "shellfish", "lactose", "eggs"],
        options: { doneness: false, remove: ["чеснок", "чили", "зелень"] },
        upsell: ["d-wine-white"],
        image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80",
        cook_time: 14,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-fries",
        category_id: "c-sides",
        title: "Трюфельный картофель фри с пармезаном",
        description: "Хрустящий картофель с трюфельным маслом и облаком тёртого пармезана.",
        composition: "Картофель, трюфельное масло, пармезан, морская соль",
        price: 2400,
        weight: "160 г",
        kcal: 420, protein: 6, fat: 22, carbs: 48,
        allergens: ["lactose"],
        options: { doneness: false, remove: ["пармезан", "трюфельное масло"] },
        upsell: [],
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
        cook_time: 8,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-puree",
        category_id: "c-sides",
        title: "Картофельное пюре Жоэля Робюшона",
        description: "Шелковистое французское пюре со взбитым нормандским маслом.",
        composition: "Картофель Ратт, сливочное масло 82.5%, фермерское молоко",
        price: 1900,
        weight: "180 г",
        kcal: 280, protein: 4, fat: 16, carbs: 30,
        allergens: ["lactose"],
        options: { doneness: false, remove: [] },
        upsell: [],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        cook_time: 6,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-greens",
        category_id: "c-sides",
        title: "Спаржа и сезонные овощи на гриле",
        description: "Зелёная спаржа, цукини и сладкий перец на живом огне.",
        composition: "Спаржа, цукини, паприка, оливковое масло, лимонный фреш",
        price: 2200,
        weight: "200 г",
        kcal: 150, protein: 4, fat: 8, carbs: 16,
        allergens: [],
        options: { doneness: false, remove: ["лимонный сок"] },
        upsell: [],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        cook_time: 8,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-fondant",
        category_id: "c-desserts",
        title: "Шоколадный фондан Valrhona 70% с пломбиром",
        description: "Тёплый кекс с текучей сердцевиной из тёмного бельгийского шоколада и бурбонской ванилью.",
        composition: "Шоколад Valrhona, сливочное масло, яйца, тростниковый сахар, мука, ванильное мороженое",
        price: 3900,
        weight: "150 г",
        kcal: 480, protein: 8, fat: 30, carbs: 44,
        allergens: ["gluten", "lactose", "eggs"],
        options: { doneness: false, remove: ["шарик мороженого", "сахарная пудра"] },
        upsell: ["d-coffee"],
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80",
        cook_time: 12,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-cheesecake",
        category_id: "c-desserts",
        title: "Баскский чизкейк с фисташкой Бронте",
        description: "Карамельная корочка и кремовая текстура с пастой из сицилийской фисташки.",
        composition: "Крем-чиз, сливки, паста фисташки, яйца, песочная основа",
        price: 3600,
        weight: "160 г",
        kcal: 450, protein: 9, fat: 28, carbs: 38,
        allergens: ["nuts", "lactose", "gluten", "eggs"],
        options: { doneness: false, remove: ["дроблёная фисташка"] },
        upsell: ["d-coffee"],
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
        cook_time: 5,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-wine-red",
        category_id: "c-drinks",
        title: "Pavillon Rouge du Château Margaux (бокал)",
        description: "Бордо, Франция. Ноты спелой ежевики, кедра и бархатистое послевкусие.",
        composition: "Каберне Совиньон 75%, Мерло 20%, Пти Вердо 5%",
        price: 15000,
        weight: "150 мл",
        kcal: 125, protein: 0, fat: 0, carbs: 4,
        allergens: [],
        options: { doneness: false, remove: [] },
        upsell: ["d-ribeye", "d-tartare"],
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
        cook_time: 2,
        in_stock: true,
        is_signature: true
      },
      {
        id: "d-wine-white",
        category_id: "c-drinks",
        title: "Chablis Premier Cru Vaillons (бокал)",
        description: "Бургундия, Франция. Кристальная минеральность, белый персик и цитрус.",
        composition: "Шардоне 100%",
        price: 9000,
        weight: "150 мл",
        kcal: 120, protein: 0, fat: 0, carbs: 3,
        allergens: [],
        options: { doneness: false, remove: [] },
        upsell: ["d-salmon", "d-burrata"],
        image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80",
        cook_time: 2,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-lemonade",
        category_id: "c-drinks",
        title: "Ботанический лимонад Юдзу — Базилик",
        description: "Освежающий авторский лимонад на основе японского юдзу и горного мёда.",
        composition: "Пюре юдзу, свежий лайм, базилик, содовая",
        price: 1800,
        weight: "400 мл",
        kcal: 110, protein: 0, fat: 0, carbs: 26,
        allergens: [],
        options: { doneness: false, remove: ["лёд", "базилик"] },
        upsell: [],
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
        cook_time: 3,
        in_stock: true,
        is_signature: false
      },
      {
        id: "d-coffee",
        category_id: "c-drinks",
        title: "Спешелти Капучино Эфиопия Иргачефф",
        description: "Двойной эспрессо собственной обжарки и шелковистая молочная микропена.",
        composition: "Зерно 100% Арабика, фермерское молоко (или овсяное на выбор)",
        price: 1400,
        weight: "250 мл",
        kcal: 120, protein: 6, fat: 5, carbs: 9,
        allergens: ["lactose"],
        options: { doneness: false, remove: ["коровье молоко (заменить на овсяное)", "корица"] },
        upsell: ["d-fondant", "d-cheesecake"],
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
        cook_time: 3,
        in_stock: true,
        is_signature: false
      }
    ],

    ingredients: [
      { id: "i-ribeye", name: "Отруб Рибай Prime", unit: "кг", stock_qty: 14.5, cost_per_unit: 14000, min_qty: 4 },
      { id: "i-tender", name: "Вырезка говяжья", unit: "кг", stock_qty: 9.2, cost_per_unit: 16000, min_qty: 3 },
      { id: "i-lamb", name: "Каре ягнёнка", unit: "кг", stock_qty: 6.0, cost_per_unit: 12000, min_qty: 2 },
      { id: "i-salmon", name: "Лосось фарерский", unit: "кг", stock_qty: 7.4, cost_per_unit: 9000, min_qty: 2.5 },
      { id: "i-tuna", name: "Тунец Bluefin", unit: "кг", stock_qty: 3.8, cost_per_unit: 12000, min_qty: 1.5 },
      { id: "i-burrata", name: "Буррата фермерская", unit: "шт", stock_qty: 18, cost_per_unit: 2200, min_qty: 6 },
      { id: "i-tomato", name: "Томаты черри узбекские", unit: "кг", stock_qty: 6.5, cost_per_unit: 2500, min_qty: 2 },
      { id: "i-rice", name: "Рис Карнароли", unit: "кг", stock_qty: 8.0, cost_per_unit: 3000, min_qty: 2 },
      { id: "i-mushroom", name: "Белые грибы", unit: "кг", stock_qty: 2.4, cost_per_unit: 15000, min_qty: 1.5 },
      { id: "i-parmesan", name: "Пармезан 24 мес.", unit: "кг", stock_qty: 4.2, cost_per_unit: 9000, min_qty: 1 },
      { id: "i-pasta", name: "Паста свежая", unit: "кг", stock_qty: 5.5, cost_per_unit: 2000, min_qty: 1.5 },
      { id: "i-seafood", name: "Лангустины и морепродукты", unit: "кг", stock_qty: 4.1, cost_per_unit: 11000, min_qty: 1.5 },
      { id: "i-potato", name: "Картофель отборный", unit: "кг", stock_qty: 28.0, cost_per_unit: 350, min_qty: 8 },
      { id: "i-veg", name: "Спаржа и овощи", unit: "кг", stock_qty: 9.0, cost_per_unit: 1500, min_qty: 3 },
      { id: "i-choc", name: "Шоколад Valrhona 70%", unit: "кг", stock_qty: 3.2, cost_per_unit: 12000, min_qty: 1 },
      { id: "i-cream", name: "Сливки и крем-чиз", unit: "кг", stock_qty: 6.8, cost_per_unit: 3500, min_qty: 2 },
      { id: "i-pistachio", name: "Паста фисташки Бронте", unit: "кг", stock_qty: 1.8, cost_per_unit: 18000, min_qty: 0.5 },
      { id: "i-flour", name: "Мука итальянская", unit: "кг", stock_qty: 12.0, cost_per_unit: 450, min_qty: 3 },
      { id: "i-eggs", name: "Яйца фермерские", unit: "шт", stock_qty: 140, cost_per_unit: 70, min_qty: 30 },
      { id: "i-wine-red", name: "Pavillon Rouge Margaux", unit: "бут", stock_qty: 16, cost_per_unit: 30000, min_qty: 4 },
      { id: "i-wine-white", name: "Chablis Premier Cru", unit: "бут", stock_qty: 18, cost_per_unit: 18000, min_qty: 4 },
      { id: "i-lemon", name: "Пюре юдзу и лайм", unit: "кг", stock_qty: 4.5, cost_per_unit: 2000, min_qty: 1 },
      { id: "i-coffee", name: "Кофе Эфиопия зерно", unit: "кг", stock_qty: 3.4, cost_per_unit: 12000, min_qty: 1 },
      { id: "i-milk", name: "Молоко фермерское", unit: "л", stock_qty: 22, cost_per_unit: 600, min_qty: 5 },
      { id: "i-butter", name: "Масло сливочное 82.5%", unit: "кг", stock_qty: 5.5, cost_per_unit: 5000, min_qty: 1.5 }
    ],

    tech_cards: [
      { id: "tc-1", dish_id: "d-burrata", ingredient_id: "i-burrata", qty: 1 },
      { id: "tc-2", dish_id: "d-burrata", ingredient_id: "i-tomato", qty: 0.12 },
      { id: "tc-3", dish_id: "d-tartare", ingredient_id: "i-tender", qty: 0.16 },
      { id: "tc-4", dish_id: "d-tartare", ingredient_id: "i-eggs", qty: 1 },
      { id: "tc-5", dish_id: "d-tuna", ingredient_id: "i-tuna", qty: 0.15 },
      { id: "tc-6", dish_id: "d-ribeye", ingredient_id: "i-ribeye", qty: 0.38 },
      { id: "tc-7", dish_id: "d-ribeye", ingredient_id: "i-butter", qty: 0.03 },
      { id: "tc-8", dish_id: "d-filet", ingredient_id: "i-tender", qty: 0.25 },
      { id: "tc-9", dish_id: "d-filet", ingredient_id: "i-butter", qty: 0.03 },
      { id: "tc-10", dish_id: "d-lamb", ingredient_id: "i-lamb", qty: 0.34 },
      { id: "tc-11", dish_id: "d-salmon", ingredient_id: "i-salmon", qty: 0.22 },
      { id: "tc-12", dish_id: "d-salmon", ingredient_id: "i-cream", qty: 0.05 },
      { id: "tc-13", dish_id: "d-risotto", ingredient_id: "i-rice", qty: 0.1 },
      { id: "tc-14", dish_id: "d-risotto", ingredient_id: "i-mushroom", qty: 0.08 },
      { id: "tc-15", dish_id: "d-risotto", ingredient_id: "i-parmesan", qty: 0.03 },
      { id: "tc-16", dish_id: "d-pasta", ingredient_id: "i-pasta", qty: 0.14 },
      { id: "tc-17", dish_id: "d-pasta", ingredient_id: "i-seafood", qty: 0.15 },
      { id: "tc-18", dish_id: "d-fries", ingredient_id: "i-potato", qty: 0.25 },
      { id: "tc-19", dish_id: "d-puree", ingredient_id: "i-potato", qty: 0.25 },
      { id: "tc-20", dish_id: "d-puree", ingredient_id: "i-butter", qty: 0.04 },
      { id: "tc-21", dish_id: "d-greens", ingredient_id: "i-veg", qty: 0.24 },
      { id: "tc-22", dish_id: "d-fondant", ingredient_id: "i-choc", qty: 0.07 },
      { id: "tc-23", dish_id: "d-fondant", ingredient_id: "i-eggs", qty: 2 },
      { id: "tc-24", dish_id: "d-cheesecake", ingredient_id: "i-cream", qty: 0.12 },
      { id: "tc-25", dish_id: "d-cheesecake", ingredient_id: "i-pistachio", qty: 0.03 },
      { id: "tc-26", dish_id: "d-wine-red", ingredient_id: "i-wine-red", qty: 0.2 },
      { id: "tc-27", dish_id: "d-wine-white", ingredient_id: "i-wine-white", qty: 0.2 },
      { id: "tc-28", dish_id: "d-lemonade", ingredient_id: "i-lemon", qty: 0.08 },
      { id: "tc-29", dish_id: "d-coffee", ingredient_id: "i-coffee", qty: 0.018 },
      { id: "tc-30", dish_id: "d-coffee", ingredient_id: "i-milk", qty: 0.15 }
    ],

    happy_hours: [
      {
        id: "hh-day",
        title: "Дневной гастро-сет (Счастливые часы −15%)",
        days: [1, 2, 3, 4, 5],
        start_time: "13:00",
        end_time: "17:00",
        discount_pct: 15,
        category_id: null,
        is_active: true
      },
      {
        id: "hh-dessert",
        title: "Вечерний десерт и кофе −20%",
        days: [1, 2, 3, 4, 5, 6, 7],
        start_time: "21:00",
        end_time: "23:59",
        discount_pct: 20,
        category_id: "c-desserts",
        is_active: true
      }
    ],

    reservations: [
      {
        id: "res-101",
        code: "BR-4821",
        guest_id: "u-guest-demo",
        guest_name: "Алия Сатпаева",
        guest_phone: "+7 701 555 01 01",
        table_id: "T3",
        visit_date: today,
        visit_time: "19:00",
        guests_count: 2,
        comment: "Стол у окна, годовщина, подать воду без газа сразу",
        preorder: [
          { dish_id: "d-ribeye", title: "Стейк Рибай Prime Dry-Aged 30 дней", price: 18900, qty: 1, options: { doneness: "Medium Rare", remove: [] } },
          { dish_id: "d-burrata", title: "Буррата из Апулии с томатами конфи", price: 6900, qty: 1, options: { remove: [] } }
        ],
        preorder_total: 25800,
        deposit_amount: 12900, // 50% от стоимости предзаказанных блюд (25 800 * 50% = 12 900 ₸)
        deposit_rule: "50% от предзаказа блюд",
        deposit_status: "paid",
        status: "confirmed",
        refund_amount: 0,
        paid_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "res-102",
        code: "BR-4829",
        guest_id: null,
        guest_name: "Тимур Бектуров",
        guest_phone: "+7 702 888 44 11",
        table_id: "V1",
        visit_date: today,
        visit_time: "20:00",
        guests_count: 6,
        comment: "Деловой ужин в VIP-ложе, подготовить декантер",
        preorder: [],
        preorder_total: 0,
        deposit_amount: 60000, // Депозит за VIP-стол
        deposit_rule: "Депозит VIP-ложи",
        deposit_status: "paid",
        status: "confirmed",
        refund_amount: 0,
        paid_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ],

    orders: [
      {
        id: "ord-201",
        code: "ORD-901",
        table_id: "T5",
        reservation_id: null,
        guest_id: "u-guest-demo",
        guest_name: "Алия Сатпаева",
        waiter_id: "u-waiter",
        source: "qr",
        status: "open",
        subtotal: 39100,
        deposit_applied: 10000,
        bonus_used: 0,
        total: 29100,
        paid_amount: 0,
        created_at: new Date(Date.now() - 25 * 60000).toISOString()
      }
    ],

    order_items: [
      {
        id: "oi-301",
        order_id: "ord-201",
        dish_id: "d-burrata",
        table_id: "T5",
        title: "Буррата из Апулии с томатами конфи",
        price: 6900,
        qty: 1,
        options: { remove: [] },
        comment: "",
        status: "served",
        norm_min: 8,
        cook_id: "u-chef",
        waiter_id: "u-waiter",
        refunded: false,
        created_at: new Date(Date.now() - 24 * 60000).toISOString(),
        started_at: new Date(Date.now() - 22 * 60000).toISOString(),
        ready_at: new Date(Date.now() - 16 * 60000).toISOString(),
        served_at: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        id: "oi-302",
        order_id: "ord-201",
        dish_id: "d-ribeye",
        table_id: "T5",
        title: "Стейк Рибай Prime Dry-Aged 30 дней",
        price: 18900,
        qty: 1,
        options: { doneness: "Medium Rare", remove: ["печёный чеснок"] },
        comment: "Подать на подогретой тарелке",
        status: "cooking",
        norm_min: 20,
        cook_id: "u-chef",
        waiter_id: "u-waiter",
        refunded: false,
        created_at: new Date(Date.now() - 12 * 60000).toISOString(),
        started_at: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        id: "oi-303",
        order_id: "ord-201",
        dish_id: "d-risotto",
        table_id: "T5",
        title: "Ризотто Карнароли с белыми грибами",
        price: 7400,
        qty: 1,
        options: { remove: ["лук шалот"] },
        comment: "Без лука (аллергия)",
        status: "accepted",
        norm_min: 18,
        cook_id: "u-cook2",
        waiter_id: "u-waiter",
        refunded: false,
        created_at: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: "oi-304",
        order_id: "ord-201",
        dish_id: "d-fondant",
        table_id: "T5",
        title: "Шоколадный фондан Valrhona 70% с пломбиром",
        price: 3900,
        qty: 1,
        options: { remove: [] },
        comment: "Подать к кофе",
        status: "ready",
        norm_min: 12,
        cook_id: "u-chef",
        waiter_id: "u-waiter",
        refunded: false,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        started_at: new Date(Date.now() - 13 * 60000).toISOString(),
        ready_at: new Date(Date.now() - 2 * 60000).toISOString()
      }
    ],

    transactions: [
      {
        id: "tx-1",
        type: "deposit",
        amount: 12900,
        method: "card",
        status: "success",
        reservation_id: "res-101",
        order_id: null,
        guest_id: "u-guest-demo",
        meta: { description: "Предоплата 50% по предзаказу блюд (Бронь BR-4821)" },
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "tx-2",
        type: "deposit",
        amount: 60000,
        method: "card",
        status: "success",
        reservation_id: "res-102",
        order_id: null,
        guest_id: null,
        meta: { description: "Депозит VIP-ложи V1 (Бронь BR-4829)" },
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: "tx-3",
        type: "order",
        amount: 44500,
        method: "card",
        status: "success",
        reservation_id: null,
        order_id: null,
        guest_id: "u-guest-demo",
        meta: { description: "Оплата счёта ORD-890 (Стол 2)" },
        created_at: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        id: "tx-4",
        type: "deposit_forfeit",
        amount: 10000,
        method: "card",
        status: "success",
        reservation_id: null,
        order_id: null,
        guest_id: null,
        meta: { description: "Удержание депозита (отмена брони менее чем за 24ч)" },
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],

    reviews: [
      {
        id: "rev-1",
        order_item_id: "oi-301",
        order_id: "ord-201",
        dish_id: "d-burrata",
        cook_id: "u-chef",
        guest_id: "u-guest-demo",
        guest_name: "Алия Сатпаева",
        rating: 5,
        tags: ["Идеально", "Красивая подача"],
        comment: "Свежайшая буррата и сладкие томаты!",
        created_at: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        id: "rev-2",
        order_item_id: null,
        order_id: null,
        dish_id: "d-ribeye",
        cook_id: "u-chef",
        guest_id: "u-guest-demo",
        guest_name: "Алия Сатпаева",
        rating: 5,
        tags: ["Идеально", "Нежная текстура"],
        comment: "Прожарка Medium Rare точка в точку.",
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "rev-3",
        order_item_id: null,
        order_id: null,
        dish_id: "d-pasta",
        cook_id: "u-cook2",
        guest_id: null,
        guest_name: "Гость зала",
        rating: 3,
        tags: ["Остыло", "Долго ждали"],
        comment: "Паста вкусная, но подали чуть тёплой.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],

    complaints: [
      {
        id: "cmp-1",
        code: "RET-104",
        order_item_id: null,
        order_id: "ord-201",
        dish_id: "d-pasta",
        dish_title: "Тальятелле ручной работы с лангустинами",
        cook_id: "u-cook2",
        guest_id: "u-guest-demo",
        guest_name: "Алия Сатпаева",
        table_id: "T5",
        reason: "Холодное / остывшее блюдо",
        description: "Блюдо подали остывшим, соус расслоился. Прошу заменить или оформить возврат.",
        photo_url: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=70",
        preferred: "refund",
        amount: 8900,
        status: "open",
        resolution_amount: 0,
        created_at: new Date(Date.now() - 18 * 60000).toISOString()
      }
    ],

    service_calls: [
      {
        id: "sc-1",
        table_id: "T5",
        order_id: "ord-201",
        guest_id: "u-guest-demo",
        type: "waiter",
        note: "Гость за Столом 5 просит принести дополнительную винную карту",
        status: "new",
        created_at: new Date(Date.now() - 4 * 60000).toISOString()
      }
    ],

    write_offs: [
      {
        id: "wo-1",
        ingredient_id: "i-ribeye",
        dish_id: "d-ribeye",
        complaint_id: null,
        qty: 0.38,
        reason: "sale",
        cost: 5320,
        created_at: new Date(Date.now() - 12 * 60000).toISOString()
      },
      {
        id: "wo-2",
        ingredient_id: "i-burrata",
        dish_id: "d-burrata",
        complaint_id: null,
        qty: 1,
        reason: "sale",
        cost: 2200,
        created_at: new Date(Date.now() - 24 * 60000).toISOString()
      }
    ],

    loyalty_transactions: [
      {
        id: "lt-1",
        guest_id: "u-guest-demo",
        amount: 2000,
        reason: "Приветственный бонус L'AURUM Club",
        order_id: null,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        id: "lt-2",
        guest_id: "u-guest-demo",
        amount: 2500,
        reason: "Кэшбэк 5% за визит ORD-890",
        order_id: "ORD-890",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],

    shifts: [
      { id: "sh-1", staff_id: "u-chef", shift_date: today, hours: 10 },
      { id: "sh-2", staff_id: "u-cook2", shift_date: today, hours: 10 },
      { id: "sh-3", staff_id: "u-waiter", shift_date: today, hours: 11 },
      { id: "sh-4", staff_id: "u-accountant", shift_date: today, hours: 8 },
      { id: "sh-5", staff_id: "u-boss", shift_date: today, hours: 8 }
    ]
  };
}

class RestaurantDatabase {
  constructor() {
    this.mode = "local"; // 'supabase' | 'local'
    this.supabase = null;
    this.state = createSeedDatabase();
    this.listeners = new Set();
    this.channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("laurum_os_sync") : null;
  }

  getConfig() {
    const saved = localStorage.getItem("laurum_supabase_override");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return {
            ...window.LAURUM_CONFIG,
            SUPABASE_URL: parsed.url,
            SUPABASE_ANON_KEY: parsed.anonKey
          };
        }
      } catch (_) {}
    }
    return window.LAURUM_CONFIG || {};
  }

  isSupabaseConfigured() {
    const cfg = this.getConfig();
    return Boolean(
      cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes("TODO") &&
      !cfg.SUPABASE_ANON_KEY.includes("TODO") &&
      cfg.SUPABASE_URL.startsWith("http")
    );
  }

  async init() {
    // Load local snapshot first for instant zero-latency UI
    this.loadLocal();

    if (this.isSupabaseConfigured() && navigator.onLine) {
      try {
        const cfg = this.getConfig();
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
        this.supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        await this.pullFromSupabase();
        this.subscribeSupabaseRealtime();
        this.mode = "supabase";
        this.notify();
        return;
      } catch (err) {
        console.warn("Supabase fallback to LocalStorage:", err.message);
      }
    }

    this.mode = "local";
    this.setupLocalSync();
    this.notify();
  }

  async pullFromSupabase() {
    if (!this.supabase) return;
    const tables = [
      "profiles", "zones", "tables", "categories", "dishes", "ingredients",
      "tech_cards", "happy_hours", "reservations", "orders", "order_items",
      "transactions", "reviews", "complaints", "service_calls", "write_offs",
      "loyalty_transactions", "shifts"
    ];
    const results = await Promise.all(
      tables.map((t) => this.supabase.from(t).select("*"))
    );
    tables.forEach((t, idx) => {
      const { data, error } = results[idx];
      if (!error && Array.isArray(data) && data.length > 0) {
        this.state[t] = data;
      }
    });
    this.saveLocal(false);
  }

  subscribeSupabaseRealtime() {
    if (!this.supabase) return;
    this.supabase
      .channel("laurum-db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, async () => {
        await this.pullFromSupabase();
        this.notify();
      })
      .subscribe();
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = { ...createSeedDatabase(), ...parsed };
      } else {
        this.state = createSeedDatabase();
        this.saveLocal(false);
      }
    } catch (_) {
      this.state = createSeedDatabase();
    }
  }

  saveLocal(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (broadcast && this.channel) {
        this.channel.postMessage({ type: "DB_UPDATED" });
      }
    } catch (_) {}
  }

  setupLocalSync() {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        this.loadLocal();
        this.notify();
      }
    });
    if (this.channel) {
      this.channel.onmessage = () => {
        this.loadLocal();
        this.notify();
      };
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) fn(this.state);
  }

  async syncRow(table, action, row, matchKey = "id") {
    if (this.mode === "supabase" && this.supabase) {
      try {
        if (action === "insert") {
          const clean = { ...row };
          delete clean.password_demo;
          delete clean.favorites;
          delete clean.deposit_rule;
          delete clean.dish_title;
          delete clean.guest_name;
          await this.supabase.from(table).upsert(clean);
        } else if (action === "update") {
          const clean = { ...row };
          delete clean.password_demo;
          delete clean.favorites;
          delete clean.deposit_rule;
          delete clean.dish_title;
          delete clean.guest_name;
          await this.supabase.from(table).update(clean).eq(matchKey, row[matchKey]);
        } else if (action === "delete") {
          await this.supabase.from(table).delete().eq(matchKey, row[matchKey]);
        }
      } catch (e) {
        console.warn(`Supabase sync warning (${table}):`, e.message);
      }
    }
    this.saveLocal(true);
    this.notify();
  }

  resetDemo() {
    this.state = createSeedDatabase();
    this.saveLocal(true);
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // 1. АВТОРИЗАЦИЯ И RBAC (ГОСТЬ vs СОТРУДНИКИ, СОЗДАНИЕ АККАУНТОВ БОССОМ)
  // ---------------------------------------------------------------------------
  getCurrentUser() {
    const uidSaved = localStorage.getItem("laurum_active_user_id");
    if (!uidSaved) return null;
    return this.state.profiles.find((p) => p.id === uidSaved && p.is_active) || null;
  }

  setCurrentUser(userId) {
    if (!userId) localStorage.removeItem("laurum_active_user_id");
    else localStorage.setItem("laurum_active_user_id", userId);
    this.notify();
  }

  // Вход/регистрация Гостя (по номеру телефона SMS/WhatsApp или OAuth)
  async loginOrRegisterGuest({ full_name, phone, provider = "sms" }) {
    const cleanPhone = (phone || "").trim();
    let user = this.state.profiles.find(
      (p) => p.role === "guest" && p.phone && p.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "")
    );
    const isNew = !user;
    if (!user) {
      user = {
        id: uid("u-guest"),
        full_name: (full_name || "Гость L'AURUM").trim(),
        phone: cleanPhone || "+7 700 000 00 00",
        email: `${uid("guest")}@guest.laurum.kz`,
        login: null,
        role: "guest",
        bonus_balance: 2000, // Приветственные 2 000 ₸ бонусов
        hourly_rate: 0,
        is_active: true,
        favorites: [],
        provider,
        created_at: new Date().toISOString()
      };
      this.state.profiles.unshift(user);
      this.state.loyalty_transactions.unshift({
        id: uid("lt"),
        guest_id: user.id,
        amount: 2000,
        reason: "Приветственный бонус за регистрацию (2 000 ₸)",
        order_id: null,
        created_at: new Date().toISOString()
      });
      await this.syncRow("profiles", "insert", user);
    } else if (full_name && full_name.trim()) {
      user.full_name = full_name.trim();
      await this.syncRow("profiles", "update", user);
    }
    this.setCurrentUser(user.id);
    return { user, isNew };
  }

  // Вход сотрудника (строго по выданному Боссом логину и паролю; самостоятельная регистрация закрыта)
  async loginStaff({ login, password }) {
    const cleanLogin = (login || "").trim().toLowerCase();
    const staff = this.state.profiles.find(
      (p) =>
        p.role !== "guest" &&
        p.is_active &&
        ((p.login && p.login.toLowerCase() === cleanLogin) ||
          (p.email && p.email.toLowerCase() === cleanLogin))
    );
    if (!staff) {
      throw new Error("Аккаунт сотрудника не найден или отключён. Обратитесь к Владельцу (Боссу).");
    }
    if (staff.password_demo && staff.password_demo !== password) {
      throw new Error("Неверный пароль сотрудника.");
    }
    this.setCurrentUser(staff.id);
    return staff;
  }

  // Создание аккаунта сотрудника (доступно ТОЛЬКО Боссу / Администратору)
  async createStaffAccount({ full_name, login, password, role, phone, hourly_rate }) {
    const actor = this.getCurrentUser();
    if (!actor || !["boss", "admin"].includes(actor.role)) {
      throw new Error("Доступ запрещён (RBAC): создавать аккаунты сотрудников может только Босс.");
    }
    const cleanLogin = (login || "").trim().toLowerCase();
    if (!cleanLogin || !password) {
      throw new Error("Укажите логин и пароль для сотрудника.");
    }
    if (this.state.profiles.some((p) => p.login && p.login.toLowerCase() === cleanLogin)) {
      throw new Error(`Логин «${cleanLogin}» уже занят.`);
    }
    const cfg = this.getConfig();
    const email = `${cleanLogin}@${cfg.STAFF_EMAIL_DOMAIN || "staff.laurum.kz"}`;
    const newStaff = {
      id: uid("u-staff"),
      full_name: full_name.trim(),
      phone: (phone || "").trim(),
      email,
      login: cleanLogin,
      password_demo: password,
      role: role || "waiter",
      bonus_balance: 0,
      hourly_rate: Number(hourly_rate || 3000),
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.state.profiles.push(newStaff);
    this.state.shifts.push({
      id: uid("sh"),
      staff_id: newStaff.id,
      shift_date: todayStr(0),
      hours: 8
    });
    await this.syncRow("profiles", "insert", newStaff);
    return newStaff;
  }

  async toggleStaffActive(staffId) {
    const target = this.state.profiles.find((p) => p.id === staffId);
    if (!target || target.role === "boss") return;
    target.is_active = !target.is_active;
    await this.syncRow("profiles", "update", target);
  }

  // ---------------------------------------------------------------------------
  // 2. СЧАСТЛИВЫЕ ЧАСЫ (ДИНАМИЧЕСКИЕ ЦЕНЫ) И СЕБЕСТОИМОСТЬ ПО ТЕХКАРТАМ
  // ---------------------------------------------------------------------------
  getActiveHappyHour(dish = null) {
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const hhmm = now.toTimeString().slice(0, 5);
    const forceDemoHH = localStorage.getItem("laurum_force_happy_hour") === "1";

    for (const hh of this.state.happy_hours) {
      if (!hh.is_active) continue;
      const categoryMatch = !hh.category_id || !dish || dish.category_id === hh.category_id;
      if (!categoryMatch) continue;
      if (forceDemoHH) return hh;
      if (hh.days.includes(day) && hhmm >= hh.start_time && hhmm <= hh.end_time) {
        return hh;
      }
    }
    return null;
  }

  getDishEffectivePrice(dish) {
    const hh = this.getActiveHappyHour(dish);
    if (!hh) return { price: Number(dish.price), oldPrice: null, discountPct: 0, hhTitle: null };
    const discounted = Math.round((Number(dish.price) * (100 - hh.discount_pct)) / 100);
    return {
      price: discounted,
      oldPrice: Number(dish.price),
      discountPct: hh.discount_pct,
      hhTitle: hh.title
    };
  }

  getDishFoodCost(dishId) {
    const cards = this.state.tech_cards.filter((tc) => tc.dish_id === dishId);
    let cost = 0;
    const breakdown = cards.map((tc) => {
      const ing = this.state.ingredients.find((i) => i.id === tc.ingredient_id);
      const lineCost = ing ? Math.round(tc.qty * ing.cost_per_unit) : 0;
      cost += lineCost;
      return {
        ingredient_id: tc.ingredient_id,
        name: ing ? ing.name : tc.ingredient_id,
        qty: tc.qty,
        unit: ing ? ing.unit : "",
        lineCost
      };
    });
    return { cost, breakdown };
  }

  // ---------------------------------------------------------------------------
  // 3. РАСЧЁТ ПРЕДОПЛАТЫ БРОНИ (50% ОТ ЗАКАЗАННЫХ БЛЮД / ДЕПОЗИТ ЗА СТОЛ)
  //    И ПРАВИЛО ВОЗВРАТА (100% за >=24ч, удержание при <24ч)
  // ---------------------------------------------------------------------------
  calculateReservationDeposit({ tableId, guestsCount, preorderItems = [] }) {
    const table = this.state.tables.find((t) => t.id === tableId);
    const zone = table ? this.state.zones.find((z) => z.id === table.zone_id) : null;

    const preorderTotal = preorderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const prepay50 = Math.round(preorderTotal * 0.5); // 50% от стоимости заказанных блюд

    const zoneDeposit = zone
      ? zone.is_vip
        ? Number(zone.deposit_per_table || 60000)
        : Number(zone.deposit_per_guest || 5000) * Number(guestsCount || 2)
      : Number(guestsCount || 2) * 5000;

    // Если гость выбрал блюда заранее — берём ровно 50% от стоимости заказанных блюд
    // (а для VIP-ложи без предзаказа или без блюд — фиксированный депозит стола/гостя)
    const depositAmount = preorderTotal > 0 ? prepay50 : zoneDeposit;
    const ruleLabel =
      preorderTotal > 0
        ? `Предоплата 50% от заказанных блюд (${preorderTotal.toLocaleString("ru-RU")} ₸ × 50%)`
        : zone && zone.is_vip
        ? `Депозит за VIP-ложу (100% засчитывается в счёт)`
        : `Депозит ${zone ? zone.deposit_per_guest.toLocaleString("ru-RU") : "5 000"} ₸ × ${guestsCount} гост. (засчитывается в счёт)`;

    return {
      preorderTotal,
      prepay50,
      zoneDeposit,
      depositAmount,
      ruleLabel
    };
  }

  getTableStatus(tableId, dateStr = todayStr(0), timeStr = null) {
    // Проверяем открытый заказ за столом
    const openOrder = this.state.orders.find(
      (o) => o.table_id === tableId && (o.status === "open" || o.status === "bill_requested")
    );
    if (openOrder && dateStr === todayStr(0)) {
      return {
        state: openOrder.status === "bill_requested" ? "bill" : "occupied",
        order: openOrder,
        reservation: null
      };
    }

    // Проверяем активные брони на выбранную дату и время (окно 2 часа)
    const resList = this.state.reservations.filter(
      (r) =>
        r.table_id === tableId &&
        r.visit_date === dateStr &&
        !["cancelled", "no_show", "completed"].includes(r.status)
    );

    if (resList.length > 0) {
      if (!timeStr) {
        return { state: "reserved", order: null, reservation: resList[0] };
      }
      const [h1, m1] = timeStr.split(":").map(Number);
      const mins1 = h1 * 60 + m1;
      for (const r of resList) {
        const [h2, m2] = (r.visit_time || "19:00").split(":").map(Number);
        const mins2 = h2 * 60 + m2;
        if (Math.abs(mins1 - mins2) < 120) {
          return { state: r.status === "seated" ? "occupied" : "reserved", order: null, reservation: r };
        }
      }
    }

    return { state: "free", order: null, reservation: null };
  }

  async createReservationWithDeposit({
    guest_name,
    guest_phone,
    table_id,
    visit_date,
    visit_time,
    guests_count,
    comment,
    preorder = []
  }) {
    const statusCheck = this.getTableStatus(table_id, visit_date, visit_time);
    if (statusCheck.state !== "free") {
      throw new Error("Выбранный стол уже занят или забронирован на это время (±2 часа).");
    }

    const user = this.getCurrentUser();
    const calc = this.calculateReservationDeposit({
      tableId: table_id,
      guestsCount: guests_count,
      preorderItems: preorder
    });

    const newRes = {
      id: uid("res"),
      code: "BR-" + Math.floor(1000 + Math.random() * 9000),
      guest_id: user ? user.id : null,
      guest_name: guest_name.trim(),
      guest_phone: guest_phone.trim(),
      table_id,
      visit_date,
      visit_time,
      guests_count: Number(guests_count),
      comment: (comment || "").trim(),
      preorder,
      preorder_total: calc.preorderTotal,
      deposit_amount: calc.depositAmount,
      deposit_rule: calc.ruleLabel,
      deposit_status: "paid",
      status: "confirmed",
      refund_amount: 0,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.state.reservations.unshift(newRes);
    this.state.transactions.unshift({
      id: uid("tx"),
      type: "deposit",
      amount: calc.depositAmount,
      method: "card",
      status: "success",
      reservation_id: newRes.id,
      order_id: null,
      guest_id: newRes.guest_id,
      meta: {
        description: `Предоплата брони ${newRes.code} (${calc.ruleLabel})`
      },
      created_at: new Date().toISOString()
    });

    await this.syncRow("reservations", "insert", newRes);
    return newRes;
  }

  // Отмена брони с проверкой правила 24 часов
  async cancelReservation(reservationId) {
    const res = this.state.reservations.find((r) => r.id === reservationId);
    if (!res || res.status === "cancelled") return null;

    const visitTimestamp = new Date(`${res.visit_date}T${res.visit_time}:00`).getTime();
    const hoursLeft = (visitTimestamp - Date.now()) / 3600000;
    const isFullRefund = hoursLeft >= 24;

    res.status = "cancelled";
    res.cancelled_at = new Date().toISOString();

    if (isFullRefund) {
      res.deposit_status = "refunded";
      res.refund_amount = res.deposit_amount;
      this.state.transactions.unshift({
        id: uid("tx"),
        type: "deposit_refund",
        amount: res.deposit_amount,
        method: "card",
        status: "success",
        reservation_id: res.id,
        order_id: null,
        guest_id: res.guest_id,
        meta: {
          description: `100% возврат предоплаты брони ${res.code} (отмена за ${Math.round(hoursLeft)} ч до визита, ≥ 24ч)`
        },
        created_at: new Date().toISOString()
      });
    } else {
      res.deposit_status = "forfeited";
      res.refund_amount = 0;
      this.state.transactions.unshift({
        id: uid("tx"),
        type: "deposit_forfeit",
        amount: res.deposit_amount,
        method: "card",
        status: "success",
        reservation_id: res.id,
        order_id: null,
        guest_id: res.guest_id,
        meta: {
          description: `Удержание депозита брони ${res.code} (поздняя отмена менее чем за 24ч)`
        },
        created_at: new Date().toISOString()
      });
    }

    await this.syncRow("reservations", "update", res);
    return { res, isFullRefund, hoursLeft };
  }

  // Посадка гостей по брони (депозит 100% переносится в счёт стола, а предзаказ уходит на кухню KDS!)
  async seatReservation(reservationId) {
    const res = this.state.reservations.find((r) => r.id === reservationId);
    if (!res) throw new Error("Бронь не найдена");

    res.status = "seated";
    res.deposit_status = "applied";
    res.seated_at = new Date().toISOString();

    const order = await this.createOrAppendTableOrder({
      table_id: res.table_id,
      guest_id: res.guest_id,
      guest_name: res.guest_name,
      reservation_id: res.id,
      deposit_applied: res.deposit_amount,
      source: "reservation",
      items: res.preorder || []
    });

    await this.syncRow("reservations", "update", res);
    return order;
  }

  // ---------------------------------------------------------------------------
  // 4. ЗАКАЗЫ В ЗАЛЕ, QR-ДОЗАКАЗЫ, СПИСАНИЕ ПО ТЕХКАРТАМ И РАЗДЕЛЕНИЕ СЧЁТА
  // ---------------------------------------------------------------------------
  async createOrAppendTableOrder({
    table_id,
    guest_id = null,
    guest_name = "Гость зала",
    reservation_id = null,
    deposit_applied = 0,
    source = "qr",
    items = []
  }) {
    const user = this.getCurrentUser();
    let order = this.state.orders.find(
      (o) => o.table_id === table_id && (o.status === "open" || o.status === "bill_requested")
    );

    // Если у гостя есть подтверждённая бронь на этот стол, автоматически зачтём её депозит
    if (!order && !deposit_applied) {
      const matchingRes = this.state.reservations.find(
        (r) =>
          r.table_id === table_id &&
          r.visit_date === todayStr(0) &&
          r.status === "confirmed" &&
          r.deposit_status === "paid"
      );
      if (matchingRes) {
        deposit_applied = matchingRes.deposit_amount;
        reservation_id = matchingRes.id;
        matchingRes.status = "seated";
        matchingRes.deposit_status = "applied";
      }
    }

    if (!order) {
      order = {
        id: uid("ord"),
        code: "ORD-" + Math.floor(100 + Math.random() * 900),
        table_id,
        reservation_id,
        guest_id: guest_id || (user && user.role === "guest" ? user.id : null),
        guest_name: guest_name || (user ? user.full_name : `Гость (${table_id})`),
        waiter_id: "u-waiter",
        source,
        status: "open",
        subtotal: 0,
        deposit_applied: Number(deposit_applied || 0),
        bonus_used: 0,
        total: 0,
        paid_amount: 0,
        created_at: new Date().toISOString()
      };
      this.state.orders.unshift(order);
    } else if (deposit_applied > 0 && order.deposit_applied === 0) {
      order.deposit_applied = Number(deposit_applied);
    }

    // Распределяем поваров по очереди
    const cooks = this.state.profiles.filter((p) => p.role === "cook" && p.is_active);
    let cookIdx = 0;

    for (const it of items) {
      const dish = this.state.dishes.find((d) => d.id === it.dish_id);
      const assignedCook = cooks.length ? cooks[cookIdx % cooks.length].id : "u-chef";
      cookIdx++;

      const newItem = {
        id: uid("oi"),
        order_id: order.id,
        dish_id: it.dish_id,
        table_id: order.table_id,
        title: it.title || (dish ? dish.title : "Блюдо"),
        price: Number(it.price || (dish ? dish.price : 0)),
        qty: Number(it.qty || 1),
        options: it.options || {},
        comment: it.comment || "",
        status: "accepted",
        norm_min: dish ? dish.cook_time : 15,
        cook_id: assignedCook,
        waiter_id: order.waiter_id,
        refunded: false,
        created_at: new Date().toISOString()
      };
      this.state.order_items.push(newItem);

      // Автоматическое складское списание ингредиентов по техкарте
      this.deductIngredientsByTechCard(newItem.dish_id, newItem.qty, "sale");
    }

    this.recalcOrderTotals(order.id);
    await this.syncRow("orders", "insert", order);
    return order;
  }

  deductIngredientsByTechCard(dishId, qty = 1, reason = "sale", complaintId = null) {
    const cards = this.state.tech_cards.filter((tc) => tc.dish_id === dishId);
    for (const tc of cards) {
      const ing = this.state.ingredients.find((i) => i.id === tc.ingredient_id);
      if (!ing) continue;
      const usedQty = Number((tc.qty * qty).toFixed(3));
      ing.stock_qty = Number(Math.max(0, ing.stock_qty - usedQty).toFixed(3));
      this.state.write_offs.unshift({
        id: uid("wo"),
        ingredient_id: ing.id,
        dish_id: dishId,
        complaint_id: complaintId,
        qty: usedQty,
        reason,
        cost: Math.round(usedQty * ing.cost_per_unit),
        created_at: new Date().toISOString()
      });
    }
  }

  recalcOrderTotals(orderId) {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return null;
    const activeItems = this.state.order_items.filter(
      (i) => i.order_id === orderId && i.status !== "cancelled" && !i.refunded
    );
    const subtotal = activeItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    order.subtotal = subtotal;
    order.total = Math.max(0, subtotal - Number(order.deposit_applied || 0) - Number(order.bonus_used || 0));
    return order;
  }

  // KDS: смена статуса приготовления конкретного блюда
  async advanceOrderItemStatus(orderItemId, nextStatus) {
    const item = this.state.order_items.find((i) => i.id === orderItemId);
    if (!item) return null;
    item.status = nextStatus;
    const now = new Date().toISOString();
    if (nextStatus === "cooking") item.started_at = now;
    if (nextStatus === "ready") item.ready_at = now;
    if (nextStatus === "served") item.served_at = now;
    this.recalcOrderTotals(item.order_id);
    await this.syncRow("order_items", "update", item);
    return item;
  }

  // Оплата или частичная оплата (разделение счёта) + списание/начисление бонусов
  async payOrderBill({ orderId, amountToPay, bonusToUse = 0, method = "card" }) {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Заказ не найден");

    const user = this.getCurrentUser();
    if (bonusToUse > 0 && user && user.role === "guest") {
      const actualBonus = Math.min(bonusToUse, user.bonus_balance);
      user.bonus_balance -= actualBonus;
      order.bonus_used = Number(order.bonus_used || 0) + actualBonus;
      this.state.loyalty_transactions.unshift({
        id: uid("lt"),
        guest_id: user.id,
        amount: -actualBonus,
        reason: `Списание бонусов при оплате счёта ${order.code}`,
        order_id: order.id,
        created_at: new Date().toISOString()
      });
    }

    this.recalcOrderTotals(order.id);
    const payNow = Math.min(Number(amountToPay || order.total - order.paid_amount), order.total - order.paid_amount);
    order.paid_amount = Number(order.paid_amount || 0) + Math.max(0, payNow);

    this.state.transactions.unshift({
      id: uid("tx"),
      type: "order",
      amount: Math.max(0, payNow),
      method,
      status: "success",
      reservation_id: order.reservation_id,
      order_id: order.id,
      guest_id: order.guest_id,
      meta: {
        description: `Оплата по счёту ${order.code} (Стол ${order.table_id})`
      },
      created_at: new Date().toISOString()
    });

    if (order.paid_amount >= order.total) {
      order.status = "paid";
      order.paid_at = new Date().toISOString();

      // Кэшбэк 5% гостю
      const guestProfile = this.state.profiles.find((p) => p.id === order.guest_id);
      if (guestProfile) {
        const cashback = Math.round((order.paid_amount + order.deposit_applied) * 0.05);
        if (cashback > 0) {
          guestProfile.bonus_balance = Number(guestProfile.bonus_balance || 0) + cashback;
          this.state.loyalty_transactions.unshift({
            id: uid("lt"),
            guest_id: guestProfile.id,
            amount: cashback,
            reason: `Кэшбэк 5% за оплаченный счёт ${order.code}`,
            order_id: order.id,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    await this.syncRow("orders", "update", order);
    return order;
  }

  // ---------------------------------------------------------------------------
  // 5. КОНТРОЛЬ КАЧЕСТВА: ОТЗЫВЫ ПО БЛЮДАМ И КНОПКА «ПРОБЛЕМА С БЛЮДОМ / ВОЗВРАТ»
  // ---------------------------------------------------------------------------
  async submitDishReview({ order_item_id, dish_id, rating, tags = [], comment = "" }) {
    const item = this.state.order_items.find((i) => i.id === order_item_id);
    const user = this.getCurrentUser();
    const rev = {
      id: uid("rev"),
      order_item_id,
      order_id: item ? item.order_id : null,
      dish_id: dish_id || (item ? item.dish_id : null),
      cook_id: item ? item.cook_id : "u-chef",
      guest_id: user ? user.id : null,
      guest_name: user ? user.full_name : "Гость зала",
      rating: Number(rating),
      tags,
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };
    this.state.reviews.unshift(rev);
    await this.syncRow("reviews", "insert", rev);
    return rev;
  }

  async submitDishComplaint({
    order_item_id,
    reason,
    description,
    photo_url,
    preferred = "refund" // 'manager' | 'refund' | 'bonus'
  }) {
    const item = this.state.order_items.find((i) => i.id === order_item_id);
    if (!item) throw new Error("Позиция заказа не найдена");
    const user = this.getCurrentUser();

    const complaint = {
      id: uid("cmp"),
      code: "RET-" + Math.floor(100 + Math.random() * 900),
      order_item_id: item.id,
      order_id: item.order_id,
      dish_id: item.dish_id,
      dish_title: item.title,
      cook_id: item.cook_id,
      guest_id: user ? user.id : null,
      guest_name: user ? user.full_name : "Гость зала",
      table_id: item.table_id,
      reason,
      description: (description || "").trim(),
      photo_url: photo_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=70",
      preferred,
      amount: item.price * item.qty,
      status: "open",
      resolution_amount: 0,
      created_at: new Date().toISOString()
    };

    this.state.complaints.unshift(complaint);

    // Мгновенный экстренный алерт на экран Официанта / Хостес
    this.state.service_calls.unshift({
      id: uid("sc"),
      table_id: item.table_id,
      order_id: item.order_id,
      guest_id: complaint.guest_id,
      type: "complaint",
      note: `⚠️ ПРОБЛЕМА С БЛЮДОМ «${item.title}» (${reason}) — Стол ${item.table_id}`,
      status: "new",
      created_at: new Date().toISOString()
    });

    await this.syncRow("complaints", "insert", complaint);
    return complaint;
  }

  // Решение по жалобе (возврат средств / начисление бонусов + складское списание брака)
  async resolveComplaint(complaintId, resolutionType = "refunded") {
    const cmp = this.state.complaints.find((c) => c.id === complaintId);
    if (!cmp || cmp.status !== "open") return null;

    cmp.status = resolutionType; // 'refunded' | 'compensated' | 'rejected'
    cmp.resolved_at = new Date().toISOString();

    const item = this.state.order_items.find((i) => i.id === cmp.order_item_id);
    if (resolutionType === "refunded") {
      cmp.resolution_amount = cmp.amount;
      if (item) {
        item.refunded = true;
        this.recalcOrderTotals(item.order_id);
      }
      this.state.transactions.unshift({
        id: uid("tx"),
        type: "refund",
        amount: cmp.amount,
        method: "card",
        status: "success",
        reservation_id: null,
        order_id: cmp.order_id,
        complaint_id: cmp.id,
        guest_id: cmp.guest_id,
        meta: {
          description: `Возврат за блюдо «${cmp.dish_title}» по обращению ${cmp.code}`
        },
        created_at: new Date().toISOString()
      });
      this.deductIngredientsByTechCard(cmp.dish_id, 1, "complaint", cmp.id);
    } else if (resolutionType === "compensated") {
      const bonusComp = Math.round(cmp.amount * 1.2); // +20% бонусами в качестве извинения
      cmp.resolution_amount = bonusComp;
      const guest = this.state.profiles.find((p) => p.id === cmp.guest_id);
      if (guest) {
        guest.bonus_balance = Number(guest.bonus_balance || 0) + bonusComp;
        this.state.loyalty_transactions.unshift({
          id: uid("lt"),
          guest_id: guest.id,
          amount: bonusComp,
          reason: `Компенсация бонусами по обращению ${cmp.code} («${cmp.dish_title}»)`,
          order_id: cmp.order_id,
          created_at: new Date().toISOString()
        });
      }
      this.deductIngredientsByTechCard(cmp.dish_id, 1, "complaint", cmp.id);
    }

    await this.syncRow("complaints", "update", cmp);
    return cmp;
  }

  // Вызов официанта / запрос счёта
  async createServiceCall({ table_id, type = "waiter", note = "" }) {
    const user = this.getCurrentUser();
    const call = {
      id: uid("sc"),
      table_id,
      order_id: null,
      guest_id: user ? user.id : null,
      type,
      note:
        note ||
        (type === "bill"
          ? `Стол ${table_id} просит принести счёт / терминал`
          : `Гость за Столом ${table_id} вызывает официанта`),
      status: "new",
      created_at: new Date().toISOString()
    };
    this.state.service_calls.unshift(call);
    await this.syncRow("service_calls", "insert", call);
    return call;
  }

  async closeServiceCall(callId) {
    const call = this.state.service_calls.find((c) => c.id === callId);
    if (!call) return;
    call.status = "done";
    await this.syncRow("service_calls", "update", call);
  }

  // Управление блюдами и стоп-листом
  async toggleDishStock(dishId) {
    const dish = this.state.dishes.find((d) => d.id === dishId);
    if (!dish) return null;
    dish.in_stock = !dish.in_stock;
    await this.syncRow("dishes", "update", dish);
    return dish;
  }

  async addDish(payload) {
    const dish = {
      id: uid("d"),
      category_id: payload.category_id || "c-mains",
      title: payload.title.trim(),
      description: payload.description.trim(),
      composition: (payload.composition || payload.description).trim(),
      price: Number(payload.price || 5000),
      weight: payload.weight || "220 г",
      kcal: Number(payload.kcal || 420),
      protein: Number(payload.protein || 24),
      fat: Number(payload.fat || 22),
      carbs: Number(payload.carbs || 18),
      allergens: payload.allergens || [],
      options: payload.options || { doneness: payload.category_id === "c-steaks", remove: ["зелень", "соус"] },
      upsell: ["d-wine-red", "d-fries"],
      image: payload.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
      cook_time: Number(payload.cook_time || 15),
      in_stock: true,
      is_signature: Boolean(payload.is_signature)
    };
    this.state.dishes.unshift(dish);
    await this.syncRow("dishes", "insert", dish);
    return dish;
  }

  // Пополнение склада бухгалтером
  async replenishIngredient(ingredientId, addQty) {
    const ing = this.state.ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;
    ing.stock_qty = Number((ing.stock_qty + Number(addQty)).toFixed(3));
    await this.syncRow("ingredients", "update", ing);
  }
}

export const db = new RestaurantDatabase();
