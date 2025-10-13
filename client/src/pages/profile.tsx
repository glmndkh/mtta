import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
import { AlertCircle, CheckCircle, Clock, User, Camera, MapPin, Phone, Mail, Calendar, Trophy, Target, CreditCard, Users, History, Shield, UserCog, Upload, FileImage } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/ThemeContext";
import { formatName } from "@/lib/utils";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getImageUrl } from "@/lib/utils";

interface PlayerStats {
  rank?: string;
  points?: number;
  achievements?: string;
  wins?: number;
  losses?: number;
  memberNumber?: string;
}

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name: string;
  firstName?: string;
  lastName?: string;
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
  isJudge?: boolean;
  judgeType?: string;
  isCoach?: boolean;
  playerStats?: PlayerStats;
}

interface UpdateProfilePayload {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  clubName?: string;
  profilePicture?: string;
  province?: string;
  city?: string;
  rubberTypes?: string[];
  handedness?: "right" | "left";
  playingStyles?: string[];
  bio?: string;
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
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    firstName: '',
    lastName: '',
    rubberTypes: [],
    playingStyles: []
  });

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [showRankChangeForm, setShowRankChangeForm] = useState(false);
  const [newRank, setNewRank] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<UpdateProfilePayload | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Valid ranks for selection
  const validRanks = [
    "зэрэггүй",
    "3-р зэрэг",
    "2-р зэрэг", 
    "1-р зэрэг",
    "спортын дэд мастер",
    "спортын мастер",
    "олон улсын хэмжээний мастер"
  ];

  // Get available cities based on selected province OR the profile's province (for initial load)
  const province = selectedProvince || profileData.province;
  const availableCities = province ? (MONGOLIA_CITIES as any)[province] || [] : [];

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    enabled: isAuthenticated
  });

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['/api/clubs'],
    enabled: isAuthenticated
  });

  // Mock data for tournaments and matches (to be replaced with real API calls)
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/user/tournaments'],
    enabled: !!profile,
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/user/matches'],
    enabled: !!profile,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/user/teams'],
    enabled: !!profile,
  });

  const { data: medals = [] } = useQuery<any[]>({
    queryKey: ['/api/user/medals'],
    enabled: !!profile,
  });

  // Fetch user's rank change requests
  const { data: rankChangeRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/rank-change-requests/me'],
    enabled: !!profile,
  });

  // Submit rank change request mutation
  const submitRankChangeRequest = useMutation({
    mutationFn: async (data: { requestedRank: string; proofImageUrl: string }) => {
      return apiRequest('/api/rank-change-request', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай!",
        description: "Зэрэг өөрчлөх хүсэлт амжилттай илгээгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rank-change-requests/me'] });
      setShowRankChangeForm(false);
      setNewRank('');
      setProofImageUrl('');
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error?.message || "Хүсэлт илгээхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) => apiRequest(`/api/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Амжилттай!",
        description: "Профайл амжилттай шинэчлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setPendingProfileUpdate(null);
      setIsConfirmDialogOpen(false);
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
      const newProfileData = {
        id: profile.id || '',
        email: profile.email || '',
        phone: profile.phone || '',
        name: profile.name || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        clubName: profile.clubName || '',
        profilePicture: profile.profilePicture ? getImageUrl(profile.profilePicture) : '',
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
      };

      setProfileData(newProfileData);
      setSelectedProvince(profile.province || '');

      // Debug log to check what values we're getting
      console.log('Profile loaded - province:', profile.province, 'city:', profile.city);
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
  const buildProfileUpdatePayload = (): UpdateProfilePayload => ({
    name: profileData.name?.trim() || '',
    firstName: profileData.firstName?.trim() || '',
    lastName: profileData.lastName?.trim() || '',
    email: profileData.email?.trim() || '',
    phone: profileData.phone?.trim() || '',
    gender: profileData.gender,
    dateOfBirth: profileData.dateOfBirth,
    clubName: profileData.clubName,
    profilePicture: profileData.profilePicture,
    province: profileData.province,
    city: profileData.city,
    rubberTypes: profileData.rubberTypes || [],
    handedness: profileData.handedness,
    playingStyles: profileData.playingStyles || [],
    bio: profileData.bio,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildProfileUpdatePayload();
    setPendingProfileUpdate(payload);
    setIsConfirmDialogOpen(true);
  };

  // Get upload parameters for profile picture
  const getProfilePictureUploadParams = async () => {
    const response = await apiRequest('/api/objects/upload', { method: 'POST' });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  // Handle profile picture upload completion
  const handleProfilePictureUploadComplete = async (result: any) => {
    if (result.successful && result.successful[0]) {
      const fileURL = result.successful[0].uploadURL;
      
      try {
        const aclResponse = await apiRequest('/api/objects/finalize', {
          method: 'PUT',
          body: JSON.stringify({
            fileURL,
            isPublic: true
          })
        });
        
        if (aclResponse.ok) {
          const aclData = await aclResponse.json();
          const newProfilePicture = aclData.objectPath;
          
          // Update local state
          setProfileData(prev => ({
            ...prev,
            profilePicture: newProfilePicture
          }));
          
          // Save to database
          updateProfileMutation.mutate({
            name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
            email: profileData.email || '',
            phone: profileData.phone,
            profilePicture: newProfilePicture,
            gender: profileData.gender,
            dateOfBirth: profileData.dateOfBirth,
            clubName: profileData.clubName,
            province: profileData.province,
            city: profileData.city,
            rubberTypes: profileData.rubberTypes,
            handedness: profileData.handedness,
            playingStyles: profileData.playingStyles,
            bio: profileData.bio,
          }, {
            onSuccess: () => {
              toast({
                title: "Амжилттай",
                description: "Профайл зураг амжилттай хадгалагдлаа"
              });
            }
          });
        }
      } catch (error) {
        console.error('Error setting ACL:', error);
        toast({
          title: "Анхааруулга",
          description: "Зураг байршуулагдсан боловч хадгалахад алдаа гарлаа",
          variant: "destructive"
        });
      }
    }
  };

  const confirmProfileUpdate = () => {
    if (!pendingProfileUpdate) return;
    updateProfileMutation.mutate(pendingProfileUpdate, {
      onSuccess: () => {
        setIsEditMode(false);
      }
    });
  };

  const profilePicturePreview = useMemo(() => {
    if (!profileData.profilePicture) return '';
    return getImageUrl(profileData.profilePicture);
  }, [profileData.profilePicture]);

  const pendingProfilePicture = useMemo(() => {
    if (!pendingProfileUpdate?.profilePicture) return '';
    return getImageUrl(pendingProfileUpdate.profilePicture);
  }, [pendingProfileUpdate?.profilePicture]);

  // Handle rank change request submission
  const handleRankChangeSubmit = () => {
    if (!newRank || !proofImageUrl) {
      toast({
        title: "Алдаа",
        description: "Зэрэг болон баталгаажуулах зураг заавал оруулна уу",
        variant: "destructive"
      });
      return;
    }

    submitRankChangeRequest.mutate({
      requestedRank: newRank,
      proofImageUrl
    });
  };

  // Get upload parameters for proof image
  const getProofImageUploadParams = async () => {
    const response = await apiRequest('/api/objects/upload', { method: 'POST' });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  // Handle proof image upload completion
  const handleProofImageUploadComplete = async (result: any) => {
    if (result.successful && result.successful[0]) {
      const fileURL = result.successful[0].uploadURL;
      
      // Set ACL policy to make image accessible
      try {
        const aclResponse = await apiRequest('/api/objects/finalize', {
          method: 'PUT',
          body: JSON.stringify({
            fileURL,
            isPublic: false // Private for admin review
          })
        });
        
        if (aclResponse.ok) {
          const aclData = await aclResponse.json();
          setProofImageUrl(aclData.objectPath);
          toast({
            title: "Амжилттай",
            description: "Зураг амжилттай байршуулагдлаа"
          });
        }
      } catch (error) {
        console.error('Error setting ACL:', error);
        toast({
          title: "Анхааруулга",
          description: "Зураг байршуулагдсан боловч эрх тохируулахад алдаа гарлаа",
          variant: "destructive"
        });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
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
      <div className="profile-container">
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
    <div className="profile-container">
      <Navigation />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card className="theme-card">
            <CardContent className="pt-6">
              <div className="flex justify-end mb-4">
                {!isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <UserCog className="w-4 h-4" />
                    Мэдээлэл засах
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setIsEditMode(false);
                        if (profile) {
                          setProfileData({
                            id: profile.id || '',
                            email: profile.email || '',
                            phone: profile.phone || '',
                            name: profile.name || '',
                            firstName: profile.firstName || '',
                            lastName: profile.lastName || '',
                            gender: profile.gender || '',
                            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                            clubName: profile.clubName || '',
                            profilePicture: profile.profilePicture ? getImageUrl(profile.profilePicture) : '',
                            province: profile.province || '',
                            city: profile.city || '',
                            rubberTypes: profile.rubberTypes || [],
                            handedness: profile.handedness || 'right',
                            playingStyles: profile.playingStyles || [],
                            bio: profile.bio || '',
                          });
                          setSelectedProvince(profile.province || '');
                        }
                      }}
                      variant="outline"
                    >
                      Цуцлах
                    </Button>
                    <Button
                      onClick={() => {
                        const payload = buildProfileUpdatePayload();
                        setPendingProfileUpdate(payload);
                        setIsConfirmDialogOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={profile?.profilePicture ? getImageUrl(profile.profilePicture) : undefined}
                      alt={profile?.firstName}
                    />
                    <AvatarFallback className="text-2xl">
                      {(profile?.lastName?.[0] || '') + (profile?.firstName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold theme-text">{formatName(profile?.firstName, profile?.lastName)}</h1>
                    {/* Tournament Medals */}
                    {medals && medals.map((medal: any) => (
                      <div key={`${medal.tournamentId}-${medal.medalType}`} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        medal.medalType === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        medal.medalType === 'silver' ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`} title={`${medal.tournamentName} - ${medal.position}-р байр`}>
                        <span className={
                          medal.medalType === 'gold' ? 'text-yellow-600' :
                          medal.medalType === 'silver' ? 'text-gray-600' :
                          'text-amber-600'
                        }>
                          {medal.medalType === 'gold' ? '🥇' : medal.medalType === 'silver' ? '🥈' : '🥉'}
                        </span>
                        {medal.medal}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm theme-text-secondary">
                    {/* Contact info and club info are now completely hidden from display */}
                    {profile?.gender && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{profile.gender === 'male' ? 'Эрэгтэй' : profile.gender === 'female' ? 'Эмэгтэй' : 'Бусад'}</span>
                      </div>
                    )}
                    {profile?.dateOfBirth && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{calculateAge(profile.dateOfBirth)} нас</span>
                      </div>
                    )}
                    {profile?.playerStats?.rank && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span>{profile.playerStats.rank}</span>
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
                    {profile?.playerStats && profile.playerStats.rank && profile.playerStats.rank !== "Зэрэггүй" && (
                      <Badge variant="secondary">
                        <User className="w-3 h-3 mr-1" />
                        Тоглогч
                      </Badge>
                    )}
                    {profile?.isJudge && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Шүүгч
                      </Badge>
                    )}
                    {profile?.isCoach && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <UserCog className="w-3 h-3 mr-1" />
                        Дасгалжуулагч
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

          {/* Player Statistics - Only show for players */}
          {profile?.playerStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Тоглогчийн статистик
                  </div>
                  {!showRankChangeForm && !rankChangeRequests.find((req: any) => req.status === 'pending') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowRankChangeForm(true)}
                      className="text-sm"
                    >
                      Зэрэг өөрчлөх
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {profile.playerStats.memberNumber && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile.playerStats.memberNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Гишүүний дугаар</div>
                    </div>
                  )}

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {profile.playerStats.rank || 'Зэрэггүй'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Зэрэглэл</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {profile.playerStats.points || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Оноо</div>
                  </div>

                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {profile.playerStats.wins || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Хожил</div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {profile.playerStats.losses || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Ялагдал</div>
                  </div>
                </div>

                {/* Rank Change Form */}
                {showRankChangeForm && (
                  <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-4">Зэрэг өөрчлөх хүсэлт</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newRank">Шинэ зэрэг</Label>
                        <Select value={newRank} onValueChange={setNewRank}>
                          <SelectTrigger>
                            <SelectValue placeholder="Зэрэг сонгоно уу" />
                          </SelectTrigger>
                          <SelectContent>
                            {validRanks.map(rank => (
                              <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Зэрэгийн үнэмлэхийн зураг</Label>
                        <div className="mt-2">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5 * 1024 * 1024} // 5MB
                            onGetUploadParameters={getProofImageUploadParams}
                            onComplete={handleProofImageUploadComplete}
                            buttonClassName="w-full"
                          >
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              {proofImageUrl ? 'Зураг солих' : 'Зураг оруулах'}
                            </div>
                          </ObjectUploader>
                          {proofImageUrl && (
                            <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Зураг амжилттай байршуулагдлаа
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleRankChangeSubmit}
                          disabled={submitRankChangeRequest.isPending || !newRank || !proofImageUrl}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {submitRankChangeRequest.isPending ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowRankChangeForm(false);
                            setNewRank('');
                            setProofImageUrl('');
                          }}
                        >
                          Цуцлах
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rank Change Requests Status */}
                {rankChangeRequests.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Зэрэг өөрчлөх хүсэлтүүд</h4>
                    <div className="space-y-2">
                      {rankChangeRequests.map((request: any) => (
                        <div key={request.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{request.currentRank} → {request.requestedRank}</span>
                              <p className="text-sm text-gray-600">
                                {new Date(request.createdAt).toLocaleDateString('mn-MN')}
                              </p>
                            </div>
                            <Badge variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {request.status === 'approved' ? 'Батлагдсан' :
                               request.status === 'rejected' ? 'Цуцлагдсан' : 'Хүлээгдэж буй'}
                            </Badge>
                          </div>
                          {request.adminNotes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Админ тайлбар:</strong> {request.adminNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.playerStats.achievements && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Амжилтууд
                    </h4>
                    <p className="text-purple-800">{profile.playerStats.achievements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 theme-tabs">
              <TabsTrigger value="profile" className="text-base theme-tab-trigger">Хувийн мэдээлэл</TabsTrigger>
              <TabsTrigger value="membership" className="text-base theme-tab-trigger">Гишүүнчлэл</TabsTrigger>
              <TabsTrigger value="tournaments" className="text-base theme-tab-trigger">Тэмцээн</TabsTrigger>
              <TabsTrigger value="history" className="text-base theme-tab-trigger">Түүх</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {!isEditMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Мэдээллээ засахын тулд дээр байрлах "Мэдээлэл засах" товчийг дарна уу.
                  </p>
                </div>
              )}
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
                        <AvatarImage src={profilePicturePreview || undefined} />
                        <AvatarFallback className="text-2xl">
                          {profileData.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5 * 1024 * 1024}
                          onGetUploadParameters={getProfilePictureUploadParams}
                          onComplete={handleProfilePictureUploadComplete}
                          buttonClassName="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Зураг солих
                        </ObjectUploader>
                        <p className="text-sm text-gray-500 mt-2">JPG, PNG файл байх ёстой (Хамгийн ихдээ 5MB)</p>
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
                        <Label htmlFor="lastName" className="text-white">Овог</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Овгийг оруулна уу"
                          className="input-dark"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="firstName" className="text-white">Нэр</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Нэрийг оруулна уу"
                          className="input-dark"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-white">Төрсөн огноо</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileData.dateOfBirth || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="input-dark"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white">И-мэйл</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="example@email.com"
                          className="input-dark"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-white">Утасны дугаар</Label>
                        <Input
                          id="phone"
                          value={profileData.phone || ''}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="99123456"
                          className="input-dark"
                          disabled={!isEditMode}
                        />
                      </div>
                      {isEditMode && (
                        <div>
                          <Label htmlFor="clubName" className="text-white">Клуб</Label>
                          <Input
                            id="clubName"
                            value={profileData.clubName || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, clubName: e.target.value }))}
                            placeholder="Клубын нэр"
                            className="input-dark"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-white">Товч танилцуулга</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Өөрийгөө товчхон танилцуулна уу..."
                        rows={3}
                        className="input-dark"
                        disabled={!isEditMode}
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
                        <Label htmlFor="province" className="text-white">Аймаг/Хот</Label>
                        <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={!isEditMode}>
                          <SelectTrigger className="input-dark">
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
                        <Label htmlFor="city" className="text-white">Сум/Дүүрэг</Label>
                        <Select 
                          value={profileData.city} 
                          onValueChange={(city) => setProfileData(prev => ({ ...prev, city }))}
                          disabled={!isEditMode || (!selectedProvince && !profileData.province)}
                        >
                          <SelectTrigger className="input-dark">
                            <SelectValue placeholder="Сум/Дүүрэг сонгоно уу" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map((city: string) => (
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
                      <Select value={profileData.gender || ''} onValueChange={(gender) => setProfileData(prev => ({ ...prev, gender }))} disabled={!isEditMode}>
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
                      <Select value={profileData.handedness || 'right'} onValueChange={(handedness) => setProfileData(prev => ({ ...prev, handedness: handedness as 'right' | 'left' }))} disabled={!isEditMode}>
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
                          <label key={rubberType} className={`flex items-center space-x-2 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                            <Checkbox
                              checked={(profileData.rubberTypes || []).includes(rubberType)}
                              onCheckedChange={(checked) => handleRubberTypeChange(rubberType, checked as boolean)}
                              disabled={!isEditMode}
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
                          <label key={style} className={`flex items-center space-x-2 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                            <Checkbox
                              checked={(profileData.playingStyles || []).includes(style)}
                              onCheckedChange={(checked) => handlePlayingStyleChange(style, checked as boolean)}
                              disabled={!isEditMode}
                            />
                            <span className="text-sm">{style}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                  <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                    <div>
                      <h3 className="font-medium text-white">Одоогийн төлөв</h3>
                      <p className="text-sm text-gray-300">
                        {isActive ? 'Идэвхтэй гишүүн' : 'Идэвхгүй гишүүн'}
                      </p>
                      {membershipEndDate && (
                        <p className="text-sm text-gray-400">
                          Дуусах огноо: {membershipEndDate.toLocaleDateString('mn-MN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Badge className="bg-green-700 text-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Идэвхтэй
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-700 text-red-100">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Идэвхгүй
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!isActive && (
                    <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-600">
                      <h3 className="font-medium text-orange-300">Гишүүнчлэл худалдаж авах</h3>
                      <p className="text-sm text-orange-400 mt-1">
                        Тэмцээнд оролцохын тулд идэвхтэй гишүүнчлэлтэй байх ёстой.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Button
                          onClick={() => buyMembershipMutation.mutate('adult')}
                          disabled={buyMembershipMutation.isPending}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Насанд хүрэгчдийн гишүүнчлэл худалдаж авах
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => buyMembershipMutation.mutate('child')}
                          disabled={buyMembershipMutation.isPending}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Хүүхдийн гишүүнчлэл худалдаж авах
                        </Button>
                      </div>
                    </div>
                  )}

                  {profile?.membershipStartDate && (
                    <div>
                      <h3 className="font-medium mb-2 text-white">Гишүүнчлэлийн түүх</h3>
                      <div className="border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Төрөл: {profile.membershipType === 'adult' ? 'Насанд хүрэгч' : 'Хүүхэд'}</span>
                          <span className="text-sm text-gray-400">
                            {new Date(profile.membershipStartDate).toLocaleDateString('mn-MN')} - 
                            {membershipEndDate?.toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                        {profile.membershipAmount && (
                          <p className="text-sm text-gray-300 mt-1">
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
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="w-5 h-5 text-green-400" />
                    Бүртгүүлсэн тэмцээнүүд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tournaments.length > 0 ? (
                    <div className="space-y-3">
                      {tournaments.map((tournament: Tournament) => (
                        <div key={tournament.id} className="border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">{tournament.name}</h3>
                              <p className="text-sm text-gray-300">{tournament.location}</p>
                              <p className="text-sm text-gray-400">
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
                    <p className="text-center text-gray-400 py-8">
                      Бүртгүүлсэн тэмцээн байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-green-400" />
                    Багийн гишүүнчлэл
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teams.length > 0 ? (
                    <div className="space-y-3">
                      {teams.map((team: Team) => (
                        <div key={team.id} className="border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">{team.name}</h3>
                              <p className="text-sm text-gray-300">{team.tournament}</p>
                              <p className="text-sm text-gray-400">
                                Гишүүд: {team.members.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      Багийн гишүүнчлэл байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-green-400" />
                    Тоглолтын түүх
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group matches by tournament */}
                      {Object.entries(
                        matches.reduce((acc: any, match: any) => {
                          const tournamentName = match.tournamentName || 'Тодорхойгүй тэмцээн';
                          if (!acc[tournamentName]) {
                            acc[tournamentName] = [];
                          }
                          acc[tournamentName].push(match);
                          return acc;
                        }, {})
                      ).map(([tournamentName, tournamentMatches]) => (
                        <div key={tournamentName} className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                          <h3 className="font-medium mb-3 text-white">{tournamentName}</h3>
                          <div className="space-y-3">
                            {(tournamentMatches as any[]).map((match: any, index: number) => {
                              const opponentName = typeof match.opponent === 'string' ? match.opponent : 
                                                 typeof match.opponent === 'object' ? match.opponent?.name || 'Тодорхойгүй' : 
                                                 'Тодорхойгүй';

                              // Parse score from match.score (format like "3:2" or "2-1")
                              let playerScore = '';
                              let opponentScore = '';
                              if (match.score && match.score !== 'N/A') {
                                const scoreMatch = match.score.match(/(\d+)[-:](\d+)/);
                                if (scoreMatch) {
                                  if (match.result === 'win') {
                                    playerScore = Math.max(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                                    opponentScore = Math.min(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                                  } else {
                                    playerScore = Math.min(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                                    opponentScore = Math.max(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                                  }
                                }
                              }

                              return (
                                <div 
                                  key={match.id || index} 
                                  className={`bg-gray-800/70 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                    match.result === 'win' ? 'border-2 border-green-500' : 
                                    match.result === 'loss' ? 'border-2 border-red-500' : 'border border-gray-600'
                                  }`}
                                >
                                  <div className="flex">
                                    {/* Accent line */}
                                    <div className={`w-1 rounded-l-lg flex-shrink-0 ${
                                      match.result === 'win' ? 'bg-green-500' : 
                                      match.result === 'loss' ? 'bg-red-500' : 'bg-gray-500'
                                    }`}></div>

                                    {/* Content */}
                                    <div className="flex-1 p-4">
                                      {/* Date and match info */}
                                      <div className="text-sm text-gray-300 mb-3">
                                        {match.date && (
                                          <span>
                                            {new Date(match.date).toLocaleDateString('mn-MN')} • 
                                          </span>
                                        )}
                                        <span className="ml-1">
                                          {tournamentName} • {match.stage === 'group' ? 'Групийн шат' : 
                                           match.matchType === 'Хүрэл медалийн тоглолт' ? 'Хүрэл медалийн тоглолт' : 
                                           'Шууд хасагдах шат'}
                                        </span>
                                      </div>

                                      {/* Match result */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 text-right pr-4">
                                          <button
                                            onClick={() => setLocation(`/profile`)}
                                            className="text-lg font-semibold text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                                          >
                                            {profile?.name}
                                          </button>
                                        </div>

                                        {playerScore && opponentScore ? (
                                          <div className="text-xl font-bold text-white px-4">
                                            {playerScore} : {opponentScore}
                                          </div>
                                        ) : (
                                          <div className="text-gray-400 px-4">
                                            - : -
                                          </div>
                                        )}

                                        <div className="flex-1 text-left pl-4">
                                          {typeof match.opponent === 'object' && match.opponent?.user ? (
                                            <button
                                              onClick={() => setLocation(`/player-profile/${match.opponent.userId || match.opponent.user?.id}`)}
                                              className="text-lg font-semibold text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                                            >
                                              {opponentName}
                                            </button>
                                          ) : (
                                            <span className="text-lg font-semibold text-white">
                                              {opponentName}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      Тоглолтын түүх байхгүй байна
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (updateProfileMutation.isPending) return;
          if (!open) {
            setPendingProfileUpdate(null);
          }
          setIsConfirmDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Мэдээллээ шинэчлэх үү?</AlertDialogTitle>
            <AlertDialogDescription>
              Та профайлын мэдээлэлдээ хийсэн өөрчлөлтүүдээ баталгаажуулах гэж байна. Дараах мэдээлэл хадгалагдана:
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingProfileUpdate && (
            <div className="mt-4 space-y-3 rounded-lg border border-gray-700 bg-gray-900/80 p-4 text-sm text-gray-200">
              <div>
                <span className="font-semibold text-white">Овог:</span> {pendingProfileUpdate.lastName || '—'}
              </div>
              <div>
                <span className="font-semibold text-white">Нэр:</span> {pendingProfileUpdate.firstName || '—'}
              </div>
              <div>
                <span className="font-semibold text-white">И-мэйл:</span> {pendingProfileUpdate.email || '—'}
              </div>
              <div>
                <span className="font-semibold text-white">Утас:</span> {pendingProfileUpdate.phone || '—'}
              </div>
              {pendingProfileUpdate.clubName && (
                <div>
                  <span className="font-semibold text-white">Клуб:</span> {pendingProfileUpdate.clubName}
                </div>
              )}
              <div>
                <span className="font-semibold text-white">Байршил:</span> {pendingProfileUpdate.province || '—'}
                {pendingProfileUpdate.city ? `, ${pendingProfileUpdate.city}` : ''}
              </div>
              <div>
                <span className="font-semibold text-white">Хүйс:</span> {pendingProfileUpdate.gender ? (pendingProfileUpdate.gender === 'male' ? 'Эрэгтэй' : pendingProfileUpdate.gender === 'female' ? 'Эмэгтэй' : 'Бусад') : '—'}
              </div>
              {pendingProfileUpdate?.profilePicture && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">Профайл зураг:</span>
                  <Avatar className="h-12 w-12 border border-gray-700">
                    <AvatarImage src={getImageUrl(pendingProfileUpdate.profilePicture)} />
                    <AvatarFallback>{pendingProfileUpdate.firstName?.charAt(0) || pendingProfileUpdate.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (updateProfileMutation.isPending) return;
                setPendingProfileUpdate(null);
              }}
              disabled={updateProfileMutation.isPending}
            >
              Буцах
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmProfileUpdate}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Хадгалж байна...' : 'Баталгаажуулах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
