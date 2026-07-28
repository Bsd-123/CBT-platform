import Link from "next/link";
import { fetchProfessionalRequests } from "@/lib/actions";
import { PostProfessionalRequestForm } from "@/components/professional-requests/PostProfessionalRequestForm";

export default async function ProfessionalRequestsPage() {
  const requests = await fetchProfessionalRequests();

  return (
    <div className="stack">
      <section className="card">
        <h1>פניות מקצועיות</h1>
        <p className="muted">
          דיון מקצועי פתוח עם שרשורי תגובות מלאים. ללא דירוגים או לייקים.
        </p>
      </section>

      <section className="card">
        <PostProfessionalRequestForm />
      </section>

      <section className="card stack">
        <h2>פניות ({requests.length})</h2>
        {requests.length === 0 ? (
          <p className="muted">עדיין לא פורסמו פניות מקצועיות.</p>
        ) : (
          <ul className="list-plain">
            {requests.map((request) => (
              <li key={request.id}>
                <Link href={`/professional-requests/${request.id}`}>
                  <strong>{request.title}</strong>
                </Link>
                <p className="muted">{request.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
