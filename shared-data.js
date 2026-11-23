// ============================================================================
// ВОСТОК ХАУС — Общие данные меню, настройки Supabase и синхронизация
// ============================================================================

window.VOSTOK_DEFAULT_SB_URL = "https://gwfoyreeyuxxevysvzey.supabase.co";
window.VOSTOK_DEFAULT_SB_KEY = "sb_publishable_Sp0cCczhPjC1PZuecl0l3A_OJxldmLy";
window.VOSTOK_DEFAULT_AI_FN  = "vostok-ai"; // Сначала вызывает ресторанную функцию vostok-ai

const IMG = window.VOSTOK_IMAGES || {};

window.VOSTOK_CATEGORIES = [
  { slug: "all",    name: "Всё меню" },
  { slug: "plov",   name: "Плов и рис" },
  { slug: "grill",  name: "Шашлык и мангал" },
  { slug: "bakery", name: "Самса и выпечка" },
  { slug: "manti",  name: "Манты и лагман" },
  { slug: "soups",  name: "Супы и шурпа" },
  { slug: "snacks", name: "Салаты и закуски" },
  { slug: "drinks", name: "Десерты и напитки" }
];

window.VOSTOK_ADDONS = [
  { id: "a-1", name: "Дополнительная баранина (80 г)", price: 950 },
  { id: "a-2", name: "Казы (конская колбаса, 50 г)", price: 890 },
  { id: "a-3", name: "Соус Ткемали сливовый", price: 350 },
  { id: "a-4", name: "Соус Наршараб (гранатовый)", price: 390 },
  { id: "a-5", name: "Домашняя сметана с зеленью", price: 350 },
  { id: "a-6", name: "Острый стручковый перец", price: 250 },
  { id: "a-7", name: "Перепелиные яйца (3 шт)", price: 450 },
  { id: "a-8", name: "Маринованный красный лук с сумахом", price: 300 }
];

window.VOSTOK_BASE_OPTIONS = ["Тандырная лепёшка", "Тонкий лаваш", "Без хлеба"];

window.VOSTOK_PROMOS = [
  { code: "VOSTOK10", discount: 10, min: 3000, desc: "Скидка 10% от 3 000 ₸" },
  { code: "PLOV20",   discount: 20, min: 6000, desc: "Скидка 20% от 6 000 ₸" },
  { code: "NAURYZ15", discount: 15, min: 4500, desc: "Скидка 15% от 4 500 ₸" }
];

window.VOSTOK_STATUS_META = {
  new:        { label: "Принят",          step: 1, color: "bg-blue-100 text-blue-800" },
  cooking:    { label: "Готовится",       step: 2, color: "bg-amber-100 text-amber-800" },
  ready:      { label: "Готов к выдаче",  step: 3, color: "bg-emerald-100 text-emerald-800" },
  delivering: { label: "В пути",          step: 4, color: "bg-indigo-100 text-indigo-800" },
  completed:  { label: "Выполнен",        step: 5, color: "bg-stone-200 text-stone-800" },
  cancelled:  { label: "Отменён",         step: 0, color: "bg-rose-100 text-rose-800" }
};

window.VOSTOK_ROLE_META = {
  customer: { label: "Клиент",              badge: "bg-stone-200 text-stone-800",     staff: false },
  cashier:  { label: "Кассир / Зал",        badge: "bg-amber-100 text-amber-800",     staff: true },
  kitchen:  { label: "Повар (Кухня KDS)",   badge: "bg-orange-100 text-orange-800",   staff: true },
  courier:  { label: "Курьер (Доставка)",   badge: "bg-indigo-100 text-indigo-800",   staff: true },
  admin:    { label: "Управляющий (Админ)", badge: "bg-emerald-100 text-emerald-800", staff: true }
};

