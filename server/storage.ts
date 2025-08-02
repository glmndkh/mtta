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
  tournamentResults,
  type User,
  type UpsertUser,
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
  type TournamentResults,
  type InsertTournamentResults,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Simple auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createSimpleUser(userData: any): Promise<User>;
  updateUserProfile(userId: string, userData: any): Promise<User>;
  getAllUsers(): Promise<User[]>;

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
  getTournamentParticipants(tournamentId: string): Promise<any[]>;

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

  // Tournament results operations
  getTournamentResults(tournamentId: string): Promise<TournamentResults | undefined>;
  upsertTournamentResults(results: InsertTournamentResults): Promise<TournamentResults>;
  publishTournamentResults(tournamentId: string): Promise<void>;
  
  // Player tournament match history
  getPlayerTournamentMatches(playerId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Simple auth operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createSimpleUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth,
        clubAffiliation: userData.clubAffiliation,
        password: userData.password,
        role: userData.role,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, userData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone,
        email: userData.email,
        clubAffiliation: userData.clubAffiliation,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(users.firstName, users.lastName);
  }

  // Player operations
  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async getPlayerWithUser(id: string): Promise<any | undefined> {
    const result = await db
      .select({
        player: players,
        user: users,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(players.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    return {
      id: result[0].player.id,
      userId: result[0].player.userId,
      rank: result[0].player.rank,
      wins: result[0].player.wins,
      losses: result[0].player.losses,
      winPercentage: result[0].player.winPercentage,
      memberNumber: result[0].player.memberNumber,
      firstName: result[0].user.firstName,
      lastName: result[0].user.lastName,
      email: result[0].user.email,
      phone: result[0].user.phone,
      clubAffiliation: result[0].user.clubAffiliation,
      gender: result[0].user.gender,
      dateOfBirth: result[0].user.dateOfBirth,
      profileImageUrl: result[0].user.profileImageUrl,
    };
  }

  async getPlayerByUserId(userId: string): Promise<any | undefined> {
    const result = await db
      .select({
        player: players,
        user: users,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    return {
      id: result[0].player.id,
      userId: result[0].player.userId,
      rank: result[0].player.rank,
      wins: result[0].player.wins,
      losses: result[0].player.losses,
      winPercentage: result[0].player.winPercentage,
      memberNumber: result[0].player.memberNumber,
      firstName: result[0].user.firstName,
      lastName: result[0].user.lastName,
      email: result[0].user.email,
      phone: result[0].user.phone,
      clubAffiliation: result[0].user.clubAffiliation,
      gender: result[0].user.gender,
      dateOfBirth: result[0].user.dateOfBirth,
      profileImageUrl: result[0].user.profileImageUrl,
    };
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

  async getTournamentParticipants(tournamentId: string): Promise<any[]> {
    const result = await db
      .select({
        id: players.id,  // Return player ID instead of participation ID
        participationType: tournamentParticipants.participationType,
        registeredAt: tournamentParticipants.registeredAt,
        firstName: users.firstName,
        lastName: users.lastName,
        clubAffiliation: users.clubAffiliation,
        email: users.email,
        phone: users.phone,
        rank: players.rank,
      })
      .from(tournamentParticipants)
      .innerJoin(players, eq(tournamentParticipants.playerId, players.id))
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId))
      .orderBy(desc(tournamentParticipants.registeredAt));

    return result;
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

  // Tournament results operations
  async getTournamentResults(tournamentId: string): Promise<TournamentResults | undefined> {
    const [results] = await db
      .select()
      .from(tournamentResults)
      .where(eq(tournamentResults.tournamentId, tournamentId));
    return results;
  }

  async upsertTournamentResults(resultsData: InsertTournamentResults): Promise<TournamentResults> {
    const [results] = await db
      .insert(tournamentResults)
      .values({
        ...resultsData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tournamentResults.tournamentId,
        set: {
          groupStageResults: resultsData.groupStageResults,
          knockoutResults: resultsData.knockoutResults,
          finalRankings: resultsData.finalRankings,
          isPublished: resultsData.isPublished,
          updatedAt: new Date(),
        },
      })
      .returning();
    return results;
  }

  async publishTournamentResults(tournamentId: string): Promise<void> {
    await db
      .update(tournamentResults)
      .set({
        isPublished: true,
        updatedAt: new Date(),
      })
      .where(eq(tournamentResults.tournamentId, tournamentId));
    
    // Update player statistics when results are published
    await this.updatePlayerStatsFromTournament(tournamentId);
  }
  
  async updatePlayerStatsFromTournament(tournamentId: string): Promise<void> {
    try {
      // Get tournament results
      const [tournamentResult] = await db
        .select()
        .from(tournamentResults)
        .where(eq(tournamentResults.tournamentId, tournamentId))
        .limit(1);
      
      if (!tournamentResult) return;
      
      // Get all players who participated in this tournament
      const participants = await db
        .select({
          playerId: players.id,
          userId: players.userId,
        })
        .from(tournamentParticipants)
        .innerJoin(players, eq(tournamentParticipants.playerId, players.id))
        .where(eq(tournamentParticipants.tournamentId, tournamentId));
      
      // Track wins and losses for each player
      const playerStats: { [playerId: string]: { wins: number; losses: number } } = {};
      
      // Initialize stats for all participants
      for (const participant of participants) {
        playerStats[participant.playerId] = { wins: 0, losses: 0 };
      }
      
      // Process group stage results
      if (tournamentResult.groupStageResults) {
        try {
          let groupData;
          if (typeof tournamentResult.groupStageResults === 'string') {
            groupData = JSON.parse(tournamentResult.groupStageResults);
          } else {
            groupData = tournamentResult.groupStageResults;
          }
          
          if (Array.isArray(groupData)) {
            for (const group of groupData) {
              if (group.players && group.resultMatrix) {
                for (let i = 0; i < group.players.length; i++) {
                  for (let j = 0; j < group.players.length; j++) {
                    if (i !== j && group.resultMatrix[i] && group.resultMatrix[i][j]) {
                      const result = group.resultMatrix[i][j];
                      if (result && result !== '-') {
                        const player1 = group.players[i];
                        const player2 = group.players[j];
                        
                        // Find player IDs (could be user ID or player ID)
                        const player1Record = participants.find(p => p.userId === player1.id || p.playerId === player1.id);
                        const player2Record = participants.find(p => p.userId === player2.id || p.playerId === player2.id);
                        
                        if (player1Record && player2Record) {
                          const player1Id = player1Record.playerId;
                          const player2Id = player2Record.playerId;
                          
                          // Determine winner based on score
                          const scores = result.split('-').map((s: string) => parseInt(s.trim()));
                          if (scores.length === 2 && !isNaN(scores[0]) && !isNaN(scores[1])) {
                            if (scores[0] > scores[1]) {
                              // Player 1 wins
                              if (!playerStats[player1Id]) playerStats[player1Id] = { wins: 0, losses: 0 };
                              if (!playerStats[player2Id]) playerStats[player2Id] = { wins: 0, losses: 0 };
                              playerStats[player1Id].wins++;
                              playerStats[player2Id].losses++;
                            } else if (scores[1] > scores[0]) {
                              // Player 2 wins
                              if (!playerStats[player1Id]) playerStats[player1Id] = { wins: 0, losses: 0 };
                              if (!playerStats[player2Id]) playerStats[player2Id] = { wins: 0, losses: 0 };
                              playerStats[player2Id].wins++;
                              playerStats[player1Id].losses++;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error processing group stage results for stats:', e);
        }
      }
      
      // Process knockout results
      if (tournamentResult.knockoutResults) {
        try {
          let knockoutData;
          if (typeof tournamentResult.knockoutResults === 'string') {
            knockoutData = JSON.parse(tournamentResult.knockoutResults);
          } else {
            knockoutData = tournamentResult.knockoutResults;
          }
          
          if (Array.isArray(knockoutData)) {
            for (const match of knockoutData) {
              if (match.player1 && match.player2 && match.score && match.winner) {
                // Find player IDs
                const player1Record = participants.find(p => p.userId === match.player1.id || p.playerId === match.player1.id);
                const player2Record = participants.find(p => p.userId === match.player2.id || p.playerId === match.player2.id);
                
                if (player1Record && player2Record) {
                  const player1Id = player1Record.playerId;
                  const player2Id = player2Record.playerId;
                  const winnerId = participants.find(p => p.userId === match.winner.id || p.playerId === match.winner.id)?.playerId;
                  
                  if (winnerId) {
                    if (!playerStats[player1Id]) playerStats[player1Id] = { wins: 0, losses: 0 };
                    if (!playerStats[player2Id]) playerStats[player2Id] = { wins: 0, losses: 0 };
                    
                    if (winnerId === player1Id) {
                      playerStats[player1Id].wins++;
                      playerStats[player2Id].losses++;
                    } else if (winnerId === player2Id) {
                      playerStats[player2Id].wins++;
                      playerStats[player1Id].losses++;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error processing knockout results for stats:', e);
        }
      }
      
      // Update player statistics in database (replace, don't add to existing)
      for (const [playerId, stats] of Object.entries(playerStats)) {
        if (stats.wins > 0 || stats.losses > 0) {
          await this.updatePlayerStats(playerId, stats.wins, stats.losses);
        }
      }
    } catch (error) {
      console.error('Error updating player stats from tournament:', error);
    }
  }

  async updateAllPlayerStatsFromTournaments(): Promise<void> {
    try {
      // Reset all player stats to 0
      await db.update(players).set({ wins: 0, losses: 0, winPercentage: 0 });
      
      // Get all published tournaments
      const publishedTournaments = await db
        .select({ id: tournaments.id })
        .from(tournaments)
        .innerJoin(tournamentResults, eq(tournaments.id, tournamentResults.tournamentId))
        .where(eq(tournamentResults.isPublished, true));
      
      // Update stats for each tournament
      for (const tournament of publishedTournaments) {
        await this.updatePlayerStatsFromTournament(tournament.id);
      }
    } catch (error) {
      console.error('Error updating all player stats:', error);
    }
  }

  // Player tournament match history
  async getPlayerTournamentMatches(playerId: string): Promise<any[]> {
    const tournamentMatches: any[] = [];
    
    // Get all published tournament results where this player participated
    const results = await db
      .select({
        tournamentResults: tournamentResults,
        tournament: tournaments,
      })
      .from(tournamentResults)
      .innerJoin(tournaments, eq(tournamentResults.tournamentId, tournaments.id))
      .where(eq(tournamentResults.isPublished, true));

    for (const result of results) {
      const { groupStageResults, knockoutResults, finalRankings } = result.tournamentResults;
      
      // Check group stage matches
      if (groupStageResults) {
        try {
          let groupData;
          if (typeof groupStageResults === 'string') {
            groupData = JSON.parse(groupStageResults);
          } else {
            groupData = groupStageResults;
          }
          
          if (Array.isArray(groupData)) {
            for (const group of groupData) {
              if (group.players && group.resultMatrix) {
                // Try to find player by user ID or player ID
                let playerIndex = group.players.findIndex((p: any) => p.id === playerId);
                
                // If not found by player ID, try to find by user ID
                if (playerIndex === -1) {
                  // Get the player record to find user ID
                  const playerRecord = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
                  if (playerRecord.length > 0) {
                    const userId = playerRecord[0].userId;
                    playerIndex = group.players.findIndex((p: any) => p.id === userId);
                  }
                }
                
                if (playerIndex !== -1) {
                  // This player was in this group
                  const playerData = group.players[playerIndex];
                  
                  // Find matches for this player
                  for (let opponentIndex = 0; opponentIndex < group.players.length; opponentIndex++) {
                    if (playerIndex !== opponentIndex) {
                      const matchResult = group.resultMatrix[playerIndex]?.[opponentIndex];
                      if (matchResult && matchResult.trim() !== '') {
                        const opponent = group.players[opponentIndex];
                        
                        // Determine winner based on score
                        let isWinner;
                        if (matchResult.includes('-')) {
                          const [score1, score2] = matchResult.split('-').map(s => parseInt(s.trim()));
                          isWinner = score1 > score2;
                        }
                        
                        tournamentMatches.push({
                          tournament: result.tournament,
                          stage: 'Группийн шат',
                          groupName: group.groupName || `Бүлэг ${group.id || ''}`,
                          opponent: opponent,
                          result: matchResult,
                          playerWins: playerData.wins || '0/0',
                          playerPosition: playerData.position || '-',
                          date: result.tournament.startDate,
                          isWinner: isWinner,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing group stage results:', e);
        }
      }
      
      // Check knockout stage matches
      if (knockoutResults) {
        try {
          let knockoutData;
          if (typeof knockoutResults === 'string') {
            knockoutData = JSON.parse(knockoutResults);
          } else {
            knockoutData = knockoutResults;
          }
          
          if (Array.isArray(knockoutData)) {
            for (const match of knockoutData) {
              let isPlayerInMatch = false;
              let isPlayer1 = false;
              
              // Check if player is in this match (by player ID or user ID)
              if (match.player1?.id === playerId || match.player2?.id === playerId) {
                isPlayerInMatch = true;
                isPlayer1 = match.player1?.id === playerId;
              } else {
                // Try with user ID
                const playerRecord = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
                if (playerRecord.length > 0) {
                  const userId = playerRecord[0].userId;
                  if (match.player1?.id === userId || match.player2?.id === userId) {
                    isPlayerInMatch = true;
                    isPlayer1 = match.player1?.id === userId;
                  }
                }
              }
              
              if (isPlayerInMatch && match.score) {
                const opponent = isPlayer1 ? match.player2 : match.player1;
                // Check winner by both player ID and user ID
                const playerRecord = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
                const isWinner = match.winner?.id === playerId || 
                  (playerRecord.length > 0 && match.winner?.id === playerRecord[0].userId);
                
                tournamentMatches.push({
                  tournament: result.tournament,
                  stage: `Шилжилтийн шат - ${match.round || 'Тодорхойгүй'}`,
                  opponent: opponent,
                  result: match.score,
                  isWinner: isWinner,
                  date: result.tournament.startDate,
                });
              }
            }
          }
        } catch (e) {
          console.error('Error parsing knockout results:', e);
        }
      }
    }
    
    // Sort by tournament date (newest first)
    return tournamentMatches.sort((a, b) => 
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }
}

export const storage = new DatabaseStorage();
