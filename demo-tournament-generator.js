#!/usr/bin/env tsx

import { storage } from "./server/storage";
import { db } from "./server/db";
import {
  tournaments,
  tournamentParticipants,
  tournamentResults,
} from "./shared/schema";

async function createDemoTournament() {
  console.log("🚀 Creating demo tournament with comprehensive data...");

  try {
    // 1. Get admin user
    console.log("📋 Finding admin user...");
    const allUsers = await storage.getAllUsers();
    const adminUser = allUsers.find(u => u.role === "admin");
    if (!adminUser) {
      throw new Error("No admin user found");
    }
    console.log(`✅ Found admin user: ${adminUser.firstName} ${adminUser.lastName}`);

    // 2. Get all players for participants
    console.log("👥 Getting existing players...");
    const allPlayers = await storage.getAllPlayers();
    console.log(`✅ Found ${allPlayers.length} players in database`);

    if (allPlayers.length < 32) {
      throw new Error("Need at least 32 players for the demo tournament. Found only " + allPlayers.length);
    }

    // Get player details with user info using direct queries
    const playersWithUsersQuery = await db.query.players.findMany({
      with: {
        user: true
      }
    });
    
    const playersWithUsers = playersWithUsersQuery.filter(p => p.user && p.user.gender);

    console.log(`✅ Found ${playersWithUsers.length} players with user data`);

    // 3. Create demo tournament
    console.log("🏆 Creating demo tournament...");
    const tournamentData = {
      name: "2025 Монголын Ширээний Теннисний Их Тэмцээн",
      description: "Энэ жилийн хамгийн том тэмцээн - эр хүмүүсийн хувь хүн болон багийн ангилал",
      richDescription: "Монголын Ширээний Теннисний Холбооноос зохион байгуулж байгаа 2025 оны хамгийн том тэмцээн. Эр хүмүүсийн хувь хүн болон багийн тэмцээн зэрэг олон ангилалтай.",
      startDate: new Date("2025-03-15T09:00:00Z"),
      endDate: new Date("2025-03-17T18:00:00Z"),
      registrationDeadline: new Date("2025-03-10T23:59:59Z"),
      location: "Улаанбаатар хотын Спортын ордон",
      organizer: "Монголын Ширээний Теннисний Холбоо",
      maxParticipants: 50,
      entryFee: "25000",
      status: "completed",
      participationTypes: ["эрэгтэй хувь хүн", "эрэгтэй баг"],
      rules: "ITTF дүрэм журмын дагуу",
      prizes: "1-р байр: 1,000,000₮, 2-р байр: 500,000₮, 3-р байр: 300,000₮",
      contactInfo: "Утас: +976-11-123456, И-мэйл: info@mtta.mn",
      requirements: JSON.stringify({ gender: "male", minAge: 16 }),
      isPublished: true,
      organizerId: adminUser.id
    };

    const tournament = await storage.createTournament(tournamentData);
    console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})`);

    // 4. Select players for Men's Singles (24 players)
    const malePlayers = playersWithUsers.filter(p => p.user.gender === "male");
    console.log(`🔍 Found ${malePlayers.length} male players available`);
    
    // Use available male players, repeat if needed to get 24 for singles
    const singlesPlayers = [];
    for (let i = 0; i < 24; i++) {
      if (malePlayers.length > 0) {
        singlesPlayers.push(malePlayers[i % malePlayers.length]);
      }
    }

    console.log(`👤 Selected ${singlesPlayers.length} players for Men's Singles`);

    // Register singles players
    for (const player of singlesPlayers) {
      await storage.registerForTournament({
        tournamentId: tournament.id,
        playerId: player.id,
        participationType: "эрэгтэй хувь хүн"
      });
    }

    // 5. Select players for Men's Team (32 players for 8 teams of 4)
    const teamPlayers = [];
    for (let i = 0; i < 32; i++) {
      if (malePlayers.length > 0) {
        teamPlayers.push(malePlayers[i % malePlayers.length]);
      }
    }

    console.log(`👥 Selected ${teamPlayers.length} players for Men's Team (8 teams of 4)`);

    // Register team players  
    for (const player of teamPlayers) {
      await storage.registerForTournament({
        tournamentId: tournament.id,
        playerId: player.id,
        participationType: "эрэгтэй баг"
      });
    }

    // 6. Generate Men's Singles Group Stage Results (12 groups of 2)
    console.log("🎯 Generating Men's Singles group stage results...");
    const singlesGroupStageResults = [];

    for (let groupIndex = 0; groupIndex < 12; groupIndex++) {
      const groupPlayers = singlesPlayers.slice(groupIndex * 2, (groupIndex + 1) * 2);
      
      const group = {
        groupName: `Бүлэг ${String.fromCharCode(65 + groupIndex)}`, // A, B, C, etc.
        players: groupPlayers.map(p => ({
          id: p.id,
          playerId: p.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          club: p.user.clubAffiliation || "Клуб байхгүй",
          wins: "",
          position: ""
        })),
        resultMatrix: [["", ""], ["", ""]],
        standings: []
      };

      // Generate match results for 2 players (only one match needed)
      const player1Score = Math.random() > 0.5 ? 3 : Math.floor(Math.random() * 3);
      const player2Score = player1Score === 3 ? Math.floor(Math.random() * 3) : 3;
      
      group.resultMatrix[0][1] = `${player1Score}-${player2Score}`;
      group.resultMatrix[1][0] = `${player2Score}-${player1Score}`;

      // Calculate standings
      const standings = group.players.map((player, index) => {
        const wins = index === 0 ? (player1Score > player2Score ? 1 : 0) : (player2Score > player1Score ? 1 : 0);
        const losses = 1 - wins;
        
        return {
          position: wins > losses ? 1 : 2,
          playerId: player.id,
          playerName: player.name,
          club: player.club,
          wins,
          losses,
          totalMatches: 1,
          points: wins * 2
        };
      });

      // Sort by wins (winner first)
      standings.sort((a, b) => b.wins - a.wins);
      standings.forEach((standing, idx) => {
        standing.position = idx + 1;
      });

      group.standings = standings;

      // Update player positions in the group
      group.players[0].position = standings.find(s => s.playerId === group.players[0].id)?.position.toString() || "1";
      group.players[1].position = standings.find(s => s.playerId === group.players[1].id)?.position.toString() || "2";

      singlesGroupStageResults.push(group);
    }

    console.log(`✅ Generated ${singlesGroupStageResults.length} groups for Men's Singles`);

    // 7. Generate Men's Team Group Stage Results (2 groups of 4 teams)
    console.log("👥 Generating Men's Team group stage results...");
    const teamGroupStageResults = [];

    // Create 8 teams from 32 players (4 players per team)
    const teams = [];
    for (let teamIndex = 0; teamIndex < 8; teamIndex++) {
      const currentTeamPlayers = teamPlayers.slice(teamIndex * 4, (teamIndex + 1) * 4);
      teams.push({
        id: `team-${teamIndex + 1}`,
        name: `Баг ${teamIndex + 1}`,
        players: currentTeamPlayers
      });
    }

    // Create 2 groups of 4 teams each
    for (let groupIndex = 0; groupIndex < 2; groupIndex++) {
      const groupTeams = teams.slice(groupIndex * 4, (groupIndex + 1) * 4);
      
      const group = {
        groupName: `Бүлэг ${groupIndex + 1}`,
        players: groupTeams.map(team => ({
          id: team.id,
          playerId: team.id,
          name: team.name,
          club: "Багийн тэмцээн",
          wins: "",
          position: ""
        })),
        resultMatrix: [
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""]
        ],
        standings: []
      };

      // Generate round-robin results for 4 teams
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          // Generate random team match result (best of 5 matches format)
          const team1Wins = Math.floor(Math.random() * 4) + 1; // 1-4 matches won
          const team2Wins = 5 - team1Wins; // Remaining matches
          
          const result = team1Wins > team2Wins ? `${team1Wins}-${team2Wins}` : `${team1Wins}-${team2Wins}`;
          
          group.resultMatrix[i][j] = result;
          group.resultMatrix[j][i] = `${team2Wins}-${team1Wins}`;
        }
      }

      // Calculate team standings
      const standings = group.players.map((team, index) => {
        let wins = 0;
        let losses = 0;
        
        for (let j = 0; j < 4; j++) {
          if (index !== j && group.resultMatrix[index][j]) {
            const [teamScore, opponentScore] = group.resultMatrix[index][j].split('-').map(Number);
            if (teamScore > opponentScore) {
              wins++;
            } else {
              losses++;
            }
          }
        }
        
        return {
          position: 0,
          playerId: team.id,
          playerName: team.name,
          club: team.club,
          wins,
          losses,
          totalMatches: wins + losses,
          points: wins * 2
        };
      });

      // Sort by wins, then by total matches
      standings.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalMatches - a.totalMatches;
      });

      // Assign positions
      standings.forEach((standing, idx) => {
        standing.position = idx + 1;
      });

      group.standings = standings;

      // Update team positions in the group
      group.players.forEach(team => {
        team.position = standings.find(s => s.playerId === team.id)?.position.toString() || "1";
      });

      teamGroupStageResults.push(group);
    }

    console.log(`✅ Generated ${teamGroupStageResults.length} groups for Men's Team`);

    // 8. Save results to database
    console.log("💾 Saving tournament results to database...");
    
    const resultsData = {
      tournamentId: tournament.id,
      groupStageResults: {
        "эрэгтэй хувь хүн": singlesGroupStageResults,
        "эрэгтэй баг": teamGroupStageResults
      },
      knockoutResults: {
        "эрэгтэй хувь хүн": [],
        "эрэгтэй баг": []
      },
      finalRankings: {
        "эрэгтэй хувь хүн": [],
        "эрэгтэй баг": []
      },
      isPublished: true
    };

    await storage.upsertTournamentResults(resultsData);

    console.log("🎉 Demo tournament created successfully!");
    console.log(`📊 Tournament Summary:`);
    console.log(`   - Tournament: ${tournament.name}`);
    console.log(`   - Men's Singles: ${singlesPlayers.length} players in ${singlesGroupStageResults.length} groups`);
    console.log(`   - Men's Team: ${teamPlayers.length} players in 8 teams across ${teamGroupStageResults.length} groups`);
    console.log(`   - All group stage results generated with random match outcomes`);
    console.log(`   - Tournament ID: ${tournament.id}`);

    return tournament;

  } catch (error) {
    console.error("❌ Error creating demo tournament:", error);
    throw error;
  }
}

// Run the script
createDemoTournament()
  .then(() => {
    console.log("✅ Demo tournament generation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Demo tournament generation failed:", error);
    process.exit(1);
  });