import { NodeHtmlMarkdown } from "node-html-markdown";

let INSTANCE: NodeHtmlMarkdown | null = null;

export function getNodeMarkDownInstance() {
  if (!INSTANCE) {
    INSTANCE = new NodeHtmlMarkdown({
      preferNativeParser: true,
      keepDataImages: false,
    });
  }

  return INSTANCE;
}
