import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Trophy, Medal, Calendar, Award } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Сайн байна уу, {user.firstName} {user.lastName}!
          </h1>
          <p className="text-gray-600">
            MTTA системд тавтай морилно уу. Таны эрх: {
              user.role === 'player' ? 'Тоглогч' :
              user.role === 'club_owner' ? 'Клубын эзэн' :
              user.role === 'admin' ? 'Админ' :
              user.role === 'score_recorder' ? 'Оноо бүртгэгч' : 'Хэрэглэгч'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mtta-green text-white w-12 h-12 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">1,250+</p>
                  <p className="text-gray-600">Тоглогчид</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mtta-green text-white w-12 h-12 rounded-full flex items-center justify-center">
                  <Building className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">45+</p>
                  <p className="text-gray-600">Клубууд</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mtta-green text-white w-12 h-12 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">120+</p>
                  <p className="text-gray-600">Тэмцээнүүд</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mtta-green text-white w-12 h-12 rounded-full flex items-center justify-center">
                  <Medal className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-gray-600">Лигүүд</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Tournaments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Идэвхтэй Тэмцээнүүд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-900">Өвлийн Аварга Шалгаруулалт</h4>
                      <Badge className="mtta-green text-white">Идэвхтэй</Badge>
                    </div>
                    <p className="text-gray-600 mb-3">Эрэгтэй дан бие • 16-р шаталт</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Огноо:</span>
                        <p className="font-medium">2024.01.20-25</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Байршил:</span>
                        <p className="font-medium">МУИС</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Оролцогчид:</span>
                        <p className="font-medium">32 тоглогч</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 mtta-green text-white hover:bg-mtta-green-dark">
                      Дэлгэрэнгүй үзэх
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-900">Клубын Лига 2024</h4>
                      <Badge variant="secondary">Бүлгийн шат</Badge>
                    </div>
                    <p className="text-gray-600 mb-3">Эмэгтэй дан бие • Групп А</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Дараагийн тоглолт:</span>
                        <p className="font-medium">2024.01.18</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Статус:</span>
                        <p className="font-medium">Бэлэн</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Оноо:</span>
                        <p className="font-medium">2/3 тоглолт</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 mtta-green text-white hover:bg-mtta-green-dark">
                      Дэлгэрэнгүй үзэх
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions based on user role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-mtta-green" />
                  Хурдан үйлдлүүд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {user.role === 'player' && (
                    <>
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        Тэмцээнд бүртгүүлэх
                      </Button>
                      <Button variant="outline" size="lg">
                        Миний статистик
                      </Button>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        Тэмцээн үүсгэх
                      </Button>
                      <Button variant="outline" size="lg">
                        Оноо бүртгэх
                      </Button>
                    </>
                  )}
                  {user.role === 'club_owner' && (
                    <>
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        Клуб удирдах
                      </Button>
                      <Button variant="outline" size="lg">
                        Тоглогч нэмэх
                      </Button>
                    </>
                  )}
                  {user.role === 'score_recorder' && (
                    <>
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        Оноо бүртгэх
                      </Button>
                      <Button variant="outline" size="lg">
                        Тоглолтын жагсаалт
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent News */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-mtta-green" />
                  Сүүлийн мэдээ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-mtta-green pl-4">
                    <div className="flex items-center mb-2">
                      <Badge className="mtta-green text-white mr-2">Онцлох</Badge>
                      <span className="text-gray-500 text-sm">2024.01.15</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Өвлийн Аварга Шалгаруулалт</h4>
                    <p className="text-gray-600 text-sm">МУИС-ийн спортын өргөөнд амжилттай зохион байгуулагдлаа</p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center mb-2">
                      <Badge variant="secondary" className="mr-2">Тэмцээн</Badge>
                      <span className="text-gray-500 text-sm">2024.01.12</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Хаврын лигийн бүртгэл</h4>
                    <p className="text-gray-600 text-sm">2024 оны хаврын лигт оролцох багуудын бүртгэл эхэллээ</p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="flex items-center mb-2">
                      <Badge variant="outline" className="mr-2">Мэдээлэл</Badge>
                      <span className="text-gray-500 text-sm">2024.01.10</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Гишүүнчлэлийн хөнгөлөлт</h4>
                    <p className="text-gray-600 text-sm">12 хүртэлх хүүхдүүдэд 20% хөнгөлөлт үзүүлнэ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Миний профайл</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-mtta-green text-white flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
                  <p className="text-gray-600 capitalize">{
                    user.role === 'player' ? 'Тоглогч' :
                    user.role === 'club_owner' ? 'Клубын эзэн' :
                    user.role === 'admin' ? 'Админ' :
                    user.role === 'score_recorder' ? 'Оноо бүртгэгч' : 'Хэрэглэгч'
                  }</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Дэлгэрэнгүй профайл
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
