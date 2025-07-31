import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, MapPin, Settings } from "lucide-react";

interface TournamentBracketProps {
  tournamentId: string;
}

export default function TournamentBracket({ tournamentId }: TournamentBracketProps) {
  // Fetch tournament details and matches
  const { data: tournament, isLoading } = useQuery({
    queryKey: ["/api/tournaments", tournamentId],
    enabled: !!tournamentId,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-2"></div>
            <p className="text-gray-600">Тэмцээний мэдээлэл уншиж байна...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Тэмцээний мэдээлэл олдсонгүй</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const matches = tournament.matches || [];

  // Group matches by round
  const matchesByRound = matches.reduce((acc: any, match: any) => {
    const round = match.round || 'quarter';
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const rounds = ['quarter', 'semi', 'final'];
  const roundLabels = {
    quarter: '8-р шат',
    semi: '4-р шат', 
    final: 'Финал'
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
          {tournament.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tournament Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-mtta-green" />
              <span>{new Date(tournament.startDate).toLocaleDateString('mn-MN')} - {new Date(tournament.endDate).toLocaleDateString('mn-MN')}</span>
            </div>
            {tournament.location && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-mtta-green" />
                <span>{tournament.location}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-mtta-green" />
              <span>{tournament.maxParticipants} хүртэлх оролцогч</span>
            </div>
          </div>

          {/* Tournament Status */}
          <div className="flex justify-between items-center">
            <Badge 
              variant={tournament.status === 'ongoing' ? 'default' : tournament.status === 'completed' ? 'secondary' : 'outline'}
              className={tournament.status === 'ongoing' ? 'mtta-green text-white' : ''}
            >
              {tournament.status === 'registration' ? 'Бүртгэл' : 
               tournament.status === 'ongoing' ? 'Идэвхтэй' : 'Дууссан'}
            </Badge>
          </div>

          {/* Tournament Bracket */}
          {matches.length > 0 ? (
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-900">Тэмцээний схем</h4>
              
              {rounds.map((round) => (
                matchesByRound[round] && (
                  <div key={round} className="space-y-3">
                    <h5 className="font-medium text-gray-700 text-center">
                      {roundLabels[round as keyof typeof roundLabels]}
                    </h5>
                    
                    <div className="space-y-2">
                      {matchesByRound[round].map((match: any) => (
                        <div 
                          key={match.id} 
                          className={`border rounded-lg p-3 ${
                            match.status === 'completed' 
                              ? 'border-mtta-green bg-green-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className={`flex justify-between items-center p-2 rounded text-sm ${
                              match.winnerId === match.player1Id ? 'bg-green-100 font-medium' : 'bg-gray-50'
                            }`}>
                              <span>{match.player1?.user?.firstName} {match.player1?.user?.lastName}</span>
                              <span className={match.winnerId === match.player1Id ? 'text-mtta-green font-bold' : 'text-gray-500'}>
                                {match.status === 'completed' ? '3' : '-'}
                              </span>
                            </div>
                            <div className={`flex justify-between items-center p-2 rounded text-sm ${
                              match.winnerId === match.player2Id ? 'bg-green-100 font-medium' : 'bg-gray-50'
                            }`}>
                              <span>{match.player2?.user?.firstName} {match.player2?.user?.lastName}</span>
                              <span className={match.winnerId === match.player2Id ? 'text-mtta-green font-bold' : 'text-gray-500'}>
                                {match.status === 'completed' ? '1' : '-'}
                              </span>
                            </div>
                          </div>
                          {match.scheduledAt && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              {new Date(match.scheduledAt).toLocaleDateString('mn-MN')} {new Date(match.scheduledAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {/* Winner */}
              {tournament.status === 'completed' && (
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-lg p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold text-lg">TBD</div>
                  <p className="text-sm opacity-80">Аварга</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">Тоглолт хараахан эхлээгүй байна</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Button 
              size="sm" 
              className="w-full mtta-green text-white hover:bg-mtta-green-dark"
            >
              Дэлгэрэнгүй үзэх
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Удирдах
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
