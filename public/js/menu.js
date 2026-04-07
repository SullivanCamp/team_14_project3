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

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cartItems");

  if (savedCart) {
    try {
      cartItems = JSON.parse(savedCart);
    } catch (error) {
      console.error("Failed to read cart from storage:", error);
      cartItems = [];
    }
  } else {
    cartItems = [];
  }
}

function saveCartToStorage() {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function updateCartCount() {
  let totalCount = 0;

  cartItems.forEach((item) => {
    totalCount += Number(item.qty || 1);
  });

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

    let matchCategory = false;

    if (currentCategory === "all") {
      matchCategory = true;
    } else if (currentCategory === itemCategory) {
      matchCategory = true;
    }

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

  if (visibleCount === 0) {
    noResultMessage.style.display = "block";
  } else {
    noResultMessage.style.display = "none";
  }
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

  cartItems.push({
    itemId: drinkId,
    name: drinkName,
    price: drinkPrice,
    qty: 1,
    sugar: 100,
    ice: 100,
    toppings: toppingObjects
  });

  saveCartToStorage();
  updateCartCount();

  const plusButton = drinkCard.querySelector(".plus-btn");
  if (plusButton) {
    animatePlusButton(plusButton);
  }

  console.log(cartItems);
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
    tabButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
    currentCategory = button.dataset.category;

    if (currentCategory === "all") {
      sectionTitle.textContent = "All";
    } else if (currentCategory === "popular") {
      sectionTitle.textContent = "Most Popular";
    } else if (currentCategory === "seasonal") {
      sectionTitle.textContent = "Seasonal";
    }
    else
    {
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

  if (!activeDrinkCard) {
    return;
  }

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
