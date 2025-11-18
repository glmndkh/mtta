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
  const [selectedEventType, setSelectedEventType] = useState<'SINGLES' | 'DOUBLES' | 'TEAM'>('SINGLES');

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

  // Fetch tournament teams/pairs for count display
  const { data: tournamentTeams = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments', params?.tournamentId, 'teams'],
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

  // Get available event types from tournament
  const getAvailableEventTypes = () => {
    if (!tournament?.participationTypes) return [];
    
    // participationTypes is stored as an array of strings like ["SINGLES", "DOUBLES", "TEAM"]
    return tournament.participationTypes.map(type => type.toUpperCase()) as ('SINGLES' | 'DOUBLES' | 'TEAM')[];
  };

  // Get participants filtered by event type
  const getParticipantsByEventType = (eventType: 'SINGLES' | 'DOUBLES' | 'TEAM') => {
    if (!participants) return [];
    
    return participants.filter((participant: any) => {
      // participationType is stored as a simple string like "SINGLES", "DOUBLES", "TEAM"
      return participant.participationType === eventType;
    });
  };

  // Get teams/pairs filtered by event type
  const getTeamsByEventType = (eventType: 'SINGLES' | 'DOUBLES' | 'TEAM') => {
    if (!tournamentTeams) return [];
    
    return tournamentTeams.filter((team: any) => team.eventType === eventType);
  };

  // Get participant/team count display for event type
  const getCountDisplay = (eventType: 'SINGLES' | 'DOUBLES' | 'TEAM') => {
    if (eventType === 'SINGLES') {
      const count = getParticipantsByEventType(eventType).length;
      return `Нийт: ${count} оролцогч`;
    } else if (eventType === 'DOUBLES') {
      const pairCount = getTeamsByEventType(eventType).length;
      const participantCount = getParticipantsByEventType(eventType).length;
      return `Нийт: ${pairCount} хос (${participantCount} тоглогч)`;
    } else if (eventType === 'TEAM') {
      const teamCount = getTeamsByEventType(eventType).length;
      const participantCount = getParticipantsByEventType(eventType).length;
      return `Нийт: ${teamCount} баг (${participantCount} гишүүн)`;
    }
    return '';
  };

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-6">
          {/* Compact Header */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-6 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setLocation('/admin/tournaments')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Буцах
                </Button>
                <div className="border-l border-gray-700 pl-3">
                  <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {participants?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {tournament.format}
                    </span>
                    <Badge
                      variant={isPublished ? "default" : "secondary"}
                      className={`text-xs ${
                        isPublished
                          ? "bg-green-600/20 text-green-400 border-green-500/30"
                          : "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
                      }`}
                    >
                      {isPublished ? "Нийтлэгдсэн" : "Ноорог"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saveResultsMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveResultsMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </div>

        {/* Compact Podium */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {podiumWinners.first && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 text-center backdrop-blur-sm">
                <div className="text-3xl mb-1">🥇</div>
                <div className="text-sm font-semibold text-yellow-400">{podiumWinners.first.name}</div>
              </div>
            )}
            {podiumWinners.second && (
              <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border border-gray-400/30 rounded-lg p-4 text-center backdrop-blur-sm">
                <div className="text-3xl mb-1">🥈</div>
                <div className="text-sm font-semibold text-gray-300">{podiumWinners.second.name}</div>
              </div>
            )}
            {podiumWinners.third && (
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-4 text-center backdrop-blur-sm">
                <div className="text-3xl mb-1">🥉</div>
                <div className="text-sm font-semibold text-orange-400">{podiumWinners.third.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Event Type Tabs */}
        <div className="mb-6">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
            <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Тэмцээний төрөл
            </div>
              <Tabs value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as 'SINGLES' | 'DOUBLES' | 'TEAM')}>
                <TabsList className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 w-full grid grid-cols-3 gap-2 p-1">
                  {getAvailableEventTypes().includes('SINGLES') && (
                    <TabsTrigger 
                      value="SINGLES" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 text-sm"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Ганцаар
                    </TabsTrigger>
                  )}
                  {getAvailableEventTypes().includes('DOUBLES') && (
                    <TabsTrigger 
                      value="DOUBLES" 
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400 text-sm"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Хос
                    </TabsTrigger>
                  )}
                  {getAvailableEventTypes().includes('TEAM') && (
                    <TabsTrigger 
                      value="TEAM" 
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 text-sm"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Баг
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="SINGLES" className="mt-3">
                  <div className="text-xs text-gray-400 mb-2">{getCountDisplay('SINGLES')}</div>
                </TabsContent>

                <TabsContent value="DOUBLES" className="mt-3">
                  <div className="text-xs text-gray-400 mb-2">{getCountDisplay('DOUBLES')}</div>
                </TabsContent>

                <TabsContent value="TEAM" className="mt-3">
                  <div className="text-xs text-gray-400 mb-2">{getCountDisplay('TEAM')}</div>
                </TabsContent>
              </Tabs>
            </div>
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

        {/* Modern Results Input Section */}
        <div className="mb-8">
          <div className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-6 shadow-lg mb-6">
            <div className="flex items-center gap-3 text-2xl font-semibold">
              <span className="text-3xl">🏆</span>
              <span>Тэмцээний үр дүн оруулах</span>
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-sm text-white/80 mt-2">Админ хэсэг - Групп шат удирдлага</p>
            <div className="mt-3 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-xs backdrop-blur">
              <span className="font-semibold">{tournament.name}</span>
              <span className="h-4 w-px bg-white/40" />
              <span>{selectedEventType === 'SINGLES' ? 'Ганцаарчилсан' : selectedEventType === 'DOUBLES' ? 'Хос' : 'Баг'} тэмцээн</span>
              <span className="h-4 w-px bg-white/40" />
              <span>Нийт бүртгэлтэй: {getParticipantsByEventType(selectedEventType).length}</span>
            </div>
          </div>

          {/* Category Selection Card */}
          <section className="w-full rounded-3xl bg-gray-800/80 backdrop-blur-sm shadow-md border border-gray-700/50 px-8 py-6 space-y-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">🏅</div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white">Тэмцээний ангилал</span>
                <span className="text-xs text-gray-400">Тэмцээний төрөл, горимоо сонгоно уу</span>
              </div>
            </div>

            {/* Event Type Tabs */}
            <div className="grid grid-cols-3 gap-3">
              {getAvailableEventTypes().includes('SINGLES') && (
                <button
                  onClick={() => setSelectedEventType('SINGLES')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition ${
                    selectedEventType === 'SINGLES'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">👤</span>
                  <span>Ганцаарчилсан</span>
                </button>
              )}
              {getAvailableEventTypes().includes('DOUBLES') && (
                <button
                  onClick={() => setSelectedEventType('DOUBLES')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition ${
                    selectedEventType === 'DOUBLES'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">👥</span>
                  <span>Хосын тэмцээн</span>
                </button>
              )}
              {getAvailableEventTypes().includes('TEAM') && (
                <button
                  onClick={() => setSelectedEventType('TEAM')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-sm transition ${
                    selectedEventType === 'TEAM'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">🧑‍🤝‍🧑</span>
                  <span>Багийн тэмцээн</span>
                </button>
              )}
            </div>

            <div className="h-px bg-gray-700" />

            {/* Stage Selection Tabs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Шатыг сонгох
                </label>
                <div className="flex gap-3 text-sm font-medium">
                  <button className="flex-1 rounded-2xl bg-blue-600 text-white py-2.5 shadow-sm border border-blue-700">
                    Групп шат
                  </button>
                  <button className="flex-1 rounded-2xl bg-gray-700/50 text-gray-300 py-2.5 border border-gray-600 hover:bg-gray-700 transition">
                    Шууд хасагдах шат
                  </button>
                  <button className="flex-1 rounded-2xl bg-gray-700/50 text-gray-300 py-2.5 border border-gray-600 hover:bg-gray-700 transition">
                    Эцсийн байр, медаль
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Enhanced Group Stage Info */}
          <section className="w-full rounded-3xl bg-gray-800/80 backdrop-blur-sm shadow-md border border-gray-700/50 px-8 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Групп шат ({tournament.name})</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Дээрх групп удирдлага хэсгээс тоглогчдоо хуваарилна уу
                </p>
              </div>
              <div className="text-xs text-gray-400 space-x-4">
                <span>
                  Нийт групп: <span className="font-semibold text-white">{groupStageResults.length}</span>
                </span>
                <span>
                  Хуваарилсан тоглогч: <span className="font-semibold text-white">
                    {groupStageResults.reduce((sum, g) => sum + g.players.length, 0)}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
              <strong>Зөвлөмж:</strong> Дээрх "Хэсэгийн шатны тоглолт" хэсэгт очиж группүүдээ үүсгэж, 
              тоглогчдоо бүртгэлтэй жагсаалтаас сонгон хуваарилна уу. Тэмцээний үр дүн шууд уг хэсэгт оруулна.
            </div>
          </section>
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