/**
 * Where a stored file is served from: always the app's own domain. Downloads used to go to a
 * short-lived presigned URL on the storage host, which network filters kept blocking because the
 * host was unknown and every link was different. This URL is stable per file.
 */
export function fileDownloadPath(key: string, options: { inline?: boolean } = {}): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `/api/files/${path}${options.inline ? "?inline=1" : ""}`;
}

/** The readable file name: the stored key is `<prefix>/<user id>/<timestamp>-<name>`. */
export function fileNameFromKey(key: string): string {
  const last = key.split("/").pop() ?? "file";
  return last.replace(/^\d+-/, "") || "file";
}
