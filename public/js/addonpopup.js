const popupOverlay = document.getElementById("popupOverlay");
const addonPopup = document.getElementById("addonPopup");
const popupDrinkName = document.getElementById("popupDrinkName");
const addonFormPopup = document.getElementById("addonForm");
const cancelPopupBtn = document.getElementById("cancelPopupBtn");

const sugarLevelInput = document.getElementById("sugarLevel");
const iceLevelInput = document.getElementById("iceLevel");
const drinkSizeInput = document.getElementById("drinkSize");
const sizePriceAdjustInput = document.getElementById("sizePriceAdjust");
const drinkQtyInput = document.getElementById("drinkQty");
const drinkQtyDisplay = document.getElementById("drinkQtyDisplay");

const minusDrinkQty = document.getElementById("minusDrinkQty");
const plusDrinkQty = document.getElementById("plusDrinkQty");

let activeDrinkCard = null;

function setActiveChoice(buttons, clickedButton) {
  buttons.forEach((btn) => btn.classList.remove("active"));
  clickedButton.classList.add("active");
}

function resetPopupFields() {
  addonFormPopup.reset();

  sugarLevelInput.value = "100";
  iceLevelInput.value = "100";
  drinkSizeInput.value = "Medium";
  sizePriceAdjustInput.value = "0";
  drinkQtyInput.value = "1";
  drinkQtyDisplay.textContent = "1";

  document.querySelectorAll(".sugar-choice").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === "100");
  });

  document.querySelectorAll(".ice-choice").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === "100");
  });

  document.querySelectorAll(".size-choice").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.size === "Medium");
  });

  const addonInputs = addonFormPopup.querySelectorAll('input[name="addonQty"]');
  addonInputs.forEach((input) => {
    input.value = 0;
  });
}

function openAddonPopup(drinkCard) {
  activeDrinkCard = drinkCard;
  popupDrinkName.textContent = "Customize " + drinkCard.dataset.name;
  resetPopupFields();

  popupOverlay.style.display = "block";
  addonPopup.style.display = "block";
}

function closeAddonPopup() {
  popupOverlay.style.display = "none";
  addonPopup.style.display = "none";
  resetPopupFields();
  activeDrinkCard = null;
}

function getSelectedAddons() {
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
  const sugar = Number(sugarLevelInput.value || 100);
  const ice = Number(iceLevelInput.value || 100);
  const size = drinkSizeInput.value || "Medium";
  const sizePriceAdjust = Number(sizePriceAdjustInput.value || 0);
  const qty = Number(drinkQtyInput.value || 1);

  return {
    sugar,
    sweetness: `${sugar}%`,
    ice,
    iceLabel: `${ice}% Ice`,
    size,
    sizePriceAdjust,
    qty
  };
}

function getActiveDrinkCard() {
  return activeDrinkCard;
}

document.querySelectorAll(".sugar-choice").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveChoice(document.querySelectorAll(".sugar-choice"), button);
    sugarLevelInput.value = button.dataset.value;
  });
});

document.querySelectorAll(".ice-choice").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveChoice(document.querySelectorAll(".ice-choice"), button);
    iceLevelInput.value = button.dataset.value;
  });
});

document.querySelectorAll(".size-choice").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveChoice(document.querySelectorAll(".size-choice"), button);
    drinkSizeInput.value = button.dataset.size;
    sizePriceAdjustInput.value = button.dataset.priceAdjust;
  });
});

minusDrinkQty.addEventListener("click", () => {
  const current = Number(drinkQtyInput.value || 1);
  const next = Math.max(1, current - 1);
  drinkQtyInput.value = next;
  drinkQtyDisplay.textContent = next;
});

plusDrinkQty.addEventListener("click", () => {
  const current = Number(drinkQtyInput.value || 1);
  const next = Math.min(10, current + 1);
  drinkQtyInput.value = next;
  drinkQtyDisplay.textContent = next;
});

cancelPopupBtn.addEventListener("click", closeAddonPopup);
popupOverlay.addEventListener("click", closeAddonPopup);

window.openAddonPopup = openAddonPopup;
window.closeAddonPopup = closeAddonPopup;
window.getSelectedAddons = getSelectedAddons;
window.getCustomizationSelections = getCustomizationSelections;
window.getActiveDrinkCard = getActiveDrinkCard;