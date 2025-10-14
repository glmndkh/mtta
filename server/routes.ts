import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import express from "express"; // Import express
import path from "path"; // Import path

import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPlayerSchema,
  insertClubSchema,
  insertTournamentSchema,
  insertMatchSchema,
  insertNewsSchema,
  insertMembershipSchema,
  insertHomepageSliderSchema,
  insertSponsorSchema,
  insertBranchSchema,
  insertFederationMemberSchema,
  insertNationalTeamPlayerSchema,
  insertJudgeSchema,
  insertClubCoachSchema,
  insertChampionSchema,
} from "@shared/schema";

import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "./objectAcl";

// Import database tables
import {
  users,
  players,
  clubs,
  tournaments,
  tournamentParticipants,
  tournamentResults,
  newsFeed,
  homepageSliders,
  sponsors,
  judges,
  clubCoaches,
  memberships,
  branches,
  leagues,
} from "../shared/schema";

// Mocking database operations for demonstration purposes if needed.
// In a real application, these would interact with your actual database.
const db = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve({ count: 0 }) }) }),
  delete: () => ({ where: () => Promise.resolve({ count: 0 }) }),
};
const eq = (a: any, b: any) => a === b;
const and = (...args: any[]) => args.filter(Boolean).join(' AND ');


function calculateAge(dateOfBirth: Date | null | undefined) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

