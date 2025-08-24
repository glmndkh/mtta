import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Plus, Calendar, User, Edit, Megaphone, Upload, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Link } from "wouter";
import PageWithLoading from "@/components/PageWithLoading";
import RichTextEditor from "@/components/rich-text-editor";

const newsFormSchema = insertNewsSchema.omit({ authorId: true });
type CreateNewsForm = z.infer<typeof newsFormSchema>;

export default function News() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newsImageUrl, setNewsImageUrl] = useState<string>("");
  const [editingNews, setEditingNews] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Remove authentication requirement - allow viewing for all users

  // Fetch news data - allow for all users
  const { data: allNews = [], isLoading: newsLoading } = useQuery({
    queryKey: ['/api/news'],
    retry: false,
    staleTime: 30 * 1000, // Reduced to 30 seconds for better real-time updates
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes  
    refetchOnWindowFocus: true, // Enable refetch to see updates
    refetchOnMount: true, // Enable refetch on mount
  });

  // Filter news by category
  const news = selectedCategory === "all" 
    ? (allNews as any[]) 
    : (allNews as any[]).filter((item: any) => item.category === selectedCategory);

  // Create news form
  const form = useForm<CreateNewsForm>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      category: "news",
      published: true,
      imageUrl: "",
    },
  });

  // Create news mutation
  const createNewsMutation = useMutation<any, Error, CreateNewsForm & { authorId: string }>({
    mutationFn: async (data) => {
      console.log("Creating news with data:", data);
      const response = await apiRequest("/api/admin/news", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (result) => {
      console.log("News created successfully:", result);
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
      console.error("News creation error:", error);
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
        description: "Мэдээ үүсгэхэд алдаа гарлаа. Консол лог шалгана уу.",
        variant: "destructive",
      });
    },
  });

  // Publish news mutation
  const publishNewsMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const response = await apiRequest(`/api/news/${newsId}/publish`, {
        method: "PUT",
      });
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
  const updateNewsMutation = useMutation<any, Error, { id: string; newsData: Partial<CreateNewsForm> & { authorId: string } }>({
    mutationFn: async (data) => {
      const response = await apiRequest(`/api/news/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.newsData),
      });
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
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Current user:", user);
    console.log("Form values:", form.getValues());
    console.log("Form is valid:", form.formState.isValid);
    
    // Get all form values directly
    const formValues = form.getValues();
    console.log("Direct form values:", formValues);
    
    // Use form values as primary source since data might be stale
    const titleValue = formValues.title || data.title;
    const contentValue = formValues.content || data.content; 
    const excerptValue = formValues.excerpt || data.excerpt;
    const categoryValue = formValues.category || data.category;
    const publishedValue = formValues.published !== undefined ? formValues.published : data.published;
    const imageUrlValue = formValues.imageUrl || data.imageUrl;
    
    console.log("Extracted values:", {
      title: titleValue,
      content: contentValue,
      excerpt: excerptValue,
      category: categoryValue,
      published: publishedValue,
      imageUrl: imageUrlValue
    });
    
    // Validate that required fields are present
    if (!titleValue?.trim()) {
      toast({
        title: "Алдаа",
        description: "Гарчиг заавал бөглөх ёстой",
        variant: "destructive",
      });
      return;
    }
    
    if (!contentValue?.trim()) {
      toast({
        title: "Алдаа", 
        description: "Агуулга заавал бөглөх ёстой",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is authenticated for creating news
    if (!(user as any)?.id) {
      toast({
        title: "Алдаа",
        description: "Мэдээ үүсгэхийн тулд нэвтэрсэн байх ёстой",
        variant: "destructive",
      });
      return;
    }
    
    // Use the uploaded image URL if available and add authorId
    const finalData = {
      title: titleValue.trim(),
      content: contentValue.trim(),
      excerpt: excerptValue?.trim() || '',
      category: categoryValue || 'news',
      published: publishedValue !== undefined ? publishedValue : true,
      imageUrl: newsImageUrl || imageUrlValue || '',
      authorId: (user as any).id, // Add the required authorId field
    };
    
    console.log("Final data to submit:", finalData);
    
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

  const handleConfirmImage = () => {
    if (newsImageUrl) {
      form.setValue("imageUrl", newsImageUrl);
      setShowImageDialog(false);
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

    // If it's an object storage path, map it to the public-objects route
    if (imageUrl.startsWith('/public-objects/')) return imageUrl;
    if (imageUrl.startsWith('/objects/')) {
      const path = imageUrl.replace(/^\/objects\//, '');
      return `/public-objects/${path}`;
    }

    // For other absolute or relative paths ensure they're served via public-objects
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
      <div className="min-h-screen">
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

  // Show content for all users, but only show admin functions if authenticated as admin

  return (
    <PageWithLoading>
      <div className="min-h-screen">
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

            {user && (user as any)?.role === 'admin' && (
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
                                value={field.value || ""}
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
                              <RichTextEditor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder="Мэдээний дэлгэрэнгүй агуулга..."
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
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowImageDialog(true)}
                          >
                            {newsImageUrl ? (
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                <span>Зураг засах</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Зураг нэмэх</span>
                              </div>
                            )}
                          </Button>
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
            {user && (user as any)?.role === 'admin' && (
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
                                value={field.value || ""}
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
                              <RichTextEditor
                                content={field.value || ""}
                                onChange={(content) => {
                                  console.log("RichTextEditor onChange called with:", content);
                                  field.onChange(content);
                                  form.setValue("content", content);
                                }}
                                placeholder="Мэдээний бүрэн агуулга оруулна уу"
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
                            <Select onValueChange={field.onChange} value={field.value || "news"}>
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
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowImageDialog(true)}
                          >
                            {newsImageUrl ? (
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                <span>Зураг засах</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Зураг нэмэх</span>
                              </div>
                            )}
                          </Button>
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

        {showImageDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">Зураг нэмэх</h3>
              <div className="space-y-4">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleImageUpload}
                  onComplete={handleImageUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Зураг хуулах</span>
                  </div>
                </ObjectUploader>
                <div className="mt-4">
                  <Label htmlFor="newsImageUrlInput">Зурагны URL (заавал биш)</Label>
                  <Input
                    id="newsImageUrlInput"
                    type="text"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {newsImageUrl && (
                  <div className="mt-2">
                    <div className="relative w-full h-40 overflow-hidden rounded-lg border">
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
              <div className="flex justify-end space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowImageDialog(false)}>
                  Цуцлах
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmImage}
                  className="mtta-green text-white hover:bg-mtta-green-dark"
                  disabled={!newsImageUrl}
                >
                  Оруулах
                </Button>
              </div>
            </div>
          </div>
        )}

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
            {user && (user as any)?.role === 'admin' && (
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
          <div className="space-y-6">
            {news.map((article: any) => (
              <Card key={article.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {article.imageUrl && (
                      <div className="w-40 h-28 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
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
                      <Link href={`/news/${article.id}`}>
                        <h3 className="font-bold text-xl text-gray-900 mb-2 hover:text-mtta-green transition-colors">
                          {article.title}
                        </h3>
                      </Link>
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
                          {user && (user as any)?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditNews(article)}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Засах
                            </Button>
                          )}
                          {!article.published && user && (user as any)?.role === 'admin' && (
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
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </PageWithLoading>
  );
}
