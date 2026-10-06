import { PostProfessionalRequestForm } from "@/components/professional-requests/PostProfessionalRequestForm";
import { ContentCard } from "@/components/ui/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalButton } from "@/components/ui/Modal";
import { PageHero } from "@/components/ui/PageHero";
import { fetchProfessionalRequests } from "@/lib/data";
import { countLabel, formatDate } from "@/lib/utils/format";

export default async function ProfessionalRequestsPage() {
  const requests = await fetchProfessionalRequests();

  return (
    <>
      <PageHero
        title="פניות מקצועיות"
        subtitle="דיון מקצועי פתוח עם שרשורי תגובות מלאים."
        actions={
          <ModalButton label="פנייה חדשה" icon="add" title="פרסום פנייה מקצועית">
            <PostProfessionalRequestForm />
          </ModalButton>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon="contact_support"
          title="עדיין לא פורסמו פניות"
          description="פתחו דיון מקצועי ושתפו את הקהילה."
        />
      ) : (
        <ul className="ui-list">
          {requests.map((request) => (
            <li key={request.id}>
              <ContentCard
                href={`/professional-requests/${request.id}`}
                title={request.title}
                excerpt={request.description}
                author={request.user?.full_name}
                dateLabel={formatDate(request.created_at)}
                stats={[
                  {
                    icon: "chat_bubble",
                    label: countLabel(request.comment_count ?? 0, "תגובה", "תגובות"),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
