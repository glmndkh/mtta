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
  name: string;
  matches: GroupStageMatch[];
  standings: Array<{
    playerId: string;
    playerName: string;
    wins: number;
    losses: number;
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
            <Card>
              <CardHeader>
                <CardTitle>Шоронтох тулаан</CardTitle>
                <CardDescription>
                  Шаардлагат тоглолтууд ба тэдгээрийн үр дүн
                </CardDescription>
              </CardHeader>
              <CardContent>
                {knockoutResults.length > 0 ? (
                  <div className="space-y-6">
                    {['final', 'semifinal', 'quarterfinal', 'round16'].map((round) => {
                      const roundMatches = knockoutResults.filter(match => match.round === round);
                      if (roundMatches.length === 0) return null;

                      const roundNames: Record<string, string> = {
                        final: 'Финал',
                        semifinal: 'Хагас финал',
                        quarterfinal: 'Дөрөвний финал',
                        round16: '16-ын тулаан'
                      };

                      return (
                        <div key={round}>
                          <h3 className="text-lg font-semibold mb-3">{roundNames[round]}</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {roundMatches.map((match) => (
                              <div key={match.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      {match.player1 ? (
                                        <button
                                          onClick={() => navigateToProfile(match.player1!.id)}
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {match.player1.name}
                                        </button>
                                      ) : (
                                        <span className="text-gray-400">TBD</span>
                                      )}
                                      {match.winner?.id === match.player1?.id && (
                                        <Badge variant="default">Ялагч</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {match.player2 ? (
                                        <button
                                          onClick={() => navigateToProfile(match.player2!.id)}
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {match.player2.name}
                                        </button>
                                      ) : (
                                        <span className="text-gray-400">TBD</span>
                                      )}
                                      {match.winner?.id === match.player2?.id && (
                                        <Badge variant="default">Ялагч</Badge>
                                      )}
                                    </div>
                                  </div>
                                  {match.score && (
                                    <div className="text-lg font-semibold text-gray-900">
                                      {match.score}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Шоронтох тулааны мэдээлэл алга байна</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Stage */}
          <TabsContent value="groups">
            <div className="space-y-6">
              {groupStageResults.length > 0 ? (
                groupStageResults.map((group, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Group Standings */}
                        <div>
                          <h4 className="font-semibold mb-3">Групп зэрэглэл</h4>
                          <div className="space-y-2">
                            {group.standings.map((standing, idx) => (
                              <div key={standing.playerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  <span className="font-semibold text-gray-600">{idx + 1}.</span>
                                  <button
                                    onClick={() => navigateToProfile(standing.playerId)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {standing.playerName}
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {standing.wins}Я - {standing.losses}Х ({standing.points} оноо)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Group Matches */}
                        <div>
                          <h4 className="font-semibold mb-3">Тоглолтууд</h4>
                          <div className="space-y-2">
                            {group.matches.map((match) => (
                              <div key={match.id} className="p-2 border rounded text-sm">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => navigateToProfile(match.player1.id)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {match.player1.name}
                                      </button>
                                      {match.winner === match.player1.id && (
                                        <Badge variant="outline" className="text-xs">Ялагч</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => navigateToProfile(match.player2.id)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {match.player2.name}
                                      </button>
                                      {match.winner === match.player2.id && (
                                        <Badge variant="outline" className="text-xs">Ялагч</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="font-semibold">
                                    {match.score}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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