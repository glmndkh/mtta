import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Ticket } from "lucide-react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number; 
  seconds: number;
}

export default function TournamentLanding() {
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Tournament data - structured for future dynamic binding
  const tournamentData = {
    eventName: "WTT Champions Yokohama 2025",
    location: "Yokohama BUNTAI, Japan",
    country: "🇯🇵",
    startDate: "7 Aug",
    endDate: "11 Aug 2025",
    prizeMoney: "USD 500,000",
    categories: [
      { id: "men", name: "Men's Singles", active: true },
      { id: "women", name: "Women's Singles", active: false }
    ],
    targetDate: new Date("2025-08-07T00:00:00")
  };

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = tournamentData.targetDate.getTime();
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
  }, [tournamentData.targetDate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Night City */}
      <div className="absolute inset-0">
        {/* City skyline background */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
            `
          }}
        />
        {/* City lights overlay */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-yellow-400/20 via-orange-400/10 to-transparent"></div>
          {/* Simulated building lights */}
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
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Content */}
              <div className="space-y-6">
                {/* WTT Champions Logo and Brand */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg">
                      <span className="text-white font-bold text-lg">WTT</span>
                      <span className="text-white font-light text-sm ml-1">CHAMPIONS</span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-white">
                    <span className="text-2xl">{tournamentData.country}</span>
                    <span className="text-sm bg-black/30 px-2 py-1 rounded">
                      {tournamentData.startDate} – {tournamentData.endDate}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                    {tournamentData.eventName}
                  </h1>
                  
                  <div className="space-y-1 text-white">
                    <p className="text-lg font-medium">{tournamentData.location}</p>
                    <p className="text-sm opacity-90">Japan</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                    <Info className="w-4 h-4 mr-2" />
                    EVENT INFO
                  </Button>
                  <Button className="bg-white text-black hover:bg-gray-100">
                    <Ticket className="w-4 h-4 mr-2" />
                    TICKETS
                  </Button>
                </div>

                {/* Prize Money */}
                <div className="pt-4">
                  <p className="text-white text-lg font-medium">
                    PRIZE MONEY: <span className="font-bold">{tournamentData.prizeMoney}</span>
                  </p>
                </div>
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
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Days</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.hours.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Hours</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.minutes.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Minutes</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-white">
                        {countdown.seconds.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-300 uppercase tracking-wide">Seconds</div>
                    </div>
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {tournamentData.categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex-1 bg-black/70 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-black/80 ${
                        category.active ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {category.id === 'men' ? '♂' : '♀'}
                          </span>
                        </div>
                        <span className="text-white font-medium text-sm">
                          {category.name}
                        </span>
                      </div>
                      {category.active && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation/Footer */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4 text-white/80 text-sm">
                <span>World Table Tennis</span>
                <span>•</span>
                <span>Champions Series</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Schedule
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Results
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  Players
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}