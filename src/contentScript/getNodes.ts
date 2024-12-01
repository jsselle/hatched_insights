import { getCleanTextFromElement } from "./utils";

const IGNORE_ELEMENTS = ["STYLE", "SCRIPT"];

export type SummarizationElementStructure = {
  element: HTMLElement;
  content: string;
  textNodes: ChildNode[];
};

function getTextNodes(node: HTMLElement) {
  const textNodes: ChildNode[] = [];

  function innerCollector(node: HTMLElement | ChildNode) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        textNodes.push(child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        innerCollector(child);
      }
    });
  }

  innerCollector(node);

  return textNodes;
}

function deleteNode(node: Element) {
  node.remove();
}

export function deleteUnneeded(element: HTMLElement) {
  const elementsToDelete = Array.from(
    element.querySelectorAll(`[data-__gtprm]`)
  );

  elementsToDelete.forEach(deleteNode);
}

function getRealContent(element: HTMLElement) {
  markUneededNodes(element);

  const clone = element.cloneNode(true) as HTMLElement;

  deleteUnneeded(clone);

  return getCleanTextFromElement(clone);
}

export function getRelevantNodesForSummarization(
  element: HTMLElement,
  nodes: SummarizationElementStructure[]
) {
  if (IGNORE_ELEMENTS.includes(element.tagName)) {
    return nodes;
  }

  const isUserVisible = element.checkVisibility({
    //@ts-ignore
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true,
    checkOpacity: true,
    checkVisibilityCSS: true,
  });

  if (!isUserVisible) {
    return nodes;
  }

  const trimmedContent = getRealContent(element);

  if (!trimmedContent || trimmedContent.length === 0) {
    return nodes;
  }

  const words = trimmedContent.split(" ");

  if (words.length < 5) {
    return nodes;
  }

  const directChildren = Array.from(
    element.querySelectorAll(":scope > *:not(b):not(a):not(i)")
  ) as HTMLElement[];

  if (directChildren.length === 0) {
    nodes.push({
      element,
      content: trimmedContent,
      textNodes: getTextNodes(element),
    });
    return nodes;
  }

  const ogLength = nodes.length;

  directChildren.map((element) =>
    getRelevantNodesForSummarization(element, nodes)
  );

  if (ogLength === nodes.length) {
    nodes.push({
      element,
      content: trimmedContent,
      textNodes: getTextNodes(element),
    });
  }

  return nodes;
}

export function markUneededNodes(element: HTMLElement) {
  if (IGNORE_ELEMENTS.includes(element.tagName)) {
    element.dataset.__gtprm = "1";
    return;
  }

  const isUserVisible = element.checkVisibility({
    //@ts-ignore
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true,
    checkOpacity: true,
    checkVisibilityCSS: true,
  });

  if (!isUserVisible) {
    element.dataset.__gtprm = "1";
    return;
  }

  const elementChildren = Array.from(
    element.querySelectorAll(":scope > *")
  ) as HTMLElement[];

  elementChildren.forEach(markUneededNodes);
}
