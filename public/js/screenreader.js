let lastInputWasTab = false;

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
  return (
    element.getAttribute("data-reader") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("alt") ||
    element.innerText ||
    element.placeholder ||
    ""
  ).trim();
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
  if (!lastInputWasTab) return;

  const text = getReadableText(event.target);

  if (text) {
    speak(text);
  }
});