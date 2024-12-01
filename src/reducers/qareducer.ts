import { getAnswerFor } from "../singletons/answerAi";

export type QAndAState = {
  question: string;
  asked_question: string;
  answer: string;
  activeTab: string;
  loading: boolean;
  is_full_answer: boolean;
  error: string | null;
  controller: AbortController | null;
};

export enum QAndAActionsNames {
  update_question = "update_question",
  update_answer = "update_answer",
  update_answer_chunk = "update_answer_chunk",
  update_tab = "update_tab",
  start_new_answer = "start_new_answer",
}

type UpdateQuestionAction = {
  action: QAndAActionsNames.update_question;
  payload: string;
};

type UpdateAnswerAction = {
  action: QAndAActionsNames.update_answer;
  payload: string;
};

type UpdateAnswerChunkAction = {
  action: QAndAActionsNames.update_answer_chunk;
  payload: string;
};

type UpdateTabAction = {
  action: QAndAActionsNames.update_tab;
  payload: QAndAState;
};

type StartNewAnswerAction = {
  action: QAndAActionsNames.start_new_answer;
  payload: {
    controller: AbortController;
  };
};

export type QAndAAction =
  | StartNewAnswerAction
  | UpdateQuestionAction
  | UpdateAnswerAction
  | UpdateAnswerChunkAction
  | UpdateTabAction;

type Dispatch = React.Dispatch<QAndAAction>;

const handlers: Record<
  QAndAActionsNames,
  (oldState: QAndAState, action: any) => QAndAState
> = {
  update_answer(oldState: QAndAState, action: UpdateAnswerAction) {
    return {
      ...oldState,
      loading: false,
      is_full_answer: true,
      answer: action.payload,
    };
  },
  update_answer_chunk(oldState: QAndAState, action: UpdateAnswerChunkAction) {
    return {
      ...oldState,
      is_full_answer: false,
      loading: false,
      answer: `${oldState.answer}${action.payload}`,
    };
  },
  update_question(oldState: QAndAState, action: UpdateQuestionAction) {
    return {
      ...oldState,
      question: action.payload,
    };
  },
  update_tab(oldState: QAndAState, action: UpdateTabAction) {
    if (oldState.controller) {
      oldState.controller.abort();
    }

    return {
      ...action.payload,
    };
  },
  start_new_answer(oldState: QAndAState, action: StartNewAnswerAction) {
    return {
      ...oldState,
      asked_question: oldState.question,
      question: "",
      answer: "",
      is_full_answer: false,
      loading: true,
      controller: action.payload.controller,
    };
  },
};

export type QAndAReducer = (
  oldState: QAndAState,
  action: QAndAAction
) => QAndAState;

export function qAndAReducer(oldState: QAndAState, action: QAndAAction) {
  if (action.action in handlers) {
    const newState = handlers[action.action](oldState, action);

    const { controller, ...serializableState } = newState;

    chrome.storage.session
      .set({ [`state_${newState.activeTab}`]: serializableState })
      .catch(console.error);

    return newState;
  }

  return oldState;
}

export async function onTabUpdateUtil(dispatch: Dispatch, activeTab: string) {
  const key = `state_${activeTab}`;

  const data = await chrome.storage.session.get(key);

  if (key in data) {
    dispatch({
      action: QAndAActionsNames.update_tab,
      payload: { ...data[key], activeTab },
    });
  } else {
    dispatch({
      action: QAndAActionsNames.update_tab,
      payload: getInitialState({ activeTab }),
    });
  }
}

export async function answerQuestionUtil(
  dispatch: Dispatch,
  pageContent: string,
  question: string
) {
  const controller = new AbortController();
  dispatch({
    action: QAndAActionsNames.start_new_answer,
    payload: {
      controller,
    },
  });

  function onToken(token: string) {
    if (controller.signal.aborted) {
      return;
    }

    dispatch({
      action: QAndAActionsNames.update_answer_chunk,
      payload: token,
    });
  }

  const response = await getAnswerFor(
    onToken,
    controller.signal,
    pageContent,
    question
  );

  if (controller.signal.aborted) {
    return;
  }
  dispatch({
    action: QAndAActionsNames.update_answer,
    payload: response,
  });
}

export function getInitialState(optional?: Partial<QAndAState>): QAndAState {
  return {
    answer: "",
    question: "",
    asked_question: "",
    loading: false,
    error: null,
    controller: null,
    is_full_answer: false,
    activeTab: "",
    ...optional,
  };
}
