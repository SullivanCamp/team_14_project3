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

const cashierModal = document.getElementById("cashierModal");
const cashierModalOverlay = document.getElementById("cashierModalOverlay");
const closeCashierModalBtn = document.getElementById("closeCashierModalBtn");
const cancelCashierModalBtn = document.getElementById("cancelCashierModalBtn");
const addDrinkBtn = document.getElementById("addDrinkBtn");

const modalDrinkName = document.getElementById("modalDrinkName");
const modalDrinkPrice = document.getElementById("modalDrinkPrice");
const drinkQtyInput = document.getElementById("drinkQtyInput");
const sugarSelect = document.getElementById("sugarSelect");
const iceSelect = document.getElementById("iceSelect");
const cashierToppingsGrid = document.getElementById("cashierToppingsGrid");

const customerPhoneInput = document.getElementById("customerPhoneInput");
const findCustomerBtn = document.getElementById("findCustomerBtn");
const clearCustomerBtn = document.getElementById("clearCustomerBtn");
const cashierCustomerName = document.getElementById("cashierCustomerName");
const cashierCustomerPoints = document.getElementById("cashierCustomerPoints");
const cashierCustomerTier = document.getElementById("cashierCustomerTier");

const useFreeDrinkRewardBtn = document.getElementById("useFreeDrinkRewardBtn");
const activeRewardText = document.getElementById("activeRewardText");

const FREE_DRINK_REWARD_COST = 100;

let activeReward = null;

let toppingItems = [];
let currentCategory = "all";
let menuItems = [];
let cashierCart = [];
let activeDrink = null;
let activeCashierCustomer = null;

function updateClock() {
  const now = new Date();
  clockBox.textContent = now.toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();

function renderToppings() {
  cashierToppingsGrid.innerHTML = "";

  toppingItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "cashier-topping-card";

    card.innerHTML = `
      <div class="cashier-topping-info">
        <p class="cashier-topping-name">${item.name}</p>
        <p class="cashier-topping-price">+$${Number(item.price).toFixed(2)}</p>
      </div>

      <div class="cashier-topping-controls">
        <button type="button" class="cashier-topping-btn minus-cashier-addon-btn" data-id="${item.item_id}">-</button>
        <input
          type="number"
          class="cashier-topping-input"
          name="cashierAddonQty"
          data-id="${item.item_id}"
          data-name="${item.name}"
          data-price="${item.price}"
          min="0"
          max="5"
          value="0"
          readonly
        >
        <button type="button" class="cashier-topping-btn plus-cashier-addon-btn" data-id="${item.item_id}">+</button>
      </div>
    `;

    cashierToppingsGrid.appendChild(card);
  });
}

function renderCashierCustomer() {
  if (!activeCashierCustomer) {
    cashierCustomerName.textContent = "Guest";
    cashierCustomerPoints.textContent = "0";
    cashierCustomerTier.textContent = "Standard";

    if (useFreeDrinkRewardBtn) {
      useFreeDrinkRewardBtn.disabled = true;
    }

    return;
  }

  const first = activeCashierCustomer.first_name || "";
  const last = activeCashierCustomer.last_name || "";
  const points = Number(activeCashierCustomer.points || 0);

  cashierCustomerName.textContent = `${first} ${last}`.trim() || "Guest";
  cashierCustomerPoints.textContent = points;
  cashierCustomerTier.textContent = activeCashierCustomer.tier || "Standard";

  if (useFreeDrinkRewardBtn) {
    useFreeDrinkRewardBtn.disabled = points < FREE_DRINK_REWARD_COST || activeReward !== null;
  }
}

