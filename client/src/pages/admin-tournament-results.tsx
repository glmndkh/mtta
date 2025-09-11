import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target, Download, Upload, FileSpreadsheet, Minus, Eye, EyeOff, Medal, Crown, Award, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import type { Tournament, TournamentResults, TournamentParticipant } from "@shared/schema";
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
  resultMatrix: string[][];
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
  roundName: string;
  player1?: { id: string; name: string; playerId?: string; userId?: string };
  player2?: { id: string; name: string; playerId?: string; userId?: string };
  winner?: { id: string; name: string; playerId?: string; userId?: string };
  score?: string;
  player1Score?: string;
  player2Score?: string;
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

interface QualifiedPlayer {
  id: string;
  name: string;
  groupName: string;
  position: number;
  seed?: number;
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
  const [selectedPlayerTab, setSelectedPlayerTab] = useState<string>("all");
  const [qualifiedPlayers, setQualifiedPlayers] = useState<QualifiedPlayer[]>([]);

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
    enabled: !!params?.tournamentId 
  });

  // Fetch all users for autocomplete
  const { data: users = [] } = useQuery<User[]>({ 
    queryKey: ['/api/admin/users'], 
    enabled: !!params?.tournamentId
  });

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving tournament results:', data);
      const response = await fetch('/api/admin/tournament-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Үр дүн хадгалахад алдаа гарлаа');
      }

      return response.json();
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
      const groupResults = existingResults.groupStageResults;
      const knockoutResultsData = existingResults.knockoutResults;
      const finalRankingsData = existingResults.finalRankings;

      setGroupStageResults(Array.isArray(groupResults) ? groupResults : []);
      setKnockoutResults(Array.isArray(knockoutResultsData) ? knockoutResultsData : []);
      setFinalRankings(Array.isArray(finalRankingsData) ? finalRankingsData : []);
      setIsPublished(existingResults.isPublished || false);
    }
  }, [existingResults]);

  // Generate qualified players from group stage results
  useEffect(() => {
    const qualified: QualifiedPlayer[] = [];

    groupStageResults.forEach(group => {
      if (group.players.length >= 2) {
        const sortedPlayers = group.players
          .map((player) => {
            const stats = group.playerStats.find(s => s.playerId === player.id) || { 
              wins: 0, 
              losses: 0, 
              points: 0, 
              setsWon: 0, 
              setsLost: 0, 
              setsDifference: 0 
            };
            return { player, stats };
          })
          .sort((a, b) => {
            if (b.stats.points !== a.stats.points) {
              return b.stats.points - a.stats.points;
            }
            return b.stats.wins - a.stats.wins;
          });

        // Get top 2 qualified players from each group
        sortedPlayers.slice(0, 2).forEach((item, index) => {
          qualified.push({
            id: item.player.id,
            name: item.player.name,
            groupName: group.name,
            position: index + 1,
            seed: qualified.length + 1
          });
        });
      }
    });

    setQualifiedPlayers(qualified);
  }, [groupStageResults]);

  // Get podium winners from knockout results
  const getPodiumWinners = () => {
    const podium = {
      first: null as { id: string; name: string; club?: string } | null,
      second: null as { id: string; name: string; club?: string } | null,
      third: null as { id: string; name: string; club?: string } | null,
    };

    const finalMatch = knockoutResults.find(m => m.roundName === 'Финал');
    if (finalMatch?.winner) {
      podium.first = {
        id: finalMatch.winner.id,
        name: finalMatch.winner.name,
        club: 'Клуб нэр'
      };

      const finalLoser = finalMatch.player1?.id === finalMatch.winner.id ? finalMatch.player2 : finalMatch.player1;
      if (finalLoser) {
        podium.second = {
          id: finalLoser.id,
          name: finalLoser.name,
          club: 'Клуб нэр'
        };
      }
    }

    const thirdPlaceMatch = knockoutResults.find(m => m.id === 'third_place_playoff');
    if (thirdPlaceMatch?.winner) {
      podium.third = {
        id: thirdPlaceMatch.winner.id,
        name: thirdPlaceMatch.winner.name,
        club: 'Клуб нэр'
      };
    }

    return podium;
  };

  // Handle match score changes
  const handleMatchScoreChange = (matchId: string, field: 'player1Score' | 'player2Score', value: string) => {
    setKnockoutResults(prev => prev.map(match => {
      if (match.id !== matchId) return match;

      const updatedMatch = { ...match, [field]: value };

      // Auto-determine winner based on scores
      const p1Score = parseInt(updatedMatch.player1Score || '0') || 0;
      const p2Score = parseInt(updatedMatch.player2Score || '0') || 0;

      if (p1Score > 0 || p2Score > 0) {
        if (p1Score > p2Score && updatedMatch.player1) {
          updatedMatch.winner = updatedMatch.player1;
        } else if (p2Score > p1Score && updatedMatch.player2) {
          updatedMatch.winner = updatedMatch.player2;
        }
        updatedMatch.score = `${p1Score}-${p2Score}`;
      }

      return updatedMatch;
    }));
  };

  // Handle winner toggle
  const handleWinnerToggle = (matchId: string, winnerId: string) => {
    setKnockoutResults(prev => prev.map(match => {
      if (match.id !== matchId) return match;

      let winner = null;
      if (winnerId === match.player1?.id && match.player1) {
        winner = match.player1;
      } else if (winnerId === match.player2?.id && match.player2) {
        winner = match.player2;
      }

      return { ...match, winner };
    }));
  };

  // Generate empty knockout bracket
  const generateKnockoutBracket = () => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    const matches: KnockoutMatch[] = [];

    // Semifinals
    for (let i = 0; i < qualifiedPlayers.length; i += 2) {
      if (i + 1 < qualifiedPlayers.length) {
        matches.push({
          id: `sf_${i/2 + 1}`,
          round: "1",
          roundName: "Хагас финал",
          player1: {
            id: qualifiedPlayers[i].id,
            name: qualifiedPlayers[i].name
          },
          player2: {
            id: qualifiedPlayers[i + 1].id,
            name: qualifiedPlayers[i + 1].name
          },
          isFinished: false
        });
      }
    }

    // Final
    matches.push({
      id: 'final',
      round: "2",
      roundName: "Финал",
      isFinished: false
    });

    // Third place playoff
    matches.push({
      id: 'third_place_playoff',
      round: "2",
      roundName: "3-р байрны тоглолт",
      isFinished: false
    });

    setKnockoutResults(matches);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн шигшээ тоглолт үүсгэгдлээ`
    });
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

  const podiumWinners = getPodiumWinners();

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setLocation('/admin/tournaments')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Буцах
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Тэмцээний үр дүн удирдах</h1>
                <p className="text-lg text-gray-300 mt-1">{tournament.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants?.length || 0} оролцогч
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {tournament.format}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isPublished ? "default" : "secondary"}
                className={`px-3 py-1 text-sm ${ 
                  isPublished 
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
              >
                {isPublished ? "Нийтлэгдсэн" : "Ноорог"}
              </Badge>
              <Button 
                onClick={handleSave} 
                disabled={saveResultsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveResultsMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </div>
        </div>

        {/* Podium Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Шилдэг тоглогчид
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Place */}
            <Card className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white border-yellow-300">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🥇</div>
                <div className="text-lg font-bold">1-р байр</div>
                {podiumWinners.first ? (
                  <>
                    <div className="text-xl font-semibold mt-2">{podiumWinners.first.name}</div>
                    <div className="text-sm opacity-90">{podiumWinners.first.club}</div>
                  </>
                ) : (
                  <div className="text-lg text-yellow-100 mt-2">Тодорхойгүй</div>
                )}
              </CardContent>
            </Card>

            {/* 2nd Place */}
            <Card className="bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white border-gray-300">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-lg font-bold">2-р байр</div>
                {podiumWinners.second ? (
                  <>
                    <div className="text-xl font-semibold mt-2">{podiumWinners.second.name}</div>
                    <div className="text-sm opacity-90">{podiumWinners.second.club}</div>
                  </>
                ) : (
                  <div className="text-lg text-gray-100 mt-2">Тодорхойгүй</div>
                )}
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-lg font-bold">3-р байр</div>
                {podiumWinners.third ? (
                  <>
                    <div className="text-xl font-semibold mt-2">{podiumWinners.third.name}</div>
                    <div className="text-sm opacity-90">{podiumWinners.third.club}</div>
                  </>
                ) : (
                  <div className="text-lg text-orange-100 mt-2">Тодорхойгүй</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Group Stage Results */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Users className="w-6 h-6 text-green-500" />
            Хэсэгийн шатны тоглолт
          </h2>
          
          {groupStageResults.length > 0 ? (
            <div className="space-y-6">
              {groupStageResults.map((group, groupIndex) => (
                <Card key={group.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{group.name}</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {group.players.length} тоглогч
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Players List */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Тоглогчид:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {group.players.map((player, playerIndex) => (
                          <div key={player.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                            <span className="text-sm text-white">{playerIndex + 1}. {player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Results Matrix */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Тоглолтын үр дүн:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-600">
                          <thead>
                            <tr className="bg-gray-700">
                              <th className="border border-gray-600 p-2 text-left text-gray-300">Тоглогч</th>
                              {group.players.map((player, index) => (
                                <th key={index} className="border border-gray-600 p-2 text-center text-gray-300 min-w-[80px]">
                                  {index + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.players.map((player, rowIndex) => (
                              <tr key={rowIndex} className="bg-gray-800">
                                <td className="border border-gray-600 p-2 font-medium text-white">
                                  {rowIndex + 1}. {player.name}
                                </td>
                                {group.players.map((_, colIndex) => (
                                  <td key={colIndex} className="border border-gray-600 p-1 text-center">
                                    {rowIndex === colIndex ? (
                                      <span className="text-gray-500">-</span>
                                    ) : (
                                      <Input
                                        type="text"
                                        value={group.resultMatrix[rowIndex]?.[colIndex] || ''}
                                        onChange={(e) => {
                                          const newMatrix = [...group.resultMatrix];
                                          if (!newMatrix[rowIndex]) newMatrix[rowIndex] = [];
                                          newMatrix[rowIndex][colIndex] = e.target.value;
                                          
                                          setGroupStageResults(prev => prev.map(g => 
                                            g.id === group.id 
                                              ? { ...g, resultMatrix: newMatrix }
                                              : g
                                          ));
                                        }}
                                        className="w-16 h-8 text-center text-xs"
                                        placeholder="3-1"
                                      />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Player Statistics */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Тоглогчдын статистик:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-600">
                          <thead>
                            <tr className="bg-gray-700">
                              <th className="border border-gray-600 p-2 text-left text-gray-300">Тоглогч</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Хожсон</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Хожигдсон</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Оноо</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.players
                              .map((player) => {
                                const stats = group.playerStats.find(s => s.playerId === player.id) || { 
                                  wins: 0, 
                                  losses: 0, 
                                  points: 0 
                                };
                                return { player, stats };
                              })
                              .sort((a, b) => {
                                if (b.stats.points !== a.stats.points) {
                                  return b.stats.points - a.stats.points;
                                }
                                return b.stats.wins - a.stats.wins;
                              })
                              .map(({ player, stats }, index) => (
                                <tr key={player.id} className={`${index < 2 ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                  <td className="border border-gray-600 p-2 text-white">
                                    <div className="flex items-center gap-2">
                                      {index < 2 && <Badge className="bg-green-600 text-xs">Шилжсэн</Badge>}
                                      <span>{player.name}</span>
                                    </div>
                                  </td>
                                  <td className="border border-gray-600 p-2 text-center text-white">{stats.wins}</td>
                                  <td className="border border-gray-600 p-2 text-center text-white">{stats.losses}</td>
                                  <td className="border border-gray-600 p-2 text-center text-white font-bold">{stats.points}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400 mb-4">Хэсэгийн шатны тоглолт үүсгэгдээгүй байна</p>
                <Button 
                  onClick={() => {
                    // Create sample group stage data
                    const sampleGroups: GroupStageGroup[] = [
                      {
                        id: 'group_a',
                        name: 'А хэсэг',
                        players: participants?.slice(0, 4).map((p, i) => ({
                          id: p.id,
                          name: p.user?.firstName && p.user?.lastName 
                            ? `${p.user.firstName} ${p.user.lastName}`
                            : `Тоглогч ${i + 1}`,
                          playerId: p.id,
                          userId: p.userId
                        })) || [],
                        resultMatrix: [],
                        playerStats: []
                      },
                      {
                        id: 'group_b',
                        name: 'Б хэсэг',
                        players: participants?.slice(4, 8).map((p, i) => ({
                          id: p.id,
                          name: p.user?.firstName && p.user?.lastName 
                            ? `${p.user.firstName} ${p.user.lastName}`
                            : `Тоглогч ${i + 5}`,
                          playerId: p.id,
                          userId: p.userId
                        })) || [],
                        resultMatrix: [],
                        playerStats: []
                      }
                    ];
                    setGroupStageResults(sampleGroups);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Хэсэгийн шат үүсгэх
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Qualified Players Tabs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Users className="w-6 h-6 text-blue-500" />
                  Шилжих тоглогчдын удирдлага
                </h2>
            <div className="flex items-center gap-2">
              <Button 
                onClick={generateKnockoutBracket}
                disabled={qualifiedPlayers.length < 4}
                className="bg-green-600 hover:bg-green-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Шигшээ тоглолт үүсгэх
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Excel татах
              </Button>
            </div>
          </div>

          <Tabs value={selectedPlayerTab} onValueChange={setSelectedPlayerTab}>
                <TabsList className="bg-gray-800 border border-gray-700 p-1">
                  <TabsTrigger value="all" className="px-4 py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">Бүгд ({qualifiedPlayers.length})</TabsTrigger>
              {qualifiedPlayers.map((player) => (
                    <TabsTrigger 
                      key={player.id} 
                      value={player.id}
                      className="px-4 py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
                    >
                      {player.name}
                    </TabsTrigger>
                  ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {qualifiedPlayers.map((player) => (
                          <div 
                            key={player.id}
                            className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600"
                          >
                        <Badge variant="outline" className="text-xs">
                          #{player.seed}
                        </Badge>
                        <div className="flex-1">
                              <div className="font-medium text-sm text-white">{player.name}</div>
                              <div className="text-xs text-gray-400">{player.groupName} - {player.position}-р</div>
                            </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {qualifiedPlayers.map((player) => (
                  <TabsContent key={player.id} value={player.id} className="mt-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                            <p className="text-sm text-gray-400">{player.groupName} - {player.position}-р байр</p>
                            <p className="text-xs text-gray-500">Seed: #{player.seed}</p>
                          </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Knockout Bracket */}
            {knockoutResults.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                  <Trophy className="w-6 h-6 text-purple-500" />
                  Шилжих тоглолтын удирдлага
                </h2>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Semifinals */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-center text-white">Хагас финал</h3>
                        <div className="space-y-4">
                          {knockoutResults
                            .filter(match => match.roundName === 'Хагас финал')
                            .map((match) => (
                              <Card key={match.id} className="border-2 border-purple-600 bg-gray-800">
                                <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline">
                                  {match.id.toUpperCase()}
                                </Badge>
                                {match.winner && (
                                  <Badge className="bg-green-600">
                                    Дууссан
                                  </Badge>
                                )}
                              </div>

                              {/* Player 1 */}
                                  <div className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded">
                                    <span className="font-medium text-white">
                                      {match.player1?.name || 'Тоглогч 1'}
                                    </span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={match.player1Score || ''}
                                    onChange={(e) => handleMatchScoreChange(match.id, 'player1Score', e.target.value)}
                                    className="w-16 h-8 text-center"
                                    placeholder="0"
                                  />
                                  <Button
                                    size="sm"
                                    variant={match.winner?.id === match.player1?.id ? "default" : "outline"}
                                    onClick={() => handleWinnerToggle(match.id, match.player1?.id || '')}
                                  >
                                    ✔️
                                  </Button>
                                </div>
                              </div>

                              {/* Player 2 */}
                                  <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                    <span className="font-medium text-white">
                                      {match.player2?.name || 'Тоглогч 2'}
                                    </span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={match.player2Score || ''}
                                    onChange={(e) => handleMatchScoreChange(match.id, 'player2Score', e.target.value)}
                                    className="w-16 h-8 text-center"
                                    placeholder="0"
                                  />
                                  <Button
                                    size="sm"
                                    variant={match.winner?.id === match.player2?.id ? "default" : "outline"}
                                    onClick={() => handleWinnerToggle(match.id, match.player2?.id || '')}
                                  >
                                    ✔️
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>

                  {/* Final */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-center text-white">Финал</h3>
                        {knockoutResults
                          .filter(match => match.roundName === 'Финал')
                          .map((match) => (
                            <Card key={match.id} className="border-2 border-yellow-500 bg-gray-800">
                              <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="bg-yellow-100">
                                ФИНАЛ
                              </Badge>
                              {match.winner && (
                                <Badge className="bg-green-600">
                                  Дууссан
                                </Badge>
                              )}
                            </div>

                            {/* Player 1 */}
                                <div className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded">
                                  <span className="font-medium text-white">
                                    {match.player1?.name || 'Финалист 1'}
                                  </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={match.player1Score || ''}
                                  onChange={(e) => handleMatchScoreChange(match.id, 'player1Score', e.target.value)}
                                  className="w-16 h-8 text-center"
                                  placeholder="0"
                                />
                                <Button
                                  size="sm"
                                  variant={match.winner?.id === match.player1?.id ? "default" : "outline"}
                                  onClick={() => handleWinnerToggle(match.id, match.player1?.id || '')}
                                >
                                  ✔️
                                </Button>
                              </div>
                            </div>

                            {/* Player 2 */}
                                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                  <span className="font-medium text-white">
                                    {match.player2?.name || 'Финалист 2'}
                                  </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={match.player2Score || ''}
                                  onChange={(e) => handleMatchScoreChange(match.id, 'player2Score', e.target.value)}
                                  className="w-16 h-8 text-center"
                                  placeholder="0"
                                />
                                <Button
                                  size="sm"
                                  variant={match.winner?.id === match.player2?.id ? "default" : "outline"}
                                  onClick={() => handleWinnerToggle(match.id, match.player2?.id || '')}
                                >
                                  ✔️
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {/* Third Place */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-center text-white">3-р байр</h3>
                        {knockoutResults
                          .filter(match => match.roundName === '3-р байрны тоглолт')
                          .map((match) => (
                            <Card key={match.id} className="border-2 border-orange-500 bg-gray-800">
                              <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="bg-orange-100">
                                3-Р БАЙР
                              </Badge>
                              {match.winner && (
                                <Badge className="bg-green-600">
                                  Дууссан
                                </Badge>
                              )}
                            </div>

                            {/* Player 1 */}
                                <div className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded">
                                  <span className="font-medium text-white">
                                    {match.player1?.name || 'Тоглогч 1'}
                                  </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={match.player1Score || ''}
                                  onChange={(e) => handleMatchScoreChange(match.id, 'player1Score', e.target.value)}
                                  className="w-16 h-8 text-center"
                                  placeholder="0"
                                />
                                <Button
                                  size="sm"
                                  variant={match.winner?.id === match.player1?.id ? "default" : "outline"}
                                  onClick={() => handleWinnerToggle(match.id, match.player1?.id || '')}
                                >
                                  ✔️
                                </Button>
                              </div>
                            </div>

                            {/* Player 2 */}
                                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                  <span className="font-medium text-white">
                                    {match.player2?.name || 'Тоглогч 2'}
                                  </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={match.player2Score || ''}
                                  onChange={(e) => handleMatchScoreChange(match.id, 'player2Score', e.target.value)}
                                  className="w-16 h-8 text-center"
                                  placeholder="0"
                                />
                                <Button
                                  size="sm"
                                  variant={match.winner?.id === match.player2?.id ? "default" : "outline"}
                                  onClick={() => handleWinnerToggle(match.id, match.player2?.id || '')}
                                >
                                  ✔️
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Panel */}
            <Card className="mb-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5" />
                  Шилжилтийн тохиргоо
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="top1" className="rounded" defaultChecked />
                    <label htmlFor="top1" className="text-sm text-gray-300">Топ 1 шилжих</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="top2" className="rounded" defaultChecked />
                    <label htmlFor="top2" className="text-sm text-gray-300">Топ 2 шилжих</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="luckyDraw" className="rounded" />
                    <label htmlFor="luckyDraw" className="text-sm text-gray-300">Lucky draw сонголт</label>
                  </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button 
                onClick={generateKnockoutBracket}
                disabled={qualifiedPlayers.length < 4}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Хэсэглэлүүдээс шилжилт хийх
              </Button>
              <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-300">Нийтэд харуулах</span>
                {isPublished && <Eye className="w-4 h-4 text-green-600" />}
                {!isPublished && <EyeOff className="w-4 h-4 text-gray-400" />}
              </label>
            </div>
          </CardContent>
        </Card>
            </div>
        </div>
    </PageWithLoading>
  );
};

export default AdminTournamentResults;