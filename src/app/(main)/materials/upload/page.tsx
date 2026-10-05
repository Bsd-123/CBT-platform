import Link from "next/link";
import { fetchMaterialTypes, fetchTags } from "@/lib/data";
import { UploadMaterialForm } from "@/components/materials/UploadMaterialForm";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export default async function UploadMaterialPage() {
  const [materialTypes, tags] = await Promise.all([
    fetchMaterialTypes(),
    fetchTags(),
  ]);

  return (
    <>
      <Link href="/materials" className="materials-back-link">
        <MaterialIcon name="arrow_forward" />
        חזרה לספריית חומרים
      </Link>

      <div className="materials-hero">
        <div>
          <h1>העלאת חומר</h1>
          <p>שתפו משאב טיפולי עם הקהילה המקצועית.</p>
        </div>
      </div>

      <section className="materials-clinical-card">
        <div className="materials-clinical-card-accent" />
        <div className="materials-clinical-card-body">
          <UploadMaterialForm materialTypes={materialTypes} tags={tags} />
        </div>
      </section>
    </>
  );
}
