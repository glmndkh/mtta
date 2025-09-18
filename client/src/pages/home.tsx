import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Users, Building, Trophy, Medal, Calendar, Award, ExternalLink, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageWithLoading from "@/components/PageWithLoading";
import { format } from "date-fns";
import { formatName, getImageUrl } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Type definitions for API responses
interface SliderItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  active: boolean;
  buttonText?: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  publishedAt: string;
  authorId: string;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  backgroundImageUrl?: string;
  participationTypes: string[];
}

interface TopPlayer {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  rating?: number;
  rank?: number;
  category?: string;
}

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch active sliders
  const { data: sliders = [], isLoading: slidersLoading } = useQuery<SliderItem[]>({
    queryKey: ['/api/sliders'],
    enabled: true,
  });

  // Fetch latest news
  const { data: latestNews = [], isLoading: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ['/api/news/latest'],
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch upcoming tournaments
  const { data: upcomingTournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/upcoming'],
    enabled: true,
  });

  // Fetch top players
  const { data: topPlayers = [], isLoading: playersLoading } = useQuery<TopPlayer[]>({
    queryKey: ['/api/players/top'],
    enabled: true,
  });

  // Fetch active sponsors
  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery<any[]>({
    queryKey: ['/api/sponsors'],
    enabled: true,
  });

  const [selectedPlayerCategory, setSelectedPlayerCategory] = useState('all');

  // Auto-play slider
  useEffect(() => {
    if (sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [sliders.length]);

  // Helper function to get image URL
  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/public-objects/')) return imageUrl;
    if (imageUrl.startsWith('/objects/')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return `/public-objects${imageUrl}`;
    }

    return `/public-objects/${imageUrl}`;
  };

  // Helper function to strip HTML tags
  const stripHtml = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Helper function to get participation type chips
  const getParticipationChips = (types: string[]) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'singles_men': { label: 'MS', color: 'bg-blue-500' },
      'singles_women': { label: 'WS', color: 'bg-pink-500' },
      'doubles_men': { label: 'MD', color: 'bg-green-500' },
      'doubles_women': { label: 'WD', color: 'bg-purple-500' },
      'mixed_doubles': { label: 'XD', color: 'bg-orange-500' },
    };

    return types.map(type => typeMap[type] || { label: type.substring(0, 2).toUpperCase(), color: 'bg-gray-500' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen">




        <Navigation />

        {/* Hero Section */}
        <section className="relative">
          {/* Hero Slider */}
          {slidersLoading ? (
            <div className="bg-gradient-to-r from-mtta-green to-green-700 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-12 w-3/4 mb-4 bg-white bg-opacity-20" />
                <Skeleton className="h-6 w-1/2 bg-white bg-opacity-20" />
              </div>
            </div>
          ) : sliders.length > 0 ? (
            <div className="relative w-full h-[550px] sm:h-[600px] md:h-[700px] overflow-hidden hero-slider">
              {/* Slides */}
              <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {sliders.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="w-full flex-shrink-0 relative"
                    style={{
                      backgroundImage: slide.imageUrl
                        ? `url(${getImageUrl(slide.imageUrl)})`
                        : 'linear-gradient(to right, #10b981, #047857)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full flex items-center">
                      <div className="text-white space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in">
                        {slide.title && slide.title.trim() && (
                          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">{slide.title}</h1>
                        )}
                        {slide.description && (
                          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200">{slide.description}</p>
                        )}
                        {slide.linkUrl && (
                          <div className="relative z-10">
                            <Link href={slide.linkUrl}>
                              <Button
                                size="lg"
                                className="bg-white text-mtta-green hover:bg-gray-100 font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = slide.linkUrl!;
                                }}
                              >
                                {slide.buttonText || "Дэлгэрэнгүй"}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation arrows */}
              {sliders.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-mtta-green p-2 rounded-full transition-all duration-200 hover:scale-110 z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) => (prev + 1) % sliders.length);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-mtta-green p-2 rounded-full transition-all duration-200 hover:scale-110 z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {sliders.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {sliders.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlide(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-200 z-10 ${
                        index === currentSlide
                          ? 'bg-white scale-110'
                          : 'bg-white bg-opacity-50 hover:bg-opacity-80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-mtta-green to-green-700 text-white py-20">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
            </div>
          )}

          {/* Default Hero Content when no sliders */}
          {!slidersLoading && sliders.length === 0 && (
            <div className="bg-gradient-to-r from-mtta-green to-green-700 text-white py-20">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
            </div>
          )}


        </section>

        {/* Main Content - Remaining Blocks */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-16">



          {/* 1. Шинэ мэдээ */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Шинэ мэдээ</h2>
              <Link href="/news">
                <Button variant="outline" className="flex items-center gap-2">
                  Бүгдийг харах
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {newsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestNews.slice(0, 4).map((news) => (
                  <Card key={news.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/news/${news.id}`}>
                    <div className="aspect-video relative overflow-hidden">
                      {news.imageUrl ? (
                        <img
                          src={getImageUrl(news.imageUrl)}
                          alt={news.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = getImageUrl('');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                          <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                        {stripHtml(news.title)}
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                        {news.summary ? stripHtml(news.summary) : stripHtml(news.content || '').substring(0, 100) + '...'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* 2. Топ тамирчид */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Топ тамирчид</h2>

              {/* Category Filter Chips */}
              <div className="flex gap-2">
                {['all', 'men', 'women', 'junior'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedPlayerCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlayerCategory(category)}
                    className={selectedPlayerCategory === category ? 'bg-mtta-green text-white' : ''}
                  >
                    {category === 'all' ? 'Бүгд' :
                     category === 'men' ? 'Эрэгтэй' :
                     category === 'women' ? 'Эмэгтэй' : 'Залуучууд'}
                  </Button>
                ))}
              </div>
            </div>

            {playersLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="text-center">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {topPlayers.slice(0, 8).map((player) => (
                  <div key={player.id} className="text-center group cursor-pointer" onClick={() => window.location.href = `/player/${player.id}`}>
                    <div className="relative mb-3">
                      {player.profileImageUrl ? (
                        <img
                          src={getImageUrl(player.profileImageUrl)}
                          alt={formatName(player.firstName, player.lastName)}
                          className="w-16 h-16 rounded-full mx-auto object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-mtta-green text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                          <span className="text-lg font-bold">
                            {player.lastName?.[0]}{player.firstName?.[0]}
                          </span>
                        </div>
                      )}
                      {player.rank && player.rank <= 3 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
                          {player.rank}
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 group-hover:text-mtta-green transition-colors">
                      {formatName(player.firstName, player.lastName)}
                    </h4>
                    {player.rating && (
                      <p className="text-xs text-gray-600">{player.rating} pts</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Ивээн тэтгэгчид */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Ивээн тэтгэгчид</h2>
              <p className="text-gray-600 mt-2">Монголын ширээний теннисийг дэмжигч байгууллагууд</p>
            </div>

            {sponsorsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sponsors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="flex items-center justify-center group">
                    {sponsor.logoUrl ? (
                      <img
                        src={getImageUrl(sponsor.logoUrl)}
                        alt={sponsor.name}
                        className="max-h-16 max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4 border-2 border-dashed border-gray-200 rounded-lg group-hover:border-mtta-green transition-colors">
                        <span className="font-medium text-sm">{sponsor.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Удахгүй ивээн тэтгэгчдийн мэдээлэл нэмэгдэх болно</p>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </PageWithLoading>
  );
}