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
import { Newspaper, Plus, Calendar, User, Eye, Edit, Share2, Megaphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsSchema } from "@shared/schema";
import { z } from "zod";

type CreateNewsForm = z.infer<typeof insertNewsSchema>;

export default function News() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  // Fetch news
  const { data: allNews = [], isLoading: newsLoading } = useQuery({
    queryKey: ["/api/news"],
    enabled: isAuthenticated,
    retry: false,
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

  const onSubmit = (data: CreateNewsForm) => {
    createNewsMutation.mutate(data);
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

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Зургийн линк</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                        src={article.imageUrl} 
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
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <p className="text-gray-700 leading-relaxed mb-6">{article.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-1" />
                        {article.author?.firstName} {article.author?.lastName}
                      </div>
                      
                      <div className="flex items-center space-x-2">
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
                              src={article.imageUrl} 
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
                              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('mn-MN')}
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{article.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-4 w-4 mr-1" />
                              {article.author?.firstName} {article.author?.lastName}
                            </div>
                            
                            <div className="flex items-center space-x-2">
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
                                <Eye className="mr-1 h-3 w-3" />
                                Унших
                              </Button>
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
                            {new Date(article.publishedAt || article.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm line-clamp-2">{article.title}</h4>
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
