import birdie from "../assets/birdie.jpg";

type BubbleProps = {
  message: string;
};

type AnswerBubbleProps = BubbleProps & {
  enableActions?: boolean;
};

type LoadingBubbleProps = {
  loading: boolean;
};

export function AnswerBubble(props: AnswerBubbleProps) {
  const { message, enableActions } = props;

  if (!message) {
    return null;
  }

  return (
    <div className="chat-bubble-with-actions">
      <div className={`chat-bubble-container received-container`}>
        <div className="profile-picture-container">
          <div className="profile-picture">
            <img src={birdie} alt="User" className="profile-img" />
          </div>
        </div>
        <div className={`chat-bubble received`}>{message}</div>
      </div>
      {enableActions && (
        <div className="chat-actions">
          <div className="chat-action">
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
              <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
            </svg>
          </div>
          <div className="chat-action">
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
              <path d="M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export function LoadingBubble(props: LoadingBubbleProps) {
  const { loading } = props;

  if (!loading) {
    return;
  }

  return (
    <div className={`chat-bubble-container received-container`}>
      <div className="profile-picture-container">
        <div className="profile-picture">
          <img src={birdie} alt="User" className="profile-img" />
        </div>
      </div>
      <div className={`chat-bubble received`}>
        <div className="typing-dots">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
    </div>
  );
}

export function AskedBubble(props: BubbleProps) {
  const { message } = props;
  if (!message) {
    return null;
  }
  return (
    <div className={`chat-bubble-container sent-container`}>
      <div className={`chat-bubble sent`}>{message}</div>
    </div>
  );
}

export function AnnouncementBubble(props: BubbleProps) {
  const { message } = props;
  if (!message) {
    return null;
  }
  return (
    <div className={`announcement-container`}>
      <div className={`announcement-bubble`}>{message}</div>
    </div>
  );
}
