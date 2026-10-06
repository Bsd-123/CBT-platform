import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "@/lib/r2/client";
import { r2Config } from "@/lib/r2/config";
import { createSignedUploadUrl } from "@/lib/r2/signed-url";

async function isObjectInR2(key: string, expectedSize: number): Promise<boolean> {
  try {
    const result = await getR2Client().send(
      new HeadObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      }),
    );
    return result.ContentLength === expectedSize;
  } catch {
    return false;
  }
}

/** SDK may throw after a successful upload when the HTTP response is altered (e.g. filtered SSL). */
function isResponseParsingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (
    error.name === "Unknown" ||
    error.name === "UnknownError" ||
    error.message === "UnknownError"
  ) {
    return true;
  }
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return metadata?.httpStatusCode === 418;
}

async function uploadViaSignedUrl(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<boolean> {
  const { uploadUrl } = await createSignedUploadUrl({ key, contentType });

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: new Blob([new Uint8Array(body)], { type: contentType }),
      headers: { "Content-Type": contentType },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function uploadObjectToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const expectedSize = body.byteLength;

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  } catch (error) {
    if (await isObjectInR2(key, expectedSize)) {
      return;
    }
    if (isResponseParsingError(error)) {
      return;
    }
  }

  const signedUrlOk = await uploadViaSignedUrl(key, body, contentType);
  if (signedUrlOk || (await isObjectInR2(key, expectedSize))) {
    return;
  }

  throw new Error("שגיאה בהעלאה ל-R2: לא ניתן לאמת שהקובץ נשמר.");
}
