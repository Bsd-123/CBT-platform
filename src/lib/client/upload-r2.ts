export async function uploadFileToR2(
  file: File,
  getUploadUrl: (fileName: string, contentType: string) => Promise<{ uploadUrl: string; key: string }>,
): Promise<string> {
  const { uploadUrl, key } = await getUploadUrl(file.name, file.type || "application/octet-stream");

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });
  } catch {
    throw new Error(
      "לא ניתן להעלות מהדפדפן (רשת או CORS). ודאו ש-CORS מוגדר בדלי R2 עבור PUT מ-localhost.",
    );
  }

  if (!response.ok) {
    throw new Error(`העלאת הקובץ מהדפדפן נכשלה (${response.status}).`);
  }

  return key;
}
