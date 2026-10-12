import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "@/lib/r2/client";
import { r2Config } from "@/lib/r2/config";

export type R2Download = {
  /** 200 full, 206 partial, 304 not modified, 416 range not satisfiable. */
  status: 200 | 206 | 304 | 416;
  /** Null for HEAD, 304 and 416. */
  body: ReadableStream<Uint8Array> | null;
  contentLength?: number;
  contentRange?: string;
  etag?: string;
  lastModified?: Date;
};

export type R2DownloadOptions = {
  /** A single `bytes=a-b` range, already validated by the caller. */
  range?: string;
  ifNoneMatch?: string;
  /** Headers only, no body. */
  head?: boolean;
};

type AwsError = { name?: string; $metadata?: { httpStatusCode?: number } };

/**
 * Reads an object from the private bucket for the app to stream to the browser. Returns null
 * when the object does not exist. Range and conditional requests are passed through to R2, so
 * large files can resume and unchanged files cost no bandwidth.
 */
export async function getObjectFromR2(
  key: string,
  { range, ifNoneMatch, head = false }: R2DownloadOptions = {},
): Promise<R2Download | null> {
  const client = getR2Client();
  const common = { Bucket: r2Config.bucketName, Key: key };

  try {
    if (head) {
      const result = await client.send(new HeadObjectCommand({ ...common, IfNoneMatch: ifNoneMatch, Range: range }));
      return {
        status: range ? 206 : 200,
        body: null,
        contentLength: result.ContentLength,
        etag: result.ETag,
        lastModified: result.LastModified,
      };
    }

    const result = await client.send(new GetObjectCommand({ ...common, IfNoneMatch: ifNoneMatch, Range: range }));
    return {
      status: result.ContentRange ? 206 : 200,
      body: result.Body ? result.Body.transformToWebStream() : null,
      contentLength: result.ContentLength,
      contentRange: result.ContentRange,
      etag: result.ETag,
      lastModified: result.LastModified,
    };
  } catch (error) {
    const { name, $metadata } = error as AwsError;
    const code = $metadata?.httpStatusCode;
    if (code === 304 || name === "NotModified") return { status: 304, body: null };
    if (code === 416 || name === "InvalidRange") return { status: 416, body: null };
    if (code === 404 || name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}
