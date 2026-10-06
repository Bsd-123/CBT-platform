"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>משהו השתבש</h1>
        <p>אירעה שגיאה בלתי צפויה.</p>
        {error.digest && <p>מזהה שגיאה: {error.digest}</p>}
        <button type="button" onClick={() => reset()}>
          ניסיון חוזר
        </button>
      </body>
    </html>
  );
}
