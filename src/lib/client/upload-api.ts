async function uploadFileToApi(endpoint: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const data = (await response.json().catch(() => null)) as { key?: string; error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `ההעלאה נכשלה (${response.status}).`);
  }

  if (!data?.key) {
    throw new Error("השרת לא החזיר מפתח קובץ.");
  }

  return data.key;
}

export function uploadMaterialFileViaApi(file: File): Promise<string> {
  return uploadFileToApi("/api/upload/material", file);
}

export function uploadMaterialResponseFileViaApi(file: File): Promise<string> {
  return uploadFileToApi("/api/upload/material-response", file);
}

export const uploadMaterialFileResilient = uploadMaterialFileViaApi;
export const uploadMaterialResponseFileResilient = uploadMaterialResponseFileViaApi;
