import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Building, Trophy, Medal, UserPlus, Info, Menu } from "lucide-react";
import mttaLogo from "@assets/logo_1753961933153.jpg";

export default function Landing() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b-2 border-mtta-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={mttaLogo} alt="MTTA Logo" className="h-10 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-mtta-green">MTTA</h1>
                <p className="text-xs text-gray-600">Монголын Ширээний Теннисний Холбоо</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-mtta-green font-medium">Нүүр хуудас</a>
              <a href="/tournaments" className="text-gray-700 hover:text-mtta-green font-medium">Тэмцээн</a>
              <a href="#" className="text-gray-700 hover:text-mtta-green font-medium">Клубууд</a>
              <a href="#" className="text-gray-700 hover:text-mtta-green font-medium">Лиг</a>
              <a href="#" className="text-gray-700 hover:text-mtta-green font-medium">Мэдээ</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/register">
                <Button variant="outline" className="border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white">
                  Бүртгүүлэх
                </Button>
              </Link>
              <Link href="/login">
                <Button className="mtta-green text-white hover:bg-mtta-green-dark">
                  Нэвтрэх
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-600"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-2">
              <a href="#" className="block text-gray-700 hover:text-mtta-green py-2">Нүүр хуудас</a>
              <a href="/tournaments" className="block text-gray-700 hover:text-mtta-green py-2">Тэмцээн</a>
              <a href="#" className="block text-gray-700 hover:text-mtta-green py-2">Клубууд</a>
              <a href="#" className="block text-gray-700 hover:text-mtta-green py-2">Лиг</a>
              <a href="#" className="block text-gray-700 hover:text-mtta-green py-2">Мэдээ</a>
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Link href="/register">
                  <Button variant="outline" className="w-full border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white">
                    Бүртгүүлэх
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full mtta-green text-white hover:bg-mtta-green-dark">
                    Нэвтрэх
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Hero Section */}
      <section className="relative text-white py-20" style={{
        background: 'linear-gradient(135deg, #45A851 0%, #ffffff 100%)',
        minHeight: '80vh'
      }}>
        <div className="absolute inset-0 opacity-10 bg-[#45A851]"></div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800">Монголын Ширээний Теннисний Холбоо</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-700">
            Мэргэжлийн ширээний теннисний спортыг хөгжүүлж, олон улсын түвшинд тэмцэх боломжийг бүрдүүлэх
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-mtta-green hover:bg-gray-100">
                <UserPlus className="mr-2 h-5 w-5" />
                Бүртгүүлэх
              </Button>
            </Link>
            
          </div>
        </div>
      </section>
      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mtta-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">1,250+</h3>
              <p className="text-gray-600">Тоглогчид</p>
            </div>
            <div className="text-center">
              <div className="mtta-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">45+</h3>
              <p className="text-gray-600">Клубууд</p>
            </div>
            <div className="text-center">
              <div className="mtta-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">120+</h3>
              <p className="text-gray-600">Тэмцээнүүд</p>
            </div>
            <div className="text-center">
              <div className="mtta-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Medal className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">8</h3>
              <p className="text-gray-600">Лигүүд</p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Гишүүнчлэлийн Төлбөр</h2>
            <p className="text-lg text-gray-600">Жилийн гишүүнчлэлийн хөнгөлөлттэй үнэ</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="shadow-lg border-2 border-mtta-green">
              <CardHeader className="flex flex-col space-y-1.5 p-6 from-mtta-green to-mtta-green-dark text-white text-center bg-[#22c35d]">
                <CardTitle className="text-2xl">Насанд хүрэгч</CardTitle>
                <p className="text-3xl font-bold">₮50,000</p>
                <p className="opacity-80">жилийн</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 mtta-green rounded-full mr-3"></div>
                    <span>Бүх тэмцээнд оролцох эрх</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 mtta-green rounded-full mr-3"></div>
                    <span>Клубын дасгалжуулагчтай хамтран ажиллах</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 mtta-green rounded-full mr-3"></div>
                    <span>Тоног төхөөрөмжийн хөнгөлөлт</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 mtta-green rounded-full mr-3"></div>
                    <span>Онлайн статистик хэрэглэх</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                <CardTitle className="text-2xl">12 хүртэлх хүүхэд</CardTitle>
                <p className="text-3xl font-bold">₮24,000</p>
                <p className="opacity-80">жилийн</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Хүүхдийн тэмцээнд оролцох эрх</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Мэргэжлийн дасгалжуулагч</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Хүүхдэд зориулсан тоног төхөөрөмж</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Эцэг эхчүүдэд зориулсан семинар</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-mtta-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={mttaLogo} alt="MTTA Logo" className="h-10 w-auto brightness-200" />
                <div>
                  <h3 className="text-xl font-bold">MTTA</h3>
                  <p className="text-sm opacity-80">Монголын Ширээний Теннисний Холбоо</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Мэргэжлийн ширээний теннисний спортыг хөгжүүлж, олон улсын түвшинд тэмцэх боломжийг бүрдүүлэх зорилгоор үйл ажиллагаа явуулдаг.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Холбоосууд</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-mtta-green transition-colors">Нүүр хуудас</a></li>
                <li><a href="#" className="hover:text-mtta-green transition-colors">Тэмцээнүүд</a></li>
                <li><a href="#" className="hover:text-mtta-green transition-colors">Клубууд</a></li>
                <li><a href="#" className="hover:text-mtta-green transition-colors">Лигүүд</a></li>
                <li><a href="#" className="hover:text-mtta-green transition-colors">Мэдээ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Холбоо барих</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center">
                  <span className="text-mtta-green mr-2">📍</span>
                  Улаанбаатар хот, Сүхбаатар дүүрэг
                </p>
                <p className="flex items-center">
                  <span className="text-mtta-green mr-2">📞</span>
                  +976 11 234567
                </p>
                <p className="flex items-center">
                  <span className="text-mtta-green mr-2">✉️</span>
                  info@mtta.mn
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Биднийг дагаарай</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="w-10 h-10 mtta-green rounded-full flex items-center justify-center hover:bg-mtta-green-dark transition-colors">
                  <span className="text-white font-bold">f</span>
                </a>
                <a href="#" className="w-10 h-10 mtta-green rounded-full flex items-center justify-center hover:bg-mtta-green-dark transition-colors">
                  <span className="text-white font-bold">📷</span>
                </a>
                <a href="#" className="w-10 h-10 mtta-green rounded-full flex items-center justify-center hover:bg-mtta-green-dark transition-colors">
                  <span className="text-white font-bold">▶️</span>
                </a>
              </div>
              <div>
                <h5 className="font-medium mb-2">Мэдээллийн товхимол</h5>
                <div className="flex">
                  <Input 
                    type="email" 
                    placeholder="И-мэйл хаягаа оруулна уу" 
                    className="flex-1 bg-gray-700 text-white border-gray-600 rounded-r-none"
                  />
                  <Button className="mtta-green hover:bg-mtta-green-dark rounded-l-none">
                    📧
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-gray-600" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Монголын Ширээний Теннисний Холбоо. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
