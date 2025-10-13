
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Trophy, Users, Award, Globe } from "lucide-react";

export default function AboutHistory() {
  const timelineEvents = [
    {
      year: '1965',
      title: 'Холбоо байгуулагдсан',
      description: 'Монголын ширээний теннисний холбоо анх байгуулагдав',
      category: 'foundation',
      icon: <Users className="w-5 h-5" />
    },
    {
      year: '1970',
      title: 'Эхний тэмцээн',
      description: 'Улсын хэмжээний анхны ширээний теннисний тэмцээн зохион байгуулав',
      category: 'achievement',
      icon: <Trophy className="w-5 h-5" />
    },
    {
      year: '1990',
      title: 'ITTF-д элссэн',
      description: 'Олон улсын ширээний теннисний холбооны гишүүн болсон',
      category: 'international',
      icon: <Globe className="w-5 h-5" />
    },
    {
      year: '2000',
      title: 'Клубын системийг бий болгосон',
      description: 'Орон нутагт клубын системийг бий болгож, залуучуудын дунд спортыг өргөн дэлгэрүүлсэн',
      category: 'development',
      icon: <Award className="w-5 h-5" />
    },
    {
      year: '2024',
      title: 'Шинэ стратегийн төлөвлөгөө',
      description: '2030 хүртэлх хөгжлийн стратегийн төлөвлөгөө батлагдаж, ирээдүйн зорилтыг тодорхойлсон',
      category: 'development',
      icon: <Trophy className="w-5 h-5" />
    }
  ];

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Түүхэн замнал
          </h1>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-green-400 via-green-500 to-green-600 h-full rounded-full"></div>

            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div key={event.year} className="relative flex items-center">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-4 border-white shadow-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-white font-bold text-sm">{event.year}</div>
                        </div>
                      </div>
                    </div>

                    <div className={`w-full ${isLeft ? 'pr-16 text-right' : 'pl-16 text-left'}`}>
                      <div className={`inline-block ${isLeft ? 'ml-auto' : ''}`}>
                        <Card className="card-dark max-w-md hover:scale-105 transition-transform duration-300">
                          <CardHeader className="pb-3">
                            <div className={`flex items-center gap-3 ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className="p-2 rounded-full bg-green-600 text-white">
                                {event.icon}
                              </div>
                              <div className={isLeft ? 'text-right' : 'text-left'}>
                                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-green-400" />
                                  {event.title}
                                </CardTitle>
                                <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {event.category}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {event.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
