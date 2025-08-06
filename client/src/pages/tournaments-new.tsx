import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Crown, 
  Medal, 
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, isBefore } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description: string;
  richDescription?: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  location: string;
  maxParticipants: number;
  entryFee: string;
  status: string;
  participationTypes: string[];
  rules?: string | null;
  prizes?: string | null;
  contactInfo?: string | null;
  schedule?: string | null;
  requirements?: string | null;
  isPublished: boolean;
  organizerId: string;
  clubId?: string | null;
  createdAt: string;
  updatedAt: string;
  backgroundImageUrl?: string;
}

interface FinalRanking {
  position: number;
  playerId: string;
  playerName: string;
  prize?: string;
}

interface TournamentResults {
  id: string;
  tournamentId: string;
  groupStageResults?: any;
  knockoutResults?: any;
  finalRankings?: FinalRanking[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegistrationStatus {
  isRegistered: boolean;
  registrationId?: string;
  participationType?: string;
}

interface RegistrationStats {
  total: number;
  byType: Record<string, number>;
}

// Featured Tournament Slider Component
function FeaturedTournamentSlider({ tournaments }: { tournaments: Tournament[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (tournaments.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % tournaments.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [tournaments.length]);

  if (tournaments.length === 0) return null;

  const currentTournament = tournaments[currentSlide];

  return (
    <div className="relative h-96 mb-8 rounded-xl overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: currentTournament.backgroundImageUrl 
            ? `url(${currentTournament.backgroundImageUrl})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center h-full px-8">
        <div className="max-w-2xl text-white">
          <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
            <Star className="w-3 h-3 mr-1" />
            Онцлох тэмцээн
          </Badge>
          
          <h1 className="text-4xl font-bold mb-4">{currentTournament.name}</h1>
          
          <p className="text-xl mb-6 text-gray-200 line-clamp-2">
            {currentTournament.description}
          </p>

          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(currentTournament.startDate), 'yyyy/MM/dd')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{currentTournament.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Дээд тал: {currentTournament.maxParticipants}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <TournamentRegistrationButton tournamentId={currentTournament.id} />
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setLocation(`/tournament/${currentTournament.id}`)}
            >
              Дэлгэрэнгүй
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {tournaments.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + tournaments.length) % tournaments.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % tournaments.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {tournaments.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Tournament Registration Button Component
function TournamentRegistrationButton({ tournamentId }: { tournamentId: string }) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get registration status
  const { data: registrationStatus } = useQuery<RegistrationStatus>({
    queryKey: [`/api/tournaments/${tournamentId}/user-registration`],
    enabled: isAuthenticated
  });

  // Get registration stats
  const { data: registrationStats } = useQuery<RegistrationStats>({
    queryKey: [`/api/tournaments/${tournamentId}/registration-stats`]
  });

  const registerMutation = useMutation({
    mutationFn: async (participationType: string) => {
      return apiRequest(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        body: JSON.stringify({ participationType }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгэгдлээ!",
        description: "Та тэмцээнд бүртгэгдлээ. Тэмцээний дэлгэрэнгүй мэдээллийг имэйлээр илгээх болно.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/user-registration`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/registration-stats`] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Бүртгэл хийхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  const handleRegister = () => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    // For now, register with singles type. Could be expanded to show type selection
    registerMutation.mutate('singles');
  };

  if (registrationStatus?.isRegistered) {
    return (
      <Button disabled className="bg-green-600 hover:bg-green-700">
        <Trophy className="w-4 h-4 mr-2" />
        Бүртгэгдсэн
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleRegister}
      disabled={registerMutation.isPending}
      className="bg-green-600 hover:bg-green-700"
    >
      {registerMutation.isPending ? "Бүртгэж байна..." : "Бүртгүүлэх"}
    </Button>
  );
}

// Past Tournament History Component
function PastTournamentHistory({ tournaments, results }: { 
  tournaments: Tournament[];
  results: Record<string, TournamentResults>;
}) {
  const [, setLocation] = useLocation();

  const pastTournaments = tournaments
    .filter(t => isAfter(new Date(), new Date(t.endDate)))
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 6); // Show last 6 tournaments

  if (pastTournaments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Өнгөрсөн тэмцээн олдсонгүй</p>
        </CardContent>
      </Card>
    );
  }

  const getMedalInfo = (position: number) => {
    switch (position) {
      case 1:
        return { icon: Crown, color: "text-yellow-400", label: "Алт" };
      case 2:
        return { icon: Medal, color: "text-gray-300", label: "Мөнгө" };
      case 3:
        return { icon: Award, color: "text-amber-400", label: "Хүрэл" };
      default:
        return { icon: Trophy, color: "text-blue-400", label: `${position}-р` };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Өнгөрсөн тэмцээний түүх</h2>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/tournaments')}
          className="text-green-400 border-green-400 hover:bg-green-50/10 bg-white/10 backdrop-blur-sm"
        >
          Бүгдийг харах
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pastTournaments.map((tournament) => {
          const tournamentResults = results[tournament.id];
          const topThree = tournamentResults?.finalRankings
            ?.filter(r => r.position <= 3)
            ?.sort((a, b) => a.position - b.position) || [];

          return (
            <Card 
              key={tournament.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white/20 backdrop-blur-md border-white/30"
              onClick={() => setLocation(`/tournament/${tournament.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{tournament.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(tournament.endDate), 'yyyy/MM/dd')}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Дууссан
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{tournament.location}</span>
                  </div>

                  {topThree.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Медальтан</h4>
                      <div className="space-y-2">
                        {topThree.map((ranking) => {
                          const medal = getMedalInfo(ranking.position);
                          const MedalIcon = medal.icon;
                          
                          return (
                            <div key={ranking.position} className="flex items-center gap-2 text-sm">
                              <MedalIcon className={`w-4 h-4 ${medal.color}`} />
                              <span className="font-medium">{medal.label}</span>
                              <span className="text-gray-600 line-clamp-1">
                                {ranking.playerName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {topThree.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      Үр дүн хараахан гараагүй
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Current Tournaments Section
function CurrentTournaments({ tournaments }: { tournaments: Tournament[] }) {
  const [, setLocation] = useLocation();

  const currentTournaments = tournaments
    .filter(t => 
      isBefore(new Date(), new Date(t.endDate)) && 
      isAfter(new Date(), new Date(t.startDate))
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (currentTournaments.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-white">Одоо явагдаж буй тэмцээн</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentTournaments.map((tournament) => (
          <Card 
            key={tournament.id}
            className="hover:shadow-lg transition-shadow cursor-pointer bg-white/20 backdrop-blur-md border-white/30"
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
                <Badge className="bg-green-100 text-green-800">
                  Явагдаж байна
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(tournament.startDate), 'MM/dd')} - {format(new Date(tournament.endDate), 'MM/dd')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{tournament.location}</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
                
                <Button 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/tournament/${tournament.id}`);
                  }}
                >
                  Дэлгэрэнгүй харах
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Upcoming Tournaments Section  
function UpcomingTournaments({ tournaments }: { tournaments: Tournament[] }) {
  const [, setLocation] = useLocation();

  const upcomingTournaments = tournaments
    .filter(t => isAfter(new Date(t.startDate), new Date()))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4);

  if (upcomingTournaments.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-white">Удахгүй болох тэмцээн</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingTournaments.map((tournament) => (
          <Card 
            key={tournament.id}
            className="hover:shadow-lg transition-shadow cursor-pointer bg-white/20 backdrop-blur-md border-white/30"
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
                <Badge variant="outline">
                  {format(new Date(tournament.startDate), 'MM/dd')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Бүртгэл: {tournament.registrationDeadline 
                      ? format(new Date(tournament.registrationDeadline), 'MM/dd хүртэл')
                      : 'Тодорхойгүй'
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{tournament.location}</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
                
                <div className="flex gap-2 mt-4">
                  <TournamentRegistrationButton tournamentId={tournament.id} />
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/tournament/${tournament.id}`);
                    }}
                  >
                    Дэлгэрэнгүй
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function TournamentsNew() {
  const { isAuthenticated } = useAuth();

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch all tournament results for past tournaments
  const { data: allResults = {} } = useQuery<Record<string, TournamentResults>>({
    queryKey: ['/api/tournaments/all-results'],
    queryFn: async () => {
      const pastTournaments = tournaments.filter(t => isAfter(new Date(), new Date(t.endDate)));
      const results: Record<string, TournamentResults> = {};
      
      for (const tournament of pastTournaments) {
        try {
          const result = await apiRequest(`/api/tournaments/${tournament.id}/results`) as TournamentResults;
          if (result) {
            results[tournament.id] = result;
          }
        } catch (error) {
          // Ignore individual errors
        }
      }
      
      return results;
    },
    enabled: tournaments.length > 0
  });

  // Get featured tournaments (upcoming tournaments with background images or latest tournaments)
  const featuredTournaments = tournaments
    .filter(t => isAfter(new Date(t.startDate), new Date()) || isBefore(new Date(), new Date(t.endDate)))
    .filter(t => t.backgroundImageUrl || t.isPublished)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  if (tournamentsLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-[95%] mx-auto px-4 py-8">
          <div className="text-center">Тэмцээнүүдийг ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-[95%] mx-auto px-4 py-8">
        {/* Featured Tournament Slider */}
        {featuredTournaments.length > 0 && (
          <FeaturedTournamentSlider tournaments={featuredTournaments} />
        )}

        {/* Current Tournaments */}
        <CurrentTournaments tournaments={tournaments} />

        {/* Upcoming Tournaments */}
        <UpcomingTournaments tournaments={tournaments} />

        {/* Past Tournament History */}
        <PastTournamentHistory tournaments={tournaments} results={allResults} />
      </div>
    </div>
  );
}