import { relations } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { refreshTokens } from "./refresh-tokens";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(), // Required for JWT auth
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Relationships
export const userRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}));
