import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Play, Zap, Users, Upload, Plus, Trash2, Search, Check, TableIcon, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TournamentManagement() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [groupData, setGroupData] = useState<Array<{
    id: number;
    name: string;
    club: string;
    matches: { [key: string]: string };
    wins: number;
    losses: number;
    rank: number | string;
  }>>([
    { id: 1, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 1 },
    { id: 2, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 2 },
    { id: 3, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 3 },
    { id: 4, name: "", club: "", matches: {}, wins: 0, losses: 0, rank: 4 }
  ]);

  const handleBackToAdmin = () => {
    setLocation("/admin/dashboard");
  };

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeSection === 'add-team' || activeSection === 'add-group-match'
  });

  // Load existing tournament teams
  const { data: existingTeams = [] } = useQuery({
    queryKey: ['/api/tournaments', id, 'teams'],
    enabled: !!id
  });

  // Type guard for existingTeams
  const validExistingTeams = Array.isArray(existingTeams) ? existingTeams : [];

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

  const handleAddGroupPlayer = () => {
    const newId = Math.max(...groupData.map(p => p.id)) + 1;
    const newPlayer = { 
      id: newId, 
      name: "", 
      club: "", 
      matches: {}, 
      wins: 0, 
      losses: 0, 
      rank: newId 
    };
    setGroupData([...groupData, newPlayer]);
  };

  const handleRemoveGroupPlayer = (id: number) => {
    if (groupData.length > 1) {
      setGroupData(groupData.filter(p => p.id !== id));
    }
  };

  const handleGroupPlayerChange = (id: number, field: string, value: string) => {
    setGroupData(groupData.map(player => 
      player.id === id ? { ...player, [field]: value } : player
    ));
  };

  const handleMatchResultChange = (playerId: number, opponentId: number | string, result: string) => {
    setGroupData(groupData.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          matches: { ...player.matches, [opponentId]: result }
        };
      }
      return player;
    }));
  };



  const handleSaveGroupTable = () => {
    // TODO: Implement group table saving logic
    const tableToSave = groupData.filter(player => player.name.trim());
    console.log("Saving group table:", { type: groupMatchType, players: tableToSave });
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
                                            <CommandInput placeholder="Хэрэглэгчийн нэрээр хайх..." />
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
                                                          {user.email} • {user.role === 'admin' ? 'Админ' : user.role === 'club_owner' ? 'Клубын эзэн' : 'Тоглогч'}
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
                            onClick={() => setGroupMatchType('team')}>
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
                            onClick={() => setGroupMatchType('individual')}>
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
                          variant="outline"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Групп нэмэх
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
                                            <CommandGroup heading="Бүртгэлтэй хэрэглэгчид">
                                              {allUsers && Array.isArray(allUsers) && allUsers.length > 0 ? allUsers.map((user: any) => {
                                                // Create full name from firstName + lastName
                                                const fullName = user.firstName && user.lastName 
                                                  ? `${user.firstName} ${user.lastName}` 
                                                  : (user.firstName || user.lastName || user.email);
                                                  
                                                return (
                                                  <CommandItem
                                                    key={user.id}
                                                    value={`${fullName} ${user.email}`}
                                                    onSelect={() => {
                                                      handleGroupPlayerChange(player.id, 'name', fullName);
                                                      setSearchOpen({ ...searchOpen, [`group-${player.id}`]: false });
                                                    }}
                                                    className="flex items-center justify-between"
                                                  >
                                                    <div>
                                                      <div className="font-medium">
                                                        {fullName}
                                                      </div>
                                                      <div className="text-xs text-gray-500">
                                                        {user.email} • {user.role === 'admin' ? 'Админ' : user.role === 'club_owner' ? 'Клубын эзэн' : 'Тоглогч'}
                                                      </div>
                                                    </div>
                                                  </CommandItem>
                                                );
                                              }) : (
                                                <CommandItem disabled>
                                                  Хэрэглэгчид ачаалж байна...
                                                </CommandItem>
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
                                      <div className="w-12 h-8 bg-gray-200 flex items-center justify-center text-gray-500">
                                        ****
                                      </div>
                                    ) : (
                                      <Input
                                        placeholder="3"
                                        value={player.matches[opponent.id] || ""}
                                        onChange={(e) => handleMatchResultChange(player.id, opponent.id, e.target.value)}
                                        className="w-12 h-8 text-center p-1 border border-gray-300"
                                      />
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="text-center">
                                  <Input
                                    placeholder="0/0"
                                    value={player.matches['total'] || ""}
                                    onChange={(e) => handleMatchResultChange(player.id, 'total', e.target.value)}
                                    className="w-16 h-8 text-center p-1 border border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  <Input
                                    placeholder="1"
                                    value={player.rank || playerIndex + 1}
                                    onChange={(e) => handleGroupPlayerChange(player.id, 'rank', e.target.value)}
                                    className="w-12 h-8 text-center p-1 border border-gray-300"
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Тоглолт үүсгэх</h3>
                <p className="text-gray-600">
                  Хоёр багийн хоорондох дэлгэрэнгүй тоглолтын мэдээлэл оруулах.
                </p>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Тоглолтын мэдээлэл:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Тоглох багууд сонгох</li>
                    <li>Тоглолтын огноо ба цаг</li>
                    <li>Байршил ба талбай</li>
                    <li>Шүүгчийн мэдээлэл</li>
                    <li>Дүрэм ба онооны систем</li>
                  </ul>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Тоглолт үүсгэх
                </Button>
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