window.VOSTOK_SEED_PRODUCTS = [
  // 1. Плов и рис
  {
    id: "p-1",
    category_slug: "plov",
    name: "Плов Ташкентский праздничный с бараниной",
    description: "Рассыпчатый рис девзира, томлёная мякоть баранины, жёлтая морковь, нут, изюм, казы и печёный чеснок",
    base_price: 2890,
    weight: 400,
    calories: 740,
    image: IMG.plov || "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 400 },
      { label: "Большая", mult: 1.35, g: 550 },
      { label: "Ляган на компанию", mult: 2.3, g: 1000 }
    ]
  },
  {
    id: "p-2",
    category_slug: "plov",
    name: "Плов Самаркандский слоёный с говядиной",
    description: "Классический слоёный плов на кунжутно-хлопковом масле с нежной телятиной, зирой и барбарисом",
    base_price: 2690,
    weight: 380,
    calories: 690,
    image: IMG.plov || "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 380 },
      { label: "Большая", mult: 1.35, g: 520 },
      { label: "Ляган на компанию", mult: 2.2, g: 950 }
    ]
  },
  {
    id: "p-3",
    category_slug: "plov",
    name: "Плов Ферганский тёмный на курдюке",
    description: "Ароматный обжаренный плов из красного риса девзира с бараниной на косточке и острым стручковым перцем",
    base_price: 2950,
    weight: 400,
    calories: 780,
    image: IMG.plov || "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: true,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 400 },
      { label: "Большая", mult: 1.35, g: 550 }
    ]
  },
  {
    id: "p-4",
    category_slug: "plov",
    name: "Плов Бухарский с курицей и курагой",
    description: "Лёгкий золотистый плов с филе цыплёнка, сладкой курагой, нутом и восточными пряностями",
    base_price: 2290,
    weight: 370,
    calories: 590,
    image: IMG.plov || "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 370 },
      { label: "Большая", mult: 1.35, g: 500 }
    ]
  },

  // 2. Шашлык и мангал
  {
    id: "p-5",
    category_slug: "grill",
    name: "Люля-кебаб из баранины на углях",
    description: "Сочный рубленый кебаб с курдючным жирком, красным луком, сумахом, свежей кинзой и соусом Наршараб",
    base_price: 2590,
    weight: 260,
    calories: 520,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "1 шампур", mult: 1, g: 260 },
      { label: "Двойной (2 шампура)", mult: 1.8, g: 500 }
    ]
  },
  {
    id: "p-6",
    category_slug: "grill",
    name: "Шашлык из мраморной телятины",
    description: "Отборная вырезка молодой телятины в пряном маринаде, обжаренная на саксауле до сочной корочки",
    base_price: 3290,
    weight: 280,
    calories: 550,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 280 },
      { label: "Большая", mult: 1.5, g: 420 }
    ]
  },
  {
    id: "p-7",
    category_slug: "grill",
    name: "Казан-кебаб из бараньих рёбрышек",
    description: "Томлёные в чугунном казане бараньи рёбрышки с румяным молодым картофелем, зирой и свежим луком",
    base_price: 3490,
    weight: 420,
    calories: 790,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 420 },
      { label: "Большая", mult: 1.4, g: 600 }
    ]
  },
  {
    id: "p-8",
    category_slug: "grill",
    name: "Корейка ягнёнка на кости",
    description: "Нежнейшее каре молодого ягнёнка на мангале с печёными овощами и гранатовым соусом",
    base_price: 3890,
    weight: 310,
    calories: 640,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "3 косточки", mult: 1, g: 310 },
      { label: "5 косточек", mult: 1.6, g: 500 }
    ]
  },
  {
    id: "p-9",
    category_slug: "grill",
    name: "Шашлык из куриного бедра в тандыре",
    description: "Сочное куриное бедро в маринаде из айрана, паприки и чеснока с соусом ткемали",
    base_price: 2190,
    weight: 280,
    calories: 460,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 280 },
      { label: "Двойной", mult: 1.75, g: 520 }
    ]
  },

  // 3. Самса и выпечка
  {
    id: "p-10",
    category_slug: "bakery",
    name: "Самса тандырная с рубленой бараниной",
    description: "Хрустящее слоёное тесто прямо со стенок глиняного тандыра с сочной бараниной, курдюком и кунжутом",
    base_price: 1450,
    weight: 260,
    calories: 560,
    image: IMG.samsa || "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "2 шт", mult: 1, g: 260 },
      { label: "4 шт", mult: 1.85, g: 520 }
    ]
  },
  {
    id: "p-11",
    category_slug: "bakery",
    name: "Самса слоёная с говядиной и луком",
    description: "Золотистая домашняя самса с рубленой телятиной, репчатым луком, зирой и чёрным тмином",
    base_price: 1290,
    weight: 240,
    calories: 510,
    image: IMG.samsa || "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "2 шт", mult: 1, g: 240 },
      { label: "4 шт", mult: 1.85, g: 480 }
    ]
  },
  {
    id: "p-12",
    category_slug: "bakery",
    name: "Самса с мускатной тыквой и сулугуни",
    description: "Нежная выпечка со сладкой печёной тыквой, тягучим сыром сулугуни и топлёным маслом",
    base_price: 1090,
    weight: 220,
    calories: 410,
    image: IMG.samsa || "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "2 шт", mult: 1, g: 220 },
      { label: "4 шт", mult: 1.85, g: 440 }
    ]
  },
  {
    id: "p-13",
    category_slug: "bakery",
    name: "Хачапури по-аджарски из печи",
    description: "Румяная лодочка из воздушного теста с двойным сыром сулугуни, сливочным маслом и фермерским желтком",
    base_price: 2190,
    weight: 360,
    calories: 690,
    image: IMG.samsa || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "Стандарт", mult: 1, g: 360 },
      { label: "Большой с двойным сыром", mult: 1.35, g: 480 }
    ]
  },
  {
    id: "p-14",
    category_slug: "bakery",
    name: "Лепёшка Самаркандская из тандыра",
    description: "Горячая пышная лепёшка с хрустящей корочкой, кунжутом и нигеллой",
    base_price: 450,
    weight: 240,
    calories: 380,
    image: IMG.samsa || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "1 шт", mult: 1, g: 240 },
      { label: "2 шт", mult: 1.9, g: 480 }
    ]
  },

  // 4. Манты и лагман
  {
    id: "p-15",
    category_slug: "manti",
    name: "Манты паровые с рубленой говядиной",
    description: "Тонкое тесто ручной лепки, сочная рубленая говядина с луком и зирой, подаются со сметаной",
    base_price: 2390,
    weight: 360,
    calories: 610,
    image: IMG.manti || "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "5 шт", mult: 1, g: 360 },
      { label: "8 шт", mult: 1.5, g: 570 }
    ]
  },
  {
    id: "p-16",
    category_slug: "manti",
    name: "Манты с бараниной и молодой тыквой",
    description: "Традиционные восточные манты с рубленым мясом ягнёнка и кубиками сладкой тыквы",
    base_price: 2490,
    weight: 360,
    calories: 590,
    image: IMG.manti || "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "5 шт", mult: 1, g: 360 },
      { label: "8 шт", mult: 1.5, g: 570 }
    ]
  },
  {
    id: "p-17",
    category_slug: "manti",
    name: "Лагман Уйгурский тянутый",
    description: "Домашняя тянутая лапша в насыщенном бульоне ваджу с телятиной, джусаем, перцем, сельдереем и лазджаном",
    base_price: 2450,
    weight: 440,
    calories: 540,
    image: IMG.lagman || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: true,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 440 },
      { label: "Большая", mult: 1.35, g: 600 }
    ]
  },
  {
    id: "p-18",
    category_slug: "manti",
    name: "Гуйру-лагман жареный на воке",
    description: "Тянутая лапша с обжаренной на сильном огне говядиной, пекинской капустой, перцем и соево-чесночным соусом",
    base_price: 2650,
    weight: 400,
    calories: 620,
    image: IMG.lagman || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: true,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 400 },
      { label: "Большая", mult: 1.35, g: 540 }
    ]
  },

  // 5. Супы и шурпа
  {
    id: "p-19",
    category_slug: "soups",
    name: "Шурпа Коурма из баранины с нутом",
    description: "Наваристый прозрачный бульон с мягкой бараниной на косточке, нутом, крупным картофелем и свежей кинзой",
    base_price: 2250,
    weight: 420,
    calories: 480,
    image: IMG.lagman || "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 420 },
      { label: "Большая", mult: 1.3, g: 560 }
    ]
  },
  {
    id: "p-20",
    category_slug: "soups",
    name: "Чучвара по-бухарски в бульоне",
    description: "Миниатюрные пельмени ручной лепки с говядиной в ароматном бульоне с домашней сметаной и зеленью",
    base_price: 1990,
    weight: 380,
    calories: 490,
    image: IMG.manti || "https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "Стандарт", mult: 1, g: 380 },
      { label: "Большая", mult: 1.35, g: 510 }
    ]
  },

  // 6. Салаты и закуски
  {
    id: "p-21",
    category_slug: "snacks",
    name: "Салат Ачичук с ташкентскими томатами",
    description: "Тончайшие ломтики спелых розовых томатов со сладким красным луком, фиолетовым базиликом и чили",
    base_price: 1190,
    weight: 220,
    calories: 115,
    image: IMG.plov || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: true,
    is_veg: true,
    sizes: [
      { label: "Стандарт", mult: 1, g: 220 },
      { label: "Большая", mult: 1.4, g: 320 }
    ]
  },
  {
    id: "p-22",
    category_slug: "snacks",
    name: "Мясная нарезка Казы и Чучук",
    description: "Деликатесная конская колбаса казы, подаётся с кольцами маринованного лука и зёрнами граната",
    base_price: 2790,
    weight: 180,
    calories: 510,
    image: IMG.shashlik || "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: false,
    sizes: [
      { label: "180 г", mult: 1, g: 180 },
      { label: "300 г", mult: 1.6, g: 300 }
    ]
  },

  // 7. Десерты и напитки
  {
    id: "p-23",
    category_slug: "drinks",
    name: "Пахлава медовая с иранской фисташкой",
    description: "Тончайшие слои теста фило с грецким орехом, горным мёдом, кардамоном и дроблёной фисташкой",
    base_price: 1390,
    weight: 160,
    calories: 490,
    image: IMG.baklava || "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "3 шт", mult: 1, g: 160 },
      { label: "6 шт", mult: 1.85, g: 320 }
    ]
  },
  {
    id: "p-24",
    category_slug: "drinks",
    name: "Чай «Шёлковый путь» в чайнике",
    description: "Отборный листовой чай с горным чабрецом, мятой, свежим лимоном и кристаллами восточного сахара нават",
    base_price: 1290,
    weight: 800,
    calories: 65,
    image: IMG.baklava || "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600",
    is_available: true,
    is_hit: true,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "Чайник 800 мл", mult: 1, g: 800 },
      { label: "Большой чайник 1.2 л", mult: 1.35, g: 1200 }
    ]
  },
  {
    id: "p-25",
    category_slug: "drinks",
    name: "Айран домашний с горной зеленью",
    description: "Прохладный густой айран собственного приготовления с мелко рубленым укропом, мятой и свежим огурцом",
    base_price: 750,
    weight: 400,
    calories: 135,
    image: IMG.baklava || "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "400 мл", mult: 1, g: 400 },
      { label: "Кувшин 1 л", mult: 2.1, g: 1000 }
    ]
  },
  {
    id: "p-26",
    category_slug: "drinks",
    name: "Шербет гранатово-вишнёвый",
    description: "Натуральный освежающий восточный напиток из зёрен граната, спелой вишни и лепестков каркаде",
    base_price: 890,
    weight: 450,
    calories: 160,
    image: IMG.baklava || "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
    is_available: true,
    is_hit: false,
    is_spicy: false,
    is_veg: true,
    sizes: [
      { label: "450 мл", mult: 1, g: 450 },
      { label: "Кувшин 1 л", mult: 2.0, g: 1000 }
    ]
  }
];

