
const { db } = require('./server/db.js');
const { users, players, tournaments, tournamentParticipants, tournamentResults } = require('./shared/schema.js');
const { eq, like } = require('drizzle-orm');

async function deleteGalmandakhTournament() {
  try {
    console.log('🗑️ Deleting Galmandakh Burmaa tournament and demo data...');

    // Find all tournaments with "Galmandakh Burmaa" in the name
    const galmandakhTournaments = await db.select().from(tournaments).where(
      like(tournaments.name, '%Galmandakh Burmaa%')
    );

    console.log(`Found ${galmandakhTournaments.length} tournament(s) with "Galmandakh Burmaa" in the name`);

    for (const tournament of galmandakhTournaments) {
      console.log(`\n📋 Processing tournament: ${tournament.name} (ID: ${tournament.id})`);

      // Delete tournament results
      const deletedResults = await db.delete(tournamentResults).where(
        eq(tournamentResults.tournamentId, tournament.id)
      );
      console.log(`  ✅ Deleted tournament results`);

      // Get and delete tournament participants
      const participants = await db.select().from(tournamentParticipants).where(
        eq(tournamentParticipants.tournamentId, tournament.id)
      );
      console.log(`  📊 Found ${participants.length} participants`);

      if (participants.length > 0) {
        await db.delete(tournamentParticipants).where(
          eq(tournamentParticipants.tournamentId, tournament.id)
        );
        console.log(`  ✅ Deleted ${participants.length} tournament participants`);

        // Get participant player IDs to delete demo players
        const playerIds = participants.map(p => p.playerId).filter(Boolean);
        console.log(`  👥 Found ${playerIds.length} player IDs to check`);

        // Delete demo players and their associated users
        for (const playerId of playerIds) {
          try {
            // Get player to find associated user
            const player = await db.select().from(players).where(eq(players.id, playerId));
            if (player.length > 0) {
              const userId = player[0].userId;
              
              // Delete player
              await db.delete(players).where(eq(players.id, playerId));
              console.log(`    ✅ Deleted player: ${playerId}`);

              // Delete associated user if it exists
              if (userId) {
                const user = await db.select().from(users).where(eq(users.id, userId));
                if (user.length > 0) {
                  await db.delete(users).where(eq(users.id, userId));
                  console.log(`    ✅ Deleted user: ${userId} (${user[0].firstName} ${user[0].lastName})`);
                }
              }
            }
          } catch (error) {
            console.log(`    ⚠️ Could not delete player ${playerId}: ${error.message}`);
          }
        }
      }

      // Delete the tournament itself
      await db.delete(tournaments).where(eq(tournaments.id, tournament.id));
      console.log(`  ✅ Deleted tournament: ${tournament.name}`);
    }

    // Also clean up any orphaned demo users that might have been created by the seed script
    console.log('\n🧹 Cleaning up potential demo users...');
    
    // Find users with demo-like emails or phone numbers
    const demoUsers = await db.select().from(users).where(
      like(users.email, '%demo.mn%')
    );
    
    console.log(`Found ${demoUsers.length} demo users to clean up`);
    
    for (const user of demoUsers) {
      try {
        // First delete any associated players
        await db.delete(players).where(eq(players.userId, user.id));
        
        // Then delete the user
        await db.delete(users).where(eq(users.id, user.id));
        console.log(`  ✅ Cleaned up demo user: ${user.firstName} ${user.lastName} (${user.email})`);
      } catch (error) {
        console.log(`  ⚠️ Could not clean up user ${user.id}: ${error.message}`);
      }
    }

    console.log('\n✨ Successfully deleted Galmandakh Burmaa tournament and demo data!');
    console.log('📊 The tournament results page will now show real athletes only.');
    
    // Show remaining tournament count
    const remainingTournaments = await db.select().from(tournaments);
    console.log(`📈 Remaining tournaments in database: ${remainingTournaments.length}`);
    
  } catch (error) {
    console.error('❌ Error deleting tournament data:', error);
    throw error;
  }
}

// Run the deletion
deleteGalmandakhTournament()
  .then(() => {
    console.log('\n🎉 Deletion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deletion failed:', error);
    process.exit(1);
  });
