import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import pg from "pg";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

let db: any;
let pool: any = null;

// Verificar se estamos em produção ou desenvolvimento
if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL não encontrada, usando SQLite para desenvolvimento");
  
  // Usar SQLite para desenvolvimento
  const sqlite = new Database("./local.db");
  db = drizzleSqlite(sqlite, { schema });
} else if (process.env.DATABASE_URL.startsWith("sqlite:")) {
  // SQLite explícito
  const dbPath = process.env.DATABASE_URL.replace("sqlite:///", "");
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema });
} else {
  // PostgreSQL para produção
  const { Pool } = pg;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { db, pool };
