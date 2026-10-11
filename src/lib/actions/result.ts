import { AuthError, ForbiddenError } from "@/lib/auth/errors";
import { GENERIC_ERROR_MESSAGE, UserFacingError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * In production Next.js replaces the message of any error thrown from a Server
 * Action with a generic one, so users never see why a form failed. Actions
 * therefore return a result object, and clients call `unwrap()` to turn a
 * failure back into an Error with a safe, readable message.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Messages raised by our own repositories/services that are safe and useful to show. */
const KNOWN_MESSAGES: Record<string, string> = {
  "Authentication required.": "יש להתחבר מחדש כדי להמשיך.",
  Forbidden: "אין לך הרשאה לבצע פעולה זו.",
  "Material not found.": "החומר לא נמצא.",
  "Material request not found.": "בקשת החומר לא נמצאה.",
  "Forum question not found.": "השאלה לא נמצאה.",
  "Forum answer not found.": "התשובה לא נמצאה.",
  "Recommendation not found.": "ההמלצה לא נמצאה.",
  "Professional request not found.": "הפנייה לא נמצאה.",
  "Event not found.": "האירוע לא נמצא.",
  "Report target not found.": "התוכן המדווח לא נמצא.",
  "Invalid parent comment.": "לא ניתן להגיב לתגובה זו.",
  "Invalid parent answer.": "לא ניתן להגיב לתשובה זו.",
  "Maximum reply depth reached.": "לא ניתן להוסיף עוד רמות תגובה.",
  "Recommendation comments allow only one reply level.": "להמלצות ניתן להגיב ברמה אחת בלבד.",
  "Rating must be an integer between 1 and 5.": "הדירוג חייב להיות מספר שלם בין 1 ל-5.",
  "Material response must include text, a file, or both.": "יש לכלול טקסט, קובץ, או שניהם.",
  "Material type key already exists.": "קטגוריה עם מפתח זה כבר קיימת.",
  "Cannot delete a material type that is in use.": "לא ניתן למחוק קטגוריה שיש בה חומרים.",
  "Invalid role.": "תפקיד לא תקין.",
  "Label is required.": "יש להזין תווית.",
};

function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const known = KNOWN_MESSAGES[error.message];
    if (known) return known;
    if (error instanceof UserFacingError) return error.message;
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return error.message;
    }
  }
  return GENERIC_ERROR_MESSAGE;
}

export async function runAction<T>(task: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await task() };
  } catch (error) {
    if (isNextControlFlow(error)) throw error;

    const message = toUserMessage(error);
    if (message === GENERIC_ERROR_MESSAGE) {
      logger.error("server action failed", error);
    }
    return { ok: false, error: message };
  }
}

/** Client-side: returns the data, or throws an Error carrying the readable message. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
