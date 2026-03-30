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
  popupOverlay.style.display = "block";
  addonPopup.style.display = "block";
}

function closeAddonPopup()
{
  popupOverlay.style.display = "none";
  addonPopup.style.display = "none";
  addonFormPopup.reset();
  activeDrinkCard = null;
}

function getSelectedAddons()
{
  const checkedAddons = addonFormPopup.querySelectorAll('input[name="addon"]:checked');
  return Array.from(checkedAddons).map((input) => input.value);
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