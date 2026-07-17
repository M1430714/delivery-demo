// ---------- Cart (購物車) ----------
let cartCount = 0;
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const statusMessage = document.querySelector("[data-status-message]");

// 範例購物車（至少兩項披薩）
let cart = [
  { id: 1, name: "瑪格麗特披薩", price: 250, qty: 1 },
  { id: 2, name: "夏威夷披薩", price: 280, qty: 1 }
];

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

function formatMoney(n) {
  return `NT$${n.toString()}`;
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
    renderCart();
    return;
  }

  const addBtn = event.target.closest("[data-add-to-cart]");
  if (addBtn) {
    const name = addBtn.dataset.addToCart || "餐點";
    if (statusMessage) statusMessage.textContent = `已加入「${name}」`;
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
