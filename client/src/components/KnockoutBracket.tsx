import React from 'react';
import './knockout.css';

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  player1?: Player | null;
  player2?: Player | null;
  winner?: Player | null;
  round: number;
  position: number;
  score1?: number;
  score2?: number;
}

interface KnockoutBracketProps {
  matches: Match[];
  title?: string;
  onMatchClick?: (match: Match) => void;
}

export function KnockoutBracket({ 
  matches, 
  title = "Шигшээ тоглолт",
  onMatchClick 
}: KnockoutBracketProps) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundTitle = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'ФИНАЛ';
    if (round === totalRounds - 1) return 'ХАГАС ФИНАЛ';
    if (round === totalRounds - 2) return 'ДӨРӨВНИЙ ФИНАЛ';
    if (round === totalRounds - 3) return '1/8 ФИНАЛ';
    if (round === totalRounds - 4) return '1/16 ФИНАЛ';
    if (round === totalRounds - 5) return '1/32 ФИНАЛ';
    return `1/${Math.pow(2, totalRounds - round + 1)} ФИНАЛ`;
  };

  const getPlayerDisplay = (player: Player | null | undefined) => {
    if (!player) return 'Тоглогч сонгох';
    return player.name;
  };

  const getScoreDisplay = (score: number | undefined) => {
    return score !== undefined ? score : '-';
  };

  return (
    <div className="knockout-tournament">
      <div className="tournament-header">
        <h2>{title}</h2>
      </div>

      <div className="bracket-container">
        {rounds.map((round) => (
          <div key={round} className="round-column">
            <div className="round-header">
              <h3>{getRoundTitle(round, rounds.length)}</h3>
            </div>

            <div className="matches-container">
              {matchesByRound[round]
                .sort((a, b) => a.position - b.position)
                .map((match) => (
                  <div 
                    key={match.id} 
                    className={`match-box ${onMatchClick ? 'clickable' : ''}`}
                    onClick={() => onMatchClick?.(match)}
                  >
                    <div className="match-content">
                      <div className={`player-row ${match.winner?.id === match.player1?.id ? 'winner' : ''}`}>
                        <div className="player-name">
                          {getPlayerDisplay(match.player1)}
                        </div>
                        <div className="player-score">
                          {getScoreDisplay(match.score1)}
                        </div>
                      </div>

                      <div className="vs-divider">VS</div>

                      <div className={`player-row ${match.winner?.id === match.player2?.id ? 'winner' : ''}`}>
                        <div className="player-name">
                          {getPlayerDisplay(match.player2)}
                        </div>
                        <div className="player-score">
                          {getScoreDisplay(match.score2)}
                        </div>
                      </div>
                    </div>

                    {round < rounds.length && (
                      <div className="connector-line"></div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnockoutBracket;