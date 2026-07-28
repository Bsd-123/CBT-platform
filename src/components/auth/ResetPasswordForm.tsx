"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const supabase = createSupabaseBrowserClient();
      const { data, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !data.user) {
        setError("קישור האיפוס אינו תקף או שפג תוקפו. בקשו קישור חדש.");
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }

      setCheckingSession(false);
    }

    void verifySession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      window.location.assign("/login?reset=success");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="card auth-card stack">
        <p className="muted">בודק קישור איפוס...</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="card auth-card stack">
        <div>
          <h1>איפוס סיסמה</h1>
          <p className="error">{error}</p>
        </div>
        <p className="muted">
          <Link href="/forgot-password">בקשת קישור חדש</Link>
          {" · "}
          <Link href="/login">חזרה להתחברות</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="card auth-card stack" onSubmit={handleSubmit}>
      <div>
        <h1>סיסמה חדשה</h1>
        <p className="muted">בחרו סיסמה חדשה לחשבון שלכם.</p>
      </div>

      <div className="form-field">
        <label htmlFor="password">סיסמה חדשה</label>
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
        <label htmlFor="confirm-password">אימות סיסמה</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="button" disabled={loading}>
        {loading ? "שומר..." : "שמירת סיסמה חדשה"}
      </button>

      <p className="muted">
        <Link href="/login">חזרה להתחברות</Link>
      </p>
    </form>
  );
}
