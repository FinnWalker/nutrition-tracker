import "dotenv/config";
import { defineConfig } from "prisma/config";

const isMigrationCommand = process.argv.some((arg) => arg.startsWith("migrate"));

const datasourceUrl = process.env.DIRECT_URL;

if (isMigrationCommand && !datasourceUrl) {
  throw new Error("DIRECT_URL is required for Prisma migrations.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: datasourceUrl
    ? {
        url: datasourceUrl,
      }
    : undefined,
});
