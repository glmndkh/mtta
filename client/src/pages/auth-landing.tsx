import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Users, Calendar, Award } from "lucide-react";

export default function AuthLanding() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (!isLoading && user) {
    setLocation("/home");
    return null;
  }

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    email: "", 
    password: "", 
    firstName: "", 
    lastName: "", 
    phone: "" 
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest('POST', '/api/login', data);
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай нэвтэрлээ!",
        description: "Тавтай морил.",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Нэвтрэх алдаа",
        description: error.message || "И-мэйл эсвэл нууц үг буруу байна",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      return apiRequest('POST', '/api/register', data);
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай бүртгэгдлээ!",
        description: "Тавтай морил.",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Бүртгэлийн алдаа", 
        description: error.message || "Бүртгэлд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Алдаа",
        description: "И-мэйл болон нууц үгээ оруулна уу",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      toast({
        title: "Алдаа",
        description: "Бүх талбарыг бөглөнө үү",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="h-16 w-16 text-green-600 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">MTTA</h1>
                <p className="text-green-600 text-lg">Монголын ширээний теннисний холбоо</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ширээний теннисний орчин үеийн менежмент систем
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                  Тэмцээн удирдах, тоглогчдын профайл, клубын удирдлага болон мэдээллийн нэгдсэн платформ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <Calendar className="h-8 w-8 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Тэмцээний удирдлага</h3>
                    <p className="text-gray-600 text-sm">Тэмцээн зохион байгуулах, бүртгүүлэх, үр дүн оруулах</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Users className="h-8 w-8 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Тоглогчдын профайл</h3>
                    <p className="text-gray-600 text-sm">Тоглогчдын статистик, зэрэглэл, түүхийг хөтлөх</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Trophy className="h-8 w-8 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Клубын удирдлага</h3>
                    <p className="text-gray-600 text-sm">Клубын гишүүдийг удирдах, төлбөр тооцоо</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Award className="h-8 w-8 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Мэдээ мэдээлэл</h3>
                    <p className="text-gray-600 text-sm">Спортын мэдээ, тэмцээний мэдээллийг хуваалцах</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Auth Forms */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">Системд нэвтрэх</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Нэвтрэх</TabsTrigger>
                      <TabsTrigger value="register">Бүртгүүлэх</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">И-мэйл хаяг</Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Нууц үг</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Нэвтэрч байна..." : "Нэвтрэх"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Нэр</Label>
                            <Input
                              id="firstName"
                              value={registerData.firstName}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Нэр"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Овог</Label>
                            <Input
                              id="lastName"
                              value={registerData.lastName}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Овог"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">И-мэйл хаяг</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Утасны дугаар</Label>
                          <Input
                            id="phone"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="99001234"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Нууц үг</Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}