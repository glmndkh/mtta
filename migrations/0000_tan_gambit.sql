CREATE TYPE "public"."champion_type" AS ENUM('өсвөрийн', 'ахмадын', 'улсын');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."judge_type" AS ENUM('domestic', 'international');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'ongoing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."membership_type" AS ENUM('adult', 'child');--> statement-breakpoint
CREATE TYPE "public"."player_rank" AS ENUM('Шинэ тоглогч', '3-р зэрэг', '2-р зэрэг', '1-р зэрэг', 'спортын дэд мастер', 'спортын мастер', 'олон улсын хэмжээний мастер');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('registration', 'ongoing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('player', 'club_owner', 'admin', 'score_recorder');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"achieved_at" timestamp DEFAULT now(),
	"category" varchar NOT NULL,
	"icon_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"leader" varchar,
	"leadership_members" text,
	"address" text,
	"location" varchar,
	"activities" text,
	"image_url" varchar,
	"coordinates" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_coaches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" varchar NOT NULL,
	"user_id" varchar,
	"name" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"owner_id" varchar,
	"owner_name" varchar,
	"address" text,
	"country" varchar,
	"province" varchar,
	"city" varchar,
	"phone" varchar,
	"email" varchar,
	"logo_url" varchar,
	"color_theme" varchar DEFAULT 'var(--success)',
	"schedule" text,
	"website" varchar,
	"training_info" text,
	"extra_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "federation_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"position" varchar,
	"image_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_sliders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"subtitle" text,
	"description" text,
	"image_url" varchar NOT NULL,
	"link_url" varchar,
	"button_text" varchar,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "judges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"image_url" varchar,
	"judge_type" "judge_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" varchar NOT NULL,
	"team1_id" varchar NOT NULL,
	"team2_id" varchar NOT NULL,
	"team1_score" integer DEFAULT 0,
	"team2_score" integer DEFAULT 0,
	"match_date" timestamp,
	"match_time" varchar,
	"status" varchar DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_player_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_match_id" varchar NOT NULL,
	"player1_id" varchar NOT NULL,
	"player2_id" varchar NOT NULL,
	"player1_name" varchar NOT NULL,
	"player2_name" varchar NOT NULL,
	"sets" jsonb NOT NULL,
	"player1_sets_won" integer DEFAULT 0,
	"player2_sets_won" integer DEFAULT 0,
	"winner_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"season" varchar,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "match_sets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" varchar NOT NULL,
	"set_number" integer NOT NULL,
	"player1_score" integer NOT NULL,
	"player2_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar,
	"player1_id" varchar NOT NULL,
	"player2_id" varchar NOT NULL,
	"winner_id" varchar,
	"status" "match_status" DEFAULT 'scheduled',
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"round" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" varchar NOT NULL,
	"type" "membership_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"amount" integer NOT NULL,
	"paid" boolean DEFAULT false,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "national_team_players" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"age" integer,
	"image_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_feed" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"image_url" varchar,
	"category" varchar,
	"author_id" varchar NOT NULL,
	"published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "past_champions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"year" varchar NOT NULL,
	"gender" "gender",
	"champion_type" "champion_type",
	"image_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"member_number" varchar,
	"club_id" varchar,
	"ranking_all_ages" integer,
	"ranking_own_age" integer,
	"rank" "player_rank",
	"points" integer DEFAULT 0,
	"achievements" text,
	"date_of_birth" timestamp,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"win_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "players_member_number_unique" UNIQUE("member_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"logo_url" varchar NOT NULL,
	"website" varchar,
	"description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"club_id" varchar NOT NULL,
	"league_id" varchar NOT NULL,
	"logo_url" varchar,
	"color_theme" varchar DEFAULT 'var(--success)',
	"sponsor" varchar,
	"points" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"participation_type" varchar NOT NULL,
	"registered_at" timestamp DEFAULT now(),
	"status" varchar DEFAULT 'registered' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"group_stage_results" jsonb,
	"knockout_results" jsonb,
	"final_rankings" jsonb,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tournament_results_tournament_id_unique" UNIQUE("tournament_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_team_players" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_team_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"player_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"logo_url" varchar,
	"sponsor_logo" varchar,
	"owner_name" varchar,
	"coach_name" varchar,
	"entity_type" varchar DEFAULT 'tournament',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"rich_description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"registration_deadline" timestamp,
	"location" varchar,
	"organizer" varchar,
	"max_participants" integer,
	"entry_fee" numeric(10, 2),
	"status" "tournament_status" DEFAULT 'registration',
	"participation_types" text[],
	"rules" text,
	"prizes" text,
	"contact_info" text,
	"schedule" text,
	"requirements" text,
	"is_published" boolean DEFAULT false,
	"organizer_id" varchar NOT NULL,
	"club_id" varchar,
	"background_image_url" varchar,
	"regulation_document_url" varchar,
	"min_rating" varchar,
	"max_rating" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"phone" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"gender" "gender",
	"date_of_birth" timestamp,
	"club_affiliation" varchar,
	"profile_image_url" varchar,
	"province" varchar,
	"city" varchar,
	"rubber_types" jsonb DEFAULT '[]'::jsonb,
	"handedness" varchar,
	"playing_styles" jsonb DEFAULT '[]'::jsonb,
	"bio" text,
	"membership_type" "membership_type" DEFAULT 'adult',
	"membership_start_date" timestamp,
	"membership_end_date" timestamp,
	"membership_active" boolean DEFAULT false,
	"membership_amount" integer DEFAULT 0,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_coaches" ADD CONSTRAINT "club_coaches_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_coaches" ADD CONSTRAINT "club_coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judges" ADD CONSTRAINT "judges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_matches" ADD CONSTRAINT "league_matches_team1_id_tournament_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."tournament_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_matches" ADD CONSTRAINT "league_matches_team2_id_tournament_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."tournament_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_player_matches" ADD CONSTRAINT "league_player_matches_league_match_id_league_matches_id_fk" FOREIGN KEY ("league_match_id") REFERENCES "public"."league_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_player_matches" ADD CONSTRAINT "league_player_matches_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_player_matches" ADD CONSTRAINT "league_player_matches_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_player_matches" ADD CONSTRAINT "league_player_matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_feed" ADD CONSTRAINT "news_feed_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team_players" ADD CONSTRAINT "tournament_team_players_tournament_team_id_tournament_teams_id_fk" FOREIGN KEY ("tournament_team_id") REFERENCES "public"."tournament_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team_players" ADD CONSTRAINT "tournament_team_players_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");