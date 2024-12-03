export enum ContentScriptMessageNames {
  optimize_article = "optimize_article",
  extract_content = "extract_content",
  ping = "ping",
}

type OptimizeArticleInputMessage = {
  action: ContentScriptMessageNames.optimize_article;
};

type ExtractContentInputMessage = {
  action: ContentScriptMessageNames.extract_content;
};

type PingInputMessage = {
  action: ContentScriptMessageNames.ping;
};

export type InputMessages =
  | OptimizeArticleInputMessage
  | PingInputMessage
  | ExtractContentInputMessage;
