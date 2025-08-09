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

// Type definitions for API responses
interface SliderItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  active: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  publishedAt: string;
  authorId: string;
}



export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Fetch active sliders
  const { data: sliders = [], isLoading: slidersLoading } = useQuery<SliderItem[]>({
    queryKey: ['/api/sliders'],
    enabled: true,
  });

  // Fetch latest news for ticker
  const { data: latestNews = [], isLoading: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ['/api/news/latest'],
    enabled: true,
  });

  // Fetch active sponsors
  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery<any[]>({
    queryKey: ['/api/sponsors'],
    enabled: true,
  });

  // State for current slider index
  const [currentSlider, setCurrentSlider] = useState(0);
  
  // State for current news set index (for showing 3 at a time)
  const [currentNewsSet, setCurrentNewsSet] = useState(0);

  // Auto-rotate sliders every 3 seconds
  useEffect(() => {
    if (!sliders || sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlider((prev) => (prev + 1) % sliders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [sliders]);

  // Auto-rotate news sets every 3 seconds
  useEffect(() => {
    if (!latestNews || latestNews.length <= 4) return;

    const totalSets = Math.ceil(latestNews.length / 4);
    const interval = setInterval(() => {
      setCurrentNewsSet((prev) => (prev + 1) % totalSets);
    }, 3000);

    return () => clearInterval(interval);
  }, [latestNews]);

  // Static placeholder SVG to avoid API calls and improve performance
  const placeholderImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

  // Helper function to get image URL from object storage or external URL
  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return placeholderImageData;
    
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
                {sliders.map((_, index: number) => (
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
      
      {/* Top Stories Section */}
      {!newsLoading && latestNews && latestNews.length > 0 && (
        <div className="w-full bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">СҮҮЛИЙН ҮЕИЙН МЭДЭЭ</h2>
              <button 
                onClick={() => window.location.href = '/news'}
                className="text-mtta-green hover:text-green-700 font-medium text-sm flex items-center"
              >
                Бүгдийг харах
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                const startIndex = currentNewsSet * 4;
                const currentSet = latestNews.slice(startIndex, startIndex + 4);
                
                // Ensure we always show 4 items by cycling back to beginning if needed
                while (currentSet.length < 4 && latestNews.length > 0) {
                  const remainingNeeded = 4 - currentSet.length;
                  const additionalItems = latestNews.slice(0, remainingNeeded);
                  currentSet.push(...additionalItems);
                }
                
                return currentSet.map((news: NewsItem, index: number) => (
                  <div 
                    key={`${news.id}-${currentNewsSet}-${index}`}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow animate-fade-in cursor-pointer"
                    onClick={() => window.location.href = `/news/${news.id}`}
                  >
                    {/* News Image */}
                    <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
                      {news.imageUrl ? (
                        <img 
                          src={getImageUrl(news.imageUrl)} 
                          alt={news.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                          <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-mtta-green text-white text-xs font-medium px-2 py-1 rounded">
                          ШУУДАН
                        </span>
                      </div>
                    </div>

                    {/* News Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-3 mb-2 hover:text-mtta-green transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                        {news.summary || news.content?.substring(0, 100) + '...'}
                      </p>
                    </div>
                  </div>
                ));
              })()}
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

        {/* Sponsors Section - Right under news */}
        {!sponsorsLoading && sponsors && sponsors.length > 0 && (
          <div className="bg-gray-50 py-8 mt-8">
            <div className="container mx-auto px-4">
              <div className="relative overflow-hidden">
                <div className="flex gap-8 animate-scroll-horizontal">
                  {/* Duplicate sponsors to create seamless loop */}
                  {[...sponsors, ...sponsors].map((sponsor, index) => (
                    <div
                      key={`${sponsor.id}-${index}`}
                      className="flex-shrink-0 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-center h-16 w-32">
                        {sponsor.logoUrl ? (
                          <img
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-center">
                            <span className="font-medium">{sponsor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}