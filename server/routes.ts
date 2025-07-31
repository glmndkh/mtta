import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertClubSchema, insertTournamentSchema, insertMatchSchema, insertNewsSchema, insertMembershipSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }
      
      // Get player profile if user is a player
      let player = null;
      if (user.role === 'player') {
        player = await storage.getPlayerByUserId(userId);
      }
      
      res.json({ ...user, player });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Player routes
  app.post('/api/players', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerData = insertPlayerSchema.parse({ ...req.body, userId });
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(400).json({ message: "Тоглогч үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/players/:id', async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Тоглогчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get('/api/players/:id/matches', async (req, res) => {
    try {
      const matches = await storage.getPlayerMatches(req.params.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching player matches:", error);
      res.status(500).json({ message: "Тоглолтын түүх авахад алдаа гарлаа" });
    }
  });

  // Club routes
  app.post('/api/clubs', isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const clubData = insertClubSchema.parse({ ...req.body, ownerId });
      const club = await storage.createClub(clubData);
      res.json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(400).json({ message: "Клуб үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/clubs', async (req, res) => {
    try {
      const clubs = await storage.getAllClubs();
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.status(500).json({ message: "Клубын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/clubs/:id', async (req, res) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) {
        return res.status(404).json({ message: "Клуб олдсонгүй" });
      }
      const players = await storage.getPlayersByClub(req.params.id);
      res.json({ ...club, players });
    } catch (error) {
      console.error("Error fetching club:", error);
      res.status(500).json({ message: "Клубын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Admin check middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч хандах боломжтой" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Эрх шалгахад алдаа гарлаа" });
    }
  };

  // Tournament routes
  app.post('/api/tournaments', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const organizerId = req.user.claims.sub;
      const tournamentData = insertTournamentSchema.parse({ ...req.body, organizerId });
      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(400).json({ message: "Тэмцээн үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/tournaments', async (req, res) => {
    try {
      const tournaments = await storage.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Тэмцээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/tournaments/:id', async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      }
      const matches = await storage.getMatchesByTournament(req.params.id);
      res.json({ ...tournament, matches });
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ message: "Тэмцээний мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Admin-only tournament update route
  app.put('/api/tournaments/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const updateData = insertTournamentSchema.partial().parse(req.body);
      const tournament = await storage.updateTournament(req.params.id, updateData);
      if (!tournament) {
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(400).json({ message: "Тэмцээн засварлахад алдаа гарлаа" });
    }
  });

  // Admin-only tournament delete route
  app.delete('/api/tournaments/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteTournament(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      }
      res.json({ message: "Тэмцээн амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(400).json({ message: "Тэмцээн устгахад алдаа гарлаа" });
    }
  });

  app.post('/api/tournaments/:id/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(400).json({ message: "Тоглогчийн профайл олдсонгүй" });
      }
      
      await storage.registerPlayerForTournament(req.params.id, player.id);
      res.json({ message: "Амжилттай бүртгэгдлээ" });
    } catch (error) {
      console.error("Error registering for tournament:", error);
      res.status(400).json({ message: "Тэмцээнд бүртгүүлэхэд алдаа гарлаа" });
    }
  });

  // Match routes
  app.post('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.json(match);
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(400).json({ message: "Тоглолт үүсгэхэд алдаа гарлаа" });
    }
  });

  const updateMatchResultSchema = z.object({
    winnerId: z.string(),
    sets: z.array(z.object({
      matchId: z.string(),
      setNumber: z.number(),
      player1Score: z.number(),
      player2Score: z.number(),
    })),
  });

  app.put('/api/matches/:id/result', isAuthenticated, async (req, res) => {
    try {
      const { winnerId, sets } = updateMatchResultSchema.parse(req.body);
      await storage.updateMatchResult(req.params.id, winnerId, sets);
      res.json({ message: "Тоглолтын үр дүн амжилттай хадгалагдлаа" });
    } catch (error) {
      console.error("Error updating match result:", error);
      res.status(400).json({ message: "Тоглолтын үр дүн хадгалахад алдаа гарлаа" });
    }
  });

  // News routes
  app.post('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const newsData = insertNewsSchema.parse({ ...req.body, authorId });
      const news = await storage.createNews(newsData);
      res.json(news);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(400).json({ message: "Мэдээ үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/news', async (req, res) => {
    try {
      const news = await storage.getPublishedNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.put('/api/news/:id/publish', isAuthenticated, async (req, res) => {
    try {
      await storage.publishNews(req.params.id);
      res.json({ message: "Мэдээ амжилттай нийтлэгдлээ" });
    } catch (error) {
      console.error("Error publishing news:", error);
      res.status(400).json({ message: "Мэдээ нийтлэхэд алдаа гарлаа" });
    }
  });

  // Membership routes
  app.post('/api/memberships', isAuthenticated, async (req: any, res) => {
    try {
      const membershipData = insertMembershipSchema.parse(req.body);
      const membership = await storage.createMembership(membershipData);
      res.json(membership);
    } catch (error) {
      console.error("Error creating membership:", error);
      res.status(400).json({ message: "Гишүүнчлэл үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/players/:id/membership', async (req, res) => {
    try {
      const membership = await storage.getMembership(req.params.id);
      res.json(membership);
    } catch (error) {
      console.error("Error fetching membership:", error);
      res.status(500).json({ message: "Гишүүнчлэлийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.put('/api/memberships/:id/pay', isAuthenticated, async (req, res) => {
    try {
      await storage.updateMembershipPayment(req.params.id);
      res.json({ message: "Төлбөр амжилттай төлөгдлөө" });
    } catch (error) {
      console.error("Error updating membership payment:", error);
      res.status(400).json({ message: "Төлбөр төлөхөд алдаа гарлаа" });
    }
  });

  // League routes
  app.get('/api/leagues', async (req, res) => {
    try {
      const leagues = await storage.getAllLeagues();
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching leagues:", error);
      res.status(500).json({ message: "Лигийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/leagues/:id/teams', async (req, res) => {
    try {
      const teams = await storage.getTeamsByLeague(req.params.id);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching league teams:", error);
      res.status(500).json({ message: "Лигийн багуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
