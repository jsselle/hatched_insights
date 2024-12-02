# 🚀 Why We Built It

Ever clicked on a promising Google search result, only to find the page never _gets to the point_? Or worse, you can’t find an answer no matter how hard you try—or gave up and closed the tab in frustration? Yeah, we’ve been there too. That’s why we built this: an in-browser LLM-powered solution for Chrome.

Imagine this: you get the best search results, and then an AI fine-tunes the content on those pages to answer your questions—tailored just for you—all within the safety of your own environment. No extra tabs, no privacy concerns. Just answers. That’s the value we bring to the table and the problem we’re here to solve.

---

# 🌟 What We Learned

The web is a beautiful mess. As users, we assume content will be easy to consume and accessible. But that’s not always true. Even with standards like semantic tags, not every site follows the rules, making it tricky to find relevant information.

We’ve learned how hard it is to "read" a page like a machine. This journey has pushed us to rethink just how accessible the open web really is.

---

# 🛠️ How We Built It

We chose a Chrome extension so users could leverage it _anywhere_ on the web. Building an external web page would mean sending private questions and browsing habits to a third party, and that didn’t sit right with us. So, we built a secure, user-friendly React application as our frontend and crafted a custom build pipeline to handle all relevant entry points.

### Our Two Focus Areas:

1️⃣ **Prompt Engineering:**

- Iterated quickly using the Prompt API.
- Refined our approach to achieve 90% success in synthetic lab tests.
- Experimented with HTML, Markdown, and plain text inputs—plain text won hands down.
- Implemented a "window pane" strategy to optimize context size and token usage.

2️⃣ **Extension UX:**

- Designed an unobtrusive side panel that’s always there when you need it and easy to dismiss when you don’t.
- Leveraged prompt streaming to serve responses as fast as possible.
- Used early stop signals to move to the next chunk of text, saving time and improving response quality.

---

# ⚡ Challenges

### 1. **Extension Build Tooling**

There’s no standard tooling for Chrome extensions with background services, content scripts, and multiple views. It’s solvable, but a streamlined solution would’ve saved us time.

### 2. **LLM Limitations**

We initially aimed for rich markdown inputs and outputs, but the results weren’t up to par. This led us to pivot to a chat-based UX for better reliability.

### 3. **Token Counting**

Understanding and optimizing token usage was harder than expected. Our expectations from other libraries led to mismatches, and we didn’t allocate enough resources to benchmark it properly.

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
