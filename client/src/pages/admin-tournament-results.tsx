
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
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import type { Tournament, TournamentResults, TournamentParticipant, User } from "@shared/schema";
import * as XLSX from 'xlsx';

interface GroupStageGroup {
  id: string;
  name: string;
  players: Array<{
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  }>;
  resultMatrix: number[][];
  playerStats: Array<{
    playerId: string;
    wins: number;
    losses: number;
    points: number;
  }>;
}

interface KnockoutMatch {
  id: string;
  round: string;
  player1?: { id: string; name: string; playerId?: string; userId?: string };
  player2?: { id: string; name: string; playerId?: string; userId?: string };
  winner?: { id: string; name: string; playerId?: string; userId?: string };
  score?: string;
  isFinished: boolean;
}

interface FinalRanking {
  position: number;
  player: {
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  };
  points?: number;
  note?: string;
}

const AdminTournamentResults: React.FC = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/tournament/:tournamentId/results");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [groupStageResults, setGroupStageResults] = useState<GroupStageGroup[]>([]);
  const [knockoutResults, setKnockoutResults] = useState<KnockoutMatch[]>([]);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [activeTab, setActiveTab] = useState("group-stage");

  // Fetch tournament data
  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', params?.tournamentId],
    enabled: !!params?.tournamentId,
  });

  // Fetch existing results
  const { data: existingResults } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', params?.tournamentId, 'results'],
    enabled: !!params?.tournamentId,
  });

  // Fetch participants
  const { data: participants } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', params?.tournamentId, 'participants'],
    enabled: !!params?.tournamentId,
  });

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/admin/tournament-results', 'POST', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: "Тэмцээний үр дүн амжилттай хадгалагдлаа",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.tournamentId, 'results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Үр дүн хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Initialize data when existing results are loaded
  useEffect(() => {
    if (existingResults) {
      setGroupStageResults((existingResults.groupStageResults as any) || []);
      setKnockoutResults((existingResults.knockoutResults as any) || []);
      setFinalRankings((existingResults.finalRankings as any) || []);
      setIsPublished(existingResults.isPublished || false);
    }
  }, [existingResults]);

  // Group Stage Functions
  const addGroup = () => {
    const newGroup: GroupStageGroup = {
      id: Date.now().toString(),
      name: `Group ${String.fromCharCode(65 + groupStageResults.length)}`,
      players: [],
      resultMatrix: [],
      playerStats: [],
    };
    setGroupStageResults([...groupStageResults, newGroup]);
  };

  const deleteGroup = (groupId: string) => {
    setGroupStageResults(groupStageResults.filter(g => g.id !== groupId));
  };

  const addPlayerToGroup = (groupId: string, player: User) => {
    setGroupStageResults(prev => prev.map(group => {
      if (group.id === groupId) {
        const newPlayer = {
          id: player.id,
          name: player.name,
          playerId: player.playerId,
          userId: user.id,
        };
        const updatedPlayers = [...group.players, newPlayer];
        const matrixSize = updatedPlayers.length;
        const newMatrix = Array(matrixSize).fill(null).map((_, i) => 
          Array(matrixSize).fill(null).map((_, j) => 
            i < group.resultMatrix.length && j < group.resultMatrix[i]?.length 
              ? group.resultMatrix[i][j] 
              : (i === j ? -1 : 0)
          )
        );
        
        return {
          ...group,
          players: updatedPlayers,
          resultMatrix: newMatrix,
          playerStats: updatedPlayers.map(p => ({
            playerId: p.id,
            wins: 0,
            losses: 0,
            points: 0,
          })),
        };
      }
      return group;
    }));
  };

  const updateGroupResult = (groupId: string, playerIndex: number, opponentIndex: number, result: number) => {
    setGroupStageResults(prev => prev.map(group => {
      if (group.id === groupId) {
        const newMatrix = [...group.resultMatrix];
        newMatrix[playerIndex][opponentIndex] = result;
        
        // Calculate stats
        const newStats = group.players.map((player, idx) => {
          let wins = 0, losses = 0, points = 0;
          
          for (let j = 0; j < group.players.length; j++) {
            if (idx !== j) {
              const matchResult = newMatrix[idx][j];
              if (matchResult === 1) {
                wins++;
                points += 2;
              } else if (matchResult === 0.5) {
                points += 1;
              } else if (matchResult === 0) {
                losses++;
              }
            }
          }
          
          return {
            playerId: player.id,
            wins,
            losses,
            points,
          };
        });

        return {
          ...group,
          resultMatrix: newMatrix,
          playerStats: newStats,
        };
      }
      return group;
    }));
  };

  // Final Rankings Functions
  const addToFinalRankings = (player: User) => {
    const newRanking: FinalRanking = {
      position: finalRankings.length + 1,
      player: {
        id: player.id,
        name: player.name,
        playerId: player.playerId,
        userId: player.id,
      },
    };
    setFinalRankings([...finalRankings, newRanking]);
  };

  const updateFinalRanking = (index: number, field: keyof FinalRanking, value: any) => {
    setFinalRankings(prev => prev.map((ranking, i) => 
      i === index ? { ...ranking, [field]: value } : ranking
    ));
  };

  const deleteFinalRanking = (index: number) => {
    setFinalRankings(prev => prev.filter((_, i) => i !== index).map((ranking, i) => ({
      ...ranking,
      position: i + 1,
    })));
  };

  // Save function
  const handleSave = () => {
    if (!params?.tournamentId) return;

    const data = {
      tournamentId: params.tournamentId,
      groupStageResults: groupStageResults.length > 0 ? groupStageResults : null,
      knockoutResults: knockoutResults.length > 0 ? knockoutResults : null,
      finalRankings: finalRankings.length > 0 ? finalRankings : null,
      isPublished,
    };

    saveResultsMutation.mutate(data);
  };

  // Excel Import/Export
  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process imported data and convert to your format
        console.log('Imported data:', jsonData);
        toast({
          title: "Excel файл импорт хийгдлээ",
          description: "Өгөгдлийг шалгаж, шаардлагатай засварлага хийнэ үү",
        });
      } catch (error) {
        toast({
          title: "Excel импорт амжилтгүй",
          description: "Файлыг уншихад алдаа гарлаа",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    
    if (finalRankings.length > 0) {
      const rankingsData = finalRankings.map(r => ({
        'Байрлал': r.position,
        'Тамирчин': r.player.name,
        'Оноо': r.points || '',
        'Тэмдэглэл': r.note || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rankingsData);
      XLSX.utils.book_append_sheet(wb, ws, "Эцсийн жагсаалт");
    }

    XLSX.writeFile(wb, `tournament_${params?.tournamentId}_results.xlsx`);
  };

  if (tournamentLoading) {
    return <PageWithLoading>{null}</PageWithLoading>;
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Тэмцээн олдсонгүй</p>
          <Button onClick={() => setLocation('/admin/tournaments')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/admin/tournaments')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Тэмцээний үр дүн удирдах</h1>
              <p className="text-gray-600">{tournament.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "Нийтлэгдсэн" : "Ноорог"}
            </Badge>
            <Button onClick={handleSave} disabled={saveResultsMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveResultsMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </div>

        {/* Import/Export Tools */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Excel импорт/экспорт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <input
                  type="file"
                  id="excel-import"
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  className="hidden"
                />
                <Button onClick={() => document.getElementById('excel-import')?.click()} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Excel импорт
                </Button>
              </div>
              <Button onClick={handleExcelExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Excel экспорт
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="group-stage">
              <Users className="w-4 h-4 mr-2" />
              Группийн шат
            </TabsTrigger>
            <TabsTrigger value="knockout">
              <Trophy className="w-4 h-4 mr-2" />
              Шилжих тоглолт
            </TabsTrigger>
            <TabsTrigger value="final-rankings">
              <Target className="w-4 h-4 mr-2" />
              Эцсийн жагсаалт
            </TabsTrigger>
          </TabsList>

          {/* Group Stage Tab */}
          <TabsContent value="group-stage" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Группийн шатны үр дүн</h2>
              <Button onClick={addGroup}>
                <Plus className="w-4 h-4 mr-2" />
                Групп нэмэх
              </Button>
            </div>

            {groupStageResults.map((group, groupIndex) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{group.name}</CardTitle>
                    <Button
                      onClick={() => deleteGroup(group.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Player */}
                  <div>
                    <UserAutocomplete
                      onUserSelect={(user) => addPlayerToGroup(group.id, user)}
                      placeholder="Тамирчин хайх..."
                    />
                  </div>

                  {/* Players List */}
                  {group.players.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Тамирчид ({group.players.length})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {group.players.map((player, index) => (
                          <div key={player.id} className="p-2 bg-gray-100 rounded text-sm">
                            {index + 1}. {player.name}
                          </div>
                        ))}
                      </div>

                      {/* Results Matrix */}
                      {group.players.length > 1 && (
                        <div className="overflow-x-auto">
                          <h4 className="font-medium mb-2">Тоглолтын үр дүн</h4>
                          <table className="min-w-full border-collapse border border-gray-300">
                            <thead>
                              <tr>
                                <th className="border border-gray-300 p-2 bg-gray-50">Тамирчин</th>
                                {group.players.map((_, index) => (
                                  <th key={index} className="border border-gray-300 p-2 bg-gray-50">
                                    {index + 1}
                                  </th>
                                ))}
                                <th className="border border-gray-300 p-2 bg-gray-50">Оноо</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.players.map((player, playerIndex) => (
                                <tr key={player.id}>
                                  <td className="border border-gray-300 p-2 font-medium">
                                    {playerIndex + 1}. {player.name}
                                  </td>
                                  {group.players.map((_, opponentIndex) => (
                                    <td key={opponentIndex} className="border border-gray-300 p-1">
                                      {playerIndex === opponentIndex ? (
                                        <div className="bg-gray-200 h-8 flex items-center justify-center">
                                          -
                                        </div>
                                      ) : (
                                        <Select
                                          value={group.resultMatrix[playerIndex]?.[opponentIndex]?.toString() || ""}
                                          onValueChange={(value) => updateGroupResult(
                                            group.id, 
                                            playerIndex, 
                                            opponentIndex, 
                                            parseFloat(value)
                                          )}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1">Ялалт</SelectItem>
                                            <SelectItem value="0.5">Тэнцэв</SelectItem>
                                            <SelectItem value="0">Ялагдал</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </td>
                                  ))}
                                  <td className="border border-gray-300 p-2 text-center font-bold">
                                    {group.playerStats.find(s => s.playerId === player.id)?.points || 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Knockout Tab */}
          <TabsContent value="knockout" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Шилжих тоглолт</h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <KnockoutBracketEditor
                  matches={knockoutResults}
                  onMatchesChange={setKnockoutResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Final Rankings Tab */}
          <TabsContent value="final-rankings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Эцсийн жагсаалт</h2>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Нийтэд харуулах</span>
                </label>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <UserAutocomplete
                    onUserSelect={addToFinalRankings}
                    placeholder="Тамирчин хайж нэмэх..."
                  />

                  {finalRankings.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 p-3 bg-gray-50">Байрлал</th>
                            <th className="border border-gray-300 p-3 bg-gray-50">Тамирчин</th>
                            <th className="border border-gray-300 p-3 bg-gray-50">Оноо</th>
                            <th className="border border-gray-300 p-3 bg-gray-50">Тэмдэглэл</th>
                            <th className="border border-gray-300 p-3 bg-gray-50">Үйлдэл</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalRankings.map((ranking, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 p-3 text-center font-bold">
                                {ranking.position}
                              </td>
                              <td className="border border-gray-300 p-3">
                                {ranking.player.name}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="number"
                                  value={ranking.points || ''}
                                  onChange={(e) => updateFinalRanking(
                                    index, 
                                    'points', 
                                    parseInt(e.target.value) || 0
                                  )}
                                  placeholder="Оноо"
                                  className="w-20"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  value={ranking.note || ''}
                                  onChange={(e) => updateFinalRanking(index, 'note', e.target.value)}
                                  placeholder="Тэмдэглэл"
                                />
                              </td>
                              <td className="border border-gray-300 p-3 text-center">
                                <Button
                                  onClick={() => deleteFinalRanking(index)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
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
    </PageWithLoading>
  );
};

export default AdminTournamentResults;
