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
  if (!client || !("savedFood" in client) || !("dailyEntry" in client)) {
    return false;
  }

  const runtimeDataModel = (
    client as PrismaClient & {
      _runtimeDataModel?: {
        models?: Record<
          string,
          {
            fields?: Array<{
              name?: string;
            }>;
          }
        >;
      };
    }
  )._runtimeDataModel;
  const dailyEntryFields = runtimeDataModel?.models?.DailyEntry?.fields ?? [];

  return dailyEntryFields.some((field) => field.name === "mealCategory");
}

const cachedPrisma = globalForPrisma.prisma;

export const prisma: PrismaClient = hasSavedFoodDelegate(cachedPrisma)
  ? cachedPrisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
