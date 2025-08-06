import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import TournamentTimeDisplay from "@/components/tournament-time-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin, Clock, ExternalLink, Ticket, Users } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TournamentData {
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
  // For backward compatibility with localStorage format
  prizeMoney?: string;
  backgroundImage?: string;
  categories?: string[];
  eventInfoUrl?: string;
  ticketUrl?: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  "men_singles": "Эрэгтэй ганцаарчилсан",
  "women_singles": "Эмэгтэй ганцаарчилсан", 
  "men_doubles": "Эрэгтэй хосоор",
  "women_doubles": "Эмэгтэй хосоор",
  "mixed_doubles": "Холимог хосоор",
  "team": "Багийн төрөл",
  "singles": "Ганцаарчилсан",
  "doubles": "Хосоор"
};

// Helper function to extract image URL from rich description
function extractImageFromRichDescription(richDescription?: string | null): string | null {
  if (!richDescription) return null;
  const imgMatch = richDescription.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

// Tournament Registration Button Component
function TournamentRegistrationButton({ tournamentId }: { tournamentId: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userRegistration } = useQuery<{ registered: boolean; registration?: any }>({
    queryKey: ['/api/tournaments', tournamentId, 'user-registration'],
    enabled: isAuthenticated,
  });

  const registerMutation = useMutation({
    mutationFn: async (participationType: string) => {
      if (!isAuthenticated) {
        window.location.href = "/login";
        return;
      }
      return apiRequest('POST', `/api/tournaments/${tournamentId}/register`, { participationType });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгүүллээ!",
        description: "Тэмцээнд амжилттай бүртгүүллээ.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Бүртгүүлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Тэмцээнд бүртгүүлэхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }
    registerMutation.mutate("singles"); // Default to singles
  };

  if (userRegistration?.registered) {
    return (
      <Button
        disabled
        className="bg-green-600 text-white cursor-not-allowed"
        onClick={(e) => e.stopPropagation()}
      >
        Бүртгүүлсэн
      </Button>
    );
  }

  return (
    <Button
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={handleRegister}
      disabled={registerMutation.isPending}
    >
      {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
    </Button>
  );
}

// Tournament Registration Stats Component
function TournamentRegistrationStats({ tournamentId }: { tournamentId: string }) {
  const { data: stats } = useQuery<{ registered: number; maxParticipants?: number; registrationRate: number }>({
    queryKey: ['/api/tournaments', tournamentId, 'registration-stats'],
  });

  if (!stats) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900">
          Бүртгүүлсэн: {stats.registered}
          {stats.maxParticipants && ` / ${stats.maxParticipants}`}
        </span>
      </div>
      {stats.registrationRate > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(stats.registrationRate, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{stats.registrationRate}%</span>
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: TournamentData }) {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [previousCountdown, setPreviousCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isFlipping, setIsFlipping] = useState({ days: false, hours: false, minutes: false, seconds: false });

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(tournament.startDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const newCountdown = { days, hours, minutes, seconds };
        
        // Check if values changed to trigger flip animation
        if (countdown.days !== days || countdown.hours !== hours || countdown.minutes !== minutes || countdown.seconds !== seconds) {
          const flips = {
            days: countdown.days !== days,
            hours: countdown.hours !== hours,
            minutes: countdown.minutes !== minutes,
            seconds: countdown.seconds !== seconds
          };
          setIsFlipping(flips);
          
          // Reset flip animation after 600ms
          setTimeout(() => {
            setIsFlipping({ days: false, hours: false, minutes: false, seconds: false });
          }, 600);
        }

        setPreviousCountdown(countdown);
        setCountdown(newCountdown);
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournament.startDate]);

  const formatDateRange = () => {
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const startFormatted = startDate.toLocaleDateString('mn-MN', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endFormatted = endDate.toLocaleDateString('mn-MN', { 
      month: 'short', 
      day: 'numeric' 
    });
    const startTime = startDate.toLocaleTimeString('mn-MN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    const year = startDate.getFullYear();
    
    return `${startFormatted} – ${endFormatted} ${year}, ${startTime}`;
  };

  return (
    <div 
      className="relative overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-300 rounded-xl mb-8"
      onClick={() => setLocation(`/tournament/${tournament.id}`)}
    >
      <div className="relative h-64 lg:h-80">
        {/* Background Image */}
        <div className="absolute inset-0">
          {tournament.backgroundImage || (tournament.richDescription && tournament.richDescription.includes('<img')) ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${tournament.backgroundImage || extractImageFromRichDescription(tournament.richDescription)})`
              }}
            />
          ) : (
            // Default night city background
            <div 
              className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
                `
              }}
            >
              {/* Simulated city lights */}
              <div className="absolute inset-0 opacity-60">
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-yellow-400/20 via-orange-400/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute bottom-0 bg-gradient-to-t from-yellow-300/40 to-transparent"
                      style={{
                        left: `${i * 10}%`,
                        width: `${2 + Math.random() * 3}%`,
                        height: `${20 + Math.random() * 30}%`,
                        opacity: 0.6 + Math.random() * 0.4
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Dark green overlay for text readability */}
          <div className="absolute inset-0 bg-green-900/80" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full">
          <div className="h-full flex flex-col p-6 lg:p-8 gap-6">
            {/* Top Section - Countdown Timer and Registration Stats */}
            <div className="flex items-start justify-between mb-4 mt-2">
              {/* Countdown Timer - Visible and Compact */}
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white mt-2">
                {countdown.days > 0 ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{countdown.days}</div>
                    <div className="text-xs text-gray-300">ӨДӨР</div>
                    <div className="text-sm">{countdown.hours}ц {countdown.minutes}м</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">ЦАГ:МИН:СЕК</div>
                  </div>
                )}
              </div>
              
              {/* Registration Stats */}
              <TournamentRegistrationStats tournamentId={tournament.id} />
            </div>

            {/* Main Content Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 flex-1">
              {/* Left Section - Tournament Info */}
              <div className="flex-1 space-y-3">
                {/* Date Badge */}
                <div className="inline-flex items-center space-x-2 text-white">
                  <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold">🇲🇳</span>
                  </div>
                  <span className="text-sm bg-black/40 px-3 py-1 rounded text-white font-medium">
                    {formatDateRange()}
                  </span>
                </div>
              
              {/* Tournament Name */}
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                {tournament.name}
              </h2>
              
              {/* Location */}
              <div className="flex items-center text-white/90 text-lg">
                <MapPin className="w-5 h-5 mr-2" />
                {tournament.location}
              </div>

              {/* Tournament Types & Categories - Moved Higher */}
              <div className="space-y-1">
                <div className="text-white/90 text-sm font-medium">Тэмцээний төрөл:</div>
                <div className="flex flex-wrap gap-2">
                  {(tournament.categories || tournament.participationTypes || []).map((category) => (
                    <Badge key={category} variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      {CATEGORY_LABELS[category] || category}
                    </Badge>
                  ))}
                  {(!tournament.categories || tournament.categories.length === 0) && 
                   (!tournament.participationTypes || tournament.participationTypes.length === 0) && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Ганцаарчилсан
                    </Badge>
                  )}
                </div>
              </div>

              {/* Prize Money */}
              {(tournament.prizeMoney || tournament.prizes) && (
                <div className="text-white text-lg font-medium">
                  Шагналын сан: <span className="font-bold">{tournament.prizeMoney || tournament.prizes}</span>
                </div>
              )}

              {/* Entry Fee */}
              {tournament.entryFee && parseFloat(tournament.entryFee) > 0 && (
                <div className="text-white text-lg font-medium">
                  Бүртгэлийн хураамж: <span className="font-bold">{parseFloat(tournament.entryFee).toLocaleString()}₮</span>
                </div>
              )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <TournamentRegistrationButton tournamentId={tournament.id} />
                  {tournament.eventInfoUrl && (
                    <Button 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-black"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(tournament.eventInfoUrl, '_blank');
                      }}
                    >
                      Тэмцээний мэдээлэл
                    </Button>
                  )}
                  {tournament.ticketUrl && (
                    <Button 
                      className="bg-white text-black hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(tournament.ticketUrl, '_blank');
                      }}
                    >
                      Тасалбар захиалах
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Section - Countdown Timer */}
              <div className="flex-shrink-0">
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 min-w-[320px] border border-gray-700/50">
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-gray-800/80 rounded-lg py-4 px-2 transition-all duration-300 hover:bg-gray-700/80">
                      <div className={`text-4xl lg:text-5xl font-bold text-white leading-none mb-2 transition-all duration-500 transform ${isFlipping.days ? 'countdown-flip' : ''}`}>
                        <span className="inline-block">
                          {countdown.days.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-medium uppercase tracking-wider">Days</div>
                    </div>
                    <div className="bg-gray-800/80 rounded-lg py-4 px-2 transition-all duration-300 hover:bg-gray-700/80">
                      <div className={`text-4xl lg:text-5xl font-bold text-white leading-none mb-2 transition-all duration-500 transform ${isFlipping.hours ? 'countdown-flip' : ''}`}>
                        <span className="inline-block">
                          {countdown.hours.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-medium uppercase tracking-wider">Hours</div>
                    </div>
                    <div className="bg-gray-800/80 rounded-lg py-4 px-2 transition-all duration-300 hover:bg-gray-700/80">
                      <div className={`text-4xl lg:text-5xl font-bold text-white leading-none mb-2 transition-all duration-500 transform ${isFlipping.minutes ? 'countdown-flip' : ''}`}>
                        <span className="inline-block">
                          {countdown.minutes.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-medium uppercase tracking-wider">Minutes</div>
                    </div>
                    <div className="bg-gray-800/80 rounded-lg py-4 px-2 transition-all duration-300 hover:bg-gray-700/80">
                      <div className={`text-4xl lg:text-5xl font-bold text-white leading-none mb-2 transition-all duration-500 transform ${isFlipping.seconds ? 'countdown-flip' : 'countdown-tick'}`}>
                        <span className="inline-block countdown-glow">
                          {countdown.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-medium uppercase tracking-wider">Seconds</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tournaments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  // Fetch tournaments from database
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      return response.json();
    },
  });

  // Remove authentication requirement for tournaments page

  if (isLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  // Allow access to tournaments page without authentication

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Trophy className="mr-3 h-8 w-8 text-green-600" />
                Тэмцээнүүд
              </h1>
              <p className="text-gray-600">
                Бүх идэвхтэй болон удахгүй болох тэмцээнүүд
              </p>
            </div>
            
            {user && (user as any)?.role === 'admin' ? (
              <Button 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                onClick={() => window.location.href = '/admin/generator'}
              >
                <Trophy className="mr-2 h-5 w-5" />
                Тэмцээн үүсгэх
              </Button>
            ) : null}
          </div>
        </div>

        {/* Tournaments List */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Тэмцээн байхгүй байна
            </h3>
            <p className="text-gray-600 mb-6">
              Одоогоор ямар нэг тэмцээн зарлагдаагүй байна.
            </p>
            {user && (user as any)?.role === 'admin' ? (
              <Button 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                onClick={() => window.location.href = '/admin/generator'}
              >
                <Trophy className="mr-2 h-5 w-5" />
                Тэмцээн үүсгэх
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {tournaments
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}