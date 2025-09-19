import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Phone, Mail, Clock, Grid3x3, Search } from 'lucide-react';
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
              <Button 
                variant="outline"
                size="lg"
                className="h-12 px-4 bg-[#1a1a1a] border-gray-700 hover:bg-gray-800 text-white"
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
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
                        {club.status === 'active' && (
                          <Badge className="bg-green-600 text-white text-xs">Идэвхтэй</Badge>
                        )}
                        {club.verified && (
                          <Badge className="bg-blue-600 text-white text-xs">Баталгаажсан</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Day Schedule */}
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
                        <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {getDayName()}: {todaySchedule || 'Хаалттай'}
                          </span>
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

                  {/* Tags */}
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      Олимпийн бэлтгэл
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      Зочид нэгэдэн авчдаг
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      Хуваарасан
                    </Badge>
                  </div>

                  {/* Contact Icons */}
                  <div className="flex items-center gap-3 mb-4">
                    {club.phone && (
                      <a
                        href={`tel:${club.phone}`}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="Утасаар холбогдох"
                      >
                        <Phone className="w-4 h-4 text-gray-300" />
                      </a>
                    )}
                    {club.email && (
                      <a
                        href={`mailto:${club.email}`}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="И-мэйлээр холбогдох"
                      >
                        <Mail className="w-4 h-4 text-gray-300" />
                      </a>
                    )}
                    {club.website && (
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="Вэбсайт үзэх"
                      >
                        <Globe className="w-4 h-4 text-gray-300" />
                      </a>
                    )}
                    {/* Instagram and Facebook as prominent icon links */}
                    {club.facebook && (
                      <a
                        href={club.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-lg"
                        title="Facebook хуудас үзэх"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
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
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
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
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Идэвхтэй
                  </Button>
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