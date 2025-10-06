import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Users, Trophy, Target, Download, Upload, FileSpreadsheet, Minus, Eye, EyeOff, Medal, Crown, Award, User, X, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { KnockoutBracketEditor } from "@/components/KnockoutBracketEditor";
import type { Tournament, TournamentResults, TournamentParticipant, User as UserType } from "@shared/schema";
import * as XLSX from 'xlsx';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ObjectUploader } from "@/components/ObjectUploader";

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
  const [isPublished, setIsPublished] = useState(true);
  const [selectedPlayerTab, setSelectedPlayerTab] = useState<string>("all");
  const [qualifiedPlayers, setQualifiedPlayers] = useState<QualifiedPlayer[]>([]);
  const [showAddPlayerToGroup, setShowAddPlayerToGroup] = useState<string | null>(null);
  const [selectedNewPlayerId, setSelectedNewPlayerId] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [resultsImages, setResultsImages] = useState<{url: string, description: string}[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

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
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!params?.tournamentId
  });

  // Fetch tournaments for the dropdown
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments');
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        const data = await response.json();
        setTournaments(data);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        toast({
          title: "Алдаа",
          description: "Тэмцээний жагсаалтыг татаж чадсангүй",
          variant: "destructive",
        });
      }
    };

    fetchTournaments();
  }, []);

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
    onSuccess: (data) => {
      console.log('Tournament results saved successfully:', data);
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: isPublished 
          ? "Тэмцээний үр дүн нийтлэгдлээ" 
          : "Тэмцээний үр дүн хадгалагдлаа (хараахан нийтлэгдээгүй)",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.tournamentId, 'results'] });
    },
    onError: (error: any) => {
      console.error('Error saving tournament results:', error);
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
      if (existingResults.finalRankings && existingResults.finalRankings.images) {
        setResultsImages(existingResults.finalRankings.images);
      }
    }
  }, [existingResults]);

  // Generate qualified players from group stage results
  useEffect(() => {
    const qualified: QualifiedPlayer[] = [];

    if (Array.isArray(groupStageResults)) {
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
    }

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

  // Calculate group statistics from result matrix
  const calculateGroupStats = (group: GroupStageGroup) => {
    const stats = group.players.map(player => ({
      playerId: player.id,
      wins: 0,
      losses: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0
    }));

    // Calculate stats from result matrix
    for (let i = 0; i < group.players.length; i++) {
      for (let j = 0; j < group.players.length; j++) {
        if (i !== j && group.resultMatrix[i]?.[j]) {
          const result = group.resultMatrix[i][j];
          if (result && result !== '' && result !== '-') {
            const scoreParts = result.split('-').map(s => s.trim());
            if (scoreParts.length === 2) {
              const score1 = parseInt(scoreParts[0]) || 0;
              const score2 = parseInt(scoreParts[1]) || 0;

              if (score1 > score2) {
                stats[i].wins++;
                stats[i].points += 2; // 2 points for win
                stats[j].losses++;
                stats[j].points += 1; // 1 point for loss
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

  // Handle result matrix change
  const handleResultMatrixChange = (groupId: string, rowIndex: number, colIndex: number, value: string) => {
    setGroupStageResults(prev => prev.map(group => {
      if (group.id !== groupId) return group;

      const newMatrix = [...group.resultMatrix];
      if (!newMatrix[rowIndex]) newMatrix[rowIndex] = [];
      newMatrix[rowIndex][colIndex] = value;

      // Recalculate stats
      const newStats = calculateGroupStats({ ...group, resultMatrix: newMatrix });

      return {
        ...group,
        resultMatrix: newMatrix,
        playerStats: newStats
      };
    }));
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

  // Create group stage
  const createGroupStage = () => {
    if (!participants || participants.length < 8) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Хэсэгийн тоглолтод дор хаяж 8 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    // Calculate number of groups based on participants
    const totalParticipants = participants.length;
    let groupCount = 4; // Default 4 groups
    let playersPerGroup = 4; // Default 4 players per group

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
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    // Create groups
    for (let i = 0; i < groupCount; i++) {
      const groupLetter = String.fromCharCode(65 + i); // A, B, C, D...
      const startIndex = i * playersPerGroup;
      const groupParticipants = shuffledParticipants.slice(startIndex, startIndex + playersPerGroup);

      if (groupParticipants.length >= 3) { // At least 3 players needed
        groups.push({
          id: `group_${groupLetter.toLowerCase()}`,
          name: `${groupLetter} хэсэг`,
          players: groupParticipants.map(p => ({
            id: p.id,
            name: p.user?.firstName && p.user?.lastName
              ? `${p.user.firstName} ${p.user.lastName}`
              : `Тоглогч ${p.id}`,
            playerId: p.id,
            userId: p.userId
          })),
          resultMatrix: [],
          playerStats: groupParticipants.map(p => ({
            playerId: p.id,
            wins: 0,
            losses: 0,
            points: 0
          }))
        });
      }
    }

    setGroupStageResults(groups);
    toast({
      title: "Хэсэгийн шат үүсгэгдлээ",
      description: `${groups.length} хэсэг үүсгэж ${totalParticipants} тоглогчийг хуваарилсан`
    });
  };

  // Add a new group
  const addNewGroup = () => {
    const newGroupLetter = String.fromCharCode(65 + groupStageResults.length);
    const newGroup: GroupStageGroup = {
      id: `group_${newGroupLetter.toLowerCase()}`,
      name: `${newGroupLetter} хэсэг`,
      players: [],
      resultMatrix: [],
      playerStats: []
    };
    setGroupStageResults(prev => [...prev, newGroup]);
    toast({
      title: "Шинэ хэсэг үүсгэгдлээ",
      description: `${newGroup.name} амжилттай үүсгэгдлээ`
    });
  };

  // Remove a player from a group
  const removePlayerFromGroup = (groupId: string, playerId: string) => {
    setGroupStageResults(prev => prev.map(group => {
      if (group.id !== groupId) return group;

      const playerIndex = group.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return group;

      const updatedPlayers = group.players.filter(player => player.id !== playerId);

      // Remove the player's row and column from result matrix
      const newMatrix = group.resultMatrix
        .filter((_, i) => i !== playerIndex)
        .map(row => row.filter((_, j) => j !== playerIndex));

      // Recalculate stats
      const updatedGroup = {
        ...group,
        players: updatedPlayers,
        resultMatrix: newMatrix,
        playerStats: updatedPlayers.map(p => ({
          playerId: p.id,
          wins: 0,
          losses: 0,
          points: 0
        }))
      };

      const newStats = calculateGroupStats(updatedGroup);

      return {
        ...updatedGroup,
        playerStats: newStats
      };
    }));
    toast({
      title: "Тоглогч хасагдлаа",
      description: `Тоглогч амжилттай хасагдлаа`
    });
  };

  // Generate proper knockout bracket based on qualified players count
  const generateKnockoutBracket = () => {
    if (qualifiedPlayers.length < 4) {
      toast({
        title: "Хангалтгүй тоглогч",
        description: "Дор хаяж 4 тоглогч шаардлагатай",
        variant: "destructive"
      });
      return;
    }

    const playerCount = qualifiedPlayers.length;
    const matches: KnockoutMatch[] = [];

    // Calculate the next power of 2 to determine bracket size
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(playerCount)));
    const totalMatches = nextPowerOf2 - 1; // Total matches in a single elimination tournament
    const rounds = Math.ceil(Math.log2(nextPowerOf2));

    console.log(`Generating bracket for ${playerCount} players. Next power of 2: ${nextPowerOf2}, Total matches: ${totalMatches}, Rounds: ${rounds}`);

    // Determine tournament structure based on next power of 2
    const getRoundStructure = (powerOf2: number) => {
      if (powerOf2 <= 4) return { rounds: 2, firstRoundName: "Хагас финал" };
      if (powerOf2 <= 8) return { rounds: 3, firstRoundName: "Дөрөвний финал" };
      if (powerOf2 <= 16) return { rounds: 4, firstRoundName: "1/8 финал" };
      if (powerOf2 <= 32) return { rounds: 5, firstRoundName: "1/16 финал" };
      if (powerOf2 <= 64) return { rounds: 6, firstRoundName: "1/32 финал" };
      return { rounds: 7, firstRoundName: "1/64 финал" };
    };

    const { rounds: totalRounds, firstRoundName } = getRoundStructure(nextPowerOf2);

    // Generate all rounds
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      const roundName = getRoundName(matchesInRound);

      for (let i = 0; i < matchesInRound; i++) {
        const matchId = `round${round}_${i + 1}`;

        // For first round, assign actual players
        if (round === 1) {
          const player1Index = i * 2;
          const player2Index = i * 2 + 1;

          matches.push({
            id: matchId,
            round: round.toString(),
            roundName: roundName,
            player1: player1Index < qualifiedPlayers.length ? {
              id: qualifiedPlayers[player1Index].id,
              name: qualifiedPlayers[player1Index].name
            } : undefined,
            player2: player2Index < qualifiedPlayers.length ? {
              id: qualifiedPlayers[player2Index].id,
              name: qualifiedPlayers[player2Index].name
            } : undefined,
            isFinished: false
          });
        } else {
          // For subsequent rounds, matches will be populated when previous round winners are determined
          matches.push({
            id: matchId,
            round: round.toString(),
            roundName: roundName,
            isFinished: false
          });
        }
      }
    }

    // Add bronze medal match (third place playoff) for tournaments with more than 4 players
    if (playerCount > 4) {
      matches.push({
        id: 'bronze_medal_match',
        round: (totalRounds + 1).toString(),
        roundName: "Хүрэл медалийн тоглолт",
        isFinished: false
      });
    }

    setKnockoutResults(matches);
    toast({
      title: "Шигшээ тоглолт үүсгэгдлээ",
      description: `${qualifiedPlayers.length} тоглогчийн ${totalMatches + (playerCount > 4 ? 1 : 0)} тоглолттой шигшээ тоглолт үүсгэгдлээ`
    });
  };

  // Helper function to get round name based on matches count
  const getRoundName = (matchCount: number): string => {
    switch (matchCount) {
      case 1: return 'Финал';
      case 2: return 'Хагас финал';
      case 4: return 'Дөрөвний финал';
      case 8: return '1/8 финал';
      case 16: return '1/16 финал';
      case 32: return '1/32 финал';
      case 64: return '1/64 финал';
      default:
        if (matchCount > 1) {
          return `1/${matchCount * 2} финал`;
        }
        return `${matchCount} тоглолт`;
    }
  };

  // Save function
  const handleSave = () => {
    if (!params?.tournamentId) return;

    // Prepare knockout results with proper structure
    const preparedKnockoutResults = knockoutResults.map(match => ({
      id: match.id,
      round: match.round,
      roundName: match.roundName,
      player1: match.player1 || null,
      player2: match.player2 || null,
      player1Score: match.player1Score || null,
      player2Score: match.player2Score || null,
      winner: match.winner || null,
      isFinished: !!match.winner
    }));

    const data = {
      tournamentId: params.tournamentId,
      groupStageResults: groupStageResults.length > 0 ? groupStageResults : null,
      knockoutResults: preparedKnockoutResults.length > 0 ? preparedKnockoutResults : null,
      finalRankings: finalRankings.length > 0 ? finalRankings : null,
      isPublished,
    };

    console.log('Saving tournament results with data:', data);
    saveResultsMutation.mutate(data);
  };

  // Improved handleAddPlayerToGroup function
  const handleAddPlayerToGroup = (groupId: string, user: UserType) => {
    if (!user || !user.id) {
      console.error('Invalid user data:', user);
      toast({
        title: "Алдаа",
        description: "Буруу тоглогчийн мэдээлэл байна.",
        variant: "destructive"
      });
      return;
    }

    setGroupStageResults(prev => 
      prev.map(group => {
        if (group.id !== groupId) return group;

        const newPlayer = {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown Player',
          playerId: user.id,
          userId: user.id
        };

        const updatedGroup = {
          ...group,
          players: [...group.players, newPlayer],
          playerStats: [...group.playerStats, {
            playerId: user.id,
            wins: 0,
            losses: 0,
            points: 0
          }]
        };

        // Initialize result matrix for the new player count
        const playerCount = updatedGroup.players.length;
        const newMatrix = Array(playerCount).fill(null).map((_, i) => 
          Array(playerCount).fill('').map((_, j) => 
            group.resultMatrix[i]?.[j] || ''
          )
        );

        // Recalculate stats based on existing results
        const newStats = calculateGroupStats({ ...updatedGroup, resultMatrix: newMatrix });

        return {
          ...updatedGroup,
          resultMatrix: newMatrix,
          playerStats: newStats
        };
      })
    );

    toast({
      title: "Тоглогч нэмэгдлээ",
      description: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown Player' + ` групп-д нэмэгдлээ`
    });
  };

  // New function to handle saving the results with images and descriptions
  const saveResults = async () => {
    if (!selectedTournament) {
      toast({
        title: "Алдаа",
        description: "Тэмцээн сонгоно уу",
        variant: "destructive"
      });
      return;
    }

    if (resultsImages.length === 0) {
      toast({
        title: "Алдаа",
        description: "Дор хаяж нэг зураг хуулна уу",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/tournament-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          finalRankings: {
            images: resultsImages
          },
          isPublished: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save results');
      }

      toast({
        title: "Амжилттай",
        description: "Үр дүн амжилттай хадгалагдлаа"
      });

      // Reset form
      setSelectedTournament('');
      setResultsImages([]);

    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "Алдаа",
        description: "Үр дүн хадгалахад алдаа гарлаа",
        variant: "destructive"
      });
    }
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
              <Users className="w-6 h-6 text-green-500" />
              Хэсэгийн шатны тоглолт
            </h2>
            <div className="flex items-center gap-2">
              {groupStageResults.length > 0 && (
                <Button
                  onClick={addNewGroup}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Хэсэг нэмэх
                </Button>
              )}
              <Button
                onClick={generateKnockoutBracket}
                disabled={qualifiedPlayers.length < 4}
                className="bg-green-600 hover:bg-green-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Шигшээ тоглолт үүсгэх
              </Button>
              {existingResults?.knockoutResults && Array.isArray(existingResults.knockoutResults) && existingResults.knockoutResults.length > 0 && (
                <Button
                  onClick={() => {
                    setKnockoutResults(existingResults.knockoutResults as KnockoutMatch[]);
                    toast({
                      title: "Үр дүн сэргээгдлээ",
                      description: "Хадгалсан шигшээ тоглолтын үр дүн сэргээгдлээ"
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Хадгалсан үр дүн
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Excel татах
              </Button>
            </div>
          </div>

          {Array.isArray(groupStageResults) && groupStageResults.length > 0 ? (
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
                          <div key={player.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded justify-between">
                            <span className="text-sm text-white">{playerIndex + 1}. {player.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePlayerFromGroup(group.id, player.id)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {group.players.length === 0 && <p className="text-gray-500 text-sm">Энэ хэсэгт тоглогч байхгүй байна.</p>}
                      </div>
                      {/* Button to show modal */}
                      <Button
                        size="sm"
                        className="mt-3 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowAddPlayerToGroup(group.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Тоглогч нэмэх
                      </Button>

                      {/* Add Player Modal */}
                      {showAddPlayerToGroup === group.id && (
                        <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <h5 className="text-sm font-medium text-white mb-3">Тоглогч сонгох</h5>
                          <div className="space-y-3">
                            <UserAutocomplete
                              users={(participants || [])
                                .filter(participant => {
                                  // Filter out participants already in groups
                                  const usedPlayerIds = Array.isArray(groupStageResults) ? groupStageResults.flatMap(g => 
                                    g.players.map(p => p.id).filter(Boolean)
                                  ) : [];
                                  return !usedPlayerIds.includes(participant.playerId);
                                })
                                .map(participant => ({
                                  id: participant.playerId,
                                  firstName: participant.firstName || '',
                                  lastName: participant.lastName || '',
                                  email: participant.email || '',
                                  phone: participant.phone || '',
                                  role: 'player' as const,
                                }))}
                              value={selectedNewPlayerId}
                              onSelect={(user) => {
                                if (user && user.id) {
                                  setSelectedNewPlayerId(user.id);
                                  handleAddPlayerToGroup(group.id, user);
                                  setShowAddPlayerToGroup(null);
                                  setSelectedNewPlayerId('');
                                } else {
                                  setSelectedNewPlayerId('');
                                }
                              }}
                              placeholder="Тоглогч сонгох..."
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAddPlayerToGroup(null);
                                  setSelectedNewPlayerId('');
                                }}
                              >
                                Цуцлах
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
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
                                        onChange={(e) => handleResultMatrixChange(group.id, rowIndex, colIndex, e.target.value)}
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
                              <th className="border border-gray-600 p-2 text-left text-gray-300">Байр</th>
                              <th className="border border-gray-600 p-2 text-left text-gray-300">Тоглогч</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Хожсон</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Хожигдсон</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Оноо</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Сэт +/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.players
                              .map((player) => {
                                // Use calculated stats
                                const calculatedStats = calculateGroupStats(group);
                                const stats = calculatedStats.find(s => s.playerId === player.id) || {
                                  wins: 0,
                                  losses: 0,
                                  points: 0,
                                  setsWon: 0,
                                  setsLost: 0
                                };
                                return { player, stats };
                              })
                              .sort((a, b) => {
                                // Sort by points first, then by sets difference
                                if (b.stats.points !== a.stats.points) {
                                  return b.stats.points - a.stats.points;
                                }
                                const setsDiffA = a.stats.setsWon - a.stats.setsLost;
                                const setsDiffB = b.stats.setsWon - b.stats.setsLost;
                                if (setsDiffB !== setsDiffA) {
                                  return setsDiffB - setsDiffA;
                                }
                                return b.stats.setsWon - a.stats.setsWon;
                              })
                              .map(({ player, stats }, index) => (
                                <tr key={player.id} className={`${index < 2 ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                                  <td className="border border-gray-600 p-2 text-center text-white">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="text-lg font-bold">{index + 1}</span>
                                      {index < 2 && <Badge className="bg-green-600 text-xs ml-1">Q</Badge>}
                                    </div>
                                  </td>
                                  <td className="border border-gray-600 p-2 text-white">
                                    <span>{player.name}</span>
                                  </td>
                                  <td className="border border-gray-600 p-2 text-center text-white">{stats.wins}</td>
                                  <td className="border border-gray-600 p-2 text-center text-white">{stats.losses}</td>
                                  <td className="border border-gray-600 p-2 text-center text-white font-bold">{stats.points}</td>
                                  <td className="border border-gray-600 p-2 text-center text-white">
                                    <span className={`${stats.setsWon - stats.setsLost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {stats.setsWon - stats.setsLost >= 0 ? '+' : ''}{stats.setsWon - stats.setsLost}
                                    </span>
                                  </td>
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
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {participants?.length || 0} оролцогч бүртгэгдсэн байна
                  </p>
                  <Button
                    onClick={createGroupStage}
                    disabled={!participants || participants.length < 8}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Хэсэгийн шат үүсгэх
                  </Button>
                  {(!participants || participants.length < 8) && (
                    <p className="text-xs text-red-400">
                      Дор хаяж 8 тоглогч шаардлагатай
                    </p>
                  )}
                </div>
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
              {existingResults?.knockoutResults && Array.isArray(existingResults.knockoutResults) && existingResults.knockoutResults.length > 0 && (
                <Button
                  onClick={() => {
                    setKnockoutResults(existingResults.knockoutResults as KnockoutMatch[]);
                    toast({
                      title: "Үр дүн сэргээгдлээ",
                      description: "Хадгалсан шигшээ тоглолтын үр дүн сэргээгдлээ"
                    });
                  }}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Хадгалсан үр дүн сэргээх
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Excel татах
              </Button>
            </div>
          </div>

          <Tabs value={selectedPlayerTab} onValueChange={setSelectedPlayerTab}>
                <TabsList className="bg-gray-800 border border-gray-700 p-1">
                  <TabsTrigger value="all" className="px-4 py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">Бүгд ({qualifiedPlayers.length})</TabsTrigger>
                  {Array.isArray(qualifiedPlayers) ? qualifiedPlayers.map((player) => (
                    <TabsTrigger
                      key={player.id}
                      value={player.id}
                      className="px-4 py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
                    >
                      {player.name}
                    </TabsTrigger>
                  )) : null}
                  <TabsTrigger value="manage" className="px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300">
                    Тоглогч удирдах
                  </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Array.isArray(qualifiedPlayers) ? qualifiedPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg border border-gray-600"
                          >
                        <Badge variant="outline" className="text-xs">
                          #{player.seed}
                        </Badge>
                        <div className="flex-1">
                              <div className="font-medium text-sm text-white">{player.name}</div>
                              <div className="text-xs text-gray-400">{player.groupName} - {player.position}-р</div>
                            </div>
                      </div>
                    )) : null}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {Array.isArray(qualifiedPlayers) ? qualifiedPlayers.map((player) => (
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
            )) : null}

            <TabsContent value="manage" className="mt-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Шилжих тоглогчдыг удирдах:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-600">
                          <thead>
                            <tr className="bg-gray-700">
                              <th className="border border-gray-600 p-2 text-left text-gray-300">#</th>
                              <th className="border border-gray-600 p-2 text-left text-gray-300">Нэр</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Хэсэг</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Байр</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Seed</th>
                              <th className="border border-gray-600 p-2 text-center text-gray-300">Үйлдэл</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualifiedPlayers.map((player, index) => (
                              <tr key={player.id} className="bg-gray-800">
                                <td className="border border-gray-600 p-2 text-white">{index + 1}</td>
                                <td className="border border-gray-600 p-2 text-white font-medium">{player.name}</td>
                                <td className="border border-gray-600 p-2 text-center text-gray-400">{player.groupName}</td>
                                <td className="border border-gray-600 p-2 text-center text-white font-bold">{player.position}</td>
                                <td className="border border-gray-600 p-2 text-center text-white">{player.seed}</td>
                                <td className="border border-gray-600 p-2 text-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { /* Handle remove player logic */ }}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Knockout Bracket */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Trophy className="w-6 h-6 text-purple-500" />
            Шилжих тоглолтын удирдлага
          </h2>

          <KnockoutBracketEditor
            initialMatches={knockoutResults.map(match => ({
              ...match,
              position: { x: 100, y: 100 }, // Default position, will be calculated by the editor
              nextMatchId: undefined, // Will be calculated by the editor
              player1Score: match.player1Score,
              player2Score: match.player2Score
            }))}
            users={users || []} // Pass users for additional player options
            qualifiedPlayers={qualifiedPlayers}
            onSave={(matches) => {
              setKnockoutResults(matches.map(match => ({
                id: match.id,
                round: match.round.toString(),
                roundName: match.roundName,
                player1: match.player1,
                player2: match.player2,
                winner: match.winner,
                player1Score: match.player1Score,
                player2Score: match.player2Score,
                isFinished: !!match.winner
              })));
              toast({
                title: "Хадгалагдлаа",
                description: "Шигшээ тоглолтын үр дүн хадгалагдлаа"
              });
            }}
          />
        </div>

        {/* Upload Results Section */}
        <div className="mb-8">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Upload className="w-5 h-5" />
                    Тэмцээний үр дүн оруулах
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="tournamentSelect">Тэмцээн сонгох</Label>
                    <select
                    id="tournamentSelect"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    >
                    <option value="">Тэмцээн сонгоно уу</option>
                    {tournaments.map((tournament: any) => (
                        <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                        </option>
                    ))}
                    </select>
                </div>

                {selectedTournament && (
                    <div className="space-y-4">
                    <div>
                        <Label>Үр дүнгийн зураг хуулах</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                        Тэмцээний үр дүнгийн зураг хуулж, тайлбар нэмнэ үү
                        </p>
                        <ObjectUploader
                        maxNumberOfFiles={5}
                        maxFileSize={5 * 1024 * 1024}
                        onGetUploadParameters={async () => {
                            const response = await fetch('/api/objects/upload', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                            });
                            const data = await response.json();
                            return {
                            method: 'PUT' as const,
                            url: data.uploadURL
                            };
                        }}
                        onComplete={async (result) => {
                            if (result.successful && result.successful.length > 0) {
                            const newImages = [];
                            for (const file of result.successful) {
                                try {
                                const response = await fetch('/api/objects/finalize', {
                                    method: 'PUT',
                                    headers: {
                                    'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                    fileURL: file.uploadURL,
                                    isPublic: true
                                    })
                                });
                                const data = await response.json();
                                newImages.push({
                                    url: data.objectPath,
                                    description: ''
                                });
                                } catch (error) {
                                console.error('Error finalizing upload:', error);
                                }
                            }
                            setResultsImages(prev => [...prev, ...newImages]);
                            toast({
                                title: "Амжилттай",
                                description: `${newImages.length} зураг хуулагдлаа`
                            });
                            }
                        }}
                        buttonClassName="w-full"
                        >
                        <Upload className="w-4 h-4 mr-2" />
                        Үр дүнгийн зураг сонгох
                        </ObjectUploader>
                    </div>

                    {resultsImages.length > 0 && (
                        <div>
                        <Label>Хуулсан зургууд ба тайлбар</Label>
                        <div className="space-y-4">
                            {resultsImages.map((item, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3">
                                <div className="relative">
                                <img
                                    src={item.url.startsWith('/') ? item.url : `/objects/${item.url}`}
                                    alt={`Үр дүн ${index + 1}`}
                                    className="w-full h-48 object-cover rounded border"
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => setResultsImages(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                </div>
                                <div>
                                <Label htmlFor={`description-${index}`}>Зургийн тайлбар</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    placeholder="Энэ зургийн тухай тайлбар бичнэ үү..."
                                    value={item.description}
                                    onChange={(e) => {
                                    const newImages = [...resultsImages];
                                    newImages[index] = { ...newImages[index], description: e.target.value };
                                    setResultsImages(newImages);
                                    }}
                                    rows={3}
                                />
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                    <Button 
                        onClick={saveResults}
                        disabled={!selectedTournament || resultsImages.length === 0}
                        className="w-full"
                    >
                        Үр дүн хадгалах
                    </Button>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        {/* Settings Panel */}
            <div className="mb-6">
              <Card className="bg-gray-800 border-gray-700">
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
      </div>
    </PageWithLoading>
  );
};

export default AdminTournamentResults;