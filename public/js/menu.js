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
      <button class="drink-image drink-image-button" type="button" aria-label="Customize ${item.name}">
        <img src="${getImagePath(item.item_id)}" alt="${item.name}" onerror="this.src='/images/default.png'">
      </button>

      <button class="plus-btn" type="button" aria-label="Add ${item.name}">+</button>

      <h3>${item.name}</h3>
      <p class="desc">Freshly made and ready to customize.</p>
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

function toppingNameToId(name) {
  const toppingMap = {
    "Boba": 210,
    "Jelly": 224,
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
    renderMenuItems();
  } catch (error) {
    console.error("Menu load failed:", error);
    menuCardRow.innerHTML = `<p class="no-result">Failed to load menu items.</p>`;
  }
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

loadCartFromStorage();
updateCartCount();
loadMenuFromDatabase();
