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

function largestArticleReducer(prev: HTMLElement | null, current: HTMLElement) {
  const prevLength = (prev && getCleanTextFromElement(prev)) || "";
  const currentLength = getCleanTextFromElement(current);

  const currentWordLength = currentLength.split(" ").length;

  if (currentWordLength > 200 && currentLength.length > prevLength.length) {
    return current;
  }

  return prev;
}

function getMainArticle() {
  function findReducer(prev: HTMLElement[], selector: string) {
    if (prev.length > 0) {
      return prev;
    }

    return [
      ...prev,
      ...(Array.from(document.querySelectorAll(selector)) as HTMLElement[]),
    ];
  }

  const foundArticles: HTMLElement[] = ARTICLE_SELECTORS.reduce(
    findReducer,
    []
  );

  const articles: HTMLElement[] = Array.from(new Set(foundArticles));

  const largestArticle = articles.reduce(largestArticleReducer, null);

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

function renderEntries(acum: string, entry: [string, any]): string {
  const [key, value] = entry;

  return renderAny(
    `${acum}
${key}: `,
    value
  );
}

function renderObject(json: object): string {
  return Object.entries(json).reduce(renderEntries, "");
}

function renderArray(array: any[]): string {
  return array.reduce(renderAny, "");
}

function renderAny(acum: string, any: any): string {
  if (Array.isArray(any)) {
    return `${acum}
${renderArray(any)}`;
  }

  if (typeof any === "object") {
    return `${acum}
${renderObject(any)}`;
  }

  return `${acum}
${any}`;
}

function ldJsonRenderReducer(acum: string, node: HTMLElement) {
  let json;

  try {
    json = JSON.parse(node.textContent || "{}");
  } catch {
    return acum;
  }

  return `${acum}${renderObject(json)}`;
}

function renderLdJson(nodes: HTMLElement[]) {
  return nodes.reduce(ldJsonRenderReducer, "");
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
    if (largestArticle) {
      const content = extractContentFromArticle(largestArticle);

      sendResponse(content);

      return;
    }

    const ldJson = Array.from(
      document.querySelectorAll(`script[type="application/ld+json"]`)
    ) as HTMLElement[];

    if (ldJson.length > 0) {
      const content = renderLdJson(ldJson);

      if (content.length > 2000) {
        sendResponse(content);
        return;
      }
    }

    const main = document.querySelector("main");

    if (main) {
      const content = extractContentFromArticle(main);

      sendResponse(content);
      return;
    }

    sendResponse(
      "We could not find the content of the page, apologize to the user and tell them that we do not support this website yet."
    );
  }
}

chrome.runtime.onMessage.addListener(onMessage);
