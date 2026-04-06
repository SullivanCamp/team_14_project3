const popupOverlay = document.getElementById("popupOverlay");
const addonPopup = document.getElementById("addonPopup");
const popupDrinkName = document.getElementById("popupDrinkName");
const addonFormPopup = document.getElementById("addonForm");
const cancelPopupBtn = document.getElementById("cancelPopupBtn");
const addonOptions = document.getElementById("addonOptions");

let activeDrinkCard = null;
let toppingsData = [];

// Load toppings from backend
async function loadToppings() {
  try {
    const response = await fetch("/addonpopup/toppings");
    const data = await response.json();

    if (data.success) {
      toppingsData = data.toppings;
    } else {
      console.error("Failed to load toppings:", data.error);
      toppingsData = [];
    }
  } catch (error) {
    console.error("Error loading toppings:", error);
    toppingsData = [];
  }
}

// Render toppings into popup
function renderToppings() {
  if (!addonOptions) {
    console.error("addonOptions container not found.");
    return;
  }

  addonOptions.innerHTML = "";

  if (toppingsData.length === 0) {
    addonOptions.innerHTML = "<p>No toppings available.</p>";
    return;
  }

  toppingsData.forEach((topping) => {
    const label = document.createElement("label");
    label.classList.add("addon-option");

    label.innerHTML = `
      <input type="checkbox" name="addon" value="${topping.inventory_id}">
      ${topping.name}
    `;

    addonOptions.appendChild(label);
  });
}

async function openAddonPopup(drinkCard)
{
  activeDrinkCard = drinkCard;
  popupDrinkName.textContent = "Customize " + drinkCard.dataset.name;

  if (toppingsData.length === 0) {
    await loadToppings();
  }

  renderToppings();
  addonFormPopup.reset();

  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  addonInputs.forEach((input) => {
    input.value = 0;
  });

  popupOverlay.style.display = "block";
  addonPopup.style.display = "block";
}

function closeAddonPopup()
{
  popupOverlay.style.display = "none";
  addonPopup.style.display = "none";
  addonFormPopup.reset();

  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  addonInputs.forEach((input) => {
    input.value = 0;
  });

  activeDrinkCard = null;
}

function getSelectedAddons()
{
  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  const selected = [];

  addonInputs.forEach((input) => {
    const qty = Number(input.value);

    if (qty > 0) {
      selected.push({
        id: Number(input.dataset.id),
        name: input.dataset.name,
        qty: qty,
        price: Number(input.dataset.price)
      });
    }
  });

  return selected;
}

function resetAddonQuantities()
{
  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  addonInputs.forEach((input) => {
    input.value = 0;
  });
}

function getActiveDrinkCard() {
  return activeDrinkCard;
}

if (cancelPopupBtn) {
  cancelPopupBtn.addEventListener("click", closeAddonPopup);
}

if (popupOverlay) {
  popupOverlay.addEventListener("click", closeAddonPopup);
}


loadToppings();
window.openAddonPopup = openAddonPopup;
window.closeAddonPopup = closeAddonPopup;
window.getSelectedAddons = getSelectedAddons;
window.getActiveDrinkCard = getActiveDrinkCard;