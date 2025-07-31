import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, Ticket } from "lucide-react";

interface TournamentData {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  prizeMoney: string;
  backgroundImage: string;
  categories: string[];
  eventInfoUrl: string;
  ticketUrl: string;
  id: string;
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
  "team": "Багийн төрөл"
};

export default function TournamentPage() {
  const [match, params] = useRoute("/tournament/:id");
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    if (params?.id) {
      // Load tournament data from localStorage
      const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
      const foundTournament = tournaments.find((t: TournamentData) => t.id === params.id);
      setTournament(foundTournament || null);
    }
  }, [params?.id]);

  // Countdown timer logic
  useEffect(() => {
    if (!tournament?.startDate) return;

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
  }, [tournament]);

  if (!match || !tournament) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Тэмцээн олдсонгүй</h1>
          <p className="text-gray-400">Хүссэн тэмцээн байхгүй байна.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateRange = () => {
    const startFormatted = formatDate(tournament.startDate);
    const endFormatted = formatDate(tournament.endDate);
    const year = new Date(tournament.startDate).getFullYear();
    
    return `${startFormatted} – ${endFormatted} ${year}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {/* Custom background or uploaded image */}
        {tournament.backgroundImage ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${tournament.backgroundImage})`
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
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bottom-0 bg-gradient-to-t from-yellow-300/40 to-transparent"
                    style={{
                      left: `${i * 5}%`,
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
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Content */}
              <div className="space-y-6">
                {/* Date Badge */}
                <div className="inline-flex items-center space-x-2 text-white">
                  <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold">🇲🇳</span>
                  </div>
                  <span className="text-sm bg-black/30 px-3 py-1 rounded">
                    {formatDateRange()}
                  </span>
                </div>
                
                {/* Tournament Name */}
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  {tournament.name}
                </h1>
                
                {/* Location */}
                <div className="space-y-1 text-white">
                  <p className="text-lg font-medium">{tournament.location}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {tournament.eventInfoUrl && (
                    <Button 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-black"
                      onClick={() => window.open(tournament.eventInfoUrl, '_blank')}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Тэмцээний мэдээлэл
                    </Button>
                  )}
                  {tournament.ticketUrl && (
                    <Button 
                      className="bg-white text-black hover:bg-gray-100"
                      onClick={() => window.open(tournament.ticketUrl, '_blank')}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Тасалбар захиалах
                    </Button>
                  )}
                </div>

                {/* Prize Money */}
                {tournament.prizeMoney && (
                  <div className="pt-4">
                    <p className="text-white text-lg font-medium">
                      Шагналын сан: <span className="font-bold">{tournament.prizeMoney}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Right Content - Countdown and Categories */}
              <div className="space-y-6">
                {/* Countdown Timer */}
                <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.days.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Өдөр</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.hours.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Цаг</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.minutes.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Минут</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.seconds.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Секунд</div>
                    </div>
                  </div>
                </div>

                {/* Category Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tournament.categories.map((category, index) => (
                    <div
                      key={category}
                      className="bg-black/70 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-black/80"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-white font-medium text-sm">
                          {CATEGORY_LABELS[category] || category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4 text-white/80 text-sm">
                <span>Монголын ширээний теннисний холбоо</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Хуваарь
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Үр дүн
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Тамирчид
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}