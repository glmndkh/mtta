
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Grid3X3, Table, Search, Filter, MapPin, Phone, Mail, Star, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
                <span className="text-gray-600">{club.schedule}</span>
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
    <Card className="hover:shadow-lg transition-all duration-300 rounded-2xl h-full cursor-pointer group" onClick={() => onDetailClick(club)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {club.logo && (
            <div className="flex-shrink-0">
              <img
                src={getImageUrl(club.logo)}
                alt={`${club.name} лого`}
                className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 text-gray-900 group-hover:text-mtta-green transition-colors">
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
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-mtta-green/10 text-mtta-green border border-mtta-green/20">
              <Phone className="w-4 h-4" />
              Холбогдох
            </div>
          )}
          {club.email && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
              <Mail className="w-4 h-4" />
              И-мэйл
            </div>
          )}
        </div>

        {/* Status */}
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
        </div>
      </CardContent>
    </Card>
  );
};

const ClubTable = ({ clubs, onDetailClick }: { clubs: Club[], onDetailClick: (club: Club) => void }) => {
  return (
    <div className="rounded-lg border bg-white">
      <TableComponent>
        <TableHeader>
          <TableRow>
            <TableHead>Клуб</TableHead>
            <TableHead>Байршил</TableHead>
            <TableHead>Холбоо барих</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club) => (
            <TableRow key={club.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onDetailClick(club)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {club.logo && (
                    <img
                      src={getImageUrl(club.logo)}
                      alt={club.name}
                      className="w-10 h-10 rounded-lg object-cover border"
                    />
                  )}
                  <div>
                    <div className="font-medium">{club.name}</div>
                    <div className="text-sm text-gray-500">{club.type}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{club.city}</div>
                  <div className="text-gray-500">{club.district}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {club.phone && (
                    <div className="text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {club.phone}
                    </div>
                  )}
                  {club.email && (
                    <div className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {club.email}
                    </div>
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
                    className={`text-sm ${
                      club.status === 'active' ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-mtta-green hover:text-mtta-green/80">
                  Дэлгэрэнгүй
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
    </div>
  );
};

export default function Clubs() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

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
    if (statusFilter !== "all") {
      filtered = filtered.filter((club: Club) => club.status === statusFilter);
    }

    // Filter by city
    if (cityFilter !== "all") {
      filtered = filtered.filter((club: Club) => club.city === cityFilter);
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
  }, [allClubs, statusFilter, cityFilter, searchQuery]);

  // Get unique cities for filter
  const cities = useMemo(() => {
    return Array.from(new Set(allClubs.map((club: Club) => club.city)));
  }, [allClubs]);

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
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Клубууд</h1>
                <p className="text-gray-600">
                  Монгол орны ширээний теннисний клубуудын бүртгэл
                </p>
              </div>
              <Badge className="bg-mtta-green text-white text-lg px-4 py-2">
                {filteredClubs.length} клуб
              </Badge>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Клуб хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Төлөв" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      <SelectItem value="active">Идэвхтэй</SelectItem>
                      <SelectItem value="inactive">Идэвхгүй</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Хот" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх хот</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg p-1 bg-gray-100">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8 p-0"
                >
                  <Table className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          {filteredClubs.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Клуб олдсонгүй
              </h3>
              <p className="text-gray-600">
                Хайлтын нөхцлөө өөрчилж үзнэ үү
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredClubs.map((club: Club) => (
                    <ClubCard key={club.id} club={club} onDetailClick={handleClubClick} />
                  ))}
                </div>
              ) : (
                <ClubTable clubs={filteredClubs} onDetailClick={handleClubClick} />
              )}
            </>
          )}
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
