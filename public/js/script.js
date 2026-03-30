const cartItems = [
  {
    id: 1,
    name: "Classic Milk Tea",
    price: 5.25,
    quantity: 2,
    size: "Large",
    sweetness: "50%",
    ice: "Less Ice"
  },
  {
    id: 2,
    name: "Taro Milk Tea",
    price: 5.75,
    quantity: 1,
    size: "Medium",
    sweetness: "100%",
    ice: "Regular Ice"
  },
  {
    id: 3,
    name: "Brown Sugar Boba",
    price: 6.25,
    quantity: 1,
    size: "Large",
    sweetness: "75%",
    ice: "No Ice"
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
        <p>${item.size} • ${item.sweetness} • ${item.ice}</p>
        <p class="item-price">$${item.price.toFixed(2)} each</p>
      </div>

      <div class="item-controls">
        <button class="qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
      </div>

      <div class="item-total">
        <p>$${(item.price * item.quantity).toFixed(2)}</p>
        <button class="remove-btn" onclick="removeItem(${item.id})">Remove</button>
      </div>
    `;

    cartList.appendChild(itemDiv);
  });

  updateSummary();
}

function increaseQuantity(id) {
  const item = cartItems.find((cartItem) => cartItem.id === id);
  if (item) {
    item.quantity += 1;
    renderCart();
  }
}

function decreaseQuantity(id) {
  const item = cartItems.find((cartItem) => cartItem.id === id);
  if (item) {
    item.quantity -= 1;

    if (item.quantity <= 0) {
      const index = cartItems.findIndex((cartItem) => cartItem.id === id);
      cartItems.splice(index, 1);
    }

    renderCart();
  }
}

function removeItem(id) {
  const index = cartItems.findIndex((cartItem) => cartItem.id === id);
  if (index !== -1) {
    cartItems.splice(index, 1);
    renderCart();
  }
}

function updateSummary() {
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  taxElement.textContent = `$${tax.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  placeOrderBtn.disabled = cartItems.length === 0;
}

placeOrderBtn.addEventListener("click", () => {
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  alert("Order placed successfully!");
});

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

renderCart();