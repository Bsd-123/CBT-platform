import Link from "next/link";
import type { PublicMaterialRequest } from "@/lib/models/material-request";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialRequestListItemProps = {
  request: PublicMaterialRequest;
};

export function MaterialRequestListItem({ request }: MaterialRequestListItemProps) {
  const responseCount = request.responses?.length ?? 0;
  const detailHref = `/materials/requests/${request.id}`;

  return (
    <article className="materials-request-item">
      <div className="materials-request-item-row">
        <div className="materials-request-item-body">
          <Link href={detailHref} className="materials-request-title">
            {request.title}
          </Link>
          <p>{request.description}</p>
          <Link href={`${detailHref}#responses`} className="materials-request-responses-link">
            צפייה בכל החומרים שהועלו ({responseCount})
          </Link>
        </div>
        <Link
          href={`${detailHref}#respond`}
          className="materials-request-upload-btn"
          aria-label="העלאת חומר לבקשה זו"
          data-tooltip="העלאת חומר לבקשה זו"
        >
          <MaterialIcon name="upload" />
        </Link>
      </div>
    </article>
  );
}
