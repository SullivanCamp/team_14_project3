const cartItems = [
  {
    id: 1,
    itemId: 1,
    name: "Classic Milk Tea",
    price: 5.25,
    qty: 2,
    size: "Large",
    sweetness: "50%",
    iceLabel: "Less Ice",
    sugar: 50,
    ice: 50,
    toppings: []
  },
  {
    id: 2,
    itemId: 2,
    name: "Taro Milk Tea",
    price: 5.75,
    qty: 1,
    size: "Medium",
    sweetness: "100%",
    iceLabel: "Regular Ice",
    sugar: 100,
    ice: 100,
    toppings: []
  }
];

const taxRate = 0.0825;

const cartList = document.getElementById("cart-list");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const placeOrderBtn = document.getElementById("place-order-btn");

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
        <p>${item.size} • ${item.sweetness} • ${item.iceLabel}</p>
        <p class="item-price">$${item.price.toFixed(2)} each</p>
      </div>

      <div class="item-controls">
        <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
        <span class="quantity">${item.qty}</span>
        <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
      </div>

      <div class="item-total">
        <p>$${(item.price * item.qty).toFixed(2)}</p>
        <button class="remove-btn" onclick="removeItem(${item.id})">Remove</button>
      </div>
    `;

    cartList.appendChild(itemDiv);
  });

  updateSummary();
}

function increaseQuantity(id) {
  const item = cartItems.find((cartItem) => cartItem.id === id);
  if (!item) return;
  item.qty += 1;
  renderCart();
}

function decreaseQuantity(id) {
  const item = cartItems.find((cartItem) => cartItem.id === id);
  if (!item) return;

  item.qty -= 1;

  if (item.qty <= 0) {
    const index = cartItems.findIndex((cartItem) => cartItem.id === id);
    cartItems.splice(index, 1);
  }

  renderCart();
}

function removeItem(id) {
  const index = cartItems.findIndex((cartItem) => cartItem.id === id);
  if (index !== -1) {
    cartItems.splice(index, 1);
    renderCart();
  }
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

async function placeOrder() {
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const subtotal = calculateSubtotal();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const payload = {
    employeeFirstName: "Kiosk",
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
    console.log("Server response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to place order.");
    }

    alert(`Order placed successfully. Order ID: ${data.orderId}`);

    cartItems.length = 0;
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

placeOrderBtn.addEventListener("click", placeOrder);

renderCart();