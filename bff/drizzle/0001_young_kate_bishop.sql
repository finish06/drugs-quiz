ALTER TABLE "quiz_sessions" ADD COLUMN "share_token" varchar(16);--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_share_token_unique" UNIQUE("share_token");