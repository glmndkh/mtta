import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Users, Calendar, Target, Eye, Zap } from "lucide-react";
import { Link } from "wouter";

interface League {
  id: string;
  name: string;
  description: string;
  season: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  points: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
}

interface LeagueMatch {
  id: string;
  team1: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  team2: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  team1Score: number;
  team2Score: number;
  matchDate: string;
  matchTime?: string;
  status: string;
  playerMatches: Array<{
    id: string;
    player1Name: string;
    player2Name: string;
    sets: Array<{ player1: number; player2: number }>;
    player1SetsWon: number;
    player2SetsWon: number;
    winnerId?: string;
  }>;
}

export default function LeagueDetails() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/leagues/:id");
  const leagueId = params?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Энэ хуудсыг үзэхийн тулд нэвтэрнэ үү...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch league details
  const { data: league, isLoading: leagueLoading } = useQuery<League>({
    queryKey: ["/api/leagues", leagueId],
    enabled: !!leagueId && isAuthenticated,
  });

  // Fetch league teams/standings
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/leagues", leagueId, "teams"],
    enabled: !!leagueId && isAuthenticated,
  });

  // Fetch league matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery<LeagueMatch[]>({
    queryKey: ["/api/leagues", leagueId, "matches"],
    enabled: !!leagueId && isAuthenticated,
  });

  if (isLoading || leagueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !match) {
    return null;
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Лиг олдсонгүй</h3>
            <p className="text-gray-600 mb-6">Энэ лиг олдсонгүй эсвэл устгагдсан байна</p>
            <Link href="/leagues">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Буцах
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMatchResultDisplay = (match: LeagueMatch) => {
    return `${match.team1Score} : ${match.team2Score}`;
  };

  const getMatchWinner = (match: LeagueMatch) => {
    if (match.team1Score > match.team2Score) return match.team1.name;
    if (match.team2Score > match.team1Score) return match.team2.name;
    return "Тэнцэв";
  };

  const getSetResult = (sets: Array<{ player1: number; player2: number }>) => {
    return sets.map(set => `${set.player1}-${set.player2}`).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/leagues">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Буцах
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {league.season}
                </Badge>
                <span className="text-gray-600">
                  {formatDate(league.startDate)} - {formatDate(league.endDate)}
                </span>
              </div>
            </div>
          </div>
          {league.description && (
            <p className="text-gray-600">{league.description}</p>
          )}
        </div>

        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Хүснэгт
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Тоглолтууд
            </TabsTrigger>
          </TabsList>

          {/* League Standings */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-mtta-green" />
                  Лигийн хүснэгт
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-4"></div>
                    <p className="text-gray-600">Хүснэгт уншиж байна...</p>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор багууд байхгүй байна</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Байрлал</TableHead>
                        <TableHead>Баг</TableHead>
                        <TableHead className="text-center">Т</TableHead>
                        <TableHead className="text-center">Х</TableHead>
                        <TableHead className="text-center">Я</TableHead>
                        <TableHead className="text-center">Оноо</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team, index) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt={`${team.name} logo`}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-mtta-green rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {team.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{team.matchesPlayed || (team.wins + team.losses)}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{team.wins}</TableCell>
                          <TableCell className="text-center text-red-600 font-medium">{team.losses}</TableCell>
                          <TableCell className="text-center font-bold">{team.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* League Matches */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-mtta-green" />
                  Тоглолтын үр дүн
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-4"></div>
                    <p className="text-gray-600">Тоглолтууд уншиж байна...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор тоглолт байхгүй байна</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-6 space-y-4">
                      {/* Match Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center gap-3 mb-2">
                              {match.team1.logoUrl ? (
                                <img
                                  src={match.team1.logoUrl}
                                  alt={`${match.team1.name} logo`}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {match.team1.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-semibold">{match.team1.name}</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {getMatchResultDisplay(match)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {getMatchWinner(match)}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold">{match.team2.name}</span>
                              {match.team2.logoUrl ? (
                                <img
                                  src={match.team2.logoUrl}
                                  alt={`${match.team2.name} logo`}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {match.team2.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-600">
                          <div>{match.matchDate && formatDate(match.matchDate)}</div>
                          {match.matchTime && <div>{match.matchTime}</div>}
                        </div>
                      </div>

                      {/* Individual Player Matches */}
                      {match.playerMatches && match.playerMatches.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-gray-900">Тоглогчдын тоглолт</h4>
                          <div className="space-y-3">
                            {match.playerMatches.map((playerMatch, index) => (
                              <div key={playerMatch.id} className="flex items-center justify-between bg-white rounded p-3">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{playerMatch.player1Name}</span>
                                    <span className="text-gray-500">vs</span>
                                    <span className="font-medium">{playerMatch.player2Name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-gray-600">
                                    {getSetResult(playerMatch.sets)}
                                  </div>
                                  <div className="font-semibold">
                                    {playerMatch.player1SetsWon} - {playerMatch.player2SetsWon}
                                  </div>
                                  {playerMatch.winnerId && (
                                    <Badge variant="outline" className="text-xs">
                                      {playerMatch.winnerId === match.team1.id ? playerMatch.player1Name : playerMatch.player2Name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}