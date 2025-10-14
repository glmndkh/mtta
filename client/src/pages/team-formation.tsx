
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Users, UserPlus, CheckCircle } from 'lucide-react';
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

  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const eventCategory = getEventTypeCategory(eventType);
  const maxMembers = eventCategory === 'doubles' ? 1 : eventCategory === 'team' ? 4 : 1; // Doubles needs 1 partner (2 total), team needs up to 5 members

  // Filter participants for the same event
  const eventParticipants = participants.filter(p => 
    p.participationType === eventType && p.id !== user?.id
  );

  const filteredParticipants = eventParticipants.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!teamName.trim() && eventCategory === 'team') {
        throw new Error('Багийн нэр оруулна уу');
      }
      
      if (selectedMembers.length === 0) {
        throw new Error(eventCategory === 'doubles' ? 'Хамтрагч сонгоно уу' : 'Багийн гишүүд сонгоно уу');
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
    onSuccess: () => {
      toast({
        title: 'Амжилттай!',
        description: eventCategory === 'doubles' ? 'Хос амжилттай бүрдлээ' : 'Баг амжилттай бүрдлээ',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', params?.id] });
      setLocation(`/tournament/${params?.id}/full`);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              {eventCategory === 'doubles' ? 'Хос бүрдүүлэх' : 'Баг бүрдүүлэх'}
            </CardTitle>
            <CardDescription>
              {tournament?.name} - {getEventLabel(eventType)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Team Name (only for team events) */}
            {eventCategory === 'team' && (
              <div className="space-y-2">
                <Label htmlFor="teamName">Багийн нэр *</Label>
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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                {eventCategory === 'doubles' ? 'Та болон таны хамтрагч' : 'Багийн бүрэлдэхүүн'}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <Badge variant="outline">Би</Badge>
                </div>
                {selectedMembers.map(memberId => {
                  const member = participants.find(p => p.id === memberId);
                  return member ? (
                    <div key={memberId} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{member.firstName} {member.lastName}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                {eventCategory === 'doubles' 
                  ? `${selectedMembers.length}/1 хамтрагч сонгогдсон`
                  : `${selectedMembers.length + 1}/${maxMembers + 1} гишүүн`
                }
              </p>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">
                {eventCategory === 'doubles' ? 'Хамтрагч хайх' : 'Багийн гишүүд хайх'}
              </Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Нэрээр хайх..."
                className="max-w-md"
              />
            </div>

            {/* Available Participants */}
            <div className="space-y-3">
              <h4 className="font-medium">
                Бүртгүүлсэн тамирчид ({filteredParticipants.length})
              </h4>
              
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Энэ төрөлд бүртгүүлсэн тамирчид олдсонгүй</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredParticipants.map(participant => (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMembers.includes(participant.id)
                          ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                          {participant.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => createTeamMutation.mutate()}
                disabled={
                  createTeamMutation.isPending ||
                  selectedMembers.length === 0 ||
                  (eventCategory === 'team' && !teamName.trim())
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createTeamMutation.isPending
                  ? 'Үүсгэж байна...'
                  : eventCategory === 'doubles'
                    ? 'Хос бүрдүүлэх'
                    : 'Баг үүсгэх'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
