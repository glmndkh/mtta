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
import { ExternalLink, Download, ArrowLeft, Users, Calendar, MapPin, Trophy, FileText, Search, Filter, AlertTriangle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

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
      return apiRequest('POST', `/api/tournaments/${tournament.id}/register`, { participationType });
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
          className="bg-red-600 text-white cursor-not-allowed w-full sm:w-auto"
          size="lg"
        >
          Бүртгүүлэх боломжгүй
        </Button>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Та энэ тэмцээнд оролцох шаардлага хангахгүй байна</span>
        </div>
      </div>
    );
  }

  return (
    <Button
      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
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
        `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Бүртгүүлсэн тоглогчид ({participants.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Нэр эсвэл клубээр хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Клуб сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх клуб</SelectItem>
                {uniqueClubs.map(club => (
                  <SelectItem key={club} value={club}>{club}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={participationTypeFilter} onValueChange={setParticipationTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Төрөл сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх төрөл</SelectItem>
                {uniqueParticipationTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {participationTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {participants.length === 0 ? "Бүртгүүлсэн тоглогч байхгүй" : "Хайлтын үр дүн олдсонгүй"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Овог нэр</TableHead>
                <TableHead>Клуб</TableHead>
                <TableHead>Оролцох төрөл</TableHead>
                <TableHead>Зэрэг</TableHead>
                <TableHead>Бүртгүүлсэн огноо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <button 
                      className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors"
                      onClick={() => {
                        // TODO: Navigate to player profile page
                        console.log('Navigate to player profile:', participant.id);
                      }}
                    >
                      <User className="w-4 h-4" />
                      {participant.firstName} {participant.lastName}
                    </button>
                  </TableCell>
                  <TableCell>{participant.clubAffiliation || "Тодорхойгүй"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {participationTypeLabels[participant.participationType] || participant.participationType}
                    </Badge>
                  </TableCell>
                  <TableCell>{participant.rank || "Тодорхойгүй"}</TableCell>
                  <TableCell>{format(new Date(participant.registeredAt), 'yyyy-MM-dd')}</TableCell>
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
    <div className="min-h-screen bg-gray-50">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Content - Tournament Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tournament Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Тэмцээний мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Тайлбар</h3>
                  {tournament.richDescription ? (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: tournament.richDescription }}
                    />
                  ) : (
                    <p className="text-gray-600">{tournament.description}</p>
                  )}
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Эхлэх огноо</h4>
                    <p className="text-gray-600">{formatDateTime(tournament.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Дуусах огноо</h4>
                    <p className="text-gray-600">{formatDateTime(tournament.endDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Бүртгэлийн эцсийн хугацаа</h4>
                    <p className="text-gray-600">
                      {tournament.registrationDeadline ? formatDateTime(tournament.registrationDeadline) : "Тодорхойгүй"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Оролцогчдын тоо</h4>
                    <p className="text-gray-600">
                      {tournament.maxParticipants ? `Дээд тал ${tournament.maxParticipants}` : "Хязгааргүй"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Оролцооны төлбөр</h4>
                    <p className="text-gray-600">{tournament.entryFee} ₮</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Оролцох төрлүүд</h4>
                    <div className="flex flex-wrap gap-1">
                      {tournament.participationTypes.map(type => (
                        <Badge key={type} variant="outline">
                          {participationTypeLabels[type] || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {(tournament.minRating || tournament.maxRating) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Зэрэглэлийн шаардлага</h4>
                      <div className="flex gap-4">
                        {tournament.minRating && (
                          <div>
                            <span className="text-sm text-gray-600">Доод зэрэг: </span>
                            <Badge>{tournament.minRating}</Badge>
                          </div>
                        )}
                        {tournament.maxRating && (
                          <div>
                            <span className="text-sm text-gray-600">Дээд зэрэг: </span>
                            <Badge>{tournament.maxRating}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {tournament.rules && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Журам</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  </>
                )}

                {tournament.prizes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Шагнал</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{tournament.prizes}</p>
                    </div>
                  </>
                )}

                {tournament.requirements && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Шаардлага</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{tournament.requirements}</p>
                    </div>
                  </>
                )}

                {tournament.contactInfo && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Холбоо барих</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{tournament.contactInfo}</p>
                    </div>
                  </>
                )}

                {tournament.regulationDocumentUrl && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Журмын баримт</h4>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
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
            <Card>
              <CardHeader>
                <CardTitle>Бүртгүүлэх</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TournamentRegistrationButton 
                  tournament={tournament}
                  userRegistration={userRegistration}
                  canRegister={canRegister}
                />
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Бүртгэлийн дараа буцаах боломжгүй</p>
                  <p>• Тэмцээнд оролцохоос өмнө төлбөр төлөх шаардлагатай</p>
                  <p>• Дэлгэрэнгүй мэдээлэл авахыг хүсвэл зохион байгуулагчтай холбогдоно уу</p>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Status */}
            <Card>
              <CardHeader>
                <CardTitle>Статус</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <Badge className={
                      tournament.status === 'registration' ? 'bg-green-100 text-green-800' :
                      tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {tournament.status === 'registration' ? 'Бүртгэл' : 
                       tournament.status === 'ongoing' ? 'Болж байна' : 'Дууссан'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Нийтлэгдсэн:</span>
                    <Badge variant={tournament.isPublished ? 'default' : 'secondary'}>
                      {tournament.isPublished ? 'Тийм' : 'Үгүй'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}