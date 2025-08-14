import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertClubSchema, insertTournamentSchema, insertMatchSchema, insertNewsSchema, insertMembershipSchema, insertHomepageSliderSchema, insertSponsorSchema, insertBranchSchema, insertFederationMemberSchema, insertJudgeSchema, insertChampionSchema } from "@shared/schema";
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
        rank
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
      const validRanks = ['3-р зэрэг', '2-р зэрэг', '1-р зэрэг', 'спортын дэд мастер', 'спортын мастер', 'олон улсын хэмжээний мастер'];
      if (rank && !validRanks.includes(rank)) {
        return res.status(400).json({ message: "Буруу зэрэг" });
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
      const role = 'player';
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

      await storage.createPlayer({
        userId: user.id,
        dateOfBirth: new Date(dateOfBirth),
        rank: rank || 'Шинэ тоглогч'
      });

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

  // Profile routes
  app.get('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }
      
      // Get player data if user is a player
      let playerStats = null;
      if (user.role === 'player') {
        try {
          playerStats = await storage.getPlayerByUserId(user.id);
        } catch (error) {
          console.log('No player data found for user:', user.id);
        }
      }

      // Get judge data
      const judge = await storage.getJudgeByUserId(user.id);

      // Format the response to match the profile interface
      const profileData = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined,
        clubName: user.clubAffiliation,
        profilePicture: user.profileImageUrl,
        province: user.province,
        city: user.city,
        rubberTypes: user.rubberTypes || [],
        handedness: user.handedness,
        playingStyles: user.playingStyles || [],
        bio: user.bio,
        membershipType: user.membershipType,
        membershipStartDate: user.membershipStartDate,
        membershipEndDate: user.membershipEndDate,
        membershipActive: user.membershipActive,
        membershipAmount: user.membershipAmount,
        isJudge: !!judge,
        judgeType: judge?.judgeType,
        // Add player statistics
        playerStats: playerStats ? {
          rank: playerStats.rank,
          points: playerStats.points,
          achievements: playerStats.achievements,
          wins: playerStats.wins,
          losses: playerStats.losses,
          memberNumber: playerStats.memberNumber
        } : null
      };
      
      console.log('Profile response - province:', user.province);
      console.log('Profile response - city:', user.city);
      console.log('Profile response - playerStats:', playerStats);
      console.log('Full user data from DB:', user);
      
      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Профайл мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.put('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      console.log('Profile update request body:', JSON.stringify(req.body, null, 2));
      
      const {
        name,
        email,
        phone,
        gender,
        dateOfBirth,
        clubName,
        profilePicture,
        province,
        city,
        rubberTypes,
        handedness,
        playingStyles,
        bio,
        membershipType,
        membershipStartDate,
        membershipEndDate,
        membershipActive,
        membershipAmount
      } = req.body;
      
      console.log('Extracted province:', province);
      console.log('Extracted city:', city);

      // Parse name into firstName and lastName
      const nameParts = (name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Convert date string to Date object if provided
      const dobDate = dateOfBirth ? new Date(dateOfBirth) : undefined;

      console.log('Data being sent to storage:', {
        email,
        phone,
        firstName,
        lastName,
        gender,
        dateOfBirth: dobDate,
        clubAffiliation: clubName,
        profileImageUrl: profilePicture,
        province,
        city,
        rubberTypes: rubberTypes || [],
        handedness,
        playingStyles: playingStyles || [],
        bio,
        membershipType,
        membershipStartDate: membershipStartDate ? new Date(membershipStartDate) : undefined,
        membershipEndDate: membershipEndDate ? new Date(membershipEndDate) : undefined,
        membershipActive,
        membershipAmount
      });

      const updatedUser = await storage.updateUserProfile(userId, {
        email,
        phone,
        firstName,
        lastName,
        gender,
        dateOfBirth: dobDate,
        clubAffiliation: clubName,
        profileImageUrl: profilePicture,
        province,
        city,
        rubberTypes: rubberTypes || [],
        handedness,
        playingStyles: playingStyles || [],
        bio,
        membershipType,
        membershipStartDate: membershipStartDate ? new Date(membershipStartDate) : undefined,
        membershipEndDate: membershipEndDate ? new Date(membershipEndDate) : undefined,
        membershipActive,
        membershipAmount
      });
      
      console.log('Updated user result:', updatedUser);

      if (!updatedUser) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      res.json({ message: "Профайл амжилттай шинэчлэгдлээ" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Профайл шинэчлэхэд алдаа гарлаа" });
    }
  });

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

  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    const userId = req.session?.userId; // Make userId optional for public images
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

  // Sponsor logo upload endpoint
  app.put("/api/sponsor-logos", async (req, res) => {
    if (!req.body.sponsorLogoURL) {
      return res.status(400).json({ error: "sponsorLogoURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.sponsorLogoURL,
        {
          owner: "system",
          visibility: "public"
        },
      );

      console.log("Sponsor logo processed:", { 
        input: req.body.sponsorLogoURL, 
        output: objectPath 
      });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting sponsor logo:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Membership purchase route
  app.post('/api/user/membership', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { type } = req.body;

      if (!type || !['adult', 'child'].includes(type)) {
        return res.status(400).json({ message: "Буруу гишүүнчлэлийн төрөл" });
      }

      // Set membership dates (1 year from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Set membership amount (example prices)
      const amount = type === 'adult' ? 50000 : 30000; // Tugrik

      const updatedUser = await storage.updateUserProfile(userId, {
        membershipType: type,
        membershipStartDate: startDate,
        membershipEndDate: endDate,
        membershipActive: true,
        membershipAmount: amount
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      res.json({ 
        message: "Гишүүнчлэл амжилттай худалдаж авлаа",
        membershipType: type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        amount
      });
    } catch (error) {
      console.error("Error purchasing membership:", error);
      res.status(500).json({ message: "Гишүүнчлэл худалдаж авахад алдаа гарлаа" });
    }
  });

  // User tournament and match endpoints
  app.get('/api/user/tournaments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Get player data if user is a player
      let player = null;
      if (req.session.user?.role === 'player') {
        player = await storage.getPlayerByUserId(userId);
      }
      
      if (!player) {
        return res.json([]);
      }
      
      // Get tournaments this player is registered for
      const registrations = await storage.getPlayerTournamentRegistrations(player.id);
      const tournaments = [];
      
      for (const reg of registrations) {
        const tournament = await storage.getTournament(reg.tournamentId);
        if (tournament) {
          tournaments.push({
            id: tournament.id,
            name: tournament.name,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            location: tournament.location,
            status: tournament.status,
            participationType: reg.participationType
          });
        }
      }
      
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching user tournaments:", error);
      res.status(500).json({ message: "Тэмцээний мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get('/api/user/matches', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Get player data if user is a player
      let player = null;
      if (req.session.user?.role === 'player') {
        player = await storage.getPlayerByUserId(userId);
      }
      
      if (!player) {
        return res.json([]);
      }
      
      // Get player matches with tournament and opponent information
      const matches = await storage.getPlayerMatchesWithDetails(player.id);
      
      res.json(matches);
    } catch (error) {
      console.error("Error fetching user matches:", error);
      res.status(500).json({ message: "Тоглолтын түүх авахад алдаа гарлаа" });
    }
  });

  app.get('/api/user/teams', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Get player data if user is a player
      let player = null;
      if (req.session.user?.role === 'player') {
        player = await storage.getPlayerByUserId(userId);
      }
      
      if (!player) {
        return res.json([]);
      }
      
      // Get teams this player is part of
      const teams = await storage.getPlayerTeams(player.id);
      
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Багийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Get user medals
  app.get('/api/user/medals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Get player data if user is a player
      let player = null;
      if (req.session.user?.role === 'player') {
        player = await storage.getPlayerByUserId(userId);
      }
      
      if (!player) {
        return res.json([]);
      }
      
      // Get medals this player has earned
      const medals = await storage.getPlayerMedals(player.id);
      
      res.json(medals);
    } catch (error) {
      console.error("Error fetching user medals:", error);
      res.status(500).json({ message: "Медалиудыг авахад алдаа гарлаа" });
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

  // Branch routes
  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Салбар холбоод авахад алдаа гарлаа" });
    }
  });

  app.get('/api/branches/:id', async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ message: "Салбар холбооны мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Federation members public route
  app.get('/api/federation-members', async (req, res) => {
    try {
      const members = await storage.getAllFederationMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching federation members:", error);
      res.status(500).json({ message: "Холбооны гишүүдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Judges public route
  app.get('/api/judges', async (req, res) => {
    try {
      const { type } = req.query;
      const judges = await storage.getAllJudges(type as string | undefined);
      res.json(judges);
    } catch (error) {
      console.error("Error fetching judges:", error);
      res.status(500).json({ message: "Шүүгчдийн мэдээлэл авахад алдаа гарлаа" });
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
      // Add caching headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'ETag': `news-${Date.now()}`
      });
      
      const news = await storage.getPublishedNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/news/latest', async (req, res) => {
    try {
      // Add caching headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=180', // 3 minutes cache
        'ETag': `latest-news-${Date.now()}`
      });
      
      const latestNews = await storage.getLatestPublishedNews(5);
      res.json(latestNews);
    } catch (error) {
      console.error("Error fetching latest news:", error);
      res.status(500).json({ message: "Сүүлийн мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/news/:id', async (req, res) => {
    try {
      // Add caching headers for individual news articles
      res.set({
        'Cache-Control': 'public, max-age=600', // 10 minutes cache for individual articles
        'ETag': `news-${req.params.id}-${Date.now()}`
      });
      
      const news = await storage.getNewsById(req.params.id);
      if (!news) {
        return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      }
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Мэдээ авахад алдаа гарлаа" });
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

  // Update news endpoint
  app.put('/api/news/:id', isAuthenticated, async (req: any, res) => {
    try {
      const newsData = insertNewsSchema.partial().parse(req.body);
      
      // Handle file upload for news image if present
      if (req.body.imageUrl && req.body.imageUrl !== '') {
        newsData.imageUrl = req.body.imageUrl;
      }
      
      const updatedNews = await storage.updateNews(req.params.id, newsData);
      if (!updatedNews) {
        return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      }
      res.json({ message: "Мэдээ амжилттай шинэчлэгдлээ", news: updatedNews });
    } catch (error) {
      console.error("Error updating news:", error);
      res.status(400).json({ message: "Мэдээ шинэчлэхэд алдаа гарлаа" });
    }
  });

  // Get all news for admin (including unpublished)
  app.get('/api/admin/news', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Зөвхөн админ хэрэглэгч бүх мэдээг харж болно" });
      }
      
      const allNews = await storage.getAllNews();
      res.json(allNews);
    } catch (error) {
      console.error("Error fetching all news:", error);
      res.status(500).json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
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

  app.get('/api/leagues/:id', async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ message: "Лиг олдсонгүй" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error fetching league:", error);
      res.status(500).json({ message: "Лигийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get('/api/leagues/:id/teams', async (req, res) => {
    try {
      const teams = await storage.getLeagueTeams(req.params.id);
      
      // Transform teams to include stats (wins, losses, points, matchesPlayed)
      const teamsWithStats = teams.map(team => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        points: 0, // Will be calculated from matches
        wins: 0, // Will be calculated from matches  
        losses: 0, // Will be calculated from matches
        matchesPlayed: 0, // Will be calculated from matches
        colorTheme: '#22C55E', // Default color
        players: team.players,
      }));
      
      res.json(teamsWithStats);
    } catch (error) {
      console.error("Error fetching league teams:", error);
      res.status(500).json({ message: "Лигийн багуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get('/api/leagues/:id/matches', async (req, res) => {
    try {
      const matches = await storage.getLeagueMatches(req.params.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching league matches:", error);
      res.status(500).json({ message: "Лигийн тоглолтуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  // League team management
  app.post('/api/admin/leagues/:id/teams', async (req, res) => {
    try {
      const { name, logoUrl } = req.body;
      const team = await storage.createLeagueTeam(req.params.id, { name, logoUrl });
      res.json(team);
    } catch (error) {
      console.error("Error creating league team:", error);
      res.status(500).json({ message: "Лигийн баг үүсгэхэд алдаа гарлаа" });
    }
  });

  // Tournament registration endpoints
  app.post('/api/tournaments/:tournamentId/register', requireAuth, async (req: any, res) => {
    try {
      const { tournamentId } = req.params;
      const { participationType, playerId: bodyPlayerId } = req.body;

      let playerId = bodyPlayerId;

      if (!playerId) {
        const userId = req.session.userId;

        // Get or create player profile for the current user
        let player = await storage.getPlayerByUserId(userId);
        if (!player) {
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

        playerId = player.id;
      } else {
        // Ensure the provided player exists
        const player = await storage.getPlayer(playerId);
        if (!player) {
          return res.status(400).json({ message: "Тоглогч олдсонгүй" });
        }
      }

      // Check if already registered
      const existingRegistration = await storage.getTournamentRegistration(tournamentId, playerId);
      if (existingRegistration) {
        return res.status(400).json({ message: "Тэмцээнд аль хэдийн бүртгүүлсэн байна" });
      }

      const registration = await storage.registerForTournament({
        tournamentId,
        playerId,
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

      const { tournamentId, participationType, groupStageResults, knockoutResults, finalRankings, isPublished } = req.body;

      if (!tournamentId || !participationType) {
        return res.status(400).json({ message: "Tournament ID and participation type are required" });
      }

      const existing = await storage.getTournamentResults(tournamentId);
      const mergedGroup = { ...(existing?.groupStageResults as any || {}), [participationType]: groupStageResults || [] };
      const mergedKnockout = { ...(existing?.knockoutResults as any || {}), [participationType]: knockoutResults || [] };
      const mergedFinal = { ...(existing?.finalRankings as any || {}), [participationType]: finalRankings || [] };

      const resultsData = {
        tournamentId,
        groupStageResults: mergedGroup,
        knockoutResults: mergedKnockout,
        finalRankings: mergedFinal,
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

  // ================================
  // ADMIN ROUTES FOR CRUD OPERATIONS
  // ================================
  
  // Admin middleware to check if user is admin
  const isAdminRole = async (req: any, res: any, next: any) => {
    try {
      console.log("Admin middleware - Session:", req.session?.userId);
      if (!req.session?.userId) {
        console.log("No session userId found in admin middleware");
        return res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
      }
      
      const user = await storage.getUser(req.session.userId);
      console.log("Admin middleware - User found:", user?.email, "Role:", user?.role);
      
      if (!user || user.role !== 'admin') {
        console.log("User is not admin, role:", user?.role);
        return res.status(403).json({ message: "Админ эрх шаардлагатай" });
      }
      
      console.log("Admin middleware - Access granted");
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Эрх шалгахад алдаа гарлаа" });
    }
  };

  // Admin statistics endpoint
  app.get('/api/admin/stats', requireAuth, isAdminRole, async (req, res) => {
    try {
      console.log("Admin stats route accessed by user:", req.session?.userId);
      const stats = await storage.getAdminStatistics();
      console.log("Stats fetched successfully:", !!stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin statistics:", error);
      res.status(500).json({ message: "Статистик авахад алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN USERS CRUD
  // ===================
  app.get('/api/admin/users', requireAuth, isAdminRole, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Хэрэглэгчдийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.put('/api/admin/users/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = req.body;
      const user = await storage.updateUserProfile(req.params.id, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Хэрэглэгч засварлахад алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN PLAYERS CRUD
  // ===================
  app.get('/api/admin/players', requireAuth, isAdminRole, async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching all players:", error);
      res.status(500).json({ message: "Тоглогчдын жагсаалт авахад алдаа гарлаа" });
    }
  });

  // Update player data (admin only)
  app.put('/api/admin/players/:playerId', requireAuth, isAdminRole, async (req, res) => {
    try {
      const playerId = req.params.playerId;
      const { rank, points, achievements } = req.body;

      // Validate rank if provided
      const validRanks = ['3-р зэрэг', '2-р зэрэг', '1-р зэрэг', 'спортын дэд мастер', 'спортын мастер', 'олон улсын хэмжээний мастер'];
      if (rank && !validRanks.includes(rank)) {
        return res.status(400).json({ message: "Буруу зэрэглэл" });
      }

      // Validate points if provided
      if (points !== undefined && (typeof points !== 'number' || points < 0)) {
        return res.status(400).json({ message: "Оноо 0-ээс их тоо байх ёстой" });
      }

      const updatedPlayer = await storage.updatePlayerAdminFields(playerId, {
        rank: rank || null,
        points: points || 0,
        achievements: achievements || null
      });

      if (!updatedPlayer) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }

      res.json(updatedPlayer);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Тоглогчийн мэдээлэл шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/players/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = req.body;
      const player = await storage.updatePlayer(req.params.id, updateData);
      if (!player) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(400).json({ message: "Тоглогч засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/players/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deletePlayer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }
      res.json({ message: "Тоглогч амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(400).json({ message: "Тоглогч устгахад алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN CLUBS CRUD
  // ===================
  app.get('/api/admin/clubs', requireAuth, isAdminRole, async (req, res) => {
    try {
      const clubs = await storage.getAllClubs();
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching all clubs:", error);
      res.status(500).json({ message: "Клубуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/clubs', requireAuth, isAdminRole, async (req, res) => {
    try {
      const clubData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(clubData);
      res.json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(400).json({ message: "Клуб үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/clubs/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = req.body;
      const club = await storage.updateClub(req.params.id, updateData);
      if (!club) {
        return res.status(404).json({ message: "Клуб олдсонгүй" });
      }
      res.json(club);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(400).json({ message: "Клуб засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/clubs/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteClub(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Клуб олдсонгүй" });
      }
      res.json({ message: "Клуб амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting club:", error);
      res.status(400).json({ message: "Клуб устгахад алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN TOURNAMENTS CRUD (Additional endpoints)
  // ===================
  app.get('/api/admin/tournaments', requireAuth, isAdminRole, async (req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching all tournaments:", error);
      res.status(500).json({ message: "Тэмцээнүүдийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN LEAGUES CRUD
  // ===================
  app.get('/api/admin/leagues', requireAuth, isAdminRole, async (req, res) => {
    try {
      const leagues = await storage.getAllLeagues();
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching all leagues:", error);
      res.status(500).json({ message: "Лигийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/leagues', requireAuth, isAdminRole, async (req, res) => {
    try {
      const leagueData = { ...req.body };
      console.log("Create league data received:", JSON.stringify(leagueData, null, 2));
      
      // Validate required fields
      if (!leagueData.name || !leagueData.name.trim()) {
        return res.status(400).json({ message: "Лигийн нэр заавал оруулна уу" });
      }
      
      // Parse date strings into Date objects, handle empty strings
      if (leagueData.startDate && typeof leagueData.startDate === 'string' && leagueData.startDate.trim() !== '') {
        leagueData.startDate = new Date(leagueData.startDate);
        if (isNaN(leagueData.startDate.getTime())) {
          return res.status(400).json({ message: "Эхлэх огноо буруу форматтай байна" });
        }
      } else {
        return res.status(400).json({ message: "Эхлэх огноо заавал оруулна уу" });
      }
      
      if (leagueData.endDate && typeof leagueData.endDate === 'string' && leagueData.endDate.trim() !== '') {
        leagueData.endDate = new Date(leagueData.endDate);
        if (isNaN(leagueData.endDate.getTime())) {
          return res.status(400).json({ message: "Дуусах огноо буруу форматтай байна" });
        }
      } else {
        return res.status(400).json({ message: "Дуусах огноо заавал оруулна уу" });
      }
      
      // Handle registrationDeadline if provided
      if (leagueData.registrationDeadline && typeof leagueData.registrationDeadline === 'string' && leagueData.registrationDeadline.trim() !== '') {
        leagueData.registrationDeadline = new Date(leagueData.registrationDeadline);
        if (isNaN(leagueData.registrationDeadline.getTime())) {
          return res.status(400).json({ message: "Бүртгэлийн эцсийн хугацаа буруу форматтай байна" });
        }
      } else {
        delete leagueData.registrationDeadline;
      }
      
      console.log("Processed create league data:", JSON.stringify(leagueData, null, 2));
      
      const league = await storage.createLeague(leagueData);
      res.json(league);
    } catch (error) {
      console.error("Error creating league:", error);
      res.status(400).json({ message: "Лиг үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/leagues/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      // Remove readonly fields that shouldn't be updated
      const { id, createdAt, updatedAt, ...rawUpdateData } = req.body;
      const updateData = { ...rawUpdateData };
      
      console.log("Update data received:", JSON.stringify(updateData, null, 2));
      
      // Parse date strings into Date objects, handle empty strings and different types
      if (updateData.startDate !== undefined) {
        if (typeof updateData.startDate === 'string' && updateData.startDate.trim() !== '') {
          updateData.startDate = new Date(updateData.startDate);
          // Check if date is valid
          if (isNaN(updateData.startDate.getTime())) {
            return res.status(400).json({ message: "Эхлэх огноо буруу форматтай байна" });
          }
        } else {
          delete updateData.startDate; // Remove empty/invalid date field
        }
      }
      
      if (updateData.endDate !== undefined) {
        if (typeof updateData.endDate === 'string' && updateData.endDate.trim() !== '') {
          updateData.endDate = new Date(updateData.endDate);
          // Check if date is valid
          if (isNaN(updateData.endDate.getTime())) {
            return res.status(400).json({ message: "Дуусах огноо буруу форматтай байна" });
          }
        } else {
          delete updateData.endDate; // Remove empty/invalid date field
        }
      }
      
      // Handle registrationDeadline if it exists
      if (updateData.registrationDeadline !== undefined) {
        if (typeof updateData.registrationDeadline === 'string' && updateData.registrationDeadline.trim() !== '') {
          updateData.registrationDeadline = new Date(updateData.registrationDeadline);
          if (isNaN(updateData.registrationDeadline.getTime())) {
            return res.status(400).json({ message: "Бүртгэлийн эцсийн хугацаа буруу форматтай байна" });
          }
        } else {
          delete updateData.registrationDeadline;
        }
      }
      
      console.log("Processed update data:", JSON.stringify(updateData, null, 2));
      
      const league = await storage.updateLeague(req.params.id, updateData);
      if (!league) {
        return res.status(404).json({ message: "Лиг олдсонгүй" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error updating league:", error);
      res.status(400).json({ message: "Лиг засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/leagues/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteLeague(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Лиг олдсонгүй" });
      }
      res.json({ message: "Лиг амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting league:", error);
      res.status(400).json({ message: "Лиг устгахад алдаа гарлаа" });
    }
  });

  // Add team to league
  app.post('/api/admin/leagues/:leagueId/teams', requireAuth, isAdminRole, async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { teamId } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ message: "Багийн ID заавал байх ёстой" });
      }

      // Check if league exists
      const league = await storage.getLeagueById(leagueId);
      if (!league) {
        return res.status(404).json({ message: "Лиг олдсонгүй" });
      }

      // Check if team exists
      const team = await storage.getTournamentTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      // Add team to league (you'll need to implement this in storage)
      await storage.addTeamToLeague(leagueId, teamId);
      
      res.json({ message: "Баг амжилттай лигт нэмэгдлээ" });
    } catch (error) {
      console.error("Error adding team to league:", error);
      res.status(500).json({ message: "Баг лигт нэмэхэд алдаа гарлаа" });
    }
  });

  // ===================
  // ADMIN NEWS CRUD
  // ===================
  app.get('/api/admin/news', requireAuth, isAdminRole, async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching all news:", error);
      res.status(500).json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/news', requireAuth, isAdminRole, async (req: any, res) => {
    try {
      const authorId = req.session.userId;
      const newsData = insertNewsSchema.parse({ ...req.body, authorId });
      const news = await storage.createNews(newsData);
      res.json(news);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(400).json({ message: "Мэдээ үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/news/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // Remove timestamp fields that shouldn't be manually updated
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.publishedAt;
      
      // Add updatedAt timestamp
      updateData.updatedAt = new Date();
      
      const news = await storage.updateNews(req.params.id, updateData);
      if (!news) {
        return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      }
      res.json(news);
    } catch (error) {
      console.error("Error updating news:", error);
      res.status(400).json({ message: "Мэдээ засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/news/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      }
      res.json({ message: "Мэдээ амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(400).json({ message: "Мэдээ устгахад алдаа гарлаа" });
    }
  });

  // ===================
  // OBJECT STORAGE ROUTES
  // ===================
  
  // Public object serving endpoint
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

  // Private object serving endpoint (with authentication and ACL)
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
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

  // Upload URL endpoint
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    console.log("Upload endpoint called");
    const objectStorageService = new ObjectStorageService();
    try {
      console.log("Getting upload URL from object storage service...");
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Upload URL received:", uploadURL);
      const response = { uploadURL };
      console.log("Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Set object ACL policy after upload
  app.put("/api/objects/acl", requireAuth, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.session.userId;
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId || "anonymous",
          visibility: "public", // Images should be publicly accessible
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===================
  // ADMIN HOMEPAGE SLIDERS CRUD
  // ===================
  app.get('/api/admin/sliders', requireAuth, isAdminRole, async (req, res) => {
    try {
      const sliders = await storage.getAllHomepageSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching all sliders:", error);
      res.status(500).json({ message: "Слайдерын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/sliders', requireAuth, isAdminRole, async (req, res) => {
    try {
      const sliderData = insertHomepageSliderSchema.parse(req.body);
      const slider = await storage.createHomepageSlider(sliderData);
      res.json(slider);
    } catch (error) {
      console.error("Error creating slider:", error);
      res.status(400).json({ message: "Слайдер үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/sliders/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      // Parse and validate the update data, excluding auto-generated fields
      const updateData = insertHomepageSliderSchema.partial().parse(req.body);
      const slider = await storage.updateHomepageSlider(req.params.id, updateData);
      if (!slider) {
        return res.status(404).json({ message: "Слайдер олдсонгүй" });
      }
      res.json(slider);
    } catch (error) {
      console.error("Error updating slider:", error);
      res.status(400).json({ message: "Слайдер засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/sliders/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteHomepageSlider(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Слайдер олдсонгүй" });
      }
      res.json({ message: "Слайдер амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting slider:", error);
      res.status(400).json({ message: "Слайдер устгахад алдаа гарлаа" });
    }
  });

  // Public endpoint for active sliders
  app.get('/api/sliders', async (req, res) => {
    try {
      const sliders = await storage.getActiveHomepageSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching active sliders:", error);
      res.status(500).json({ message: "Идэвхтэй слайдерууд авахад алдаа гарлаа" });
    }
  });

  // Sponsor management routes (admin only)
  app.get('/api/admin/sponsors', requireAuth, isAdminRole, async (req, res) => {
    try {
      const sponsors = await storage.getAllSponsors();
      res.json(sponsors);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      res.status(500).json({ message: "Ивээн тэтгэгчид авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/sponsors', requireAuth, isAdminRole, async (req, res) => {
    try {
      const sponsorData = insertSponsorSchema.parse(req.body);
      const sponsor = await storage.createSponsor(sponsorData);
      res.json(sponsor);
    } catch (error) {
      console.error("Error creating sponsor:", error);
      res.status(400).json({ message: "Ивээн тэтгэгч үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/sponsors/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = insertSponsorSchema.partial().parse(req.body);
      const sponsor = await storage.updateSponsor(req.params.id, updateData);
      if (!sponsor) {
        return res.status(404).json({ message: "Ивээн тэтгэгч олдсонгүй" });
      }
      res.json(sponsor);
    } catch (error) {
      console.error("Error updating sponsor:", error);
      res.status(400).json({ message: "Ивээн тэтгэгч засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/sponsors/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteSponsor(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Ивээн тэтгэгч олдсонгүй" });
      }
      res.json({ message: "Ивээн тэтгэгч амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      res.status(400).json({ message: "Ивээн тэтгэгч устгахад алдаа гарлаа" });
    }
  });

  // Past champions routes
  app.get('/api/champions', async (req, res) => {
    try {
      const champions = await storage.getAllChampions();
      res.json(champions);
    } catch (error) {
      console.error("Error fetching champions:", error);
      res.status(500).json({ message: "Аваргууд авахад алдаа гарлаа" });
    }
  });

  app.get('/api/admin/champions', requireAuth, isAdminRole, async (req, res) => {
    try {
      const champions = await storage.getAllChampions();
      res.json(champions);
    } catch (error) {
      console.error("Error fetching champions:", error);
      res.status(500).json({ message: "Аваргууд авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/champions', requireAuth, isAdminRole, async (req, res) => {
    try {
      const data = insertChampionSchema.parse(req.body);
      const champion = await storage.createChampion(data);
      res.json(champion);
    } catch (error) {
      console.error("Error creating champion:", error);
      res.status(400).json({ message: "Аварга үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/champions/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = insertChampionSchema.partial().parse(req.body);
      const champion = await storage.updateChampion(req.params.id, updateData);
      if (!champion) {
        return res.status(404).json({ message: "Аварга олдсонгүй" });
      }
      res.json(champion);
    } catch (error) {
      console.error("Error updating champion:", error);
      res.status(400).json({ message: "Аварга засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/champions/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteChampion(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Аварга олдсонгүй" });
      }
      res.json({ message: "Аварга амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting champion:", error);
      res.status(400).json({ message: "Аварга устгахад алдаа гарлаа" });
    }
  });

  // Admin branch routes
  app.get('/api/admin/branches', requireAuth, isAdminRole, async (req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Салбар холбоод авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/branches', requireAuth, isAdminRole, async (req, res) => {
    try {
      const data = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(data);
      res.json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(400).json({ message: "Салбар холбоо үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/branches/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const branch = await storage.updateBranch(req.params.id, req.body);
      if (!branch) {
        return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(400).json({ message: "Салбар холбоо засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/branches/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteBranch(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
      }
      res.json({ message: "Салбар холбоо амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(400).json({ message: "Салбар холбоо устгахад алдаа гарлаа" });
    }
  });

  // Admin federation member routes
  app.get('/api/admin/federation-members', requireAuth, isAdminRole, async (req, res) => {
    try {
      const members = await storage.getAllFederationMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching federation members:", error);
      res.status(500).json({ message: "Холбооны гишүүд авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/federation-members', requireAuth, isAdminRole, async (req, res) => {
    try {
      const data = insertFederationMemberSchema.parse(req.body);
      const member = await storage.createFederationMember(data);
      res.json(member);
    } catch (error) {
      console.error("Error creating federation member:", error);
      res.status(400).json({ message: "Гишүүн нэмэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/federation-members/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const member = await storage.updateFederationMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ message: "Гишүүн олдсонгүй" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating federation member:", error);
      res.status(400).json({ message: "Гишүүн засварлахад алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/federation-members/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteFederationMember(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Гишүүн олдсонгүй" });
      }
      res.json({ message: "Гишүүн амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting federation member:", error);
      res.status(400).json({ message: "Гишүүн устгахад алдаа гарлаа" });
    }
  });

  // Admin judges routes
  app.get('/api/admin/judges', requireAuth, isAdminRole, async (req, res) => {
    try {
      const judges = await storage.getAllJudges();
      res.json(judges);
    } catch (error) {
      console.error("Error fetching judges:", error);
      res.status(500).json({ message: "Шүүгчид авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/judges', requireAuth, isAdminRole, async (req, res) => {
    try {
      const data = insertJudgeSchema.parse(req.body);
      const judge = await storage.createJudge(data);
      res.json(judge);
    } catch (error) {
      console.error("Error creating judge:", error);
      res.status(400).json({ message: "Шүүгч нэмэхэд алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/judges/:id', requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteJudge(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Шүүгч олдсонгүй" });
      }
      res.json({ message: "Шүүгч амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting judge:", error);
      res.status(400).json({ message: "Шүүгч устгахад алдаа гарлаа" });
    }
  });

  // Public endpoint for active sponsors
  app.get('/api/sponsors', async (req, res) => {
    try {
      const sponsors = await storage.getAllSponsors();
      // Filter only active sponsors for public use
      const activeSponsors = sponsors.filter(sponsor => sponsor.isActive);
      res.json(activeSponsors);
    } catch (error) {
      console.error("Error fetching active sponsors:", error);
      res.status(500).json({ message: "Идэвхтэй ивээн тэтгэгчид авахад алдаа гарлаа" });
    }
  });

  // Tournament team endpoints (admin only)
  app.post('/api/tournaments/:tournamentId/teams', requireAuth, async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const teamData = req.body;
      
      // Check if this is actually a league ID by checking if it exists in leagues table
      const league = await storage.getLeagueById(tournamentId);
      if (league) {
        // This is a league, create a league team instead
        const team = await storage.createLeagueTeam(tournamentId, teamData);
        res.json(team);
      } else {
        // This is a tournament
        const team = await storage.createTournamentTeam(tournamentId, teamData);
        res.json(team);
      }
    } catch (error) {
      console.error("Error creating tournament team:", error);
      res.status(500).json({ message: "Failed to create tournament team" });
    }
  });

  app.post('/api/tournament-teams/:teamId/players', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { playerId, playerName } = req.body;
      const player = await storage.addPlayerToTournamentTeam(teamId, playerId, playerName);
      res.json(player);
    } catch (error) {
      console.error("Error adding player to tournament team:", error);
      res.status(500).json({ message: "Failed to add player to tournament team" });
    }
  });

  app.get('/api/tournaments/:tournamentId/teams', async (req, res) => {
    try {
      const { tournamentId } = req.params;
      
      // Check if this is actually a league ID
      const league = await storage.getLeagueById(tournamentId);
      if (league) {
        // This is a league, get league teams
        const teams = await storage.getLeagueTeams(tournamentId);
        res.json(teams);
      } else {
        // This is a tournament
        const teams = await storage.getTournamentTeams(tournamentId);
        res.json(teams);
      }
    } catch (error) {
      console.error("Error fetching tournament teams:", error);
      res.status(500).json({ message: "Failed to fetch tournament teams" });
    }
  });

  app.delete('/api/tournament-teams/:teamId', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const deleted = await storage.deleteTournamentTeam(teamId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting tournament team:", error);
      res.status(500).json({ message: "Failed to delete tournament team" });
    }
  });

  // League match endpoints
  app.post('/api/leagues/:leagueId/matches', requireAuth, async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { team1Id, team2Id, team1Score, team2Score, matchDate, matchTime, playerMatches } = req.body;

      // Create the main league match
      const leagueMatch = await storage.createLeagueMatch({
        leagueId,
        team1Id,
        team2Id,
        team1Score: team1Score || 0,
        team2Score: team2Score || 0,
        matchDate: matchDate ? new Date(matchDate) : null,
        matchTime,
        status: 'completed'
      });

      // Create individual player matches
      const createdPlayerMatches = [];
      if (playerMatches && Array.isArray(playerMatches)) {
        for (const playerMatch of playerMatches) {
          // Convert sets array to proper format and calculate winners
          const sets = playerMatch.sets || [];
          const player1SetsWon = sets.filter((set: any) => set.player1 >= 11 && set.player1 > set.player2).length;
          const player2SetsWon = sets.filter((set: any) => set.player2 >= 11 && set.player2 > set.player1).length;
          const winnerId = player1SetsWon > player2SetsWon ? playerMatch.player1Id : 
                          player2SetsWon > player1SetsWon ? playerMatch.player2Id : null;

          const createdPlayerMatch = await storage.createLeaguePlayerMatch({
            leagueMatchId: leagueMatch.id,
            player1Id: playerMatch.player1Id,
            player2Id: playerMatch.player2Id,
            player1Name: playerMatch.player1Name,
            player2Name: playerMatch.player2Name,
            sets: sets,
            player1SetsWon,
            player2SetsWon,
            winnerId
          });
          createdPlayerMatches.push(createdPlayerMatch);
        }
      }

      res.json({ 
        match: leagueMatch, 
        playerMatches: createdPlayerMatches 
      });
    } catch (error) {
      console.error("Error saving league match:", error);
      res.status(500).json({ message: "Failed to save league match" });
    }
  });

  // Get league matches for a player (for profile display)
  app.get('/api/players/:playerId/league-matches', async (req, res) => {
    try {
      const { playerId } = req.params;
      const matches = await storage.getLeagueMatchesForPlayer(playerId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching player league matches:", error);
      res.status(500).json({ message: "Failed to fetch player league matches" });
    }
  });

  // Get league matches for a user (by userId, looks up player first)
  // User avatar endpoint
  app.get('/api/users/:userId/avatar', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user || !user.profileImageUrl) {
        return res.status(404).json({ error: "Profile image not found" });
      }
      
      // Handle base64 images
      if (user.profileImageUrl.startsWith('data:image/')) {
        const base64Data = user.profileImageUrl.split(',')[1];
        const mimeType = user.profileImageUrl.split(';')[0].split(':')[1];
        
        const buffer = Buffer.from(base64Data, 'base64');
        res.set({
          'Content-Type': mimeType,
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=3600'
        });
        return res.send(buffer);
      }
      
      // Handle URL-based images (redirect)
      res.redirect(user.profileImageUrl);
    } catch (error) {
      console.error("Error serving avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/api/users/:userId/league-matches', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // First, find the player associated with this user
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.json([]); // Return empty array if user has no player profile
      }
      
      const matches = await storage.getLeagueMatchesForPlayer(player.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching user league matches:", error);
      res.status(500).json({ message: "Failed to fetch user league matches" });
    }
  });

  // Object storage routes for file uploads
  app.post('/api/objects/upload', requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Upload URL авахад алдаа гарлаа" });
    }
  });

  // Object storage file serving
  app.get('/objects/:objectPath(*)', async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Admin team management routes
  app.get('/api/admin/teams', requireAuth, isAdminRole, async (req, res) => {
    try {
      const teams = await storage.getAllLeagueTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Багийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.post('/api/admin/teams', requireAuth, isAdminRole, async (req, res) => {
    try {
      const { leagueId, name, sponsorLogo, ownerName, coachName, playerIds } = req.body;
      
      // Create team
      const team = await storage.createLeagueTeam(leagueId || 'default', {
        name,
        sponsorLogo,
        ownerName,
        coachName
      });

      // Add players if provided
      if (playerIds && Array.isArray(playerIds)) {
        for (const playerId of playerIds) {
          // Get player name from users table
          const user = await storage.getUserById(playerId);
          if (user) {
            const playerName = `${user.firstName} ${user.lastName}`;
            await storage.addPlayerToLeagueTeam(team.id, playerId, playerName);
          }
        }
      }

      res.json({ message: "Баг амжилттай үүслээ", team });
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Баг үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put('/api/admin/teams/:teamId', requireAuth, isAdminRole, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { name, sponsorLogo, ownerName, coachName, playerIds } = req.body;
      
      // Update team
      const team = await storage.updateLeagueTeam(teamId, {
        name,
        sponsorLogo,
        ownerName,
        coachName
      });

      if (!team) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      // Update players if provided
      if (playerIds && Array.isArray(playerIds)) {
        // Remove all existing players
        const existingPlayers = await storage.getLeagueTeams(team.tournamentId);
        const currentTeam = existingPlayers.find(t => t.id === teamId);
        if (currentTeam) {
          for (const player of currentTeam.players) {
            await storage.removePlayerFromLeagueTeam(teamId, player.playerId);
          }
        }

        // Add new players
        for (const playerId of playerIds) {
          const user = await storage.getUserById(playerId);
          if (user) {
            const playerName = `${user.firstName} ${user.lastName}`;
            await storage.addPlayerToLeagueTeam(teamId, playerId, playerName);
          }
        }
      }

      res.json({ message: "Баг амжилттай шинэчлэгдлээ", team });
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Баг шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete('/api/admin/teams/:teamId', requireAuth, isAdminRole, async (req, res) => {
    try {
      const { teamId } = req.params;
      const success = await storage.deleteLeagueTeam(teamId);
      
      if (!success) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      res.json({ message: "Баг амжилттай устгагдлаа" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Баг устгахад алдаа гарлаа" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
