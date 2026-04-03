const TAX_RATE = 0.0825;

const cashierSearch = document.getElementById("cashierSearch");
const cashierMenuGrid = document.getElementById("cashierMenuGrid");
const cashierNoResult = document.getElementById("cashierNoResult");
const orderItems = document.getElementById("orderItems");
const emptyOrderMessage = document.getElementById("emptyOrderMessage");
const subtotalValue = document.getElementById("subtotalValue");
const taxValue = document.getElementById("taxValue");
const totalValue = document.getElementById("totalValue");
const orderCountBadge = document.getElementById("orderCountBadge");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const payNowBtn = document.getElementById("payNowBtn");
const paymentMethodSelect = document.getElementById("paymentMethodSelect");
const cashierTabs = document.querySelectorAll(".cashier-tab");
const clockBox = document.getElementById("clockBox");

let currentCategory = "all";
let menuItems = [];
let cashierCart = [];
let activeDrink = null;

function updateClock() {
  const now = new Date();
  clockBox.textContent = now.toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();

function toppingNameToId(name) {
  const toppingMap = {
    "Boba": 210,
    "Jelly": 224,
    "Oat Milk": 218
  };

  return toppingMap[name] || null;
}

function loadCashierCart() {
  const saved = localStorage.getItem("cashierCart");

  if (saved) {
    try {
      cashierCart = JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load cashier cart:", error);
      cashierCart = [];
    }
  }
}

function saveCashierCart() {
  localStorage.setItem("cashierCart", JSON.stringify(cashierCart));
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function getSelectedToppings() {
  const checked = document.querySelectorAll('input[name="cashierAddon"]:checked');
  const toppings = [];

  checked.forEach((input) => {
    const toppingId = toppingNameToId(input.value);

    if (toppingId !== null) {
      toppings.push({
        id: toppingId,
        name: input.value,
        qty: 1
      });
    }
  });

  return toppings;
}

function resetModal() {
  drinkQtyInput.value = 1;
  sugarSelect.value = "100";
  iceSelect.value = "100";

  const checks = document.querySelectorAll('input[name="cashierAddon"]');
  checks.forEach((input) => {
    input.checked = false;
  });
}

function openModalForDrink(item) {
  activeDrink = item;
  modalDrinkName.textContent = item.name;
  modalDrinkPrice.textContent = formatMoney(item.price);
  resetModal();

  cashierModal.style.display = "block";
  cashierModalOverlay.style.display = "block";
}

function closeCashierModal() {
  cashierModal.style.display = "none";
  cashierModalOverlay.style.display = "none";
  activeDrink = null;
}

function renderMenu() {
  const searchText = cashierSearch.value.toLowerCase().trim();
  cashierMenuGrid.innerHTML = "";

  let visibleCount = 0;

  menuItems.forEach((item) => {
    const matchCategory =
      currentCategory === "all" || item.category === currentCategory;

    const matchSearch = item.name.toLowerCase().includes(searchText);

    if (!matchCategory || !matchSearch) {
      return;
    }

    visibleCount++;

    const button = document.createElement("button");
    button.className = "menu-drink-btn";
    button.type = "button";
    button.innerHTML = `
      <h3>${item.name}</h3>
      <p>Fast add for cashier ordering</p>
      <span class="menu-price">${formatMoney(item.price)}</span>
    `;

    button.addEventListener("click", () => {
      openModalForDrink(item);
    });

    cashierMenuGrid.appendChild(button);
  });

  cashierNoResult.style.display = visibleCount === 0 ? "block" : "none";
}

function renderCart() {
  orderItems.innerHTML = "";

  if (cashierCart.length === 0) {
    orderItems.appendChild(emptyOrderMessage);
    emptyOrderMessage.style.display = "block";
  } else {
    emptyOrderMessage.style.display = "none";
  }

  let subtotal = 0;
  let totalItemCount = 0;

  cashierCart.forEach((item, index) => {
    const lineTotal = Number(item.price) * Number(item.qty);
    subtotal += lineTotal;
    totalItemCount += Number(item.qty);

    const toppingText =
      item.toppings && item.toppings.length > 0
        ? item.toppings.map((t) => t.name).join(", ")
        : "No toppings";

    const card = document.createElement("div");
    card.className = "order-item-card";

    card.innerHTML = `
      <div class="order-item-top">
        <div>
          <p class="order-item-name">${item.name}</p>
          <div class="order-item-custom">
            Sugar: ${item.sugar}% | Ice: ${item.ice}%<br>
            ${toppingText}
          </div>
        </div>
        <div class="order-item-price">${formatMoney(lineTotal)}</div>
      </div>

      <div class="order-item-actions">
        <div class="qty-controls">
          <button class="qty-btn minus-btn" type="button" data-index="${index}">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn plus-qty-btn" type="button" data-index="${index}">+</button>
        </div>

        <button class="remove-btn" type="button" data-index="${index}">Remove</button>
      </div>
    `;

    orderItems.appendChild(card);
  });
  
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  subtotalValue.textContent = formatMoney(subtotal);
  taxValue.textContent = formatMoney(tax);
  totalValue.textContent = formatMoney(total);
  orderCountBadge.textContent = `${totalItemCount} item${totalItemCount === 1 ? "" : "s"}`;

  saveCashierCart();
}