import { BrandLogo } from "@/components/layout/BrandLogo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-page">
      <div className="auth-stack">
        <BrandLogo variant="stacked" />
        {children}
      </div>
    </div>
  );
}
