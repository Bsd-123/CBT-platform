import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "יצירת קשר ותמיכה" };

export default function ContactPage() {
  return (
    <LegalDocument title="יצירת קשר ותמיכה" subtitle="שאלה, תקלה או הצעה לשיפור? אנחנו כאן.">
      <h2>איך אפשר לפנות אלינו</h2>
      {CONTACT_EMAIL ? (
        <p>
          אימייל: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      ) : (
        <p>
          חברי הקהילה יכולים לפנות למנהלי הקהילה דרך האתר. לדיווח על תוכן בעייתי השתמשו בכפתור
          הדיווח הנמצא בכל פריט.
        </p>
      )}

      <h2>במה אנחנו יכולים לעזור</h2>
      <ul>
        <li>בעיות התחברות, הרשמה או אישור הצטרפות.</li>
        <li>תקלות באתר, העלאת קבצים או תצוגת חומרים.</li>
        <li>בקשות לעיון במידע אישי, לתיקון או למחיקה.</li>
        <li>פניות בנושא נגישות.</li>
        <li>דיווח על תוכן שמפר את תנאי השימוש.</li>
      </ul>

      <h2>כדי שנוכל לעזור מהר</h2>
      <p>
        ציינו את הכתובת שאיתה נרשמתם, מה ניסיתם לעשות ומה קרה בפועל. אל תשלחו סיסמאות או פרטים
        מזהים של מטופלים.
      </p>

      <h2>מסמכים נוספים</h2>
      <p>
        <Link href="/terms">תנאי שימוש</Link> · <Link href="/privacy">מדיניות פרטיות</Link> ·{" "}
        <Link href="/accessibility">הצהרת נגישות</Link>
      </p>
    </LegalDocument>
  );
}
