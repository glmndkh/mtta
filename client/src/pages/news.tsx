import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Plus, Calendar, User, Eye, Edit, Share2, Megaphone, Upload, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Link } from "wouter";

type CreateNewsForm = z.infer<typeof insertNewsSchema>;

export default function News() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newsImageUrl, setNewsImageUrl] = useState<string>("");
  const [editingNews, setEditingNews] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  // Fetch news data based on user role - admin sees all, others see published only
  const newsEndpoint = user?.role === 'admin' ? '/api/admin/news' : '/api/news';
  const { data: allNews = [], isLoading: newsLoading } = useQuery({
    queryKey: [newsEndpoint],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 30 * 1000, // Reduced to 30 seconds for better real-time updates
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes  
    refetchOnWindowFocus: true, // Enable refetch to see updates
    refetchOnMount: true, // Enable refetch on mount
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

  // Filter news by category
  const news = selectedCategory === "all" 
    ? allNews 
    : allNews.filter((item: any) => item.category === selectedCategory);

  // Create news form
  const form = useForm<CreateNewsForm>({
    resolver: zodResolver(insertNewsSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      category: "news",
      published: false,
      imageUrl: "",
    },
  });

  // Create news mutation
  const createNewsMutation = useMutation({
    mutationFn: async (data: CreateNewsForm) => {
      const response = await apiRequest("POST", "/api/news", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Мэдээ амжилттай үүсгэгдлээ",
      });
      setShowCreateDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/latest"] });
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
        description: "Мэдээ үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/latest"] });
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

  // Update news mutation
  const updateNewsMutation = useMutation({
    mutationFn: async (data: { id: string; newsData: Partial<CreateNewsForm> }) => {
      const response = await apiRequest("PUT", `/api/news/${data.id}`, data.newsData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Мэдээ амжилттай шинэчлэгдлээ",
      });
      setShowEditDialog(false);
      setEditingNews(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/latest"] });
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
        description: "Мэдээ шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateNewsForm) => {
    // Use the uploaded image URL if available
    const finalData = {
      ...data,
      imageUrl: newsImageUrl || data.imageUrl,
    };
    
    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, newsData: finalData });
    } else {
      createNewsMutation.mutate(finalData);
    }
  };

  // Handle opening edit dialog
  const handleEditNews = (newsItem: any) => {
    setEditingNews(newsItem);
    setNewsImageUrl(newsItem.imageUrl || "");
    form.reset({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt || "",
      category: newsItem.category || "news",
      published: newsItem.published,
      imageUrl: newsItem.imageUrl || "",
    });
    setShowEditDialog(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingNews(null);
    setNewsImageUrl("");
    form.reset();
  };

  // Handle image upload
  const handleImageUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { uploadURL } = await response.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful?.[0]?.uploadURL) {
      const response = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileURL: result.successful[0].uploadURL,
          isPublic: true,
        }),
      });
      const { objectPath } = await response.json();
      setNewsImageUrl(objectPath);
      form.setValue("imageUrl", objectPath);
      toast({
        title: "Амжилттай",
        description: "Зураг амжилттай хуулагдлаа",
      });
    }
  };

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

  // Loading skeleton for better UX
  if (isLoading || newsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="mb-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Мэдээ мэдээлэл</h1>
            <p className="text-gray-600">Холбооны сүүлийн үеийн мэдээ, тэмцээний үр дүн</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүгд</SelectItem>
                <SelectItem value="tournament">Тэмцээн</SelectItem>
                <SelectItem value="news">Мэдээ</SelectItem>
                <SelectItem value="training">Сургалт</SelectItem>
                <SelectItem value="urgent">Яаралтай</SelectItem>
              </SelectContent>
            </Select>

            {user.role === 'admin' && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="mtta-green text-white hover:bg-mtta-green-dark">
                    <Plus className="mr-2 h-4 w-4" />
                    Мэдээ нэмэх
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Шинэ мэдээ үүсгэх</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Гарчиг</FormLabel>
                            <FormControl>
                              <Input placeholder="Мэдээний гарчиг..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Товч агуулга</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Мэдээний товч агуулга..." 
                                rows={2}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дэлгэрэнгүй агуулга</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Мэдээний дэлгэрэнгүй агуулга..." 
                                rows={8}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ангилал</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Ангилал сонгоно уу" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tournament">Тэмцээн</SelectItem>
                                  <SelectItem value="news">Мэдээ</SelectItem>
                                  <SelectItem value="training">Сургалт</SelectItem>
                                  <SelectItem value="urgent">Яаралтай</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Мэдээний зураг</label>
                          <div className="flex items-center space-x-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5242880} // 5MB
                              onGetUploadParameters={handleImageUpload}
                              onComplete={handleImageUploadComplete}
                              buttonClassName="w-full"
                            >
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Зураг хуулах</span>
                              </div>
                            </ObjectUploader>
                          </div>
                          {newsImageUrl && (
                            <div className="mt-2">
                              <div className="relative w-32 h-24 overflow-hidden rounded-lg border">
                                <img 
                                  src={newsImageUrl.startsWith('/') ? `/public-objects${newsImageUrl}` : newsImageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Зураг амжилттай хуулагдлаа</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Цуцлах
                        </Button>
                        <Button 
                          type="submit" 
                          className="mtta-green text-white hover:bg-mtta-green-dark"
                          disabled={createNewsMutation.isPending}
                        >
                          {createNewsMutation.isPending ? "Үүсгэж байна..." : "Мэдээ үүсгэх"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {/* Edit News Dialog */}
            {user.role === 'admin' && (
              <Dialog open={showEditDialog} onOpenChange={handleCloseEditDialog}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Мэдээ засварлах</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Гарчиг *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Мэдээний гарчиг оруулна уу" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Товч агуулга</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Мэдээний товч агуулга (2-3 өгүүлбэр)"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Мэдээний агуулга *</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Мэдээний бүрэн агуулга оруулна уу"
                                rows={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ангилал</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ангилал сонгоно уу" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="tournament">Тэмцээн</SelectItem>
                                <SelectItem value="news">Мэдээ</SelectItem>
                                <SelectItem value="training">Сургалт</SelectItem>
                                <SelectItem value="urgent">Яаралтай</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="published"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Статус</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="false">Ноорог</SelectItem>
                                  <SelectItem value="true">Нийтлэгдсэн</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Зураг</label>
                          <ObjectUploader
                            onUploadComplete={handleImageUploadComplete}
                            className="w-full"
                            buttonClassName="w-full"
                          >
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              <span>Зураг хуулах</span>
                            </div>
                          </ObjectUploader>
                          {newsImageUrl && (
                            <div className="mt-2">
                              <div className="relative w-32 h-24 overflow-hidden rounded-lg border">
                                <img 
                                  src={newsImageUrl.startsWith('/') ? `/public-objects${newsImageUrl}` : newsImageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Зураг амжилттай хуулагдлаа</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCloseEditDialog}
                        >
                          Цуцлах
                        </Button>
                        <Button 
                          type="submit" 
                          className="mtta-green text-white hover:bg-mtta-green-dark"
                          disabled={updateNewsMutation.isPending}
                        >
                          {updateNewsMutation.isPending ? "Шинэчилж байна..." : "Мэдээ шинэчлэх"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* News List */}
        {newsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
            <p className="text-gray-600">Мэдээнүүдийг уншиж байна...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Мэдээ байхгүй байна</h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === "all" 
                ? "Одоогоор мэдээ байхгүй байна" 
                : "Энэ ангилалд мэдээ байхгүй байна"
              }
            </p>
            {user.role === 'admin' && (
              <Button 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Анхны мэдээ нэмэх
              </Button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured News */}
            <div className="lg:col-span-2">
              {news.slice(0, 1).map((article: any) => (
                <Card key={article.id} className="shadow-lg mb-8">
                  {article.imageUrl && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={getImageUrl(article.imageUrl)} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      {getCategoryBadge(article.category)}
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(article.publishedAt || article.createdAt)}
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <p className="text-gray-700 leading-relaxed mb-6">{article.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {article.author?.profileImageUrl ? (
                              <img 
                                src={getImageUrl(article.author.profileImageUrl)} 
                                alt={`${article.author.firstName} ${article.author.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {article.author?.firstName} {article.author?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(article.createdAt)}д нэмсэн
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {user.role === 'admin' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditNews(article)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Засах
                          </Button>
                        )}
                        {!article.published && user.role === 'admin' && (
                          <Button 
                            size="sm"
                            className="mtta-green text-white hover:bg-mtta-green-dark"
                            onClick={() => publishNewsMutation.mutate(article.id)}
                            disabled={publishNewsMutation.isPending}
                          >
                            <Megaphone className="mr-1 h-3 w-3" />
                            Нийтлэх
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Share2 className="mr-1 h-3 w-3" />
                          Хуваалцах
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Regular News List */}
              <div className="space-y-6">
                {news.slice(1).map((article: any) => (
                  <Card key={article.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {article.imageUrl && (
                          <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                            <img 
                              src={getImageUrl(article.imageUrl)} 
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            {getCategoryBadge(article.category)}
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article.publishedAt || article.createdAt)}
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{article.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                {article.author?.profileImageUrl ? (
                                  <img 
                                    src={getImageUrl(article.author.profileImageUrl)} 
                                    alt={`${article.author.firstName} ${article.author.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-900">
                                  {article.author?.firstName} {article.author?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(article.createdAt)}д нэмсэн
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {user.role === 'admin' && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditNews(article)}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Засах
                                </Button>
                              )}
                              {!article.published && user.role === 'admin' && (
                                <Button 
                                  size="sm"
                                  className="mtta-green text-white hover:bg-mtta-green-dark"
                                  onClick={() => publishNewsMutation.mutate(article.id)}
                                  disabled={publishNewsMutation.isPending}
                                >
                                  <Megaphone className="mr-1 h-3 w-3" />
                                  Нийтлэх
                                </Button>
                              )}
                              <Link href={`/news/${article.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Унших
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent News */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Newspaper className="mr-2 h-5 w-5 text-mtta-green" />
                    Сүүлийн мэдээ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allNews.slice(0, 5).map((article: any) => (
                      <div key={article.id} className="border-l-4 border-mtta-green pl-4">
                        <div className="flex items-center mb-2">
                          {getCategoryBadge(article.category)}
                          <span className="text-gray-500 text-sm ml-2">
                            {formatDate(article.publishedAt || article.createdAt)}
                          </span>
                        </div>
                        <Link href={`/news/${article.id}`}>
                          <h4 className="font-bold text-gray-900 mb-1 text-sm line-clamp-2 hover:text-mtta-green cursor-pointer transition-colors">{article.title}</h4>
                        </Link>
                        <p className="text-gray-600 text-xs line-clamp-2">{article.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Ангиллууд</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "Бүгд", count: allNews.length },
                      { value: "tournament", label: "Тэмцээн", count: allNews.filter((n: any) => n.category === "tournament").length },
                      { value: "news", label: "Мэдээ", count: allNews.filter((n: any) => n.category === "news").length },
                      { value: "training", label: "Сургалт", count: allNews.filter((n: any) => n.category === "training").length },
                      { value: "urgent", label: "Яаралтай", count: allNews.filter((n: any) => n.category === "urgent").length },
                    ].map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category.value
                            ? 'bg-mtta-green text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.label}</span>
                          <span className={`text-xs ${
                            selectedCategory === category.value ? 'text-white' : 'text-gray-500'
                          }`}>
                            {category.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
