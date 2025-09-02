
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  Trophy, 
  MapPin, 
  Clock, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Search,
  ExternalLink,
  X
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageWithLoading from "@/components/PageWithLoading";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths, subMonths, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

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
  participationTypes: string[];
  coverUrl?: string;
  prizePool?: {
    amount: number;
    currency: string;
  };
  registrationStatus?: 'open' | 'closed' | 'full';
  isLive?: boolean;
}

const seriesOptions = [
  { value: 'grand_smash', label: 'Grand Smash', color: 'bg-red-600' },
  { value: 'champions', label: 'Champions', color: 'bg-purple-600' },
  { value: 'star_contender', label: 'Star Contender', color: 'bg-blue-600' },
  { value: 'contender', label: 'Contender', color: 'bg-green-600' },
  { value: 'feeder', label: 'Feeder', color: 'bg-yellow-600' },
  { value: 'youth', label: 'Youth', color: 'bg-pink-600' },
  { value: 'para', label: 'Para', color: 'bg-indigo-600' },
];

const categoryChips = [
  { id: 'singles_men', label: 'MS', value: 'singles_men', color: 'bg-blue-500' },
  { id: 'singles_women', label: 'WS', value: 'singles_women', color: 'bg-pink-500' },
  { id: 'doubles_men', label: 'MD', value: 'doubles_men', color: 'bg-green-500' },
  { id: 'doubles_women', label: 'WD', value: 'doubles_women', color: 'bg-purple-500' },
  { id: 'mixed_doubles', label: 'XD', value: 'mixed_doubles', color: 'bg-orange-500' },
];

