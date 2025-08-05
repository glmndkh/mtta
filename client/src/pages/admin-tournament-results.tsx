import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target, Download, Upload, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { KnockoutBracketEditor } from "@/components/KnockoutBracketEditor";
import type { Tournament, TournamentResults, TournamentParticipant, User } from "@shared/schema";
import * as XLSX from 'xlsx';


// Types for Excel-style tournament result editing
// Excel-style group stage table - represents round-robin within a group
interface GroupStageTable {
  groupName: string;
  players: Array<{
    id: string;
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
  const [match, params] = useRoute("/admin/tournament/:id/results");
  const [fallbackMatch] = useRoute("/admin/tournament-results");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for editing
  const [groupStageTables, setGroupStageTables] = useState<GroupStageTable[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  // Check if we have a tournament ID, if not show tournament selection
  const tournamentId = params?.id;
  const isOnFallbackRoute = fallbackMatch && !tournamentId;

  // Fetch all tournaments for selection page
  const { data: allTournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    enabled: isOnFallbackRoute,
  });

  // Fetch tournament data
  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', tournamentId],
    enabled: !!tournamentId,
  });

  // Fetch tournament participants
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    enabled: !!tournamentId,
  });

  // Fetch existing results
  const { data: existingResults } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', tournamentId, 'results'],
    enabled: !!tournamentId,
  });

  // Fetch all users for autocomplete
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!tournamentId && user?.role === 'admin',
  });

  // Load existing results into state
  useEffect(() => {
    if (existingResults) {
      setGroupStageTables((existingResults.groupStageResults as GroupStageTable[]) || []);
      setKnockoutMatches((existingResults.knockoutResults as KnockoutMatch[]) || []);
      
      // Load final rankings or calculate from knockout matches if missing
      const savedRankings = (existingResults.finalRankings as FinalRanking[]) || [];
      if (savedRankings.length > 0) {
        setFinalRankings(savedRankings);
      } else {
        // Calculate from knockout matches if no rankings saved
        const knockoutResults = (existingResults.knockoutResults as KnockoutMatch[]) || [];
        const calculatedRankings: FinalRanking[] = [];
        
        console.log('Loading existing knockout results:', knockoutResults);
        
        const finalMatch = knockoutResults.find(m => m.round === 'final');
        console.log('Found existing final match:', finalMatch);
        
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
  }, [existingResults]);

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      if (!tournamentId) return;
      const resultsData = {
        tournamentId: tournamentId,
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
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id, 'results'] });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Хандах эрхгүй</h1>
          <p className="text-gray-600 mb-4">Зөвхөн админ хэрэглэгч энэ хуудсыг харах боломжтой.</p>
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
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
                  <h1 className="text-2xl font-bold text-gray-900">Тэмцээний үр дүн оруулах</h1>
                  <p className="text-sm text-gray-600">Тэмцээн сонгоод үр дүн оруулна уу</p>
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
                      <span className="text-gray-600">Статус:</span>
                      <Badge className={
                        tournament.status === 'registration' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {tournament.status === 'registration' ? 'Бүртгэл' : 
                         tournament.status === 'ongoing' ? 'Болж байна' : 'Дууссан'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Байршил:</span>
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Огноо:</span>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Тэмцээний мэдээлэл ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Тэмцээн олдсонгүй</h1>
          <Button 
            onClick={() => setLocation('/admin/tournaments')}
            variant="outline"
          >
            Буцах
          </Button>
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
        playerIds.push(player.id);
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

  const addPlayerToGroup = (groupIndex: number, player: { id: string; name: string; club: string; wins?: string; position?: string }) => {
    // Check if player is already in any group
    const isPlayerInAnyGroup = groupStageTables.some(group => 
      group.players.some(gp => gp.id === player.id)
    );
    
    if (isPlayerInAnyGroup) {
      toast({
        title: "Алдаа",
        description: `${player.name} аль хэдийн өөр группд орсон байна. Нэг тоглогч зөвхөн нэг группд оролцох боломжтой.`,
        variant: "destructive",
      });
      return;
    }
    
    const updated = [...groupStageTables];
    updated[groupIndex].players.push({
      ...player,
      wins: player.wins || '',
      position: player.position || ''
    });
    
    // Expand result matrix
    const playerCount = updated[groupIndex].players.length;
    updated[groupIndex].resultMatrix = Array(playerCount).fill(null).map(() => 
      Array(playerCount).fill('')
    );
    
    setGroupStageTables(updated);
  };

  const updateMatchResult = (groupIndex: number, player1Index: number, player2Index: number, score: string) => {
    const updated = [...groupStageTables];
    updated[groupIndex].resultMatrix[player1Index][player2Index] = score;
    
    // Calculate standings
    calculateGroupStandings(updated[groupIndex]);
    setGroupStageTables(updated);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {tournament.name} - Үр дүн оруулах
                </h1>
                <p className="text-gray-600">
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
        <Tabs defaultValue="rankings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings">Шагналт байр</TabsTrigger>
            <TabsTrigger value="knockout">Шигшээ тоглолт</TabsTrigger>
            <TabsTrigger value="groups">Хэсгийн тоглолт</TabsTrigger>
          </TabsList>

          {/* Final Rankings Editor */}
          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Эцсийн байр
                    </CardTitle>
                    <CardDescription>
                      Тэмцээний эцсийн үр дүн ба байрлал оруулах
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={addRanking} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Байр нэмэх
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
                          id="excel-import-rankings"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                        >
                          <label htmlFor="excel-import-rankings" className="cursor-pointer">
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
                            ranking.position === 2 ? 'bg-gray-100 border-gray-400' :
                            'bg-orange-100 border-orange-400'
                          }`}
                        >
                          <div className="text-3xl mb-2">
                            {ranking.position === 1 ? '🥇' : ranking.position === 2 ? '🥈' : '🥉'}
                          </div>
                          <div className="text-lg font-bold text-gray-800">{ranking.position}-р байр</div>
                          <div className="font-medium text-gray-900">{ranking.playerName}</div>
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

                <div className="space-y-4">
                  {finalRankings.map((ranking, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                      <div className="col-span-1">
                        <Input
                          type="number"
                          value={ranking.position}
                          onChange={(e) => updateRanking(index, 'position', parseInt(e.target.value))}
                          placeholder="Байр"
                        />
                      </div>
                      <div className="col-span-4">
                        <UserAutocomplete
                          users={allUsers}
                          value={ranking.playerName || ''}
                          onSelect={(user) => {
                            updateRanking(index, 'playerId', user.id);
                            updateRanking(index, 'playerName', `${user.firstName} ${user.lastName}`);
                          }}
                          placeholder="Тоглогч хайх..."
                          className="w-full"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={ranking.prize || ''}
                          onChange={(e) => updateRanking(index, 'prize', e.target.value)}
                          placeholder="Шагнал (сайн дурын)"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRanking(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {finalRankings.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      "Байр нэмэх" товчийг дарж эцсийн байр оруулна уу
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knockout Editor */}
          <TabsContent value="knockout">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Шоронтох тулаан</CardTitle>
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
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={importFromExcel}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="excel-import"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                        >
                          <label htmlFor="excel-import" className="cursor-pointer">
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
                {/* Qualified Players Section */}
                {getQualifiedPlayers().length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Шигшээд шалгарсан тоглогчид ({getQualifiedPlayers().length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getQualifiedPlayers().map((player, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-green-300 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.groupName} - {player.position === 1 ? '1-р байр' : '2-р байр'}</div>
                          </div>
                          <Badge variant={player.position === 1 ? "default" : "secondary"}>
                            {player.position === 1 ? '🥇' : '🥈'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-green-700">
                      💡 Эдгээр тоглогчдыг доорх шигшээ тоглолтын сугалаанд ашиглаж болно
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

                <KnockoutBracketEditor
                  initialMatches={knockoutMatches.map(match => ({
                    id: match.id,
                    round: match.round === 'final' ? 3 : match.round === 'semifinal' ? 2 : 1,
                    roundName: match.round === 'final' ? 'Финал' : 
                              match.round === 'semifinal' ? 'Хагас финал' : 'Дөрөвний финал',
                    player1: match.player1,
                    player2: match.player2,
                    player1Score: match.player1Score,
                    player2Score: match.player2Score,
                    score: match.score,
                    winner: match.winner,
                    position: match.position
                  }))}
                  users={allUsers}
                  qualifiedPlayers={getQualifiedPlayers()}
                  onSave={(newMatches) => {
                    // Convert back to original format and preserve individual scores
                    const convertedMatches = newMatches.map(match => ({
                      id: match.id,
                      round: match.round === 3 ? 'final' : match.round === 2 ? 'semifinal' : 'quarterfinal',
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
                    
                    // Find final match
                    const finalMatch = newMatches.find(m => m.roundName === 'Финал');
                    console.log('Found final match:', finalMatch);
                    
                    if (finalMatch?.winner && finalMatch.player1 && finalMatch.player2) {
                      // 1st place: final winner
                      newFinalRankings.push({
                        position: 1,
                        playerId: finalMatch.winner.id,
                        playerName: finalMatch.winner.name
                      });
                      
                      // 2nd place: final loser (the other player in final)
                      const finalLoser = finalMatch.player1.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
                      newFinalRankings.push({
                        position: 2,
                        playerId: finalLoser.id,
                        playerName: finalLoser.name
                      });
                      
                      console.log('Final match results - Winner:', finalMatch.winner.name, 'Loser:', finalLoser.name);
                    } else if (finalMatch?.player1 && finalMatch?.player2 && !finalMatch.winner) {
                      // If final has players but no winner yet, don't add rankings
                      console.log('Final match has players but no winner determined yet');
                    }
                    
                    // Find 3rd place playoff
                    const thirdPlaceMatch = newMatches.find(m => m.id === 'third_place_playoff');
                    console.log('Found 3rd place match:', thirdPlaceMatch);
                    
                    if (thirdPlaceMatch?.winner) {
                      // 3rd place: 3rd place playoff winner
                      newFinalRankings.push({
                        position: 3,
                        playerId: thirdPlaceMatch.winner.id,
                        playerName: thirdPlaceMatch.winner.name
                      });
                      
                      console.log('3rd place winner:', thirdPlaceMatch.winner.name);
                    }
                    
                    console.log('Calculated final rankings:', newFinalRankings);
                    
                    setFinalRankings(newFinalRankings);
                    
                    // Auto-save via existing mutation
                    saveResultsMutation.mutate();
                  }}
                />
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
                    <div key={groupIndex} className="border rounded-lg p-4">
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
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-yellow-100">
                                <th className="border border-gray-300 p-2 text-sm font-bold">№</th>
                                <th className="border border-gray-300 p-2 text-sm font-bold">Нэрс</th>
                                <th className="border border-gray-300 p-2 text-sm font-bold">Клуб</th>
                                {group.players.map((player, index) => (
                                  <th key={index} className="border border-gray-300 p-2 text-sm font-bold w-16">
                                    {index + 1}
                                  </th>
                                ))}
                                <th className="border border-gray-300 p-2 text-sm font-bold">Өгсөн</th>
                                <th className="border border-gray-300 p-2 text-sm font-bold">Байр</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.players.map((player, playerIndex) => (
                                <tr key={playerIndex} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 p-2 text-center font-medium">
                                    {playerIndex + 1}
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                    <div className="flex items-center justify-between">
                                      <button 
                                        className="text-blue-600 hover:underline cursor-pointer flex-1 text-left"
                                        onClick={() => setLocation(`/profile/${player.id}`)}
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
                                  <td className="border border-gray-300 p-2 text-sm text-gray-600">
                                    {player.club}
                                  </td>
                                  {group.players.map((opponent, opponentIndex) => (
                                    <td key={opponentIndex} className="border border-gray-300 p-1">
                                      {playerIndex === opponentIndex ? (
                                        <div className="w-full h-8 bg-gray-200 flex items-center justify-center text-xs">
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
                                  <td className="border border-gray-300 p-2">
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
                                  <td className="border border-gray-300 p-2">
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
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Тоглогч нэмэх</h4>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const totalRegistered = participants.length;
                              const totalInGroups = groupStageTables.reduce((total, group) => total + group.players.length, 0);
                              return `${totalInGroups}/${totalRegistered} тоглогч группд орсон`;
                            })()}
                          </div>
                        </div>
                        
                        {(() => {
                          // Recalculate available players each time
                          const availablePlayers = allUsers.filter(user => {
                            // Match participants to users by name (participants contain expanded user data)
                            const isRegisteredForTournament = participants.some(participant => {
                              return (participant.firstName === user.firstName && participant.lastName === user.lastName) ||
                                     (participant.email === user.email && participant.email) ||
                                     participant.id === user.id;
                            });
                            
                            // Check if player is already in ANY group in this tournament
                            const isInAnyGroup = groupStageTables.some(anyGroup => 
                              anyGroup.players && anyGroup.players.some(gp => gp.id === user.id)
                            );
                            
                            const isValidUser = user.firstName && user.lastName;
                            
                            return isRegisteredForTournament && !isInAnyGroup && isValidUser;
                          });

                          if (availablePlayers.length === 0) {
                            const totalRegistered = participants.length;
                            const totalInGroups = groupStageTables.reduce((total, group) => 
                              total + (group.players ? group.players.length : 0), 0
                            );
                            
                            // Additional debug info for empty state
                            if (totalRegistered === 0) {
                              console.log('No participants found for tournament:', tournamentId);
                            }
                            
                            return (
                              <div className="text-center py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                <p className="text-sm text-gray-600 mb-1">
                                  {totalRegistered === 0 
                                    ? "Тэмцээнд бүртгүүлсэн тоглогч байхгүй байна"
                                    : totalInGroups === totalRegistered
                                    ? "Бүх тоглогч группд хуваарилагдсан байна"
                                    : "Энэ группд нэмэх боломжтой тоглогч байхгүй байна"
                                  }
                                </p>
                                <p className="text-xs text-gray-400">
                                  {totalInGroups > 0 && totalInGroups < totalRegistered && "Бусад группаас тоглогч хасаж энэ группд нэмэх боломжтой"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Бүртгэлтэй: {totalRegistered}, Группд орсон: {totalInGroups}, Боломжтой: {totalRegistered - totalInGroups}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <UserAutocomplete
                              users={availablePlayers.map(user => ({
                                id: user.id,
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                email: user.email,
                                clubAffiliation: user.clubAffiliation
                              }))}
                              value={undefined}
                              onSelect={(user) => {
                                if (user) {
                                  addPlayerToGroup(groupIndex, {
                                    id: user.id,
                                    name: `${user.firstName} ${user.lastName}`,
                                    club: user.clubAffiliation || ''
                                  });
                                }
                              }}
                              placeholder="Тоглогч сонгоод энэ группд нэмэх..."
                              className="w-full"
                            />
                          );
                        })()}
                      </div>
                      
                      {group.players.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 mb-2">
                            Дээрх сонголтоос тоглогч сонгож нэмнэ үү
                          </p>
                          <p className="text-sm text-gray-400">
                            Зөвхөн тэмцээнд бүртгүүлсэн, өөр группд ороогүй тоглогчдыг сонгох боломжтой
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {groupStageTables.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      "Групп нэмэх" товчийг дарж группийн тулаан үүсгэнэ үү
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}