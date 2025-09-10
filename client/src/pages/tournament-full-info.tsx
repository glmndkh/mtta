import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { ArrowLeft, User, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Tournament, TournamentResults } from "@shared/schema";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { ObjectUploader } from "@/components/ObjectUploader";

interface GroupStageGroup {
  groupName: string;
  players: Array<{ id: string; name: string; club?: string }>; 
  matches?: Array<{ id: string; player1: string; player2: string; score: string }>;
}

interface KnockoutMatch {
  id: string;
  round: number;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: { id: string; name: string };
  position: { x: number; y: number };
}

interface FinalRanking {
  position: number;
  playerId: string;
  playerName: string;
  prize?: string;
}

interface ParticipationCategory {
  minAge: number | null;
  maxAge: number | null;
  gender: string;
}

const parseParticipationType = (value: string): ParticipationCategory => {
  try {
    const obj = JSON.parse(value);
    if ("minAge" in obj || "maxAge" in obj) {
      return {
        minAge: obj.minAge ?? null,
        maxAge: obj.maxAge ?? null,
        gender: obj.gender || "male",
      };
    }
    if ("age" in obj) {
      const ageStr = String(obj.age);
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
    }
    return { minAge: null, maxAge: null, gender: obj.gender || "male" };
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

const formatParticipationType = (cat: ParticipationCategory) => {
  let range = "";
  if (cat.minAge !== null && cat.maxAge !== null) range = `${cat.minAge}-${cat.maxAge} нас`;
  else if (cat.minAge !== null) range = `${cat.minAge}+ нас`;
  else if (cat.maxAge !== null) range = `${cat.maxAge}-аас доош нас`;
  else range = "Нас хязгааргүй";
  return `${range} ${cat.gender === 'male' ? 'эрэгтэй' : 'эмэгтэй'}`;
};

export default function TournamentFullInfo() {
  const [match, params] = useRoute("/tournament/:id/full");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user: authUser } = useAuth();
  const user: any = authUser;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', params?.id],
    enabled: !!params?.id,
  });

  const { data: results } = useQuery<TournamentResults>({
    queryKey: ['/api/tournaments', params?.id, 'results'],
    enabled: !!params?.id,
  });

