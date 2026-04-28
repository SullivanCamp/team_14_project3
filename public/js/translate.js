const FALLBACK_TEXT = {
  brandName: "Team 14",
  searchDrinks: "Search drinks...",
  rewards: "Rewards",
  viewCart: "View Cart",
  pageTitleMenu: "Team 14 Menu",
  screenReader: "Enable Screen Reader",
  askTapi:"Ask Tapi!",
  guest: "Guest",
  signedInAs: "Signed in as",
  changeAccount: "Change Account",
  logOut: "Log Out",
  catAll: "All",
  catMilkTea: "Milk Tea",
  catFruitTea: "Fruit Tea",
  catSlushies: "Slushies",
  catDessert: "Dessert",
  catHotDrinks: "Hot Drinks",
  catSeasonal: "Seasonal",
  rewardCheckout: "Rewards",
  rewardCheckoutDesc: "Points Available:",
  rewardCheckoutDeal: "Use 100 pts Free Drink + 1 Topping",
  rewardCheckoutMsg: "Log in or earn 100 points to use this reward.",
  // sectionTitle: "All",
  noItemFound: "No item found.",
  customizeDrink: "Customize Drink",
  sugarLevel: "Sugar Level",
  iceLevel: "Ice Level",
  cancel: "Cancel",
  done: "Done",
  checkout: "Checkout",
  reviewOrder: "Review your order and make any final changes.",
  yourOrder: "Your Order",
  orderSummary: "Order Summary",
  subtotal: "Subtotal",
  tax: "Tax",
  total: "Total",
  placeOrder: "Place Order",
  backToMenu: "Back to Menu"
};

function getTranslatableNodes() {
  const textNodes = [...document.querySelectorAll("[data-i18n]")];
  const placeholderNodes = [...document.querySelectorAll("[data-i18n-placeholder]")];
  return { textNodes, placeholderNodes };
}

async function translatePage(targetLanguage) {
  if (!targetLanguage || targetLanguage === "en") {
    restoreEnglish();
    localStorage.setItem("preferredLanguage", "en");
    return;
  }

  const { textNodes, placeholderNodes } = getTranslatableNodes();

  const textPayload = textNodes.map((node) => {
    const key = node.dataset.i18n;
    return FALLBACK_TEXT[key] || node.textContent.trim();
  });

  const placeholderPayload = placeholderNodes.map((node) => {
    const key = node.dataset.i18nPlaceholder;
    return FALLBACK_TEXT[key] || node.getAttribute("placeholder") || "";
  });

  const allTexts = [...textPayload, ...placeholderPayload];

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: allTexts,
      targetLanguage
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Translate request failed");
  }

  const translated = data.translatedTexts || [];
  let i = 0;

  textNodes.forEach((node) => {
    node.textContent = translated[i++] || node.textContent;
  });

  placeholderNodes.forEach((node) => {
    node.setAttribute("placeholder", translated[i++] || node.getAttribute("placeholder"));
  });

  localStorage.setItem("preferredLanguage", targetLanguage);
}

function restoreEnglish() {
  const { textNodes, placeholderNodes } = getTranslatableNodes();

  textNodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (FALLBACK_TEXT[key]) node.textContent = FALLBACK_TEXT[key];
  });

  placeholderNodes.forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (FALLBACK_TEXT[key]) node.setAttribute("placeholder", FALLBACK_TEXT[key]);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const languageSelect = document.getElementById("languageSelect");
  if (!languageSelect) return;

  const savedLanguage = localStorage.getItem("preferredLanguage") || "en";
  languageSelect.value = savedLanguage;

  try {
    await translatePage(savedLanguage);
  } catch (err) {
    console.error("Initial translation failed:", err);
  }

  languageSelect.addEventListener("change", async (event) => {
    try {
      await translatePage(event.target.value);
    } catch (err) {
      console.error("Language switch failed:", err);
      alert("Could not translate page right now.");
    }
  });
});