import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Save, Edit, X, Shield, UserCog, Trophy, Calendar, Phone, Mail, MapPin } from "lucide-react";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatName } from "@/lib/utils";

export default function AdminPlayerDetailsPage() {
  const [match, params] = useRoute("/admin/player/:id");
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuth();

  // Check if user is admin
  if (!isAuthenticated || (currentUser as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-text-primary">Хандах эрхгүй</h1>
          <p className="text-text-secondary mb-4">Зөвхөн админ хэрэглэгч энэ хуудсыг харах боломжтой.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Нүүр хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  // Fetch player data
  const { data: playerData, isLoading } = useQuery({
    queryKey: ["/api/players", params?.id],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch player matches
  const { data: matches = [] } = useQuery({
    queryKey: ["/api/players", params?.id, "matches"],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch tournament matches
  const { data: tournamentMatches = [] } = useQuery({
    queryKey: ["/api/players", params?.id, "tournament-matches"],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/players", params?.id, "achievements"],
    enabled: !!params?.id,
    retry: false,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/admin/users/${params?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Амжилттай шинэчлэгдлээ" });
      queryClient.invalidateQueries({ queryKey: ["/api/players", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Алдаа гарлаа", description: error.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (playerData && isEditing) {
      setEditData({
        firstName: playerData.firstName || '',
        lastName: playerData.lastName || '',
        email: playerData.email || '',
        phone: playerData.phone || '',
        gender: playerData.gender || '',
        dateOfBirth: playerData.dateOfBirth ? new Date(playerData.dateOfBirth).toISOString().split('T')[0] : '',
        bio: playerData.bio || '',
        clubAffiliation: playerData.clubAffiliation || '',
        role: playerData.role || 'player',
        rank: playerData.rank || '',
        wins: playerData.wins || 0,
        losses: playerData.losses || 0,
        memberNumber: playerData.memberNumber || ''
      });
    }
  }, [playerData, isEditing]);

  const handleSave = () => {
    const sanitizedData = Object.fromEntries(
      Object.entries(editData).filter(([, value]) => value !== "" && value !== undefined && value !== null)
    );
    updateMutation.mutate(sanitizedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Тоглогчийн мэдээлэл уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Тоглогч олдсонгүй</h1>
            <Button onClick={() => setLocation("/admin-dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Админ самбар руу буцах
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/admin-dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Админ самбар руу буцах
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Тоглогчийн дэлгэрэнгүй мэдээлэл</h1>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                    <X className="mr-2 h-4 w-4" />
                    Цуцлах
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Засах
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Профайл</TabsTrigger>
            <TabsTrigger value="matches">Тоглолтын түүх</TabsTrigger>
            <TabsTrigger value="achievements">Амжилтууд</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Player Profile Card */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-mtta-green to-mtta-green-dark text-white">
                  <CardContent className="p-6 text-text-primary">
                    <div className="text-center mb-6">
                      {playerData?.profileImageUrl ? (
                        <img 
                          src={playerData.profileImageUrl} 
                          alt="Player profile" 
                          className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                          <User className="h-12 w-12" />
                        </div>
                      )}
                      <h2 className="text-2xl font-bold">{formatName(playerData?.firstName, playerData?.lastName)}</h2>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        <Badge variant="secondary" className="bg-white/20 text-black">
                          {playerData?.role === 'admin' ? 'Админ' : 'Тоглогч'}
                        </Badge>
                        {playerData?.isJudge && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Шүүгч
                          </Badge>
                        )}
                        {playerData?.isCoach && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <UserCog className="w-3 h-3 mr-1" />
                            Дасгалжуулагч
                          </Badge>
                        )}
                      </div>
                      {playerData?.memberNumber && (
                        <p className="text-sm opacity-70 mt-1">Гишүүн №: {playerData.memberNumber}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{playerData?.email}</span>
                      </div>
                      {playerData?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span className="text-sm">{playerData.phone}</span>
                        </div>
                      )}
                      {playerData?.clubAffiliation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{playerData.clubAffiliation}</span>
                        </div>
                      )}
                    </div>

                    {playerData?.rank && (
                      <div className="mt-4">
                        <Badge variant="secondary" className="bg-white/20 text-black">
                          Зэрэг: {playerData.rank}
                        </Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <span className="opacity-80 text-sm">Ялалт:</span>
                        <p className="font-bold text-lg">{playerData?.wins || 0}</p>
                      </div>
                      <div>
                        <span className="opacity-80 text-sm">Хожигдол:</span>
                        <p className="font-bold text-lg">{playerData?.losses || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Edit Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isEditing ? "Мэдээлэл засах" : "Мэдээлэл харах"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">Нэр</Label>
                            <Input
                              id="firstName"
                              value={editData.firstName || ''}
                              onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Овог</Label>
                            <Input
                              id="lastName"
                              value={editData.lastName || ''}
                              onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">И-мэйл</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editData.email || ''}
                              onChange={(e) => setEditData({...editData, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Утас</Label>
                            <Input
                              id="phone"
                              value={editData.phone || ''}
                              onChange={(e) => setEditData({...editData, phone: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="gender">Хүйс</Label>
                            <Select value={editData.gender || ''} onValueChange={(value) => setEditData({...editData, gender: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Хүйс сонгох" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Эрэгтэй</SelectItem>
                                <SelectItem value="female">Эмэгтэй</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dateOfBirth">Төрсөн огноо</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={editData.dateOfBirth || ''}
                              onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="clubAffiliation">Клубын харьяалал</Label>
                          <Input
                            id="clubAffiliation"
                            value={editData.clubAffiliation || ''}
                            onChange={(e) => setEditData({...editData, clubAffiliation: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="bio">Танилцуулга</Label>
                          <Textarea
                            id="bio"
                            value={editData.bio || ''}
                            onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="rank">Зэрэг</Label>
                            <Input
                              id="rank"
                              value={editData.rank || ''}
                              onChange={(e) => setEditData({...editData, rank: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="wins">Ялалт</Label>
                            <Input
                              id="wins"
                              type="number"
                              value={editData.wins || 0}
                              onChange={(e) => setEditData({...editData, wins: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="losses">Хожигдол</Label>
                            <Input
                              id="losses"
                              type="number"
                              value={editData.losses || 0}
                              onChange={(e) => setEditData({...editData, losses: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="memberNumber">Гишүүний дугаар</Label>
                          <Input
                            id="memberNumber"
                            value={editData.memberNumber || ''}
                            onChange={(e) => setEditData({...editData, memberNumber: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="role">Роль</Label>
                          <Select value={editData.role || ''} onValueChange={(value) => setEditData({...editData, role: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Роль сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="player">Тоглогч</SelectItem>
                              <SelectItem value="admin">Админ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-medium text-gray-700">Нэр:</Label>
                            <p className="text-gray-900">{playerData.firstName}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-gray-700">Овог:</Label>
                            <p className="text-gray-900">{playerData.lastName}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-medium text-gray-700">И-мэйл:</Label>
                            <p className="text-gray-900">{playerData.email}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-gray-700">Утас:</Label>
                            <p className="text-gray-900">{playerData.phone || 'Байхгүй'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-medium text-gray-700">Хүйс:</Label>
                            <p className="text-gray-900">{playerData.gender === 'male' ? 'Эрэгтэй' : playerData.gender === 'female' ? 'Эмэгтэй' : 'Тодорхойгүй'}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-gray-700">Төрсөн огноо:</Label>
                            <p className="text-gray-900">
                              {playerData.dateOfBirth ? new Date(playerData.dateOfBirth).toLocaleDateString('mn-MN') : 'Байхгүй'}
                            </p>
                          </div>
                        </div>

                        {playerData.clubAffiliation && (
                          <div>
                            <Label className="font-medium text-gray-700">Клубын харьяалал:</Label>
                            <p className="text-gray-900">{playerData.clubAffiliation}</p>
                          </div>
                        )}

                        {playerData.bio && (
                          <div>
                            <Label className="font-medium text-gray-700">Танилцуулга:</Label>
                            <p className="text-gray-900">{playerData.bio}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="font-medium text-gray-700">Зэрэг:</Label>
                            <p className="text-gray-900">{playerData.rank || 'Байхгүй'}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-gray-700">Ялалт:</Label>
                            <p className="text-gray-900">{playerData.wins || 0}</p>
                          </div>
                          <div>
                            <Label className="font-medium text-gray-700">Хожигдол:</Label>
                            <p className="text-gray-900">{playerData.losses || 0}</p>
                          </div>
                        </div>

                        {playerData.memberNumber && (
                          <div>
                            <Label className="font-medium text-gray-700">Гишүүний дугаар:</Label>
                            <p className="text-gray-900">{playerData.memberNumber}</p>
                          </div>
                        )}

                        <div>
                          <Label className="font-medium text-gray-700">Роль:</Label>
                          <p className="text-gray-900">{playerData.role === 'admin' ? 'Админ' : 'Тоглогч'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Тоглолтын түүх ({matches.length + tournamentMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 && tournamentMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор тоглолтын түүх байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tournamentMatches.map((match: any, index: number) => {
                      const isWinner = match.isWinner;
                      const hasResult = match.result && match.result.trim() !== '';
                      const opponentName = match.opponent?.name ||
                                          (match.opponent?.user ? formatName(match.opponent.user.firstName, match.opponent.user.lastName) :
                                           'Харсагч олдсонгүй');

                      return (
                        <div 
                          key={`tournament-${index}`}
                          className={`p-3 rounded-lg border ${
                            hasResult
                              ? isWinner === true
                                ? 'bg-green-50 border-green-200'
                                : isWinner === false
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 mb-1">
                                {match.tournament?.name || 'Тэмцээн'}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                {match.stage}
                                {match.groupName && ` - ${match.groupName}`}
                              </p>
                              <div className="flex items-center text-sm text-gray-700">
                                <span className="font-medium">vs</span>
                                <span className="ml-2">{opponentName}</span>
                              </div>
                              {match.date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(match.date).toLocaleDateString('mn-MN')}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              {hasResult ? (
                                <>
                                  {isWinner !== undefined ? (
                                    <Badge 
                                      variant={isWinner ? "default" : "destructive"}
                                      className="mb-1"
                                    >
                                      {isWinner ? 'Ялалт' : 'Хожил'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="mb-1">
                                      Тэнцсэн
                                    </Badge>
                                  )}
                                  <p className="text-xs text-gray-600">
                                    {match.result}
                                  </p>
                                  {match.playerWins && (
                                    <p className="text-xs text-gray-500">
                                      Групп: {match.playerWins} | Байр: {match.playerPosition}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline">
                                  Хүлээгдэж буй
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {matches.map((match: any) => (
                      <div key={match.id} className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Ердийн тоглолт</h4>
                            <p className="text-sm text-gray-600">{match.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString('mn-MN') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Амжилтууд ({achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор амжилт байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {achievements.map((achievement: any) => (
                      <div 
                        key={achievement.id}
                        className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center mr-3">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.achievedAt 
                              ? new Date(achievement.achievedAt).toLocaleDateString('mn-MN')
                              : 'Огноо тодорхойгүй'
                            }
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {achievement.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}