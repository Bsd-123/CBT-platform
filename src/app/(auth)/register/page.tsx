import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="card auth-card">טוען...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
