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
import { User, Camera, MapPin, Phone, Mail, Calendar, Trophy, Target } from "lucide-react";
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
}

interface Club {
  id: string;
  name: string;
  description?: string;
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
  'Говь-Алтай': ['Алтай', 'Бигэр', 'Чандмань'],
  'Говьсүмбэр': ['Чойр', 'Шивээговь', 'Сүмбэр'],
  'Дорноговь': ['Сайншанд', 'Замын-Үүд', 'Мандах'],
  'Дорнод': ['Чойбалсан', 'Халх гол', 'Матад'],
  'Дундговь': ['Мандалговь', 'Дэлгэрхангай', 'Сайхан'],
  'Завхан': ['Улиастай', 'Тэс', 'Цагаанхайрхан'],
  'Өвөрхангай': ['Арвайхээр', 'Хархорин', 'Бат-Өлзий'],
  'Өмнөговь': ['Даланзадгад', 'Ханбогд', 'Булган'],
  'Сүхбаатар': ['Баруун-Урт', 'Дарьганга', 'Эрдэнэцогт'],
  'Сэлэнгэ': ['Сүхбаатар', 'Алтанбулаг', 'Орхонтуул'],
  'Төв': ['Зуунмод', 'Өндөрхаан', 'Багануур'],
  'Увс': ['Улаангом', 'Өмнөговь', 'Зүүнхангай'],
  'Ховд': ['Ховд', 'Булган', 'Цэцэг'],
  'Хөвсгөл': ['Мөрөн', 'Хатгал', 'Рашаант'],
  'Хэнтий': ['Өндөрхаан', 'Батноров', 'Дэлгэрхан']
};

const RUBBER_TYPES = [
  'Гөлгөр',
  'Short pip',
  'Long pip'
];

const PLAYING_STYLES = [
  'Topspin Attacker (Looper)',
  'Speed Attacker / Power Hitter',
  'Two-Winged Looper',
  'Chopper (Defender)',
  'Blocker / Counter-Attacker',
  'All-Round Player',
  'Penhold Style Player',
  'Pips-Out Attacker',
  'Modern Defender',
  'Combination Style Player'
];

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    rubberTypes: [],
    playingStyles: []
  });
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    enabled: isAuthenticated,
  });

  // Fetch available clubs
  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ['/api/clubs'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest('PUT', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай шинэчиллээ!",
        description: "Таны профайл мэдээлэл амжилттай шинэчлэгдлээ.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Профайл шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Initialize profile data when loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        ...profile,
        rubberTypes: profile.rubberTypes || [],
        playingStyles: profile.playingStyles || []
      });
      
      if (profile.province) {
        setSelectedProvince(profile.province);
        setAvailableCities(MONGOLIA_CITIES[profile.province as keyof typeof MONGOLIA_CITIES] || []);
      }
    }
  }, [profile]);

  // Handle province change
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setAvailableCities(MONGOLIA_CITIES[province as keyof typeof MONGOLIA_CITIES] || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Миний профайл</h1>
          <p className="text-gray-600">Таны хувийн мэдээлэл болон тоглоомын тохиргоо</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Club Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Клубын мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="club">Клуб</Label>
                <Select 
                  value={profileData.clubName || ''} 
                  onValueChange={(clubName) => setProfileData(prev => ({ ...prev, clubName }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Клуб сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.name}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Equipment & Playing Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Тоглоомын мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Handedness */}
              <div>
                <Label className="text-base font-medium">Гар</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="handedness"
                      value="right"
                      checked={profileData.handedness === 'right'}
                      onChange={(e) => setProfileData(prev => ({ ...prev, handedness: e.target.value as 'right' | 'left' }))}
                      className="text-green-600"
                    />
                    <span>Баруун гартай</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="handedness"
                      value="left"
                      checked={profileData.handedness === 'left'}
                      onChange={(e) => setProfileData(prev => ({ ...prev, handedness: e.target.value as 'right' | 'left' }))}
                      className="text-green-600"
                    />
                    <span>Зүүн гартай</span>
                  </label>
                </div>
              </div>

              <Separator />

              {/* Rubber Types */}
              <div>
                <Label className="text-base font-medium">Резинэн төрөл</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  {RUBBER_TYPES.map(rubberType => (
                    <label key={rubberType} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={(profileData.rubberTypes || []).includes(rubberType)}
                        onCheckedChange={(checked) => handleRubberTypeChange(rubberType, checked as boolean)}
                      />
                      <span>{rubberType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

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

          {/* Current Selections Display */}
          {((profileData.rubberTypes && profileData.rubberTypes.length > 0) || 
            (profileData.playingStyles && profileData.playingStyles.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Таны сонголтууд</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.rubberTypes && profileData.rubberTypes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Резинэн төрөл:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profileData.rubberTypes.map(type => (
                        <Badge key={type} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profileData.playingStyles && profileData.playingStyles.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Тоглоомын арга барил:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profileData.playingStyles.map(style => (
                        <Badge key={style} variant="outline">{style}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Буцах
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateProfileMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}