export default function Tournaments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // URL state management
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchDebounced, setSearchDebounced] = useState<string>('');
  const [cursor, setCursor] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'upcoming') params.set('status', activeTab);
    if (selectedMonth.getTime() !== new Date().getTime()) {
      params.set('month', format(selectedMonth, 'yyyy-MM'));
    }
    if (selectedSeries.length > 0) params.set('series', selectedSeries.join(','));
    if (searchDebounced) params.set('search', searchDebounced);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState(null, '', `/tournaments${newUrl}`);

    // GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'events_filter_change', {
        status: activeTab,
        month: format(selectedMonth, 'yyyy-MM'),
        series: selectedSeries.join(',')
      });
    }
  }, [activeTab, selectedMonth, selectedSeries, searchDebounced]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status') as 'upcoming' | 'ongoing' | 'past';
    const urlMonth = params.get('month');
    const urlSeries = params.get('series');
    const urlSearch = params.get('search');
    
    if (urlStatus && ['upcoming', 'ongoing', 'past'].includes(urlStatus)) {
      setActiveTab(urlStatus);
    }
    if (urlMonth) {
      const monthDate = new Date(urlMonth);
      if (!isNaN(monthDate.getTime())) {
        setSelectedMonth(monthDate);
      }
    }
    if (urlSeries) {
      setSelectedSeries(urlSeries.split(',').filter(Boolean));
    }
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, []);

  // Build API query
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      status: activeTab,
      month: format(selectedMonth, 'yyyy-MM'),
    };
    if (selectedSeries.length > 0) params.series = selectedSeries.join(',');
    if (searchDebounced) params.search = searchDebounced;
    if (cursor) params.cursor = cursor;
    return params;
  }, [activeTab, selectedMonth, selectedSeries, searchDebounced, cursor]);

  // Fetch tournaments
  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/events', queryParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams(queryParams);
      const response = await fetch(`/api/events?${searchParams}`);
      if (!response.ok) {
        // Fallback to existing API
        const fallbackResponse = await fetch('/api/tournaments');
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        const tournaments = await fallbackResponse.json();
        return { items: tournaments, nextCursor: null };
      }
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  const tournaments = tournamentsData?.items || [];
  const nextCursor = tournamentsData?.nextCursor;

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
          <span className="text-xs text-gray-300">{hours}h {minutes}m to end</span>
        </div>
      );
    }

    return 'Finished';
  };

  const getSeriesBadge = (series?: string) => {
    const seriesData = seriesOptions.find(s => s.value === series);
    if (!seriesData) return null;

    return (
      <Badge className={`${seriesData.color} text-white text-xs font-bold`}>
        {seriesData.label}
      </Badge>
    );
  };

  const formatPrizePool = (prizePool?: { amount: number; currency: string }) => {
    if (!prizePool) return null;

    const { amount, currency } = prizePool;
    if (currency === 'MNT') {
      return `${amount.toLocaleString()}₮`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getParticipationChips = (types: string[]) => {
    return types.map(type => {
      const chip = categoryChips.find(c => c.value === type);
      return chip || { label: type.substring(0, 2).toUpperCase(), color: 'bg-gray-500' };
    });
  };

  const getCoverImage = (coverUrl?: string) => {
    if (!coverUrl) return '/api/placeholder/400/240';
    return coverUrl.startsWith('http') ? coverUrl : `/objects/uploads/${coverUrl}`;
  };

  // Filter tournaments by current tab
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      const status = getEventStatus(tournament);
      return status === activeTab;
    });
  }, [tournaments, activeTab]);

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(selectedMonth, 1) : addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
  };

  // Generate month options (current month ± 2)
  const monthOptions = useMemo(() => {
    const current = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const month = addMonths(current, i - 2);
      return {
        date: month,
        label: format(month, 'MMM yyyy'),
        value: format(month, 'yyyy-MM'),
      };
    });
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      setCursor(nextCursor);
      
      // GA4 event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'events_load_more', {
          count: tournaments.length
        });
      }
    }
  };

  const handleCardClick = (tournament: Tournament, action: 'details' | 'register' | 'results') => {
    // GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'event_card_click', {
        id: tournament.id,
        action,
        position: filteredTournaments.indexOf(tournament)
      });
    }

    // Navigate based on action
    if (action === 'details') {
      window.location.href = `/tournament/${tournament.id}`;
    } else if (action === 'register') {
      window.location.href = `/tournament/${tournament.id}/register`;
    } else if (action === 'results') {
      window.location.href = `/tournament/${tournament.id}/results`;
    }
  };

  if (isLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton for tabs */}
          <div className="flex gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          
          {/* Skeleton for filters */}
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>

          {/* Skeleton for cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 w-full" />
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

        {/* Status Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              {[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'ongoing', label: 'Ongoing' },
                { key: 'past', label: 'Past' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 font-semibold text-sm border-b-2 transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'border-mtta-green text-mtta-green bg-green-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Filters */}
        <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col gap-4">
              
              {/* Month Scroller */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex gap-2 overflow-x-auto">
                  {monthOptions.map((month) => (
                    <Button
                      key={month.value}
                      variant={format(selectedMonth, 'yyyy-MM') === month.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMonth(month.date)}
                      className={`whitespace-nowrap ${
                        format(selectedMonth, 'yyyy-MM') === month.value ? 'bg-mtta-green text-white' : ''
                      }`}
                    >
                      {month.label}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Series Chips and Search */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                {/* Series Chips */}
                <div className="flex gap-2 flex-wrap">
                  {seriesOptions.map((series) => (
                    <Button
                      key={series.value}
                      variant={selectedSeries.includes(series.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedSeries(prev => 
                          prev.includes(series.value)
                            ? prev.filter(s => s !== series.value)
                            : [...prev, series.value]
                        );
                      }}
                      className={`text-xs ${
                        selectedSeries.includes(series.value) 
                          ? `${series.color} text-white` 
                          : 'border-gray-300'
                      }`}
                    >
                      {series.label}
                    </Button>
                  ))}
                  
                  {selectedSeries.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSeries([])}
                      className="text-xs text-gray-600 border-gray-300"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Нэр, хот, улсаар хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Энэ сонголтоор тэмцээн алга
              </h3>
              <p className="text-gray-600 mb-6">
                Шүүлтүүрээ өөрчлөөд дахин оролдоно уу.
              </p>
              <Button onClick={() => {
                setSelectedSeries([]);
                setSearchQuery('');
                setSelectedMonth(new Date());
              }}>
                Бүх шүүлтүүрийг арилгах
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament) => {
                  const status = getEventStatus(tournament);
                  const countdown = getCountdown(tournament);
                  
                  return (
                    <Card 
                      key={tournament.id} 
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
                      onClick={() => handleCardClick(tournament, 'details')}
                    >
                      {/* Background Image with Overlay */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getCoverImage(tournament.coverUrl)}
                          alt={tournament.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/400/240';
                          }}
                        />
                        
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                        
                        {/* Series Badge - Top Left */}
                        <div className="absolute top-3 left-3">
                          {getSeriesBadge(tournament.series)}
                        </div>

                        {/* Prize Pool - Top Right */}
                        {tournament.prizePool && (
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
                            <div className="flex items-center gap-1 text-white">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-bold">
                                {formatPrizePool(tournament.prizePool)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Tournament Info - Bottom Left */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-mtta-green transition-colors">
                            {tournament.name}
                          </h3>
                          
                          <div className="flex items-center text-white/80 text-sm mb-2">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            <span>
                              {format(new Date(tournament.startDate), 'MMM dd')}
                              {tournament.endDate && tournament.endDate !== tournament.startDate && (
                                ` – ${format(new Date(tournament.endDate), 'MMM dd')}`
                              )}
                            </span>
                            <MapPin className="w-4 h-4 ml-3 mr-1" />
                            <span className="truncate">
                              {tournament.city || tournament.location}
                              {tournament.country && `, ${tournament.country}`}
                            </span>
                          </div>

                          {/* Categories */}
                          <div className="flex gap-1 mb-3">
                            {getParticipationChips(tournament.participationTypes || []).map((chip, index) => (
                              <span 
                                key={index} 
                                className={`${chip.color} text-white text-xs px-2 py-1 rounded font-medium`}
                              >
                                {chip.label}
                              </span>
                            ))}
                          </div>

                          {/* Countdown - Bottom Right */}
                          <div className="absolute bottom-0 right-0 bg-black/60 backdrop-blur-sm rounded-tl-lg px-3 py-2">
                            <div className="text-white text-sm font-medium">
                              {typeof countdown === 'string' ? countdown : countdown}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(tournament, 'details');
                            }}
                            className="text-mtta-green hover:text-green-700 p-0 h-auto font-normal"
                          >
                            Дэлгэрэнгүй
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>

                          {status === 'upcoming' ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(tournament, 'register');
                              }}
                              className="bg-mtta-green hover:bg-green-700 text-white"
                              disabled={tournament.registrationStatus === 'closed'}
                            >
                              Бүртгүүлэх
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(tournament, 'results');
                              }}
                              className="border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white"
                            >
                              Үр дүн
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="text-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    size="lg"
                    className="px-8"
                  >
                    Цааш үзэх
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </PageWithLoading>
  );
}
