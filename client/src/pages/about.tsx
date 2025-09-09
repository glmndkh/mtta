import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Target, Users, Award, CalendarIcon, Trophy, Globe, Mountain, Eye, HandHeart, ChevronDown, Star, Medal, Crown } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

// Helper function to construct image URLs, potentially handling different base paths or fallbacks
const getImageUrl = (path: string): string => {
  // This is a placeholder. In a real app, you might check environment variables
  // or have more sophisticated logic to determine the correct image path.
  // For now, we'll just return the path as is, and the onError handler will manage fallbacks.
  return path;
};

const AboutPage = () => {
  const { data: members = [] } = useQuery<any[]>({ queryKey: ["/api/federation-members"] });
  const { t } = useLanguage();

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg">

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text">
              Бидний тухай
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Монголын ширээний теннисний холбоо - Спортын хөгжил, залуусын сургалт, олон улсын хамтын ажиллагаа
            </p>
            <div className="flex justify-center">
              <ChevronDown className="w-8 h-8 text-green-400 animate-bounce" />
            </div>
          </div>

          {/* Mission, Vision, Values Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Эрхэм зорилго</h2>
              <div className="w-20 h-1 bg-green-400 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Vision */}
              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mountain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">ЭРХЭМ ЗОРИЛГО</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Монголын ширээний теннисний холбоо нь спортын хөгжил, тамирчдын сургалт, дэмжлэгт чиглэсэн үйл ажиллагаа явуулж, олон улсын хамтын ажиллагааг хөгжүүлнэ.
                  </p>
                </CardContent>
              </Card>

              {/* Mission */}
              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Eye className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">АЛСЫН ХАРАА</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Монгол тамирчдыг олон улсын түвшинд тэмцэж, дэлхийн аварга болж, ширээний теннисийг Монголд түгээмэл спорт болгох зорилготой.
                  </p>
                </CardContent>
              </Card>

              {/* Values */}
              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HandHeart className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4">ҮНЭТ ЗҮЙЛС</h3>
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Спортын ёс зүй</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Хамтын ажиллагаа</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Залуусын дэмжлэг</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Олон улсын стандарт</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Тэргүүлэх арга барил</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Strategic Goals Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Стратегийн зорилтууд</h2>
              <div className="w-20 h-1 bg-green-400 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Спортын хөгжүүлэлт</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Ширээний теннисийг Монголд өргөн дэлгэрүүлж, бүх насны иргэдэд энэ спортыг дэмжиж, тамирчдын техникийг сайжруулах
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Залуусын сургалт</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Залуу тамирчдыг олон улсын түвшинд бэлтгэж, дасгалжуулагчдын чадвар дээшлүүлэх сургалтыг зохион байгуулах
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Олон улсын хамтын ажиллагаа</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    ITTF болон бусад олон улсын байгууллагуудтай хамтын ажиллагааг өргөжүүлж, тамирчдын солилцоог дэмжих
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Timeline Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Он цагийн хэлхээс</h2>
              <div className="w-20 h-1 bg-green-400 mx-auto mb-8"></div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Монголын ширээний теннисний холбооны түүхэн замнал - 1965 онд анх байгуулагдсанаас өнөөг хүртэл спортын хөгжилд оруулсан хувь нэмэр.
              </p>
            </div>
            
            {/* Timeline with horizontal scroll */}
            <div className="relative">
              <div className="flex overflow-x-auto pb-4 space-x-8">
                {[
                  { year: '1965', title: 'Холбоо байгуулагдсан', description: 'Монголын ширээний теннисний холбоо анх байгуулагдав', category: 'foundation' },
                  { year: '1970', title: 'Эхний тэмцээн', description: 'Улсын хэмжээний анхны ширээний теннисний тэмцээн зохион байгуулав', category: 'achievement' },
                  { year: '1990', title: 'ITTF-д элссэн', description: 'Олон улсын ширээний теннисний холбооны гишүүн болсон', category: 'international' },
                  { year: '1993', title: 'Дэлхийн аварга', description: 'Анхны олон улсын тэмцээнд оролцов', category: 'international' },
                  { year: '1994', title: 'Азийн наадам', description: 'Азийн наадамд анх удаа оролцлоо', category: 'achievement' },
                  { year: '1996', title: 'Сургалтын төв', description: 'Үндэсний сургалтын төвийг байгуулсан', category: 'development' },
                  { year: '1997', title: 'Залуучуудын хөтөлбөр', description: 'Залуучуудын хөгжлийн хөтөлбөр эхэлсэн', category: 'development' },
                  { year: '1998', title: 'Эмэгтэйчүүдийн спорт', description: 'Эмэгтэйчүүдийн ширээний теннисийг хөгжүүлэх хөтөлбөр', category: 'development' },
                  { year: '2000', title: 'Олон улсын харилцаа', description: 'Өмнөд Солонгос, Хятадтай хамтын ажиллагаа эхэлсэн', category: 'international' }
                ].map((event, index) => (
                  <div key={event.year} className="flex-shrink-0 w-80">
                    <div className="relative">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                          {event.year}
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-600"></div>
                      </div>
                      <Card className="card-dark">
                        <CardContent className="p-6">
                          <h3 className="text-white font-semibold mb-2">{event.title}</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Leadership Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Удирдлагын баг</h2>
              <div className="w-20 h-1 bg-green-400 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Ц. Гантулга</h3>
                  <p className="text-green-400 text-sm mb-2">Ерөнхийлөгч</p>
                  <p className="text-gray-300 text-xs">Монголын ширээний теннисний хөгжилд 25 жил ажилласан туршлагатай</p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Б. Мөнхбат</h3>
                  <p className="text-green-400 text-sm mb-2">Гүйцэтгэх захирал</p>
                  <p className="text-gray-300 text-xs">Олон улсын тэмцээн, төсөл хэрэгжүүлэх чиглэлийг удирддаг</p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Д. Энхтүүшин</h3>
                  <p className="text-green-400 text-sm mb-2">Сургалтын албаны дарга</p>
                  <p className="text-gray-300 text-xs">Багш, дасгалжуулагчдын сургалт, арга зүйн ажилыг удирддаг</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Organizational Structure Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Бүтэц, зохион байгуулалт</h2>
              <div className="w-20 h-1 bg-green-400 mx-auto"></div>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-lg">
              <div className="flex flex-col items-center space-y-8">
                {/* Top Level */}
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Их хурал
                  </div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Удирдах зөвлөл
                  </div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Тэргүүлэгч
                  </div>
                </div>

                {/* Connecting Lines */}
                <div className="w-px h-8 bg-gray-600"></div>

                {/* Middle Level */}
                <div className="bg-purple-600 text-white px-6 py-3 rounded-lg text-center font-medium">
                  Ерөнхийлөгч
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                {/* Executive Level */}
                <div className="bg-orange-500 text-white px-4 py-2 rounded text-center font-medium">
                  Ажлын захирал
                </div>

                {/* Department Level */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <div className="text-purple-400 font-medium mb-2">Спортын хөгжлийн алба</div>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>Тамирчдын бэлтгэлийн хэлтэс</div>
                      <div>Тэмцээний зохион байгуулалтын хэлтэс</div>
                      <div>Дасгалжуулагчдын сургалтын хэлтэс</div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <div className="text-pink-400 font-medium mb-2">Олон улсын харилцааны алба</div>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>ITTF-тэй харилцах хэлтэс</div>
                      <div>Азийн холбооны харилцааны хэлтэс</div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <div className="text-green-400 font-medium mb-2">Залуучуудын спортын алба</div>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>Сургуулийн спортын хэлтэс</div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <div className="text-blue-400 font-medium mb-2">Захиргааны алба</div>
                  </div>
                </div>

                {/* Bottom Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-orange-600 p-4 rounded text-center">
                    <div className="text-white font-medium mb-2">Клубуудын харилцааны алба</div>
                    <div className="text-gray-200 text-sm">Холбооны гишүүд клубуудтай харилцах</div>
                  </div>

                  <div className="bg-orange-600 p-4 rounded text-center">
                    <div className="text-white font-medium mb-2">Олон нийтийн харилцааны алба</div>
                    <div className="text-gray-200 text-sm">Хэвлэл мэдээлэл, сурталчилгаа</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">60+</div>
                <div className="text-gray-300">Жилийн туршлага</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
                <div className="text-gray-300">Тамирчин</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">15+</div>
                <div className="text-gray-300">Клуб</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">100+</div>
                <div className="text-gray-300">Тэмцээн</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageWithLoading>
  );
};

export default AboutPage;