import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "הצהרת נגישות" };

export default function AccessibilityPage() {
  return (
    <LegalDocument title="הצהרת נגישות" subtitle="אנו רוצים שכל איש ואשת מקצוע יוכלו להשתמש בקהילה.">
      <p className="legal-draft-note" role="note">
        נוסח זה הוא טיוטה ראשונית. יש להשלים את פרטי רכז הנגישות ולבצע בדיקת נגישות מקצועית לפני פרסום
        סופי.
      </p>

      <h2>מחויבות</h2>
      <p>
        CBTeam שואפת לעמוד בהנחיות WCAG ברמה AA ובתקן הישראלי ת&quot;י 5568. האתר עדיין בפיתוח, ואנו
        ממשיכים לשפר אותו.
      </p>

      <h2>מה כבר קיים באתר</h2>
      <ul>
        <li>ממשק בעברית מימין לשמאל, עם מבנה כותרות ואזורי ניווט סמנטיים.</li>
        <li>ניווט מלא במקלדת, עם סימון בולט של האלמנט הנבחר.</li>
        <li>חלונות קופצים שלוכדים את המיקוד, נסגרים ב-Escape ומחזירים את המיקוד לכפתור שפתח אותם.</li>
        <li>תוויות לשדות טופס, הודעות שגיאה מוכרזות לקורא מסך וניגודיות צבעים מותאמת.</li>
        <li>תפריט מותאם למסכים קטנים ולמכשירים ניידים.</li>
      </ul>

      <h2>מגבלות ידועות</h2>
      <ul>
        <li>קבצים שמועלים על ידי חברים (מסמכים, מצגות) עשויים שלא להיות נגישים.</li>
        <li>תצוגה מקדימה של קבצי PDF אינה זמינה במסכים קטנים; ניתן להוריד את הקובץ.</li>
      </ul>

      <h2>פנייה בנושא נגישות</h2>
      <p>נתקלתם בבעיה, או שאתם זקוקים לתוכן בפורמט נגיש? נשמח לעזור.</p>
      <ul>
        <li>רכז/ת נגישות: יש להשלים שם</li>
        {CONTACT_EMAIL && (
          <li>
            אימייל: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
        )}
        <li>
          <Link href="/contact">עמוד יצירת קשר ותמיכה</Link>
        </li>
      </ul>
    </LegalDocument>
  );
}
