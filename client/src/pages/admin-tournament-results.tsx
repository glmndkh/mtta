import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, Users, Target, Plus, Edit3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";

const matchResultSchema = z.object({
  winnerId: z.string().min(1, "Ялагч сонгоно уу"),
  sets: z.array(z.object({
    setNumber: z.number(),
    player1Score: z.number().min(0),
    player2Score: z.number().min(0)
  })).min(1, "Хамгийн багадаа 1 сет оруулна уу")
});

export default function AdminTournamentResults() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      toast({
        title: "Хандах эрхгүй",
        description: "Зөвхөн админ хэрэглэгч энэ хуудсыг үзэх боломжтой",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["/api/tournaments"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  
  // Fetch matches for selected tournament
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/admin/tournaments", selectedTournamentId, "matches"],
    enabled: !!selectedTournamentId && isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  // Form for updating match results
  const form = useForm({
    resolver: zodResolver(matchResultSchema),
    defaultValues: {
      winnerId: "",
      sets: [{ setNumber: 1, player1Score: 0, player2Score: 0 }]
    }
  });

  // Mutation for updating match results
  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, data }: { matchId: string; data: any }) => {
      await apiRequest(`/api/matches/${matchId}/result`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Тоглолтын үр дүн шинэчлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tournaments", selectedTournamentId, "matches"] });
      form.reset();
    },
    onError: (error) => {
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
        description: "Үр дүн шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any, matchId: string) => {
    updateMatchMutation.mutate({ matchId, data });
  };

  if (isLoading || tournamentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Тэмцээний Үр Дүн Оруулах</h1>
          <p className="text-gray-600">Тэмцээний тоглолтуудын үр дүн оруулж, тоглогчдын статистик шинэчлэх</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tournament Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                  Тэмцээн Сонгох
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournaments.map((tournament: any) => (
                    <div
                      key={tournament.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTournamentId === tournament.id
                          ? 'border-mtta-green bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTournamentId(tournament.id)}
                    >
                      <h3 className="font-medium text-gray-900">{tournament.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant={tournament.status === 'ongoing' ? "default" : "secondary"}
                          className={tournament.status === 'ongoing' ? "mtta-green text-white" : ""}
                        >
                          {tournament.status === 'registration' ? 'Бүртгэл' :
                           tournament.status === 'ongoing' ? 'Явагдаж байгаа' : 'Дууссан'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('mn-MN') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournament Matches */}
          <div className="lg:col-span-2">
            {selectedTournamentId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-mtta-green" />
                    Тоглолтын Жагсаалт
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matchesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtta-green mx-auto mb-2"></div>
                      <p className="text-gray-600">Тоглолтууд уншиж байна...</p>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Тоглолт байхгүй байна</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matches.map((match: any) => (
                        <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {match.player1?.user?.firstName} {match.player1?.user?.lastName} vs{' '}
                                {match.player2?.user?.firstName} {match.player2?.user?.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Шаталт: {match.round || 'Тодорхойгүй'} • 
                                Огноо: {match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString('mn-MN') : 'Тодорхойгүй'}
                              </p>
                            </div>
                            <Badge 
                              variant={match.status === 'completed' ? "default" : "secondary"}
                              className={match.status === 'completed' ? "mtta-green text-white" : ""}
                            >
                              {match.status === 'scheduled' ? 'Товлогдсон' :
                               match.status === 'ongoing' ? 'Явагдаж байгаа' : 'Дууссан'}
                            </Badge>
                          </div>

                          {match.status === 'completed' ? (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-green-800">
                                Ялагч: {match.winner?.user?.firstName} {match.winner?.user?.lastName}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Сетүүд: {match.sets?.length || 0} сет
                              </p>
                            </div>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="mtta-green text-white hover:bg-mtta-green-dark">
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Үр дүн оруулах
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Тоглолтын Үр Дүн Оруулах</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                  <form onSubmit={form.handleSubmit((data) => onSubmit(data, match.id))} className="space-y-4">
                                    <FormField
                                      control={form.control}
                                      name="winnerId"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Ялагч</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Ялагч сонгоно уу" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value={match.player1Id}>
                                                {match.player1?.user?.firstName} {match.player1?.user?.lastName}
                                              </SelectItem>
                                              <SelectItem value={match.player2Id}>
                                                {match.player2?.user?.firstName} {match.player2?.user?.lastName}
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <div className="space-y-3">
                                      <Label>Сетүүдийн оноо</Label>
                                      {[1, 2, 3].map((setNumber) => (
                                        <div key={setNumber} className="grid grid-cols-3 gap-2 items-center">
                                          <Label className="text-sm">Сет {setNumber}:</Label>
                                          <Input
                                            type="number"
                                            placeholder={`${match.player1?.user?.firstName?.charAt(0) || 'A'}`}
                                            {...form.register(`sets.${setNumber - 1}.player1Score`, { valueAsNumber: true })}
                                          />
                                          <Input
                                            type="number"
                                            placeholder={`${match.player2?.user?.firstName?.charAt(0) || 'B'}`}
                                            {...form.register(`sets.${setNumber - 1}.player2Score`, { valueAsNumber: true })}
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <Button
                                      type="submit"
                                      className="w-full mtta-green text-white hover:bg-mtta-green-dark"
                                      disabled={updateMatchMutation.isPending}
                                    >
                                      {updateMatchMutation.isPending ? "Хадгалж байна..." : "Үр дүн хадгалах"}
                                    </Button>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Тэмцээн сонгоно уу</h3>
                  <p className="text-gray-600">Үр дүн оруулахын тулд зүүн талаас тэмцээн сонгоно уу</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}