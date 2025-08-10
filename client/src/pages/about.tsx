import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Target, Users, Award } from "lucide-react";
import PageWithLoading from "@/components/PageWithLoading";

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("history");

  // Handle URL hash changes to switch tabs
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['history', 'goals', 'management', 'leadership'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.pushState(null, '', `#${value}`);
  };

  return (
    <PageWithLoading>
      <div className="main-bg">
        {/* Sticky Navigation Bar for About Page Sections */}
        <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center md:justify-start items-center py-3 space-x-2 md:space-x-6">
              <span className="text-xs text-gray-500 mr-2 hidden md:inline">Хэсгүүд:</span>
              <a 
                href="#history" 
                className={`text-xs md:text-sm px-2 py-1 rounded transition-colors ${
                  activeTab === 'history' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-green-400'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('history');
                  document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Танилцуулга
              </a>
              <a 
                href="#goals" 
                className={`text-xs md:text-sm px-2 py-1 rounded transition-colors ${
                  activeTab === 'goals' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-green-400'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('goals');
                  document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Бидний зорилго
              </a>
              <a 
                href="#management" 
                className={`text-xs md:text-sm px-2 py-1 rounded transition-colors ${
                  activeTab === 'management' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-green-400'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('management');
                  document.getElementById('management')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Түүхэн замнал
              </a>
              <a 
                href="#leadership" 
                className={`text-xs md:text-sm px-2 py-1 rounded transition-colors ${
                  activeTab === 'leadership' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-green-400'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('leadership');
                  document.getElementById('leadership')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Захирлуудын зөвлөл
              </a>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text">
              Бидний тухай
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Монголын ширээний теннисний холбооны тухай дэлгэрэнгүй мэдээлэл
            </p>
            <Separator className="my-8" />
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <History className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Танилцуулга</span>
                <span className="sm:hidden">Танил</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Target className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Бидний зорилго</span>
                <span className="sm:hidden">Зорилго</span>
              </TabsTrigger>
              <TabsTrigger 
                value="management" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Түүхэн замнал</span>
                <span className="sm:hidden">Түүх</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leadership" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Award className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Захирлуудын зөвлөл</span>
                <span className="sm:hidden">Зөвлөл</span>
              </TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history" id="history">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <History className="w-6 h-6 mr-3 text-green-400" />
                    Танилцуулга
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Монголын ширээний теннисний холбооны тухай ерөнхий мэдээлэл
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Холбооны тухай</h3>
                    <p className="leading-relaxed">
                      Монголын ширээний теннисний холбоо нь 1965 онд байгуулагдсан бөгөөд тэр цагаас хойш 
                      Монгол орны ширээний теннисний спортыг хөгжүүлэх чиглэлээр үйл ажиллагаа явуулж ирсэн. 
                      Холбоо нь Олон улсын ширээний теннисний холбоо (ITTF)-ын гишүүн байдаг.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Зорилго, зорилт</h3>
                    <p className="leading-relaxed">
                      Манай холбоо нь Монгол орны ширээний теннисний спортыг олон улсын түвшинд хүргэх, 
                      залуучуудыг спортын үйл ажиллагаанд татан оролцуулах, эрүүл амьдрах дадлыг төлөвшүүлэх 
                      зорилготой ажиллаж байна.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Байгуулагдсан</h4>
                      <p>1965 он</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Гишүүдийн тоо</h4>
                      <p>500+ тамирчин</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Клубын тоо</h4>
                      <p>15+ клуб</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Олон улсын гишүүнчлэл</h4>
                      <p>ITTF гишүүн</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" id="goals">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Target className="w-6 h-6 mr-3 text-green-400" />
                    Бидний зорилго
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Холбооны стратеги зорилго болон үйл ажиллагааны чиглэл
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-6">
                  <div className="grid gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">01</Badge>
                        Спортын хөгжил
                      </h3>
                      <p className="leading-relaxed">
                        Монгол орны ширээний теннисний спортыг олон улсын түвшинд хүргэж, 
                        дэлхийн тэмцээнд амжилттай оролцох боломжийг бүрдүүлэх.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">02</Badge>
                        Залуучуудын хөгжил
                      </h3>
                      <p className="leading-relaxed">
                        Залуу үеийнхнийг спортын үйл ажиллагаанд татан оролцуулж, 
                        эрүүл амьдрах дадал, хамт олны ухамсрыг төлөвшүүлэх.
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">03</Badge>
                        Олон улсын хамтын ажиллагаа
                      </h3>
                      <p className="leading-relaxed">
                        Олон улсын ширээний теннисний холбоотой хамтран ажиллаж, 
                        дэлхийн шилдэг туршлагыг нутагшуулах.
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">04</Badge>
                        Дэд бүтцийн хөгжил
                      </h3>
                      <p className="leading-relaxed">
                        Орон нутагт ширээний теннисний спортын дэд бүтцийг хөгжүүлж, 
                        тамирчдад тохиромжтой нөхцөлийг бүрдүүлэх.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" id="management">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-green-400" />
                    Түүхэн замнал
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Холбооны түүхэн хөгжлийн тэмдэглэл үеүүд
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <div className="space-y-8">
                    <div className="relative pl-8 border-l-2 border-green-400">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full -left-2 top-0"></div>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-2">1965 он</h3>
                        <h4 className="text-lg text-green-400 mb-3">Холбооны байгуулалт</h4>
                        <p className="leading-relaxed">
                          Монголын ширээний теннисний холбоо албан ёсоор байгуулагдаж, 
                          тэр үеийн спортын төлөөлөгчдөөр анхны удирдлага байгуулагдсан.
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-8 border-l-2 border-green-400">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full -left-2 top-0"></div>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-2">1970-аад он</h3>
                        <h4 className="text-lg text-green-400 mb-3">Анхны олон улсын тэмцээн</h4>
                        <p className="leading-relaxed">
                          Монголын тамирчид анх удаа олон улсын тэмцээнд оролцож, 
                          ITTF-ийн гишүүнчлэлд элссэн түүхэн үе.
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-8 border-l-2 border-green-400">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full -left-2 top-0"></div>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-2">1990-ээд он</h3>
                        <h4 className="text-lg text-green-400 mb-3">Спортын шинэчлэл</h4>
                        <p className="leading-relaxed">
                          Ардчилсан засаглалын үед холбооны үйл ажиллагаа шинэчлэгдэж, 
                          орчин үеийн менежментийн систем нэвтэрсэн.
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-8 border-l-2 border-green-400">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full -left-2 top-0"></div>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-2">2000-аад он</h3>
                        <h4 className="text-lg text-green-400 mb-3">Дижитал шилжилт</h4>
                        <p className="leading-relaxed">
                          Орчин үеийн технологийг ашиглан холбооны үйл ажиллагааг 
                          цахимжуулж, олон нийтэд ойртох үйл ажиллагаа эхэлсэн.
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full -left-2 top-0"></div>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-2">2020-оод он</h3>
                        <h4 className="text-lg text-green-400 mb-3">Шинэ эрин үе</h4>
                        <p className="leading-relaxed">
                          Цахим платформ ашиглан тэмцээн зохион байгуулах, 
                          онлайн бүртгэл, статистик хөтлөх шинэ систем нэвтрүүлсэн.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leadership Tab */}
            <TabsContent value="leadership" id="leadership">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Award className="w-6 h-6 mr-3 text-green-400" />
                    Захирлуудын зөвлөл
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Холбооны удирдлагын бүрэлдэхүүн болон үүрэг хариуцлага
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Б.Болдбаатар</h3>
                        <p className="text-green-400">Ерөнхий дарга</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• Холбооны ерөнхий удирдлага</li>
                        <li>• Стратегийн чиглэл тодорхойлолт</li>
                        <li>• Олон улсын харилцаа</li>
                      </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Г.Ганбаатар</h3>
                        <p className="text-green-400">Гүйцэтгэх захирал</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• Өдөр тутмын үйл ажиллагаа</li>
                        <li>• Тэмцээн зохион байгуулалт</li>
                        <li>• Клубуудтай хамтын ажиллагаа</li>
                      </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <History className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">С.Сайханбилэг</h3>
                        <p className="text-green-400">Дэд дарга</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• Тамирчдын хөгжлийн хөтөлбөр</li>
                        <li>• Дасгалжуулагчдын сургалт</li>
                        <li>• Техникийн дэмжлэг</li>
                      </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Д.Долгорсүрэн</h3>
                        <p className="text-green-400">Нарийн бичгийн дарга</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>• Холбооны албан бичиг</li>
                        <li>• Гишүүдийн бүртгэл</li>
                        <li>• Мэдээллийн удирдлага</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Зөвлөлийн гишүүд</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-green-400 mb-2">Техникийн хэсэг</h4>
                        <ul className="space-y-1">
                          <li>• Б.Мөнхбат - Ахлах дасгалжуулагч</li>
                          <li>• Т.Түмэнжаргал - Шүүгч</li>
                          <li>• Ө.Одгэрэл - Техникийн зөвлөх</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-400 mb-2">Удирдлагын хэсэг</h4>
                        <ul className="space-y-1">
                          <li>• Ж.Жавхлан - Санхүүгийн захирал</li>
                          <li>• Р.Равданжав - Хууль зүйч</li>
                          <li>• Н.Нарантуяа - Хөгжлийн захирал</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-400 mb-2">Клубын төлөөлөл</h4>
                        <ul className="space-y-1">
                          <li>• П.Пүрэвсүрэн - УБ клуб</li>
                          <li>• Ч.Чимэддорж - Дархан клуб</li>
                          <li>• Б.Батбаяр - Эрдэнэт клуб</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
};

export default AboutPage;