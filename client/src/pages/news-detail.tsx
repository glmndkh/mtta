import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Megaphone, Share2, Clock } from "lucide-react";
import { Link, useParams } from "wouter";

// Latest News Sidebar Component
function LatestNewsSidebar({ currentNewsId }: { currentNewsId: string | undefined }) {
  const { data: latestNews = [], isLoading: latestNewsLoading } = useQuery({
    queryKey: ["/api/news/latest"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Static placeholder SVG
  const placeholderImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return placeholderImageData;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('data:')) return imageUrl;
    
    if (imageUrl.startsWith('/objects/')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/')) return `/public-objects${imageUrl}`;
    return `/public-objects/${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryBadge = (category: string) => {
    const categories = {
      tournament: { label: "Тэмцээн", className: "bg-blue-500 text-white" },
      news: { label: "Мэдээ", className: "bg-green-500 text-white" },
      training: { label: "Сургалт", className: "bg-purple-500 text-white" },
      urgent: { label: "Яаралтай", className: "bg-red-500 text-white" },
    };
    
    const cat = categories[category as keyof typeof categories] || { label: "Мэдээ", className: "bg-gray-500 text-white" };
    return <Badge className={`${cat.className} text-xs`}>{cat.label}</Badge>;
  };

  // Filter out current article
  const filteredNews = latestNews.filter((news: any) => news.id !== currentNewsId);

  if (latestNewsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="mr-2 h-5 w-5 text-mtta-green" />
            Сүүлийн мэдээ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Calendar className="mr-2 h-5 w-5 text-mtta-green" />
          Сүүлийн мэдээ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredNews.length === 0 ? (
          <p className="text-gray-500 text-sm">Өөр мэдээ байхгүй байна.</p>
        ) : (
          <div className="space-y-4">
            {filteredNews.slice(0, 5).map((news: any) => (
              <Link key={news.id} href={`/news/${news.id}`}>
                <div className="group cursor-pointer">
                  <div className="flex gap-3">
                    {/* Image */}
                    <figure className="w-16 h-12 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={getImageUrl(news.imageUrl)}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <figcaption className="sr-only">{news.title}</figcaption>
                    </figure>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        {getCategoryBadge(news.category)}
                      </div>
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-mtta-green transition-colors mb-1">
                        {news.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(news.publishedAt || news.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <Link href="/news">
            <Button variant="outline" size="sm" className="w-full">
              Бүх мэдээг харах
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewsDetail() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const newsId = params.id;

  // Optimized specific news article fetching
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["/api/news", newsId],
    enabled: !!newsId,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Алдаа",
            description: "Мэдээг ачаалах боломжгүй байна",
            variant: "destructive",
          });
        }
      },
    },
  });

  // Publish news mutation
  const publishNewsMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const response = await apiRequest("PUT", `/api/news/${newsId}/publish`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Мэдээ амжилттай нийтлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news", newsId] });
    },
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
        description: "Мэдээ нийтлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const getCategoryBadge = (category: string) => {
    const categories = {
      tournament: { label: "Тэмцээн", className: "bg-blue-500 text-white" },
      news: { label: "Мэдээ", className: "bg-green-500 text-white" },
      training: { label: "Сургалт", className: "bg-purple-500 text-white" },
      urgent: { label: "Яаралтай", className: "bg-red-500 text-white" },
    };
    
    const cat = categories[category as keyof typeof categories] || { label: "Мэдээ", className: "bg-gray-500 text-white" };
    return <Badge className={cat.className}>{cat.label}</Badge>;
  };

  // Static placeholder SVG to avoid API calls and improve performance
  const placeholderImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return placeholderImageData;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('data:')) return imageUrl; // Handle base64 data URLs
    
    // If it's already an objects path, use it directly (served from public directory)
    if (imageUrl.startsWith('/objects/')) {
      return imageUrl;
    }
    
    // For other paths
    if (imageUrl.startsWith('/')) return `/public-objects${imageUrl}`;
    return `/public-objects/${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || articleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/news">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Мэдээ рүү буцах
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              {article.imageUrl && (
                <figure>
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={getImageUrl(article.imageUrl)}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('News detail image failed to load:', article.imageUrl);
                        console.log('Processed URL:', getImageUrl(article.imageUrl));
                        // Try alternative URL format
                        if (!e.currentTarget.src.includes('/public-objects/')) {
                          e.currentTarget.src = `/public-objects/${article.imageUrl.replace(/^\/+/, '')}`;
                        }
                      }}
                      onLoad={() => {
                        console.log('News detail image loaded successfully:', getImageUrl(article.imageUrl));
                      }}
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-sm text-gray-600">{article.title}</figcaption>
                </figure>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  {getCategoryBadge(article.category)}
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(article.publishedAt || article.createdAt)}
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 leading-tight">
                  {article.title}
                </CardTitle>
                
                {article.excerpt && (
                  <p className="text-xl text-gray-600 mt-4">{article.excerpt}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <div
                  className="prose max-w-none text-gray-700 text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />

                <Separator className="my-8" />
                
                {/* Author Info and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                    <figure className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {article.author?.profileImageUrl ? (
                        <img
                          src={getImageUrl(article.author.profileImageUrl)}
                          alt={`${article.author.firstName} ${article.author.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Author profile image failed to load:', article.author?.profileImageUrl);
                            console.log('Processed author URL:', getImageUrl(article.author?.profileImageUrl || ''));
                            // Fallback to user icon
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Author profile image loaded successfully:', getImageUrl(article.author?.profileImageUrl || ''));
                          }}
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                      <figcaption className="sr-only">
                        {article.author?.firstName} {article.author?.lastName}
                      </figcaption>
                    </figure>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {article.author?.firstName} {article.author?.lastName}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(article.createdAt)}д нэмсэн
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!article.published && user && user.role === 'admin' && (
                      <Button 
                        className="mtta-green text-white hover:bg-mtta-green-dark"
                        onClick={() => publishNewsMutation.mutate(article.id)}
                        disabled={publishNewsMutation.isPending}
                      >
                        <Megaphone className="mr-2 h-4 w-4" />
                        Нийтлэх
                      </Button>
                    )}
                    <Button variant="outline">
                      <Share2 className="mr-2 h-4 w-4" />
                      Хуваалцах
                    </Button>
                  </div>
                </div>
          </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <LatestNewsSidebar currentNewsId={newsId} />
          </div>
        </div>
      </div>
    </div>
  );
}