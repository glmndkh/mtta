import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin, Clock, ExternalLink, Ticket, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageWithLoading from "@/components/PageWithLoading";

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

interface ParticipationCategory {
  minAge: number | null;
  maxAge: number | null;
  gender: string;
}

const parseParticipation = (value: string): ParticipationCategory => {
  try {
    const obj = JSON.parse(value);
    if ("minAge" in obj || "maxAge" in obj) {
      return {
        minAge: obj.minAge ?? null,
        maxAge: obj.maxAge ?? null,
        gender: obj.gender || "male",
      };
    }
    const ageStr = String(obj.age || "");
    const nums = ageStr.match(/\d+/g)?.map(Number) || [];
    let min: number | null = null;
    let max: number | null = null;
    if (nums.length === 1) {
      if (/хүртэл/i.test(ageStr)) max = nums[0];
      else min = nums[0];
    } else if (nums.length >= 2) {
      [min, max] = nums;
    }
    return { minAge: min, maxAge: max, gender: obj.gender || "male" };
  } catch {
    const ageStr = value;
    const nums = ageStr.match(/\d+/g)?.map(Number) || [];
    let min: number | null = null;
    let max: number | null = null;
    if (nums.length === 1) {
      if (/хүртэл/i.test(ageStr)) max = nums[0];
      else min = nums[0];
    } else if (nums.length >= 2) {
      [min, max] = nums;
    }
    return { minAge: min, maxAge: max, gender: "male" };
  }
};