window.VOSTOK_SEED_INVENTORY = [
  { id: "i-1", name: "Рис Девзира и Лазер", unit: "кг", qty: 42.5, min: 10 },
  { id: "i-2", name: "Баранина (мякоть и корейка)", unit: "кг", qty: 28.0, min: 8 },
  { id: "i-3", name: "Говядина (вырезка)", unit: "кг", qty: 34.0, min: 10 },
  { id: "i-4", name: "Мука высший сорт", unit: "кг", qty: 55.0, min: 15 },
  { id: "i-5", name: "Гранатовый соус Наршараб", unit: "л", qty: 3.2, min: 4 },
  { id: "i-6", name: "Кинза, райхан и зелень", unit: "кг", qty: 1.2, min: 1.5 },
  { id: "i-7", name: "Жёлтая самаркандская морковь", unit: "кг", qty: 38.0, min: 12 },
  { id: "i-8", name: "Казы и курдюк", unit: "кг", qty: 14.5, min: 5 }
];

window.VOSTOK_SEED_STAFF = [
  { id: "u-1", name: "Рустам Каримов",  email: "admin@vostok.kz",   role: "admin",   shift: true },
  { id: "u-2", name: "Азизбек Умаров",  email: "kitchen@vostok.kz", role: "kitchen", shift: true },
  { id: "u-3", name: "Мадина Садыкова", email: "cashier@vostok.kz", role: "cashier", shift: true },
  { id: "u-4", name: "Ерлан Нурланов",  email: "courier@vostok.kz", role: "courier", shift: true }
];