async function validateTournamentEligibility(
  tournamentId: string,
  playerId: string,
  participationType?: string,
) {
  const tournament = await storage.getTournament(tournamentId);
  if (!tournament) throw new Error("Тэмцээн олдсонгүй");
  const player = await storage.getPlayer(playerId);
  if (!player) throw new Error("Тоглогч олдсонгүй");
  const user = await storage.getUser(player.userId);
  if (!user) throw new Error("Хэрэглэгч олдсонгүй");

  const tournamentStartDate = new Date(tournament.startDate);
  const birthDate = new Date(user.dateOfBirth || player.dateOfBirth || '1990-01-01');
  let age = tournamentStartDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = tournamentStartDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && tournamentStartDate.getDate() < birthDate.getDate())) {
    age--;
  }

  // Check tournament-wide requirements
  let requirements: any = {};
  if (tournament.requirements) {
    try {
      requirements = JSON.parse(tournament.requirements);
    } catch {}
  }

  if (requirements.minAge && age < requirements.minAge)
    throw new Error("Тэмцээний ерөнхий нас шаардлага хангахгүй байна");
  if (requirements.maxAge && age > requirements.maxAge)
    throw new Error("Тэмцээний ерөнхий нас шаардлага хангахгүй байна");
  if (requirements.gender && requirements.gender !== user.gender)
    throw new Error("Тэмцээний хүйсний шаардлага хангахгүй");

  // Validate specific participation type/event
  if (participationType) {
    if (
      tournament.participationTypes &&
      !tournament.participationTypes.includes(participationType)
    )
      throw new Error("Буруу ангилал сонгогдсон");

    let event: any = {};
    try {
      event = JSON.parse(participationType);
    } catch {
      // Legacy format fallback
      event = { type: "SINGLES", divisions: [{ name: participationType }] };
    }

    // Validate event structure
    if (event.type && event.divisions && event.divisions.length > 0) {
      // New event structure validation
      const division = event.divisions[0]; // For registration, we typically select one division

      // Check age requirements for the division
      if (division.minAge !== undefined && age < division.minAge) {
        throw new Error(`Энэ ангилалд хамгийн багадаа ${division.minAge} настай байх ёстой (таны нас: ${age})`);
      }

      if (division.maxAge !== undefined && age > division.maxAge) {
        throw new Error(`Энэ ангилалд хамгийн ихдээ ${division.maxAge} настай байх ёстой (таны нас: ${age})`);
      }

      // Check gender requirements based on event type and subType
      if (event.type === 'DOUBLES') {
        if (event.subType === 'MEN_DOUBLES' && user.gender !== 'male') {
          throw new Error("Эрэгтэй хос тэмцээнд зөвхөн эрэгтэй тоглогч оролцох боломжтой");
        }
        if (event.subType === 'WOMEN_DOUBLES' && user.gender !== 'female') {
          throw new Error("Эмэгтэй хос тэмцээнд зөвхөн эмэгтэй тоглогч оролцох боломжтой");
        }
        // MIXED_DOUBLES - both genders allowed
      }

      if (event.type === 'TEAM') {
        if (event.subType === 'MEN_TEAM' && user.gender !== 'male') {
          throw new Error("Эрэгтэй багийн тэмцээнд зөвхөн эрэгтэй тоглогч оролцох боломжтой");
        }
        if (event.subType === 'WOMEN_TEAM' && user.gender !== 'female') {
          throw new Error("Эмэгтэй багийн тэмцээнд зөвхөн эмэгтэй тоглогч оролцох боломжтой");
        }
        // MIXED_TEAM - both genders allowed
      }

      // Check general gender requirements
      if (event.genderReq) {
        if (event.genderReq === 'MALE' && user.gender !== 'male') {
          throw new Error("Энэ төрөлд зөвхөн эрэгтэй тоглогч оролцох боломжтой");
        }
        if (event.genderReq === 'FEMALE' && user.gender !== 'female') {
          throw new Error("Энэ төрөлд зөвхөн эмэгтэй тоглогч оролцох боломжтой");
        }
      }
    } else {
      // Legacy validation for backwards compatibility
      if (event.gender && event.gender !== user.gender)
        throw new Error("Хүйс тохирохгүй");

      let minAgeCat: number | undefined;
      let maxAgeCat: number | undefined;

      if (event.minAge !== undefined || event.maxAge !== undefined) {
        if (typeof event.minAge === "number") minAgeCat = event.minAge;
        if (typeof event.maxAge === "number") maxAgeCat = event.maxAge;
      } else {
        const ageStr = String(event.age || "");
        const nums = ageStr.match(/\d+/g)?.map(Number) || [];
        if (nums.length === 1) {
          if (/хүртэл/i.test(ageStr)) maxAgeCat = nums[0];
          else minAgeCat = nums[0];
        } else if (nums.length >= 2) {
          [minAgeCat, maxAgeCat] = nums;
        }
      }

      if (minAgeCat !== undefined && age < minAgeCat)
        throw new Error(`Нас шаардлага хангахгүй байна (хэрэгтэй: ${minAgeCat}+, таны нас: ${age})`);
      if (maxAgeCat !== undefined && age > maxAgeCat)
        throw new Error(`Нас шаардлага хангахгүй байна (хэрэгтэй: ${maxAgeCat}-аас доош, таны нас: ${age})`);
    }
  }
}

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: any;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ------------------------
  // Auth bootstrap & helpers
  // ------------------------
  await setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Эрх шаардлагатай" });
      }
      next();
    } catch (e) {
      console.error("Role check error:", e);
      res.status(500).json({ message: "Эрх шалгахад алдаа гарлаа" });
    }
  };

  const isAdminRole = requireRole(['admin']);

  // ------------------------
  // Simple auth (email/phone)
  // ------------------------
  app.post("/api/auth/register", async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        gender,
        dateOfBirth,
        phone,
        email,
        clubId,
        noClub,
        clubAffiliation,
        password,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !gender || !dateOfBirth || !phone || !password) {
        return res.status(400).json({ message: "Шаардлагатай талбаруудыг бөглөнө үү" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phone);


      if (existingUser) {
        return res.status(400).json({ message: "Энэ утасны дугаараар бүртгэгдсэн хэрэглэгч байна" });
      }

      // Hash password
      const hashedPassword = await storage.hashPassword(password);

      // Create user without rank (will be set later via rank change request)
      const newUser = await storage.createSimpleUser({
        firstName,
        lastName,
        gender: gender as "male" | "female",
        dateOfBirth: new Date(dateOfBirth),
        phone,
        email: email || null,
        clubId: clubId && !noClub ? clubId : null,
        clubAffiliation: noClub && clubAffiliation ? clubAffiliation : null, // Use clubAffiliation if noClub is true
        role: "player",
        password: hashedPassword,
      });
      console.log("User created successfully:", newUser.id);

      // Create player record - no default rank
      const player = await storage.createPlayer({
        userId: newUser.id,
        dateOfBirth: new Date(dateOfBirth),
        rank: null, // No rank during registration
        clubId: clubId && !noClub ? clubId : null,
      });
      console.log("Player created successfully:", player.id);

      // Create club membership if club is selected
      if (clubId && !noClub) {
        try {
          await storage.createMembership({
            playerId: player.id,
            type: "adult", // Use enum value from schema
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            amount: 0, // Free initial membership
            paid: false,
          });
        } catch (membershipError) {
          console.error("Error creating membership (non-fatal):", membershipError);
          // Don't fail registration if membership creation fails
        }
      }

      const { password: _pw, ...userResponse } = newUser;
      return res.status(200).json({
        message: "Амжилттай бүртгэгдлээ! Нэвтэрсний дараа профайл хэсэгт зэргийн үнэмлэхийг оруулж батлуулна уу.",
        user: userResponse
      });
    } catch (e) {
      console.error("Registration error:", e);
      // Return more specific error message if available
      const errorMessage = e instanceof Error ? e.message : "Бүртгэлд алдаа гарлаа";
      return res.status(500).json({ message: errorMessage });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { contact, password } = req.body;
      if (!contact)
        return res
          .status(400)
          .json({ message: "И-мэйл эсвэл утасны дугаар оруулна уу" });
      if (!password)
        return res.status(400).json({ message: "Нууц үг оруулна уу" });

      const user = contact.includes("@")
        ? await storage.getUserByEmail(contact)
        : await storage.getUserByPhone(contact);

      if (!user)
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      if (!user.password)
        return res
          .status(400)
          .json({ message: "Энэ хэрэглэгч нууц үг тохируулаагүй байна" });
      if (!await storage.comparePassword(password, user.password))
        return res.status(401).json({ message: "Буруу нууц үг" });

      (req as any).session.userId = user.id;
      (req as any).session.user = user;

      // Ensure session is saved before responding
      await new Promise<void>((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { password: _pw, ...userResponse } = user;
      res.json({ message: "Амжилттай нэвтэрлээ", user: userResponse });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ message: "Нэвтрэхэд алдаа гарлаа" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) return res.status(500).json({ message: "Гарахад алдаа гарлаа" });
      res.json({ message: "Амжилттай гарлаа" });
    });
  });

  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.session?.userId)
        return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(req.session.userId);
      if (!user)
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });

      const player =
        user.role === "player"
          ? await storage.getPlayerByUserId(user.id)
          : null;
      res.json({ ...user, player });
    } catch (e) {
      console.error("Error fetching user:", e);
      res
        .status(500)
        .json({ message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "И-мэйл хаяг заавал оруулна уу" });
      }

      // Хэрэглэгч байгаа эсэхийг шалгах
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Энэ и-мэйл хаягаар бүртгэгдсэн хэрэглэгч олдсонгүй" });
      }

      // Password reset token үүсгэх
      const token = await storage.createPasswordResetToken(email);

      // И-мэйл илгээх
      try {
        const { emailService } = await import('./emailService');
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        console.log(`Attempting to send password reset email to: ${email}`);
        console.log(`Reset URL will be: ${baseUrl}/reset-password?token=${token}`);

        await emailService.sendPasswordResetEmail(email, token, baseUrl);

        console.log(`Password reset email sent successfully to ${email}`);

        res.json({
          message: "Нууц үг сэргээх код таны и-мэйлд илгээгдлээ",
          // Development-д л token буцаах
          ...(process.env.NODE_ENV === 'development' && { token, resetUrl: `${baseUrl}/reset-password?token=${token}` })
        });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);

        // И-мэйл илгээх амжилтгүй болсон ч token-г console-д хэвлэе
        console.log(`PASSWORD RESET TOKEN (EMAIL FAILED): ${token}`);
        console.log(`Reset URL: ${req.protocol}://${req.get('host')}/reset-password?token=${token}`);

        // Development mode-д алдааг илүү дэлгэрэнгүй харуулах
        if (process.env.NODE_ENV === 'development') {
          return res.json({
            message: "И-мэйл илгээхэд алдаа гарсан боловч token үүсгэгдлээ",
            token,
            resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${token}`,
            error: emailError instanceof Error ? emailError.message : "Email service unavailable"
          });
        }

        // Production mode-д хэрэглэгчид амжилттай гэж хариулах (security-гийн хувьд)
        res.json({
          message: "Нууц үг сэргээх код таны и-мэйлд илгээгдлээ"
        });
      }
    } catch (e) {
      console.error("Error in forgot password:", e);
      res.status(500).json({ message: "Серверийн алдаа гарлаа" });
    }
  });

  // Test email service endpoint (development only)
  app.post("/api/test-email", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: "Not found" });
    }

    try {
      const { emailService } = await import('./emailService');
      await emailService.sendEmail({
        to: process.env.EMAIL_USER || 'test@example.com',
        subject: 'MTTA Email Service Test',
        html: '<h1>Email Service Test</h1><p>If you receive this, the email service is working correctly.</p>',
        text: 'Email Service Test - If you receive this, the email service is working correctly.'
      });

      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email failed:", error);
      res.status(500).json({
        message: "Test email failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Код болон нууц үг заавал оруулна уу" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Нууц үг дор хаяж 6 тэмдэгт байх ёстой" });
      }

      // Token-г шалгах
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Буруу эсвэл хугацаа дууссан код" });
      }

      // Нууц үг шинэчлэх
      const success = await storage.resetUserPassword(resetToken.email, password);
      if (!success) {
        return res.status(500).json({ message: "Нууц үг шинэчлэхэд алдаа гарлаа" });
      }

      // Token-г ашигласан гэж тэмдэглэх
      await storage.usePasswordResetToken(token);

      res.json({ message: "Нууц үг амжилттай шинэчлэгдлээ" });
    } catch (e) {
      console.error("Error in reset password:", e);
      res.status(500).json({ message: "Серверийн алдаа гарлаа" });
    }
  });

  // Rank Change Request Routes
  app.post("/api/rank-change-request", requireAuth, async (req: any, res) => {
    try {
      const { requestedRank, proofImageUrl } = req.body;
      const userId = req.session.userId;

      if (!requestedRank || !proofImageUrl) {
        return res.status(400).json({ message: "Зэрэг болон баталгаажуулах зураг заавал оруулна уу" });
      }

      // Get player
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(404).json({ message: "Тоглогчийн мэдээлэл олдсонгүй" });
      }

      // Check if user already has pending request
      const existingRequests = await storage.getRankChangeRequestsByUserId(userId);
      const pendingRequest = existingRequests.find(req => req.status === 'pending');

      if (pendingRequest) {
        return res.status(400).json({ message: "Та аль хэдийн зэрэг өөрчлөх хүсэлт илгээсэн байна" });
      }

      const request = await storage.createRankChangeRequest({
        userId,
        playerId: player.id,
        currentRank: player.rank,
        requestedRank,
        proofImageUrl,
      });

      res.json({ message: "Зэрэг өөрчлөх хүсэлт амжилттай илгээгдлээ", request });
    } catch (e) {
      console.error("Error creating rank change request:", e);
      res.status(500).json({ message: "Хүсэлт илгээхэд алдаа гарлаа" });
    }
  });

  app.get("/api/rank-change-requests/me", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const requests = await storage.getRankChangeRequestsByUserId(userId);
      res.json(requests);
    } catch (e) {
      console.error("Error fetching user rank change requests:", e);
      res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
    }
  });

  // Admin rank change request routes
  app.get("/api/admin/rank-change-requests", requireAuth, isAdminRole, async (req, res) => {
    try {
      const requests = await storage.getAllRankChangeRequests();
      res.json(requests);
    } catch (e) {
      console.error("Error fetching rank change requests:", e);
      res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
    }
  });

  app.put("/api/admin/rank-change-requests/:id", requireAuth, isAdminRole, async (req: any, res) => {
    try {
      const { status, adminNotes } = req.body;
      const adminId = req.session.userId;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Буруу статус" });
      }

      const request = await storage.updateRankChangeRequestStatus(req.params.id, status, adminId, adminNotes);

      if (!request) {
        return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
      }

      res.json({ message: `Хүсэлт ${status === 'approved' ? 'батлагдлаа' : 'цуцлагдлаа'}`, request });
    } catch (e) {
      console.error("Error updating rank change request:", e);
      res.status(500).json({ message: "Хүсэлт шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/admin/rank-change-requests/:id", requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteRankChangeRequest(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
      }

      res.json({ message: "Хүсэлт амжилттай устгагдлаа" });
    } catch (e) {
      console.error("Error deleting rank change request:", e);
      res.status(500).json({ message: "Хүсэлт устгахад алдаа гарлаа" });
    }
  });

  // -------------
  // Profile
  // -------------
  // Get user profile
  app.get("/api/user/profile", async (req: any, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!req.session?.userId) {
      console.log(`[${requestId}] Unauthorized profile fetch attempt`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.session.userId;

    try {
      console.log(`[${requestId}] Fetching profile for user: ${userId}`);
      const profile = await storage.getUserProfile(userId);

      // Prevent any caching of profile data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      console.log(`[${requestId}] Profile fetched successfully for user: ${userId}`);
      res.json(profile);
    } catch (error) {
      console.error(`[${requestId}] Error fetching profile for user ${userId}:`, error);
      res.status(500).json({ message: "Профайл татахад алдаа гарлаа" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req: any, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!req.session?.userId) {
      console.log(`[${requestId}] Unauthorized profile update attempt`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.session.userId;
    const startTime = Date.now();

    try {
      console.log(`[${requestId}] Profile update request - User: ${userId}`);
      console.log(`[${requestId}] Request body:`, JSON.stringify(req.body));

      const {
        name,
        firstName,
        lastName,
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
        bio
      } = req.body;

      // Prepare update data with proper validation
      const updateData: any = {
        updatedAt: new Date()
      };

      // Prioritize firstName and lastName if provided directly
      if (firstName !== undefined || lastName !== undefined) {
        if (firstName !== undefined) updateData.firstName = firstName.trim();
        if (lastName !== undefined) updateData.lastName = lastName.trim();
      } else if (name) {
        // Fallback to splitting name if firstName/lastName not provided
        // Mongolian name format: lastName firstName (Овог Нэр)
        const nameParts = name.trim().split(/\s+/);
        updateData.lastName = nameParts[0]; // First part is lastName (овог)
        updateData.firstName = nameParts.slice(1).join(' ') || ''; // Rest is firstName (нэр)
      }

      if (email !== undefined) updateData.email = email.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      if (gender !== undefined) updateData.gender = gender;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
      if (clubName !== undefined) updateData.clubAffiliation = clubName.trim();
      if (profilePicture !== undefined) updateData.profileImageUrl = profilePicture;
      if (province !== undefined) updateData.province = province;
      if (city !== undefined) updateData.city = city;
      if (rubberTypes !== undefined) updateData.rubberTypes = rubberTypes;
      if (handedness !== undefined) updateData.handedness = handedness;
      if (playingStyles !== undefined) updateData.playingStyles = playingStyles;
      if (bio !== undefined) updateData.bio = bio;

      console.log(`[${requestId}] Update data prepared:`, JSON.stringify(updateData));

      // Perform update with transaction
      const updatedUser = await storage.updateUserProfile(userId, updateData);

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Profile update SUCCESS - Duration: ${duration}ms - User: ${userId}`);
      console.log(`[${requestId}] Updated user data:`, JSON.stringify(updatedUser));

      // Return fresh data with cache headers
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        message: "Профайл амжилттай шинэчлэгдлээ",
        user: updatedUser
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] Profile update FAILED - Duration: ${duration}ms - User: ${userId}`, error);
      res.status(500).json({
        message: "Профайл шинэчлэхэд алдаа гарлаа",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ----------------
  // Membership (user)
  // ----------------
  app.post("/api/user/membership", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { type } = req.body;
      if (!type || !["adult", "child"].includes(type))
        return res.status(400).json({ message: "Буруу гишүүнчлэлийн төрөл" });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const amount = type === "adult" ? 50000 : 30000;

      const updatedUser = await storage.updateUserProfile(userId, {
        membershipType: type,
        membershipStartDate: startDate,
        membershipEndDate: endDate,
        membershipActive: true,
        membershipAmount: amount,
      });
      if (!updatedUser)
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });

      res.json({
        message: "Гишүүнчлэл амжилттай худалдаж авлаа",
        membershipType: type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        amount,
      });
    } catch (e) {
      console.error("Error purchasing membership:", e);
      res
        .status(500)
        .json({ message: "Гишүүнчлэл худалдаж авахад алдаа гарлаа" });
    }
  });

  // --------------
  // User dashboards
  // --------------
  app.get("/api/user/tournaments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const player =
        req.session.user?.role === "player"
          ? await storage.getPlayerByUserId(userId)
          : null;
      if (!player) return res.json([]);

      const regs = await storage.getPlayerTournamentRegistrations(player.id);
      const tournaments = [];
      for (const r of regs) {
        const t = await storage.getTournament(r.tournamentId);
        if (t) {
          tournaments.push({
            id: t.id,
            name: t.name,
            startDate: t.startDate,
            endDate: t.endDate,
            location: t.location,
            status: t.status,
            participationType: r.participationType,
          });
        }
      }
      res.json(tournaments);
    } catch (e) {
      console.error("Error fetching user tournaments:", e);
      res
        .status(500)
        .json({ message: "Тэмцээний мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/user/matches", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const player =
        req.session.user?.role === "player"
          ? await storage.getPlayerByUserId(userId)
          : null;
      if (!player) return res.json([]);
      const matches = await storage.getPlayerMatchesWithDetails(player.id);
      res.json(matches);
    } catch (e) {
      console.error("Error fetching user matches:", e);
      res.status(500).json({ message: "Тоглолтын түүх авахад алдаа гарлаа" });
    }
  });

  app.get("/api/user/teams", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const player =
        req.session.user?.role === "player"
          ? await storage.getPlayerByUserId(userId)
          : null;
      if (!player) return res.json([]);
      const teams = await storage.getPlayerTeams(player.id);
      res.json(teams);
    } catch (e) {
      console.error("Error fetching user teams:", e);
      res.status(500).json({ message: "Багийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/user/medals", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const player =
        req.session.user?.role === "player"
          ? await storage.getPlayerByUserId(userId)
          : null;
      if (!player) return res.json([]);
      const medals = await storage.getPlayerMedals(player.id);
      res.json(medals);
    } catch (e) {
      console.error("Error fetching user medals:", e);
      res.status(500).json({ message: "Медалиудыг авахад алдаа гарлаа" });
    }
  });

  // Add missing API endpoints for profile fetching
  app.get("/api/players/me", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Тоглогч олдсонгүй" });
      }

      const player = await storage.getPlayerByUserId(userId);

      const profileData = {
        id: user.id,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        gender: user.gender || 'male',
        birthDate: user.dateOfBirth ? user.dateOfBirth.toISOString().split("T")[0] : '1990-01-01',
        email: user.email,
        phone: user.phone,
        clubAffiliation: user.clubAffiliation,
        player: player
      };

      res.json(profileData);
    } catch (e) {
      console.error("Error fetching player profile:", e);
      res.status(500).json({ message: "Тоглогчийн профайл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/me", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      const profileData = {
        id: user.id,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        gender: user.gender || 'male',
        birthDate: user.dateOfBirth ? user.dateOfBirth.toISOString().split("T")[0] : '1990-01-01',
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        clubAffiliation: user.clubAffiliation,
        role: user.role
      };

      res.json(profileData);
    } catch (e) {
      console.error("Error fetching user profile:", e);
      res.status(500).json({ message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // --------------
  // Public players/clubs
  // --------------
  app.get("/api/players", async (_req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (e) {
      console.error("Error fetching players:", e);
      res
        .status(500)
        .json({ message: "Тоглогчдын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.post("/api/players", requireAuth, async (req: any, res) => {
    try {
      const playerData = insertPlayerSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (e) {
      console.error("Error creating player:", e);
      res.status(400).json({ message: "Тоглогч үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      let player = await storage.getPlayerWithUser(req.params.id);
      if (!player) player = await storage.getPlayerByUserId(req.params.id);
      if (!player) {
        try {
          player = await storage.ensurePlayerExists(req.params.id);
        } catch {
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        }
      }

      // Remove sensitive information for privacy
      if (player && player.users) {
        const { email, phone, province, city, ...safeUserData } = player.users;
        player = { ...player, users: safeUserData };
      }

      res.json(player);
    } catch (e) {
      console.error("Error fetching player:", e);
      res
        .status(500)
        .json({ message: "Тоглогчийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/players/:id/matches", async (req, res) => {
    try {
      const matches = await storage.getPlayerMatches(req.params.id);
      res.json(matches);
    } catch (e) {
      console.error("Error fetching player matches:", e);
      res.status(500).json({ message: "Тоглолтын түүх авахад алдаа гарлаа" });
    }
  });

  app.get("/api/players/:id/tournament-matches", async (req, res) => {
    try {
      const tournamentMatches = await storage.getPlayerTournamentMatches(
        req.params.id,
      );
      res.json(tournamentMatches);
    } catch (e) {
      console.error("Error fetching player tournament matches:", e);
      res
        .status(500)
        .json({ message: "Тэмцээний тоглолтын түүх авахад алдаа гарлаа" });
    }
  });

  app.get("/api/players/:id/achievements", async (req, res) => {
    try {
      const achievements = await storage.getPlayerAchievements(req.params.id);
      res.json(achievements);
    } catch (e) {
      console.error("Error fetching player achievements:", e);
      res.status(500).json({ message: "Амжилтууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/players/:id/membership", async (req, res) => {
    try {
      const membership = await storage.getMembership(req.params.id);
      res.json(membership);
    } catch (e) {
      console.error("Error fetching membership:", e);
      res
        .status(500)
        .json({ message: "Гишүүнчлэлийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/players/top", async (_req, res) => {
    try {
      const players = await storage.getAllPlayers();
      // Sort by wins and points
      const topPlayers = players
        .filter((p: any) => p.users && p.users.firstName)
        .sort((a: any, b: any) => {
          const aWins = a.players?.wins || 0;
          const bWins = b.players?.wins || 0;
          const aPoints = a.players?.points || 0;
          const bPoints = b.players?.points || 0;
          if (bWins !== aWins) return bWins - aWins;
          return bPoints - aPoints;
        })
        .slice(0, 10)
        .map((p: any) => ({
          id: p.players?.id || p.id,
          name: `${p.users?.firstName || ''} ${p.users?.lastName || ''}`.trim(),
          wins: p.players?.wins || 0,
          losses: p.players?.losses || 0,
          points: p.players?.points || 0,
          rank: p.players?.rank || 'Тодорхойгүй'
        }));
      res.json(topPlayers);
    } catch (e) {
      console.error("Error fetching top players:", e);
      res.status(500).json({ message: "Тоглогчдын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // --------------
  // Global Search
  // --------------
  app.get("/api/search", async (req, res) => {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const limitParam = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
      const limit = Number.isFinite(limitParam) && limitParam && limitParam > 0 ? Math.min(limitParam, 25) : 5;

      if (query.trim().length < 2) {
        return res.json({
          players: [],
          tournaments: [],
          news: [],
          clubs: [],
          branches: [],
          federationMembers: [],
          judges: [],
          nationalTeamPlayers: [],
        });
      }

      const results = await storage.searchSiteContent(query, limit);
      res.json(results);
    } catch (e) {
      console.error("Error performing global search:", e);
      res.status(500).json({ message: "Хайлт хийхэд алдаа гарлаа" });
    }
  });

  // --------------
  // Clubs / Branches / Federation members / Judges
  // --------------
  app.post("/api/clubs", requireAuth, async (req: any, res) => {
    try {
      const ownerId = req.session.userId;
      const clubData = insertClubSchema.parse({ ...req.body, ownerId });
      const club = await storage.createClub(clubData);
      res.json(club);
    } catch (e) {
      console.error("Error creating club:", e);
      res.status(400).json({ message: "Клуб үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/clubs", async (req, res) => {
    try {
      const { search, city, status, sort } = req.query;

      let clubs = await storage.getAllClubs();

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        clubs = clubs.filter(club =>
          club.name?.toLowerCase().includes(searchLower) ||
          club.city?.toLowerCase().includes(searchLower) ||
          club.district?.toLowerCase().includes(searchLower) ||
          club.ownerName?.toLowerCase().includes(searchLower) ||
          club.coaches?.some((coach: string) => coach.toLowerCase().includes(searchLower))
        );
      }

      // Apply city filter
      if (city && typeof city === 'string' && city !== 'all') {
        clubs = clubs.filter(club => club.city === city);
      }

      // Apply status filter
      if (status && typeof status === 'string' && status !== 'all') {
        clubs = clubs.filter(club => club.status === status);
      }

      // Apply sorting
      if (sort && typeof sort === 'string') {
        switch (sort) {
          case 'name':
            clubs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
          case 'city':
            clubs.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
            break;
          case 'newest':
            clubs.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            break;
          case 'oldest':
            clubs.sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0));
            break;
          default:
            // Default sort by name
            clubs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
      }

      res.json(clubs);
    } catch (e) {
      console.error("Error fetching clubs:", e);
      res.status(500).json({ message: "Клубын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/judges", async (req, res) => {
    try {
      const type = req.query.type as string;
      const judges = await storage.getAllJudges(type);
      res.json(judges);
    } catch (e) {
      console.error("Error fetching judges:", e);
      res.status(500).json({ message: "Шүүгчдийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) return res.status(404).json({ message: "Клуб олдсонгүй" });
      const players = await storage.getPlayersByClub(req.params.id);
      const coaches = await storage.getClubCoachesByClub(req.params.id);
      const owner = club.ownerId ? await storage.getUser(club.ownerId) : null;
      res.json({ ...club, players, coaches, owner });
    } catch (e) {
      console.error("Error fetching club:", e);
      res.status(500).json({ message: "Клубын мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.put("/api/clubs/:id", requireAuth, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const currentUserId = req.session.userId;

      // Check if club exists and user has permission to edit
      const existingClub = await storage.getClub(clubId);
      if (!existingClub) {
        return res.status(404).json({ message: "Клуб олдсонгүй" });
      }

      // Check ownership or admin permission
      const user = await storage.getUser(currentUserId);
      if (existingClub.ownerId !== currentUserId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Энэ үйлдэл хийх эрх танд байхгүй" });
      }

      const clubData = z.object(insertClubSchema._def.schema.shape).omit({ ownerId: true }).partial().parse(req.body);
      const updatedClub = await storage.updateClub(clubId, clubData);

      if (!updatedClub) {
        return res.status(404).json({ message: "Клуб шинэчлэхэд алдаа гарлаа" });
      }

      res.json(updatedClub);
    } catch (e) {
      console.error("Error updating club:", e);
      res.status(400).json({ message: "Клуб шинэчлэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/clubs/:id", requireAuth, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const currentUserId = req.session.userId;

      // Check if club exists and user has permission to delete
      const existingClub = await storage.getClub(clubId);
      if (!existingClub) {
        return res.status(404).json({ message: "Клуб олдсонгүй" });
      }

      // Check ownership or admin permission
      const user = await storage.getUser(currentUserId);
      if (existingClub.ownerId !== currentUserId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Энэ үйлдэл хийх эрх танд байхгүй" });
      }

      const deleted = await storage.deleteClub(clubId);

      if (!deleted) {
        return res.status(404).json({ message: "Клуб устгахад алдаа гарлаа" });
      }

      res.json({ message: "Клуб амжилттай устгагдлаа" });
    } catch (e) {
      console.error("Error deleting club:", e);
      res.status(500).json({ message: "Клуб устгахад алдаа гарлаа" });
    }
  });

  app.get("/api/branches", async (_req, res) => {
    try {
      const branches = await storage.getAllBranches();

      // Add location information for branches with coordinates
      const branchesWithLocation = await Promise.all(
        branches.map(async (branch) => {
          if (branch.coordinates) {
            try {
              const [lat, lng] = branch.coordinates.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lng)) {
                // Reverse geocoding using a free service
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                const locationData = await response.json();

                return {
                  ...branch,
                  country: locationData.countryName || null,
                  city: locationData.city || locationData.locality || null,
                  countryCode: locationData.countryCode || null,
                  isInternational: locationData.countryCode !== 'MN' // MN is Mongolia's country code
                };
              }
            } catch (error) {
              console.error('Error fetching location data for branch:', branch.name, error);
            }
          }

          return {
            ...branch,
            country: null,
            city: null,
            countryCode: null,
            isInternational: false
          };
        })
      );

      res.json(branchesWithLocation);
    } catch (e) {
      console.error("Error fetching branches:", e);
      res.status(500).json({ message: "Салбар холбоод авахад алдаа гарлаа" });
    }
  });

  app.get("/api/branches/:id", async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch)
        return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
      res.json(branch);
    } catch (e) {
      console.error("Error fetching branch:", e);
      res
        .status(500)
        .json({ message: "Салбар холбооны мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/federation-members", async (_req, res) => {
    try {
      const members = await storage.getAllFederationMembers();
      res.json(members);
    } catch (e) {
      console.error("Error fetching federation members:", e);
      res
        .status(500)
        .json({ message: "Холбооны гишүүдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/national-team", async (_req, res) => {
    try {
      const players = await storage.getAllNationalTeamPlayers();
      res.json(players);
    } catch (e) {
      console.error("Error fetching national team players:", e);
      res
        .status(500)
        .json({ message: "Үндэсний шигшээ багийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/judges", async (req, res) => {
    try {
      const { type } = req.query;
      const judges = await storage.getAllJudges(type as string | undefined);
      res.json(judges);
    } catch (e) {
      console.error("Error fetching judges:", e);
      res
        .status(500)
        .json({ message: "Шүүгчдийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // --------------
  // Tournaments
  // --------------
  app.post("/api/tournaments", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "admin")
        return res
          .status(403)
          .json({ message: "Зөвхөн админ хэрэглэгч тэмцээн үүсгэх боломжтой" });

      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Тэмцээний нэр заавал байх ёстой" });
      }
      if (!req.body.startDate) {
        return res.status(400).json({ message: "Эхлэх огноо заавал байх ёстой" });
      }
      if (!req.body.endDate) {
        return res.status(400).json({ message: "Дуусах огноо заавал байх ёстой" });
      }
      if (!req.body.location) {
        return res.status(400).json({ message: "Байршил заавал байх ёстой" });
      }

      const hasEventsArray = Array.isArray(req.body.events) && req.body.events.length > 0;
      const hasLegacyParticipationTypes =
        Array.isArray(req.body.participationTypes) && req.body.participationTypes.length > 0;

      if (!hasEventsArray && !hasLegacyParticipationTypes) {
        return res
          .status(400)
          .json({ message: "Хамгийн багадаа нэг ивэнт эсвэл төрөл байх ёстой" });
      }

      let normalizedEvents: any[] = [];
      if (hasEventsArray) {
        for (const event of req.body.events) {
          if (typeof event === 'string') {
            try {
              normalizedEvents.push(JSON.parse(event));
            } catch {
              return res.status(400).json({ message: "Ивэнтийн мэдээлэл буруу байна" });
            }
          } else {
            normalizedEvents.push(event);
          }
        }

        // Validate each event
        for (const event of normalizedEvents) {
          if (!event.type || !['SINGLES', 'DOUBLES', 'TEAM'].includes(event.type)) {
            return res.status(400).json({ message: "Ивэнтийн төрөл буруу байна" });
          }

          if ((event.type === 'DOUBLES' || event.type === 'TEAM') && !event.subType) {
            return res
              .status(400)
              .json({ message: `${event.type} төрөлд дэд төрөл заавал оруулах ёстой` });
          }

          if (
            event.type === 'DOUBLES' &&
            !['MEN_DOUBLES', 'WOMEN_DOUBLES', 'MIXED_DOUBLES'].includes(event.subType)
          ) {
            return res.status(400).json({ message: "Хосын төрөл буруу байна" });
          }

          if (
            event.type === 'TEAM' &&
            event.subType &&
            !['MEN_TEAM', 'WOMEN_TEAM', 'MIXED_TEAM'].includes(event.subType)
          ) {
            return res.status(400).json({ message: "Багийн төрөл буруу байна" });
          }

          if (!event.divisions || !Array.isArray(event.divisions) || event.divisions.length === 0) {
            return res
              .status(400)
              .json({ message: "Ивэнт бүрт хамгийн багадаа нэг насны ангилал байх ёстой" });
          }

          for (const division of event.divisions) {
            if (!division.name) {
              return res.status(400).json({ message: "Насны ангиллын нэр заавал оруулах ёстой" });
            }
          }
        }
      }

      let participationTypes: string[] = [];
      if (hasEventsArray) {
        participationTypes = normalizedEvents.map(event => JSON.stringify(event));
      } else if (hasLegacyParticipationTypes) {
        participationTypes = req.body.participationTypes.map((type: any) =>
          typeof type === 'string' ? type : JSON.stringify(type),
        );
      }

      // Validate dates
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: "Эхлэх огноо буруу байна" });
      }
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Дуусах огноо буруу байна" });
      }
      if (endDate <= startDate) {
        return res.status(400).json({ message: "Дуусах огноо эхлэх огнооноос хойш байх ёстой" });
      }

      let registrationDeadline = null;
      if (req.body.registrationDeadline) {
        registrationDeadline = new Date(req.body.registrationDeadline);
        if (isNaN(registrationDeadline.getTime())) {
          return res.status(400).json({ message: "Бүртгэлийн эцсийн хугацаа буруу байна" });
        }
      }

      const tournamentData = {
        name: req.body.name,
        description: req.body.description || null,
        richDescription: req.body.richDescription || null,
        startDate,
        endDate,
        registrationDeadline,
        location: req.body.location,
        organizer: req.body.organizer || null,
        maxParticipants: parseInt(req.body.maxParticipants) || 32,
        entryFee: req.body.entryFee ? req.body.entryFee.toString() : "0",
        status: "registration" as any,
        participationTypes: participationTypes,
        rules: req.body.rules || null,
        prizes: req.body.prizes || null,
        contactInfo: req.body.contactInfo || null,
        schedule: req.body.schedule || null,
        requirements: req.body.requirements || null,
        isPublished: Boolean(req.body.isPublished),
        organizerId: req.session.userId,
        clubId: null,
        backgroundImageUrl: req.body.backgroundImageUrl || null,
        regulationDocumentUrl: req.body.regulationDocumentUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (e) {
      console.error("Error creating tournament:", e);
      res
        .status(400)
        .json({
          message: "Тэмцээн үүсгэхэд алдаа гарлаа",
          error: e instanceof Error ? e.message : String(e),
        });
    }
  });

  // Public tournaments = active only
  app.get("/api/tournaments", async (req, res) => {
    try {
      let tournaments = await storage.getTournaments();

      // If user is not admin, only show published tournaments
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      const isAdmin = user && user.role === 'admin';

      if (!isAdmin) {
        tournaments = tournaments.filter(t => t.isPublished);
      }

      res.json(tournaments);
    } catch (e) {
      console.error("Error fetching tournaments:", e);
      res
        .status(500)
        .json({ message: "Тэмцээн олдсонгүй" });
    }
  });

  app.get("/api/tournaments/upcoming", async (_req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      const now = new Date();
      const upcomingTournaments = tournaments.filter(tournament =>
        new Date(tournament.startDate) >= now
      );
      res.json(upcomingTournaments);
    } catch (e) {
      console.error("Error fetching upcoming tournaments:", e);
      res.status(500).json({ message: "Тэмцээн олдсонгүй" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament)
        return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
      const matches = await storage.getMatchesByTournament(req.params.id);
      res.json({ ...tournament, matches });
    } catch (e) {
      console.error("Error fetching tournament:", e);
      res
        .status(500)
        .json({ message: "Тэмцээнний мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.put(
    "/api/tournaments/:id",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        const {
          startDate,
          endDate,
          registrationDeadline,
          maxParticipants,
          entryFee,
          ...rest
        } = req.body;
        const tournamentData = insertTournamentSchema.partial().parse({
          ...rest,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          ...(registrationDeadline
            ? { registrationDeadline: new Date(registrationDeadline) }
            : {}),
          ...(maxParticipants !== undefined
            ? { maxParticipants: parseInt(maxParticipants) }
            : {}),
          ...(entryFee !== undefined ? { entryFee: entryFee.toString() } : {}),
        });

        const tournament = await storage.updateTournament(
          req.params.id,
          tournamentData,
        );
        if (!tournament)
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        res.json(tournament);
      } catch (e) {
        console.error("Error updating tournament:", e);
        res.status(400).json({ message: "Тэмцээн шинэчлэхэд алдаа гарлаа" });
      }
    },
  );

  // Add PATCH method support for tournament updates
  app.patch(
    "/api/admin/tournaments/:id",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        const tournamentId = req.params.id;

        // Check if tournament exists first
        const existingTournament = await storage.getTournament(tournamentId);
        if (!existingTournament) {
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        }

        // Parse and validate update data
        const {
          startDate,
          endDate,
          registrationDeadline,
          maxParticipants,
          entryFee,
          isPublished,
          ...rest
        } = req.body;

        const updateData = insertTournamentSchema.partial().parse({
          ...rest,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          ...(registrationDeadline
            ? { registrationDeadline: new Date(registrationDeadline) }
            : {}),
          ...(maxParticipants !== undefined
            ? { maxParticipants: parseInt(maxParticipants) }
            : {}),
          ...(entryFee !== undefined ? { entryFee: entryFee.toString() } : {}),
          ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        });

        const tournament = await storage.updateTournament(tournamentId, updateData);
        if (!tournament) {
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        }

        res.json(tournament);
      } catch (e) {
        console.error("Error updating tournament:", e);
        if (e instanceof z.ZodError) {
          return res.status(422).json({
            message: "Мэдээллийн алдаа",
            errors: e.errors
          });
        }
        res.status(400).json({ message: "Тэмцээн шинэчлэхэд алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/tournaments/:id",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        const success = await storage.deleteTournament(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        res.json({ message: "Тэмцээн амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting tournament:", e);
        res.status(400).json({ message: "Тэмцээн устгахад алдаа гарлаа" });
      }
    },
  );

  // Registration endpoints
  app.post("/api/registrations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Нэвтрэх шаардлагатай" });
      }

      const { tournamentId, categories, category } = req.body;

      // Support both old (single category) and new (multiple categories) format
      const categoriesToRegister = categories || (category ? [category] : []);

      if (!tournamentId || categoriesToRegister.length === 0) {
        return res.status(400).json({ message: "Тэмцээний ID болон ангилал шаардлагатай" });
      }

      // Get the player for this user
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        // Create player if doesn't exist
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
        }
        
        const newPlayer = await storage.createPlayer({
          userId,
          dateOfBirth: user.dateOfBirth,
          rank: null,
          clubId: null,
        });
        
        if (!newPlayer) {
          return res.status(500).json({ message: "Тоглогчийн профайл үүсгэж чадсангүй" });
        }
      }

      const playerId = player?.id || (await storage.getPlayerByUserId(userId))?.id;
      if (!playerId) {
        return res.status(500).json({ message: "Тоглогчийн мэдээлэл олдсонгүй" });
      }

      // Check if already registered for any of these categories
      const existing = await storage.getPlayerTournamentRegistrations(playerId);

      // Filter out categories already registered for this tournament
      const existingForTournament = existing.filter(e => e.tournamentId === tournamentId);
      const existingTypes = existingForTournament.map(e => e.participationType);
      const newCategories = categoriesToRegister.filter(
        (cat: string) => !existingTypes.includes(cat)
      );

      if (newCategories.length === 0) {
        return res.status(400).json({
          message: "Та сонгосон бүх ангилалд аль хэдийн бүртгэгдсэн байна"
        });
      }

      // Register participant for each new category
      const registrations = [];
      for (const cat of newCategories) {
        const registration = await storage.registerForTournament({
          tournamentId,
          playerId,
          participationType: cat,
        });
        registrations.push(registration);
      }

      res.json(registrations);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Бүртгэлд алдаа гарлаа" });
    }
  });


  app.get("/api/registrations/me", requireAuth, async (req: any, res) => {
    try {
      const { tid: tournamentId } = req.query;

      if (!tournamentId) {
        return res.status(400).json({ message: "Tournament ID заавал оруулна уу" });
      }

      const userId = req.session.userId;
      const player = await storage.getPlayerByUserId(userId);

      if (!player) {
        return res.json([]);
      }

      const registrations = await storage.getPlayerTournamentRegistrations(player.id);
      const tournamentRegs = registrations
        .filter(reg => reg.tournamentId === tournamentId)
        .map(reg => reg.participationType);

      res.json(tournamentRegs);
    } catch (e) {
      console.error("Error fetching user registrations:", e);
      res.status(500).json({ message: "Бүртгэлийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  // Registration
  app.post(
    "/api/tournaments/:id/register",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const tournamentId = req.params.id;
        const user = req.user as any;

        if (!user?.id) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if user already registered
        const existingRegistration = await storage.getTournamentRegistration(tournamentId, user.id);
        if (existingRegistration) {
          return res.status(400).json({ message: "Та аль хэдийн бүртгүүлсэн байна" });
        }

        // Get user's player profile - if not found, create one from user data
        let playerProfile = await storage.getPlayerByUserId(user.id);
        if (!playerProfile) {
          // Create a basic player profile from user information
          const userData = await storage.getUserById(user.id);
          if (userData) {
            await storage.createPlayer({
              userId: user.id,
              memberNumber: null,
              clubId: null,
              rankingAllAges: null,
              rankingOwnAge: null,
              rank: null, // No rank during registration
              points: 0,
              achievements: null,
              dateOfBirth: userData.dateOfBirth
            });
            playerProfile = await storage.getPlayerByUserId(user.id);
          }
        }

        if (!playerProfile) {
          return res.status(400).json({ message: "Профайлын мэдээлэл үүсгэх боломжгүй байна" });
        }

        // Register for tournament
        await storage.registerForTournament({ tournamentId, playerId: user.id, participationType: 'singles' });

        res.json({
          message: "Амжилттай бүртгүүллээ",
          registration: {
            tournamentId,
            userId: user.id,
            registeredAt: new Date()
          }
        });
      } catch (error) {
        console.error("Error registering for tournament:", error);
        res.status(500).json({ message: "Серверийн алдаа гарлаа" });
      }
    },
  );

  app.get(
    "/api/tournaments/:tournamentId/registration-stats",
    async (req, res) => {
      try {
        const stats = await storage.getTournamentRegistrationStats(
          req.params.tournamentId,
        );
        res.json(stats);
      } catch (e) {
        console.error("Error fetching registration stats:", e);
        res.status(500).json({ message: "Failed to fetch registration stats" });
      }
    },
  );

  app.get(
    "/api/tournaments/:tournamentId/user-registration",
    async (req: any, res) => {
      if (!req.session?.userId) return res.json({ registered: false });
      try {
        const userId = req.session.userId;
        const player = await storage.getPlayerByUserId(userId);
        if (!player) return res.json({ registered: false });
        const registration = await storage.getTournamentRegistration(
          req.params.tournamentId,
          player.id,
        );
        res.json({ registered: !!registration, registration });
      } catch (e) {
        console.error("Error checking registration:", e);
        res.status(500).json({ message: "Failed to check registration" });
      }
    },
  );

  app.get("/api/tournaments/:tournamentId/participants", async (req, res) => {
    try {
      const { category } = req.query;
      const { tournamentId } = req.params;

      console.log(`Fetching participants for tournament: ${tournamentId}, category: ${category}`);

      if (!tournamentId) {
        return res.status(400).json({ message: "Tournament ID is required" });
      }

      let participants = await storage.getTournamentParticipants(tournamentId);

      // Filter by category if specified
      if (category && category !== 'all') {
        participants = participants.filter(p => p.participationType === category);
      }

      console.log(`Returning ${participants.length} participants`);
      res.json(participants);
    } catch (e) {
      console.error("Error fetching tournament participants:", e);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  app.post(
    "/api/admin/tournaments/:tournamentId/participants",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        const { tournamentId } = req.params;
        const { playerId, playerName, participationType } = req.body;

        if (!participationType)
          return res
            .status(400)
            .json({ message: "participationType is required" });

        let finalPlayerId = playerId;

        // If no playerId is provided, create a basic user and player record
        if (!finalPlayerId) {
          if (!playerName)
            return res
              .status(400)
              .json({ message: "playerName is required" });

          const [firstName, ...rest] = String(playerName).split(" ");
          const lastName = rest.join(" ");
          const newUser = await storage.createSimpleUser({
            email: null,
            phone: null,
            firstName,
            lastName,
            gender: null,
            dateOfBirth: null,
            clubAffiliation: null,
            password: null,
            role: "player",
          });
          const newPlayer = await storage.createPlayer({ userId: newUser.id, rank: null });
          finalPlayerId = newPlayer.id;
        } else {
          try {
            await validateTournamentEligibility(
              tournamentId,
              finalPlayerId,
              participationType,
            );
          } catch (err: any) {
            return res.status(400).json({ message: err.message });
          }
        }

        const existing = await storage.getTournamentRegistration(
          tournamentId,
          finalPlayerId,
        );
        if (existing)
          return res
            .status(400)
            .json({ message: "Тэмцээнд аль хэдийн бүртгүүлсэн байна" });

        const registration = await storage.registerForTournament({
          tournamentId,
          playerId: finalPlayerId,
          participationType: participationType || "singles",
        });
        res.json({ message: "Participant added", registration });
      } catch (e) {
        console.error("Admin add participant error:", e);
        res.status(500).json({ message: "Failed to add participant" });
      }
    },
  );

  app.delete(
    "/api/admin/tournaments/:tournamentId/participants/:playerId",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.removeTournamentParticipant(
          req.params.tournamentId,
          req.params.playerId,
        );
        if (!success)
          return res.status(404).json({ message: "Participant not found" });
        res.json({ message: "Participant removed" });
      } catch (e) {
        console.error("Admin remove participant error:", e);
        res.status(500).json({ message: "Failed to remove participant" });
      }
    },
  );

  // Matches
  app.post("/api/matches", requireAuth, async (req: any, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.json(match);
    } catch (e) {
      console.error("Error creating match:", e);
      res.status(400).json({ message: "Тоглолт үүсгэхэд алдаа гарлаа" });
    }
  });

  const updateMatchResultSchema = z.object({
    winnerId: z.string(),
    sets: z.array(
      z.object({
        matchId: z.string(),
        setNumber: z.number(),
        player1Score: z.number(),
        player2Score: z.number(),
      }),
    ),
  });

  app.put("/api/matches/:id/result", isAuthenticated, async (req, res) => {
    try {
      const { winnerId, sets } = updateMatchResultSchema.parse(req.body);
      await storage.updateMatchResult(req.params.id, winnerId, sets);
      res.json({ message: "Тоглолтын үр дүн амжилттай хадгалагдлаа" });
    } catch (e) {
      console.error("Error updating match result:", e);
      res
        .status(400)
        .json({ message: "Тоглолтын үр дүн хадгалахад алдаа гарлаа" });
    }
  });


  // Update match players
  app.put('/api/matches/:matchId/players', requireAuth, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { playerAId, playerBId, override } = req.body;

      console.log(`Updating match ${matchId} players:`, { playerAId, playerBId });

      // For now, we'll update tournament results directly
      // In a real implementation, you'd have a matches table

      // Find the tournament this match belongs to
      const tournaments = await storage.getTournaments();
      let targetTournament = null;
      let targetResults = null;

      for (const tournament of tournaments) {
        const results = await storage.getTournamentResults(tournament.id);
        if (results?.knockoutResults) {
          const knockoutResults = results.knockoutResults as any;
          for (const category in knockoutResults) {
            const matches = knockoutResults[category] || [];
            const match = matches.find((m: any) => m.id === matchId);
            if (match) {
              targetTournament = tournament;
              targetResults = results;

              // Update the match players
              if (playerAId) {
                const playerA = await storage.getUser(playerAId);
                if (playerA) {
                  match.player1 = {
                    id: playerA.id,
                    name: `${playerA.firstName} ${playerA.lastName}`
                  };
                }
              } else {
                match.player1 = null;
              }

              if (playerBId) {
                const playerB = await storage.getUser(playerBId);
                if (playerB) {
                  match.player2 = {
                    id: playerB.id,
                    name: `${playerB.firstName} ${playerB.lastName}`
                  };
                }
              } else {
                match.player2 = null;
              }

              // Save updated results
              await storage.upsertTournamentResults({
                tournamentId: tournament.id,
                groupStageResults: results.groupStageResults as any,
                knockoutResults: results.knockoutResults as any,
                finalRankings: results.finalRankings as any,
                isPublished: results.isPublished
              });

              console.log(`Updated match ${matchId} players successfully`);
              return res.json({ success: true, message: 'Match players updated' });
            }
          }
        }
      }

      res.status(404).json({ message: 'Match not found' });
    } catch (error) {
      console.error('Error updating match players:', error);
      res.status(500).json({ message: 'Failed to update match players' });
    }
  });

  // ----------------
  // News
  // ----------------
  app.post("/api/news", requireAuth, async (req: any, res) => {
    try {
      const authorId = req.session.userId;
      const newsData = insertNewsSchema.parse({ ...req.body, authorId });
      const news = await storage.createNews(newsData);
      res.json(news);
    } catch (e) {
      console.error("Error creating news:", e);
      res.status(400).json({ message: "Мэдээ үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const { category, q, sort = 'date', page = '1', limit = '12' } = req.query;

      res.set({
        "Cache-Control": "public, max-age=300",
        "ETag": `news-${Date.now()}`,
      });

      let news = await storage.getPublishedNews();

      // Apply filters
      if (category && category !== 'all') {
        news = news.filter((item: any) => item.category === category);
      }

      if (q && typeof q === 'string') {
        const query = q.toLowerCase();
        news = news.filter((item: any) =>
          item.title?.toLowerCase().includes(query) ||
          item.excerpt?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (sort === 'title') {
        news.sort((a: any, b: any) => a.title.localeCompare(b.title));
      } else if (sort === 'popular') {
        news.sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0));
      } else {
        // Default: sort by date
        news.sort((a: any, b: any) =>
          new Date(b.createdAt || b.publishedAt).getTime() -
          new Date(a.createdAt || a.publishedAt).getTime()
        );
      }

      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 12;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedNews = news.slice(startIndex, endIndex);

      res.json({
        news: paginatedNews,
        total: news.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(news.length / limitNum)
      });
    } catch (e) {
      console.error("Error fetching news:", e);
      res
        .status(500)
        .json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/news/latest", async (_req, res) => {
    try {
      res.set({
        "Cache-Control": "public, max-age=180",
        "ETag": `latest-news-${Date.now()}`,
      });
      const latestNews = await storage.getLatestPublishedNews(5);
      res.json(latestNews);
    } catch (e) {
      console.error("Error fetching latest news:", e);
      res
        .status(500)
        .json({ message: "Сүүлийн мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  // Get news article by id
  app.get("/api/news/:id", async (req, res) => {
    try {
      const article = await storage.getNewsById(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      }
      res.json(article);
    } catch (e) {
      console.error("Error fetching news article:", e);
      res.status(500).json({ message: "Мэдээ авахад алдаа гарлаа" });
    }
  });

  app.put("/api/news/:id/publish", requireAuth, async (req, res) => {
    try {
      await storage.publishNews(req.params.id);
      res.json({ message: "Мэдээ амжилттай нийтлэгдлээ" });
    } catch (e) {
      console.error("Error publishing news:", e);
      res.status(400).json({ message: "Мэдээ нийтлэхэд алдаа гарлаа" });
    }
  });

  app.put("/api/news/:id", requireAuth, async (req: any, res) => {
    try {
      const newsData = insertNewsSchema.partial().parse(req.body);
      if (req.body.imageUrl && req.body.imageUrl !== "")
        newsData.imageUrl = req.body.imageUrl;
      const updated = await storage.updateNews(req.params.id, newsData);
      if (!updated) return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      res.json({ message: "Мэдээ амжилттай шинэчлэгдлээ", news: updated });
    } catch (e) {
      console.error("Error updating news:", e);
      res.status(400).json({ message: "Мэдээ шинэчлэхэд алдаа гарлаа" });
    }
  });

  // Admin news (single set)
  app.get("/api/admin/news", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const allNews = await storage.getAllNews();
      res.json(allNews);
    } catch (e) {
      console.error("Error fetching all news:", e);
      res
        .status(500)
        .json({ message: "Мэдээний жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post(
    "/api/admin/news",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        console.log("Raw request body:", req.body);
        console.log("Session user ID:", req.session.userId);

        const authorId = req.session.userId;
        const dataToValidate = { ...req.body, authorId };
        console.log("Data to validate:", dataToValidate);

        // Make sure to set default values for fields that might be missing
        const validatedNewsData = insertNewsSchema.parse({
          ...dataToValidate,
          content: dataToValidate.content || '',
          excerpt: dataToValidate.excerpt || '',
          category: dataToValidate.category || 'news',
          imageUrl: dataToValidate.imageUrl || null,
          publishedAt: dataToValidate.published ? new Date() : null,
        });

        const news = await storage.createNews(validatedNewsData);
        console.log("Created news:", news);
        res.json(news);
      } catch (e) {
        console.error("Error creating news:", e);
        res.status(400).json({ message: "Мэдээ үүсгэхэд алдаа гарлаа" });
      }
    },
  );

  app.put("/api/admin/news/:id", requireAuth, isAdminRole, async (req, res) => {
    try {
      const updateData = { ...req.body };
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.publishedAt;
      updateData.updatedAt = new Date();
      const news = await storage.updateNews(req.params.id, updateData);
      if (!news) return res.status(404).json({ message: "Мэдээ олдсонгүй" });
      res.json(news);
    } catch (e) {
      console.error("Error updating news:", e);
      res.status(400).json({ message: "Мэдээ засварлахад алдаа гарлаа" });
    }
  });

  app.delete(
    "/api/admin/news/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteNews(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Мэдээ олдсонгүй" });
        res.json({ message: "Мэдээ амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting news:", e);
        res.status(400).json({ message: "Мэдээ устгахад алдаа гарлаа" });
      }
    },
  );

  // ----------------
  // Object storage (single canonical set)
  // ----------------
  app.post("/api/objects/upload", requireAuth, async (_req, res) => {
    try {
      const oss = new ObjectStorageService();
      const uploadURL = await oss.getObjectEntityUploadURL();

      if (!uploadURL) {
        throw new Error("Upload URL үүсгэж чадсангүй");
      }

      res.json({ uploadURL });
    } catch (e) {
      console.error("Error getting upload URL:", e);
      res.status(500).json({
        message: "Upload URL авахад алдаа гарлаа",
        error: e instanceof Error ? e.message : "Тодорхойгүй алдаа"
      });
    }
  });

  app.put("/api/objects/finalize", requireAuth, async (req: any, res) => {
    try {
      if (!req.body.fileURL) {
        return res.status(400).json({ error: "fileURL заавал оруулна уу" });
      }

      const oss = new ObjectStorageService();
      const objectPath = await oss.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: req.session.userId!,
          visibility: req.body.isPublic ? "public" : "private",
        },
      );

      if (!objectPath) {
        throw new Error("Object path үүсгэж чадсангүй");
      }

      res.status(200).json({ objectPath });
    } catch (e) {
      console.error("Error finalizing upload:", e);
      res.status(500).json({
        error: "Зураг баталгаажуулахад алдаа гарлаа",
        details: e instanceof Error ? e.message : "Тодорхойгүй алдаа"
      });
    }
  });

  app.put("/api/objects/acl", requireAuth, async (req, res) => {
    if (!req.body.imageURL)
      return res.status(400).json({ error: "imageURL is required" });
    try {
      const oss = new ObjectStorageService();
      const objectPath = await oss.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: (req as any).session.userId || "anonymous",
          visibility: "public",
        },
      );
      res.status(200).json({ objectPath });
    } catch (e) {
      console.error("Error setting image ACL:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Handle object storage files through the object storage service
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    const oss = new ObjectStorageService();
    try {
      const objectFile = await oss.getObjectEntityFile(req.path);

      // Check if this is a public object (no auth required for public objects)
      const aclPolicy = await getObjectAclPolicy(objectFile);
      if (aclPolicy?.visibility === "public") {
        await oss.downloadObject(objectFile, res);
        return;
      }

      // For private objects, require authentication
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Allow administrators to access all private objects
      let isAdmin = req.session.user?.role === "admin";
      if (!isAdmin) {
        try {
          const sessionUser = await storage.getUser(req.session.userId);
          isAdmin = sessionUser?.role === "admin";
        } catch (err) {
          console.error("Error verifying admin access:", err);
        }
      }

      if (isAdmin) {
        await oss.downloadObject(objectFile, res);
        return;
      }

      const canAccess = await oss.canAccessObjectEntity({
        objectFile,
        userId: req.session.userId,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await oss.downloadObject(objectFile, res);
    } catch (e) {
      // Suppress repeated ObjectNotFoundError logs to reduce console spam
      if (e instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error serving object:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve public objects (for backwards compatibility)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const oss = new ObjectStorageService();
    try {
      const file = await oss.searchPublicObject(filePath);
      if (!file) return res.status(404).json({ error: "File not found" });
      await oss.downloadObject(file, res);
    } catch (e) {
      // Only log non-404 errors to reduce console spam
      if (!(e instanceof ObjectNotFoundError)) {
        console.error("Error searching for public object:", e);
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ----------------
  // Sponsors / Sliders / Champions (admin)
  // ----------------
  app.get("/api/sliders", async (_req, res) => {
    try {
      const sliders = await storage.getActiveHomepageSliders();
      res.json(sliders);
    } catch (e) {
      console.error("Error fetching active sliders:", e);
      res
        .status(500)
        .json({ message: "Идэвхтэй слайдерууд авахад алдаа гарлаа" });
    }
  });

  app.get("/api/sponsors", async (_req, res) => {
    try {
      const sponsors = await storage.getAllSponsors();
      res.json(sponsors.filter((s) => s.isActive));
    } catch (e) {
      console.error("Error fetching active sponsors:", e);
      res
        .status(500)
        .json({ message: "Идэвхтэй ивээн тэтгэгчид авахад алдаа гарлаа" });
    }
  });

  app.get("/api/champions", async (_req, res) => {
    try {
      const champions = await storage.getAllChampions();
      res.json(champions);
    } catch (e) {
      console.error("Error fetching champions:", e);
      res.status(500).json({ message: "Аваргууд авахад алдаа гарлаа" });
    }
  });

  // ADMIN: sponsors/sliders/champions/branches/members/judges/users/players/leagues/teams
  app.get("/api/admin/stats", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const stats = await storage.getAdminStatistics();
      res.json(stats);
    } catch (e) {
      console.error("Error fetching admin statistics:", e);
      res.status(500).json({ message: "Статистик авахад алдаа гарлаа" });
    }
  });

  app.get("/api/admin/users", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (e) {
      console.error("Error fetching all users:", e);
      res
        .status(500)
        .json({ message: "Хэрэглэгчдийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.put(
    "/api/admin/users/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const user = await storage.updateUserProfile(req.params.id, req.body);
        res.json(user);
      } catch (e) {
        console.error("Error updating user:", e);
        res.status(400).json({ message: "Хэрэглэгч засварлахад алдаа гарлаа" });
      }
    },
  );

  app.get("/api/admin/players", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (e) {
      console.error("Error fetching all players:", e);
      res
        .status(500)
        .json({ message: "Тоглогчдын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.put(
    "/api/admin/players/:playerId",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const { rank, points, achievements } = req.body;
        const validRanks = [
          "3-р зэрэг",
          "2-р зэрэг",
          "1-р зэрэг",
          "спортын дэд мастер",
          "спортын мастер",
          "олон улсын хэмжээний мастер",
        ];
        if (rank && !validRanks.includes(rank))
          return res.status(400).json({ message: "Буруу зэрэглэл" });
        if (points !== undefined && (typeof points !== "number" || points < 0))
          return res
            .status(400)
            .json({ message: "Оноо 0-ээс их тоо байх ёстой" });

        const updated = await storage.updatePlayerAdminFields(
          req.params.playerId,
          {
            rank: rank || null,
            points: points || 0,
            achievements: achievements || null,
          },
        );
        if (!updated)
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        res.json(updated);
      } catch (e) {
        console.error("Error updating player:", e);
        res
          .status(500)
          .json({ message: "Тоглогчийн мэдээлэл шинэчлэхэд алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/players/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deletePlayer(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        res.json({ message: "Тоглогч амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting player:", e);
        res.status(400).json({ message: "Тоглогч устгахад алдаа гарлаа" });
      }
    },
  );

  app.get("/api/admin/clubs", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const clubs = await storage.getAllClubs();
      res.json(clubs);
    } catch (e) {
      console.error("Error fetching all clubs:", e);
      res
        .status(500)
        .json({ message: "Клубуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post("/api/admin/clubs", requireAuth, isAdminRole, async (req, res) => {
    try {
      const { coachUserId, coachName, headCoachName, ...clubBody } = req.body as any;
      const clubData = insertClubSchema.parse(clubBody);
      const club = await storage.createClub(clubData);

      // Use headCoachName, coachName, or coachUserId in that order of preference
      const finalCoachName = headCoachName || coachName;
      if (coachUserId || finalCoachName) {
        try {
          const coachData = insertClubCoachSchema.parse({
            clubId: club.id,
            userId: coachUserId || undefined,
            name: coachUserId ? undefined : finalCoachName,
          });
          await storage.createClubCoach(coachData);
          console.log("Coach created successfully:", coachData);
        } catch (coachError) {
          console.error("Error creating coach:", coachError);
          // Don't fail the entire club creation if coach creation fails
        }
      }

      res.json(club);
    } catch (e) {
      console.error("Error creating club:", e);
      res.status(400).json({ message: "Клуб үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put(
    "/api/admin/clubs/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const { coachUserId, coachName, headCoachName, ...clubBody } = req.body as any;
        const club = await storage.updateClub(req.params.id, clubBody);
        if (!club) return res.status(404).json({ message: "Клуб олдсонгүй" });

        // Use headCoachName, coachName, or coachUserId in that order of preference
        const finalCoachName = headCoachName || coachName;
        if (coachUserId || finalCoachName) {
          try {
            // Delete existing coaches first
            const existingCoaches = await storage.getClubCoachesByClub(req.params.id);
            for (const c of existingCoaches) {
              await storage.deleteClubCoach(c.id);
            }

            // Create new coach
            const coachData = insertClubCoachSchema.parse({
              clubId: req.params.id,
              userId: coachUserId || undefined,
              name: coachUserId ? undefined : finalCoachName,
            });
            await storage.createClubCoach(coachData);
            console.log("Coach updated successfully:", coachData);
          } catch (coachError) {
            console.error("Error updating coach:", coachError);
            // Don't fail the entire club update if coach update fails
          }
        } else {
          // If no coach data provided, remove existing coaches
          try {
            const existingCoaches = await storage.getClubCoachesByClub(req.params.id);
            for (const c of existingCoaches) {
              await storage.deleteClubCoach(c.id);
            }
          } catch (coachError) {
            console.error("Error removing coaches:", coachError);
          }
        }

        res.json(club);
      } catch (e) {
        console.error("Error updating club:", e);
        res.status(400).json({ message: "Клуб засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/clubs/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteClub(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Клуб олдсонгүй" });
        res.json({ message: "Клуб амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting club:", e);
        res.status(400).json({ message: "Клуб устгахад алдаа гарлаа" });
      }
    },
  );

  app.get(
    "/api/admin/tournaments",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const tournaments = await storage.getTournaments();
        res.json(tournaments);
      } catch (e) {
        console.error("Error fetching all tournaments:", e);
        res
          .status(500)
          .json({ message: "Тэмцээнүүдийн жагсаалт авахад алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/tournaments/:id",
    requireAuth,
    isAdminRole,
    async (req: any, res) => {
      try {
        const tournamentId = req.params.id;

        // Check if tournament exists first
        const existingTournament = await storage.getTournament(tournamentId);
        if (!existingTournament) {
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        }

        // Parse and validate update data
        const {
          startDate,
          endDate,
          registrationDeadline,
          maxParticipants,
          entryFee,
          ...rest
        } = req.body;

        const updateData = insertTournamentSchema.partial().parse({
          ...rest,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          ...(registrationDeadline
            ? { registrationDeadline: new Date(registrationDeadline) }
            : {}),
          ...(maxParticipants !== undefined
            ? { maxParticipants: parseInt(maxParticipants) }
            : {}),
          ...(entryFee !== undefined ? { entryFee: entryFee.toString() } : {}),
        });

        const tournament = await storage.updateTournament(tournamentId, updateData);
        if (!tournament) {
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        }

        res.json(tournament);
      } catch (e) {
        console.error("Error updating tournament:", e);
        if (e instanceof z.ZodError) {
          return res.status(422).json({
            message: "Мэдээллийн алдаа",
            errors: e.errors
          });
        }
        res.status(400).json({ message: "Тэмцээн шинэчлэхэд алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/tournaments/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteTournament(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        res.json({ message: "Тэмцээн амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting tournament:", e);
        res.status(400).json({ message: "Тэмцээн устгахад алдаа гарлаа" });
      }
    },
  );

  // Sponsors (admin)
  app.get(
    "/api/admin/sponsors",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const sponsors = await storage.getAllSponsors();
        res.json(sponsors);
      } catch (e) {
        console.error("Error fetching sponsors:", e);
        res
          .status(500)
          .json({ message: "Ивээн тэтгэгчид авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/sponsors",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const sponsorData = insertSponsorSchema.parse(req.body);
        const sponsor = await storage.createSponsor(sponsorData);
        res.json(sponsor);
      } catch (e) {
        console.error("Error creating sponsor:", e);
        res
          .status(400)
          .json({ message: "Ивээн тэтгэгч үүсгэхэд алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/sponsors/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const updateData = insertSponsorSchema.partial().parse(req.body);
        const sponsor = await storage.updateSponsor(req.params.id, updateData);
        if (!sponsor)
          return res.status(404).json({ message: "Ивээн тэтгэгч олдсонгүй" });
        res.json(sponsor);
      } catch (e) {
        console.error("Error updating sponsor:", e);
        res
          .status(400)
          .json({ message: "Ивээн тэтгэгч засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/sponsors/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteSponsor(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Ивээн тэтгэгч олдсонгүй" });
        res.json({ message: "Ивээн тэтгэгч амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting sponsor:", e);
        res
          .status(400)
          .json({ message: "Ивээн тэтгэгч устгахад алдаа гарлаа" });
      }
    },
  );

  // Homepage sliders (admin)
  app.get("/api/admin/sliders", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const sliders = await storage.getAllHomepageSliders();
      res.json(sliders);
    } catch (e) {
      console.error("Error fetching all sliders:", e);
      res
        .status(500)
        .json({ message: "Слайдерын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post("/api/admin/sliders", requireAuth, isAdminRole, async (req, res) => {
    try {
      // Allow empty title if not provided, use a default value
      const sliderData = {
        ...req.body,
        title: req.body.title || "Зургийн слайд"
      };
      const validatedData = insertHomepageSliderSchema.parse(sliderData);
      const slider = await storage.createHomepageSlider(validatedData);
      res.json(slider);
    } catch (e) {
      console.error("Error creating slider:", e);
      res.status(400).json({ message: "Слайдер үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put(
    "/api/admin/sliders/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const updateData = insertHomepageSliderSchema.partial().parse(req.body);
        const slider = await storage.updateHomepageSlider(
          req.params.id,
          updateData,
        );
        if (!slider)
          return res.status(404).json({ message: "Слайдер олдсонгүй" });
        res.json(slider);
      } catch (e) {
        console.error("Error updating slider:", e);
        res.status(400).json({ message: "Слайдер засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/sliders/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteHomepageSlider(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Слайдер олдсонгүй" });
        res.json({ message: "Слайдер амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting slider:", e);
        res.status(400).json({ message: "Слайдер устгахад алдаа гарлаа" });
      }
    },
  );

  // Champions (admin)
  app.get(
    "/api/admin/champions",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const champions = await storage.getAllChampions();
        res.json(champions);
      } catch (e) {
        console.error("Error fetching champions:", e);
        res.status(500).json({ message: "Аваргууд авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/champions",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertChampionSchema.parse(req.body);
        const champion = await storage.createChampion(data);
        res.json(champion);
      } catch (e) {
        console.error("Error creating champion:", e);
        res.status(400).json({ message: "Аварга үүсгэхэд алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/champions/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertChampionSchema.partial().parse(req.body);
        const champion = await storage.updateChampion(req.params.id, data);
        if (!champion)
          return res.status(404).json({ message: "Аварга олдсонгүй" });
        res.json(champion);
      } catch (e) {
        console.error("Error updating champion:", e);
        res.status(400).json({ message: "Аварга засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/champions/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteChampion(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Аварга олдсонгүй" });
        res.json({ message: "Аварга амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting champion:", e);
        res.status(400).json({ message: "Аварга устгахад алдаа гарлаа" });
      }
    },
  );

  // Branches (admin)
  app.get(
    "/api/admin/branches",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const branches = await storage.getAllBranches();
        res.json(branches);
      } catch (e) {
        console.error("Error fetching branches:", e);
        res.status(500).json({ message: "Салбар холбоод авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/branches",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertBranchSchema.parse(req.body);
        const branch = await storage.createBranch(data);
        res.status(201).json(branch);
      } catch (e) {
        console.error("Error creating branch:", e);
        if (e instanceof z.ZodError) {
          return res.status(400).json({ message: e.issues.map((i) => i.message).join(", ") });
        }
        res
          .status(500)
          .json({ message: "Салбар холбоо үүсгэхэд алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/branches/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        // Clean and validate the data before updating
        const updateData = {
          name: req.body.name || "",
          leader: req.body.leader || null,
          leadershipMembers: req.body.leadershipMembers || null,
          address: req.body.address || null,
          location: req.body.location || null,
          activities: req.body.activities || null,
          imageUrl: req.body.imageUrl || null,
          coordinates: req.body.coordinates || null
        };

        const branch = await storage.updateBranch(req.params.id, updateData);
        if (!branch)
          return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
        res.json(branch);
      } catch (e) {
        console.error("Error updating branch:", e);
        res
          .status(400)
          .json({ message: "Салбар холбоо засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/branches/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteBranch(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Салбар холбоо олдсонгүй" });
        res.json({ message: "Салбар холбоо амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting branch:", e);
        res
          .status(400)
          .json({ message: "Салбар холбоо устгахад алдаа гарлаа" });
      }
    },
  );

  // Federation Members (admin)
  app.get(
    "/api/admin/federation-members",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const members = await storage.getAllFederationMembers();
        res.json(members);
      } catch (e) {
        console.error("Error fetching federation members:", e);
        res
          .status(500)
          .json({ message: "Холбооны гишүүд авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/federation-members",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertFederationMemberSchema.parse(req.body);
        const member = await storage.createFederationMember(data);
        res.json(member);
      } catch (e) {
        console.error("Error creating federation member:", e);
        res.status(400).json({ message: "Гишүүн нэмэхэд алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/federation-members/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const member = await storage.updateFederationMember(
          req.params.id,
          req.body,
        );
        if (!member)
          return res.status(404).json({ message: "Гишүүн олдсонгүй" });
        res.json(member);
      } catch (e) {
        console.error("Error updating federation member:", e);
        res.status(400).json({ message: "Гишүүн засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/federation-members/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteFederationMember(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Гишүүн олдсонгүй" });
        res.json({ message: "Гишүүн амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting federation member:", e);
        res.status(400).json({ message: "Гишүүн устгахад алдаа гарлаа" });
      }
    },
  );

  // National team (admin)
  app.get(
    "/api/admin/national-team",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const players = await storage.getAllNationalTeamPlayers();
        res.json(players);
      } catch (e) {
        console.error("Error fetching national team players:", e);
        res
          .status(500)
          .json({ message: "Үндэсний шигшээ багийн мэдээлэл авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/national-team",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertNationalTeamPlayerSchema.parse(req.body);
        const player = await storage.createNationalTeamPlayer(data);
        res.json(player);
      } catch (e) {
        console.error("Error creating national team player:", e);
        res.status(400).json({ message: "Тоглогч нэмэхэд алдаа гарлаа" });
      }
    },
  );

  app.put(
    "/api/admin/national-team/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const player = await storage.updateNationalTeamPlayer(
          req.params.id,
          req.body,
        );
        if (!player)
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        res.json(player);
      } catch (e) {
        console.error("Error updating national team player:", e);
        res
          .status(400)
          .json({ message: "Тоглогч засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/national-team/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteNationalTeamPlayer(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Тоглогч олдсонгүй" });
        res.json({ message: "Тоглогч амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting national team player:", e);
        res.status(400).json({ message: "Тоглогч устгахад алдаа гарлаа" });
      }
    },
  );

  // Club coaches (admin)
  app.get(
    "/api/admin/coaches",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const coaches = await storage.getAllClubCoaches();
        res.json(coaches);
      } catch (e) {
        console.error("Error fetching coaches:", e);
        res.status(500).json({ message: "Дасгалжуулагчид авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/coaches",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertClubCoachSchema.parse(req.body);
        const coach = await storage.createClubCoach(data);
        res.json(coach);
      } catch (e) {
        console.error("Error creating coach:", e);
        res.status(400).json({ message: "Дасгалжуулагч нэмэхэд алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/coaches/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteClubCoach(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Дасгалжуулагч олдсонгүй" });
        res.json({ message: "Дасгалжуулагч амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting coach:", e);
        res.status(400).json({ message: "Дасгалжуулагч устгахад алдаа гарлаа" });
      }
    },
  );

  // Judges (admin)
  app.get(
    "/api/admin/judges",
    requireAuth,
    isAdminRole,
    async (_req, res) => {
      try {
        const judges = await storage.getAllJudges();
        res.json(judges);
      } catch (e) {
        console.error("Error fetching judges:", e);
        res.status(500).json({ message: "Шүүгчид авахад алдаа гарлаа" });
      }
    },
  );

  app.post(
    "/api/admin/judges",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data = insertJudgeSchema.parse(req.body);
        const judge = await storage.createJudge(data);
        res.json(judge);
      } catch (e) {
        console.error("Error creating judge:", e);
        res.status(400).json({ message: "Шүүгч нэмэхэд алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/judges/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteJudge(req.params.id);
        if (!success)
          return res.status(404).json({ message: "Шүүгч олдсонгүй" });
        res.json({ message: "Шүүгч амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting judge:", e);
        res.status(400).json({ message: "Шүүгч устгахад алдаа гарлаа" });
      }
    },
  );

  // ----------------
  // Leagues & Teams
  // ----------------
  app.get("/api/leagues", async (_req, res) => {
    try {
      const leagues = await storage.getAllLeagues();
      res.json(leagues);
    } catch (e) {
      console.error("Error fetching leagues:", e);
      res.status(500).json({ message: "Лигийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/leagues/:id", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) return res.status(404).json({ message: "Лиг олдсонгүй" });
      res.json(league);
    } catch (e) {
      console.error("Error fetching league:", e);
      res.status(500).json({ message: "Лигийн мэдээлэл авахад алдаа гарлаа" });
    }
  });

  app.get("/api/leagues/:id/teams", async (req, res) => {
    try {
      const teams = await storage.getLeagueTeams(req.params.id);
      const teamsWithStats = teams.map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        points: 0,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        colorTheme: "var(--success)",
        players: team.players,
      }));
      res.json(teamsWithStats);
    } catch (e) {
      console.error("Error fetching league teams:", e);
      res
        .status(500)
        .json({ message: "Лигийн багуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/leagues/:id/matches", async (req, res) => {
    try {
      const matches = await storage.getLeagueMatches(req.params.id);
      res.json(matches);
    } catch (e) {
      console.error("Error fetching league matches:", e);
      res
        .status(500)
        .json({ message: "Лигийн тоглолтуудын жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.get("/api/admin/leagues", requireAuth, isAdminRole, async (_req, res) => {
    try {
      console.log('[Admin] Getting all leagues...');
      const leagues = await storage.getAllLeagues();
      console.log(`[Admin] Found ${leagues.length} leagues`);

      // Set proper JSON content type
      res.setHeader('Content-Type', 'application/json');
      res.json(leagues);
    } catch (e) {
      console.error("Error fetching admin leagues:", e);
      res.status(500).json({ message: "Лигүүдийг авахад алдаа гарлаа" });
    }
  });

  // League teams management
  app.get("/api/admin/teams", requireAuth, isAdminRole, async (_req, res) => {
    try {
      const teams = await storage.getAllLeagueTeams();
      res.json(teams);
    } catch (e) {
      console.error("Error fetching league teams:", e);
      res.status(500).json({ message: "Багуудыг авахад алдаа гарлаа" });
    }
  });

  app.post("/api/admin/teams", requireAuth, isAdminRole, async (req, res) => {
    try {
      const { name, logoUrl, sponsorLogo, ownerName, coachName, playerIds, leagueId } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Багийн нэр заавал оруулна уу" });
      }

      // Create league team
      const team = await storage.createLeagueTeam({
        leagueId: leagueId || 'default',
        name,
        logoUrl,
        sponsorLogo,
        ownerName,
        coachName
      });

      // Add players to team if provided
      if (playerIds && Array.isArray(playerIds)) {
        for (const playerId of playerIds) {
          // Get player name from users table
          const user = await storage.getUser(playerId);
          const playerName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Player';

          await storage.addPlayerToLeagueTeam(team.id, playerId, playerName);
        }
      }

      res.json(team);
    } catch (e) {
      console.error("Error creating league team:", e);
      res.status(400).json({ message: "Баг үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put("/api/admin/teams/:id", requireAuth, isAdminRole, async (req, res) => {
    try {
      const { name, logoUrl, sponsorLogo, ownerName, coachName } = req.body;

      const team = await storage.updateLeagueTeam(req.params.id, {
        name,
        logoUrl,
        sponsorLogo,
        ownerName,
        coachName
      });

      if (!team) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      res.json(team);
    } catch (e) {
      console.error("Error updating league team:", e);
      res.status(400).json({ message: "Баг засварлахад алдаа гарлаа" });
    }
  });

  app.delete("/api/admin/teams/:id", requireAuth, isAdminRole, async (req, res) => {
    try {
      const success = await storage.deleteLeagueTeam(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      res.json({ message: "Баг амжилттай устгагдлаа" });
    } catch (e) {
      console.error("Error deleting league team:", e);
      res.status(400).json({ message: "Баг устгахад алдаа гарлаа" });
    }
  });

  app.post("/api/admin/leagues/:leagueId/teams", requireAuth, isAdminRole, async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({ message: "Багийн ID заавал оруулна уу" });
      }

      await storage.addTeamToLeague(leagueId, teamId);
      res.json({ message: "Баг лигт амжилттай нэмэгдлээ" });
    } catch (e) {
      console.error("Error adding team to league:", e);
      res.status(400).json({ message: "Баг лигт нэмэхэд алдаа гарлаа" });
    }
  });

  app.post("/api/admin/leagues", requireAuth, isAdminRole, async (req, res) => {
    try {
      const data: any = { ...req.body };
      if (!data.name || !data.name.trim())
        return res
          .status(400)
          .json({ message: "Лигийн нэр заавал оруулна уу" });
      if (data.startDate) data.startDate = new Date(data.startDate);
      else
        return res
          .status(400)
          .json({ message: "Эхлэх огноо заавал оруулна уу" });
      if (data.endDate) data.endDate = new Date(data.endDate);
      else
        return res
          .status(400)
          .json({ message: "Дуусах огноо заавал оруулна уу" });
      if (data.registrationDeadline)
        data.registrationDeadline = new Date(data.registrationDeadline);

      const league = await storage.createLeague(data);
      res.json(league);
    } catch (e) {
      console.error("Error creating league:", e);
      res.status(400).json({ message: "Лиг үүсгэхэд алдаа гарлаа" });
    }
  });

  app.put(
    "/api/admin/leagues/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const data: any = { ...req.body };
        if (typeof data.startDate === "string" && data.startDate.trim())
          data.startDate = new Date(data.startDate);
        else if (data.startDate === "") delete data.startDate;
        if (typeof data.endDate === "string" && data.endDate.trim())
          data.endDate = new Date(data.endDate);
        else if (data.endDate === "") delete data.endDate;
        if (
          typeof data.registrationDeadline === "string" &&
          data.registrationDeadline.trim()
        )
          data.registrationDeadline = new Date(data.registrationDeadline);
        else if (data.registrationDeadline === "")
          delete data.registrationDeadline;

        const league = await storage.updateLeague(req.params.id, data);
        if (!league) return res.status(404).json({ message: "Лиг олдсонгүй" });
        res.json(league);
      } catch (e) {
        console.error("Error updating league:", e);
        res.status(400).json({ message: "Лиг засварлахад алдаа гарлаа" });
      }
    },
  );

  app.delete(
    "/api/admin/leagues/:id",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const success = await storage.deleteLeague(req.params.id);
        if (!success) return res.status(404).json({ message: "Лиг олдсонгүй" });
        res.json({ message: "Лиг амжилттай устгагдлаа" });
      } catch (e) {
        console.error("Error deleting league:", e);
        res.status(400).json({ message: "Лиг устгахад алдаа гарлаа" });
      }
    },
  );

  // league team & player matches, etc. (as in your original) ...

  // --------------
  // Tournament Results (admin)
  // --------------
  app.get('/api/tournaments/:id/results', async (req, res) => {
    try {
      const results = await storage.getTournamentResults(req.params.id);
      console.log(`Tournament ${req.params.id} results:`, JSON.stringify(results, null, 2));
      res.json(results);
    } catch (e) {
      console.error("Error fetching tournament results:", e);
      res
        .status(500)
        .json({ message: "Тэмцээний үр дүн авахад алдаа гарлаа" });
    }
  });

  // Save tournament results
  app.post(
    "/api/admin/tournament-results",
    requireAuth,
    isAdminRole,
    async (req, res) => {
      try {
        const {
          tournamentId,
          groupStageResults,
          knockoutResults,
          finalRankings,
          isPublished,
          entityType
        } = req.body;

        console.log('[Admin] Saving tournament results for tournament:', tournamentId);
        console.log('[Admin] Results data:', { groupStageResults, knockoutResults, finalRankings, isPublished });

        // Validate required fields
        if (!tournamentId) {
          return res.status(400).json({ message: "tournamentId шаардлагатай" });
        }

        // Check if tournament exists
        const tournament = await storage.getTournament(tournamentId);
        if (!tournament) {
          return res.status(404).json({ message: "Тэмцээн олдсонгүй" });
        }

        // Save or update tournament results
        const results = await storage.upsertTournamentResults({
          tournamentId,
          groupStageResults: groupStageResults || null,
          knockoutResults: knockoutResults || null,
          finalRankings: finalRankings || null,
          isPublished: isPublished !== undefined ? isPublished : false,
        });

        console.log('[Admin] Tournament results saved successfully:', results);

        // Invalidate cache
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.json({
          message: "Тэмцээний үр дүн амжилттай хадгалагдлаа",
          results,
        });
      } catch (error: any) {
        console.error("[Admin] Error saving tournament results:", error);
        res.status(500).json({
          message: "Тэмцээний үр дүн хадгалахад алдаа гарлаа",
          error: error.message,
        });
      }
    }
  );


  // --------------
  // Avatars
  // --------------
  app.get("/api/users/:userId/avatar", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user || !user.profileImageUrl)
        return res.status(404).json({ error: "Profile image not found" });

      if (user.profileImageUrl.startsWith("data:image/")) {
        const base64Data = user.profileImageUrl.split(",")[1];
        const mimeType = user.profileImageUrl.split(";")[0].split(":")[1];
        const buffer = Buffer.from(base64Data, "base64");
        res.set({
          "Content-Type": mimeType,
          "Content-Length": buffer.length,
          "Cache-Control": "public, max-age=3600",
        });
        return res.send(buffer);
      }

      res.redirect(user.profileImageUrl);
    } catch (e) {
      console.error("Error serving avatar:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tournament teams endpoints (missing endpoints that frontend is calling)
  app.post("/api/tournaments/:id/teams", requireAuth, async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      const teamData = req.body;

      // Create tournament team using the existing storage method
      const team = await storage.createLeagueTeam({
        tournamentId: tournamentId,
        name: teamData.name,
        logoUrl: teamData.logoUrl,
        sponsorLogo: teamData.sponsorLogo,
        ownerName: teamData.ownerName,
        coachName: teamData.coachName,
      });

      res.json(team);
    } catch (e) {
      console.error("Error creating tournament team:", e);
      res.status(400).json({ message: "Баг үүсгэхэд алдаа гарлаа" });
    }
  });

  app.get("/api/tournaments/:id/teams", async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      const teams = await storage.getLeagueTeams(tournamentId);
      res.json(teams);
    } catch (e) {
      console.error("Error fetching tournament teams:", e);
      res.status(400).json({ message: "Багийн жагсаалт авахад алдаа гарлаа" });
    }
  });

  app.post("/api/tournament-teams/:teamId/players", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { playerId, playerName } = req.body;

      if (!playerId || !playerName) {
        return res.status(400).json({ message: "Тоглогчийн ID болон нэр заавал оруулна уу" });
      }

      const player = await storage.addPlayerToLeagueTeam(teamId, playerId, playerName);
      res.json(player);
    } catch (e) {
      console.error("Error adding player to tournament team:", e);
      res.status(400).json({ message: "Тоглогч багт нэмэхэд алдаа гарлаа" });
    }
  });

  app.delete("/api/tournament-teams/:teamId", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const success = await storage.deleteLeagueTeam(teamId);

      if (!success) {
        return res.status(404).json({ message: "Баг олдсонгүй" });
      }

      res.json({ message: "Баг амжилттай устгагдлаа" });
    } catch (e) {
      console.error("Error deleting tournament team:", e);
      res.status(400).json({ message: "Баг устгахад алдаа гарлаа" });
    }
  });

  // ----------
  // Server up
  // ----------
  const httpServer = createServer(app);
  return httpServer;
}