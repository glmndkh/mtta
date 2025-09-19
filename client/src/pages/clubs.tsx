
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe, Phone, Mail, Building2, Star, Clock, GraduationCap, Users, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/navigation';
import PageWithLoading from '@/components/PageWithLoading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Club } from '@/types/club';
import { tokens } from '@/lib/design-tokens';

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

const ClubDetailDialog = ({ club, isOpen, onClose }: { club: Club | null, isOpen: boolean, onClose: () => void }) => {
  if (!club) return null;

  const handleMapOpen = () => {
    if (club.coordinates) {
      const url = `https://www.google.com/maps?q=${club.coordinates.lat},${club.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              {club.logo ? (
                <img 
                  src={getImageUrl(club.logo)} 
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-mtta-green text-white font-bold">
                  {club.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="text-xl">{club.name}</div>
              <div className="flex items-center gap-2 mt-1">
                {club.verified && (
                  <Badge className="bg-blue-500 text-white text-xs">Баталгаажсан</Badge>
                )}
                <span className="text-sm text-gray-500">{club.city} • {club.district}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {club.description && (
            <section>
              <h3 className="font-medium mb-2 text-gray-900">Тайлбар</h3>
              <p className="text-gray-600">{club.description}</p>
            </section>
          )}

          {/* Location */}
          <section>
            <h3 className="font-medium mb-3 text-gray-900">Байршил</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                <span className="text-gray-600">
                  {club.address || `${club.city}, ${club.district}`}
                </span>
              </div>
              {club.coordinates && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMapOpen}
                  className="border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Газрын зураг нээх
                </Button>
              )}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h3 className="font-medium mb-3 text-gray-900">Холбоо барих</h3>
            <div className="space-y-2">
              {club.phone && (
                <a 
                  href={`tel:${club.phone}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-4 h-4 text-mtta-green" />
                  <span className="text-mtta-green font-medium">{club.phone}</span>
                </a>
              )}
              {club.email && (
                <a 
                  href={`mailto:${club.email}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-4 h-4 text-mtta-green" />
                  <span className="text-mtta-green font-medium">{club.email}</span>
                </a>
              )}
            </div>
          </section>

          {/* Schedule */}
          {club.schedule && (
            <section>
              <h3 className="font-medium mb-2 text-gray-900">Цагийн хуваарь</h3>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-1 text-gray-500" />
                <span className="text-gray-600">{club.schedule}</span>
              </div>
            </section>
          )}

          {/* Training */}
          {club.training && (
            <section>
              <h3 className="font-medium mb-2 text-gray-900">Сургалт</h3>
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 mt-1 text-gray-500" />
                <span className="text-gray-600">{club.training}</span>
              </div>
            </section>
          )}

          {/* Coaches */}
          {club.coaches && club.coaches.length > 0 && (
            <section>
              <h3 className="font-medium mb-2 text-gray-900">Дасгалжуулагч</h3>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-1 text-gray-500" />
                <span className="text-gray-600">{club.coaches.join(', ')}</span>
              </div>
            </section>
          )}

          {/* Equipment */}
          {club.equipment && club.equipment.length > 0 && (
            <section>
              <h3 className="font-medium mb-2 text-gray-900">Тоног төхөөрөмж</h3>
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-1 text-gray-500" />
                <span className="text-gray-600">{club.equipment.join(', ')}</span>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {club.phone && (
              <Button
                className="bg-mtta-green text-white hover:bg-mtta-green/90 flex-1"
                onClick={() => window.open(`tel:${club.phone}`, '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Залгах
              </Button>
            )}
            <Button
              variant="outline"
              className="border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white"
              onClick={onClose}
            >
              Хаах
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ClubCard = ({ club, onDetailClick }: { club: Club; onDetailClick: (club: Club) => void }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 rounded-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {club.logo && (
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(club.logo)}
                alt={`${club.name} лого`}
                className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 text-gray-900">
              {club.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="border-mtta-green text-mtta-green text-xs"
              >
                {club.type}
              </Badge>
              {club.verified && (
                <Badge className="bg-blue-500 text-white text-xs">
                  ✓ Баталгаажсан
                </Badge>
              )}
              {club.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-700">{club.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-mtta-green mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">Байршил</div>
            <div className="text-sm text-gray-600">{club.city} • {club.district}</div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex gap-2 flex-wrap">
          {club.phone && (
            <a
              href={`tel:${club.phone}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 bg-mtta-green/10 text-mtta-green border border-mtta-green/20"
            >
              <Phone className="w-4 h-4" />
              Залгах
            </a>
          )}
          {club.email && (
            <a
              href={`mailto:${club.email}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 bg-gray-100 text-gray-700 border border-gray-200"
            >
              <Mail className="w-4 h-4" />
              И-мэйл
            </a>
          )}
        </div>

        {/* Status and Detail button */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                club.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                club.status === 'active' ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDetailClick(club)}
            className="text-mtta-green hover:text-mtta-green/80"
          >
            Дэлгэрэнгүй
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Clubs() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch clubs from database
  const { data: allClubs = [], isLoading, error } = useQuery({
    queryKey: ['clubs'],
    queryFn: fetchClubs
  });

  const handleClubClick = (club: Club) => {
    setSelectedClub(club);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedClub(null);
  };

  // Filter and search clubs
  const filteredClubs = useMemo(() => {
    let filtered = allClubs;

    // Filter by status
    if (activeTab === "active") {
      filtered = filtered.filter((club: Club) => club.status === 'active');
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((club: Club) => club.status === 'inactive');
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((club: Club) => 
        club.name.toLowerCase().includes(query) ||
        club.city.toLowerCase().includes(query) ||
        club.district.toLowerCase().includes(query) ||
        club.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allClubs, activeTab, searchQuery]);

  // Get active and inactive counts
  const activeClubs = allClubs.filter((club: Club) => club.status === 'active');
  const inactiveClubs = allClubs.filter((club: Club) => club.status === 'inactive');

  if (isLoading) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Клубуудыг ачааллаж байна...</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (error) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">Клубууд ачаалахад алдаа гарлаа</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Header */}
        <section className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Клубууд</h1>
                <p className="text-gray-600 mt-2">
                  Монгол орны ширээний теннисний клубуудын бүртгэл
                </p>
              </div>
              <Badge className="bg-mtta-green text-white text-lg px-4 py-2">
                {allClubs.length} клуб
              </Badge>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Клуб хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Бүх клуб ({allClubs.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Идэвхтэй ({activeClubs.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Идэвхгүй ({inactiveClubs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClubs.map((club: Club) => (
                  <ClubCard key={club.id} club={club} onDetailClick={handleClubClick} />
                ))}
                {allClubs.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>Клуб олдсонгүй</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club: Club) => (
                  <ClubCard key={club.id} club={club} onDetailClick={handleClubClick} />
                ))}
                {filteredClubs.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>Хайлтанд тохирох идэвхтэй клуб олдсонгүй</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club: Club) => (
                  <ClubCard key={club.id} club={club} onDetailClick={handleClubClick} />
                ))}
                {filteredClubs.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>Хайлтанд тохирох идэвхгүй клуб олдсонгүй</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Map Section */}
        <section id="map" className="w-full bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Клубуудын байршил
              </h2>
              <p className="text-gray-600">
                Клубуудын байршлыг газрын зураг дээрээс харна уу
              </p>
            </div>

            <div className="w-full h-96 rounded-2xl overflow-hidden border shadow-sm bg-gray-50">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Газрын зураг удахгүй нэмэгдэнэ
                  </h3>
                  <p className="text-gray-600">
                    Клубуудын байршлыг харуулах газрын зураг хэсгийг бэлтгэж байна
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Club Detail Dialog */}
        <ClubDetailDialog
          club={selectedClub}
          isOpen={isDialogOpen}
          onClose={closeDialog}
        />
      </div>
    </PageWithLoading>
  );
}
