import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Target, Users, Award } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { useQuery } from "@tanstack/react-query";

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const { data: members = [] } = useQuery<any[]>({ queryKey: ["/api/federation-members"] });

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
      <Navigation />
      <div className="main-bg">

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
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-800 border-gray-700 sticky top-16 z-30">
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
                <span className="hidden sm:inline">Холбооны гишүүд</span>
                <span className="sm:hidden">Гишүүд</span>
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
                  <div className="grid md:grid-cols-2 gap-6">
                    {members.map((member) => (
                      <div key={member.id} className="bg-gray-800 p-6 rounded-lg">
                        <div className="text-center mb-4">
                          {member.imageUrl && (
                            <img src={member.imageUrl} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                          )}
                          <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                          <p className="text-green-400">{member.position}</p>
                        </div>
                      </div>
                    ))}
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
                    Холбооны гишүүд
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Холбооны гишүүдийн бүрэлдэхүүн болон үүрэг хариуцлага
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <div className="grid md:grid-cols-2 gap-6">
                    {members.map((member) => (
                      <div key={member.id} className="bg-gray-800 p-6 rounded-lg">
                        <div className="text-center mb-4">
                          {member.imageUrl && (
                            <img src={member.imageUrl} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                          )}
                          <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                          <p className="text-green-400">{member.position}</p>
                        </div>
                      </div>
                    ))}
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