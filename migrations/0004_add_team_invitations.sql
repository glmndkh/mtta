
CREATE TABLE IF NOT EXISTS "team_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "tournament_id" integer NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
  "event_type" text NOT NULL,
  "sender_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "receiver_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "team_name" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now()
);
