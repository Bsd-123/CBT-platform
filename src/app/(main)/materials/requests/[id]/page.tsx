import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMaterialRequestById } from "@/lib/actions";
import { MaterialResponseForm } from "@/components/materials/MaterialResponseForm";
import { DownloadMaterialButton } from "@/components/materials/DownloadMaterialButton";

type MaterialRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaterialRequestDetailPage({ params }: MaterialRequestDetailPageProps) {
  const { id } = await params;
  const request = await fetchMaterialRequestById(id);
  if (!request) notFound();

  return (
    <div className="stack">
      <section className="card stack">
        <Link href="/materials">← חזרה לספריית חומרים</Link>
        <h1>{request.title}</h1>
        <p className="muted">{request.user?.full_name}</p>
        <p>{request.description}</p>
      </section>

      <section id="responses" className="card stack">
        <h2>חומרים שהועלו ({request.responses?.length ?? 0})</h2>
        {request.responses && request.responses.length > 0 ? (
          <ul className="list-plain">
            {request.responses.map((response) => (
              <li key={response.id}>
                <p>{response.text ?? "—"}</p>
                <p className="muted">{response.user?.full_name}</p>
                {response.file_url && (
                  <DownloadMaterialButton fileKey={response.file_url} label="הורדת קובץ מצורף" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">עדיין אין תגובות.</p>
        )}
      </section>

      <section id="respond" className="card">
        <MaterialResponseForm requestId={request.id} />
      </section>
    </div>
  );
}
