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
  homepageSliders,
  sponsors,
  branches,
  federationMembers,
  judges,
  clubCoaches,
  pastChampions,
  nationalTeamPlayers,
  tournamentTeams,
  tournamentTeamPlayers,
  leagueMatches,
  leaguePlayerMatches,
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
  type HomepageSlider,
  type InsertHomepageSlider,
  type Sponsor,
  type InsertSponsor,
  type Champion,
  type InsertChampion,
  type Branch,
  type InsertBranch,
  type FederationMember,
  type InsertFederationMember,
  type NationalTeamPlayer,
  type InsertNationalTeamPlayer,
  type Judge,
  type InsertJudge,
  type ClubCoach,
  type InsertClubCoach,
  type TournamentTeam,
  type InsertTournamentTeam,
  type TournamentTeamPlayer,
  type InsertTournamentTeamPlayer,
  type LeagueMatch,
  type InsertLeagueMatch,
  type LeaguePlayerMatch,
  type InsertLeaguePlayerMatch,
  type TournamentParticipant,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or } from "drizzle-orm";

const getRoundTitle = (round: number, totalRounds: number): string => {
  const matchesInRound = Math.pow(2, totalRounds - round);
  switch (matchesInRound) {
    case 1: return 'Финал';
    case 2: return 'Хагас финал';
    case 4: return 'Дөрөвний финал';
    case 8: return '1/8 финал';
    case 16: return '1/16 финал';
    case 32: return '1/32 финал';
    case 64: return '1/64 финал';
    default:
      return `1/${matchesInRound * 2} финал`;
  }
};

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Simple auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createSimpleUser(userData: any): Promise<User>;
  updateUserProfile(userId: string, userData: any): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByUserId(userId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerStats(playerId: string, wins: number, losses: number): Promise<void>;
  updatePlayerRank(playerId: string, rank: string): Promise<boolean>;
  updatePlayerAdminFields(playerId: string, fields: { rank?: string | null, points?: number, achievements?: string | null }): Promise<Player | undefined>;
  getPlayersByClub(clubId: string): Promise<Player[]>;
  getAllPlayers(): Promise<Player[]>;
  getPlayerAchievements(playerId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Club operations
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  getClubsByOwner(ownerId: string): Promise<Club[]>;
  getAllClubs(): Promise<Club[]>;

  // Club coach operations
  getClubCoachesByClub(clubId: string): Promise<any[]>;
  getAllClubCoaches(): Promise<any[]>;
  createClubCoach(coach: InsertClubCoach): Promise<ClubCoach>;
  deleteClubCoach(id: string): Promise<boolean>;
  getClubCoachByUserId(userId: string): Promise<ClubCoach | undefined>;

  // Branch operations
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;
  getAllBranches(): Promise<Branch[]>;

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
  removeTournamentParticipant(tournamentId: string, playerId: string): Promise<boolean>;

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
  getAllLeagues(): Promise<Array<League & { teams: Array<TournamentTeam & { players: TournamentTeamPlayer[] }> }>>;
  getTeamsByLeague(leagueId: string): Promise<Team[]>;

  // Tournament results operations
  getTournamentResults(tournamentId: string): Promise<TournamentResults | undefined>;
  upsertTournamentResults(results: InsertTournamentResults): Promise<TournamentResults>;
  publishTournamentResults(tournamentId: string): Promise<void>;

  // Player tournament match history
  getPlayerTournamentMatches(playerId: string): Promise<any[]>;

  // Admin statistics
  getAdminStatistics(): Promise<any>;

  // Tournament team operations
  createTournamentTeam(tournamentId: string, teamData: { name: string; logoUrl?: string }): Promise<TournamentTeam>;
  addPlayerToTournamentTeam(teamId: string, playerId: string, playerName: string): Promise<TournamentTeamPlayer>;
  getTournamentTeams(tournamentId: string): Promise<Array<TournamentTeam & { players: Array<TournamentTeamPlayer & { firstName: string; lastName: string; email: string }> }>>;
  getTournamentTeamById(teamId: string): Promise<TournamentTeam | undefined>;
  deleteTournamentTeam(teamId: string): Promise<boolean>;

  // Homepage slider operations
  getAllHomepageSliders(): Promise<HomepageSlider[]>;
  createHomepageSlider(slider: InsertHomepageSlider): Promise<HomepageSlider>;
  updateHomepageSlider(id: string, slider: Partial<InsertHomepageSlider>): Promise<HomepageSlider | undefined>;
  deleteHomepageSlider(id: string): Promise<boolean>;

  // Sponsor operations
  getAllSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: string): Promise<boolean>;

  // Champion operations
  getAllChampions(): Promise<Champion[]>;
  createChampion(champion: InsertChampion): Promise<Champion>;
  updateChampion(id: string, champion: Partial<InsertChampion>): Promise<Champion | undefined>;
  deleteChampion(id: string): Promise<boolean>;

  // Federation member operations
  getAllFederationMembers(): Promise<FederationMember[]>;
  createFederationMember(member: InsertFederationMember): Promise<FederationMember>;
  updateFederationMember(id: string, member: Partial<InsertFederationMember>): Promise<FederationMember | undefined>;
  deleteFederationMember(id: string): Promise<boolean>;

  // National team player operations
  getAllNationalTeamPlayers(): Promise<NationalTeamPlayer[]>;
  createNationalTeamPlayer(player: InsertNationalTeamPlayer): Promise<NationalTeamPlayer>;
  updateNationalTeamPlayer(id: string, player: Partial<InsertNationalTeamPlayer>): Promise<NationalTeamPlayer | undefined>;
  deleteNationalTeamPlayer(id: string): Promise<boolean>;

  // Judge operations
  getAllJudges(type?: string): Promise<Judge[]>;
  createJudge(judge: InsertJudge): Promise<Judge>;
  deleteJudge(id: string): Promise<boolean>;
  getJudgeByUserId(userId: string): Promise<Judge | undefined>;

  // Membership operations
  getMembership(playerId: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipPayment(id: string): Promise<void>;

  // League operations
  getLeague(id: string): Promise<League | undefined>;
  createLeague(leagueData: any): Promise<League>;
  updateLeague(id: string, leagueData: any): Promise<League | undefined>;
  deleteLeague(id: string): Promise<boolean>;
  getTeamsByLeague(leagueId: string): Promise<Team[]>;

  // Tournament results operations
  getTournamentResults(tournamentId: string): Promise<TournamentResults | undefined>;
  upsertTournamentResults(resultsData: InsertTournamentResults): Promise<TournamentResults>;
  publishTournamentResults(tournamentId: string): Promise<void>;
  updatePlayerStatsFromTournament(tournamentId: string): Promise<void>;
  updateAllPlayerStatsFromTournaments(): Promise<void>;

  // Player tournament and match operations
  getPlayerTournamentMatches(playerId: string): Promise<any[]>;
  getPlayerMatchesWithDetails(playerId: string): Promise<any[]>;
  getPlayerTeams(playerId: string): Promise<any[]>;
  getPlayerMedals(playerId: string): Promise<any[]>;
  getPlayerTournamentRegistrations(playerId: string): Promise<any[]>;

  // League team operations
  getLeagueMatches(leagueId: string): Promise<any[]>;
  getAllLeagueTeams(): Promise<any[]>;
  getLeagueTeams(leagueId: string): Promise<any[]>;
  createLeagueTeam(teamData: any): Promise<any>;
  addPlayerToLeagueTeam(teamId: string, playerId: string, playerName: string): Promise<any>;
  updateLeagueTeam(teamId: string, teamData: any): Promise<any>;
  deleteLeagueTeam(teamId: string): Promise<boolean>;
  addTeamToLeague(leagueId: string, teamData: any): Promise<any>;

  // Tournament team operations
  createTournamentTeam(teamData: any): Promise<any>;
  addPlayerToTournamentTeam(teamId: string, playerId: string, playerName: string): Promise<any>;
  getTournamentTeams(tournamentId: string): Promise<any[]>;
  getTournamentTeamById(teamId: string): Promise<any>;
  deleteTournamentTeam(teamId: string): Promise<boolean>;
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
      .values(userData as any)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          clubAffiliation: userData.clubAffiliation,
          profileImageUrl: userData.profileImageUrl,
          province: userData.province,
          city: userData.city,
          rubberTypes: Array.isArray(userData.rubberTypes) ? userData.rubberTypes as string[] : [],
          handedness: userData.handedness,
          playingStyles: Array.isArray(userData.playingStyles) ? userData.playingStyles as string[] : [],
          bio: userData.bio,
          membershipType: userData.membershipType,
          membershipStartDate: userData.membershipStartDate,
          membershipEndDate: userData.membershipEndDate,
          membershipActive: userData.membershipActive,
          membershipAmount: userData.membershipAmount,
          role: userData.role,
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are defined
    if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
    if (userData.gender !== undefined) updateData.gender = userData.gender;
    if (userData.dateOfBirth !== undefined) updateData.dateOfBirth = userData.dateOfBirth;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.clubAffiliation !== undefined) updateData.clubAffiliation = userData.clubAffiliation;
    if (userData.profileImageUrl !== undefined) updateData.profileImageUrl = userData.profileImageUrl;
    if (userData.province !== undefined) updateData.province = userData.province;
    if (userData.city !== undefined) updateData.city = userData.city;
    if (userData.rubberTypes !== undefined) updateData.rubberTypes = userData.rubberTypes;
    if (userData.handedness !== undefined) updateData.handedness = userData.handedness;
    if (userData.playingStyles !== undefined) updateData.playingStyles = userData.playingStyles;
    if (userData.bio !== undefined) updateData.bio = userData.bio;
    if (userData.membershipType !== undefined) updateData.membershipType = userData.membershipType;
    if (userData.membershipStartDate !== undefined) updateData.membershipStartDate = userData.membershipStartDate;
    if (userData.membershipEndDate !== undefined) updateData.membershipEndDate = userData.membershipEndDate;
    if (userData.membershipActive !== undefined) updateData.membershipActive = userData.membershipActive;
    if (userData.membershipAmount !== undefined) updateData.membershipAmount = userData.membershipAmount;

    const [user] = await db
      .update(users)
      .set(updateData)
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

  async ensurePlayerExists(userId: string): Promise<any> {
    // Check if player already exists
    let player = await this.getPlayerByUserId(userId);

    if (!player) {
      // Get user info
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Create player profile automatically
      const newPlayer = await this.createPlayer({
        userId: userId,
        dateOfBirth: new Date(), // Default date
        rank: "Шинэ тоглогч"
      });

      // Return the player with user info
      player = await this.getPlayerByUserId(userId);
    }

    return player;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const memberNumber = `TT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const [player] = await db
      .insert(players)
      .values({ 
        ...playerData, 
        memberNumber,
        rank: playerData.rank || "Шинэ тоглогч"
      })
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
      // Validate rank value
      const validRanks = ["Шинэ тоглогч", "3-р зэрэг", "2-р зэрэг", "1-р зэрэг", "спортын дэд мастер", "спортын мастер", "олон улсын хэмжээний мастер"];
      if (!validRanks.includes(rank)) {
        console.error("Invalid rank value:", rank);
        return false;
      }

      const result = await db
        .update(players)
        .set({ rank: rank as any })
        .where(eq(players.id, playerId));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error updating player rank:", error);
      return false;
    }
  }

  async updatePlayerAdminFields(playerId: string, fields: { rank?: string | null, points?: number, achievements?: string | null }): Promise<Player | undefined> {
    try {
      const updateFields: any = {};
      if (fields.rank !== undefined) updateFields.rank = fields.rank;
      if (fields.points !== undefined) updateFields.points = fields.points;
      if (fields.achievements !== undefined) updateFields.achievements = fields.achievements;

      const result = await db
        .update(players)
        .set(updateFields)
        .where(eq(players.id, playerId))
        .returning();

      return result[0] || undefined;
    } catch (error) {
      console.error("Error updating player admin fields:", error);
      return undefined;
    }
  }

  async getAllPlayers(): Promise<any[]> {
    return await db
      .select()
      .from(players)
      .leftJoin(users, eq(players.userId, users.id))
      .leftJoin(clubs, eq(players.clubId, clubs.id));
  }

  async updatePlayer(id: string, playerData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(playerData)
      .where(eq(players.id, id))
      .returning();
    return player;
  }

  async deletePlayer(id: string): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.id, id));
    return (result.rowCount || 0) > 0;
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

  async getTournamentMatches(tournamentId: string): Promise<any[]> {
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

  async updateClub(id: string, clubData: Partial<InsertClub>): Promise<Club | undefined> {
    const [club] = await db
      .update(clubs)
      .set(clubData)
      .where(eq(clubs.id, id))
      .returning();
    return club;
  }

  async deleteClub(id: string): Promise<boolean> {
    const result = await db.delete(clubs).where(eq(clubs.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Club coach operations
  async getClubCoachesByClub(clubId: string): Promise<any[]> {
    return await db
      .select({
        id: clubCoaches.id,
        userId: clubCoaches.userId,
        name: clubCoaches.name,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(clubCoaches)
      .leftJoin(users, eq(clubCoaches.userId, users.id))
      .where(eq(clubCoaches.clubId, clubId));
  }

  async getAllClubCoaches(): Promise<any[]> {
    return await db
      .select({
        id: clubCoaches.id,
        clubId: clubCoaches.clubId,
        userId: clubCoaches.userId,
        name: clubCoaches.name,
        firstName: users.firstName,
        lastName: users.lastName,
        clubName: clubs.name,
      })
      .from(clubCoaches)
      .leftJoin(users, eq(clubCoaches.userId, users.id))
      .leftJoin(clubs, eq(clubCoaches.clubId, clubs.id));
  }

  async createClubCoach(data: InsertClubCoach): Promise<ClubCoach> {
    const [coach] = await db.insert(clubCoaches).values(data).returning();
    return coach;
  }

  async deleteClubCoach(id: string): Promise<boolean> {
    const result = await db.delete(clubCoaches).where(eq(clubCoaches.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getClubCoachByUserId(userId: string): Promise<ClubCoach | undefined> {
    const [coach] = await db
      .select()
      .from(clubCoaches)
      .where(eq(clubCoaches.userId, userId));
    return coach;
  }

  // Branch operations
  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const { randomUUID } = await import('crypto');
    const [branch] = await db
      .insert(branches)
      .values({
        ...branchData,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [branch] = await db
      .update(branches)
      .set(branchData)
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }

  // Tournament operations
  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(tournamentData: InsertTournament): Promise<Tournament> {
    console.log("Creating tournament with data:", tournamentData);

    // Ensure required fields have proper values
    const insertData = {
      ...tournamentData,
      updatedAt: new Date(),
      // Ensure defaults for required fields
      status: tournamentData.status || "registration",
      isPublished: tournamentData.isPublished ?? false,
      participationTypes: Array.isArray(tournamentData.participationTypes) 
        ? tournamentData.participationTypes 
        : ["individual"],
    };

    console.log("Processed insert data:", insertData);

    const [tournament] = await db.insert(tournaments).values(insertData).returning();

    console.log("Tournament created successfully:", tournament);
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
        eq(tournaments.isPublished, true),
        or(
          eq(tournaments.status, "ongoing"),
          eq(tournaments.status, "registration")
        ),
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

  async getTournamentRegistration(
    tournamentId: string,
    playerId: string,
  ): Promise<TournamentParticipant | undefined> {
    const [registration] = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, playerId),
        ),
      );
    return registration;
  }

  async getTournamentRegistrationByCategory(
    tournamentId: string,
    playerId: string,
    category: string,
  ): Promise<TournamentParticipant | undefined> {
    const [registration] = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, playerId),
          eq(tournamentParticipants.participationType, category),
        ),
      );
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
    console.log(`Getting participants for tournament: ${tournamentId}`);

    const participants = await db
      .select({
        id: tournamentParticipants.id,
        playerId: tournamentParticipants.playerId,
        participationType: tournamentParticipants.participationType,
        registeredAt: tournamentParticipants.registeredAt,
        firstName: users.firstName,
        lastName: users.lastName,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        clubAffiliation: users.clubAffiliation,
        email: users.email,
        phone: users.phone,
        rank: players.rank,
      })
      .from(tournamentParticipants)
      .leftJoin(players, eq(tournamentParticipants.playerId, players.id))
      .leftJoin(users, eq(players.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    console.log(`Found ${participants.length} participants for tournament ${tournamentId}`);

    return participants.map(p => ({
      id: p.id,
      playerId: p.playerId,
      participationType: p.participationType,
      registeredAt: p.registeredAt,
      playerName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown Player',
      playerEmail: p.email,
      playerGender: p.gender,
      playerRank: p.rank,
      playerClub: p.clubAffiliation,
    }));
  }

  async removeTournamentParticipant(
    tournamentId: string,
    playerId: string,
  ): Promise<boolean> {
    const result = await db
      .delete(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, playerId),
        ),
      );
    return (result.rowCount || 0) > 0;
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

  async getPublishedNews(): Promise<any[]> {
    return await db
      .select({
        id: newsFeed.id,
        title: newsFeed.title,
        content: newsFeed.content,
        excerpt: newsFeed.excerpt,
        imageUrl: newsFeed.imageUrl,
        category: newsFeed.category,
        published: newsFeed.published,
        publishedAt: newsFeed.publishedAt,
        createdAt: newsFeed.createdAt,
        updatedAt: newsFeed.updatedAt,
        authorId: newsFeed.authorId,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(newsFeed)
      .leftJoin(users, eq(newsFeed.authorId, users.id))
      .where(eq(newsFeed.published, true))
      .orderBy(desc(newsFeed.updatedAt), desc(newsFeed.publishedAt))
      .limit(15);
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

  async updateNews(id: string, newsData: Partial<InsertNews>): Promise<News | undefined> {
    const [news] = await db
      .update(newsFeed)
      .set({
        ...newsData,
        updatedAt: new Date()
      })
      .where(eq(newsFeed.id, id))
      .returning();
    return news;
  }

  async deleteNews(id: string): Promise<boolean> {
    const result = await db.delete(newsFeed).where(eq(newsFeed.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllNews(): Promise<any[]> {
    return await db
      .select({
        id: newsFeed.id,
        title: newsFeed.title,
        content: newsFeed.content,
        excerpt: newsFeed.excerpt,
        imageUrl: newsFeed.imageUrl,
        category: newsFeed.category,
        published: newsFeed.published,
        publishedAt: newsFeed.publishedAt,
        createdAt: newsFeed.createdAt,
        updatedAt: newsFeed.updatedAt,
        authorId: newsFeed.authorId,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(newsFeed)
      .leftJoin(users, eq(newsFeed.authorId, users.id))
      .orderBy(desc(newsFeed.updatedAt), desc(newsFeed.createdAt));
  }

  async getLatestPublishedNews(limit: number = 5): Promise<any[]> {
    return await db
      .select({
        id: newsFeed.id,
        title: newsFeed.title,
        content: newsFeed.content,
        excerpt: newsFeed.excerpt,
        imageUrl: newsFeed.imageUrl,
        category: newsFeed.category,
        published: newsFeed.published,
        publishedAt: newsFeed.publishedAt,
        createdAt: newsFeed.createdAt,
        updatedAt: newsFeed.updatedAt,
        authorId: newsFeed.authorId,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(newsFeed)
      .leftJoin(users, eq(newsFeed.authorId, users.id))
      .where(eq(newsFeed.published, true))
      .orderBy(desc(newsFeed.updatedAt), desc(newsFeed.publishedAt))
      .limit(limit);
  }

  async getNewsById(id: string): Promise<any | undefined> {
    const [news] = await db
      .select({
        id: newsFeed.id,
        title: newsFeed.title,
        content: newsFeed.content,
        excerpt: newsFeed.excerpt,
        imageUrl: newsFeed.imageUrl,
        category: newsFeed.category,
        published: newsFeed.published,
        publishedAt: newsFeed.publishedAt,
        createdAt: newsFeed.createdAt,
        updatedAt: newsFeed.updatedAt,
        authorId: newsFeed.authorId,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(newsFeed)
      .leftJoin(users, eq(newsFeed.authorId, users.id))
      .where(eq(newsFeed.id, id));
    return news;
  }

  // Homepage slider operations
  async getHomepageSlider(id: string): Promise<HomepageSlider | undefined> {
    const [slider] = await db.select().from(homepageSliders).where(eq(homepageSliders.id, id));
    return slider;
  }

  async createHomepageSlider(sliderData: InsertHomepageSlider): Promise<HomepageSlider> {
    // Generate UUID manually since database default isn't working with Drizzle
    const { randomUUID } = await import('crypto');
    const now = new Date();

    const [slider] = await db.insert(homepageSliders).values({
      ...sliderData,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }).returning();
    return slider;
  }

  async updateHomepageSlider(id: string, sliderData: Partial<InsertHomepageSlider>): Promise<HomepageSlider | undefined> {
    const [slider] = await db
      .update(homepageSliders)
      .set({
        ...sliderData,
        updatedAt: new Date(),
      })
      .where(eq(homepageSliders.id, id))
      .returning();
    return slider;
  }

  async deleteHomepageSlider(id: string): Promise<boolean> {
    const result = await db.delete(homepageSliders).where(eq(homepageSliders.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllHomepageSliders(): Promise<HomepageSlider[]> {
    return await db
      .select()
      .from(homepageSliders)
      .orderBy(homepageSliders.sortOrder);
  }

  async getActiveHomepageSliders(): Promise<HomepageSlider[]> {
    return await db
      .select()
      .from(homepageSliders)
      .where(eq(homepageSliders.isActive, true))
      .orderBy(homepageSliders.sortOrder);
  }

  // Sponsor operations
  async getAllSponsors(): Promise<Sponsor[]> {
    return await db
      .select()
      .from(sponsors)
      .orderBy(sponsors.sortOrder);
  }

  async createSponsor(sponsorData: InsertSponsor): Promise<Sponsor> {
    const { randomUUID } = await import('crypto');
    const now = new Date();

    const [sponsor] = await db.insert(sponsors).values({
      ...sponsorData,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }).returning();
    return sponsor;
  }

  async updateSponsor(id: string, sponsorData: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const [sponsor] = await db
      .update(sponsors)
      .set({
        ...sponsorData,
        updatedAt: new Date(),
      })
      .where(eq(sponsors.id, id))
      .returning();
    return sponsor;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    const result = await db.delete(sponsors).where(eq(sponsors.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Champion operations
  async getAllChampions(): Promise<Champion[]> {
    return await db
      .select()
      .from(pastChampions)
      .orderBy(desc(pastChampions.year));
  }

  async createChampion(championData: InsertChampion): Promise<Champion> {
    const { randomUUID } = await import('crypto');
    const [champion] = await db
      .insert(pastChampions)
      .values({
        ...championData,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return champion;
  }

  async updateChampion(id: string, championData: Partial<InsertChampion>): Promise<Champion | undefined> {
    const [champion] = await db
      .update(pastChampions)
      .set(championData)
      .where(eq(pastChampions.id, id))
      .returning();
    return champion;
  }

  async deleteChampion(id: string): Promise<boolean> {
    const result = await db.delete(pastChampions).where(eq(pastChampions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Federation member operations
  async getAllFederationMembers(): Promise<FederationMember[]> {
    return await db.select().from(federationMembers).orderBy(federationMembers.createdAt);
  }

  async createFederationMember(memberData: InsertFederationMember): Promise<FederationMember> {
    const { randomUUID } = await import('crypto');
    const now = new Date();
    const [member] = await db
      .insert(federationMembers)
      .values({
        ...memberData,
        id: randomUUID(),
        createdAt: now,
      })
      .returning();
    return member;
  }

  async updateFederationMember(id: string, memberData: Partial<InsertFederationMember>): Promise<FederationMember | undefined> {
    const [member] = await db
      .update(federationMembers)
      .set(memberData)
      .where(eq(federationMembers.id, id))
      .returning();
    return member;
  }

  async deleteFederationMember(id: string): Promise<boolean> {
    const result = await db.delete(federationMembers).where(eq(federationMembers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // National team player operations
  async getAllNationalTeamPlayers(): Promise<NationalTeamPlayer[]> {
    return await db
      .select()
      .from(nationalTeamPlayers)
      .orderBy(nationalTeamPlayers.createdAt);
  }

  async createNationalTeamPlayer(
    playerData: InsertNationalTeamPlayer,
  ): Promise<NationalTeamPlayer> {
    const { randomUUID } = await import('crypto');
    const now = new Date();
    const [player] = await db
      .insert(nationalTeamPlayers)
      .values({
        ...playerData,
        id: randomUUID(),
        createdAt: now,
      })
      .returning();
    return player;
  }

  async updateNationalTeamPlayer(
    id: string,
    playerData: Partial<InsertNationalTeamPlayer>,
  ): Promise<NationalTeamPlayer | undefined> {
    const [player] = await db
      .update(nationalTeamPlayers)
      .set(playerData)
      .where(eq(nationalTeamPlayers.id, id))
      .returning();
    return player;
  }

  async deleteNationalTeamPlayer(id: string): Promise<boolean> {
    const result = await db
      .delete(nationalTeamPlayers)
      .where(eq(nationalTeamPlayers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Judge operations
  async getAllJudges(type?: string): Promise<Judge[]> {
    if (type) {
      return await db.select().from(judges).where(eq(judges.judgeType, type as any));
    }
    return await db.select().from(judges);
  }

  async createJudge(judgeData: InsertJudge): Promise<Judge> {
    const { randomUUID } = await import('crypto');
    const [judge] = await db
      .insert(judges)
      .values({ id: randomUUID(), ...judgeData })
      .returning();
    return judge;
  }

  async deleteJudge(id: string): Promise<boolean> {
    const result = await db.delete(judges).where(eq(judges.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getJudgeByUserId(userId: string): Promise<Judge | undefined> {
    const [judge] = await db.select().from(judges).where(eq(judges.userId, userId));
    return judge;
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
  async getAllLeagues(): Promise<Array<League & { teams: Array<TournamentTeam & { players: TournamentTeamPlayer[] }> }>> {
    console.log('[Storage] Getting all leagues...');
    const leagueData = await db.select().from(leagues);
    console.log(`[Storage] Found ${leagueData.length} leagues in database`);

    const result = [];

    for (const league of leagueData) {
      const teams = await this.getLeagueTeams(league.id);
      console.log(`[Storage] League ${league.name} has ${teams.length} teams`);
      result.push({
        ...league,
        teams
      });
    }

    console.log(`[Storage] Returning ${result.length} leagues with teams`);
    return result;
  }

  async getLeague(id: string): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.id, id));
    return league;
  }

  async createLeague(leagueData: any): Promise<League> {
    const [league] = await db.insert(leagues).values(leagueData).returning();
    return league;
  }

  async updateLeague(id: string, leagueData: any): Promise<League | undefined> {
    const [league] = await db
      .update(leagues)
      .set(leagueData)
      .where(eq(leagues.id, id))
      .returning();
    return league;
  }

  async deleteLeague(id: string): Promise<boolean> {
    const result = await db.delete(leagues).where(eq(leagues.id, id));
    return (result.rowCount || 0) > 0;
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
                // Process each match in the group
                for (let i = 0; i < group.players.length; i++) {
                  for (let j = 0; j < group.players.length; j++) {
                    if (i === j) continue; // Skip self-matches

                    const result1 = group.resultMatrix[i] && group.resultMatrix[i][j];
                    const result2 = group.resultMatrix[j] && group.resultMatrix[j][i];

                    // Process the match if there's a result
                    if ((result1 && result1 !== '' && result1 !== '*****') || (result2 && result2 !== '' && result2 !== '*****')) {
                      const player1 = group.players[i];
                      const player2 = group.players[j];

                      // Find player records by matching user ID from tournament data
                      let player1Id = null;
                      let player2Id = null;

                      // Try to find by user ID first, then by player ID
                      for (const participant of participants) {
                        if (participant.userId === player1.id || participant.playerId === player1.id) {
                          player1Id = participant.playerId;
                        }
                        if (participant.userId === player2.id || participant.playerId === player2.id) {
                          player2Id = participant.playerId;
                        }
                      }

                      if (player1Id && player2Id) {
                        // Determine winner based on sets/scores
                        let player1Wins = false;
                        let player2Wins = false;

                        // Parse individual match result (e.g., "3" vs "2" means 3 sets vs 2 sets)
                        if (result1 && result1 !== '' && result1 !== '*****') {
                          const score1 = parseInt(result1.toString().trim());
                          if (!isNaN(score1)) {
                            if (result2 && result2 !== '' && result2 !== '*****') {
                              const score2 = parseInt(result2.toString().trim());
                              if (!isNaN(score2)) {
                                if (score1 > score2) {
                                  player1Wins = true;
                                } else if (score2 > score1) {
                                  player2Wins = true;
                                }
                              }
                            }
                          }
                        }

                        // Update win/loss counts
                        if (player1Wins) {
                          playerStats[player1Id].wins++;
                          playerStats[player2Id].losses++;
                        } else if (player2Wins) {
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
            const totalRounds = Math.max(...knockoutData.map((m: any) => m.round || 0));
            for (const match of knockoutData) {
              if (match.player1 && match.player2 && match.winner) {
                // Find player IDs
                let player1Id = null;
                let player2Id = null;
                let winnerId = null;

                for (const participant of participants) {
                  if (participant.userId === match.player1.id || participant.playerId === match.player1.id) {
                    player1Id = participant.playerId;
                  }
                  if (participant.userId === match.player2.id || participant.playerId === match.player2.id) {
                    player2Id = participant.playerId;
                  }
                  if (participant.userId === match.winner.id || participant.playerId === match.winner.id) {
                    winnerId = participant.playerId;
                  }
                }

                if (player1Id && player2Id && winnerId) {
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
        } catch (e) {
          console.error('Error processing knockout results for stats:', e);
        }
      }

      // Update player statistics in database (replace, don't add to existing)
      for (const [playerId, stats] of Object.entries(playerStats)) {
        await this.updatePlayerStats(playerId, stats.wins, stats.losses);
      }
    } catch (error) {
      console.error('Error updating player stats from tournament:', error);
    }
  }

  async updateAllPlayerStatsFromTournaments(): Promise<void> {
    try {
      // Reset all player stats to 0
      await db.update(players).set({ wins: 0, losses: 0, winPercentage: 0 });

      // Get all published tournament results
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
                          const [score1, score2] = matchResult.split('-').map((s: string) => parseInt(s.trim()));
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
            const totalRounds = Math.max(...knockoutData.map((m: any) => m.round || 0));
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
                  stage: `Шилжилтийн шат - ${getRoundTitle(match.round || 0, totalRounds)}`,
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

  async getPlayerMatchesWithDetails(playerId: string): Promise<any[]> {
    try {
      // First get the player record to check if they exist
      const [playerRecord] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
      if (!playerRecord) {
        return [];
      }
      const userId = playerRecord.userId;
      const matches: any[] = [];

      // Get all tournament results where this player participated
      const results = await db
        .select({
          id: tournamentResults.id,
          tournamentId: tournamentResults.tournamentId,
          groupStageResults: tournamentResults.groupStageResults,
          knockoutResults: tournamentResults.knockoutResults,
          finalRankings: tournamentResults.finalRankings,
          tournament: {
            id: tournaments.id,
            name: tournaments.name,
            startDate: tournaments.startDate,
            endDate: tournaments.endDate
          }
        })
        .from(tournamentResults)
        .innerJoin(tournaments, eq(tournamentResults.tournamentId, tournaments.id))
        .where(eq(tournamentResults.isPublished, true));

      // Parse each tournament result to extract individual matches
      for (const result of results) {
        try {
          // Check group stage results
          if (result.groupStageResults) {
            let groupData;
            if (typeof result.groupStageResults === 'string') {
              groupData = JSON.parse(result.groupStageResults);
            } else {
              groupData = result.groupStageResults;
            }

            // Look through all groups for this player's matches
            if (Array.isArray(groupData)) {
              groupData.forEach((group: any) => {
                if (group.players && Array.isArray(group.players)) {
                  // Find the player's row in the group
                  const playerRowIndex = group.players.findIndex((player: any) => 
                    player.id === playerId || player.id === userId
                  );

                  if (playerRowIndex !== -1) {
                    const groupName = group.groupName || 'Групп';
                    const resultMatrix = group.resultMatrix || [];

                    // Extract matches from the result matrix
                    group.players.forEach((opponent: any, opponentIndex: number) => {
                      if (opponentIndex !== playerRowIndex && opponent.id) {
                        // Look for score in the result matrix
                        let playerScore, opponentScore, matchResult;

                        // Check the result matrix for this player's results
                        if (resultMatrix[playerRowIndex] && resultMatrix[playerRowIndex][opponentIndex] !== undefined) {
                          const scoreStr = resultMatrix[playerRowIndex][opponentIndex];
                          if (scoreStr && scoreStr !== '' && scoreStr !== '*****') {
                            playerScore = parseInt(scoreStr);
                            // Get opponent's score from their row
                            if (resultMatrix[opponentIndex] && resultMatrix[opponentIndex][playerRowIndex] !== undefined) {
                              const opponentScoreStr = resultMatrix[opponentIndex][playerRowIndex];
                              if (opponentScoreStr && opponentScoreStr !== '' && opponentScoreStr !== '*****') {
                                opponentScore = parseInt(opponentScoreStr);
                                matchResult = playerScore > opponentScore ? 'win' : 'loss';
                              }
                            }
                          }
                        }

                        // Only add if we have a valid result
                        if (matchResult && playerScore !== undefined && opponentScore !== undefined) {
                          matches.push({
                            id: `group_${result.tournamentId}_${groupName}_${playerRowIndex}_${opponentIndex}`,
                            tournamentId: result.tournamentId,
                            tournamentName: result.tournament.name,
                            date: result.tournament.startDate,
                            opponent: opponent.name || 'Тодорхойгүй',
                            result: matchResult,
                            score: `${playerScore}-${opponentScore}`,
                            stage: 'group',
                            matchType: groupName,
                            groupName: groupName
                          });
                        }
                      }
                    });
                  }
                }
              });
            }
          }

          // Check knockout results for bronze medal match and other knockout matches
          if (result.knockoutResults) {
            let knockoutData;
            if (typeof result.knockoutResults === 'string') {
              knockoutData = JSON.parse(result.knockoutResults);
            } else {
              knockoutData = result.knockoutResults;
            }

            // Parse knockout matches
            if (Array.isArray(knockoutData)) {
              const totalRounds = Math.max(...knockoutData.map((m: any) => m.round || 0));
              knockoutData.forEach((match: any) => {
                if (match.player1?.id === playerId || match.player1?.id === userId ||
                    match.player2?.id === playerId || match.player2?.id === userId) {

                  const isPlayer1 = match.player1?.id === playerId || match.player1?.id === userId;
                  const opponent = isPlayer1 ? match.player2 : match.player1;
                  const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
                  const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;

                  let matchResult = 'unknown';
                  if (playerScore !== undefined && opponentScore !== undefined) {
                    matchResult = playerScore > opponentScore ? 'win' : 'loss';
                  }

                  // Determine match type for knockout
                  let matchType = getRoundTitle(match.round || 0, totalRounds);
                  if (match.id === 'third_place_playoff') {
                    matchType = 'Хүрэл медалийн тоглолт';
                  }



                  matches.push({
                    id: `knockout_${match.id}_${playerId}`,
                    tournamentId: result.tournamentId,
                    tournamentName: result.tournament.name,
                    date: result.tournament.startDate,
                    opponent: opponent?.name || 'Тодорхойгүй',
                    result: matchResult,
                    score: `${playerScore}-${opponentScore}`,
                    stage: 'knockout',
                    matchType: matchType
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Error parsing tournament results:', e);
        }
      }

      // Calculate and update win/loss statistics based on the matches
      const wins = matches.filter(match => match.result === 'win').length;
      const losses = matches.filter(match => match.result === 'loss').length;
      const winPercentage = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 10000) : 0;

      // Update player statistics
      await db
        .update(players)
        .set({
          wins: wins,
          losses: losses,
          winPercentage: winPercentage
        })
        .where(eq(players.id, playerId));

      return matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error in getPlayerMatchesWithDetails:', error);
      return [];
    }
  }

  async getPlayerTeams(playerId: string): Promise<any[]> {
    const teams = await db
      .select({
        id: tournamentTeams.id,
        name: tournamentTeams.name,
        logoUrl: tournamentTeams.logoUrl,
        tournamentId: tournamentTeams.tournamentId,
        tournamentName: tournaments.name,
      })
      .from(tournamentTeamPlayers)
      .innerJoin(tournamentTeams, eq(tournamentTeamPlayers.tournamentTeamId, tournamentTeams.id))
      .innerJoin(tournaments, eq(tournamentTeams.tournamentId, tournaments.id))
      .where(eq(tournamentTeamPlayers.playerId, playerId));

    // Get other team members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await db
          .select({
            playerName: tournamentTeamPlayers.playerName,
          })
          .from(tournamentTeamPlayers)
          .where(eq(tournamentTeamPlayers.tournamentTeamId, team.id));

        return {
          id: team.id,
          name: team.name,
          tournament: team.tournamentName,
          members: members.map(m => m.playerName),
          logoUrl: team.logoUrl
        };
      })
    );

    return teamsWithMembers;
  }

  async getPlayerMedals(playerId: string): Promise<any[]> {
    // Get player's user ID
    const [playerRecord] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (!playerRecord) return [];

    const userId = playerRecord.userId;
    const medals: any[] = [];

    // Get all published tournament results
    const results = await db
      .select({
        id: tournamentResults.id,
        tournamentId: tournamentResults.tournamentId,
        finalRankings: tournamentResults.finalRankings,
        tournament: {
          id: tournaments.id,
          name: tournaments.name,
          startDate: tournaments.startDate,
          endDate: tournaments.endDate
        }
      })
      .from(tournamentResults)
      .innerJoin(tournaments, eq(tournamentResults.tournamentId, tournaments.id))
      .where(eq(tournamentResults.isPublished, true));

    // Check each tournament's final rankings
    for (const result of results) {
      if (result.finalRankings) {
        try {
          let rankingsData;
          if (typeof result.finalRankings === 'string') {
            rankingsData = JSON.parse(result.finalRankings);
          } else {
            rankingsData = result.finalRankings;
          }

          if (Array.isArray(rankingsData)) {
            // Find player in rankings by both player ID and user ID
            const playerRanking = rankingsData.find((ranking: any) => 
              ranking.playerId === playerId || ranking.playerId === userId
            );

            if (playerRanking) {
              let medal = null;
              let medalType = null;

              if (playerRanking.position === 1) {
                medal = 'Алтан медаль';
                medalType = 'gold';
              } else if (playerRanking.position === 2) {
                medal = 'Мөнгөн медаль';
                medalType = 'silver';
              } else if (playerRanking.position === 3) {
                medal = 'Хүрэл медаль';
                medalType = 'bronze';
              }

              if (medal) {
                medals.push({
                  tournamentId: result.tournamentId,
                  tournamentName: result.tournament.name,
                  position: playerRanking.position,
                  medal: medal,
                  medalType: medalType,
                  date: result.tournament.endDate || result.tournament.startDate
                });
              }
            }
          }
        } catch (e) {
          console.error('Error parsing final rankings:', e);
        }
      }
    }

    return medals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAdminStatistics(): Promise<any> {
    try {
      // Get counts for various entities
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [playersCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
      const [clubsCount] = await db.select({ count: sql<number>`count(*)` }).from(clubs);
      const [tournamentsCount] = await db.select({ count: sql<number>`count(*)` }).from(tournaments);
      const [newsCount] = await db.select({ count: sql<number>`count(*)` }).from(newsFeed);
      const [branchesCount] = await db.select({ count: sql<number>`count(*)` }).from(branches);
      const [championsCount] = await db.select({ count: sql<number>`count(*)` }).from(pastChampions);
      const [judgesCount] = await db.select({ count: sql<number>`count(*)` }).from(judges);

      return {
        users: Number(usersCount?.count || 0),
        players: Number(playersCount?.count || 0),
        clubs: Number(clubsCount?.count || 0),
        tournaments: Number(tournamentsCount?.count || 0),
        news: Number(newsCount?.count || 0),
        branches: Number(branchesCount?.count || 0),
        champions: Number(championsCount?.count || 0),
        judges: Number(judgesCount?.count || 0)
      };
    } catch (error) {
      console.error('Error getting admin statistics:', error);
      return {
        users: 0,
        players: 0,
        clubs: 0,
        tournaments: 0,
        news: 0,
        branches: 0,
        champions: 0,
        judges: 0
      };
    }
  }

  // League team operations
  async getPlayerTournamentRegistrations(playerId: string): Promise<any[]> {
    try {
      const registrations = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.playerId, playerId));
      return registrations;
    } catch (error) {
      console.error('Error getting player tournament registrations:', error);
      return [];
    }
  }

  async getLeagueMatches(leagueId: string): Promise<any[]> {
    try {
      const leagueMatches = await db.select().from(matches).where(eq(matches.tournamentId, leagueId));
      return leagueMatches;
    } catch (error) {
      console.error('Error getting league matches:', error);
      return [];
    }
  }

  async getAllLeagueTeams(): Promise<any[]> {
    try {
      const teams = await db.select().from(tournamentTeams);
      return teams;
    } catch (error) {
      console.error('Error getting all league teams:', error);
      return [];
    }
  }

  async getLeagueTeams(leagueId: string): Promise<any[]> {
    try {
      const teams = await db.select().from(tournamentTeams).where(eq(tournamentTeams.tournamentId, leagueId));
      return teams;
    } catch (error) {
      console.error('Error getting league teams:', error);
      return [];
    }
  }

  async createLeagueTeam(teamData: any): Promise<any> {
    try {
      const [team] = await db.insert(tournamentTeams).values(teamData).returning();
      return team;
    } catch (error) {
      console.error('Error creating league team:', error);
      throw error;
    }
  }

  async addPlayerToLeagueTeam(teamId: string, playerId: string, playerName: string): Promise<any> {
    try {
      const [player] = await db.insert(tournamentTeamPlayers).values({
        tournamentTeamId: teamId,
        playerId,
        playerName
      }).returning();
      return player;
    } catch (error) {
      console.error('Error adding player to league team:', error);
      throw error;
    }
  }

  async updateLeagueTeam(teamId: string, teamData: any): Promise<any> {
    try {
      const [team] = await db.update(tournamentTeams)
        .set(teamData)
        .where(eq(tournamentTeams.id, teamId))
        .returning();
      return team;
    } catch (error) {
      console.error('Error updating league team:', error);
      throw error;
    }
  }

  async deleteLeagueTeam(teamId: string): Promise<boolean> {
    try {
      // First delete team players
      await db.delete(tournamentTeamPlayers).where(eq(tournamentTeamPlayers.tournamentTeamId, teamId));
      // Then delete the team
      const result = await db.delete(tournamentTeams).where(eq(tournamentTeams.id, teamId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting league team:', error);
      return false;
    }
  }

  async addTeamToLeague(leagueId: string, teamData: any): Promise<any> {
    try {
      const teamWithLeague = { ...teamData, tournamentId: leagueId };
      const [team] = await db.insert(tournamentTeams).values(teamWithLeague).returning();
      return team;
    } catch (error) {
      console.error('Error adding team to league:', error);
      throw error;
    }
  }

  // Tournament team operations
  async createTournamentTeam(teamData: any): Promise<any> {
    try {
      const [team] = await db.insert(tournamentTeams).values(teamData).returning();
      return team;
    } catch (error) {
      console.error('Error creating tournament team:', error);
      throw error;
    }
  }

  async addPlayerToTournamentTeam(teamId: string, playerId: string, playerName: string): Promise<any> {
    try {
      const [player] = await db.insert(tournamentTeamPlayers).values({
        tournamentTeamId: teamId,
        playerId,
        playerName
      }).returning();
      return player;
    } catch (error) {
      console.error('Error adding player to tournament team:', error);
      throw error;
    }
  }

  async getTournamentTeams(tournamentId: string): Promise<any[]> {
    try {
      const teams = await db.select().from(tournamentTeams).where(eq(tournamentTeams.tournamentId, tournamentId));
      return teams;
    } catch (error) {
      console.error('Error getting tournament teams:', error);
      return [];
    }
  }

  async getTournamentTeamById(teamId: string): Promise<any> {
    try {
      const [team] = await db.select().from(tournamentTeams).where(eq(tournamentTeams.id, teamId));
      return team;
    } catch (error) {
      console.error('Error getting tournament team by ID:', error);
      return null;
    }
  }

  async deleteTournamentTeam(teamId: string): Promise<boolean> {
    try {
      // First delete team players
      await db.delete(tournamentTeamPlayers).where(eq(tournamentTeamPlayers.tournamentTeamId, teamId));
      // Then delete the team
      const result = await db.delete(tournamentTeams).where(eq(tournamentTeams.id, teamId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting tournament team:', error);
      return false;
    }
  }

}

export const storage = new DatabaseStorage();