import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "@/lib/r2/client";
import { r2Config } from "@/lib/r2/config";

const DEFAULT_UPLOAD_EXPIRY_SECONDS = 300;
const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 3600;

export type SignedUploadUrlInput = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

export type SignedDownloadUrlInput = {
  key: string;
  expiresIn?: number;
};

export function buildMaterialFileKey(userId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `materials/${userId}/${Date.now()}-${safeName}`;
}

export function buildMaterialResponseFileKey(
  userId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
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
  });

  return getSignedUrl(getR2Client(), command, {
    expiresIn: input.expiresIn ?? DEFAULT_DOWNLOAD_EXPIRY_SECONDS,
  });
}
