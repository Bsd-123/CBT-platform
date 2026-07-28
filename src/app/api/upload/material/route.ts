import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { requireApprovedRegistration } from "@/lib/auth";
import { buildMaterialFileKey, uploadObjectToR2 } from "@/lib/r2";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function validateFile(file: File): void {
  if (!file.size) {
    throw new Error("הקובץ ריק.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("גודל הקובץ חורג מ-50MB.");
  }
}

async function handleUpload(
  request: Request,
  buildKey: (userId: string, fileName: string) => string,
) {
  const auth = await requireApprovedRegistration();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "לא נבחר קובץ." }, { status: 400 });
  }

  validateFile(file);

  const key = buildKey(auth.userId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadObjectToR2(key, buffer, file.type || "application/octet-stream");

  return NextResponse.json({ key });
}

export async function POST(request: Request) {
  try {
    return await handleUpload(request, buildMaterialFileKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ההעלאה נכשלה.";
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
