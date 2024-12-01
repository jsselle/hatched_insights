export class KnownError extends Error {}

export class NoTabError extends KnownError {}
export class MessageSendError extends KnownError {}
export class ResponseTimeoutError extends KnownError {}
