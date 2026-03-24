import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

/** Quiz type enum matching frontend SessionQuizType */
export const quizTypeEnum = pgEnum("quiz_type", [
  "name-the-class",
  "match-drug-to-class",
  "brand-generic-match",
  "quick-5",
]);

/** Users table — stores OAuth-authenticated accounts */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  oauthProvider: varchar("oauth_provider", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Quiz sessions table — stores completed quiz results with full answer data */
export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizType: quizTypeEnum("quiz_type").notNull(),
  questionCount: integer("question_count").notNull(),
  correctCount: integer("correct_count").notNull(),
  percentage: real("percentage").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  answersJson: jsonb("answers_json").notNull(),
});

/** Inferred TypeScript types from schema */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;
export type NewQuizSession = typeof quizSessions.$inferInsert;
export type QuizType =
  | "name-the-class"
  | "match-drug-to-class"
  | "brand-generic-match"
  | "quick-5";
