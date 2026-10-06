export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (
    process.env.NODE_ENV === "production" &&
    (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" ||
      process.env.ALLOW_INSECURE_TLS === "true")
  ) {
    throw new Error(
      "Refusing to start: TLS certificate verification is disabled in production.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
