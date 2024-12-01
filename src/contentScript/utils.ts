export function getCleanTextFromElement(element: HTMLElement) {
  const textContent = element.textContent!;

  return textContent
    .replace(/^\s+|\s+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ");
}
