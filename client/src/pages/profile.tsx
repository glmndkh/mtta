import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, User, Camera, MapPin, Phone, Mail, Calendar, Trophy, Target, CreditCard, Users, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name: string;
  gender?: string;
  dateOfBirth?: string;
  clubName?: string;
  profilePicture?: string;
  province?: string;
  city?: string;
  rubberTypes?: string[];
  handedness?: 'right' | 'left';
  playingStyles?: string[];
  bio?: string;
  membershipType?: 'adult' | 'child';
  membershipStartDate?: string;
  membershipEndDate?: string;
  membershipActive?: boolean;
  membershipAmount?: number;
}

interface Club {
  id: string;
  name: string;
  description?: string;
}

interface Membership {
  id: string;
  type: 'adult' | 'child';
  startDate: string;
  endDate: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'registration' | 'ongoing' | 'completed';
}

interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
}

interface Team {
  id: string;
  name: string;
  tournament: string;
  members: string[];
}

// Mongolia provinces (aimags) and major cities
const MONGOLIA_PROVINCES = [
  'Улаанбаатар',
  'Архангай',
  'Баян-Өлгий',
  'Баянхонгор',
  'Булган',
  'Говь-Алтай',
  'Говьсүмбэр',
  'Дархан-Уул',
  'Дорноговь',
  'Дорнод',
  'Дундговь',
  'Завхан',
  'Орхон',
  'Өвөрхангай',
  'Өмнөговь',
  'Сүхбаатар',
  'Сэлэнгэ',
  'Төв',
  'Увс',
  'Ховд',
  'Хөвсгөл',
  'Хэнтий'
];

const MONGOLIA_CITIES = {
  'Улаанбаатар': ['Баянгол дүүрэг', 'Баянзүрх дүүрэг', 'Чингэлтэй дүүрэг', 'Хан-Уул дүүрэг', 'Сонгинохайрхан дүүрэг', 'Сүхбаатар дүүрэг'],
  'Дархан-Уул': ['Дархан', 'Хонгор', 'Орхон'],
  'Орхон': ['Эрдэнэт', 'Баян-Өндөр'],
  'Архангай': ['Цэцэрлэг', 'Цахир', 'Хайрхан'],
  'Баян-Өлгий': ['Өлгий', 'Алтай Таван Богд', 'Буянт'],
  'Баянхонгор': ['Баянхонгор', 'Эрдэнэцогт', 'Жаргалант'],
  'Булган': ['Булган', 'Эрдэнэт', 'Хутаг-Өндөр'],
  'Говь-Алтай': ['Алтай', 'Эрдэнэ', 'Жаргалан'],
  'Говьсүмбэр': ['Чойр', 'Шивээговь', 'Сүмбэр'],
  'Дорноговь': ['Сайншанд', 'Замын-Үүд', 'Мандах'],
  'Дорнод': ['Чойбалсан', 'Халх гол', 'Матад'],
  'Дундговь': ['Мандалговь', 'Дэлгэрхангай', 'Сайхан'],
  'Завхан': ['Улиастай', 'Тэс', 'Алдархаан'],
  'Өвөрхангай': ['Арвайхээр', 'Хархорин', 'Баянгол'],
  'Өмнөговь': ['Даланзадгад', 'Ханбогд', 'Мандал-Овоо'],
  'Сүхбаатар': ['Баруун-Урт', 'Дарьганга', 'Эрдэнэцагаан'],
  'Сэлэнгэ': ['Сүхбаатар', 'Алтанбулаг', 'Орхонтуул'],
  'Төв': ['Зуунмод', 'Эрдэнэ', 'Алтанбулаг'],
  'Увс': ['Улаангом', 'Ховд', 'Цагаантөв'],
  'Ховд': ['Ховд', 'Булган', 'Манхан'],
  'Хөвсгөл': ['Мурэн', 'Ханх', 'Хатгал'],
  'Хэнтий': ['Өндөрхаан', 'Дадал', 'Батширээт']
};

// Rubber types for table tennis
const RUBBER_TYPES = [
  'Гөлгөр резин (Smooth)',
  'Богино хадаастай (Short pips)',
  'Урт хадаастай (Long pips)'
];

