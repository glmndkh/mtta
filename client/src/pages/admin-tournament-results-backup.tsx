import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target, Download, Upload, FileSpreadsheet, Move, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { DocumentEditor } from "@/components/DocumentEditor";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";
import type { Tournament, TournamentResults, TournamentParticipant, User } from "@shared/schema";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [documentContent, setDocumentContent] = useState<string>('');
  const [knockoutGridData, setKnockoutGridData] = useState<any[][]>([]);

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
      setFinalRankings((existingResults.finalRankings as FinalRanking[]) || []);
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
    setGroupStageTables(groupStageTables.filter((_, i) => i !== index));
  };

  const updateGroupName = (index: number, name: string) => {
    const updated = [...groupStageTables];
    updated[index].groupName = name;
    setGroupStageTables(updated);
  };

  const addPlayerToGroup = (groupIndex: number, player: { id: string; name: string; club: string; wins?: string; position?: string }) => {
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

  // Get qualified players from group stage (top 2 from each group)
  const getQualifiedPlayers = (): QualifiedPlayer[] => {
    const qualified: QualifiedPlayer[] = [];
    
    groupStageTables.forEach(group => {
      if (group.standings && group.standings.length > 0) {
        // Get top 2 players from each group
        const topPlayers = group.standings
          .sort((a, b) => a.position - b.position)
          .slice(0, 2);
        
        topPlayers.forEach(player => {
          qualified.push({
            id: player.playerId,
            name: player.playerName,
            groupName: group.groupName,
            position: player.position
          });
        });
      }
    });
    
    return qualified;
  };

  // Removed automatic generation - admin creates matches manually

  // Helper functions for knockout stage
  const addKnockoutRound = (round: string) => {
    const roundCount = knockoutMatches.filter(m => m.round === round).length;
    const newMatch: KnockoutMatch = {
      id: `knockout_${Date.now()}_${Math.random()}`,
      round,
      position: { x: 50 + roundCount * 300, y: 50 + roundCount * 100 },
    };
    setKnockoutMatches([...knockoutMatches, newMatch]);
  };

  // Drag functionality for knockout matches
  const handleMatchDrag = (matchId: string, newPosition: { x: number; y: number }) => {
    const updated = knockoutMatches.map(match => 
      match.id === matchId 
        ? { ...match, position: newPosition }
        : match
    );
    setKnockoutMatches(updated);
  };

  const updateKnockoutMatch = (index: number, field: string, value: any) => {
    const updated = [...knockoutMatches];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (updated[index] as any)[parent] = (updated[index] as any)[parent] || {};
      (updated[index] as any)[parent][child] = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setKnockoutMatches(updated);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="groups">Хэсгийн тоглолт</TabsTrigger>
            <TabsTrigger value="document">Баримт засварлах</TabsTrigger>
            <TabsTrigger value="knockout">Excel хүснэгт</TabsTrigger>
            <TabsTrigger value="rankings">Шагналт байр</TabsTrigger>
            <TabsTrigger value="preview">Урьдчилан үзэх</TabsTrigger>
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

          {/* Document Editor Tab */}
          <TabsContent value="document">
            <Card>
              <CardHeader>
                <CardTitle>Баримт бичгийн засварлагч</CardTitle>
                <CardDescription>
                  Текст, зураг, хүснэгт чөлөөтэй нэмж засварлана уу
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentEditor
                  content={documentContent}
                  onChange={setDocumentContent}
                  placeholder="Энд текст бичиж, зураг, хүснэгт нэмнэ үү..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel-style Knockout Grid */}
          <TabsContent value="knockout">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Шоронтох тулаан - Excel маягийн хүснэгт</CardTitle>
                    <CardDescription>
                      Мөр, багана чөлөөтэй нэмж засварлана уу
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          const newMatch: KnockoutMatch = {
                            id: `qf_${Date.now()}_${Math.random()}`,
                            round: 'quarterfinal',
                            position: { x: 50, y: 50 + knockoutMatches.filter(m => m.round === 'quarterfinal').length * 120 }
                          };
                          setKnockoutMatches([...knockoutMatches, newMatch]);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Дөрөвний финал
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const newMatch: KnockoutMatch = {
                            id: `sf_${Date.now()}_${Math.random()}`,
                            round: 'semifinal',
                            position: { x: 400, y: 110 + knockoutMatches.filter(m => m.round === 'semifinal').length * 200 }
                          };
                          setKnockoutMatches([...knockoutMatches, newMatch]);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Хагас финал
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const newMatch: KnockoutMatch = {
                            id: `f_${Date.now()}_${Math.random()}`,
                            round: 'final',
                            position: { x: 750, y: 210 }
                          };
                          setKnockoutMatches([...knockoutMatches, newMatch]);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Финал
                      </Button>
                      
                      <Button
                        onClick={() => setKnockoutMatches([])}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Бүгдийг арилгах
                      </Button>
                    </div>
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
                <SpreadsheetGrid
                  initialRows={12}
                  initialCols={8}
                  data={knockoutGridData}
                  onChange={setKnockoutGridData}
                />

              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Урьдчилан үзэх</CardTitle>
                <CardDescription>
                  Баримт болон хүснэгтийн эцсийн дүр төрх
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Document Preview */}
                  {documentContent && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Баримт бичиг</h3>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: documentContent }}
                      />
                    </div>
                  )}
                  
                  {/* Grid Preview */}
                  {knockoutGridData.length > 0 && (
                    <div className="border rounded-lg p-4 overflow-auto">
                      <h3 className="text-lg font-semibold mb-4">Excel хүснэгт</h3>
                      <table className="w-full border-collapse border">
                        <tbody>
                          {knockoutGridData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td 
                                  key={colIndex}
                                  className="border p-2 min-w-[100px]"
                                  style={{
                                    fontWeight: cell.style?.bold ? 'bold' : 'normal',
                                    fontStyle: cell.style?.italic ? 'italic' : 'normal',
                                    textAlign: cell.style?.textAlign || 'left',
                                    backgroundColor: cell.style?.backgroundColor
                                  }}
                                >
                                  {cell.value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                            <h3 className="text-center font-semibold mb-4 text-gray-700">Дөрөвний финал</h3>
                            {knockoutMatches.filter(m => m.round === 'quarterfinal').map((match, index) => {
                              const globalIndex = knockoutMatches.findIndex(m => m.id === match.id);
