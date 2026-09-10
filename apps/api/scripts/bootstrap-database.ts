import { PrismaClient } from "@prisma/client";

const serverDatabase = "mysql";

export function databaseNameFromUrl(databaseUrl: string) {
  const { pathname } = new URL(databaseUrl);
  const databaseName = decodeURIComponent(pathname).replace(/^\//, "");

  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error("DATABASE_URL must name a MariaDB database using letters, numbers, or underscores.");
  }

  return databaseName;
}

export function serverUrlFromDatabaseUrl(databaseUrl: string) {
  const serverUrl = new URL(databaseUrl);
  serverUrl.pathname = `/${serverDatabase}`;
  return serverUrl.toString();
}

export async function bootstrapDatabase(databaseUrl: string) {
  const databaseName = databaseNameFromUrl(databaseUrl);
  const prisma = new PrismaClient({
    datasources: { db: { url: serverUrlFromDatabaseUrl(databaseUrl) } },
  });

  try {
    await prisma.$executeRawUnsafe(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  await bootstrapDatabase(databaseUrl);
  console.info("Database is ready.");
}

if (process.argv[1]?.endsWith("bootstrap-database.ts")) {
  void main();
}
