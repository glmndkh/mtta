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
import { User, Trophy, Calendar, CreditCard, BarChart3, Target, TrendingUp } from "lucide-react";
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

  // Fetch membership info
  const { data: membership } = useQuery({
    queryKey: ["/api/players", playerData?.player?.id, "membership"],
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <CardContent className="p-6 text-[#000000]">
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
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="opacity-80">Рэнкинг:</span>
                    <p className="font-bold text-lg">#{player?.ranking || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="opacity-80">Клуб:</span>
                    <p className="font-bold text-lg">{player?.club?.name || 'Байхгүй'}</p>
                  </div>
                  <div>
                    <span className="opacity-80">Гишүүнчлэл:</span>
                    <p className="font-bold text-lg text-green-200">
                      {membership?.paid ? 'Идэвхтэй' : 'Төлөгдөөгүй'}
                    </p>
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

            {/* Recent Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Сүүлийн Тоглолтууд
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-2"></div>
                    <p className="text-gray-600">Тоглолтын түүх уншиж байна...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Одоогоор тоглолтын түүх байхгүй байна</p>
                    <Button className="mt-4 mtta-green text-white hover:bg-mtta-green-dark">
                      Тэмцээнд бүртгүүлэх
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.slice(0, 5).map((match: any) => {
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
                                  className={isWinner ? "mtta-green text-white" : ""}
                                >
                                  {isWinner ? 'Ялагдсан' : 'Хожигдсон'}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {match.sets?.length || 0} сет
                                </p>
                              </>
                            ) : (
                              <Badge variant="outline">
                                {match.status === 'scheduled' ? 'Товлогдсон' : 'Явагдаж байгаа'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Tournaments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-mtta-green" />
                  Идэвхтэй Тэмцээнүүд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">Өвлийн Аварга Шалгаруулалт</h4>
                      <Badge className="mtta-green text-white">Идэвхтэй</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Эрэгтэй дан бие • 16-р шаталт</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Огноо: 2024.01.20-25</p>
                      <p>Байршил: МУИС</p>
                      <p>Оролцогчид: 32 тоглогч</p>
                    </div>
                    <Button size="sm" className="w-full mt-3 mtta-green text-white hover:bg-mtta-green-dark">
                      Дэлгэрэнгүй үзэх
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">Клубын Лига 2024</h4>
                      <Badge variant="secondary">Бүлгийн шат</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Эмэгтэй дан бие • Групп А</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Дараагийн тоглолт: 2024.01.18</p>
                      <p>Харъяа клуб: УБ Спорт</p>
                      <p>Оноо: 2/3 тоглолт</p>
                    </div>
                    <Button size="sm" className="w-full mt-3 mtta-green text-white hover:bg-mtta-green-dark">
                      Дэлгэрэнгүй үзэх
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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

                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">Дараагийн төлбөр:</span>
                        <span className="text-gray-600">2025.01.01</span>
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
