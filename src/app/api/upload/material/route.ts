import { buildMaterialFileKey } from "@/lib/r2";
import { handleUpload } from "@/lib/uploads/handle-upload";

export const maxDuration = 60;

export async function POST(request: Request) {
  return handleUpload(request, buildMaterialFileKey);
}
