import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  KnownError,
  MessageSendError,
  NoTabError,
  ResponseTimeoutError,
} from "./consts/error";
import {
  QAndAActionsNames,
  QAndAReducer,
  answerQuestionUtil,
  getInitialState,
  onTabUpdateUtil,
  qAndAReducer,
} from "./reducers/qareducer";
import {
  PortNames,
  TabListenerActionNames,
  TabListenerActions,
} from "./background/types";
import { ContentScriptMessageNames } from "./contentScript/messages";
import {
  AnnouncementBubble,
  AnswerBubble,
  AskedBubble,
  LoadingBubble,
} from "./components/messages";

function getActiveTab(): Promise<chrome.tabs.Tab> {
  function promiseHandler(
    resolve: (value: chrome.tabs.Tab) => void,
    reject: (error: KnownError) => void
  ) {
    function onTabs(tabs: chrome.tabs.Tab[]) {
      const [activeTab] = tabs;

      if (activeTab) {
        resolve(activeTab);
      } else {
        reject(new NoTabError("No active tab found"));
      }
    }

    chrome.tabs.query({ active: true, currentWindow: true }, onTabs);
  }

  return new Promise(promiseHandler);
}

function sendMessageAndGetResponse<T>(
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
        console.log(chrome.runtime.lastError, response);
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

async function getActiveContent() {
  const activeTab = await getActiveTab();

  const content = await sendMessageAndGetResponse<string>(activeTab, {
    action: ContentScriptMessageNames.extract_content,
  });

  return content;
}

function App() {
  const [state, dispatch] = useReducer<QAndAReducer>(
    qAndAReducer,
    getInitialState()
  );

  const [ready, setReady] = useState<boolean>(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  const { question, answer, loading, asked_question, error, is_full_answer } =
    state;

  useEffect(() => {
    if (!divRef.current) {
      return;
    }

    if (divRef.current.innerText !== question) {
      divRef.current.innerText = question;
    }
  }, [question]);

  const onInput = useCallback(function onInput(
    event: FormEvent<HTMLDivElement>
  ) {
    dispatch({
      action: QAndAActionsNames.update_question,
      payload: event.currentTarget.textContent || "",
    });
  }, []);

  const onSend = useCallback(
    async function onSend() {
      if (!question) {
        return;
      }

      const content = await getActiveContent();
      await answerQuestionUtil(dispatch, content, question);
    },
    [question]
  );

  useEffect(function setUpOnTabChange() {
    const port = chrome.runtime.connect({ name: PortNames.tab_listener });

    function listener(message: TabListenerActions) {
      if (message.action === TabListenerActionNames.tab_changed) {
        onTabUpdateUtil(dispatch, message.payload.url);
      }
    }

    port.onMessage.addListener(listener);

    function cleanup() {
      port.disconnect();
    }

    getActiveTab().then(function onTab(tab: chrome.tabs.Tab) {
      if (tab && tab.url) {
        onTabUpdateUtil(dispatch, tab.url);
      }
    });

    return cleanup;
  }, []);

  const onKeyDown = useCallback(
    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.key === "Enter") {
        event.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  useEffect(function () {
    let session: any;

    async function doThings() {
      if (!("ai" in self)) {
        return;
      }

      const capabilities = await (self as any).ai.languageModel.capabilities();

      const { available } = capabilities;

      if (available === "readily") {
        setReady(true);
        return;
      }

      if (available === "no") {
        setReadyError("You cannot use local AI on your device at this moment");
        return;
      }

      function downloadMonitor(event: any) {
        const { loaded, total } = event;
        setProgress(((loaded * 100) / total).toFixed(2));
      }

      session = await (self as any).ai.languageModel.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", downloadMonitor);
        },
      });

      session.destroy();
      session = null;
      setReady(true);
    }

    function cleanup() {
      if (session) {
        session.destroy();
      }
    }

    doThings().catch(setReadyError);

    return cleanup;
  }, []);

  return (
    <div className="chat-screen">
      <div className="chat-bubbles">
        {readyError && <AnnouncementBubble message={readyError} />}
        {!ready &&
          (progress ? (
            <AnnouncementBubble
              message={`Please wait a moment, the chickens are this close to hatching: ${progress}%`}
            />
          ) : (
            <AnnouncementBubble
              message={`Almost ready, hatching the chickens`}
            />
          ))}
        <AskedBubble message={asked_question} />
        <LoadingBubble loading={loading} />
        <AnswerBubble message={answer} enableActions={is_full_answer} />
        {error && <AnnouncementBubble message={error} />}
      </div>
      <div className="chat-input">
        <div
          ref={divRef}
          contentEditable={!loading}
          onInput={onInput}
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
          className="chat-textbox"
        ></div>
        <button onClick={onSend} disabled={loading} className="send-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10 14l11 -11" />
            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;