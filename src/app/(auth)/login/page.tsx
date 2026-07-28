import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card auth-card stack"><p className="muted">טוען...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
