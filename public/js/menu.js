const menuCardRow = document.getElementById("menuCardRow");
const tabButtons = document.querySelectorAll(".tab-btn");
const addonForm = document.getElementById("addonForm");

const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sectionTitle = document.getElementById("sectionTitle");
const noResultMessage = document.getElementById("noResultMessage");
const addonOptionsContainer = document.getElementById("addonOptionsContainer");

let toppingItems = [];
let currentCategory = "all";
let cartItems = [];
let menuItems = [];

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
    price: toNumber(topping.price, 0)
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

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cartItems");

  if (!savedCart) {
    cartItems = [];
    return;
  }

  try {
    const parsed = JSON.parse(savedCart);
    cartItems = Array.isArray(parsed)
      ? parsed.map((item, index) => normalizeCartItem(item, index))
      : [];
    saveCartToStorage();
  } catch (error) {
    console.error("Failed to read cart from storage:", error);
    cartItems = [];
    saveCartToStorage();
  }
}

function saveCartToStorage() {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function updateCartCount() {
  const totalCount = cartItems.reduce((sum, item) => sum + Math.max(1, toNumber(item.qty, 1)), 0);
  cartCount.textContent = totalCount;
}

function getImagePath(itemId) {
  return `/images/${itemId}.png`;
}

function renderMenuItems() {
  const searchText = searchInput.value.toLowerCase().trim();
  menuCardRow.innerHTML = "";

  let visibleCount = 0;

  menuItems.forEach((item) => {
    const itemName = item.name.toLowerCase();
    const itemCategory = item.category.toLowerCase();

    const matchCategory =
      currentCategory === "all" || currentCategory === itemCategory;

    const matchSearch = itemName.includes(searchText);

    if (!matchCategory || !matchSearch) {
      return;
    }

    visibleCount++;

    const card = document.createElement("article");
    card.className = "drink-card";
    card.dataset.id = item.item_id;
    card.dataset.name = item.name;
    card.dataset.category = item.category;
    card.dataset.price = item.price;

    card.innerHTML = `
      <div class="drink-image">
        <button class="drink-image-button" type="button" aria-label="Customize ${item.name}">
          <img src="${getImagePath(item.item_id)}" alt="${item.name}" onerror="this.src='/images/default.png'">
        </button>
        <button class="plus-btn" type="button" aria-label="Add ${item.name}">+</button>
      </div>

      <h3>${item.name}</h3>
      <p class="desc">${item.description || "Freshly made and ready to customize."}</p>
      <p class="price">$${Number(item.price).toFixed(2)}</p>
    `;

    menuCardRow.appendChild(card);
  });

  noResultMessage.style.display = visibleCount === 0 ? "block" : "none";
}

function animatePlusButton(button) {
  button.style.transform = "scale(1.2)";
  setTimeout(() => {
    button.style.transform = "scale(1)";
  }, 150);
}

function renderAddonOptions() {
  addonOptionsContainer.innerHTML = "";

  toppingItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "addon-card";

    card.innerHTML = `
      <div class="addon-card-top">
        <div>
          <p class="addon-name">${item.name}</p>
          <p class="addon-price">+$${Number(item.price).toFixed(2)}</p>
        </div>
      </div>

      <div class="addon-qty-controls">
        <button type="button" class="addon-qty-btn minus-addon-btn" data-id="${item.item_id}">-</button>
        <input
          type="number"
          class="addon-qty-input"
          name="addonQty"
          data-id="${item.item_id}"
          data-name="${item.name}"
          data-price="${item.price}"
          min="0"
          max="5"
          value="0"
          readonly
        >
        <button type="button" class="addon-qty-btn plus-addon-btn" data-id="${item.item_id}">+</button>
      </div>
    `;

    addonOptionsContainer.appendChild(card);
  });
}

function addItemToCart(drinkCard, addons) {
  const drinkId = Number(drinkCard.dataset.id);
  const drinkName = drinkCard.dataset.name;
  const drinkPrice = Number(drinkCard.dataset.price);

  const toppingObjects = [];

  if (addons && Array.isArray(addons)) {
    addons.forEach((addon) => {
      toppingObjects.push({
        id: Number(addon.id),
        name: addon.name,
        qty: Number(addon.qty),
        price: Number(addon.price)
      });
    });
  }

  const newItem = normalizeCartItem({
    cartId: createCartId(),
    itemId: drinkId,
    name: drinkName,
    price: drinkPrice,
    qty: 1,
    size: "Regular",
    sugar: 100,
    sweetness: "100%",
    ice: 100,
    iceLabel: "100% Ice",
    toppings: toppingObjects
  });

  cartItems.push(newItem);
  saveCartToStorage();
  updateCartCount();

  const plusButton = drinkCard.querySelector(".plus-btn");
  if (plusButton) {
    animatePlusButton(plusButton);
  }

  console.log("Cart items:", cartItems);
}

async function loadMenuFromDatabase() {
  try {
    const response = await fetch("/menu-data");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load menu.");
    }

    menuItems = data.items || [];
    toppingItems = data.toppings || [];
    renderMenuItems();
    renderAddonOptions();
  } catch (error) {
    console.error("Menu load failed:", error);
    menuCardRow.innerHTML = `<p class="no-result">Failed to load menu items.</p>`;
  }
}

function toppingExtraPrice(toppings) {
  let extra = 0;

  if (!toppings || !Array.isArray(toppings)) {
    return extra;
  }

  toppings.forEach((t) => {
    extra += Number(t.price || 0) * Number(t.qty || 0);
  });

  return extra;
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category;

    if (currentCategory === "all") {
      sectionTitle.textContent = "All";
    } else if (currentCategory === "popular") {
      sectionTitle.textContent = "Most Popular";
    } else if (currentCategory === "seasonal") {
      sectionTitle.textContent = "Seasonal";
    } else {
      sectionTitle.textContent = currentCategory;
    }

    renderMenuItems();
  });
});

searchInput.addEventListener("input", () => {
  renderMenuItems();
});

menuCardRow.addEventListener("click", (event) => {
  const plusButton = event.target.closest(".plus-btn");
  const imageButton = event.target.closest(".drink-image-button");

  if (plusButton) {
    event.stopPropagation();
    const drinkCard = plusButton.closest(".drink-card");
    openAddonPopup(drinkCard);
    return;
  }

  if (imageButton) {
    const drinkCard = imageButton.closest(".drink-card");
    openAddonPopup(drinkCard);
  }
});

addonForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeDrinkCard = getActiveDrinkCard();
  if (!activeDrinkCard) return;

  const selectedAddons = getSelectedAddons();
  addItemToCart(activeDrinkCard, selectedAddons);
  closeAddonPopup();
});

addonOptionsContainer.addEventListener("click", (event) => {
  const minusBtn = event.target.closest(".minus-addon-btn");
  const plusBtn = event.target.closest(".plus-addon-btn");

  if (minusBtn) {
    const input = addonOptionsContainer.querySelector(`input[data-id="${minusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.max(0, current - 1);
    return;
  }

  if (plusBtn) {
    const input = addonOptionsContainer.querySelector(`input[data-id="${plusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.min(5, current + 1);
  }
});

loadCartFromStorage();
updateCartCount();
loadMenuFromDatabase();