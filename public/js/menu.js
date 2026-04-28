const menuCardRow = document.getElementById("menuCardRow");
const tabButtons = document.querySelectorAll(".tab-btn");
const addonForm = document.getElementById("addonForm");

const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
// const sectionTitle = document.getElementById("sectionTitle");
const noResultMessage = document.getElementById("noResultMessage");
const addonOptionsContainer = document.getElementById("addonOptionsContainer");

const customerChip = document.getElementById("customerChip");
const customerChipName = document.getElementById("customerChipName");
const customerDropdown = document.getElementById("customerDropdown");
const customerDropdownName = document.getElementById("customerDropdownName");
const switchAccountBtn = document.getElementById("switchAccountBtn");
const logoutBtn = document.getElementById("logoutBtn");

const rewardsPoints = document.getElementById("rewardsPoints");
const rewardsTier = document.getElementById("rewardsTier");

let toppingItems = [];
let currentCategory = "all";
let cartItems = [];
let menuItems = [];
let currentLanguage = localStorage.getItem("preferredLanguage") || "en";

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

function ensureActiveCustomer() {
  const customer = getActiveCustomer();
  return customer;
}

function renderActiveCustomer() {
  const customer = ensureActiveCustomer();
  if (!customer) return;

  const name = customer.first_name || "Guest";
  customerChipName.textContent = name;
  customerDropdownName.textContent = name;
}

function toggleCustomerDropdown() {
  customerDropdown.classList.toggle("open");
}

function closeCustomerDropdown() {
  customerDropdown.classList.remove("open");
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
    const displayName = item.translatedName || item.name;
    const displayDescription = item.translatedDescription || item.description || "Freshly made and ready to customize.";

    const itemName = displayName.toLowerCase();
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
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute(
      "data-reader",
      `${displayName}. ${displayDescription}. Price $${Number(item.price).toFixed(2)}. Select this drink to customize it and add toppings.`
    );
    
    card.dataset.id = item.item_id;
    card.dataset.name = item.name;
    card.dataset.category = item.category;
    card.dataset.price = item.price;

card.dataset.name = displayName;

    card.innerHTML = `
      <div class="drink-image">
        <button class="drink-image-button" type="button" aria-label="Customize ${displayName}">
          <img src="${getImagePath(item.item_id)}" alt="${displayName}" onerror="this.src='/images/default.png'">
        </button>
        <button class="plus-btn" type="button" aria-label="Add ${displayName}">+</button>
      </div>

      <h3>${displayName}</h3>
      <p class="desc">${displayDescription}</p>
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
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "data-reader",
      `${item.name}. Add on price $${Number(item.price).toFixed(2)}. Increase or decrease quantity using plus and minus buttons.`
    );
    card.innerHTML = `
      <div class="addon-card-top">
        <div>
          <p class="addon-name">${item.name}</p>
          <p class="addon-price">+$${Number(item.price).toFixed(2)}</p>
        </div>
      </div>

      <div class="addon-qty-controls">
        <button type="button" class="addon-qty-btn minus-addon-btn" data-id="${item.item_id}" aria-label="Decrease ${item.name} quantity">-</button>
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
          tabindex="-1"
          aria-hidden="true"
        >
        <button type="button" class="addon-qty-btn plus-addon-btn" data-id="${item.item_id}" aria-label="Increase ${item.name} quantity">+</button>
      </div>
    `;

    addonOptionsContainer.appendChild(card);
  });
}

function addItemToCart(drinkCard, addons, customization = {}) {
  const drinkId = Number(drinkCard.dataset.id);
  const drinkName = drinkCard.dataset.name;
  const drinkBasePrice = Number(drinkCard.dataset.price);
  const sizePriceAdjust = Number(customization.sizePriceAdjust || 0);
  const drinkPrice = drinkBasePrice + sizePriceAdjust;

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

  const sugar = toNumber(customization.sugar, 100);
  const ice = toNumber(customization.ice, 100);

  const newItem = normalizeCartItem({
    cartId: createCartId(),
    itemId: drinkId,
    name: drinkName,
    price: drinkPrice,
    qty: Math.max(1, Number(customization.qty || 1)),
    size: customization.size || "Medium",
    sugar: sugar,
    sweetness: customization.sweetness || `${sugar}%`,
    ice: ice,
    iceLabel: customization.iceLabel || `${ice}% Ice`,
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

async function translateMenuItems(items, targetLanguage) {
  if (!Array.isArray(items) || items.length === 0 || targetLanguage === "en") {
    return items.map((item) => ({
      ...item,
      translatedName: item.name,
      translatedDescription: item.description || "Freshly made and ready to customize."
    }));
  }

  const texts = [];
  items.forEach((item) => {
    texts.push(item.name || "");
    texts.push(item.description || "Freshly made and ready to customize.");
  });

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      texts,
      targetLanguage
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to translate menu items.");
  }

  const translatedTexts = data.translatedTexts || [];

  return items.map((item, index) => ({
    ...item,
    translatedName: translatedTexts[index * 2] || item.name,
    translatedDescription:
      translatedTexts[index * 2 + 1] ||
      item.description ||
      "Freshly made and ready to customize."
  }));
}

async function loadMenuFromDatabase() {
  try {
    const response = await fetch("/menu-data");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load menu.");
    }

    const rawItems = data.items || [];
    toppingItems = data.toppings || [];
    menuItems = await translateMenuItems(rawItems, currentLanguage);

    renderMenuItems();
    renderAddonOptions();
  } catch (error) {
    console.error("Menu load failed:", error);
    menuCardRow.innerHTML = `<p class="no-result">Failed to load menu items.</p>`;
  }
}

async function loadRewardsForActiveCustomer() {
  const customer = getActiveCustomer();

  if (!customer || !customer.id) {
    if (rewardsPoints) rewardsPoints.textContent = "0";
    if (rewardsTier) rewardsTier.textContent = "Guest";
    return;
  }

  try {
    const response = await fetch(`/auth/rewards/${customer.id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load rewards.");
    }

    if (rewardsPoints) rewardsPoints.textContent = data.customer.points ?? 0;
    if (rewardsTier) rewardsTier.textContent = data.customer.tier ?? "Standard";

    const updatedCustomer = {
      ...customer,
      points: Number(data.customer.points || 0),
      tier: data.customer.tier || "Standard"
    };

    localStorage.setItem("activeCustomer", JSON.stringify(updatedCustomer));
  } catch (error) {
    console.error("Failed to load customer rewards:", error);
    if (rewardsPoints) rewardsPoints.textContent = "0";
    if (rewardsTier) rewardsTier.textContent = "Standard";
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category;

    const categoryTitles = {
      all: "All",
      "milk-tea": "Milk Tea",
      "fruit-tea": "Fruit Tea",
      slush: "Slushies",
      dessert: "Dessert",
      seasonal: "Seasonal",
      "caffeine-free": "Caffeine Free",
      "hot-drinks": "Hot Drinks"
    };

    // sectionTitle.textContent = categoryTitles[currentCategory] || currentCategory;

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
  const customization = getCustomizationSelections();

  addItemToCart(activeDrinkCard, selectedAddons, customization);
  closeAddonPopup();
});