window.VOSTOK_SEED_ORDERS = [
  {
    id: "ord-101",
    number: 101,
    customer: "Тимур А.",
    phone: "+7 (701) 210-44-12",
    type: "delivery",
    address: "ул. Абая, 45, кв. 18",
    comment: "Позвонить за 5 минут",
    paymentMethod: "card",
    paymentStatus: "paid",
    transactionId: "TX-884120",
    status: "cooking",
    total: 4795,
    createdAt: Date.now() - 8 * 60000,
    items: [
      { name: "Плов Ташкентский праздничный с бараниной", size: "Большая", base: "Тандырная лепёшка", addons: ["Казы (конская колбаса, 50 г)"], qty: 1, price: 4795, ready: false }
    ]
  },
  {
    id: "ord-102",
    number: 102,
    customer: "Алина К.",
    phone: "+7 (707) 555-32-19",
    type: "delivery",
    address: "пр. Шакарима, 12, оф. 4",
    comment: "",
    paymentMethod: "card",
    paymentStatus: "paid",
    transactionId: "TX-884091",
    status: "ready",
    total: 4580,
    createdAt: Date.now() - 16 * 60000,
    items: [
      { name: "Шашлык из мраморной телятины", size: "Стандарт", base: "Тонкий лаваш", addons: [], qty: 1, price: 3290, ready: true },
      { name: "Самса слоёная с говядиной и луком", size: "2 шт", base: "Без хлеба", addons: [], qty: 1, price: 1290, ready: true }
    ]
  },
  {
    id: "ord-103",
    number: 103,
    customer: "Данияр М.",
    phone: "+7 (778) 777-88-11",
    type: "dine_in",
    address: "В зале (свободная посадка)",
    comment: "Сяду у окна в общем зале",
    paymentMethod: "card",
    paymentStatus: "paid",
    transactionId: "TX-884155",
    status: "new",
    total: 2450,
    createdAt: Date.now() - 3 * 60000,
    items: [
      { name: "Лагман Уйгурский тянутый", size: "Стандарт", base: "Тандырная лепёшка", addons: [], qty: 1, price: 2450, ready: false }
    ]
  }
];

