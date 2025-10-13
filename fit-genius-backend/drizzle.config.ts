import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "simo",
    password: process.env.DB_PASSWORD || "schweps123",
    database: process.env.DB_NAME || "fitgenius",
  },
  verbose: true,
  strict: true,
});
