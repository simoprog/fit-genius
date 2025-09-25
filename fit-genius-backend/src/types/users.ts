import { users } from "../schema/users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
