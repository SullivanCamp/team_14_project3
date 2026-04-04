const menuCardRow = document.getElementById("menuCardRow");
const tabButtons = document.querySelectorAll(".tab-btn");
const addonForm = document.getElementById("addonForm");

const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sectionTitle = document.getElementById("sectionTitle");
const noResultMessage = document.getElementById("noResultMessage");

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

function getImagePathByName(itemName) {
  const name = itemName.toLowerCase();

  if (name.includes("mango")) {
    return "/images/boba2.png";
  }

  if (name.includes("milk") || name.includes("boba") || name.includes("tea")) {
    return "/images/boba1.png";
  }

  return "/images/happy-tapi.png";
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
      <button class="drink-image drink-image-button" type="button" aria-label="Customize ${item.name}">
        <img src="${getImagePathByName(item.name)}" alt="${item.name}">
      </button>

      <button class="plus-btn" type="button" aria-label="Add ${item.name}">+</button>

      <h3>${item.name}</h3>
      <p class="desc">Freshly made and ready to customize.</p>
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

function toppingNameToId(name) {
  const toppingMap = {
    Boba: 210,
    Jelly: 224,
    "Oat Milk": 218
  };

  return toppingMap[name] || null;
}

function addItemToCart(drinkCard, addons) {
  const drinkId = Number(drinkCard.dataset.id);
  const drinkName = drinkCard.dataset.name;
  const drinkPrice = Number(drinkCard.dataset.price);

  const toppingObjects = [];

  if (addons && Array.isArray(addons)) {
    addons.forEach((addonName) => {
      const toppingId = toppingNameToId(addonName);

      if (toppingId !== null) {
        toppingObjects.push({
          id: toppingId,
          name: addonName,
          qty: 1
        });
      }
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
    renderMenuItems();
  } catch (error) {
    console.error("Menu load failed:", error);
    menuCardRow.innerHTML = `<p class="no-result">Failed to load menu items.</p>`;
  }
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

loadCartFromStorage();
updateCartCount();
loadMenuFromDatabase();