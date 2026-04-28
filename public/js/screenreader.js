window.screenReaderEnabled = false;
window.keyboardMode = false;

const toggleBtn = document.getElementById("screenReaderToggle");

function speak(text) {
  if (!window.screenReaderEnabled) return;
  if (!window.keyboardMode) return;
  if (!text || typeof responsiveVoice === "undefined") return;

  responsiveVoice.cancel();

  responsiveVoice.speak(text, "US English Female", {
    rate: 0.9,
    pitch: 1,
    volume: 1
  });
}

function speakSystemMessage(text) {
  if (!text || typeof responsiveVoice === "undefined") return;

  responsiveVoice.cancel();

  responsiveVoice.speak(text, "US English Female", {
    rate: 0.9,
    pitch: 1,
    volume: 1
  });
}

function getReadableText(element) {
  if (!element) return "";
  if (element.id === "screenReaderToggle") return "";

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
    const qtyDisplay = section.querySelector("#drinkQtyDisplay");

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
    window.screenReaderEnabled = !window.screenReaderEnabled;

    if (window.screenReaderEnabled) {
      toggleBtn.innerText = "Disable Screen Reader";
      toggleBtn.setAttribute("aria-pressed", "true");

      speakSystemMessage("Screen reader enabled. Use the tab key to navigate the page.");
      toggleBtn.blur();
    } else {
      toggleBtn.innerText = "Enable Screen Reader";
      toggleBtn.setAttribute("aria-pressed", "false");

      window.keyboardMode = false;

      if (typeof responsiveVoice !== "undefined") {
        responsiveVoice.cancel();
      }

      toggleBtn.blur();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    window.keyboardMode = true;
  }
});

["pointerdown", "mousedown", "mouseup", "click", "touchstart"].forEach((type) => {
  document.addEventListener(type, () => {
    window.keyboardMode = false;

    if (typeof responsiveVoice !== "undefined") {
      responsiveVoice.cancel();
    }
  }, true);
});

document.addEventListener("focusin", (event) => {
  if (!window.screenReaderEnabled) return;
  if (!window.keyboardMode) return;
  if (event.target.id === "screenReaderToggle") return;

  const text = getReadableText(event.target);

  if (text) {
    speak(text);
  }
});