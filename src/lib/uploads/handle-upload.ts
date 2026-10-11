import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { requireApprovedRegistration } from "@/lib/auth";
import { GENERIC_ERROR_MESSAGE, RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { uploadObjectToR2 } from "@/lib/r2";
import { MAX_UPLOAD_BYTES, checkUpload } from "@/lib/uploads/file-policy";
import { readBodyWithLimit } from "@/lib/uploads/read-body";

export async function handleUpload(
  request: Request,
  buildKey: (userId: string, fileName: string) => string,
): Promise<NextResponse> {
  try {
    const auth = await requireApprovedRegistration();
    await enforceRateLimit("upload", auth.userId);

    // Cap the body while reading it (headroom for multipart framing); this also covers
    // chunked requests that send no Content-Length.
    const body = await readBodyWithLimit(request, MAX_UPLOAD_BYTES + 1024 * 1024);
    if (!body) {
      return NextResponse.json({ error: "גודל הקובץ חורג מ-50MB." }, { status: 413 });
    }

    const formData = await new Response(body, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
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
