const popupOverlay = document.getElementById("popupOverlay");
const addonPopup = document.getElementById("addonPopup");
const popupDrinkName = document.getElementById("popupDrinkName");
const addonFormPopup = document.getElementById("addonForm");
const cancelPopupBtn = document.getElementById("cancelPopupBtn");

let activeDrinkCard = null;

function openAddonPopup(drinkCard)
{
  activeDrinkCard = drinkCard;
  popupDrinkName.textContent = "Customize " + drinkCard.dataset.name;
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

function getActiveDrinkCard()
{
  return activeDrinkCard;
}

cancelPopupBtn.addEventListener("click", closeAddonPopup);
popupOverlay.addEventListener("click", closeAddonPopup);

window.openAddonPopup = openAddonPopup;
window.closeAddonPopup = closeAddonPopup;
window.getSelectedAddons = getSelectedAddons;
window.getActiveDrinkCard = getActiveDrinkCard;