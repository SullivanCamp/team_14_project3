let cartItems = [];

const taxRate = 0.0825;

const cartList = document.getElementById("cart-list");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const placeOrderBtn = document.getElementById("place-order-btn");

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
    qty: Math.max(1, toNumber(topping.qty, 1))
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

function toppingsLabel(item) {
  if (!item.toppings || item.toppings.length === 0) {
    return "";
  }

  const names = item.toppings.map((topping) => topping.name).join(", ");
  return `<p class="item-toppings">Add-ons: ${names}</p>`;
}

function calculateSubtotal() {
  return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateSummary() {
  const subtotal = calculateSubtotal();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  taxElement.textContent = `$${tax.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  placeOrderBtn.disabled = cartItems.length === 0;
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

    itemDiv.innerHTML = `
      <div class="item-info">
        <h3>${item.name}</h3>
        <p>${item.size} • ${sugarLabel(item)} • ${iceLabel(item)}</p>
        ${toppingsLabel(item)}
        <p class="item-price">$${item.price.toFixed(2)} each</p>
      </div>

      <div class="item-controls">
        <button class="qty-btn" onclick="decreaseQuantity('${item.cartId}')">-</button>
        <span class="quantity">${item.qty}</span>
        <button class="qty-btn" onclick="increaseQuantity('${item.cartId}')">+</button>
      </div>

      <div class="item-total">
        <p>$${(item.price * item.qty).toFixed(2)}</p>
        <button class="remove-btn" onclick="removeItem('${item.cartId}')">Remove</button>
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

  const subtotal = calculateSubtotal();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const payload = {
    totalPrice: Number(total.toFixed(2)),
    paymentMethod: "Card",
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

    alert(`Order placed successfully. Order ID: ${data.orderId}`);

    cartItems = [];
    saveCart();
    renderCart();
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
window.removeItem = removeItem;

placeOrderBtn.addEventListener("click", placeOrder);

loadCart();
renderCart();