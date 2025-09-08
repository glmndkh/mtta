import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Clock, Trophy, DollarSign } from "lucide-react";
import PageWithLoading from "@/components/PageWithLoading";
import RegistrationForm from "@/components/RegistrationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventHeroRow } from '@/components/EventHeroRow';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { ParticipantsTab } from '@/components/ParticipantsTab';
import { queryClient } from '@/lib/queryClient';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  richDescription?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  backgroundImageUrl?: string;
  coverUrl?: string;
  backgroundUrl?: string;
  background?: string;
  heroImage?: string;
  imageUrl?: string;
  image?: string;
  venue?: string;
  city?: string;
  country?: string;
  participationTypes: string[];
  eligibility?: Record<string, {
    genders?: ("male"|"female")[];
    minAge?: number;
    maxAge?: number;
  }>;
  organizer?: string;
  maxParticipants?: number;
  entryFee?: string;
  rules?: string;
  prizes?: string;
}

export default function EventDetail() {
  const { id } = useParams();
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch tournament data
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${id}`],
    enabled: !!id,
  });

  // Handle hash navigation
  useEffect(() => {
    const hash = location.split('#')[1];
    if (hash) {
      setActiveTab(hash);
      // Smooth scroll to section after data loads
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location, tournament]);

  // Helper function to get image URL with fallback order
  const getImageUrl = (tournament: Tournament): string => {
    const imageFields = [
      tournament.coverUrl,
      tournament.backgroundImageUrl,
      tournament.backgroundUrl,
      tournament.background,
      tournament.heroImage,
      tournament.imageUrl,
      tournament.image
    ];

    const imageUrl = imageFields.find(url => url && url.trim() !== '');

    if (!imageUrl) return '';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }

    return `/${imageUrl}`;
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return format(start, 'yyyy.MM.dd', { locale: mn });
    }

    return `${format(start, 'yyyy.MM.dd', { locale: mn })}–${format(end, 'yyyy.MM.dd', { locale: mn })}`;
  };

  const tabs = [
    { id: 'overview', label: 'Тойм' },
    { id: 'groups', label: 'Хэсгийн тоглолтууд' },
    { id: 'schedule', label: 'Хуваарь' },
    { id: 'players', label: 'Баг тамирчид' },
    { id: 'album', label: 'Альбом' },
    { id: 'about', label: 'Тэмцээний дэлгэрэнгүй' },
    { id: 'register', label: 'Бүртгүүлэх' },
  ];

  if (isLoading) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-80 w-full rounded-2xl mb-8" />
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Тэмцээн олдсонгүй</h1>
              <p className="text-gray-600">Уучлаарай, энэ тэмцээний мэдээлэл олдсонгүй.</p>
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  const imageUrl = getImageUrl(tournament);
  const venue = tournament.venue || tournament.location;
  const cityCountry = [tournament.city, tournament.country].filter(Boolean).join(', ');

  return (
    <PageWithLoading>
      <div className="min-h-screen">
        <Navigation />

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative min-h-[260px] md:h-[360px] rounded-2xl overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={tournament.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700"></div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/0"></div>

            <div className="absolute left-4 bottom-4 md:left-6 md:bottom-6 text-white max-w-[90%] md:max-w-[70%]">
              <div className="mb-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg mb-3 leading-snug line-clamp-2">
                {tournament.name}
              </h1>

              {(venue || cityCountry) && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{[venue, cityCountry].filter(Boolean).join(' / ')}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Category Selection Dropdown */}
                {tournament.participationTypes && tournament.participationTypes.length > 0 && (
                  <select
                    className="rounded-full bg-white/20 text-white border border-white/30 px-3 py-2 text-sm font-medium backdrop-blur-sm focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-green-600"
                    defaultValue=""
                  >
                    <option value="" disabled>Ангилал сонгох</option>
                    {tournament.participationTypes.map((type) => (
                      <option key={type} value={type} className="text-gray-900">
                        {type}
                      </option>
                    ))}
                  </select>
                )}
                
                <Button
                  onClick={() => {
                    setActiveTab('register');
                    setTimeout(() => {
                      const element = document.getElementById('register');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="rounded-full bg-white text-gray-900 px-4 py-2 font-bold hover:bg-gray-100 focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                >
                  Бүртгүүлэх
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sticky top-16 z-10 bg-white/80 backdrop-blur border-b mt-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Ерөнхий</TabsTrigger>
                <TabsTrigger value="participants">Оролцогчид</TabsTrigger>
                <TabsTrigger value="results">Үр дүн</TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="py-8 space-y-16">
                <TabsContent value="overview" className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Тэмцээний тухай</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tournament.richDescription ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: tournament.richDescription }}
                        />
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">
                          {tournament.description || "Тэмцээний дэлгэрэнгүй мэдээлэл оруулаагүй байна."}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ерөнхий мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Эхлэх огноо</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tournament.startDate), "yyyy оны MM сарын dd", { locale: mn })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Дуусах огноо</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tournament.endDate), "yyyy оны MM сарын dd", { locale: mn })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Байршил</p>
                              <p className="text-sm text-muted-foreground">{tournament.location}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {tournament.organizer && (
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Зохион байгуулагч</p>
                                <p className="text-sm text-muted-foreground">{tournament.organizer}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Хамгийн олон оролцогч</p>
                              <p className="text-sm text-muted-foreground">{tournament.maxParticipants} хүн</p>
                            </div>
                          </div>

                          {tournament.entryFee && tournament.entryFee !== "0" && (
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Оролцооны хураамж</p>
                                <p className="text-sm text-muted-foreground">{tournament.entryFee}₮</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {tournament.participationTypes && tournament.participationTypes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Оролцох ангилал</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {tournament.participationTypes.map((type) => (
                            <Badge key={type} variant="secondary">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {tournament.rules && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Дүрэм журам</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {tournament.rules}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {tournament.prizes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Шагнал урамшуулал</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {tournament.prizes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="participants" className="space-y-6">
                  <ParticipantsTab tournamentId={tournament.id} />
                </TabsContent>

                <TabsContent value="results" className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Тэмцээний үр дүн</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Тэмцээний үр дүнгүүд удахгүй нэмэгдэх болно.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </PageWithLoading>
  );
}