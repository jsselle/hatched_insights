import { KnownError, MessageSendError } from "../consts/error";
import { ContentScriptMessageNames } from "../contentScript/messages";
import { sendMessageAndGetResponse } from "./sendMessageAndGetResponse";

export function ensureContentScriptIsReadyInTab(activeTab: chrome.tabs.Tab) {
  function handler(
    resolve: (value: boolean) => void,
    reject: (error: KnownError) => void
  ) {
    function onInjectionResult(
      _results: chrome.scripting.InjectionResult<any>[]
    ) {
      if (chrome.runtime.lastError) {
        reject(new MessageSendError("Error sending message"));
      } else {
        resolve(true);
      }
    }

    function loadJs(error: KnownError) {
      if (!(error instanceof MessageSendError)) {
        reject(error);
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id! },
          files: ["contentScript.js"],
        },
        onInjectionResult
      );
    }

    sendMessageAndGetResponse<boolean>(activeTab, {
      action: ContentScriptMessageNames.ping,
    })
      .then(resolve)
      .catch(loadJs);
  }

  return new Promise(handler);
}
