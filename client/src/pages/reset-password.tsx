
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/logo.svg";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Баталгаажуулах кодоо оруулна уу"),
  password: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой"),
  confirmPassword: z.string().min(1, "Нууц үгээ баталгаажуулна уу"),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  }
);

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [urlToken, setUrlToken] = useState("");

  useEffect(() => {
    // URL-аас token авах
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setUrlToken(token);
      form.setValue('token', token);
    }
  }, []);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const response = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай шинэчлэгдлээ",
        description: "Таны нууц үг амжилттай шинэчлэгдлээ. Одоо нэвтэрч орох боломжтой.",
      });
      // Нэвтрэх хуудас руу шилжүүлэх
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtta-green/20 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="MTTA Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Нууц үг шинэчлэх
          </CardTitle>
          <CardDescription>
            Шинэ нууц үгээ оруулж баталгаажуулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!urlToken && (
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Баталгаажуулах код</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="И-мэйлээр ирсэн кодыг оруулна уу" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Шинэ нууц үг</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        {...field} 
                      />
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
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mtta-green text-white hover:bg-mtta-green-dark"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нэвтрэх хуудас руу буцах?{" "}
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
