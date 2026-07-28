"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function buildPasswordResetRedirectUrl(): string {
  const next = encodeURIComponent("/reset-password");
  return `${window.location.origin}/auth/callback?next=${next}`;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: buildPasswordResetRedirectUrl(),
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={handleSubmit}>
      <div>
        <h1>איפוס סיסמה</h1>
        <p className="muted">הזינו את כתובת האימייל של החשבון. אם קיים חשבון, נשלח אליכם קישור לאיפוס.</p>
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

      {error && <p className="error">{error}</p>}

      {success && (
        <p className="banner-success">
          אם קיים חשבון עם כתובת זו, נשלח אליכם אימייל עם קישור לאיפוס הסיסמה.
        </p>
      )}

      <button type="submit" className="button" disabled={loading || success}>
        {loading ? "שולח..." : "שליחת קישור לאיפוס"}
      </button>

      <p className="muted">
        <Link href="/login">חזרה להתחברות</Link>
      </p>
    </form>
  );
}
