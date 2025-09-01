
const { db } = require('./server/db.ts');
const { users, players, tournaments, tournamentParticipants, tournamentResults } = require('./shared/schema.ts');
const { demoTournament, demoParticipants, demoUsers, demoPlayers, demoTournamentResults } = require('./demo-tournament-seed.js');

async function seedDemoTournament() {
  try {
    console.log('Demo тэмцээн үүсгэж байна...');

    // Insert demo users
    console.log('Demo хэрэглэгчид үүсгэж байна...');
    for (const user of demoUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Insert demo players  
    console.log('Demo тоглогчид үүсгэж байна...');
    for (const player of demoPlayers) {
      await db.insert(players).values(player).onConflictDoNothing();
    }

    // Insert demo tournament
    console.log('Demo тэмцээн үүсгэж байна...');
    await db.insert(tournaments).values(demoTournament).onConflictDoNothing();

    // Insert demo participants
    console.log('Demo оролцогчид бүртгэж байна...');
    for (const participant of demoParticipants) {
      await db.insert(tournamentParticipants).values(participant).onConflictDoNothing();
    }

    // Insert demo tournament results
    console.log('Demo тэмцээний үр дүн оруулж байна...');
    await db.insert(tournamentResults).values(demoTournamentResults).onConflictDoNothing();

    console.log('✅ Demo тэмцээн амжилттай үүсгэгдлээ!');
    console.log('Тэмцээний нэр:', demoTournament.name);
    console.log('Тэмцээний ID:', demoTournament.id);
    console.log('Оролцогчдын тоо:', demoParticipants.length);
    console.log('');
    console.log('🌐 Та дараах холбоосоор тэмцээнийг үзэж болно:');
    console.log(`/tournaments/${demoTournament.id}`);
    console.log(`/tournaments/${demoTournament.id}/results`);

  } catch (error) {
    console.error('❌ Demo тэмцээн үүсгэхэд алдаа гарлаа:', error);
  }
}

// Run the seeding function
seedDemoTournament();
