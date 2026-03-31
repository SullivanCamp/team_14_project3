let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

const taxRate = 0.0825;

const cartList = document.getElementById("cart-list");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const placeOrderBtn = document.getElementById("place-order-btn");

function saveCart()
{
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function renderCart()
{
  cartList.innerHTML = "";

  if (cartItems.length === 0)
  {
    cartList.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    updateSummary();
    return;
  }

  cartItems.forEach((item) =>
  {
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

function increaseQuantity(id)
{
  const item = cartItems.find((cartItem) => cartItem.id === id);

  if (item)
  {
    item.quantity += 1;
    saveCart();
    renderCart();
  }
}

function decreaseQuantity(id)
{
  const item = cartItems.find((cartItem) => cartItem.id === id);

  if (item)
  {
    item.quantity -= 1;

    if (item.quantity <= 0)
    {
      const index = cartItems.findIndex((cartItem) => cartItem.id === id);
      cartItems.splice(index, 1);
    }

    saveCart();
    renderCart();
  }
}

function removeItem(id)
{
  const index = cartItems.findIndex((cartItem) => cartItem.id === id);

  if (index !== -1)
  {
    cartItems.splice(index, 1);
    saveCart();
    renderCart();
  }
}

function updateSummary()
{
  const subtotal = cartItems.reduce((sum, item) =>
  {
    return sum + item.price * item.quantity;
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  taxElement.textContent = `$${tax.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  placeOrderBtn.disabled = cartItems.length === 0;
}

placeOrderBtn.addEventListener("click", () =>
{
  if (cartItems.length === 0)
  {
    alert("Your cart is empty.");
    return;
  }

  alert("Order placed successfully!");
  cartItems = [];
  saveCart();
  renderCart();
});

renderCart();