import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Medal, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import type { Tournament, TournamentResults } from "@shared/schema";

// Types for structured tournament results
interface GroupStageMatch {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  score: string;
  winner?: string;
}

interface GroupStageGroup {
  groupName: string;
  players: Array<{
    id: string;
    name: string;
    club?: string;
    position?: string;
    wins?: string;
  }>;
  resultMatrix: string[][];
  standings: Array<{
    playerId: string;
    playerName: string;
    wins: number;
    losses: number;
    points: number;
    position: number;
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

interface FinalRanking {
  position: number;
  playerId: string;
  playerName: string;
  prize?: string;
}

export default function TournamentResultsPage() {
  const [match, params] = useRoute("/tournament/:id/results");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Fetch tournament data
  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', params?.id],
    enabled: !!params?.id,
  });

  // Fetch tournament results
  const { data: results, isLoading: resultsLoading } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', params?.id, 'results'],
    enabled: !!params?.id,
  });

  if (tournamentLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Тэмцээний үр дүн ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Тэмцээн олдсонгүй</h1>
          <p className="text-gray-600 mb-4">Хүссэн тэмцээн байхгүй байна.</p>
          <Button 
            onClick={() => setLocation('/tournaments')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Тэмцээний хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  if (!results || !results.isPublished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Үр дүн хараахан бэлэн болоогүй</h1>
          <p className="text-gray-600 mb-4">
            {tournament.status === 'completed' 
              ? 'Тэмцээний үр дүн тун удахгүй нийтлэгдэх болно.'
              : 'Тэмцээн дууссаны дараа үр дүн нийтлэгдэх болно.'
            }
          </p>
          <Button 
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Тэмцээний мэдээлэл руу буцах
          </Button>
        </div>
      </div>
    );
  }

  const groupStageResults: GroupStageGroup[] = results.groupStageResults as GroupStageGroup[] || [];
  const knockoutResults: KnockoutMatch[] = results.knockoutResults as KnockoutMatch[] || [];
  const finalRankings: FinalRanking[] = results.finalRankings as FinalRanking[] || [];

  const navigateToProfile = (playerId: string) => {
    console.log('Navigating to player profile:', playerId);
    setLocation(`/player/${playerId}`);
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
                onClick={() => setLocation(`/tournament/${tournament.id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Буцах
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(tournament.startDate), 'yyyy-MM-dd')} - {format(new Date(tournament.endDate), 'yyyy-MM-dd')}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              Тэмцээний үр дүн
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="finals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="finals">Эцсийн байр</TabsTrigger>
            <TabsTrigger value="knockout">Шоронтох тулаан</TabsTrigger>
            <TabsTrigger value="groups">Групп тулаан</TabsTrigger>
          </TabsList>

          {/* Final Rankings */}
          <TabsContent value="finals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5" />
                  Эцсийн байр
                </CardTitle>
                <CardDescription>
                  Тэмцээний эцсийн үр дүн ба байрлал
                </CardDescription>
              </CardHeader>
              <CardContent>
                {finalRankings.length > 0 ? (
                  <div className="space-y-3">
                    {finalRankings.map((ranking) => (
                      <div 
                        key={ranking.playerId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            ranking.position === 1 ? 'bg-yellow-500' :
                            ranking.position === 2 ? 'bg-gray-400' :
                            ranking.position === 3 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {ranking.position}
                          </div>
                          <button
                            onClick={() => navigateToProfile(ranking.playerId)}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {ranking.playerName}
                          </button>
                        </div>
                        {ranking.prize && (
                          <Badge variant="outline">{ranking.prize}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Эцсийн байр тодорхойлогдоогүй байна</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knockout Bracket */}
          <TabsContent value="knockout">
            <div className="space-y-6">
              {/* Qualified Players from Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Группээс шалгарсан тоглогчид
                  </CardTitle>
                  <CardDescription>
                    Группийн тулаанаас шигшээ тоглолтод шалгарсан эхний 2 тоглогч
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupStageResults.map((group, groupIndex) => {
                      // Get top 2 players from each group based on position
                      const qualifiedPlayers = (group.players || [])
                        .filter(player => {
                          const position = parseInt(player.position || '99');
                          return position <= 2; // Only top 2 positions qualify
                        })
                        .sort((a, b) => {
                          const posA = parseInt(a.position || '99');
                          const posB = parseInt(b.position || '99');
                          return posA - posB;
                        });

                      return (
                        <Card key={groupIndex} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{group.groupName}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {qualifiedPlayers.map((player, playerIndex) => (
                                <div 
                                  key={player.id} 
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    playerIndex === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                      playerIndex === 0 ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`}>
                                      {player.position}
                                    </div>
                                    <button
                                      onClick={() => navigateToProfile(player.id)}
                                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {player.name}
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {player.wins || '0/0'}
                                  </div>
                                </div>
                              ))}
                              {qualifiedPlayers.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-4">
                                  Шалгарсан тоглогч алга
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Knockout Bracket */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Шигшээ тоглолт
                  </CardTitle>
                  <CardDescription>
                    Шалгарсан тоглогчдын хоорондох шигшээ тулаан
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {knockoutResults.length > 0 ? (
                    <KnockoutBracket
                      matches={knockoutResults}
                      onPlayerClick={navigateToProfile}
                      isViewOnly={true}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Шигшээ тоглолтын мэдээлэл хараахан бэлэн болоогүй байна</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Group Stage */}
          <TabsContent value="groups">
            <div className="space-y-6">
              {groupStageResults.length > 0 ? (
                groupStageResults.map((group, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{group.groupName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Results Matrix Table */}
                      <div>
                        <h4 className="font-semibold mb-3">Үр дүн хүснэгт</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">№</th>
                                <th className="border p-2 text-left">Нэр</th>
                                {(group.players || []).map((_, colIndex) => (
                                  <th key={colIndex} className="border p-2 text-center">{colIndex + 1}</th>
                                ))}
                                <th className="border p-2 text-center">Өгсөн</th>
                                <th className="border p-2 text-center">Байр</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(group.players || []).map((player, rowIndex) => {
                                // Use the admin-entered wins value directly from the data structure
                                const adminEnteredWins = player.wins || '0/0';
                                return (
                                  <tr key={player.id}>
                                    <td className="border p-2">{rowIndex + 1}</td>
                                    <td className="border p-2">
                                      <button
                                        onClick={() => {
                                          console.log('Navigate to player profile:', player.id);
                                          navigateToProfile(player.id);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {player.name}
                                      </button>
                                    </td>
                                    {(group.resultMatrix?.[rowIndex] || []).map((result, colIndex) => (
                                      <td key={colIndex} className="border p-2 text-center text-sm">
                                        {rowIndex === colIndex ? '*****' : (result || '')}
                                      </td>
                                    ))}
                                    <td className="border p-2 text-center">{adminEnteredWins}</td>
                                    <td className="border p-2 text-center font-bold">
                                      {player.position || group.standings.find(s => s.playerId === player.id)?.position || ''}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-gray-500 text-center">Групп тулааны мэдээлэл алга байна</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}