// Форматирование валюты в тенге (₸)
window.fmtKZT = function (n) {
  return Number(n || 0).toLocaleString("ru-RU") + " ₸";
};

// Единое хранилище состояния между index.html и staff.html + Supabase
const SHARED_STORAGE_KEY = "vostok_house_shared_db_v2";
const SB_CFG_STORAGE_KEY = "vostok_sb_preview_cfg_v3";

window.loadVostokConfig = function () {
  try {
    const raw = localStorage.getItem(SB_CFG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: (parsed.url || window.VOSTOK_DEFAULT_SB_URL).trim(),
        key: (parsed.key || window.VOSTOK_DEFAULT_SB_KEY).trim(),
        aiFn: (parsed.aiFn || window.VOSTOK_DEFAULT_AI_FN).trim()
      };
    }
  } catch (_) {}
  return {
    url: window.VOSTOK_DEFAULT_SB_URL,
    key: window.VOSTOK_DEFAULT_SB_KEY,
    aiFn: window.VOSTOK_DEFAULT_AI_FN
  };
};

window.saveVostokConfig = function (url, key, aiFn) {
  try {
    localStorage.setItem(
      SB_CFG_STORAGE_KEY,
      JSON.stringify({
        url: (url || "").trim(),
        key: (key || "").trim(),
        aiFn: (aiFn || "ertis-ai").trim()
      })
    );
  } catch (_) {}
};

