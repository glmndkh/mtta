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

  // Update matches when initialMatches changes
  useEffect(() => {
    if (initialMatches && initialMatches.length > 0) {
      setMatches(initialMatches);
    }
  }, [initialMatches]);

  // Generate tournament bracket structure
  const generateBracket = useCallback((playerCount: number) => {
    const rounds = Math.ceil(Math.log2(playerCount));
    const newMatches: Match[] = [];
    const ROUND_WIDTH = 350;
    const START_Y = 80;

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

    const bracket = generateBracket(qualifiedPlayers.length);
    setMatches(bracket);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн хоосон шигшээ тоглолт үүсгэгдлээ`
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
      if (currentPlayer?.id && currentPlayer.id !== 'lucky_draw') {
        selectedIds.delete(currentPlayer.id);
      }

      const otherPlayer = position === 'player1' ? currentMatch.player2 : currentMatch.player1;
      if (otherPlayer?.id && otherPlayer.id !== 'lucky_draw') {
        selectedIds.delete(otherPlayer.id);
      }
    }

    // Convert qualified players to user format and filter out selected ones
    const qualifiedAsUsers = qualifiedPlayers.map(qp => {
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

  // Handle player selection
  const handlePlayerChange = (matchId: string, position: 'player1' | 'player2', playerId: string) => {
    let selectedPlayer: Player | undefined;

    if (playerId === 'lucky_draw') {
      selectedPlayer = { id: 'lucky_draw', name: 'Lucky draw' };
    } else if (playerId) {
      const qualifiedPlayer = qualifiedPlayers.find(qp => qp.id === playerId);
      if (qualifiedPlayer) {
        selectedPlayer = {
          id: qualifiedPlayer.id,
          name: qualifiedPlayer.name
        };
      }
    }

    setMatches(prev => prev.map(match =>
      match.id === matchId 
        ? { ...match, [position]: selectedPlayer, winner: undefined } // Clear winner when players change
        : match
    ));
  };

  // Handle score changes and determine winner
  const handleScoreChange = (matchId: string, scoreField: 'player1Score' | 'player2Score', value: string) => {
    setMatches(prev => {
      return prev.map(match => {
        if (match.id !== matchId) return match;

        const updatedMatch = { ...match, [scoreField]: value };

        // Determine winner based on scores
        const p1Score = parseInt(updatedMatch.player1Score || '0');
        const p2Score = parseInt(updatedMatch.player2Score || '0');

        // Clear winner first
        updatedMatch.winner = undefined;

        // Only set winner if both scores are valid and different
        if (updatedMatch.player1Score && updatedMatch.player2Score && 
            p1Score !== p2Score && p1Score >= 0 && p2Score >= 0) {
          if (p1Score > p2Score && updatedMatch.player1) {
            updatedMatch.winner = updatedMatch.player1;
          } else if (p2Score > p1Score && updatedMatch.player2) {
            updatedMatch.winner = updatedMatch.player2;
          }
        }

        return updatedMatch;
      });
    });
  };

  // Handle manual winner selection
  const handleWinnerSelection = (matchId: string, winnerId: string) => {
    setMatches(prev => {
      return prev.map(match => {
        if (match.id !== matchId) return match;

        let winner: Player | undefined;
        if (winnerId === match.player1?.id && match.player1) {
          winner = match.player1;
        } else if (winnerId === match.player2?.id && match.player2) {
          winner = match.player2;
        }

        return { ...match, winner };
      });
    });
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
            <Button onClick={() => setMatches([])} variant="destructive" size="sm">
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

      {/* Bracket Visualization */}
      <div className="relative">
        {matches.length > 0 ? (
          <div className="space-y-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-[500px] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-100 mb-3 sticky top-0 bg-gray-800 py-2 border-b border-gray-600">
              Шигшээ тоглолт засах ({matches.length} тоглолт)
            </h3>

            {Array.from(new Set(matches.map(m => m.roundName))).map(roundName => (
              <div key={roundName} className="space-y-3">
                <h4 className="text-md font-medium text-green-400 bg-gray-900 px-3 py-1 rounded">
                  {roundName}
                </h4>

                {matches.filter(m => m.roundName === roundName).map((match, index) => (
                  <div
                    key={match.id}
                    id={`match-editor-${match.id}`}
                    onClick={() => onMatchSelect?.(match.id)}
                    className={`bg-gray-700 rounded-lg p-4 border transition-colors cursor-pointer ${
                      selectedMatchId === match.id
                        ? 'border-green-400 ring-2 ring-green-500'
                        : 'border-gray-600 hover:border-green-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-200">
                        Тоглолт #{index + 1}
                      </span>
                      <Button
                        onClick={() => handleDeleteMatch(match.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400 hover:bg-red-900/20 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Player 1 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <select
                        value={match.player1?.id || ''}
                        onChange={(e) => handlePlayerChange(match.id, 'player1', e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Тоглогч 1 сонгох</option>
                        <option value="lucky_draw">🎲 Lucky Draw</option>
                        {getAvailableUsers(match.id, 'player1').map((user) => (
                          <option key={`${match.id}-p1-${user.id}`} value={user.id}>
                            {user.firstName} {user.lastName}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="0"
                        value={match.player1Score || ''}
                        onChange={(e) => handleScoreChange(match.id, 'player1Score', e.target.value)}
                        className="w-16 text-center text-sm h-8 bg-gray-900 border-gray-600 text-gray-100 focus:border-green-500"
                        type="number"
                        min="0"
                        max="9"
                      />
                    </div>

                    {/* VS Divider */}
                    <div className="text-center text-gray-400 text-xs font-bold mb-3">VS</div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <select
                        value={match.player2?.id || ''}
                        onChange={(e) => handlePlayerChange(match.id, 'player2', e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Тоглогч 2 сонгох</option>
                        <option value="lucky_draw">🎲 Lucky Draw</option>
                        {getAvailableUsers(match.id, 'player2').map((user) => (
                          <option key={`${match.id}-p2-${user.id}`} value={user.id}>
                            {user.firstName} {user.lastName}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="0"
                        value={match.player2Score || ''}
                        onChange={(e) => handleScoreChange(match.id, 'player2Score', e.target.value)}
                        className="w-16 text-center text-sm h-8 bg-gray-900 border-gray-600 text-gray-100 focus:border-green-500"
                        type="number"
                        min="0"
                        max="9"
                      />
                    </div>

                    {/* Winner Selection */}
                    {match.player1 && match.player2 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <label className="text-xs text-gray-400 mb-2 block">Ялагч сонгох:</label>
                        <select
                          value={match.winner?.id || ''}
                          onChange={(e) => handleWinnerSelection(match.id, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:border-green-500"
                        >
                          <option value="">Ялагч сонгоогүй</option>
                          <option value={match.player1.id}>{match.player1.name}</option>
                          <option value={match.player2.id}>{match.player2.name}</option>
                        </select>
                      </div>
                    )}

                    {/* Score Display */}
                    {(match.player1Score && match.player2Score) && (
                      <div className="text-center mt-3 pt-3 border-t border-gray-600">
                        <div className="text-lg font-bold text-white mb-1">
                          {match.player1Score} - {match.player2Score}
                        </div>
                        {match.winner && (
                          <div className="text-xs text-green-400">
                            Ялагч: {match.winner.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg text-gray-200">
            <h3 className="text-lg font-semibold mb-2">Шигшээ тоглолт үүсгэх</h3>
            <p className="text-gray-400 mb-4">
              Дээрх "Хоосон шигшээ үүсгэх" товчийг дарж эхлэнэ үү
            </p>
            <Button
              onClick={createEmptyBracket}
              disabled={qualifiedPlayers.length < 4}
            >
              {qualifiedPlayers.length >= 4
                ? `${qualifiedPlayers.length} тоглогчийн хоосон шигшээ үүсгэх`
                : `Хоосон шигшээ үүсгэх (${qualifiedPlayers.length}/4 тоглогч)`
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};