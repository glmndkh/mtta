import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface BracketMatch {
  id: string;
  round: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
}

interface KnockoutBracketProps {
  matches: BracketMatch[];
  onPlayerClick?: (playerId: string) => void;
  isViewOnly?: boolean;
}

export function KnockoutBracket({ 
  matches, 
  onPlayerClick, 
  isViewOnly = true 
}: KnockoutBracketProps) {
  // Group matches by round
  const matchesByRound: Record<string, BracketMatch[]> = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  // Define round order and display names
  const roundOrder = ['round16', 'quarterfinal', 'semifinal', 'final'];
  const roundDisplayNames: Record<string, string> = {
    'round16': '1/8 финал',
    'quarterfinal': 'Хорь дөрвөн',
    'semifinal': 'Хагас финал',
    'final': 'Финал'
  };

  const getRoundIcon = (round: string) => {
    switch (round) {
      case 'final':
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 'semifinal':
        return <Medal className="w-4 h-4 text-gray-600" />;
      case 'quarterfinal':
        return <Award className="w-4 h-4 text-orange-600" />;
      default:
        return <Award className="w-4 h-4 text-blue-600" />;
    }
  };

  const handlePlayerClick = (playerId?: string) => {
    if (playerId && onPlayerClick) {
      onPlayerClick(playerId);
    }
  };

  const PlayerButton = ({ 
    player, 
    isWinner = false, 
    className = "" 
  }: { 
    player?: { id: string; name: string }; 
    isWinner?: boolean;
    className?: string;
  }) => {
    if (!player) {
      return (
        <div className={`p-2 text-center text-gray-400 border border-dashed border-gray-300 rounded ${className}`}>
          TBD
        </div>
      );
    }

    return (
      <button
        onClick={() => handlePlayerClick(player.id)}
        className={`p-2 text-left border rounded transition-colors hover:bg-gray-50 ${
          isWinner 
            ? 'border-green-500 bg-green-50 font-semibold' 
            : 'border-gray-300'
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">{player.name}</span>
          {isWinner && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
              Ялагч
            </Badge>
          )}
        </div>
      </button>
    );
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Шоронтох тулаан байхгүй байна</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {roundOrder.map(round => {
        const roundMatches = matchesByRound[round];
        if (!roundMatches || roundMatches.length === 0) return null;

        return (
          <div key={round} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {getRoundIcon(round)}
              <h3 className="text-lg font-semibold">
                {roundDisplayNames[round] || round}
              </h3>
              <Badge variant="outline" className="text-xs">
                {roundMatches.length} тоглолт
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roundMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Тоглолт #{match.id.slice(-4)}
                        </Badge>
                        {match.score && (
                          <span className="text-sm font-mono text-gray-600">
                            {match.score}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <PlayerButton
                          player={match.player1}
                          isWinner={match.winner?.id === match.player1?.id}
                        />
                        
                        <div className="text-center text-gray-400 text-xs">
                          VS
                        </div>
                        
                        <PlayerButton
                          player={match.player2}
                          isWinner={match.winner?.id === match.player2?.id}
                        />
                      </div>

                      {match.winner && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Trophy className="w-3 h-3" />
                            <span className="font-medium">
                              Ялагч: {match.winner.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}