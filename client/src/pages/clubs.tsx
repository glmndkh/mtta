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
  const [searchQuery, setSearchQuery] = useState("");

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
        <div className="min-h-screen bg-[#0a0a0a]">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-300">Клубуудыг ачааллаж байна...</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (error) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-[#0a0a0a]">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-400">Клубууд ачаалахад алдаа гарлаа</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navigation />

        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Клубууд</h1>
              <p className="text-gray-400">Спортын клубуудын бүртгэл</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-2xl font-bold">{allClubs.length}</span>
              <span className="text-gray-400">клуб</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Клуб хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-400 focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club: Club) => (
              <Card key={club.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-all duration-200">
                <CardContent className="p-6">
                  {/* Header with avatar and info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
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
                      <h3 className="text-white font-semibold text-lg mb-2 truncate">{club.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {club.verified && (
                          <Badge className="bg-blue-600 text-white text-xs">Баталгаажсан</Badge>
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
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Clock className="w-4 h-4" />
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
                                  className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                                >
                                  Цагийн хуваарь
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-56 bg-[#2a2a2a] border-gray-600"
                              >
                                <div className="p-2">
                                  <h4 className="text-sm font-medium text-white mb-2">Цагийн хуваарь</h4>
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
                                          className="flex justify-between items-center py-1 text-xs"
                                        >
                                          <span className="text-gray-300">{label}</span>
                                          <span className="text-gray-400">
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
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>Ерөнхий хуваарь</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Owner and Coaches */}
                  <div className="mb-4 space-y-2">
                    <div className="text-gray-300 text-sm">
                      <span className="text-gray-400">Эзэмшигч:</span> {club.ownerName || 'Тодорхойгүй'}
                    </div>
                    <div className="text-gray-300 text-sm">
                      <span className="text-gray-400">Ахлах дасгалжуулагч:</span> {club.headCoachName || 'Тодорхойгүй'}
                    </div>
                  </div>

                  

                  {/* Contact Icons */}
                  <div className="flex items-center gap-2 mb-4">
                    {club.phone && (
                      <a
                        href={`tel:${club.phone}`}
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="Утасаар холбогдох"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-300" />
                      </a>
                    )}
                    {club.email && (
                      <a
                        href={`mailto:${club.email}`}
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="И-мэйлээр холбогдох"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-300" />
                      </a>
                    )}
                    {club.website && (
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="Вэбсайт үзэх"
                      >
                        <Globe className="w-3.5 h-3.5 text-gray-300" />
                      </a>
                    )}
                    {club.facebook && (
                      <a
                        href={club.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-lg"
                        title="Facebook хуудас үзэх"
                      >
                        <Facebook className="w-5 h-5 text-white" />
                      </a>
                    )}
                    {club.instagram && (
                      <a
                        href={club.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-lg"
                        title="Instagram хуудас үзэх"
                      >
                        <Instagram className="w-5 h-5 text-white" />
                      </a>
                    )}
                  </div>

                  {/* Location */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <MapPin className="w-4 h-4" />
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
                        className={`w-full ${isOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
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
              <div className="w-16 h-16 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                Клуб олдсонгүй
              </h3>
              <p className="text-gray-400">
                Хайлтын нөхцлөө өөрчилж үзнэ үү
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}