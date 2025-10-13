import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const userProfiles = pgTable("user-profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

  // Basic physical information
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", {
    enum: ["male", "female", "other"],
    length: 10,
  }).$default(() => "male"),
  height: integer("height"), // in centimeters
  currentWeightKg: decimal("current_weight_kg", { precision: 5, scale: 2 }),
  targetWeightKg: decimal("target_weight_kg", { precision: 5, scale: 2 }),
  activityLevel: varchar("activity_level", {
    enum: [
      "sedentary",
      "lightly_active",
      "moderately_active",
      "very_active",
      "super_active",
    ],
    length: 20,
  }).$default(() => "sedentary"),
  fitnessGoal: varchar("fitness_goal", {
    enum: ["lose_weight", "gain_weight", "maintain_weight"],
    length: 20,
  }).$default(() => "maintain_weight"),
  fitnessGoalWeight: integer("fitness_goal_weight"), // in kilograms

  // Calculated values (updated by AI service)
  bmr: integer("bmr"), // Basal Metabolic Rate
  tdee: integer("tdee"), // Total Daily Energy Expenditure
  dailyCalorieTarget: integer("daily_calorie_target"),
  dailyProteinTarget: integer("daily_protein_target"), // in grams
  dailyCarbsTarget: integer("daily_carbs_target"), // in grams
  dailyFatTarget: integer("daily_fat_target"), // in grams

  // Profile completion tracking
  isComplete: boolean("is_complete").default(false),
  completedSteps: text("completed_steps").array().default([]),
  // ['basic_info', 'physical_data', 'goals', 'preferences']
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles relationships
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));
