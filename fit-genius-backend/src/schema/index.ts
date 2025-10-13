import { refreshTokenRelations, refreshTokens } from "./refresh-tokens";
import { userRelations, users } from "./users";
import { userProfiles, userProfilesRelations } from "./user-profiles";

// For drizzle
export { users, userRelations } from "./users";
export { refreshTokens, refreshTokenRelations } from "./refresh-tokens";
export { userProfiles, userProfilesRelations } from "./user-profiles";

export const schema = {
  users,
  userRelations,
  refreshTokens,
  refreshTokenRelations,
  userProfiles,
  userProfilesRelations,
};
