import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertClubSchema, insertTournamentSchema, insertMatchSchema, insertNewsSchema, insertMembershipSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Simple auth routes (replacement for Replit OAuth)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, phone, firstName, lastName, role } = req.body;
      
      // Validate input
      if (!email && !phone) {
        return res.status(400).json({ message: "И-мэйл эсвэл утасны дугаар заавал оруулна уу" });
      }
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Нэр, овог заавал оруулна уу" });
      }
      if (!role || !['player', 'club_owner'].includes(role)) {
        return res.status(400).json({ message: "Зөв төрөл сонгоно уу" });
      }

      // Check if user already exists
      const existingUser = email 
        ? await storage.getUserByEmail(email)
        : await storage.getUserByPhone(phone);
      
      if (existingUser) {
        return res.status(400).json({ message: "Энэ и-мэйл эсвэл утасны дугаар аль хэдийн бүртгэгдсэн байна" });
      }

      // Create user
      const userData = {
        email: email || null,
        phone: phone || null, 
        firstName,
        lastName,
        role
      };
      
      const user = await storage.createSimpleUser(userData);
      res.json({ message: "Амжилттай бүртгэгдлээ", user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Бүртгэлд алдаа гарлаа" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { contact } = req.body;
      
      if (!contact) {
        return res.status(400).json({ message: "И-мэйл эсвэл утасны дугаар оруулна уу" });
      }

      // Find user by email or phone
      const user = contact.includes('@') 
        ? await storage.getUserByEmail(contact)
        : await storage.getUserByPhone(contact);
      
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      // Set user session (simple session management)
      (req as any).session.userId = user.id;
      (req as any).session.user = user;
      
      res.json({ message: "Амжилттай нэвтэрлээ", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Нэвтрэхэд алдаа гарлаа" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Гарахад алдаа гарлаа" });
      }
      res.json({ message: "Амжилттай гарлаа" });
    });
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check session-based authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }
      
      // Get player profile if user is a player
      let player = null;
      if (user.role === 'player') {
        player = await storage.getPlayerByUserId(user.id);
      }
      
      res.json({ ...user, player });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Simple authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Tournament routes with simple auth
  app.post('/api/tournaments', requireAuth, async (req: any, res) => {
    try {
      console.log("Creating tournament with data:", req.body);
      console.log("User session:", req.session.userId);
      
      const tournamentData = insertTournamentSchema.parse({
        ...req.body,
        organizerId: req.session.userId,
      });
      
      console.log("Parsed tournament data:", tournamentData);
      
      const tournament = await storage.createTournament(tournamentData);
      console.log("Created tournament:", tournament);
      
      res.json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(400).json({ message: "Тэмцээн үүсгэхэд алдаа гарлаа", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/tournaments', async (req, res) => {
    try {
      const tournaments = await storage.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Тэмцээнүүдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.put('/api/tournaments/:id', requireAuth, async (req: any, res) => {
    try {
      const tournamentData = insertTournamentSchema.partial().parse(req.body);
      const tournament = await storage.updateTournament(req.params.id, tournamentData);
      if (!tournament) {
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(400).json({ message: "Тэмцээн шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete('/api/tournaments/:id', requireAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteTournament(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      }
      res.json({ message: "Тэмцээн амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ message: "Тэмцээн устгахад алдаа гарлаа" });
    }
  });

  // Admin routes for player management
  app.put('/api/admin/players/:id/rank', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч зэрэг оноож болно" });
      }

      const { rank } = req.body;
      if (!rank || typeof rank !== 'string') {
        return res.status(400).json({ message: "Зэрэг заавал оруулна уу" });
      }

      const success = await storage.updatePlayerRank(req.params.id, rank);
      if (!success) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }

      res.json({ message: "Тоглогчийн зэрэг амжилттай шинэчлэгдлээ", rank });
    } catch (error) {
      console.error("Error updating player rank:", error);
      res.status(500).json({ message: "Зэрэг шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/admin/players', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч тоглогчдыг харж болно" });
      }

      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Тоглогчдын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Player routes
  app.post('/api/players', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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

  app.get('/api/players/:id/achievements', async (req, res) => {
    try {
      const achievements = await storage.getPlayerAchievements(req.params.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching player achievements:", error);
      res.status(500).json({ message: "Амжилтууд авахад алдаа гарлаа" });
    }
  });

  // Admin route to create achievements
  app.post('/api/admin/achievements', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч амжилт үүсгэх боломжтой" });
      }

      const achievementData = req.body;
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ message: "Амжилт үүсгэхэд алдаа гарлаа" });
    }
  });

  // Club routes
  app.post('/api/clubs', requireAuth, async (req: any, res) => {
    try {
      const ownerId = req.session.userId;
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
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч хандах боломжтой" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Эрх шалгахад алдаа гарлаа" });
    }
  };

  // Tournament routes - allow both admin and club owners to create tournaments
  app.post('/api/tournaments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Check if user is admin or club owner
      if (user?.role !== 'admin' && user?.role !== 'club_owner') {
        return res.status(403).json({ message: "Зөвхөн админ болон клубын эзэд тэмцээн үүсгэх боломжтой" });
      }
      
      const tournamentData = insertTournamentSchema.parse({ ...req.body, organizerId: userId });
      console.log("Creating tournament with data:", tournamentData);
      const tournament = await storage.createTournament(tournamentData);
      console.log("Tournament created successfully:", tournament);
      res.json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(400).json({ message: "Тэмцээн үүсгэхэд алдаа гарлаа", error: error instanceof Error ? error.message : String(error) });
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
  app.delete('/api/tournaments/:id', requireAuth, isAdmin, async (req: any, res) => {
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

  app.post('/api/tournaments/:id/register', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
  app.post('/api/matches', requireAuth, async (req: any, res) => {
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
