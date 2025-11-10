import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
  serial, // Import serial
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["player", "club_owner", "admin", "score_recorder"]);

// Membership types enum
export const membershipTypeEnum = pgEnum("membership_type", ["adult", "child"]);

// Tournament status enum
export const tournamentStatusEnum = pgEnum("tournament_status", ["registration", "ongoing", "completed"]);

// Match status enum
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "ongoing", "completed"]);

// Gender enum
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

// Club status enum
export const clubStatusEnum = pgEnum("club_status", ["active", "inactive"]);

// Player rank enum
export const playerRankEnum = pgEnum("player_rank", [
  "Шинэ тоглогч",
  "3-р зэрэг",
  "2-р зэрэг",
  "1-р зэрэг",
  "спортын дэд мастер",
  "спортын мастер",
  "олон улсын хэмжээний мастер"
]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone").unique(),
  password: varchar("password"), // Added password field
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  gender: genderEnum("gender"),
  dateOfBirth: timestamp("date_of_birth"),
  clubAffiliation: varchar("club_affiliation"), // Club name or location where they usually play
  profileImageUrl: varchar("profile_image_url"),
  // New profile fields
  province: varchar("province"), // Mongolia province/aimag
  city: varchar("city"), // City/district within province
  rubberTypes: jsonb("rubber_types").$type<string[]>().default([]), // Array of rubber types
  handedness: varchar("handedness"), // 'right' or 'left'
  playingStyles: jsonb("playing_styles").$type<string[]>().default([]), // Array of playing styles
  bio: text("bio"), // User biography/description
  // Membership tracking
  membershipType: membershipTypeEnum("membership_type").default("adult"),
  membershipStartDate: timestamp("membership_start_date"),
  membershipEndDate: timestamp("membership_end_date"),
  membershipActive: boolean("membership_active").default(false),
  membershipAmount: integer("membership_amount").default(0), // Amount paid for membership
  role: userRoleEnum("role").default("player").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Players table
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  memberNumber: varchar("member_number").unique(),
  clubId: varchar("club_id").references(() => clubs.id),
  rankingAllAges: integer("ranking_all_ages"),
  rankingOwnAge: integer("ranking_own_age"),
  rank: playerRankEnum("rank").default("Шинэ тоглогч"), // Admin-assigned rank using enum with default value
  points: integer("points").default(0), // Admin-only editable points field
  achievements: text("achievements"), // Admin-only editable achievements text field
  dateOfBirth: timestamp("date_of_birth"),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  winPercentage: integer("win_percentage").default(0), // stored as percentage * 100
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  achievedAt: timestamp("achieved_at").defaultNow(),
  category: varchar("category").notNull(), // "tournament", "match", "milestone", etc.
  iconUrl: varchar("icon_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clubs table
export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  ownerName: varchar("owner_name"),
  // Address fields
  address: text("address"),
  country: varchar("country"),
  province: varchar("province"),
  city: varchar("city"),
  district: varchar("district"),
  street: varchar("street"),
  // Contact information
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  facebook: varchar("facebook"),
  instagram: varchar("instagram"),
  // Club details
  logoUrl: varchar("logo_url"),
  verified: boolean("verified").default(false),
  status: clubStatusEnum("status").default("active"),
  colorTheme: varchar("color_theme").default("var(--success)"),
  // Lists stored as JSON arrays
  coaches: jsonb("coaches").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  // Schedules and info
  openingHours: jsonb("opening_hours").$type<{
    [key: string]: { open: string; close: string; closed?: boolean }
  }>(),
  schedule: text("schedule"),
  weeklySchedule: jsonb("weekly_schedule").$type<{
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }>(),
  trainingInfo: text("training_info"),
  extraData: jsonb("extra_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Memberships table
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  type: membershipTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  amount: integer("amount").notNull(), // in tugrik
  paid: boolean("paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  richDescription: text("rich_description"), // Rich text content with embedded media
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline"),
  location: varchar("location"),
  organizer: varchar("organizer"), // Optional organizer name
  maxParticipants: integer("max_participants"),
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }),
  status: tournamentStatusEnum("status").default("registration"),
  participationTypes: text("participation_types").array(), // ["singles", "doubles", "mixed_doubles", "team"]
  rules: text("rules"),
  prizes: text("prizes"),
  contactInfo: text("contact_info"),
  schedule: text("schedule"), // JSON string for detailed schedule
  requirements: text("requirements"),
  isPublished: boolean("is_published").default(false),
  organizerId: varchar("organizer_id").references(() => users.id).notNull(),
  clubId: varchar("club_id").references(() => clubs.id),
  // New fields for enhanced tournament features
  backgroundImageUrl: varchar("background_image_url"), // Background image for tournament
  regulationDocumentUrl: varchar("regulation_document_url"), // Tournament regulation document
  minRating: varchar("min_rating"), // Minimum rating/rank requirement (e.g., "Beginner", "Intermediate")
  maxRating: varchar("max_rating"), // Maximum rating/rank requirement
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament participants
export const tournamentParticipants = pgTable("tournament_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  participationType: varchar("participation_type").notNull(), // "singles", "doubles", etc.
  registeredAt: timestamp("registered_at").defaultNow(),
  status: varchar("status").notNull().default("registered"), // registered, cancelled, confirmed
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id),
  player1Id: varchar("player1_id").references(() => players.id).notNull(),
  player2Id: varchar("player2_id").references(() => players.id).notNull(),
  winnerId: varchar("winner_id").references(() => players.id),
  status: matchStatusEnum("status").default("scheduled"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  round: varchar("round"), // "quarter", "semi", "final", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Match sets table for detailed scoring
export const matchSets = pgTable("match_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id).notNull(),
  setNumber: integer("set_number").notNull(),
  player1Score: integer("player1_score").notNull(),
  player2Score: integer("player2_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament results table for storing structured tournament results
export const tournamentResults = pgTable("tournament_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull().unique(),
  groupStageResults: jsonb("group_stage_results"), // JSON structure for group stage data
  knockoutResults: jsonb("knockout_results"), // JSON structure for bracket/knockout data
  finalRankings: jsonb("final_rankings"), // Final tournament rankings/placements
  isPublished: boolean("is_published").default(false), // Whether results are visible to users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leagues table
export const leagues = pgTable("leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  season: varchar("season"), // "2024 Spring", etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  leagueId: varchar("league_id").references(() => leagues.id).notNull(),
  logoUrl: varchar("logo_url"),
  colorTheme: varchar("color_theme").default("var(--success)"),
  sponsor: varchar("sponsor"),
  points: integer("points").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament teams table for managing teams within specific tournaments
export const tournamentTeams = pgTable("tournament_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull(), // Removed foreign key constraint for flexibility
  name: varchar("name").notNull(),
  logoUrl: varchar("logo_url"),
  sponsorLogo: varchar("sponsor_logo"),
  ownerName: varchar("owner_name"),
  coachName: varchar("coach_name"),
  entityType: varchar("entity_type").default("tournament"), // 'tournament' or 'league'
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament team players for linking players to tournament teams
export const tournamentTeamPlayers = pgTable("tournament_team_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentTeamId: varchar("tournament_team_id").references(() => tournamentTeams.id).notNull(),
  playerId: varchar("player_id").references(() => users.id).notNull(), // Link directly to users for easier management
  playerName: varchar("player_name").notNull(), // Store display name
  createdAt: timestamp("created_at").defaultNow(),
});

// League matches table for storing team vs team matches
export const leagueMatches = pgTable("league_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull(), // Reference to tournament/league
  team1Id: varchar("team1_id").references(() => tournamentTeams.id).notNull(),
  team2Id: varchar("team2_id").references(() => tournamentTeams.id).notNull(),
  team1Score: integer("team1_score").default(0), // Number of individual matches won by team 1
  team2Score: integer("team2_score").default(0), // Number of individual matches won by team 2
  matchDate: timestamp("match_date"),
  matchTime: varchar("match_time"),
  status: varchar("status").default("completed"), // "scheduled", "in_progress", "completed"
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual player matches within league matches
export const leaguePlayerMatches = pgTable("league_player_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueMatchId: varchar("league_match_id").references(() => leagueMatches.id).notNull(),
  player1Id: varchar("player1_id").references(() => users.id).notNull(),
  player2Id: varchar("player2_id").references(() => users.id).notNull(),
  player1Name: varchar("player1_name").notNull(),
  player2Name: varchar("player2_name").notNull(),
  sets: jsonb("sets").notNull(), // Array of set scores: [{player1: 11, player2: 9}, {player1: 8, player2: 11}, ...]
  player1SetsWon: integer("player1_sets_won").default(0),
  player2SetsWon: integer("player2_sets_won").default(0),
  winnerId: varchar("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// News feed table
export const newsFeed = pgTable("news_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: varchar("image_url"), // Now stores object storage path instead of URL
  category: varchar("category"), // "tournament", "news", "training", "urgent"
  authorId: varchar("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Homepage sliders table
export const homepageSliders = pgTable("homepage_sliders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title"),
  subtitle: text("subtitle"),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  linkUrl: varchar("link_url"),
  buttonText: varchar("button_text"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsors table
export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  logoUrl: varchar("logo_url").notNull(), // Object storage path for sponsor logo
  website: varchar("website"), // Optional sponsor website URL
  description: text("description"), // Optional sponsor description
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branches table
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  leader: varchar("leader"),
  leadershipMembers: text("leadership_members"),
  address: text("address"),
  location: varchar("location"),
  activities: text("activities"),
  imageUrl: varchar("image_url"),
  coordinates: varchar("coordinates"), // Format: "latitude, longitude"
  createdAt: timestamp("created_at").defaultNow(),
});

// Federation members table
export const federationMembers = pgTable("federation_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  position: varchar("position"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// National team players table
export const nationalTeamPlayers = pgTable("national_team_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  age: integer("age"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// National team coaches table
export const nationalTeamCoaches = pgTable("national_team_coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  age: integer("age"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Judge type enum
export const judgeTypeEnum = pgEnum("judge_type", ["domestic", "international"]);

// Judge role enum
export const judgeRoleEnum = pgEnum("judge_role", ["chairperson", "member"]);

// Judges table
export const judges = pgTable("judges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  imageUrl: varchar("image_url"),
  judgeType: judgeTypeEnum("judge_type").notNull(),
  role: judgeRoleEnum("role"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Club coaches table
export const clubCoaches = pgTable("club_coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Champion type enum
export const championTypeEnum = pgEnum("champion_type", ["өсвөрийн", "ахмадын", "улсын"]);

// Past champions table
export const pastChampions = pgTable("past_champions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  year: varchar("year").notNull(), // Changed to varchar to support multiple years like "2023-2024"
  gender: genderEnum("gender"),
  championType: championTypeEnum("champion_type"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rank change requests table
export const rankChangeRequests = pgTable("rank_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  currentRank: playerRankEnum("current_rank"),
  requestedRank: playerRankEnum("requested_rank").notNull(),
  proofImageUrl: varchar("proof_image_url").notNull(), // Object storage path for rank proof image
  status: varchar("status").notNull().default("pending"), // "pending", "approved", "rejected"
  adminNotes: text("admin_notes"), // Admin feedback/notes
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members table (original definition)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provisional teams table for tracking team formation before confirmation
export const provisionalTeams = pgTable("provisional_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamName: text("team_name"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, expired
  requiredMembers: integer("required_members").notNull(), // Number of members needed
  acceptedMembers: integer("accepted_members").default(0), // Number who accepted
  confirmedTeamId: varchar("confirmed_team_id").references(() => tournamentTeams.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at").notNull().default(sql`NOW() + INTERVAL '24 hours'`), // 24-hour expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team invitations table - enhanced with provisional team tracking
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  provisionalTeamId: varchar("provisional_team_id").references(() => provisionalTeams.id, { onDelete: "cascade" }),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamName: text("team_name"),
  teamId: varchar("team_id").references(() => tournamentTeams.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed, expired
  expiresAt: timestamp("expires_at").notNull().default(sql`NOW() + INTERVAL '24 hours'`), // 24-hour expiration
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  player: one(players, {
    fields: [users.id],
    references: [players.userId],
  }),
  ownedClubs: many(clubs),
  authoredNews: many(newsFeed),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  memberships: many(memberships),
  tournamentParticipations: many(tournamentParticipants),
  matchesAsPlayer1: many(matches, { relationName: "player1" }),
  matchesAsPlayer2: many(matches, { relationName: "player2" }),
  matchesWon: many(matches, { relationName: "winner" }),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  owner: one(users, {
    fields: [clubs.ownerId],
    references: [users.id],
  }),
  players: many(players),
  coaches: many(clubCoaches),
  teams: many(teams),
  tournaments: many(tournaments),
}));

export const clubCoachesRelations = relations(clubCoaches, ({ one }) => ({
  club: one(clubs, {
    fields: [clubCoaches.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubCoaches.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  player1: one(players, {
    fields: [matches.player1Id],
    references: [players.id],
    relationName: "player1",
  }),
  player2: one(players, {
    fields: [matches.player2Id],
    references: [players.id],
    relationName: "player2",
  }),
  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id],
    relationName: "winner",
  }),
  sets: many(matchSets),
}));

// Tournament results relations
export const tournamentResultsRelations = relations(tournamentResults, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentResults.tournamentId],
    references: [tournaments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
  wins: true,
  losses: true,
  winPercentage: true,
});

export const insertClubSchema = createInsertSchema(clubs)
  .omit({
    id: true,
    createdAt: true,
  })
  .refine((data) => data.ownerId || data.ownerName, {
    message: "ownerId or ownerName is required",
    path: ["ownerId"],
  });

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertNewsSchema = createInsertSchema(newsFeed).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}).extend({
  content: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export const insertHomepageSliderSchema = createInsertSchema(homepageSliders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().optional().nullable(),
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertFederationMemberSchema = createInsertSchema(federationMembers).omit({
  id: true,
  createdAt: true,
});

export const insertNationalTeamPlayerSchema = createInsertSchema(nationalTeamPlayers).omit({
  id: true,
  createdAt: true,
});

export const insertNationalTeamCoachSchema = createInsertSchema(nationalTeamCoaches).omit({
  id: true,
  createdAt: true,
});

export const insertJudgeSchema = createInsertSchema(judges).omit({
  id: true,
  createdAt: true,
}).refine(data => data.userId || (data.firstName && data.lastName), {
  message: "userId эсвэл firstName болон lastName заавал байх ёстой",
  path: ["userId"],
});

export const insertClubCoachSchema = createInsertSchema(clubCoaches).omit({
  id: true,
  createdAt: true,
}).refine(data => data.userId || data.name, {
  message: "userId or name is required",
  path: ["userId"],
});

export const insertChampionSchema = createInsertSchema(pastChampions).omit({
  id: true,
  createdAt: true,
}).extend({
  year: z.string().min(1, "Он заавал оруулна уу"),
  gender: z.enum(["male", "female", "other"]).optional(),
  championType: z.enum(["өсвөрийн", "ахмадын", "улсын"]).optional(),
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentResultsSchema = createInsertSchema(tournamentResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Password reset token insert schema
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);

// Rank change request schemas
export const insertRankChangeRequestSchema = createInsertSchema(rankChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});
export const selectRankChangeRequestSchema = createSelectSchema(rankChangeRequests);

// Provisional teams schemas
export const insertProvisionalTeamSchema = createInsertSchema(provisionalTeams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectProvisionalTeamSchema = createSelectSchema(provisionalTeams);

// Team invitations schemas
export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
});
export const selectTeamInvitationSchema = createSelectSchema(teamInvitations);

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type MatchSet = typeof matchSets.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsFeed.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type InsertHomepageSlider = z.infer<typeof insertHomepageSliderSchema>;
export type HomepageSlider = typeof homepageSliders.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertFederationMember = z.infer<typeof insertFederationMemberSchema>;
export type FederationMember = typeof federationMembers.$inferSelect;
export type InsertNationalTeamPlayer = z.infer<typeof insertNationalTeamPlayerSchema>;
export type NationalTeamPlayer = typeof nationalTeamPlayers.$inferSelect;
export type InsertNationalTeamCoach = z.infer<typeof insertNationalTeamCoachSchema>;
export type NationalTeamCoach = typeof nationalTeamCoaches.$inferSelect;
export type InsertJudge = z.infer<typeof insertJudgeSchema>;
export type Judge = typeof judges.$inferSelect;
export type InsertClubCoach = z.infer<typeof insertClubCoachSchema>;
export type ClubCoach = typeof clubCoaches.$inferSelect;
export type InsertChampion = z.infer<typeof insertChampionSchema>;
export type Champion = typeof pastChampions.$inferSelect;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = typeof tournamentParticipants.$inferInsert;
export type TournamentResults = typeof tournamentResults.$inferSelect;
export type InsertTournamentResults = z.infer<typeof insertTournamentResultsSchema>;

// Tournament teams schemas
export const insertTournamentTeamSchema = createInsertSchema(tournamentTeams).omit({
  id: true,
  createdAt: true,
});
export type InsertTournamentTeam = z.infer<typeof insertTournamentTeamSchema>;
export type TournamentTeam = typeof tournamentTeams.$inferSelect;

export const insertTournamentTeamPlayerSchema = createInsertSchema(tournamentTeamPlayers).omit({
  id: true,
  createdAt: true,
});
export type InsertTournamentTeamPlayer = z.infer<typeof insertTournamentTeamPlayerSchema>;
export type TournamentTeamPlayer = typeof tournamentTeamPlayers.$inferSelect;

// Rank change request types
export type InsertRankChangeRequest = z.infer<typeof insertRankChangeRequestSchema>;
export type RankChangeRequest = typeof rankChangeRequests.$inferSelect;

// V2 Verified Registration Tables (parallel to existing auth system)
export const pendingRegistrationsV2 = pgTable("pending_registrations_v2", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  passwordHash: varchar("password_hash"),
  uploadedFilename: varchar("uploaded_filename"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  emailVerified: integer("email_verified").default(0).notNull(), // 0 or 1 (SQLite boolean)
  phoneVerified: integer("phone_verified").default(0).notNull(),
  adminApproved: integer("admin_approved").default(0).notNull(),
  otpCodeHash: varchar("otp_code_hash"),
  otpExpiresAt: timestamp("otp_expires_at"),
  emailTokenHash: varchar("email_token_hash"),
  emailTokenExp: timestamp("email_token_exp"),
  otpAttempts: integer("otp_attempts").default(0),
  rejectionReason: text("rejection_reason"),
  status: varchar("status").default("pending"), // pending, approved, rejected, completed
  meta: jsonb("meta"), // Store additional data like Google profile info
});

// V2 Audit logs table
export const auditLogsV2 = pgTable("audit_logs_v2", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pendingId: varchar("pending_id").references(() => pendingRegistrationsV2.id),
  eventType: varchar("event_type").notNull(), // registration_started, email_verified, phone_verified, admin_approved, etc.
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// V2 Pending registration schemas
export const insertPendingRegistrationV2Schema = createInsertSchema(pendingRegistrationsV2).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPendingRegistrationV2Schema = createSelectSchema(pendingRegistrationsV2);
export type InsertPendingRegistrationV2 = z.infer<typeof insertPendingRegistrationV2Schema>;
export type PendingRegistrationV2 = typeof pendingRegistrationsV2.$inferSelect;

// V2 Audit log schemas
export const insertAuditLogV2Schema = createInsertSchema(auditLogsV2).omit({
  id: true,
  createdAt: true,
});
export const selectAuditLogV2Schema = createSelectSchema(auditLogsV2);
export type InsertAuditLogV2 = z.infer<typeof insertAuditLogV2Schema>;
export type AuditLogV2 = typeof auditLogsV2.$inferSelect;

// League match schemas
export const insertLeagueMatchSchema = createInsertSchema(leagueMatches).omit({
  id: true,
  createdAt: true,
});
export type InsertLeagueMatch = z.infer<typeof insertLeagueMatchSchema>;
export type LeagueMatch = typeof leagueMatches.$inferSelect;

export const insertLeaguePlayerMatchSchema = createInsertSchema(leaguePlayerMatches).omit({
  id: true,
  createdAt: true,
});
export type InsertLeaguePlayerMatch = z.infer<typeof insertLeaguePlayerMatchSchema>;
export type LeaguePlayerMatch = typeof leaguePlayerMatches.$inferSelect;

// Membership configuration table
export const membershipConfig = pgTable("membership_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: membershipTypeEnum("type").notNull(), // "adult" or "child"
  annualFee: integer("annual_fee").notNull(), // Annual membership fee in tugrik
  description: text("description"), // Optional description of the membership tier
  ageLimit: integer("age_limit"), // Age threshold for child membership (e.g., 18)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Membership configuration schemas
export const insertMembershipConfigSchema = createInsertSchema(membershipConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMembershipConfig = z.infer<typeof insertMembershipConfigSchema>;
export type MembershipConfig = typeof membershipConfig.$inferSelect;

// Provisional team types
export type InsertProvisionalTeam = z.infer<typeof insertProvisionalTeamSchema>;
export type ProvisionalTeam = typeof provisionalTeams.$inferSelect;

// Team invitation types
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;
export type TeamInvitation = typeof teamInvitations.$inferSelect;