const FALLBACK_TEXT = {
  pageTitleAuth: "Team 14 Kiosk",
  welcomeTitle: "Welcome In",
  welcomeSubtitle: "Log in for rewards, make an account real quick, or just skip and order.",
  login: "Log In",
  signup: "Sign Up",
  skip: "Skip for Now",
  back: "← Back",
  loginTitle: "Log In",
  labelEmailPhone: "Email or Phone",
  phEmailPhone: "Enter your email or phone",
  labelPassword: "Password",
  phPassword: "Enter your password",
  continue: "Continue to Menu",
  signupTitle: "Create Account",
  labelFirstName: "First Name",
  phFirstName: "First name",
  labelLastName: "Last Name",
  phLastName: "Last name",
  labelEmail: "Email",
  phEmail: "Enter your email",
  labelPhone: "Phone Number",
  phPhone: "Enter your phone number",
  createAccount: "Create Account and Order",

  brandName: "Team 14",
  searchDrinks: "Search drinks...",
  rewards: "Rewards",
  viewCart: "View Cart",
  pageTitleMenu: "Team 14 Menu",
  tapiInit: "How can I help?",
  screenReader: "Enable Screen Reader",
  locationCollegeStation: "College Station, TX",
  askTapi:"Ask Tapi!",
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
  backBtn: "← Back",
  addonPriceNotice: "Each add-on costs $0.50.",
  cartEmpty: "Your cart is empty.",
  eachLabel: "each",
  removeBtn: "Remove",
  noAddons: "No add-ons or toppings were added to this item.",
  done: "Done",
  checkout: "Checkout",
  reviewOrder: "Review your order and make any final changes.",
  yourOrder: "Your Order",
  orderSummary: "Order Summary",
  subtotal: "Subtotal",
  tax: "Tax",
  total: "Total",
  placeOrder: "Place Order",
  backToMenu: "Back to Menu",
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
  const savedLanguage = localStorage.getItem("preferredLanguage") || "en";

  // If we have a dropdown, reflect the saved language
  if (languageSelect) {
    languageSelect.value = savedLanguage;
  }

  // Always apply translation / fallback, even without the dropdown
  try {
    await translatePage(savedLanguage);
  } catch (err) {
    console.error("Initial translation failed:", err);
  }

  // Only wire change handler if the dropdown exists
  if (languageSelect) {
    languageSelect.addEventListener("change", async (event) => {
      try {
        await translatePage(event.target.value);
      } catch (err) {
        console.error("Language switch failed:", err);
        alert("Could not translate page right now.");
      }
    });
  }
});