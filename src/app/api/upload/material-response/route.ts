import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { requireApprovedRegistration } from "@/lib/auth";
import { buildMaterialResponseFileKey, uploadObjectToR2 } from "@/lib/r2";

export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await requireApprovedRegistration();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "לא נבחר קובץ." }, { status: 400 });
    }

    if (!file.size) {
      return NextResponse.json({ error: "הקובץ ריק." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "גודל הקובץ חורג מ-50MB." }, { status: 400 });
    }

    const key = buildMaterialResponseFileKey(auth.userId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadObjectToR2(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ההעלאה נכשלה.";
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
