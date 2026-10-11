import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalRequestThread } from "@/components/professional-requests/ProfessionalRequestThread";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import {
  fetchProfessionalRequestById,
  fetchProfessionalRequestComments,
} from "@/lib/data";
import { isUuid } from "@/lib/utils/ids";
import "@/app/recommendations.css";

type ProfessionalRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfessionalRequestDetailPage({
  params,
}: ProfessionalRequestDetailPageProps) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const auth = await fetchAuthenticatedProfile();
  const [request, comments] = await Promise.all([
    fetchProfessionalRequestById(id, auth?.profile.role === "admin"),
    fetchProfessionalRequestComments(id),
  ]);

  if (!request) notFound();

  return (
    <div className="rec-chat-page">
      <Link href="/professional-requests" className="rec-chat-back-link">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_forward
        </span>
        חזרה לפניות מקצועיות
      </Link>

      {request.is_hidden && (
        <p className="banner-warning" role="status">
          הפנייה מוסתרת ואינה מוצגת למשתמשים. רק מנהלים רואים אותה.
        </p>
      )}

      <ProfessionalRequestThread request={request} comments={comments} />
    </div>
  );
}
