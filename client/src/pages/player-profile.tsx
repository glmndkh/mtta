import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Trophy, Calendar, MapPin, Phone, Mail } from "lucide-react";
import Navigation from "@/components/navigation";

export default function PlayerProfilePage() {
  const [match, params] = useRoute("/player/:id");
  const [, setLocation] = useLocation();

  // Fetch player data
  const { data: playerData, isLoading } = useQuery({
    queryKey: ["/api/players", params?.id],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch player matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/players", params?.id, "matches"],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch tournament match history
  const { data: tournamentMatches = [], isLoading: tournamentMatchesLoading } = useQuery({
    queryKey: ["/api/players", params?.id, "tournament-matches"],
    enabled: !!params?.id,
    retry: false,
  });

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/players", params?.id, "achievements"],
    enabled: !!params?.id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Тоглогчийн мэдээлэл уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Тоглогч олдсонгүй</h1>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Буцах
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const player = playerData.player;
  const user = playerData.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Буцах
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Тоглогчийн Профайл</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-mtta-green to-mtta-green-dark text-white">
              <CardContent className="p-6 text-[#000000]">
                <div className="text-center mb-6">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Player profile" 
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="opacity-80">Тоглогч</p>
                  {player?.memberNumber && (
                    <p className="text-sm opacity-70 mt-1">Гишүүн №: {player.memberNumber}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  {user.clubAffiliation && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{user.clubAffiliation}</span>
                    </div>
                  )}
                </div>

                {player?.rank && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="bg-white/20 text-black">
                      Зэрэг: {player.rank}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <span className="opacity-80 text-sm">Ялалт:</span>
                    <p className="font-bold text-lg">{player?.wins || 0}</p>
                  </div>
                  <div>
                    <span className="opacity-80 text-sm">Хожил:</span>
                    <p className="font-bold text-lg">{player?.losses || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match History */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Тоглолтын Түүх
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(matchesLoading || tournamentMatchesLoading) ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-2"></div>
                    <p className="text-gray-600">Тоглолтын түүх уншиж байна...</p>
                  </div>
                ) : matches.length === 0 && tournamentMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор тоглолтын түүх байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Tournament Match History */}
                    {tournamentMatches.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-mtta-green" />
                          Тэмцээний тоглолтууд
                        </h4>
                        <div className="space-y-3">
                          {tournamentMatches.map((match: any, index: number) => {
                            const isWinner = match.isWinner;
                            const hasResult = match.result && match.result.trim() !== '';
                            
                            return (
                              <div 
                                key={`tournament-${index}`}
                                className={`p-3 rounded-lg border ${
                                  hasResult
                                    ? isWinner === true
                                      ? 'bg-green-50 border-green-200'
                                      : isWinner === false
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-1">
                                      {match.tournament?.name || 'Тэмцээн'}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                      {match.stage}
                                      {match.groupName && ` - ${match.groupName}`}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-700">
                                      <span className="font-medium">vs</span>
                                      <span className="ml-2">
                                        {match.opponent?.name || 
                                         (match.opponent?.user ? `${match.opponent.user.firstName} ${match.opponent.user.lastName}` : 
                                          'Харсагч олдсонгүй')}
                                      </span>
                                    </div>
                                    {match.date && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(match.date).toLocaleDateString('mn-MN')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    {hasResult ? (
                                      <>
                                        {isWinner !== undefined ? (
                                          <Badge 
                                            variant={isWinner ? "default" : "destructive"}
                                            className="mb-1"
                                          >
                                            {isWinner ? 'Ялалт' : 'Хожил'}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="mb-1">
                                            Тэнцсэн
                                          </Badge>
                                        )}
                                        <p className="text-xs text-gray-600">
                                          {match.result}
                                        </p>
                                        {match.playerWins && (
                                          <p className="text-xs text-gray-500">
                                            Групп: {match.playerWins} | Байр: {match.playerPosition}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <Badge variant="outline">
                                        Хүлээгдэж буй
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Regular Match History */}
                    {matches.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-mtta-green" />
                          Ердийн тоглолтууд
                        </h4>
                        <div className="space-y-3">
                          {matches.map((match: any) => {
                            const isPlayer1 = match.player1Id === params?.id;
                            const isWinner = match.winnerId === params?.id;
                            const opponent = isPlayer1 ? match.player2 : match.player1;
                            
                            return (
                              <div 
                                key={match.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  match.status === 'completed'
                                    ? isWinner 
                                      ? 'bg-green-50 border border-green-200'
                                      : 'bg-red-50 border border-red-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    vs {opponent?.user?.firstName} {opponent?.user?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {match.scheduledAt 
                                      ? new Date(match.scheduledAt).toLocaleDateString('mn-MN')
                                      : 'Огноо тодорхойгүй'
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  {match.status === 'completed' ? (
                                    <>
                                      <Badge 
                                        variant={isWinner ? "default" : "destructive"}
                                        className="mb-1"
                                      >
                                        {isWinner ? 'Ялалт' : 'Хожил'}
                                      </Badge>
                                      <p className="text-xs text-gray-500">
                                        {match.sets?.map((set: any) => `${set.player1Score}-${set.player2Score}`).join(', ')}
                                      </p>
                                    </>
                                  ) : (
                                    <Badge variant="outline">
                                      {match.status === 'scheduled' ? 'Товлогдсон' : 'Хүлээгдэж буй'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            {achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                    Амжилтууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.map((achievement: any) => (
                      <div 
                        key={achievement.id}
                        className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center mr-3">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.achievedAt 
                              ? new Date(achievement.achievedAt).toLocaleDateString('mn-MN')
                              : 'Огноо тодорхойгүй'
                            }
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {achievement.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}