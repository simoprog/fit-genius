import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from "../schema";
import dotenv from "dotenv";

dotenv.config();

console.log("🔗 Initializing database connection...");

// Use explicit connection parameters instead of connection string
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "simo",
  password: process.env.DB_PASSWORD || "schweps123",
  database: process.env.DB_NAME || "fitgenius",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on("connect", () => {
  console.log("✅ Database connected successfully");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

// Initialize Drizzle with schema
export const db = drizzle(pool, { schema });
