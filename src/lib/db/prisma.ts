import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Connection-level failures from the Supabase pooler (server unreachable, connection closed,
 * connect timeout). These are transient, so one retry is safe for reads and writes alike:
 * Prisma raises them before the statement reaches the database.
 */
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1017"]);

function createClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientInitializationError &&
        error.errorCode &&
        TRANSIENT_CODES.has(error.errorCode)
      ) {
        return next(params);
      }
      throw error;
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
