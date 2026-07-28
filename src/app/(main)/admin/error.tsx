"use client";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  const isDatabaseError =
    error.message.includes("Can't reach database") ||
    error.message.includes("P1001") ||
    error.digest === "3179877491";

  return (
    <div className="stack">
      <section className="card">
        <h1>שגיאה באזור הניהול</h1>
        <p className="muted">
          {isDatabaseError
            ? "לא ניתן להתחבר למסד הנתונים כרגע. בדקו את החיבור לאינטרנט ונסו שוב."
            : "אירעה שגיאה בטעינת אזור הניהול."}
        </p>
        <button type="button" className="button" onClick={() => reset()}>
          ניסיון חוזר
        </button>
      </section>
    </div>
  );
}
