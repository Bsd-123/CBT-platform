import { ENCODED_PARAM } from "@/lib/files/encoded";

/**
 * Where a stored file is served from: always the app's own domain. Downloads used to go to a
 * short-lived presigned URL on the storage host, which network filters kept blocking because the
 * host was unknown and every link was different. This URL is stable per file.
 */
export function fileDownloadPath(
  key: string,
  options: { inline?: boolean; encoded?: boolean } = {},
): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  const params = new URLSearchParams();
  if (options.inline) params.set("inline", "1");
  if (options.encoded) params.set(ENCODED_PARAM, "1");
  const query = params.toString();
  return `/api/files/${path}${query ? `?${query}` : ""}`;
}

/** The readable file name: the stored key is `<prefix>/<user id>/<timestamp>-<name>`. */
export function fileNameFromKey(key: string): string {
  const last = key.split("/").pop() ?? "file";
  return last.replace(/^\d+-/, "") || "file";
}