async function findCustomerByPhone() {
  const phone = customerPhoneInput.value.trim();

  if (!phone) {
    alert("Please enter a phone number.");
    return;
  }

  try {
    const response = await fetch(`/api/userauth/find-by-phone?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Customer not found.");
    }

    activeCashierCustomer = data.customer;
    renderCashierCustomer();
    alert(`Customer found: ${data.customer.first_name}`);
  } catch (error) {
    console.error("Phone lookup failed:", error);
    activeCashierCustomer = null;
    renderCashierCustomer();
    alert(error.message || "Could not find customer.");
  }
}

function clearCashierCustomer() {
  activeCashierCustomer = null;
  activeReward = null;
  customerPhoneInput.value = "";
  

  if (activeRewardText) {
    activeRewardText.textContent = "No reward applied.";
  }

  cashierCart =[];
  renderCashierCustomer();
  renderCart();
}

function applyFreeDrinkReward() {
  if (!activeCashierCustomer) {
    alert("Find a customer first.");
    return;
  }

  const customerPoints = Number(activeCashierCustomer.points || 0);

  if (customerPoints < FREE_DRINK_REWARD_COST) {
    alert("Customer does not have enough points for this reward.");
    return;
  }

  if (activeReward) {
    alert("A reward is already applied to this order.");
    return;
  }

  activeReward = {
    type: "FREE_DRINK_ONE_TOPPING",
    pointsCost: FREE_DRINK_REWARD_COST,
    label: "Free drink + 1 topping"
  };

  if (activeRewardText) {
    activeRewardText.textContent = "Reward applied: Free drink + 1 topping.";
  }

  renderCashierCustomer();
  renderCart();
}

function getSelectedToppings() {
  const inputs = document.querySelectorAll('input[name="cashierAddonQty"]');
  const toppings = [];

  inputs.forEach((input) => {
    const qty = Number(input.value);

    if (qty > 0) {
      toppings.push({
        id: Number(input.dataset.id),
        name: input.dataset.name,
        qty: qty,
        price: Number(input.dataset.price)
      });
    }
  });

  return toppings;
}

function toppingExtraPrice(toppings) {
  let extra = 0;

  if (!toppings || !Array.isArray(toppings)) {
    return extra;
  }

  toppings.forEach((topping) => {
    extra += Number(topping.price || 0) * Number(topping.qty || 0);
  });

  return extra;
}

function toppingExtraPrice(toppings) {
  let extra = 0;

  if (!toppings || !Array.isArray(toppings)) {
    return extra;
  }

  toppings.forEach((topping) => {
    extra += 0.50 * Number(topping.qty || 0);
  });

  return extra;
}

function sameToppings(a, b) {
  const aa = Array.isArray(a) ? a : [];
  const bb = Array.isArray(b) ? b : [];

  if (aa.length !== bb.length) {
    return false;
  }

  const left = aa
    .map((t) => `${t.id}|${t.name}|${t.qty}`)
    .sort();

  const right = bb
    .map((t) => `${t.id}|${t.name}|${t.qty}`)
    .sort();

  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}

function findMatchingCartItem(newItem) {
  for (let i = 0; i < cashierCart.length; i++) {
    const item = cashierCart[i];

    if (
      Number(item.itemId) === Number(newItem.itemId) &&
      Number(item.sugar) === Number(newItem.sugar) &&
      Number(item.ice) === Number(newItem.ice) &&
      sameToppings(item.toppings, newItem.toppings)
    ) {
      return i;
    }
  }

  return -1;
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

function toppingExtraPrice(toppings) {
  let extra = 0;

  if (!toppings || !Array.isArray(toppings)) {
    return extra;
  }

  toppings.forEach((topping) => {
    extra += Number(topping.price || 0) * Number(topping.qty || 0);
  });

  return extra;
}

function resetModal() {
  drinkQtyInput.value = 1;
  sugarSelect.value = "100";
  iceSelect.value = "100";

  const inputs = document.querySelectorAll('input[name="cashierAddonQty"]');
  inputs.forEach((input) => {
    input.value = 0;
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

function calculateRewardDiscount() {
  if (!activeReward || cashierCart.length === 0) {
    return 0;
  }

  if (activeReward.type !== "FREE_DRINK_ONE_TOPPING") {
    return 0;
  }

  let bestDiscount = 0;

  cashierCart.forEach((item) => {
    const drinkPrice = Number(item.price || 0);

    const toppings = Array.isArray(item.toppings) ? item.toppings : [];
    const oneToppingDiscount = toppings.length > 0
      ? Math.min(...toppings.map((topping) => Number(topping.price || 0)))
      : 0;

    const discount = drinkPrice + oneToppingDiscount;

    if (discount > bestDiscount) {
      bestDiscount = discount;
    }
  });

  return bestDiscount;
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
    const extraPrice = toppingExtraPrice(item.toppings);
    const singlePrice = Number(item.price) + extraPrice;
    const lineTotal = (Number(item.price) + toppingExtraPrice(item.toppings)) * Number(item.qty);

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
  
  const rewardDiscount = calculateRewardDiscount();
  const discountedSubtotal = Math.max(0, subtotal - rewardDiscount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  subtotalValue.textContent = activeReward
    ? `${formatMoney(discountedSubtotal)} after reward`
    : formatMoney(subtotal);
  taxValue.textContent = formatMoney(tax);
  totalValue.textContent = formatMoney(total);
  orderCountBadge.textContent = `${totalItemCount} item${totalItemCount === 1 ? "" : "s"}`;

  saveCashierCart();
}

function addActiveDrinkToOrder() {
  if (!activeDrink) {
    return;
  }

  const quantity = Math.max(1, Number(drinkQtyInput.value) || 1);
  const toppings = getSelectedToppings();

  const newItem = {
    itemId: Number(activeDrink.item_id),
    name: activeDrink.name,
    price: Number(activeDrink.price),
    qty: quantity,
    sugar: Number(sugarSelect.value),
    ice: Number(iceSelect.value),
    toppings: toppings
  };

  const existingIndex = findMatchingCartItem(newItem);

  if (existingIndex >= 0) {
    cashierCart[existingIndex].qty += quantity;
  } else {
    cashierCart.push(newItem);
  }

  renderCart();
  closeCashierModal();
}

async function loadMenu() {
  try {
    const response = await fetch("/menu-data");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load menu");
    }

    menuItems = data.items || [];
    toppingItems = data.toppings || [];

    renderMenu();
    renderToppings();
  } catch (error) {
    console.error("Cashier menu load failed:", error);
    cashierNoResult.style.display = "block";
    cashierNoResult.textContent = "Failed to load menu items.";
  }
}

function clearOrder() {
  cashierCart = [];
  renderCart();
}

async function payNow() {
  if (cashierCart.length === 0) {
    alert("Please add at least one item first.");
    return;
  }

  const rawSubtotal = cashierCart.reduce((sum, item) => {
    return sum + (Number(item.price) + toppingExtraPrice(item.toppings)) * Number(item.qty);
  }, 0);

  const rewardDiscount = calculateRewardDiscount();
  const subtotal = Math.max(0, rawSubtotal - rewardDiscount);

  try {
    const response = await fetch("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeFirstName: "Lam",
        totalPrice: subtotal + (subtotal * TAX_RATE),
        paymentMethod: paymentMethodSelect.value,
        customerId: activeCashierCustomer ? activeCashierCustomer.id : null,
        cart: cashierCart,
        rewardRedemption: activeReward
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to submit order.");
    }

    if (result.rewards) {
      activeCashierCustomer.points = Number(result.rewards.totalPoints || 0);
      activeCashierCustomer.tier = result.rewards.tier || "Standard";

      renderCashierCustomer();

      alert(
        `Order submitted successfully. Order ID: ${result.orderId}\n` +
        `Earned ${result.rewards.earnedPoints} point(s).\n` +
        `New total: ${result.rewards.totalPoints} point(s).`
      );
    } else {
      alert(`Order submitted successfully. Order ID: ${result.orderId}`);
    }

    cashierCart = [];
    renderCart();
  } catch (error) {
    console.error("Pay now failed:", error);
    alert(error.message || "Something went wrong while placing the order.");
  }
}

cashierTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    cashierTabs.forEach((btn) => btn.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.dataset.category;
    renderMenu();
  });
});

cashierSearch.addEventListener("input", renderMenu);
closeCashierModalBtn.addEventListener("click", closeCashierModal);
cancelCashierModalBtn.addEventListener("click", closeCashierModal);
cashierModalOverlay.addEventListener("click", closeCashierModal);
addDrinkBtn.addEventListener("click", addActiveDrinkToOrder);
clearOrderBtn.addEventListener("click", clearOrder);
payNowBtn.addEventListener("click", payNow);
findCustomerBtn.addEventListener("click", findCustomerByPhone);
clearCustomerBtn.addEventListener("click", clearCashierCustomer);
if (useFreeDrinkRewardBtn) {
  useFreeDrinkRewardBtn.addEventListener("click", applyFreeDrinkReward);
}

orderItems.addEventListener("click", (event) => {
  const minusBtn = event.target.closest(".minus-btn");
  const plusBtn = event.target.closest(".plus-qty-btn");
  const removeBtn = event.target.closest(".remove-btn");

  if (minusBtn) {
    const index = Number(minusBtn.dataset.index);
    if (cashierCart[index].qty > 1) {
      cashierCart[index].qty -= 1;
    } else {
      cashierCart.splice(index, 1);
    }
    renderCart();
    return;
  }

  if (plusBtn) {
    const index = Number(plusBtn.dataset.index);
    cashierCart[index].qty += 1;
    renderCart();
    return;
  }

  if (removeBtn) {
    const index = Number(removeBtn.dataset.index);
    cashierCart.splice(index, 1);
    renderCart();
  }
});

loadCashierCart();
renderCart();
loadMenu();

cashierToppingsGrid.addEventListener("click", (event) => {
  const minusBtn = event.target.closest(".minus-cashier-addon-btn");
  const plusBtn = event.target.closest(".plus-cashier-addon-btn");

  if (minusBtn) {
    const input = cashierToppingsGrid.querySelector(`input[data-id="${minusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.max(0, current - 1);
    return;
  }

  if (plusBtn) {
    const input = cashierToppingsGrid.querySelector(`input[data-id="${plusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.min(5, current + 1);
  }
});