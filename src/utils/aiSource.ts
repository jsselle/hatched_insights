declare const self: any;

export function getAI() {
  if ("chrome" in self && "aiOriginTrial" in self.chrome) {
    return self.chrome.aiOriginTrial;
  }

  if ("ai" in self) {
    return self.ai;
  }

  return null;
}
