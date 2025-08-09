import { useEffect, useState } from "react";
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
import { ArrowLeft, Calendar, User, Megaphone, Share2, Clock, Eye } from "lucide-react";
import { Link, useParams } from "wouter";

export default function NewsDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const newsId = params.id;

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

  // Optimized specific news article fetching
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["/api/news", newsId],
    enabled: isAuthenticated && !!newsId,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
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
      },
    },
  });

  // Optimized latest news fetching for sidebar
  const { data: latestNews = [] } = useQuery({
    queryKey: ["/api/news/latest"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 3 * 60 * 1000, // Consider data fresh for 3 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "1 цагийн өмнө";
    if (diffHours < 24) return `${diffHours} цагийн өмнө`;
    if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
    return date.toLocaleDateString('mn-MN');
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

  if (!isAuthenticated || !user || !article) {
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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              {article.imageUrl && (
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
                <div className="prose max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </p>
                </div>
                
                <Separator className="my-8" />
                
                {/* Author Info and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
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
                      </div>
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
                    {!article.published && user.role === 'admin' && (
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
          <div className="lg:col-span-1 space-y-6">
            {/* Latest News */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Сүүлийн мэдээ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestNews.slice(0, 5).map((news: any) => (
                  <div key={news.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                    <Link href={`/news/${news.id}`}>
                      <div className="flex gap-3 hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer transition-colors">
                        {news.imageUrl && (
                          <div className="w-16 h-12 flex-shrink-0 overflow-hidden rounded">
                            <img 
                              src={getImageUrl(news.imageUrl)} 
                              alt={news.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {news.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(news.createdAt)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Ангиллууд</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/news?category=all">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
                    Бүгд
                  </Button>
                </Link>
                <Link href="/news?category=tournament">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                    Тэмцээн
                  </Button>
                </Link>
                <Link href="/news?category=news">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    Мэдээ
                  </Button>
                </Link>
                <Link href="/news?category=training">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                    Сургалт
                  </Button>
                </Link>
                <Link href="/news?category=urgent">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                    Яаралтай
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}