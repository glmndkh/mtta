import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Clock, Trophy, DollarSign, ArrowLeft, Mail, Check, X as XIcon } from "lucide-react";
import PageWithLoading from "@/components/PageWithLoading";
import RegistrationForm from "@/components/RegistrationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import EventHeroRow from '@/components/EventHeroRow';
import LoadingAnimation from '@/components/LoadingAnimation';
import { ParticipantsTab } from '@/components/ParticipantsTab';
import { queryClient } from '@/lib/queryClient';
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { normalizeKnockoutMatches } from "@/lib/knockout";
import { PodiumSection } from "@/components/PodiumSection";
import type { TournamentResults } from "@shared/schema";

// Helper function to format participation type from JSON string to readable text
const formatParticipationType = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Map type and gender to Mongolian text
    let typeName = "";
    if (parsed.type === "individual") {
      if (parsed.gender === "male") {
        typeName = "Эрэгтэй-ганцаарчилсан";
      } else if (parsed.gender === "female") {
        typeName = "Эмэгтэй-ганцаарчилсан";
      } else {
        typeName = "Ганцаарчилсан";
      }
    } else if (parsed.type === "pair") {
      typeName = "Хос";
    } else if (parsed.type === "team") {
      typeName = "Баг";
    } else {
      typeName = parsed.type;
    }
    
    return `${typeName} ${parsed.minAge}–${parsed.maxAge} нас`;
  } catch {
    // If parsing fails, return the original string
    return jsonString;
  }
};

interface Tournament {
  id: string;
  name: string;
  description?: string;
  richDescription?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  backgroundImageUrl?: string;
  coverUrl?: string;
  backgroundUrl?: string;
  background?: string;
  heroImage?: string;
  imageUrl?: string;
  image?: string;
  venue?: string;
  city?: string;
  country?: string;
  participationTypes: string[];
  eligibility?: Record<string, {
    genders?: ("male"|"female")[];
    minAge?: number;
    maxAge?: number;
  }>;
  organizer?: string;
  maxParticipants?: number;
  entryFee?: string;
  rules?: string;
  prizes?: string;
}

interface GroupStageGroup {
  id: string;
  name: string;
  players: Array<{ id: string; name: string; club?: string }>;
  resultMatrix: string[][];
  playerStats: Array<{
    playerId: string;
    wins: number;
    losses: number;
    points: number;
    setsWon?: number;
    setsLost?: number;
  }>;
}

interface KnockoutMatch {
  id: string;
  round: number | string;
  roundName?: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
}

interface FinalRanking {
  position: number;
  player: {
    id: string;
    name: string;
  };
  points?: number;
  note?: string;
}

