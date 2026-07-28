function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const r2Config = {
  get accountId(): string {
    return requireEnv("R2_ACCOUNT_ID");
  },

  get accessKeyId(): string {
    return requireEnv("R2_ACCESS_KEY_ID");
  },

  get secretAccessKey(): string {
    return requireEnv("R2_SECRET_ACCESS_KEY");
  },

  get bucketName(): string {
    return requireEnv("R2_BUCKET_NAME");
  },

  get endpoint(): string {
    const customEndpoint = process.env.R2_UPLOAD_ENDPOINT?.trim();
    if (customEndpoint) {
      return customEndpoint.replace(/\/$/, "");
    }
    return `https://${this.accountId}.r2.cloudflarestorage.com`;
  },
} as const;
