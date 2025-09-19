
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

const forgotPasswordSchema = z.object({
  email: z.string().email("И-мэйл хаягаа зөв оруулна уу"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      setIsEmailSent(true);
      toast({
        title: "Амжилттай илгээлээ",
        description: "Нууц үг сэргээх код таны и-мэйлд илгээгдлээ.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtta-green/20 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="MTTA Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Нууц үг сэргээх
          </CardTitle>
          <CardDescription>
            {isEmailSent 
              ? "И-мэйлээ шалгаж нууц үг сэргээх холбоосоор дарна уу"
              : "И-мэйл хаягаа оруулж нууц үг сэргээх код авна уу"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEmailSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>И-мэйл хаяг</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="example@email.com" 
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
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Илгээж байна..." : "Код илгээх"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Нууц үг сэргээх заавар таны и-мэйлд илгээгдлээ. 
                И-мэйлээ шалгаж холбоосоор дарна уу.
              </p>
              <Button 
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Дахин илгээх
              </Button>
            </div>
          )}

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
