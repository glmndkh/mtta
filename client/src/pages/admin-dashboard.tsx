import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Users, Shield, Building, Trophy, Calendar, Newspaper, Images, TrendingUp, Upload, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminStatsDashboard from "@/components/admin-stats-dashboard";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("stats");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: selectedTab === 'users'
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/admin/players'],
    enabled: selectedTab === 'players'
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

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/admin/news'],
    enabled: selectedTab === 'news' || selectedTab === 'sliders'
  });

  const { data: sliders, isLoading: slidersLoading } = useQuery({
    queryKey: ['/api/admin/sliders'],
    enabled: selectedTab === 'sliders'
  });

  // Generic mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
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
      return fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
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
      return fetch(endpoint, { method: 'DELETE' });
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
    updateMutation.mutate({
      endpoint: `/api/admin/${selectedTab}/${editingItem.id}`,
      data: formData
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Устгахдаа итгэлтэй байна уу?")) {
      deleteMutation.mutate(`/api/admin/${selectedTab}/${id}`);
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
  };

  const openCreateDialog = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Хэрэглэгчид</h2>
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
            {users && Array.isArray(users) ? users.map((user: any) => (
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
            )) : null}
          </TableBody>
        </Table>
      )}
    </div>
  );

  const renderPlayersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Тоглогчид</h2>
      </div>
      
      {playersLoading ? (
        <div>Ачааллаж байна...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Гишүүний дугаар</TableHead>
              <TableHead>Нэр</TableHead>
              <TableHead>Зэрэглэл</TableHead>
              <TableHead>Хожил/Ялагдал</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players && Array.isArray(players) ? players.map((player: any) => (
              <TableRow key={player.players?.id}>
                <TableCell>{player.players?.memberNumber}</TableCell>
                <TableCell>{player.users?.firstName} {player.users?.lastName}</TableCell>
                <TableCell>{player.players?.rank}</TableCell>
                <TableCell>{player.players?.wins}/{player.players?.losses}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(player.players)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(player.players?.id)}>
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

  const renderClubsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Клубууд</h2>
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
            {clubs && Array.isArray(clubs) ? clubs.map((club: any) => (
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
            )) : null}
          </TableBody>
        </Table>
      )}
    </div>
  );

  const renderSlidersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
                  <SelectItem value="player">Тоглогч</SelectItem>
                  <SelectItem value="club_owner">Клубын эзэн</SelectItem>
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
              <Label htmlFor="imageUrl">Зургийн URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              />
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
                Слайдерын зургийн URL
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://example.com/image.jpg эсвэл /path/to/image.jpg"
              />
              <div className="text-sm text-gray-500 mt-1">
                💡 Зургийг object storage-д байршуулж линкийг энд хуулна уу
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Статистик
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Хэрэглэгчид
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Тоглогчид
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Клубууд
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Тэмцээн
          </TabsTrigger>
          <TabsTrigger value="leagues" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Лиг
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Мэдээ
          </TabsTrigger>
          <TabsTrigger value="sliders" className="flex items-center gap-2">
            <Images className="w-4 h-4" />
            Слайдер
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

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Тоглогчдын удирдлага</CardTitle>
              <CardDescription>Тоглогчдын мэдээлэл, статистик</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPlayersTab()}
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

        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Тэмцээнүүдийн удирдлага</CardTitle>
              <CardDescription>Бүх тэмцээнүүдийг энд харах болон удирдах боломжтой</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Тэмцээнүүд</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open('/admin/tournament-generator', '_blank')}
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
                <div className="flex justify-between items-center">
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
                            <div className="flex gap-2">
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
                <div className="flex justify-between items-center">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Засварлах</DialogTitle>
            <DialogDescription>
              Мэдээллийг шинэчлэнэ үү
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Цуцлах
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}