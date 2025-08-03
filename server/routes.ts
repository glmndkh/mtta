import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertClubSchema, insertTournamentSchema, insertMatchSchema, insertNewsSchema, insertMembershipSchema } from "@shared/schema";
import { z } from "zod";

import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// Extend session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);



  // Simple auth routes (replacement for Replit OAuth)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        gender, 
        dateOfBirth, 
        phone, 
        email, 
        clubAffiliation, 
        password, 
        role 
      } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Нэр, овог заавал оруулна уу" });
      }
      
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: "Хүйс заавал сонгоно уу" });
      }
      
      if (!dateOfBirth) {
        return res.status(400).json({ message: "Төрсөн огноо заавал оруулна уу" });
      }
      
      if (!phone) {
        return res.status(400).json({ message: "Утасны дугаар заавал оруулна уу" });
      }
      
      if (!email) {
        return res.status(400).json({ message: "И-мэйл хаяг заавал оруулна уу" });
      }
      
      if (!clubAffiliation) {
        return res.status(400).json({ message: "Клуб эсвэл тоглодог газрын мэдээлэл заавал оруулна уу" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Нууц үг заавал оруулна уу" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Нууц үг дор хаяж 6 тэмдэгт байх ёстой" });
      }
      if (!role || !['player', 'club_owner'].includes(role)) {
        return res.status(400).json({ message: "Зөв төрөл сонгоно уу" });
      }

      // Check for duplicate email and phone numbers
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна" });
      }
      
      // Only check phone if it's provided
      if (phone) {
        const existingUserByPhone = await storage.getUserByPhone(phone);
        if (existingUserByPhone) {
          return res.status(400).json({ message: "Энэ утасны дугаар аль хэдийн бүртгэгдсэн байна" });
        }
      }

      // Store password in plain text (as requested by user)
      // Create user with all required fields
      const userData = {
        email,
        phone,
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        clubAffiliation,
        role,
        password
      };
      
      console.log("Creating user with data:", userData);
      
      const user = await storage.createSimpleUser(userData);
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ message: "Амжилттай бүртгэгдлээ", user: userResponse });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Бүртгэлд алдаа гарлаа" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { contact, password } = req.body;
      
      if (!contact) {
        return res.status(400).json({ message: "И-мэйл эсвэл утасны дугаар оруулна уу" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Нууц үг оруулна уу" });
      }

      // Find user by email or phone
      const user = contact.includes('@') 
        ? await storage.getUserByEmail(contact)
        : await storage.getUserByPhone(contact);
      
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      // Check if user has a password (for backward compatibility)
      if (!user.password) {
        return res.status(400).json({ message: "Энэ хэрэглэгч нууц үг тохируулаагүй байна. Нууц үг тохируулна уу." });
      }

      // Verify password (plain text comparison)
      if (password !== user.password) {
        return res.status(401).json({ message: "Буруу нууц үг" });
      }

      // Set user session (simple session management)
      (req as any).session.userId = user.id;
      (req as any).session.user = user;
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ message: "Амжилттай нэвтэрлээ", user: userResponse });
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

  // Profile update route
  app.put('/api/auth/profile', requireAuth, async (req: any, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        gender, 
        dateOfBirth, 
        phone, 
        email, 
        clubAffiliation, 
        currentPassword 
      } = req.body;
      
      // Get current user
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      // Verify current password
      if (!currentPassword) {
        return res.status(400).json({ message: "Одоогийн нууц үгээ оруулна уу" });
      }

      if (!currentUser.password) {
        return res.status(400).json({ message: "Хэрэглэгчийн нууц үг тохируулагдаагүй байна" });
      }

      const isValidPassword = currentPassword === currentUser.password;
      if (!isValidPassword) {
        return res.status(401).json({ message: "Буруу нууц үг" });
      }

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Нэр, овог заавал оруулна уу" });
      }
      
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: "Хүйс заавал сонгоно уу" });
      }
      
      if (!dateOfBirth) {
        return res.status(400).json({ message: "Төрсөн огноо заавал оруулна уу" });
      }
      
      if (!phone) {
        return res.status(400).json({ message: "Утасны дугаар заавал оруулна уу" });
      }
      
      if (!email) {
        return res.status(400).json({ message: "И-мэйл хаяг заавал оруулна уу" });
      }
      
      if (!clubAffiliation) {
        return res.status(400).json({ message: "Клуб эсвэл тоглодог газрын мэдээлэл заавал оруулна уу" });
      }

      // Check for duplicate email and phone numbers (excluding current user)
      if (email !== currentUser.email) {
        const existingUserByEmail = await storage.getUserByEmail(email);
        if (existingUserByEmail && existingUserByEmail.id !== currentUser.id) {
          return res.status(400).json({ message: "Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна" });
        }
      }
      
      if (phone !== currentUser.phone) {
        const existingUserByPhone = await storage.getUserByPhone(phone);
        if (existingUserByPhone && existingUserByPhone.id !== currentUser.id) {
          return res.status(400).json({ message: "Энэ утасны дугаар аль хэдийн бүртгэгдсэн байна" });
        }
      }

      // Update user profile
      const updatedUser = await storage.updateUserProfile(req.session.userId, {
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        phone,
        email,
        clubAffiliation,
      });
      
      // Remove password from response
      const { password: _, ...userResponse } = updatedUser;
      res.json({ message: "Мэдээлэл амжилттай шинэчлэгдлээ", user: userResponse });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Мэдээлэл шинэчлэхэд алдаа гарлаа" });
    }
  });

  // Object storage routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", requireAuth, async (req: any, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/objects/finalize", requireAuth, async (req: any, res) => {
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    const userId = req.session.userId;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: userId,
          visibility: req.body.isPublic ? "public" : "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error finalizing file upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tournament routes with simple auth
  app.post('/api/tournaments', requireAuth, async (req: any, res) => {
    try {
      console.log("Creating tournament with data:", req.body);
      console.log("User session:", req.session.userId);
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч тэмцээн үүсгэх боломжтой" });
      }

      const tournamentData = insertTournamentSchema.parse({
        ...req.body,
        organizerId: req.session.userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
        entryFee: req.body.entryFee ? req.body.entryFee.toString() : "0",
        maxParticipants: req.body.maxParticipants || 32,
        isPublished: req.body.isPublished || false,
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
      const tournaments = await storage.getTournaments();
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

  // Object storage routes for file uploads
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Файл хуулах URL авахад алдаа гарлаа" });
    }
  });

  app.put('/api/objects/finalize', async (req, res) => {
    try {
      const { fileURL, isPublic } = req.body;
      
      if (!fileURL) {
        return res.status(400).json({ error: "fileURL шаардлагатай" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(fileURL);
      
      // For public files, no ACL needed as they're accessible to everyone
      // For private files, set basic ACL policy
      if (!isPublic) {
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
          await objectStorageService.trySetObjectEntityAclPolicy(fileURL, {
            owner: "system", // System-owned for regulation documents
            visibility: "private",
          });
        } catch (error) {
          console.error("Error setting ACL policy:", error);
          // Continue anyway, file upload succeeded
        }
      }

      res.json({ objectPath });
    } catch (error) {
      console.error("Error finalizing file upload:", error);
      res.status(500).json({ error: "Файл хуулах процессийг дуусгахад алдаа гарлаа" });
    }
  });

  // Serve private objects (tournament regulation documents)
  app.get('/objects/:objectPath(*)', async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public objects (background images)
  app.get('/public-objects/:filePath(*)', async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "Файл олдсонгүй" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      return res.status(500).json({ error: "Файл үзүүлэхэд алдаа гарлаа" });
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

  // Get all users for admin autocomplete
  app.get('/api/admin/users', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч хэрэглэгчдийг харж болно" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Хэрэглэгчдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Player routes
  app.get('/api/players', async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Тоглогчдын мэдээлэл авахад алдаа гарлаа" });
    }
  });

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
      let player = await storage.getPlayerWithUser(req.params.id);
      
      // If not found by player ID, try to find by user ID
      if (!player) {
        player = await storage.getPlayerByUserId(req.params.id);
      }
      
      // If still not found, try to create a player profile for this user ID
      if (!player) {
        try {
          player = await storage.ensurePlayerExists(req.params.id);
        } catch (ensureError) {
          // If we can't create a player, it means the user doesn't exist
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        }
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

  // Tournament match history for a player
  app.get('/api/players/:id/tournament-matches', async (req, res) => {
    try {
      const tournamentMatches = await storage.getPlayerTournamentMatches(req.params.id);
      res.json(tournamentMatches);
    } catch (error) {
      console.error("Error fetching player tournament matches:", error);
      res.status(500).json({ message: "Тэмцээний тоглолтын түүх авахад алдаа гарлаа" });
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

  app.get('/api/players/:id/membership', async (req, res) => {
    try {
      const membership = await storage.getMembership(req.params.id);
      res.json(membership);
    } catch (error) {
      console.error("Error fetching player membership:", error);
      res.status(500).json({ message: "Гишүүнчлэлийн мэдээлэл авахад алдаа гарлаа" });
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

  // Tournament registration endpoints
  app.post('/api/tournaments/:tournamentId/register', requireAuth, async (req: any, res) => {
    try {
      const { tournamentId } = req.params;
      const { participationType } = req.body;
      const userId = req.session.userId;

      // Get or create player profile for the user
      let player = await storage.getPlayerByUserId(userId);
      if (!player) {
        // Auto-create a basic player profile for the user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(400).json({ message: "Хэрэглэгч олдсонгүй" });
        }
        
        player = await storage.createPlayer({
          userId: userId,
          dateOfBirth: new Date(), // Default date, user can update later
          rank: "Шинэ тоглогч"
        });
      }

      // Check if already registered
      const existingRegistration = await storage.getTournamentRegistration(tournamentId, player.id);
      if (existingRegistration) {
        return res.status(400).json({ message: "Тэмцээнд аль хэдийн бүртгүүлсэн байна" });
      }

      const registration = await storage.registerForTournament({
        tournamentId,
        playerId: player.id,
        participationType: participationType || "singles"
      });

      res.json({ message: "Амжилттай бүртгүүллээ", registration });
    } catch (error) {
      console.error("Tournament registration error:", error);
      res.status(500).json({ message: "Бүртгүүлэхэд алдаа гарлаа" });
    }
  });

  app.get('/api/tournaments/:tournamentId/registration-stats', async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const stats = await storage.getTournamentRegistrationStats(tournamentId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching registration stats:", error);
      res.status(500).json({ message: "Failed to fetch registration stats" });
    }
  });

  app.get('/api/tournaments/:tournamentId/user-registration', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.json({ registered: false });
    }

    try {
      const { tournamentId } = req.params;
      const userId = req.session.userId;
      
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.json({ registered: false });
      }

      const registration = await storage.getTournamentRegistration(tournamentId, player.id);
      res.json({ registered: !!registration, registration });
    } catch (error) {
      console.error("Error checking registration:", error);
      res.status(500).json({ message: "Failed to check registration" });
    }
  });

  // Get tournament participants
  app.get('/api/tournaments/:tournamentId/participants', async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const participants = await storage.getTournamentParticipants(tournamentId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching tournament participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Object storage endpoints for tournament file uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/objects/finalize", isAuthenticated, async (req, res) => {
    try {
      if (!req.body.fileURL) {
        return res.status(400).json({ error: "fileURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: req.session.userId!,
          visibility: req.body.isPublic ? "public" : "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects with ACL checks
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "read" as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public assets
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tournament results routes
  // Get tournament results
  app.get('/api/tournaments/:tournamentId/results', async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const results = await storage.getTournamentResults(tournamentId);
      
      if (!results) {
        return res.status(404).json({ message: "Tournament results not found" });
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error fetching tournament results:", error);
      res.status(500).json({ message: "Failed to fetch tournament results" });
    }
  });

  // Admin route to save tournament results
  app.post('/api/admin/tournament-results', async (req: any, res) => {
    try {
      // Check if user is admin
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { tournamentId, groupStageResults, knockoutResults, finalRankings, isPublished } = req.body;

      if (!tournamentId) {
        return res.status(400).json({ message: "Tournament ID is required" });
      }

      const resultsData = {
        tournamentId,
        groupStageResults: groupStageResults || null,
        knockoutResults: knockoutResults || null,
        finalRankings: finalRankings || null,
        isPublished: isPublished || false,
      };

      const results = await storage.upsertTournamentResults(resultsData);
      res.json({ message: "Tournament results saved successfully", results });
    } catch (error) {
      console.error("Error saving tournament results:", error);
      res.status(500).json({ message: "Failed to save tournament results" });
    }
  });

  // Admin route to publish tournament results
  app.put('/api/admin/tournament-results/:tournamentId/publish', async (req: any, res) => {
    try {
      // Check if user is admin
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { tournamentId } = req.params;
      await storage.publishTournamentResults(tournamentId);
      
      res.json({ message: "Tournament results published successfully" });
    } catch (error) {
      console.error("Error publishing tournament results:", error);
      res.status(500).json({ message: "Failed to publish tournament results" });
    }
  });

  // Update all player statistics from all published tournaments
  app.post('/api/players/update-all-stats', async (req, res) => {
    try {
      await storage.updateAllPlayerStatsFromTournaments();
      res.json({ message: "Бүх тоглогчийн статистик шинэчлэгдлээ" });
    } catch (error) {
      console.error("Error updating all player stats:", error);
      res.status(500).json({ message: "Статистик шинэчлэхэд алдаа гарлаа" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
