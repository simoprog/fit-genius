import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "fitgenius_user",
    password: process.env.DB_PASSWORD || "fitgenius_password123",
    database: process.env.DB_NAME || "fitgenius",
  },
  verbose: true,
  strict: true,
});
