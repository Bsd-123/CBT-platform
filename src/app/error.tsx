"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: ErrorProps) {
  return (
    <div className="stack">
      <section className="card">
        <h1>משהו השתבש</h1>
        <p className="muted">אירעה שגיאה בלתי צפויה. נסו שוב, ואם הבעיה נמשכת פנו למנהל המערכת.</p>
        {error.digest && <p className="muted">מזהה שגיאה: {error.digest}</p>}
        <button type="button" className="button" onClick={() => reset()}>
          ניסיון חוזר
        </button>
      </section>
    </div>
  );
}
