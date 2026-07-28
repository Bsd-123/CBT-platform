"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { completeRegistration } from "@/lib/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatReferralInputForDisplay } from "@/lib/utils/expert-code";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expertRef = searchParams.get("ref") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [expertCode, setExpertCode] = useState(() => formatReferralInputForDisplay(expertRef));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const expertRefRequired = Boolean(expertRef);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data?.user?.id) {
        setError("ההרשמה נכשלה או שממתינה לאישור אימייל.");
        setLoading(false);
        return;
      }

      const result = await completeRegistration({
        id: data.user.id,
        full_name: fullName,
        title: title || null,
        expert_code: expertCode || null,
      });

      router.refresh();
      router.push(result.pending_expert_approval ? "/pending-approval" : "/");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "אירעה שגיאה בהרשמה",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={handleSubmit}>
      <div>
        <h1>הרשמה</h1>
        <p className="muted">יצירת פרופיל מקצועי בקהילה</p>
      </div>

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
        <label htmlFor="email">אימייל</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">סיסמה</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="expert_code">
          קוד מומחה מפנה{expertRefRequired ? "" : " (אופציונלי)"}
        </label>
        <input
          id="expert_code"
          value={expertCode}
          onChange={(event) => setExpertCode(event.target.value)}
          placeholder="#D90963D6"
          required={expertRefRequired}
          readOnly={expertRefRequired}
        />
      </div>

      {expertCode && (
        <p className="banner-warning">
          אישור המומחה המפנה הוא חובה. עד לאישור, הגישה לפלטפורמה חסומה לחלוטין.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <button type="submit" className="button" disabled={loading}>
        {loading ? "נרשם..." : "הרשמה"}
      </button>

      <p className="muted">
        כבר יש לכם חשבון? <Link href="/login">התחברות</Link>
      </p>
    </form>
  );
}
