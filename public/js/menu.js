const cards = document.querySelectorAll(".drink-card");
const plusButtons = document.querySelectorAll(".plus-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const drinkImageButtons = document.querySelectorAll(".drink-image-button");
const addonForm = document.getElementById("addonForm");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const cartCount = document.getElementById("cartCount");
const sectionTitle = document.getElementById("sectionTitle");
const noResultMessage = document.getElementById("noResultMessage");

let currentCategory = "all";
let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
let cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0);

cartCount.textContent = cartTotal;

function saveCart() {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

function updateItems() {
  const searchText = searchInput.value.toLowerCase();
  let visibleCount = 0;

  cards.forEach((card) => {
    const itemName = card.dataset.name.toLowerCase();
    const itemCategory = card.dataset.category.toLowerCase();

    let matchCategory = false;

    if (currentCategory === "all") {
      matchCategory = true;
    } else if (currentCategory === itemCategory) {
      matchCategory = true;
    }

    const matchSearch = itemName.includes(searchText);

    if (matchCategory && matchSearch) {
      card.style.display = "block";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
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

function addItemToCart(drinkCard, addons) {
  const drinkId = Number(drinkCard.dataset.id);
  const drinkName = drinkCard.dataset.name;
  const drinkPrice = Number(drinkCard.dataset.price);

  const size = addons.size || "Medium";
  const sweetness = addons.sweetness || "100%";
  const ice = addons.ice || "Regular Ice";

  const existingItem = cartItems.find((item) => {
    return (
      item.itemId === drinkId &&
      item.size === size &&
      item.sweetness === sweetness &&
      item.ice === ice
    );
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      id: Date.now(),
      itemId: drinkId,
      name: drinkName,
      price: drinkPrice,
      quantity: 1,
      size: size,
      sweetness: sweetness,
      ice: ice
    });
  }

  saveCart();

  cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = cartTotal;

  const plusButton = drinkCard.querySelector(".plus-btn");
  if (plusButton) {
    animatePlusButton(plusButton);
  }

  console.log(cartItems);
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
    } else {
      sectionTitle.textContent = currentCategory;
    }

    updateItems();
  });
});

searchInput.addEventListener("input", () => {
  updateItems();
});

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    searchInput.focus();
  });
}

plusButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const drinkCard = button.closest(".drink-card");
    openAddonPopup(drinkCard);
  });
});

drinkImageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const drinkCard = button.closest(".drink-card");
    openAddonPopup(drinkCard);
  });
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

updateItems();