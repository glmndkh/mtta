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
import { Building, Plus, Users, MapPin, Phone, Mail, Settings, User, Crown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClubSchema } from "@shared/schema";
import { z } from "zod";

type CreateClubForm = z.infer<typeof insertClubSchema>;

export default function Clubs() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  // Fetch clubs
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ["/api/clubs"],
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

  // Fetch selected club details
  const { data: clubDetails } = useQuery({
    queryKey: ["/api/clubs", selectedClub],
    enabled: !!selectedClub,
    retry: false,
  });

  // Create club form
  const form = useForm<CreateClubForm>({
    resolver: zodResolver(insertClubSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      colorTheme: "#22C55E",
    },
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (data: CreateClubForm) => {
      const response = await apiRequest("POST", "/api/clubs", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Клуб амжилттай үүсгэгдлээ",
      });
      setShowCreateDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
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
        description: "Клуб үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClubForm) => {
    createClubMutation.mutate(data);
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
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Клубууд</h1>
            <p className="text-gray-600">Монголын ширээний теннисний клубуудын жагсаалт</p>
          </div>
          
          {user.role === 'club_owner' && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="mtta-green text-white hover:bg-mtta-green-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Клуб үүсгэх
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Шинэ клуб үүсгэх</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Клубын нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Жишээ: УБ Спорт Клуб" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тайлбар</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Клубын тухай дэлгэрэнгүй мэдээлэл..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Хаяг</FormLabel>
                            <FormControl>
                              <Input placeholder="Улаанбаатар хот..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Утасны дугаар</FormLabel>
                            <FormControl>
                              <Input placeholder="+976 xxxxxxxx" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>И-мэйл</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="club@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colorTheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Клубын өнгө</FormLabel>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input 
                                  type="color" 
                                  className="w-16 h-10 p-1 border rounded"
                                  {...field} 
                                />
                                <Input 
                                  type="text" 
                                  placeholder="#22C55E"
                                  className="flex-1"
                                  {...field}
                                />
                              </div>
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
                        disabled={createClubMutation.isPending}
                      >
                        {createClubMutation.isPending ? "Үүсгэж байна..." : "Клуб үүсгэх"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Club List */}
        {clubsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
            <p className="text-gray-600">Клубуудыг уншиж байна...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Клуб байхгүй байна</h3>
            <p className="text-gray-600 mb-6">Одоогоор бүртгэгдсэн клуб байхгүй байна</p>
            {user.role === 'club_owner' && (
              <Button 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Анхны клуб үүсгэх
              </Button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Club Cards */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {clubs.map((club: any) => (
                <Card 
                  key={club.id} 
                  className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedClub(club.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: club.colorTheme || '#22C55E' }}
                        >
                          {club.logoUrl ? (
                            <img src={club.logoUrl} alt={club.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            club.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Crown className="h-3 w-3 mr-1" />
                            {club.owner?.firstName} {club.owner?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      {club.address && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-mtta-green" />
                          <span>{club.address}</span>
                        </div>
                      )}
                      {club.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-mtta-green" />
                          <span>{club.phone}</span>
                        </div>
                      )}
                      {club.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-mtta-green" />
                          <span>{club.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1 text-mtta-green" />
                          <span>{club.players?.length || 0} тоглогч</span>
                        </div>
                        <Badge 
                          variant="outline"
                          style={{ borderColor: club.colorTheme || '#22C55E', color: club.colorTheme || '#22C55E' }}
                        >
                          Идэвхтэй
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Club Details Sidebar */}
            <div>
              {selectedClub && clubDetails ? (
                <Card className="sticky top-8">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: clubDetails.colorTheme || '#22C55E' }}
                      >
                        {clubDetails.logoUrl ? (
                          <img src={clubDetails.logoUrl} alt={clubDetails.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          clubDetails.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{clubDetails.name}</CardTitle>
                        <p className="text-gray-600 flex items-center">
                          <Crown className="h-4 w-4 mr-1" />
                          Эзэн: {clubDetails.owner?.firstName} {clubDetails.owner?.lastName}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Тайлбар</h4>
                        <p className="text-gray-600 text-sm">{clubDetails.description || 'Тайлбар байхгүй'}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Холбоо барих</h4>
                        <div className="space-y-2 text-sm">
                          {clubDetails.address && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-mtta-green mt-0.5" />
                              <span className="text-gray-600">{clubDetails.address}</span>
                            </div>
                          )}
                          {clubDetails.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-mtta-green" />
                              <span className="text-gray-600">{clubDetails.phone}</span>
                            </div>
                          )}
                          {clubDetails.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-mtta-green" />
                              <span className="text-gray-600">{clubDetails.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Тоглогчид ({clubDetails.players?.length || 0})</h4>
                        {clubDetails.players && clubDetails.players.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {clubDetails.players.map((player: any) => (
                              <div key={player.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <User className="h-4 w-4 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium">{player.user?.firstName} {player.user?.lastName}</p>
                                  <p className="text-gray-500">#{player.ranking || 'N/A'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Одоогоор тоглогч байхгүй</p>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <Button 
                          className="w-full mtta-green text-white hover:bg-mtta-green-dark"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Клуб удирдах
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5 text-mtta-green" />
                      Клубын мэдээлэл
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Клуб сонгож дэлгэрэнгүй мэдээллийг үзнэ үү</p>
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
