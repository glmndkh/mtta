
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Trophy, MapPin, Clock, Filter, SortAsc, SortDesc } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageWithLoading from "@/components/PageWithLoading";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  participationTypes: string[];
  registrationStatus?: 'open' | 'closed' | 'full';
  isLive?: boolean;
}

const months = [
  { value: '0', label: '1-р сар' },
  { value: '1', label: '2-р сар' },
  { value: '2', label: '3-р сар' },
  { value: '3', label: '4-р сар' },
  { value: '4', label: '5-р сар' },
  { value: '5', label: '6-р сар' },
  { value: '6', label: '7-р сар' },
  { value: '7', label: '8-р сар' },
  { value: '8', label: '9-р сар' },
  { value: '9', label: '10-р сар' },
  { value: '10', label: '11-р сар' },
  { value: '11', label: '12-р сар' },
];

const categoryChips = [
  { id: 'all', label: 'Бүгд', value: 'all' },
  { id: 'singles_men', label: 'MS', value: 'singles_men' },
  { id: 'singles_women', label: 'WS', value: 'singles_women' },
  { id: 'doubles_men', label: 'MD', value: 'doubles_men' },
  { id: 'doubles_women', label: 'WD', value: 'doubles_women' },
  { id: 'mixed_doubles', label: 'XD', value: 'mixed_doubles' },
];

const statusOptions = [
  { value: 'all', label: 'Бүгд' },
  { value: 'open', label: 'Бүртгэл нээлттэй' },
  { value: 'closed', label: 'Хаагдсан' },
  { value: 'completed', label: 'Дууссан' },
];

export default function Tournaments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'upcoming' | 'newest'>('upcoming');

  // Fetch tournaments from database
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      return response.json();
    },
  });

  // Helper functions
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

  const getStatusBadge = (tournament: Tournament) => {
    if (tournament.isLive) {
      return (
        <Badge className="bg-red-500 text-white animate-pulse">
          LIVE
        </Badge>
      );
    }

    if (tournament.registrationStatus === 'open') {
      return <Badge className="bg-green-500 text-white">Бүртгэл нээлттэй</Badge>;
    }

    if (tournament.registrationStatus === 'closed') {
      return <Badge className="bg-gray-500 text-white">Хаагдсан</Badge>;
    }

    if (tournament.status === 'completed') {
      return <Badge className="bg-blue-500 text-white">Дууссан</Badge>;
    }

    return <Badge variant="outline">Удахгүй</Badge>;
  };

  // Filter and sort tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    // Date filter
    if (selectedMonth && selectedYear) {
      const tournamentDate = parseISO(tournament.startDate);
      const monthStart = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
      const monthEnd = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
      
      if (!isWithinInterval(tournamentDate, { start: monthStart, end: monthEnd })) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all' && !tournament.participationTypes.includes(selectedCategory)) {
      return false;
    }

    // Location filter
    if (locationFilter && !tournament.location.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'open' && tournament.registrationStatus !== 'open') return false;
      if (statusFilter === 'closed' && tournament.registrationStatus !== 'closed') return false;
      if (statusFilter === 'completed' && tournament.status !== 'completed') return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortOrder === 'upcoming') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    } else {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
  });

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Тэмцээнүүдийг ачаалж байна...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Trophy className="mr-3 h-8 w-8 text-mtta-green" />
                  Тэмцээнүүд
                </h1>
                <p className="text-gray-600">
                  Бүх идэвхтэй болон удахгүй болох тэмцээнүүд
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Filters */}
        <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              {/* Left Side Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Date Picker */}
                <div className="flex gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Сар" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Бүх сар</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Он" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Chips */}
                <div className="flex gap-2 flex-wrap">
                  {categoryChips.map(chip => (
                    <Button
                      key={chip.id}
                      variant={selectedCategory === chip.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(chip.value)}
                      className={`${selectedCategory === chip.value ? 'bg-mtta-green text-white' : ''} text-xs px-3 py-1`}
                    >
                      {chip.label}
                    </Button>
                  ))}
                </div>

                {/* Location Filter */}
                <Input
                  placeholder="Байршил"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-32"
                />

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Right Side Sort */}
              <div className="flex items-center gap-2">
                <Button
                  variant={sortOrder === 'upcoming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('upcoming')}
                  className={`flex items-center gap-1 ${sortOrder === 'upcoming' ? 'bg-mtta-green text-white' : ''}`}
                >
                  <SortAsc className="w-4 h-4" />
                  Ойрын
                </Button>
                <Button
                  variant={sortOrder === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('newest')}
                  className={`flex items-center gap-1 ${sortOrder === 'newest' ? 'bg-mtta-green text-white' : ''}`}
                >
                  <SortDesc className="w-4 h-4" />
                  Шинэ зарласан
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Энэ сард тэмцээн алга. Өөр сар сонгоорой.
              </h3>
              <p className="text-gray-600 mb-6">
                Таны сонгосон шүүлтүүрт тохирох тэмцээн олдсонгүй.
              </p>
              <Button onClick={() => {
                setSelectedMonth('');
                setSelectedCategory('all');
                setLocationFilter('');
                setStatusFilter('all');
              }}>
                Бүх шүүлтүүрийг арилгах
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Large Date Display */}
                      <div className="text-center min-w-0 flex-shrink-0">
                        <div className="text-4xl font-bold text-mtta-green">
                          {format(new Date(tournament.startDate), 'd')}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {format(new Date(tournament.startDate), 'MMM')}
                        </div>
                      </div>

                      {/* Tournament Status */}
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(tournament)}
                        {tournament.isLive && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>

                    <CardTitle className="text-lg line-clamp-2 group-hover:text-mtta-green transition-colors">
                      {tournament.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{tournament.location}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(tournament.startDate), 'yyyy/MM/dd')}
                        {tournament.endDate && tournament.endDate !== tournament.startDate && (
                          ` - ${format(new Date(tournament.endDate), 'MM/dd')}`
                        )}
                      </span>
                    </div>

                    {/* Participation Type Chips */}
                    <div className="flex flex-wrap gap-1">
                      {getParticipationChips(tournament.participationTypes || []).map((chip, index) => (
                        <span key={index} className={`${chip.color} text-white text-xs px-2 py-1 rounded font-medium`}>
                          {chip.label}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/tournament/${tournament.id}`}>
                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                          Дэлгэрэнгүй
                        </Button>
                      </Link>
                      <Link href={`/tournament/${tournament.id}/register`}>
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs bg-mtta-green hover:bg-green-700"
                          disabled={tournament.registrationStatus === 'closed' || tournament.status === 'completed'}
                        >
                          Бүртгүүлэх
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}
