const startScreen = document.getElementById("startScreen");
const loginScreen = document.getElementById("loginScreen");
const signupScreen = document.getElementById("signupScreen");
const authMessage = document.getElementById("authMessage");

const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");
const skipBtn = document.getElementById("skipBtn");
const backFromLogin = document.getElementById("backFromLogin");
const backFromSignup = document.getElementById("backFromSignup");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function showPanel(panel) {
  startScreen.classList.remove("active");
  loginScreen.classList.remove("active");
  signupScreen.classList.remove("active");
  panel.classList.add("active");
  authMessage.textContent = "";
}

function saveActiveCustomer(user) {
  localStorage.setItem("activeCustomer", JSON.stringify(user));
}

function goToMenu() {
  window.location.href = "/order";
}

showLoginBtn.addEventListener("click", () => {
  showPanel(loginScreen);
});

showSignupBtn.addEventListener("click", () => {
  showPanel(signupScreen);
});

backFromLogin.addEventListener("click", () => {
  showPanel(startScreen);
});

backFromSignup.addEventListener("click", () => {
  showPanel(startScreen);
});

skipBtn.addEventListener("click", async () => {
  authMessage.textContent = "";

  try {
    const response = await fetch("/api/userauth/skip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!data.success) {
      authMessage.textContent = data.error || "Unable to continue.";
      return;
    }

    saveActiveCustomer(data.user);
    goToMenu();
  } catch (error) {
    console.error(error);
    authMessage.textContent = "Something went wrong. Try again.";
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("/api/userauth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      authMessage.textContent = data.error || "Login failed.";
      return;
    }

    saveActiveCustomer(data.user);
    goToMenu();
  } catch (error) {
    console.error(error);
    authMessage.textContent = "Something went wrong. Try again.";
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";

  const firstName = document.getElementById("signupFirstName").value.trim();
  const lastName = document.getElementById("signupLastName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch("/api/userauth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        password
      })
    });

    const data = await response.json();

    if (!data.success) {
      authMessage.textContent = data.error || "Signup failed.";
      return;
    }

    saveActiveCustomer(data.user);
    goToMenu();
  } catch (error) {
    console.error(error);
    authMessage.textContent = "Something went wrong. Try again.";
  }
});