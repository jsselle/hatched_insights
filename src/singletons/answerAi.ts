let TOKEN_COUNTER_INSTANCE: any;
const MAX_TOKENS = 2000;
const DESIRED_TOKENS = 1500;

const KB = 1024;
const OVERLAP_SIZE = KB;

async function getTokenCounter() {
  return (self as any).ai.languageModel.create();

  if (!TOKEN_COUNTER_INSTANCE) {
    TOKEN_COUNTER_INSTANCE = await (self as any).ai.languageModel.create();
  }

  return TOKEN_COUNTER_INSTANCE.clone();
}

const LAST_NEGATIVE = "say that you cannot answer, and explain why.";
const NEGATIVE = ` respond with:
"I cannot answer that"`;

const NEGATIVE_ANSWER = `i cannot answer that`;
const NEGATIVE_ANSWER_SIZE = NEGATIVE_ANSWER.length;

function windowPaneContent(inputString: string, chunkSize: number): string[] {
  const inputLength = inputString.length;

  const totalChunks = Math.ceil(
    (inputLength + OVERLAP_SIZE) / (chunkSize - OVERLAP_SIZE)
  );
  function chunker(_: unknown, index: number) {
    const startIndex = index * (chunkSize - OVERLAP_SIZE);
    const endIndex = Math.min(startIndex + chunkSize, inputLength);

    let chunk = inputString.slice(startIndex, endIndex);

    if (index > 0) {
      const overlap = inputString.slice(
        Math.max(0, startIndex - OVERLAP_SIZE),
        startIndex
      );
      chunk = overlap + chunk.slice(overlap.length);
    }

    return chunk;
  }

  return Array.from({ length: totalChunks }, chunker);
}

type StreamTokenCallback = (chunk: string) => void;

export async function getAnswerFor(
  tokenCallback: StreamTokenCallback,
  globalSignal: AbortSignal,
  data: string,
  question: string
) {
  const counter = await getTokenCounter();
  const tokens = await counter.countPromptTokens(data);
  counter.destroy();

  const promptSize = data.length;

  let corpus;
  if (tokens > MAX_TOKENS) {
    corpus = [data];
  } else {
    corpus = windowPaneContent(
      data,
      (DESIRED_TOKENS * promptSize) / MAX_TOKENS
    );
  }

  async function tryToAnswerReducer(
    prev: Promise<string>,
    chunk: string,
    index: number,
    allChunks: string[]
  ) {
    const previousAnswer = await prev;

    if (globalSignal.aborted) {
      return previousAnswer;
    }

    if (
      previousAnswer.length > 0 &&
      !previousAnswer.toLowerCase().includes(NEGATIVE_ANSWER)
    ) {
      return previousAnswer;
    }

    const isLast = index === allChunks.length - 1;

    const session = await (self as any).ai.languageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: `You are a specialized AI assistant. Your role is to answer questions strictly based on the content provided by the user. Follow these rules:
          
Content-Restricted Responses: Only use the given content to answer questions. Do not incorporate or infer information from any external sources, general knowledge, or assumptions. If the question cannot be answered directly using the content, ${isLast ? LAST_NEGATIVE : NEGATIVE}

Avoid Assumptions: Do not infer or guess any information beyond what is explicitly stated.

Clarity and Brevity: Keep your answers clear, short, direct and concise, providing accurate information without unnecessary elaboration and without repeating the content.

Language Sensitivity: Match the language and tone of your response to the formality of the website content.

No External Knowledge: You do not have access to or knowledge of anything outside the provided content. Pretend external information does not exist.

Focus on Relevance: Ignore questions unrelated to the website's topic or outside its scope.

Markdown: Format your messages in Markdown
              `,
        },
        {
          role: "user",
          content: chunk,
        },
      ],
    });

    const fullQuestion = `Your answer must be based solely on the information provided on this conversation without external information, focus only on the information provided without complementing it with external information, and additionally it should be truth Agnostic: Assume the provided content is the sole source of truth, whether accurate or not. Do not validate, correct, or question the information.
            
Question: ${question}`;

    let result = "";

    try {
      const controller = new AbortController();
      const stream = await session.promptStreaming(fullQuestion, {
        //signal: controller.signal,
      });
      let previousChunk = "";
      let isGoodAnswer = isLast;
      let isFirstEmit;

      for await (const chunk of stream) {
        if (globalSignal.aborted) {
          controller.abort();
          break;
        }

        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;

        result += newChunk;

        if (!isGoodAnswer) {
          if (result.toLocaleLowerCase().startsWith(NEGATIVE_ANSWER)) {
            controller.abort();
          }
          isGoodAnswer = result.length > NEGATIVE_ANSWER_SIZE;
        }

        previousChunk = chunk;
        if (isGoodAnswer) {
          tokenCallback(isFirstEmit ? result : newChunk);
          isFirstEmit = false;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      session.destroy();
    }

    return result;
  }

  return corpus.reduce(tryToAnswerReducer, Promise.resolve(""));
}
