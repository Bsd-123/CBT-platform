import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import {
  getAuthSession,
  getAuthenticatedProfile,
  getRegistrationStatus,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  const auth = await getAuthenticatedProfile();
  if (!auth) {
    redirect("/complete-profile?reason=missing_profile");
  }

  const registrationStatus = await getRegistrationStatus(auth.userId);
  if (registrationStatus === "pending") {
    redirect("/pending-approval");
  }

  if (registrationStatus === "rejected") {
    redirect("/pending-approval");
  }

  return (
    <>
      <AppNav profile={auth.profile} />
      <main>{children}</main>
    </>
  );
}
