import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/logo.svg";

const registerSchema = z.object({
  email: z.string().email("И-мэйл хаягаа зөв оруулна уу").optional().or(z.literal("")),
  phone: z.string().min(8, "Утасны дугаар хамгийн багадаа 8 тэмдэгт байх ёстой").optional().or(z.literal("")),
  firstName: z.string().min(1, "Нэрээ оруулна уу"),
  lastName: z.string().min(1, "Овгоо оруулна уу"),
  role: z.enum(["player", "club_owner"], {
    required_error: "Төрлөө сонгоно уу",
  }),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "И-мэйл эсвэл утасны дугаар заавал оруулна уу",
    path: ["email"],
  }
);

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      role: "player",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
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
                    <FormLabel>Утасны дугаар</FormLabel>
                    <FormControl>
                      <Input placeholder="99887766" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Төрөл</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Төрлөө сонгоно уу" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player">Тоглогч</SelectItem>
                        <SelectItem value="club_owner">Клубын эзэн</SelectItem>
                      </SelectContent>
                    </Select>
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