import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeftRight, 
  RotateCcw, 
  Save, 
  ChevronRight, 
  X, 
  AlertTriangle,
  Search,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatName } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Player {
  id: string;
  name?: string; // Make name optional
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Match {
  id: string;
  round: number;
  player1?: Player | null;
  player2?: Player | null;
  winner?: Player | null;
  score?: string;
  position: { x: number; y: number };
  nextMatchId?: string;
  sourceMatchIds?: string[];
  status?: 'scheduled' | 'started' | 'finished';
}

interface MatchEditorDrawerProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedMatch: Match) => void;
  availablePlayers?: Player[];
  allMatches?: Match[];
  tournamentId?: string;
  bestOfDefault?: 5 | 7;
}

interface SeriesOption {
  label: string;
  setsA: number;
  setsB: number;
  winner: 'A' | 'B';
}

export function MatchEditorDrawer({
  match,
  isOpen,
  onClose,
  onSave,
  availablePlayers = [],
  allMatches = [],
  tournamentId,
  bestOfDefault = 5
}: MatchEditorDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [winner, setWinner] = useState<'A' | 'B' | 'WO' | 'RET' | 'none'>('none');
  const [bestOf, setBestOf] = useState<5 | 7>(bestOfDefault);
  const [setsWonA, setSetsWonA] = useState(0);
  const [setsWonB, setSetsWonB] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Player selection states
  const [playerAOpen, setPlayerAOpen] = useState(false);
  const [playerBOpen, setPlayerBOpen] = useState(false);
  const [playerASearch, setPlayerASearch] = useState('');
  const [playerBSearch, setPlayerBSearch] = useState('');

  // Initialize form when match changes
  useEffect(() => {
    if (match) {
      setPlayerA(match.player1 || null);
      setPlayerB(match.player2 || null);

      // Parse existing result
      if (match.winner && match.score) {
        if (match.score === 'BYE') {
          setWinner('none');
        } else if (match.score.includes('W.O.')) {
          setWinner('WO');
        } else if (match.score.includes('RET')) {
          setWinner('RET');
        } else {
          setWinner(match.winner.id === match.player1?.id ? 'A' : 'B');

          // Parse series score
          const scoreParts = match.score.split('-');
          if (scoreParts.length === 2) {
            setSetsWonA(parseInt(scoreParts[0]) || 0);
            setSetsWonB(parseInt(scoreParts[1]) || 0);

            // Determine best-of from score
            const maxSets = Math.max(parseInt(scoreParts[0]) || 0, parseInt(scoreParts[1]) || 0);
            setBestOf(maxSets >= 4 ? 7 : 5);
          }
        }
      } else {
        setWinner('none');
        setSetsWonA(0);
        setSetsWonB(0);
      }
    }
  }, [match]);

  // Generate series options based on best-of
  const getSeriesOptions = (): SeriesOption[] => {
    if (bestOf === 5) {
      return [
        { label: '3-0', setsA: 3, setsB: 0, winner: 'A' },
        { label: '3-1', setsA: 3, setsB: 1, winner: 'A' },
        { label: '3-2', setsA: 3, setsB: 2, winner: 'A' },
        { label: '0-3', setsA: 0, setsB: 3, winner: 'B' },
        { label: '1-3', setsA: 1, setsB: 3, winner: 'B' },
        { label: '2-3', setsA: 2, setsB: 3, winner: 'B' },
      ];
    } else {
      return [
        { label: '4-0', setsA: 4, setsB: 0, winner: 'A' },
        { label: '4-1', setsA: 4, setsB: 1, winner: 'A' },
        { label: '4-2', setsA: 4, setsB: 2, winner: 'A' },
        { label: '4-3', setsA: 4, setsB: 3, winner: 'A' },
        { label: '0-4', setsA: 0, setsB: 4, winner: 'B' },
        { label: '1-4', setsA: 1, setsB: 4, winner: 'B' },
        { label: '2-4', setsA: 2, setsB: 4, winner: 'B' },
        { label: '3-4', setsA: 3, setsB: 4, winner: 'B' },
      ];
    }
  };

  // Validation
  const validateForm = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Player validation
    if (playerA && playerB && playerA.id === playerB.id) {
      newErrors.push('Тоглогч A ба B ижил хүн байж болохгүй');
    }

    // Check for player conflicts in same round
    if (match && playerA) {
      const sameRoundMatches = allMatches.filter(m => 
        m.id !== match.id && 
        m.round === match.round && 
        (m.player1?.id === playerA.id || m.player2?.id === playerA.id)
      );
      if (sameRoundMatches.length > 0) {
        newWarnings.push(`${playerA.name} аль хэдийн энэ тойрогт бусад матчид оролцож байна`);
      }
    }

    if (match && playerB) {
      const sameRoundMatches = allMatches.filter(m => 
        m.id !== match.id && 
        m.round === match.round && 
        (m.player1?.id === playerB.id || m.player2?.id === playerB.id)
      );
      if (sameRoundMatches.length > 0) {
        newWarnings.push(`${playerB.name} аль хэдийн энэ тойрогт бусад матчид оролцож байна`);
      }
    }

    // Result validation
    if (winner && winner !== 'WO' && winner !== 'RET') {
      const seriesOptions = getSeriesOptions();
      const currentSeries = `${setsWonA}-${setsWonB}`;
      const validOption = seriesOptions.find(opt => 
        opt.setsA === setsWonA && opt.setsB === setsWonB && opt.winner === winner
      );

      if (!validOption) {
        newErrors.push(`${currentSeries} оноо нь ${winner} тоглогчийн ялалттай зөрчилдөж байна`);
      }
    }

    return {
      isValid: newErrors.length === 0,
      errors: newErrors,
      warnings: newWarnings
    };
  };

  // Update validation when form changes
  useEffect(() => {
    const validation = validateForm();
    setErrors(validation.errors);
    setWarnings(validation.warnings);
  }, [playerA, playerB, winner, setsWonA, setsWonB, bestOf]);

  // Helper functions
  const swapPlayers = () => {
    const tempA = playerA;
    setPlayerA(playerB);
    setPlayerB(tempA);

    // Also swap winner if set
    if (winner === 'A') setWinner('B');
    else if (winner === 'B') setWinner('A');
  };

  const setBYE = (slot: 'A' | 'B') => {
    if (slot === 'A') {
      setPlayerA({ id: 'bye', name: 'BYE' });
    } else {
      setPlayerB({ id: 'bye', name: 'BYE' });
    }
  };

  const resetToSource = () => {
    if (match?.sourceMatchIds && allMatches.length > 0) {
      const sourceMatches = allMatches.filter(m => match.sourceMatchIds?.includes(m.id));
      if (sourceMatches.length >= 1 && sourceMatches[0].winner) {
        setPlayerA(sourceMatches[0].winner);
      }
      if (sourceMatches.length >= 2 && sourceMatches[1].winner) {
        setPlayerB(sourceMatches[1].winner);
      }
    }
  };

  const clearAll = () => {
    setPlayerA(null);
    setPlayerB(null);
    setWinner('none');
    setSetsWonA(0);
    setSetsWonB(0);
    setBestOf(bestOfDefault);
  };

  const handleSeriesSelect = (series: string) => {
    const option = getSeriesOptions().find(opt => opt.label === series);
    if (option) {
      setSetsWonA(option.setsA);
      setSetsWonB(option.setsB);
      setWinner(option.winner);
    }
  };

  const handleWinnerChange = (newWinner: string) => {
    setWinner(newWinner as 'A' | 'B' | 'WO' | 'RET' | 'none');

    // Auto-set series for special cases
    if (newWinner === 'WO' || newWinner === 'RET') {
      if (bestOf === 5) {
        setSetsWonA(3);
        setSetsWonB(0);
      } else {
        setSetsWonA(4);
        setSetsWonB(0);
      }
    }
  };

  // Save mutations
  const updatePlayersMutation = useMutation({
    mutationFn: async (data: { playerAId: string | null; playerBId: string | null }) => {
      const response = await fetch(`/api/matches/${match?.id}/players`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          playerAId: data.playerAId,
          playerBId: data.playerBId,
          override: true
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update players');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Players updated successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      // Force refetch tournament results
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
        queryClient.refetchQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
      }
    },
    onError: (error: any) => {
      console.error('Error updating players:', error);
    }
  });

  const updateResultMutation = useMutation({
    mutationFn: async (data: { 
      winner: 'A' | 'B' | 'WO' | 'RET'; 
      bestOf: number; 
      setsWonA: number; 
      setsWonB: number; 
    }) => {
      const response = await fetch(`/api/matches/${match?.id}/result-summary`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update result');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Result updated successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      // Force refetch tournament results
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
        queryClient.refetchQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
      }
    },
    onError: (error: any) => {
      console.error('Error updating result:', error);
    }
  });

  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Алдаа",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    try {
      let hasChanges = false;

      // Update players if changed
      const playersChanged = 
        playerA?.id !== match?.player1?.id || 
        playerB?.id !== match?.player2?.id;

      if (playersChanged) {
        console.log('Updating players:', { playerA: playerA?.name, playerB: playerB?.name });
        await updatePlayersMutation.mutateAsync({
          playerAId: playerA?.id === 'bye' ? null : playerA?.id || null,
          playerBId: playerB?.id === 'bye' ? null : playerB?.id || null,
        });
        hasChanges = true;
      }

      // Update result if set
      if (winner && winner !== 'none') {
        console.log('Updating result:', { winner, bestOf, setsWonA, setsWonB });
        await updateResultMutation.mutateAsync({
          winner: winner as 'A' | 'B' | 'WO' | 'RET',
          bestOf,
          setsWonA,
          setsWonB,
        });

        // Automatically advance winner to next match
        if (match?.nextMatchId && (winner === 'A' || winner === 'B')) {
          const winnerId = winner === 'A' ? playerA?.id : playerB?.id;
          if (winnerId) {
            const nextMatch = allMatches.find(m => m.id === match.nextMatchId);
            const currentRoundMatches = allMatches.filter(m => m.round === match.round);
            const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
            const nextPosition = matchIndex % 2 === 0 ? 'playerAId' : 'playerBId';

            const payload: any = {
              playerAId: nextMatch?.player1?.id || null,
              playerBId: nextMatch?.player2?.id || null,
            };
            payload[nextPosition] = winnerId;

            try {
              await fetch(`/api/matches/${match.nextMatchId}/players`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                body: JSON.stringify(payload),
              });
            } catch (e) {
              console.error('Failed to advance winner:', e);
            }
          }
        }
        hasChanges = true;
      }

      if (hasChanges) {
        // Force complete cache invalidation and refetch
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
        queryClient.refetchQueries({ queryKey: ['/api/tournaments'] });

        toast({
          title: "Амжилттай",
          description: "Тоглолт амжилттай шинэчлэгдлээ",
        });
        onClose();

        // Small delay then force refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Мэдээлэл",
          description: "Өөрчлөлт байхгүй байна",
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Алдаа",
        description: error.message || "Матч шинэчлэхэд алдаа гарлаа",
        variant: "destructive"
      });
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    // Find next match logic would go here
  };

  if (!match) return null;

  const filteredPlayersA = useMemo(() => {
    if (!playerASearch.trim()) return availablePlayers;
    return availablePlayers.filter(player => {
      const playerName = player.name || player.fullName || formatName(player.firstName || '', player.lastName || '');
      const playerEmail = player.email || '';
      return playerName.toLowerCase().includes(playerASearch.toLowerCase()) ||
             playerEmail.toLowerCase().includes(playerASearch.toLowerCase());
    });
  }, [availablePlayers, playerASearch]);

  const filteredPlayersB = useMemo(() => {
    if (!playerBSearch.trim()) return availablePlayers;
    return availablePlayers.filter(player => {
      const playerName = player.name || player.fullName || formatName(player.firstName || '', player.lastName || '');
      const playerEmail = player.email || '';
      return playerName.toLowerCase().includes(playerBSearch.toLowerCase()) ||
             playerEmail.toLowerCase().includes(playerBSearch.toLowerCase());
    });
  }, [availablePlayers, playerBSearch]);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-2xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <span>Матч засах</span>
            <span className="text-sm text-muted-foreground">
              {match.round} дүгээр шат
            </span>
          </DrawerTitle>
          <DrawerDescription>
            Тоглогчид болон үр дүнг өөрчлөх
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-6 space-y-6">
          {/* Players Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Тоглогчид</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player A */}
              <div className="space-y-2">
                <Label>Тоглогч A</Label>
                <Popover open={playerAOpen} onOpenChange={setPlayerAOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {playerA ? playerA.name || playerA.firstName || 'Тоглогч сонгох' : "Тоглогч сонгох"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Тоглогч хайх..." 
                        value={playerASearch}
                        onValueChange={setPlayerASearch}
                      />
                      <CommandEmpty>Тоглогч олдсонгүй</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setBYE('A');
                            setPlayerAOpen(false);
                          }}
                        >
                          BYE
                        </CommandItem>
                        {filteredPlayersA.map((player) => (
                          <CommandItem
                            key={player.id}
                            onSelect={() => {
                              setPlayerA(player);
                              setPlayerAOpen(false);
                            }}
                          >
                            {player.name || player.firstName || player.id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Player B */}
              <div className="space-y-2">
                <Label>Тоглогч B</Label>
                <Popover open={playerBOpen} onOpenChange={setPlayerBOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {playerB ? playerB.name || playerB.firstName || 'Тоглогч сонгох' : "Тоглогч сонгох"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Тоглогч хайх..." 
                        value={playerBSearch}
                        onValueChange={setPlayerBSearch}
                      />
                      <CommandEmpty>Тоглогч олдсонгүй</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setBYE('B');
                            setPlayerBOpen(false);
                          }}
                        >
                          BYE
                        </CommandItem>
                        {filteredPlayersB.map((player) => (
                          <CommandItem
                            key={player.id}
                            onSelect={() => {
                              setPlayerB(player);
                              setPlayerBOpen(false);
                            }}
                          >
                            {player.name || player.firstName || player.id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Helper Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={swapPlayers}>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Солих
              </Button>
              <Button variant="outline" size="sm" onClick={resetToSource}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Анхны байдалд буцаах
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Цэвэрлэх
              </Button>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Үр дүн</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ялагч</Label>
                <Select value={winner} onValueChange={handleWinnerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ялагч сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Тодорхойгүй</SelectItem>
                    <SelectItem value="A">Тоглогч A</SelectItem>
                    <SelectItem value="B">Тоглогч B</SelectItem>
                    <SelectItem value="WO">W.O. (Walk Over)</SelectItem>
                    <SelectItem value="RET">RET (Retired)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Best-of</Label>
                <Select value={bestOf.toString()} onValueChange={(value) => setBestOf(parseInt(value) as 5 | 7)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Best of 5</SelectItem>
                    <SelectItem value="7">Best of 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {winner && winner !== 'WO' && winner !== 'RET' && (
              <div className="space-y-2">
                <Label>Сетийн оноо</Label>
                <Select 
                  value={`${setsWonA}-${setsWonB}`} 
                  onValueChange={handleSeriesSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оноо сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSeriesOptions().map((option) => (
                      <SelectItem key={option.label} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={errors.length > 0 || updatePlayersMutation.isPending || updateResultMutation.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Хадгалах
            </Button>
            <Button 
              onClick={handleSaveAndNext}
              disabled={errors.length > 0 || updatePlayersMutation.isPending || updateResultMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Хадгалж дараагийнх
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Болих
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}