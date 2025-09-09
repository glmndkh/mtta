
import React from "react";
import "./knockout.css";

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

  const sortedRounds = Array.from(roundGroups.keys())
    .filter(round => round !== "3-р байрын тоглолт")
    .sort((a, b) => getRoundOrder(a) - getRoundOrder(b));

  // Find third place match separately
  const thirdPlaceMatches = roundGroups.get("3-р байрын тоглолт") || [];

  return (
    <div className="tournament-bracket-container">
      <div className="bracket-grid">
        {sortedRounds.map((roundName, roundIndex) => {
          const roundMatches = roundGroups.get(roundName)!;
          const isLastRound = roundIndex === sortedRounds.length - 1;

          return (
            <div key={roundName} className={`bracket-round round-${roundIndex}`}>
              <div className="round-header">
                <h3>{roundName}</h3>
              </div>

              <div className="matches-container">
                {roundMatches.map((match, matchIndex) => {
                  const [score1, score2] = match.score
                    ? match.score.split("-").map((s) => s.trim())
                    : [match.player1Score || "", match.player2Score || ""];

                  const isPlayer1Winner = match.winner?.id === match.player1?.id;
                  const isPlayer2Winner = match.winner?.id === match.player2?.id;

                  return (
                    <div 
                      key={match.id} 
                      className={`bracket-match ${isLastRound ? 'final-match' : ''}`}
                      style={{
                        '--match-index': matchIndex,
                        '--round-index': roundIndex,
                        '--total-matches': roundMatches.length
                      } as React.CSSProperties}
                    >
                      {/* Player 1 */}
                      <div 
                        className={`bracket-team team-top ${isPlayer1Winner ? 'winner' : ''}`}
                        onClick={() => handlePlayerClick(match.player1?.id)}
                      >
                        <span className="team-name">
                          {match.player1?.name || "TBD"}
                        </span>
                        <span className="team-score">{score1 || "-"}</span>
                      </div>

                      {/* Player 2 */}
                      <div 
                        className={`bracket-team team-bottom ${isPlayer2Winner ? 'winner' : ''}`}
                        onClick={() => handlePlayerClick(match.player2?.id)}
                      >
                        <span className="team-name">
                          {match.player2?.name || "TBD"}
                        </span>
                        <span className="team-score">{score2 || "-"}</span>
                      </div>

                      {/* Connecting lines to next round */}
                      {!isLastRound && (
                        <div className="bracket-connector">
                          <div className="connector-line horizontal"></div>
                          <div className="connector-line vertical"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Third Place Match - positioned below the bracket */}
      {thirdPlaceMatches.length > 0 && (
        <div className="third-place-bracket">
          <div className="round-header">
            <h3>3-р байрын тоглолт</h3>
          </div>

          {thirdPlaceMatches.map((match) => {
            const [score1, score2] = match.score
              ? match.score.split("-").map((s) => s.trim())
              : [match.player1Score || "", match.player2Score || ""];

            const isPlayer1Winner = match.winner?.id === match.player1?.id;
            const isPlayer2Winner = match.winner?.id === match.player2?.id;

            return (
              <div key={match.id} className="bracket-match third-place-match">
                <div 
                  className={`bracket-team team-top ${isPlayer1Winner ? 'winner' : ''}`}
                  onClick={() => handlePlayerClick(match.player1?.id)}
                >
                  <span className="team-name">
                    {match.player1?.name || "TBD"}
                  </span>
                  <span className="team-score">{score1 || "-"}</span>
                </div>

                <div 
                  className={`bracket-team team-bottom ${isPlayer2Winner ? 'winner' : ''}`}
                  onClick={() => handlePlayerClick(match.player2?.id)}
                >
                  <span className="team-name">
                    {match.player2?.name || "TBD"}
                  </span>
                  <span className="team-score">{score2 || "-"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