// Playing styles
const PLAYING_STYLES = [
  'Довтолгооны тамирчин (Offensive Player)',
  'Хамгаалалтын тамирчин (Defensive Player)',
  'Топспин довтолгооч (Topspin Attacker)',
  'Блокчин (Blocker)',
  'Эргүүлгийн мастер (Loop Driver)',
  'Хурдны довтолгооч (Speed Attacker)',
  'Хяналтын тамирчин (Control Player)',
  'Холын зайны тамирчин (Distance Player)',
  'Ойрын зайны тамирчин (Close-to-table Player)',
  'Хольц загварын тамирчин (Combination Style Player)'
];

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    rubberTypes: [],
    playingStyles: []
  });

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const availableCities = selectedProvince ? (MONGOLIA_CITIES as any)[selectedProvince] || [] : [];

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: isAuthenticated
  });

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['/api/clubs'],
    enabled: isAuthenticated
  });

  // Mock data for tournaments and matches (to be replaced with real API calls)
  const { data: tournaments = [] } = useQuery({
    queryKey: ['/api/user/tournaments'],
    enabled: !!profile,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['/api/user/matches'],
    enabled: !!profile,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/user/teams'],
    enabled: !!profile,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserProfile) => apiRequest(`/api/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Амжилттай!",
        description: "Профайл амжилттай шинэчлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: "Алдаа гарлаа",
        description: error?.message || "Профайл шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  // Buy membership mutation
  const buyMembershipMutation = useMutation({
    mutationFn: (type: 'adult' | 'child') => apiRequest(`/api/user/membership`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),
    onSuccess: () => {
      toast({
        title: "Амжилттай!",
        description: "Гишүүнчлэл амжилттай худалдаж авлаа",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error?.message || "Гишүүнчлэл худалдаж авахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  // Initialize profile data when loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        id: profile.id || '',
        email: profile.email || '',
        phone: profile.phone || '',
        name: profile.name || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        clubName: profile.clubName || '',
        profilePicture: profile.profilePicture || '',
        province: profile.province || '',
        city: profile.city || '',
        rubberTypes: profile.rubberTypes || [],
        handedness: profile.handedness || 'right',
        playingStyles: profile.playingStyles || [],
        bio: profile.bio || '',
        membershipType: profile.membershipType || 'adult',
        membershipStartDate: profile.membershipStartDate || '',
        membershipEndDate: profile.membershipEndDate || '',
        membershipActive: profile.membershipActive || false,
        membershipAmount: profile.membershipAmount || 0
      });
      setSelectedProvince(profile.province || '');
    }
  }, [profile]);

  // Handle province change
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setProfileData(prev => ({ 
      ...prev, 
      province,
      city: '' // Reset city when province changes
    }));
  };

  // Handle checkbox changes
  const handleRubberTypeChange = (rubberType: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      rubberTypes: checked 
        ? [...(prev.rubberTypes || []), rubberType]
        : (prev.rubberTypes || []).filter(type => type !== rubberType)
    }));
  };

  const handlePlayingStyleChange = (style: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      playingStyles: checked 
        ? [...(prev.playingStyles || []), style]
        : (prev.playingStyles || []).filter(s => s !== style)
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <p>Профайл хуудас үзэхийн тулд нэвтэрнэ үү</p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="mt-4"
              >
                Нэвтрэх
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  const isActive = profile?.membershipActive;
  const membershipEndDate = profile?.membershipEndDate ? new Date(profile.membershipEndDate) : null;
  const isExpiringSoon = membershipEndDate && membershipEndDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.profilePicture} alt={profile?.name} />
                    <AvatarFallback className="text-2xl">
                      {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    {profile?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.province && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.province}{profile?.city && `, ${profile.city}`}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {isActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Идэвхтэй гишүүн
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Идэвхгүй гишүүн
                      </Badge>
                    )}
                    {isExpiringSoon && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Удахгүй дуусах
                      </Badge>
                    )}
                  </div>
                  {profile?.bio && (
                    <p className="mt-3 text-gray-700">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Хувийн мэдээлэл</TabsTrigger>
              <TabsTrigger value="membership">Гишүүнчлэл</TabsTrigger>
              <TabsTrigger value="tournaments">Тэмцээн</TabsTrigger>
              <TabsTrigger value="history">Түүх</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Профайл зураг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileData.profilePicture} />
                        <AvatarFallback className="text-2xl">
                          {profileData.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                          id="profile-picture"
                        />
                        <label
                          htmlFor="profile-picture"
                          className="cursor-pointer inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Зураг солих
                        </label>
                        <p className="text-sm text-gray-500 mt-2">JPG, PNG файл байх ёстой</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Үндсэн мэдээлэл
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Нэр</Label>
                        <Input
                          id="name"
                          value={profileData.name || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Таны нэрийг оруулна уу"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth">Төрсөн огноо</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileData.dateOfBirth || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">И-мэйл</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="example@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Утасны дугаар</Label>
                        <Input
                          id="phone"
                          value={profileData.phone || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="99123456"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Товч танилцуулга</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Өөрийгөө товчхон танилцуулна уу..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Байршил
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="province">Аймаг/Хот</Label>
                        <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Аймаг/Хот сонгоно уу" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONGOLIA_PROVINCES.map(province => (
                              <SelectItem key={province} value={province}>{province}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="city">Сум/Дүүрэг</Label>
                        <Select 
                          value={profileData.city || ''} 
                          onValueChange={(city) => setProfileData(prev => ({ ...prev, city }))}
                          disabled={!selectedProvince}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Сум/Дүүрэг сонгоно уу" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment and Playing Style */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Тоглоомын тохиргоо
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Gender Selection */}
                    <div>
                      <Label className="text-base font-medium">Хүйс</Label>
                      <Select value={profileData.gender || ''} onValueChange={(gender) => setProfileData(prev => ({ ...prev, gender }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Хүйс сонгоно уу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Эрэгтэй</SelectItem>
                          <SelectItem value="female">Эмэгтэй</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Handedness Selection */}
                    <div>
                      <Label className="text-base font-medium">Гарын сонголт</Label>
                      <Select value={profileData.handedness || 'right'} onValueChange={(handedness) => setProfileData(prev => ({ ...prev, handedness: handedness as 'right' | 'left' }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Гарын сонголт" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">Баруун гар</SelectItem>
                          <SelectItem value="left">Зүүн гар</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rubber Types */}
                    <div>
                      <Label className="text-base font-medium">Резинэн төрөл</Label>
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        {RUBBER_TYPES.map(rubberType => (
                          <label key={rubberType} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={(profileData.rubberTypes || []).includes(rubberType)}
                              onCheckedChange={(checked) => handleRubberTypeChange(rubberType, checked as boolean)}
                            />
                            <span className="text-sm">{rubberType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Playing Styles */}
                    <div>
                      <Label className="text-base font-medium">Тоглоомын арга барил</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {PLAYING_STYLES.map(style => (
                          <label key={style} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={(profileData.playingStyles || []).includes(style)}
                              onCheckedChange={(checked) => handlePlayingStyleChange(style, checked as boolean)}
                            />
                            <span className="text-sm">{style}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateProfileMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Membership Tab */}
            <TabsContent value="membership" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Гишүүнчлэлийн мэдээлэл
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Одоогийн төлөв</h3>
                      <p className="text-sm text-gray-600">
                        {isActive ? 'Идэвхтэй гишүүн' : 'Идэвхгүй гишүүн'}
                      </p>
                      {membershipEndDate && (
                        <p className="text-sm text-gray-500">
                          Дуусах огноо: {membershipEndDate.toLocaleDateString('mn-MN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Идэвхтэй
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Идэвхгүй
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!isActive && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-medium text-orange-800">Гишүүнчлэл худалдаж авах</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Тэмцээнд оролцохын тулд идэвхтэй гишүүнчлэлтэй байх ёстой.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Button
                          onClick={() => buyMembershipMutation.mutate('adult')}
                          disabled={buyMembershipMutation.isPending}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Насанд хүрэгчдийн гишүүнчлэл худалдаж авах
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => buyMembershipMutation.mutate('child')}
                          disabled={buyMembershipMutation.isPending}
                        >
                          Хүүхдийн гишүүнчлэл худалдаж авах
                        </Button>
                      </div>
                    </div>
                  )}

                  {profile?.membershipStartDate && (
                    <div>
                      <h3 className="font-medium mb-2">Гишүүнчлэлийн түүх</h3>
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Төрөл: {profile.membershipType === 'adult' ? 'Насанд хүрэгч' : 'Хүүхэд'}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(profile.membershipStartDate).toLocaleDateString('mn-MN')} - 
                            {membershipEndDate?.toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                        {profile.membershipAmount && (
                          <p className="text-sm text-gray-600 mt-1">
                            Төлсөн дүн: {profile.membershipAmount.toLocaleString()} ₮
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournaments Tab */}
            <TabsContent value="tournaments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Бүртгүүлсэн тэмцээнүүд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tournaments.length > 0 ? (
                    <div className="space-y-3">
                      {tournaments.map((tournament: Tournament) => (
                        <div key={tournament.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{tournament.name}</h3>
                              <p className="text-sm text-gray-600">{tournament.location}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(tournament.startDate).toLocaleDateString('mn-MN')} - 
                                {new Date(tournament.endDate).toLocaleDateString('mn-MN')}
                              </p>
                            </div>
                            <Badge variant={
                              tournament.status === 'completed' ? 'default' :
                              tournament.status === 'ongoing' ? 'secondary' : 'outline'
                            }>
                              {tournament.status === 'completed' ? 'Дууссан' :
                               tournament.status === 'ongoing' ? 'Явагдаж байгаа' : 'Бүртгэл'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Бүртгүүлсэн тэмцээн байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Багийн гишүүнчлэл
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teams.length > 0 ? (
                    <div className="space-y-3">
                      {teams.map((team: Team) => (
                        <div key={team.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                              <p className="text-sm text-gray-600">{team.tournament}</p>
                              <p className="text-sm text-gray-500">
                                Гишүүд: {team.members.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Багийн гишүүнчлэл байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Тэмцээний түүх
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group matches by tournament */}
                      {Object.entries(
                        matches.reduce((acc: any, match: Match) => {
                          if (!acc[match.tournamentName]) {
                            acc[match.tournamentName] = [];
                          }
                          acc[match.tournamentName].push(match);
                          return acc;
                        }, {})
                      ).map(([tournamentName, tournamentMatches]) => (
                        <div key={tournamentName} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-3">{tournamentName}</h3>
                          <div className="space-y-2">
                            {(tournamentMatches as Match[]).map((match: Match) => (
                              <div key={match.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="text-sm">vs {match.opponent}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {new Date(match.date).toLocaleDateString('mn-MN')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{match.score}</span>
                                  <Badge variant={match.result === 'win' ? 'default' : 'destructive'}>
                                    {match.result === 'win' ? 'Ялалт' : 'Ялагдал'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Тэмцээний түүх байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}