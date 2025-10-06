import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Phone, Mail, Clock, Grid3x3, Search, ChevronDown, Facebook, Instagram } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Navigation from '@/components/navigation';
import PageWithLoading from '@/components/PageWithLoading';
import { Club } from '@/types/club';

// Fetch clubs from API
const fetchClubs = async (): Promise<Club[]> => {
  const response = await fetch('/api/clubs');
  if (!response.ok) {
    throw new Error('Failed to fetch clubs');
  }
  return response.json();
};

// Helper function to get image URL
function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) return "";
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/public-objects/")) return imageUrl;
  if (imageUrl.startsWith("/objects/")) return imageUrl;
  if (imageUrl.startsWith("/")) return `/public-objects${imageUrl}`;
  return `/public-objects/${imageUrl}`;
}

export default function Clubs() {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });

  // Fetch clubs from database
  const { data: allClubs = [], isLoading, error } = useQuery({
    queryKey: ['clubs'],
    queryFn: fetchClubs
  });

  // Filter and search clubs
  const filteredClubs = useMemo(() => {
    let filtered = allClubs;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((club: Club) => 
        club.name.toLowerCase().includes(query) ||
        (club.city || '').toLowerCase().includes(query) ||
        (club.province || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allClubs, searchQuery]);

  if (isLoading) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-background text-foreground transition-colors">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Клубуудыг ачааллаж байна...</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (error) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-background text-foreground transition-colors">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-error">Клубууд ачаалахад алдаа гарлаа</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-background text-foreground transition-colors overflow-x-hidden">
        <Navigation />

        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Клубууд</h1>
              <p className="text-muted-foreground">Спортын клубуудын бүртгэл</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-foreground text-2xl font-bold">{allClubs.length}</span>
              <span className="text-muted-foreground">клуб</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Клуб хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club: Club) => (
              <Card
                key={club.id}
                className="border border-border text-card-foreground shadow-sm transition-colors duration-200 hover:border-ring"
              >
                <CardContent className="p-6">
                  {/* Header with avatar and info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {club.logoUrl ? (
                        <img
                          src={getImageUrl(club.logoUrl)}
                          alt={`${club.name} лого`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
                          {club.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-2 text-lg font-bold text-card-foreground leading-tight break-words" style={{ fontFamily: "'Inter', 'Noto Sans', sans-serif" }}>
                        {club.name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {club.verified && (
                          <Badge className="text-xs">Баталгаажсан</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Day Schedule with Dropdown */}
                  {(() => {
                    const getCurrentDaySchedule = () => {
                      if (!club.weeklySchedule) return null;
                      
                      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const today = new Date().getDay();
                      const currentDay = days[today];
                      
                      return club.weeklySchedule[currentDay as keyof typeof club.weeklySchedule];
                    };

                    const getDayName = () => {
                      const dayNames = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
                      return dayNames[new Date().getDay()];
                    };

                    const todaySchedule = getCurrentDaySchedule();
                    
                    return (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {getDayName()}: {todaySchedule || 'Хаалттай'}
                            </span>
                          </div>

                          {/* Schedule Dropdown */}
                          {club.weeklySchedule && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  Цагийн хуваарь
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 border border-border bg-popover text-popover-foreground shadow-lg"
                              >
                                <div className="p-2">
                                  <h4 className="mb-2 text-sm font-medium text-popover-foreground">Цагийн хуваарь</h4>
                                  <div className="space-y-1">
                                    {[
                                      { key: 'monday', label: 'Даваа' },
                                      { key: 'tuesday', label: 'Мягмар' },
                                      { key: 'wednesday', label: 'Лхагва' },
                                      { key: 'thursday', label: 'Пүрэв' },
                                      { key: 'friday', label: 'Баасан' },
                                      { key: 'saturday', label: 'Бямба' },
                                      { key: 'sunday', label: 'Ням' }
                                    ].map(({ key, label }) => {
                                      const schedule = club.weeklySchedule?.[key as keyof typeof club.weeklySchedule];
                                      return (
                                        <div
                                          key={key}
                                          className="flex items-center justify-between py-1 text-xs text-muted-foreground"
                                        >
                                          <span>{label}</span>
                                          <span className="opacity-80">
                                            {schedule || 'Хаалттай'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {club.schedule && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>Ерөнхий хуваарь</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Owner and Coaches */}
                  <div className="mb-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="opacity-80">Эзэмшигч:</span> {club.ownerName || 'Тодорхойгүй'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="opacity-80">Ахлах дасгалжуулагч:</span> {club.headCoachName || 'Тодорхойгүй'}
                    </div>
                  </div>



                  {/* Contact Icons */}
                  <div className="flex items-center gap-2 mb-4">
                    {club.phone && (
                      <a
                        href={`tel:${club.phone}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:opacity-80"
                        title="Утасаар холбогдох"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {club.email && (
                      <a
                        href={`mailto:${club.email}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:opacity-80"
                        title="И-мэйлээр холбогдох"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {club.website && (
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:opacity-80"
                        title="Вэбсайт үзэх"
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {club.facebook && (
                      <a
                        href={club.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
                        title="Facebook хуудас үзэх"
                      >
                        <Facebook className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                    {club.instagram && (
                      <a
                        href={club.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 hover:bg-pink-600 flex items-center justify-center transition-colors"
                        title="Instagram хуудас үзэх"
                      >
                        <Instagram className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>

                  {/* Location */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{club.city || club.province || 'Байршил тодорхойгүй'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {(() => {
                    const getCurrentDaySchedule = () => {
                      if (!club.weeklySchedule) return null;
                      
                      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const today = new Date().getDay();
                      const currentDay = days[today];
                      
                      return club.weeklySchedule[currentDay as keyof typeof club.weeklySchedule];
                    };

                    const todaySchedule = getCurrentDaySchedule();
                    const isOpen = todaySchedule && todaySchedule.trim() !== '';
                    
                    return (
                      <Button
                        className={`w-full ${
                          isOpen
                            ? 'bg-success text-success-foreground hover:opacity-90'
                            : 'bg-error text-error-foreground hover:opacity-90'
                        }`}
                        size="sm"
                      >
                        {isOpen ? 'Нээлттэй' : 'Хаалттай'}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredClubs.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Клуб олдсонгүй
              </h3>
              <p className="text-muted-foreground">
                Хайлтын нөхцлөө өөрчилж үзнэ үү
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}