addonOptionsContainer.addEventListener("click", (event) => {
  const minusBtn = event.target.closest(".minus-addon-btn");
  const plusBtn = event.target.closest(".plus-addon-btn");

  if (minusBtn) {
    const input = addonOptionsContainer.querySelector(`input[data-id="${minusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.max(0, current - 1);
    if (typeof speak === "function") {
      speak(`${input.dataset.name} quantity ${input.value}`);
    }

    return;
  }

  if (plusBtn) {
    const input = addonOptionsContainer.querySelector(`input[data-id="${plusBtn.dataset.id}"]`);
    const current = Number(input.value);
    input.value = Math.min(5, current + 1);
    if (typeof speak === "function") {
      speak(`${input.dataset.name} quantity ${input.value}`);
    }
  }
});

customerChip.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleCustomerDropdown();
});

document.addEventListener("click", () => {
  closeCustomerDropdown();
});

switchAccountBtn.addEventListener("click", () => {
  window.location.href = "/auth";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("activeCustomer");
  localStorage.removeItem("cartItems");
  window.location.href = "/auth";
});

document.addEventListener("keydown", (e) => {
  const popup = document.getElementById("addonPopup");

  if (!popup || popup.style.display !== "block") return;
  if (e.key !== "Tab") return;

  const focusable = popup.querySelectorAll(
    "button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

const languageSelect = document.getElementById("languageSelect");

if (languageSelect) {
  languageSelect.value = currentLanguage;

  languageSelect.addEventListener("change", async (event) => {
    currentLanguage = event.target.value;
    localStorage.setItem("preferredLanguage", currentLanguage);
    await loadMenuFromDatabase();
  });
}

ensureActiveCustomer();
renderActiveCustomer();
loadCartFromStorage();
updateCartCount();
loadMenuFromDatabase();
loadRewardsForActiveCustomer();