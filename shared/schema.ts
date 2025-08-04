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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  rank: varchar("rank"), // Admin-assigned rank (e.g., "Beginner", "Intermediate", "Advanced", "Expert")
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
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  logoUrl: varchar("logo_url"),
  colorTheme: varchar("color_theme").default("#22C55E"),
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
  colorTheme: varchar("color_theme").default("#22C55E"),
  sponsor: varchar("sponsor"),
  points: integer("points").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// News feed table
export const newsFeed = pgTable("news_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: varchar("image_url"),
  category: varchar("category"), // "tournament", "news", "training", "urgent"
  authorId: varchar("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Homepage sliders table
export const homepageSliders = pgTable("homepage_sliders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
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
  teams: many(teams),
  tournaments: many(tournaments),
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

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
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
  publishedAt: true,
});

export const insertHomepageSliderSchema = createInsertSchema(homepageSliders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = typeof tournamentParticipants.$inferInsert;
export type TournamentResults = typeof tournamentResults.$inferSelect;
export type InsertTournamentResults = z.infer<typeof insertTournamentResultsSchema>;
