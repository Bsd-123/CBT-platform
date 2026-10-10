import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Connection-level failures from the Supabase pooler (server unreachable, connection closed,
 * connect timeout). These are transient, so a retry is safe for reads and writes alike:
 * Prisma raises them before the statement reaches the database. Prisma reports them either
 * as an initialization error (often without a code) or as a request error with a P10xx code.
 */
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
const MAX_RETRIES = 2;

function isTransientConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return (
      !error.errorCode ||
      TRANSIENT_CODES.has(error.errorCode) ||
      /can't reach database server/i.test(error.message)
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_CODES.has(error.code);
  }
  return false;
}

function createClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  client.$use(async (params, next) => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await next(params);
      } catch (error) {
        if (attempt >= MAX_RETRIES || !isTransientConnectionError(error)) {
          throw error;
        }
      }
    }
  });

  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
