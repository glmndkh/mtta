import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Download, ArrowLeft, Users, Calendar, MapPin, Trophy, FileText, Search, Filter, AlertTriangle, User, Medal, Crown, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { formatName } from "@/lib/utils";

interface Tournament {
  id: string;
  name: string;
  description: string;
  richDescription: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  organizer: string;
  maxParticipants: number;
  entryFee: string;
  status: string;
  participationTypes: string[];
  rules: string;
  prizes: string;
  contactInfo: string;
  schedule: string;
  requirements: string;
  isPublished: boolean;
  organizerId: string;
  backgroundImageUrl?: string;
  regulationDocumentUrl?: string;
  minRating?: string;
  maxRating?: string;
}

interface TournamentParticipant {
  id: string;
  firstName: string;
  lastName: string;
  clubAffiliation: string;
  rank?: string;
  email: string;
  phone: string;
  participationType: string;
  registeredAt: string;
}

interface FinalRanking {
  position: number;
  playerId: string;
  playerName: string;
  prize?: string;
}

interface TournamentResults {
  id: string;
  tournamentId: string;
  groupStageResults?: any;
  knockoutResults?: any;
  finalRankings?: FinalRanking[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ParticipationCategory {
  minAge: number | null;
  maxAge: number | null;
  gender: string;
}

const parseParticipation = (value: string): ParticipationCategory => {
  try {
    const obj = JSON.parse(value);
    if ("minAge" in obj || "maxAge" in obj) {
      return {
        minAge: obj.minAge ?? null,
        maxAge: obj.maxAge ?? null,
        gender: obj.gender || "male",
      };
    }
    const ageStr = String(obj.age || "");
    const nums = ageStr.match(/\d+/g)?.map(Number) || [];
    let min: number | null = null;
    let max: number | null = null;
    if (nums.length === 1) {
      if (/хүртэл/i.test(ageStr)) max = nums[0];
      else min = nums[0];
    } else if (nums.length >= 2) {
      [min, max] = nums;
    }
    return { minAge: min, maxAge: max, gender: obj.gender || "male" };
  } catch {
    const ageStr = value;
    const nums = ageStr.match(/\d+/g)?.map(Number) || [];
    let min: number | null = null;
    let max: number | null = null;
    if (nums.length === 1) {
      if (/хүртэл/i.test(ageStr)) max = nums[0];
      else min = nums[0];
    } else if (nums.length >= 2) {
      [min, max] = nums;
    }
    return { minAge: min, maxAge: max, gender: "male" };
  }
};

const formatParticipation = (cat: ParticipationCategory) => {
  let label = "";
  if (cat.minAge !== null && cat.maxAge !== null) label = `${cat.minAge}-${cat.maxAge}`;
  else if (cat.minAge !== null) label = `${cat.minAge}+`;
  else if (cat.maxAge !== null) label = `${cat.maxAge}-аас доош`;
  else label = "Нас хязгааргүй";
  return `${label} ${cat.gender === "male" ? "эрэгтэй" : "эмэгтэй"}`;
};

// Medal Winners Component
function MedalWinnersSection({ 
  tournamentResults 
}: { 
  tournamentResults?: TournamentResults;
}) {
  if (!tournamentResults?.isPublished || !tournamentResults?.finalRankings) {
    return null;
  }

  // Get top 3 finishers
  const topThree = tournamentResults.finalRankings
    .filter(ranking => ranking.position <= 3)
    .sort((a, b) => a.position - b.position);

  if (topThree.length === 0) {
    return null;
  }

  const getMedalInfo = (position: number) => {
    switch (position) {
      case 1:
        return { 
          icon: Crown, 
          color: "text-yellow-400",
          title: "Алтан медаль",
          place: "1-р байр"
        };
      case 2:
        return { 
          icon: Medal, 
          color: "text-gray-300",
          title: "Мөнгөн медаль",
          place: "2-р байр"
        };
      case 3:
        return { 
          icon: Award, 
          color: "text-amber-400",
          title: "Хүрэл медаль",
          place: "3-р байр"
        };
      default:
        return { 
          icon: Trophy, 
          color: "text-blue-400",
          title: "Медаль",
          place: `${position}-р байр`
        };
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        Медальтнууд
      </h2>
      
      <div className="flex flex-wrap justify-center gap-6">
        {topThree.map((ranking) => {
          const medalInfo = getMedalInfo(ranking.position);
          const MedalIcon = medalInfo.icon;
          
          return (
            <div 
              key={ranking.playerId}
              className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center min-w-[200px] border-2 ${
                ranking.position === 1 ? 'border-yellow-400' : 
                ranking.position === 2 ? 'border-gray-300' : 
                'border-amber-400'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <MedalIcon className={`w-12 h-12 ${medalInfo.color}`} />
                
                <Avatar className="w-16 h-16 border-2 border-white">
                  <AvatarImage 
                    src={`/api/users/${ranking.playerId}/avatar`} 
                    alt={ranking.playerName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-600 text-white text-lg font-semibold">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-bold text-lg text-white">{ranking.playerName}</p>
                  <p className={`text-sm font-medium ${medalInfo.color}`}>{medalInfo.place}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tournament Registration Button Component
function TournamentRegistrationButton({ 
  tournament, 
  userRegistration, 
  canRegister 
}: { 
  tournament: Tournament;
  userRegistration?: { registered: boolean };
  canRegister: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async (participationType: string) => {
      if (!isAuthenticated) {
        window.location.href = "/login";
        return;
      }
      return apiRequest(`/api/tournaments/${tournament.id}/register`, { 
        method: 'POST', 
        body: JSON.stringify({ participationType }) 
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгүүллээ!",
        description: "Тэмцээнд амжилттай бүртгүүллээ.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournament.id, 'participants'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Бүртгүүлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Тэмцээнд бүртгүүлэхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }
    registerMutation.mutate("singles"); // Default to singles
  };

  if (userRegistration?.registered) {
    return (
      <Button
        disabled
        className="bg-green-600 text-white cursor-not-allowed w-full sm:w-auto"
        size="lg"
      >
        Бүртгүүлсэн
      </Button>
    );
  }

  if (!canRegister) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          disabled
          className="bg-gray-600 text-white cursor-not-allowed w-full sm:w-auto"
          size="lg"
        >
          Бүртгүүлэх боломжгүй
        </Button>
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Та энэ тэмцээнд оролцох шаардлага хангахгүй байна</span>
        </div>
      </div>
    );
  }

  return (
    <Button
      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
      onClick={handleRegister}
      disabled={registerMutation.isPending}
      size="lg"
    >
      {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
    </Button>
  );
}

// Participants table component
function TournamentParticipants({ tournamentId }: { tournamentId: string }) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [participationTypeFilter, setParticipationTypeFilter] = useState("all");

  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
  });

  // Get unique clubs for filter
  const uniqueClubs = useMemo(() => {
    const clubs = participants.map(p => p.clubAffiliation).filter(Boolean);
    return Array.from(new Set(clubs));
  }, [participants]);

  // Get unique participation types for filter
  const uniqueParticipationTypes = useMemo(() => {
    const types = participants.map(p => p.participationType).filter(Boolean);
    return Array.from(new Set(types));
  }, [participants]);

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      const matchesSearch = searchTerm === "" || 
        formatName(participant.firstName, participant.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.clubAffiliation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClub = clubFilter === "all" || participant.clubAffiliation === clubFilter;
      const matchesType = participationTypeFilter === "all" || participant.participationType === participationTypeFilter;
      
      return matchesSearch && matchesClub && matchesType;
    });
  }, [participants, searchTerm, clubFilter, participationTypeFilter]);

  const participationTypeLabels: Record<string, string> = {
    "singles": "Ганцаарчилсан",
    "doubles": "Хосоор",
    "mixed_doubles": "Холимог хосоор",
    "team": "Багийн"
  };

  return (
    <Card className="card-dark">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-green-400" />
          Бүртгүүлсэн тоглогчид ({participants.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Нэр эсвэл клубээр хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Клуб сонгох" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Бүх клуб</SelectItem>
                {uniqueClubs.map(club => (
                  <SelectItem key={club} value={club} className="text-white hover:bg-gray-700">{club}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={participationTypeFilter} onValueChange={setParticipationTypeFilter}>
              <SelectTrigger className="w-[160px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Төрөл сонгох" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Бүх төрөл</SelectItem>
                {uniqueParticipationTypes.map(type => (
                  <SelectItem key={type} value={type} className="text-white hover:bg-gray-700">
                    {participationTypeLabels[type] || formatParticipation(parseParticipation(type))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {participants.length === 0 ? "Бүртгүүлсэн тоглогч байхгүй" : "Хайлтын үр дүн олдсонгүй"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-800 border-gray-700">
                <TableHead className="text-gray-300">Овог нэр</TableHead>
                <TableHead className="text-gray-300">Клуб</TableHead>
                <TableHead className="text-gray-300">Оролцох төрөл</TableHead>
                <TableHead className="text-gray-300">Зэрэг</TableHead>
                <TableHead className="text-gray-300">Бүртгүүлсэн огноо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id} className="hover:bg-gray-800 border-gray-700">
                  <TableCell>
                    <button 
                      className="flex items-center gap-2 text-left hover:text-green-400 transition-colors text-white"
                      onClick={() => {
                        console.log('Navigate to player profile:', participant.id);
                        setLocation(`/player/${participant.id}`);
                      }}
                    >
                      <User className="w-4 h-4" />
                      {formatName(participant.firstName, participant.lastName)}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-300">{participant.clubAffiliation || "Тодорхойгүй"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-green-400 text-green-400">
                      {participationTypeLabels[participant.participationType] || formatParticipation(parseParticipation(participant.participationType))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{participant.rank || "Тодорхойгүй"}</TableCell>
                  <TableCell className="text-gray-300">{format(new Date(participant.registeredAt), 'yyyy-MM-dd')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function TournamentPage() {
  const [match, params] = useRoute("/tournament/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Always call all hooks - don't make them conditional
  const { data: tournament, isLoading, error } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', params?.id],
    enabled: !!params?.id,
  });

  const { data: userRegistration } = useQuery<{ registered: boolean }>({
    queryKey: ['/api/tournaments', params?.id, 'user-registration'],
    enabled: isAuthenticated && !!params?.id,
  });

  const { data: tournamentResults } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', params?.id, 'results'],
    enabled: !!params?.id,
  });

  // Check if user meets rating requirements - always call useMemo
  const canRegister = useMemo(() => {
    if (!tournament || !isAuthenticated || !user) return false;
    
    // For now, assume all users can register
    // In the future, this should check user's rating against minRating/maxRating
    return true;
  }, [tournament, isAuthenticated, user]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Тэмцээний мэдээлэл ачаалж байна...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Тэмцээн олдсонгүй</h1>
          <p className="text-gray-600 mb-4">Хүссэн тэмцээн байхгүй байна.</p>
          <Button 
            onClick={() => setLocation('/tournaments')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Тэмцээний хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy оны M сарын d өдөр');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm');
  };

  const participationTypeLabels: Record<string, string> = {
    "singles": "Ганцаарчилсан",
    "doubles": "Хосоор", 
    "mixed_doubles": "Холимог хосоор",
    "team": "Багийн"
  };

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen main-bg">
        {/* Hero Section with Background Image */}
        <div className="relative h-96 overflow-hidden">
        {/* Background Image */}
        {tournament.backgroundImageUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${tournament.backgroundImageUrl})`
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        )}
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Button 
            onClick={() => setLocation('/tournaments')}
            variant="outline"
            className="bg-white/10 border-white/30 text-white backdrop-blur-sm hover:bg-white/20 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Буцах
          </Button>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-white">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Зохион байгуулагч: {tournament.organizer}</span>
                </div>
              </div>
              
              {/* Medal Winners Section */}
              <MedalWinnersSection tournamentResults={tournamentResults} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Content - Tournament Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tournament Information Card */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-green-400" />
                  Тэмцээний мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold mb-2">Тайлбар</h3>
                  {tournament.richDescription ? (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: tournament.richDescription }}
                    />
                  ) : (
                    <p className="text-gray-300">{tournament.description}</p>
                  )}
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Эхлэх огноо</h4>
                    <p className="text-gray-300">{formatDateTime(tournament.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Дуусах огноо</h4>
                    <p className="text-gray-300">{formatDateTime(tournament.endDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Бүртгэлийн эцсийн хугацаа</h4>
                    <p className="text-gray-300">
                      {tournament.registrationDeadline ? formatDateTime(tournament.registrationDeadline) : "Тодорхойгүй"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Оролцогчдын тоо</h4>
                    <p className="text-gray-300">
                      {tournament.maxParticipants ? `Дээд тал ${tournament.maxParticipants}` : "Хязгааргүй"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Оролцооны төлбөр</h4>
                    <p className="text-gray-300">{tournament.entryFee} ₮</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-white">Оролцох төрлүүд</h4>
                    <div className="flex flex-wrap gap-1">
                      {tournament.participationTypes.map(type => (
                        <Badge key={type} variant="outline" className="border-green-400 text-green-400">
                          {participationTypeLabels[type] || formatParticipation(parseParticipation(type))}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {(tournament.minRating || tournament.maxRating) && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Зэрэглэлийн шаардлага</h4>
                      <div className="flex gap-4">
                        {tournament.minRating && (
                          <div>
                            <span className="text-sm text-gray-300">Доод зэрэг: </span>
                            <Badge className="bg-green-600 text-white">{tournament.minRating}</Badge>
                          </div>
                        )}
                        {tournament.maxRating && (
                          <div>
                            <span className="text-sm text-gray-300">Дээд зэрэг: </span>
                            <Badge className="bg-green-600 text-white">{tournament.maxRating}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {tournament.rules && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Журам</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  </>
                )}

                {tournament.prizes && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Шагнал</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{tournament.prizes}</p>
                    </div>
                  </>
                )}

                {tournament.requirements && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Шаардлага</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{tournament.requirements}</p>
                    </div>
                  </>
                )}

                {tournament.contactInfo && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Холбоо барих</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{tournament.contactInfo}</p>
                    </div>
                  </>
                )}

                {tournament.regulationDocumentUrl && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Журмын баримт</h4>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={() => window.open(tournament.regulationDocumentUrl, '_blank')}
                      >
                        <FileText className="w-4 h-4" />
                        Журмын баримт үзэх
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Registered Players */}
            <TournamentParticipants tournamentId={tournament.id} />
          </div>

          {/* Right Sidebar - Registration */}
          <div className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Бүртгүүлэх</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TournamentRegistrationButton 
                  tournament={tournament}
                  userRegistration={userRegistration}
                  canRegister={canRegister}
                />
                
                <div className="text-sm text-gray-400 space-y-2">
                  <p>• Бүртгэлийн дараа буцаах боломжгүй</p>
                  <p>• Тэмцээнд оролцохоос өмнө төлбөр төлөх шаардлагатай</p>
                  <p>• Дэлгэрэнгүй мэдээлэл авахыг хүсвэл зохион байгуулагчтай холбогдоно уу</p>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Status */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Статус</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Статус:</span>
                    <Badge className={
                      tournament.status === 'registration' ? 'bg-green-600 text-white' :
                      tournament.status === 'ongoing' ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-white'
                    }>
                      {tournament.status === 'registration' ? 'Бүртгэл' : 
                       tournament.status === 'ongoing' ? 'Болж байна' : 'Дууссан'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Нийтлэгдсэн:</span>
                    <Badge variant={tournament.isPublished ? 'default' : 'secondary'} className={tournament.isPublished ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                      {tournament.isPublished ? 'Тийм' : 'Үгүй'}
                    </Badge>
                  </div>
                </div>
                
                {/* View Results Button - show when tournament results exist and are published */}
                {tournamentResults && tournamentResults.isPublished && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={() => setLocation(`/tournament/${tournament.id}/results`)}
                      className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-none"
                      variant="outline"
                    >
                      <Trophy className="w-4 h-4" />
                      Үр дүн харах
                    </Button>
                  </div>
                )}
                
                {/* Admin Results Button - only for admins */}
                {(user as any)?.role === 'admin' && (
                  <div className={tournament.status === 'completed' ? 'mt-2' : 'mt-4 pt-4 border-t'}>
                    <Button 
                      onClick={() => setLocation(`/admin/tournament/${tournament.id}/results`)}
                      className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      variant="secondary"
                    >
                      <FileText className="w-4 h-4" />
                      Үр дүн оруулах (Админ)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </PageWithLoading>
  );
}