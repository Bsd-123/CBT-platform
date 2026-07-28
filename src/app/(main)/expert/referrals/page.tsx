import { ExpertReferralsTable } from "@/components/expert/ExpertReferralsTable";
import { ExpertReferralCodeBanner } from "@/components/expert/ExpertReferralCodeBanner";
import { fetchExpertReferrals } from "@/lib/actions/expert";
import { requireRole } from "@/lib/auth";
import { formatExpertCode } from "@/lib/utils/expert-code";
import "@/app/admin-experts.css";

export default async function ExpertReferralsPage() {
  const auth = await requireRole("expert", "admin");
  const approvals = await fetchExpertReferrals();
  const expertCode =
    auth.profile.role === "expert" ? formatExpertCode(auth.userId) : null;

  return (
    <div className="admin-experts-page stack">
      <section className="card admin-experts-header">
        <h1>אישורי הרשמה</h1>
        <p className="muted">
          משתמשים שנרשמו דרך ההפניה שלכם חסומים עד שתאשרו או תדחו את הבקשה.
        </p>
      </section>

      {expertCode && <ExpertReferralCodeBanner expertCode={expertCode} />}

      <ExpertReferralsTable expertId={auth.userId} approvals={approvals} />
    </div>
  );
}