export default function EventDetail() {
  const { id } = useParams();
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();

  // Fetch tournament data
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${id}`],
    enabled: !!id,
  });

  // Fetch tournament results
  const { data: results } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', id, 'results'],
    enabled: !!id,
  });

  // Fetch invitations for this tournament
  const { data: invitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['/api/invitations/me', tournament?.id],
    queryFn: async () => {
      if (!tournament?.id || !user) return [];
      const res = await fetch(`/api/invitations/me`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      const allInvitations = await res.json();
      // Filter for this tournament only - show all statuses
      return allInvitations.filter((inv: any) => inv.tournamentId === tournament.id);
    },
    enabled: !!user && !!tournament?.id,
  });

  // Respond to invitation (accept/reject)
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, action }: { invitationId: string; action: 'accept' | 'reject' }) => {
      const res = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Хүсэлт боловсруулахад алдаа гарлаа');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.action === 'accept') {
        toast({
          title: "Амжилттай!",
          description: data.teamCreated ? "Баг/хос амжилттай үүслээ" : "Хүсэлтийг зөвшөөрлөө",
        });
      } else {
        toast({
          title: "Амжилттай!",
          description: "Хүсэлтийг татгалзлаа",
        });
      }
      refetchInvitations();
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/registrations/me', tournament?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament?.id}/participants`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check user registration status for any category
  const { data: userRegistrations = [] } = useQuery({
    queryKey: ["/api/registrations/me", tournament?.id],
    queryFn: async () => {
      if (!tournament?.id) return [];
      const res = await fetch(`/api/registrations/me?tid=${tournament.id}`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 1000,
    enabled: !!user && !!tournament?.id,
  });

  // Handle hash navigation
  useEffect(() => {
    const hash = location.split('#')[1];
    if (hash) {
      setActiveTab(hash);
      // Smooth scroll to section after data loads
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location, tournament]);

  // Helper function to get image URL with fallback order
  const getImageUrl = (tournament: Tournament): string => {
    const imageFields = [
      tournament.coverUrl,
      tournament.backgroundImageUrl,
      tournament.backgroundUrl,
      tournament.background,
      tournament.heroImage,
      tournament.imageUrl,
      tournament.image
    ];

    const imageUrl = imageFields.find(url => url && url.trim() !== '');

    if (!imageUrl) return '';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }

    return `/${imageUrl}`;
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return format(start, 'yyyy.MM.dd', { locale: mn });
    }

    return `${format(start, 'yyyy.MM.dd', { locale: mn })}–${format(end, 'yyyy.MM.dd', { locale: mn })}`;
  };

  const tabs = [
    { id: 'overview', label: 'Тойм' },
    { id: 'groups', label: 'Хэсгийн тоглолтууд' },
    { id: 'schedule', label: 'Хуваарь' },
    { id: 'players', label: 'Баг тамирчид' },
    { id: 'album', label: 'Альбом' },
    { id: 'about', label: 'Тэмцээний дэлгэрэнгүй' },
    { id: 'register', label: 'Бүртгүүлэх' },
  ];

  if (isLoading) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-80 w-full rounded-2xl mb-8" />
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Тэмцээн олдсонгүй</h1>
              <p className="text-gray-600">Уучлаарай, энэ тэмцээний мэдээлэл олдсонгүй.</p>
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  const isUserRegistered = Array.isArray(userRegistrations) && userRegistrations.length > 0;

  const imageUrl = getImageUrl(tournament);
  const venue = tournament.venue || tournament.location;
  const cityCountry = [tournament.city, tournament.country].filter(Boolean).join(', ');

  return (
    <PageWithLoading>
      <div className="min-h-screen">
        <Navigation />

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={`/tournaments/${tournament.id}`}>
            <div className="relative min-h-[260px] md:h-[360px] rounded-2xl overflow-hidden cursor-pointer group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={tournament.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700"></div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/0"></div>

              <div className="absolute left-4 bottom-4 md:left-6 md:bottom-6 text-white max-w-[90%] md:max-w-[70%]">
                <div className="mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDateRange(tournament.startDate, tournament.endDate)}
                  </Badge>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg mb-3 leading-snug line-clamp-2">
                  {tournament.name}
                </h1>

                {(venue || cityCountry) && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{[venue, cityCountry].filter(Boolean).join(' / ')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {!isUserRegistered ? (
                    <Button
                      onClick={() => {
                        setActiveTab('register');
                        setTimeout(() => {
                          const element = document.getElementById('register');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="bg-mtta-green hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Бүртгүүлэх
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="bg-green-600 text-white cursor-not-allowed font-bold py-3 px-8 rounded-full text-lg shadow-lg"
                    >
                      БҮРТГЭГДСЭН
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Tabs Navigation */}
          <div className="sticky top-16 z-10 bg-white/80 backdrop-blur border-b mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Ерөнхий</TabsTrigger>
                <TabsTrigger value="participants">Оролцогчид</TabsTrigger>
                <TabsTrigger value="register">Бүртгүүлэх</TabsTrigger>
                <TabsTrigger value="invitations" className="relative">
                  Хүсэлтүүд
                  {invitations.filter((inv: any) => inv.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {invitations.filter((inv: any) => inv.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="results">Үр дүн</TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="py-8 space-y-16">
                <TabsContent value="overview" className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Тэмцээний тухай</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tournament.richDescription ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: tournament.richDescription }}
                        />
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">
                          {tournament.description || "Тэмцээний дэлгэрэнгүй мэдээлэл оруулаагүй байна."}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ерөнхий мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Эхлэх огноо</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tournament.startDate), "yyyy оны MM сарын dd", { locale: mn })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Дуусах огноо</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tournament.endDate), "yyyy оны MM сарын dd", { locale: mn })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Байршил</p>
                              <p className="text-sm text-muted-foreground">{tournament.location}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {tournament.organizer && (
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Зохион байгуулагч</p>
                                <p className="text-sm text-muted-foreground">{tournament.organizer}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Хамгийн олон оролцогч</p>
                              <p className="text-sm text-muted-foreground">{tournament.maxParticipants} хүн</p>
                            </div>
                          </div>

                          {tournament.entryFee && tournament.entryFee !== "0" && (
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Оролцооны хураамж</p>
                                <p className="text-sm text-muted-foreground">{tournament.entryFee}₮</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {tournament.participationTypes && tournament.participationTypes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Оролцох ангилал</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {tournament.participationTypes.map((type, index) => (
                            <Badge key={`${type}-${index}`} variant="secondary">
                              {formatParticipationType(type)}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {tournament.rules && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Дүрэм журам</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {tournament.rules}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {tournament.prizes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Шагнал урамшуулал</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {tournament.prizes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="participants" className="space-y-6">
                  <ParticipantsTab tournamentId={tournament.id} />
                </TabsContent>

                <TabsContent value="register" className="space-y-8" id="register">
                  <RegistrationForm
                    tournament={tournament}
                    preselectedCategory={selectedCategory}
                    onSuccess={() => {
                      // Refresh participants after successful registration
                      queryClient.invalidateQueries({
                        queryKey: [`/api/tournaments/${tournament.id}`],
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/registrations/me", tournament?.id] });
                    }}
                  />
                </TabsContent>

                <TabsContent value="invitations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Багийн/Хосын хүсэлтүүд
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {invitations.length === 0 ? (
                        <div className="text-center py-12">
                          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Одоогоор хүсэлт байхгүй байна</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {invitations.map((invitation: any) => (
                            <Card key={invitation.id} className="border-2">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className="w-4 h-4 text-primary" />
                                      <h3 className="font-semibold">
                                        {invitation.teamName || formatParticipationType(invitation.eventType)}
                                      </h3>
                                      {invitation.status === 'accepted' && (
                                        <Badge variant="secondary" className="ml-2">
                                          Зөвшөөрсөн
                                        </Badge>
                                      )}
                                      {invitation.status === 'completed' && (
                                        <Badge variant="default" className="ml-2 bg-green-600">
                                          Баг үүссэн
                                        </Badge>
                                      )}
                                      {invitation.status === 'rejected' && (
                                        <Badge variant="destructive" className="ml-2">
                                          Татгалзсан
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <p>
                                        <span className="font-medium">Илгээсэн:</span>{' '}
                                        {invitation.sender?.firstName} {invitation.sender?.lastName}
                                      </p>
                                      <p>
                                        <span className="font-medium">Төрөл:</span>{' '}
                                        {formatParticipationType(invitation.eventType)}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {format(new Date(invitation.createdAt), 'yyyy.MM.dd HH:mm')}
                                      </p>
                                      {invitation.status === 'accepted' && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                          Бусад гишүүд зөвшөөрөхийг хүлээж байна...
                                        </p>
                                      )}
                                      {invitation.status === 'completed' && (
                                        <>
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                            Баг/хос амжилттай үүслээ. Оролцогчдын жагсаалтаас үзнэ үү.
                                          </p>
                                          {invitation.teamMembers && invitation.teamMembers.length > 0 && (
                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                              <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-2">
                                                Багийн гишүүд:
                                              </p>
                                              <ul className="space-y-1">
                                                {invitation.teamMembers.map((member: any, idx: number) => (
                                                  <li key={idx} className="text-xs text-green-800 dark:text-green-200 flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {member.playerName}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {invitation.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="flex items-center gap-1"
                                          onClick={() => respondToInvitationMutation.mutate({ 
                                            invitationId: invitation.id, 
                                            action: 'accept' 
                                          })}
                                          disabled={respondToInvitationMutation.isPending}
                                          data-testid={`button-accept-${invitation.id}`}
                                        >
                                          <Check className="w-4 h-4" />
                                          Зөвшөөрөх
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1"
                                          onClick={() => respondToInvitationMutation.mutate({ 
                                            invitationId: invitation.id, 
                                            action: 'reject' 
                                          })}
                                          disabled={respondToInvitationMutation.isPending}
                                          data-testid={`button-reject-${invitation.id}`}
                                        >
                                          <XIcon className="w-4 h-4" />
                                          Татгалзах
                                        </Button>
                                      </>
                                    )}
                                    {invitation.status === 'completed' && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => setActiveTab('participants')}
                                        data-testid={`button-view-team-${invitation.id}`}
                                      >
                                        <Users className="w-4 h-4" />
                                        Баг үзэх
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="results" className="space-y-8">
                  {(() => {
                    const groupStageResults: GroupStageGroup[] = (results?.groupStageResults as any) || [];
                    const rawKnockoutResults: KnockoutMatch[] = (results?.knockoutResults as any) || [];
                    const knockoutResults = normalizeKnockoutMatches(rawKnockoutResults) as KnockoutMatch[];
                    const finalRankings: FinalRanking[] = (results?.finalRankings as any) || [];

                    const hasImages = results?.finalRankings && typeof results.finalRankings === 'object' && 'images' in results.finalRankings && Array.isArray(results.finalRankings.images) && results.finalRankings.images.length > 0;
                    const hasFinalRankings = results?.finalRankings && Array.isArray(results.finalRankings) && results.finalRankings.length > 0;
                    const hasGroupStage = groupStageResults && Array.isArray(groupStageResults) && groupStageResults.length > 0;
                    const hasKnockout = knockoutResults && Array.isArray(knockoutResults) && knockoutResults.length > 0;

                    if (!results || (!hasImages && !hasFinalRankings && !hasGroupStage && !hasKnockout)) {
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle>Тэмцээний үр дүн</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-12">
                              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">Тэмцээний үр дүн хараахан оруулаагүй байна</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <>
                        {/* Podium Section - Top 3 Winners */}
                        {hasFinalRankings && finalRankings.length > 0 && (
                          <PodiumSection rankings={finalRankings} />
                        )}

                        {/* Final Rankings with Images */}
                        {hasImages && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Тэмцээний үр дүн</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(results.finalRankings as any).images.map((image: any, index: number) => (
                                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
                                    <img 
                                      src={image.url.startsWith('/') ? image.url : `/objects/${image.url}`}
                                      alt={image.description || `Үр дүн ${index + 1}`}
                                      className="w-full h-64 object-cover"
                                    />
                                    {image.description && (
                                      <div className="p-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{image.description}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Final Rankings Table - 4th place and below */}
                        {(() => {
                          const lowerRankings = finalRankings.filter(r => r.position >= 4);
                          if (lowerRankings.length === 0) return null;
                          
                          return (
                            <Card>
                              <CardHeader>
                                <CardTitle>Бусад байрлалт</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Байр</TableHead>
                                      <TableHead>Тоглогч</TableHead>
                                      <TableHead>Оноо</TableHead>
                                      <TableHead>Тэмдэглэл</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {lowerRankings.map((ranking) => (
                                      <TableRow key={ranking.player.id}>
                                        <TableCell className="font-bold">{ranking.position}</TableCell>
                                        <TableCell>{ranking.player.name}</TableCell>
                                        <TableCell>{ranking.points || '-'}</TableCell>
                                        <TableCell>{ranking.note || '-'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          );
                        })()}

                        {/* Group Stage Results */}
                        {hasGroupStage && (
                          <div>
                            <h2 className="text-xl font-semibold mb-4">Хэсгийн шатны үр дүн</h2>
                            <div className="space-y-4">
                              {groupStageResults.map((group) => (
                                <Card key={group.id}>
                                  <CardHeader>
                                    <CardTitle>{group.name}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Байр</TableHead>
                                          <TableHead>Тоглогч</TableHead>
                                          <TableHead>Хожсон</TableHead>
                                          <TableHead>Хожигдсон</TableHead>
                                          <TableHead>Оноо</TableHead>
                                          <TableHead>Сэт +/-</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {group.players
                                          .map((player, index) => {
                                            const stats = group.playerStats?.find(s => s.playerId === player.id) || {
                                              wins: 0,
                                              losses: 0,
                                              points: 0,
                                              setsWon: 0,
                                              setsLost: 0
                                            };
                                            return { player, stats, index };
                                          })
                                          .sort((a, b) => {
                                            if (b.stats.points !== a.stats.points) {
                                              return b.stats.points - a.stats.points;
                                            }
                                            const setsDiffA = (a.stats.setsWon || 0) - (a.stats.setsLost || 0);
                                            const setsDiffB = (b.stats.setsWon || 0) - (b.stats.setsLost || 0);
                                            return setsDiffB - setsDiffA;
                                          })
                                          .map(({ player, stats }, position) => (
                                            <TableRow key={player.id}>
                                              <TableCell className="font-bold">{position + 1}</TableCell>
                                              <TableCell>{player.name}</TableCell>
                                              <TableCell>{stats.wins}</TableCell>
                                              <TableCell>{stats.losses}</TableCell>
                                              <TableCell className="font-bold">{stats.points}</TableCell>
                                              <TableCell>
                                                <span className={`${(stats.setsWon || 0) - (stats.setsLost || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                  {(stats.setsWon || 0) - (stats.setsLost || 0) >= 0 ? '+' : ''}
                                                  {(stats.setsWon || 0) - (stats.setsLost || 0)}
                                                </span>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Knockout Bracket */}
                        {hasKnockout && (
                          <div>
                            <h2 className="text-xl font-semibold mb-4">Шигшээ тоглолт</h2>
                            <Card>
                              <CardContent className="p-6">
                                <KnockoutBracket
                                  matches={knockoutResults.map(match => ({
                                    id: match.id,
                                    round: Number(match.round),
                                    player1: match.player1,
                                    player2: match.player2,
                                    winner: match.winner,
                                    score1: match.player1Score ? parseInt(match.player1Score, 10) : undefined,
                                    score2: match.player2Score ? parseInt(match.player2Score, 10) : undefined,
                                    position: match.position
                                  }))}
                                />
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </PageWithLoading>
  );
}