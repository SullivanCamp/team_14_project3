const popupOverlay = document.getElementById("popupOverlay");
const addonPopup = document.getElementById("addonPopup");
const popupDrinkName = document.getElementById("popupDrinkName");
const addonFormPopup = document.getElementById("addonForm");
const cancelPopupBtn = document.getElementById("cancelPopupBtn");
const addonOptions = document.getElementById("addonOptions");

const sugarLevelSelect = document.getElementById("sugarLevel");
const iceLevelSelect = document.getElementById("iceLevel");

let activeDrinkCard = null;
let toppingsData = [];

function resetPopupFields() {
  addonFormPopup.reset();

  if (sugarLevelSelect) {
    sugarLevelSelect.value = "100";
  }

  if (iceLevelSelect) {
    iceLevelSelect.value = "100";
  }

  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  addonInputs.forEach((input) => {
    input.value = 0;
  });
}

function openAddonPopup(drinkCard)
{
  activeDrinkCard = drinkCard;
  popupDrinkName.textContent = "Customize " + drinkCard.dataset.name;
  resetPopupFields();

  popupOverlay.style.display = "block";
  addonPopup.style.display = "block";
  setTimeout(() => {
    const firstFocusable = document.querySelector(
      "#addonPopup [tabindex='0'], #addonPopup button, #addonPopup input"
    );

    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, 100);
}

function closeAddonPopup()
{
  popupOverlay.style.display = "none";
  addonPopup.style.display = "none";
  resetPopupFields();
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

function getCustomizationSelections() {
  const sugar = Number(sugarLevelSelect?.value || 100);
  const ice = Number(iceLevelSelect?.value || 100);

  return {
    sugar,
    sweetness: `${sugar}%`,
    ice,
    iceLabel: `${ice}% Ice`
  };
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