import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { Trash2, Save, RotateCcw, Trophy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  round: number;
  roundName: string;
  player1?: Player;
  player2?: Player;
  player1Score?: string;
  player2Score?: string;
  winner?: Player;
  position: { x: number; y: number };
  nextMatchId?: string;
}

interface BracketEditorProps {
  initialMatches?: Match[];
  users: any[];
  onSave: (matches: Match[]) => void;
  qualifiedPlayers?: { id: string; name: string; groupName: string; position: number }[];
  /**
   * Currently selected match ID for highlighting from parent components.
   */
  selectedMatchId?: string;
  /**
   * Callback invoked when a match card in the editor is clicked.
   * Can be used by parent components to sync selection with other views.
   */
  onMatchSelect?: (matchId: string) => void;
}

const isPowerOfTwo = (n: number): boolean => {
  return n > 0 && (n & (n - 1)) === 0;
};

export const KnockoutBracketEditor: React.FC<BracketEditorProps> = ({
  initialMatches = [],
  users,
  onSave,
  qualifiedPlayers = [],
  selectedMatchId,
  onMatchSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const { toast } = useToast();
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<Match | null>(null);
  const [selectedPlayerPosition, setSelectedPlayerPosition] = useState<'player1' | 'player2'>('player1');


  const WIN_TARGET = 3; // Points needed to win

  // Update matches when initialMatches changes
  useEffect(() => {
    if (initialMatches && initialMatches.length > 0) {
      setMatches(initialMatches);
    }
  }, [initialMatches]);

  const handlePlayerSelect = (matchId: string, position: 'player1' | 'player2') => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatchForEdit(match);
      setSelectedPlayerPosition(position);
      setShowPlayerSelector(true);
    }
  };

  const createByePlayer = () => ({ id: 'bye', name: 'BYE' });

  const setPlayerInMatch = (match: Match, position: 'player1' | 'player2', player: Player) => {
    setMatches(prev => {
      const updatedMatches = prev.map(m => {
        if (m.id === match.id) {
          return { ...m, [position]: player, winner: undefined };
        }
        return m;
      });
      const updatedMatch = updatedMatches.find(m => m.id === match.id)!;
      return propagateResult(autoResolveByes(updatedMatches), updatedMatch);
    });
    setShowPlayerSelector(false);
    setSelectedMatchForEdit(null);
  };

  // Generate bye matches for uneven player counts
  const generateByeMatches = useCallback((playerCount: number) => {
    if (playerCount < 4) {
      return [];
    }

    const powerOf2 = Math.pow(2, Math.ceil(Math.log2(playerCount)));
    const byeCount = powerOf2 - playerCount;
    const newMatches: Match[] = [];

    console.log(`Generating bracket for ${playerCount} players. Need ${byeCount} byes for power of 2: ${powerOf2}`);

    // Calculate the number of rounds needed
    const rounds = Math.ceil(Math.log2(powerOf2));
    const ROUND_WIDTH = 350;
    const START_Y = 80;

    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundName = getRoundName(matchesInRound);

      console.log(`Round ${round}: ${matchesInRound} matches, called "${roundName}"`);

      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const verticalSpacing = Math.pow(2, round) * 120;
        const centerOffset = (matchesInRound - 1) * verticalSpacing / 2;
        const yPosition = START_Y + (matchIndex * verticalSpacing) - centerOffset + (round * 50);

        const match: Match = {
          id: `match_${round}_${matchIndex}`,
          round,
          roundName,
          position: {
            x: 50 + (round - 1) * ROUND_WIDTH,
            y: Math.max(yPosition, 60)
          }
        };

        // Set next match connection
        if (round < rounds) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          match.nextMatchId = `match_${round + 1}_${nextMatchIndex}`;
        }

        // For first round, add bye logic
        if (round === 1 && matchIndex < byeCount) {
          match.player2 = { id: 'bye', name: 'BYE' };
        }

        newMatches.push(match);
      }
    }

    // Add 3rd place playoff match
    if (rounds >= 2) {
      const thirdPlaceMatch: Match = {
        id: 'third_place_playoff',
        round: rounds,
        roundName: '3-р байрын тоглолт',
        position: {
          x: 200 + (rounds - 2) * ROUND_WIDTH / 2,
          y: START_Y + 450
        }
      };
      newMatches.push(thirdPlaceMatch);
    }

    return newMatches.sort((a, b) => a.round - b.round || a.position!.y - b.position!.y);
  }, []);

  // Generate bracket structure (used by createEmptyBracket)
  const generateEmptyBracket = useCallback((playerCount: number): Match[] => {
    // Create a fixed number of rounds for an empty bracket, e.g., 16 players (4 rounds)
    const rounds = Math.ceil(Math.log2(playerCount));
    const ROUND_WIDTH = 350;
    const START_Y = 80;
    const matches: Match[] = [];

    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundName = getRoundName(matchesInRound);

      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const verticalSpacing = Math.pow(2, round) * 120;
        const centerOffset = (matchesInRound - 1) * verticalSpacing / 2;
        const yPosition = START_Y + (matchIndex * verticalSpacing) - centerOffset + (round * 50);

        const match: Match = {
          id: `match_${round}_${matchIndex}`,
          round,
          roundName,
          position: {
            x: 50 + (round - 1) * ROUND_WIDTH,
            y: Math.max(yPosition, 60)
          }
        };

        // Set next match connection
        if (round < rounds) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          match.nextMatchId = `match_${round + 1}_${nextMatchIndex}`;
        }

        matches.push(match);
      }
    }
    return matches;
  }, []);

  // Generate tournament bracket structure
  const generateBracket = useCallback((playerCount: number): Match[] => {
    // Always use bye matches for proper bracket generation
    return generateByeMatches(playerCount);
  }, [generateByeMatches]);

  const getRoundName = (matchCount: number): string => {
    switch (matchCount) {
      case 1: return 'Финал';
      case 2: return 'Хагас финал';
      case 4: return 'Дөрөвний финал';
      case 8: return '1/8 финал';
      case 16: return '1/16 финал';
      case 32: return '1/32 финал';
      case 64: return '1/64 финал';
      default: 
        if (matchCount > 1) {
          return `1/${matchCount * 2} финал`;
        }
        return `${matchCount} тоглолт`;
    }
  };

  // Create empty bracket structure
  const createEmptyBracket = useCallback(() => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    // Use generateEmptyBracket instead of generateBracket to get truly empty matches
    const bracket = generateEmptyBracket(qualifiedPlayers.length);
    setMatches(bracket);
    toast({
      title: "Хоосон шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн хоосон шигшээ тоглолт үүсгэгдлээ`
    });
  }, [qualifiedPlayers, generateEmptyBracket, toast]);

  // Generate bracket with automatic seeding
  const generateBracketBySeed = useCallback(() => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    // Sort qualified players by seed
    const sortedBySeeed = [...qualifiedPlayers].sort((a, b) => (a.seed || a.position) - (b.seed || b.position));
    
    const bracket = generateBracket(qualifiedPlayers.length);
    
    // Assign players to first round matches based on seeding
    const firstRoundMatches = bracket.filter(m => m.round === 1);
    
    let playerIndex = 0;
    firstRoundMatches.forEach((match, matchIndex) => {
      if (playerIndex < sortedBySeeed.length) {
        match.player1 = {
          id: sortedBySeeed[playerIndex].id,
          name: sortedBySeeed[playerIndex].name
        };
        playerIndex++;
      }
      
      if (playerIndex < sortedBySeeed.length) {
        match.player2 = {
          id: sortedBySeeed[playerIndex].id,
          name: sortedBySeeed[playerIndex].name
        };
        playerIndex++;
      }
    });

    const resolved = autoResolveByes(bracket);
    setMatches(resolved);
    
    toast({
      title: "Seed-ээр автомат бөглөгдлөө",
      description: `${qualifiedPlayers.length} тоглогчийг seed-ийн дагуу байрлуулсан. Одоо гараар өөрчилж болно.`
    });
  }, [qualifiedPlayers, generateBracket, toast]);


  // Get all selected player IDs to prevent duplicates
  const getSelectedPlayerIds = (): Set<string> => {
    const selectedIds = new Set<string>();

    matches.forEach(match => {
      if (match.player1?.id && match.player1.id !== 'lucky_draw') {
        selectedIds.add(match.player1.id);
      }
      if (match.player2?.id && match.player2.id !== 'lucky_draw') {
        selectedIds.add(match.player2.id);
      }
    });

    return selectedIds;
  };

  // Get available players for a specific match position
  const getAvailableUsers = (matchId: string, position: 'player1' | 'player2') => {
    const selectedIds = getSelectedPlayerIds();

    // Remove current match's players from selected IDs so their names appear in the dropdown
    const currentMatch = matches.find(m => m.id === matchId);
    if (currentMatch) {
      const currentPlayer = currentMatch[position];
      if (currentPlayer?.id && !['lucky_draw', 'bye'].includes(currentPlayer.id)) {
        selectedIds.delete(currentPlayer.id);
      }

      const otherPlayer = position === 'player1' ? currentMatch.player2 : currentMatch.player1;
      if (otherPlayer?.id && !['lucky_draw', 'bye'].includes(otherPlayer.id)) {
        selectedIds.delete(otherPlayer.id);
      }
    }

    // Convert qualified players to user format with additional info
    const qualifiedAsUsers = qualifiedPlayers.map(qp => {
      const user = users.find(u => u.id === qp.id);
      const isAssigned = selectedIds.has(qp.id);
      const assignedMatch = isAssigned ? matches.find(m => 
        m.player1?.id === qp.id || m.player2?.id === qp.id
      ) : null;

      return user ? {
        ...user,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
        groupInfo: `${qp.groupName}, Seed #${qp.seed || qp.position}`,
        isAssigned,
        assignedTo: assignedMatch ? `${assignedMatch.roundName}` : undefined
      } : {
        id: qp.id,
        firstName: qp.name.split(' ')[0] || qp.name,
        lastName: qp.name.split(' ').slice(1).join(' ') || '',
        email: '',
        phone: '',
        displayName: qp.name,
        groupInfo: `${qp.groupName}, Seed #${qp.seed || qp.position}`,
        isAssigned,
        assignedTo: assignedMatch ? `${assignedMatch.roundName}` : undefined
      };
    });

    // Add BYE and Lucky draw options
    const specialOptions = [
      {
        id: 'bye',
        firstName: 'BYE',
        lastName: '',
        email: '',
        phone: '',
        displayName: 'BYE',
        groupInfo: 'Автомат шилжилт',
        isAssigned: false
      },
      {
        id: 'lucky_draw',
        firstName: 'Lucky',
        lastName: 'Draw',
        email: '',
        phone: '',
        displayName: 'Lucky Draw',
        groupInfo: 'Санамсаргүй сонголт',
        isAssigned: false
      }
    ];

    return [...qualifiedAsUsers, ...specialOptions];
  };

  // Handle player selection
  const handlePlayerChange = (matchId: string, position: 'player1' | 'player2', playerId: string) => {
    let selectedPlayer: Player | undefined;

    if (playerId === 'lucky_draw') {
      selectedPlayer = { id: 'lucky_draw', name: 'Lucky draw' };
    } else if (playerId === 'bye') {
      selectedPlayer = { id: 'bye', name: 'BYE' };
    } else if (playerId) {
      const qualifiedPlayer = qualifiedPlayers.find(qp => qp.id === playerId);
      if (qualifiedPlayer) {
        selectedPlayer = {
          id: qualifiedPlayer.id,
          name: qualifiedPlayer.name
        };
      }
    }

    setMatches(prev => {
      const afterPick = prev.map(match =>
        match.id === matchId
          ? { ...match, [position]: selectedPlayer, winner: undefined } // Clear winner when players change
          : match
      );
      const updatedMatch = afterPick.find(m => m.id === matchId)!;

      // If the updated match has a BYE participant, auto resolve now
      const maybeResolved = autoResolveByes(afterPick);
      return propagateResult(maybeResolved, updatedMatch);
    });
  };

  // Handle score changes and determine winner
  const handleScoreChange = (matchId: string, scoreField: 'player1Score' | 'player2Score', value: string) => {
    setMatches(prev => {
      let updatedMatch: Match | undefined;

      const newMatches = prev.map(match => {
        if (match.id !== matchId) return match;

        const m = { ...match, [scoreField]: value };

        // Normalize & check presence
        const hasP1 = m.player1Score !== undefined && m.player1Score !== '';
        const hasP2 = m.player2Score !== undefined && m.player2Score !== '';
        const p1 = hasP1 ? Math.max(0, parseInt(String(m.player1Score), 10)) : 0;
        const p2 = hasP2 ? Math.max(0, parseInt(String(m.player2Score), 10)) : 0;

        // Always clear winner first
        m.winner = undefined;

        // Decide winner in three cases:
        // 1) One reaches WIN_TARGET and leads (even if the other score is blank)
        // 2) Both present, non-equal
        // 3) Prevent ties/negatives by guards above
        if ((hasP1 && p1 >= WIN_TARGET && (!hasP2 || p1 > p2)) && m.player1) {
          m.winner = m.player1;
        } else if ((hasP2 && p2 >= WIN_TARGET && (!hasP1 || p2 > p1)) && m.player2) {
          m.winner = m.player2;
        } else if (hasP1 && hasP2 && p1 !== p2 && p1 >= 0 && p2 >= 0) {
          m.winner = (p1 > p2 ? m.player1 : m.player2);
        }

        updatedMatch = m;
        return m;
      });

      return updatedMatch ? propagateResult(newMatches, updatedMatch) : newMatches;
    });
  };

  // Handle manual winner selection
  const handleWinnerSelection = (matchId: string, winnerId: string) => {
    setMatches(prev => {
      let updatedMatch: Match | undefined;
      const newMatches = prev.map(match => {
        if (match.id !== matchId) return match;

        let winner: Player | undefined;
        if (winnerId === match.player1?.id && match.player1) {
          winner = match.player1;
        } else if (winnerId === match.player2?.id && match.player2) {
          winner = match.player2;
        }

        const m = { ...match, winner };
        updatedMatch = m;
        return m;
      });

      // Automatically propagate the manually selected winner
      return updatedMatch ? propagateResult(newMatches, updatedMatch) : newMatches;
    });
  };

  // Auto-resolve BYE matches
  const autoResolveByes = (arr: Match[]) => {
    let matchesCopy = [...arr];

    const resolve = (m: Match) => {
      if (!m.player1 || !m.player2) return;

      // If one side is BYE, the other wins immediately
      const p1Bye = m.player1.id === 'bye';
      const p2Bye = m.player2.id === 'bye';

      if (p1Bye && !p2Bye && m.player2) {
        const resolved = { ...m, winner: m.player2, player1Score: '0', player2Score: String(WIN_TARGET) };
        matchesCopy = propagateResult(
          matchesCopy.map(mm => (mm.id === m.id ? resolved : mm)),
          resolved
        );
      } else if (p2Bye && !p1Bye && m.player1) {
        const resolved = { ...m, winner: m.player1, player1Score: String(WIN_TARGET), player2Score: '0' };
        matchesCopy = propagateResult(
          matchesCopy.map(mm => (mm.id === m.id ? resolved : mm)),
          resolved
        );
      }
    };

    matchesCopy
      .filter(m => m.roundName !== '3-р байрын тоглолт')
      .forEach(resolve);

    return matchesCopy;
  };

  // Update subsequent matches when a match result changes
  const propagateResult = (matches: Match[], match: Match): Match[] => {
    const updatedMatches = [...matches];

    // Advance winner to next match
    if (match.nextMatchId && match.winner) {
      const nextMatchIdx = updatedMatches.findIndex(m => m.id === match.nextMatchId);
      if (nextMatchIdx !== -1) {
        const nextMatch = { ...updatedMatches[nextMatchIdx] } as Match;

        // Find which position this match feeds into in the next round
        const currentRoundMatches = updatedMatches.filter(m => m.round === match.round && m.id !== 'third_place_playoff');
        const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
        const nextPosition: 'player1' | 'player2' = matchIndex % 2 === 0 ? 'player1' : 'player2';

        // Clear any existing players from this match in the next round
        const participantIds = [match.player1?.id, match.player2?.id].filter(Boolean);

        if (nextMatch.player1 && participantIds.includes(nextMatch.player1.id)) {
          nextMatch.player1 = undefined;
        }
        if (nextMatch.player2 && participantIds.includes(nextMatch.player2.id)) {
          nextMatch.player2 = undefined;
        }

        // Advance the winner
        nextMatch[nextPosition] = match.winner;

        // Clear the winner and scores of the next match since participants changed
        if (nextMatch.winner && participantIds.includes(nextMatch.winner.id)) {
          nextMatch.winner = undefined;
          nextMatch.player1Score = undefined;
          nextMatch.player2Score = undefined;
        }

        updatedMatches[nextMatchIdx] = nextMatch;
      }
    }

    // Handle third place match for semifinal losers
    if (match.roundName === 'Хагас финал' && match.winner) {
      const thirdIdx = updatedMatches.findIndex(m => m.id === 'third_place_playoff');
      if (thirdIdx !== -1) {
        const thirdMatch = { ...updatedMatches[thirdIdx] } as Match;
        const participants = [match.player1, match.player2];

        // Clear existing participants from this semifinal
        if (thirdMatch.player1 && participants.some(p => p?.id === thirdMatch.player1!.id)) {
          thirdMatch.player1 = undefined;
        }
        if (thirdMatch.player2 && participants.some(p => p?.id === thirdMatch.player2!.id)) {
          thirdMatch.player2 = undefined;
        }
        if (thirdMatch.winner && participants.some(p => p?.id === thirdMatch.winner!.id)) {
          thirdMatch.winner = undefined;
          thirdMatch.player1Score = undefined;
          thirdMatch.player2Score = undefined;
        }

        // Add the loser to the third place match
        const loser = match.player1?.id === match.winner.id ? match.player2 : match.player1;
        if (loser) {
          if (!thirdMatch.player1) {
            thirdMatch.player1 = loser;
          } else if (!thirdMatch.player2) {
            thirdMatch.player2 = loser;
          }
        }

        updatedMatches[thirdIdx] = thirdMatch;
      }
    }

    return updatedMatches;
  };

  // Advance all winners to next round
  const advanceAllWinners = () => {
    let advancedCount = 0;

    setMatches(prev => {
      const newMatches = [...prev];

      // Sort matches by round to process in correct order
      const sortedMatches = newMatches
        .filter(m => m.winner && m.nextMatchId)
        .sort((a, b) => a.round - b.round);

      sortedMatches.forEach(match => {
        if (!match.winner || !match.nextMatchId) return;

        const nextMatch = newMatches.find(m => m.id === match.nextMatchId);
        if (!nextMatch) return;

        // Determine position in next match
        const currentRoundMatches = newMatches.filter(m => m.round === match.round && m.id !== 'third_place_playoff');
        const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
        const nextPosition = matchIndex % 2 === 0 ? 'player1' : 'player2';

        // Only advance if position is empty
        if (!nextMatch[nextPosition]) {
          nextMatch[nextPosition] = match.winner;
          nextMatch.winner = undefined; // Clear any previous winner
          advancedCount++;

          // Handle 3rd place playoff for semifinal losers
          if (match.roundName === 'Хагас финал') {
            const loser = match.player1?.id === match.winner.id ? match.player2 : match.player1;
            if (loser) {
              const thirdPlaceMatch = newMatches.find(m => m.id === 'third_place_playoff');
              if (thirdPlaceMatch) {
                if (!thirdPlaceMatch.player1) {
                  thirdPlaceMatch.player1 = loser;
                } else if (!thirdPlaceMatch.player2) {
                  thirdPlaceMatch.player2 = loser;
                }
              }
            }
          }
        }
      });

      return newMatches;
    });

    if (advancedCount > 0) {
      toast({
        title: "Хожигчид шилжлээ",
        description: `${advancedCount} хожигч дараагийн шатанд автоматаар шилжлээ`
      });
    } else {
      toast({
        title: "Шилжүүлэх хожигч алга",
        description: "Шилжүүлэх боломжтой хожигч олдсонгүй",
        variant: "destructive"
      });
    }
  };

  // Clear individual match function
  const handleClearMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // Don't allow clearing if match is locked/finished
    if (match.winner) {
      toast({
        title: "Цэвэрлэх боломжгүй",
        description: "Үр дүн баталгаажсан тоглолтыг цэвэрлэх боломжгүй",
        variant: "destructive"
      });
      return;
    }

    // Clear all match data
    setMatches(prev => prev.map(m => 
      m.id === matchId 
        ? { 
            ...m, 
            player1: undefined, 
            player2: undefined, 
            player1Score: undefined, 
            player2Score: undefined, 
            winner: undefined 
          }
        : m
    ));

    toast({
      title: "Тоглолт цэвэрлэгдлээ",
      description: "Тоглолтын бүх мэдээлэл устгагдлаа"
    });
  };

  // Delete match function
  const handleDeleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(match => match.id !== matchId));
  };

  // Get final rankings
  const getFinalRankings = () => {
    const rankings = [];

    const finalMatch = matches.find(m => m.roundName === 'Финал');
    if (finalMatch?.winner) {
      rankings.push({
        position: 1,
        player: finalMatch.winner,
        medal: '🥇'
      });

      const finalLoser = finalMatch.player1?.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
      if (finalLoser) {
        rankings.push({
          position: 2,
          player: finalLoser,
          medal: '🥈'
        });
      }
    }

    const thirdPlaceMatch = matches.find(m => m.id === 'third_place_playoff');
    if (thirdPlaceMatch?.winner) {
      rankings.push({
        position: 3,
        player: thirdPlaceMatch.winner,
        medal: '🥉'
      });
    }

    return rankings;
  };

  // Render the bracket structure using nested divs
  const renderBracket = () => {
    const matchesByRound: Record<number, Match[]> = {};
    matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    return (
      <div className="flex items-start justify-center space-x-8">
        {sortedRounds.map(round => (
          <div key={round} className="flex flex-col items-center space-y-8">
            {matchesByRound[round].map((match) => (
              <Card 
                key={match.id}
                className={`
                  w-[300px] transition-all duration-300 ease-in-out
                  ${selectedMatchId === match.id ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md hover:shadow-xl'}
                  ${match.winner ? 'bg-gray-800' : 'bg-gray-900'}
                `}
                onClick={() => onMatchSelect && onMatchSelect(match.id)}
              >
                <CardContent className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      {match.roundName}
                    </Badge>
                    {match.id === 'third_place_playoff' && (
                      <Badge variant="secondary">3-р байр</Badge>
                    )}
                  </div>

                  {/* Player 1 Row */}
                  <div className="player-row" key={`${match.id}-p1`}>
                    <div 
                      className="player-name player-clickable"
                      onClick={() => handlePlayerSelect(match.id, 'player1')}
                      title="Тоглогч сонгохын тулд дарна уу"
                    >
                      {match.player1?.name || 'Тоглогч сонгох'}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={WIN_TARGET}
                      value={match.player1Score || ''}
                      onChange={(e) => handleScoreChange(match.id, 'player1Score', e.target.value)}
                      className="player-score"
                      placeholder="0"
                    />
                  </div>
                  <div className="vs-divider">VS</div>
                  {/* Player 2 Row */}
                  <div className="player-row" key={`${match.id}-p2`}>
                    <div 
                      className="player-name player-clickable"
                      onClick={() => handlePlayerSelect(match.id, 'player2')}
                      title="Тоглогч сонгохын тулд дарна уу"
                    >
                      {match.player2?.name || 'Тоглогч сонгох'}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={WIN_TARGET}
                      value={match.player2Score || ''}
                      onChange={(e) => handleScoreChange(match.id, 'player2Score', e.target.value)}
                      className="player-score"
                      placeholder="0"
                    />
                  </div>

                  {/* Winner display and selection */}
                  {match.player1 && match.player2 && (
                    <div className="mt-3">
                      {match.winner ? (
                        <div className="text-center text-sm text-green-400 font-semibold">
                          Ялагч: {match.winner.name}
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleWinnerSelection(match.id, match.player1!.id)}
                            disabled={!match.player1}
                          >
                            {match.player1?.name}
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleWinnerSelection(match.id, match.player2!.id)}
                            disabled={!match.player2}
                          >
                            {match.player2?.name}
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => handleWinnerSelection(match.id, '')}
                          >
                            X
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match Actions */}
                  {(match.player1 || match.player2) && (
                    <div className="mt-3 flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleClearMatch(match.id)}
                        disabled={!!match.winner}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Цэвэрлэх
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const handleSaveClick = () => {
    onSave(matches);
    toast({
      title: "Шигшээ тоглолт хадгалагдлаа",
      description: "Бүх өөрчлөлтүүд амжилттай хадгалагдлаа."
    });
  };

  return (
    <div className="w-full">
      {/* Control Panel */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Шигшээ тоглолтын удирдлага</h3>
          <div className="flex gap-2">
            <Button onClick={createEmptyBracket} disabled={qualifiedPlayers.length < 4}>
              Хоосон шигшээ үүсгэх
            </Button>
            <Button 
              onClick={generateBracketBySeed} 
              disabled={qualifiedPlayers.length < 4}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Seed-ээр автомат бөглөх
            </Button>
            <Button 
              onClick={advanceAllWinners} 
              disabled={matches.length === 0}
              variant="secondary"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Хожигчдыг шилжүүлэх
            </Button>
            <Button onClick={() => onSave(matches)} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Хадгалах
            </Button>
            <Button 
              onClick={() => {
                if (window.confirm('Бүх тоглолтыг устгахдаа итгэлтэй байна уу?')) {
                  setMatches([]);
                  toast({
                    title: "Цэвэрлэгдлээ",
                    description: "Бүх тоглолтууд устгагдлаа"
                  });
                }
              }} 
              variant="destructive" 
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Цэвэрлэх
            </Button>
          </div>
        </div>

        {/* Player Selection Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualifiedPlayers.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Шалгарсан тоглогчид ({qualifiedPlayers.length})</h4>
              <p className="text-sm text-gray-600 mb-1">
                Админ доорх талбаруудаас тоглогчдыг гараар сонгоно уу
              </p>
              <div className="text-xs text-gray-500">
                {qualifiedPlayers.map((player, index) => (
                  <span key={player.id}>
                    {player.name} ({player.groupName})
                    {index < qualifiedPlayers.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Тоглогч сонголтын төлөв</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border rounded"></div>
                <span className="text-gray-600">Тоглогч сонгох</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">🎲</span>
                <span className="text-gray-600">Lucky draw сонголт</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Сонгогдсон тоглогчид бусад тоглолтын жагсаалтаас автоматаар хасагдана
            </p>
          </div>
        </div>
      </div>

      {/* Final Rankings Display */}
      {getFinalRankings().length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
          <h4 className="font-semibold mb-3 text-center">🏆 Эцсийн байрлал</h4>
          <div className="flex justify-center gap-6">
            {getFinalRankings().map((ranking) => (
              <div key={ranking.position} className="text-center">
                <div className="text-2xl mb-1">{ranking.medal}</div>
                <div className="font-medium">{ranking.position}-р байр</div>
                <div className="text-sm text-gray-600">{ranking.player.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}


    {/* Individual Match Editors */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Тоглолтын засвар</h3>
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className={`${selectedMatchId === match.id ? 'ring-2 ring-blue-500' : ''}`}
                id={`match-editor-${match.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{match.roundName}</Badge>
                      {match.id === 'third_place_playoff' && (
                        <Badge variant="secondary">3-р байр</Badge>
                      )}
                      {getFinalRankings().some(r => r.player.id === match.winner?.id) && (
                        <Badge className="bg-yellow-500">
                          {getFinalRankings().find(r => r.player.id === match.winner?.id)?.medal}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearMatch(match.id)}
                        disabled={!!match.winner}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMatch(match.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Player 1 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Тоглогч 1</label>
                      <UserAutocomplete
                        users={getAvailableUsers(match.id, 'player1')}
                        value={match.player1?.id || ''}
                        onSelect={(user) => {
                          // Validation: Check if trying to assign same player to both positions
                          if (user?.id && match.player2?.id === user.id) {
                            toast({
                              title: "Алдаа",
                              description: "Нэг тоглогчийг хоёр талд байрлуулж болохгүй",
                              variant: "destructive"
                            });
                            return;
                          }
                          handlePlayerChange(match.id, 'player1', user?.id || '');
                        }}
                        placeholder="Тоглогч сонгох (бүх шалгарсан тоглогч)"
                        disabled={match.winner !== undefined} // Lock if match is finished
                      />
                      <Input
                        type="number"
                        placeholder="Оноо"
                        value={match.player1Score || ''}
                        onChange={(e) => handleScoreChange(match.id, 'player1Score', e.target.value)}
                        min="0"
                        max={WIN_TARGET}
                        disabled={match.winner !== undefined}
                      />
                      {match.winner && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          🔒 Үр дүн баталгаажсан
                        </div>
                      )}
                    </div>

                    {/* Player 2 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Тоглогч 2</label>
                      <UserAutocomplete
                        users={getAvailableUsers(match.id, 'player2')}
                        value={match.player2?.id || ''}
                        onSelect={(user) => {
                          // Validation: Check if trying to assign same player to both positions
                          if (user?.id && match.player1?.id === user.id) {
                            toast({
                              title: "Алдаа",
                              description: "Нэг тоглогчийг хоёр талд байрлуулж болохгүй",
                              variant: "destructive"
                            });
                            return;
                          }
                          handlePlayerChange(match.id, 'player2', user?.id || '');
                        }}
                        placeholder="Тоглогч сонгох (бүх шалгарсан тоглогч)"
                        disabled={match.winner !== undefined} // Lock if match is finished
                      />
                      <Input
                        type="number"
                        placeholder="Оноо"
                        value={match.player2Score || ''}
                        onChange={(e) => handleScoreChange(match.id, 'player2Score', e.target.value)}
                        min="0"
                        max={WIN_TARGET}
                        disabled={match.winner !== undefined}
                      />
                      {match.winner && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          🔒 Үр дүн баталгаажсан
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Winner Selection */}
                  {match.player1 && match.player2 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium mb-2 block">Ялагч (гараар сонгох)</label>
                      <div className="flex gap-2">
                        <Button
                          variant={match.winner?.id === match.player1.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleWinnerSelection(match.id, match.player1!.id)}
                          disabled={match.winner !== undefined}
                        >
                          {match.player1.name}
                        </Button>
                        <Button
                          variant={match.winner?.id === match.player2.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleWinnerSelection(match.id, match.player2!.id)}
                          disabled={match.winner !== undefined}
                        >
                          {match.player2.name}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWinnerSelection(match.id, '')}
                        >
                          Цэвэрлэх
                        </Button>
                      </div>
                      {match.winner && (
                        <div className="mt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Энэ тоглолтыг түгжээ тайлж засварлах уу?')) {
                                setMatches(prev => prev.map(m => 
                                  m.id === match.id 
                                    ? { ...m, winner: undefined, player1Score: undefined, player2Score: undefined }
                                    : m
                                ));
                                toast({
                                  title: "Түгжээ тайлагдлаа",
                                  description: "Одоо тоглолтыг дахин засварлах боломжтой"
                                });
                              }
                            }}
                          >
                            🔓 Түгжээ тайлж засах
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match Status */}
                  <div className="mt-3 text-sm text-gray-500">
                    {match.winner ? (
                      <span className="text-green-600 font-medium">
                        Ялагч: {match.winner.name}
                      </span>
                    ) : match.player1 && match.player2 ? (
                      <span>Үр дүн оруулаагүй</span>
                    ) : (
                      <span className="text-gray-400">Тоглогчид сонгоогүй</span>
                    )}
                  </div>

                  {/* Clear Match Button */}
                  {!match.winner && (match.player1 || match.player2) && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearMatch(match.id)}
                        className="w-full text-orange-500 hover:text-orange-700 border-orange-300"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Тоглолт цэвэрлэх
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};