import { ContentScriptMessageNames } from "../contentScript/messages";
import { PortNames, TabChangedAction, TabListenerActionNames } from "./types";

function setUpUIUX() {
  chrome.contextMenus.create({
    id: "optimize-article",
    title: "Optimize Content",
    contexts: ["page"],
  });

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}

async function addItemIfPossible() {
  if (!("ai" in self)) {
    return;
  }
  try {
    const capabilities = await (self as any).ai.languageModel.capabilities();

    const { available } = capabilities;

    if (available === "readily") {
      setUpUIUX();
      return;
    }
  } catch {}
}

function onInstalled() {
  chrome.contextMenus.removeAll(addItemIfPossible);
}

chrome.runtime.onInstalled.addListener(onInstalled);

function onContextMenuClicks(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (tab && tab.id && info.menuItemId === "optimize-article") {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["static/animations.css"],
    });

    chrome.tabs.sendMessage(tab.id, {
      action: ContentScriptMessageNames.optimize_article,
    });
  }
}

chrome.contextMenus.onClicked.addListener(onContextMenuClicks);

const TAB_LISTENER_PORTS: Set<chrome.runtime.Port> = new Set();

async function onTabChange(activeInfo: chrome.tabs.TabActiveInfo) {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (!tab || !tab.url) {
    return;
  }

  let url = tab.url;

  const parsed = new URL(url);
  parsed.hash = "";
  url = parsed.href;

  function sendToPort(port: chrome.runtime.Port) {
    const message: TabChangedAction = {
      action: TabListenerActionNames.tab_changed,
      payload: {
        url,
      },
    };

    port.postMessage(message);
  }

  TAB_LISTENER_PORTS.forEach(sendToPort);
}

function storeTabListenerPort(port: chrome.runtime.Port) {
  function onDisconnect() {
    TAB_LISTENER_PORTS.delete(port);
  }

  TAB_LISTENER_PORTS.add(port);

  port.onDisconnect.addListener(onDisconnect);
}

function onPort(port: chrome.runtime.Port) {
  if (port.name === PortNames.tab_listener) {
    storeTabListenerPort(port);
  }
}

chrome.tabs.onActivated.addListener(onTabChange);

chrome.runtime.onConnect.addListener(onPort);
