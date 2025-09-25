import { refreshTokenRelations, refreshTokens } from "./refresh-tokens";
import { userRelations, users } from "./users";

// For drizzle
export { users, userRelations } from "./users";
export { refreshTokens, refreshTokenRelations } from "./refresh-tokens";

export const schema = {
  users,
  userRelations,
  refreshTokens,
  refreshTokenRelations,
};
