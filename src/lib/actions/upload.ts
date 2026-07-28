"use server";

import { requireApprovedRegistration } from "@/lib/auth";
import {
  buildMaterialFileKey,
  buildMaterialResponseFileKey,
  uploadObjectToR2,
} from "@/lib/r2";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function validateUploadFile(file: File): void {
  if (!file.size) {
    throw new Error("הקובץ ריק.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("גודל הקובץ חורג מ-50MB.");
  }
}

export async function uploadMaterialFile(file: File): Promise<string> {
  const auth = await requireApprovedRegistration();
  validateUploadFile(file);

  const key = buildMaterialFileKey(auth.userId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadObjectToR2(key, buffer, file.type || "application/octet-stream");
  return key;
}

export async function uploadMaterialResponseFile(file: File): Promise<string> {
  const auth = await requireApprovedRegistration();
  validateUploadFile(file);

  const key = buildMaterialResponseFileKey(auth.userId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadObjectToR2(key, buffer, file.type || "application/octet-stream");
  return key;
}
