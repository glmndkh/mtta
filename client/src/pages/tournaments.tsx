import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import TournamentBracket from "@/components/tournament-bracket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trophy, Plus, Users, Calendar as CalendarIcon, MapPin, Clock, UserPlus, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTournamentSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { mn } from "date-fns/locale";

const createTournamentSchema = insertTournamentSchema.extend({
  startDate: z.date(),
  endDate: z.date(),
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

export default function Tournaments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);

  // Edit tournament form
  const editForm = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      maxParticipants: 32,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async (data: { id: string; tournament: CreateTournamentForm }) => {
      const response = await apiRequest("PUT", `/api/tournaments/${data.id}`, data.tournament);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тэмцээн амжилттай засварлагдлаа",
      });
      setShowEditDialog(false);
      setEditingTournament(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
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
        description: "Тэмцээн засварлахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest("DELETE", `/api/tournaments/${tournamentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тэмцээн амжилттай устгагдлаа",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
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
        description: "Тэмцээн устгахад алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Handle edit tournament
  const handleEditTournament = (tournament: any) => {
    setEditingTournament(tournament);
    editForm.reset({
      name: tournament.name,
      description: tournament.description,
      location: tournament.location,
      maxParticipants: tournament.maxParticipants,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
    });
    setShowEditDialog(true);
  };

  // Check if user is admin
  const isAdmin = (user as any)?.role === 'admin';

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

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<any[]>({
    queryKey: ["/api/tournaments"],
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

  // Create tournament form
  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      maxParticipants: 32,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (data: CreateTournamentForm) => {
      console.log("Sending tournament data to API:", data);
      const response = await apiRequest("POST", "/api/tournaments", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тэмцээн амжилттай үүсгэгдлээ",
      });
      setShowCreateDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
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
        description: "Тэмцээн үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  // Register for tournament mutation
  const registerMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest("POST", `/api/tournaments/${tournamentId}/register`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тэмцээнд амжилттай бүртгэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
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
        description: "Тэмцээнд бүртгүүлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTournamentForm) => {
    console.log("Submitting tournament data:", data);
    createTournamentMutation.mutate(data);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Тэмцээнүүд</h1>
            <p className="text-gray-600">Идэвхтэй болон удахгүй болох тэмцээнүүд</p>
          </div>
          
          {((user as any)?.role === 'admin' || (user as any)?.role === 'club_owner') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="mtta-green text-white hover:bg-mtta-green-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Тэмцээн үүсгэх
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Шинэ тэмцээн үүсгэх</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тэмцээний нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Жишээ: Өвлийн Аварга Шалгаруулалт" {...field} />
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
                            <Textarea placeholder="Тэмцээний тухай дэлгэрэнгүй мэдээлэл..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Эхлэх огноо</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: mn })
                                    ) : (
                                      <span>Огноо сонгоно уу</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Дуусах огноо</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: mn })
                                    ) : (
                                      <span>Огноо сонгоно уу</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < form.getValues().startDate
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Байршил</FormLabel>
                            <FormControl>
                              <Input placeholder="МУИС, УБ Спорт..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дээд оролцогчдын тоо</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="32" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
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
                        disabled={createTournamentMutation.isPending}
                        onClick={() => console.log("Submit button clicked", form.getValues())}
                      >
                        {createTournamentMutation.isPending ? "Үүсгэж байна..." : "Тэмцээн үүсгэх"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Tournament Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Тэмцээн засварлах</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => {
                if (editingTournament) {
                  updateTournamentMutation.mutate({ id: editingTournament.id, tournament: data });
                }
              })} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тэмцээний нэр</FormLabel>
                      <FormControl>
                        <Input placeholder="Жишээ: Өвлийн Аварга Шалгаруулалт" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тайлбар</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Тэмцээний тухай дэлгэрэнгүй мэдээлэл..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Эхлэх огноо</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: mn })
                                ) : (
                                  <span>Огноо сонгоно уу</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Дуусах огноо</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: mn })
                                ) : (
                                  <span>Огноо сонгоно уу</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < editForm.getValues().startDate
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Байршил</FormLabel>
                        <FormControl>
                          <Input placeholder="МУИС, УБ Спорт..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дээд оролцогчдын тоо</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="32" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
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
                    onClick={() => setShowEditDialog(false)}
                  >
                    Цуцлах
                  </Button>
                  <Button 
                    type="submit" 
                    className="mtta-green text-white hover:bg-mtta-green-dark"
                    disabled={updateTournamentMutation.isPending}
                  >
                    {updateTournamentMutation.isPending ? "Засварлаж байна..." : "Хадгалах"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Tournament List */}
        {tournamentsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
            <p className="text-gray-600">Тэмцээнүүдийг уншиж байна...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Тэмцээн байхгүй байна</h3>
            <p className="text-gray-600 mb-6">Одоогоор идэвхтэй тэмцээн байхгүй байна</p>
            {((user as any)?.role === 'admin' || (user as any)?.role === 'club_owner') && (
              <Button 
                className="mtta-green text-white hover:bg-mtta-green-dark"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Анхны тэмцээн үүсгэх
              </Button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Tournament Cards */}
            <div className="lg:col-span-2 space-y-6">
              {tournaments.map((tournament: any) => (
                <Card key={tournament.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900">{tournament.name}</CardTitle>
                        <p className="text-gray-600 mt-1">{tournament.description}</p>
                      </div>
                      <Badge 
                        variant={tournament.status === 'ongoing' ? 'default' : tournament.status === 'completed' ? 'secondary' : 'outline'}
                        className={tournament.status === 'ongoing' ? 'mtta-green text-white' : ''}
                      >
                        {tournament.status === 'registration' ? 'Бүртгэл' : 
                         tournament.status === 'ongoing' ? 'Идэвхтэй' : 'Дууссан'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-mtta-green" />
                        <div>
                          <p className="font-medium">Эхлэх огноо</p>
                          <p>{new Date(tournament.startDate).toLocaleDateString('mn-MN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-mtta-green" />
                        <div>
                          <p className="font-medium">Дуусах огноо</p>
                          <p>{new Date(tournament.endDate).toLocaleDateString('mn-MN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-mtta-green" />
                        <div>
                          <p className="font-medium">Байршил</p>
                          <p>{tournament.location || 'Тодорхойгүй'}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-mtta-green" />
                        <div>
                          <p className="font-medium">Оролцогчид</p>
                          <p>{tournament.maxParticipants} хүртэл</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        className="mtta-green text-white hover:bg-mtta-green-dark"
                        onClick={() => setSelectedTournament(tournament.id)}
                      >
                        Дэлгэрэнгүй үзэх
                      </Button>
                      
                      {tournament.status === 'registration' && (user as any)?.role === 'player' && (
                        <Button 
                          variant="outline"
                          onClick={() => registerMutation.mutate(tournament.id)}
                          disabled={registerMutation.isPending}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {registerMutation.isPending ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                        </Button>
                      )}

                      {/* Admin Controls */}
                      {isAdmin && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleEditTournament(tournament)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Засах
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              if (confirm('Энэ тэмцээнийг устгахдаа итгэлтэй байна уу?')) {
                                deleteTournamentMutation.mutate(tournament.id);
                              }
                            }}
                            disabled={deleteTournamentMutation.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            🗑️ Устгах
                          </Button>
                        </>
                      )}

                      {((user as any)?.role === 'admin' || (user as any)?.role === 'score_recorder') && (
                        <Button variant="outline">
                          <Settings className="mr-2 h-4 w-4" />
                          Удирдах
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tournament Bracket Sidebar */}
            <div>
              {selectedTournament ? (
                <TournamentBracket tournamentId={selectedTournament} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                      Тэмцээний Схем
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Тэмцээн сонгож схемийг үзнэ үү</p>
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
