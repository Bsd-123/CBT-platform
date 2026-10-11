import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalRequestCommentForm } from "@/components/professional-requests/ProfessionalRequestCommentForm";
import { ProfessionalRequestCommentThread } from "@/components/professional-requests/ProfessionalRequestCommentThread";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { ReportForm } from "@/components/shared/ReportForm";
import {
  fetchProfessionalRequestById,
  fetchProfessionalRequestComments,
} from "@/lib/data";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { formatDate } from "@/lib/utils/format";
import { isUuid } from "@/lib/utils/ids";

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
    <>
      <p>
        <Link href="/professional-requests">
          <MaterialIcon name="arrow_forward" /> חזרה לפניות מקצועיות
        </Link>
      </p>

      {request.is_hidden && (
        <p className="banner-warning" role="status">
          הפנייה מוסתרת ואינה מוצגת למשתמשים. רק מנהלים רואים אותה.
        </p>
      )}

      <section className="ui-section">
        <h1>{request.title}</h1>
        <div className="thread-meta">
          <strong>{request.user?.full_name}</strong>
          <span>{formatDate(request.created_at)}</span>
        </div>
        <p>{request.description}</p>
        <div className="thread-actions">
          <ReportForm targetType="professional_request" targetId={request.id} />
        </div>
      </section>

      <section className="ui-section">
        <h2>דיון</h2>
        <ProfessionalRequestCommentForm requestId={request.id} label="תגובה לפנייה" />
      </section>

      <ProfessionalRequestCommentThread requestId={request.id} comments={comments} />
    </>
  );
}
