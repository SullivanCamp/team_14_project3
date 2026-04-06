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
  popupOverlay.style.display = "block";
  addonPopup.style.display = "block";
}

function closeAddonPopup() {
  if (popupOverlay) popupOverlay.style.display = "none";
  if (addonPopup) addonPopup.style.display = "none";

  if (addonFormPopup) {
    addonFormPopup.reset();
  }

  activeDrinkCard = null;
}

function getSelectedAddons() {
  if (!addonFormPopup) return [];

  const checkedAddons = addonFormPopup.querySelectorAll('input[name="addon"]:checked');

  return Array.from(checkedAddons).map((input) => ({
    inventory_id: Number(input.value),
    name: input.parentElement.textContent.trim()
  }));
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
window.getCustomizationSelections = getCustomizationSelections;
window.getActiveDrinkCard = getActiveDrinkCard;