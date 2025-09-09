import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target, Download, Upload, FileSpreadsheet, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { KnockoutBracketEditor } from "@/components/KnockoutBracketEditor";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import type { Tournament, TournamentResults, TournamentParticipant, User } from "@shared/schema";
import * as XLSX from 'xlsx';


// Types for Excel-style tournament result editing
// Excel-style group stage table - represents round-robin within a group
interface GroupStageTable {
  groupName: string;
  players: Array<{
    id: string;
    playerId?: string; // For participants without a direct user ID
    name: string;
    club: string;
    wins?: string;
    position?: string;
  }>;
  // Matrix of results [player1Index][player2Index] = score (e.g., "3-1")
  resultMatrix: string[][];
  // Calculated standings
  standings: Array<{
    position: number;
    playerId: string;
    playerName: string;
    club: string;
    wins: number;
    losses: number;
    totalMatches: number;
    points: number;
  }>;
}

interface KnockoutMatch {
  id: string;
  round: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
}

interface QualifiedPlayer {
  id: string;
  name: string;
  groupName: string;
  position: number;
}

interface FinalRanking {
  position: number;
  playerId: string;
  playerName: string;
  prize?: string;
}

interface TournamentResultsData {
  groupStage?: GroupStageTable[];
  knockoutMatches?: KnockoutMatch[];
  finalRankings?: FinalRanking[];
}

