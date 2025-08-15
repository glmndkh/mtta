import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { User, Trophy, Calendar, CreditCard, BarChart3, Target, TrendingUp, Award, Star } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function PlayerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Энэ хуудсыг үзэхийн тулд нэвтэрнэ үү...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch player data
  const { data: playerData, isLoading: playerLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch player matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/players", playerData?.player?.id, "matches"],
    enabled: !!playerData?.player?.id,
    retry: false,
    meta: {
      onError: (error: Error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Нэвтрэх шаардлагатай",
            description: "Та дахин нэвтэрнэ үү...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        toast({
          title: "Алдаа",
          description: "Тоглолтын түүх авахад алдаа гарлаа",
          variant: "destructive",
        });
      },
    },
  });

  // Fetch tournament match history
  const { data: tournamentMatches = [], isLoading: tournamentMatchesLoading } = useQuery({
    queryKey: ["/api/players", playerData?.player?.id, "tournament-matches"],
    enabled: !!playerData?.player?.id,
    retry: false,
  });

  // Fetch membership info
  const { data: membership } = useQuery({
    queryKey: ["/api/players", playerData?.player?.id, "membership"],
    enabled: !!playerData?.player?.id,
    retry: false,
  });

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/players", playerData?.player?.id, "achievements"],
    enabled: !!playerData?.player?.id,
    retry: false,
  });

  if (isLoading || playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const player = playerData?.player;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Тоглогчийн Хяналтын Самбар</h1>
          <p className="text-gray-600">Өөрийн түүх, статистик, тэмцээнүүдийг хянах</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Profile Card */}
            <Card className="bg-gradient-to-br from-mtta-green to-mtta-green-dark text-white">
            <CardContent className="p-6 text-text-primary">
                <div className="flex items-center mb-4">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Player profile" 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
                    <p className="opacity-80">Тоглогч</p>
                    {player?.memberNumber && (
                      <p className="text-sm opacity-70">Гишүүн №: {player.memberNumber}</p>
                    )}
                    {player?.rank && (
                      <Badge variant="secondary" className="mt-1 bg-white/20 text-black">
                        Зэрэг: {player.rank}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <span className="opacity-80 text-sm">Зэрэглэл:</span>
                    <p className="font-bold text-lg">{player?.rank || 'Томилогдоогүй'}</p>
                  </div>
                  <div>
                    <span className="opacity-80 text-sm">Бүх насны:</span>
                    <p className="font-bold text-lg">#{player?.rankingAllAges || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="opacity-80 text-sm">Өөрийн насны:</span>
                    <p className="font-bold text-lg">#{player?.rankingOwnAge || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="opacity-80 text-sm">Клуб:</span>
                    <p className="font-bold text-lg">{player?.club?.name || 'Байхгүй'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-mtta-green" />
                  Тоглолтын Статистик
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {(player?.wins || 0) + (player?.losses || 0)}
                    </div>
                    <p className="text-gray-600">Нийт тоглолт</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-mtta-green mb-1">
                      {player?.wins || 0}
                    </div>
                    <p className="text-gray-600">Хожсон</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500 mb-1">
                      {player?.losses || 0}
                    </div>
                    <p className="text-gray-600">Хожигдсон</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-mtta-green mb-1">
                      {player?.winPercentage ? Math.round(player.winPercentage / 100) : 0}%
                    </div>
                    <p className="text-gray-600">Хожлын хувь</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Win Rate Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Хожлын хувь</span>
                    <span className="text-mtta-green font-bold">
                      {player?.winPercentage ? Math.round(player.winPercentage / 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={player?.winPercentage ? player.winPercentage / 100 : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-mtta-green" />
                  Амжилтууд
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-2"></div>
                    <p className="text-gray-600">Амжилтууд уншиж байна...</p>
                  </div>
                ) : achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор амжилт байхгүй байна</p>
                    <p className="text-sm text-gray-500 mt-2">Тэмцээнд оролцож амжилт олоорой!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {achievements.slice(0, 6).map((achievement: any) => (
                      <div 
                        key={achievement.id}
                        className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center mr-3">
                          <Star className="h-5 w-5 text-white" />
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
                )}
              </CardContent>
            </Card>

            {/* Match History */}
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
                    <Button className="mt-4 mtta-green text-white hover:bg-mtta-green-dark">
                      Тэмцээнд бүртгүүлэх
                    </Button>
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
                          {tournamentMatches.slice(0, 3).map((match: any, index: number) => {
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
                          <Target className="h-4 w-4 mr-2 text-mtta-green" />
                          Ердийн тоглолтууд
                        </h4>
                        <div className="space-y-3">
                          {matches.slice(0, 3).map((match: any) => {
                            const isPlayer1 = match.player1Id === player?.id;
                            const isWinner = match.winnerId === player?.id;
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
                    
                    {(matches.length > 3 || tournamentMatches.length > 3) && (
                      <div className="text-center pt-3">
                        <Button variant="outline" size="sm">
                          Бүх тоглолт харах ({matches.length + tournamentMatches.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-mtta-green" />
                  Гишүүнчлэлийн Мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membership ? (
                  <>
                    <div className="bg-gradient-to-r from-mtta-green to-mtta-green-dark text-white rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold">
                            {membership.type === 'adult' ? 'Насанд хүрэгч' : '12 хүртэлх хүүхэд'}
                          </h4>
                          <p className="opacity-80 text-sm">2024 оны гишүүнчлэл</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            ₮{membership.amount?.toLocaleString()}
                          </p>
                          <p className="text-sm opacity-80">жилийн</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="opacity-80">Эхэлсэн огноо:</p>
                          <p>{membership.startDate ? new Date(membership.startDate).toLocaleDateString('mn-MN') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="opacity-80">Дуусах огноо:</p>
                          <p>{membership.endDate ? new Date(membership.endDate).toLocaleDateString('mn-MN') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        membership.paid ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <span className="font-medium text-gray-900">Төлбөрийн төлөв:</span>
                        <Badge 
                          variant={membership.paid ? "default" : "destructive"}
                          className={membership.paid ? "mtta-green text-white" : ""}
                        >
                          {membership.paid ? 'Төлсөн' : 'Төлөгдөөгүй'}
                        </Badge>
                      </div>
                      
                      {membership.paid && membership.paidAt && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">Төлсөн огноо:</span>
                          <span className="text-gray-600">
                            {new Date(membership.paidAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                      )}

                      {membership.paid && membership.paidAt && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-gray-900">Төлсөн огноо:</span>
                          <span className="text-green-600 font-medium">
                            {new Date(membership.paidAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">Хугацаа дуусах огноо:</span>
                        <span className="text-gray-600">
                          {membership.endDate ? new Date(membership.endDate).toLocaleDateString('mn-MN') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Гишүүнчлэлийн давуу тал:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Бүх тэмцээнд оролцох эрх</li>
                        <li>• Клубын дасгалжуулагчтай хамтран ажиллах</li>
                        <li>• Тоног төхөөрөмжийн хөнгөлөлт</li>
                        <li>• Онлайн статистик хэрэглэх</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Гишүүнчлэлийн мэдээлэл байхгүй</p>
                    <Button className="mtta-green text-white hover:bg-mtta-green-dark">
                      Гишүүнчлэл авах
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
