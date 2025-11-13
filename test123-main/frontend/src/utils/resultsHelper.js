// Helper functions for computing tournament results

/**
 * Compute group standings for a specific group
 */
export function computeGroupStandings(group, matches, playersById) {
  const standings = {};

  // Initialize standings for all participants
  group.participantIds.forEach(playerId => {
    const player = playersById[playerId];
    standings[playerId] = {
      playerId,
      playerName: player ? player.name : 'Unknown',
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
    };
  });

  // Process all matches for this group
  const groupMatches = matches.filter(m => m.groupId === group.id && m.finished);
  groupMatches.forEach(match => {
    if (match.homeId && match.awayId && standings[match.homeId] && standings[match.awayId]) {
      standings[match.homeId].played++;
      standings[match.awayId].played++;

      if ((match.homeScore ?? 0) > (match.awayScore ?? 0)) {
        standings[match.homeId].won++;
        standings[match.homeId].points += 3;
        standings[match.awayId].lost++;
      } else {
        standings[match.awayId].won++;
        standings[match.awayId].points += 3;
        standings[match.homeId].lost++;
      }
    }
  });

  // Sort by points descending, then by wins
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.won - a.won;
  });
}

/**
 * Compute medalists for a division based on playoff results
 */
export function computeMedalistsForDivision(division, matches, playersById, playoffConfig) {
  const playoffMatches = matches.filter(
    m => m.stage === 'PLAYOFF' && m.divisionId === division.id && m.finished
  );

  // Find Final match
  const finalMatch = playoffMatches.find(m => m.roundName === 'Final');
  if (!finalMatch) {
    return { gold: null, silver: null, bronze: [] };
  }

  const finalHomeScore = finalMatch.homeScore ?? 0;
  const finalAwayScore = finalMatch.awayScore ?? 0;
  const finalWinnerId = finalHomeScore > finalAwayScore ? finalMatch.homeId : finalMatch.awayId;
  const finalLoserId = finalHomeScore > finalAwayScore ? finalMatch.awayId : finalMatch.homeId;

  const gold = finalWinnerId ? playersById[finalWinnerId] : null;
  const silver = finalLoserId ? playersById[finalLoserId] : null;

  // Determine bronze medal(s)
  const bronze = [];
  
  if (playoffConfig?.hasBronzeMatch) {
    // Case A: There is a bronze match - only 1 bronze medalist
    const bronzeMatch = playoffMatches.find(m => m.roundName === 'Bronze');
    if (bronzeMatch) {
      const bronzeHomeScore = bronzeMatch.homeScore ?? 0;
      const bronzeAwayScore = bronzeMatch.awayScore ?? 0;
      const bronzeWinnerId = bronzeHomeScore > bronzeAwayScore ? bronzeMatch.homeId : bronzeMatch.awayId;
      if (bronzeWinnerId && playersById[bronzeWinnerId]) {
        bronze.push(playersById[bronzeWinnerId]);
      }
    }
  } else {
    // Case B: No bronze match - both semifinal losers get bronze (2 bronzes)
    const semiMatches = playoffMatches.filter(m => m.roundName === 'Semifinal');
    semiMatches.forEach(semi => {
      const semiHomeScore = semi.homeScore ?? 0;
      const semiAwayScore = semi.awayScore ?? 0;
      const semiLoserId = semiHomeScore > semiAwayScore ? semi.awayId : semi.homeId;
      if (semiLoserId && playersById[semiLoserId]) {
        bronze.push(playersById[semiLoserId]);
      }
    });
  }

  return { gold, silver, bronze };
}

/**
 * Compute full final placements for a division
 */
export function computeFinalPlacements(division, matches, groups, playersById, playoffConfig) {
  const placements = [];
  const medalists = computeMedalistsForDivision(division, matches, playersById, playoffConfig);

  // Add gold medalist
  if (medalists.gold) {
    placements.push({
      position: 1,
      player: medalists.gold,
      description: 'Алтан медаль',
    });
  }

  // Add silver medalist
  if (medalists.silver) {
    placements.push({
      position: 2,
      player: medalists.silver,
      description: 'Мөнгөн медаль',
    });
  }

  // Add bronze medalist(s)
  if (medalists.bronze.length === 1) {
    placements.push({
      position: 3,
      player: medalists.bronze[0],
      description: 'Хүрэл медаль',
    });
  } else if (medalists.bronze.length === 2) {
    placements.push({
      position: 3,
      player: medalists.bronze[0],
      description: 'Хүрэл медаль',
    });
    placements.push({
      position: 3,
      player: medalists.bronze[1],
      description: 'Хүрэл медаль',
    });
  }

  // Add remaining players based on playoff performance
  const playoffMatches = matches.filter(
    m => m.stage === 'PLAYOFF' && m.divisionId === division.id && m.finished
  );

  // Get all playoff participant IDs
  const playoffParticipants = new Set();
  playoffMatches.forEach(m => {
    if (m.homeId && m.homeId !== '') playoffParticipants.add(m.homeId);
    if (m.awayId && m.awayId !== '') playoffParticipants.add(m.awayId);
  });

  // Remove medalists from playoff participants
  const medallistIds = new Set();
  if (medalists.gold) medallistIds.add(medalists.gold.id);
  if (medalists.silver) medallistIds.add(medalists.silver.id);
  medalists.bronze.forEach(b => medallistIds.add(b.id));

  // Determine positions for non-medalists
  const remainingPlayers = [];
  
  // Semifinal losers who didn't get bronze (if bronze match exists)
  if (playoffConfig?.hasBronzeMatch) {
    const semiMatches = playoffMatches.filter(m => m.roundName === 'Semifinal');
    semiMatches.forEach(semi => {
      const semiHomeScore = semi.homeScore ?? 0;
      const semiAwayScore = semi.awayScore ?? 0;
      const semiLoserId = semiHomeScore > semiAwayScore ? semi.awayId : semi.homeId;
      if (semiLoserId && !medallistIds.has(semiLoserId) && playersById[semiLoserId]) {
        remainingPlayers.push({
          player: playersById[semiLoserId],
          description: 'Шөвгийн 4',
        });
      }
    });
  }

  // Quarterfinal losers
  const quarterMatches = playoffMatches.filter(m => m.roundName === 'Quarterfinal');
  quarterMatches.forEach(quarter => {
    const quarterHomeScore = quarter.homeScore ?? 0;
    const quarterAwayScore = quarter.awayScore ?? 0;
    const quarterLoserId = quarterHomeScore > quarterAwayScore ? quarter.awayId : quarter.homeId;
    if (quarterLoserId && !medallistIds.has(quarterLoserId) && playersById[quarterLoserId]) {
      remainingPlayers.push({
        player: playersById[quarterLoserId],
        description: 'Шөвгийн 8',
      });
    }
  });

  // Add remaining players with appropriate positions
  let currentPosition = placements.length > 0 ? placements[placements.length - 1].position + 1 : 4;
  remainingPlayers.forEach(rp => {
    placements.push({
      position: currentPosition++,
      player: rp.player,
      description: rp.description,
    });
  });

  return placements;
}