const formatParticipation = (cat: ParticipationCategory) => {
  let label = "";
  if (cat.minAge !== null && cat.maxAge !== null) label = `${cat.minAge}-${cat.maxAge}`;
  else if (cat.minAge !== null) label = `${cat.minAge}+`;
  else if (cat.maxAge !== null) label = `${cat.maxAge}-аас доош`;
  else label = "Нас хязгааргүй";
  return `${label} ${cat.gender === "male" ? "эрэгтэй" : "эмэгтэй"}`;
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

  const { data: players = [] } = useQuery<any[]>({
    queryKey: ['/api/players'],
    enabled: isAuthenticated,
  });

  const playerOptions = players.map(p => ({
    id: p.players.id,
    firstName: p.users?.firstName || '',
    lastName: p.users?.lastName || '',
    email: p.users?.email || '',
    clubAffiliation: p.clubs?.name || '',
  }));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const registerMutation = useMutation({
    mutationFn: async ({ participationType, playerId }: { participationType: string; playerId?: string }) => {
      if (!isAuthenticated) {
        window.location.href = "/login";
        return;
      }
      return apiRequest(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        body: JSON.stringify({ participationType, playerId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгүүллээ!",
        description: "Тэмцээнд амжилттай бүртгүүллээ.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'registration-stats'] });
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
    registerMutation.mutate({ participationType: "singles" });
  };

  const handleRegisterOther = () => {
    if (!selectedPlayer) return;
    registerMutation.mutate({ participationType: "singles", playerId: selectedPlayer.id }, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedPlayer(null);
      }
    });
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
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
        onClick={handleRegister}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
      </Button>
      {/* Removed the "Register Others" button */}
    </div>
  );
}

// Tournament Registration Stats Component
function TournamentCard({ tournament }: { tournament: TournamentData }) {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

        setCountdown({ days, hours, minutes, seconds });
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
      day: 'numeric',
      month: 'short' 
    });
    const endFormatted = endDate.toLocaleDateString('mn-MN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  const backgroundImageUrl = tournament.backgroundImage || extractImageFromRichDescription(tournament.richDescription);

  return (
    <div
      className="relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 rounded-2xl mb-8"
      onClick={() => setLocation(`/tournament/${tournament.id}/full`)}
    >
      <div className="relative h-80 lg:h-96">
        {/* Background Image with Mountains/City Style */}
        <div className="absolute inset-0">
          {backgroundImageUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            />
          ) : (
            // WTT-style mountain/city background
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #dbeafe 100%),
                            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><polygon fill="%23334155" points="0,400 200,100 400,200 600,80 800,150 1000,50 1200,120 1200,400"/><polygon fill="%23475569" points="0,400 150,180 300,220 450,160 600,200 750,140 900,180 1050,100 1200,160 1200,400"/></svg>')`
              }}
            >
              {/* City buildings overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-32 opacity-60"
                   style={{
                     background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 128"><rect fill="%23374151" x="0" y="80" width="60" height="48"/><rect fill="%23475569" x="60" y="60" width="80" height="68"/><rect fill="%23374151" x="140" y="40" width="60" height="88"/><rect fill="%23475569" x="200" y="70" width="50" height="58"/><rect fill="%23374151" x="250" y="30" width="70" height="98"/><rect fill="%23475569" x="320" y="50" width="90" height="78"/><rect fill="%23374151" x="410" y="20" width="60" height="108"/><rect fill="%23475569" x="470" y="65" width="80" height="63"/><rect fill="%23374151" x="550" y="45" width="70" height="83"/><rect fill="%23475569" x="620" y="75" width="50" height="53"/><rect fill="%23374151" x="670" y="35" width="80" height="93"/><rect fill="%23475569" x="750" y="55" width="60" height="73"/><rect fill="%23374151" x="810" y="25" width="90" height="103"/><rect fill="%23475569" x="900" y="60" width="70" height="68"/><rect fill="%23374151" x="970" y="40" width="60" height="88"/><rect fill="%23475569" x="1030" y="70" width="80" height="58"/><rect fill="%23374151" x="1110" y="30" width="90" height="98"/></svg>')`,
                     backgroundSize: 'cover',
                     backgroundRepeat: 'no-repeat',
                     backgroundPosition: 'bottom'
                   }}
              />
            </div>
          )}
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Top Section - Logo and Countdown */}
          <div className="flex items-start justify-between p-4">
            {/* Logo Section - More Compact */}
            <div className="flex items-center space-x-2">
              <div className="bg-cyan-400 text-black px-2 py-1 rounded font-bold text-sm">
                MTTA
              </div>
              <div className="text-white text-xs font-medium opacity-90">
                CONTENDER
              </div>
            </div>

            {/* Countdown Timer - WTT Style */}
            <div className="flex items-center space-x-1 bg-black/80 rounded-lg px-4 py-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countdown.days}</div>
                <div className="text-xs text-gray-300 -mt-1">Days</div>
              </div>
              <div className="text-white mx-1">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300 -mt-1">Hours</div>
              </div>
              <div className="text-white mx-1">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300 -mt-1">Minutes</div>
              </div>
              <div className="text-white mx-1">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300 -mt-1">Seconds</div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-end p-6">
            <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-6">
              {/* Left Section - Tournament Info */}
              <div className="flex-1 space-y-4">
                {/* Date Badge */}
                <div className="inline-flex items-center space-x-2">
                  <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1">
                    <span>⭐</span>
                    <span>{formatDateRange()}</span>
                  </div>
                </div>

                {/* Tournament Title */}
                <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight max-w-2xl">
                  {tournament.name}
                </h2>

                {/* Subtitle */}
                <div className="text-white/90 text-lg">
                  {tournament.description || "Ширээний теннисний төв"}
                </div>

                {/* Location */}
                <div className="text-white/90 text-lg">
                  {tournament.location}
                </div>

                {/* Prize Money */}
                <div className="flex items-center space-x-4">
                  {(tournament.prizeMoney || tournament.prizes) && (
                    <div className="text-white text-xl font-bold">
                      PRIZE MONEY: {tournament.prizeMoney || tournament.prizes}
                    </div>
                  )}
                  
                  {tournament.eventInfoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white text-white hover:bg-white hover:text-black"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(tournament.eventInfoUrl, '_blank');
                      }}
                    >
                      EVENT INFO
                    </Button>
                  )}
                </div>

                {/* Registration Button */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <TournamentRegistrationButton tournamentId={tournament.id} />
                </div>
              </div>

              {/* Right Section - Categories (WTT Style) */}
              <div className="w-full lg:w-80 space-y-3">
                {(tournament.categories || tournament.participationTypes || []).map((category, index) => {
                  const label = CATEGORY_LABELS[category] || formatParticipation(parseParticipation(category));
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white hover:bg-black/80 transition-colors"
                    >
                      <span className="font-medium">{label}</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                  );
                })}
                
                {(!tournament.categories || tournament.categories.length === 0) &&
                 (!tournament.participationTypes || tournament.participationTypes.length === 0) && (
                  <>
                    <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
                      <span className="font-medium">Эрэгтэй ганцаарчилсан</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
                      <span className="font-medium">Эмэгтэй ганцаарчилсан</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
                      <span className="font-medium">Эрэгтэй хосоор</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
                      <span className="font-medium">Эмэгтэй хосоор</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
                      <span className="font-medium">Холимог хосоор</span>
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      </div>
                    </div>
                  </>
                )}
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
    <PageWithLoading>
      <div className="min-h-screen">
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

            {/* Removed the "Create Tournament" button */}
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
            {/* Removed the "Create Tournament" button from empty state */}
          </div>
        ) : (
          <div className="space-y-6">
            {tournaments
              .sort((a: TournamentData, b: TournamentData) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((tournament: TournamentData) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
        )}
        </div>
      </div>
    </PageWithLoading>
  );
}