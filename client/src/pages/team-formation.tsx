import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navigation from '@/components/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Users, UserPlus, CheckCircle, AlertCircle, Trophy, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Participant {
  id: string;
  participationType: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
}

export default function TeamFormation() {
  const { user } = useAuth();
  const [, params] = useRoute("/tournament/:id/form-team");
  const [, setLocation] = useLocation();
  const tournamentId = params?.id || "";
  const searchParams = new URLSearchParams(window.location.search);
  const eventType = searchParams.get("event") || "";

  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEntry, setCreatedEntry] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Parse the event type to determine category requirements
  const parsedEvent = useMemo(() => {
    try {
      return JSON.parse(eventType);
    } catch {
      return {};
    }
  }, [eventType]);

  const categoryType = parsedEvent.subType || parsedEvent.type || "";
  const isTeam = categoryType.includes("TEAM");
  const minMembers = isTeam ? 3 : 2;
  const maxMembers = isTeam ? 4 : 2;

  // Fetch tournament details
  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", tournamentId],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error("Failed to fetch tournament");
      return res.json();
    },
    enabled: !!tournamentId,
  });

  // Fetch all registered users for this tournament and event
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["/api/registrations", tournamentId, eventType, debouncedSearch],
    queryFn: async () => {
      if (!eventType) {
        console.error("Event type is missing");
        throw new Error("Event төрөл байхгүй байна");
      }
      
      console.log("Fetching registrations for:", { tournamentId, eventType });
      
      const params = new URLSearchParams({
        tournamentId,
        event: eventType,
      });
      if (debouncedSearch.trim()) {
        params.append('q', debouncedSearch);
      }
      const res = await fetch(`/api/registrations?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to fetch registrations:", error);
        throw new Error(error.message || "Бүртгэл авахад алдаа гарлаа");
      }
      const data = await res.json();
      console.log("Fetched registrations:", data.length, "users");
      return data;
    },
    enabled: !!tournamentId && !!eventType,
  });

  // Available players - exclude current user and already selected members, validate gender
  const availablePlayers = useMemo(() => {
    if (!allUsers || !user) return [];
    
    // Parse event to get gender requirements
    let requiredGender: 'male' | 'female' | 'mixed' | null = null;
    try {
      const parsed = JSON.parse(eventType);
      if (parsed.subType?.includes('MEN')) requiredGender = 'male';
      else if (parsed.subType?.includes('WOMEN')) requiredGender = 'female';
      else if (parsed.subType?.includes('MIXED')) requiredGender = 'mixed';
      else if (parsed.gender) requiredGender = parsed.gender;
    } catch {
      // Ignore parse errors
    }

    return allUsers.filter((player: any) => {
      // Exclude current user
      if (player.id === user.id) return false;
      
      // Exclude already selected members
      if (selectedMembers.find(m => m.id === player.id)) return false;
      
      // Validate gender for non-mixed events
      if (requiredGender && requiredGender !== 'mixed') {
        if (player.gender !== requiredGender) return false;
      }
      
      return true;
    });
  }, [allUsers, selectedMembers, user, eventType]);

  const handleAddMember = (player: any) => {
    // Validate member count
    if (selectedMembers.length >= maxMembers - 1) { // -1 because current user is already counted
      toast({
        title: "Хязгаар хэтэрсэн",
        description: `Багийн гишүүдийн дээд хязгаар ${maxMembers} (та оролцсон)`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate gender eligibility for non-mixed events
    const eventGender = getGenderFromEvent(eventType);
    if (eventGender && eventGender !== 'mixed' && player.gender !== eventGender) {
      toast({
        title: "Хүйсний шаардлага хангахгүй",
        description: `Энэ төрөлд зөвхөн ${eventGender === 'male' ? 'эрэгтэй' : 'эмэгтэй'} тоглогч оролцох боломжтой`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedMembers([...selectedMembers, player]);
    toast({
      title: "Амжилттай",
      description: `${player.firstName} ${player.lastName} нэмэгдлээ`,
    });
  };

  const handleRemoveMember = (playerId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== playerId));
    toast({
      title: "Гишүүн хасагдлаа",
      description: "Гишүүн амжилттай хасагдлаа",
    });
  };

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; members: number[] }) => {
      const response = await fetch(isTeam ? "/api/teams" : "/api/pairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tournamentId,
          category: eventType,
          name: data.name,
          memberIds: data.members,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create ${isTeam ? 'team' : 'pair'}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай!",
        description: `${isTeam ? 'Баг' : 'Хос'} амжилттай үүслээ`,
      });
      setLocation(`/tournament/${tournamentId}/full`);
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validate team name for team events
    if (isTeam && !teamName.trim()) {
      toast({
        title: "Алдаа",
        description: "Багийн нэр оруулна уу",
        variant: "destructive",
      });
      return;
    }

    // Total members including current user
    const totalMembers = selectedMembers.length + 1;
    
    // Validate member count
    if (totalMembers < minMembers) {
      toast({
        title: "Алдаа",
        description: `Гишүүдийн тоо хангалтгүй байна. Хамгийн багадаа ${minMembers} гишүүн шаардлагатай (таныг оруулаад)`,
        variant: "destructive",
      });
      return;
    }

    if (totalMembers > maxMembers) {
      toast({
        title: "Алдаа",
        description: `Гишүүдийн тоо хэтэрсэн байна. Хамгийн ихдээ ${maxMembers} гишүүн байх ёстой (таныг оруулаад)`,
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({
      name: teamName.trim() || `${isTeam ? 'Баг' : 'Хос'} - ${Date.now()}`,
      members: selectedMembers.map(m => m.id),
    });
  };

  const getEventLabel = (type: string): string => {
    try {
      const parsed = JSON.parse(type);
      const SUBTYPE_LABEL: Record<string, string> = {
        'MEN_DOUBLES': 'Дан эрэгтэй хос',
        'WOMEN_DOUBLES': 'Дан эмэгтэй хос',
        'MIXED_DOUBLES': 'Холимог хос',
        'MEN_TEAM': 'Эрэгтэй баг',
        'WOMEN_TEAM': 'Эмэгтэй баг',
        'MIXED_TEAM': 'Холимог баг',
      };

      if (parsed.subType && SUBTYPE_LABEL[parsed.subType]) {
        return SUBTYPE_LABEL[parsed.subType];
      }

      return type;
    } catch {
      return type;
    }
  };

  const getEventTypeCategory = (type: string): 'doubles' | 'team' | null => {
    try {
      const parsed = JSON.parse(type);
      if (parsed.type === 'DOUBLES' || parsed.subType?.includes('DOUBLES')) return 'doubles';
      if (parsed.type === 'TEAM' || parsed.subType?.includes('TEAM')) return 'team';
      if (parsed.type === 'pair') return 'doubles';
      if (parsed.type === 'team') return 'team';
      return null;
    } catch {
      return null;
    }
  };

  const getGenderFromEvent = (type: string): 'male' | 'female' | 'mixed' | null => {
    try {
      const parsed = JSON.parse(type);
      if (parsed.subType?.includes('MEN')) return 'male';
      if (parsed.subType?.includes('WOMEN')) return 'female';
      if (parsed.subType?.includes('MIXED')) return 'mixed';
      if (parsed.gender) return parsed.gender;
      return null;
    } catch {
      return null;
    }
  };

  const eventCategory = getEventTypeCategory(eventType);
  const eventGender = getGenderFromEvent(eventType);
  // const minMembers = eventCategory === 'doubles' ? 1 : 3; // Doubles: 1 partner, Team: min 3 members
  // const maxMembers = eventCategory === 'doubles' ? 1 : 4; // Doubles: 1 partner, Team: max 4 members



  // Validation
  const validateSelection = (): { valid: boolean; error?: string } => {
    if (eventCategory === 'team' && !teamName.trim()) {
      return { valid: false, error: 'Багийн нэр оруулна уу' };
    }

    if (selectedMembers.length < minMembers) {
      return {
        valid: false,
        error: eventCategory === 'doubles'
          ? 'Хамтрагчаа сонгоно уу'
          : `Багт хамгийн багадаа ${minMembers} гишүүн байх ёстой`
      };
    }

    if (selectedMembers.length > maxMembers) {
      return {
        valid: false,
        error: `Хамгийн ихдээ ${maxMembers} ${eventCategory === 'doubles' ? 'хамтрагч' : 'гишүүн'} сонгох боломжтой`
      };
    }

    // Check for duplicates
    const uniqueMembers = new Set([user?.id, ...selectedMembers.map(m => m.id)]);
    if (uniqueMembers.size !== selectedMembers.length + 1) {
      return { valid: false, error: 'Давхардсан гишүүд байна' };
    }

    return { valid: true };
  };

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      const validation = validateSelection();
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const response = await apiRequest(`/api/tournaments/${params?.id}/create-${eventCategory}`, {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          teamName: teamName.trim() || undefined,
          members: [user?.id, ...selectedMembers.map(m => m.id)],
        }),
      });

      return response.json();
    },
    onSuccess: (data) => {
      setCreatedEntry(data);
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Алдаа',
        description: error.message || 'Баг/хос үүсгэхэд алдаа гарлаа',
        variant: 'destructive',
      });
    },
  });


  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setTeamName('');
    setSelectedMembers([]);
    setSearchQuery('');
    setCreatedEntry(null);
  };

  const validation = validateSelection();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          onClick={() => setLocation(`/tournament/${params?.id}/full`)}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              {isTeam ? 'Баг бүрдүүлэх' : 'Хос бүрдүүлэх'}
            </CardTitle>
            <CardDescription>
              {tournament?.name} - {getEventLabel(eventType)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {isTeam ? 'Баг бүрдүүлэх' : 'Хос бүрдүүлэх'}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {isTeam
                      ? `Багийн гишүүдээ сонгоно уу. Баг нь ${minMembers}-${maxMembers} гишүүнтэй байх ёстой.`
                      : `Хамтрагчаа сонгож хос бүрдүүлнэ үү. Хос нь ${minMembers} тамирчнаас бүрдэнэ.`
                    }
                  </p>
                  {eventGender && eventGender !== 'mixed' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      ℹ️ Бүх гишүүд {eventGender === 'male' ? 'эрэгтэй' : 'эмэгтэй'} байх ёстой
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Name (only for team events) */}
            {isTeam && (
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-base font-semibold">
                  Багийн нэр <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Багийн нэрээ оруулна уу"
                  className="max-w-md"
                />
              </div>
            )}

            {/* Current Members */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {isTeam ? 'Багийн бүрэлдэхүүн' : 'Хос бүрдэл'}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded border-2 border-green-500">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {user?.gender === 'male' ? '👨 Эрэгтэй' : '👩 Эмэгтэй'}
                  </Badge>
                  <Badge className="ml-auto bg-green-600 text-white">Та (Удирдагч)</Badge>
                </div>
                {selectedMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="flex-1">{member.firstName} {member.lastName}</span>
                    <Badge variant="outline" className="text-xs">
                      {member.gender === 'male' ? '👨 Эрэгтэй' : '👩 Эмэгтэй'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Гишүүн хасах"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  {isTeam
                    ? `Нийт: ${selectedMembers.length + 1}/${maxMembers} гишүүн (шаардлагатай: ${minMembers}-${maxMembers})`
                    : `Нийт: ${selectedMembers.length + 1}/${maxMembers} хүн (таныг оруулаад)`
                  }
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-base font-semibold">
                {isTeam ? 'Багийн гишүүд хайх' : 'Хамтрагч хайх'}
              </Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                }}
                placeholder="Нэрээр хайх..."
              />
            </div>

            {/* Available Participants */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">
                {isTeam ? 'Багт оруулах гишүүд' : 'Хамтрагч'} ({availablePlayers.length})
              </h4>

              {isLoadingUsers ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-30 animate-pulse" />
                  <p className="font-medium">Тамирчдын жагсаалт уншиж байна...</p>
                </div>
              ) : usersError ? (
                <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Алдаа гарлаа</p>
                  <p className="text-sm mt-2">{usersError.message}</p>
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Энэ төрөлд бүртгүүлсэн тамирчид олдсонгүй</p>
                  <p className="text-sm mt-2">Та зөвхөн энэ төрөлд бүртгүүлсэн тамирчдаас сонгох боломжтой</p>
                  {allUsers.length > 0 && (
                    <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                      Санамж: {allUsers.length} тамирчид энэ тэмцээнд бүртгүүлсэн боловч:
                      <br />• Таны сонгосон төрөлд биш эсвэл
                      <br />• Хүйсний шаардлага хангахгүй эсвэл
                      <br />• Аль хэдийн сонгогдсон байна
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                  {availablePlayers.map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 hover:shadow-sm"
                      onClick={() => handleAddMember(participant)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {participant.firstName} {participant.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {participant.gender === 'male' ? '👨 Эрэгтэй' : '👩 Эмэгтэй'}
                          </p>
                          {participant.clubAffiliation && (
                            <Badge variant="outline" className="text-xs">
                              {participant.clubAffiliation}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation Error */}
            {!validation.valid && selectedMembers.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{validation.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                onClick={() => setLocation(`/tournament/${params?.id}/full`)}
                variant="outline"
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTeamMutation.isPending || !validation.valid}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createTeamMutation.isPending
                  ? 'Үүсгэж байна...'
                  : `✓ ${isTeam ? 'Баг үүсгэх' : 'Хос бүрдүүлэх'}`
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Амжилттай үүслээ!
            </DialogTitle>
            <DialogDescription>
              {isTeam ? 'Таны баг амжилттай үүслээ' : 'Таны хос амжилттай бүрдлээ'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                {isTeam ? `Баг: ${createdEntry?.team?.name}` : 'Хос бүрдэл'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Төрөл: {getEventLabel(eventType)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCreateAnother}
                variant="outline"
                className="flex-1"
              >
                Өөр баг/хос үүсгэх
              </Button>
              <Button
                onClick={() => setLocation(`/tournament/${params?.id}/full`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Тэмцээн рүү буцах
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}