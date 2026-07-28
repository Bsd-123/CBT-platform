"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { fetchPostLoginPath } from "@/lib/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const nextPath = await fetchPostLoginPath();
      window.location.assign(nextPath);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={handleSubmit}>
      <div>
        <h1>התחברות</h1>
        <p className="muted">התחברו לקהילת מטפלי CBT</p>
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Link href="/forgot-password" className="auth-inline-link">
          שכחתם סיסמה?
        </Link>
      </div>

      {resetSuccess && (
        <p className="banner-success">הסיסמה עודכנה בהצלחה. התחברו עם הסיסמה החדשה.</p>
      )}

      {error && <p className="error">{error}</p>}

      <button type="submit" className="button" disabled={loading}>
        {loading ? "מתחבר..." : "התחברות"}
      </button>

      <p className="muted">
        אין לכם חשבון? <Link href="/register">הרשמה</Link>
      </p>
    </form>
  );
}
