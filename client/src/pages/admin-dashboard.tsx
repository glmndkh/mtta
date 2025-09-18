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
import { Pencil, Trash2, Plus, Users, Shield, Building, Trophy, Calendar, Newspaper, Images, TrendingUp, Upload, Link as LinkIcon, ArrowLeft, Settings, UserPlus, Play, Zap, X, Crown, FileText, UserCog, User as UserIcon, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminStatsDashboard from "@/components/admin-stats-dashboard";
import { ObjectUploader } from "@/components/ObjectUploader";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import RichTextEditor from "@/components/rich-text-editor";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getImageUrl, formatName } from "@/lib/utils";

// Import Form components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
  const [nationalTeamFilter, setNationalTeamFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false); // State to control dialog visibility
  const [editingId, setEditingId] = useState<string | null>(null); // State to track the item being edited
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility


  // Form schema and initialization for judges
  const judgeSchema = z.object({
    firstName: z.string().min(1, "Нэр заавал оруулна уу"),
    lastName: z.string().min(1, "Овог заавал оруулна уу"),
    userId: z.string().optional(),
    judgeType: z.enum(["domestic", "international"]),
    imageUrl: z.string().optional(),
  });
  const form = useForm<z.infer<typeof judgeSchema>>({
    resolver: zodResolver(judgeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      userId: "",
      judgeType: "domestic",
      imageUrl: "",
    },
  });
  const currentTab = selectedTab; // Use selectedTab for currentTab

  // Data queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: selectedTab === 'users' || selectedTab === 'clubs' || selectedTab === 'judges' || selectedTab === 'teams' || selectedTab === 'coaches'
  });


  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ['/api/admin/clubs'],
    enabled: selectedTab === 'clubs' || selectedTab === 'coaches'
  });

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/admin/tournaments'],
    enabled: selectedTab === 'tournaments'
  });

  // Fetch leagues for admin with proper error handling
  const { data: leagues = [], isLoading: leaguesLoading, error: leaguesError } = useQuery({
    queryKey: ["/api/admin/leagues"],
    enabled: selectedTab === 'leagues',
    retry: false,
    queryFn: async () => {
      console.log('Fetching leagues...');
      const response = await fetch('/api/admin/leagues');
      console.log('Leagues response status:', response.status);

      if (!response.ok) {
        // Log the response text if it's not OK
        const errorText = await response.text();
        console.error('Failed to fetch leagues:', { status: response.status, statusText: response.statusText, body: errorText });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got content-type:', contentType, 'and body:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      console.log('Leagues data:', data);
      return data;
    },
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

const { data: nationalTeam, isLoading: nationalTeamLoading } = useQuery({
  queryKey: ['/api/admin/national-team'],
  enabled: selectedTab === 'national-team'
});

const { data: judges, isLoading: judgesLoading, refetch: judgesRefetch } = useQuery({
  queryKey: ['/api/admin/judges'],
  enabled: selectedTab === 'judges'
  });

  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['/api/admin/coaches'],
    enabled: selectedTab === 'coaches'
  });

  // Load all users for player selection dropdown
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled:
      (selectedTab === 'teams' ||
        selectedTab === 'judges' ||
        selectedTab === 'clubs' ||
        selectedTab === 'coaches' ||
        selectedTab === 'national-team') &&
      (isCreateDialogOpen || !!editingItem || selectedTab === 'clubs' || selectedTab === 'national-team')
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
      if (selectedTab === 'news') {
        queryClient.invalidateQueries({ queryKey: ['/api/news'] });
        queryClient.invalidateQueries({ queryKey: ['/api/news/latest'] });
      }
      if (selectedTab === 'leagues') {
        queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      }
      if (selectedTab === 'national-team') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/national-team'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      }
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
      if (selectedTab === 'news') {
        queryClient.invalidateQueries({ queryKey: ['/api/news'] });
        queryClient.invalidateQueries({ queryKey: ['/api/news/latest'] });
      }
      if (selectedTab === 'leagues') {
        queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      }
      if (selectedTab === 'national-team') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/national-team'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      }
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
      if (selectedTab === 'news') {
        queryClient.invalidateQueries({ queryKey: ['/api/news'] });
        queryClient.invalidateQueries({ queryKey: ['/api/news/latest'] });
      }
      if (selectedTab === 'leagues') {
        queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      }
      if (selectedTab === 'national-team') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/national-team'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      }
    },
    onError: (error: any) => {
      toast({ title: "Алдаа гарлаа", description: error.message, variant: "destructive" });
    }
  });

  const sanitizeFormData = (data: any) => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== "" && value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  const handleCreateItem = () => {
    if (!validateForm()) {
      toast({ title: "Алдаа", description: "Шаардлагатай талбаруудыг бөглөнө үү", variant: "destructive" });
      return;
    }

    // Ensure year is string for champions
    let processedData = sanitizeFormData(formData);
    if (selectedTab === 'champions' && processedData.year) {
      processedData.year = String(processedData.year);
    }

    createMutation.mutate({
      endpoint: `/api/admin/${selectedTab}`,
      data: processedData,
    });
  };

  const handleUpdate = () => {
    if (!validateForm()) {
      toast({ title: "Алдаа", description: "Шаардлагатай талбаруудыг бөглөнө үү", variant: "destructive" });
      return;
    }
    const endpoint = `/api/admin/${selectedTab}/${editingItem.id}`;

    // Ensure year is string for champions
    let processedData = sanitizeFormData(formData);
    if (selectedTab === 'champions' && processedData.year) {
      processedData.year = String(processedData.year);
    }

    updateMutation.mutate({
      endpoint,
      data: processedData,
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
    setEditingItem(item);
    if (selectedTab === 'champions') {
      setFormData({
        name: item.name || '',
        year: item.year || '',
        gender: item.gender || '',
        championType: item.championType || '',
        imageUrl: item.imageUrl || ''
      });
    } else if (selectedTab === "users") {
      form.reset({
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        email: item.email || "",
        phone: item.phone || "",
        gender: item.gender || "male",
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split('T')[0] : "",
        clubAffiliation: item.clubAffiliation || "",
        role: item.role || "player",
      });
    } else if (selectedTab === "clubs") {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        address: item.address || "",
        country: item.country || "",
        province: item.province || "",
        city: item.city || "",
        phone: item.phone || "",
        email: item.email || "",
        website: item.website || "",
        logoUrl: item.logoUrl || "",
        colorTheme: item.colorTheme || "var(--success)",
        schedule: item.schedule || "",
        trainingInfo: item.trainingInfo || "",
        ownerId: item.ownerId || "",
        ownerName: item.ownerName || "",
        extraData: item.extraData || [],
      });
    } else if (selectedTab === "tournaments") {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        startDate: item.startDate ? item.startDate.split('T')[0] : "",
        endDate: item.endDate ? item.endDate.split('T')[0] : "",
        location: item.location || "",
        maxParticipants: item.maxParticipants || "",
        entryFee: item.entryFee || "",
        status: item.status || "",
        isPublished: item.isPublished || false,
      });
    } else if (selectedTab === "judges") {
      setFormData({
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        userId: item.userId || "",
        judgeType: item.judgeType || "domestic",
        imageUrl: item.imageUrl || "",
      });
    } else if (selectedTab === "branches") {
      setFormData({
        name: item.name || "",
        leader: item.leader || "",
        leadershipMembers: item.leadershipMembers || "",
        address: item.address || "",
        location: item.location || "",
        phone: item.phone || "",
        coordinates: item.coordinates || "", // Preload coordinates
        activities: item.activities || "",
        imageUrl: item.imageUrl || "", // Preload imageUrl
      });
    } else if (selectedTab === "national-team") {
      setFormData({
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        age: item.age || 0,
        imageUrl: item.imageUrl || "",
      });
    } else if (selectedTab === "sliders") {
      setFormData({
        title: item.title || "",
        subtitle: item.subtitle || "",
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        linkType: item.linkType || 'custom',
        linkUrl: item.linkUrl || "",
        buttonText: item.buttonText || "",
        isActive: item.isActive || false,
        sortOrder: item.sortOrder || 0,
        selectedNewsId: item.selectedNewsId || "",
      });
    } else if (selectedTab === "news") {
      setFormData({
        title: item.title || "",
        content: item.content || "",
        excerpt: item.excerpt || "",
        imageUrl: item.imageUrl || "",
        category: item.category || "news",
        published: item.published !== undefined ? item.published : false,
      });
    }
    setShowDialog(true); // Show the dialog
  };

  const openTeamEnrollmentDialog = (league: any) => {
    setSelectedLeague(league);
    setIsTeamEnrollmentDialogOpen(true);
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
    } else if (selectedTab === 'news') {
      // Match /news defaults
      defaultData = {
        title: '',
        content: '',
        excerpt: '',
        imageUrl: '',
        category: 'news',
        published: true
      };
    } else if (selectedTab === 'champions') {
      defaultData = {
        name: '',
        year: new Date().getFullYear().toString(), // Default to current year as string
        imageUrl: '',
        gender: '',
        championType: ''
      };
    } else if (selectedTab === 'judges') {
      defaultData = {
        firstName: '',
        lastName: '',
        imageUrl: '',
        judgeType: 'domestic' // Default to domestic
      };
    } else if (selectedTab === 'national-team') {
      defaultData = {
        firstName: '',
        lastName: '',
        age: 25, // Default to 25 instead of 0
        imageUrl: '',
        userId: '', // Optional user ID if linking to existing user
      };
    } else if (selectedTab === 'clubs') {
      // Default values for clubs, including location fields
      defaultData = {
        name: '',
        description: '',
        address: '',
        country: '',
        province: '',
        city: '',
        phone: '',
        email: '',
        schedule: '',
        website: '',
        trainingInfo: '',
        extraData: [],
      };
    } else if (selectedTab === 'teams') {
      defaultData = {
        name: '',
        ownerName: '',
        coachName: '',
        sponsorLogo: '',
        playerIds: [],
      };
    } else if (selectedTab === 'branches') {
      defaultData = {
        name: '',
        leader: '',
        leadershipMembers: '',
        address: '',
        location: '',
        phone: '',
        coordinates: '', // Default to empty for new branches
        activities: '',
        imageUrl: '', // Default to empty for new branches
      };
    }

    setFormData(defaultData);
    setIsCreateDialogOpen(true);
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
        const errorText = await response.text();
        console.error('Failed to enroll team:', { status: response.status, body: errorText });
        toast({ title: "Алдаа гарлаа", description: `Нэмж чадсангүй. Статус: ${response.status}`, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error enrolling team:', error);
      toast({ title: "Алдаа гарлаа", description: "Системд алдаа гарлаа", variant: "destructive" });
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
                <TableCell>{formatName(user.firstName, user.lastName)}</TableCell>
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
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/admin/player/${user.id}`)}>
                      <UserIcon className="w-4 h-4 mr-1" />
                      Details
                    </Button>
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

    // Group clubs by province
    const groupedClubs: { [key: string]: any[] } = {};
    filteredClubs.forEach(club => {
      const province = club.province || 'Unknown Province';
      if (!groupedClubs[province]) {
        groupedClubs[province] = [];
      }
      groupedClubs[province].push(club);
    });

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
          Object.keys(groupedClubs).length > 0 ? (
            Object.entries(groupedClubs).map(([province, clubList]) => (
              <div key={province} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-green-700">{province}</h3>
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
                    {clubList.map((club: any) => (
                      <TableRow key={club.id}>
                        <TableCell>{club.name}</TableCell>
                        <TableCell>{club.description}</TableCell>
                        <TableCell>{club.country}, {club.province}, {club.city}</TableCell>
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
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Клуб олдсонгүй
            </div>
          )
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
            (branch.location || "").toLowerCase().includes(searchText) ||
            (branch.coordinates || "").toLowerCase().includes(searchText) // Filter by coordinates
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
                <TableHead>Тэргүүлэгч</TableHead>
                <TableHead>Хаяг</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Координат</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch: any) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.leader}</TableCell>
                  <TableCell>{branch.address || branch.location}</TableCell>
                  <TableCell>{branch.phone || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{branch.coordinates || 'Тодорхойгүй'}</TableCell>
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

  const renderNationalTeamTab = () => {
    const filteredPlayers = nationalTeam && Array.isArray(nationalTeam)
      ? nationalTeam.filter((player: any) => {
          const searchText = nationalTeamFilter.toLowerCase();
          return (
            !searchText ||
            player.firstName?.toLowerCase().includes(searchText) ||
            player.lastName?.toLowerCase().includes(searchText)
          );
        })
      : [];

    // Get available users who are not already in national team
    const availableUsers = users && Array.isArray(users) 
      ? users.filter((user: any) => 
          !nationalTeam?.some((player: any) => player.userId === user.id)
        )
      : [];

    console.log('National team data:', nationalTeam);
    console.log('Filtered players:', filteredPlayers);
    console.log('Available users:', availableUsers);

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Үндэсний шигшээ</h2>
            <p className="text-sm text-muted-foreground">
              Үндэсний шигшээний бүрэлдэхүүнийг удирдах
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Тоглогч хайх..."
                value={nationalTeamFilter}
                onChange={(e) => setNationalTeamFilter(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => {
                console.log('Opening create dialog for national team');
                openCreateDialog();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Тоглогч нэмэх
            </Button>
          </div>
        </div>

        {/* Squad Management Section - Always show */}
        <Card data-section="user-selection">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Бүртгэгдсэн хэрэглэгчээс нэмэх
            </CardTitle>
            <CardDescription>
              Бүртгэгдсэн хэрэглэгчдээс үндэсний шигшээнд нэмэх боломжтой
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allUsersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableUsers && availableUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {formatName(user.firstName || '', user.lastName || '')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email || 'И-мэйл байхгүй'}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('Adding user to national team:', user);
                        // Add user to national team
                        const playerData = {
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          age: user.age || user.dateOfBirth ? 
                            (new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()) : 
                            25, // Calculate age from dateOfBirth or default to 25
                          imageUrl: user.imageUrl || user.avatarUrl || '',
                          userId: user.id
                        };
                        createMutation.mutate({
                          endpoint: '/api/admin/national-team',
                          data: playerData,
                        });
                      }}
                      disabled={createMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {createMutation.isPending ? 'Нэмж байна...' : 'Нэмэх'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Одоогоор нэмэх боломжтой хэрэглэгч байхгүй байна
                </p>
                <p className="text-sm text-gray-500">
                  Бүх бүртгэгдсэн хэрэглэгчид аль хэдийн үндэсний шигшээнд орсон эсвэл шинэ хэрэглэгч бүртгүүлээгүй байна
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Squad Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Одоогийн бүрэлдэхүүн
                </CardTitle>
                <CardDescription>
                  {nationalTeamLoading ? 'Ачааллаж байна...' : `${filteredPlayers.length} тамирчин үндэсний шигшээнд байна`}
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  console.log('Opening create dialog for national team from main section');
                  openCreateDialog();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Тоглогч нэмэх
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {nationalTeamLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Squad Grid View */}
                {filteredPlayers && filteredPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPlayers.map((player: any) => (
                      <Card key={player.id} className="relative border-2 border-green-200 hover:border-green-400 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {player.imageUrl ? (
                                <img
                                  src={player.imageUrl}
                                  alt={formatName(player.firstName, player.lastName)}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-6 h-6 text-green-600" />
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {formatName(player.firstName || '', player.lastName || '')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {player.age || 'Нас тодорхойгүй'} нас
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                console.log('Opening edit dialog for player:', player);
                                openEditDialog(player);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`${formatName(player.firstName, player.lastName)}-г үндэсний шигшээнээс хасахдаа итгэлтэй байна уу?`)) {
                                  console.log('Deleting player:', player.id);
                                  handleDelete(player.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Flag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Үндэсний шигшээ хоосон байна</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Одоогоор үндэсний шигшээнд тамирчид байхгүй байна. Эхний тамирчинг нэмж эхлүүлээрэй.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => {
                          console.log('Opening create dialog from empty state');
                          openCreateDialog();
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Шинэ тамирчин нэмэх
                      </Button>
                      <Button variant="outline" onClick={() => {
                        // Scroll to the user selection section
                        document.querySelector('[data-section="user-selection"]')?.scrollIntoView({ behavior: 'smooth' });
                      }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Хэрэглэгчээс нэмэх
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table View Toggle - Only show if there are players */}
                {filteredPlayers && filteredPlayers.length > 0 && (
                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Хүснэгтээр харах
                    </summary>
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Нэр</TableHead>
                            <TableHead>Овог</TableHead>
                            <TableHead>Нас</TableHead>
                            <TableHead>Зураг</TableHead>
                            <TableHead>Үйлдэл</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPlayers.map((player: any) => (
                            <TableRow key={player.id}>
                              <TableCell>{player.firstName || 'Тодорхойгүй'}</TableCell>
                              <TableCell>{player.lastName || 'Тодорхойгүй'}</TableCell>
                              <TableCell>{player.age || 'Тодорхойгүй'}</TableCell>
                              <TableCell>
                                {player.imageUrl ? (
                                  <img 
                                    src={player.imageUrl} 
                                    alt={formatName(player.firstName, player.lastName)} 
                                    className="w-10 h-10 rounded-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditDialog(player)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => {
                                      if (confirm(`${formatName(player.firstName, player.lastName)}-г үндэсний шигшээнээс хасахдаа итгэлтэй байна уу?`)) {
                                        handleDelete(player.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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
              {judges && Array.isArray(judges) ? judges.map((judge: any) => (
                <TableRow key={judge.id}>
                  <TableCell>{formatName(judge.firstName, judge.lastName)}</TableCell>
                  <TableCell>{judge.judgeType === 'international' ? 'Олон улсын' : 'Дотоодын'}</TableCell>
                  <TableCell>
                    {judge.imageUrl && (
                      <img src={judge.imageUrl} alt={formatName(judge.firstName, judge.lastName)} className="w-10 h-10 rounded-full" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(judge.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderCoachesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Дасгалжуулагчид</h2>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Дасгалжуулагч нэмэх
          </Button>
        </div>

        {coachesLoading ? (
          <div>Ачааллаж байна...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Клуб</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches && Array.isArray(coaches) ? coaches.map((coach: any) => (
                <TableRow key={coach.id}>
                  <TableCell>
                    {coach.name || formatName(coach.firstName || '', coach.lastName || '')}
                  </TableCell>
                  <TableCell>{coach.clubName}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(coach.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : null}
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
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                      <Upload className="w-6 h-6 text-text-secondary" />
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
              <TableHead>Хүйс</TableHead>
              <TableHead>Аваргын төрөл</TableHead>
              <TableHead>Зураг</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {champions && Array.isArray(champions) ? champions.map((champion: any) => (
              <TableRow key={champion.id}>
                <TableCell>{champion.name}</TableCell>
                <TableCell>{champion.year}</TableCell>
                <TableCell>
                  {champion.gender === 'male' ? 'Эрэгтэй' :
                   champion.gender === 'female' ? 'Эмэгтэй' :
                   champion.gender === 'other' ? 'Бусад' : '-'}
                </TableCell>
                <TableCell>{champion.championType || '-'}</TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img
                      src={getImageUrl(champion.imageUrl)}
                      alt={champion.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        console.error('Admin champion image failed to load:', champion.imageUrl);

                        if (!target.hasAttribute('data-fallback-tried')) {
                          target.setAttribute('data-fallback-tried', 'true');
                          // Try direct objects path
                          const cleanPath = champion.imageUrl.replace(/^\/+/, '').replace(/^(public-)?objects\//, '');
                          target.src = `/objects/uploads/${cleanPath}`;
                        } else if (!target.hasAttribute('data-fallback-2-tried')) {
                          target.setAttribute('data-fallback-2-tried', 'true');
                          // Try without uploads prefix
                          const cleanPath = champion.imageUrl.replace(/^\/+/, '').replace(/^(public-)?objects\/(uploads\/)?/, '');
                          target.src = `/objects/${cleanPath}`;
                        } else {
                          // Hide image if all attempts fail
                          target.style.display = 'none';
                        }
                      }}
                      />
                    </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(champion)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(champion.id)}>
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
              <Label>Клубын эзэн</Label>
              <UserAutocomplete
                users={allUsers as any[] || []}
                value={formData.ownerId}
                onSelect={(u) =>
                  setFormData({
                    ...formData,
                    ownerId: u ? u.id : '',
                    ownerName: u ? '' : formData.ownerName,
                  })
                }
                placeholder="Эзэн хайх..."
                allowCustomName
                customNameValue={formData.ownerName || ''}
                onCustomNameChange={(name) =>
                  setFormData({ ...formData, ownerName: name, ownerId: '' })
                }
              />
            </div>
            <div>
              <Label>Клубын багш дасгалжуулагч</Label>
              <UserAutocomplete
                users={allUsers as any[] || []}
                value={formData.coachUserId}
                onSelect={(u) =>
                  setFormData({
                    ...formData,
                    coachUserId: u ? u.id : '',
                    coachName: u ? '' : formData.coachName,
                  })
                }
                placeholder="Дасгалжуулагч хайх..."
                allowCustomName
                customNameValue={formData.coachName || ''}
                onCustomNameChange={(name) =>
                  setFormData({ ...formData, coachName: name, coachUserId: '' })
                }
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Клубын лого
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
                          logoUrl: aclData.objectPath,
                        });
                        toast({ title: "Лого амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({
                          title: "Алдаа",
                          description: "Лого хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  buttonClassName="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Лого сонгох
                </ObjectUploader>
                {formData.logoUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={formData.logoUrl}
                      alt="Club Logo"
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div className="text-sm text-green-600">✓ Лого хуулагдлаа</div>
                  </div>
                )}
              </div>
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
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Улс"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
                <Input
                  placeholder="Аймаг/Хот"
                  value={formData.province || ''}
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                />
                <Input
                  placeholder="Дүүрэг/Сум"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <Input
                placeholder="Дэлгэрэнгүй хаяг"
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
            <div>
              <Label htmlFor="schedule">Цагийн хуваарь</Label>
              <Textarea
                id="schedule"
                value={formData.schedule || ''}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="website">Холбоос</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trainingInfo">Сургалтын мэдээлэл</Label>
              <Textarea
                id="trainingInfo"
                value={formData.trainingInfo || ''}
                onChange={(e) => setFormData({ ...formData, trainingInfo: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">Нэмэлт мэдээлэл
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, extraData: [...(formData.extraData || []), { key: '', value: '' }] })}>
                  <Plus className="w-4 h-4" />
                </Button>
              </Label>
              {(formData.extraData || []).map((field: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Түлхүүр"
                    value={field.key}
                    onChange={(e) => {
                      const extra = [...(formData.extraData || [])];
                      extra[idx] = { ...extra[idx], key: e.target.value };
                      setFormData({ ...formData, extraData: extra });
                    }}
                  />
                  <Input
                    placeholder="Утга"
                    value={field.value}
                    onChange={(e) => {
                      const extra = [...(formData.extraData || [])];
                      extra[idx] = { ...extra[idx], value: e.target.value };
                      setFormData({ ...formData, extraData: extra });
                    }}
                  />
                  <Button type="button" variant="ghost" onClick={() => {
                    const extra = [...(formData.extraData || [])];
                    extra.splice(idx, 1);
                    setFormData({ ...formData, extraData: extra });
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'coaches':
        return (
          <>
            <div>
              <Label htmlFor="clubId">Клуб</Label>
              <Select value={formData.clubId || ''} onValueChange={(v) => setFormData({ ...formData, clubId: v })}>
                <SelectTrigger id="clubId">
                  <SelectValue placeholder="Клуб сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {clubs && Array.isArray(clubs) ? clubs.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Хэрэглэгч эсвэл нэр</Label>
              <UserAutocomplete
                users={allUsers || []}
                value={formData.userId}
                onSelect={(u) => setFormData({ ...formData, userId: u ? u.id : '', name: '' })}
                placeholder="Хэрэглэгч хайх..."
                allowCustomName
                customNameValue={formData.name || ''}
                onCustomNameChange={(name) => setFormData({ ...formData, name, userId: '' })}
              />
            </div>
          </>
        );

      case 'branches':
        return (
          <>
            <div>
              <Label htmlFor="name">Нэр</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="leader">Тэргүүлэгч</Label>
              <Input id="leader" value={formData.leader || ''} onChange={(e) => setFormData({...formData, leader: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="leadershipMembers">Удирдлагын гишүүд</Label>
              <Textarea id="leadershipMembers" value={formData.leadershipMembers || ''} onChange={(e) => setFormData({...formData, leadershipMembers: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="address">Хаяг</Label>
              <Input id="address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="location">Байршил</Label>
              <Input id="location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+976-11-123456" />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Лого оруулах
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
                    try {
                      if (result.successful && result.successful.length > 0) {
                        const file = result.successful[0];
                        const response = await apiRequest("/api/objects/finalize", {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            fileURL: file.uploadURL,
                            isPublic: true,
                          }),
                        });
                        const { objectPath } = await response.json();
                        setFormData({ ...formData, imageUrl: objectPath });
                        toast({
                          title: "Амжилттай",
                          description: "Лого амжилттай хуулагдлаа",
                        });
                      }
                    } catch (error) {
                      console.error("Error finalizing upload:", error);
                      toast({
                        title: "Алдаа",
                        description: "Файл боловсруулахад алдаа гарлаа",
                        variant: "destructive",
                      });
                    }
                  }}
                  buttonClassName="w-full"
                >
                  Лого сонгох
                </ObjectUploader>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl.startsWith("/") ? formData.imageUrl : `/objects/${formData.imageUrl}`}
                      alt="Branch logo preview"
                      className="w-24 h-24 object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="activities">Үйл ажиллагаа</Label>
              <Textarea id="activities" value={formData.activities || ''} onChange={(e) => setFormData({...formData, activities: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="coordinates">Координат (lat,lng)</Label>
              <Input
                id="coordinates"
                value={formData.coordinates || ''}
                placeholder="47.9184, 106.9177"
                onChange={(e) => setFormData({...formData, coordinates: e.target.value})}
              />
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
              <div className="space-y-2">
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
                    <p className="text-sm text-text-secondary">Зураг хуулагдсан: {formData.imageUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'national-team':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div>
              <Label htmlFor="age">Нас</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Зураг оруулах
              </Label>
              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
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
                    <p className="text-sm text-text-secondary">Зураг хуулагдсан: {formData.imageUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'judges':
        return (
          <>
            <div>
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Нэр
              </Label>
              <Input
                id="firstName"
                placeholder="Шүүгчийн нэр"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Овог
              </Label>
              <Input
                id="lastName"
                placeholder="Шүүгчийн овог"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Хэрэглэгч (заавал биш)
              </Label>
              <Select value={formData.userId || 'none'} onValueChange={(value) => setFormData({ ...formData, userId: value === 'none' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Хэрэглэгч сонгоно уу (заавал биш)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Хэрэглэгчгүй</SelectItem>
                  {users && Array.isArray(users) ? users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {formatName(user.firstName, user.lastName)}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Шүүгчийн зураг
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
                        });
                        const aclData = (await aclResponse.json()) as {
                          objectPath: string;
                        };
                        setFormData({
                          ...formData,
                          imageUrl: aclData.objectPath,
                        });
                        toast({ title: "Зураг амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error setting ACL:", error);
                        toast({
                          title: "Алдаа",
                          description:
                            "Зураг хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
                          variant: "destructive",
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
                    <p className="text-sm text-text-secondary">
                      Зураг хуулагдсан: {formData.imageUrl}
                    </p>
                  </div>
                )}
              </div>
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
              <RichTextEditor
                content={formData.content || ''}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Мэдээний агуулга..."
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
              <div className="space-y-2">
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
                <div className="text-sm text-muted-foreground text-center">эсвэл</div>
                <div>
                  <Label htmlFor="newsImageUrl">Зурагны URL оруулах</Label>
                  <Input
                    id="newsImageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl.startsWith('/') ? `/public-objects${formData.imageUrl}` : formData.imageUrl}
                      alt="Мэдээний зураг"
                      className="w-full max-w-sm h-40 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/400/300';
                      }}
                    />
                    <div className="text-sm text-green-600 mt-1">✓ Зураг ачаалагдлаа</div>
                  </div>
                )}
              </div>
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
                      {formatName(player.firstName, player.lastName)}
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
                        <span className="text-sm">{formatName(player.firstName, player.lastName)}</span>
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
              <Label htmlFor="title">Гарчиг (заавал биш)</Label>
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
                  <SelectContent>{news && Array.isArray(news) ? news.filter((article: any) => article.published).map((article: any) => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.title}
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>Нийтлэгдсэн мэдээ байхгүй</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.selectedNewsId && (
                  <div className="text-sm text-text-secondary mt-1">
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
                  placeholder="https://example.com /page-name"
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
                    <div className="text-sm text-green-600">✓ Лого хуулагдлаа</div>
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
              <Label htmlFor="name">Тэмцээнний нэр</Label>
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
                type="text"
                placeholder="2024 эсвэл 2023-2024"
                value={formData.year || ''}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="gender">Хүйс</Label>
              <select
                id="gender"
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Хүйс сонгох</option>
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <div>
              <Label htmlFor="championType">Аваргын төрөл</Label>
              <select
                id="championType"
                value={formData.championType || ''}
                onChange={(e) => setFormData({ ...formData, championType: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Төрөл сонгох</option>
                <option value="өсвөрийн">Өсвөрийн</option>
                <option value="ахмадын">Ахмадын</option>
                <option value="улсын">Улсын</option>
              </select>
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
                        const aclResponse = await apiRequest("/api/objects/finalize", {
                          method: "PUT",
                          body: JSON.stringify({
                            fileURL: uploadURL,
                            isPublic: true
                          }),
                          headers: { 'Content-Type': 'application/json' },
                        });
                        const aclData = await aclResponse.json() as { objectPath: string };
                        setFormData({ ...formData, imageUrl: aclData.objectPath });
                        toast({ title: "Зураг амжилттай хуулагдлаа" });
                      } catch (error) {
                        console.error("Error finalizing upload:", error);
                        // Fallback to direct URL if finalize fails
                        setFormData({ ...formData, imageUrl: uploadURL });
                        toast({
                          title: "Анхааруулга",
                          description: "Зураг хуулагдсан боловч зөвшөөрөл тохируулахад алдаа гарлаа",
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
                      src={formData.imageUrl.startsWith('/public-objects') ? formData.imageUrl : `/public-objects${formData.imageUrl}`}
                      alt="Champion"
                      className="w-16 h-16 object-cover border rounded"
                      onError={(e) => {
                        // Fallback to original URL if public-objects path fails
                        if (e.currentTarget.src.includes('/public-objects')) {
                          e.currentTarget.src = formData.imageUrl;
                        }
                      }}
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

  const validateForm = () => {
    switch (selectedTab) {
      case 'news':
        return formData.title; // Зөвхөн гарчиг л заавал, бусад талбар заавал биш
      case 'tournaments':
        return formData.name && formData.startDate && formData.endDate && formData.location;
      case 'sponsors':
        return formData.name && formData.logoUrl;
      case 'sliders':
        return formData.imageUrl; // Title заавал биш, зөвхөн зураг л заавал
      case 'clubs':
        // Add validation for location fields
        return formData.name && formData.country && formData.province && formData.city;
      case 'branches':
        return formData.name && formData.imageUrl; // Add validation for imageUrl
      case 'federation-members':
        return formData.name;
      case 'national-team':
        return formData.firstName && formData.lastName && formData.age;
      case 'judges':
        return formData.firstName && formData.lastName;
      case 'coaches':
        return formData.clubId && (formData.userId || formData.name);
      case 'champions':
        return formData.name && formData.year && formData.gender && formData.championType;
      case 'teams':
        return formData.name;
      default:
        return true;
    }
  };



  const handleCreate = () => {
    if (!validateForm()) {
      toast({ title: "Алдаа", description: "Шаардлагатай талбаруудыг бөглөнө үү", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      endpoint: `/api/admin/${selectedTab}`,
      data: sanitizeFormData(formData),
    });
  };

  // Function to render the leagues tab content
  const renderLeaguesTab = () => {
    return (
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
        ) : leaguesError ? (
          <div className="text-red-500">Лигүүдийг ачаалахад алдаа гарлаа: {leaguesError.message}</div>
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
                  <TableCell>{league.season || '-'}</TableCell>
                  <TableCell>{league.startDate ? new Date(league.startDate).toLocaleDateString('mn-MN') : '-'}</TableCell>
                  <TableCell>{league.endDate ? new Date(league.endDate).toLocaleDateString('mn-MN') : '-'}</TableCell>
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
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Лиг байхгүй байна
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  // Function to render the teams tab content
  const renderTeamsTab = () => {
    const filteredTeams = teams && Array.isArray(teams) ? teams.filter((team: any) => {
      const searchText = userFilter.toLowerCase(); // Reusing userFilter for team search for simplicity
      return !searchText ||
             team.name?.toLowerCase().includes(searchText) ||
             (team.ownerName || "").toLowerCase().includes(searchText) ||
             (team.coachName || "").toLowerCase().includes(searchText);
    }) : [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Багууд</h2>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Баг хайх..."
              value={userFilter} // Reusing userFilter
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
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
              {filteredTeams.map((team: any) => (
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
                                console.error('Sponsor logo load error:', e);
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  // Function to render the news tab content
  const renderNewsTab = () => (
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
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Админ удирдлага</h1>
            <p className="text-text-secondary">Системийн бүх мэдээллийг энд удирдана уу</p>
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
        <TabsList className="flex flex-wrap gap-2 h-auto items-start w-full bg-background border border-border">
          <TabsTrigger value="stats" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <TrendingUp className="w-4 h-4" />
            Статистик
          </TabsTrigger>
          <TabsTrigger value="branches" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <LinkIcon className="w-4 h-4" />
            Салбар холбоод
          </TabsTrigger>
          <TabsTrigger value="federation-members" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <UserPlus className="w-4 h-4" />
            Холбооны гишүүд
          </TabsTrigger>
          <TabsTrigger value="judges" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Shield className="w-4 h-4" />
            Шүүгчид
          </TabsTrigger>
          <TabsTrigger value="coaches" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <UserCog className="w-4 h-4" />
            Дасгалжуулагчид
          </TabsTrigger>
          <TabsTrigger value="national-team" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Flag className="w-4 h-4" />
            Үндэсний шигшээ
          </TabsTrigger>
          <TabsTrigger value="champions" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Crown className="w-4 h-4" />
            Аваргууд
          </TabsTrigger>
          <TabsTrigger value="clubs" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Building className="w-4 h-4" />
            Клубууд
          </TabsTrigger>
          <TabsTrigger value="users" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Users className="w-4 h-4" />
            Хэрэглэгчид
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Trophy className="w-4 h-4" />
            Тэмцээн
          </TabsTrigger>
          <TabsTrigger value="leagues" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Trophy className="w-4 h-4" />
            Лигүүд
          </TabsTrigger>
          <TabsTrigger value="teams" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Users className="w-4 h-4" />
            Багууд
          </TabsTrigger>
          <TabsTrigger value="news" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Newspaper className="w-4 h-4" />
            Мэдээ
          </TabsTrigger>
          <TabsTrigger value="sliders" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
            <Images className="w-4 h-4" />
            Слайдер
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="admin-tab-trigger flex items-center gap-2 data-[state=active]:bg-green-600 font-semibold text-base">
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
                        <TableHead>Нийтлэгсэн</TableHead>
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
              {renderLeaguesTab()}
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
              {renderNewsTab()}
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
              {renderTeamsTab()}
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

        <TabsContent value="coaches">
          <Card>
            <CardHeader>
              <CardTitle>Дасгалжуулагчдын удирдлага</CardTitle>
              <CardDescription>Клубын дасгалжуулагчдыг нэмэх, устгах</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCoachesTab()}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Шинэ зүйл нэмэх</DialogTitle>
            <DialogDescription>
              Доорх талбаруудыг бөглөнө үү
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {renderFormFields()}
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Цуцлах
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={() => {
        setShowDialog(false);
        setEditingItem(null);
        setFormData({}); // Reset form data on close
      }}>
        <DialogContent
          className={`${selectedTab === 'tournaments' ? 'max-w-[90vw] max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-y-auto`}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedTab === 'users' ? 'Хэрэглэгч засах' :
               selectedTab === 'clubs' ? 'Клуб засах' :
               selectedTab === 'coaches' ? 'Дасгалжуулагч засах' :
               selectedTab === 'branches' ? 'Салбар холбоо засах' :
               selectedTab === 'federation-members' ? 'Холбооны гишүүн засах' :
               selectedTab === 'national-team' ? 'Үндэсний шигшээ тоглогч засах' :
               selectedTab === 'judges' ? 'Шүүгч засах' :
               selectedTab === 'leagues' ? 'Лиг засах' :
               selectedTab === 'news' ? 'Мэдээ засах' :
               selectedTab === 'teams' ? 'Баг засах' :
               selectedTab === 'sliders' ? 'Слайдер засах' :
               selectedTab === 'sponsors' ? 'Ивээн тэтгэгч засах' :
               selectedTab === 'tournaments' ? 'Тэмцээн засах' :
               selectedTab === 'champions' ? 'Аварга засах' : 'Засах'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Шинэчилж байна...' : 'Шинэчлэх'}
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