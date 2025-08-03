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
  score?: string;
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

  // Generate standard tournament bracket structure
  const generateBracket = useCallback((playerCount: number) => {
    const rounds = Math.ceil(Math.log2(playerCount));
    const newMatches: Match[] = [];
    
    // Calculate positions for each round
    const MATCH_HEIGHT = 120;
    const ROUND_WIDTH = 300;
    const START_Y = 50;
    
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundName = getRoundName(matchesInRound);
      
      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const ySpacing = Math.pow(2, round - 1) * MATCH_HEIGHT;
        const yOffset = START_Y + matchIndex * ySpacing;
        
        const match: Match = {
          id: `match_${round}_${matchIndex}`,
          round,
          roundName,
          position: {
            x: (round - 1) * ROUND_WIDTH + 50,
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

  // Auto-populate first round with qualified players
  const populateWithQualifiedPlayers = useCallback(() => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    const bracket = generateBracket(qualifiedPlayers.length);
    const firstRoundMatches = bracket.filter(m => m.round === 1);
    
    // Populate first round matches with qualified players
    firstRoundMatches.forEach((match, index) => {
      const player1Index = index * 2;
      const player2Index = index * 2 + 1;
      
      if (qualifiedPlayers[player1Index]) {
        match.player1 = {
          id: qualifiedPlayers[player1Index].id,
          name: qualifiedPlayers[player1Index].name
        };
      }
      
      if (qualifiedPlayers[player2Index]) {
        match.player2 = {
          id: qualifiedPlayers[player2Index].id,
          name: qualifiedPlayers[player2Index].name
        };
      }
    });
    
    setMatches(bracket);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн шигшээ тоглолт амжилттай үүсгэгдлээ`
    });
  }, [qualifiedPlayers, generateBracket]);

  // Handle player drop on match
  const handlePlayerDrop = (matchId: string, position: 'player1' | 'player2') => {
    if (!draggedPlayer) return;
    
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, [position]: draggedPlayer }
        : match
    ));
    
    setDraggedPlayer(null);
  };

  // Update match data
  const updateMatch = (matchId: string, field: keyof Match, value: any) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, [field]: value }
        : match
    ));
  };

  // Advance winner to next match
  const advanceWinner = (match: Match) => {
    if (!match.winner || !match.nextMatchId) return;
    
    const nextMatch = matches.find(m => m.id === match.nextMatchId);
    if (!nextMatch) return;
    
    // Determine which position in next match
    const currentRoundMatches = matches.filter(m => m.round === match.round);
    const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
    const nextPosition = matchIndex % 2 === 0 ? 'player1' : 'player2';
    
    updateMatch(match.nextMatchId, nextPosition, match.winner);
    
    toast({
      title: "Тоглогч дараагийн шатанд шилжлээ",
      description: `${match.winner.name} дараагийн тоглолтонд оролцоно`
    });
  };

  // Render connection lines
  const renderConnections = () => {
    return matches.map(match => {
      if (!match.nextMatchId) return null;
      
      const nextMatch = matches.find(m => m.id === match.nextMatchId);
      if (!nextMatch) return null;
      
      const x1 = match.position.x + 280;
      const y1 = match.position.y + 60;
      const x2 = nextMatch.position.x;
      const y2 = nextMatch.position.y + 60;
      
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
            <Button onClick={populateWithQualifiedPlayers} disabled={qualifiedPlayers.length < 4}>
              Авто шигшээ үүсгэх
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
        
        {/* Qualified Players Pool */}
        {qualifiedPlayers.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Шалгарсан тоглогчид ({qualifiedPlayers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {qualifiedPlayers.map(player => (
                <div
                  key={player.id}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm cursor-move"
                  draggable
                  onDragStart={() => setDraggedPlayer({ id: player.id, name: player.name })}
                >
                  {player.name} ({player.groupName} - {player.position})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bracket Visualization */}
      <div className="relative">
        {matches.length > 0 ? (
          <div 
            ref={containerRef}
            className="relative bg-white border rounded-lg p-6 overflow-auto"
            style={{ 
              minHeight: '800px',
              minWidth: Math.max(...matches.map(m => m.position.x)) + 350 
            }}
          >
            {/* SVG for connection lines */}
            <svg 
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {renderConnections()}
            </svg>

            {/* Match Cards */}
            {matches.map(match => (
              <div
                key={match.id}
                className={`absolute bg-white border-2 rounded-lg p-3 w-72 shadow-lg transition-all ${
                  selectedMatch === match.id ? 'border-blue-500 shadow-xl' : 'border-gray-300'
                }`}
                style={{
                  left: match.position.x,
                  top: match.position.y,
                  zIndex: 10
                }}
                onClick={() => setSelectedMatch(match.id)}
              >
                {/* Match Header */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {match.roundName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMatches(prev => prev.filter(m => m.id !== match.id));
                    }}
                    className="h-6 w-6 p-0 text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Player 1 */}
                <div 
                  className="mb-2 p-2 border border-dashed border-gray-300 rounded min-h-[40px] flex items-center"
                  onDrop={(e) => {
                    e.preventDefault();
                    handlePlayerDrop(match.id, 'player1');
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {match.player1 ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{match.player1.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateMatch(match.id, 'player1', undefined)}
                        className="h-4 w-4 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Тоглогч 1 чирэх</span>
                  )}
                </div>

                {/* VS */}
                <div className="text-center text-xs text-gray-500 mb-2">VS</div>

                {/* Player 2 */}
                <div 
                  className="mb-3 p-2 border border-dashed border-gray-300 rounded min-h-[40px] flex items-center"
                  onDrop={(e) => {
                    e.preventDefault();
                    handlePlayerDrop(match.id, 'player2');
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {match.player2 ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{match.player2.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateMatch(match.id, 'player2', undefined)}
                        className="h-4 w-4 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Тоглогч 2 чирэх</span>
                  )}
                </div>

                {/* Score Input */}
                <div className="mb-3">
                  <Input
                    placeholder="Оноо (3-1)"
                    value={match.score || ''}
                    onChange={(e) => updateMatch(match.id, 'score', e.target.value)}
                    className="text-center text-sm"
                  />
                </div>

                {/* Winner Selection */}
                <div className="mb-3">
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={match.winner?.id || ''}
                    onChange={(e) => {
                      const winnerId = e.target.value;
                      const winner = winnerId === match.player1?.id ? match.player1 :
                                   winnerId === match.player2?.id ? match.player2 : undefined;
                      updateMatch(match.id, 'winner', winner);
                    }}
                  >
                    <option value="">Ялагч сонгох</option>
                    {match.player1 && (
                      <option value={match.player1.id}>{match.player1.name}</option>
                    )}
                    {match.player2 && (
                      <option value={match.player2.id}>{match.player2.name}</option>
                    )}
                  </select>
                </div>

                {/* Advance Winner Button */}
                {match.winner && match.nextMatchId && (
                  <Button
                    onClick={() => advanceWinner(match)}
                    size="sm"
                    className="w-full text-xs"
                    variant="outline"
                  >
                    {match.winner.name} дараагийн шатанд
                  </Button>
                )}

                {/* Winner Display */}
                {match.winner && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-center">
                    <span className="text-sm font-medium text-yellow-800">
                      🏆 {match.winner.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Шигшээ тоглолт үүсгэх</h3>
            <p className="text-gray-600 mb-4">
              Дээрх "Авто шигшээ үүсгэх" товчийг дарж эхлэнэ үү
            </p>
            {qualifiedPlayers.length >= 4 && (
              <Button onClick={populateWithQualifiedPlayers}>
                {qualifiedPlayers.length} тоглогчийн шигшээ үүсгэх
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};