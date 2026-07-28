"use client";

import { useState } from "react";
import { buildExpertReferralPath } from "@/lib/utils/expert-code";

type ExpertReferralCodeBannerProps = {
  expertCode: string;
};

export function ExpertReferralCodeBanner({ expertCode }: ExpertReferralCodeBannerProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const referralPath = buildExpertReferralPath(expertCode);
  const referralLink =
    typeof window === "undefined"
      ? referralPath
      : `${window.location.origin}${referralPath}`;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(expertCode);
      setCopied("code");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied("link");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="card admin-experts-code-banner stack">
      <div>
        <h2>קוד ההפניה שלכם</h2>
        <p className="muted">
          שתפו את הקוד או את קישור ההרשמה עם משתמשים חדשים. הם יידרשו להזין את הקוד בעת ההרשמה.
        </p>
      </div>

      <div className="admin-experts-code-banner-row">
        <code className="admin-experts-code admin-experts-code--large">{expertCode}</code>
        <div className="admin-experts-actions">
          <button type="button" className="button secondary" onClick={() => void handleCopyCode()}>
            {copied === "code" ? "הועתק" : "העתק קוד"}
          </button>
          <button type="button" className="button secondary" onClick={() => void handleCopyLink()}>
            {copied === "link" ? "הועתק" : "העתק קישור הרשמה"}
          </button>
        </div>
      </div>
    </section>
  );
}
