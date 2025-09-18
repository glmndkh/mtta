import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/logo.svg";

const registerSchema = z.object({
  firstName: z.string().min(1, "Нэрээ оруулна уу"),
  lastName: z.string().min(1, "Овгоо оруулна уу"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Хүйсээ сонгоно уу",
  }),
  dateOfBirth: z.string().min(1, "Төрсөн огноогоо оруулна уу"),
  phone: z.string().optional(),
  email: z.string().email("И-мэйл хаягаа зөв оруулна уу"),
  clubId: z.string().optional(),
  noClub: z.boolean().default(false),
  clubAffiliation: z.string().optional(),
  password: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой"),
  confirmPassword: z.string().min(1, "Нууц үгээ баталгаажуулна уу"),
  rank: z.enum([
    "зэрэггүй",
    "3-р зэрэг",
    "2-р зэрэг",
    "1-р зэрэг",
    "спортын дэд мастер",
    "спортын мастер",
    "олон улсын хэмжээний мастер",
  ]).optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  }
).refine(
  (data) => data.noClub || data.clubId || data.clubAffiliation,
  {
    message: "Клуб сонгоно уу эсвэл 'Клубгүй' гэдгийг тэмдэглэнэ үү",
    path: ["clubId"],
  }
);

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const [, setRankProof] = useState<File | null>(null);
  const [clubSearch, setClubSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<any>(null);

  // Fetch clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const response = await apiRequest('/api/clubs');
      if (!response.ok) throw new Error('Failed to fetch clubs');
      return response.json();
    },
  });

  // Filter clubs based on search
  const filteredClubs = clubs.filter((club: any) => 
    club.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
    (club.province && club.province.toLowerCase().includes(clubSearch.toLowerCase())) ||
    (club.city && club.city.toLowerCase().includes(clubSearch.toLowerCase()))
  );

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      dateOfBirth: "",
      phone: "",
      email: "",
      clubId: "",
      noClub: false,
      clubAffiliation: "",
      password: "",
      confirmPassword: "",
      rank: undefined,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Бүртгэлд алдаа гарлаа");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгэгдлээ",
        description: "Таны бүртгэл амжилттай үүсгэгдлээ. Та одоо нэвтэрч орох боломжтой.",
      });
      // Redirect to login page
      window.location.href = "/login";
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtta-green/20 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="MTTA Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Бүртгүүлэх
          </CardTitle>
          <CardDescription>
            Монголын Ширээний Теннисний Холбоонд бүртгүүлэх
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нэр</FormLabel>
                      <FormControl>
                        <Input placeholder="Батбаяр" {...field} />
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
                        <Input placeholder="Доржпүрэв" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хүйс</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Хүйсээ сонгоно уу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Эр</SelectItem>
                        <SelectItem value="female">Эм</SelectItem>
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>И-мэйл хаяг</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} />
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
                    <FormLabel>Утасны дугаар <span className="text-gray-500 text-sm">(заавал биш)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+976 xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Club Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="noClub"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("clubId", "");
                              setSelectedClub(null);
                              setClubSearch("");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Клубд харьяалагддаггүй
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {!form.watch("noClub") && (
                  <div className="space-y-2">
                    <Label>Клуб сонгох</Label>
                    <Select onValueChange={(value) => {
                      if (value) {
                        const club = clubs.find((c: any) => c.id === value);
                        if (club) {
                          setSelectedClub(club);
                          form.setValue("clubId", club.id);
                        }
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Клуб сонгоно уу" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club: any) => (
                          <SelectItem key={club.id} value={club.id}>
                            <div>
                              <div className="font-medium">{club.name}</div>
                              {(club.province || club.city) && (
                                <div className="text-sm text-gray-500">
                                  {[club.province, club.city].filter(Boolean).join(", ")}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedClub && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="font-medium text-green-800">{selectedClub.name}</div>
                        {(selectedClub.province || selectedClub.city) && (
                          <div className="text-sm text-green-600">
                            {[selectedClub.province, selectedClub.city].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                    <FormField
                      control={form.control}
                      name="clubId"
                      render={() => (
                        <FormItem>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.watch("noClub") && (
                  <FormField
                    control={form.control}
                    name="clubAffiliation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тоглодог газар <span className="text-gray-500 text-sm">(заавал биш)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Их сургуулийн спорт заал, хувийн дасгалжуулагч г.м" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Зэрэг <span className="text-gray-500 text-sm">(заавал биш)</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Зэрэг сонгоно уу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="зэрэггүй">Зэрэггүй</SelectItem>
                        <SelectItem value="3-р зэрэг">3-р зэрэг</SelectItem>
                        <SelectItem value="2-р зэрэг">2-р зэрэг</SelectItem>
                        <SelectItem value="1-р зэрэг">1-р зэрэг</SelectItem>
                        <SelectItem value="спортын дэд мастер">спортын дэд мастер</SelectItem>
                        <SelectItem value="спортын мастер">спортын мастер</SelectItem>
                        <SelectItem value="олон улсын хэмжээний мастер">олон улсын хэмжээний мастер</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="rank-proof">Зэргийн үнэмлэхний зураг <span className="text-gray-500 text-sm">(заавал биш)</span></Label>
                <Input
                  id="rank-proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRankProof(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500">
                  Зэргийн үнэмлэхний зургаа оруулж зэргээ батална уу! (Заавал биш. Таныг зэргээ батлах хүртэл таны оруулсан
                  зэргийг хүчингүйд тооцохыг анхаарна уу)
                </p>
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нууц үг</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нууц үг баталгаажуулах</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mtta-green text-white hover:bg-mtta-green-dark"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Бүртгэж байна..." : "Бүртгүүлэх"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Аль хэдийн бүртгэлтэй юу?{" "}
              <a href="/login" className="text-mtta-green hover:underline font-medium">
                Нэвтрэх
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}