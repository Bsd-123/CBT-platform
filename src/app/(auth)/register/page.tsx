import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isReferralCodeRequired } from "@/lib/auth";

export default async function RegisterPage() {
  const referralRequired = await isReferralCodeRequired();

  return (
    <Suspense fallback={<div className="card auth-card">טוען...</div>}>
      <RegisterForm referralRequired={referralRequired} />
    </Suspense>
  );
}
