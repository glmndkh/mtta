
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import PageLayout from '../components/PageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { 
  Plus, 
  Edit,
  Trash2,
  Search,
  Calendar,
  Clock,
  Eye,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Filter,
  SortDesc,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Enhanced schema for news
const newsFormSchema = z.object({
  title: z.string().min(3, 'Гарчиг дор хаяж 3 тэмдэгт байх ёстой'),
  content: z.string().min(10, 'Агуулга дор хаяж 10 тэмдэгт байх ёстой'),
  excerpt: z.string().max(200, 'Товч агуулга 200 тэмдэгтээс хэтрэхгүй байх ёстой').optional(),
  category: z.enum(['news', 'training', 'event', 'achievement', 'announcement']),
  published: z.boolean(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

type CreateNewsForm = z.infer<typeof newsFormSchema>;

// Category mappings
const categoryLabels = {
  news: 'Мэдээ',
  training: 'Сургалт',
  event: 'Арга хэмжээ',
  achievement: 'Амжилт',
  announcement: 'Зарлал'
};

// Analytics helper
const emitAnalyticsEvent = (event: string, data: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, data);
  }
  console.log(`Analytics: ${event}`, data);
};

export default function News() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [newsImageUrl, setNewsImageUrl] = useState<string>('');

  // Form setup
  const form = useForm<CreateNewsForm>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: 'news',
      published: true,
      imageUrl: '',
      tags: [],
      featured: false,
    },
  });

  // Fetch news data
  const { data: allNews = [], isLoading, error, refetch } = useQuery({
    queryKey: ['news', selectedCategory, searchQuery, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/news?${params}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    retry: 2,
  });

  // Filter and sort news client-side for better UX
  const { featuredNews, regularNews } = useMemo(() => {
    let filtered = [...(allNews as any[])];

    // Apply filters
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt || b.publishedAt).getTime() - new Date(a.createdAt || a.publishedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    // Separate featured and regular news
    const featured = filtered.find(item => item.featured) || filtered[0];
    const regular = filtered.filter(item => item.id !== featured?.id);

    return { featuredNews: featured, regularNews: regular };
  }, [allNews, selectedCategory, searchQuery, sortBy]);

  // Mutations
  const createNewsMutation = useMutation({
    mutationFn: async (newsData: any) => {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData),
      });
      if (!response.ok) throw new Error('Failed to create news');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast({ title: 'Амжилттай нэмэгдлээ', description: 'Шинэ мэдээ амжилттай нэмэгдлээ' });
      setShowCreateDialog(false);
      form.reset();
      setNewsImageUrl('');
      emitAnalyticsEvent('news_create', { category: form.getValues('category') });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Алдаа гарлаа', 
        description: error.message || 'Мэдээ нэмэхэд алдаа гарлаа',
        variant: 'destructive' 
      });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, newsData }: { id: string; newsData: any }) => {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData),
      });
      if (!response.ok) throw new Error('Failed to update news');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast({ title: 'Амжилттай шинэчлэгдлээ', description: 'Мэдээ амжилттай шинэчлэгдлээ' });
      setShowEditDialog(false);
      setEditingNews(null);
      form.reset();
      setNewsImageUrl('');
      emitAnalyticsEvent('news_update', { id });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete news');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast({ title: 'Амжилттай устгагдлаа', description: 'Мэдээ амжилттай устгагдлаа' });
      emitAnalyticsEvent('news_delete', { id });
    },
  });

  // Event handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    emitAnalyticsEvent('news_search', { query: searchQuery, category: selectedCategory });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    emitAnalyticsEvent('filter_change', { category });
  };

  const handleCardClick = (newsItem: any) => {
    emitAnalyticsEvent('news_card_view', { 
      id: newsItem.id, 
      title: newsItem.title,
      category: newsItem.category 
    });
  };

  const handleReadMoreClick = (newsItem: any) => {
    emitAnalyticsEvent('news_read_more_click', { 
      id: newsItem.id, 
      title: newsItem.title 
    });
  };

  const handleSubmit = form.handleSubmit((data) => {
    const finalData = {
      ...data,
      imageUrl: newsImageUrl || data.imageUrl || '',
      authorId: (user as any)?.id,
    };

    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, newsData: finalData });
    } else {
      createNewsMutation.mutate(finalData);
    }
  });

  const handleEditNews = (newsItem: any) => {
    setEditingNews(newsItem);
    setNewsImageUrl(newsItem.imageUrl || '');
    form.reset({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt || '',
      category: newsItem.category || 'news',
      published: newsItem.published,
      imageUrl: newsItem.imageUrl || '',
      tags: newsItem.tags || [],
      featured: newsItem.featured || false,
    });
    setShowEditDialog(true);
  };

  const handleShare = (platform: string, newsItem: any) => {
    const url = `${window.location.origin}/news/${newsItem.slug || newsItem.id}`;
    const title = newsItem.title;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      emitAnalyticsEvent('news_share', { platform, id: newsItem.id });
    }
  };

  // Image helper
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('/objects/')) return imageUrl;
    return `/objects/uploads/${imageUrl}`;
  };

  // Loading skeleton component
  const NewsSkeleton = () => (
    <div className="space-y-8">
      {/* Featured skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <Skeleton className="w-full md:w-1/2 h-64" />
          <div className="p-6 md:w-1/2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="w-full h-48" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Мэдээ ачаалахад алдаа гарлаа
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Интернет холболтоо шалгаад дахин оролдоно уу
      </p>
      <Button onClick={() => refetch()} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Дахин оролдох
      </Button>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Мэдээ олдсонгүй
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {searchQuery ? 'Хайлтын үр дүн олдсонгүй. Өөр түлхүүр үг ашиглан хайж үзнэ үү.' : 'Одоогоор мэдээ байхгүй байна.'}
      </p>
    </div>
  );

  // Featured news card
  const FeaturedNewsCard = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.imageUrl);
    
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="md:flex">
          <div className="md:w-1/2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full h-64 md:h-full object-cover"
                loading="eager"
                onLoad={() => console.log('Featured image loaded successfully:', imageUrl)}
                onError={(e) => {
                  console.error('Featured image failed to load:', imageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-2" />
                  <span>Зураг байхгүй</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Онцлох мэдээ
                </Badge>
                <Badge variant="outline">
                  {categoryLabels[item.category as keyof typeof categoryLabels] || item.category}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                {item.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(item.createdAt || item.publishedAt).toLocaleDateString('mn-MN')}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {item.excerpt || item.content?.substring(0, 200) + '...'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => {
                  handleCardClick(item);
                  handleReadMoreClick(item);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Дэлгэрэнгүй унших
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare('facebook', item)}
                  aria-label="Facebook дээр хуваалцах"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare('twitter', item)}
                  aria-label="Twitter дээр хуваалцах"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Regular news card
  const NewsCard = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.imageUrl);
    
    return (
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50"
        onClick={() => handleCardClick(item)}
        tabIndex={0}
        role="article"
        aria-labelledby={`news-title-${item.id}`}
      >
        <div className="aspect-video overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onLoad={() => console.log('Image loaded successfully:', imageUrl)}
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                (e.target as HTMLImageElement).src = '/api/placeholder/400/240';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[item.category as keyof typeof categoryLabels] || item.category}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(item.createdAt || item.publishedAt).toLocaleDateString('mn-MN')}
            </span>
          </div>
          
          <h3 
            id={`news-title-${item.id}`}
            className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {item.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
            {item.excerpt || item.content?.substring(0, 120) + '...'}
          </p>
          
          <div className="flex items-center justify-between">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleReadMoreClick(item);
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-0 h-auto font-medium"
            >
              Дэлгэрэнгүй
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleShare('facebook', item);
              }}
              aria-label="Хуваалцах"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Шинэ мэдээ
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Монголын ширээний теннисний холбооны мэдээ мэдээлэл
              </p>
            </div>
            
            {isAuthenticated && user?.role === 'admin' && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Мэдээ нэмэх
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Шинэ мэдээ нэмэх</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Гарчиг *</Label>
                      <Input
                        id="title"
                        {...form.register('title')}
                        placeholder="Мэдээний гарчиг"
                      />
                      {form.formState.errors.title && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Товч агуулга</Label>
                      <Textarea
                        id="excerpt"
                        {...form.register('excerpt')}
                        placeholder="Мэдээний товч агуулга"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Агуулга *</Label>
                      <Textarea
                        id="content"
                        {...form.register('content')}
                        placeholder="Мэдээний бүрэн агуулга"
                        rows={6}
                      />
                      {form.formState.errors.content && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.content.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Ангилал</Label>
                        <Select
                          onValueChange={(value) => form.setValue('category', value as any)}
                          defaultValue={form.getValues('category')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ангилал сонгох" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="published"
                            checked={form.watch('published')}
                            onCheckedChange={(checked) => form.setValue('published', checked)}
                          />
                          <Label htmlFor="published">Нийтлэх</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="featured"
                            checked={form.watch('featured')}
                            onCheckedChange={(checked) => form.setValue('featured', checked)}
                          />
                          <Label htmlFor="featured">Онцлох</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">Зургийн URL</Label>
                      <Input
                        id="imageUrl"
                        value={newsImageUrl}
                        onChange={(e) => setNewsImageUrl(e.target.value)}
                        placeholder="Зургийн холбоос"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Цуцлах
                      </Button>
                      <Button
                        type="submit"
                        disabled={createNewsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {createNewsMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters and Search */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Мэдээ хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    aria-label="Мэдээ хайх"
                  />
                </div>
              </form>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Огнооны дараалал</SelectItem>
                    <SelectItem value="title">Нэрийн дараалал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
                <TabsTrigger value="all">Бүгд</TabsTrigger>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          {error ? (
            <ErrorState />
          ) : isLoading ? (
            <NewsSkeleton />
          ) : (
            <>
              {/* Featured News */}
              {featuredNews && (
                <section className="mb-12" aria-labelledby="featured-news-title">
                  <h2 id="featured-news-title" className="sr-only">Онцлох мэдээ</h2>
                  <FeaturedNewsCard item={featuredNews} />
                </section>
              )}

              {/* Regular News Grid */}
              <section aria-labelledby="news-list-title">
                <h2 id="news-list-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Сүүлийн мэдээ
                </h2>
                
                {regularNews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularNews.map((item: any) => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </section>

              {/* Load More */}
              {regularNews.length >= 12 && (
                <div className="text-center mt-12">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Цааш үзэх
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Мэдээ засах</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Гарчиг *</Label>
              <Input
                id="edit-title"
                {...form.register('title')}
                placeholder="Мэдээний гарчиг"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-excerpt">Товч агуулга</Label>
              <Textarea
                id="edit-excerpt"
                {...form.register('excerpt')}
                placeholder="Мэдээний товч агуулга"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Агуулга *</Label>
              <Textarea
                id="edit-content"
                {...form.register('content')}
                placeholder="Мэдээний бүрэн агуулга"
                rows={6}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Ангилал</Label>
                <Select
                  onValueChange={(value) => form.setValue('category', value as any)}
                  value={form.watch('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ангилал сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-published"
                    checked={form.watch('published')}
                    onCheckedChange={(checked) => form.setValue('published', checked)}
                  />
                  <Label htmlFor="edit-published">Нийтлэх</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-featured"
                    checked={form.watch('featured')}
                    onCheckedChange={(checked) => form.setValue('featured', checked)}
                  />
                  <Label htmlFor="edit-featured">Онцлох</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-imageUrl">Зургийн URL</Label>
              <Input
                id="edit-imageUrl"
                value={newsImageUrl}
                onChange={(e) => setNewsImageUrl(e.target.value)}
                placeholder="Зургийн холбоос"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingNews(null);
                  form.reset();
                }}
              >
                Цуцлах
              </Button>
              <Button
                type="submit"
                disabled={updateNewsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateNewsMutation.isPending ? 'Шинэчлэж байна...' : 'Шинэчлэх'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
