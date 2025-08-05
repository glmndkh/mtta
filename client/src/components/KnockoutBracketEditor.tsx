import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { Trash2, Save, RotateCcw, Trophy } from "lucide-react";
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
}

export const KnockoutBracketEditor: React.FC<BracketEditorProps> = ({
  initialMatches = [],
  users,
  onSave,
  qualifiedPlayers = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  // Update matches when initialMatches changes
  useEffect(() => {
    if (initialMatches && initialMatches.length > 0) {
      setMatches(initialMatches);
    }
  }, [initialMatches]);

  // Generate compact asymmetric tournament bracket structure
  const generateBracket = useCallback((playerCount: number) => {
    const rounds = Math.ceil(Math.log2(playerCount));
    const newMatches: Match[] = [];
    
    // Compact spacing for more efficient layout
    const MATCH_HEIGHT = 140;
    const ROUND_WIDTH = 220;
    const START_Y = 40;
    
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundName = getRoundName(matchesInRound);
      
      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        // Asymmetric positioning - stagger matches vertically for better flow
        const baseSpacing = Math.pow(2, round - 1) * MATCH_HEIGHT;
        const roundOffset = round * 30; // Less spacing between rounds
        const yOffset = START_Y + matchIndex * baseSpacing + roundOffset;
        
        const match: Match = {
          id: `match_${round}_${matchIndex}`,
          round,
          roundName,
          position: {
            x: (round - 1) * ROUND_WIDTH + 30,
            y: yOffset
          }
        };
        
        // Set next match connection for progression
        if (round < rounds) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          match.nextMatchId = `match_${round + 1}_${nextMatchIndex}`;
        }
        
        newMatches.push(match);
      }
    }
    
    // Add 3rd place playoff match positioned asymmetrically
    if (rounds >= 2) {
      const thirdPlaceMatch: Match = {
        id: 'third_place_playoff',
        round: rounds,
        roundName: '3-р байрын тоглолт',
        position: {
          x: (rounds - 1) * ROUND_WIDTH + 30,
          y: START_Y + 320 // Position below but closer to final
        }
      };
      newMatches.push(thirdPlaceMatch);
    }
    
    return newMatches;
  }, []);

  const getRoundName = (matchCount: number): string => {
    switch (matchCount) {
      case 1: return 'Финал';
      case 2: return 'Хагас финал';
      case 4: return 'Дөрөвний финал';
      case 8: return '1/8 финал';
      case 16: return '1/16 финал';
      case 32: return '1/32 финал';
      case 64: return '1/64 финал';
      default: return `${matchCount} тоглолт`;
    }
  };

  // Create empty bracket structure without auto-populating players
  const createEmptyBracket = useCallback(() => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    const bracket = generateBracket(qualifiedPlayers.length);
    setMatches(bracket);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн хоосон шигшээ тоглолт үүсгэгдлээ`
    });
  }, [qualifiedPlayers, generateBracket]);

  // Get players already selected in other matches
  const getSelectedPlayerIds = (currentMatchId: string, currentPosition?: string) => {
    const selectedIds = new Set<string>();
    
    matches.forEach(match => {
      if (match.id === currentMatchId) {
        // For current match, exclude the other position
        if (currentPosition === 'player1' && match.player2?.id && match.player2.id !== 'lucky_draw') {
          selectedIds.add(match.player2.id);
        } else if (currentPosition === 'player2' && match.player1?.id && match.player1.id !== 'lucky_draw') {
          selectedIds.add(match.player1.id);
        }
      } else {
        // For other matches, exclude all selected players
        if (match.player1?.id && match.player1.id !== 'lucky_draw') {
          selectedIds.add(match.player1.id);
        }
        if (match.player2?.id && match.player2.id !== 'lucky_draw') {
          selectedIds.add(match.player2.id);
        }
      }
    });
    
    return selectedIds;
  };

  // Get available players for a specific match and position (only qualified players)
  const getAvailableUsers = (matchId: string, position: 'player1' | 'player2') => {
    const selectedIds = getSelectedPlayerIds(matchId, position);
    
    // Convert qualified players to user format and filter out already selected ones
    const qualifiedAsUsers = qualifiedPlayers.map(qp => {
      // Find the corresponding user data
      const user = users.find(u => u.id === qp.id);
      return user || {
        id: qp.id,
        firstName: qp.name.split(' ')[0] || qp.name,
        lastName: qp.name.split(' ').slice(1).join(' ') || '',
        email: '',
        phone: ''
      };
    });
    
    return qualifiedAsUsers.filter(user => !selectedIds.has(user.id));
  };

  // Handle manual player selection from dropdown
  const handlePlayerSelect = (matchId: string, position: 'player1' | 'player2', playerId: string) => {
    let selectedPlayer: Player | undefined;
    
    if (playerId === 'lucky_draw') {
      selectedPlayer = { id: 'lucky_draw', name: 'Lucky draw' };
    } else {
      // Find player in qualified players first, then fallback to users
      const qualifiedPlayer = qualifiedPlayers.find(qp => qp.id === playerId);
      if (qualifiedPlayer) {
        selectedPlayer = { 
          id: qualifiedPlayer.id, 
          name: qualifiedPlayer.name
        };
      } else {
        const user = users.find(u => u.id === playerId);
        if (user) {
          selectedPlayer = { 
            id: user.id, 
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() 
          };
        }
      }
    }
    
    if (selectedPlayer) {
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, [position]: selectedPlayer }
          : match
      ));
    }
  };

  // Handle score changes and auto-determine winner
  const handleScoreChange = (matchId: string, scoreField: 'player1Score' | 'player2Score', value: string) => {
    setMatches(prev => {
      const newMatches = prev.map(match => {
        if (match.id !== matchId) return match;
        
        const updatedMatch = { ...match, [scoreField]: value };
        
        // Auto-determine winner based on scores
        const p1Score = parseInt(updatedMatch.player1Score || '0');
        const p2Score = parseInt(updatedMatch.player2Score || '0');
        
        if (p1Score > 0 && p2Score > 0 && p1Score !== p2Score) {
          const winner = p1Score > p2Score ? updatedMatch.player1 : updatedMatch.player2;
          updatedMatch.winner = winner;
        }
        
        return updatedMatch;
      });
      
      // Find the updated match and advance winner if needed
      const updatedMatch = newMatches.find(m => m.id === matchId);
      if (updatedMatch?.winner && updatedMatch.nextMatchId) {
        // Auto-advance winner to next round
        const currentRoundMatches = newMatches.filter(m => m.round === updatedMatch.round);
        const matchIndex = currentRoundMatches.findIndex(m => m.id === updatedMatch.id);
        const nextPosition = matchIndex % 2 === 0 ? 'player1' : 'player2';
        
        const finalMatches = newMatches.map(m => 
          m.id === updatedMatch.nextMatchId 
            ? { ...m, [nextPosition]: updatedMatch.winner }
            : m
        );
        
        // Also handle 3rd place playoff for semifinal losers
        if (updatedMatch.roundName === 'Хагас финал') {
          const loser = updatedMatch.player1?.id === updatedMatch.winner.id ? updatedMatch.player2 : updatedMatch.player1;
          if (loser) {
            const thirdPlaceMatch = finalMatches.find(m => m.id === 'third_place_playoff');
            if (thirdPlaceMatch) {
              // Only add if this loser is not already in the 3rd place match
              const loserAlreadyAdded = thirdPlaceMatch.player1?.id === loser.id || thirdPlaceMatch.player2?.id === loser.id;
              
              if (!loserAlreadyAdded) {
                if (!thirdPlaceMatch.player1) {
                  return finalMatches.map(m => 
                    m.id === 'third_place_playoff' 
                      ? { ...m, player1: loser }
                      : m
                  );
                } else if (!thirdPlaceMatch.player2) {
                  return finalMatches.map(m => 
                    m.id === 'third_place_playoff' 
                      ? { ...m, player2: loser }
                      : m
                  );
                }
              }
            }
          }
        }
        
        toast({
          title: "Ялагч дараагийн шатанд шилжлээ",
          description: `${updatedMatch.winner.name} автоматаар дараагийн тоглолтонд орлоо`
        });
        
        return finalMatches;
      }
      
      return newMatches;
    });
  };

  // Handle manual winner selection
  const handleWinnerSelection = (matchId: string, winnerId: string) => {
    setMatches(prev => {
      const match = prev.find(m => m.id === matchId);
      if (!match) return prev;
      
      const winner = winnerId === match.player1?.id ? match.player1 :
                     winnerId === match.player2?.id ? match.player2 : undefined;
      
      const newMatches = prev.map(m => 
        m.id === matchId ? { ...m, winner } : m
      );
      
      // Auto-advance winner to next round and handle 3rd place playoff
      if (winner && match.nextMatchId) {
        const currentRoundMatches = newMatches.filter(m => m.round === match.round);
        const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
        const nextPosition = matchIndex % 2 === 0 ? 'player1' : 'player2';
        
        let finalMatches = newMatches.map(m => 
          m.id === match.nextMatchId 
            ? { ...m, [nextPosition]: winner }
            : m
        );
        
        // Handle 3rd place playoff for semifinal losers
        if (match.roundName === 'Хагас финал') {
          const loser = match.player1?.id === winner.id ? match.player2 : match.player1;
          if (loser) {
            const thirdPlaceMatch = finalMatches.find(m => m.id === 'third_place_playoff');
            if (thirdPlaceMatch) {
              // Only add if this loser is not already in the 3rd place match
              const loserAlreadyAdded = thirdPlaceMatch.player1?.id === loser.id || thirdPlaceMatch.player2?.id === loser.id;
              
              if (!loserAlreadyAdded) {
                if (!thirdPlaceMatch.player1) {
                  finalMatches = finalMatches.map(m => 
                    m.id === 'third_place_playoff' 
                      ? { ...m, player1: loser }
                      : m
                  );
                } else if (!thirdPlaceMatch.player2) {
                  finalMatches = finalMatches.map(m => 
                    m.id === 'third_place_playoff' 
                      ? { ...m, player2: loser }
                      : m
                  );
                }
              }
            }
          }
        }
        
        toast({
          title: "Ялагч дараагийн шатанд шилжлээ",
          description: `${winner.name} автоматаар дараагийн тоглолтонд орлоо`
        });
        
        return finalMatches;
      }
      
      return newMatches;
    });
  };

  // Advance winner to next round and handle 3rd place playoff
  const advanceWinnerToNextRound = (match: Match) => {
    if (!match.winner || !match.nextMatchId) return;
    
    // Determine which position in next match
    const currentRoundMatches = matches.filter(m => m.round === match.round);
    const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
    const nextPosition = matchIndex % 2 === 0 ? 'player1' : 'player2';
    
    setMatches(prev => {
      const newMatches = prev.map(m => 
        m.id === match.nextMatchId 
          ? { ...m, [nextPosition]: match.winner }
          : m
      );
      
      // If this is a semifinal match, add loser to 3rd place playoff
      if (match.roundName === 'Хагас финал') {
        const loser = match.player1?.id === match.winner.id ? match.player2 : match.player1;
        if (loser) {
          const thirdPlaceMatch = newMatches.find(m => m.id === 'third_place_playoff');
          if (thirdPlaceMatch) {
            // Only add if this loser is not already in the 3rd place match
            const loserAlreadyAdded = thirdPlaceMatch.player1?.id === loser.id || thirdPlaceMatch.player2?.id === loser.id;
            
            if (!loserAlreadyAdded) {
              // Add loser to first available position in 3rd place match
              if (!thirdPlaceMatch.player1) {
                return newMatches.map(m => 
                  m.id === 'third_place_playoff' 
                    ? { ...m, player1: loser }
                    : m
                );
              } else if (!thirdPlaceMatch.player2) {
                return newMatches.map(m => 
                  m.id === 'third_place_playoff' 
                    ? { ...m, player2: loser }
                    : m
                );
              }
            }
          }
        }
      }
      
      return newMatches;
    });
    
    toast({
      title: "Ялагч дараагийн шатанд шилжлээ",
      description: `${match.winner.name} автоматаар дараагийн тоглолтонд орлоо`
    });
  };

  // Update match data
  const updateMatch = (matchId: string, field: keyof Match, value: any) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, [field]: value }
        : match
    ));
  };

  // Calculate final tournament rankings
  const getFinalRankings = () => {
    const rankings = [];
    
    // Find final match
    const finalMatch = matches.find(m => m.roundName === 'Финал');
    if (finalMatch?.winner) {
      // 1st place: final winner
      rankings.push({
        position: 1,
        player: finalMatch.winner,
        medal: '🥇'
      });
      
      // 2nd place: final loser
      const finalLoser = finalMatch.player1?.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
      if (finalLoser) {
        rankings.push({
          position: 2,
          player: finalLoser,
          medal: '🥈'
        });
      }
    }
    
    // Find 3rd place playoff
    const thirdPlaceMatch = matches.find(m => m.id === 'third_place_playoff');
    if (thirdPlaceMatch?.winner) {
      // 3rd place: 3rd place playoff winner
      rankings.push({
        position: 3,
        player: thirdPlaceMatch.winner,
        medal: '🥉'
      });
    }
    
    return rankings;
  };



  // Render connection lines
  const renderConnections = () => {
    return matches.map(match => {
      if (!match.nextMatchId) return null;
      
      const nextMatch = matches.find(m => m.id === match.nextMatchId);
      if (!nextMatch) return null;
      
      const x1 = match.position.x + 256; // Updated match box width (w-64)
      const y1 = match.position.y + 70; // Center of match box
      const x2 = nextMatch.position.x;
      const y2 = nextMatch.position.y + 70;
      
      return (
        <line
          key={`line-${match.id}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      );
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
            <Button onClick={() => onSave(matches)} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Хадгалах
            </Button>
            <Button onClick={() => setMatches([])} variant="destructive" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Цэвэрлэх
            </Button>
          </div>
        </div>
        
        {/* Player Selection Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Qualified Players Info */}
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
          
          {/* Player Selection Status */}
          <div>
            <h4 className="font-medium mb-2">Тоглогч сонголтын төлөв</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border rounded"></div>
                <span className="text-gray-600">Тоглогч 1 сонгох</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-50 border rounded"></div>
                <span className="text-gray-600">Тоглогч 2 сонгох</span>
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

      {/* Final Rankings */}


      {/* Bracket Visualization */}
      <div className="relative">
        {matches.length > 0 ? (
          <div 
            ref={containerRef}
            className="relative bg-white border rounded-lg p-3 md:p-6 overflow-auto"
            style={{ 
              minHeight: '600px',
              minWidth: '900px'
            }}
          >
            {/* SVG for connection lines */}
            <svg 
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1, minHeight: '700px', minWidth: '1000px' }}
            >
              {renderConnections()}
            </svg>

            {/* Compact Match Cards */}
            {matches.map(match => (
              <div
                key={match.id}
                className="absolute bg-white border border-gray-300 rounded-md p-2 w-48 min-h-[100px] shadow-sm hover:shadow-md transition-shadow"
                style={{
                  left: match.position.x,
                  top: match.position.y,
                  zIndex: 10
                }}
              >
                {/* Compact Match Header */}
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs px-1 py-0 text-gray-600">
                    {match.roundName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMatches(prev => prev.filter(m => m.id !== match.id))}
                    className="h-4 w-4 p-0 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-2 h-2" />
                  </Button>
                </div>

                {/* Compact Player Display */}
                <div className="space-y-1 mb-2">
                  {/* Player 1 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      {match.player1 ? (
                        <span className="text-blue-700 font-medium truncate block">
                          {match.player1.name}
                        </span>
                      ) : (
                        <select
                          className="w-full text-xs border rounded px-1 py-0 bg-blue-50"
                          value=""
                          onChange={(e) => handlePlayerSelect(match.id, 'player1', e.target.value)}
                        >
                          <option value="">P1</option>
                          {getAvailableUsers(match.id, 'player1').slice(0, 5).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <span className="ml-2 font-mono text-sm">
                      {match.player1Score || '-'}
                    </span>
                  </div>

                  {/* Player 2 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      {match.player2 ? (
                        <span className="text-red-700 font-medium truncate block">
                          {match.player2.name}
                        </span>
                      ) : (
                        <select
                          className="w-full text-xs border rounded px-1 py-0 bg-red-50"
                          value=""
                          onChange={(e) => handlePlayerSelect(match.id, 'player2', e.target.value)}
                        >
                          <option value="">P2</option>
                          {getAvailableUsers(match.id, 'player2').slice(0, 5).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <span className="ml-2 font-mono text-sm">
                      {match.player2Score || '-'}
                    </span>
                  </div>
                </div>

                {/* Compact Score Input */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <Input
                    placeholder="0"
                    value={match.player1Score || ''}
                    onChange={(e) => handleScoreChange(match.id, 'player1Score', e.target.value)}
                    className="text-center text-xs h-6 bg-blue-50"
                    type="number"
                    min="0"
                  />
                  <Input
                    placeholder="0"
                    value={match.player2Score || ''}
                    onChange={(e) => handleScoreChange(match.id, 'player2Score', e.target.value)}
                    className="text-center text-xs h-6 bg-red-50"
                    type="number"
                    min="0"
                  />
                </div>

                {/* Compact Winner Selection & Display */}
                {match.winner ? (
                  <div className="text-center">
                    <span className="inline-flex items-center px-1 py-0 bg-green-100 text-green-800 text-xs rounded">
                      🏆 {match.winner.name.length > 10 ? 
                           match.winner.name.substring(0, 10) + '...' : 
                           match.winner.name}
                    </span>
                  </div>
                ) : (
                  <select
                    className="w-full p-1 border rounded text-xs h-6"
                    value=""
                    onChange={(e) => handleWinnerSelection(match.id, e.target.value)}
                  >
                    <option value="">Winner</option>
                    {match.player1 && (
                      <option value={match.player1.id}>
                        {match.player1.name.substring(0, 12)}
                      </option>
                    )}
                    {match.player2 && (
                      <option value={match.player2.id}>
                        {match.player2.name.substring(0, 12)}
                      </option>
                    )}
                  </select>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Шигшээ тоглолт үүсгэх</h3>
            <p className="text-gray-600 mb-4">
              Дээрх "Хоосон шигшээ үүсгэх" товчийг дарж эхлэнэ үү
            </p>
            {qualifiedPlayers.length >= 4 && (
              <Button onClick={createEmptyBracket}>
                {qualifiedPlayers.length} тоглогчийн хоосон шигшээ үүсгэх
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};