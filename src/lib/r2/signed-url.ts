import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "@/lib/r2/client";
import { r2Config } from "@/lib/r2/config";

const DEFAULT_UPLOAD_EXPIRY_SECONDS = 300;
const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 300;

const FILE_KEY_PATTERN =
  /^(materials|material-responses)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/\d+-[a-zA-Z0-9._-]+$/i;

export function isValidFileKey(key: string): boolean {
  return key.length <= 300 && !key.includes("..") && FILE_KEY_PATTERN.test(key);
}

/** True when `key` is well-formed and sits under the given user's upload prefix. */
export function isFileKeyOwnedBy(
  key: string,
  userId: string,
  prefix: "materials" | "material-responses",
): boolean {
  return isValidFileKey(key) && key.startsWith(`${prefix}/${userId}/`);
}

export type SignedUploadUrlInput = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

export type SignedDownloadUrlInput = {
  key: string;
  expiresIn?: number;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
}

export function buildMaterialFileKey(userId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `materials/${userId}/${Date.now()}-${safeName}`;
}

export function buildMaterialResponseFileKey(
  userId: string,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  return `material-responses/${userId}/${Date.now()}-${safeName}`;
}

export async function createSignedUploadUrl(
  input: SignedUploadUrlInput,
): Promise<{ uploadUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: r2Config.bucketName,
    Key: input.key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: input.expiresIn ?? DEFAULT_UPLOAD_EXPIRY_SECONDS,
  });

  return { uploadUrl, key: input.key };
}

export async function createSignedDownloadUrl(
  input: SignedDownloadUrlInput,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: r2Config.bucketName,
    Key: input.key,
    ResponseContentDisposition: "attachment",
  });

  return getSignedUrl(getR2Client(), command, {
    expiresIn: input.expiresIn ?? DEFAULT_DOWNLOAD_EXPIRY_SECONDS,
  });
}
