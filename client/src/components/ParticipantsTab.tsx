
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Users } from 'lucide-react';
import { formatName } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'Бүгд' },
  { value: 'singles', label: 'Дан' },
  { value: 'doubles', label: 'Хос' },
  { value: 'mixed_doubles', label: 'Холимог хос' },
  { value: 'singles_men', label: 'Эрэгтэй дан' },
  { value: 'singles_women', label: 'Эмэгтэй дан' },
  { value: 'doubles_men', label: 'Эрэгтэй хос' },
  { value: 'doubles_women', label: 'Эмэгтэй хос' },
];

interface ParticipantsTabProps {
  tournamentId: string;
}

export function ParticipantsTab({ tournamentId }: ParticipantsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "participants", { category: selectedCategory }],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await res.json();
      
      // Filter by category if selected
      if (selectedCategory && selectedCategory !== 'all') {
        return data.filter((p: any) => p.participationType === selectedCategory);
      }
      
      return data;
    },
    enabled: !!tournamentId,
  });

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (birthDate: string | Date) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Skeleton key={cat.value} className="h-8 w-20" />
          ))}
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Оролцогчид ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Одоогоор оролцогч байхгүй байна</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant: any) => (
                <div
                  key={`${participant.playerId}-${participant.participationType}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(participant.playerName || participant.fullName || formatName(participant.firstName || '', participant.lastName || '') || 'N/A')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {participant.playerName || participant.fullName || formatName(participant.firstName || '', participant.lastName || '') || 'Тодорхойгүй'}
                      </span>
                      {participant.gender && (
                        <span className="text-xs text-muted-foreground">
                          {participant.gender === 'male' ? '♂' : participant.gender === 'female' ? '♀' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {(participant.birthDate || participant.dateOfBirth) && (
                        <span>{calculateAge(participant.birthDate || participant.dateOfBirth)} нас</span>
                      )}
                      {participant.clubAffiliation && (
                        <span>• {participant.clubAffiliation}</span>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline">
                    {getCategoryLabel(participant.participationType)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
