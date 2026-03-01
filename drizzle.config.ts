import { defineConfig } from "drizzle-kit";

let config: any = {
  out: "./migrations",
  schema: "./shared/schema.ts",
};

if (!process.env.DATABASE_URL) {
  // Usar SQLite para desenvolvimento
  config = {
    ...config,
    dialect: "sqlite",
    dbCredentials: {
      url: "./local.db",
    },
  };
} else if (process.env.DATABASE_URL.startsWith("sqlite:")) {
  // SQLite explícito
  const dbPath = process.env.DATABASE_URL.replace("sqlite:///", "");
  config = {
    ...config,
    dialect: "sqlite",
    dbCredentials: {
      url: dbPath,
    },
  };
} else {
  // PostgreSQL para produção
  config = {
    ...config,
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL,
    },
  };
}

export default defineConfig(config);
