/** Error whose message is safe to show to end users. Anything else is logged and masked. */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export class RateLimitError extends UserFacingError {
  constructor(message = "יותר מדי בקשות. נסו שוב בעוד מספר דקות.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export const GENERIC_ERROR_MESSAGE = "אירעה שגיאה. נסו שוב.";
