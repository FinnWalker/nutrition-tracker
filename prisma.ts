import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function getAdapterConnectionString(url: string) {
  const parsedUrl = new URL(url);

  // The pg driver adapter targets the database directly and does not need the
  // Prisma-specific schema query parameter.
  parsedUrl.searchParams.delete("schema");

  return parsedUrl.toString();
}

const adapter = new PrismaPg({
  connectionString: getAdapterConnectionString(connectionString),
});

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasSavedFoodDelegate(
  client: PrismaClient | undefined,
): client is PrismaClient {
  return Boolean(client && "savedFood" in client);
}

const cachedPrisma = globalForPrisma.prisma;

export const prisma: PrismaClient = hasSavedFoodDelegate(cachedPrisma)
  ? cachedPrisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
