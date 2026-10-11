import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack" style={{ padding: "2rem" }}>
      <section className="card">
        <h1>העמוד לא נמצא</h1>
        <p className="muted">ייתכן שהקישור שגוי או שהתוכן הוסר.</p>
        <Link href="/" className="button">
          חזרה לדף הבית
        </Link>
      </section>
    </div>
  );
}
