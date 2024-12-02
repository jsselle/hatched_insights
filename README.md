# Feedback for New API

## 1. Multi-Message Prompts

- **Problem:** When attempting to send multiple messages in a single prompt, the LLM interprets the input as a serialized object rather than readable content.
- **Impact:** This affects the usability for applications that rely on batch processing of conversational inputs.
- **Suggestion:** Implement stricter input validation or parsing rules to handle multi-message prompts correctly.

## 2. Token Limit Behavior

- **Problem:** Despite the 1024-token limit being removed, the LLM struggles to correctly process content located at the end of a prompt.
- **Uncertainty:** The reason for this behavior remains unclear and could hinder handling large payloads.

## 3. Session Cloning

- **Problem:** Cloning sessions results in unexpected responses to prompts.
- **Uncertainty:** It’s unclear if this issue stems from the API itself or from our implementation.

## 4. Markdown Understanding

- **Problem:** The LLM struggles to fully comprehend Markdown inputs and generate Markdown outputs.
- **Potential Cause:** This limitation might be related to the LLM’s restricted language output settings.
- **Impact:** This affects the presentation quality of information, especially when using Markdown formatting for clarity.
- **Suggestion:** Improve the LLM’s handling of Markdown inputs/outputs for better user-facing content presentation.

## 5. Token Counting Complexity

- **Problem:** Counting tokens is not straightforward from the API’s perspective.
- **Concerns:**
  - If token counting is asynchronous, it could lead to delays in workflows, such as when implementing chunking or window-panning strategies.
  - There’s a lack of clarity on whether extra feedback or a loader should be shown to users during token counting operations (e.g., counting tokens as the user types).
- **Observation:** While asynchronous operation likely offloads work from the main thread, it adds complexity to implementation.
- **Suggestion:** Provide clearer documentation on token counting (e.g., its async nature) and guidance on optimizing workflows.

## 6. Summarizer and Translation API

- **Problem:** The Summarizer API and Translation API feel more like prompts than distinct APIs.
- **Confusion:** This raises questions about whether the API is vendor-locked or designed for broader, model-agnostic use cases.
- **Observation:** The Summarizer API often generates output longer than the input content, which undermines its purpose for concise summarization.
- **Suggestion:** Clearly define the intended use cases for APIs like Summarizer and Translator. Consider exposing these as examples of composable prompts rather than abstracted APIs.

## 7. Streaming API

- **Positive Feedback:** The Streaming API performs excellently from a developer’s perspective and adheres to standard practices.
- **Problem:** Using the `AbortController` for streaming responses in succession caused browser crashes.
- **Impact:** Aborting sessions is a common use case, especially when users switch contexts quickly.
- **Suggestion:** Address the `AbortController` issue to ensure smooth user experience during context switches.

## 8. Web Content Processing

- **Observation:** Extracting user-readable content from the web is inherently unreliable due to the dynamic nature of websites.
- **Suggestion:** Develop a content extraction API to identify and retrieve the "main" content of a webpage, which would be a valuable addition to this toolset.

## 9. TypeScript Typings

- **Problem:** TypeScript typings are currently unavailable.
- **Acknowledgment:** This is expected at the current stage but remains a limitation for developers aiming for strongly-typed implementations.
- **Suggestion:** Prioritize the inclusion of TypeScript typings as the API matures to ease adoption by developers.
