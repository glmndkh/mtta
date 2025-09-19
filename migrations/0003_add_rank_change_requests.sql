
-- Create rank change requests table
CREATE TABLE "rank_change_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "player_id" varchar NOT NULL REFERENCES "players"("id"),
  "current_rank" "player_rank",
  "requested_rank" "player_rank" NOT NULL,
  "proof_image_url" varchar NOT NULL,
  "status" varchar NOT NULL DEFAULT 'pending',
  "admin_notes" text,
  "reviewed_by" varchar REFERENCES "users"("id"),
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
