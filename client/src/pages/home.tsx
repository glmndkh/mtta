import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Trophy, Medal, Calendar, Award, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";



export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Fetch active sliders
  const { data: sliders, isLoading: slidersLoading } = useQuery({
    queryKey: ['/api/sliders'],
    enabled: true,
  });

  // Fetch latest news for ticker
  const { data: latestNews, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/news/latest'],
    enabled: true,
  });

  // State for current slider index
  const [currentSlider, setCurrentSlider] = useState(0);

  // Auto-rotate sliders every 3 seconds
  useEffect(() => {
    if (!sliders || sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlider((prev) => (prev + 1) % sliders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [sliders]);

  // Helper function to get image URL from object storage or external URL
  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    // If it's an object storage path (starts with /objects/), use it directly
    if (imageUrl.startsWith('/objects/')) {
      return imageUrl;
    }
    
    // If it's already a full URL, use it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, assume it's in public objects
    if (imageUrl.startsWith('/')) {
      return `/public-objects${imageUrl}`;
    }
    
    return `/public-objects/${imageUrl}`;
  };

  // Remove the redirect effect - let both authenticated and non-authenticated users see the same page

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

  // Show content for both authenticated and non-authenticated users

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Slider Section */}
      {!slidersLoading && sliders && sliders.length > 0 && (
        <div className="w-full">
          <div className="relative h-[600px] overflow-hidden bg-gradient-to-r from-mtta-green to-green-700">
            {sliders.map((slider: any, index: number) => (
              <div
                key={slider.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlider ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img 
                  src={getImageUrl(slider.imageUrl)} 
                  alt={slider.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', slider.imageUrl);
                    console.log('Processed URL:', getImageUrl(slider.imageUrl));
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white max-w-4xl px-6">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                      {slider.title}
                    </h1>
                    {slider.subtitle && (
                      <p className="text-xl md:text-2xl mb-6 opacity-90">
                        {slider.subtitle}
                      </p>
                    )}
                    {slider.description && (
                      <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
                        {slider.description}
                      </p>
                    )}
                    {slider.linkUrl && slider.buttonText && (
                      <a 
                        href={slider.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mtta-green text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 font-semibold"
                      >
                        {slider.buttonText}
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Slider Indicators */}
            {sliders.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {sliders.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlider(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlider 
                        ? 'bg-white scale-125' 
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* News Ticker Section */}
      {!newsLoading && latestNews && latestNews.length > 0 && (
        <div className="w-full bg-white border-b shadow-md overflow-hidden">
          <div className="relative h-60">
            <div className="absolute inset-0 flex items-center">
              <div 
                className="flex space-x-16 w-max py-6"
                style={{
                  animation: `scroll-stepwise ${Math.max(30, latestNews.length * 8)}s linear infinite`
                }}
              >
                {/* Duplicate the news items for seamless loop */}
                {[...latestNews, ...latestNews].map((news: any, index: number) => (
                  <div key={`${news.id}-${index}`} className="flex items-center space-x-6 min-w-max px-8 bg-gray-50 rounded-lg py-6 shadow-sm border h-40">
                    {/* News Image */}
                    {news.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-md">
                        <img 
                          src={getImageUrl(news.imageUrl)} 
                          alt={news.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder-news-image';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* News Content */}
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-base font-semibold text-gray-900 max-w-sm line-clamp-2 leading-snug">
                        {news.title}
                      </h3>
                      <button 
                        onClick={() => window.location.href = `/news/${news.id}`}
                        className="text-sm text-mtta-green hover:text-mtta-green-dark font-medium whitespace-nowrap self-start px-4 py-1 bg-mtta-green bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors"
                      >
                        Дэлгэрэнгүй унших →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          {isAuthenticated && user ? (
            <>
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
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                MTTA системд тавтай морилно уу!
              </h1>
              <p className="text-gray-600">
                Монголын Ширээний Теннисний Холбоо - Тоглогчид, тэмцээнүүд, үр дүнгүүд
              </p>
            </>
          )}
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

        {/* User-specific content based on authentication and role */}
        {isAuthenticated && user && user.role === 'admin' ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-xl">
                  <Trophy className="mr-3 h-6 w-6 text-mtta-green" />
                  Тэмцээн удирдах
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Link href="/admin/generator">
                    <Button 
                      className="w-full mtta-green text-white hover:bg-mtta-green-dark py-6 text-lg" 
                    >
                      <Trophy className="mr-3 h-5 w-5" />
                      Тэмцээн үүсгэх
                    </Button>
                  </Link>
                  <Link href="/admin/tournament-results">
                    <Button 
                      variant="outline" 
                      className="w-full border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white py-6 text-lg" 
                    >
                      <Award className="mr-3 h-5 w-5" />
                      Тэмцээний үр дүн оруулах
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content for Non-Admin Users */}
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

              {/* Player Actions */}
              {isAuthenticated && user && user.role === 'player' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Medal className="mr-2 h-5 w-5 text-mtta-green" />
                      Тоглогчийн үйлдлүүд
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/dashboard">
                        <Button 
                          className="mtta-green text-white hover:bg-mtta-green-dark" 
                          size="lg"
                        >
                          <Medal className="mr-2 h-4 w-4" />
                          Миний статистик
                        </Button>
                      </Link>
                      <Button variant="outline" size="lg">
                        <Trophy className="mr-2 h-4 w-4" />
                        Тэмцээнд бүртгүүлэх
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Club Owner Actions */}
              {isAuthenticated && user && user.role === 'club_owner' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5 text-mtta-green" />
                      Клубын эзний үйлдлүүд
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        <Building className="mr-2 h-4 w-4" />
                        Клуб удирдах
                      </Button>
                      <Button variant="outline" size="lg">
                        <Users className="mr-2 h-4 w-4" />
                        Тоглогч нэмэх
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Score Recorder Actions */}
              {isAuthenticated && user && user.role === 'score_recorder' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5 text-mtta-green" />
                      Оноо бүртгэгчийн үйлдлүүд
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="mtta-green text-white hover:bg-mtta-green-dark" size="lg">
                        <Award className="mr-2 h-4 w-4" />
                        Оноо бүртгэх
                      </Button>
                      <Button variant="outline" size="lg">
                        <Calendar className="mr-2 h-4 w-4" />
                        Тоглолтын жагсаалт
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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

              {/* User Profile Card - Only show for authenticated users */}
              {isAuthenticated && user && (
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
                      <Link href="/profile">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                        >
                          Дэлгэрэнгүй профайл
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guest Actions - Show for non-authenticated users */}
              {!isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle>Системд нэвтрэх</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <p className="text-gray-600">
                        Бүх боломжийг ашиглахын тулд нэвтэрнэ үү
                      </p>
                      <div className="space-y-2">
                        <Link href="/login">
                          <Button className="w-full mtta-green text-white hover:bg-mtta-green-dark">
                            Нэвтрэх
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button variant="outline" className="w-full border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white">
                            Бүртгүүлэх
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}