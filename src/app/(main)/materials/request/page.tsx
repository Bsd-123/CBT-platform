import Link from "next/link";
import { PostMaterialRequestForm } from "@/components/materials/PostMaterialRequestForm";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export default function RequestMaterialPage() {
  return (
    <>
      <Link href="/materials" className="materials-back-link">
        <MaterialIcon name="arrow_forward" />
        חזרה לספריית חומרים
      </Link>

      <div className="materials-hero">
        <div>
          <h1>בקשת חומר</h1>
          <p>פרסמו בקשה לחומר שאתם מחפשים — הקהילה יכולה לעזור.</p>
        </div>
      </div>

      <section className="materials-clinical-card">
        <div className="materials-clinical-card-accent" />
        <div className="materials-clinical-card-body">
          <PostMaterialRequestForm />
        </div>
      </section>
    </>
  );
}
