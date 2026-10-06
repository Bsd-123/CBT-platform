"use client";

import { useState } from "react";
import { completeRegistration } from "@/lib/actions/auth";
import { unwrap } from "@/lib/actions/result";
import { formatReferralInputForDisplay } from "@/lib/utils/expert-code";

type CompleteProfileFormProps = {
  userId: string;
  expertRef?: string | null;
  infoMessage?: string;
};

const CLIENT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(message));
      });
  });
}

export function CompleteProfileForm({
  userId,
  expertRef,
  infoMessage,
}: CompleteProfileFormProps) {
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [expertCode, setExpertCode] = useState(() =>
    expertRef ? formatReferralInputForDisplay(expertRef) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await withTimeout(
        completeRegistration({
          id: userId,
          full_name: fullName,
          title: title || null,
          expert_code: expertCode.trim() || null,
        }),
        CLIENT_TIMEOUT_MS,
        "השמירה נמשכה זמן רב. בדקו חיבור לאינטרנט ונסו שוב.",
      );

      const registration = unwrap(result);
      window.location.assign(registration.pending_expert_approval ? "/pending-approval" : "/");
      return;
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "אירעה שגיאה בהשלמת הפרופיל",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={handleSubmit}>
      <div>
        <h1>השלמת פרופיל</h1>
        <p className="muted">השלימו את פרטי הפרופיל המקצועי שלכם</p>
      </div>

      {infoMessage && <p className="banner-warning">{infoMessage}</p>}

      <div className="form-field">
        <label htmlFor="full_name">שם מלא</label>
        <input
          id="full_name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="title">תואר מקצועי (אופציונלי)</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="expert_code">
          קוד מומחה מפנה{expertRef ? "" : " (אופציונלי)"}
        </label>
        <input
          id="expert_code"
          value={expertCode}
          onChange={(event) => setExpertCode(event.target.value)}
          placeholder="#D90963D6"
          required={Boolean(expertRef)}
          readOnly={Boolean(expertRef)}
        />
      </div>

      {expertCode.trim() && (
        <p className="banner-warning">
          אישור המומחה המפנה הוא חובה. עד לאישור, הגישה לפלטפורמה חסומה לחלוטין.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <button type="submit" className="button" disabled={loading}>
        {loading ? "שומר..." : "שמירה והמשך"}
      </button>
    </form>
  );
}
