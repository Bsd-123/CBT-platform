import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { getAuthSession, getAuthenticatedProfile } from "@/lib/auth";

const PROFILE_MESSAGES: Record<string, string> = {
  missing_profile:
    "יש להשלים פרופיל לפני כניסה לפלטפורמה. אם איפסתם סיסמה, ייתכן שהפרופיל לא נמצא במערכת — מלאו את הפרטים מחדש.",
};

type CompleteProfilePageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function CompleteProfilePage({ searchParams }: CompleteProfilePageProps) {
  const { reason } = await searchParams;
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getAuthenticatedProfile();
  if (profile) {
    redirect("/");
  }

  const infoMessage = reason ? PROFILE_MESSAGES[reason] : undefined;

  return <CompleteProfileForm userId={session.userId} infoMessage={infoMessage} />;
}
