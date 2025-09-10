import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { MatchEditorDrawer } from './MatchEditorDrawer';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  position: { x: number; y: number };
  score?: string;
  score1?: number;
  score2?: number;
  nextMatchId?: string;
  sourceMatchIds?: string[];
  status?: 'scheduled' | 'started' | 'finished';
}

interface KnockoutBracketProps {
  matches: Match[];
  title?: string;
  onMatchClick?: (match: Match) => void;
  selectedMatchId?: string;
  isAdmin?: boolean;
  onPlayerClick?: (playerId: string) => void;
  availablePlayers?: Player[];
}

export function KnockoutBracket({ 
  matches, 
  title = "Шигшээ тоглолт",
  onMatchClick,
  isAdmin = false,
  onPlayerClick,
  availablePlayers = []
}: KnockoutBracketProps) {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
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
    const matchesInRound = Math.pow(2, totalRounds - round);

    switch (matchesInRound) {
      case 1: return 'ФИНАЛ';
      case 2: return 'ХАГАС ФИНАЛ';
      case 4: return 'ДӨРӨВНИЙ ФИНАЛ';
      case 8: return '1/8 ФИНАЛ';
      case 16: return '1/16 ФИНАЛ';
      case 32: return '1/32 ФИНАЛ';
      case 64: return '1/64 ФИНАЛ';
      default: 
        if (matchesInRound > 1) {
          return `1/${matchesInRound * 2} ФИНАЛ`;
        }
        return `${matchesInRound} ТОГЛОЛТ`;
    }
  };

  const getPlayerDisplay = (player: Player | null | undefined) => {
    if (!player) return 'Тоглогч сонгох';
    if (player.name === 'BYE' || player.name === 'Lucky Draw') return '🍀 Lucky Draw';
    return player.name;
  };

  const getScoreDisplay = (score: number | undefined) => {
    return score !== undefined ? score : '-';
  };

  const [, setLocation] = useLocation();

  const openEditor = (match: Match) => {
    setEditingMatch(match);
    setIsEditorOpen(true);
  };

  const handlePlayerClick = (
    player: Player | null | undefined,
    match: Match,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (isAdmin) {
      openEditor(match);
      return;
    }
    if (!player) return;

    if (onPlayerClick) {
      onPlayerClick(player.id);
    } else {
      // Default navigation to player profile
      setLocation(`/profile/${player.id}`);
    }
  };

  const handleMatchClick = (match: Match) => {
    if (isAdmin) {
      openEditor(match);
    } else {
      onMatchClick?.(match);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingMatch(null);
  };

  const startEdit = (fieldId: string, currentValue: string) => {
    if (!isAdmin) return;
    setEditingField(fieldId);
    setEditingValue(currentValue);
  };

  const saveEdit = (matchId: string, field: string, value: string) => {
    // Here you would typically call an API to update the match
    console.log('Saving edit:', { matchId, field, value });
    setEditingField(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
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
              {[...(matchesByRound[round] ?? [])]
                .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))
                .map((match) => (
                  <div
                    key={match.id}
                    className={`match-box ${isAdmin || onMatchClick ? 'clickable' : ''} relative`}
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="match-content">
                      <div className={`player-row ${match.winner?.id === match.player1?.id ? 'winner' : ''}`}>
                        <div className="player-name">
                          {isAdmin && editingField === `${match.id}_player1` ? (
                            <Select
                              value={editingValue}
                              onValueChange={(value) => {
                                const selectedPlayer = availablePlayers.find(p => p.id === value);
                                if (selectedPlayer) {
                                  saveEdit(match.id, 'player1', selectedPlayer.name);
                                }
                              }}
                              onOpenChange={(open) => {
                                if (!open) cancelEdit();
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePlayers.map((player) => (
                                  <SelectItem key={player.id} value={player.id}>
                                    {player.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div
                              className={`${match.player1 && !isAdmin && match.player1.name !== 'BYE' ? 'player-clickable' : ''} ${isAdmin ? 'cursor-pointer hover:bg-gray-100 px-1 rounded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin) {
                                  startEdit(`${match.id}_player1`, match.player1?.name || '');
                                } else {
                                  handlePlayerClick(match.player1, match, e);
                                }
                              }}
                              title={isAdmin ? 'Тоглогч солих' : (!isAdmin && match.player1 && match.player1.name !== 'BYE' ? 'Тоглогчийн профайл харах' : undefined)}
                            >
                              {getPlayerDisplay(match.player1)}
                            </div>
                          )}
                        </div>
                        <div className="player-score">
                          {isAdmin && editingField === `${match.id}_score1` ? (
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => saveEdit(match.id, 'score1', editingValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveEdit(match.id, 'score1', editingValue);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              className="w-12 h-6 text-xs text-center"
                              autoFocus
                            />
                          ) : (
                            <div
                              className={`${isAdmin ? 'cursor-pointer hover:bg-gray-100 px-1 rounded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin && match.player1?.name !== 'BYE' && match.player2?.name !== 'BYE') {
                                  startEdit(`${match.id}_score1`, String(match.score1 || 0));
                                }
                              }}
                              title={isAdmin ? 'Оноо засах' : undefined}
                            >
                              {(match.player1?.name === 'BYE' || match.player2?.name === 'BYE') ? '3' : getScoreDisplay(match.score1)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="vs-divider">
                        {(match.player1?.name === 'BYE' || match.player2?.name === 'BYE') ? '🍀' : 'VS'}
                      </div>

                      <div className={`player-row ${match.winner?.id === match.player2?.id ? 'winner' : ''}`}>
                        <div className="player-name">
                          {isAdmin && editingField === `${match.id}_player2` ? (
                            <Select
                              value={editingValue}
                              onValueChange={(value) => {
                                const selectedPlayer = availablePlayers.find(p => p.id === value);
                                if (selectedPlayer) {
                                  saveEdit(match.id, 'player2', selectedPlayer.name);
                                }
                              }}
                              onOpenChange={(open) => {
                                if (!open) cancelEdit();
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePlayers.map((player) => (
                                  <SelectItem key={player.id} value={player.id}>
                                    {player.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div
                              className={`${match.player2 && !isAdmin && match.player2.name !== 'BYE' ? 'player-clickable' : ''} ${isAdmin ? 'cursor-pointer hover:bg-gray-100 px-1 rounded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin) {
                                  startEdit(`${match.id}_player2`, match.player2?.name || '');
                                } else {
                                  handlePlayerClick(match.player2, match, e);
                                }
                              }}
                              title={isAdmin ? 'Тоглогч солих' : (!isAdmin && match.player2 && match.player2.name !== 'BYE' ? 'Тоглогчийн профайл харах' : undefined)}
                            >
                              {getPlayerDisplay(match.player2)}
                            </div>
                          )}
                        </div>
                        <div className="player-score">
                          {isAdmin && editingField === `${match.id}_score2` ? (
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => saveEdit(match.id, 'score2', editingValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveEdit(match.id, 'score2', editingValue);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              className="w-12 h-6 text-xs text-center"
                              autoFocus
                            />
                          ) : (
                            <div
                              className={`${isAdmin ? 'cursor-pointer hover:bg-gray-100 px-1 rounded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin && match.player1?.name !== 'BYE' && match.player2?.name !== 'BYE') {
                                  startEdit(`${match.id}_score2`, String(match.score2 || 0));
                                }
                              }}
                              title={isAdmin ? 'Оноо засах' : undefined}
                            >
                              {(match.player1?.name === 'BYE' || match.player2?.name === 'BYE') ? '0' : getScoreDisplay(match.score2)}
                            </div>
                          )}
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

      {/* Match Editor Drawer */}
      <MatchEditorDrawer
        match={editingMatch}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        availablePlayers={availablePlayers}
        allMatches={matches}
        bestOfDefault={5}
      />
    </div>
  );
};

export default KnockoutBracket;