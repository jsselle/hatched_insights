let INSTANCE: HTMLImageElement;

function getInstance() {
  if (!INSTANCE) {
    const imageUrl = chrome.runtime.getURL("static/icon48.png");
    INSTANCE = document.createElement("img");
    INSTANCE.src = imageUrl;
    INSTANCE.style.position = "absolute";
    INSTANCE.style.zIndex = "1000";
    INSTANCE.style.top = "0";
    INSTANCE.style.right = "0";
    INSTANCE.style.transform = "translate(50%, -50%)";
    INSTANCE.classList.add("hatched-insights-chicken-reader");
  }

  return INSTANCE;
}

export function addImage(targetElement: HTMLElement) {
  const computedStyle = window.getComputedStyle(targetElement);
  if (computedStyle.position === "static") {
    return;
  }

  targetElement.appendChild(getInstance());
}

export function removeImage() {
  const parent = getInstance().parentElement;
  if (parent) {
    getInstance().remove();
  }
}
