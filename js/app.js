/* =========================================================================
   L'AURUM Restaurant OS — Клиентский контроллер + Закрытая ERP-панель (RBAC)
   ========================================================================= */

import {
  db,
  ROLE_LABELS,
  ALLERGEN_LABELS,
  DONENESS_LIST,
  REVIEW_TAGS,
  COMPLAINT_REASONS
} from "./db.js";

const state = {
  portal: "guest", // 'guest' | 'staff'
  staffTab: "boss", // 'kds' | 'hall' | 'finance' | 'boss'
  category: "all",
  search: "",
  sort: "featured",
  excludedAllergens: new Set(),
  cart: JSON.parse(localStorage.getItem("laurum_guest_cart_v3") || "[]"),
  qrTableId: new URLSearchParams(window.location.search).get("table") || "T5",
  selectedResTable: "T3",
  resDate: new Date().toISOString().split("T")[0],
  resTime: "19:00",
  resGuests: 2,
  attachCartToReservation: true,
  customizingDish: null,
  reviewingItemId: null,
  complainingItemId: null,
  complaintPhotoDataUrl: ""
};

export function fmt(amount) {
  return `${Math.round(Number(amount || 0)).toLocaleString("ru-RU")} ₸`;
}

export function toast(msg, type = "default") {
  const wrap = document.getElementById("toasts");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = `toast ${type === "ok" ? "toast-ok" : type === "bad" ? "toast-bad" : ""}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, 3800);
}

function saveCart() {
  localStorage.setItem("laurum_guest_cart_v3", JSON.stringify(state.cart));
  renderHeader();
  renderCartDrawer();
  renderReservationSection();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

// ---------------------------------------------------------------------------
// 1. HEADER, SUPABASE INDICATOR & AUTH / RBAC SWITCHING
// ---------------------------------------------------------------------------
function renderHeader() {
  const user = db.getCurrentUser();
  const modePill = document.getElementById("db-mode-pill");
  if (modePill) {
    const isCloud = db.mode === "supabase";
    modePill.className = `mode-pill ${isCloud ? "cloud" : ""}`;
    modePill.innerHTML = `<i></i><span>${isCloud ? "Supabase PostgreSQL (Live)" : "Гибридный демо-режим (Supabase Ready)"}</span>`;
  }

  const cartBadge = document.getElementById("header-cart-badge");
  const count = getCartCount();
  if (cartBadge) {
    cartBadge.textContent = count;
    cartBadge.hidden = count === 0;
  }

  const userBtn = document.getElementById("header-user-btn");
  if (userBtn) {
    if (user) {
      userBtn.innerHTML =
        user.role === "guest"
          ? `👤 ${user.full_name.split(" ")[0]} · <b>${fmt(user.bonus_balance)}</b>`
          : `🔐 ${user.full_name.split(" ")[0]} (${ROLE_LABELS[user.role] || user.role})`;
    } else {
      userBtn.textContent = "Войти / Регистрация";
    }
  }

  const staffToggleBtn = document.getElementById("header-portal-toggle");
  if (staffToggleBtn) {
    const openAlerts =
      db.state.service_calls.filter((c) => c.status === "new").length +
      db.state.complaints.filter((c) => c.status === "open").length;
    staffToggleBtn.innerHTML =
      state.portal === "guest"
        ? `Панель персонала (ERP)${openAlerts > 0 ? ` <span class="badge badge-bad">${openAlerts}</span>` : ""}`
        : `← Вернуться на сайт Гостя`;
  }
}

function switchPortal(targetPortal) {
  const user = db.getCurrentUser();
  if (targetPortal === "staff") {
    // Если текущий пользователь не сотрудник — откроем модальное окно входа сотрудника
    if (!user || user.role === "guest") {
      openStaffAuthModal();
      return;
    }
    state.portal = "staff";
    // Выбираем вкладку по роли сотрудника (RBAC)
    if (user.role === "cook") state.staffTab = "kds";
    else if (user.role === "waiter" || user.role === "hostess") state.staffTab = "hall";
    else if (user.role === "accountant") state.staffTab = "finance";
    else state.staffTab = "boss";
  } else {
    state.portal = "guest";
  }

  document.getElementById("guest-portal").hidden = state.portal !== "guest";
  document.getElementById("staff-portal").hidden = state.portal !== "staff";
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// 2. МЕНЮ ГОСТЯ С ФИЛЬТРАМИ АЛЛЕРГЕНОВ, КБЖУ, КАСТОМИЗАЦИЕЙ И СЧАСТЛИВЫМИ ЧАСАМИ
// ---------------------------------------------------------------------------
function renderHappyHourBanner() {
  const strip = document.getElementById("happy-hour-strip");
  if (!strip) return;
  const activeHH = db.getActiveHappyHour();
  const forced = localStorage.getItem("laurum_force_happy_hour") === "1";

  strip.innerHTML = `
    <div class="row wrap between" style="width:100%">
      <div class="row wrap">
        <span class="badge badge-accent">${activeHH ? "🔥 Активно сейчас" : "🕒 Динамические цены"}</span>
        <span>
          ${
            activeHH
              ? `<b>${activeHH.title}</b> — цены в меню автоматически снижены на <b>${activeHH.discount_pct}%</b>!`
              : "Счастливые часы: Пн–Пт 13:00–17:00 (−15% на всё меню) и ежедневно после 21:00 (−20% на десерты)."
          }
        </span>
      </div>
      <button type="button" id="toggle-demo-hh-btn" class="btn btn-sm ${forced ? "btn-primary" : ""}">
        ${forced ? "✓ Счастливые часы включены (Выключить)" : "Проверить Счастливые часы (−15%)"}
      </button>
    </div>
  `;

  document.getElementById("toggle-demo-hh-btn")?.addEventListener("click", () => {
    const next = localStorage.getItem("laurum_force_happy_hour") === "1" ? "0" : "1";
    localStorage.setItem("laurum_force_happy_hour", next);
    renderAll();
    toast(next === "1" ? "Счастливые часы активированы: цены пересчитаны!" : "Стандартные цены меню восстановлены", "ok");
  });
}

function renderMenuSection() {
  renderHappyHourBanner();

  // Категории
  const catWrap = document.getElementById("menu-categories");
  if (catWrap) {
    const cats = [{ id: "all", name: "Все курсы" }, ...db.state.categories];
    catWrap.innerHTML = cats
      .map(
        (c) => `
        <button type="button" data-cat="${c.id}" class="chip ${state.category === c.id ? "active" : ""}">
          ${c.name}
        </button>`
      )
      .join("");
  }

  // Фильтры исключения аллергенов
  const algWrap = document.getElementById("allergen-chips");
  if (algWrap) {
    algWrap.innerHTML = Object.entries(ALLERGEN_LABELS)
      .map(([key, label]) => {
        const active = state.excludedAllergens.has(key);
        return `
          <button type="button" data-allergen="${key}" class="chip exclude ${active ? "active" : ""}">
            ${active ? "✕ " : ""}Без: ${label.toLowerCase()}
          </button>
        `;
      })
      .join("");
  }

  // Фильтрация блюд
  const grid = document.getElementById("menu-grid");
  if (!grid) return;

  let list = [...db.state.dishes];
  if (state.category !== "all") {
    list = list.filter((d) => d.category_id === state.category);
  }
  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q) ||
        (d.composition || "").toLowerCase().includes(q)
    );
  }
  if (state.excludedAllergens.size > 0) {
    list = list.filter((d) => !(d.allergens || []).some((a) => state.excludedAllergens.has(a)));
  }

  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (state.sort === "kcal-asc") list.sort((a, b) => (a.kcal || 0) - (b.kcal || 0));
  else list.sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || Number(b.is_signature) - Number(a.is_signature));

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="title-md">Блюда не найдены</div>
        <p class="small">Попробуйте снять фильтры аллергенов или изменить поисковый запрос.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list
    .map((dish) => {
      const priceInfo = db.getDishEffectivePrice(dish);
      const dishReviews = db.state.reviews.filter((r) => r.dish_id === dish.id);
      const avgRating =
        dishReviews.length > 0
          ? (dishReviews.reduce((s, r) => s + r.rating, 0) / dishReviews.length).toFixed(1)
          : "5.0";
      const algList = (dish.allergens || []).map((a) => ALLERGEN_LABELS[a] || a).join(", ");

      return `
        <article class="dish ${dish.in_stock ? "" : "off"}" data-open-dish="${dish.id}">
          <div class="dish-img">
            <div class="ph">L'A</div>
            <img src="${dish.image}" alt="${dish.title}" loading="lazy" onerror="this.classList.add('img-err')" />
            <div class="tags">
              ${dish.is_signature ? `<span class="badge badge-dark">★ Signature</span>` : ""}
              ${priceInfo.discountPct ? `<span class="badge badge-accent">−${priceInfo.discountPct}% Счастливые часы</span>` : ""}
              ${!dish.in_stock ? `<span class="badge badge-bad">Стоп-лист</span>` : ""}
            </div>
          </div>
          <div class="dish-body">
            <div class="row between">
              <span class="xs muted">${dish.weight} · ⏱ ${dish.cook_time} мин</span>
              <span class="rating">★ ${avgRating} (${dishReviews.length || 1})</span>
            </div>
            <h3 class="dish-title">${dish.title}</h3>
            <p class="dish-desc">${dish.description}</p>
            <div class="xs muted">
              КБЖУ: <b>${dish.kcal}</b> ккал · Б ${dish.protein}г · Ж ${dish.fat}г · У ${dish.carbs}г
            </div>
            <div class="allergen">
              ${algList ? `Аллергены: ${algList}` : "✓ Гипоаллергенно (без основных аллергенов)"}
            </div>
            <div class="dish-foot">
              <div class="price">
                ${fmt(priceInfo.price)}
                ${priceInfo.oldPrice ? `<span class="strike small">${fmt(priceInfo.oldPrice)}</span>` : ""}
              </div>
              <button
                type="button"
                class="btn btn-sm ${dish.in_stock ? "btn-primary" : ""}"
                ${dish.in_stock ? `data-open-dish="${dish.id}"` : "disabled"}
              >
                ${dish.in_stock ? "Настроить / + В счёт" : "В стоп-листе"}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

// Модальное окно кастомизации блюда (прожарка стейка, убрать лук и т.д.)
function openDishCustomizeModal(dishId) {
  const dish = db.state.dishes.find((d) => d.id === dishId);
  if (!dish) return;
  state.customizingDish = dish;
  const priceInfo = db.getDishEffectivePrice(dish);
  const dishReviews = db.state.reviews.filter((r) => r.dish_id === dish.id);

  const modal = document.getElementById("dish-modal");
  const content = document.getElementById("dish-modal-body");
  if (!modal || !content) return;

  const hasDoneness = dish.options && dish.options.doneness;
  const removable = (dish.options && dish.options.remove) || [];

  content.innerHTML = `
    <div class="hero-media">
      <img src="${dish.image}" alt="${dish.title}" onerror="this.style.display='none'" />
    </div>
    <div class="stack">
      <div class="row between wrap">
        <span class="badge badge-accent">${dish.weight} · Норматив подачи ${dish.cook_time} мин</span>
        <span class="price">${fmt(priceInfo.price)} ${priceInfo.oldPrice ? `<span class="strike small">${fmt(priceInfo.oldPrice)}</span>` : ""}</span>
      </div>
      <h2 class="title-md">${dish.title}</h2>
      <p class="ink2 small">${dish.description}</p>
      <p class="xs muted"><b>Состав:</b> ${dish.composition || dish.description}</p>

      <!-- Пищевая ценность КБЖУ -->
      <div class="nutri">
        <div><b>${dish.kcal}</b><span>ккал</span></div>
        <div><b>${dish.protein} г</b><span>Белки</span></div>
        <div><b>${dish.fat} г</b><span>Жиры</span></div>
        <div><b>${dish.carbs} г</b><span>Углеводы</span></div>
      </div>

      ${
        hasDoneness
          ? `<div class="field">
              <span>Выберите степень прожарки стейка:</span>
              <div class="opt-group">
                ${DONENESS_LIST.map(
                  (d, idx) => `
                  <label>
                    <input type="radio" name="dish-doneness" value="${d}" ${idx === 1 ? "checked" : ""} />
                    <span>${d}</span>
                  </label>`
                ).join("")}
              </div>
            </div>`
          : ""
      }

      ${
        removable.length > 0
          ? `<div class="field">
              <span>Индивидуальная кастомизация (убрать ингредиенты):</span>
              <div class="opt-group">
                ${removable
                  .map(
                    (rem) => `
                  <label>
                    <input type="checkbox" name="dish-remove" value="${rem}" />
                    <span>Без: ${rem}</span>
                  </label>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      <label class="field">
        <span>Комментарий для повара на кухню (KDS):</span>
        <input type="text" id="custom-dish-comment" class="input" placeholder="Например: подать соус отдельно, без перца..." />
      </label>

      <div class="row between pt-2">
        <div class="qty">
          <button type="button" id="cust-qty-dec">−</button>
          <span id="cust-qty-val">1</span>
          <button type="button" id="cust-qty-inc">+</button>
        </div>
        <button type="button" id="confirm-add-dish-btn" class="btn btn-primary btn-lg">
          Добавить в заказ · ${fmt(priceInfo.price)}
        </button>
      </div>

      ${
        dishReviews.length > 0
          ? `<hr />
            <div class="stack-sm">
              <div class="xs bold muted">ОТЗЫВЫ ГОСТЕЙ ОБ ЭТОМ БЛЮДЕ (${dishReviews.length}):</div>
              ${dishReviews
                .slice(0, 3)
                .map(
                  (r) => `
                <div class="card-flat small">
                  <div class="row between">
                    <b>${r.guest_name || "Гость"}</b>
                    <span class="accent">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
                  </div>
                  ${r.tags?.length ? `<div class="xs muted mt">${r.tags.join(" · ")}</div>` : ""}
                  ${r.comment ? `<p class="xs mt">${r.comment}</p>` : ""}
                </div>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;

  let qty = 1;
  const qtyVal = document.getElementById("cust-qty-val");
  const addBtn = document.getElementById("confirm-add-dish-btn");
  const updateBtn = () => {
    qtyVal.textContent = qty;
    addBtn.textContent = `Добавить в заказ · ${fmt(priceInfo.price * qty)}`;
  };
  document.getElementById("cust-qty-dec")?.addEventListener("click", () => {
    if (qty > 1) {
      qty--;
      updateBtn();
    }
  });
  document.getElementById("cust-qty-inc")?.addEventListener("click", () => {
    qty++;
    updateBtn();
  });

  addBtn?.addEventListener("click", () => {
    const donenessEl = content.querySelector('input[name="dish-doneness"]:checked');
    const removedEls = [...content.querySelectorAll('input[name="dish-remove"]:checked')];
    const comment = document.getElementById("custom-dish-comment")?.value.trim() || "";

    state.cart.push({
      uid: Date.now() + "-" + Math.random().toString(36).slice(2, 5),
      dish_id: dish.id,
      title: dish.title,
      price: priceInfo.price,
      image: dish.image,
      qty,
      options: {
        doneness: donenessEl ? donenessEl.value : null,
        remove: removedEls.map((el) => el.value)
      },
      comment
    });
    saveCart();
    modal.hidden = true;
    toast(`«${dish.title}» добавлено в ваш сет`, "ok");
  });

  modal.hidden = false;
}

// ---------------------------------------------------------------------------
// 3. КОРЗИНА С УМНЫМИ РЕКОМЕНДАЦИЯМИ (UPSELL) И ОТПРАВКОЙ ПО QR ИЛИ В БРОНЬ
// ---------------------------------------------------------------------------
function renderCartDrawer() {
  const body = document.getElementById("cart-drawer-body");
  const foot = document.getElementById("cart-drawer-foot");
  if (!body || !foot) return;

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div class="empty">
        <div class="title-md">Ваш гастрономический сет пуст</div>
        <p class="small">Выберите блюда из меню — вы можете прикрепить их к бронированию стола (с предоплатой 50%) или отправить сразу на кухню по QR-коду вашего стола.</p>
      </div>
    `;
    foot.innerHTML = "";
    return;
  }

  // Собираем умные рекомендации (Upsell) на основе выбранных блюд
  const inCartIds = new Set(state.cart.map((i) => i.dish_id));
  const upsellIds = new Set();
  state.cart.forEach((item) => {
    const d = db.state.dishes.find((x) => x.id === item.dish_id);
    (d?.upsell || []).forEach((id) => {
      if (!inCartIds.has(id)) upsellIds.add(id);
    });
  });
  const upsellDishes = [...upsellIds]
    .map((id) => db.state.dishes.find((d) => d.id === id && d.in_stock))
    .filter(Boolean);

  body.innerHTML = `
    <div>
      ${state.cart
        .map((item) => {
          const mods = [
            item.options?.doneness ? `Прожарка: ${item.options.doneness}` : "",
            item.options?.remove?.length ? `Без: ${item.options.remove.join(", ")}` : "",
            item.comment ? `«${item.comment}»` : ""
          ]
            .filter(Boolean)
            .join(" · ");

          return `
            <div class="cart-item">
              <img src="${item.image}" alt="${item.title}" class="thumb" onerror="this.style.display='none'" />
              <div class="grow">
                <div class="bold small">${item.title}</div>
                ${mods ? `<div class="xs accent">${mods}</div>` : ""}
                <div class="row between mt">
                  <div class="qty">
                    <button type="button" data-cart-dec="${item.uid}">−</button>
                    <span>${item.qty}</span>
                    <button type="button" data-cart-inc="${item.uid}">+</button>
                  </div>
                  <b>${fmt(item.price * item.qty)}</b>
                </div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>

    ${
      upsellDishes.length > 0
        ? `<div class="mt">
            <div class="xs bold muted mb">🍷 СОМЕЛЬЕ И ШЕФ РЕКОМЕНДУЮТ К ВАШЕМУ ЗАКАЗУ (UPSELL):</div>
            <div class="upsell">
              ${upsellDishes
                .map((u) => {
                  const p = db.getDishEffectivePrice(u);
                  return `
                    <div class="upsell-card stack-sm">
                      <div class="bold xs">${u.title}</div>
                      <div class="xs muted">${u.weight}</div>
                      <div class="row between">
                        <b class="xs">${fmt(p.price)}</b>
                        <button type="button" data-quick-upsell="${u.id}" class="btn btn-xs btn-accent">+ Добавить</button>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>`
        : ""
    }
  `;

  const total = getCartTotal();
  const prepay50 = Math.round(total * 0.5);

  foot.innerHTML = `
    <div class="stack">
      <div class="kv"><span>Сумма выбранных блюд:</span><b>${fmt(total)}</b></div>
      <div class="kv accent"><span>Предоплата 50% при брони стола:</span><b>${fmt(prepay50)}</b></div>
      <div class="grid grid-2" style="gap:8px">
        <a href="#booking-section" id="cart-to-booking-btn" class="btn btn-accent">
          В бронь стола (50%)
        </a>
        <button type="button" id="cart-send-qr-btn" class="btn btn-primary">
          Отправить за стол (${state.qrTableId})
        </button>
      </div>
    </div>
  `;

  document.getElementById("cart-to-booking-btn")?.addEventListener("click", () => {
    state.attachCartToReservation = true;
    document.getElementById("cart-drawer-wrap").hidden = true;
    renderReservationSection();
  });

  document.getElementById("cart-send-qr-btn")?.addEventListener("click", async () => {
    const order = await db.createOrAppendTableOrder({
      table_id: state.qrTableId,
      source: "qr",
      items: state.cart
    });
    state.cart = [];
    saveCart();
    document.getElementById("cart-drawer-wrap").hidden = true;
    toast(`Заказ отправлен на кухню (Стол ${order.table_id}, счёт ${order.code})!`, "ok");
    document.getElementById("tracker-section")?.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------------------------------------------------------------------------
// 4. УМНОЕ БРОНИРОВАНИЕ СТОЛОВ С ИНТЕРАКТИВНОЙ СХЕМОЙ И ПРЕДОПЛАТОЙ 50%
// ---------------------------------------------------------------------------
function renderHallMap(containerId, selectedTableId, dateStr, timeStr, isStaffMode = false) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const zonesHtml = db.state.zones
    .map(
      (z) => `
      <div
        class="zone ${z.is_vip ? "vip" : ""}"
        style="left:${z.map_x}%;top:${z.map_y}%;width:${z.map_w}%;height:${z.map_h}%"
      >
        <span class="zone-label">
          ${z.name} · ${
        z.is_vip
          ? `Депозит VIP ${fmt(z.deposit_per_table)}`
          : `Депозит от ${fmt(z.deposit_per_guest)}/гость или 50% меню`
      }
        </span>
      </div>`
    )
    .join("");

  const tablesHtml = db.state.tables
    .map((t) => {
      const st = db.getTableStatus(t.id, dateStr, timeStr);
      const isSelected = selectedTableId === t.id;
      const hasAlert = db.state.service_calls.some((c) => c.table_id === t.id && c.status === "new");
      const disabledForGuest = !isStaffMode && st.state !== "free";

      return `
        <button
          type="button"
          data-map-table="${t.id}"
          data-map-mode="${isStaffMode ? "staff" : "guest"}"
          class="tbl ${t.shape} ${t.seats >= 8 ? "big" : ""} ${st.state} ${isSelected ? "selected" : ""}"
          style="left:${t.x}%;top:${t.y}%"
          ${disabledForGuest ? "disabled" : ""}
          title="${t.label} (${t.seats} мест) — ${st.state}"
        >
          ${hasAlert ? `<span class="alert-dot"></span>` : ""}
          <span>${t.label}</span>
          <small>${t.seats} перс.</small>
        </button>
      `;
    })
    .join("");

  el.innerHTML = zonesHtml + tablesHtml;
}

function renderReservationSection() {
  renderHallMap("guest-hall-map", state.selectedResTable, state.resDate, state.resTime, false);

  const table = db.state.tables.find((t) => t.id === state.selectedResTable) || db.state.tables[0];
  const zone = db.state.zones.find((z) => z.id === table.zone_id);
  const preorderItems = state.attachCartToReservation ? state.cart : [];
  const calc = db.calculateReservationDeposit({
    tableId: table.id,
    guestsCount: state.resGuests,
    preorderItems
  });

  const summaryEl = document.getElementById("booking-deposit-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stack-sm">
        <div class="row between">
          <span class="xs uppercase muted bold">Выбранный стол:</span>
          <span class="badge badge-accent">${table.label} (${zone ? zone.name : ""}) · до ${table.seats} гостей</span>
        </div>
        <div class="kv">
          <span>Предзаказ блюд к приходу (${preorderItems.reduce((s, i) => s + i.qty, 0)} поз.):</span>
          <b>${fmt(calc.preorderTotal)}</b>
        </div>
        <div class="kv accent">
          <span>Правило расчёта предоплаты:</span>
          <b class="right">${calc.ruleLabel}</b>
        </div>
        <div class="kv total">
          <span>К оплате сейчас (Предоплата брони):</span>
          <span>${fmt(calc.depositAmount)}</span>
        </div>
        <div class="notice info mt">
          <b>100% зачёт депозита и правила возврата:</b><br/>
          • Вся сумма предоплаты (<b>${fmt(calc.depositAmount)}</b>) полностью засчитывается в счёт вашего ужина.<br/>
          • При отмене бронирования <b>не позднее чем за 24 часа</b> до визита — <b>100% автоматический возврат</b> на карту.<br/>
          • При поздней отмене (менее чем за 24 часа) или неявке (No-Show) депозит удерживается рестораном.
        </div>
      </div>
    `;
  }

  // Список активных броней гостя с возможностью проверить возврат (>24ч и <24ч)
  const myResWrap = document.getElementById("guest-reservations-list");
  if (myResWrap) {
    const user = db.getCurrentUser();
    const list = db.state.reservations.filter((r) => !user || user.role !== "guest" || r.guest_id === user.id || r.id === "res-101");
    myResWrap.innerHTML = list
      .slice(0, 4)
      .map((r) => {
        const visitTs = new Date(`${r.visit_date}T${r.visit_time}:00`).getTime();
        const hoursLeft = Math.round((visitTs - Date.now()) / 3600000);
        const statusBadge =
          r.status === "confirmed"
            ? `<span class="badge badge-ok">Подтверждена · Депозит ${fmt(r.deposit_amount)} оплачен</span>`
            : r.status === "seated"
            ? `<span class="badge badge-info">Гости за столом · Депозит зачтён в счёт</span>`
            : r.deposit_status === "refunded"
            ? `<span class="badge badge-ok">Отменена · Возврат 100% (${fmt(r.refund_amount)})</span>`
            : `<span class="badge badge-bad">Отменена (<24ч) · Депозит удержан</span>`;

        return `
          <div class="card stack-sm">
            <div class="row between wrap">
              <b>Бронь ${r.code} · Стол ${r.table_id} (${r.visit_date} в ${r.visit_time})</b>
              ${statusBadge}
            </div>
            <div class="xs muted">
              Гость: ${r.guest_name} (${r.guest_phone}) · Персон: ${r.guests_count} · До визита: ${hoursLeft} ч.
            </div>
            ${
              r.preorder?.length
                ? `<div class="xs ink2">Предзаказ к приходу: ${r.preorder.map((p) => `${p.title} ×${p.qty}`).join(", ")}</div>`
                : ""
            }
            ${
              r.status === "confirmed"
                ? `<div class="row wrap mt">
                    <button type="button" data-cancel-res="${r.id}" class="btn btn-sm btn-danger">
                      Отменить бронь (${hoursLeft >= 24 ? "Возврат 100% депозита" : "До визита <24ч — удержание депозита"})
                    </button>
                  </div>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }
}

// ---------------------------------------------------------------------------
// 5. QR-МЕНЮ ЗА СТОЛОМ, ЖИВОЙ ТРЕКЕР ПРИГОТОВЛЕНИЯ (ДОДО-СТИЛЬ), ОТЗЫВЫ И ВОЗВРАТ
// ---------------------------------------------------------------------------
function renderTrackerAndQrSection() {
  const qrSelect = document.getElementById("qr-table-select");
  if (qrSelect) {
    qrSelect.innerHTML = db.state.tables
      .map((t) => `<option value="${t.id}" ${t.id === state.qrTableId ? "selected" : ""}>${t.label} (${t.id})</option>`)
      .join("");
  }

  const container = document.getElementById("live-tracker-container");
  if (!container) return;

  const activeOrder =
    db.state.orders.find((o) => o.table_id === state.qrTableId && o.status !== "cancelled") ||
    db.state.orders[0];

  if (!activeOrder) {
    container.innerHTML = `
      <div class="empty card">
        <div class="title-md">За выбранным столом пока нет активного заказа</div>
        <p class="small">Добавьте блюда из меню или посадите гостей по брони с предоплатой.</p>
      </div>
    `;
    return;
  }

  const items = db.state.order_items.filter((i) => i.order_id === activeOrder.id);
  const remainingToPay = Math.max(0, activeOrder.total - activeOrder.paid_amount);
  const user = db.getCurrentUser();
  const maxBonus =
    user && user.role === "guest"
      ? Math.min(user.bonus_balance, Math.round(remainingToPay * 0.3))
      : 0;

  const stageIdxMap = { accepted: 0, cooking: 1, ready: 2, served: 3 };

  container.innerHTML = `
    <div class="grid grid-2">
      <!-- Левая колонка: Живой трекер каждого блюда (как в Додо Пицце) -->
      <div class="card stack">
        <div class="row between wrap">
          <div>
            <span class="eyebrow">Живой трекер кухни (Real-time KDS)</span>
            <h3 class="title-md">Заказ ${activeOrder.code} · Стол ${activeOrder.table_id}</h3>
          </div>
          <span class="badge ${activeOrder.status === "paid" ? "badge-ok" : "badge-accent"}">
            ${activeOrder.status === "paid" ? "✓ Счёт оплачен" : "Открытый счёт в зале"}
          </span>
        </div>

        <div>
          ${items
            .map((item) => {
              const sIdx = stageIdxMap[item.status] ?? 0;
              const cook = db.state.profiles.find((p) => p.id === item.cook_id);
              const existingRev = db.state.reviews.find((r) => r.order_item_id === item.id);
              const existingCmp = db.state.complaints.find((c) => c.order_item_id === item.id);
              const mods = [
                item.options?.doneness ? `Прожарка: ${item.options.doneness}` : "",
                item.options?.remove?.length ? `Без: ${item.options.remove.join(", ")}` : "",
                item.comment ? `«${item.comment}»` : ""
              ]
                .filter(Boolean)
                .join(" · ");

              return `
                <div class="track-item">
                  <div class="row between wrap">
                    <div>
                      <b>${item.title} × ${item.qty}</b>
                      ${item.refunded ? `<span class="badge badge-bad">Возврат оформлен</span>` : ""}
                      ${mods ? `<div class="xs accent">${mods}</div>` : ""}
                      <div class="xs muted">
                        Повар: ${cook ? cook.full_name : "Шеф-повар"} · Норматив: ${item.norm_min} мин
                      </div>
                    </div>
                    <b>${fmt(item.price * item.qty)}</b>
                  </div>

                  <!-- 4 ступени готовности блюда -->
                  <div class="track-steps">
                    <div class="${sIdx > 0 ? "done" : sIdx === 0 ? "now" : ""}"></div>
                    <div class="${sIdx > 1 ? "done" : sIdx === 1 ? "now" : ""}"></div>
                    <div class="${sIdx > 2 ? "done" : sIdx === 2 ? "now" : ""}"></div>
                    <div class="${sIdx >= 3 ? "done" : ""}"></div>
                  </div>
                  <div class="track-labels">
                    <span class="${sIdx === 0 ? "on" : ""}">1. Принят</span>
                    <span class="${sIdx === 1 ? "on" : ""}">2. Готовится</span>
                    <span class="${sIdx === 2 ? "on" : ""}">3. На раздаче</span>
                    <span class="${sIdx === 3 ? "on" : ""}">4. Подано на стол</span>
                  </div>

                  <!-- Оценка конкретного блюда и кнопка «Проблема с блюдом / Возврат» -->
                  <div class="row wrap mt" style="gap:8px">
                    ${
                      existingRev
                        ? `<span class="badge badge-ok">Ваша оценка блюда: ${"★".repeat(existingRev.rating)}</span>`
                        : `<button type="button" data-rate-item="${item.id}" class="btn btn-xs">
                            ★ Оценить блюдо (1–5)
                          </button>`
                    }
                    ${
                      existingCmp
                        ? `<span class="badge badge-bad">Претензия ${existingCmp.code}: ${existingCmp.status === "open" ? "На рассмотрении менеджера" : "Возврат/бонусы начислены"}</span>`
                        : `<button type="button" data-complain-item="${item.id}" class="btn btn-xs btn-danger">
                            ⚠️ Проблема с блюдом / Возврат
                          </button>`
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <!-- Правая колонка: Электронный чек, зачёт 50% предоплаты, деление счёта и вызов официанта -->
      <div class="card stack">
        <span class="eyebrow">QR-Консьерж за столом и Разделение счёта</span>
        <h3 class="title-md">Управление столом ${activeOrder.table_id}</h3>

        <!-- Быстрые кнопки вызова персонала за стол -->
        <div class="grid grid-2" style="gap:10px">
          <button type="button" id="qr-call-waiter-btn" class="btn">
            🔔 Вызвать официанта
          </button>
          <button type="button" id="qr-request-bill-btn" class="btn">
            🧾 Попросить счёт / терминал
          </button>
        </div>

        <div class="card-flat stack-sm">
          <div class="kv"><span>Сумма заказанных блюд:</span><b>${fmt(activeOrder.subtotal)}</b></div>
          <div class="kv ok"><span>Зачтённая предоплата (депозит брони):</span><b>−${fmt(activeOrder.deposit_applied)}</b></div>
          <div class="kv accent"><span>Списано бонусов лояльности:</span><b>−${fmt(activeOrder.bonus_used)}</b></div>
          <div class="kv"><span>Уже оплачено гостями за столом:</span><b>${fmt(activeOrder.paid_amount)}</b></div>
          <div class="kv total"><span>Остаток к оплате по счёту:</span><span>${fmt(remainingToPay)}</span></div>
        </div>

        ${
          remainingToPay > 0
            ? `<div class="stack">
                <div class="field">
                  <span>Разделить счёт онлайн (выберите способ):</span>
                  <div class="grid grid-3" style="gap:8px">
                    <button type="button" data-split-bill="1" class="btn btn-sm btn-primary">Весь счёт (${fmt(remainingToPay)})</button>
                    <button type="button" data-split-bill="2" class="btn btn-sm">На 2 гостей (${fmt(Math.ceil(remainingToPay / 2))})</button>
                    <button type="button" data-split-bill="4" class="btn btn-sm">На 4 гостей (${fmt(Math.ceil(remainingToPay / 4))})</button>
                  </div>
                </div>

                ${
                  maxBonus > 0
                    ? `<label class="check">
                        <input type="checkbox" id="use-loyalty-bonus-chk" checked />
                        <span>Списать <b>${fmt(maxBonus)}</b> бонусов с моего счёта (доступно ${fmt(user.bonus_balance)})</span>
                      </label>`
                    : ""
                }

                <button type="button" id="pay-table-bill-btn" data-order-id="${activeOrder.id}" data-pay-amount="${remainingToPay}" class="btn btn-accent btn-lg btn-block">
                  Оплатить счёт онлайн · ${fmt(Math.max(0, remainingToPay - maxBonus))} (+5% кэшбэк)
                </button>
              </div>`
            : `<div class="form-ok">
                ✓ Счёт полностью оплачен! Начислен кэшбэк 5% бонусами. Оцените приготовленные блюда слева.
              </div>`
        }
      </div>
    </div>
  `;

  // Привязка кнопок разделения счёта
  let selectedSplit = 1;
  container.querySelectorAll("[data-split-bill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSplit = Number(btn.dataset.splitBill);
      container.querySelectorAll("[data-split-bill]").forEach((b) => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      const partAmount = Math.ceil(remainingToPay / selectedSplit);
      const payBtn = document.getElementById("pay-table-bill-btn");
      if (payBtn) {
        payBtn.dataset.payAmount = partAmount;
        payBtn.textContent = `Оплатить свою долю (1/${selectedSplit}) · ${fmt(partAmount)}`;
      }
    });
  });

  document.getElementById("pay-table-bill-btn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const orderId = btn.dataset.orderId;
    const payAmt = Number(btn.dataset.payAmount || remainingToPay);
    const useBonus = document.getElementById("use-loyalty-bonus-chk")?.checked ? maxBonus : 0;
    await db.payOrderBill({ orderId, amountToPay: payAmt, bonusToUse: useBonus, method: "card" });
    toast(`Оплата ${fmt(Math.max(0, payAmt - useBonus))} прошла успешно! Начислен кэшбэк 5%.`, "ok");
    renderAll();
  });

  document.getElementById("qr-call-waiter-btn")?.addEventListener("click", async () => {
    await db.createServiceCall({ table_id: activeOrder.table_id, type: "waiter" });
    toast(`Официант получил сигнал вызова к Столу ${activeOrder.table_id}!`, "ok");
    renderAll();
  });

  document.getElementById("qr-request-bill-btn")?.addEventListener("click", async () => {
    await db.createServiceCall({ table_id: activeOrder.table_id, type: "bill" });
    toast(`Запрос счёта отправлен официанту (Стол ${activeOrder.table_id})`, "ok");
    renderAll();
  });
}

// ---------------------------------------------------------------------------
// 6. ЛИЧНЫЙ КАБИНЕТ ГОСТЯ И ПРОГРАММА ЛОЯЛЬНОСТИ
// ---------------------------------------------------------------------------
function renderLoyaltySection() {
  const wrap = document.getElementById("loyalty-cabinet-box");
  if (!wrap) return;
  const user = db.getCurrentUser();
  const guest = user && user.role === "guest" ? user : db.state.profiles.find((p) => p.id === "u-guest-demo");
  const history = db.state.loyalty_transactions.filter((t) => t.guest_id === guest.id);

  wrap.innerHTML = `
    <div class="grid grid-2">
      <div class="card stack">
        <div class="row between">
          <div>
            <span class="eyebrow">L'AURUM Prive Club</span>
            <h3 class="title-md">${guest.full_name}</h3>
            <p class="small muted">${guest.phone} · Статус: Gold Guest (Кэшбэк 5%)</p>
          </div>
          <div class="right">
            <span class="xs muted">Бонусный баланс</span>
            <div class="title-lg accent">${fmt(guest.bonus_balance)}</div>
          </div>
        </div>
        <p class="small ink2">
          1 бонус = 1 ₸. Вы можете оплачивать бонусами до 30% от суммы любого счёта в зале, а также получать компенсационные бонусы по гарантии качества блюд.
        </p>
      </div>

      <div class="card stack">
        <div class="bold small">История начислений и списаний бонусов:</div>
        <div class="stack-sm">
          ${history
            .slice(0, 5)
            .map(
              (h) => `
              <div class="kv small">
                <span>${h.reason}</span>
                <b class="${h.amount >= 0 ? "ok" : "bad"}">${h.amount >= 0 ? "+" : ""}${fmt(h.amount)}</b>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 7. ЗАКРЫТАЯ ПАНЕЛЬ ПЕРСОНАЛА (ERP: KDS ПОВАРА, ОФИЦИАНТ/ХОСТЕС, БУХГАЛТЕР, БОСС)
// ---------------------------------------------------------------------------
function renderStaffPortal() {
  const user = db.getCurrentUser();
  if (!user || user.role === "guest") return;

  const userBadge = document.getElementById("staff-active-user");
  if (userBadge) {
    userBadge.innerHTML = `<b>${user.full_name}</b> · <span class="badge badge-accent">${ROLE_LABELS[user.role]}</span>`;
  }

  // Экстренные алерты для персонала (Проблема с блюдом, Вызов официанта, Готовые блюда)
  const alertsWrap = document.getElementById("staff-emergency-alerts");
  if (alertsWrap) {
    const openComplaints = db.state.complaints.filter((c) => c.status === "open");
    const openCalls = db.state.service_calls.filter((c) => c.status === "new");
    const readyItems = db.state.order_items.filter((i) => i.status === "ready");

    alertsWrap.innerHTML = [
      ...openComplaints.map(
        (c) => `
        <div class="alert bad">
          <span>🚨 <b>ЭКСТРЕННЫЙ АЛЕРТ (${c.code}):</b> Проблема с блюдом «${c.dish_title}» за Столом <b>${c.table_id}</b> — ${c.reason} (${fmt(c.amount)})</span>
          <div class="grow"></div>
          <button type="button" data-resolve-cmp="${c.id}" data-res-type="refunded" class="btn btn-xs btn-primary">Вернуть деньги</button>
          <button type="button" data-resolve-cmp="${c.id}" data-res-type="compensated" class="btn btn-xs btn-accent">+20% Бонусами</button>
        </div>`
      ),
      ...openCalls.map(
        (sc) => `
        <div class="alert warn">
          <span>🔔 <b>Сигнал из зала:</b> ${sc.note}</span>
          <div class="grow"></div>
          <button type="button" data-close-call="${sc.id}" class="btn btn-xs btn-primary">Принято (Закрыть)</button>
        </div>`
      ),
      ...readyItems.map(
        (ri) => `
        <div class="alert ok">
          <span>🍽️ <b>Готово на раздаче:</b> «${ri.title}» ×${ri.qty} ждёт подачи на Стол <b>${ri.table_id}</b></span>
          <div class="grow"></div>
          <button type="button" data-kds-status="${ri.id}" data-next="served" class="btn btn-xs btn-primary">Подано гостю ✓</button>
        </div>`
      )
    ].join("");
  }

  // Подсветка активной вкладки сайдбара
  document.querySelectorAll("[data-staff-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.staffTab === state.staffTab);
  });

  const view = document.getElementById("staff-main-content");
  if (!view) return;

  if (state.staffTab === "kds") renderKdsScreen(view);
  else if (state.staffTab === "hall") renderWaiterHostessScreen(view);
  else if (state.staffTab === "finance") renderAccountantScreen(view);
  else renderBossScreen(view);
}

// 7.1 Экран Повара (KDS — Kitchen Display System)
function renderKdsScreen(container) {
  const items = db.state.order_items.filter((i) => i.status !== "cancelled");
  const accepted = items.filter((i) => i.status === "accepted");
  const cooking = items.filter((i) => i.status === "cooking");
  const ready = items.filter((i) => i.status === "ready");

  // Расчёт личного рейтинга и статистики поваров
  const cooks = db.state.profiles.filter((p) => p.role === "cook");
  const cookStats = cooks.map((c) => {
    const revs = db.state.reviews.filter((r) => r.cook_id === c.id);
    const cmps = db.state.complaints.filter((x) => x.cook_id === c.id);
    const avg = revs.length ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(2) : "5.00";
    return { cook: c, avg, revCount: revs.length, cmpCount: cmps.length };
  });

  const renderTicket = (it, nextStatus, btnText) => {
    const elapsedMin = Math.max(1, Math.round((Date.now() - new Date(it.started_at || it.created_at).getTime()) / 60000));
    const isOverdue = elapsedMin > (it.norm_min || 15);
    const cook = db.state.profiles.find((p) => p.id === it.cook_id);
    const mods = [
      it.options?.doneness ? `🔥 Прожарка: ${it.options.doneness}` : "",
      it.options?.remove?.length ? `🚫 Без: ${it.options.remove.join(", ")}` : "",
      it.comment ? `💬 «${it.comment}»` : ""
    ]
      .filter(Boolean)
      .join("<br/>");

    return `
      <div class="ticket ${isOverdue ? "overdue" : ""}">
        <div class="row between">
          <span class="badge badge-dark">Стол ${it.table_id}</span>
          <span class="timer">⏱ ${elapsedMin} / ${it.norm_min} мин ${isOverdue ? "⚠️ ПРОСРОЧКА" : ""}</span>
        </div>
        <div class="bold mt">${it.title} × ${it.qty}</div>
        ${mods ? `<div class="mods">${mods}</div>` : ""}
        <div class="xs muted mt">Ответственный: ${cook ? cook.full_name : "Шеф"}</div>
        <button type="button" data-kds-status="${it.id}" data-next="${nextStatus}" class="btn btn-sm btn-primary btn-block mt">
          ${btnText}
        </button>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="stack">
      <div class="row between wrap">
        <div>
          <span class="eyebrow">Kitchen Display System (KDS)</span>
          <h2 class="title-lg">Экран Повара и Контроль Нормативов</h2>
        </div>
      </div>

      <!-- Личный рейтинг поваров и возвраты -->
      <div class="grid grid-2">
        ${cookStats
          .map(
            (cs) => `
          <div class="card row between">
            <div>
              <b>👨‍🍳 ${cs.cook.full_name}</b>
              <div class="xs muted">Логин: ${cs.cook.login} · Ставка: ${fmt(cs.cook.hourly_rate)}/ч</div>
            </div>
            <div class="right">
              <div class="bold accent">★ ${cs.avg} (${cs.revCount} отз.)</div>
              <div class="xs ${cs.cmpCount > 0 ? "bad" : "ok"}">Возвратов / жалоб: <b>${cs.cmpCount}</b></div>
            </div>
          </div>`
          )
          .join("")}
      </div>

      <!-- 3 колонки KDS -->
      <div class="kds">
        <div class="kds-col">
          <h3><span>1. Новые заказы (Очередь)</span><span class="badge">${accepted.length}</span></h3>
          ${accepted.map((i) => renderTicket(i, "cooking", "Начать готовить →")).join("") || `<div class="xs muted center">Очередь пуста</div>`}
        </div>
        <div class="kds-col">
          <h3><span>2. Готовится на кухне</span><span class="badge badge-warn">${cooking.length}</span></h3>
          ${cooking.map((i) => renderTicket(i, "ready", "Готово — на раздачу →")).join("") || `<div class="xs muted center">Нет блюд на плите</div>`}
        </div>
        <div class="kds-col">
          <h3><span>3. На раздаче (Ждут официанта)</span><span class="badge badge-ok">${ready.length}</span></h3>
          ${ready.map((i) => renderTicket(i, "served", "Подано на стол ✓")).join("") || `<div class="xs muted center">Все готовые блюда поданы</div>`}
        </div>
      </div>

      <!-- Быстрый стоп-лист для повара -->
      <div class="card stack">
        <h3 class="title-md">Управление Стоп-листом кухни (1 клик)</h3>
        <div class="grid grid-3">
          ${db.state.dishes
            .map(
              (d) => `
            <div class="card-flat row between">
              <div>
                <div class="bold small">${d.title}</div>
                <div class="xs muted">${fmt(d.price)} · норматив ${d.cook_time} мин</div>
              </div>
              <button type="button" data-toggle-stock="${d.id}" class="btn btn-xs ${d.in_stock ? "btn-ok" : "btn-danger"}">
                ${d.in_stock ? "В наличии" : "СТОП-ЛИСТ"}
              </button>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

// 7.2 Экран Официанта и Хостес
function renderWaiterHostessScreen(container) {
  container.innerHTML = `
    <div class="stack">
      <div>
        <span class="eyebrow">Hostess & Waiter Terminal</span>
        <h2 class="title-lg">Интерактивная карта зала и Посадка по броням</h2>
      </div>

      <div class="grid grid-2">
        <div class="card stack">
          <div class="bold small">Карта столов в реальном времени (нажмите на стол для деталей):</div>
          <div class="map-scroll">
            <div id="staff-hall-map" class="hall-map"></div>
          </div>
          <div class="legend">
            <span><i style="border-color:var(--ok)"></i>Свободен</span>
            <span><i style="border-color:var(--warn);background:var(--warn-soft)"></i>Бронь с предоплатой</span>
            <span><i style="border-color:var(--ink);background:var(--ink)"></i>Гости за столом</span>
            <span><i style="border-color:var(--bad);background:var(--bad-soft)"></i>Ждёт счёт</span>
          </div>
        </div>

        <div class="card stack">
          <h3 class="title-md">Бронирования с предоплатой на сегодня</h3>
          <div class="stack-sm">
            ${db.state.reservations
              .map(
                (r) => `
              <div class="card-flat stack-sm">
                <div class="row between wrap">
                  <b>${r.code} · Стол ${r.table_id} (${r.visit_time}, ${r.guests_count} перс.)</b>
                  <span class="badge ${r.status === "confirmed" ? "badge-warn" : r.status === "seated" ? "badge-ok" : "badge-bad"}">
                    ${r.status === "confirmed" ? `Депозит ${fmt(r.deposit_amount)} оплачен` : r.status === "seated" ? "Гости посажены (депозит в счёте)" : "Отменена"}
                  </span>
                </div>
                <div class="xs ink2">Гость: <b>${r.guest_name}</b> (${r.guest_phone}) ${r.comment ? `· «${r.comment}»` : ""}</div>
                ${
                  r.preorder?.length
                    ? `<div class="xs accent">Предзаказ (50% оплачено): ${r.preorder.map((p) => `${p.title} ×${p.qty}`).join(", ")}</div>`
                    : ""
                }
                ${
                  r.status === "confirmed"
                    ? `<div class="row wrap">
                        <button type="button" data-seat-res="${r.id}" class="btn btn-xs btn-primary">
                          Посадить гостей за стол (Зачесть ${fmt(r.deposit_amount)} в счёт и отправить предзаказ на KDS)
                        </button>
                      </div>`
                    : ""
                }
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  renderHallMap("staff-hall-map", null, state.resDate, null, true);
}

// 7.3 Модуль Бухгалтера (Транзакции, Возвраты с фото, Техкарты и Фудкост, Зарплата)
function renderAccountantScreen(container) {
  const totalDeposits = db.state.transactions
    .filter((t) => t.type === "deposit")
    .reduce((s, t) => s + t.amount, 0);
  const totalForfeited = db.state.transactions
    .filter((t) => t.type === "deposit_forfeit")
    .reduce((s, t) => s + t.amount, 0);
  const totalRefunds = db.state.transactions
    .filter((t) => t.type === "refund" || t.type === "deposit_refund")
    .reduce((s, t) => s + t.amount, 0);
  const writeOffCost = db.state.write_offs.reduce((s, w) => s + w.cost, 0);

  const staffProfiles = db.state.profiles.filter((p) => p.role !== "guest");

  container.innerHTML = `
    <div class="stack">
      <div>
        <span class="eyebrow">Finance, Inventory & Cost Accounting</span>
        <h2 class="title-lg">Модуль Бухгалтера: Транзакции, Техкарты, Склад и Зарплата</h2>
      </div>

      <div class="grid grid-4">
        <div class="kpi">
          <div class="label">Внесённые предоплаты (депозиты)</div>
          <div class="value">${fmt(totalDeposits)}</div>
          <div class="sub">Засчитываются в счёт визита</div>
        </div>
        <div class="kpi">
          <div class="label">Удержанные депозиты (<24ч)</div>
          <div class="value ok">${fmt(totalForfeited)}</div>
          <div class="sub">Доход при поздней отмене</div>
        </div>
        <div class="kpi">
          <div class="label">Возвраты (блюда и брони ≥24ч)</div>
          <div class="value bad">${fmt(totalRefunds)}</div>
          <div class="sub">Отражено в журнале возвратов</div>
        </div>
        <div class="kpi">
          <div class="label">Себестоимость списаний (Техкарты)</div>
          <div class="value">${fmt(writeOffCost)}</div>
          <div class="sub">Продажи + списание брака</div>
        </div>
      </div>

      <!-- Журнал фото-жалоб гостей и возвратов -->
      <div class="card stack">
        <h3 class="title-md">Журнал претензий «Проблема с блюдом» и Возвратов (с фото-фиксацией)</h3>
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Код / Стол</th>
                <th>Блюдо и Повар</th>
                <th>Причина и описание</th>
                <th>Фото гостя</th>
                <th>Сумма</th>
                <th>Статус / Действие бухгалтера</th>
              </tr>
            </thead>
            <tbody>
              ${db.state.complaints
                .map((c) => {
                  const cook = db.state.profiles.find((p) => p.id === c.cook_id);
                  return `
                    <tr class="${c.status === "open" ? "bad-row" : ""}">
                      <td><b>${c.code}</b><br/><span class="xs muted">Стол ${c.table_id}</span></td>
                      <td><b>${c.dish_title}</b><br/><span class="xs muted">Повар: ${cook ? cook.full_name : "—"}</span></td>
                      <td><b>${c.reason}</b><br/><span class="xs">${c.description || ""}</span></td>
                      <td>
                        <img src="${c.photo_url}" alt="Фото" style="width:56px;height:42px;object-fit:cover;border-radius:8px" />
                      </td>
                      <td><b>${fmt(c.amount)}</b></td>
                      <td>
                        ${
                          c.status === "open"
                            ? `<div class="row wrap">
                                <button type="button" data-resolve-cmp="${c.id}" data-res-type="refunded" class="btn btn-xs btn-danger">Возврат денег</button>
                                <button type="button" data-resolve-cmp="${c.id}" data-res-type="compensated" class="btn btn-xs btn-accent">Бонусы +20%</button>
                              </div>`
                            : `<span class="badge badge-ok">${c.status === "refunded" ? "Возврат оформлен" : "Компенсировано бонусами"} (${fmt(c.resolution_amount)})</span>`
                        }
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Калькуляция себестоимости (Food Cost) по техкартам -->
      <div class="card stack">
        <h3 class="title-md">Себестоимость блюд по Техкартам (Food Cost %) и Маржинальность</h3>
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Блюдо</th>
                <th>Ингредиенты по техкарте (на 1 порцию)</th>
                <th>Цена в меню</th>
                <th>Себестоимость (Food Cost)</th>
                <th>Фудкост %</th>
                <th>Маржа с порции</th>
              </tr>
            </thead>
            <tbody>
              ${db.state.dishes
                .slice(0, 10)
                .map((d) => {
                  const fc = db.getDishFoodCost(d.id);
                  const pct = d.price > 0 ? Math.round((fc.cost / d.price) * 100) : 0;
                  return `
                    <tr>
                      <td><b>${d.title}</b></td>
                      <td class="xs muted">${fc.breakdown.map((b) => `${b.name}: ${b.qty} ${b.unit}`).join(", ") || "—"}</td>
                      <td><b>${fmt(d.price)}</b></td>
                      <td>${fmt(fc.cost)}</td>
                      <td><span class="badge ${pct > 35 ? "badge-warn" : "badge-ok"}">${pct}%</span></td>
                      <td class="ok bold">+${fmt(d.price - fc.cost)}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Складские остатки и Зарплатная ведомость -->
      <div class="grid grid-2">
        <div class="card stack">
          <h3 class="title-md">Складские остатки ингредиентов</h3>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr><th>Ингредиент</th><th>Остаток</th><th>Закуп/ед.</th><th>Пополнить</th></tr>
              </thead>
              <tbody>
                ${db.state.ingredients
                  .slice(0, 10)
                  .map(
                    (ing) => `
                  <tr class="${ing.stock_qty <= ing.min_qty ? "warn-row" : ""}">
                    <td><b>${ing.name}</b></td>
                    <td><b>${ing.stock_qty} ${ing.unit}</b> ${ing.stock_qty <= ing.min_qty ? `<span class="badge badge-bad">Мало</span>` : ""}</td>
                    <td>${fmt(ing.cost_per_unit)}</td>
                    <td><button type="button" data-replenish-ing="${ing.id}" class="btn btn-xs">+5 ${ing.unit}</button></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card stack">
          <h3 class="title-md">Зарплатная ведомость персонала</h3>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr><th>Сотрудник</th><th>Роль</th><th>Часы</th><th>Ставка/ч</th><th>К выплате</th></tr>
              </thead>
              <tbody>
                ${staffProfiles
                  .map((sp) => {
                    const hours = db.state.shifts
                      .filter((sh) => sh.staff_id === sp.id)
                      .reduce((s, sh) => s + Number(sh.hours), 0) || 8;
                    const pay = hours * Number(sp.hourly_rate || 3000);
                    return `
                      <tr>
                        <td><b>${sp.full_name}</b></td>
                        <td><span class="badge">${ROLE_LABELS[sp.role]}</span></td>
                        <td>${hours} ч</td>
                        <td>${fmt(sp.hourly_rate)}</td>
                        <td class="bold">${fmt(pay)}</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 7.4 Дашборд Босса (Владельца): Аналитика, Антирейтинг возвратов, KPI и Создание аккаунтов сотрудников (RBAC)
function renderBossScreen(container) {
  const totalRev = db.state.transactions
    .filter((t) => ["order", "deposit", "deposit_forfeit"].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);
  const occupiedTables = db.state.tables.filter((t) => db.getTableStatus(t.id).state !== "free").length;
  const occupancyPct = Math.round((occupiedTables / db.state.tables.length) * 100);

  // Топ продаваемых блюд и антирейтинг проблемных блюд
  const dishAnalytics = db.state.dishes.map((d) => {
    const soldQty = db.state.order_items
      .filter((i) => i.dish_id === d.id && i.status !== "cancelled")
      .reduce((s, i) => s + i.qty, 0);
    const cmpCount = db.state.complaints.filter((c) => c.dish_id === d.id).length;
    const returnRate = soldQty > 0 ? Math.round((cmpCount / soldQty) * 100) : cmpCount * 100;
    return { dish: d, soldQty, revenue: soldQty * d.price, cmpCount, returnRate };
  });

  const topSelling = [...dishAnalytics].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const problematic = [...dishAnalytics].filter((x) => x.cmpCount > 0 || x.returnRate > 0).sort((a, b) => b.cmpCount - a.cmpCount);

  const staffList = db.state.profiles.filter((p) => p.role !== "guest");

  container.innerHTML = `
    <div class="stack">
      <div class="row between wrap">
        <div>
          <span class="eyebrow">Executive Owner Dashboard & RBAC Admin</span>
          <h2 class="title-lg">Дашборд Босса: Аналитика, KPI и Аккаунты Сотрудников</h2>
        </div>
        <button type="button" id="boss-reset-demo-btn" class="btn btn-sm">
          Сбросить демо-данные БД
        </button>
      </div>

      <!-- KPI Карточки Босса -->
      <div class="grid grid-4">
        <div class="kpi">
          <div class="label">Выручка (касса + депозиты)</div>
          <div class="value">${fmt(totalRev)}</div>
          <div class="sub">В реальном времени</div>
        </div>
        <div class="kpi">
          <div class="label">Средний чек стола</div>
          <div class="value">${fmt(38500)}</div>
          <div class="sub">+14% за счёт предзаказов и Upsell</div>
        </div>
        <div class="kpi">
          <div class="label">Загруженность столов зала</div>
          <div class="value">${occupancyPct}%</div>
          <div class="sub">Занято или в брони: ${occupiedTables} из ${db.state.tables.length}</div>
        </div>
        <div class="kpi">
          <div class="label">Штат сотрудников (RBAC)</div>
          <div class="value">${staffList.length}</div>
          <div class="sub">Саморегистрация закрыта</div>
        </div>
      </div>

      <!-- Топ продаваемых блюд vs Антирейтинг проблемных блюд -->
      <div class="grid grid-2">
        <div class="card stack">
          <h3 class="title-md">🏆 Рейтинг самых продаваемых блюд</h3>
          ${topSelling
            .map(
              (item) => `
            <div class="hbar">
              <div>
                <div class="bold small">${item.dish.title}</div>
                <div class="track"><i style="width:${Math.min(100, Math.max(20, item.soldQty * 35))}%"></i></div>
              </div>
              <div class="right">
                <b>${fmt(item.revenue || item.dish.price)}</b>
                <div class="xs muted">${item.soldQty || 1} порц.</div>
              </div>
            </div>`
            )
            .join("")}
        </div>

        <div class="card stack">
          <h3 class="title-md">⚠️ Антирейтинг «проблемных» блюд (Возвраты / Жалобы)</h3>
          ${
            problematic.length > 0
              ? problematic
                  .map(
                    (item) => `
                <div class="hbar">
                  <div>
                    <div class="bold small bad">${item.dish.title}</div>
                    <div class="track"><i class="bad" style="width:${Math.min(100, item.cmpCount * 45)}%"></i></div>
                  </div>
                  <div class="right">
                    <b class="bad">${item.cmpCount} возврат(а)</b>
                    <div class="xs muted">Брак: ${item.returnRate}%</div>
                  </div>
                </div>`
                  )
                  .join("")
              : `<div class="xs ok">Проблемных блюд с возвратами нет.</div>`
          }
        </div>
      </div>

      <!-- УПРАВЛЕНИЕ ПЕРСОНАЛОМ: СОЗДАНИЕ АККАУНТОВ СОТРУДНИКОВ БОССОМ -->
      <div class="grid grid-2">
        <div class="card stack">
          <span class="eyebrow">Строгий RBAC-контроль</span>
          <h3 class="title-md">Создать аккаунт сотрудника (Доступно только Боссу)</h3>
          <p class="xs muted">
            Самостоятельная регистрация персонала закрыта. Создайте учётную запись, назначьте роль и передайте сотруднику логин и пароль. Все данные сохраняются в таблице <code>profiles</code>.
          </p>
          <form id="boss-create-staff-form" class="stack">
            <div class="grid grid-2" style="gap:10px">
              <label class="field">
                <span>ФИО сотрудника *</span>
                <input type="text" id="st-fullname" required class="input" placeholder="Нурлан Садыков" />
              </label>
              <label class="field">
                <span>Роль в системе (RBAC) *</span>
                <select id="st-role" class="input">
                  <option value="cook">Повар (Экран KDS)</option>
                  <option value="waiter">Официант / Хостес (Карта зала)</option>
                  <option value="accountant">Бухгалтер (Финансы и Склад)</option>
                  <option value="admin">Управляющий / Админ</option>
                </select>
              </label>
            </div>
            <div class="grid grid-3" style="gap:10px">
              <label class="field">
                <span>Логин для входа *</span>
                <input type="text" id="st-login" required class="input" placeholder="waiter2" />
              </label>
              <label class="field">
                <span>Пароль *</span>
                <input type="text" id="st-password" required class="input" placeholder="pass2026" />
              </label>
              <label class="field">
                <span>Часовая ставка (₸/ч) *</span>
                <input type="number" id="st-rate" required value="3200" class="input" />
              </label>
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              + Создать аккаунт сотрудника и сохранить в БД
            </button>
          </form>
        </div>

        <div class="card stack">
          <h3 class="title-md">Действующие аккаунты сотрудников</h3>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr><th>Сотрудник</th><th>Логин / Пароль</th><th>Роль</th><th>Статус</th></tr>
              </thead>
              <tbody>
                ${staffList
                  .map(
                    (s) => `
                  <tr>
                    <td><b>${s.full_name}</b></td>
                    <td class="xs"><code>${s.login}</code> / <code>${s.password_demo || "••••"}</code></td>
                    <td><span class="badge badge-accent">${ROLE_LABELS[s.role]}</span></td>
                    <td>
                      ${
                        s.role === "boss"
                          ? `<span class="badge badge-dark">Владелец</span>`
                          : `<button type="button" data-toggle-staff="${s.id}" class="btn btn-xs ${s.is_active ? "btn-ok" : "btn-danger"}">
                              ${s.is_active ? "Активен" : "Отключён"}
                            </button>`
                      }
                    </td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Добавление нового блюда Владельцем -->
      <div class="card stack">
        <h3 class="title-md">Добавить новое блюдо в меню ресторана</h3>
        <form id="boss-add-dish-form" class="grid grid-4" style="gap:10px;align-items:end">
          <label class="field">
            <span>Название блюда *</span>
            <input type="text" id="new-dish-title" required class="input" placeholder="Утиная грудка Магре" />
          </label>
          <label class="field">
            <span>Категория *</span>
            <select id="new-dish-cat" class="input">
              ${db.state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Цена (₸) *</span>
            <input type="number" id="new-dish-price" required value="9500" class="input" />
          </label>
          <button type="submit" class="btn btn-accent">+ Опубликовать блюдо</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("boss-reset-demo-btn")?.addEventListener("click", () => {
    db.resetDemo();
    toast("Демо-данные базы данных успешно восстановлены!", "ok");
  });

  document.getElementById("boss-create-staff-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const created = await db.createStaffAccount({
        full_name: document.getElementById("st-fullname").value,
        role: document.getElementById("st-role").value,
        login: document.getElementById("st-login").value,
        password: document.getElementById("st-password").value,
        hourly_rate: document.getElementById("st-rate").value
      });
      toast(`Аккаунт сотрудника «${created.full_name}» (логин: ${created.login}) создан и сохранён в БД!`, "ok");
      renderStaffPortal();
    } catch (err) {
      toast(err.message, "bad");
    }
  });

  document.getElementById("boss-add-dish-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = await db.addDish({
      title: document.getElementById("new-dish-title").value,
      category_id: document.getElementById("new-dish-cat").value,
      price: document.getElementById("new-dish-price").value,
      description: "Авторское блюдо от Бренд-шефа L'AURUM.",
      weight: "240 г",
      kcal: 460
    });
    toast(`Блюдо «${d.title}» добавлено в меню!`, "ok");
    renderAll();
  });
}

// ---------------------------------------------------------------------------
// 8. МОДАЛЬНЫЕ ОКНА: РЕГИСТРАЦИЯ ГОСТЯ, ВХОД СОТРУДНИКА, ОТЗЫВ, ЖАЛОБА, SUPABASE
// ---------------------------------------------------------------------------
function openGuestAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (!modal) return;
  modal.hidden = false;
}

function openStaffAuthModal() {
  const modal = document.getElementById("staff-login-modal");
  if (!modal) return;
  modal.hidden = false;
}

function openReviewModal(orderItemId) {
  const item = db.state.order_items.find((i) => i.id === orderItemId);
  if (!item) return;
  state.reviewingItemId = orderItemId;
  const modal = document.getElementById("review-modal");
  const titleEl = document.getElementById("review-dish-title");
  if (titleEl) titleEl.textContent = item.title;
  const tagsWrap = document.getElementById("review-tags-wrap");
  if (tagsWrap) {
    tagsWrap.innerHTML = REVIEW_TAGS.map(
      (t) => `
      <label>
        <input type="checkbox" name="rev-tag" value="${t}" />
        <span>${t}</span>
      </label>`
    ).join("");
  }
  modal.hidden = false;
}

function openComplaintModal(orderItemId) {
  const item = db.state.order_items.find((i) => i.id === orderItemId);
  if (!item) return;
  state.complainingItemId = orderItemId;
  state.complaintPhotoDataUrl = "";
  const modal = document.getElementById("complaint-modal");
  document.getElementById("complaint-dish-title").textContent = `${item.title} (${fmt(item.price * item.qty)})`;
  const sel = document.getElementById("complaint-reason-select");
  if (sel) {
    sel.innerHTML = COMPLAINT_REASONS.map((r) => `<option value="${r}">${r}</option>`).join("");
  }
  modal.hidden = false;
}

export function renderAll() {
  renderHeader();
  renderMenuSection();
  renderCartDrawer();
  renderReservationSection();
  renderTrackerAndQrSection();
  renderLoyaltySection();
  if (state.portal === "staff") {
    renderStaffPortal();
  }
}

export async function initApp() {
  await db.init();
  db.subscribe(() => renderAll());

  // Привязка верхних кнопок
  document.getElementById("header-cart-btn")?.addEventListener("click", () => {
    document.getElementById("cart-drawer-wrap").hidden = false;
  });
  document.getElementById("close-cart-drawer")?.addEventListener("click", () => {
    document.getElementById("cart-drawer-wrap").hidden = true;
  });

  document.getElementById("header-user-btn")?.addEventListener("click", () => {
    openGuestAuthModal();
  });

  document.getElementById("header-portal-toggle")?.addEventListener("click", () => {
    switchPortal(state.portal === "guest" ? "staff" : "guest");
  });

  document.getElementById("open-supabase-modal-btn")?.addEventListener("click", () => {
    const cfg = db.getConfig();
    document.getElementById("sb-url-input").value = cfg.SUPABASE_URL || "";
    document.getElementById("sb-key-input").value = cfg.SUPABASE_ANON_KEY || "";
    document.getElementById("supabase-modal").hidden = false;
  });

  // Закрытие всех модальных окон по крестику
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.closeModal);
      if (target) target.hidden = true;
    });
  });

  // Поиск и сортировка меню
  document.getElementById("menu-search")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderMenuSection();
  });
  document.getElementById("menu-sort")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderMenuSection();
  });

  // Параметры формы бронирования
  const dateIn = document.getElementById("res-date-input");
  if (dateIn) {
    dateIn.value = state.resDate;
    dateIn.addEventListener("change", (e) => {
      state.resDate = e.target.value;
      renderReservationSection();
    });
  }
  document.getElementById("res-time-input")?.addEventListener("change", (e) => {
    state.resTime = e.target.value;
    renderReservationSection();
  });
  document.getElementById("res-guests-input")?.addEventListener("change", (e) => {
    state.resGuests = Number(e.target.value);
    renderReservationSection();
  });
  document.getElementById("res-attach-cart-chk")?.addEventListener("change", (e) => {
    state.attachCartToReservation = e.target.checked;
    renderReservationSection();
  });

  // Отправка формы бронирования с предоплатой 50%
  document.getElementById("booking-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById("res-guest-name").value;
      const phone = document.getElementById("res-guest-phone").value;
      const comment = document.getElementById("res-comment").value;
      const preorder = state.attachCartToReservation ? [...state.cart] : [];

      const created = await db.createReservationWithDeposit({
        guest_name: name,
        guest_phone: phone,
        table_id: state.selectedResTable,
        visit_date: state.resDate,
        visit_time: state.resTime,
        guests_count: state.resGuests,
        comment,
        preorder
      });

      if (state.attachCartToReservation && state.cart.length > 0) {
        state.cart = [];
        saveCart();
      }

      toast(
        `Бронь ${created.code} подтверждена! Предоплата ${fmt(created.deposit_amount)} оплачена и будет 100% зачтена в ваш счёт.`,
        "ok"
      );
      renderAll();
    } catch (err) {
      toast(err.message, "bad");
    }
  });

  // Выбор стола для QR-меню
  document.getElementById("qr-table-select")?.addEventListener("change", (e) => {
    state.qrTableId = e.target.value;
    renderAll();
  });

  // Форма входа/регистрации Гостя (по SMS/WhatsApp или Google/Apple ID)
  document.getElementById("guest-auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("auth-guest-name").value;
    const phone = document.getElementById("auth-guest-phone").value;
    const { user, isNew } = await db.loginOrRegisterGuest({ full_name: name, phone, provider: "sms" });
    document.getElementById("auth-modal").hidden = true;
    toast(
      isNew
        ? `Добро пожаловать, ${user.full_name}! Вам начислено 2 000 ₸ приветственных бонусов.`
        : `С возвращением, ${user.full_name}! Баланс бонусов: ${fmt(user.bonus_balance)}.`,
      "ok"
    );
    renderAll();
  });

  document.querySelectorAll("[data-oauth-login]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.oauthLogin;
      const { user } = await db.loginOrRegisterGuest({
        full_name: `Гость (${provider})`,
        phone: "+7 701 777 88 99",
        provider
      });
      document.getElementById("auth-modal").hidden = true;
      toast(`Вход через ${provider} выполнен! Бонусы: ${fmt(user.bonus_balance)}`, "ok");
      renderAll();
    });
  });

  // Форма входа Сотрудника (RBAC)
  document.getElementById("staff-login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const login = document.getElementById("staff-login-input").value;
      const password = document.getElementById("staff-password-input").value;
      const staff = await db.loginStaff({ login, password });
      document.getElementById("staff-login-modal").hidden = true;
      toast(`Вход выполнен: ${staff.full_name} (${ROLE_LABELS[staff.role]})`, "ok");
      switchPortal("staff");
    } catch (err) {
      toast(err.message, "bad");
    }
  });

  // Быстрый демо-вход под выбранной ролью сотрудника (для удобства тестирования на защите)
  document.querySelectorAll("[data-quick-staff]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const login = btn.dataset.quickStaff;
      const passMap = { boss: "boss123", chef: "chef123", waiter: "waiter123", accountant: "acc123" };
      const staff = await db.loginStaff({ login, password: passMap[login] });
      document.getElementById("staff-login-modal").hidden = true;
      toast(`Активирован терминал роли: ${ROLE_LABELS[staff.role]}`, "ok");
      switchPortal("staff");
    });
  });

  // Отправка оценки блюда (1–5 звёзд + теги)
  let currentStars = 5;
  document.querySelectorAll("[data-star-val]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentStars = Number(btn.dataset.starVal);
      document.querySelectorAll("[data-star-val]").forEach((b) => {
        b.classList.toggle("on", Number(b.dataset.starVal) <= currentStars);
      });
    });
  });

  document.getElementById("review-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tags = [...document.querySelectorAll('input[name="rev-tag"]:checked')].map((i) => i.value);
    const comment = document.getElementById("review-comment").value;
    await db.submitDishReview({
      order_item_id: state.reviewingItemId,
      rating: currentStars,
      tags,
      comment
    });
    document.getElementById("review-modal").hidden = true;
    toast("Спасибо! Ваша оценка блюда учтена в личном рейтинге повара.", "ok");
    renderAll();
  });

  // Загрузка фото проблемы с блюдом
  document.getElementById("complaint-photo-file")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.complaintPhotoDataUrl = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Отправка формы «Проблема с блюдом / Возврат»
  document.getElementById("complaint-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reason = document.getElementById("complaint-reason-select").value;
    const description = document.getElementById("complaint-desc").value;
    const preferred = document.getElementById("complaint-preferred").value;
    const cmp = await db.submitDishComplaint({
      order_item_id: state.complainingItemId,
      reason,
      description,
      photo_url: state.complaintPhotoDataUrl,
      preferred
    });
    document.getElementById("complaint-modal").hidden = true;
    toast(`Обращение ${cmp.code} зарегистрировано! Экстренный сигнал отправлен менеджеру и в бухгалтерию.`, "ok");
    renderAll();
  });

  // Сохранение ключей Supabase из UI
  document.getElementById("supabase-config-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("sb-url-input").value.trim();
    const anonKey = document.getElementById("sb-key-input").value.trim();
    localStorage.setItem("laurum_supabase_override", JSON.stringify({ url, anonKey }));
    document.getElementById("supabase-modal").hidden = true;
    await db.init();
    toast(
      db.mode === "supabase"
        ? "Подключено к облачной БД Supabase PostgreSQL!"
        : "Ключи сохранены (проверьте URL и Anon Key для Live-режима).",
      "ok"
    );
    renderAll();
  });

  // Глобальное делегирование кликов
  document.body.addEventListener("click", async (e) => {
    const catBtn = e.target.closest("[data-cat]");
    if (catBtn) {
      state.category = catBtn.dataset.cat;
      renderMenuSection();
      return;
    }

    const algBtn = e.target.closest("[data-allergen]");
    if (algBtn) {
      const k = algBtn.dataset.allergen;
      if (state.excludedAllergens.has(k)) state.excludedAllergens.delete(k);
      else state.excludedAllergens.add(k);
      renderMenuSection();
      return;
    }

    const dishTrigger = e.target.closest("[data-open-dish]");
    if (dishTrigger) {
      openDishCustomizeModal(dishTrigger.dataset.openDish);
      return;
    }

    const cartDec = e.target.closest("[data-cart-dec]");
    if (cartDec) {
      const idx = state.cart.findIndex((i) => i.uid === cartDec.dataset.cartDec);
      if (idx > -1) {
        if (state.cart[idx].qty > 1) state.cart[idx].qty--;
        else state.cart.splice(idx, 1);
        saveCart();
      }
      return;
    }

    const cartInc = e.target.closest("[data-cart-inc]");
    if (cartInc) {
      const item = state.cart.find((i) => i.uid === cartInc.dataset.cartInc);
      if (item) {
        item.qty++;
        saveCart();
      }
      return;
    }

    const upsellBtn = e.target.closest("[data-quick-upsell]");
    if (upsellBtn) {
      const dish = db.state.dishes.find((d) => d.id === upsellBtn.dataset.quickUpsell);
      if (dish) {
        const p = db.getDishEffectivePrice(dish);
        state.cart.push({
          uid: Date.now() + "-up",
          dish_id: dish.id,
          title: dish.title,
          price: p.price,
          image: dish.image,
          qty: 1,
          options: { remove: [] },
          comment: ""
        });
        saveCart();
        toast(`Рекомендация «${dish.title}» добавлена в корзину`, "ok");
      }
      return;
    }

    const mapTbl = e.target.closest("[data-map-table]");
    if (mapTbl) {
      const tId = mapTbl.dataset.mapTable;
      if (mapTbl.dataset.mapMode === "guest") {
        state.selectedResTable = tId;
        renderReservationSection();
      } else {
        const st = db.getTableStatus(tId);
        toast(`Стол ${tId}: статус «${st.state}»`, "default");
      }
      return;
    }

    const cancelResBtn = e.target.closest("[data-cancel-res]");
    if (cancelResBtn) {
      const resInfo = await db.cancelReservation(cancelResBtn.dataset.cancelRes);
      if (resInfo) {
        toast(
          resInfo.isFullRefund
            ? `Бронь отменена более чем за 24ч: предоплата ${fmt(resInfo.res.refund_amount)} возвращена 100% на карту.`
            : `Поздняя отмена (<24ч): депозит ${fmt(resInfo.res.deposit_amount)} удержан рестораном согласно правилам.`,
          resInfo.isFullRefund ? "ok" : "bad"
        );
        renderAll();
      }
      return;
    }

    const rateBtn = e.target.closest("[data-rate-item]");
    if (rateBtn) {
      openReviewModal(rateBtn.dataset.rateItem);
      return;
    }

    const cmpBtn = e.target.closest("[data-complain-item]");
    if (cmpBtn) {
      openComplaintModal(cmpBtn.dataset.complainItem);
      return;
    }

    const staffTabBtn = e.target.closest("[data-staff-tab]");
    if (staffTabBtn) {
      state.staffTab = staffTabBtn.dataset.staffTab;
      renderStaffPortal();
      return;
    }

    const kdsBtn = e.target.closest("[data-kds-status]");
    if (kdsBtn) {
      const updated = await db.advanceOrderItemStatus(kdsBtn.dataset.kdsStatus, kdsBtn.dataset.next);
      if (updated) {
        toast(`Статус блюда «${updated.title}» (Стол ${updated.table_id}) → ${updated.status}`, "ok");
        renderAll();
      }
      return;
    }

    const stockBtn = e.target.closest("[data-toggle-stock]");
    if (stockBtn) {
      const d = await db.toggleDishStock(stockBtn.dataset.toggleStock);
      if (d) {
        toast(`«${d.title}»: ${d.in_stock ? "Возвращено в меню" : "Переведено в Стоп-лист"}`, "ok");
        renderAll();
      }
      return;
    }

    const seatBtn = e.target.closest("[data-seat-res]");
    if (seatBtn) {
      const ord = await db.seatReservation(seatBtn.dataset.seatRes);
      toast(
        `Гости посажены за Стол ${ord.table_id}! Депозит ${fmt(ord.deposit_applied)} зачтён в счёт, предзаказ передан на KDS.`,
        "ok"
      );
      renderAll();
      return;
    }

    const resCmpBtn = e.target.closest("[data-resolve-cmp]");
    if (resCmpBtn) {
      const cmp = await db.resolveComplaint(resCmpBtn.dataset.resolveCmp, resCmpBtn.dataset.resType);
      if (cmp) {
        toast(`Обращение ${cmp.code} урегулировано (${fmt(cmp.resolution_amount)})`, "ok");
        renderAll();
      }
      return;
    }

    const closeCallBtn = e.target.closest("[data-close-call]");
    if (closeCallBtn) {
      await db.closeServiceCall(closeCallBtn.dataset.closeCall);
      toast("Вызов официанта выполнен", "ok");
      renderAll();
      return;
    }

    const repIngBtn = e.target.closest("[data-replenish-ing]");
    if (repIngBtn) {
      await db.replenishIngredient(repIngBtn.dataset.replenishIng, 5);
      toast("Складской запас пополнен (+5 ед.)", "ok");
      renderAll();
      return;
    }

    const toggleStaffBtn = e.target.closest("[data-toggle-staff]");
    if (toggleStaffBtn) {
      await db.toggleStaffActive(toggleStaffBtn.dataset.toggleStaff);
      renderStaffPortal();
      return;
    }
  });

  renderAll();
}
