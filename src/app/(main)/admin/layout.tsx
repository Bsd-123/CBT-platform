import { AdminNav } from "@/components/admin/AdminNav";
import { PageHero } from "@/components/ui/PageHero";
import { assertAdminAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertAdminAccess();

  return (
    <>
      <PageHero title="ניהול מערכת" subtitle="ניהול משתמשים, תוכן ודיווחים." />
      <AdminNav />
      {children}
    </>
  );
}
