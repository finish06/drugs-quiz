-- achievements table: stores badge unlock records for authenticated users
-- Spec: specs/achievements-badges.md AC-008
CREATE TABLE "achievements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "badge_id" varchar(64) NOT NULL,
  "earned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "context_json" jsonb
);
--> statement-breakpoint
CREATE INDEX "idx_achievements_user_id" ON "achievements" ("user_id");
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "uq_achievements_user_badge" UNIQUE("user_id","badge_id");
