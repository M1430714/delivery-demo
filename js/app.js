let cartCount = 0;
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const statusMessage = document.querySelector("[data-status-message]");

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-to-cart]");

  if (!button) return;

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

    cartCount = cart.reduce((s, it) => s + it.qty, 0);
    cartCountElements.forEach((el) => (el.textContent = cartCount));
  }

  // 處理加減按鈕（事件代理）
  document.addEventListener("click", (event) => {
    const changeBtn = event.target.closest("[data-change-qty]");
    if (changeBtn) {
      const id = Number(changeBtn.dataset.id);
      const delta = Number(changeBtn.dataset.delta);
      const item = cart.find((c) => c.id === id);
      if (!item) return;
      item.qty = Math.max(0, item.qty + delta);
      // 若數量變為 0，移除該品項
      cart = cart.filter((c) => c.qty > 0);
      renderCart();
    }

    const addBtn = event.target.closest("[data-add-to-cart]");
    if (addBtn) {
      const name = addBtn.dataset.addToCart || "餐點";
      if (statusMessage) statusMessage.textContent = `已加入「${name}」`;
      // 若需要可在此加入實際加入 cart 的邏輯
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

  // 初次渲染
  renderCart();
