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

  // Generate standard tournament bracket structure with proper spacing to prevent overlap
  const generateBracket = useCallback((playerCount: number) => {
    const rounds = Math.ceil(Math.log2(playerCount));
    const newMatches: Match[] = [];
    
    // Calculate positions for each round with much better spacing to prevent overlap
    const MATCH_HEIGHT = 120; // Increased height for proper spacing between boxes
    const ROUND_WIDTH = 280; // Increased width for better separation
    const START_Y = 50; // More top margin
    
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      const roundName = getRoundName(matchesInRound);
      
      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        // Much larger spacing to completely prevent overlap
        const ySpacing = Math.pow(2, round - 1) * MATCH_HEIGHT + (round * 50); // Much more progressive spacing
        const yOffset = START_Y + matchIndex * ySpacing;
        
        const match: Match = {
          id: `match_${round}_${matchIndex}`,
          round,
          roundName,
          position: {
            x: (round - 1) * ROUND_WIDTH + 40,
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

  // Handle manual player selection from dropdown
  const handlePlayerSelect = (matchId: string, position: 'player1' | 'player2', playerId: string) => {
    let selectedPlayer: Player | undefined;
    
    if (playerId === 'lucky_draw') {
      selectedPlayer = { id: 'lucky_draw', name: 'Lucky draw' };
    } else {
      const user = users.find(u => u.id === playerId);
      if (user) {
        selectedPlayer = { 
          id: user.id, 
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() 
        };
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
      
      const x1 = match.position.x + 224; // Match box width
      const y1 = match.position.y + 60; // Center of match box
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
        
        {/* Qualified Players Info (for reference only) */}
        {qualifiedPlayers.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Шалгарсан тоглогчид ({qualifiedPlayers.length})</h4>
            <p className="text-sm text-gray-600">
              Админ доорх талбаруудаас тоглогчдыг гараар сонгоно уу
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {qualifiedPlayers.map((player, index) => (
                <span key={player.id}>
                  {player.name} ({player.groupName})
                  {index < qualifiedPlayers.length - 1 ? ', ' : ''}
                </span>
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
              minHeight: '1200px',
              minWidth: '1600px'
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

            {/* Compact Match Cards */}
            {matches.map(match => (
              <div
                key={match.id}
                className="absolute bg-white border-2 border-gray-300 rounded-lg p-2 w-56 shadow-md hover:shadow-lg transition-shadow"
                style={{
                  left: match.position.x,
                  top: match.position.y,
                  zIndex: 10
                }}
              >
                {/* Match Header */}
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {match.roundName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMatches(prev => prev.filter(m => m.id !== match.id))}
                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Player 1 Selection */}
                <div className="mb-2">
                  <select
                    className="w-full p-1 border rounded text-xs"
                    value={match.player1?.id || ''}
                    onChange={(e) => handlePlayerSelect(match.id, 'player1', e.target.value)}
                  >
                    <option value="">Тоглогч 1 сонгох</option>
                    <option value="lucky_draw">Lucky draw</option>
                    {users.map(user => (
                      <option key={`${match.id}-p1-${user.id}`} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VS Divider */}
                <div className="text-center text-xs text-gray-400 my-1">VS</div>

                {/* Player 2 Selection */}
                <div className="mb-2">
                  <select
                    className="w-full p-1 border rounded text-xs"
                    value={match.player2?.id || ''}
                    onChange={(e) => handlePlayerSelect(match.id, 'player2', e.target.value)}
                  >
                    <option value="">Тоглогч 2 сонгох</option>
                    <option value="lucky_draw">Lucky draw</option>
                    {users.map(user => (
                      <option key={`${match.id}-p2-${user.id}`} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score and Winner Row */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <Input
                    placeholder="Оноо"
                    value={match.score || ''}
                    onChange={(e) => updateMatch(match.id, 'score', e.target.value)}
                    className="text-center text-xs h-7"
                  />
                  <select
                    className="w-full p-1 border rounded text-xs h-7"
                    value={match.winner?.id || ''}
                    onChange={(e) => {
                      const winnerId = e.target.value;
                      const winner = winnerId === match.player1?.id ? match.player1 :
                                   winnerId === match.player2?.id ? match.player2 : undefined;
                      updateMatch(match.id, 'winner', winner);
                    }}
                  >
                    <option value="">Ялагч</option>
                    {match.player1 && (
                      <option value={match.player1.id}>
                        {match.player1.name.length > 10 ? 
                          match.player1.name.substring(0, 10) + '...' : 
                          match.player1.name}
                      </option>
                    )}
                    {match.player2 && (
                      <option value={match.player2.id}>
                        {match.player2.name.length > 10 ? 
                          match.player2.name.substring(0, 10) + '...' : 
                          match.player2.name}
                      </option>
                    )}
                  </select>
                </div>

                {/* Winner Badge */}
                {match.winner && (
                  <div className="text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      🏆 {match.winner.name.length > 12 ? 
                           match.winner.name.substring(0, 12) + '...' : 
                           match.winner.name}
                    </span>
                  </div>
                )}

                {/* Advance Winner Button */}
                {match.winner && match.nextMatchId && (
                  <Button
                    onClick={() => advanceWinner(match)}
                    size="sm"
                    className="w-full text-xs mt-1 h-6"
                    variant="outline"
                  >
                    Дараагийн шат
                  </Button>
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