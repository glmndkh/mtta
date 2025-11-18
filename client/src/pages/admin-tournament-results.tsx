import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Save,
  Users,
  Trophy,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import type {
  Tournament,
  TournamentResults,
  TournamentParticipant,
  User as UserType,
} from "@shared/schema";

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
  player1?: {
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  };
  player2?: {
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  };
  winner?: {
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  };
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
  const [groupStageResults, setGroupStageResults] = useState<GroupStageGroup[]>(
    [],
  );
  const [knockoutResults, setKnockoutResults] = useState<KnockoutMatch[]>([]);
  const [finalRankings, setFinalRankings] = useState<FinalRanking[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [qualifiedPlayers, setQualifiedPlayers] = useState<QualifiedPlayer[]>(
    [],
  );
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<
    "SINGLES" | "DOUBLES" | "TEAM"
  >("SINGLES");

  // Fetch tournament data
  const { data: tournament, isLoading: tournamentLoading } =
    useQuery<Tournament>({
      queryKey: ["/api/tournaments", params?.tournamentId],
      enabled: !!params?.tournamentId,
    });

  // Fetch existing results
  const { data: existingResults } = useQuery<TournamentResults>({
    queryKey: ["/api/tournaments", params?.tournamentId, "results"],
    enabled: !!params?.tournamentId,
  });

  // Fetch participants
  const { data: participants } = useQuery<TournamentParticipant[]>({
    queryKey: ["/api/tournaments", params?.tournamentId, "participants"],
    enabled: !!params?.tournamentId,
  });

  // Fetch tournament teams/pairs for count display
  const { data: tournamentTeams = [] } = useQuery<any[]>({
    queryKey: ["/api/tournaments", params?.tournamentId, "teams"],
    enabled: !!params?.tournamentId,
  });

  // Fetch all users for autocomplete
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!params?.tournamentId,
  });

  // Fetch tournaments for dropdown (одоогоор доор ашиглагдахгүй ч үлдээе)
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch("/api/tournaments");
        if (!response.ok) throw new Error("Failed to fetch tournaments");
        const data = await response.json();
        setTournaments(data);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast({
          title: "Алдаа",
          description: "Тэмцээний жагсаалтыг татаж чадсангүй",
          variant: "destructive",
        });
      }
    };

    fetchTournaments();
  }, []);

  // participationTypes -> event types
  const getAvailableEventTypes = () => {
    if (!tournament?.participationTypes || tournament.participationTypes.length === 0) {
      // Fallback: if no participation types, return all types
      return ["SINGLES", "DOUBLES", "TEAM"] as ("SINGLES" | "DOUBLES" | "TEAM")[];
    }
    
    const mappedTypes = tournament.participationTypes.map((type) => {
      const upperType = type.toUpperCase();
      // Map common variations
      if (upperType.includes('SINGLE') || upperType === 'INDIVIDUAL') return 'SINGLES';
      if (upperType.includes('DOUBLE') || upperType.includes('PAIR')) return 'DOUBLES';
      if (upperType.includes('TEAM')) return 'TEAM';
      return null;
    }).filter(Boolean) as ("SINGLES" | "DOUBLES" | "TEAM")[];
    
    // Remove duplicates
    return [...new Set(mappedTypes)];
  };

  const getParticipantsByEventType = (
    eventType: "SINGLES" | "DOUBLES" | "TEAM",
  ) => {
    if (!participants) return [];
    return participants.filter((p: any) => p.participationType === eventType);
  };

  const getTeamsByEventType = (eventType: "SINGLES" | "DOUBLES" | "TEAM") => {
    if (!tournamentTeams) return [];
    return tournamentTeams.filter((team: any) => team.eventType === eventType);
  };

  const getCountDisplay = (eventType: "SINGLES" | "DOUBLES" | "TEAM") => {
    if (eventType === "SINGLES") {
      const count = getParticipantsByEventType(eventType).length;
      return `Нийт: ${count} оролцогч`;
    } else if (eventType === "DOUBLES") {
      const pairCount = getTeamsByEventType(eventType).length;
      const participantCount = getParticipantsByEventType(eventType).length;
      return `Нийт: ${pairCount} хос (${participantCount} тоглогч)`;
    } else {
      const teamCount = getTeamsByEventType(eventType).length;
      const participantCount = getParticipantsByEventType(eventType).length;
      return `Нийт: ${teamCount} баг (${participantCount} гишүүн)`;
    }
  };

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/tournament-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Үр дүн хадгалахад алдаа гарлаа");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: isPublished
          ? "Тэмцээний үр дүн нийтлэгдлээ"
          : "Тэмцээний үр дүн хадгалагдлаа (хараахан нийтлэгдээгүй)",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tournaments", params?.tournamentId, "results"],
      });
    },
    onError: (error: any) => {
      console.error("Error saving tournament results:", error);
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
      setKnockoutResults(
        Array.isArray(knockoutResultsData) ? knockoutResultsData : [],
      );
      setFinalRankings(
        Array.isArray(finalRankingsData) ? finalRankingsData : [],
      );
      setIsPublished(existingResults.isPublished || false);
    }
  }, [existingResults]);

  // Qualified players from groupStageResults
  useEffect(() => {
    const qualified: QualifiedPlayer[] = [];

    if (Array.isArray(groupStageResults)) {
      groupStageResults.forEach((group) => {
        if (group.players.length >= 2) {
          const sortedPlayers = group.players
            .map((player) => {
              const stats = group.playerStats.find(
                (s) => s.playerId === player.id,
              ) || {
                wins: 0,
                losses: 0,
                points: 0,
                setsWon: 0,
                setsLost: 0,
                setsDifference: 0,
              };
              return { player, stats };
            })
            .sort((a, b) => {
              if (b.stats.points !== a.stats.points) {
                return b.stats.points - a.stats.points;
              }
              return b.stats.wins - a.stats.wins;
            });

          sortedPlayers.slice(0, 2).forEach((item, index) => {
            qualified.push({
              id: item.player.id,
              name: item.player.name,
              groupName: group.name,
              position: index + 1,
              seed: qualified.length + 1,
            });
          });
        }
      });
    }

    setQualifiedPlayers(qualified);
  }, [groupStageResults]);

  // Podium (одоогоор зөвхөн текстэд ашиглаж болох)
  const getPodiumWinners = () => {
    const podium = {
      first: null as { id: string; name: string; club?: string } | null,
      second: null as { id: string; name: string; club?: string } | null,
      third: null as { id: string; name: string; club?: string } | null,
    };

    const finalMatch = knockoutResults.find((m) => m.roundName === "Финал");
    if (finalMatch?.winner) {
      podium.first = {
        id: finalMatch.winner.id,
        name: finalMatch.winner.name,
        club: "Клуб нэр",
      };

      const finalLoser =
        finalMatch.player1?.id === finalMatch.winner.id
          ? finalMatch.player2
          : finalMatch.player1;
      if (finalLoser) {
        podium.second = {
          id: finalLoser.id,
          name: finalLoser.name,
          club: "Клуб нэр",
        };
      }
    }

    const thirdPlaceMatch = knockoutResults.find(
      (m) => m.id === "third_place_playoff",
    );
    if (thirdPlaceMatch?.winner) {
      podium.third = {
        id: thirdPlaceMatch.winner.id,
        name: thirdPlaceMatch.winner.name,
        club: "Клуб нэр",
      };
    }

    return podium;
  };

  // Group stats
  const calculateGroupStats = (group: GroupStageGroup) => {
    const stats = group.players.map((player) => ({
      playerId: player.id,
      wins: 0,
      losses: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
    }));

    for (let i = 0; i < group.players.length; i++) {
      for (let j = 0; j < group.players.length; j++) {
        if (i !== j && group.resultMatrix[i]?.[j]) {
          const result = group.resultMatrix[i][j];
          if (result && result !== "" && result !== "-") {
            const scoreParts = result.split("-").map((s) => s.trim());
            if (scoreParts.length === 2) {
              const score1 = parseInt(scoreParts[0]) || 0;
              const score2 = parseInt(scoreParts[1]) || 0;

              if (score1 > score2) {
                stats[i].wins++;
                stats[i].points += 2;
                stats[j].losses++;
                stats[j].points += 1;
              } else if (score2 > score1) {
                stats[j].wins++;
                stats[j].points += 2;
                stats[i].losses++;
                stats[i].points += 1;
              }

              stats[i].setsWon += score1;
              stats[i].setsLost += score2;
              stats[j].setsWon += score2;
              stats[j].setsLost += score1;
            }
          }
        }
      }
    }

    return stats;
  };

  const handleResultMatrixChange = (
    groupId: string,
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    setGroupStageResults((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        const newMatrix = [...group.resultMatrix];
        if (!newMatrix[rowIndex]) newMatrix[rowIndex] = [];
        newMatrix[rowIndex][colIndex] = value;

        const newStats = calculateGroupStats({
          ...group,
          resultMatrix: newMatrix,
        });

        return {
          ...group,
          resultMatrix: newMatrix,
          playerStats: newStats,
        };
      }),
    );
  };

  const handleMatchScoreChange = (
    matchId: string,
    field: "player1Score" | "player2Score",
    value: string,
  ) => {
    setKnockoutResults((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;

        const updatedMatch: KnockoutMatch = { ...match, [field]: value };

        const p1Score = parseInt(updatedMatch.player1Score || "0") || 0;
        const p2Score = parseInt(updatedMatch.player2Score || "0") || 0;

        if (p1Score > 0 || p2Score > 0) {
          if (p1Score > p2Score && updatedMatch.player1) {
            updatedMatch.winner = updatedMatch.player1;
          } else if (p2Score > p1Score && updatedMatch.player2) {
            updatedMatch.winner = updatedMatch.player2;
          }
          updatedMatch.score = `${p1Score}-${p2Score}`;
        }

        return updatedMatch;
      }),
    );
  };

  const handleWinnerToggle = (matchId: string, winnerId: string) => {
    setKnockoutResults((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;

        let winner = null as KnockoutMatch["winner"] | null;
        if (winnerId === match.player1?.id && match.player1) {
          winner = match.player1;
        } else if (winnerId === match.player2?.id && match.player2) {
          winner = match.player2;
        }

        return { ...match, winner: winner || undefined };
      }),
    );
  };

  const createGroupStage = () => {
    if (!participants || participants.length < 8) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Хэсэгийн тоглолтод дор хаяж 8 тоглогч шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    const totalParticipants = participants.length;
    let groupCount = 4;
    let playersPerGroup = 4;

    if (totalParticipants >= 64) {
      groupCount = 16;
      playersPerGroup = 4;
    } else if (totalParticipants >= 32) {
      groupCount = 8;
      playersPerGroup = 4;
    } else if (totalParticipants >= 16) {
      groupCount = 4;
      playersPerGroup = 4;
    } else {
      groupCount = Math.ceil(totalParticipants / 4);
      playersPerGroup = 4;
    }

    const groups: GroupStageGroup[] = [];
    const shuffledParticipants = [...participants].sort(
      () => Math.random() - 0.5,
    );

    for (let i = 0; i < groupCount; i++) {
      const groupLetter = String.fromCharCode(65 + i);
      const startIndex = i * playersPerGroup;
      const groupParticipants = shuffledParticipants.slice(
        startIndex,
        startIndex + playersPerGroup,
      );

      if (groupParticipants.length >= 3) {
        groups.push({
          id: `group_${groupLetter.toLowerCase()}`,
          name: `${groupLetter} хэсэг`,
          players: groupParticipants.map((p) => ({
            id: p.id,
            name:
              p.user?.firstName && p.user?.lastName
                ? `${p.user.firstName} ${p.user.lastName}`
                : `Тоглогч ${p.id}`,
            playerId: p.id,
            userId: p.userId,
          })),
          resultMatrix: [],
          playerStats: groupParticipants.map((p) => ({
            playerId: p.id,
            wins: 0,
            losses: 0,
            points: 0,
          })),
        });
      }
    }

    setGroupStageResults(groups);
    toast({
      title: "Хэсэгийн шат үүсгэгдлээ",
      description: `${groups.length} хэсэг үүсгэж ${totalParticipants} тоглогчийг хуваарилсан`,
    });
  };

  const addNewGroup = () => {
    const newGroupLetter = String.fromCharCode(65 + groupStageResults.length);
    const newGroup: GroupStageGroup = {
      id: `group_${newGroupLetter.toLowerCase()}`,
      name: `${newGroupLetter} хэсэг`,
      players: [],
      resultMatrix: [],
      playerStats: [],
    };
    setGroupStageResults((prev) => [...prev, newGroup]);
    toast({
      title: "Шинэ хэсэг үүсгэгдлээ",
      description: `${newGroup.name} амжилттай үүсгэгдлээ`,
    });
  };

  const removePlayerFromGroup = (groupId: string, playerId: string) => {
    setGroupStageResults((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        const playerIndex = group.players.findIndex((p) => p.id === playerId);
        if (playerIndex === -1) return group;

        const updatedPlayers = group.players.filter((p) => p.id !== playerId);

        const newMatrix = group.resultMatrix
          .filter((_, i) => i !== playerIndex)
          .map((row) => row.filter((_, j) => j !== playerIndex));

        const updatedGroup: GroupStageGroup = {
          ...group,
          players: updatedPlayers,
          resultMatrix: newMatrix,
          playerStats: updatedPlayers.map((p) => ({
            playerId: p.id,
            wins: 0,
            losses: 0,
            points: 0,
          })),
        };

        const newStats = calculateGroupStats(updatedGroup);

        return {
          ...updatedGroup,
          playerStats: newStats,
        };
      }),
    );
    toast({
      title: "Тоглогч хасагдлаа",
      description: `Тоглогч амжилттай хасагдлаа`,
    });
  };

  const generateKnockoutBracket = () => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    const playerCount = qualifiedPlayers.length;
    const matches: KnockoutMatch[] = [];

    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(playerCount)));
    const totalRounds = Math.ceil(Math.log2(nextPowerOf2));

    const getRoundName = (matchCount: number): string => {
      switch (matchCount) {
        case 1:
          return "Финал";
        case 2:
          return "Хагас финал";
        case 4:
          return "Дөрөвний финал";
        case 8:
          return "1/8 финал";
        case 16:
          return "1/16 финал";
        case 32:
          return "1/32 финал";
        default:
          if (matchCount > 1) return `1/${matchCount * 2} финал`;
          return `${matchCount} тоглолт`;
      }
    };

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      const roundName = getRoundName(matchesInRound);

      for (let i = 0; i < matchesInRound; i++) {
        const matchId = `round${round}_${i + 1}`;

        if (round === 1) {
          const player1Index = i * 2;
          const player2Index = i * 2 + 1;

          matches.push({
            id: matchId,
            round: round.toString(),
            roundName,
            player1:
              player1Index < qualifiedPlayers.length
                ? {
                    id: qualifiedPlayers[player1Index].id,
                    name: qualifiedPlayers[player1Index].name,
                  }
                : undefined,
            player2:
              player2Index < qualifiedPlayers.length
                ? {
                    id: qualifiedPlayers[player2Index].id,
                    name: qualifiedPlayers[player2Index].name,
                  }
                : undefined,
            isFinished: false,
          });
        } else {
          matches.push({
            id: matchId,
            round: round.toString(),
            roundName,
            isFinished: false,
          });
        }
      }
    }

    if (playerCount > 4) {
      matches.push({
        id: "bronze_medal_match",
        round: (totalRounds + 1).toString(),
        roundName: "Хүрэл медалийн тоглолт",
        isFinished: false,
      });
    }

    setKnockoutResults(matches);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн шигшээ тоглолт үүсгэгдлээ`,
    });
  };

  const handleSave = () => {
    if (!params?.tournamentId) return;

    const preparedKnockoutResults = knockoutResults.map((match) => ({
      id: match.id,
      round: match.round,
      roundName: match.roundName,
      player1: match.player1 || null,
      player2: match.player2 || null,
      player1Score: match.player1Score || null,
      player2Score: match.player2Score || null,
      winner: match.winner || null,
      isFinished: !!match.winner,
    }));

    const data = {
      tournamentId: params.tournamentId,
      groupStageResults:
        groupStageResults.length > 0 ? groupStageResults : null,
      knockoutResults:
        preparedKnockoutResults.length > 0 ? preparedKnockoutResults : null,
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
          <Button
            onClick={() => setLocation("/admin/tournaments")}
            className="mt-4"
          >
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-6">
          {/* Top bar: Back + Save */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <Button
              onClick={() => setLocation("/admin/tournaments")}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Буцах
            </Button>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800"
                />
                <span>Нийтэд харуулах</span>
                {isPublished ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </label>

              <Button
                onClick={handleSave}
                disabled={saveResultsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveResultsMutation.isPending
                  ? "Хадгалж байна..."
                  : "Хадгалах"}
              </Button>
            </div>
          </div>

          {/* MAIN HEADER (gradient bar) */}
          <div className="w-full rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 shadow-xl mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 text-2xl font-semibold">
                  <span className="text-3xl">🏆</span>
                  <span>Тэмцээний үр дүн</span>
                  <span className="text-3xl">🏆</span>
                </div>
                <p className="text-sm text-white/80 mt-1">
                  Админ хэсэг - Үнэлгээ горим
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  {tournament.name}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  {selectedEventType === "SINGLES"
                    ? "Ганцаарчилсан тэмцээн"
                    : selectedEventType === "DOUBLES"
                      ? "Хосын тэмцээн"
                      : "Багийн тэмцээн"}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  Нийт бүртгэлтэй тоглогч:{" "}
                  {getParticipantsByEventType(selectedEventType).length}
                </span>
              </div>
            </div>
          </div>

          {/* CATEGORY CARD: event type + division + stage buttons */}
          <section className="w-full rounded-3xl bg-gray-900/80 backdrop-blur-sm shadow-md border border-gray-800 px-8 py-6 space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                🏅
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white">
                  Тэмцээний ангилал
                </span>
                <span className="text-xs text-gray-400">
                  Тэмцээний төрөл, горимоо сонгоно уу
                </span>
              </div>
            </div>

            {/* event type tabs */}
            {getAvailableEventTypes().length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {getAvailableEventTypes().includes("SINGLES") && (
                  <button
                    type="button"
                    onClick={() => setSelectedEventType("SINGLES")}
                    className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition
                      ${
                        selectedEventType === "SINGLES"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                      }`}
                  >
                    <span className="text-lg">👤</span>
                    <span>Ганцаарчилсан тэмцээн</span>
                  </button>
                )}

                {getAvailableEventTypes().includes("DOUBLES") && (
                  <button
                    type="button"
                    onClick={() => setSelectedEventType("DOUBLES")}
                    className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition
                      ${
                        selectedEventType === "DOUBLES"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                      }`}
                  >
                    <span className="text-lg">👥</span>
                    <span>Хос</span>
                  </button>
                )}

                {getAvailableEventTypes().includes("TEAM") && (
                  <button
                    type="button"
                    onClick={() => setSelectedEventType("TEAM")}
                    className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition
                      ${
                        selectedEventType === "TEAM"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                      }`}
                  >
                    <span className="text-lg">🧑‍🤝‍🧑</span>
                    <span>Баг</span>
                  </button>
                )}
              </div>
            )}
            
            {getAvailableEventTypes().length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Тэмцээнд оролцооны төрөл тохируулаагүй байна
              </div>
            )}

            {/* division + info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  ДИВИЗ СОНГОХ
                </label>
                <Select
                  value={selectedEventType}
                  onValueChange={(value: any) => setSelectedEventType(value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Дивиз сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 text-white border-gray-700">
                    {getAvailableEventTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "SINGLES"
                          ? "13–15 нас, эрэгтэй"
                          : type === "DOUBLES"
                            ? "16–18 нас, эрэгтэй"
                            : "19+ нас, эрэгтэй"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-end">
                <div className="text-xs text-gray-400 bg-gray-800/80 px-4 py-3 rounded-xl border border-gray-700">
                  {getCountDisplay(selectedEventType)}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-800" />

            {/* stage buttons */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                ШАТЫГ СОНГОХ
              </label>
              <div className="flex flex-col md:flex-row gap-3 text-sm font-medium">
                <button className="flex-1 rounded-2xl bg-blue-600 text-white py-2.5 shadow-sm border border-blue-700">
                  Групп шат
                </button>
                <button className="flex-1 rounded-2xl bg-gray-800 text-gray-200 py-2.5 border border-gray-700 hover:bg-gray-700 transition">
                  Шууд хасагдах шат
                </button>
                <button className="flex-1 rounded-2xl bg-gray-800 text-gray-200 py-2.5 border border-gray-700 hover:bg-gray-700 transition">
                  Эцсийн байр, медаль
                </button>
              </div>
            </div>
          </section>

          {/* GROUP STAGE SECTION */}
          <section className="w-full rounded-3xl bg-gray-900/80 backdrop-blur-sm shadow-md border border-gray-800 px-8 py-6 mb-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Групп шат ({tournament.name})
              </h2>

              {/* Stats */}
              <div className="flex items-center justify-between gap-4 p-3 bg-gray-950/70 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-400">
                  Дээрх групп удирдлага хэсгээс тоглогчдоо хуваарилна уу
                </p>
                <div className="text-xs text-gray-400 flex gap-4">
                  <span>
                    Нийт групп:{" "}
                    <span className="font-semibold text-white">
                      {groupStageResults.length}
                    </span>
                  </span>
                  <span>
                    Хуваарилсан тоглогч:{" "}
                    <span className="font-semibold text-white">
                      {groupStageResults.reduce(
                        (sum, g) => sum + g.players.length,
                        0,
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
              <strong>Зөвлөмж:</strong> Доорх "Групп шатны тоглолт" хэсэгт
              группүүдээ үүсгэж, тоглогчдыг бүртгэлтэй жагсаалтаас сонгон
              хуваарилж үр дүнг шууд оруулна.
            </div>

            {/* Participant list + group creation */}
            <div className="mt-6 space-y-4">
              <div className="bg-gray-950/70 rounded-xl p-4 border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Бүртгүүлсэн тамирчид ({selectedEventType})
                  <Badge variant="outline" className="ml-2 border-gray-700">
                    {getParticipantsByEventType(selectedEventType).length}{" "}
                    тоглогч
                  </Badge>
                </h3>

                {getParticipantsByEventType(selectedEventType).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getParticipantsByEventType(selectedEventType).map(
                      (participant: any, index: number) => (
                        <div
                          key={participant.id || index}
                          className="bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-300 border border-gray-800 hover:bg-gray-800 transition-colors"
                        >
                          <div className="font-medium text-white">
                            {participant.user?.firstName &&
                            participant.user?.lastName
                              ? `${participant.user.firstName} ${participant.user.lastName}`
                              : participant.user?.email ||
                                `Тоглогч ${index + 1}`}
                          </div>
                          {participant.user?.clubAffiliation && (
                            <div className="text-gray-500 text-xs mt-0.5">
                              {participant.user.clubAffiliation}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      Энэ төрлөөр бүртгүүлсэн тамирчин байхгүй байна
                    </p>
                  </div>
                )}
              </div>

              {getParticipantsByEventType(selectedEventType).length >= 4 && (
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-4 border border-blue-800/60">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-400" />
                    Групп үүсгэх
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={createGroupStage}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Автомат групп үүсгэх (
                      {
                        getParticipantsByEventType(selectedEventType).length
                      }{" "}
                      тоглогч)
                    </Button>

                    <Button
                      onClick={addNewGroup}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-200 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Хоосон групп нэмэх
                    </Button>

                    <div className="text-xs text-gray-400 ml-auto">
                      {groupStageResults.length > 0 && (
                        <span>{groupStageResults.length} групп үүсгэгдсэн</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-blue-300/70">
                    💡 Автомат үүсгэх товч нь тамирчдыг санамсаргүйгээр 4 хүний
                    группүүдэд хуваарилна.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SETTINGS PANEL */}
          <div className="mb-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5" />
                  Шилжилтийн тохиргоо
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="top1"
                      className="rounded border-gray-700 bg-gray-800"
                      defaultChecked
                    />
                    <label htmlFor="top1" className="text-sm text-gray-300">
                      Топ 1 шилжих
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="top2"
                      className="rounded border-gray-700 bg-gray-800"
                      defaultChecked
                    />
                    <label htmlFor="top2" className="text-sm text-gray-300">
                      Топ 2 шилжих
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="luckyDraw"
                      className="rounded border-gray-700 bg-gray-800"
                    />
                    <label
                      htmlFor="luckyDraw"
                      className="text-sm text-gray-300"
                    >
                      Lucky draw сонголт
                    </label>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
};

export default AdminTournamentResults;
