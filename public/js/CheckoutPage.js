let cartItems = [];

const taxRate = 0.0825;
const addonPrice = 0.5;

const cartList = document.getElementById("cart-list");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const placeOrderBtn = document.getElementById("place-order-btn");

const checkoutRewardPoints = document.getElementById("checkoutRewardPoints");
const useCheckoutRewardBtn = document.getElementById("useCheckoutRewardBtn");
const checkoutRewardMessage = document.getElementById("checkoutRewardMessage");

const FREE_DRINK_REWARD_COST = 100;

let activeReward = null;
let activeCustomerRewards = null;

function getActiveCustomer() {
  try {
    const raw = localStorage.getItem("activeCustomer");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read active customer:", error);
    return null;
  }
}

async function loadCheckoutRewards() {
  const customer = getActiveCustomer();

  if (!customer || !customer.id) {
    activeCustomerRewards = null;

    if (checkoutRewardPoints) checkoutRewardPoints.textContent = "0";
    if (useCheckoutRewardBtn) useCheckoutRewardBtn.disabled = true;
    if (checkoutRewardMessage) {
      checkoutRewardMessage.textContent = "Log in to use rewards.";
    }

    return;
  }

  try {
    const response = await fetch(`/auth/rewards/${customer.id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load rewards.");
    }

    activeCustomerRewards = data.customer;

    const points = Number(data.customer.points || 0);

    if (checkoutRewardPoints) {
      checkoutRewardPoints.textContent = points;
    }

    if (useCheckoutRewardBtn) {
      useCheckoutRewardBtn.disabled = points < FREE_DRINK_REWARD_COST;
    }

    if (checkoutRewardMessage) {
      checkoutRewardMessage.textContent =
        points >= FREE_DRINK_REWARD_COST
          ? "You can use 100 points for a free drink with one topping."
          : "You need 100 points to use this reward.";
    }
  } catch (error) {
    console.error("Failed to load checkout rewards:", error);

    if (checkoutRewardPoints) checkoutRewardPoints.textContent = "0";
    if (useCheckoutRewardBtn) useCheckoutRewardBtn.disabled = true;
    if (checkoutRewardMessage) {
      checkoutRewardMessage.textContent = "Could not load rewards.";
    }
  }
}

function applyCheckoutReward() {
  if (!activeCustomerRewards) {
    alert("Please log in to use rewards.");
    return;
  }

  const points = Number(activeCustomerRewards.points || 0);

  if (points < FREE_DRINK_REWARD_COST) {
    alert("You do not have enough points for this reward.");
    return;
  }

  if (cartItems.length === 0) {
    alert("Add at least one drink before using a reward.");
    return;
  }

  if (activeReward) {
    activeReward = null;

    if (checkoutRewardMessage) {
      checkoutRewardMessage.textContent = "Reward removed.";
    }

    if (useCheckoutRewardBtn) {
      useCheckoutRewardBtn.textContent = "Use 100 pts = Free Drink + 1 Topping";
    }

    updateSummary();
    return;
  }

  activeReward = {
    type: "FREE_DRINK_ONE_TOPPING",
    pointsCost: FREE_DRINK_REWARD_COST,
    label: "Free drink + 1 topping"
  };

  if (checkoutRewardMessage) {
    checkoutRewardMessage.textContent = "Reward applied: Free drink + 1 topping.";
  }

  if (useCheckoutRewardBtn) {
    useCheckoutRewardBtn.textContent = "Remove Reward";
  }

  updateSummary();
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function percentFromLabel(value, fallback = 100) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return fallback;

  const match = value.match(/\d+/);
  if (!match) return fallback;

  const num = Number(match[0]);
  return Number.isFinite(num) ? num : fallback;
}

function createCartId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToppings(toppings) {
  if (!Array.isArray(toppings)) return [];

  return toppings.map((topping) => ({
    id: toNumber(topping.id, 0),
    name: topping.name || "Addon",
    qty: Math.max(1, toNumber(topping.qty, 1)),
    price: toNumber(topping.price, addonPrice)
  }));
}

function normalizeCartItem(raw, index = 0) {
  const qty = Math.max(1, toNumber(raw.qty ?? raw.quantity, 1));
  const sugar =
    raw.sugar != null ? toNumber(raw.sugar, 100) : percentFromLabel(raw.sweetness, 100);
  const ice =
    raw.ice != null ? toNumber(raw.ice, 100) : percentFromLabel(raw.iceLabel, 100);

  return {
    cartId: raw.cartId || raw.id || createCartId(),
    itemId: toNumber(raw.itemId ?? raw.id, index + 1),
    name: raw.name || "Unnamed Item",
    price: toNumber(raw.price, 0),
    qty,
    size: raw.size || "Regular",
    sugar,
    sweetness: raw.sweetness || `${sugar}%`,
    ice,
    iceLabel: raw.iceLabel || `${ice}% Ice`,
    toppings: normalizeToppings(raw.toppings)
  };
}

function loadCart() {
  const saved = localStorage.getItem("cartItems");

  if (!saved) {
    cartItems = [];
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    cartItems = Array.isArray(parsed)
      ? parsed.map((item, index) => normalizeCartItem(item, index))
      : [];
    saveCart();
  } catch (error) {
    console.error("Failed to read cartItems from storage:", error);
    cartItems = [];
    saveCart();
  }
}

function saveCart() {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function sugarLabel(item) {
  return item.sweetness || `${item.sugar}%`;
}

function iceLabel(item) {
  return item.iceLabel || `${item.ice}% Ice`;
}

function calculateAddonTotalForItem(item) {
  if (!item.toppings || item.toppings.length === 0) {
    return 0;
  }

  const totalAddonQty = item.toppings.reduce(
    (sum, topping) => sum + Math.max(0, toNumber(topping.qty, 0)),
    0
  );

  return totalAddonQty * addonPrice * item.qty;
}

function toppingsLabel(item) {
  if (!item.toppings || item.toppings.length === 0) {
    return `<p class="item-toppings">Add-ons: None</p>`;
  }

  const toppingControls = item.toppings
    .map(
      (topping) => `
        <div class="addon-row">
          <span>${topping.name} ($${addonPrice.toFixed(2)} each)</span>
          <div class="addon-controls">
            <button
              class="qty-btn"
              type="button"
              aria-label="Decrease ${topping.name} quantity"
              onclick="decreaseAddonQuantity('${item.cartId}', '${topping.id}')"
            >
              -
            </button>
            <span class="quantity">${topping.qty}</span>
            <button
              class="qty-btn"
              type="button"
              aria-label="Increase ${topping.name} quantity"
              onclick="increaseAddonQuantity('${item.cartId}', '${topping.id}')"
            >
              +
            </button>
          </div>
        </div>
      `
    )
    .join("");

  return `
    <div class="item-toppings">
      <p>Add-ons:</p>
      ${toppingControls}
    </div>
  `;
}

function calculateSubtotal() {
  return cartItems.reduce((sum, item) => {
    const baseTotal = item.price * item.qty;
    const addonTotal = calculateAddonTotalForItem(item);
    return sum + baseTotal + addonTotal;
  }, 0);
}

function calculateRewardDiscount() {
  if (!activeReward || cartItems.length === 0) {
    return 0;
  }

  if (activeReward.type !== "FREE_DRINK_ONE_TOPPING") {
    return 0;
  }

  let bestDiscount = 0;

  cartItems.forEach((item) => {
    const drinkDiscount = Number(item.price || 0);

    const toppings = Array.isArray(item.toppings) ? item.toppings : [];

    let toppingDiscount = 0;

    if (toppings.length > 0) {
      toppingDiscount = Math.min(
        ...toppings.map((topping) => Number(topping.price || addonPrice))
      );
    }

    const possibleDiscount = drinkDiscount + toppingDiscount;

    if (possibleDiscount > bestDiscount) {
      bestDiscount = possibleDiscount;
    }
  });

  return bestDiscount;
}

function getDiscountedSubtotal() {
  const subtotal = calculateSubtotal();
  const rewardDiscount = calculateRewardDiscount();

  return Math.max(0, subtotal - rewardDiscount);
}

function updateSummary() {
  const subtotal = calculateSubtotal();
  const rewardDiscount = calculateRewardDiscount();
  const discountedSubtotal = Math.max(0, subtotal - rewardDiscount);

  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;

  if (activeReward) {
    subtotalElement.textContent = `$${discountedSubtotal.toFixed(2)} after reward`;
  } else {
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  }

  taxElement.textContent = `$${tax.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  placeOrderBtn.disabled = cartItems.length === 0;
  
  subtotalElement.setAttribute("tabindex", "0");
  subtotalElement.setAttribute("data-reader", `Subtotal $${subtotal.toFixed(2)}.`);

  taxElement.setAttribute("tabindex", "0");
  taxElement.setAttribute("data-reader", `Tax $${tax.toFixed(2)}.`);

  totalElement.setAttribute("tabindex", "0");
  totalElement.setAttribute("data-reader", `Total $${total.toFixed(2)}.`);
}

function renderCart() {
  cartList.innerHTML = "";

  if (cartItems.length === 0) {
    cartList.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    updateSummary();
    return;
  }

  cartItems.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("cart-item");

    let addonText = "";
    if(item.toppings && item.toppings.length > 0) {
      addonText = item.toppings.map((topping) => `${topping.name} x${topping.qty}`).join(", ");
    }
    else{
      addonText = "No add-ons or toppings were added to this item.";
    }

    const baseTotal = item.price * item.qty;
    const addonTotal = calculateAddonTotalForItem(item);
    const lineTotal = baseTotal + addonTotal;
    itemDiv.setAttribute("tabindex", "0");
    itemDiv.setAttribute(
      "data-reader",
      `${item.name}. Quantity ${item.qty}. Size ${item.size}. Sweetness ${sugarLabel(item)}. Ice ${iceLabel(item)}. Add ons: ${addonText}. Line total $${lineTotal.toFixed(2)}.`
    );

    itemDiv.innerHTML = `
      <div class="item-info">
        <h3>${item.name}</h3>
        <p>${item.size} • ${sugarLabel(item)} • ${iceLabel(item)}</p>
        ${toppingsLabel(item)}
        <p class="item-price">$${item.price.toFixed(2)} each</p>
      </div>

      <div class="item-controls">
        <button class="qty-btn" type="button" aria-label="Decrease ${item.name} quantity"onclick="decreaseQuantity('${item.cartId}')">-</button>
        <span class="quantity">${item.qty}</span>
        <button class="qty-btn" type="button" aria-label="Increase ${item.name} quantity" onclick="increaseQuantity('${item.cartId}')">+</button>
      </div>

      <div class="item-total">
        <p>$${lineTotal.toFixed(2)}</p>
        <button class="remove-btn" type="button" aria-label="Remove ${item.name}" onclick="removeItem('${item.cartId}')">Remove</button>
      </div>
    `;

    cartList.appendChild(itemDiv);
  });

  updateSummary();
}

function increaseQuantity(cartId) {
  const item = cartItems.find((cartItem) => cartItem.cartId === cartId);

  if (!item) return;

  item.qty += 1;
  saveCart();
  renderCart();
}

function decreaseQuantity(cartId) {
  const item = cartItems.find((cartItem) => cartItem.cartId === cartId);

  if (!item) return;

  item.qty -= 1;

  if (item.qty <= 0) {
    cartItems = cartItems.filter((cartItem) => cartItem.cartId !== cartId);
  }

  saveCart();
  renderCart();
}

function increaseAddonQuantity(cartId, toppingId) {
  const item = cartItems.find((cartItem) => cartItem.cartId === cartId);

  if (!item || !Array.isArray(item.toppings)) return;

  const topping = item.toppings.find(
    (cartTopping) => String(cartTopping.id) === String(toppingId)
  );

  if (!topping) return;

  topping.qty += 1;
  saveCart();
  renderCart();
}

function decreaseAddonQuantity(cartId, toppingId) {
  const item = cartItems.find((cartItem) => cartItem.cartId === cartId);

  if (!item || !Array.isArray(item.toppings)) return;

  const topping = item.toppings.find(
    (cartTopping) => String(cartTopping.id) === String(toppingId)
  );

  if (!topping) return;

  topping.qty -= 1;

  if (topping.qty <= 0) {
    item.toppings = item.toppings.filter(
      (cartTopping) => String(cartTopping.id) !== String(toppingId)
    );
  }

  saveCart();
  renderCart();
}

function removeItem(cartId) {
  cartItems = cartItems.filter((cartItem) => cartItem.cartId !== cartId);
  saveCart();
  renderCart();
}

async function placeOrder() {
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const subtotal = getDiscountedSubtotal();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const activeCustomer = getActiveCustomer();

  const payload = {
    totalPrice: Number(total.toFixed(2)),
    paymentMethod: "Card",
    customerId: activeCustomer && activeCustomer.id ? Number(activeCustomer.id) : null,
    rewardRedemption: activeReward,
    cart: cartItems.map((item) => ({
      itemId: item.itemId,
      qty: item.qty,
      sugar: item.sugar,
      ice: item.ice,
      toppings: item.toppings || []
    }))
  };

  console.log("Sending payload:", payload);

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to place order.");
    }

    if (data.rewards) {
      alert(
        `Order placed successfully. Order ID: ${data.orderId}\n` +
        `Earned ${data.rewards.earnedPoints} point(s).\n` +
        `New total: ${data.rewards.totalPoints} point(s).`
      );
    } else {
      alert(`Order placed successfully. Order ID: ${data.orderId}`);
    }

    cartItems = [];
    saveCart();
    localStorage.removeItem("cartItems");

    window.location.href = "/customerhome";
  } catch (error) {
    console.error("Order placement error:", error);

    if (error.message.startsWith("Not enough inventory:")) {
      alert(
        "Sorry, your order could not be placed because we are out of some ingredients.\n\n" +
        error.message.replace("Not enough inventory:\n\n", "")
      );
    } else {
      alert(error.message);
    }
  }
}

window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.increaseAddonQuantity = increaseAddonQuantity;
window.decreaseAddonQuantity = decreaseAddonQuantity;
window.removeItem = removeItem;

placeOrderBtn.addEventListener("click", placeOrder);
if (useCheckoutRewardBtn) {
  useCheckoutRewardBtn.addEventListener("click", applyCheckoutReward);
}

loadCart();
renderCart();
loadCheckoutRewards();