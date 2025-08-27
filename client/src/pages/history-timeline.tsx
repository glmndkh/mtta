
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Trophy, Users, Award, Globe } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineEvent {
  year: string;
  titleKey: string;
  descriptionKey: string;
  category: 'foundation' | 'achievement' | 'international' | 'development';
  icon: React.ReactNode;
}

const timelineEvents: TimelineEvent[] = [
  {
    year: '1965',
    titleKey: 'timeline.1965.title',
    descriptionKey: 'timeline.1965.description',
    category: 'foundation',
    icon: <Users className="w-5 h-5" />
  },
  {
    year: '1971',
    titleKey: 'timeline.1971.title',
    descriptionKey: 'timeline.1971.description',
    category: 'international',
    icon: <Globe className="w-5 h-5" />
  },
  {
    year: '1980',
    titleKey: 'timeline.1980.title',
    descriptionKey: 'timeline.1980.description',
    category: 'development',
    icon: <Trophy className="w-5 h-5" />
  },
  {
    year: '1990',
    titleKey: 'timeline.1990.title',
    descriptionKey: 'timeline.1990.description',
    category: 'achievement',
    icon: <Award className="w-5 h-5" />
  },
  {
    year: '2000',
    titleKey: 'timeline.2000.title',
    descriptionKey: 'timeline.2000.description',
    category: 'development',
    icon: <Users className="w-5 h-5" />
  },
  {
    year: '2008',
    titleKey: 'timeline.2008.title',
    descriptionKey: 'timeline.2008.description',
    category: 'achievement',
    icon: <Trophy className="w-5 h-5" />
  },
  {
    year: '2012',
    titleKey: 'timeline.2012.title',
    descriptionKey: 'timeline.2012.description',
    category: 'international',
    icon: <Globe className="w-5 h-5" />
  },
  {
    year: '2016',
    titleKey: 'timeline.2016.title',
    descriptionKey: 'timeline.2016.description',
    category: 'development',
    icon: <Users className="w-5 h-5" />
  },
  {
    year: '2020',
    titleKey: 'timeline.2020.title',
    descriptionKey: 'timeline.2020.description',
    category: 'achievement',
    icon: <Award className="w-5 h-5" />
  },
  {
    year: '2024',
    titleKey: 'timeline.2024.title',
    descriptionKey: 'timeline.2024.description',
    category: 'development',
    icon: <Trophy className="w-5 h-5" />
  }
];

const getCategoryColor = (category: string, isDark: boolean) => {
  const colors = {
    foundation: isDark ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800',
    achievement: isDark ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800',
    international: isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800',
    development: isDark ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
  };
  return colors[category] || colors.development;
};

const getCategoryBorder = (category: string) => {
  const borders = {
    foundation: 'border-green-400',
    achievement: 'border-yellow-400',
    international: 'border-blue-400',
    development: 'border-purple-400'
  };
  return borders[category] || borders.development;
};

const HistoryTimelinePage = () => {
  const { t } = useLanguage();

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text">
              {t('timeline.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('timeline.subtitle')}
            </p>
            <Separator className="my-8" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Badge className={getCategoryColor('foundation', true)}>
              <Users className="w-4 h-4 mr-1" />
              {t('timeline.categories.foundation')}
            </Badge>
            <Badge className={getCategoryColor('achievement', true)}>
              <Award className="w-4 h-4 mr-1" />
              {t('timeline.categories.achievement')}
            </Badge>
            <Badge className={getCategoryColor('international', true)}>
              <Globe className="w-4 h-4 mr-1" />
              {t('timeline.categories.international')}
            </Badge>
            <Badge className={getCategoryColor('development', true)}>
              <Trophy className="w-4 h-4 mr-1" />
              {t('timeline.categories.development')}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Central timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-green-400 via-green-500 to-green-600 h-full rounded-full shadow-lg"></div>

            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const isLeft = index % 2 === 0;
                
                return (
                  <div key={event.year} className="relative flex items-center">
                    {/* Year marker on timeline */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-4 border-white shadow-xl flex items-center justify-center ${getCategoryBorder(event.category)}`}>
                        <div className="text-center">
                          <div className="text-white font-bold text-sm leading-tight">{event.year}</div>
                        </div>
                      </div>
                    </div>

                    {/* Event card */}
                    <div className={`w-full ${isLeft ? 'pr-16 text-right' : 'pl-16 text-left'}`}>
                      <div className={`inline-block ${isLeft ? '' : 'ml-auto'}`}>
                        <Card className={`card-dark max-w-md ${isLeft ? 'ml-auto' : ''} hover:scale-105 transition-transform duration-300`}>
                          <CardHeader className="pb-3">
                            <div className={`flex items-center gap-3 ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`p-2 rounded-full ${getCategoryColor(event.category, true)}`}>
                                {event.icon}
                              </div>
                              <div className={isLeft ? 'text-right' : 'text-left'}>
                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-green-400" />
                                  {t(event.titleKey)}
                                </CardTitle>
                                <Badge variant="outline" className={`mt-1 ${getCategoryColor(event.category, false)}`}>
                                  {t(`timeline.categories.${event.category}`)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-gray-300 leading-relaxed">
                              {t(event.descriptionKey)}
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

          {/* Footer statistics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">60+</div>
              <div className="text-gray-300 text-sm">{t('timeline.stats.years')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">500+</div>
              <div className="text-gray-300 text-sm">{t('timeline.stats.athletes')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">15+</div>
              <div className="text-gray-300 text-sm">{t('timeline.stats.clubs')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">100+</div>
              <div className="text-gray-300 text-sm">{t('timeline.stats.tournaments')}</div>
            </div>
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
};

export default HistoryTimelinePage;
