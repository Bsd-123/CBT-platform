import "server-only";
import { after } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Runs an email task after the response has been sent, so a slow or failing mail provider can
 * never delay or break the action that triggered it. Failures are logged, never thrown.
 */
export function runInBackground(label: string, task: () => Promise<void>): void {
  const guarded = async () => {
    try {
      await task();
    } catch (error) {
      logger.error("Background email task failed", { label, error });
    }
  };

  try {
    after(guarded);
  } catch {
    // Outside a request (scripts, tests) there is no `after` scope: just run it detached.
    void guarded();
  }
}
