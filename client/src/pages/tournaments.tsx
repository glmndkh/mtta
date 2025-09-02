import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  Trophy, 
  MapPin, 
  Clock, 
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageWithLoading from "@/components/PageWithLoading";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  city?: string;
  country?: string;
  venue?: string;
  timezone?: string;
  status: string;
  series?: string;
  categories: string[];
  coverUrl?: string;
  prizePool?: {
    amount: number;
    currency: string;
  };
  registrationStatus?: 'open' | 'closed' | 'full';
  isLive?: boolean;
}

const categoryLabels = {
  'singles_men': 'MS',
  'singles_women': 'WS', 
  'doubles_men': 'MD',
  'doubles_women': 'WD',
  'mixed_doubles': 'XD'
};

const categoryColors = {
  'MS': 'bg-blue-600',
  'WS': 'bg-pink-600',
  'MD': 'bg-green-600', 
  'WD': 'bg-purple-600',
  'XD': 'bg-orange-600'
};

export default function Tournaments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Fetch all tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Sort tournaments by startDate DESC (newest first)
  const sortedTournaments = [...tournaments].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Map tournament data to expected format
  const mappedTournaments = sortedTournaments.map((tournament: any) => ({
    ...tournament,
    city: tournament.city || tournament.location?.split(',')[0]?.trim(),
    country: tournament.country || 'Mongolia',
    venue: tournament.venue || tournament.location,
    categories: tournament.categories || tournament.participationTypes || [],
    coverUrl: tournament.coverUrl || tournament.backgroundImageUrl,
    prizePool: tournament.prizePool || (tournament.prizes ? {
      amount: parseFloat(tournament.prizes.replace(/[^\d.]/g, '')) || 0,
      currency: 'MNT'
    } : null)
  }));

  // Helper functions
  const getEventStatus = (tournament: Tournament): 'upcoming' | 'ongoing' | 'past' => {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'past';
  };

  const getCountdown = (tournament: Tournament) => {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);
    const status = getEventStatus(tournament);

    if (status === 'upcoming') {
      const days = differenceInDays(start, now);
      const hours = differenceInHours(start, now) % 24;
      const minutes = differenceInMinutes(start, now) % 60;
      return `Starts in ${days}d ${hours}h ${minutes}m`;
    }

    if (status === 'ongoing') {
      const hours = differenceInHours(end, now);
      const minutes = differenceInMinutes(end, now) % 60;
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-500 font-bold">LIVE</span>
          <span className="text-xs text-white/80">{hours}h {minutes}m to end</span>
        </div>
      );
    }

    return 'Finished';
  };

  const formatPrizePool = (prizePool?: { amount: number; currency: string }) => {
    if (!prizePool) return null;

    const { amount, currency } = prizePool;

    if (currency === 'MNT') {
      return `${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} MNT`;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'USD' ? 0 : 2
    }).format(amount);
  };

  const getCoverImage = (coverUrl?: string) => {
    if (!coverUrl) return '/api/placeholder/600/400';
    return coverUrl.startsWith('http') ? coverUrl : `/objects/uploads/${coverUrl}`;
  };

  const getCountryFlag = (country?: string) => {
    if (!country) return null;

    // Simple mapping for Mongolia and common countries
    const countryToFlag: Record<string, string> = {
      'Mongolia': '🇲🇳',
      'China': '🇨🇳',
      'Japan': '🇯🇵',
      'Korea': '🇰🇷',
      'Russia': '🇷🇺',
      'Germany': '🇩🇪',
      'USA': '🇺🇸',
      'UK': '🇬🇧'
    };

    return countryToFlag[country] || null;
  };

  const organizeCategories = (categories: string[]) => {
    const leftColumn: string[] = [];
    const rightColumn: string[] = [];

    categories.forEach(cat => {
      // Handle both database format and display format
      let label = cat;
      if (categoryLabels[cat as keyof typeof categoryLabels]) {
        label = categoryLabels[cat as keyof typeof categoryLabels];
      } else if (cat.includes('эрэгтэй')) {
        if (cat.includes('Singles') || cat.includes('дан')) label = 'MS';
        else if (cat.includes('Doubles') || cat.includes('давхар')) label = 'MD';
      } else if (cat.includes('эмэгтэй')) {
        if (cat.includes('Singles') || cat.includes('дан')) label = 'WS';
        else if (cat.includes('Doubles') || cat.includes('давхар')) label = 'WD';
      } else if (cat.includes('холимог') || cat.includes('Mixed')) {
        label = 'XD';
      } else {
        label = cat.substring(0, 2).toUpperCase();
      }

      if (['MS', 'MD', 'XD'].includes(label)) {
        leftColumn.push(label);
      } else if (['WS', 'WD'].includes(label)) {
        rightColumn.push(label);
      }
    });

    return { leftColumn, rightColumn };
  };

  const handleEventInfoClick = (tournament: Tournament) => {
    // GA4 event
    // Track event click if gtag is available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'event_card_click', {
        id: tournament.id,
        action: 'info',
        position: mappedTournaments.indexOf(tournament)
      });
    }

    window.location.href = `/tournament/${tournament.id}`;
  };

  // GA4 page view
  useEffect(() => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'events_page_view');
    }
  }, []);

  if (isLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton for header */}
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Skeleton for cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <Trophy className="mr-3 h-8 w-8 text-mtta-green" />
                Тэмцээнүүд
              </h1>
              <p className="text-gray-600">
                Дэлхийн ширээний теннисний тэмцээнүүд
              </p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {mappedTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Тэмцээн байхгүй байна
              </h3>
              <p className="text-gray-600">
                Тун удахгүй шинэ тэмцээнүүд нэмэгдэх болно.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mappedTournaments.map((tournament, index) => {
                const status = getEventStatus(tournament);
                const countdown = getCountdown(tournament);
                const flag = getCountryFlag(tournament.country);
                const { leftColumn, rightColumn } = organizeCategories(tournament.categories || []);

                return (
                  <Card 
                    key={tournament.id} 
                    className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 group h-96 relative"
                  >
                    {/* Background Image with Overlay */}
                    <div className="relative h-full">
                      <img
                        src={getCoverImage(tournament.coverUrl)}
                        alt={tournament.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading={index < 3 ? "eager" : "lazy"}
                        fetchPriority={index < 3 ? "high" : "auto"}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/600/400';
                        }}
                      />

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/0"></div>

                      {/* Top Left - Flag and Date */}
                      <div className="absolute top-4 left-4 space-y-1">
                        {flag && (
                          <div className="text-2xl">
                            {flag}
                          </div>
                        )}
                        <div className="text-white text-sm font-medium drop-shadow-lg">
                          {format(new Date(tournament.startDate), 'MMM dd')}
                          {tournament.endDate && tournament.endDate !== tournament.startDate && (
                            ` – ${format(new Date(tournament.endDate), 'MMM dd yyyy')}`
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="absolute top-16 left-4 right-4">
                        <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg line-clamp-2">
                          {tournament.name}
                        </h2>
                      </div>

                      {/* Venue + Location */}
                      <div className="absolute top-32 left-4 right-4 space-y-1">
                        {tournament.venue && (
                          <div className="text-white/90 text-sm font-medium drop-shadow-lg">
                            {tournament.venue}
                          </div>
                        )}
                        <div className="text-white/80 text-sm drop-shadow-lg">
                          {tournament.city || tournament.location}
                          {tournament.country && `, ${tournament.country}`}
                        </div>
                      </div>

                      {/* Categories - Right Side */}
                      <div className="absolute top-4 right-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Left Column */}
                          <div className="space-y-2">
                            {leftColumn.map((category) => (
                              <div key={category} className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
                                <span className="text-white text-sm font-medium">
                                  {category === 'MS' ? "Men's Singles" : 
                                   category === 'MD' ? "Men's Doubles" : 
                                   category === 'XD' ? "Mixed Doubles" : category}
                                </span>
                                <Badge className={`${categoryColors[category as keyof typeof categoryColors]} text-white text-xs ml-2`}>
                                  {category}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-2">
                            {rightColumn.map((category) => (
                              <div key={category} className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
                                <span className="text-white text-sm font-medium">
                                  {category === 'WS' ? "Women's Singles" : 
                                   category === 'WD' ? "Women's Doubles" : category}
                                </span>
                                <Badge className={`${categoryColors[category as keyof typeof categoryColors]} text-white text-xs ml-2`}>
                                  {category}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Categories - Bottom on small screens */}
                      <div className="absolute bottom-20 left-4 right-4 md:hidden">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex flex-wrap gap-1">
                            {[...leftColumn, ...rightColumn].map((category) => (
                              <Badge key={category} className={`${categoryColors[category as keyof typeof categoryColors]} text-white text-xs`}>
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Left - Event Info Button */}
                      <div className="absolute bottom-4 left-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventInfoClick(tournament);
                          }}
                          className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-2 rounded-full transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          aria-label={`View details for ${tournament.name}`}
                        >
                          EVENT INFO
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>

                        {/* Prize Money - Below button */}
                        {tournament.prizePool && (
                          <div className="mt-2">
                            <div className="text-white font-bold text-lg drop-shadow-lg">
                              PRIZE MONEY
                            </div>
                            <div className="text-yellow-400 font-bold text-xl drop-shadow-lg">
                              {formatPrizePool(tournament.prizePool)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Right - Countdown/Status */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                          <div className="text-white text-sm font-medium text-right">
                            {typeof countdown === 'string' ? countdown : countdown}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </PageWithLoading>
  );
}