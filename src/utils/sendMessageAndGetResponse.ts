import {
  KnownError,
  MessageSendError,
  ResponseTimeoutError,
} from "../consts/error";

export function sendMessageAndGetResponse<T>(
  activeTab: chrome.tabs.Tab,
  message: Record<string, any>
) {
  function handler(
    resolve: (value: T) => void,
    reject: (error: KnownError) => void
  ) {
    let timeout: number | undefined;

    function onResponse(response: T) {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        reject(new MessageSendError("Error sending message"));
      } else {
        resolve(response);
      }
    }

    chrome.tabs.sendMessage(activeTab.id!, message, onResponse);
    timeout = setTimeout(
      reject,
      5_000,
      new ResponseTimeoutError("Waited too long for response")
    );
  }

  return new Promise(handler);
}