window.loadSharedDb = function () {
  try {
    const raw = localStorage.getItem(SHARED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        products: parsed.products?.length ? parsed.products : window.VOSTOK_SEED_PRODUCTS,
        inventory: parsed.inventory?.length ? parsed.inventory : window.VOSTOK_SEED_INVENTORY,
        staff: parsed.staff?.length ? parsed.staff : window.VOSTOK_SEED_STAFF,
        orders: parsed.orders?.length ? parsed.orders : window.VOSTOK_SEED_ORDERS,
        paymentLogs: parsed.paymentLogs || []
      };
    }
  } catch (_) {}
  return {
    products: window.VOSTOK_SEED_PRODUCTS,
    inventory: window.VOSTOK_SEED_INVENTORY,
    staff: window.VOSTOK_SEED_STAFF,
    orders: window.VOSTOK_SEED_ORDERS,
    paymentLogs: []
  };
};

window.saveSharedDb = function (dbPatch) {
  try {
    const current = window.loadSharedDb();
    const next = {
      products: dbPatch.products || current.products,
      inventory: dbPatch.inventory || current.inventory,
      staff: dbPatch.staff || current.staff,
      orders: dbPatch.orders || current.orders,
      paymentLogs: dbPatch.paymentLogs || current.paymentLogs
    };
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(next));
  } catch (_) {}
};

