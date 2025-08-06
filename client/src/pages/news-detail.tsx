import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { Link } from "wouter";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  authorId: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const newsId = params?.id;

  const { data: news, isLoading, error } = useQuery<NewsArticle>({
    queryKey: ['/api/news', newsId],
    enabled: !!newsId,
  });

  const getImageUrl = (imageUrl?: string): string => {
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryLabel = (category?: string): string => {
    switch (category) {
      case 'tournament': return 'Тэмцээн';
      case 'news': return 'Мэдээ';
      case 'training': return 'Сургалт';
      case 'urgent': return 'Яаралтай';
      default: return 'Мэдээ';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
            <p className="text-gray-600">Мэдээ уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Мэдээ олдсонгүй</h1>
              <p className="text-gray-600 mb-6">Таны хайсан мэдээ олдсонгүй эсвэл устгагдсан байж болзошгүй.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Нүүр хуудас руу буцах
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-mtta-green hover:text-mtta-green-dark">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Нүүр хуудас руу буцах
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* News Image */}
            {news.imageUrl && (
              <div className="w-full h-64 md:h-96 overflow-hidden rounded-t-lg">
                <img 
                  src={getImageUrl(news.imageUrl)} 
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Category & Date */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                {news.category && (
                  <span className="px-3 py-1 bg-mtta-green text-white rounded-full text-xs font-medium">
                    {getCategoryLabel(news.category)}
                  </span>
                )}
                {news.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.publishedAt)}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {news.title}
              </h1>

              {/* Excerpt */}
              {news.excerpt && (
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {news.excerpt}
                </p>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
                {news.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ) : (
                    <br key={index} />
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button size="lg" className="bg-mtta-green text-white hover:bg-mtta-green-dark">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Нүүр хуудас руу буцах
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}