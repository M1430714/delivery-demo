// ---------- Cart (購物車) ----------
let cartCount = 0;
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const statusMessage = document.querySelector("[data-status-message]");

// 範例購物車（至少兩項披薩）
// 預設購物車內容（若 localStorage 無資料則使用空陣列）
let cart = [];

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem('cart');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn('loadCartFromStorage error', e);
  }
  return null;
}

function saveCartToStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('saveCartToStorage error', e);
  }
}

// 嘗試從 localStorage 載入購物車（若存在）
const _persisted = loadCartFromStorage();
if (_persisted) cart = _persisted;

const SHIPPING_FEE = 60;

const cartItemsEl = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const shippingEl = document.getElementById("shipping");
const totalEl = document.getElementById("total");
const simulateBtn = document.getElementById("simulate-order");
const cartStatus = document.getElementById("cart-status");

const orderSummaryItemsEl = document.getElementById("order-summary-items");
const orderSummarySubtotalEl = document.getElementById("order-summary-subtotal");
const orderSummaryShippingEl = document.getElementById("order-summary-shipping");
const orderSummaryTotalEl = document.getElementById("order-summary-total");
const menuListEl = document.getElementById("menu-list");

const menuItems = [
  { id: 101, name: "起司薯餅蛋吐司", price: 65, description: "香酥薯餅、滑嫩煎蛋與濃郁起司" },
  { id: 102, name: "玉米鮪魚蛋餅", price: 55, description: "鮪魚、甜玉米與蛋香" },
  { id: 103, name: "蜜汁烤雞腿飯", price: 120, description: "去骨雞腿與白飯、配菜" },
  { id: 104, name: "香煎鯖魚飯", price: 130, description: "鯖魚煎至酥香，搭配時蔬" },
  { id: 105, name: "奶油培根義大利麵", price: 145, description: "培根與蘑菇白醬" },
  { id: 106, name: "番茄肉醬義大利麵", price: 135, description: "慢燉豬肉末與番茄醬" }
];

function formatMoney(n) {
  return `NT$${n.toString()}`;
}

function renderMenu() {
  if (!menuListEl) return;

  menuListEl.innerHTML = "";
  menuItems.forEach((item) => {
    const article = document.createElement("article");
    article.className = "card";
    article.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p><strong>${formatMoney(item.price)}</strong></p>
      <div class="menu-actions">
        <label>
          數量
          <input class="menu-qty" type="number" min="1" step="1" value="1" aria-label="${item.name} 數量" data-menu-qty>
        </label>
        <button class="button" data-add-to-cart data-id="${item.id}" data-price="${item.price}">加入購物車</button>
      </div>
    `;
    menuListEl.appendChild(article);
  });
}

function renderCart() {
  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="meta">
        <strong>${item.name}</strong>
        <small>${formatMoney(item.price)} / 份</small>
      </div>
      <div class="controls">
        <button data-change-qty data-id="${item.id}" data-delta="-1">-</button>
        <span aria-live="polite">${item.qty}</span>
        <button data-change-qty data-id="${item.id}" data-delta="1">+</button>
        <span style="margin-left:12px;">${formatMoney(item.price * item.qty)}</span>
      </div>
    `;
    cartItemsEl.appendChild(li);
  });

  recalcTotals();
  // 也更新訂單摘要（若該頁有顯示）以確保跨頁或同頁面元件同步
  renderOrderSummary();
}

function recalcTotals() {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const shipping = cart.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
  if (shippingEl) shippingEl.textContent = formatMoney(shipping);
  if (totalEl) totalEl.textContent = formatMoney(total);

  if (orderSummarySubtotalEl) orderSummarySubtotalEl.textContent = formatMoney(subtotal);
  if (orderSummaryShippingEl) orderSummaryShippingEl.textContent = formatMoney(shipping);
  if (orderSummaryTotalEl) orderSummaryTotalEl.textContent = formatMoney(total);

  cartCount = cart.reduce((s, it) => s + it.qty, 0);
  cartCountElements.forEach((el) => (el.textContent = cartCount));
}

