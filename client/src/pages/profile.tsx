import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "Нэр заавал оруулна уу"),
  lastName: z.string().min(1, "Овог заавал оруулна уу"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Хүйс заавал сонгоно уу",
  }),
  dateOfBirth: z.string().min(1, "Төрсөн огноо заавал оруулна уу"),
  email: z.string().email("Зөв и-мэйл хаяг оруулна уу"),
  phone: z.string().min(8, "Утасны дугаар дор хаяж 8 оронтой байх ёстой"),
  clubAffiliation: z.string().min(1, "Клуб эсвэл тоглодог газрын мэдээлэл заавал оруулна уу"),
  currentPassword: z.string().min(6, "Одоогийн нууц үгээ оруулна уу"),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const [showCredentialWarning, setShowCredentialWarning] = useState(false);
  const [originalCredentials, setOriginalCredentials] = useState<{email: string, phone: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      dateOfBirth: "",
      email: "",
      phone: "",
      clubAffiliation: "",
      currentPassword: "",
    },
  });

  // Update form defaults when user data loads
  React.useEffect(() => {
    if (user && !form.getValues().firstName) {
      const dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '';
      
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gender: user.gender || "male",
        dateOfBirth,
        email: user.email || "",
        phone: user.phone || "",
        clubAffiliation: user.clubAffiliation || "",
        currentPassword: "",
      });

      setOriginalCredentials({
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, form]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Амжилттай",
        description: data.message || "Таны мэдээлэл амжилттай шинэчлэгдлээ",
      });
      
      // Check if credentials changed
      const formValues = form.getValues();
      if (originalCredentials && 
          (formValues.email !== originalCredentials.email || formValues.phone !== originalCredentials.phone)) {
        toast({
          title: "Нэвтрэх мэдээлэл өөрчлөгдлөө",
          description: "Дараагийн удаа нэвтрэхдээ шинэ и-мэйл эсвэл утасны дугаараа ашиглана уу",
          duration: 8000,
        });
      }
      
      setShowCredentialWarning(false);
      form.setValue("currentPassword", ""); // Clear password field
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Алдаа гарлаа",
        description: error.message || "Мэдээлэл шинэчлэхэд алдаа гарлаа",
      });
    },
  });

  const onSubmit = (data: ProfileUpdateForm) => {
    // Check if email or phone changed
    if (originalCredentials && 
        (data.email !== originalCredentials.email || data.phone !== originalCredentials.phone)) {
      if (!showCredentialWarning) {
        setShowCredentialWarning(true);
        return;
      }
    }
    
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    setShowCredentialWarning(false);
    // Reset form to original values
    if (user && originalCredentials) {
      const dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '';
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gender: (user.gender as "male" | "female" | "other") || "male",
        dateOfBirth,
        email: originalCredentials.email,
        phone: originalCredentials.phone,
        clubAffiliation: user.clubAffiliation || "",
        currentPassword: "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Мэдээлэл ачааллаж байна...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Хувийн мэдээлэл засах</CardTitle>
            <CardDescription className="text-center">
              Та өөрийн бүртгэлийн мэдээллийг энд засч болно
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showCredentialWarning && (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Анхааруулга:</strong> Та нэвтрэх и-мэйл эсвэл утасны дугаараа өөрчлөх гэж байна. 
                  Дараагийн удаа нэвтрэхдээ шинэ мэдээллээ ашиглах шаардлагатайг анхаарна уу.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Нэр</FormLabel>
                        <FormControl>
                          <Input placeholder="Нэрээ оруулна уу" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Овог</FormLabel>
                        <FormControl>
                          <Input placeholder="Овгоо оруулна уу" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Хүйс</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Хүйс сонгоно уу" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Эрэгтэй</SelectItem>
                            <SelectItem value="female">Эмэгтэй</SelectItem>
                            <SelectItem value="other">Бусад</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Төрсөн огноо</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>И-мэйл хаяг</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
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
                          <Input placeholder="99887766" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clubAffiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клуб эсвэл тоглодог газар</FormLabel>
                      <FormControl>
                        <Input placeholder="Их сургуулийн спорт заал, Оч клуб г.м" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Аюулгүй байдлын үүднээс мэдээллээ шинэчлэхийн тулд одоогийн нууц үгээ оруулна уу.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Одоогийн нууц үг</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Одоогийн нууц үгээ оруулна уу" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  {showCredentialWarning ? (
                    <>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex-1"
                      >
                        {updateProfileMutation.isPending ? "Шинэчилж байна..." : "Тийм, өөрчлөхийг зөвшөөрч байна"}
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1"
                      >
                        Цуцлах
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full"
                    >
                      {updateProfileMutation.isPending ? "Шинэчилж байна..." : "Мэдээлэл шинэчлэх"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* League Matches Section */}
        <LeagueMatchesSection userId={user?.id} />
      </div>
    </div>
  );
}

// League Matches Component
function LeagueMatchesSection({ userId }: { userId?: string }) {
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  const { data: leagueMatches, isLoading } = useQuery({
    queryKey: [`/api/players/${userId}/league-matches`],
    enabled: !!userId,
  });

  const toggleMatchExpansion = (matchId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  if (!userId) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Лигийн тоглолтууд</CardTitle>
        <CardDescription>
          Таны оролцсон лигийн тоглолтуудын дэлгэрэнгүй мэдээлэл
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Тоглолтууд ачааллаж байна...</div>
        ) : !leagueMatches || leagueMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Танд одоогоор бүртгэгдсэн лигийн тоглолт байхгүй байна.
          </div>
        ) : (
          <div className="space-y-4">
            {leagueMatches.map((match: any) => (
              <Card key={match.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-semibold">
                        {match.team1.name} {match.team1Score}:{match.team2Score} {match.team2.name}
                      </div>
                      {match.matchDate && (
                        <div className="text-sm text-gray-500">
                          {new Date(match.matchDate).toLocaleDateString('mn-MN')}
                          {match.matchTime && ` ${match.matchTime}`}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMatchExpansion(match.id)}
                    >
                      {expandedMatches.has(match.id) ? 'Хаах' : 'Дэлгэрэнгүй үзэх'}
                    </Button>
                  </div>

                  {expandedMatches.has(match.id) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3 text-gray-700">Хувь тоглолтууд:</h4>
                      <div className="space-y-3">
                        {match.playerMatches.map((playerMatch: any, index: number) => (
                          <div key={playerMatch.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">
                                {playerMatch.player1Name} vs {playerMatch.player2Name}
                              </div>
                              <div className="text-sm font-bold">
                                {playerMatch.player1SetsWon}:{playerMatch.player2SetsWon}
                              </div>
                            </div>
                            {playerMatch.sets && playerMatch.sets.length > 0 && (
                              <div className="text-sm text-gray-600">
                                Сетүүд: {playerMatch.sets.map((set: any, setIndex: number) => 
                                  `${set.player1}-${set.player2}`
                                ).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}