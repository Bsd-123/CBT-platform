import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { UiProvider } from "@/components/ui/UiProvider";
import { fetchPendingMaterialCount } from "@/lib/data";
import { canReviewMaterials } from "@/lib/materials/approval";
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

  const pendingMaterials = canReviewMaterials(auth.profile.role)
    ? await fetchPendingMaterialCount()
    : 0;

  return (
    <UiProvider>
      <AppNav profile={auth.profile} pendingMaterials={pendingMaterials} />
      <main>{children}</main>
    </UiProvider>
  );
}
