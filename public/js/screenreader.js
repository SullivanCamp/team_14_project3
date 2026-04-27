let screenReaderEnabled = false;
let lastInputWasTab = false;

const toggleBtn = document.getElementById("screenReaderToggle");

function speak(text) {
  if (!text || typeof responsiveVoice === "undefined") return;

  responsiveVoice.cancel();

  responsiveVoice.speak(text, "US English Female", {
    rate: 0.9,
    pitch: 1,
    volume: 1
  });
}

function getReadableText(element) {
  const ownText = (
    element.getAttribute("data-reader") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("alt") ||
    element.innerText ||
    element.placeholder ||
    ""
  ).trim();

  const section = element.closest(".choice-section, .addon-card, .drink-card");

  let sectionTitle = "";

  if (section) {
    const title = section.querySelector(".choice-header h3, .addon-name, h3");
    if (title && !title.contains(element)) {
      sectionTitle = title.innerText.trim();
    }
  }

  if (sectionTitle && sectionTitle.toLowerCase().includes("drink quantity")) {
    const qtyDisplay = section.querySelector("#qtyDisplay");

    if (qtyDisplay) {
      return `${sectionTitle}. Current quantity ${qtyDisplay.innerText.trim()}. ${ownText}`;
    }
  }

  if (sectionTitle && ownText) {
    return `${sectionTitle}. ${ownText}`;
  }

  return ownText || sectionTitle;
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    screenReaderEnabled = !screenReaderEnabled;

    if (screenReaderEnabled) {
      toggleBtn.innerText = "Disable Screen Reader";
      speak("Screen reader enabled. Use the tab key to navigate the page.");
      toggleBtn.focus();
    } else {
      toggleBtn.innerText = "Enable Screen Reader";
      responsiveVoice.cancel();
    }
  });
}

document.addEventListener("keydown", (event) => {
  lastInputWasTab = event.key === "Tab";
});

document.addEventListener("mousedown", () => {
  lastInputWasTab = false;
});

document.addEventListener("touchstart", () => {
  lastInputWasTab = false;
});

document.addEventListener("focusin", (event) => {
  if (!screenReaderEnabled) return;
  if (!lastInputWasTab) return;

  const text = getReadableText(event.target);

  if (text) {
    speak(text);
  }
});