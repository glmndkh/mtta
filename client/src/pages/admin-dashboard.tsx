import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Users, Shield, Building, Trophy, Calendar, Newspaper, Images, TrendingUp, Upload, Link as LinkIcon, ArrowLeft, Settings, UserPlus, Play, Zap, X, Crown, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminStatsDashboard from "@/components/admin-stats-dashboard";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("stats");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTeamEnrollmentDialogOpen, setIsTeamEnrollmentDialogOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [userFilter, setUserFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Data queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: selectedTab === 'users'
  });


  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ['/api/admin/clubs'],
    enabled: selectedTab === 'clubs'
  });

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/admin/tournaments'],
    enabled: selectedTab === 'tournaments'
  });

  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['/api/admin/leagues'],
    enabled: selectedTab === 'leagues'
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/admin/teams'],
    enabled: selectedTab === 'teams' || isTeamEnrollmentDialogOpen
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['/api/admin/branches'],
    enabled: selectedTab === 'branches'
  });

  const { data: federationMembers, isLoading: federationMembersLoading } = useQuery({
    queryKey: ['/api/admin/federation-members'],
    enabled: selectedTab === 'federation-members'
  });

  const { data: judges, isLoading: judgesLoading } = useQuery({
    queryKey: ['/api/admin/judges'],
    enabled: selectedTab === 'judges'
  });

  // Load all users for player selection dropdown
  const { data: allUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: (selectedTab === 'teams' || selectedTab === 'judges') && (isCreateDialogOpen || !!editingItem)
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/admin/news'],
    enabled: selectedTab === 'news' || selectedTab === 'sliders'
  });

  const { data: sliders, isLoading: slidersLoading } = useQuery({
    queryKey: ['/api/admin/sliders'],
    enabled: selectedTab === 'sliders'
  });

  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['/api/admin/sponsors'],
    enabled: selectedTab === 'sponsors'
  });

  const { data: champions, isLoading: championsLoading } = useQuery({
    queryKey: ['/api/admin/champions'],
    enabled: selectedTab === 'champions'
  });

  // Generic mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Амжилттай үүслээ" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${selectedTab}`] });
      setIsCreateDialogOpen(false);
      setFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Алдаа гарлаа", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Амжилттай шинэчлэгдлээ" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${selectedTab}`] });
      setEditingItem(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Алдаа гарлаа", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      return apiRequest(endpoint, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Амжилттай устгагдлаа" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${selectedTab}`] });
    },
    onError: (error: any) => {
      toast({ title: "Алдаа гарлаа", description: error.message, variant: "destructive" });
    }
  });

  const handleCreate = () => {
    createMutation.mutate({
      endpoint: `/api/admin/${selectedTab}`,
      data: formData
    });
  };

  const handleUpdate = () => {
    const endpoint = `/api/admin/${selectedTab}/${editingItem.id}`;

    updateMutation.mutate({
      endpoint,
      data: formData
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Устгахдаа итгэлтэй байна уу?")) {
      deleteMutation.mutate(`/api/admin/${selectedTab}/${id}`);
    }
  };

  const handleTournamentManagement = (tournamentId: string, action: string) => {
    if (action === 'manage-tournament') {
      // Navigate to tournament management page
      setLocation(`/admin/tournament/${tournamentId}/manage`);
      return;
    }
    if (action === 'manage-league') {
      // Navigate to league management page
      setLocation(`/admin/league/${tournamentId}/manage`);
      return;
    }
    if (action === 'results') {
      // Navigate to tournament results entry page
      setLocation(`/admin/tournament/${tournamentId}/results`);
      return;
    }
    
    switch(action) {
      case 'add-team':
        toast({
          title: "Баг нэмэх",
          description: `Тэмцээн ${tournamentId}-д баг нэмэх функц удахгүй нэмэгдэнэ`,
        });
        // TODO: Implement add team functionality
        break;
      case 'add-group-match':
        toast({
          title: "Бүлгийн тоглолт нэмэх",
          description: `Тэмцээн ${tournamentId}-д бүлгийн тоглолт нэмэх функц удахгүй нэмэгдэнэ`,
        });
        // TODO: Implement add group stage match functionality
        break;
      case 'create-match':
        toast({
          title: "Тоглолт үүсгэх",
          description: `Тэмцээн ${tournamentId}-д тоглолт үүсгэх функц удахгүй нэмэгдэнэ`,
        });
        // TODO: Implement create match functionality
        break;
      case 'create-playoff':
        toast({
          title: "Play-off буюу баг хуваах",
          description: `Тэмцээн ${tournamentId}-д Play-off буюу баг хуваах функц удахгүй нэмэгдэнэ`,
        });
        // TODO: Implement create playoff bracket functionality
        break;
      default:
        break;
    }
  };

  const openEditDialog = (item: any) => {
    if (selectedTab === 'tournaments') {
      setLocation(`/admin/generator?id=${item.id}`);
      return;
    }

    setEditingItem(item);

    // Format dates for HTML date inputs (YYYY-MM-DD format)
    const formattedItem = { ...item };
    if (item.startDate) {
      const startDate = new Date(item.startDate);
      if (!isNaN(startDate.getTime())) {
        formattedItem.startDate = startDate.toISOString().split('T')[0];
      }
    }
    if (item.endDate) {
      const endDate = new Date(item.endDate);
      if (!isNaN(endDate.getTime())) {
        formattedItem.endDate = endDate.toISOString().split('T')[0];
      }
    }
    if (item.registrationDeadline) {
      const regDeadline = new Date(item.registrationDeadline);
      if (!isNaN(regDeadline.getTime())) {
        formattedItem.registrationDeadline = regDeadline.toISOString().split('T')[0];
      }
    }
    if (item.dateOfBirth) {
      const dob = new Date(item.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        formattedItem.dateOfBirth = dob.toISOString().split('T')[0];
      }
    }

    // Extract player IDs for teams
    if (selectedTab === 'teams' && item.players && Array.isArray(item.players)) {
      formattedItem.playerIds = item.players.map((player: any) => player.playerId);
    }

    setFormData(formattedItem);
  };

  const openCreateDialog = () => {
    // Initialize with appropriate default values based on selected tab
    let defaultData = {};
    
    if (selectedTab === 'leagues') {
      // For leagues, provide sensible default dates
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      defaultData = {
        name: '',
        description: '',
        season: '',
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0]
      };
    }
    
    setFormData(defaultData);
    setIsCreateDialogOpen(true);
  };

  const openTeamEnrollmentDialog = (league: any) => {
    setSelectedLeague(league);
    setIsTeamEnrollmentDialogOpen(true);
  };

  const enrollTeamInLeague = async (teamId: string) => {
    if (!selectedLeague) return;
    
    try {
      const response = await fetch(`/api/admin/leagues/${selectedLeague.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });
      
      if (response.ok) {
        toast({ title: "Амжилттай", description: "Баг лигт нэмэгдлээ" });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/leagues'] });
        setIsTeamEnrollmentDialogOpen(false);
      } else {
        toast({ title: "Алдаа гарлаа", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Алдаа гарлаа", variant: "destructive" });
    }
  };

  const renderUsersTab = () => {
    const filteredUsers = users && Array.isArray(users) ? users.filter((user: any) => {
      const searchText = userFilter.toLowerCase();
      return !searchText || 
             user.firstName?.toLowerCase().includes(searchText) ||
             user.lastName?.toLowerCase().includes(searchText) ||
             user.email?.toLowerCase().includes(searchText) ||
             user.phone?.includes(searchText) ||
             user.role?.toLowerCase().includes(searchText);
    }) : [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Хэрэглэгчид</h2>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Хэрэглэгч хайх..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
        </div>
        
        {usersLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>И-мэйл</TableHead>
              <TableHead>Утас</TableHead>
              <TableHead>Хүйс</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.gender}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>
    );
  };


  const renderClubsTab = () => {
    const filteredClubs = clubs && Array.isArray(clubs) ? clubs.filter((club: any) => {
      const searchText = clubFilter.toLowerCase();
      return !searchText ||
             club.name?.toLowerCase().includes(searchText) ||
             club.description?.toLowerCase().includes(searchText) ||
             club.address?.toLowerCase().includes(searchText) ||
             club.phone?.includes(searchText) ||
             club.email?.toLowerCase().includes(searchText);
    }) : [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Клубууд</h2>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Клуб хайх..."
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Клуб нэмэх
          </Button>
        </div>
        
        {clubsLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Тайлбар</TableHead>
                <TableHead>Хаяг</TableHead>
                <TableHead>Холбоо барих</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClubs.map((club: any) => (
                <TableRow key={club.id}>
                  <TableCell>{club.name}</TableCell>
                  <TableCell>{club.description}</TableCell>
                  <TableCell>{club.address}</TableCell>
                  <TableCell>{club.phone} / {club.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(club)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(club.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderBranchesTab = () => {
    const filteredBranches = branches && Array.isArray(branches)
      ? branches.filter((branch: any) => {
          const searchText = branchFilter.toLowerCase();
          return (
            !searchText ||
            (branch.name || "").toLowerCase().includes(searchText) ||
            (branch.leader || "").toLowerCase().includes(searchText) ||
            (branch.location || "").toLowerCase().includes(searchText)
          );
        })
      : [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Салбар холбоод</h2>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Салбар холбоо хайх..."
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Салбар холбоо нэмэх
          </Button>
        </div>

        {branchesLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Дарга</TableHead>
                <TableHead>Байршил</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch: any) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.leader}</TableCell>
                  <TableCell>{branch.location}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(branch)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(branch.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderFederationMembersTab = () => {
    const filteredMembers = federationMembers && Array.isArray(federationMembers) ? federationMembers.filter((member: any) => {
      const searchText = memberFilter.toLowerCase();
      return !searchText ||
             member.name?.toLowerCase().includes(searchText) ||
             member.position?.toLowerCase().includes(searchText);
    }) : [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Холбооны гишүүд</h2>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Гишүүн хайх..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Гишүүн нэмэх
          </Button>
        </div>

        {federationMembersLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Албан тушаал</TableHead>
                <TableHead>Зураг</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.position}</TableCell>
                  <TableCell>
                    {member.imageUrl && (
                      <img src={member.imageUrl} alt={member.name} className="w-10 h-10 rounded-full" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(member)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderJudgesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Шүүгчид</h2>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Шүүгч нэмэх
          </Button>
        </div>

        {judgesLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Зураг</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges && Array.isArray(judges) && judges.map((judge: any) => (
                <TableRow key={judge.id}>
                  <TableCell>{judge.firstName} {judge.lastName}</TableCell>
                  <TableCell>{judge.judgeType === 'international' ? 'Олон улсын' : 'Дотоодын'}</TableCell>
                  <TableCell>
                    {judge.imageUrl && (
                      <img src={judge.imageUrl} alt={judge.firstName} className="w-10 h-10 rounded-full" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(judge.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderSlidersTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Нүүр хуудасны слайдер</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Слайдер нэмэх
        </Button>
      </div>
      
      {slidersLoading ? (
        <div>Ачааллаж байна...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Гарчиг</TableHead>
              <TableHead>Дэд гарчиг</TableHead>
              <TableHead>Идэвхтэй</TableHead>
              <TableHead>Эрэмбэ</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sliders && Array.isArray(sliders) ? sliders.map((slider: any) => (
              <TableRow key={slider.id}>
                <TableCell>{slider.title}</TableCell>
                <TableCell>{slider.subtitle}</TableCell>
                <TableCell>
                  <Badge variant={slider.isActive ? 'default' : 'secondary'}>
                    {slider.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Badge>
                </TableCell>
                <TableCell>{slider.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(slider)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(slider.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : null}
          </TableBody>
        </Table>
      )}
    </div>
  );

  const renderSponsorsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Ивээн тэтгэгчдийн удирдлага</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Ивээн тэтгэгч нэмэх
        </Button>
      </div>
      
      {sponsorsLoading ? (
        <div>Ачааллаж байна...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Лого</TableHead>
              <TableHead>Идэвхтэй</TableHead>
              <TableHead>Эрэмбэ</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors && Array.isArray(sponsors) ? sponsors.map((sponsor: any) => (
              <TableRow key={sponsor.id}>
                <TableCell>{sponsor.name}</TableCell>
                <TableCell>
                  {sponsor.logoUrl ? (
                    <img 
                      src={sponsor.logoUrl} 
                      alt={sponsor.name} 
                      className="w-12 h-12 object-contain rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={sponsor.isActive ? 'default' : 'secondary'}>
                    {sponsor.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Badge>
                </TableCell>
                <TableCell>{sponsor.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(sponsor)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(sponsor.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : null}
          </TableBody>
        </Table>
      )}
    </div>
  );

  const renderChampionsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Үе үеийн аваргууд</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Аварга нэмэх
        </Button>
      </div>

      {championsLoading ? (
        <div>Ачааллаж байна...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Он</TableHead>
              <TableHead>Зураг</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {champions && Array.isArray(champions) ? champions.map((champ: any) => (
              <TableRow key={champ.id}>
                <TableCell>{champ.name}</TableCell>
                <TableCell>{champ.year}</TableCell>
                <TableCell>
                  {champ.imageUrl ? (
                    <img
                      src={champ.imageUrl}
                      alt={champ.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(champ)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(champ.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : null}
          </TableBody>
        </Table>
      )}
    </div>
  );

  const renderFormFields = () => {
    switch (selectedTab) {
      case 'users':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Нэр</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Овог</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">И-мэйл</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="role">Роль</Label>
              <Select value={formData.role || ''} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Роль сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Хэрэглэгч</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      
      case 'clubs':
        return (
          <>
            <div>
              <Label htmlFor="name">Клубын нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="address">Хаяг</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Утас</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">И-мэйл</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </>
        );

      case 'branches':
        return (
          <>
            <div>
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leader">Дарга</Label>
              <Input
                id="leader"
                value={formData.leader || ''}
                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leadershipMembers">Удирдлагын гишүүд</Label>
              <Textarea
                id="leadershipMembers"
                value={formData.leadershipMembers || ''}
                onChange={(e) => setFormData({ ...formData, leadershipMembers: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Хаяг</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Байршил</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="activities">Үйл ажиллагаа</Label>
              <Textarea
                id="activities"
                value={formData.activities || ''}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Салбарын зураг
              </Label>
              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024}
                  onGetUploadParameters={async () => {
                    try {
                      const response = await apiRequest("/api/objects/upload", {
                        method: "POST",
                      });
                      const data = (await response.json()) as { uploadURL: string };
                      if (!data || !data.uploadURL) {
                        throw new Error("No upload URL received");
                      }
                      return {
                        method: "PUT" as const,
                        url: data.uploadURL,
                      };
                    } catch (error) {
                      console.error("Error getting upload parameters:", error);
                      toast({
                        title: "Алдаа",
                        description: "Файл хуулах URL авахад алдаа гарлаа",
                        variant: "destructive",
                      });
                      throw error;
                    }
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      try {
                        const aclResponse = await apiRequest("/api/objects/acl", {
                          method: "PUT",
                          body: JSON.stringify({ imageURL: uploadURL }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        });
                        const aclData = (await aclResponse.json()) as { objectPath: string };
                        setFormData({
                          ...formData,
                          imageUrl: aclData.objectPath,
                        });
                        toast({ title: "Зураг амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({
                          title: "Алдаа",
                          description: "Зураг хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  buttonClassName="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Зураг сонгох
                </ObjectUploader>
                {formData.imageUrl && (
                  <div className="text-sm text-green-600">
                    ✓ Зураг хуулагдлаа: {formData.imageUrl}
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'federation-members':
        return (
          <>
            <div>
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Албан тушаал</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Зураг оруулах
              </Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
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
                    const uploadedFileUrl = result.successful[0].uploadURL;

                    try {
                      const response = await fetch('/api/objects/finalize', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          fileURL: uploadedFileUrl,
                          isPublic: true
                        })
                      });
                      const data = await response.json();

                      setFormData({ ...formData, imageUrl: data.objectPath });
                      toast({
                        title: "Амжилттай",
                        description: "Зураг амжилттай хуулагдлаа"
                      });
                    } catch (error) {
                      console.error('Error setting image ACL:', error);
                      setFormData({ ...formData, imageUrl: uploadedFileUrl });
                      toast({
                        title: "Анхааруулга",
                        description: "Зураг хуулагдсан боловч зураг харагдахгүй байж магад"
                      });
                    }
                  }
                }}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Зураг файл сонгох</span>
                </div>
              </ObjectUploader>
              {formData.imageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Зураг хуулагдсан: {formData.imageUrl}</p>
                </div>
              )}
            </div>
          </>
        );

      case 'judges':
        return (
          <>
            <div>
              <Label htmlFor="userId">Хэрэглэгч</Label>
              <Select onValueChange={(userId) => {
                const user = allUsers?.find((u: any) => u.id === userId);
                setFormData({ ...formData, userId, firstName: user?.firstName, lastName: user?.lastName });
              }}>
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Хэрэглэгч сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="firstName">Нэр</Label>
              <Input
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Овог</Label>
              <Input
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Зураг URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="judgeType">Төрөл</Label>
              <Select value={formData.judgeType || ''} onValueChange={(v) => setFormData({ ...formData, judgeType: v })}>
                <SelectTrigger id="judgeType">
                  <SelectValue placeholder="Сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Дотоодын шүүгч</SelectItem>
                  <SelectItem value="international">Олон улсын шүүгч</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'leagues':
        return (
          <>
            <div>
              <Label htmlFor="name">Лигийн нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="season">Улирал</Label>
              <Input
                id="season"
                value={formData.season || ''}
                onChange={(e) => setFormData({...formData, season: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Эхлэх огноо</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Дуусах огноо</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
          </>
        );

      case 'news':
        return (
          <>
            <div>
              <Label htmlFor="title">Гарчиг</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="content">Агуулга</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Хураангуй</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Зураг оруулах
              </Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
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
                    const uploadedFileUrl = result.successful[0].uploadURL;
                    
                    // Update ACL policy and get normalized path
                    try {
                      const response = await fetch('/api/objects/finalize', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          fileURL: uploadedFileUrl,
                          isPublic: true
                        })
                      });
                      const data = await response.json();
                      
                      setFormData({...formData, imageUrl: data.objectPath});
                      toast({
                        title: "Амжилттай",
                        description: "Зураг амжилттай хуулагдлаа"
                      });
                    } catch (error) {
                      console.error('Error setting image ACL:', error);
                      setFormData({...formData, imageUrl: uploadedFileUrl});
                      toast({
                        title: "Анхааруулга",
                        description: "Зураг хуулагдсан боловч зураг харагдахгүй байж магад"
                      });
                    }
                  }
                }}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Зураг файл сонгох</span>
                </div>
              </ObjectUploader>
              {formData.imageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Зураг хуулагдсан: {formData.imageUrl}</p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="category">Категори</Label>
              <Select value={formData.category || ''} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Категори сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tournament">Тэмцээн</SelectItem>
                  <SelectItem value="news">Мэдээ</SelectItem>
                  <SelectItem value="training">Бэлтгэл</SelectItem>
                  <SelectItem value="urgent">Яаралтай</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published || false}
                onCheckedChange={(checked) => setFormData({...formData, published: checked})}
              />
              <Label htmlFor="published">Нийтлэх</Label>
            </div>
          </>
        );

      case 'teams':
        return (
          <>
            <div>
              <Label htmlFor="name">Багийн нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Эзний нэр</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="coachName">Дасгалжуулагчийн нэр</Label>
                <Input
                  id="coachName"
                  value={formData.coachName || ''}
                  onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ивээн тэтгэгчийн лого оруулах
              </Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
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
                    const uploadedFileUrl = result.successful[0].uploadURL;
                    
                    // Update ACL policy and get normalized path
                    try {
                      const response = await fetch('/api/sponsor-logos', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          sponsorLogoURL: uploadedFileUrl
                        })
                      });
                      const data = await response.json();
                      
                      setFormData({...formData, sponsorLogo: data.objectPath});
                      toast({
                        title: "Амжилттай",
                        description: "Лого амжилттай хуулагдлаа"
                      });
                    } catch (error) {
                      console.error('Error setting logo ACL:', error);
                      setFormData({...formData, sponsorLogo: uploadedFileUrl});
                      toast({
                        title: "Анхааруулга",
                        description: "Лого хуулагдсан боловч зураг харагдахгүй байж магад"
                      });
                    }
                  }
                }}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Лого файл сонгох</span>
                </div>
              </ObjectUploader>
              {formData.sponsorLogo && (
                <div className="mt-2">
                  <img 
                    src={formData.sponsorLogo} 
                    alt="Sponsor Logo" 
                    className="w-16 h-16 object-contain border rounded"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="playerIds">Тоглогчид сонгох</Label>
              <Select 
                value={formData.selectedPlayerId || ""} 
                onValueChange={(value) => {
                  if (value && !formData.playerIds?.includes(value)) {
                    setFormData({
                      ...formData,
                      selectedPlayerId: "",
                      playerIds: [...(formData.playerIds || []), value]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Тоглогч нэмэх" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers && Array.isArray(allUsers) && allUsers.filter((user: any) => user.role === 'player').map((player: any) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.playerIds && formData.playerIds.length > 0 && (
                <div className="mt-2 space-y-1">
                  <Label className="text-sm text-muted-foreground">Сонгосон тоглогчид:</Label>
                  {formData.playerIds.map((playerId: string) => {
                    const player = allUsers && Array.isArray(allUsers) ? allUsers.find((u: any) => u.id === playerId && u.role === 'player') : null;
                    return player ? (
                      <div key={playerId} className="flex items-center justify-between bg-secondary p-2 rounded">
                        <span className="text-sm">{player.firstName} {player.lastName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              playerIds: formData.playerIds.filter((id: string) => id !== playerId)
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </>
        );

      case 'sliders':
        return (
          <>
            <div>
              <Label htmlFor="title">Гарчиг</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Дэд гарчиг</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Слайдерын зураг
              </Label>
              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  onGetUploadParameters={async () => {
                    try {
                      console.log("Getting upload parameters...");
                      const response = await apiRequest("/api/objects/upload", {
                        method: "POST",
                      });
                      const data = await response.json() as { uploadURL: string };
                      console.log("Upload response:", data);
                      if (!data || !data.uploadURL) {
                        throw new Error("No upload URL received");
                      }
                      return {
                        method: "PUT" as const,
                        url: data.uploadURL,
                      };
                    } catch (error) {
                      console.error("Error getting upload parameters:", error);
                      toast({
                        title: "Алдаа",
                        description: "Файл хуулах URL авахад алдаа гарлаа",
                        variant: "destructive"
                      });
                      throw error;
                    }
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      
                      // Set ACL policy for the uploaded image
                      try {
                        const aclResponse = await apiRequest("/api/objects/acl", {
                          method: "PUT",
                          body: JSON.stringify({ imageURL: uploadURL }),
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        const aclData = await aclResponse.json() as { objectPath: string };
                        
                        // Update form with the normalized object path
                        setFormData({
                          ...formData, 
                          imageUrl: aclData.objectPath
                        });
                        
                        toast({ title: "Зураг амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({ 
                          title: "Алдаа", 
                          description: "Зураг хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Зураг сонгох
                </ObjectUploader>
                {formData.imageUrl && (
                  <div className="text-sm text-green-600">
                    ✓ Зураг хуулагдлаа: {formData.imageUrl}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Холбоос төрөл
              </Label>
              <Select 
                value={formData.linkType || 'custom'} 
                onValueChange={(value) => setFormData({...formData, linkType: value, linkUrl: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Холбоосын төрлийг сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">Мэдээ нийтлэлээс сонгох</SelectItem>
                  <SelectItem value="custom">Гараар холбоос оруулах</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.linkType === 'news' ? (
              <div>
                <Label htmlFor="selectedNews">Мэдээ нийтлэл сонгох</Label>
                <Select 
                  value={formData.selectedNewsId || ''} 
                  onValueChange={(value) => {
                    const selectedArticle = Array.isArray(news) ? news.find((article: any) => article.id === value) : null;
                    setFormData({
                      ...formData, 
                      selectedNewsId: value, 
                      linkUrl: `/news/${value}`,
                      buttonText: formData.buttonText || 'Дэлгэрэнгүй үзэх'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Мэдээ нийтлэл сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    {news && Array.isArray(news) ? news.filter((article: any) => article.published).map((article: any) => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.title}
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>Нийтлэгдсэн мэдээ байхгүй</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.selectedNewsId && (
                  <div className="text-sm text-gray-600 mt-1">
                    Холбоос: /news/{formData.selectedNewsId}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="linkUrl">Холбоосын URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl || ''}
                  onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                  placeholder="https://example.com эсвэл /page-name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="buttonText">Товчны текст</Label>
              <Input
                id="buttonText"
                value={formData.buttonText || ''}
                onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive || false}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Идэвхтэй</Label>
              </div>
              <div>
                <Label htmlFor="sortOrder">Эрэмбэ</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </>
        );

      case 'sponsors':
        return (
          <>
            <div>
              <Label htmlFor="name">Ивээн тэтгэгчийн нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ивээн тэтгэгчийн лого
              </Label>
              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  onGetUploadParameters={async () => {
                    try {
                      const response = await apiRequest("/api/objects/upload", {
                        method: "POST",
                      });
                      const data = await response.json() as { uploadURL: string };
                      if (!data || !data.uploadURL) {
                        throw new Error("No upload URL received");
                      }
                      return {
                        method: "PUT" as const,
                        url: data.uploadURL,
                      };
                    } catch (error) {
                      console.error("Error getting upload parameters:", error);
                      toast({
                        title: "Алдаа",
                        description: "Файл хуулах URL авахад алдаа гарлаа",
                        variant: "destructive"
                      });
                      throw error;
                    }
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      
                      // Set ACL policy for the uploaded logo
                      try {
                        const aclResponse = await apiRequest("/api/objects/acl", {
                          method: "PUT",
                          body: JSON.stringify({ imageURL: uploadURL }),
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        const aclData = await aclResponse.json() as { objectPath: string };
                        
                        // Update form with the normalized object path
                        setFormData({
                          ...formData, 
                          logoUrl: aclData.objectPath
                        });
                        
                        toast({ title: "Лого амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({ 
                          title: "Алдаа", 
                          description: "Лого хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Лого сонгох
                </ObjectUploader>
                {formData.logoUrl && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={formData.logoUrl} 
                      alt="Sponsor Logo" 
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div className="text-sm text-green-600">
                      ✓ Лого хуулагдлаа
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive || false}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Идэвхтэй</Label>
              </div>
              <div>
                <Label htmlFor="sortOrder">Эрэмбэ</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </>
        );

      case 'tournaments':
        return (
          <>
            <div>
              <Label htmlFor="name">Тэмцээний нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Эхлэх огноо</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Дуусах огноо</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Байршил</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Хамгийн их оролцогчид</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entryFee">Оролцооны төлбөр</Label>
                <Input
                  id="entryFee"
                  value={formData.entryFee || ''}
                  onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Төлөв</Label>
                <Select value={formData.status || ''} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Төлөв сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Бүртгэл</SelectItem>
                    <SelectItem value="ongoing">Явагдаж байгаа</SelectItem>
                    <SelectItem value="completed">Дууссан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished || false}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Нийтлэгдсэн</Label>
            </div>
          </>
        );

      case 'champions':
        return (
          <>
            <div>
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="year">Он</Label>
              <Input
                id="year"
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Зураг
              </Label>
              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024}
                  onGetUploadParameters={async () => {
                    try {
                      const response = await apiRequest("/api/objects/upload", { method: "POST" });
                      const data = await response.json() as { uploadURL: string };
                      if (!data || !data.uploadURL) {
                        throw new Error("No upload URL received");
                      }
                      return { method: 'PUT' as const, url: data.uploadURL };
                    } catch (error) {
                      console.error("Error getting upload parameters:", error);
                      toast({
                        title: "Алдаа",
                        description: "Файл хуулах URL авахад алдаа гарлаа",
                        variant: "destructive",
                      });
                      throw error;
                    }
                  }}
                  onComplete={async (result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      try {
                        const aclResponse = await apiRequest("/api/objects/acl", {
                          method: "PUT",
                          body: JSON.stringify({ imageURL: uploadURL }),
                          headers: { 'Content-Type': 'application/json' },
                        });
                        const aclData = await aclResponse.json() as { objectPath: string };
                        setFormData({ ...formData, imageUrl: aclData.objectPath });
                        toast({ title: "Зураг амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({
                          title: "Алдаа",
                          description: "Зураг хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Зураг сонгох
                </ObjectUploader>
                {formData.imageUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.imageUrl}
                      alt="Champion"
                      className="w-16 h-16 object-cover border rounded"
                    />
                    <div className="text-sm text-green-600">✓ Зураг хуулагдлаа</div>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      default:
        return <div>Форм боломжгүй</div>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Админ удирдлагын самбар</h1>
            <p className="text-gray-600">Системийн бүх мэдээллийг энд удирдана уу</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Нүүр хуудас руу буцах
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex flex-wrap gap-2 h-auto items-start w-full">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Статистик
          </TabsTrigger>
          <div className="w-full font-semibold mt-2">Холбоо</div>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Салбар холбоод
          </TabsTrigger>
          <TabsTrigger value="federation-members" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Холбооны гишүүд
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Шүүгчид
          </TabsTrigger>
          <TabsTrigger value="champions" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Аваргууд
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Клубууд
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Хэрэглэгчид
          </TabsTrigger>
          <div className="w-full font-semibold mt-2">Тэмцээн</div>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Тэмцээн
          </TabsTrigger>
          <TabsTrigger value="leagues" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Лиг
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Багууд
          </TabsTrigger>
          <div className="w-full font-semibold mt-2">Мэдээ</div>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Мэдээ
          </TabsTrigger>
          <TabsTrigger value="sliders" className="flex items-center gap-2">
            <Images className="w-4 h-4" />
            Слайдер
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Ивээн тэтгэгчид
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Хэрэглэгчдийн удирдлага</CardTitle>
              <CardDescription>Бүх хэрэглэгчдийн мэдээллийг энд харах боломжтой</CardDescription>
            </CardHeader>
            <CardContent>
              {renderUsersTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs">
          <Card>
            <CardHeader>
              <CardTitle>Клубуудын удирдлага</CardTitle>
              <CardDescription>Клубуудын мэдээлэл нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderClubsTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sliders">
          <Card>
            <CardHeader>
              <CardTitle>Нүүр хуудасны слайдер</CardTitle>
              <CardDescription>Нүүр хуудасны слайдер зургууд удирдах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderSlidersTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors">
          <Card>
            <CardHeader>
              <CardTitle>Ивээн тэтгэгчдийн удирдлага</CardTitle>
              <CardDescription>Ивээн тэтгэгчдийн логог болон мэдээллийг удирдах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderSponsorsTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="champions">
          <Card>
            <CardHeader>
              <CardTitle>Үе үеийн аваргууд</CardTitle>
              <CardDescription>Аваргуудын жагсаалтыг удирдах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderChampionsTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Тэмцээнүүдийн удирдлага</CardTitle>
              <CardDescription>Бүх тэмцээнүүдийг энд харах болон удирдах боломжтой</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">Тэмцээнүүд</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open('/admin/generator', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Шинэ тэмцээн үүсгэх
                    </Button>
                    <Button
                      onClick={() => window.open('/admin/tournaments', '_blank')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Тэмцээн удирдах
                    </Button>
                    <Button
                      onClick={() => window.open('/admin/tournament-results', '_blank')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Үр дүн оруулах
                    </Button>
                  </div>
                </div>
                
                {tournamentsLoading ? (
                  <div>Ачааллаж байна...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Нэр</TableHead>
                        <TableHead>Эхлэх огноо</TableHead>
                        <TableHead>Дуусах огноо</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Нийтлэгдсэн</TableHead>
                        <TableHead>Үйлдэл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tournaments && Array.isArray(tournaments) ? tournaments.map((tournament: any) => (
                        <TableRow key={tournament.id}>
                          <TableCell>{tournament.name}</TableCell>
                          <TableCell>{new Date(tournament.startDate).toLocaleDateString('mn-MN')}</TableCell>
                          <TableCell>{new Date(tournament.endDate).toLocaleDateString('mn-MN')}</TableCell>
                          <TableCell>
                            <Badge variant={tournament.status === 'completed' ? 'default' : 'secondary'}>
                              {tournament.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tournament.isPublished ? 'default' : 'secondary'}>
                              {tournament.isPublished ? 'Нийтлэгдсэн' : 'Ноорог'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(tournament)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(tournament.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    <Settings className="w-4 h-4 mr-1" />
                                    Удирдах
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleTournamentManagement(tournament.id, 'results')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Үр дүн оруулах
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTournamentManagement(tournament.id, 'manage-tournament')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Удирдлагын самбар нээх
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leagues">
          <Card>
            <CardHeader>
              <CardTitle>Лигийн удирдлага</CardTitle>
              <CardDescription>Лигүүдийг нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">Лигүүд</h2>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Лиг нэмэх
                  </Button>
                </div>
                
                {leaguesLoading ? (
                  <div>Ачааллаж байна...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Нэр</TableHead>
                        <TableHead>Улирал</TableHead>
                        <TableHead>Эхлэх огноо</TableHead>
                        <TableHead>Дуусах огноо</TableHead>
                        <TableHead>Багууд</TableHead>
                        <TableHead>Үйлдэл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leagues && Array.isArray(leagues) ? leagues.map((league: any) => (
                        <TableRow key={league.id}>
                          <TableCell>{league.name}</TableCell>
                          <TableCell>{league.season}</TableCell>
                          <TableCell>{new Date(league.startDate).toLocaleDateString('mn-MN')}</TableCell>
                          <TableCell>{new Date(league.endDate).toLocaleDateString('mn-MN')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {league.teams?.length || 0} баг
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openTeamEnrollmentDialog(league)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Баг нэмэх
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Settings className="w-4 h-4 mr-1" />
                                    Удирдах
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleTournamentManagement(league.id, 'manage-league')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Удирдлагын самбар нээх
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(league)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(league.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>Мэдээний удирдлага</CardTitle>
              <CardDescription>Мэдээ нийтлэл нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">Мэдээ нийтлэлүүд</h2>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Мэдээ нэмэх
                  </Button>
                </div>
                
                {newsLoading ? (
                  <div>Ачааллаж байна...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Гарчиг</TableHead>
                        <TableHead>Категори</TableHead>
                        <TableHead>Нийтлэгдсэн</TableHead>
                        <TableHead>Үүсгэсэн огноо</TableHead>
                        <TableHead>Үйлдэл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {news && Array.isArray(news) ? news.map((article: any) => (
                        <TableRow key={article.id}>
                          <TableCell>{article.title}</TableCell>
                          <TableCell>{article.category}</TableCell>
                          <TableCell>
                            <Badge variant={article.published ? 'default' : 'secondary'}>
                              {article.published ? 'Нийтлэгдсэн' : 'Ноорог'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(article.createdAt).toLocaleDateString('mn-MN')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(article)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Багийн удирдлага</CardTitle>
              <CardDescription>Лигийн багуудыг нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">Лигийн багууд</h2>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Баг нэмэх
                  </Button>
                </div>
                
                {teamsLoading ? (
                  <div>Ачааллаж байна...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Нэр</TableHead>
                        <TableHead>Эзэн</TableHead>
                        <TableHead>Дасгалжуулагч</TableHead>
                        <TableHead>Тоглогчид</TableHead>
                        <TableHead>Үйлдэл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams && Array.isArray(teams) ? teams.map((team: any) => (
                        <TableRow key={team.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {team.logoUrl && (
                                <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full" />
                              )}
                              <div>
                                <div className="font-medium">{team.name}</div>
                                {team.sponsorLogo && (
                                  <div className="text-sm text-muted-foreground">
                                    <img 
                                      src={team.sponsorLogo} 
                                      alt="Sponsor" 
                                      className="w-4 h-4 inline mr-1"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    Ивээн тэтгэгч
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{team.ownerName || '-'}</TableCell>
                          <TableCell>{team.coachName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {team.players?.length || 0} тоглогч
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(team)}>
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(team)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(team.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Салбар холбоодын удирдлага</CardTitle>
              <CardDescription>Салбар холбоо нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderBranchesTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="federation-members">
          <Card>
            <CardHeader>
              <CardTitle>Холбооны гишүүдийн удирдлага</CardTitle>
              <CardDescription>Холбооны гишүүдийг нэмэх, засах, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderFederationMembersTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judges">
          <Card>
            <CardHeader>
              <CardTitle>Шүүгчдийн удирдлага</CardTitle>
              <CardDescription>Шүүгчийг нэмэх, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderJudgesTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Системийн статистик</CardTitle>
              <CardDescription>Нийт системийн үзүүлэлт ба дэлгэрэнгүй статистик</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminStatsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ зүйл нэмэх</DialogTitle>
            <DialogDescription>
              Доорх талбаруудыг бөглөнө үү
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Засварлах</DialogTitle>
            <DialogDescription>
              Мэдээллийг шинэчлэнэ үү
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {renderFormFields()}
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Цуцлах
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Enrollment Dialog */}
      <Dialog open={isTeamEnrollmentDialogOpen} onOpenChange={setIsTeamEnrollmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Лигт баг нэмэх</DialogTitle>
            <DialogDescription>
              {selectedLeague?.name} лигт бүртгэгдээгүй багуудаас сонгож нэмээрэй
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {teams && Array.isArray(teams) ? (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {teams.filter((team: any) => 
                  !selectedLeague?.teams?.some((enrolledTeam: any) => enrolledTeam.id === team.id)
                ).map((team: any) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {team.logoUrl && (
                        <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.players?.length || 0} тоглогч
                          {team.ownerName && ` • ${team.ownerName}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => enrollTeamInLeague(team.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Нэмэх
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Баг байхгүй байна
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamEnrollmentDialogOpen(false)}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}