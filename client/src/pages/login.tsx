import { useState } from "react";
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

const loginSchema = z.object({
  contact: z.string().min(1, "И-мэйл эсвэл утасны дугаараа оруулна уу"),
  password: z.string().min(1, "Нууц үгээ оруулна уу"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      contact: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай нэвтэрлээ",
        description: "Та амжилттай нэвтэрлээ.",
      });
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtta-green/20 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="MTTA Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Нэвтрэх
          </CardTitle>
          <CardDescription>
            Монголын Ширээний Теннисний Холбоо
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>И-мэйл эсвэл утасны дугаар</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="example@email.com эсвэл 99887766" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нууц үг</FormLabel>
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
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Бүртгэл байхгүй юу?{" "}
              <a href="/register" className="text-mtta-green hover:underline font-medium">
                Бүртгүүлэх
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}