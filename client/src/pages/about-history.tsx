
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Trophy, Users, Award, Globe, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AboutHistory() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleItems(prev => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.2 }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const timelineEvents = [
    {
      year: '1965',
      title: 'Холбоо байгуулагдсан',
      description: 'Монголын ширээний теннисний холбоо анх байгуулагдав',
      category: 'foundation',
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      year: '1970',
      title: 'Эхний тэмцээн',
      description: 'Улсын хэмжээний анхны ширээний теннисний тэмцээн зохион байгуулав',
      category: 'achievement',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      year: '1990',
      title: 'ITTF-д элссэн',
      description: 'Олон улсын ширээний теннисний холбооны гишүүн болсон',
      category: 'international',
      icon: <Globe className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      year: '2000',
      title: 'Клубын системийг бий болгосон',
      description: 'Орон нутагт клубын системийг бий болгож, залуучуудын дунд спортыг өргөн дэлгэрүүлсэн',
      category: 'development',
      icon: <Award className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600'
    },
    {
      year: '2024',
      title: 'Шинэ стратегийн төлөвлөгөө',
      description: '2030 хүртэлх хөгжлийн стратегийн төлөвлөгөө батлагдаж, ирээдүйн зорилтыг тодорхойлсон',
      category: 'development',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-pink-500 to-pink-600'
    }
  ];

  useEffect(() => {
    const elements = document.querySelectorAll('[data-timeline-item]');
    elements.forEach((el) => observerRef.current?.observe(el));
    
    return () => {
      elements.forEach((el) => observerRef.current?.unobserve(el));
    };
  }, []);

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg min-h-screen py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 glow-text">
              Түүхэн замнал
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Монголын ширээний теннисний холбооны хөгжлийн түүх
            </p>
          </div>

          {/* Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-400 via-blue-500 to-purple-600 opacity-30"></div>

            {/* Timeline Items */}
            <div className="space-y-24">
              {timelineEvents.map((event, index) => {
                const isLeft = index % 2 === 0;
                const isVisible = visibleItems.has(index);
                
                return (
                  <div
                    key={event.year}
                    data-timeline-item
                    data-index={index}
                    className={`relative transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    {/* Year Badge - Center */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${event.color} flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-900`}>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{event.year}</div>
                        </div>
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`w-full ${isLeft ? 'pr-[55%]' : 'pl-[55%]'}`}>
                      <Card 
                        className={`card-dark transform transition-all duration-500 hover:scale-105 ${
                          isLeft ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        <CardContent className="p-8">
                          <div className={`flex items-start gap-4 ${isLeft ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                            <div className={`p-4 rounded-2xl bg-gradient-to-br ${event.color} text-white flex-shrink-0`}>
                              {event.icon}
                            </div>
                            <div className="flex-1">
                              <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {event.title}
                                </h3>
                                <Badge 
                                  variant="outline" 
                                  className={`bg-gradient-to-r ${event.color} text-white border-none`}
                                >
                                  {event.category}
                                </Badge>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                {event.description}
                              </p>
                              
                              {/* Decorative Icon */}
                              <div className={`mt-4 ${isLeft ? 'text-right' : 'text-left'}`}>
                                <CalendarIcon className={`w-5 h-5 inline-block opacity-50 bg-gradient-to-r ${event.color} bg-clip-text text-transparent`} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Connecting Dot */}
                    <div className={`absolute top-12 ${isLeft ? 'right-1/2 mr-12' : 'left-1/2 ml-12'} w-4 h-4 rounded-full bg-gradient-to-br ${event.color} z-10`}></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Footer */}
          <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">60+</div>
              <div className="text-gray-700 dark:text-gray-300">Жилийн туршлага</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-700 dark:text-gray-300">Тамирчин</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">15+</div>
              <div className="text-gray-700 dark:text-gray-300">Клуб</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">100+</div>
              <div className="text-gray-700 dark:text-gray-300">Тэмцээн</div>
            </div>
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
