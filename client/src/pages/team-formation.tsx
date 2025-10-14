
import { useState, useEffect } from 'react';
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
import { ArrowLeft, Users, UserPlus, CheckCircle, AlertCircle, Trophy } from 'lucide-react';
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
  const [match, params] = useRoute('/tournament/:id/form-team');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'team' | 'doubles'>('team');
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEntry, setCreatedEntry] = useState<any>(null);

  // Get event type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const eventType = urlParams.get('event') || '';

  const { data: tournament } = useQuery({
    queryKey: ['/api/tournaments', params?.id],
    enabled: !!params?.id,
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/tournaments', params?.id, 'participants'],
    enabled: !!params?.id,
  });

  // Determine if event is team or doubles from event type
  useEffect(() => {
    if (eventType) {
      const category = getEventTypeCategory(eventType);
      if (category === 'team') setActiveTab('team');
      else if (category === 'doubles') setActiveTab('doubles');
    }
  }, [eventType]);

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
  const minMembers = eventCategory === 'doubles' ? 1 : 3; // Doubles: 1 partner, Team: min 3 members
  const maxMembers = eventCategory === 'doubles' ? 1 : 4; // Doubles: 1 partner, Team: max 4 members

  // Filter participants for the same event
  const eventParticipants = participants.filter(p => 
    p.participationType === eventType && p.id !== user?.id
  );

  // Further filter by gender constraints
  const validParticipants = eventParticipants.filter(p => {
    if (eventGender === 'mixed') return true; // Mixed allows all genders
    if (eventGender === 'male' && p.gender === 'male') return true;
    if (eventGender === 'female' && p.gender === 'female') return true;
    return false;
  });

  const filteredParticipants = validParticipants.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

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
    const uniqueMembers = new Set([user?.id, ...selectedMembers]);
    if (uniqueMembers.size !== selectedMembers.length + 1) {
      return { valid: false, error: 'Давхардсан гишүүд байна' };
    }

    // Gender validation for non-mixed events
    if (eventGender !== 'mixed') {
      const allMembers = [user, ...selectedMembers.map(id => participants.find(p => p.id === id))];
      const invalidGender = allMembers.some(m => m && m.gender !== eventGender);
      if (invalidGender) {
        return { 
          valid: false, 
          error: `Бүх гишүүд ${eventGender === 'male' ? 'эрэгтэй' : 'эмэгтэй'} байх ёстой`
        };
      }
    }

    return { valid: true };
  };

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const validation = validateSelection();
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const response = await apiRequest(`/api/tournaments/${params?.id}/create-team`, {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          teamName: teamName.trim() || undefined,
          members: [user?.id, ...selectedMembers],
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
        description: error.message || 'Баг үүсгэхэд алдаа гарлаа',
        variant: 'destructive',
      });
    },
  });

  const handleToggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      if (selectedMembers.length < maxMembers) {
        setSelectedMembers([...selectedMembers, memberId]);
      } else {
        toast({
          title: 'Анхааруулга',
          description: `Хамгийн ихдээ ${maxMembers} ${eventCategory === 'doubles' ? 'хамтрагч' : 'гишүүн'} сонгох боломжтой`,
          variant: 'destructive',
        });
      }
    }
  };

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
              Баг / Хос бүрдүүлэх
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
                    {eventCategory === 'doubles' ? 'Хос бүрдүүлэх' : 'Баг бүрдүүлэх'}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {eventCategory === 'doubles' 
                      ? `Хамтрагчаа сонгож хос бүрдүүлнэ үү. Хос нь 2 тамирчнаас бүрдэнэ.`
                      : `Багийн гишүүдээ сонгоно уу. Баг нь ${minMembers + 1}-${maxMembers + 1} гишүүнтэй байх ёстой.`
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
            {eventCategory === 'team' && (
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
                {eventCategory === 'doubles' ? 'Хос бүрдэл' : 'Багийн бүрэлдэхүүн'}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <Badge variant="outline" className="ml-auto">Та</Badge>
                </div>
                {selectedMembers.map(memberId => {
                  const member = participants.find(p => p.id === memberId);
                  return member ? (
                    <div key={memberId} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{member.firstName} {member.lastName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {member.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
                      </Badge>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  {eventCategory === 'doubles' 
                    ? `${selectedMembers.length}/1 хамтрагч сонгогдсон`
                    : `${selectedMembers.length + 1}/${maxMembers + 1} гишүүн (мин. ${minMembers + 1})`
                  }
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-base font-semibold">
                {eventCategory === 'doubles' ? 'Хамтрагч хайх' : 'Багийн гишүүд хайх'}
              </Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Нэрээр хайх..."
              />
            </div>

            {/* Available Participants */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">
                Бүртгүүлсэн тамирчид ({filteredParticipants.length})
              </h4>
              
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Энэ төрөлд бүртгүүлсэн тамирчид олдсонгүй</p>
                  <p className="text-sm mt-2">Та зөвхөн бүртгүүлсэн тамирчдаас сонгох боломжтой</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                  {filteredParticipants.map(participant => (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedMembers.includes(participant.id)
                          ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 shadow-md'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300'
                      }`}
                      onClick={() => handleToggleMember(participant.id)}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(participant.id)}
                        onCheckedChange={() => handleToggleMember(participant.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {participant.firstName} {participant.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.gender === 'male' ? '👨 Эрэгтэй' : '👩 Эмэгтэй'}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-gray-400" />
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
                onClick={() => createTeamMutation.mutate()}
                disabled={createTeamMutation.isPending || !validation.valid}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createTeamMutation.isPending
                  ? 'Үүсгэж байна...'
                  : eventCategory === 'doubles'
                    ? '✓ Хос бүрдүүлэх'
                    : '✓ Баг үүсгэх'
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
              {eventCategory === 'doubles' ? 'Таны хос амжилттай бүрдлээ' : 'Таны баг амжилттай үүслээ'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                {eventCategory === 'team' ? `Баг: ${createdEntry?.team?.name}` : 'Хос бүрдэл'}
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
