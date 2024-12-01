import { useEffect, useState } from "react";
import { AnswerBubble } from "./components/messages";

function Popup() {
  const [ready, setReady] = useState<boolean>(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);

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

      chrome.sidePanel.setOptions(
        {
          path: "pages/index.html", // Path to your side panel's HTML file
          enabled: true,
        },
        () => {
          console.log("Side panel opened!");
        }
      );

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
        {!ready && (
          <AnswerBubble
            message={
              readyError
                ? readyError
                : `We are getting ready to hatch, please wait a moment: ${progress}%`
            }
          />
        )}

        {ready && (
          <AnswerBubble
            message={`We are ready to peck the best content out of your website, please close and open the extension!`}
          />
        )}
      </div>
      <div className="chat-input"></div>
    </div>
  );
}

export default Popup;
