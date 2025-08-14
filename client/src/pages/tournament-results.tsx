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
import PageWithLoading from "@/components/PageWithLoading";
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

  const [activeType, setActiveType] = useState<string>("");

  useEffect(() => {
    if (tournament && tournament.participationTypes?.length && !activeType) {
      setActiveType(tournament.participationTypes[0]);
    }
  }, [tournament, activeType]);

  if (tournamentLoading || resultsLoading) {
    return <PageWithLoading>{null}</PageWithLoading>;
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white">Тэмцээн олдсонгүй</h1>
            <p className="text-gray-300 mb-4">Хүссэн тэмцээн байхгүй байна.</p>
            <Button 
              onClick={() => setLocation('/tournaments')}
              variant="outline"
              className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Тэмцээний хуудас руу буцах
            </Button>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (!results || !results.isPublished) {
    return (
      <PageWithLoading>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Үр дүн хараахан бэлэн болоогүй</h1>
            <p className="text-gray-300 mb-4">
              {tournament.status === 'completed' 
                ? 'Тэмцээний үр дүн тун удахгүй нийтлэгдэх болно.'
                : 'Тэмцээн дууссаны дараа үр дүн нийтлэгдэх болно.'
              }
            </p>
            <Button 
              onClick={() => setLocation(`/tournament/${tournament.id}`)}
              variant="outline"
              className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Тэмцээний мэдээлэл руу буцах
            </Button>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  const groupStageResultsByType = (results.groupStageResults as Record<string, GroupStageGroup[]> || {});
  const knockoutResultsByType = (results.knockoutResults as Record<string, KnockoutMatch[]> || {});
  const finalRankingsByType = (results.finalRankings as Record<string, FinalRanking[]> || {});

  const groupStageResults: GroupStageGroup[] = groupStageResultsByType[activeType] || [];
  const knockoutResults: KnockoutMatch[] = knockoutResultsByType[activeType] || [];
  const finalRankings: FinalRanking[] = finalRankingsByType[activeType] || [];

  const navigateToProfile = (playerId: string) => {
    console.log('Navigating to player profile:', playerId);
    setLocation(`/player/${playerId}`);
  };

  return (
    <PageWithLoading>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Буцах
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-gray-300 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.startDate), 'yyyy-MM-dd')} - {format(new Date(tournament.endDate), 'yyyy-MM-dd')}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-700 text-green-100">
              <Trophy className="w-4 h-4" />
              Тэмцээний үр дүн
            </Badge>
          </div>
        </div>

        {tournament.participationTypes && tournament.participationTypes.length > 0 ? (
          <>
        <Tabs value={activeType} onValueChange={setActiveType} className="mb-6">
          <TabsList className="w-full flex flex-wrap bg-gray-800 border-gray-600">
            {tournament.participationTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">
                {type.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-6">
        <Tabs defaultValue="finals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-600">
            <TabsTrigger value="finals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">Эцсийн байр</TabsTrigger>
            <TabsTrigger value="knockout" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">Шигшээ тоглолт</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">Групп тулаан</TabsTrigger>
          </TabsList>

          {/* Final Rankings */}
          <TabsContent value="finals">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Medal className="w-5 h-5 text-green-400" />
                  Эцсийн байр
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Тэмцээний эцсийн үр дүн ба байрлал
                </CardDescription>
              </CardHeader>
              <CardContent>
                {finalRankings.length > 0 ? (
                  <div className="space-y-3">
                    {finalRankings.map((ranking) => (
                      <div 
                        key={ranking.playerId}
                        className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-600 rounded-lg"
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
                            className="text-lg font-semibold text-green-400 hover:text-green-300 hover:underline"
                          >
                            {ranking.playerName}
                          </button>
                        </div>
                        {ranking.prize && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">{ranking.prize}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Эцсийн байр тодорхойлогдоогүй байна</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knockout Bracket */}
          <TabsContent value="knockout">
            <div className="space-y-6">
              {/* Qualified Players from Groups */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-green-400" />
                    Группээс шалгарсан тоглогчид
                  </CardTitle>
                  <CardDescription className="text-gray-300">
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
                        <Card key={groupIndex} className="card-dark border-l-4 border-l-green-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-white">{group.groupName}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {qualifiedPlayers.map((player, playerIndex) => (
                                <div 
                                  key={player.id} 
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    playerIndex === 0 ? 'bg-yellow-900/30 border border-yellow-500' : 'bg-gray-800/50 border border-gray-600'
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
                                      className="font-medium text-green-400 hover:text-green-300 hover:underline"
                                    >
                                      {player.name}
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {player.wins || '0/0'}
                                  </div>
                                </div>
                              ))}
                              {qualifiedPlayers.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-4">
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

              {/* Winners Podium */}
              {finalRankings.length > 0 && (
                <Card className="card-dark border-2 border-yellow-500 bg-gradient-to-r from-yellow-900/20 to-amber-900/20">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                      <Trophy className="w-8 h-8 text-yellow-600" />
                      Тэмцээний эцсийн үр дүн
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Медаль хүртэгчид
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-center space-x-4 mb-6">
                      {/* 2nd Place */}
                      {finalRankings.find(r => r.position === 2) && (
                        <div className="text-center">
                          <div className="w-20 h-16 bg-gray-400 rounded-t-lg flex items-center justify-center mb-2">
                            <span className="text-white text-3xl font-bold">2</span>
                          </div>
                          <div className="text-4xl mb-2">🥈</div>
                          <button
                            onClick={() => navigateToProfile(finalRankings.find(r => r.position === 2)!.playerId)}
                            className="font-semibold text-green-400 hover:text-green-300 hover:underline"
                          >
                            {finalRankings.find(r => r.position === 2)!.playerName}
                          </button>
                        </div>
                      )}
                      
                      {/* 1st Place */}
                      {finalRankings.find(r => r.position === 1) && (
                        <div className="text-center">
                          <div className="w-24 h-20 bg-yellow-500 rounded-t-lg flex items-center justify-center mb-2">
                            <span className="text-white text-4xl font-bold">1</span>
                          </div>
                          <div className="text-6xl mb-2">🥇</div>
                          <button
                            onClick={() => navigateToProfile(finalRankings.find(r => r.position === 1)!.playerId)}
                            className="font-bold text-xl text-green-400 hover:text-green-300 hover:underline"
                          >
                            {finalRankings.find(r => r.position === 1)!.playerName}
                          </button>
                          <div className="text-yellow-500 font-semibold mt-1">АВАРГА</div>
                        </div>
                      )}
                      
                      {/* 3rd Place */}
                      {finalRankings.find(r => r.position === 3) && (
                        <div className="text-center">
                          <div className="w-20 h-16 bg-amber-600 rounded-t-lg flex items-center justify-center mb-2">
                            <span className="text-white text-3xl font-bold">3</span>
                          </div>
                          <div className="text-4xl mb-2">🥉</div>
                          <button
                            onClick={() => navigateToProfile(finalRankings.find(r => r.position === 3)!.playerId)}
                            className="font-semibold text-green-400 hover:text-green-300 hover:underline"
                          >
                            {finalRankings.find(r => r.position === 3)!.playerName}
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Organized Match Results */}
              {knockoutResults.length > 0 ? (
                <div className="space-y-6">
                  {/* Semifinals */}
                  {(() => {
                    const semifinals = knockoutResults.filter(match => 
                      match.round === "Хагас финал" || match.round === "1" || 
                      (match.id && (match.id.includes('match_1_') || match.round.includes('финал')))
                    );
                    
                    if (semifinals.length > 0) {
                      return (
                        <Card className="card-dark border-l-4 border-l-orange-500">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-400">
                              <Trophy className="w-5 h-5" />
                              Хагас финал
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300">{semifinals.length} тоглолт</Badge>
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                              Финалд шалгарах төлөөх тоглолт
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                              {semifinals.map((match, index) => (
                                <div key={match.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                                  <div className="text-sm text-gray-300 mb-2">Тоглолт #{index + 1}</div>
                                  <div className="space-y-2">
                                    <div className={`flex items-center justify-between p-2 rounded ${
                                      match.winner?.id === match.player1?.id ? 'bg-green-900/30 border border-green-500' : 'bg-gray-700/50'
                                    }`}>
                                      <button
                                        onClick={() => match.player1 && navigateToProfile(match.player1.id)}
                                        className="font-medium text-green-400 hover:text-green-300 hover:underline"
                                      >
                                        {match.player1?.name || 'TBD'}
                                      </button>
                                      {match.winner?.id === match.player1?.id && (
                                        <span className="text-green-400 font-bold">Ялагч</span>
                                      )}
                                    </div>
                                    <div className="text-center text-lg font-bold text-gray-300">
                                      {match.score || 'vs'}
                                    </div>
                                    <div className={`flex items-center justify-between p-2 rounded ${
                                      match.winner?.id === match.player2?.id ? 'bg-green-900/30 border border-green-500' : 'bg-gray-700/50'
                                    }`}>
                                      <button
                                        onClick={() => match.player2 && navigateToProfile(match.player2.id)}
                                        className="font-medium text-green-400 hover:text-green-300 hover:underline"
                                      >
                                        {match.player2?.name || 'TBD'}
                                      </button>
                                      {match.winner?.id === match.player2?.id && (
                                        <span className="text-green-400 font-bold">Ялагч</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}

                  {/* Finals */}
                  {(() => {
                    const finals = knockoutResults.filter(match => 
                      match.round === "Финал" || match.round === "2" || 
                      (match.id && match.id.includes('match_2_0'))
                    );
                    
                    if (finals.length > 0) {
                      return (
                        <Card className="card-dark border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-900/20 to-amber-900/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-400">
                              <Trophy className="w-6 h-6" />
                              Финал
                              <Badge variant="outline" className="bg-yellow-900/30 border-yellow-500 text-yellow-300">Аварга шалгаруулах</Badge>
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                              Тэмцээний хамгийн чухал тоглолт
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {finals.map((match) => (
                              <div key={match.id} className="bg-gray-800/50 border-2 border-yellow-500 rounded-lg p-6">
                                <div className="text-center mb-4">
                                  <h3 className="text-xl font-bold text-white">ФИНАЛЫН ТОГЛОЛТ</h3>
                                </div>
                                <div className="space-y-3">
                                  <div className={`flex items-center justify-between p-4 rounded-lg ${
                                    match.winner?.id === match.player1?.id ? 'bg-yellow-900/30 border-2 border-yellow-400' : 'bg-gray-700/50'
                                  }`}>
                                    <button
                                      onClick={() => match.player1 && navigateToProfile(match.player1.id)}
                                      className="text-lg font-semibold text-green-400 hover:text-green-300 hover:underline"
                                    >
                                      {match.player1?.name || 'TBD'}
                                    </button>
                                    {match.winner?.id === match.player1?.id && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">🥇</span>
                                        <span className="text-yellow-400 font-bold">АВАРГА</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-center text-2xl font-bold text-gray-300">
                                    {match.score || 'vs'}
                                  </div>
                                  <div className={`flex items-center justify-between p-4 rounded-lg ${
                                    match.winner?.id === match.player2?.id ? 'bg-yellow-900/30 border-2 border-yellow-400' : 'bg-gray-700/50'
                                  }`}>
                                    <button
                                      onClick={() => match.player2 && navigateToProfile(match.player2.id)}
                                      className="text-lg font-semibold text-green-400 hover:text-green-300 hover:underline"
                                    >
                                      {match.player2?.name || 'TBD'}
                                    </button>
                                    {match.winner?.id === match.player2?.id && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">🥇</span>
                                        <span className="text-yellow-400 font-bold">АВАРГА</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}

                  {/* Third Place Playoff */}
                  {(() => {
                    const thirdPlace = knockoutResults.filter(match => 
                      match.round === "3-р байрын тоглолт" || match.id === "third_place_playoff"
                    );
                    
                    if (thirdPlace.length > 0) {
                      return (
                        <Card className="card-dark border-l-4 border-l-amber-600">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-400">
                              <Medal className="w-5 h-5" />
                              3-р байрын тоглолт
                              <Badge variant="outline" className="bg-amber-900/30 border-amber-500 text-amber-300">Хүрэл медаль</Badge>
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                              Хагас финалд хожигдсон тоглогчдын хоорондох тоглолт
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {thirdPlace.map((match) => (
                              <div key={match.id} className="bg-amber-900/20 border border-amber-500 rounded-lg p-4">
                                <div className="space-y-2">
                                  <div className={`flex items-center justify-between p-3 rounded ${
                                    match.winner?.id === match.player1?.id ? 'bg-amber-900/30 border border-amber-400' : 'bg-gray-700/50'
                                  }`}>
                                    <button
                                      onClick={() => match.player1 && navigateToProfile(match.player1.id)}
                                      className="font-medium text-green-400 hover:text-green-300 hover:underline"
                                    >
                                      {match.player1?.name || 'TBD'}
                                    </button>
                                    {match.winner?.id === match.player1?.id && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">🥉</span>
                                        <span className="text-amber-400 font-bold">3-р байр</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-center text-lg font-bold text-gray-300">
                                    {match.score || 'vs'}
                                  </div>
                                  <div className={`flex items-center justify-between p-3 rounded ${
                                    match.winner?.id === match.player2?.id ? 'bg-amber-900/30 border border-amber-400' : 'bg-gray-700/50'
                                  }`}>
                                    <button
                                      onClick={() => match.player2 && navigateToProfile(match.player2.id)}
                                      className="font-medium text-green-400 hover:text-green-300 hover:underline"
                                    >
                                      {match.player2?.name || 'TBD'}
                                    </button>
                                    {match.winner?.id === match.player2?.id && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">🥉</span>
                                        <span className="text-amber-400 font-bold">3-р байр</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}
                </div>
              ) : (
                <Card className="card-dark">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Шигшээ тоглолтын мэдээлэл хараахан бэлэн болоогүй байна</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Group Stage */}
          <TabsContent value="groups">
            <div className="space-y-6">
              {groupStageResults.length > 0 ? (
                groupStageResults.map((group, index) => (
                  <Card key={index} className="card-dark">
                    <CardHeader>
                      <CardTitle className="text-white">{group.groupName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Results Matrix Table */}
                      <div>
                        <h4 className="font-semibold mb-3 text-white">Үр дүн хүснэгт</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-800">
                                <th className="border border-gray-600 p-2 text-left text-gray-300">№</th>
                                <th className="border border-gray-600 p-2 text-left text-gray-300">Нэр</th>
                                {(group.players || []).map((_, colIndex) => (
                                  <th key={colIndex} className="border border-gray-600 p-2 text-center text-gray-300">{colIndex + 1}</th>
                                ))}
                                <th className="border border-gray-600 p-2 text-center text-gray-300">Өгсөн</th>
                                <th className="border border-gray-600 p-2 text-center text-gray-300">Байр</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(group.players || []).map((player, rowIndex) => {
                                // Use the admin-entered wins value directly from the data structure
                                const adminEnteredWins = player.wins || '0/0';
                                return (
                                  <tr key={player.id} className="hover:bg-gray-700/50">
                                    <td className="border border-gray-600 p-2 text-gray-300">{rowIndex + 1}</td>
                                    <td className="border border-gray-600 p-2">
                                      <button
                                        onClick={() => {
                                          console.log('Navigate to player profile:', player.id);
                                          navigateToProfile(player.id);
                                        }}
                                        className="text-green-400 hover:text-green-300 hover:underline"
                                      >
                                        {player.name}
                                      </button>
                                    </td>
                                    {(group.resultMatrix?.[rowIndex] || []).map((result, colIndex) => (
                                      <td key={colIndex} className="border border-gray-600 p-2 text-center text-sm text-gray-300">
                                        {rowIndex === colIndex ? '*****' : (result || '')}
                                      </td>
                                    ))}
                                    <td className="border border-gray-600 p-2 text-center text-gray-300">{adminEnteredWins}</td>
                                    <td className="border border-gray-600 p-2 text-center font-bold text-white">
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
                <Card className="card-dark">
                  <CardContent className="py-8">
                    <p className="text-gray-400 text-center">Групп тулааны мэдээлэл алга байна</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
        </>
        ) : (
          <div className="text-center text-gray-300">Тэмцээнд төрөл байхгүй байна.</div>
        )}
      </div>
    </PageWithLoading>
  );
}