
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Globe, Phone, Mail, Building2, Star, Clock, GraduationCap, Users, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/navigation';
import PageWithLoading from '@/components/PageWithLoading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg dark:text-gray-300">Клубуудыг ачааллаж байна...</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (error) {
    return (
      <PageWithLoading>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600 dark:text-red-400">Клубууд ачаалахад алдаа гарлаа</div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />

        {/* Header */}
        <section className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Клубууд</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
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
                className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-200 dark:bg-gray-700">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-700 dark:text-gray-300"
              >
                <Building2 className="h-4 w-4" />
                Бүх клуб ({allClubs.length})
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-700 dark:text-gray-300"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Идэвхтэй ({activeClubs.length})
              </TabsTrigger>
              <TabsTrigger 
                value="inactive" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-700 dark:text-gray-300"
              >
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Идэвхгүй ({inactiveClubs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Клубуудын жагсаалт</CardTitle>
                </CardHeader>
                <CardContent>
                  {allClubs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p>Клуб олдсонгүй</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Клуб</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Төрөл</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Байршил</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Холбоо барих</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Төлөв</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Үйлдэл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allClubs.map((club: Club) => (
                          <TableRow key={club.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-600">
                                  {club.logo ? (
                                    <img
                                      src={getImageUrl(club.logo)}
                                      alt={`${club.name} лого`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-mtta-green text-white font-bold text-sm">
                                      {club.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{club.name}</div>
                                  {club.verified && (
                                    <Badge className="bg-blue-500 text-white text-xs mt-1">
                                      ✓ Баталгаажсан
                                    </Badge>
                                  )}
                                  {club.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{club.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-mtta-green text-mtta-green dark:border-mtta-green dark:text-mtta-green"
                              >
                                {club.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4 text-mtta-green" />
                                <span>{club.city} • {club.district}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {club.phone && (
                                  <a
                                    href={`tel:${club.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-mtta-green/10 text-mtta-green border border-mtta-green/20 hover:bg-mtta-green/20 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    Залгах
                                  </a>
                                )}
                                {club.email && (
                                  <a
                                    href={`mailto:${club.email}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                  >
                                    <Mail className="w-3 h-3" />
                                    И-мэйл
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    club.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                />
                                <span
                                  className={`text-sm font-medium ${
                                    club.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClubClick(club)}
                                className="text-mtta-green hover:text-mtta-green/80 hover:bg-mtta-green/10"
                              >
                                Дэлгэрэнгүй
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-8">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Идэвхтэй клубууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredClubs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p>Хайлтанд тохирох идэвхтэй клуб олдсонгүй</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Клуб</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Төрөл</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Байршил</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Холбоо барих</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Үйлдэл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClubs.map((club: Club) => (
                          <TableRow key={club.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-600">
                                  {club.logo ? (
                                    <img
                                      src={getImageUrl(club.logo)}
                                      alt={`${club.name} лого`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-mtta-green text-white font-bold text-sm">
                                      {club.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{club.name}</div>
                                  {club.verified && (
                                    <Badge className="bg-blue-500 text-white text-xs mt-1">
                                      ✓ Баталгаажсан
                                    </Badge>
                                  )}
                                  {club.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{club.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-mtta-green text-mtta-green dark:border-mtta-green dark:text-mtta-green"
                              >
                                {club.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4 text-mtta-green" />
                                <span>{club.city} • {club.district}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {club.phone && (
                                  <a
                                    href={`tel:${club.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-mtta-green/10 text-mtta-green border border-mtta-green/20 hover:bg-mtta-green/20 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    Залгах
                                  </a>
                                )}
                                {club.email && (
                                  <a
                                    href={`mailto:${club.email}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                  >
                                    <Mail className="w-3 h-3" />
                                    И-мэйл
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClubClick(club)}
                                className="text-mtta-green hover:text-mtta-green/80 hover:bg-mtta-green/10"
                              >
                                Дэлгэрэнгүй
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-8">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    Идэвхгүй клубууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredClubs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p>Хайлтанд тохирох идэвхгүй клуб олдсонгүй</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Клуб</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Төрөл</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Байршил</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Холбоо барих</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Үйлдэл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClubs.map((club: Club) => (
                          <TableRow key={club.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-600">
                                  {club.logo ? (
                                    <img
                                      src={getImageUrl(club.logo)}
                                      alt={`${club.name} лого`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-mtta-green text-white font-bold text-sm">
                                      {club.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{club.name}</div>
                                  {club.verified && (
                                    <Badge className="bg-blue-500 text-white text-xs mt-1">
                                      ✓ Баталгаажсан
                                    </Badge>
                                  )}
                                  {club.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{club.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-mtta-green text-mtta-green dark:border-mtta-green dark:text-mtta-green"
                              >
                                {club.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4 text-mtta-green" />
                                <span>{club.city} • {club.district}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {club.phone && (
                                  <a
                                    href={`tel:${club.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-mtta-green/10 text-mtta-green border border-mtta-green/20 hover:bg-mtta-green/20 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    Залгах
                                  </a>
                                )}
                                {club.email && (
                                  <a
                                    href={`mailto:${club.email}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                  >
                                    <Mail className="w-3 h-3" />
                                    И-мэйл
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClubClick(club)}
                                className="text-mtta-green hover:text-mtta-green/80 hover:bg-mtta-green/10"
                              >
                                Дэлгэрэнгүй
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Map Section */}
        <section id="map" className="w-full bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Клубуудын байршил
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Клубуудын байршлыг газрын зураг дээрээс харна уу
              </p>
            </div>

            <div className="w-full h-96 rounded-2xl overflow-hidden border dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Газрын зураг удахгүй нэмэгдэнэ
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
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
