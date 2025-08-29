
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import PageLayout from '../components/PageLayout';
import { useToast } from '../hooks/use-toast';

interface Competition {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  locationText: string;
  categories: string[];
  registrationUrl: string;
  backgroundImageUrl?: string;
  showCountdown: boolean;
  description?: string;
  maxParticipants?: number;
  entryFee?: string;
  status: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
  isLive: boolean;
}

export default function CompetitionHero() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFinished: false,
    isLive: false,
  });

  // Fetch competition data
  const { data: competition, isLoading, error } = useQuery({
    queryKey: ['competition', id],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) throw new Error('Competition not found');
      return response.json() as Competition;
    },
    enabled: !!id,
    retry: 2,
  });

  // Countdown timer logic
  useEffect(() => {
    if (!competition) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(competition.endDate).getTime();
      const startTime = new Date(competition.startDate).getTime();
      
      if (now < startTime) {
        // Before start - countdown to start
        const difference = startTime - now;
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          isFinished: false,
          isLive: false,
        };
      } else if (now >= startTime && now <= endTime) {
        // During event - show "LIVE"
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isFinished: false,
          isLive: true,
        };
      } else {
        // After end - show "FINISHED"
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isFinished: true,
          isLive: false,
        };
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Calculate initial state
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [competition]);

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short' 
    };
    
    const startFormatted = start.toLocaleDateString('en-US', options);
    const endFormatted = end.toLocaleDateString('en-US', options);
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${startFormatted} ${start.getFullYear()} – ${endFormatted} ${end.getFullYear()}`;
    }
    
    return `${startFormatted} – ${endFormatted} ${end.getFullYear()}`;
  };

  // Category labels mapping
  const categoryLabels = {
    'MS': 'Men\'s Singles',
    'WS': 'Women\'s Singles', 
    'MD': 'Men\'s Doubles',
    'WD': 'Women\'s Doubles',
    'XD': 'Mixed Doubles',
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'MS': 'bg-blue-500 text-white',
      'WS': 'bg-pink-500 text-white',
      'MD': 'bg-green-500 text-white',
      'WD': 'bg-purple-500 text-white',
      'XD': 'bg-orange-500 text-white',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading competition...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !competition) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Competition Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The competition you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const backgroundImage = competition.backgroundImageUrl 
    ? `url(${competition.backgroundImageUrl.startsWith('/') ? competition.backgroundImageUrl : `/objects/uploads/${competition.backgroundImageUrl}`})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section 
          className="relative h-[300px] md:h-[480px] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
          
          {/* Content Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between h-full py-8">
              
              {/* Left Content */}
              <div className="flex-1 lg:pr-8">
                {/* Date Badge */}
                <div className="mb-4">
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1 text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                    {formatDateRange(competition.startDate, competition.endDate)}
                  </Badge>
                </div>
                
                {/* Main Title */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {competition.name}
                </h1>
                
                {/* Location */}
                <div className="flex items-center text-white/90 mb-6 text-lg md:text-xl">
                  <MapPin className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  <span>{competition.locationText}</span>
                </div>

                {/* Categories - Mobile: Below title, Desktop: Right side */}
                <div className="lg:hidden mb-6">
                  <div className="flex flex-wrap gap-2">
                    {competition.categories?.map((category) => (
                      <Badge
                        key={category}
                        className={`${getCategoryColor(category)} px-3 py-1 text-sm font-medium`}
                      >
                        {categoryLabels[category as keyof typeof categoryLabels] || category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="mt-8">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
                    onClick={() => {
                      if (competition.registrationUrl) {
                        window.open(competition.registrationUrl, '_self');
                      } else {
                        toast({
                          title: "Registration not available",
                          description: "Registration link is not set for this competition.",
                          variant: "destructive",
                        });
                      }
                    }}
                    aria-label={`Register for ${competition.name}`}
                  >
                    Дэлгэрэнгүй
                    <ExternalLink className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              
              {/* Right Content - Desktop only */}
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:justify-between h-full py-4">
                
                {/* Countdown Timer */}
                {competition.showCountdown && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                    {timeLeft.isLive ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">LIVE</div>
                        <div className="text-white/80 text-sm">Event in progress</div>
                      </div>
                    ) : timeLeft.isFinished ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400 mb-1">FINISHED</div>
                        <div className="text-white/80 text-sm">Event completed</div>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <div className="text-sm text-white/80 mb-2">Event starts in</div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-2xl font-bold">{timeLeft.days.toString().padStart(2, '0')}</div>
                            <div className="text-xs">Days</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                            <div className="text-xs">Hours</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                            <div className="text-xs">Min</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                            <div className="text-xs">Sec</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Categories */}
                <div className="flex flex-col gap-2 items-end">
                  {competition.categories?.map((category) => (
                    <Badge
                      key={category}
                      className={`${getCategoryColor(category)} px-3 py-1 text-sm font-medium`}
                    >
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Competition Info */}
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Description */}
              {competition.description && (
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    About the Competition
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {competition.description}
                  </p>
                </div>
              )}
              
              {/* Competition Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Competition Details
                </h3>
                <div className="space-y-3">
                  {competition.maxParticipants && (
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Max {competition.maxParticipants} participants</span>
                    </div>
                  )}
                  {competition.entryFee && competition.entryFee !== '0' && (
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <span className="w-4 h-4 mr-2">💰</span>
                      <span>Entry fee: {competition.entryFee}₮</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="w-4 h-4 mr-2">📋</span>
                    <span>Status: {competition.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