// Ответ ИИ-ассистента (через Supabase Edge Function vostok-ai / ertis-ai + умный ответ по живым данным БД)
window.callVostokAi = async function ({ sbUrl, sbKey, aiFn, systemPrompt, history, userText, dbSnapshot }) {
  const urlBase = (sbUrl || window.VOSTOK_DEFAULT_SB_URL).replace(/\/+$/, "");
  const key = sbKey || window.VOSTOK_DEFAULT_SB_KEY;
  const fnNames = Array.from(new Set([aiFn || "vostok-ai", "vostok-ai", "ertis-ai"]));

  // Вшиваем живой контекст БД также и в последнее сообщение истории, чтобы любая Edge Function отвечала строго по данным ресторана
  const enrichedHistory = (history || []).slice(-10).map((msg, idx, arr) => {
    if (idx === arr.length - 1 && msg.role === "user") {
      return {
        role: "user",
        parts: [{ text: `[КОНТЕКСТ БАЗЫ ДАННЫХ РЕСТОРАНА ВОСТОК ХАУС]:\n${systemPrompt}\n\n[ВОПРОС ПОЛЬЗОВАТЕЛЯ]: ${userText}` }]
      };
    }
    return msg;
  });

  for (const fn of fnNames) {
    try {
      const res = await fetch(`${urlBase}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key
        },
        body: JSON.stringify({
          systemPrompt,
          history: enrichedHistory
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.reply) {
        // Проверяем, что функция не вернула ответ от старого гидрологического бота (Ертіс / гидропост)
        const rLow = data.reply.toLowerCase();
        const isHydroReply = rLow.includes("гидропост") || rLow.includes("ертіс") || rLow.includes("бекет") || rLow.includes("шүлбі");
        if (!isHydroReply) {
          return { reply: data.reply, source: `Supabase Edge (${fn})` };
        }
      }
    } catch (_) {}
  }

  // Если облачная Edge Function ещё не развернута или ключ в Google Cloud требует активации —
  // формируем точный ответ напрямую по живым данным базы данных (меню, цены в ₸, промокоды, заказы, склад)
  const q = (userText || "").toLowerCase();
  const prods = (dbSnapshot?.products || window.VOSTOK_SEED_PRODUCTS).filter((p) => p.is_available);
  const stopped = (dbSnapshot?.products || []).filter((p) => !p.is_available);
  const orders = dbSnapshot?.orders || [];
  const inventory = dbSnapshot?.inventory || [];
  const isStaff = Boolean(dbSnapshot?.isStaff);

  if (isStaff) {
    const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    const activeOrders = orders.filter((o) => ["new", "cooking", "ready", "delivering"].includes(o.status));
    const lowInv = inventory.filter((i) => Number(i.qty) <= Number(i.min));
    if (q.includes("склад") || q.includes("остат") || q.includes("продукт")) {
      return {
        reply:
          `**Анализ склада из базы данных Supabase:**\n` +
          inventory.map((i) => `- **${i.name}**: \`${Number(i.qty).toFixed(1)} ${i.unit}\` (мин. порог ${i.min} ${i.unit})${Number(i.qty) <= Number(i.min) ? " — *требуется пополнение!*" : ""}`).join("\n") +
          (lowInv.length ? `\n\nВнимание: критический остаток по **${lowInv.length} поз.** (${lowInv.map((x) => x.name).join(", ")}).` : "\n\nВсе позиции выше минимального порога."),
        source: "Live DB Analyzer"
      };
    }
    return {
      reply:
        `**Оперативная сводка «ВОСТОК ХАУС» по данным БД:**\n` +
        `- **Выручка смены:** \`${window.fmtKZT(revenue)}\` (всего заказов в базе: **${orders.length}**)\n` +
        `- **Активных заказов в работе:** **${activeOrders.length}** (${activeOrders.map((o) => `#${o.number} — ${window.VOSTOK_STATUS_META[o.status]?.label}`).join(", ") || "очередь пуста"})\n` +
        `- **Блюд в меню:** **${prods.length}** в продаже, **${stopped.length}** на стоп-листе\n` +
        `- **Критичных позиций на складе:** **${lowInv.length}** (${lowInv.map((i) => `${i.name}: ${i.qty} ${i.unit}`).join(", ") || "нет"})`,
      source: "Live DB Analyzer"
    };
  }

  // Ответы для клиента по данным базы
  if (q.includes("статус") || q.includes("заказ") || q.includes("где мой")) {
    const latest = dbSnapshot?.trackedOrder || orders[0];
    if (!latest) {
      return {
        reply: "В базе данных пока нет ваших активных заказов. Выберите блюда в меню и оформите заказ на **Доставку** или **В зале (свободная посадка)**!",
        source: "Live DB"
      };
    }
    const st = window.VOSTOK_STATUS_META[latest.status]?.label || latest.status;
    return {
      reply:
        `**Данные вашего заказа #${latest.number} из базы:**\n` +
        `- **Статус:** **${st}**\n` +
        `- **Формат:** ${latest.type === "delivery" ? `Доставка (${latest.address})` : "В зале (свободная посадка — займите любой свободный столик)"}\n` +
        `- **Состав:** ${(latest.items || []).map((i) => `${i.name} (${i.size}) ×${i.qty}`).join(", ")}\n` +
        `- **Сумма:** \`${window.fmtKZT(latest.total)}\``,
      source: "Live DB"
    };
  }

  if (q.includes("промо") || q.includes("скидк") || q.includes("акци")) {
    return {
      reply:
        `**Актуальные промокоды в нашей базе данных:**\n` +
        window.VOSTOK_PROMOS.map((p) => `- \`${p.code}\` — **-${p.discount}%** при заказе от \`${window.fmtKZT(p.min)}\``).join("\n") +
        `\n\nВведите любой из них в корзине перед оплатой!`,
      source: "Live DB"
    };
  }

  if (q.includes("сет") || q.includes("компани") || q.includes("10") || q.includes("собери")) {
    const plov = prods.find((p) => p.category_slug === "plov") || prods[0];
    const grill = prods.find((p) => p.category_slug === "grill") || prods[1];
    const bakery = prods.find((p) => p.category_slug === "bakery") || prods[2];
    const drink = prods.find((p) => p.category_slug === "drinks") || prods[prods.length - 1];
    const sum = (plov?.base_price || 0) + (grill?.base_price || 0) + (bakery?.base_price || 0) + (drink?.base_price || 0);
    return {
      reply:
        `**Рекомендуемый сет по текущему меню из базы данных:**\n` +
        `1. **${plov?.name}** — \`${window.fmtKZT(plov?.base_price)}\`\n` +
        `2. **${grill?.name}** — \`${window.fmtKZT(grill?.base_price)}\`\n` +
        `3. **${bakery?.name}** — \`${window.fmtKZT(bakery?.base_price)}\`\n` +
        `4. **${drink?.name}** — \`${window.fmtKZT(drink?.base_price)}\`\n` +
        `\n**Итого:** \`${window.fmtKZT(sum)}\` (с промокодом \`PLOV20\` или \`VOSTOK10\` будет ещё выгоднее!).`,
      source: "Live DB"
    };
  }

  if (q.includes("остр") || q.includes("вег") || q.includes("без мяс")) {
    const spicy = prods.filter((p) => p.is_spicy);
    const veg = prods.filter((p) => p.is_veg);
    return {
      reply:
        `**Выборка из базы меню «ВОСТОК ХАУС»:**\n` +
        `**Острые блюда (${spicy.length}):**\n` +
        spicy.map((p) => `- **${p.name}** — \`${window.fmtKZT(p.base_price)}\``).join("\n") +
        `\n\n**Вегетарианские / без мяса (${veg.length}):**\n` +
        veg.map((p) => `- **${p.name}** — \`${window.fmtKZT(p.base_price)}\``).join("\n"),
      source: "Live DB"
    };
  }

  const hits = prods.filter((p) => p.is_hit).slice(0, 6);
  return {
    reply:
      `**Сейчас в базе меню «ВОСТОК ХАУС» доступно ${prods.length} блюд (100% Халяль).**\n` +
      `Главные хиты сегодня:\n` +
      hits.map((p) => `- **${p.name}** (${p.weight} г) — \`${window.fmtKZT(p.base_price)}\``).join("\n") +
      (stopped.length ? `\n\n*Временно на стопе:* ${stopped.map((s) => s.name).join(", ")}.` : "") +
      `\n\nВы можете заказать **Доставку** или выбрать режим **«В зале»** (бронь столов не нужна — свободная посадка).`,
    source: "Live DB"
  };
};
