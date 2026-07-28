"use client";

type EventsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EventsError({ error, reset }: EventsErrorProps) {
  const isDatabaseError =
    error.message.includes("Can't reach database") ||
    error.message.includes("P1001");

  return (
    <div className="stack">
      <section className="card">
        <h1>שגיאה באזור האירועים</h1>
        <p className="muted">
          {isDatabaseError
            ? "לא ניתן להתחבר למסד הנתונים כרגע. בדקו את החיבור לאינטרנט ונסו שוב."
            : "אירעה שגיאה בטעינת אירועים וסדנאות."}
        </p>
        <button type="button" className="button" onClick={() => reset()}>
          ניסיון חוזר
        </button>
      </section>
    </div>
  );
}
