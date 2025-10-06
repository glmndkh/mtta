import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Play, Zap, Users, Upload, Plus, Trash2, Search, Check, TableIcon, Calendar, Clock, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TournamentManagement() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save match mutation
  const saveMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      const response = await fetch(`/api/leagues/${id}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        throw new Error('Failed to save match');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Тоглолтын дүн амжилттай хадгалагдлаа" });
      // Reset form
      setMatches([]);
      setTeam1Score(0);
      setTeam2Score(0);
      setMatchDate('');
      setMatchTime('');
      setActiveSection(null);
    },
    onError: () => {
      toast({ 
        description: "Тоглолтын дүн хадгалахад алдаа гарлаа",
        variant: "destructive"
      });
    },
  });

  // Save match handler
  const handleSaveMatch = () => {
    if (!selectedTeam1 || !selectedTeam2) {
      toast({ 
        description: "Багуудыг сонгоно уу",
        variant: "destructive"
      });
      return;
    }

    if (matches.length === 0) {
      toast({ 
        description: "Тоглолт нэмнэ үү",
        variant: "destructive"
      });
      return;
    }

    // Prepare match data for API
    const matchData = {
      team1Id: selectedTeam1.id,
      team2Id: selectedTeam2.id,
      team1Score,
      team2Score,
      matchDate: matchDate || null,
      matchTime: matchTime || null,
      playerMatches: matches.map(match => ({
        player1Id: (match.player1 as any).playerId || null,
        player2Id: (match.player2 as any).playerId || null,
        player1Name: match.player1.name,
        player2Name: match.player2.name,
        sets: match.player1.sets.map((score, index) => ({
          player1: score,
          player2: match.player2.sets[index] || 0
        }))
      }))
    };

    saveMatchMutation.mutate(matchData);
  };

  const [teams, setTeams] = useState<Array<{
    id: number;
    name: string;
    logo: File | null;
    players: Array<{id: number, name: string, playerId?: string}>;
  }>>([
    {
      id: 1,
      name: "",
      logo: null,
      players: [
        { id: 1, name: "", playerId: undefined },
        { id: 2, name: "", playerId: undefined },
        { id: 3, name: "", playerId: undefined },
        { id: 4, name: "", playerId: undefined }
      ]
    }
  ]);
  const [searchOpen, setSearchOpen] = useState<{[key: string]: boolean}>({});
  const [groupMatchType, setGroupMatchType] = useState<'team' | 'individual' | null>(null);
  // Separate group data for team and individual matches
  const [teamGroups, setTeamGroups] = useState<Array<{
    id: number;
    name: string;
    players: Array<{
      id: number;
      name: string;
      club: string;
      matches: { [key: string]: string };
      wins: number;
      losses: number;
      rank: number | string;
    }>;
  }>>([
    {
      id: 1,
      name: "Групп A",
      players: [
        { id: 1, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 1 },
        { id: 2, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 2 },
        { id: 3, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 3 },
        { id: 4, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 4 }
      ]
    }
  ]);

  const [individualGroups, setIndividualGroups] = useState<Array<{
    id: number;
    name: string;
    players: Array<{
      id: number;
      name: string;
      club: string;
      matches: { [key: string]: string };
      wins: number;
      losses: number;
      rank: number | string;
    }>;
  }>>([
    {
      id: 1,
      name: "Групп A",
      players: [
        { id: 1, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 1 },
        { id: 2, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 2 },
        { id: 3, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 3 },
        { id: 4, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 4 }
      ]
    }
  ]);
  const [activeGroupId, setActiveGroupId] = useState<number>(1);
  const [selectedTeam1, setSelectedTeam1] = useState<any>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<any>(null);
  const [matches, setMatches] = useState<Array<{
    id: number;
    player1: { id: number; name: string; teamId: 1; sets: number[]; setsWon: number; };
    player2: { id: number; name: string; teamId: 2; sets: number[]; setsWon: number; };
    numberOfSets: number;
  }>>([]);
  const [editingScore, setEditingScore] = useState<{matchId: number, playerId: number, setIndex: number} | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [showMatchDetails, setShowMatchDetails] = useState<boolean>(false);
  const [matchDate, setMatchDate] = useState<string>('');
  const [matchTime, setMatchTime] = useState<string>('');

  // Get current group data based on match type
  const groups = groupMatchType === 'team' ? teamGroups : individualGroups;
  const setGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;
  const groupData = groups.find(g => g.id === activeGroupId)?.players || [];

  const handleBackToAdmin = () => {
    setLocation("/admin/dashboard");
  };

  // Fetch all users for team creation
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeSection === 'add-team'
  });

  // Fetch tournament participants for group matches
  const { data: tournamentParticipants = [] } = useQuery({
    queryKey: ['/api/tournaments', id, 'participants'],
    enabled: activeSection === 'add-group-match'
  });

  // Load existing tournament teams
  const { data: existingTeams = [] } = useQuery({
    queryKey: ['/api/tournaments', id, 'teams'],
    enabled: !!id
  });

  // Type guard for existingTeams
  const validExistingTeams = Array.isArray(existingTeams) ? existingTeams : [];

  // Function to add a new match
  const addNewMatch = () => {
    const newMatchId = matches.length + 1;
    const defaultSets = 3;

    setMatches([...matches, {
      id: newMatchId,
      player1: {
        id: newMatchId * 2 - 1,
        name: "",
        teamId: 1,
        sets: Array(defaultSets).fill(0),
        setsWon: 0
      },
      player2: {
        id: newMatchId * 2,
        name: "",
        teamId: 2,
        sets: Array(defaultSets).fill(0),
        setsWon: 0
      },
      numberOfSets: defaultSets
    }]);
  };

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: { name: string; logoUrl?: string }) => {
      const response = await fetch(`/api/tournaments/${id}/teams`, {
        method: 'POST',
        body: JSON.stringify(teamData),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', id, 'teams'] });
      toast({ title: "Баг амжилттай үүсгэгдлээ", variant: "default" });
    },
    onError: () => {
      toast({ title: "Баг үүсгэхэд алдаа гарлаа", variant: "destructive" });
    }
  });

  // Add player to team mutation
  const addPlayerToTeamMutation = useMutation({
    mutationFn: async ({ teamId, playerId, playerName }: { teamId: string; playerId: string; playerName: string }) => {
      const response = await fetch(`/api/tournament-teams/${teamId}/players`, {
        method: 'POST',
        body: JSON.stringify({ playerId, playerName }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to add player');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', id, 'teams'] });
    }
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/tournament-teams/${teamId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', id, 'teams'] });
      toast({ title: "Баг амжилттай устгагдлаа", variant: "default" });
    }
  });

  const handleAddTeam = () => {
    const newTeamId = Math.max(...teams.map(t => t.id)) + 1;
    setTeams([...teams, {
      id: newTeamId,
      name: "",
      logo: null,
      players: [
        { id: 1, name: "", playerId: undefined },
        { id: 2, name: "", playerId: undefined },
        { id: 3, name: "", playerId: undefined },
        { id: 4, name: "", playerId: undefined }
      ]
    }]);
  };

  const handleRemoveTeam = (teamId: number) => {
    if (teams.length > 1) {
      setTeams(teams.filter(t => t.id !== teamId));
    }
  };

  const handleAddPlayer = (teamId: number) => {
    setTeams(teams.map(team => {
      if (team.id === teamId) {
        const newPlayerId = Math.max(...team.players.map(p => p.id)) + 1;
        return {
          ...team,
          players: [...team.players, { id: newPlayerId, name: "", playerId: undefined }]
        };
      }
      return team;
    }));
  };

  const handleRemovePlayer = (teamId: number, playerId: number) => {
    setTeams(teams.map(team => {
      if (team.id === teamId && team.players.length > 1) {
        return {
          ...team,
          players: team.players.filter(p => p.id !== playerId)
        };
      }
      return team;
    }));
  };

  const handlePlayerNameChange = (teamId: number, playerId: number, name: string) => {
    setTeams(teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.map(p => 
            p.id === playerId ? { ...p, name, playerId: undefined } : p
          )
        };
      }
      return team;
    }));
  };

  const handleSelectPlayer = (teamId: number, playerId: number, user: any) => {
    // Create full name from firstName + lastName
    const fullName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : (user.firstName || user.lastName || user.email);

    setTeams(teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.map(p => 
            p.id === playerId ? { ...p, name: fullName, playerId: user.id } : p
          )
        };
      }
      return team;
    }));
    setSearchOpen({ ...searchOpen, [`${teamId}-${playerId}`]: false });
  };

  const getAvailableUsers = (currentPlayerId?: string) => {
    const selectedPlayerIds: string[] = [];
    teams.forEach(team => {
      team.players.forEach(player => {
        if (player.playerId && player.playerId !== currentPlayerId) {
          selectedPlayerIds.push(player.playerId);
        }
      });
    });

    return (allUsers as any[]).filter((user: any) => 
      !selectedPlayerIds.includes(user.id) && 
      // Show users with name or email if no name exists
      (user.name && user.name.trim()) || (user.email && user.email.trim())
    );
  };

  const handleLogoUpload = (teamId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, logo: file } : team
      ));
    }
  };

  const handleTeamNameChange = (teamId: number, name: string) => {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, name } : team
    ));
  };

  // Save team to database
  const handleSaveTeam = async (team: any) => {
    if (!team.name.trim()) {
      toast({ title: "Багийн нэр оруулна уу", variant: "destructive" });
      return;
    }

    try {
      // Create the team
      const createdTeam = await createTeamMutation.mutateAsync({
        name: team.name,
        logoUrl: undefined // Will implement file upload later
      });

      // Add players to the team
      for (const player of team.players) {
        if (player.playerId && player.name) {
          await addPlayerToTeamMutation.mutateAsync({
            teamId: createdTeam.id,
            playerId: player.playerId,
            playerName: player.name
          });
        }
      }

      toast({ title: "Баг амжилттай хадгалагдлаа", variant: "default" });
    } catch (error) {
      console.error('Error saving team:', error);
      toast({ title: "Баг хадгалахад алдаа гарлаа", variant: "destructive" });
    }
  };

  const handleSaveTeams = () => {
    // TODO: Implement teams saving logic
    const teamsToSave = teams.map(team => ({
      name: team.name,
      logo: team.logo,
      players: team.players.filter(p => p.name && p.name.trim() !== "")
    })).filter(team => team.name.trim() !== "" && team.players.length > 0);

    console.log("Saving teams:", teamsToSave);
  };

  const handleAddGroup = () => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;

    const newGroupId = Math.max(...currentGroups.map(g => g.id)) + 1;
    const groupLetter = String.fromCharCode(65 + currentGroups.length); // A, B, C, etc.
    const newGroup = {
      id: newGroupId,
      name: `Групп ${groupLetter}`,
      players: [
        { id: 1, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 1 },
        { id: 2, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 2 },
        { id: 3, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 3 },
        { id: 4, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 4 }
      ]
    };
    setCurrentGroups([...currentGroups, newGroup]);
    setActiveGroupId(newGroupId);
    toast({ title: `${newGroup.name} амжилттай нэмэгдлээ`, variant: "default" });
  };

  const handleDeleteGroup = (groupId: number) => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;

    if (currentGroups.length <= 1) {
      toast({ title: "Хамгийн багадаа нэг групп байх ёстой", variant: "destructive" });
      return;
    }

    const groupToDelete = currentGroups.find(g => g.id === groupId);
    const updatedGroups = currentGroups.filter(g => g.id !== groupId);
    setCurrentGroups(updatedGroups);

    // If deleting active group, switch to first remaining group
    if (activeGroupId === groupId) {
      setActiveGroupId(updatedGroups[0].id);
    }

    toast({ title: `${groupToDelete?.name} устгагдлаа`, variant: "default" });
  };

  const handleRenameGroup = (groupId: number, newName: string) => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;

    const updatedGroups = currentGroups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    );
    setCurrentGroups(updatedGroups);
    toast({ title: "Группын нэр өөрчлөгдлөө", variant: "default" });
  };

  const handleAddGroupPlayer = () => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;
    const currentGroup = currentGroups.find(g => g.id === activeGroupId);

    if (!currentGroup) return;

    const newId = Math.max(...currentGroup.players.map(p => p.id)) + 1;
    const updatedGroups = currentGroups.map(group => 
      group.id === activeGroupId 
        ? {
            ...group,
            players: [...group.players, {
              id: newId,
              name: "",
              club: "",
              matches: {},
              wins: 0,
              losses: 0,
              rank: newId
            }]
          }
        : group
    );
    setCurrentGroups(updatedGroups);
  };

  const handleRemoveGroupPlayer = (id: number) => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;
    const currentGroup = currentGroups.find(g => g.id === activeGroupId);

    if (!currentGroup || currentGroup.players.length <= 1) return;

    const updatedGroups = currentGroups.map(group => 
      group.id === activeGroupId 
        ? { ...group, players: group.players.filter(p => p.id !== id) }
        : group
    );
    setCurrentGroups(updatedGroups);
  };

  const handleGroupPlayerChange = (id: number, field: string, value: string) => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;

    const updatedGroups = currentGroups.map(group => 
      group.id === activeGroupId 
        ? {
            ...group,
            players: group.players.map(p => 
              p.id === id ? { ...p, [field]: value } : p
            )
          }
        : group
    );
    setCurrentGroups(updatedGroups);
  };

  const handleMatchResultChange = (playerId: number, opponentId: number | string, result: string) => {
    const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
    const setCurrentGroups = groupMatchType === 'team' ? setTeamGroups : setIndividualGroups;

    const updatedGroups = currentGroups.map(group => 
      group.id === activeGroupId 
        ? {
            ...group,
            players: group.players.map(p => 
              p.id === playerId 
                ? { ...p, matches: { ...p.matches, [opponentId]: result } }
                : p
            )
          }
        : group
    );
    setCurrentGroups(updatedGroups);
  };



  const handleSaveGroupTable = async () => {
    try {
      const currentGroups = groupMatchType === 'team' ? teamGroups : individualGroups;
      const currentGroup = currentGroups.find(g => g.id === activeGroupId);

      if (!currentGroup) {
        toast({ 
          description: "Идэвхтэй групп олдсонгүй",
          variant: "destructive"
        });
        return;
      }

      const playersWithData = currentGroup.players.filter(player => player.name.trim());

      if (playersWithData.length === 0) {
        toast({ 
          description: "Тоглогчид нэмнэ үү",
          variant: "destructive"
        });
        return;
      }

      // Prepare group stage results data with proper structure
      const groupStageData = {
        tournamentId: id,
        groupStageResults: [{
          id: currentGroup.id.toString(),
          name: currentGroup.name,
          players: playersWithData.map(player => ({
            id: player.id.toString(),
            name: player.name,
            club: player.club || ''
          })),
          resultMatrix: playersWithData.map((player, i) => 
            playersWithData.map((opponent, j) => 
              i === j ? 'X' : (player.matches[opponent.id] || '')
            )
          ),
          playerStats: playersWithData.map((player) => ({
            playerId: player.id.toString(),
            wins: player.wins || 0,
            losses: player.losses || 0,
            points: (player.wins || 0) * 2,
            setsWon: 0,
            setsLost: 0
          }))
        }],
        isPublished: true
      };

      console.log('Saving group table data:', groupStageData);

      const response = await fetch('/api/admin/tournament-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(groupStageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save group table');
      }

      const result = await response.json();
      console.log("Group table saved successfully:", result);

      toast({ 
        description: `${currentGroup.name} амжилттай хадгалагдлаа`,
        variant: "default"
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', id, 'results'] });

    } catch (error: any) {
      console.error('Error saving group table:', error);
      toast({ 
        description: `Группын хүснэгт хадгалахад алдаа гарлаа: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const managementOptions = [
    {
      id: 'add-team',
      title: 'Баг нэмэх',
      description: 'Багийн нэр, лого оруулж, багийн тоглогчдыг бүртгэх',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      details: 'Багийн мэдээлэл, лого, тоглогчдын жагсаалт'
    },
    {
      id: 'add-group-match',
      title: 'Группын тэмцээн нэмэх',
      description: 'Группын шатны тэмцээний хүснэгт үүсгэх',
      icon: TableIcon,
      color: 'bg-green-500 hover:bg-green-600',
      details: 'Багийн болон хувь хүний группын тэмцээн'
    },
    {
      id: 'create-match',
      title: 'Тоглолт үүсгэх',
      description: 'Хоёр багийн хоорондох дэлгэрэнгүй тоглолтын мэдээлэл оруулах',
      icon: Zap,
      color: 'bg-orange-500 hover:bg-orange-600',
      details: 'Тоглолтын огноо, цаг, байршил, тоглогчид'
    },
    {
      id: 'create-playoff',
      title: 'Play-off буюу баг хуваах',
      description: 'Шөвгийн шатны тоглолтын хэлбэрийг үүсгэх',
      icon: Play,
      color: 'bg-purple-500 hover:bg-purple-600',
      details: 'Элиминацийн шатны бүтэц ба дүрэм'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToAdmin}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Админ самбар руу буцах
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Тэмцээний удирдлага</h1>
            <p className="text-gray-600">ID: {id}</p>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Удирдлагын цэс
        </Badge>
      </div>
      {/* Management Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {managementOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card 
              key={option.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200"
              onClick={() => setActiveSection(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${option.color} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-4">
                  {option.details}
                </div>
                <Button 
                  className={`w-full ${option.color} text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(option.id);
                  }}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {option.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Active Section Content */}
      {activeSection && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const option = managementOptions.find(opt => opt.id === activeSection);
                if (option) {
                  const IconComponent = option.icon;
                  return (
                    <>
                      <IconComponent className="w-5 h-5" />
                      {option.title}
                    </>
                  );
                }
                return null;
              })()}
            </CardTitle>
            <CardDescription>
              {managementOptions.find(opt => opt.id === activeSection)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSection === 'add-team' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Баг нэмэх</h3>
                      <p className="text-gray-600">
                        Энэ хэсэгт та олон баг үүсгэж, багийн нэр, лого оруулж, 
                        багийн тоглогчдыг бүртгэх боломжтой.
                      </p>
                    </div>
                    <Button 
                      onClick={handleAddTeam}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Шинэ баг нэмэх
                    </Button>
                  </div>

                  {/* Display existing saved teams */}
                  {validExistingTeams && validExistingTeams.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3">Хадгалагдсан багууд</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {validExistingTeams.map((team: any) => (
                          <Card key={team.id} className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{team.name}</h5>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTeamMutation.mutate(team.id)}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600">
                                Тоглогчид: {team.players?.length || 0} хүн
                              </p>
                              {team.players && Array.isArray(team.players) && team.players.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Тоглогчдын жагсаалт:</p>
                                  <div className="text-xs space-y-1">
                                    {team.players.map((player: any, index: number) => (
                                      <div key={player.id}>
                                        {index + 1}. {player.playerName}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teams List */}
                {teams.map((team, teamIndex) => (
                  <Card key={team.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Баг #{teamIndex + 1}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveTeam(team)}
                            disabled={createTeamMutation.isPending || !team.name.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {createTeamMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                          </Button>
                          {teams.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveTeam(team.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Team Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`teamName-${team.id}`}>Багийн нэр</Label>
                            <Input
                              id={`teamName-${team.id}`}
                              placeholder="Багийн нэрийг оруулна уу"
                              value={team.name}
                              onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`teamLogo-${team.id}`}>Багийн лого</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`teamLogo-${team.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(team.id, e)}
                                className="flex-1"
                              />
                              <Button variant="outline" size="icon">
                                <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                            {team.logo && (
                              <p className="text-sm text-green-600 mt-1">
                                Сонгосон файл: {team.logo.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Багийн мэдээлэл:</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            <li>• Багийн нэр: {team.name || "Оруулаагүй"}</li>
                            <li>• Лого: {team.logo ? "Оруулсан" : "Оруулаагүй"}</li>
                            <li>• Тоглогчдын тоо: {team.players.filter(p => p.name && p.name.trim()).length}</li>
                          </ul>
                        </div>
                      </div>

                      {/* Players Table */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium">Тоглогчдын жагсаалт</h4>
                          <Button 
                            onClick={() => handleAddPlayer(team.id)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Тоглогч нэмэх
                          </Button>
                        </div>

                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">№</TableHead>
                                <TableHead>Тоглогчийн нэр</TableHead>
                                <TableHead className="w-20">Үйлдэл</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {team.players.map((player, index) => (
                                <TableRow key={player.id}>
                                  <TableCell className="font-medium">{index + 1}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Тоглогчийн нэрийг оруулна уу"
                                        value={player.name}
                                        onChange={(e) => handlePlayerNameChange(team.id, player.id, e.target.value)}
                                        className="flex-1"
                                      />
                                      <Popover 
                                        open={searchOpen[`${team.id}-${player.id}`] || false} 
                                        onOpenChange={(open) => setSearchOpen({ ...searchOpen, [`${team.id}-${player.id}`]: open })}
                                      >
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" size="sm" className="px-2">
                                            <Search className="w-4 h-4" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                          <Command>
                                            <CommandInput placeholder="Хэрэглэгчдийн нэрээр хайх..." />
                                            <CommandList>
                                              <CommandEmpty>Хэрэглэгч олдсонгүй</CommandEmpty>
                                              <CommandGroup heading="Бүртгэлтэй хэрэглэгчид">
                                                {getAvailableUsers(player.playerId).map((user: any) => {
                                                  // Create full name from firstName + lastName
                                                  const fullName = user.firstName && user.lastName 
                                                    ? `${user.firstName} ${user.lastName}` 
                                                    : (user.firstName || user.lastName || user.email);

                                                  return (
                                                    <CommandItem
                                                      key={user.id}
                                                      value={`${fullName} ${user.email}`}
                                                      onSelect={() => handleSelectPlayer(team.id, player.id, user)}
                                                      className="flex items-center justify-between"
                                                    >
                                                      <div>
                                                        <div className="font-medium">{fullName}</div>
                                                        <div className="text-xs text-gray-500">
                                                          {user.email} • {user.role === 'admin' ? 'Админ' : user.role === 'score_recorder' ? 'Оноо бүртгэгч' : 'Хэрэглэгч'}
                                                        </div>
                                                      </div>
                                                      {player.playerId === user.id && (
                                                        <Check className="w-4 h-4" />
                                                      )}
                                                    </CommandItem>
                                                  );
                                                })}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    {player.playerId && (
                                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Бүртгэлтэй хэрэглэгч сонгосон
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemovePlayer(team.id, player.id)}
                                      disabled={team.players.length === 1}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Save All Teams Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveTeams}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={teams.filter(team => team.name.trim() && team.players.filter(p => p.name && p.name.trim()).length > 0).length === 0}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Бүх багийг хадгалах ({teams.filter(team => team.name.trim() && team.players.filter(p => p.name && p.name.trim()).length > 0).length})
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'add-group-match' && (
              <div className="space-y-6">
                {!groupMatchType ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Группын тэмцээний төрөл сонгоно уу</h3>
                      <p className="text-gray-600">
                        Та багийн группын тэмцээн эсвэл хувь хүний группын тэмцээн үүсгэх боломжтой.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-2 hover:border-blue-500 cursor-pointer transition-colors" 
                            onClick={() => {
                              setGroupMatchType('team');
                              // Reset active group to first team group
                              if (teamGroups.length > 0) {
                                setActiveGroupId(teamGroups[0].id);
                              }
                            }}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Багийн группын тэмцээн
                          </CardTitle>
                          <CardDescription>
                            Багуудын хоорондох группын шатны тэмцээний хүснэгт үүсгэх
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            • Багуудын нэрээр тэмцээн үүсгэх<br/>
                            • Багийн оноо тооцоолох<br/>
                            • Группын хүснэгт үүсгэх
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 hover:border-green-500 cursor-pointer transition-colors" 
                            onClick={() => {
                              setGroupMatchType('individual');
                              // Reset active group to first individual group
                              if (individualGroups.length > 0) {
                                setActiveGroupId(individualGroups[0].id);
                              }
                            }}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            Хувь хүний группын тэмцээн
                          </CardTitle>
                          <CardDescription>
                            Тоглогчдын хоорондох группын шатны тэмцээний хүснэгт үүсгэх
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            • Тоглогчдын нэрээр тэмцээн үүсгэх<br/>
                            • Хувь хүний оноо тооцоолох<br/>
                            • Хувь хүний группын хүснэгт үүсгэх
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {groupMatchType === 'team' ? (
                            <>
                              <Users className="w-5 h-5 text-blue-500" />
                              Багийн группын тэмцээн
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5 text-green-500" />
                              Хувь хүний группын тэмцээн
                            </>
                          )}
                        </h3>
                        <p className="text-gray-600">
                          {groupMatchType === 'team' 
                            ? 'Багуудын хоорондох группын шатны тэмцээний хүснэгт' 
                            : 'Тоглогчдын хоорондох группын шатны тэмцээний хүснэгт'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setGroupMatchType(null)}
                        >
                          Буцах
                        </Button>

                        <Button 
                          onClick={handleAddGroupPlayer}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {groupMatchType === 'team' ? 'Баг нэмэх' : 'Тоглогч нэмэх'}
                        </Button>
                      </div>
                    </div>

                    {/* Group Management */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Группууд:</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddGroup}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Групп нэмэх
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {groups.map(group => (
                          <div
                            key={group.id}
                            className={`flex items-center justify-between p-2 rounded border ${
                              activeGroupId === group.id ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Button
                                variant={activeGroupId === group.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveGroupId(group.id)}
                                className={activeGroupId === group.id ? "bg-blue-500 hover:bg-blue-600" : ""}
                              >
                                {group.name}
                              </Button>
                              <Input
                                value={group.name}
                                onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                                className="h-7 w-32 text-xs"
                                placeholder="Группын нэр"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">
                                {group.players.filter(p => p.name.trim()).length} тоглогч
                              </span>
                              {groups.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-yellow-100">
                            <TableHead className="w-16 bg-yellow-200">№</TableHead>
                            <TableHead className="bg-yellow-200">
                              {groupMatchType === 'team' ? 'Багын нэр' : 'Тамирчин'}
                            </TableHead>
                            {groupMatchType === 'individual' && (
                              <TableHead className="bg-yellow-200">Баг</TableHead>
                            )}
                            {groupData.map((_, index) => (
                              <TableHead key={index + 1} className="w-16 text-center bg-yellow-200">
                                {index + 1}
                              </TableHead>
                            ))}
                            <TableHead className="w-24 bg-yellow-200">Өгсөн</TableHead>
                            <TableHead className="w-16 bg-yellow-200">Байр</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupData.map((player, playerIndex) => {
                            return (
                              <TableRow key={player.id}>
                                <TableCell className="font-medium bg-yellow-50">{playerIndex + 1}</TableCell>
                                <TableCell className="bg-blue-50">
                                  <div className="flex items-center gap-2">
                                    <Popover 
                                      open={searchOpen[`group-${player.id}`] || false} 
                                      onOpenChange={(open) => setSearchOpen({ ...searchOpen, [`group-${player.id}`]: open })}
                                    >
                                      <PopoverTrigger asChild>
                                        <Input
                                          placeholder={groupMatchType === 'team' ? 'Багийн нэр' : 'Тамирчийн нэр'}
                                          value={player.name}
                                          onChange={(e) => {
                                            handleGroupPlayerChange(player.id, 'name', e.target.value);
                                            setSearchOpen({ ...searchOpen, [`group-${player.id}`]: true });
                                          }}
                                          onFocus={() => setSearchOpen({ ...searchOpen, [`group-${player.id}`]: true })}
                                          className="min-w-[120px] border-0 bg-transparent p-1 cursor-pointer"
                                        />
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-0" align="start">
                                        <Command>
                                          <CommandInput placeholder="Тоглогчийн нэр эсвэл имэйлээр хайх..." />
                                          <CommandList>
                                            <CommandEmpty>Хэрэглэгч олдсонгүй. Хайлт хийхийн тулд нэр бичнэ үү.</CommandEmpty>
                                            <CommandGroup heading={groupMatchType === 'team' ? "Лигийн багууд" : "Бүртгүүлсэн тамирчид"}>
                                              {groupMatchType === 'team' ? (
                                                // Show teams for team match type
                                                validExistingTeams && validExistingTeams.length > 0 ? validExistingTeams.map((team: any) => (
                                                  <CommandItem
                                                    key={team.id}
                                                    value={team.name}
                                                    onSelect={() => {
                                                      handleGroupPlayerChange(player.id, 'name', team.name);
                                                      setSearchOpen({ ...searchOpen, [`group-${player.id}`]: false });
                                                    }}
                                                    className="flex items-center justify-between"
                                                  >
                                                    <div>
                                                      <div className="font-medium">
                                                        {team.name}
                                                      </div>
                                                      <div className="text-xs text-gray-500">
                                                        {team.players?.length || 0} тоглогчтой
                                                      </div>
                                                    </div>
                                                  </CommandItem>
                                                )) : (
                                                  <CommandItem disabled>
                                                    <div className="text-center text-gray-500">
                                                      Энэ тэмцээнд баг нэмэгдээгүй байна. Эхлээд "Баг нэмэх" хэсгээс баг нэмнэ үү.
                                                    </div>
                                                  </CommandItem>
                                                )
                                              ) : (
                                                // Show only tournament participants for individual match type
                                                (() => {
                                                  if (!tournamentParticipants || tournamentParticipants.length === 0) {
                                                    return (
                                                      <CommandItem disabled>
                                                        <div className="text-center text-gray-500">
                                                          Энэ тэмцээнд бүртгүүлсэн тоглогч байхгүй байна.
                                                        </div>
                                                      </CommandItem>
                                                    );
                                                  }

                                                  return tournamentParticipants.map((participant: any, index: number) => {
                                                    const playerName = participant.playerName || 
                                                      `${participant.firstName || ''} ${participant.lastName || ''}`.trim() ||
                                                      participant.email ||
                                                      `Тоглогч ${participant.playerId}`;

                                                    return (
                                                      <CommandItem
                                                        key={`${participant.playerId}-${index}`}
                                                        value={`${playerName} ${participant.clubAffiliation || ''}`}
                                                        onSelect={() => {
                                                          handleGroupPlayerChange(player.id, 'name', playerName);
                                                          handleGroupPlayerChange(player.id, 'club', participant.clubAffiliation || '');
                                                          setSearchOpen({ ...searchOpen, [`group-${player.id}`]: false });
                                                        }}
                                                        className="flex items-center justify-between"
                                                      >
                                                        <div>
                                                          <div className="font-medium">
                                                            {playerName}
                                                          </div>
                                                          <div className="text-xs text-gray-500">
                                                            {participant.clubAffiliation || 'Клубгүй'} • {participant.participationType || 'Тэмцээний оролцогч'}
                                                          </div>
                                                        </div>
                                                      </CommandItem>
                                                    );
                                                  });
                                                })()
                                              )}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveGroupPlayer(player.id)}
                                      disabled={groupData.length === 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                                {groupMatchType === 'individual' && (
                                  <TableCell>
                                    <Input
                                      placeholder="Баг"
                                      value={player.club}
                                      onChange={(e) => handleGroupPlayerChange(player.id, 'club', e.target.value)}
                                      className="min-w-[100px] border-0 bg-transparent p-1"
                                    />
                                  </TableCell>
                                )}

                                {groupData.map((opponent, opponentIndex) => (
                                  <TableCell key={opponent.id} className="text-center">
                                    {player.id === opponent.id ? (
                                      <div className="w-12 h-8 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                                        ****
                                      </div>
                                    ) : (
                                      <Input
                                        placeholder="3"
                                        value={player.matches[opponent.id] || ""}
                                        onChange={(e) => handleMatchResultChange(player.id, opponent.id, e.target.value)}
                                        className="w-12 h-8 text-center p-1 border border-gray-300 rounded"
                                      />
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="text-center">
                                  <Input
                                    placeholder="0/0"
                                    value={player.matches['total'] || ""}
                                    onChange={(e) => handleMatchResultChange(player.id, 'total', e.target.value)}
                                    className="w-16 h-8 text-center p-1 border border-gray-300 rounded"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  <Input
                                    placeholder="1"
                                    value={player.rank || playerIndex + 1}
                                    onChange={(e) => handleGroupPlayerChange(player.id, 'rank', e.target.value)}
                                    className="w-12 h-8 text-center p-1 border border-gray-300 rounded"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Group Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Группын мэдээлэл:</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Төрөл: {groupMatchType === 'team' ? 'Багийн группын тэмцээн' : 'Хувь хүний группын тэмцээн'}</li>
                        <li>• {groupMatchType === 'team' ? 'Багуудын' : 'Тоглогчдын'} тоо: {groupData.length}</li>
                        <li>• Бүрэн бөглөсөн: {groupData.filter(p => p.name.trim()).length}</li>
                        <li>• Тоглолт бүхий: {groupData.filter(p => Object.keys(p.matches).length > 0).length}</li>
                      </ul>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveGroupTable}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={groupData.filter(p => p.name.trim()).length === 0}
                      >
                        <TableIcon className="w-4 h-4 mr-2" />
                        Группын хүснэгт хадгалах ({groupData.filter(p => p.name.trim()).length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'create-match' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Багийн тоглолт</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection(null)}
                  >
                    Буцах
                  </Button>
                </div>

                {/* Team Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Нэгдүгээр баг</h4>
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {selectedTeam1 ? selectedTeam1.name : "Баг сонгох"}
                            <Search className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput placeholder="Багийн нэрээр хайх..." />
                            <CommandList>
                              <CommandEmpty>Баг олдсонгүй.</CommandEmpty>
                              <CommandGroup heading="Бүртгэлтэй багууд">
                                {validExistingTeams.map((team: any) => (
                                  <CommandItem
                                    key={team.id}
                                    value={team.name}
                                    onSelect={() => {
                                      setSelectedTeam1(team);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedTeam1?.id === team.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {team.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Хоёрдугаар баг</h4>
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {selectedTeam2 ? selectedTeam2.name : "Баг сонгох"}
                            <Search className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                          <Command>
                            <CommandInput placeholder="Багийн нэрээр хайх..." />
                            <CommandList>
                              <CommandEmpty>Баг олдсонгүй.</CommandEmpty>
                              <CommandGroup heading="Бүртгэлтэй багууд">
                                {validExistingTeams.filter((team: any) => team.id !== selectedTeam1?.id).map((team: any) => (
                                  <CommandItem
                                    key={team.id}
                                    value={team.name}
                                    onSelect={() => {
                                      setSelectedTeam2(team);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedTeam2?.id === team.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {team.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Match Overview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600">
                        {selectedTeam1?.logoUrl ? (
                          <img src={selectedTeam1.logoUrl} alt={selectedTeam1.name} className="w-full h-full rounded object-cover" />
                        ) : (
                          selectedTeam1?.name?.charAt(0) || 'A'
                        )}
                      </div>
                      <span className="font-medium">
                        {selectedTeam1 ? selectedTeam1.name : 'Багийн нэр'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="0"
                        className="w-16 h-10 text-center text-xl font-bold"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                      />
                      <span className="text-2xl font-bold">:</span>
                      <Input 
                        type="number"
                        min="0"
                        className="w-16 h-10 text-center text-xl font-bold"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {selectedTeam2 ? selectedTeam2.name : 'Багийн нэр'}
                      </span>
                      <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600">
                        {selectedTeam2?.logoUrl ? (
                          <img src={selectedTeam2.logoUrl} alt={selectedTeam2.name} className="w-full h-full rounded object-cover" />
                        ) : (
                          selectedTeam2?.name?.charAt(0) || 'B'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowMatchDetails(!showMatchDetails)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {showMatchDetails ? 'Хувь тоглолт' : 'Дэлгэрэнгүй харах'}
                    </Button>
                  </div>
                </div>

                {/* Individual Match Results Tables */}
                {showMatchDetails && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Тоглолтын дэлгэрэнгүй дүн</h4>
                      <Button 
                        onClick={addNewMatch}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Тоглолт нэмэх
                      </Button>
                    </div>
                    {matches.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Тоглолт нэмээгүй байна</p>
                        <p className="text-sm">Дээрх "Тоглолт нэмэх" товчийг дарж эхний тоглолтыг нэмнэ үү</p>
                      </div>
                    ) : (
                      matches.map((match, matchIndex) => (
                        <div key={match.id} className="border rounded-lg overflow-hidden mb-4">
                          <div className="bg-gray-100 px-4 py-2 border-b">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium">Тоглолт {match.id}</h5>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-green-600"
                                  onClick={() => {
                                    if (match.numberOfSets < 7) {
                                      const updatedMatches = matches.map(m => 
                                        m.id === match.id 
                                          ? {
                                              ...m,
                                              numberOfSets: m.numberOfSets + 1,
                                              player1: { ...m.player1, sets: [...m.player1.sets, 0] },
                                              player2: { ...m.player2, sets: [...m.player2.sets, 0] }
                                            }
                                          : m
                                      );
                                      setMatches(updatedMatches);
                                    }
                                  }}
                                  disabled={match.numberOfSets >= 7}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600"
                                  onClick={() => {
                                    if (match.numberOfSets > 1) {
                                      const updatedMatches = matches.map(m => 
                                        m.id === match.id 
                                          ? {
                                              ...m,
                                              numberOfSets: m.numberOfSets - 1,
                                              player1: { ...m.player1, sets: m.player1.sets.slice(0, -1), setsWon: m.player1.sets.slice(0, -1).filter(s => s >= 11).length },
                                              player2: { ...m.player2, sets: m.player2.sets.slice(0, -1), setsWon: m.player2.sets.slice(0, -1).filter(s => s >= 11).length }
                                            }
                                          : m
                                      );
                                      setMatches(updatedMatches);
                                    }
                                  }}
                                  disabled={match.numberOfSets <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600"
                                  onClick={() => {
                                    const updatedMatches = matches.filter(m => m.id !== match.id);
                                    setMatches(updatedMatches);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="w-20">Багийн лого</TableHead>
                                <TableHead>Тамирчины нэр</TableHead>
                                {Array.from({ length: match.numberOfSets }, (_, i) => (
                                  <TableHead key={i} className="w-16 text-center">{i + 1}</TableHead>
                                ))}
                                <TableHead className="w-20 text-center">Ялсан сет</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[match.player1, match.player2].map((player, playerIndex) => (
                                <TableRow key={`${match.id}-${player.id}`}>
                                  <TableCell>
                                    <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs overflow-hidden">
                                      {(() => {
                                        const team = player.teamId === 1 ? selectedTeam1 : selectedTeam2;
                                        if (team?.logoUrl) {
                                          return <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />;
                                        }
                                        return (
                                          <span className="font-semibold text-gray-700">
                                            {team?.name?.charAt(0)?.toUpperCase() || (player.teamId === 1 ? 'A' : 'B')}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start h-8 p-1 font-normal"
                                        >
                                          {player.name || "Тамирчины нэр"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-0">
                                        <Command>
                                          <CommandInput placeholder="Тоглогч хайх..." />
                                          <CommandList>
                                            <CommandEmpty>Тоглогч олдсонгүй.</CommandEmpty>
                                            <CommandGroup heading={`${player.teamId === 1 ? selectedTeam1?.name || 'Баг 1' : selectedTeam2?.name || 'Баг 2'} тоглогчид`}>
                                              {(() => {
                                                const selectedTeam = player.teamId === 1 ? selectedTeam1 : selectedTeam2;
                                                const teamData = validExistingTeams.find(team => team.id === selectedTeam?.id);

                                                if (!teamData?.players || teamData.players.length === 0) {
                                                  return (
                                                    <CommandItem disabled>
                                                      Тус багт тоглогч байхгүй
                                                    </CommandItem>
                                                  );
                                                }

                                                return teamData.players.map((teamPlayer: any) => {
                                                  // Use playerName directly since firstName/lastName join might not be working
                                                  const playerName = teamPlayer.playerName || 
                                                    (teamPlayer.firstName && teamPlayer.lastName 
                                                      ? `${teamPlayer.firstName} ${teamPlayer.lastName}`
                                                      : `Тоглогч ${teamPlayer.playerId}`);

                                                  return (
                                                    <CommandItem
                                                      key={teamPlayer.id}
                                                      value={playerName}
                                                      onSelect={() => {
                                                        const updatedMatches = matches.map(m => 
                                                          m.id === match.id 
                                                            ? {
                                                                ...m,
                                                                [player.teamId === 1 ? 'player1' : 'player2']: {
                                                                  ...player,
                                                                  name: playerName
                                                                }
                                                              }
                                                            : m
                                                        );
                                                        setMatches(updatedMatches);
                                                      }}
                                                    >
                                                      <Check
                                                        className={`mr-2 h-4 w-4 ${
                                                          player.name === playerName ? "opacity-100" : "opacity-0"
                                                        }`}
                                                      />
                                                      {playerName}
                                                    </CommandItem>
                                                  );
                                                });
                                              })()}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                  {Array.from({ length: match.numberOfSets }, (_, setIndex) => {
                                    const score = player.sets[setIndex] || 0;
                                    return (
                                      <TableCell key={setIndex} className="text-center">
                                        <Button
                                          variant="outline"
                                          className={`w-12 h-8 text-center p-1 text-xs ${
                                            score >= 11 ? 'bg-green-100 border-green-300' : 
                                            score > 0 ? 'bg-yellow-100 border-yellow-300' : 
                                            'bg-white border-gray-300'
                                          }`}
                                          onClick={() => {
                                            const newScore = prompt(`Set ${setIndex + 1} дүн оруулах:`, score.toString());
                                            if (newScore !== null && newScore !== '') {
                                              const scoreNumber = parseInt(newScore) >= 0 ? parseInt(newScore) : 0;
                                              const updatedMatches = matches.map(m => 
                                                m.id === match.id 
                                                  ? {
                                                      ...m,
                                                      [player.teamId === 1 ? 'player1' : 'player2']: {
                                                        ...player,
                                                        sets: player.sets.map((s, i) => i === setIndex ? scoreNumber : s),
                                                        setsWon: player.sets.map((s, i) => i === setIndex ? scoreNumber : s).filter(s => s >= 11).length
                                                      }
                                                    }
                                                  : m
                                              );
                                              setMatches(updatedMatches);
                                            }
                                          }}
                                        >
                                          {score === 0 ? "0" : score || ""}
                                        </Button>
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className="text-center font-bold">
                                    {player.setsWon}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Match Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Тоглолтын огноо</Label>
                    <Input 
                      type="date" 
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Тоглолтын цаг</Label>
                    <Input 
                      type="time" 
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveSection(null)}>
                    Цуцлах
                  </Button>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleSaveMatch}
                    disabled={saveMatchMutation.isPending}
                  >
                    {saveMatchMutation.isPending ? "Хадгалж байна..." : "Тоглолтын дүн хадгалах"}
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'create-playoff' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Play-off буюу баг хуваах</h3>
                <p className="text-gray-600">
                  Шөвгийн шатны элиминацийн тоглолтын бүтцийг үүсгэх.
                </p>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Play-off тохиргоо:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Шөвгийн шатанд орох багуудыг тодорхойлох</li>
                    <li>Элиминацийн бүтэц үүсгэх</li>
                    <li>Тоглолтын хуваарь гаргах</li>
                    <li>Финалын форматыг тохируулах</li>
                  </ul>
                </div>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                  Play-off үүсгэх
                </Button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setActiveSection(null)}
                className="mr-2"
              >
                Буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Тэмцээний төлөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Нийт багууд</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Хуваарийн тоглолт</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Гүйцэтгэсэн тоглолт</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">-</div>
              <div className="text-sm text-gray-600">Play-off төлөв</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}