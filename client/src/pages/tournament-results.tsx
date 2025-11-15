import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { ArrowLeft, Trophy, Users, Award } from "lucide-react";
import { normalizeKnockoutMatches } from "@/lib/knockout";
import { PodiumSection } from "@/components/PodiumSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Tournament, TournamentResults } from "@shared/schema";

interface GroupStageGroup {
  id: string;
  name: string;
  players: Array<{ id: string; name: string; club?: string }>;
  resultMatrix: string[][];
  playerStats: Array<{
    playerId: string;
    wins: number;
    losses: number;
    points: number;
    setsWon?: number;
    setsLost?: number;
  }>;
}

interface KnockoutMatch {
  id: string;
  round: number | string;
  roundName?: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
}

interface FinalRanking {
  position: number;
  player: {
    id: string;
    name: string;
  };
  points?: number;
  note?: string;
}

const TournamentResults: React.FC = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tournament/:id/results");

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ["/api/tournaments", params?.id],
    enabled: !!params?.id,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<TournamentResults>({
    queryKey: ["/api/tournaments", params?.id, "results"],
    enabled: !!params?.id,
  });

  if (tournamentLoading || resultsLoading) {
    return (
      <PageWithLoading>
        {null}
      </PageWithLoading>
    );
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Тэмцээн олдсонгүй</p>
          <Button onClick={() => setLocation("/tournaments")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
        </div>
      </PageWithLoading>
    );
  }

  const groupStageResults: GroupStageGroup[] = (results?.groupStageResults as any) || [];
  const rawKnockoutResults: KnockoutMatch[] = (results?.knockoutResults as any) || [];
  const knockoutResults = normalizeKnockoutMatches(rawKnockoutResults) as KnockoutMatch[];
  const finalRankings: FinalRanking[] = (results?.finalRankings as any) || [];

  const hasImages =
    results?.finalRankings &&
    typeof results.finalRankings === "object" &&
    "images" in results.finalRankings &&
    Array.isArray((results.finalRankings as any).images) &&
    (results.finalRankings as any).images.length > 0;

  const hasFinalRankings =
    results?.finalRankings && Array.isArray(results.finalRankings) && results.finalRankings.length > 0;

  const hasGroupStage =
    groupStageResults && Array.isArray(groupStageResults) && groupStageResults.length > 0;

  const hasKnockout =
    knockoutResults && Array.isArray(knockoutResults) && knockoutResults.length > 0;

  if (!results || (!hasImages && !hasFinalRankings && !hasGroupStage && !hasKnockout)) {
    return (
      <PageWithLoading>
        <Navigation />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <Button onClick={() => setLocation(`/tournament/${params?.id}`)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  {tournament.name} - Үр дүн
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Тэмцээний үр дүн хараахан оруулаагүй байна
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Back button */}
          <Button onClick={() => setLocation(`/tournament/${params?.id}`)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>

          {/* Tournament header */}
          <Card className="border border-yellow-500/40 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                    {tournament.name} - Үр дүн
                  </CardTitle>
                  <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                    {tournament.location} •{" "}
                    {tournament.startDate &&
                      format(new Date(tournament.startDate), "yyyy-MM-dd")}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
                  {hasGroupStage && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Групп шат: {groupStageResults.length} групп</span>
                    </div>
                  )}
                  {hasKnockout && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>Шигшээ шат: идэвхтэй</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main tabs: overview / group stage / knockout / standings */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full mb-4">
              <TabsTrigger value="overview">Нийт тойм</TabsTrigger>
              <TabsTrigger value="groups">Групп шат</TabsTrigger>
              <TabsTrigger value="knockout">Шигшээ шат</TabsTrigger>
              <TabsTrigger value="standings">Эцсийн байр</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Podium */}
              {hasFinalRankings && finalRankings.length >= 3 && (
                <PodiumSection rankings={finalRankings.slice(0, 3)} />
              )}

              {/* Final rankings images gallery */}
              {hasImages && (
                <Card>
                  <CardHeader>
                    <CardTitle>Фото / медаль гардуулах мөчүүд</CardTitle>
                    <CardDescription>
                      Тэмцээний үр дүнтэй холбоотой зурагнууд
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(results!.finalRankings as any).images.map(
                        (image: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-100 dark:border-gray-700"
                          >
                            <img
                              src={
                                image.url.startsWith("/")
                                  ? image.url
                                  : `/objects/${image.url}`
                              }
                              alt={image.description || `Үр дүн ${index + 1}`}
                              className="w-full h-64 object-cover"
                            />
                            {image.description && (
                              <div className="p-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {image.description}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* GROUP STAGE TAB */}
            <TabsContent value="groups" className="space-y-4">
              {groupStageResults.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-600 dark:text-gray-400">
                    Энэ тэмцээнд группийн шатны үр дүн байхгүй байна.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Хэсгийн шатны үр дүн
                  </h2>
                  <div className="space-y-4">
                    {groupStageResults.map((group) => (
                      <Card key={group.id}>
                        <CardHeader>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>
                            Нийт оролцогч: {group.players.length}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Байр</TableHead>
                                <TableHead>Тоглогч</TableHead>
                                <TableHead>Хожсон</TableHead>
                                <TableHead>Хожигдсон</TableHead>
                                <TableHead>Оноо</TableHead>
                                <TableHead>Сэт +/-</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.players
                                .map((player) => {
                                  const stats =
                                    group.playerStats?.find(
                                      (s) => s.playerId === player.id
                                    ) || {
                                      wins: 0,
                                      losses: 0,
                                      points: 0,
                                      setsWon: 0,
                                      setsLost: 0,
                                    };
                                  return { player, stats };
                                })
                                .sort((a, b) => {
                                  if (b.stats.points !== a.stats.points) {
                                    return b.stats.points - a.stats.points;
                                  }
                                  const setsDiffA =
                                    (a.stats.setsWon || 0) -
                                    (a.stats.setsLost || 0);
                                  const setsDiffB =
                                    (b.stats.setsWon || 0) -
                                    (b.stats.setsLost || 0);
                                  return setsDiffB - setsDiffA;
                                })
                                .map(({ player, stats }, position) => {
                                  const diff =
                                    (stats.setsWon || 0) -
                                    (stats.setsLost || 0);
                                  const diffPositive = diff >= 0;
                                  return (
                                    <TableRow key={player.id}>
                                      <TableCell className="font-bold">
                                        {position + 1}
                                      </TableCell>
                                      <TableCell>{player.name}</TableCell>
                                      <TableCell>{stats.wins}</TableCell>
                                      <TableCell>{stats.losses}</TableCell>
                                      <TableCell className="font-bold">
                                        {stats.points}
                                      </TableCell>
                                      <TableCell>
                                        <span
                                          className={
                                            diffPositive
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          {diffPositive ? "+" : ""}
                                          {diff}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* KNOCKOUT TAB */}
            <TabsContent value="knockout" className="space-y-4">
              {knockoutResults.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-600 dark:text-gray-400">
                    Энэ тэмцээнд шигшээ шатны мэдээлэл байхгүй байна.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Шигшээ тоглолт
                  </h2>
                  <Card>
                    <CardContent className="p-6 overflow-x-auto">
                      <KnockoutBracket
                        matches={knockoutResults.map((match) => ({
                          id: match.id,
                          round: Number(match.round),
                          player1: match.player1,
                          player2: match.player2,
                          winner: match.winner,
                          score1: match.player1Score
                            ? parseInt(match.player1Score, 10)
                            : undefined,
                          score2: match.player2Score
                            ? parseInt(match.player2Score, 10)
                            : undefined,
                          position: match.position,
                        }))}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* FINAL STANDINGS TAB */}
            <TabsContent value="standings" className="space-y-4">
              {finalRankings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-600 dark:text-gray-400">
                    Эцсийн байрлалын мэдээлэл байхгүй байна.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Эцсийн байр, медальтнууд
                  </h2>

                  {/* Podium again (optional) */}
                  {finalRankings.length >= 3 && (
                    <PodiumSection rankings={finalRankings.slice(0, 3)} />
                  )}

                  {/* 4-р байрнаас доош */}
                  {finalRankings.length > 3 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Бусад байрлалт</CardTitle>
                        <CardDescription>
                          4-р байр болон түүнээс доош байрлалтай тоглогчид
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Байр</TableHead>
                              <TableHead>Тоглогч</TableHead>
                              <TableHead>Оноо</TableHead>
                              <TableHead>Тэмдэглэл</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {finalRankings.slice(3).map((ranking) => (
                              <TableRow key={ranking.player.id}>
                                <TableCell className="font-bold">
                                  {ranking.position}
                                </TableCell>
                                <TableCell>{ranking.player.name}</TableCell>
                                <TableCell>
                                  {ranking.points ?? "-"}
                                </TableCell>
                                <TableCell>
                                  {ranking.note ?? "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
};

export default TournamentResults;
