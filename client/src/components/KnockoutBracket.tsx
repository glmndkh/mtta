import React, { useState } from "react";
import "./knockout.css";
// Assuming these components are available from a UI library like shadcn/ui or similar
// For this example, we'll define placeholder components if they don't exist.
// In a real project, you would import these from your UI library.

// Placeholder for Badge component
const Badge = ({ children, variant, className }: any) => (
  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </div>
);

// Placeholder for Card component
const Card = ({ children, className }: any) => (
  <div className={`rounded-lg border p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

// Placeholder for CardContent component
const CardContent = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

// Placeholder for Trophy icon component
const Trophy = ({ className }: any) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4v2h1v5a2 2 0 002 2h4a2 2 0 002-2V6h1V4H5z"></path>
    <path d="M2.5 11.5a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-3a1.5 1.5 0 00-1.5-1.5h-2v1a.5.5 0 01-1 0v-1h-10v1a.5.5 0 01-1 0v-1H2.5z"></path>
  </svg>
);

// Placeholder for Medal icon component
const Medal = ({ className }: any) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2a6 6 0 00-6 6v1H2a1 1 0 000 2h1v4a2 2 0 002 2h7a2 2 0 002-2v-4h1a1 1 0 000-2h-3V8a6 6 0 00-6-6zM8 12a4 4 0 111.09-7.44L10 6l-1.09 1.56A4 4 0 018 12z"></path>
  </svg>
);

// Placeholder for Award icon component
const Award = ({ className }: any) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3a1 1 0 000 2h1v3.5a1.5 1.5 0 00.5 1.5l3.5 3.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5l3.5-3.5a1.5 1.5 0 00.5-1.5V5h1a1 1 0 100-2h-14z"></path>
    <path d="M10 13a3 3 0 110-6 3 3 0 010 6z"></path>
  </svg>
);


interface Player {
  id: string;
  name: string;
}

interface BracketMatch {
  id: string;
  round: number | string;
  roundName?: string;
  player1?: Player;
  player2?: Player;
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: Player;
  position?: { x: number; y: number };
}

interface KnockoutBracketProps {
  matches: BracketMatch[];
  onPlayerClick?: (playerId: string) => void;
}

function getRoundOrder(roundName: string): number {
  const roundMap: Record<string, number> = {
    "1/32 финал": 1,
    "1/16 финал": 2,
    "1/8 финал": 3,
    "Дөрөвний финал": 4,
    "Хагас финал": 5,
    "Финал": 6,
    "3-р байрын тоглолт": 7,
  };
  return roundMap[roundName] || 99;
}

function getRoundIcon(roundName: string) {
  switch (roundName) {
    case "Финал":
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case "Хагас финал":
      return <Medal className="w-4 h-4 text-gray-400" />;
    case "3-р байрын тоглолт":
      return <Award className="w-4 h-4 text-orange-500" />;
    default:
      return null;
  }
}

export function KnockoutBracket({ matches, onPlayerClick }: KnockoutBracketProps) {
  const handlePlayerClick = (id?: string) => {
    if (id && onPlayerClick) onPlayerClick(id);
  };

  // Group matches by round name and sort by round order
  const roundGroups = new Map<string, BracketMatch[]>();
  matches.forEach((match) => {
    const roundName = match.roundName || "Unknown";
    if (!roundGroups.has(roundName)) roundGroups.set(roundName, []);
    roundGroups.get(roundName)!.push(match);
  });

  const sortedRounds = Array.from(roundGroups.keys()).sort(
    (a, b) => getRoundOrder(a) - getRoundOrder(b)
  );

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
      {sortedRounds.map((roundName) => {
        const roundMatches = roundGroups.get(roundName)!;

        return (
          <div key={roundName} className="space-y-4">
            {/* Round Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {getRoundIcon(roundName)}
              <h3 className="text-xl font-bold text-white text-center">
                {roundName}
              </h3>
              {getRoundIcon(roundName)}
            </div>

            {/* Matches Grid */}
            <div className={`grid gap-4 ${
              roundName === "Финал" || roundName === "3-р байрын тоглолт" 
                ? "grid-cols-1 max-w-md mx-auto"
                : roundMatches.length <= 2 
                  ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" 
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}>
              {roundMatches.map((match, index) => {
                const [score1, score2] = match.score
                  ? match.score.split("-").map((s) => s.trim())
                  : [match.player1Score || "", match.player2Score || ""];

                const isPlayer1Winner = match.winner?.id === match.player1?.id;
                const isPlayer2Winner = match.winner?.id === match.player2?.id;

                return (
                  <Card 
                    key={match.id} 
                    className={`bg-gray-800 border-gray-700 hover:border-green-500 transition-all duration-300 ${
                      roundName === "Финал" ? "border-yellow-500 shadow-lg shadow-yellow-500/20" :
                      roundName === "3-р байрын тоглолт" ? "border-orange-500 shadow-lg shadow-orange-500/20" :
                      roundName === "Хагас финал" ? "border-gray-400 shadow-lg shadow-gray-400/20" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Match Number */}
                      <div className="text-center mb-3">
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          Тоглолт #{index + 1}
                        </Badge>
                      </div>

                      {/* Player 1 */}
                      <div 
                        className={`flex items-center justify-between p-3 rounded mb-2 cursor-pointer transition-colors ${
                          isPlayer1Winner 
                            ? "bg-green-900/50 border border-green-500" 
                            : "bg-gray-700/50 hover:bg-gray-700"
                        }`}
                        onClick={() => handlePlayerClick(match.player1?.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className={`font-medium ${isPlayer1Winner ? "text-green-400" : "text-gray-200"}`}>
                            {match.player1?.name || "TBD"}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${isPlayer1Winner ? "text-green-400" : "text-gray-400"}`}>
                          {score1 || "-"}
                        </span>
                      </div>

                      {/* VS Divider */}
                      <div className="text-center text-gray-500 text-xs font-bold mb-2">VS</div>

                      {/* Player 2 */}
                      <div 
                        className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                          isPlayer2Winner 
                            ? "bg-green-900/50 border border-green-500" 
                            : "bg-gray-700/50 hover:bg-gray-700"
                        }`}
                        onClick={() => handlePlayerClick(match.player2?.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className={`font-medium ${isPlayer2Winner ? "text-green-400" : "text-gray-200"}`}>
                            {match.player2?.name || "TBD"}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${isPlayer2Winner ? "text-green-400" : "text-gray-400"}`}>
                          {score2 || "-"}
                        </span>
                      </div>

                      {/* Winner Display */}
                      {match.winner && (
                        <div className="mt-3 pt-3 border-t border-gray-600 text-center">
                          <Badge className="bg-green-900 text-green-400 border-green-500">
                            🏆 Ялагч: {match.winner.name}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}