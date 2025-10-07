import { users } from "../schema/users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UpsertUser = {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};
