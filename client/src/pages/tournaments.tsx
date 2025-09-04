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
import { format, parseISO, isBefore, isAfter, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { Link } from "wouter"; // Imported Link for navigation

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
  participationTypes?: string[]; // Added for compatibility with the edit
  backgroundImageUrl?: string; // Added for compatibility with the edit
  prizes?: string; // Added for compatibility with the edit
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
  const mappedTournaments: Tournament[] = sortedTournaments.map((tournament: any) => ({
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

  const formatPrizePool = (prizePool?: { amount: number; currency: string } | string) => {
    if (!prizePool) return null;

    // Handle string prize pools directly
    if (typeof prizePool === 'string') {
      return prizePool;
    }

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

    // Using Link from wouter for client-side navigation
    // window.location.href = `/tournament/${tournament.id}`; // Removed to use Link
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

          {/* Skeleton for cards - Keeping original grid for loading state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // New implementation for hero rows layout
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd yyyy')}`;
    }
    return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd yyyy')}`;
  };

  const getTournamentStatus = (tournament: Tournament) => {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    if (now < start) {
      // Use date-fns for more robust relative time formatting
      const distance = formatDistanceToNow(start, { addSuffix: true });
      return { type: 'upcoming', text: `Starts ${distance}` };
    } else if (now >= start && now <= end) {
      const distance = formatDistanceToNow(end, { addSuffix: true });
      return { type: 'ongoing', text: `Ends ${distance}` };
    } else {
      return { type: 'finished', text: 'Finished' };
    }
  };

  const getCategories = (participationTypes: string[]) => {
    const categories = participationTypes.map(type => categoryLabels[type as keyof typeof categoryLabels] || type.substring(0, 2).toUpperCase());

    const menCategories = categories.filter(cat => ['MS', 'MD'].includes(cat));
    const womenCategories = categories.filter(cat => ['WS', 'WD'].includes(cat));
    const mixedCategories = categories.filter(cat => cat === 'XD');

    // Combine men's and mixed, and women's and mixed categories
    return {
      men: [...menCategories, ...mixedCategories].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates if any
      women: [...womenCategories, ...mixedCategories].filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates if any
    };
  };

  return (
    <PageWithLoading>
      <Navigation />

      {/* Header */}
      <div className="bg-gradient-to-r from-mtta-green to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Тэмцээнүүд</h1>
          <p className="text-xl text-green-100">Ширээний теннисний тэмцээнүүдийн бүрэн жагсаалт</p>
        </div>
      </div>

      {/* Tournament List - Hero Rows Layout */}
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
          <div className="space-y-6"> {/* Changed from grid to vertical spacing */}
            {mappedTournaments.map((tournament, index) => {
              const status = getTournamentStatus(tournament);
              const categories = getCategories(tournament.categories || []);
              const prizeText = formatPrizePool(tournament.prizePool);
              const flag = getCountryFlag(tournament.country); // Get country flag

              return (
                <Card 
                  key={tournament.id} 
                  className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 h-[360px] group relative"
                >
                  {/* Background Image with Overlay */}
                  <div className="relative h-full w-full">
                    <img
                      src={getCoverImage(tournament.coverUrl)}
                      alt={tournament.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={index < 3 ? "eager" : "lazy"} // Load first 3 eagerly
                      fetchPriority={index < 3 ? "high" : "auto"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/600/400'; // Fallback image
                      }}
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/0"></div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">

                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                      {/* Top Left - Flag and Date */}
                      <div className="flex flex-col space-y-1">
                        {flag && (
                          <div className="text-3xl"> {/* Increased flag size */}
                            {flag}
                          </div>
                        )}
                        <div className="text-white text-sm font-medium drop-shadow-lg">
                          {formatDateRange(tournament.startDate, tournament.endDate)}
                        </div>
                      </div>

                      {/* Top Right - Status */}
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                        {status.type === 'ongoing' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-sm font-medium">LIVE</span>
                          </div>
                        ) : (
                          <div className="text-white text-sm font-medium">
                            {status.text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Section - Tournament Name */}
                    <h2 className="text-white font-bold text-3xl leading-tight drop-shadow-lg line-clamp-2">
                      {tournament.name}
                    </h2>

                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

                      {/* Left Side - Venue & Location */}
                      <div className="flex-1 space-y-1">
                        {tournament.venue && (
                          <div className="text-white/90 text-lg font-medium drop-shadow-lg">
                            {tournament.venue}
                          </div>
                        )}
                        <div className="text-white/80 text-base drop-shadow-lg">
                          {tournament.city || tournament.location}
                          {tournament.country && `, ${tournament.country}`}
                        </div>
                      </div>

                      {/* Right Side - Categories (Desktop) */}
                      <div className="hidden lg:flex gap-4">
                        {/* Men's Categories */}
                        {categories.men.length > 0 && (
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                            <div className="text-white/80 text-sm font-medium mb-3">Men's</div>
                            <div className="space-y-2">
                              {categories.men.map((category, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-white text-sm">{category}</span>
                                  <div className={`w-6 h-6 rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'} flex items-center justify-center`}>
                                    <span className="text-white text-xs font-bold">{category}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Women's Categories */}
                        {categories.women.length > 0 && (
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                            <div className="text-white/80 text-sm font-medium mb-3">Women's</div>
                            <div className="space-y-2">
                              {categories.women.map((category, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-white text-sm">{category}</span>
                                  <div className={`w-6 h-6 rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'} flex items-center justify-center`}>
                                    <span className="text-white text-xs font-bold">{category}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Categories for Mobile */}
                      <div className="lg:hidden w-full">
                        <div className="flex flex-wrap gap-2">
                          {categories.men.map((category, idx) => (
                            <div 
                              key={idx} 
                              className={`${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-sm font-medium`}
                            >
                              {category}
                            </div>
                          ))}
                          {categories.women.map((category, idx) => (
                            <div 
                              key={idx} 
                              className={`${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-sm font-medium`}
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row - Action Button and Prize Money */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-auto">
                      {/* Action Button */}
                      <div>
                        <Link href={`/tournament/${tournament.id}`}>
                          <Button 
                            variant="outline" 
                            className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all font-bold px-6 py-2 rounded-full"
                            aria-label={`View details for ${tournament.name}`}
                          >
                            EVENT INFO
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>

                      {/* Prize Money */}
                      {prizeText && (
                        <div className="flex flex-col">
                          <div className="text-white/80 text-sm font-medium drop-shadow-lg">
                            PRIZE MONEY
                          </div>
                          <div className="text-yellow-400 text-xl font-bold drop-shadow-lg">
                            {prizeText}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </PageWithLoading>
  );
}