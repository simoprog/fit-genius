import { drizzle } from "drizzle-orm/singlestore/driver";
import { Pool } from "pg";
import { schema } from "../src/schema";

export const db = drizzle(
  new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  { schema }
);
