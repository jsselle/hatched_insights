export enum ContentScriptMessageNames {
  optimize_article = "optimize_article",
  extract_content = "extract_content",
}

type OptimizeArticleInputMessage = {
  action: ContentScriptMessageNames.optimize_article;
};

type ExtractContentInputMessage = {
  action: ContentScriptMessageNames.extract_content;
};

export type InputMessages =
  | OptimizeArticleInputMessage
  | ExtractContentInputMessage;
