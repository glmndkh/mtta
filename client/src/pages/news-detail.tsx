import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getImageUrl, formatName } from "@/lib/utils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Megaphone, Share2, Clock } from "lucide-react";
import { Link, useParams } from "wouter";
import { useMemo } from "react";

// Latest News Sidebar Component
function LatestNewsSidebar({ currentNewsId }: { currentNewsId: string | undefined }) {
  const { data: latestNews = [], isLoading: latestNewsLoading } = useQuery({
    queryKey: ["/api/news/latest"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Use shared image URL helper

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
                    <figure className="w-16 h-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <img
                        src={getImageUrl(news.imageUrl)}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          console.error('Sidebar image failed to load:', news.imageUrl);
                          const target = e.currentTarget as HTMLImageElement;
                          const container = target.parentElement;

                          target.style.display = 'none';
                          if (container) {
                            container.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log('Sidebar image loaded successfully:', getImageUrl(news.imageUrl));
                        }}
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

  // Image helper imported above handles placeholder and path normalization

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

  const processContentImages = (html: string) => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      console.log("Processing content image src:", src);

      // Fix common object storage path issues
      let processedSrc = src;

      // Remove duplicate /objects/ in path
      if (src.includes('/objects/objects/')) {
        processedSrc = src.replace('/objects/objects/', '/objects/');
      }

      // Remove duplicate /public-objects/ in path
      if (src.includes('/public-objects/public-objects/')) {
        processedSrc = src.replace('/public-objects/public-objects/', '/public-objects/');
      }

      // Process through getImageUrl for consistent handling
      processedSrc = getImageUrl(processedSrc);
      console.log("Processed to:", processedSrc);
      img.setAttribute("src", processedSrc);

      // Add error handling for broken images
      const fallbackSrc = getImageUrl('');
      img.setAttribute("onerror", `this.onerror=null; this.src='${fallbackSrc}';`);

      // Add loading attribute for better performance
      img.setAttribute("loading", "lazy");

      // Ensure images are responsive
      if (!img.getAttribute("style")) {
        img.setAttribute("style", "max-width: 100%; height: auto; border-radius: 8px;");
      }
    });
    return doc.body.innerHTML;
  };

  const processedContent = useMemo(
    () => processContentImages(article?.content || ""),
    [article?.content]
  );

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
                  <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={getImageUrl(article.imageUrl)}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('News detail image failed to load:', article.imageUrl);
                        const target = e.currentTarget as HTMLImageElement;
                        const container = target.parentElement;

                        if (!target.hasAttribute('data-fallback-tried')) {
                          target.setAttribute('data-fallback-tried', 'true');
                          // Try public-objects path as fallback
                          const cleanPath = article.imageUrl.replace(/^\/+/, '').replace(/^objects\//, '');
                          target.src = `/public-objects/${cleanPath}`;
                        } else if (!target.hasAttribute('data-fallback-2-tried')) {
                          target.setAttribute('data-fallback-2-tried', 'true');
                          // Try with objects prefix
                          const cleanPath = article.imageUrl.replace(/^\/+/, '').replace(/^objects\//, '');
                          target.src = `/public-objects/objects/${cleanPath}`;
                        } else if (!target.hasAttribute('data-fallback-3-tried')) {
                          target.setAttribute('data-fallback-3-tried', 'true');
                          // Final attempt using legacy objects endpoint
                          const cleanPath = article.imageUrl.replace(/^\/+/, '').replace(/^objects\//, '');
                          target.src = `/objects/${cleanPath}`;
                        } else {
                          // Final fallback to placeholder
                          target.style.display = 'none';
                          if (container) {
                            container.classList.add('flex', 'items-center', 'justify-center');
                            container.innerHTML = `
                              <div class="flex flex-col items-center justify-center text-gray-400 py-8">
                                <svg class="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                                <span class="text-sm">Зураг ачаалагдсангүй</span>
                              </div>
                            `;
                          }
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

              <CardHeader>
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
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                <Separator className="my-8" />

                {/* Author Info and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {article.author?.profileImageUrl ? (
                          <img
                            src={getImageUrl(article.author.profileImageUrl)}
                            alt={formatName(article.author.firstName, article.author.lastName)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Author profile image failed to load:', article.author?.profileImageUrl);
                              const target = e.currentTarget as HTMLImageElement;
                              const container = target.parentElement;

                              target.style.display = 'none';
                              if (container) {
                                container.innerHTML = '<div class="h-6 w-6 text-gray-400"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg></div>';
                              }
                            }}
                            onLoad={() => {
                              console.log('Author profile image loaded successfully:', getImageUrl(article.author?.profileImageUrl || ''));
                            }}
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                        <figcaption className="sr-only">
                          {formatName(article.author?.firstName, article.author?.lastName)}
                        </figcaption>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatName(article.author?.firstName, article.author?.lastName)}
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