interface Participant {
  id: string;
  participationType: string;
  registeredAt: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
  email: string | null;
}

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/tournaments', params?.id, 'participants'],
    enabled: !!params?.id,
  });

  const { data: allPlayers = [] } = useQuery<any[]>({
    queryKey: ['/api/players'],
    enabled: user?.role === 'admin',
  });

  const availablePlayers = useMemo(
    () =>
      allPlayers.map((p: any) => ({
        id: p.players.id,
        firstName: p.users?.firstName || '',
        lastName: p.users?.lastName || '',
        email: p.users?.email || '',
        clubAffiliation: p.clubs?.name || '',
      })),
    [allPlayers],
  );

  const calculateAge = (dob: string | null) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const { data: userRegistration } = useQuery<{ registered: boolean }>({
    queryKey: ['/api/tournaments', params?.id, 'user-registration'],
    enabled: !!params?.id,
  });

  const [registrationType, setRegistrationType] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newParticipation, setNewParticipation] = useState("");
  const [albumImages, setAlbumImages] = useState<string[]>([]);

  useEffect(() => {
    if (tournament?.participationTypes?.length && !registrationType) {
      setRegistrationType(tournament.participationTypes[0]);
    }
  }, [tournament, registrationType]);

  const filteredParticipants =
    filterType === "all"
      ? participants
      : participants.filter((p) => p.participationType === filterType);

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        window.location.href = '/login';
        return;
      }
      return apiRequest(`/api/tournaments/${params?.id}/register`, {
        method: 'POST',
        body: JSON.stringify({ participationType: registrationType })
      });
    },
    onSuccess: () => {
      toast({
        title: 'Амжилттай бүртгүүллээ!',
        description: 'Тэмцээнд амжилттай бүртгүүллээ.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id, 'participants'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Алдаа гарлаа',
        description: error.message || 'Бүртгүүлэхэд алдаа гарлаа',
        variant: 'destructive',
      });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        `/api/admin/tournaments/${params?.id}/participants`,
        {
          method: 'POST',
          body: JSON.stringify({
            playerId: newPlayerId || undefined,
            playerName: newPlayerName || undefined,
            participationType: newParticipation,
          }),
        },
      );
    },
    onSuccess: () => {
      toast({ title: 'Тамирчин нэмэгдлээ' });
      setNewPlayerId('');
      setNewPlayerName('');
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id, 'participants'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Алдаа гарлаа',
        description: error.message || 'Тамирчин нэмэхэд алдаа гарлаа',
        variant: 'destructive',
      });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest(
        `/api/admin/tournaments/${params?.id}/participants/${playerId}`,
        { method: 'DELETE' },
      );
    },
    onSuccess: () => {
      toast({ title: 'Тамирчин хасагдлаа' });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id, 'participants'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Алдаа гарлаа',
        description: error.message || 'Тамирчин хасахад алдаа гарлаа',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <PageWithLoading>{null}</PageWithLoading>;
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="container mx-auto px-4 py-8 text-center text-white">
          <p>Тэмцээн олдсонгүй</p>
          <Button onClick={() => setLocation('/tournaments')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
        </div>
      </PageWithLoading>
    );
  }

  const groupStageResults: GroupStageGroup[] = (results?.groupStageResults as any) || [];
  const knockoutResults: KnockoutMatch[] = (results?.knockoutResults as any) || [];
  const finalRankings: FinalRanking[] = (results?.finalRankings as any) || [];

  const formatDate = (d: string | Date) => format(new Date(d), 'yyyy-MM-dd');

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen main-bg text-white">
        {/* Hero */}
        <div className="relative h-[60vh] flex flex-col justify-end">
          {tournament.backgroundImageUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${tournament.backgroundImageUrl})` }} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-black/60" />
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
          <div className="relative z-10 p-6 max-w-5xl mx-auto w-full">
            <div className="date text-sm mb-2">
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </div>
            <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex items-center gap-2 text-gray-300 mb-4">
              <span>{tournament.location}</span>
            </div>
            <div className="actions">
              {userRegistration?.registered ? (
                <Button disabled className="bg-green-600 text-white cursor-not-allowed">
                  Бүртгүүлсэн
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={registrationType}
                    onValueChange={setRegistrationType}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Ангилал" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournament?.participationTypes?.map((type) => {
                        const cat = parseParticipationType(type);
                        return (
                          <SelectItem key={type} value={type}>
                            {formatParticipationType(cat)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => registerMutation.mutate()}
                    disabled={registerMutation.isPending || !registrationType}
                  >
                    {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto mt-6 px-4 pb-10">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 bg-gray-800 mb-4">
              <TabsTrigger value="overview">Тойм</TabsTrigger>
              <TabsTrigger value="groups">Хэсгийн тоглолтууд</TabsTrigger>
              <TabsTrigger value="knockout">Нугалаа</TabsTrigger>
              <TabsTrigger value="participants">Баг тамирчид</TabsTrigger>
              <TabsTrigger value="album">Альбом</TabsTrigger>
              <TabsTrigger value="details">Тэмцээний дэлгэрэнгүй</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              {results?.isPublished && finalRankings.length > 0 ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Тэмцээний үр дүн</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Байр</TableHead>
                          <TableHead>Тоглогч</TableHead>
                          <TableHead>Шагнал</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalRankings.map((r) => (
                          <TableRow key={r.playerId}>
                            <TableCell>{r.position}</TableCell>
                            <TableCell>{r.playerName}</TableCell>
                            <TableCell>{r.prize || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-gray-400 py-8">Үр дүн оруулаагүй байна.</div>
              )}
            </TabsContent>

            {/* Group Stage */}
            <TabsContent value="groups">
              {groupStageResults.length > 0 ? (
                <div className="space-y-6">
                  {groupStageResults.map((group) => (
                    <Card key={group.groupName}>
                      <CardHeader>
                        <CardTitle>{group.groupName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Тоглогч</TableHead>
                              <TableHead>Клуб</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.players.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>{p.name}</TableCell>
                                <TableCell>{p.club || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">Хэсгийн тоглолт оруулаагүй байна.</div>
              )}
            </TabsContent>

            {/* Knockout */}
            <TabsContent value="knockout">
              {knockoutResults.length > 0 ? (
                <KnockoutBracket
                  matches={knockoutResults.map(match => ({
                    id: match.id,
                    round: match.round,
                    player1: match.player1,
                    player2: match.player2,
                    winner: match.winner,
                    score1: match.player1Score ? parseInt(match.player1Score, 10) : undefined,
                    score2: match.player2Score ? parseInt(match.player2Score, 10) : undefined,
                    position: match.position
                  }))}
                />
              ) : (
                <div className="text-center text-gray-400 py-8">Нугалааны мэдээлэл алга.</div>
              )}
            </TabsContent>

            {/* Participants */}
            <TabsContent value="participants">
              <div className="space-y-4">
                {user?.role === 'admin' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="sm:w-1/3">
                      <UserAutocomplete
                        users={availablePlayers}
                        value={newPlayerId}
                        onSelect={(u) => {
                          setNewPlayerId(u ? u.id : '');
                          if (u) setNewPlayerName('');
                        }}
                        placeholder="Тоглогч хайх..."
                        allowCustomName
                        customNameValue={newPlayerName}
                        onCustomNameChange={(name) => {
                          setNewPlayerName(name);
                          setNewPlayerId('');
                        }}
                      />
                    </div>
                    <Select
                      value={newParticipation}
                      onValueChange={setNewParticipation}
                    >
                      <SelectTrigger className="sm:w-1/3">
                        <SelectValue placeholder="Ангилал" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournament?.participationTypes?.map((type) => {
                          const cat = parseParticipationType(type);
                          return (
                            <SelectItem key={type} value={type}>
                              {formatParticipationType(cat)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => addParticipantMutation.mutate()}
                      disabled={
                        addParticipantMutation.isPending ||
                        (!newPlayerId && !newPlayerName) ||
                        !newParticipation
                      }
                    >
                      Нэмэх
                    </Button>
                  </div>
                )}

                {participants.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Ангилал шүүх" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Бүх ангилал</SelectItem>
                          {tournament?.participationTypes?.map((type) => {
                            const cat = parseParticipationType(type);
                            return (
                              <SelectItem key={type} value={type}>
                                {formatParticipationType(cat)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Group participants by age category */}
                    {(() => {
                      // Насны ангилал үүсгэх функц
                      const getAgeGroup = (age: number | string) => {
                        const ageNum = typeof age === 'string' ? parseInt(age) : age;
                        if (isNaN(ageNum) || ageNum < 0) return 'Тодорхойгүй нас';
                        
                        if (ageNum <= 12) return '8-12 нас';
                        if (ageNum <= 15) return '13-15 нас';
                        if (ageNum <= 18) return '16-18 нас';
                        if (ageNum <= 25) return '19-25 нас';
                        if (ageNum <= 30) return '26-30 нас';
                        if (ageNum <= 35) return '31-35 нас';
                        if (ageNum <= 40) return '36-40 нас';
                        if (ageNum <= 45) return '41-45 нас';
                        if (ageNum <= 50) return '46-50 нас';
                        return '50+ нас';
                      };

                      const participantsByCategory = filteredParticipants.reduce((acc, p) => {
                        const age = calculateAge(p.dateOfBirth);
                        const ageGroup = getAgeGroup(age);
                        const cat = parseParticipationType(p.participationType);
                        const genderStr = cat.gender === 'male' ? 'эрэгтэй' : 'эмэгтэй';
                        const categoryKey = `${ageGroup} ${genderStr}`;
                        
                        if (!acc[categoryKey]) {
                          acc[categoryKey] = [];
                        }
                        acc[categoryKey].push(p);
                        return acc;
                      }, {} as Record<string, typeof participants>);

                      return Object.entries(participantsByCategory)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([categoryName, categoryParticipants]) => (
                        <Card key={categoryName} className="mb-4">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{categoryName}</span>
                              <span className="text-sm font-normal bg-blue-600 text-white px-2 py-1 rounded">
                                {categoryParticipants.length} тамирчин
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Нэр</TableHead>
                                  <TableHead>Нас</TableHead>
                                  <TableHead>Хүйс</TableHead>
                                  {user?.role === 'admin' && <TableHead></TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {categoryParticipants
                                  .sort((a, b) => {
                                    const ageA = calculateAge(a.dateOfBirth);
                                    const ageB = calculateAge(b.dateOfBirth);
                                    return typeof ageA === 'number' && typeof ageB === 'number' ? ageA - ageB : 0;
                                  })
                                  .map((p) => {
                                    const cat = parseParticipationType(p.participationType);
                                    return (
                                      <TableRow key={p.id}>
                                        <TableCell>
                                          {p.email ? (
                                            <button
                                              className="flex items-center gap-1 text-left hover:text-mtta-green"
                                              onClick={() => setLocation(`/player/${p.id}`)}
                                            >
                                              <User className="w-4 h-4" />
                                              {`${p.lastName} ${p.firstName}`}
                                            </button>
                                          ) : (
                                            `${p.lastName} ${p.firstName}`
                                          )}
                                        </TableCell>
                                        <TableCell>{calculateAge(p.dateOfBirth)}</TableCell>
                                        <TableCell>
                                          {cat.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
                                        </TableCell>
                                        {user?.role === 'admin' && (
                                          <TableCell>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() =>
                                                removeParticipantMutation.mutate(p.id)
                                              }
                                            >
                                              Хасах
                                            </Button>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Тамирчдын мэдээлэл алга.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Album */}
            <TabsContent value="album">
              <div className="space-y-4">
                {user?.role === 'admin' && (
                  <ObjectUploader
                    maxNumberOfFiles={10}
                    maxFileSize={5 * 1024 * 1024}
                    onGetUploadParameters={async () => {
                      try {
                        const response = await apiRequest('/api/objects/upload', {
                          method: 'POST',
                        });
                        const data = (await response.json()) as { uploadURL: string };
                        if (!data || !data.uploadURL) {
                          throw new Error('No upload URL received');
                        }
                        return { method: 'PUT' as const, url: data.uploadURL };
                      } catch (error) {
                        console.error('Error getting upload parameters:', error);
                        toast({
                          title: 'Алдаа',
                          description: 'Зураг хуулах URL авахад алдаа гарлаа',
                          variant: 'destructive',
                        });
                        throw error;
                      }
                    }}
                    onComplete={async (result) => {
                      const successful = result.successful ?? [];
                      for (const file of successful) {
                        try {
                          const aclResponse = await apiRequest('/api/objects/acl', {
                            method: 'PUT',
                            body: JSON.stringify({ imageURL: file.uploadURL }),
                          });
                          const aclData = (await aclResponse.json()) as { objectPath: string };
                          setAlbumImages((prev) => [...prev, aclData.objectPath]);
                        } catch (error) {
                          console.error('Error setting ACL:', error);
                          toast({
                            title: 'Алдаа',
                            description: 'Зураг нийтлэхэд алдаа гарлаа',
                            variant: 'destructive',
                          });
                        }
                      }
                      if (successful.length > 0) {
                        toast({ title: 'Зураг амжилттай хуулагдлаа' });
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Зураг нэмэх
                  </ObjectUploader>
                )}
                {albumImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {albumImages.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Tournament photo ${idx + 1}`}
                        className="w-full h-40 object-cover rounded"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Альбомын зураг оруулаагүй байна.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Details */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Тэмцээний дэлгэрэнгүй</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <dt className="font-semibold">Эхлэх огноо:</dt>
                    <dd>{formatDate(tournament.startDate)}</dd>
                    <dt className="font-semibold">Дуусах огноо:</dt>
                    <dd>{formatDate(tournament.endDate)}</dd>
                    <dt className="font-semibold">Байршил:</dt>
                    <dd>{tournament.location || '-'}</dd>
                    <dt className="font-semibold">Зохион байгуулагч:</dt>
                    <dd>{tournament.organizer || '-'}</dd>
                    <dt className="font-semibold">Тайлбар:</dt>
                    <dd>{tournament.description || '-'}</dd>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
}
