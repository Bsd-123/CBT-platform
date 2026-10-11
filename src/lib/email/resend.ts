import "server-only";
import type { EmailConfig } from "@/lib/email/config";
import { logger } from "@/lib/logger";

const RESEND_URL = "https://api.resend.com";
const BATCH_LIMIT = 100;
const TIMEOUT_MS = 10_000;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
};

/** Header values must be single-line. */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

function toPayload(config: EmailConfig, message: EmailMessage): ResendPayload {
  return {
    from: config.from,
    to: [message.to],
    subject: singleLine(message.subject),
    html: message.html,
    text: message.text,
  };
}

async function post(config: EmailConfig, path: string, body: unknown): Promise<boolean> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(`${RESEND_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.ok) return true;

      // Retry once on rate limiting or a server hiccup; anything else will not get better.
      const retryable = response.status === 429 || response.status >= 500;
      // Resend explains refusals ("domain not verified", "invalid API key"...) in the body.
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      logger.warn("Resend rejected the request", { path, status: response.status, attempt, detail });
      if (!retryable) return false;
    } catch (error) {
      logger.warn("Resend request failed", { path, attempt }, error);
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

/** Sends one email. Never throws: a failed email must not break the action that triggered it. */
export async function sendEmail(config: EmailConfig, message: EmailMessage): Promise<boolean> {
  return post(config, "/emails", toPayload(config, message));
}

/**
 * Sends many emails with Resend's batch endpoint (up to 100 per request). Every recipient still
 * gets their own message, so addresses are never shared. Returns how many were accepted.
 */
export async function sendEmails(config: EmailConfig, messages: EmailMessage[]): Promise<number> {
  let accepted = 0;
  for (let start = 0; start < messages.length; start += BATCH_LIMIT) {
    const chunk = messages.slice(start, start + BATCH_LIMIT);
    const ok =
      chunk.length === 1
        ? await sendEmail(config, chunk[0])
        : await post(config, "/emails/batch", chunk.map((message) => toPayload(config, message)));
    if (ok) accepted += chunk.length;
  }
  return accepted;
}
