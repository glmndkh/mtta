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
  Trash2,
  X,
  Medal,
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
  eventType: "SINGLES" | "DOUBLES" | "TEAM"; // Add event type to group
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
  eventType?: "SINGLES" | "DOUBLES" | "TEAM"; // Add event type
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
  loser?: {
    id: string;
    name: string;
    playerId?: string;
    userId?: string;
  };
  score?: string;
  player1Score?: string;
  player2Score?: string;
  isFinished: boolean;
  nextMatchId?: string;
  nextMatchSlot?: "player1" | "player2";
}

interface FinalRanking {
  position: number;
  eventType?: "SINGLES" | "DOUBLES" | "TEAM"; // Add event type
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
  const [currentStage, setCurrentStage] = useState<"group" | "knockout" | "final">("group");

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

  // Fetch participants - filtered by selected event type
  const { data: participants } = useQuery<any[]>({
    queryKey: ["/api/tournaments", params?.tournamentId, "participants", selectedEventType],
    queryFn: async () => {
      const response = await fetch(
        `/api/tournaments/${params?.tournamentId}/participants?category=${selectedEventType}`
      );
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
    enabled: !!params?.tournamentId,
  });

  // Fetch tournament teams/pairs for count display - filtered by event type
  const { data: tournamentTeams = [] } = useQuery<any[]>({
    queryKey: ["/api/tournaments", params?.tournamentId, "teams", selectedEventType],
    queryFn: async () => {
      const response = await fetch(
        `/api/tournaments/${params?.tournamentId}/teams?eventType=${selectedEventType}`
      );
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
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
    console.log('Tournament participationTypes:', tournament?.participationTypes);
    
    if (!tournament?.participationTypes || tournament.participationTypes.length === 0) {
      // Fallback: if no participation types, return all types
      return ["SINGLES", "DOUBLES", "TEAM"] as ("SINGLES" | "DOUBLES" | "TEAM")[];
    }
    
    const mappedTypes = tournament.participationTypes.map((type) => {
      // Try to parse JSON if it's a string
      try {
        const parsed = JSON.parse(type);
        const typeStr = parsed.type?.toLowerCase() || '';
        console.log('Parsed type:', typeStr);
        
        // Map based on type field
        if (typeStr === 'individual') return 'SINGLES';
        if (typeStr === 'pair') return 'DOUBLES';
        if (typeStr === 'team') return 'TEAM';
      } catch (e) {
        // If not JSON, treat as plain string
        const upperType = type.toUpperCase();
        if (upperType.includes('SINGLE') || upperType === 'INDIVIDUAL') return 'SINGLES';
        if (upperType.includes('DOUBLE') || upperType.includes('PAIR')) return 'DOUBLES';
        if (upperType.includes('TEAM')) return 'TEAM';
      }
      return null;
    }).filter(Boolean) as ("SINGLES" | "DOUBLES" | "TEAM")[];
    
    console.log('Mapped types:', mappedTypes);
    
    // Remove duplicates
    const result = Array.from(new Set(mappedTypes));
    console.log('Final result:', result);
    return result;
  };

  const getParticipantsByEventType = (
    eventType: "SINGLES" | "DOUBLES" | "TEAM",
  ) => {
    // Participants are already filtered by backend, just return them
    if (!participants) return [];
    return participants;
  };

  const getTeamsByEventType = (eventType: "SINGLES" | "DOUBLES" | "TEAM") => {
    // Teams are already filtered by backend, just return them
    if (!tournamentTeams) return [];
    return tournamentTeams;
  };

  const getEventTypeLabel = (eventType: "SINGLES" | "DOUBLES" | "TEAM") => {
    if (!tournament?.participationTypes || tournament.participationTypes.length === 0) {
      return eventType === "SINGLES" ? "Ганцаарчилсан" : eventType === "DOUBLES" ? "Хос" : "Баг";
    }

    // Find matching participation type
    for (const type of tournament.participationTypes) {
      try {
        const parsed = JSON.parse(type);
        const typeStr = parsed.type?.toLowerCase() || '';
        
        // Check if this matches our event type
        const matches = 
          (eventType === 'SINGLES' && typeStr === 'individual') ||
          (eventType === 'DOUBLES' && typeStr === 'pair') ||
          (eventType === 'TEAM' && typeStr === 'team');
        
        if (matches) {
          const minAge = parsed.minAge || 0;
          const maxAge = parsed.maxAge || 100;
          const gender = parsed.gender;
          const genderText = gender === 'male' ? 'эрэгтэй' : gender === 'female' ? 'эмэгтэй' : '';
          
          return `${minAge}-${maxAge} нас${genderText ? ', ' + genderText : ''}`;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    // Fallback
    return eventType === "SINGLES" ? "Ганцаарчилсан" : eventType === "DOUBLES" ? "Хос" : "Баг";
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
      groupStageResults
        .filter((group) => group.eventType === selectedEventType)
        .forEach((group) => {
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
  }, [groupStageResults, selectedEventType]);

  // Podium (одоогоор зөвхөн текстэд ашиглаж болох)
  const getPodiumWinners = () => {
    const podium = {
      first: null as { id: string; name: string; club?: string } | null,
      second: null as { id: string; name: string; club?: string } | null,
      third: null as { id: string; name: string; club?: string } | null,
    };

    const finalMatch = knockoutResults.find((m) => m.roundName === "Финал" && m.eventType === selectedEventType);
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
      (m) => m.id === "third_place_playoff" && m.eventType === selectedEventType,
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
    setKnockoutResults((prev) => {
      let allMatches = prev.map((match) => {
        if (match.id !== matchId) return match;

        const updatedMatch: KnockoutMatch = { ...match, [field]: value };

        const p1Score = parseInt(updatedMatch.player1Score || "0") || 0;
        const p2Score = parseInt(updatedMatch.player2Score || "0") || 0;

        // Determine if this is a reset (scores blank/zero)
        const isReset = p1Score <= 0 && p2Score <= 0;
        
        // Clear results if scores are blank/zero
        if (isReset) {
          updatedMatch.winner = undefined;
          updatedMatch.loser = undefined;
          updatedMatch.score = undefined;
          updatedMatch.isFinished = false;
        }
        // Set winner/loser if scores are valid
        else if (p1Score > 0 || p2Score > 0) {
          if (p1Score > p2Score && updatedMatch.player1) {
            updatedMatch.winner = updatedMatch.player1;
            updatedMatch.loser = updatedMatch.player2;
          } else if (p2Score > p1Score && updatedMatch.player2) {
            updatedMatch.winner = updatedMatch.player2;
            updatedMatch.loser = updatedMatch.player1;
          }
          updatedMatch.score = `${p1Score}-${p2Score}`;
          updatedMatch.isFinished = !!updatedMatch.winner;
        }

        return updatedMatch;
      });

      // Always clear downstream matches when scores change (whether reset or flipped)
      allMatches = clearDownstreamMatches(matchId, allMatches);

      // Auto-advance winner to next round OR clear slot if match was reset
      const currentMatch = allMatches.find((m) => m.id === matchId);
      if (currentMatch?.nextMatchId) {
        const nextMatchIdx = allMatches.findIndex((m) => m.id === currentMatch.nextMatchId);
        if (nextMatchIdx !== -1) {
          const nextMatch = allMatches[nextMatchIdx];
          if (currentMatch.nextMatchSlot === "player1") {
            allMatches[nextMatchIdx] = {
              ...nextMatch,
              player1: currentMatch.winner || undefined,
            };
          } else if (currentMatch.nextMatchSlot === "player2") {
            allMatches[nextMatchIdx] = {
              ...nextMatch,
              player2: currentMatch.winner || undefined,
            };
          }
        }
      }

      // Handle semifinal losers → bronze match
      if (currentMatch?.roundName === "Хагас финал") {
        const bronzeIdx = allMatches.findIndex((m) => m.id === "bronze_medal_match" && m.eventType === selectedEventType);
        if (bronzeIdx !== -1) {
          const bronzeMatch = allMatches[bronzeIdx];
          
          // Determine which bronze slot this semifinal feeds
          // Semifinal 1 (first in list) → player1, Semifinal 2 → player2
          const semifinals = allMatches.filter((m) => m.roundName === "Хагас финал" && m.eventType === selectedEventType);
          const semifinalIndex = semifinals.findIndex((m) => m.id === currentMatch.id);
          
          if (semifinalIndex === 0) {
            // First semifinal → bronze player1 slot
            allMatches[bronzeIdx] = {
              ...bronzeMatch,
              player1: currentMatch.loser || undefined,
              // Clear player1 if no loser (scores reset)
            };
          } else if (semifinalIndex === 1) {
            // Second semifinal → bronze player2 slot
            allMatches[bronzeIdx] = {
              ...bronzeMatch,
              player2: currentMatch.loser || undefined,
              // Clear player2 if no loser (scores reset)
            };
          }
        }
      }

      // Propagate BYEs after score update (handles cascading BYEs)
      return propagateByes(allMatches);
    });
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
    console.log("=== createGroupStage called ===");
    const currentParticipants = selectedEventType === "SINGLES" 
      ? getParticipantsByEventType(selectedEventType)
      : getTeamsByEventType(selectedEventType);
    
    console.log("currentParticipants:", currentParticipants);
    console.log("currentParticipants.length:", currentParticipants?.length);
    console.log("selectedEventType:", selectedEventType);
    
    if (!currentParticipants || currentParticipants.length < 4) {
      console.log("Not enough participants:", currentParticipants?.length);
      toast({
        title: "Хангалтгүй тоглогч",
        description: `Хэсэгийн тоглолтод дор хаяж 4 ${selectedEventType === "SINGLES" ? "тоглогч" : selectedEventType === "DOUBLES" ? "хос" : "баг"} шаардлагатай`,
        variant: "destructive",
      });
      return;
    }

    const totalParticipants = currentParticipants.length;
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
    const shuffledParticipants = [...currentParticipants].sort(
      () => Math.random() - 0.5,
    );

    for (let i = 0; i < groupCount; i++) {
      const groupLetter = String.fromCharCode(65 + i);
      const startIndex = i * playersPerGroup;
      const groupParticipants = shuffledParticipants.slice(
        startIndex,
        startIndex + playersPerGroup,
      );

      if (groupParticipants.length >= 2) {
        const participantName = (p: any) => {
          if (selectedEventType === "SINGLES") {
            return p.playerName || `Тоглогч ${p.id}`;
          } else {
            return p.name || `${selectedEventType === "DOUBLES" ? "Хос" : "Баг"} ${p.id}`;
          }
        };

        groups.push({
          id: `group_${groupLetter.toLowerCase()}`,
          name: `${groupLetter} хэсэг`,
          eventType: selectedEventType, // Add event type to group
          players: groupParticipants.map((p) => ({
            id: p.id,
            name: participantName(p),
            playerId: p.id,
            userId: p.userId || null,
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
    const filteredGroups = groupStageResults.filter(g => g.eventType === selectedEventType);
    const newGroupLetter = String.fromCharCode(65 + filteredGroups.length);
    const newGroup: GroupStageGroup = {
      id: `group_${selectedEventType}_${newGroupLetter.toLowerCase()}`,
      name: `${newGroupLetter} хэсэг`,
      eventType: selectedEventType, // Add event type to group
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

  const addPlayerToGroup = (groupId: string, playerId: string) => {
    const currentParticipants = selectedEventType === "SINGLES" 
      ? getParticipantsByEventType(selectedEventType)
      : getTeamsByEventType(selectedEventType);
    
    const playerToAdd = currentParticipants.find((p: any) => p.id === playerId);
    if (!playerToAdd) return;

    const participantName = (p: any) => {
      if (selectedEventType === "SINGLES") {
        return p.playerName || `Тоглогч ${p.id}`;
      } else {
        return p.name || `${selectedEventType === "DOUBLES" ? "Хос" : "Баг"} ${p.id}`;
      }
    };

    setGroupStageResults((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        // Check if player already in group
        if (group.players.some((p) => p.id === playerId)) {
          toast({
            title: "Тоглогч аль хэдийн байна",
            description: "Энэ тоглогч группд аль хэдийн байна",
            variant: "destructive",
          });
          return group;
        }

        const newPlayer = {
          id: playerToAdd.id,
          name: participantName(playerToAdd),
          playerId: playerToAdd.id,
          userId: playerToAdd.userId || null,
        };

        const updatedPlayers = [...group.players, newPlayer];
        
        // Expand result matrix
        const newMatrix = group.resultMatrix.map((row) => [...row, ""]);
        newMatrix.push(new Array(updatedPlayers.length).fill(""));

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
      title: "Тоглогч нэмэгдлээ",
      description: `Тоглогч амжилттай нэмэгдлээ`,
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

  const removeGroup = (groupId: string) => {
    setGroupStageResults((prev) => prev.filter((g) => g.id !== groupId));
    toast({
      title: "Групп устгагдлаа",
      description: "Групп амжилттай устгагдлаа",
    });
  };

  // Helper: Build feeder map (which match feeds each slot)
  const buildSlotFeedersMap = (matches: KnockoutMatch[]) => {
    const feeders = new Map<string, { player1Feeder: string | null; player2Feeder: string | null }>();
    
    for (const match of matches) {
      feeders.set(match.id, { player1Feeder: null, player2Feeder: null });
    }
    
    for (const match of matches) {
      if (match.nextMatchId) {
        const current = feeders.get(match.nextMatchId);
        if (current) {
          if (match.nextMatchSlot === "player1") {
            feeders.set(match.nextMatchId, { ...current, player1Feeder: match.id });
          } else if (match.nextMatchSlot === "player2") {
            feeders.set(match.nextMatchId, { ...current, player2Feeder: match.id });
          }
        }
      }
    }
    
    return feeders;
  };

  // Helper: Check if a match slot will never be filled
  const isSlotBarren = (
    feederId: string | null,
    matches: KnockoutMatch[]
  ): boolean => {
    if (!feederId) return true; // No feeder means initial BYE
    
    const feeder = matches.find((m) => m.id === feederId);
    if (!feeder) return true;
    
    // If feeder has no players at all, slot is barren
    if (!feeder.player1 && !feeder.player2) return true;
    
    // If feeder is finished but has no winner, slot is barren
    if (feeder.isFinished && !feeder.winner) return true;
    
    return false;
  };

  // Helper: Clear downstream matches when a match is reset
  const clearDownstreamMatches = (
    matchId: string,
    matches: KnockoutMatch[]
  ): KnockoutMatch[] => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return matches;
    
    let updated = [...matches];
    
    // Clear next round match
    if (match.nextMatchId) {
      const nextIdx = updated.findIndex((m) => m.id === match.nextMatchId);
      if (nextIdx !== -1) {
        const nextMatch = updated[nextIdx];
        
        // Clear the slot this match feeds into AND always clear ALL results
        if (match.nextMatchSlot === "player1") {
          updated[nextIdx] = {
            ...nextMatch,
            player1: undefined,
            player1Score: undefined,
            player2Score: undefined, // Clear both score fields
            winner: undefined,
            loser: undefined,
            score: undefined,
            isFinished: false,
          };
        } else if (match.nextMatchSlot === "player2") {
          updated[nextIdx] = {
            ...nextMatch,
            player2: undefined,
            player1Score: undefined, // Clear both score fields
            player2Score: undefined,
            winner: undefined,
            loser: undefined,
            score: undefined,
            isFinished: false,
          };
        }
        
        // Recursively clear downstream
        updated = clearDownstreamMatches(match.nextMatchId, updated);
      }
    }
    
    // Clear bronze match if this is a semifinal
    if (match.roundName === "Хагас финал") {
      const bronzeIdx = updated.findIndex((m) => m.id === "bronze_medal_match" && m.eventType === match.eventType);
      if (bronzeIdx !== -1) {
        const semifinals = updated.filter((m) => m.roundName === "Хагас финал" && m.eventType === match.eventType);
        const semifinalIndex = semifinals.findIndex((m) => m.id === matchId);
        
        const bronzeMatch = updated[bronzeIdx];
        if (semifinalIndex === 0) {
          updated[bronzeIdx] = {
            ...bronzeMatch,
            player1: undefined,
            player1Score: undefined,
            player2Score: undefined, // Clear both score fields
            winner: undefined,
            loser: undefined,
            score: undefined,
            isFinished: false,
          };
        } else if (semifinalIndex === 1) {
          updated[bronzeIdx] = {
            ...bronzeMatch,
            player2: undefined,
            player1Score: undefined, // Clear both score fields
            player2Score: undefined,
            winner: undefined,
            loser: undefined,
            score: undefined,
            isFinished: false,
          };
        }
      }
    }
    
    return updated;
  };

  // Helper: Propagate BYEs through bracket
  const propagateByes = (matches: KnockoutMatch[]): KnockoutMatch[] => {
    const feedersMap = buildSlotFeedersMap(matches);
    let updated = [...matches];
    let hasChanges = true;
    
    while (hasChanges) {
      hasChanges = false;
      
      for (let i = 0; i < updated.length; i++) {
        const match = updated[i];
        
        // Skip if already finished, bronze match, or has both players
        if (match.isFinished || match.id === "bronze_medal_match") continue;
        if (match.player1 && match.player2) continue;
        
        const feeders = feedersMap.get(match.id);
        if (!feeders) continue;
        
        // Check if player1 exists and player2 slot is barren
        if (match.player1 && !match.player2 && isSlotBarren(feeders.player2Feeder, updated)) {
          updated[i] = {
            ...match,
            winner: match.player1,
            isFinished: true,
            score: "BYE",
          };
          hasChanges = true;
          
          // Advance to next round
          if (match.nextMatchId) {
            const nextIdx = updated.findIndex((m) => m.id === match.nextMatchId);
            if (nextIdx !== -1) {
              if (match.nextMatchSlot === "player1") {
                updated[nextIdx] = { ...updated[nextIdx], player1: match.player1 };
              } else if (match.nextMatchSlot === "player2") {
                updated[nextIdx] = { ...updated[nextIdx], player2: match.player1 };
              }
            }
          }
        }
        // Check if player2 exists and player1 slot is barren
        else if (match.player2 && !match.player1 && isSlotBarren(feeders.player1Feeder, updated)) {
          updated[i] = {
            ...match,
            winner: match.player2,
            isFinished: true,
            score: "BYE",
          };
          hasChanges = true;
          
          // Advance to next round
          if (match.nextMatchId) {
            const nextIdx = updated.findIndex((m) => m.id === match.nextMatchId);
            if (nextIdx !== -1) {
              if (match.nextMatchSlot === "player1") {
                updated[nextIdx] = { ...updated[nextIdx], player1: match.player2 };
              } else if (match.nextMatchSlot === "player2") {
                updated[nextIdx] = { ...updated[nextIdx], player2: match.player2 };
              }
            }
          }
        }
      }
    }
    
    return updated;
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
        
        // Calculate next match info (for winner advancement)
        const nextRound = round + 1;
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatchId = nextRound <= totalRounds ? `round${nextRound}_${nextMatchIndex + 1}` : undefined;
        const nextMatchSlot = i % 2 === 0 ? "player1" : "player2";

        if (round === 1) {
          const player1Index = i * 2;
          const player2Index = i * 2 + 1;

          matches.push({
            id: matchId,
            round: round.toString(),
            roundName,
            eventType: selectedEventType, // Add event type
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
            nextMatchId,
            nextMatchSlot,
          });
        } else {
          matches.push({
            id: matchId,
            round: round.toString(),
            roundName,
            eventType: selectedEventType, // Add event type
            isFinished: false,
            nextMatchId,
            nextMatchSlot,
          });
        }
      }
    }

    if (playerCount > 4) {
      matches.push({
        id: "bronze_medal_match",
        round: (totalRounds + 1).toString(),
        roundName: "Хүрэл медалийн тоглолт",
        eventType: selectedEventType, // Add event type
        isFinished: false,
      });
    }

    // Propagate BYEs through all rounds using the deterministic helper
    const propagatedMatches = propagateByes(matches);

    setKnockoutResults(propagatedMatches);
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
                    ? "Ганцаарчилсан"
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
                    <span>Ганцаарчилсан</span>
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
                        {getEventTypeLabel(type)}
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
                <button 
                  onClick={() => setCurrentStage("group")}
                  className={`flex-1 rounded-2xl py-2.5 shadow-sm border transition ${
                    currentStage === "group"
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                  }`}
                  data-testid="button-stage-group"
                >
                  Групп шат
                </button>
                <button 
                  onClick={() => setCurrentStage("knockout")}
                  className={`flex-1 rounded-2xl py-2.5 shadow-sm border transition ${
                    currentStage === "knockout"
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                  }`}
                  data-testid="button-stage-knockout"
                >
                  Шууд хасагдах шат
                </button>
                <button 
                  onClick={() => setCurrentStage("final")}
                  className={`flex-1 rounded-2xl py-2.5 shadow-sm border transition ${
                    currentStage === "final"
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                  }`}
                  data-testid="button-stage-final"
                >
                  Эцсийн байр, медаль
                </button>
              </div>
            </div>
          </section>

          {/* GROUP STAGE SECTION */}
          {currentStage === "group" && (
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
                      {groupStageResults.filter((g) => g.eventType === selectedEventType).length}
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
                {selectedEventType === "SINGLES" ? (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Бүртгүүлсэн тамирчид
                      <Badge variant="outline" className="ml-2 border-gray-700">
                        {getParticipantsByEventType(selectedEventType).length} тоглогч
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
                                {participant.playerName || participant.email || `Тоглогч ${index + 1}`}
                              </div>
                              {participant.clubAffiliation && (
                                <div className="text-gray-500 text-xs mt-0.5">
                                  {participant.clubAffiliation}
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
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Бүртгүүлсэн {selectedEventType === "DOUBLES" ? "хос" : "баг"}
                      <Badge variant="outline" className="ml-2 border-gray-700">
                        {getTeamsByEventType(selectedEventType).length} {selectedEventType === "DOUBLES" ? "хос" : "баг"}
                      </Badge>
                    </h3>

                    {getTeamsByEventType(selectedEventType).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getTeamsByEventType(selectedEventType).map(
                          (team: any, index: number) => (
                            <div
                              key={team.id || index}
                              className="bg-gray-900 rounded-lg p-3 border border-gray-800 hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {selectedEventType === "DOUBLES" ? "Х" : "Б"}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white text-sm">
                                    {team.name || `${selectedEventType === "DOUBLES" ? "Хос" : "Баг"} ${index + 1}`}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {team.players && team.players.length > 0 ? (
                                      team.players.map((player: any, pIndex: number) => (
                                        <div key={pIndex} className="flex items-center gap-1">
                                          <span className="text-gray-500">•</span>
                                          <span>{player.playerName || player.firstName + ' ' + player.lastName || 'Unknown'}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-gray-600">Гишүүн байхгүй</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          Энэ төрлөөр бүртгүүлсэн {selectedEventType === "DOUBLES" ? "хос" : "баг"} байхгүй байна
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {((selectedEventType === "SINGLES" && getParticipantsByEventType(selectedEventType).length >= 4) ||
                (selectedEventType !== "SINGLES" && getTeamsByEventType(selectedEventType).length >= 4)) && (
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-4 border border-blue-800/60">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-400" />
                    Групп үүсгэх
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={addNewGroup}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-200 hover:bg-gray-800"
                      data-testid="button-add-empty-group"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Хоосон групп нэмэх
                    </Button>

                    <div className="text-xs text-gray-400 ml-auto">
                      {groupStageResults.filter((g) => g.eventType === selectedEventType).length > 0 && (
                        <span>{groupStageResults.filter((g) => g.eventType === selectedEventType).length} групп үүсгэгдсэн</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display created groups */}
            {groupStageResults.filter((g) => g.eventType === selectedEventType).length > 0 && (
              <div className="mt-6 space-y-6">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Групп шатны тоглолт
                </h3>
                {groupStageResults
                  .filter((group) => group.eventType === selectedEventType)
                  .map((group, groupIndex) => (
                  <div
                    key={group.id}
                    className="bg-gray-950/70 rounded-xl p-6 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-white">
                          {group.name}
                        </h4>
                        <Badge variant="outline" className="border-gray-700">
                          {group.players.length} тоглогч
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGroup(group.id)}
                        data-testid={`button-remove-group-${group.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Групп устгах
                      </Button>
                    </div>

                    {/* Player management */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-400">
                          ТОГЛОГЧ УДИРДЛАГА
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => addPlayerToGroup(group.id, value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Тоглогч нэмэх..." />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 text-white border-gray-700">
                            {(selectedEventType === "SINGLES" 
                              ? getParticipantsByEventType(selectedEventType)
                              : getTeamsByEventType(selectedEventType)
                            )
                              .filter((p: any) => !group.players.some((gp) => gp.id === p.id))
                              .map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {selectedEventType === "SINGLES" 
                                    ? (p.playerName || p.email)
                                    : (p.name || `${selectedEventType === "DOUBLES" ? "Хос" : "Баг"} ${p.id}`)
                                  }
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {group.players.length > 0 ? (
                      <>
                        {/* Result Matrix Table */}
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-900">
                                <th className="border border-gray-700 px-2 py-2 text-left text-gray-400">
                                  Тоглогч/Хос
                                </th>
                                {group.players.map((player, idx) => (
                                  <th
                                    key={player.id}
                                    className="border border-gray-700 px-2 py-2 text-center text-gray-400"
                                  >
                                    {idx + 1}
                                  </th>
                                ))}
                                <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">
                                  Хожил
                                </th>
                                <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">
                                  Хожигдол
                                </th>
                                <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">
                                  Оноо
                                </th>
                                <th className="border border-gray-700 px-2 py-2 text-center text-gray-400">
                                  Байр
                                </th>
                                <th className="border border-gray-700 px-2 py-2 text-center text-gray-400"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.players.map((player, rowIndex) => {
                                const stats = group.playerStats.find(
                                  (s) => s.playerId === player.id
                                ) || { wins: 0, losses: 0, points: 0 };
                                
                                return (
                                  <tr key={player.id} className="hover:bg-gray-900/50">
                                    <td className="border border-gray-700 px-2 py-2 text-white font-medium">
                                      {rowIndex + 1}. {player.name}
                                    </td>
                                    {group.players.map((opponent, colIndex) => (
                                      <td
                                        key={opponent.id}
                                        className="border border-gray-700 px-1 py-1 text-center"
                                      >
                                        {rowIndex === colIndex ? (
                                          <div className="text-gray-600">*****</div>
                                        ) : (
                                          <input
                                            type="text"
                                            className="w-full bg-gray-800 text-white text-center px-1 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                                            placeholder="0-0"
                                            value={group.resultMatrix[rowIndex]?.[colIndex] || ""}
                                            onChange={(e) =>
                                              handleResultMatrixChange(
                                                group.id,
                                                rowIndex,
                                                colIndex,
                                                e.target.value
                                              )
                                            }
                                          />
                                        )}
                                      </td>
                                    ))}
                                    <td className="border border-gray-700 px-2 py-2 text-center text-green-400 font-semibold">
                                      {stats.wins}
                                    </td>
                                    <td className="border border-gray-700 px-2 py-2 text-center text-red-400 font-semibold">
                                      {stats.losses}
                                    </td>
                                    <td className="border border-gray-700 px-2 py-2 text-center text-blue-400 font-semibold">
                                      {stats.points}
                                    </td>
                                    <td className="border border-gray-700 px-2 py-2 text-center text-yellow-400 font-bold">
                                      {groupIndex + 1}
                                    </td>
                                    <td className="border border-gray-700 px-2 py-1 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        onClick={() => removePlayerFromGroup(group.id, player.id)}
                                        data-testid={`button-remove-player-${player.id}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="text-xs text-gray-400 mt-2">
                          💡 Үр дүнг "3-1" форматаар оруулна уу (эхний тоо - танай багийн оноо)
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          Тоглогч нэмэхийн тулд дээрх сонголтыг ашиглана уу
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {/* KNOCKOUT STAGE SECTION */}
          {currentStage === "knockout" && (
          <section className="w-full rounded-3xl bg-gray-900/80 backdrop-blur-sm shadow-md border border-gray-800 px-8 py-6 mb-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Шууд хасагдах шат ({tournament?.name || ""})
              </h2>

              <div className="flex items-center justify-between gap-4 p-3 bg-gray-950/70 rounded-lg border border-gray-800 mb-4">
                <p className="text-xs text-gray-400">
                  Группаас шилжсэн тоглогчдоор playoff bracket үүсгэнэ
                </p>
                <div className="text-xs text-gray-400 flex gap-4">
                  <span>
                    Нийт тоглолт:{" "}
                    <span className="font-semibold text-white">
                      {knockoutResults.filter((m) => m.eventType === selectedEventType).length}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Knockout bracket visualization */}
            {knockoutResults.filter((m) => m.eventType === selectedEventType).length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-max flex gap-8 p-6">
                  {/* Group matches by round */}
                  {Array.from(new Set(knockoutResults.filter((m) => m.eventType === selectedEventType).map((m) => m.round)))
                    .sort()
                    .map((round) => {
                      const roundMatches = knockoutResults.filter((m) => m.round === round && m.eventType === selectedEventType);
                      const roundName = roundMatches[0]?.roundName || `Раунд ${round}`;

                      return (
                        <div key={round} className="flex flex-col gap-4">
                          <h3 className="text-sm font-semibold text-center text-blue-400 mb-2">
                            {roundName}
                          </h3>
                          <div className="flex flex-col justify-around gap-4" style={{ minHeight: `${roundMatches.length * 80}px` }}>
                            {roundMatches.map((match) => (
                              <div
                                key={match.id}
                                className="bg-gray-900 border border-gray-700 rounded-lg p-3 w-64"
                              >
                                {/* Player 1 */}
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
                                  <Select
                                    value={match.player1?.id || ""}
                                    onValueChange={(value) => {
                                      const player = qualifiedPlayers.find((p) => p.id === value);
                                      if (player) {
                                        setKnockoutResults((prev) =>
                                          prev.map((m) =>
                                            m.id === match.id
                                              ? {
                                                  ...m,
                                                  player1: {
                                                    id: player.id,
                                                    name: player.name,
                                                  },
                                                }
                                              : m
                                          )
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 bg-gray-800 border-gray-700 text-white text-xs">
                                      <SelectValue placeholder="Тоглогч сонгох">
                                        {match.player1?.name || "Тоглогч сонгох"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                                      {qualifiedPlayers.map((player) => (
                                        <SelectItem key={player.id} value={player.id}>
                                          {player.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      className="w-12 h-8 bg-gray-800 text-white text-center text-xs rounded border border-gray-700"
                                      placeholder="0"
                                      value={match.player1Score || ""}
                                      onChange={(e) =>
                                        handleMatchScoreChange(
                                          match.id,
                                          "player1Score",
                                          e.target.value
                                        )
                                      }
                                    />
                                    {match.winner?.id === match.player1?.id && (
                                      <Trophy className="w-4 h-4 text-yellow-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Player 2 */}
                                <div className="flex items-center justify-between">
                                  <Select
                                    value={match.player2?.id || ""}
                                    onValueChange={(value) => {
                                      const player = qualifiedPlayers.find((p) => p.id === value);
                                      if (player) {
                                        setKnockoutResults((prev) =>
                                          prev.map((m) =>
                                            m.id === match.id
                                              ? {
                                                  ...m,
                                                  player2: {
                                                    id: player.id,
                                                    name: player.name,
                                                  },
                                                }
                                              : m
                                          )
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 bg-gray-800 border-gray-700 text-white text-xs">
                                      <SelectValue placeholder="Тоглогч сонгох">
                                        {match.player2?.name || "Тоглогч сонгох"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                                      {qualifiedPlayers.map((player) => (
                                        <SelectItem key={player.id} value={player.id}>
                                          {player.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      className="w-12 h-8 bg-gray-800 text-white text-center text-xs rounded border border-gray-700"
                                      placeholder="0"
                                      value={match.player2Score || ""}
                                      onChange={(e) =>
                                        handleMatchScoreChange(
                                          match.id,
                                          "player2Score",
                                          e.target.value
                                        )
                                      }
                                    />
                                    {match.winner?.id === match.player2?.id && (
                                      <Trophy className="w-4 h-4 text-yellow-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm mb-4">
                  Шууд хасагдах шатыг үүсгэхийн тулд группаас тоглогчдоо шалгаруулна уу
                </p>
                <Button
                  onClick={generateKnockoutBracket}
                  disabled={qualifiedPlayers.length < 4}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Playoff bracket үүсгэх
                </Button>
              </div>
            )}
          </section>
          )}

          {/* FINAL RANKINGS SECTION */}
          {currentStage === "final" && (
          <section className="w-full rounded-3xl bg-gray-900/80 backdrop-blur-sm shadow-md border border-gray-800 px-8 py-6 mb-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-400" />
                Эцсийн байр, медаль ({tournament?.name || ""})
              </h2>

              <div className="flex items-center justify-between gap-4 p-3 bg-gray-950/70 rounded-lg border border-gray-800 mb-4">
                <p className="text-xs text-gray-400">
                  Тэмцээний эцсийн үр дүн болон медалийг тодорхойлох
                </p>
              </div>
            </div>

            {/* Podium Display */}
            {finalRankings.length > 0 && (
              <div className="mb-8">
                <div className="flex items-end justify-center gap-6 mb-8">
                  {/* 2nd Place */}
                  {finalRankings[1] && (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-40 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-xl flex flex-col items-center justify-center border-2 border-gray-500 shadow-lg">
                        <Medal className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-2xl font-bold text-gray-200">2</span>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-semibold text-white">{finalRankings[1].player.name}</p>
                        <p className="text-xs text-gray-400">Мөнгөн медаль</p>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {finalRankings[0] && (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-52 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-t-xl flex flex-col items-center justify-center border-2 border-yellow-400 shadow-2xl">
                        <Trophy className="w-10 h-10 text-yellow-200 mb-2" />
                        <span className="text-3xl font-bold text-yellow-100">1</span>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-base font-bold text-yellow-400">{finalRankings[0].player.name}</p>
                        <p className="text-xs text-yellow-500">Алтан медаль</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {finalRankings[2] && (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-36 bg-gradient-to-b from-orange-700 to-orange-800 rounded-t-xl flex flex-col items-center justify-center border-2 border-orange-600 shadow-lg">
                        <Medal className="w-8 h-8 text-orange-300 mb-2" />
                        <span className="text-2xl font-bold text-orange-200">3</span>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-semibold text-white">{finalRankings[2].player.name}</p>
                        <p className="text-xs text-gray-400">Хүрэл медаль</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="bg-gray-950/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-4">Бүх байрууд</h3>
              
              {finalRankings.filter((r) => r.eventType === selectedEventType).length > 0 ? (
                <div className="space-y-2">
                  {finalRankings
                    .filter((r) => r.eventType === selectedEventType)
                    .map((ranking) => (
                    <div
                      key={ranking.position}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        ranking.position === 1
                          ? "bg-yellow-500/10 border border-yellow-500/30"
                          : ranking.position === 2
                          ? "bg-gray-500/10 border border-gray-500/30"
                          : ranking.position === 3
                          ? "bg-orange-500/10 border border-orange-500/30"
                          : "bg-gray-800/50 border border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                            ranking.position === 1
                              ? "bg-yellow-500 text-yellow-900"
                              : ranking.position === 2
                              ? "bg-gray-400 text-gray-900"
                              : ranking.position === 3
                              ? "bg-orange-600 text-orange-100"
                              : "bg-gray-700 text-gray-200"
                          }`}
                        >
                          {ranking.position}
                        </div>
                        <div>
                          <p className="text-white font-medium">{ranking.player.name}</p>
                          {ranking.note && (
                            <p className="text-xs text-gray-400">{ranking.note}</p>
                          )}
                        </div>
                      </div>
                      {ranking.position <= 3 && (
                        <Medal
                          className={`w-6 h-6 ${
                            ranking.position === 1
                              ? "text-yellow-400"
                              : ranking.position === 2
                              ? "text-gray-400"
                              : "text-orange-500"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button
                    onClick={() => {
                      // Auto-generate from knockout results filtered by eventType
                      const finalMatch = knockoutResults.find((m) => m.roundName === "Финал" && m.eventType === selectedEventType);
                      const bronzeMatch = knockoutResults.find((m) => m.roundName === "Хүрэл медалийн тоглолт" && m.eventType === selectedEventType);
                      
                      const newRankings: FinalRanking[] = [];
                      
                      if (finalMatch?.winner) {
                        newRankings.push({
                          position: 1,
                          eventType: selectedEventType, // Add event type
                          player: finalMatch.winner,
                          note: "Алтан медаль",
                        });
                        
                        const runnerUp = finalMatch.winner.id === finalMatch.player1?.id 
                          ? finalMatch.player2 
                          : finalMatch.player1;
                        
                        if (runnerUp) {
                          newRankings.push({
                            position: 2,
                            eventType: selectedEventType, // Add event type
                            player: runnerUp,
                            note: "Мөнгөн медаль",
                          });
                        }
                      }
                      
                      if (bronzeMatch?.winner) {
                        newRankings.push({
                          position: 3,
                          eventType: selectedEventType, // Add event type
                          player: bronzeMatch.winner,
                          note: "Хүрэл медаль",
                        });
                      }
                      
                      setFinalRankings(newRankings);
                      toast({
                        title: "Эцсийн байр үүсгэгдлээ",
                        description: "Шигшээ тоглолтын үр дүнгээс автоматаар үүсгэгдлээ",
                      });
                    }}
                    disabled={!knockoutResults.find((m) => m.roundName === "Финал" && m.eventType === selectedEventType)?.winner}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Эцсийн байр автоматаар үүсгэх
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Шигшээ тоглолтын үр дүнгээс автоматаар эцсийн байрыг тодорхойлно
                  </p>
                </div>
              )}
            </div>

            {/* Manual ranking editor */}
            {finalRankings.filter((r) => r.eventType === selectedEventType).length > 0 && (
              <div className="mt-6 bg-gray-950/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Гараар нэмэх
                </h3>
                <div className="flex gap-3">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const player = qualifiedPlayers.find((p) => p.id === value);
                      if (player && !finalRankings.find((r) => r.player.id === value && r.eventType === selectedEventType)) {
                        const currentEventRankings = finalRankings.filter((r) => r.eventType === selectedEventType);
                        setFinalRankings([
                          ...finalRankings,
                          {
                            position: currentEventRankings.length + 1,
                            eventType: selectedEventType, // Add event type
                            player: {
                              id: player.id,
                              name: player.name,
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Тоглогч сонгох" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                      {qualifiedPlayers
                        .filter((p) => !finalRankings.find((r) => r.player.id === p.id && r.eventType === selectedEventType))
                        .map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFinalRankings(finalRankings.filter((r) => r.eventType !== selectedEventType))}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Бүгдийг цэвэрлэх
                  </Button>
                </div>
              </div>
            )}
          </section>
          )}

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
