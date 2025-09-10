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
import { normalizeKnockoutMatches } from "@/lib/knockout";


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
  round: number | string;
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
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<KnockoutMatch | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | ''>('');
  const [bestOf, setBestOf] = useState<5 | 7>(5);
  const [setsWonA, setSetsWonA] = useState<number>(0);
  const [setsWonB, setSetsWonB] = useState<number>(0);
  const [resultType, setResultType] = useState<'normal' | 'WO' | 'RET'>('normal');
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
  const { data: existingResults, isLoading: resultsLoading, error: resultsError } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', tournamentId, 'results'],
    enabled: !!tournamentId,
    retry: 1,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
        round: 1,
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
      const normalizedKnockout = normalizeKnockoutMatches(knockoutResultsByType) as KnockoutMatch[];
      setKnockoutMatches(normalizedKnockout);

      // Load final rankings or calculate from knockout matches if missing
      const savedRankings = (existingResults.finalRankings as Record<string, FinalRanking[]> || {})[participationType] || [];
      if (savedRankings.length > 0) {
        setFinalRankings(savedRankings);
      } else {
        // Calculate from knockout matches if no rankings saved
        const knockoutResults = normalizedKnockout;
        const calculatedRankings: FinalRanking[] = [];

        console.log('Loading existing knockout results:', knockoutResults);
        console.log('Available rounds:', knockoutResults.map(m => m.round));

        // Look for final match - match with highest round (excluding 3rd place)
        const finalRound = Math.max(...knockoutResults.map(m => Number(m.round)), 0);
        const finalMatch = knockoutResults.find(m => Number(m.round) === finalRound && m.id !== 'third_place_playoff');

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

  // Mutation to update match results
  const updateMatchResult = useMutation({
    mutationFn: async ({ matchId, winner, bestOf, setsWonA, setsWonB }: {
      matchId: string;
      winner: 'A' | 'B' | 'WO' | 'RET';
      bestOf: number;
      setsWonA: number;
      setsWonB: number;
    }) => {
      return apiRequest(`/api/matches/${matchId}/result-summary`, {
        method: 'PUT',
        body: JSON.stringify({ winner, bestOf, setsWonA, setsWonB }),
      });
    },
    onSuccess: () => {
      // Force refetch with no cache
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
      queryClient.refetchQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });

      // Also invalidate tournament data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });

      toast({
        title: "Амжилттай",
        description: "Тоглолтын үр дүн амжилттай хадгалагдлаа",
      });
    },
  });

  // Mutation to update match players
  const updateMatchPlayers = useMutation({
    mutationFn: async ({ matchId, playerAId, playerBId }: {
      matchId: string;
      playerAId?: string | null;
      playerBId?: string | null;
    }) => {
      return apiRequest(`/api/matches/${matchId}/players`, {
        method: 'PUT',
        body: JSON.stringify({ playerAId, playerBId }),
      });
    },
    onSuccess: () => {
      // Force refetch with no cache
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });
      queryClient.refetchQueries({ queryKey: ['/api/tournaments', tournamentId, 'results'] });

      // Also invalidate tournament data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });

      toast({
        title: "Амжилттай", 
        description: "Тоглогчид амжилттай солигдлоо",
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
              Тэмцээнний жагсаалт руу буцах
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

  

  const updateGroupMatchResult = (groupIndex: number, playerIndex: number, opponentIndex: number, score: string) => {
    const updated = [...groupStageTables];
    if (updated[groupIndex] && updated[groupIndex].resultMatrix) {
      updated[groupIndex].resultMatrix[playerIndex][opponentIndex] = score;
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
            const qualifiedPlayer = {
              id: player.id || player.playerId || '',
              name: player.name || 'Нэр тодорхойгүй',
              groupName: group.groupName || 'Групп',
              position: position
            };

            console.log('Adding qualified player:', qualifiedPlayer);
            qualified.push(qualifiedPlayer);
          }
        });
      }
    });

    console.log('All qualified players:', qualified);
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
            round: typeof row['Шат'] === 'number' ? row['Шат'] : parseInt(row['Шат']) || 1,
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

  // Helper to get round display name
  const getRoundName = (matchCount: number): string => {
    switch (matchCount) {
      case 1: return 'Финал';
      case 2: return 'Хагас финал';
      case 4: return 'Дөрөвний финал';
      case 8: return '1/8 финал';
      case 16: return '1/16 финал';
      case 32: return '1/32 финал';
      case 64: return '1/64 финал';
      default:
        return `1/${matchCount * 2} финал`;
    }
  };

  // C) Handle match click for in-bracket results
  const handleMatchClick = (matchId: string) => {
    const match = knockoutMatches.find(m => m.id === matchId);
    if (!match || !match.player1 || !match.player2) {
      toast({
        title: "Алдаа",
        description: "Тоглолт олдсонгүй эсвэл тоглогчийн мэдээлэл дутуу байна",
        variant: "destructive"
      });
      return;
    }

    // Skip BYE matches
    if (match.player1?.id === 'bye' || match.player2?.id === 'bye') {
      toast({
        title: "BYE тоглолт",
        description: "BYE тоглолтонд үр дүн оруулах шаардлагагүй",
        variant: "destructive"
      });
      return;
    }

    console.log('Match clicked:', match);

    setCurrentMatch(match);
    setSelectedWinner(match.winner?.id === match.player1?.id ? 'A' : 
                     match.winner?.id === match.player2?.id ? 'B' : '');
    setBestOf(5); // Default best-of-5

    // Parse existing series score
    if (match.score && match.score !== 'BYE') {
      const scoreParts = match.score.split('-');
      if (scoreParts.length === 2) {
        setSetsWonA(parseInt(scoreParts[0]) || 0);
        setSetsWonB(parseInt(scoreParts[1]) || 0);
      }
    } else {
      setSetsWonA(0);
      setSetsWonB(0);
    }

    setResultType('normal');
    setResultModalOpen(true);
  };

  // Save match result
  const saveMatchResult = () => {
    if (!currentMatch) return;

    const updatedMatches = knockoutMatches.map(match => {
      if (match.id !== currentMatch.id) return match;

      const updatedMatch = { ...match };

      // Set winner
      if (selectedWinner === 'A' && currentMatch.player1) {
        updatedMatch.winner = currentMatch.player1;
      } else if (selectedWinner === 'B' && currentMatch.player2) {
        updatedMatch.winner = currentMatch.player2;
      }

      // Set series score
      if (resultType === 'WO') {
        updatedMatch.score = bestOf === 5 ? '3-0' : '4-0';
      } else if (resultType === 'RET') {
        updatedMatch.score = bestOf === 5 ? '3-0' : '4-0';
      } else {
        updatedMatch.score = `${setsWonA}-${setsWonB}`;
      }

      return updatedMatch;
    });

    // Auto-advance winner to next match
    const advancedMatches = advanceWinnerToNextMatch(updatedMatches, currentMatch.id);
    setKnockoutMatches(advancedMatches);

    // Calculate and update final rankings
    updateFinalRankings(advancedMatches);

    setResultModalOpen(false);
    updateMatchResult.mutate({ // Use the mutation here
      matchId: currentMatch.id,
      winner: selectedWinner === 'A' ? 'A' : selectedWinner === 'B' ? 'B' : 'WO', // Assuming WO/RET logic might map here
      bestOf,
      setsWonA,
      setsWonB
    });

    toast({
      title: "Үр дүн хадгалагдлаа",
      description: `${currentMatch.player1?.name} vs ${currentMatch.player2?.name}`
    });
  };

  // Advance winner to next match
  const advanceWinnerToNextMatch = (matches: KnockoutMatch[], matchId: string): KnockoutMatch[] => {
    const match = matches.find(m => m.id === matchId);
    if (!match?.winner) return matches;

    // Find next match in bracket structure
    const round = match.round;
    const matchIndex = parseInt(match.id.split('_')[2]);
    const nextRound = typeof round === 'number' ? round + 1 : parseInt(String(round).split(' ')[0], 10) + 1; // Handle potential string rounds like "1/4"
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatchId = `match_${nextRound}_${nextMatchIndex}`;

    return matches.map(m => {
      if (m.id === nextMatchId) {
        const slot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        return { ...m, [slot]: match.winner };
      }
      return m;
    });
  };

  // Update final rankings based on completed matches
  const updateFinalRankings = (matches: KnockoutMatch[]) => {
    const newRankings: FinalRanking[] = [];

    // Find final match
    const finalRoundNumber = Math.max(...matches.map(m => typeof m.round === 'number' ? m.round : parseInt(String(m.round).split(' ')[0], 10)), 0);
    const finalMatch = matches.find(m => m.round === finalRoundNumber && m.id !== 'third_place_playoff');
    if (finalMatch?.winner && finalMatch.player1 && finalMatch.player2) {
      newRankings.push({
        position: 1,
        playerId: finalMatch.winner.id,
        playerName: finalMatch.winner.name
      });

      const finalLoser = finalMatch.player1.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
      newRankings.push({
        position: 2,
        playerId: finalLoser.id,
        playerName: finalLoser.name
      });
    }

    // Find 3rd place match
    const thirdPlaceMatch = matches.find(m => m.id === 'third_place_playoff');
    if (thirdPlaceMatch?.winner) {
      newRankings.push({
        position: 3,
        playerId: thirdPlaceMatch.winner.id,
        playerName: thirdPlaceMatch.winner.name
      });
    }

    setFinalRankings(newRankings);
  };

  // B) Groups → Knockout Generator
  const generateBracketFromGroups = () => {
    const qualifiedPlayers = getQualifiedPlayers();
    if (qualifiedPlayers.length < 2) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 2 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    // Cross seeding policy (default): A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
    const groupedPlayers = qualifiedPlayers.reduce((acc, player) => {
      if (!acc[player.groupName]) acc[player.groupName] = [];
      acc[player.groupName].push(player);
      return acc;
    }, {} as Record<string, typeof qualifiedPlayers>);

    // Sort players within each group by position
    Object.keys(groupedPlayers).forEach(group => {
      groupedPlayers[group].sort((a, b) => a.position - b.position);
    });

    const groupNames = Object.keys(groupedPlayers);
    const seededPlayers: QualifiedPlayer[] = [];

    // Apply cross seeding
    const maxQualifiers = Math.max(...Object.values(groupedPlayers).map(g => g.length));
    for (let position = 1; position <= maxQualifiers; position++) {
      groupNames.forEach(groupName => {
        const player = groupedPlayers[groupName][position - 1];
        if (player) seededPlayers.push(player);
      });
    }

    // Generate bracket structure for 2^k players
    const playerCount = seededPlayers.length;
    const powerOf2 = Math.pow(2, Math.ceil(Math.log2(playerCount)));
    const rounds = Math.ceil(Math.log2(powerOf2));
    const byeCount = powerOf2 - playerCount;

    console.log('Generating bracket:', {
      playerCount,
      powerOf2,
      rounds,
      byeCount,
      seededPlayers: seededPlayers.map(p => p.name)
    });

    const ROUND_WIDTH = 350;
    const START_Y = 80;
    const matches: KnockoutMatch[] = [];

    // First round with seeded players and BYEs
    const firstRoundMatches = Math.pow(2, rounds - 1);

    // Standard bracket seeding for proper BYE placement
    const bracketSeeding: number[] = [];
    for (let i = 0; i < powerOf2; i++) {
      if (i < seededPlayers.length) {
        bracketSeeding.push(i);
      } else {
        bracketSeeding.push(-1); // BYE placeholder
      }
    }

    for (let matchIndex = 0; matchIndex < firstRoundMatches; matchIndex++) {
      const verticalSpacing = 120;
      const yPosition = START_Y + (matchIndex * verticalSpacing * 2);

      const match: KnockoutMatch = {
        id: `match_1_${matchIndex}`,
        round: 1,
        position: { x: 50, y: yPosition }
      };

      // Standard bracket pairing
      const player1Index = matchIndex * 2;
      const player2Index = player1Index + 1;

      // Assign player1
      if (player1Index < seededPlayers.length) {
        match.player1 = {
          id: seededPlayers[player1Index].id,
          name: seededPlayers[player1Index].name
        };
      } else {
        match.player1 = { id: 'bye', name: 'BYE' };
      }

      // Assign player2
      if (player2Index < seededPlayers.length) {
        match.player2 = {
          id: seededPlayers[player2Index].id,
          name: seededPlayers[player2Index].name
        };
      } else {
        match.player2 = { id: 'bye', name: 'BYE' };
      }

      // Auto-advance if one player gets BYE
      if (match.player1.id === 'bye' && match.player2.id !== 'bye') {
        match.winner = match.player2;
        match.score = 'BYE';
      } else if (match.player2.id === 'bye' && match.player1.id !== 'bye') {
        match.winner = match.player1;
        match.score = 'BYE';
      }

      matches.push(match);
    }

    // Generate subsequent rounds
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);

      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const verticalSpacing = Math.pow(2, round) * 120;
        const centerOffset = (matchesInRound - 1) * verticalSpacing / 2;
        const yPosition = START_Y + (matchIndex * verticalSpacing) - centerOffset + (round * 50);

        matches.push({
          id: `match_${round}_${matchIndex}`,
          round,
          position: {
            x: 50 + (round - 1) * ROUND_WIDTH,
            y: Math.max(yPosition, 60)
          }
        });
      }
    }

    // Add 3rd place playoff if we have semifinals
    if (rounds >= 2) {
      matches.push({
        id: 'third_place_playoff',
        round: rounds, // This might need adjustment based on how rounds are numbered for the 3rd place match
        position: { x: 200 + (rounds - 2) * ROUND_WIDTH / 2, y: START_Y + 450 }
      });
    }

    setKnockoutMatches(matches);
    toast({
      title: "Bracket үүсгэгдлээ",
      description: `${playerCount} тоглогчийн шигшээ тоглолт үүсгэгдлээ${byeCount > 0 ? ` (${byeCount} BYE)` : ''}`
    });
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
                    <CardTitle>Шигшээ тоглолт</CardTitle>
                    <CardDescription>
                      Single elimination bracket система
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const qualifiedPlayers = getQualifiedPlayers();
                        if (qualifiedPlayers.length >= 4) {
                          generateBracketFromGroups();
                        } else {
                          toast({
                            title: "Хангалтгүй тоглогч",
                            description: "Дор хаяж 4 тоглогч шаардлагатай",
                            variant: "destructive"
                          });
                        }
                      }} 
                      disabled={getQualifiedPlayers().length < 4}
                      className="flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Группаас bracket үүсгэх
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Tournament Bracket Display */}
                {knockoutMatches.length > 0 ? (
                  <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
                    <h4 className="text-xl font-semibold mb-6 text-center text-white bg-gray-800 py-3 rounded-lg">
                      🏆 Шигшээ тоглолтын хүснэгт
                    </h4>
                    <div className="bg-white rounded-lg p-4">
                      <KnockoutBracket
                        matches={knockoutMatches.map(match => ({
                          id: match.id,
                          round: Number(match.round),
                          player1: match.player1,
                          player2: match.player2,
                          winner: match.winner,
                          score1: match.player1Score ? parseInt(match.player1Score, 10) : undefined,
                          score2: match.player2Score ? parseInt(match.player2Score, 10) : undefined,
                          position: match.position,
                          series: match.score
                        }))}
                        onMatchClick={handleMatchClick}
                        isAdmin={true}
                        availablePlayers={[
                          ...getQualifiedPlayers().map(p => ({ id: p.id, name: p.name })),
                          ...participants.map(p => ({
                            id: p.id || p.playerId || p.userId || '',
                            name: p.playerName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || p.username || 'Нэр тодорхойгүй'
                          }))
                        ]}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Шигшээ тоглолт үүсгээгүй</h3>
                    <p className="text-gray-500 mb-4">
                      Эхлээд хэсгийн тоглолтыг дуусгаж, дараа нь "Группаас bracket үүсгэх" товчийг дарна уу.
                    </p>
                    {getQualifiedPlayers().length > 0 && (
                      <p className="text-sm text-green-600">
                        Шалгарсан тоглогчид: {getQualifiedPlayers().length}
                      </p>
                    )}
                  </div>
                )}
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
                                          onChange={(e) => updateGroupMatchResult(groupIndex, playerIndex, opponentIndex, e.target.value)}
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
                          // Get all possible IDs for this participant
                          const getParticipantIds = (p: TournamentParticipant) => [
                            p.id,
                            p.playerId,
                            p.userId
                          ].filter(Boolean) as string[];

                          // Helper function to check if a participant is already in any group
                          const isParticipantInAnyGroup = (p: TournamentParticipant): boolean => {
                            const participantIds = getParticipantIds(p);
                            return groupStageTables.some(anyGroup => 
                              anyGroup.players && anyGroup.players.some(gp => 
                                participantIds.includes(gp.id) || 
                                participantIds.includes(gp.playerId)
                              )
                            );
                          };

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

                          // Filter for available players
                          const availablePlayers = participants.filter(participant => {
                            const hasValidName = Boolean(
                              participant.firstName || 
                              participant.lastName || 
                              participant.playerName ||
                              participant.name ||
                              participant.username
                            );
                            return !isParticipantInAnyGroup(participant) && hasValidName;
                          });

                          const totalRegistered = participants.length;
                          const totalInGroups = groupStageTables.reduce((total, group) => 
                            total + (group.players ? group.players.length : 0), 0
                          );

                          // Display registration stats
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

                          // Handle cases with no participants or all participants already assigned
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

                          // Render player selection dropdown and add button
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
                                        const participantId = getParticipantIds(participant)[0]; // Use the first available ID
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
                                          getParticipantIds(p).includes(selectedPlayerId)
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

      {/* Match Result Modal */}
      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Тоглолтын үр дүн оруулах</DialogTitle>
          </DialogHeader>

          {currentMatch && (
            <div className="space-y-4">
              {/* Match Info */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-lg">
                  {currentMatch.player1?.name} vs {currentMatch.player2?.name}
                </div>
              </div>

              {/* Winner Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ялагч</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedWinner === 'A' ? "default" : "outline"}
                    onClick={() => setSelectedWinner('A')}
                    className="h-auto p-3"
                  >
                    <div className="text-center">
                      <div className="font-medium">A</div>
                      <div className="text-xs">{currentMatch.player1?.name}</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedWinner === 'B' ? "default" : "outline"}
                    onClick={() => setSelectedWinner('B')}
                    className="h-auto p-3"
                  >
                    <div className="text-center">
                      <div className="font-medium">B</div>
                      <div className="text-xs">{currentMatch.player2?.name}</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Best Of Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Best-of</label>
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

              {/* Result Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Үр дүнгийн төрөл</label>
                <Select value={resultType} onValueChange={(value) => setResultType(value as 'normal' | 'WO' | 'RET')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Хэвийн</SelectItem>
                    <SelectItem value="WO">W.O. (Walk Over)</SelectItem>
                    <SelectItem value="RET">RET (Retired)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Series Score (only for normal results) */}
              {resultType === 'normal' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Сетийн оноо</label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      max={bestOf === 5 ? "3" : "4"}
                      value={setsWonA}
                      onChange={(e) => setSetsWonA(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <div className="text-center font-medium">-</div>
                    <Input
                      type="number"
                      min="0"
                      max={bestOf === 5 ? "3" : "4"}
                      value={setsWonB}
                      onChange={(e) => setSetsWonB(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  {bestOf === 5 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Боломжтой оноо: 3-0, 3-1, 3-2
                    </div>
                  )}
                  {bestOf === 7 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Боломжтой оноо: 4-0, 4-1, 4-2, 4-3
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResultModalOpen(false)}>
              Болих
            </Button>
            <Button 
              onClick={saveMatchResult}
              disabled={!selectedWinner || (resultType === 'normal' && (!setsWonA && !setsWonB))}
            >
              Хадгалах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}