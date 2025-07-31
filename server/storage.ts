import {
  users,
  players,
  clubs,
  tournaments,
  matches,
  matchSets,
  newsFeed,
  memberships,
  teams,
  leagues,
  tournamentParticipants,
  achievements,
  type User,
  type InsertUser,
  type Player,
  type InsertPlayer,
  type Club,
  type InsertClub,
  type Tournament,
  type InsertTournament,
  type Match,
  type InsertMatch,
  type MatchSet,
  type News,
  type InsertNews,
  type Membership,
  type InsertMembership,
  type Team,
  type League,
  type Achievement,
  type InsertAchievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  


  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByUserId(userId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerStats(playerId: string, wins: number, losses: number): Promise<void>;
  updatePlayerRank(playerId: string, rank: string): Promise<boolean>;
  getPlayersByClub(clubId: string): Promise<Player[]>;
  getAllPlayers(): Promise<Player[]>;
  getPlayerAchievements(playerId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Club operations
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  getClubsByOwner(ownerId: string): Promise<Club[]>;
  getAllClubs(): Promise<Club[]>;

  // Tournament operations
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<Tournament | undefined>;
  deleteTournament(id: string): Promise<boolean>;
  getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]>;
  getActiveTournaments(): Promise<Tournament[]>;
  registerPlayerForTournament(tournamentId: string, playerId: string): Promise<void>;
  
  // Tournament registration operations
  registerForTournament(data: { tournamentId: string; playerId: string; participationType: string }): Promise<any>;
  getTournamentRegistration(tournamentId: string, playerId: string): Promise<any>;
  getTournamentRegistrationStats(tournamentId: string): Promise<{ registered: number; maxParticipants?: number; registrationRate: number }>;

  // Match operations
  getMatch(id: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchResult(matchId: string, winnerId: string, sets: Omit<MatchSet, 'id' | 'createdAt'>[]): Promise<void>;
  getMatchesByTournament(tournamentId: string): Promise<Match[]>;
  getPlayerMatches(playerId: string): Promise<Match[]>;
  getTournamentMatches(tournamentId: string): Promise<Match[]>;

  // News operations
  getNews(id: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  getPublishedNews(): Promise<News[]>;
  publishNews(id: string): Promise<void>;

  // Membership operations
  getMembership(playerId: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipPayment(id: string): Promise<void>;

  // League operations
  getAllLeagues(): Promise<League[]>;
  getTeamsByLeague(leagueId: string): Promise<Team[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Player operations
  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.userId, userId));
    return player;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const memberNumber = `TT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const [player] = await db
      .insert(players)
      .values({ ...playerData, memberNumber })
      .returning();
    return player;
  }

  async updatePlayerStats(playerId: string, wins: number, losses: number): Promise<void> {
    const total = wins + losses;
    const winPercentage = total > 0 ? Math.round((wins / total) * 10000) : 0; // stored as percentage * 100
    
    await db
      .update(players)
      .set({ wins, losses, winPercentage })
      .where(eq(players.id, playerId));
  }

  async getPlayersByClub(clubId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.clubId, clubId));
  }

  async updatePlayerRank(playerId: string, rank: string): Promise<boolean> {
    try {
      const result = await db
        .update(players)
        .set({ rank })
        .where(eq(players.id, playerId));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error updating player rank:", error);
      return false;
    }
  }

  async getAllPlayers(): Promise<Player[]> {
    return await db
      .select()
      .from(players)
      .leftJoin(users, eq(players.userId, users.id))
      .leftJoin(clubs, eq(players.clubId, clubs.id));
  }

  async getPlayerAchievements(playerId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.playerId, playerId))
      .orderBy(desc(achievements.achievedAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .leftJoin(players, eq(matches.player1Id, players.id))
      .leftJoin(users, eq(players.userId, users.id))
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(matches.scheduledAt);
  }

  // Club operations
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async createClub(clubData: InsertClub): Promise<Club> {
    const [club] = await db.insert(clubs).values(clubData).returning();
    return club;
  }

  async getClubsByOwner(ownerId: string): Promise<Club[]> {
    return await db.select().from(clubs).where(eq(clubs.ownerId, ownerId));
  }

  async getAllClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(clubs.name);
  }

  // Tournament operations
  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(tournamentData: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values({
      ...tournamentData,
      updatedAt: new Date(),
    }).returning();
    return tournament;
  }

  async getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]> {
    return await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.organizerId, organizerId))
      .orderBy(desc(tournaments.createdAt));
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    return await db
      .select()
      .from(tournaments)
      .where(and(
        eq(tournaments.status, "ongoing"),
        sql`${tournaments.endDate} >= NOW()`
      ))
      .orderBy(tournaments.startDate);
  }

  async getTournaments(): Promise<Tournament[]> {
    return await db
      .select()
      .from(tournaments)
      .orderBy(desc(tournaments.createdAt));
  }

  async updateTournament(id: string, tournamentData: Partial<InsertTournament>): Promise<Tournament | undefined> {
    const [tournament] = await db
      .update(tournaments)
      .set({
        ...tournamentData,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();
    return tournament;
  }

  async deleteTournament(id: string): Promise<boolean> {
    const result = await db.delete(tournaments).where(eq(tournaments.id, id));
    return (result.rowCount || 0) > 0;
  }

  async registerPlayerForTournament(tournamentId: string, playerId: string): Promise<void> {
    await db.insert(tournamentParticipants).values({
      tournamentId,
      playerId,
      participationType: "singles", // default
    });
  }

  async registerForTournament(data: { tournamentId: string; playerId: string; participationType: string }) {
    const [registration] = await db.insert(tournamentParticipants).values({
      tournamentId: data.tournamentId,
      playerId: data.playerId,
      participationType: data.participationType,
    }).returning();
    return registration;
  }

  async getTournamentRegistration(tournamentId: string, playerId: string) {
    const [registration] = await db
      .select()
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, playerId)
      ));
    return registration;
  }

  async getTournamentRegistrationStats(tournamentId: string): Promise<{ registered: number; maxParticipants?: number; registrationRate: number }> {
    // Get tournament details
    const tournament = await this.getTournament(tournamentId);
    
    // Count registrations
    const registrationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    
    const registered = Number(registrationCount[0]?.count || 0);
    const maxParticipants = tournament?.maxParticipants ?? undefined;
    
    let registrationRate = 0;
    if (maxParticipants && maxParticipants > 0) {
      registrationRate = Math.round((registered / maxParticipants) * 100);
    }
    
    return {
      registered,
      maxParticipants,
      registrationRate
    };
  }

  // Match operations
  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async createMatch(matchData: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(matchData).returning();
    return match;
  }

  async updateMatchResult(matchId: string, winnerId: string, sets: Omit<MatchSet, 'id' | 'createdAt'>[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Update match with winner and completion time
      await tx
        .update(matches)
        .set({
          winnerId,
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(matches.id, matchId));

      // Insert match sets
      if (sets.length > 0) {
        await tx.insert(matchSets).values(sets);
      }
    });
  }

  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(matches.scheduledAt);
  }

  async getPlayerMatches(playerId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(
        sql`${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId}`
      )
      .orderBy(desc(matches.completedAt), desc(matches.scheduledAt))
      .limit(10);
  }

  // News operations
  async getNews(id: string): Promise<News | undefined> {
    const [news] = await db.select().from(newsFeed).where(eq(newsFeed.id, id));
    return news;
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [news] = await db.insert(newsFeed).values(newsData).returning();
    return news;
  }

  async getPublishedNews(): Promise<News[]> {
    return await db
      .select()
      .from(newsFeed)
      .where(eq(newsFeed.published, true))
      .orderBy(desc(newsFeed.publishedAt))
      .limit(20);
  }

  async publishNews(id: string): Promise<void> {
    await db
      .update(newsFeed)
      .set({
        published: true,
        publishedAt: new Date(),
      })
      .where(eq(newsFeed.id, id));
  }

  // Membership operations
  async getMembership(playerId: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.playerId, playerId))
      .orderBy(desc(memberships.createdAt))
      .limit(1);
    return membership;
  }

  async createMembership(membershipData: InsertMembership): Promise<Membership> {
    const [membership] = await db.insert(memberships).values(membershipData).returning();
    return membership;
  }

  async updateMembershipPayment(id: string): Promise<void> {
    await db
      .update(memberships)
      .set({
        paid: true,
        paidAt: new Date(),
      })
      .where(eq(memberships.id, id));
  }

  // League operations
  async getAllLeagues(): Promise<League[]> {
    return await db.select().from(leagues).orderBy(desc(leagues.startDate));
  }

  async getTeamsByLeague(leagueId: string): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.leagueId, leagueId))
      .orderBy(desc(teams.points), desc(teams.wins));
  }
}

export const storage = new DatabaseStorage();
