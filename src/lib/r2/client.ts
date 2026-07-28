import { Agent as HttpsAgent } from "node:https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { S3Client } from "@aws-sdk/client-s3";
import { r2Config } from "@/lib/r2/config";

let client: S3Client | undefined;
let clientConfigKey: string | undefined;

function shouldUseInsecureSsl(): boolean {
  return (
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" ||
    process.env.NODE_ENV === "development"
  );
}

function getClientConfigKey(): string {
  return `${r2Config.endpoint}|${shouldUseInsecureSsl()}`;
}

export function getR2Client(): S3Client {
  const useInsecureSsl = shouldUseInsecureSsl();
  const configKey = getClientConfigKey();

  if (!client || clientConfigKey !== configKey) {
    client = new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      ...(useInsecureSsl && {
        requestHandler: new NodeHttpHandler({
          httpsAgent: new HttpsAgent({ rejectUnauthorized: false }),
        }),
      }),
    });
    clientConfigKey = configKey;
  }

  return client;
}
