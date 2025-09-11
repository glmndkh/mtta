import { useRoute, useLocation, useRouter } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Trophy, Calendar, MapPin, Phone, Mail } from "lucide-react";
import Navigation from "@/components/navigation";
import { formatName } from "@/lib/utils";

export default function PlayerProfilePage() {
  const [match, params] = useRoute("/player/:id");
  const [, setLocation] = useLocation();
  const { navigate } = useRouter();

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

  // The API now returns a flattened object with both player and user data
  const player = playerData;
  const user = playerData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
            <CardContent className="p-6 text-text-primary">
                <div className="text-center mb-6">
                  {user?.profileImageUrl ? (
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
                  <h2 className="text-2xl font-bold">{formatName(user?.firstName, user?.lastName)}</h2>
                  <p className="opacity-80">Тоглогч</p>
                  {player?.memberNumber && (
                    <p className="text-sm opacity-70 mt-1">Гишүүн №: {player.memberNumber}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  {user?.clubAffiliation && (
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
                    <span className="opacity-80 text-sm">Хожигдол:</span>
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
                  Тэмцээний түүх
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
                            const opponentName = match.opponent?.name ||
                                                (match.opponent?.user ? formatName(match.opponent.user.firstName, match.opponent.user.lastName) :
                                                 'Харсагч олдсонгүй');
                            
                            // Parse score from result (assuming format like "3-1" or "2:3")
                            let playerScore = '';
                            let opponentScore = '';
                            if (hasResult && match.result) {
                              const scoreMatch = match.result.match(/(\d+)[-:](\d+)/);
                              if (scoreMatch) {
                                playerScore = isWinner ? Math.max(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString() : 
                                             Math.min(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                                opponentScore = isWinner ? Math.min(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString() : 
                                               Math.max(parseInt(scoreMatch[1]), parseInt(scoreMatch[2])).toString();
                              }
                            }
                            
                            return (
                              <div 
                                key={`tournament-${index}`}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                  hasResult
                                    ? isWinner === true
                                      ? 'border-2 border-green-500'
                                      : isWinner === false
                                      ? 'border-2 border-red-500'
                                      : 'border border-gray-200'
                                    : 'border border-gray-200'
                                }`}
                              >
                                <div className="flex">
                                  {/* Red accent line */}
                                  <div className="w-1 bg-red-500 rounded-l-lg flex-shrink-0"></div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 p-4">
                                    {/* Date and tournament info */}
                                    <div className="text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">
                                          {match.tournament?.name || 'Тэмцээн'}
                                        </span>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {match.stage || 'Хэсгийн тоглолт'}
                                        </span>
                                      </div>
                                      {match.date && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(match.date).toLocaleDateString('mn-MN')}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Match result */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 text-right pr-4">
                                        <button
                                          onClick={() => navigate(`/player-profile/${params?.id}`)}
                                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        >
                                          {formatName(player?.firstName, player?.lastName)}
                                        </button>
                                      </div>
                                      
                                      {hasResult && playerScore && opponentScore ? (
                                        <div className="text-xl font-bold text-gray-900 px-4">
                                          {playerScore} : {opponentScore}
                                        </div>
                                      ) : (
                                        <div className="text-gray-400 px-4">
                                          - : -
                                        </div>
                                      )}
                                      
                                      <div className="flex-1 text-left pl-4">
                                        {match.opponent?.user ? (
                                          <button
                                            onClick={() => navigate(`/player-profile/${match.opponent.userId || match.opponent.user?.id}`)}
                                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                          >
                                            {opponentName}
                                          </button>
                                        ) : (
                                          <span className="text-lg font-semibold text-gray-900">
                                            {opponentName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
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
                            const opponentName = opponent?.user ? formatName(opponent.user.firstName, opponent.user.lastName) : 'Харсагч олдсонгүй';
                            
                            // Calculate total score from sets
                            let playerTotalScore = 0;
                            let opponentTotalScore = 0;
                            
                            if (match.sets && match.sets.length > 0) {
                              match.sets.forEach((set: any) => {
                                const playerSetScore = isPlayer1 ? set.player1Score : set.player2Score;
                                const opponentSetScore = isPlayer1 ? set.player2Score : set.player1Score;
                                
                                if (playerSetScore > opponentSetScore) {
                                  playerTotalScore++;
                                } else if (opponentSetScore > playerSetScore) {
                                  opponentTotalScore++;
                                }
                              });
                            }
                            
                            return (
                              <div 
                                key={match.id}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                  match.status === 'completed'
                                    ? isWinner 
                                      ? 'border-2 border-green-500'
                                      : 'border-2 border-red-500'
                                    : 'border border-gray-200'
                                }`}
                              >
                                <div className="flex">
                                  {/* Red accent line */}
                                  <div className="w-1 bg-red-500 rounded-l-lg flex-shrink-0"></div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 p-4">
                                    {/* Date and match info */}
                                    <div className="text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">
                                          Ердийн тоглолт
                                        </span>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {match.status === 'scheduled' ? 'Товлогдсон' : match.status === 'completed' ? 'Дууссан' : 'Хүлээгдэж буй'}
                                        </span>
                                      </div>
                                      {match.scheduledAt && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(match.scheduledAt).toLocaleDateString('mn-MN')}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Match result */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 text-right pr-4">
                                        <button
                                          onClick={() => navigate(`/player-profile/${params?.id}`)}
                                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        >
                                          {formatName(player?.firstName, player?.lastName)}
                                        </button>
                                      </div>
                                      
                                      {match.status === 'completed' && (playerTotalScore > 0 || opponentTotalScore > 0) ? (
                                        <div className="text-xl font-bold text-gray-900 px-4">
                                          {playerTotalScore} : {opponentTotalScore}
                                        </div>
                                      ) : (
                                        <div className="text-gray-400 px-4">
                                          - : -
                                        </div>
                                      )}
                                      
                                      <div className="flex-1 text-left pl-4">
                                        {opponent?.user ? (
                                          <button
                                            onClick={() => navigate(`/player-profile/${opponent.userId || opponent.user?.id}`)}
                                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                          >
                                            {opponentName}
                                          </button>
                                        ) : (
                                          <span className="text-lg font-semibold text-gray-900">
                                            {opponentName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
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