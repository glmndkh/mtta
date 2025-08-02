import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Tournament, TournamentResults, TournamentParticipant } from "@shared/schema";

// Types for Excel-style tournament result editing
// Excel-style group stage table - represents round-robin within a group
interface GroupStageTable {
  groupName: string;
  players: Array<{
    id: string;
    name: string;
    club: string;
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

interface KnockoutMatch {
  id: string;
  round: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
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

  const addPlayerToGroup = (groupIndex: number, player: { id: string; name: string; club: string }) => {
    const updated = [...groupStageTables];
    updated[groupIndex].players.push(player);
    
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
          const result = group.resultMatrix[playerIndex][opponentIndex];
          if (result && result.includes('-')) {
            const [playerScore, opponentScore] = result.split('-').map(s => parseInt(s.trim()));
            if (!isNaN(playerScore) && !isNaN(opponentScore)) {
              totalMatches++;
              if (playerScore > opponentScore) {
                wins++;
              } else {
                losses++;
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

    // Sort by points (descending), then by wins
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    group.standings = standings;
  };

  // Helper functions for knockout stage
  const addKnockoutRound = (round: string) => {
    const roundCount = knockoutMatches.filter(m => m.round === round).length;
    const newMatch: KnockoutMatch = {
      id: `knockout_${Date.now()}_${Math.random()}`,
      round,
      position: { x: 0, y: roundCount * 100 },
    };
    setKnockoutMatches([...knockoutMatches, newMatch]);
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
            <TabsTrigger value="rankings">Эцсийн байр</TabsTrigger>
            <TabsTrigger value="knockout">Шоронтох тулаан</TabsTrigger>
            <TabsTrigger value="groups">Групп тулаан</TabsTrigger>
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
                  <Button onClick={addRanking} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Байр нэмэх
                  </Button>
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
                        <Select
                          value={ranking.playerId}
                          onValueChange={(value) => {
                            const participant = participants.find(p => 
                              `${p.firstName} ${p.lastName}` === value
                            );
                            updateRanking(index, 'playerId', participant?.id || '');
                            updateRanking(index, 'playerName', value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Тоглогч сонгох" />
                          </SelectTrigger>
                          <SelectContent>
                            {participants.map((participant) => (
                              <SelectItem 
                                key={participant.id}
                                value={`${participant.firstName} ${participant.lastName}`}
                              >
                                {participant.firstName} {participant.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <div className="flex space-x-2">
                    <Button onClick={() => addKnockoutRound('quarterfinal')} size="sm">
                      Дөрөвний финал
                    </Button>
                    <Button onClick={() => addKnockoutRound('semifinal')} size="sm">
                      Хагас финал
                    </Button>
                    <Button onClick={() => addKnockoutRound('final')} size="sm">
                      Финал
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {['final', 'semifinal', 'quarterfinal'].map((round) => {
                    const roundMatches = knockoutMatches.filter(match => match.round === round);
                    if (roundMatches.length === 0) return null;

                    const roundNames: Record<string, string> = {
                      final: 'Финал',
                      semifinal: 'Хагас финал',
                      quarterfinal: 'Дөрөвний финал',
                    };

                    return (
                      <div key={round}>
                        <h3 className="text-lg font-semibold mb-3">{roundNames[round]}</h3>
                        <div className="space-y-4">
                          {roundMatches.map((match, matchIdx) => {
                            const globalIndex = knockoutMatches.findIndex(m => m.id === match.id);
                            return (
                              <div key={match.id} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                                <div className="col-span-3">
                                  <Select
                                    value={match.player1?.name || ''}
                                    onValueChange={(value) => {
                                      const participant = participants.find(p => 
                                        `${p.firstName} ${p.lastName}` === value
                                      );
                                      updateKnockoutMatch(globalIndex, 'player1', {
                                        id: participant?.id || '',
                                        name: value
                                      });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Тоглогч 1" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {participants.map((participant) => (
                                        <SelectItem 
                                          key={participant.id}
                                          value={`${participant.firstName} ${participant.lastName}`}
                                        >
                                          {participant.firstName} {participant.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-3">
                                  <Select
                                    value={match.player2?.name || ''}
                                    onValueChange={(value) => {
                                      const participant = participants.find(p => 
                                        `${p.firstName} ${p.lastName}` === value
                                      );
                                      updateKnockoutMatch(globalIndex, 'player2', {
                                        id: participant?.id || '',
                                        name: value
                                      });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Тоглогч 2" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {participants.map((participant) => (
                                        <SelectItem 
                                          key={participant.id}
                                          value={`${participant.firstName} ${participant.lastName}`}
                                        >
                                          {participant.firstName} {participant.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-2">
                                  <Input
                                    value={match.score || ''}
                                    onChange={(e) => updateKnockoutMatch(globalIndex, 'score', e.target.value)}
                                    placeholder="Оноо (3-1)"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Select
                                    value={match.winner?.name || ''}
                                    onValueChange={(value) => {
                                      const participant = participants.find(p => 
                                        `${p.firstName} ${p.lastName}` === value
                                      );
                                      updateKnockoutMatch(globalIndex, 'winner', {
                                        id: participant?.id || '',
                                        name: value
                                      });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Ялагч" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {match.player1?.name && (
                                        <SelectItem value={match.player1.name}>
                                          {match.player1.name}
                                        </SelectItem>
                                      )}
                                      {match.player2?.name && (
                                        <SelectItem value={match.player2.name}>
                                          {match.player2.name}
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {knockoutMatches.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Дээрх товчнуудаар шоронтох тулааны тоглолт нэмнэ үү
                    </p>
                  )}
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
                  <Button onClick={addGroupTable} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Групп нэмэх
                  </Button>
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
                            onClick={() => {
                              const participantOptions = participants.map(p => ({
                                id: p.id || '',
                                name: `${p.firstName} ${p.lastName}`,
                                club: p.clubName || ''
                              }));
                              if (participantOptions.length > 0) {
                                addPlayerToGroup(groupIndex, participantOptions[0]);
                              }
                            }}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Тоглогч нэмэх
                          </Button>
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
                                    <button 
                                      className="text-blue-600 hover:underline cursor-pointer"
                                      onClick={() => setLocation(`/profile/${player.id}`)}
                                    >
                                      {player.name}
                                    </button>
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
                                  <td className="border border-gray-300 p-2 text-center text-sm">
                                    {group.standings.find(s => s.playerId === player.id)?.wins || 0}/
                                    {group.standings.find(s => s.playerId === player.id)?.totalMatches || 0}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center font-bold">
                                    {group.standings.find(s => s.playerId === player.id)?.position || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Player Selection */}
                      <div className="mt-4">
                        <Select 
                          onValueChange={(value) => {
                            const participant = participants.find(p => 
                              `${p.firstName} ${p.lastName}` === value
                            );
                            if (participant) {
                              addPlayerToGroup(groupIndex, {
                                id: participant.id || '',
                                name: `${participant.firstName} ${participant.lastName}`,
                                club: participant.clubName || ''
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Группд тоглогч нэмэх" />
                          </SelectTrigger>
                          <SelectContent>
                            {participants
                              .filter(p => !group.players.some(gp => gp.id === p.id))
                              .map((participant) => (
                                <SelectItem 
                                  key={participant.id} 
                                  value={`${participant.firstName} ${participant.lastName}`}
                                >
                                  {participant.firstName} {participant.lastName} ({participant.clubName})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {group.players.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          Дээрх сонголтоос тоглогч нэмж эхлэнэ үү
                        </p>
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