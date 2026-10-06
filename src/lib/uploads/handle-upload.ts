import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { requireApprovedRegistration } from "@/lib/auth";
import { GENERIC_ERROR_MESSAGE, RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { uploadObjectToR2 } from "@/lib/r2";
import { checkUpload } from "@/lib/uploads/file-policy";

export async function handleUpload(
  request: Request,
  buildKey: (userId: string, fileName: string) => string,
): Promise<NextResponse> {
  try {
    const auth = await requireApprovedRegistration();
    enforceRateLimit("upload", auth.userId);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "לא נבחר קובץ." }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const check = checkUpload(file.name, buffer.byteLength, buffer.subarray(0, 16));
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const key = buildKey(auth.userId, file.name);
    await uploadObjectToR2(key, buffer, check.contentType);
    return NextResponse.json({ key });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    logger.error("upload failed", error, { route: new URL(request.url).pathname });
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