function renderOrderSummary() {
  if (!orderSummaryItemsEl) return;

  orderSummaryItemsEl.innerHTML = "";
  if (cart.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "cart-item";
    emptyMessage.innerHTML = `<div class="meta"><strong>購物車目前空空如也</strong><small>請到菜單頁新增餐點。</small></div>`;
    orderSummaryItemsEl.appendChild(emptyMessage);
    return;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="meta">
        <strong>${item.name}</strong>
        <small>${formatMoney(item.price)} x ${item.qty}</small>
      </div>
      <div>${formatMoney(item.price * item.qty)}</div>
    `;
    orderSummaryItemsEl.appendChild(li);
  });
  // 更新金額顯示，確保在沒有 cart-items 元素的頁面也會更新小計/運費/總金額
  recalcTotals();
}

// 處理購物車按鈕（事件代理）
document.addEventListener("click", (event) => {
  const changeBtn = event.target.closest("[data-change-qty]");
  if (changeBtn) {
    const id = Number(changeBtn.dataset.id);
    const delta = Number(changeBtn.dataset.delta);
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    cart = cart.filter((c) => c.qty > 0);
    saveCartToStorage();
    renderCart();
    return;
  }

  const addBtn = event.target.closest("[data-add-to-cart]");
  if (addBtn) {
    const id = Number(addBtn.dataset.id);
    const price = Number(addBtn.dataset.price || 0);
    const menuItem = menuItems.find((item) => item.id === id);
    const name = menuItem?.name || "餐點";
    const card = addBtn.closest(".card");
    const qtyInput = card?.querySelector("[data-menu-qty]");
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const existing = cart.find((c) => c.id === id);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id, name, price, qty });
    }

    // 儲存與更新 UI
    saveCartToStorage();
    if (qtyInput) qtyInput.value = 1;
    if (statusMessage) statusMessage.textContent = `已加入 ${qty} 份「${name}」`;
    renderCart();
    renderOrderSummary();
    return;
  }
});

simulateBtn?.addEventListener("click", () => {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  if (cart.length === 0 || subtotal === 0) {
    cartStatus.textContent = "購物車為空，無法下單。";
    return;
  }
  const total = subtotal + SHIPPING_FEE;
  cartStatus.textContent = `模擬下單成功！總金額：${formatMoney(total)}（不會實際付款）`;
});

// 初次渲染購物車
renderCart();
renderOrderSummary();

// 當 localStorage 在其他分頁/視窗變更時，同步更新 cart 與畫面
window.addEventListener('storage', (e) => {
  if (e.key !== 'cart') return;
  try {
    const parsed = JSON.parse(e.newValue || 'null');
    if (Array.isArray(parsed)) {
      cart = parsed;
    } else {
      cart = [];
    }
  } catch (err) {
    cart = [];
  }
  // 重新渲染相關 UI
  renderCart();
  renderOrderSummary();
});

// ---------- Order Progress (訂單進度) ----------
const ORDER_STEPS = [
  '訂單已成立',
  '店家已接單',
  '餐點製作中',
  '商品已轉交給外送員',
  '外送途中',
  '商品已送達',
  '訂單完成'
];

let currentStep = 0; // 0-based index

const orderStepsEl = document.getElementById('order-steps');
const prevStepBtn = document.getElementById('prev-step');
const nextStepBtn = document.getElementById('next-step');
const currentStepLabel = document.getElementById('current-step-label');
const autoAdvanceCheckbox = document.getElementById('auto-advance');
const autoIntervalInput = document.getElementById('auto-advance-interval');
let autoTimer = null;

function renderOrderProgress() {
  if (!orderStepsEl) return;
  orderStepsEl.innerHTML = '';
  ORDER_STEPS.forEach((label, idx) => {
    const li = document.createElement('li');
    li.dataset.step = idx;
    li.className = '';
    if (idx < currentStep) li.classList.add('completed');
    if (idx === currentStep) li.classList.add('active');
    li.innerHTML = `<span class="dot" aria-hidden="true"></span><div><strong>${label}</strong></div>`;
    orderStepsEl.appendChild(li);
  });

  if (currentStepLabel) {
    const autoNote = autoTimer ? '（自動中）' : '';
    currentStepLabel.textContent = `目前：${ORDER_STEPS[currentStep]} ${autoNote}`;
  }
  prevStepBtn.disabled = currentStep <= 0;
  nextStepBtn.disabled = currentStep >= ORDER_STEPS.length - 1;
}

prevStepBtn?.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep -= 1;
    renderOrderProgress();
  }
});

nextStepBtn?.addEventListener('click', () => {
  if (currentStep < ORDER_STEPS.length - 1) {
    currentStep += 1;
    renderOrderProgress();
  }
});

function startAutoAdvance() {
  stopAutoAdvance();
  const secs = Number(autoIntervalInput?.value) || 3;
  autoTimer = setInterval(() => {
    if (currentStep < ORDER_STEPS.length - 1) {
      currentStep += 1;
      renderOrderProgress();
    } else {
      stopAutoAdvance();
    }
  }, secs * 1000);
  renderOrderProgress();
}

function stopAutoAdvance() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    renderOrderProgress();
  }
}

autoAdvanceCheckbox?.addEventListener('change', (e) => {
  if (e.target.checked) startAutoAdvance();
  else stopAutoAdvance();
});

autoIntervalInput?.addEventListener('change', () => {
  if (autoTimer) startAutoAdvance();
});

// 初次渲染進度
renderOrderProgress();
