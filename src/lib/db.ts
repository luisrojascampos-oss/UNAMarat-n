import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

/**
 * Arranque de la base de datos SQLite.
 *
 * En Vercel (serverless) no hay sistema de archivos persistente: en cada
 * arranque en frío se copia la semilla incluida en el bundle (db/seed.db)
 * a /tmp y se usa durante la vida de la instancia de la función.
 */
if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL) {
    const DB_TMP = "/tmp/unamaraton.db";
    if (!fs.existsSync(DB_TMP)) {
      try {
        fs.copyFileSync(path.join(process.cwd(), "db/seed.db"), DB_TMP);
      } catch (err) {
        console.error("[db] No se pudo copiar la base de semilla a /tmp:", err);
      }
    }
    process.env.DATABASE_URL = `file:${DB_TMP}`;
  } else {
    // Ejecución local sin .env: base de datos del proyecto
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), "db", "custom.db")}`;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
