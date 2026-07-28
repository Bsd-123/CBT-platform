import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchProfessionalRequestById,
  fetchProfessionalRequestComments,
} from "@/lib/actions";
import { ProfessionalRequestCommentForm } from "@/components/professional-requests/ProfessionalRequestCommentForm";
import { ProfessionalRequestCommentThread } from "@/components/professional-requests/ProfessionalRequestCommentThread";
import { ReportForm } from "@/components/shared/ReportForm";

type ProfessionalRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfessionalRequestDetailPage({
  params,
}: ProfessionalRequestDetailPageProps) {
  const { id } = await params;
  const [request, comments] = await Promise.all([
    fetchProfessionalRequestById(id),
    fetchProfessionalRequestComments(id),
  ]);

  if (!request) notFound();

  return (
    <div className="stack">
      <section className="card stack">
        <Link href="/professional-requests">← חזרה לפניות מקצועיות</Link>
        <h1>{request.title}</h1>
        <p className="muted">{request.user?.full_name}</p>
        <p>{request.description}</p>
        <ReportForm targetType="professional_request" targetId={request.id} />
      </section>

      <section className="card stack">
        <h2>דיון</h2>
        <ProfessionalRequestCommentForm requestId={request.id} label="תגובה לפנייה" />
        <ProfessionalRequestCommentThread requestId={request.id} comments={comments} />
      </section>
    </div>
  );
}
