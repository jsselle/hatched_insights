import { shouldKeepIt } from "../singletons/keeperAi";
import { ContentScriptMessageNames, InputMessages } from "./messages";
import {
  SummarizationElementStructure,
  markUneededNodes,
  getRelevantNodesForSummarization,
  deleteUnneeded,
} from "./getNodes";
import { getCleanTextFromElement } from "./utils";
import { addImage, removeImage } from "../singletons/imageIcon";

function release() {
  function handler(resolve: (_input: any) => void) {
    setTimeout(resolve, 1);
  }
  return new Promise(handler);
}

function returnLargestElement(prev: HTMLElement, current: HTMLElement) {
  if (prev.textContent!.trim().length > current.textContent!.trim().length) {
    return prev;
  }

  return current;
}

async function getNewText(
  previousText: string,
  elementData: SummarizationElementStructure,
  nextText: string
): Promise<boolean> {
  const should = await shouldKeepIt(
    previousText,
    elementData.content,
    nextText
  );

  return should;
}

function replaceTextContent(newText: string, textNodes: ChildNode[]) {
  const lines = newText.split("\n");

  textNodes.forEach((textNode, index) => {
    if (index < lines.length) {
      textNode.textContent = lines[index];
    } else {
      textNode.parentNode?.removeChild(textNode);
    }
  });

  const lastNode = textNodes[textNodes.length - 1];
  if (lines.length > textNodes.length && lastNode) {
    const parent = lastNode.parentNode;
    const nextSibling = lastNode.nextSibling;
    for (let i = textNodes.length; i < lines.length; i++) {
      const newTextNode = document.createTextNode(lines[i]);
      parent?.insertBefore(newTextNode, nextSibling);
    }
  }
}

async function articleTreeReducer(
  prev: Promise<SummarizationElementStructure[]>,
  entry: SummarizationElementStructure,
  index: number,
  array: SummarizationElementStructure[]
) {
  const acum = await prev;

  const { element, content, textNodes } = entry;

  addImage(element);

  let previousText = "";
  let nextText = "";

  if (index > 0) {
    let prevIndex = index - 1;
    do {
      const { content } = acum.at(prevIndex)!;
      previousText = ` ${content}${previousText}`;

      prevIndex--;
    } while (prevIndex > 0 && previousText.split(" ").length < 500);
  }

  const arrLength = array.length - 1;
  if (index < arrLength) {
    let nextIndex = index - 1;
    do {
      const { content } = array.at(nextIndex)!;
      nextText = `${nextText}${content} `;

      nextIndex--;
    } while (nextIndex <= arrLength && nextText.split(" ").length < 300);
  }

  if (content.split(" ").length < 15) {
    return [...acum, entry];
  }

  try {
    const keepIt = await getNewText(previousText, entry, nextText);

    await release();

    if (!keepIt) {
      console.log(element, element.textContent);
      replaceTextContent("", entry.textNodes);
      return [
        ...acum,
        {
          element: element,
          content: "",
          textNodes: [],
        },
      ];
    }

    return [...acum, entry];
  } catch (error) {
    return [...acum, { element, content: entry.content, textNodes }];
  }
}

async function optimizeArticle(article: HTMLElement) {
  const nodes = getRelevantNodesForSummarization(article, []);

  await nodes.reduce(
    //@ts-ignore
    articleTreeReducer,
    Promise.resolve([])
  );

  removeImage();
}

const ARTICLE_SELECTORS = ["main > article", "main article", "article"];

function getMainArticle() {
  function findReducer(prev: HTMLElement[], selector: string) {
    if (prev.length > 0) {
      return prev;
    }

    return Array.from(document.querySelectorAll(selector));
  }

  //@ts-ignore
  const articles: HTMLElement[] = ARTICLE_SELECTORS.reduce(findReducer, []);

  const largestArticle = articles.reduce(returnLargestElement);
  return largestArticle;
}

function extractContentFromArticle(article: HTMLElement) {
  markUneededNodes(article);

  const clonedArticle = article.cloneNode(true) as HTMLElement;

  deleteUnneeded(clonedArticle);

  const container = document.createElement("div");
  container.appendChild(clonedArticle);
  return getCleanTextFromElement(container);
}

function onMessage(
  message: InputMessages,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  if (message.action === ContentScriptMessageNames.optimize_article) {
    const largestArticle = getMainArticle();
    if (largestArticle) {
      optimizeArticle(largestArticle);
    }
  }

  if (message.action === ContentScriptMessageNames.extract_content) {
    const largestArticle = getMainArticle();
    if (!largestArticle) {
      return;
    }

    const content = extractContentFromArticle(largestArticle);

    sendResponse(content);
  }
}

chrome.runtime.onMessage.addListener(onMessage);