export default function AdminTournamentResultsPage() {
  const [match, params] = useRoute("/admin/tournament/:id/results/:type?");
  const [fallbackMatch] = useRoute("/admin/tournament-results");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for editing
  const [groupStageTables, setGroupStageTables] = useState<GroupStageTable[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  // Track which bracket match is selected to sync bracket view and editor
  const [selectedBracketMatchId, setSelectedBracketMatchId] = useState<string | null>(null);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [customParticipationTypes, setCustomParticipationTypes] = useState<string[]>([]);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(''); // State to hold selected player ID for adding to group
  const [participationType, setParticipationType] = useState<string | undefined>(undefined);


  // Check if we have a tournament ID, if not show tournament selection
  const tournamentId = params?.id;
  const isOnFallbackRoute = fallbackMatch && !tournamentId;

  // Fetch all tournaments for selection page
  const { data: allTournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    enabled: isOnFallbackRoute,
  });

  // Fetch tournament data
  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', tournamentId],
    enabled: !!tournamentId,
  });

  // Fetch tournament participants
  const { data: participantsData = [], error: participantsError } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    enabled: !!tournamentId,
    retry: 1,
  });
  const participants = participationType
    ? participantsData.filter(p => p.participationType === participationType)
    : participantsData;
  const allParticipationTypes = tournament?.participationTypes || [];

  // Filter out doubles and mixed categories for results entry
  const filteredParticipationTypes = allParticipationTypes.filter((type) => {
    const lowerType = type.toLowerCase();
    return !lowerType.includes('хос') && 
           !lowerType.includes('doubles') && 
           !lowerType.includes('mixed') &&
           !lowerType.includes('холимог');
  });

  // Initialize with first filtered type if available
  useEffect(() => {
    if (filteredParticipationTypes.length > 0 && !participationType) {
      setParticipationType(filteredParticipationTypes[0]);
    }
  }, [filteredParticipationTypes, participationType]);

  // Fetch existing results
  const { data: existingResults, error: resultsError } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', tournamentId, 'results'],
    enabled: !!tournamentId,
    retry: 1,
  });

  // Fetch all users for autocomplete
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!tournamentId && user?.role === 'admin',
  });

  const handleAddCategory = () => {
    const category = newCategory.trim();
    if (!category) return;
    if (allParticipationTypes.includes(category)) {
      toast({
        title: "Ангилал давхцаж байна",
        description: "Энэ ангилал аль хэдийн нэмэгдсэн байна",
        variant: "destructive",
      });
      return;
    }
    const players = participantsData
      .filter(p => p.participationType === category)
      .map(p => ({
        id: p.id, // Use participant's ID directly
        playerId: p.id, // Store playerId for consistency
        name: `${(p as any).firstName || ''} ${(p as any).lastName || ''}`.trim(),
        club: (p as any).club || '',
      }));
    const groupTable: GroupStageTable = {
      groupName: 'Групп 1',
      players,
      resultMatrix: Array(players.length)
        .fill(null)
        .map(() => Array(players.length).fill('')),
      standings: [],
    };
    const knockout: KnockoutMatch[] = [];
    for (let i = 0; i < players.length; i += 2) {
      knockout.push({
        id: `match_${i / 2 + 1}`,
        round: 'quarterfinal',
        player1: players[i],
        player2: players[i + 1],
        position: { x: 0, y: i / 2 },
      });
    }
    setGroupStageTables([groupTable]);
    setKnockoutMatches(knockout);
    setFinalRankings([]);
    setCustomParticipationTypes(prev => [...prev, category]);
    setLocation(`/admin/tournament/${tournamentId}/results/${category}`);
    setAddCategoryOpen(false);
    setNewCategory('');
  };

  // Redirect to first participation type if none specified
  useEffect(() => {
    if (tournament && !participationType && tournament.participationTypes?.length) {
      const firstType = tournament.participationTypes[0];
      setLocation(`/admin/tournament/${tournamentId}/results/${firstType}`, { replace: true });
    }
  }, [tournament, participationType, tournamentId, setLocation]);

  // Load existing results into state
  useEffect(() => {
    if (existingResults && participationType) {
      const groupResults = (existingResults.groupStageResults as Record<string, GroupStageTable[]> || {})[participationType] || [];
      setGroupStageTables(groupResults);
      const knockoutResultsByType = (existingResults.knockoutResults as Record<string, KnockoutMatch[]> || {})[participationType] || [];
      setKnockoutMatches(knockoutResultsByType);

      // Load final rankings or calculate from knockout matches if missing
      const savedRankings = (existingResults.finalRankings as Record<string, FinalRanking[]> || {})[participationType] || [];
      if (savedRankings.length > 0) {
        setFinalRankings(savedRankings);
      } else {
        // Calculate from knockout matches if no rankings saved
        const knockoutResults = knockoutResultsByType;
        const calculatedRankings: FinalRanking[] = [];

        console.log('Loading existing knockout results:', knockoutResults);
        console.log('Available rounds:', knockoutResults.map(m => m.round));

        // Look for final match - stored semifinals are actually the finals in this tournament structure
        let finalMatch = knockoutResults.find(m => 
          m.round === 'final' || 
          m.round === 3 || 
          (m as any).roundName === 'Финал'
        );

        // If no final match found, look in stored semifinals (which are actually finals)
        if (!finalMatch) {
          const storedSemifinals = knockoutResults.filter(m => m.round === 'semifinal');
          console.log('Found stored semifinals (actually finals):', storedSemifinals);

          // Filter out 3rd place playoff and find the actual final
          const actualFinals = storedSemifinals.filter(m => m.id !== 'third_place_playoff');

          if (actualFinals.length >= 1 && actualFinals[0]?.winner) {
            // Use the first actual final match directly
            finalMatch = actualFinals[0];
            console.log('Using stored semifinal as final match:', finalMatch);
          }
        }

        console.log('Found/created final match:', finalMatch);

        if (finalMatch?.winner && finalMatch.player1 && finalMatch.player2) {
          calculatedRankings.push({
            position: 1,
            playerId: finalMatch.winner.id,
            playerName: finalMatch.winner.name
          });

          const finalLoser = finalMatch.player1.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
          calculatedRankings.push({
            position: 2,
            playerId: finalLoser.id,
            playerName: finalLoser.name
          });

          console.log('Existing final - Winner:', finalMatch.winner.name, 'Loser:', finalLoser.name);
        }

        const thirdPlaceMatch = knockoutResults.find(m => m.id === 'third_place_playoff');
        console.log('Found existing 3rd place match:', thirdPlaceMatch);

        if (thirdPlaceMatch?.winner) {
          calculatedRankings.push({
            position: 3,
            playerId: thirdPlaceMatch.winner.id,
            playerName: thirdPlaceMatch.winner.name
          });

          console.log('Existing 3rd place winner:', thirdPlaceMatch.winner.name);
        }

        console.log('Calculated rankings from existing data:', calculatedRankings);

        setFinalRankings(calculatedRankings);
      }

      setIsPublished(existingResults.isPublished || false);
    }
  }, [existingResults, participationType]);

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      if (!tournamentId || !participationType) return;
      const resultsData = {
        tournamentId: tournamentId,
        participationType,
        groupStageResults: groupStageTables,
        knockoutResults: knockoutMatches,
        finalRankings: finalRankings,
        isPublished: isPublished,
      };

      const response = await fetch('/api/admin/tournament-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultsData),
      });

      if (!response.ok) {
        throw new Error('Failed to save results');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: "Тэмцээний үр дүн амжилттай шинэчлэгдлээ",
      });
      // Refresh tournament info and results views
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
    },
    onError: () => {
      toast({
        title: "Алдаа гарлаа",
        description: "Үр дүн хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Check if user is admin
  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Хандах эрхгүй</h1>
          <p className="text-text-secondary mb-4">Зөвхөн админ хэрэглэгч энэ хуудсыг харах боломжтой.</p>
          <Button 
            onClick={() => setLocation('/tournaments')}
            variant="outline"
          >
            Тэмцээний хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  // Show tournament selection when no tournament ID is provided
  if (isOnFallbackRoute) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/tournaments')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Буцах
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Тэмцээний үр дүн оруулах</h1>
                  <p className="text-sm text-text-secondary">Тэмцээн сонгоод үр дүн оруулна уу</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/admin/tournament/${tournament.id}/results`)}>
                <CardHeader>
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  <CardDescription>{tournament.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Статус:</span>
                      <Badge className={
                        tournament.status === 'registration' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-secondary text-text-primary'
                      }>
                        {tournament.status === 'registration' ? 'Бүртгэл' : 
                         tournament.status === 'ongoing' ? 'Болж байна' : 'Дууссан'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Байршил:</span>
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Огноо:</span>
                      <span>{new Date(tournament.startDate).toLocaleDateString('mn-MN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Тэмцээний мэдээлэл ачаалж байна...</p>
          {tournamentId && (
            <p className="text-xs text-text-secondary mt-2">Tournament ID: {tournamentId}</p>
          )}
        </div>
      </div>
    );
  }

  if (tournamentError || (!tournamentLoading && !tournament)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Тэмцээн олдсонгүй</h1>
          <p className="text-text-secondary mb-4">
            {tournamentError ? 'Тэмцээн ачаалахад алдаа гарлаа' : 'Энэ ID-тай тэмцээн олдсонгүй'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => setLocation('/admin/tournaments')}
              variant="outline"
            >
              Тэмцээний жагсаалт руу буцах
            </Button>
            <Button 
              onClick={() => setLocation('/admin/tournament-results')}
              variant="outline"
            >
              Тэмцээн сонгох
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions for group stage
  const addGroupTable = () => {
    const newTable: GroupStageTable = {
      groupName: `Групп ${groupStageTables.length + 1}`,
      players: [],
      resultMatrix: [],
      standings: [],
    };
    setGroupStageTables([...groupStageTables, newTable]);
  };

  const removeGroupTable = (index: number) => {
    const updatedTables = groupStageTables.filter((_, i) => i !== index);
    setGroupStageTables(updatedTables);

    // Force re-render to update available players
    setTimeout(() => {
      // This will trigger a re-calculation of available players
      setGroupStageTables([...updatedTables]);
    }, 0);
  };

  const updateGroupName = (index: number, name: string) => {
    const updated = [...groupStageTables];
    updated[index].groupName = name;
    setGroupStageTables(updated);
  };

  // Helper function to get all players already in groups
  const getAllPlayersInGroups = (): string[] => {
    const playerIds: string[] = [];
    groupStageTables.forEach(group => {
      group.players.forEach(player => {
        // Add both id and playerId to avoid duplicates
        if (player.id) playerIds.push(player.id);
        if (player.playerId && player.playerId !== player.id) {
          playerIds.push(player.playerId);
        }
      });
    });
    return playerIds;
  };

  // Function to remove a player from a group
  const removePlayerFromGroup = (groupIndex: number, playerIndex: number) => {
    const updated = [...groupStageTables];
    updated[groupIndex].players.splice(playerIndex, 1);

    // Rebuild result matrix with new player count
    const playerCount = updated[groupIndex].players.length;
    updated[groupIndex].resultMatrix = Array(playerCount).fill(null).map(() => 
      Array(playerCount).fill('')
    );

    // Recalculate standings
    calculateGroupStandings(updated[groupIndex]);
    setGroupStageTables(updated);
  };

  const addPlayerToGroup = (tableIndex: number, player: { id: string; playerId?: string; name: string; club: string; wins?: number; losses?: number; points?: number }) => {
    const updated = [...groupStageTables];

    // Ensure we're adding to the correct table
    if (updated[tableIndex]) {
      updated[tableIndex].players.push({
        id: player.id || player.playerId || '', // Use provided ID or playerId
        name: player.name,
        club: player.club,
        wins: String(player.wins || ''), // Convert numbers back to string for UI
        position: String(player.position || '')
      });

      // Expand result matrix
      const playerCount = updated[tableIndex].players.length;
      // Ensure resultMatrix is properly sized
      updated[tableIndex].resultMatrix = Array(playerCount).fill(null).map((_, rowIndex) => 
        Array(playerCount).fill('').map((_, colIndex) => {
          // Preserve existing results if possible when adding new player
          if (rowIndex < (updated[tableIndex].resultMatrix.length || 0) && 
              colIndex < (updated[tableIndex].resultMatrix[rowIndex]?.length || 0)) {
            return updated[tableIndex].resultMatrix[rowIndex][colIndex];
          }
          return '';
        })
      );

      setGroupStageTables(updated);
    }
  };

  const updateMatchResult = (groupIndex: number, player1Index: number, player2Index: number, score: string) => {
    const updated = [...groupStageTables];
    // Ensure the score is updated correctly
    if (updated[groupIndex] && updated[groupIndex].resultMatrix) {
      updated[groupIndex].resultMatrix[player1Index][player2Index] = score;

      // Calculate standings
      calculateGroupStandings(updated[groupIndex]);
      setGroupStageTables(updated);
    }
  };

  const calculateGroupStandings = (group: GroupStageTable) => {
    const standings = group.players.map((player, playerIndex) => {
      let wins = 0;
      let losses = 0;
      let totalMatches = 0;

      // Check results against other players
      for (let opponentIndex = 0; opponentIndex < group.players.length; opponentIndex++) {
        if (playerIndex !== opponentIndex) {
          const result = group.resultMatrix[playerIndex]?.[opponentIndex];
          if (result && result.trim() !== '' && result.includes('-')) {
            const parts = result.split('-');
            if (parts.length === 2) {
              const playerScore = parseInt(parts[0].trim());
              const opponentScore = parseInt(parts[1].trim());
              if (!isNaN(playerScore) && !isNaN(opponentScore)) {
                totalMatches++;
                if (playerScore > opponentScore) {
                  wins++;
                } else if (playerScore < opponentScore) {
                  losses++;
                }
                // If playerScore === opponentScore, it's a draw
              }
            }
          }
        }
      }

      return {
        position: 0, // Will be calculated after sorting
        playerId: player.id,
        playerName: player.name,
        club: player.club,
        wins,
        losses,
        totalMatches,
        points: wins * 2 + (totalMatches - wins - losses), // 2 points for win, 1 for draw
      };
    });

    // Sort by wins first (descending), then by total matches
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalMatches - a.totalMatches;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    group.standings = standings;
  };

  // Recalculate standings helper function
  const recalculateStandings = (group: GroupStageTable) => {
    calculateGroupStandings(group);
  };

  // Get qualified players from group stage (positions 1 and 2 from each group)
  const getQualifiedPlayers = (): QualifiedPlayer[] => {
    const qualified: QualifiedPlayer[] = [];

    groupStageTables.forEach(group => {
      if (group.players && group.players.length > 0) {
        // Look at the manually entered position values in the "Байр" column
        group.players.forEach(player => {
          const position = parseInt(String(player.position || ''), 10);

          // Only include players with positions 1 or 2
          if (position === 1 || position === 2) {
            qualified.push({
              id: player.id,
              name: player.name,
              groupName: group.groupName,
              position: position
            });
          }
        });
      }
    });

    return qualified;
  };

  // Helper function to get readable display label for participation type
  const getCategoryLabel = (type: string): string => {
    try {
      const parsed = JSON.parse(type);

      if (parsed.minAge !== undefined || parsed.maxAge !== undefined) {
        const genderLabel = parsed.gender === 'female' ? 'Эмэгтэй' : 'Эрэгтэй';

        if (parsed.minAge !== undefined && parsed.maxAge !== undefined) {
          return `${parsed.minAge}-${parsed.maxAge} нас ${genderLabel}`;
        } else if (parsed.minAge !== undefined) {
          return `${parsed.minAge}+ нас ${genderLabel}`;
        } else if (parsed.maxAge !== undefined) {
          return `${parsed.maxAge} хүртэл ${genderLabel}`;
        }
      }

      // Fallback to legacy labels (only for singles/individual categories)
      const labels: Record<string, string> = {
        'singles_men': 'Эрэгтэй дан',
        'singles_women': 'Эмэгтэй дан',
        'singles': 'Дан',
        'team': 'Баг',
        'individual': 'Хувь хүн'
      };
      return labels[parsed.category || type] || type;
    } catch {
      return type;
    }
  };

  // Helper functions for final rankings
  const addRanking = () => {
    const newRanking: FinalRanking = {
      position: finalRankings.length + 1,
      playerId: '',
      playerName: '',
      prize: '',
    };
    setFinalRankings([...finalRankings, newRanking]);
  };

  const updateRanking = (index: number, field: string, value: any) => {
    const updated = [...finalRankings];
    (updated[index] as any)[field] = value;
    setFinalRankings(updated);
  };

  const removeRanking = (index: number) => {
    setFinalRankings(finalRankings.filter((_, i) => i !== index));
  };

  // Excel Import/Export Functions
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Export Knockout Matches
    if (knockoutMatches.length > 0) {
      const knockoutData = knockoutMatches.map(match => ({
        'Шат': match.round,
        'Тоглогч 1': match.player1?.name || '',
        'Тоглогч 2': match.player2?.name || '',
        'Оноо': match.score || '',
        'Ялагч': match.winner?.name || ''
      }));
      const ws1 = XLSX.utils.json_to_sheet(knockoutData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Шигшээ тоглолт');
    }

    // Export Group Stage Results
    if (groupStageTables.length > 0) {
      groupStageTables.forEach((group, index) => {
        const groupData = group.players.map((player, playerIndex) => {
          const rowData: any = {
            '№': playerIndex + 1,
            'Нэрс': player.name,
            'Клуб': player.club,
            'Өгсөн': player.wins || '',
            'Байр': player.position || ''
          };

          // Add match results columns
          group.players.forEach((opponent, opponentIndex) => {
            if (playerIndex !== opponentIndex) {
              rowData[`vs ${opponent.name}`] = group.resultMatrix[playerIndex]?.[opponentIndex] || '';
            }
          });

          return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(groupData);
        XLSX.utils.book_append_sheet(wb, ws, `${group.groupName || `Групп ${index + 1}`}`);
      });
    }

    // Export Final Rankings
    if (finalRankings.length > 0) {
      const rankingData = finalRankings.map(ranking => ({
        'Байр': ranking.position,
        'Тоглогч': ranking.playerName,
        'Шагнал': ranking.prize || ''
      }));
      const ws3 = XLSX.utils.json_to_sheet(rankingData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Эцсийн байр');
    }

    // Save file
    const fileName = `${tournament?.name || 'Tournament'}_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast({
      title: "Excel файл экспорт хийгдлээ",
      description: `${fileName} файл татагдлаа`,
    });
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Import knockout matches from "Шигшээ тоглолт" sheet
        if (workbook.SheetNames.includes('Шигшээ тоглолт')) {
          const worksheet = workbook.Sheets['Шигшээ тоглолт'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const importedMatches: KnockoutMatch[] = jsonData.map((row: any, index) => ({
            id: `imported_${Date.now()}_${index}`,
            round: row['Шат'] || 'quarterfinal',
            player1: row['Тоглогч 1'] ? { id: `temp_${Date.now()}_1_${index}`, name: row['Тоглогч 1'] } : undefined,
            player2: row['Тоглогч 2'] ? { id: `temp_${Date.now()}_2_${index}`, name: row['Тоглогч 2'] } : undefined,
            score: row['Оноо'] || '',
            winner: row['Ялагч'] ? { id: `temp_${Date.now()}_w_${index}`, name: row['Ялагч'] } : undefined,
            position: { x: index * 200, y: index * 100 }
          }));

          setKnockoutMatches(prev => [...prev, ...importedMatches]);
        }

        toast({
          title: "Excel файл импорт хийгдлээ",
          description: "Өгөгдөл амжилттай уншигдлаа",
        });

      } catch (error) {
        console.error('Excel import error:', error);
        toast({
          title: "Алдаа гарлаа",
          description: "Excel файл уншихад алдаа гарлаа",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input
    event.target.value = '';
  };

  // Function to generate a bracket structure
  const generateBracket = (numPlayers: number): KnockoutMatch[] => {
    const matches: KnockoutMatch[] = [];
    let currentRoundMatches = numPlayers;
    let currentRound = 1;
    let xOffset = 0;

    // Ensure number of players is a power of 2 for simplicity, pad with byes if necessary
    // For now, we'll assume the KnockoutBracketEditor handles non-power-of-2,
    // but a more robust solution would pad with 'Bye' players.

    // Simplified bracket generation: Assume 4 players for initial bracket
    if (numPlayers === 4) {
      matches.push(
        { id: 'match_1', round: 'quarterfinal', player1: undefined, player2: undefined, position: { x: 0, y: 0 } },
        { id: 'match_2', round: 'quarterfinal', player1: undefined, player2: undefined, position: { x: 0, y: 1 } },
        { id: 'match_3', round: 'semifinal', player1: undefined, player2: undefined, position: { x: 200, y: 0.5 } }, // Positioned between match 1 and 2
        { id: 'third_place_playoff', round: 'semifinal', player1: undefined, player2: undefined, position: { x: 200, y: 1.5 } }, // Positioned below semifinal
        { id: 'match_4', round: 'final', player1: undefined, player2: undefined, position: { x: 400, y: 1 } } // Positioned after semifinal
      );
    } else {
      // For other numbers of players, a more complex algorithm is needed.
      // This placeholder just creates a single final match.
      matches.push(
        { id: 'match_final_placeholder', round: 'final', player1: undefined, player2: undefined, position: { x: 200, y: 1 } }
      );
      console.warn(`Bracket generation for ${numPlayers} players is simplified. A full implementation would handle padding and dynamic round generation.`);
    }

    return matches;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/tournaments')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Буцах
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {tournament.name} - Үр дүн оруулах
                </h1>
                <p className="text-text-secondary">
                  Тэмцээний үр дүнг оруулж, нийтлэх
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Нийтэд харуулах
                </label>
              </div>
              <Button
                onClick={() => saveResultsMutation.mutate()}
                disabled={saveResultsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveResultsMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {allParticipationTypes.length > 0 ? (
          <>
            <div className="flex items-center mb-6">
              <Tabs
                value={participationType}
                onValueChange={setParticipationType}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-1 lg:grid-cols-4 gap-2">
                  {filteredParticipationTypes.map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="text-sm font-medium px-4 py-2"
                    >
                      {getCategoryLabel(type)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={() => setAddCategoryOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Tabs defaultValue="knockout" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="knockout">Шигшээ тоглолт</TabsTrigger>
                <TabsTrigger value="groups">Хэсгийн тоглолт</TabsTrigger>
              </TabsList>



              {/* Knockout Editor */}
          <TabsContent value="knockout">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Шигшээ тоглолтууд</CardTitle>
                    <CardDescription>
                      Шаардлагат тоглолтууд ба тэдгээрийн үр дүн
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex space-x-2 border-r pr-2">
                      <Button 
                        onClick={exportToExcel} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Excel татах
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Display Final Rankings from Knockout Results */}
                {finalRankings.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Шигшээ тоглолтын эцсийн үр дүн ({finalRankings.length} тоглогч)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {finalRankings.map((ranking, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border-2 text-center ${
                            ranking.position === 1 ? 'bg-yellow-100 border-yellow-400' :
                            ranking.position === 2 ? 'bg-secondary border-border' :
                            'bg-orange-100 border-orange-400'
                          }`}
                        >
                          <div className="text-3xl mb-2">
                            {ranking.position === 1 ? '🥇' : ranking.position === 2 ? '🥈' : '🥉'}
                          </div>
                          <div className="text-lg font-bold text-text-primary">{ranking.position}-р байр</div>
                          <div className="font-medium text-text-primary">{ranking.playerName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {finalRankings.length === 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">Эцсийн үр дүн гараагүй</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Шигшээ тоглолтыг дуусгасны дараа эцсийн байрлал энд харагдана.
                    </p>
                  </div>
                )}

                {/* Qualified Players Section - Compact */}
                {getQualifiedPlayers().length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        Шигшээд шалгарсан тоглогчид: {getQualifiedPlayers().length}
                      </span>
                      <div className="flex gap-1">
                        {getQualifiedPlayers().map((player, index) => (
                          <span key={index} className="text-xs bg-card px-2 py-1 rounded border text-text-secondary">
                            {player.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No qualified players message */}
                {getQualifiedPlayers().length === 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">Шигшээд шалгарсан тоглогч байхгүй</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Хэсгийн тоглолтыг дуусгаж, үр дүн оруулсны дараа шигшээд шалгарсан тоглогчид энд харагдана.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Tournament Bracket Display - Traditional Style */}
                  {knockoutMatches.length > 0 && (
                    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
                      <h4 className="text-xl font-semibold mb-6 text-center text-white bg-gray-800 py-3 rounded-lg">
                        🏆 Шигшээ тоглолтын хүснэгт
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <KnockoutBracket
                          matches={knockoutMatches.map(match => ({
                            id: match.id,
                            round: match.round === 'final' ? 3 : match.round === 'semifinal' ? 2 : 1,
                            roundName: match.id === 'third_place_playoff' ? '3-р байрын тоглолт' :
                                     match.round === 'final' ? 'Финал' :
                                     match.round === 'semifinal' ? 'Хагас финал' : 'Дөрөвний финал',
                            player1: match.player1,
                            player2: match.player2,
                            player1Score: match.player1Score,
                            player2Score: match.player2Score,
                            score: match.score,
                            winner: match.winner,
                            position: match.position
                          }))}
                          selectedMatchId={selectedBracketMatchId || undefined}
                          onMatchClick={(id) => {
                            setSelectedBracketMatchId(id);
                            const el = document.getElementById(`match-editor-${id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Admin Editor */}
                  <KnockoutBracketEditor
                    initialMatches={knockoutMatches.map(match => {
                      // Map round values more comprehensively
                      let roundNum = 1;
                      let roundName = 'Дөрөвний финал';

                      if (match.round === 'final' || match.round === 3) {
                        roundNum = 3;
                        roundName = 'Финал';
                      } else if (match.round === 'semifinal' || match.round === 2) {
                        // What was called "semifinal" is actually the final when only 4 players
                        roundNum = 3;
                        roundName = 'Финал';
                      } else if (match.round === 'quarterfinal' || match.round === 1) {
                        roundNum = 2;
                        roundName = 'Хагас финал';
                      }

                      // Special case for 3rd place playoff
                      if (match.id === 'third_place_playoff') {
                        roundNum = 3; // Same level as final
                        roundName = '3-р байрын тоглолт';
                      }

                      return {
                        id: match.id,
                        round: roundNum,
                        roundName: roundName,
                        player1: match.player1,
                        player2: match.player2,
                        player1Score: match.player1Score,
                        player2Score: match.player2Score,
                        score: match.score,
                        winner: match.winner,
                        position: match.position
                      };
                    })}
                    users={allUsers} // Pass allUsers, but logic inside will use participants
                    qualifiedPlayers={getQualifiedPlayers()}
                    selectedMatchId={selectedBracketMatchId || undefined}
                    onMatchSelect={setSelectedBracketMatchId}
                    onSave={(newMatches) => {
                      // Convert back to original format and preserve individual scores
                      const convertedMatches = newMatches.map(match => ({
                        id: match.id,
                        round: match.roundName === 'Финал' ? 'final' : 
                               match.roundName === 'Хагас финал' ? 'semifinal' : 'quarterfinal',
                        player1: match.player1,
                        player2: match.player2,
                        player1Score: match.player1Score,
                        player2Score: match.player2Score,
                        score: match.score || (match.player1Score && match.player2Score ? `${match.player1Score}-${match.player2Score}` : '') as string,
                        winner: match.winner,
                        position: match.position
                      }));
                      setKnockoutMatches(convertedMatches);

                      // Calculate and update final rankings
                      const newFinalRankings: FinalRanking[] = [];

                      console.log('All matches for ranking calculation:', newMatches);
                      console.log('Available roundNames:', newMatches.map(m => m.roundName));

                      // Find the REAL final match - should be the one with highest round number or specific ID
                      const allFinals = newMatches.filter(m => m.roundName === 'Финал' && m.id !== 'third_place_playoff');
                      console.log('All final matches found:', allFinals);

                      // The real final is usually the one with the highest round number or most advanced position
                      let finalMatch = allFinals.find(m => m.id.includes('match_2_') || m.id.includes('match_3_'));

                      // If no advanced final found, try to find by position (rightmost on bracket)
                      if (!finalMatch && allFinals.length > 0) {
                        finalMatch = allFinals.reduce((latest, current) => {
                          return (current.position.x > latest.position.x) ? current : latest;
                        });
                      }

                      console.log('Selected final match for rankings:', finalMatch);
                      console.log('Final match players:', finalMatch?.player1?.name, 'vs', finalMatch?.player2?.name);
                      console.log('Final match winner:', finalMatch?.winner?.name);

                      if (finalMatch?.winner && finalMatch.player1 && finalMatch.player2) {
                        // 1st place: final winner
                        newFinalRankings.push({
                          position: 1,
                          playerId: finalMatch.winner.id,
                          playerName: finalMatch.winner.name
                        });

                        // 2nd place: final loser (the other player in final) - ALWAYS from final match
                        const finalLoser = finalMatch.player1.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
                        newFinalRankings.push({
                          position: 2,
                          playerId: finalLoser.id,
                          playerName: finalLoser.name
                        });

                        console.log('Final match results - Winner:', finalMatch.winner.name, 'Loser (2nd place):', finalLoser.name);
                      } else if (finalMatch?.player1 && finalMatch?.player2 && !finalMatch.winner) {
                        // If final has players but no winner yet, don't add rankings
                        console.log('Final match has players but no winner determined yet');
                      }

                      // Find 3rd place playoff
                      const thirdPlaceMatch = newMatches.find(m => m.id === 'third_place_playoff');
                      console.log('Found 3rd place match:', thirdPlaceMatch);

                      if (thirdPlaceMatch?.winner) {
                        // Make sure 3rd place winner is not already in rankings (avoid duplicates)
                        const alreadyRanked = newFinalRankings.some(r => r.playerId === thirdPlaceMatch.winner!.id);
                        if (!alreadyRanked) {
                          // 3rd place: 3rd place playoff winner
                          newFinalRankings.push({
                            position: 3,
                            playerId: thirdPlaceMatch.winner.id,
                            playerName: thirdPlaceMatch.winner.name
                          });

                          console.log('3rd place winner:', thirdPlaceMatch.winner.name);
                        } else {
                          console.log('3rd place winner already ranked, skipping duplicate');
                        }
                      }

                      console.log('Calculated final rankings:', newFinalRankings);

                      setFinalRankings(newFinalRankings);

                      // Auto-save via existing mutation
                      saveResultsMutation.mutate();
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      const qualifiedPlayers = getQualifiedPlayers();
                      if (qualifiedPlayers.length >= 4) {
                        const bracket = generateBracket(qualifiedPlayers.length);
                        setKnockoutMatches(bracket);
                        toast({
                          title: "Шигшээ тоглолт үүсгэгдлээ",
                          description: `${qualifiedPlayers.length} тоглогчийн хоосон шигшээ тоглолт үүсгэгдлээ`
                        });
                      } else {
                        toast({
                          title: "Хангалтгүй тоглогч",
                          description: "Дор хаяж 4 тоглогч шаардлагатай",
                          variant: "destructive"
                        });
                      }
                    }} 
                    disabled={getQualifiedPlayers().length < 4}
                  >
                    {getQualifiedPlayers().length >= 4 
                      ? "Хоосон шигшээ үүсгэх"
                      : `Шигшээ үүсгэх (${getQualifiedPlayers().length}/4)`
                    }
                  </Button>
                  <Button onClick={() => setKnockoutMatches([])} variant="destructive" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Цэвэрлэх
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Stage Editor */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Групп тулаан
                    </CardTitle>
                    <CardDescription>
                      Группийн тоглолтууд ба үр дүн
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={addGroupTable} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Групп нэмэх
                    </Button>
                    <div className="flex space-x-2 border-l pl-2">
                      <Button 
                        onClick={exportToExcel} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Excel татах
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={importFromExcel}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="excel-import-groups"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                        >
                          <label htmlFor="excel-import-groups" className="cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Excel оруулах
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {groupStageTables.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg p-4 bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <Input
                          value={group.groupName}
                          onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                          className="max-w-xs"
                          placeholder="Группийн нэр"
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => removeGroupTable(groupIndex)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Excel-style Result Matrix Table */}
                      {group.players.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-border">
                            <thead>
                              <tr className="bg-green-600 text-white">
                                <th className="border border-border p-2 text-sm font-bold text-white">№</th>
                                <th className="border border-border p-2 text-sm font-bold text-white">Нэрс</th>
                                <th className="border border-border p-2 text-sm font-bold text-white">Клуб</th>
                                {group.players.map((player, index) => (
                                  <th key={index} className="border border-border p-2 text-sm font-bold w-16 text-white">
                                    {index + 1}
                                  </th>
                                ))}
                                <th className="border border-border p-2 text-sm font-bold text-white">Өгсөн</th>
                                <th className="border border-border p-2 text-sm font-bold text-white">Байр</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.players.map((player, playerIndex) => (
                                <tr key={playerIndex} className="odd:bg-card even:bg-secondary hover:bg-accent">
                                  <td className="border border-border p-2 text-center font-medium">
                                    {playerIndex + 1}
                                  </td>
                                  <td className="border border-border p-2">
                                    <div className="flex items-center justify-between">
                                      <button 
                                        className="text-white hover:text-gray-200 cursor-pointer flex-1 text-left font-medium"
                                        onClick={() => setLocation(`/${player.playerId ? `profile/${player.playerId}` : `profile/${player.id}`}`)}
                                      >
                                        {player.name}
                                      </button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePlayerFromGroup(groupIndex, playerIndex)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="border border-border p-2 text-sm text-text-secondary">
                                    {player.club}
                                  </td>
                                  {group.players.map((opponent, opponentIndex) => (
                                    <td key={opponentIndex} className="border border-border p-1">
                                      {playerIndex === opponentIndex ? (
                                        <div className="w-full h-8 bg-secondary flex items-center justify-center text-xs">
                                          *****
                                        </div>
                                      ) : (
                                        <Input
                                          value={group.resultMatrix[playerIndex]?.[opponentIndex] || ''}
                                          onChange={(e) => updateMatchResult(groupIndex, playerIndex, opponentIndex, e.target.value)}
                                          placeholder="3-1"
                                          className="w-full h-8 text-center text-xs"
                                        />
                                      )}
                                    </td>
                                  ))}
                                  <td className="border border-border p-2">
                                    <Input
                                      value={player.wins || ''}
                                      onChange={(e) => {
                                        const updated = [...groupStageTables];
                                        updated[groupIndex].players[playerIndex].wins = e.target.value;
                                        setGroupStageTables(updated);
                                      }}
                                      placeholder="0/1"
                                      className="w-full h-8 text-center text-xs"
                                    />
                                  </td>
                                  <td className="border border-border p-2">
                                    <Input
                                      value={player.position || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow single digits 1-7
                                        if (value === '' || (/^[1-7]$/.test(value))) {
                                          const updated = [...groupStageTables];
                                          // Convert to number for database storage, empty string for display
                                          updated[groupIndex].players[playerIndex].position = value === '' ? '' : parseInt(value, 10);
                                          setGroupStageTables(updated);
                                        }
                                      }}
                                      placeholder="1"
                                      className="w-full h-8 text-center text-xs font-bold"
                                      maxLength={1}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Player Selection Section */}
                      <div className="mt-4 p-4 bg-secondary rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-text-secondary">Тоглогч нэмэх</h4>
                          <div className="text-xs text-text-secondary">
                            {(() => {
                              const totalRegistered = participants.length;
                              const totalInGroups = groupStageTables.reduce((total, group) => total + group.players.length, 0);
                              return `${totalInGroups}/${totalRegistered} тоглогч группд орсон`;
                            })()}
                          </div>
                        </div>

                        {(() => {
                          // Show all registered participants with better debugging
                          console.log('All participants for group:', participants);
                          console.log('Current group tables:', groupStageTables);

                          // Recalculate available players each time
                          // Helper function to get readable display label for participation type
                          const getParticipationLabel = (type: string) => {
                            try {
                              const parsed = JSON.parse(type);
                              let ageGroup = '';
                              let category = '';

                              if (parsed.age) {
                                ageGroup = parsed.age;
                              } else if (parsed.minAge && parsed.maxAge) {
                                ageGroup = `${parsed.minAge}-${parsed.maxAge}`;
                              } else if (parsed.minAge) {
                                ageGroup = `${parsed.minAge}+`;
                              } else if (parsed.maxAge) {
                                ageGroup = `${parsed.maxAge}-`;
                              }

                              if (parsed.gender === 'male') {
                                category = 'эр';
                              } else if (parsed.gender === 'female') {
                                category = 'эм';
                              }

                              return `${ageGroup} ${category}`.trim();
                            } catch {
                              // Handle string format categories
                              if (type.includes('singles')) {
                                const category = type.includes('men') ? 'Эрэгтэй дан' : 
                                               type.includes('women') ? 'Эмэгтэй дан' : 'Дан';
                                return category;
                              } else if (type.includes('doubles')) {
                                if (type.includes('mixed')) {
                                  return 'Холимог хос';
                                }
                                const category = type.includes('men') ? 'Эрэгтэй хос' : 
                                               type.includes('women') ? 'Эмэгтэй хос' : 'Хос';
                                return category;
                              }

                              return type.replace('_', ' ');
                            }
                          };

                          const availablePlayers = participants.filter(participant => {
                            // Get all possible IDs for this participant
                            const participantIds = [
                              participant.id,
                              participant.playerId,
                              participant.userId
                            ].filter(Boolean);

                            // Check if player is already in ANY group in this tournament
                            const isInAnyGroup = groupStageTables.some(anyGroup => 
                              anyGroup.players && anyGroup.players.some(gp => 
                                participantIds.includes(gp.id) || 
                                participantIds.includes(gp.playerId)
                              )
                            );

                            // More lenient name validation - accept if any name field exists
                            const hasValidName = Boolean(
                              participant.firstName || 
                              participant.lastName || 
                              participant.playerName ||
                              participant.name ||
                              participant.username
                            );

                            console.log('Checking participant:', {
                              ids: participantIds,
                              name: participant.firstName + ' ' + participant.lastName,
                              isInGroup: isInAnyGroup,
                              hasName: hasValidName
                            });

                            return !isInAnyGroup && hasValidName;
                          });

                          const totalRegistered = participants.length;
                          const totalInGroups = groupStageTables.reduce((total, group) => 
                            total + (group.players ? group.players.length : 0), 0
                          );

                          console.log(`Available players: ${availablePlayers.length}, Total registered: ${totalRegistered}, In groups: ${totalInGroups}`);

                          // Always show the registration stats
                          const registrationStats = (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <div className="flex justify-between">
                                <span>Бүртгэлтэй:</span>
                                <span className="font-medium">{totalRegistered}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Группд орсон:</span>
                                <span className="font-medium">{totalInGroups}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Боломжтой:</span>
                                <span className="font-medium text-green-600">{availablePlayers.length}</span>
                              </div>
                            </div>
                          );

                          if (totalRegistered === 0) {
                            return (
                              <div className="text-center py-3 border-2 border-dashed border-border rounded-lg bg-card">
                                {registrationStats}
                                <p className="text-sm text-text-secondary mb-1">
                                  Тэмцээнд бүртгүүлсэн тоглогч байхгүй байна
                                </p>
                                <p className="text-xs text-text-secondary">
                                  Эхлээд тэмцээнд тоглогч бүртгүүлнэ үү
                                </p>
                              </div>
                            );
                          }

                          if (availablePlayers.length === 0 && totalInGroups === totalRegistered) {
                            return (
                              <div className="text-center py-3 border-2 border-dashed border-border rounded-lg bg-card">
                                {registrationStats}
                                <p className="text-sm text-text-secondary mb-1">
                                  Бүх тоглогч группд хуваарилагдсан байна
                                </p>
                                <p className="text-xs text-text-secondary">
                                  Бусад группаас тоглогч хасаж энэ группд нэмэх боломжтой
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div>
                              {registrationStats}
                              {availablePlayers.length > 0 ? (
                                <>
                                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                                    <SelectTrigger className="flex-1 mb-2">
                                      <SelectValue placeholder={`${availablePlayers.length} тоглогчоос сонгох`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availablePlayers.map((participant) => {
                                        const participantId = participant.id || participant.playerId || participant.userId;
                                        const participantName = participant.playerName || 
                                          `${participant.firstName || ''} ${participant.lastName || ''}`.trim() ||
                                          participant.name || participant.username || 'Нэр тодорхойгүй';

                                        return (
                                          <SelectItem key={participantId} value={participantId}>
                                            {participantName} {participant.clubAffiliation ? `(${participant.clubAffiliation})` : ''} - {getParticipationLabel(participant.participationType || participationType || '')}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => {
                                      if (selectedPlayerId) {
                                        const selectedParticipant = availablePlayers.find(p => 
                                          p.id === selectedPlayerId || 
                                          p.playerId === selectedPlayerId || 
                                          p.userId === selectedPlayerId
                                        );
                                        if (selectedParticipant) {
                                          const participantName = selectedParticipant.playerName || 
                                            `${selectedParticipant.firstName || ''} ${selectedParticipant.lastName || ''}`.trim() ||
                                            selectedParticipant.name || selectedParticipant.username || 'Нэр тодорхойгүй';

                                          addPlayerToGroup(groupIndex, {
                                            id: selectedParticipant.id || selectedParticipant.playerId || selectedParticipant.userId,
                                            playerId: selectedParticipant.playerId || selectedParticipant.id,
                                            name: participantName,
                                            club: selectedParticipant.clubAffiliation || selectedParticipant.club || '',
                                            wins: 0,
                                            losses: 0,
                                            points: 0
                                          });
                                          setSelectedPlayerId(''); // Clear selection after adding
                                        }
                                      }
                                    }}
                                    disabled={!selectedPlayerId}
                                    size="sm"
                                    className="w-full"
                                  >
                                    Группд нэмэх
                                  </Button>
                                </>
                              ) : (
                                <div className="text-center py-2 text-sm text-text-secondary">
                                  {totalRegistered > 0 ? 
                                    "Бүх тоглогч аль хэдийн группд орсон байна" : 
                                    "Боломжтой тоглогч байхгүй"}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {group.players.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
                          <p className="text-text-secondary mb-2">
                            Дээрх сонголтоос тоглогч сонгож нэмнэ үү
                          </p>
                          <p className="text-sm text-text-secondary">
                            Зөвхөн тэмцээнд бүртгүүлсэн, өөр группд ороогүй тоглогчдыг сонгох боломжтой
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {groupStageTables.length === 0 && (
                    <p className="text-text-secondary text-center py-8">
                      "Групп нэмэх" товчийг дарж группийн тулаан үүсгэнэ үү
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Дан тэмцээний ангилал олдсонгүй</h3>
            <p className="text-gray-500">
              Энэ тэмцээнд зөвхөн хос/холимог хосын ангилал байна. Үр дүн оруулах боломжгүй.
            </p>
          </div>
        )}
      </div>

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ ангилал нэмэх</DialogTitle>
          </DialogHeader>
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Жишээ: 40-49 эр"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddCategoryOpen(false)}>
              Болих
            </Button>
            <Button onClick={handleAddCategory}>Нэмэх</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}