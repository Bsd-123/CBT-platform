import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAuthenticatedProfile,
  getPendingApprovalState,
  getRegistrationStatus,
} from "@/lib/auth";
import "@/app/admin-experts.css";

export default async function PendingApprovalPage() {
  const auth = await getAuthenticatedProfile();
  if (!auth) {
    redirect("/login");
  }

  const status = await getRegistrationStatus(auth.userId);
  const pendingState = await getPendingApprovalState(auth.userId);

  if (status === "none" || status === "approved") {
    redirect("/");
  }

  if (status === "rejected") {
    return (
      <main className="admin-experts-page auth-page">
        <section className="card admin-experts-header auth-card stack">
          <span className="material-symbols-outlined pending-approval-icon pending-approval-icon--rejected">
            cancel
          </span>
          <h1>ההרשמה נדחתה</h1>
          <p className="muted">
            {pendingState?.expert_name
              ? `המומחה ${pendingState.expert_name} דחה את בקשת ההרשמה שלכם.`
              : "המומחה המפנה דחה את בקשת ההרשמה שלכם."}{" "}
            הגישה לפלטפורמה חסומה. לפרטים נוספים פנו למומחה.
          </p>
          <Link href="/login" className="button secondary">
            חזרה להתחברות
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-experts-page auth-page">
      <section className="card admin-experts-header auth-card stack">
        <span className="material-symbols-outlined pending-approval-icon">hourglass_top</span>
        <h1>הגישה חסומה — ממתין לאישור מומחה</h1>
        <p className="muted">
          {pendingState?.expert_name
            ? `נרשמתם דרך הפניה של ${pendingState.expert_name}.`
            : "נרשמתם דרך הפניה של מומחה."}{" "}
          אישור המומחה הוא חובה ואינו אופציונלי. עד לאישור, לא ניתן להשתמש בפלטפורמה.
        </p>
        <div className="pending-approval-notice">
          <span className="material-symbols-outlined" aria-hidden="true">
            lock
          </span>
          <p>חשבונכם ממתין לבדיקה. תקבלו גישה מלאה מיד לאחר אישור המומחה.</p>
        </div>
      </section>
    </main>
  );
}
