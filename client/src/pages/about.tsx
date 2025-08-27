import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Target, Users, Award, CalendarIcon, Trophy, Globe } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("history");
  const { data: members = [] } = useQuery<any[]>({ queryKey: ["/api/federation-members"] });
  const { t } = useLanguage();

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
              {t('about.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('about.subtitle')}
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
                <span className="hidden sm:inline">{t('about.introduction')}</span>
                <span className="sm:hidden">{t('about.introduction').substring(0, 4)}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Target className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('about.goals')}</span>
                <span className="sm:hidden">{t('about.goals').substring(0, 4)}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="management" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('about.history')}</span>
                <span className="sm:hidden">{t('about.history').substring(0, 4)}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leadership" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 text-xs md:text-sm px-1 md:px-3"
              >
                <Award className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('about.members')}</span>
                <span className="sm:hidden">{t('about.members').substring(0, 4)}</span>
              </TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history" id="history">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <History className="w-6 h-6 mr-3 text-green-400" />
                    {t('about.introduction')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('about.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-6">
                  {/* Presidential Greeting Section */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-green-400/20">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-green-400" />
                      {t('about.presidentGreeting')}
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-shrink-0">
                        <img 
                          src="objects/uploads/president-gantulga.jpg"
                          alt="Ц. Гантулга"
                          className="w-32 h-40 object-cover rounded-lg border-2 border-green-400/30"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('President image failed to load:', target.src);

                            if (!target.hasAttribute('data-fallback-tried')) {
                              target.setAttribute('data-fallback-tried', 'true');
                              // Try alternative paths
                              target.src = 'uploads/president-gantulga.jpg';
                            } else if (!target.hasAttribute('data-fallback-2-tried')) {
                              target.setAttribute('data-fallback-2-tried', 'true');
                              // Try direct path from public folder
                              target.src = '/objects/uploads/president-gantulga.jpg';
                            } else {
                              target.style.display = 'none';
                              const container = target.parentElement;
                              if (container && !container.querySelector('.fallback-text')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-text w-32 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-green-400/30 flex items-center justify-center text-xs text-gray-500';
                                fallback.textContent = 'Зураг байхгүй';
                                container.appendChild(fallback);
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="leading-relaxed text-gray-300 italic">
                          "{t('about.presidentGreetingText')}"
                        </p>
                        <p className="mt-4 text-green-400 font-semibold">
                          - Ц. Гантулга, Монголын ширээний теннисний холбооны ерөнхийлөгч
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">{t('about.federationTitle')}</h3>
                    <p className="leading-relaxed">
                      {t('about.federationDesc')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">{t('about.goalsTitle')}</h3>
                    <p className="leading-relaxed">
                      {t('about.goalsDesc')}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">{t('about.established')}</h4>
                      <p>1965</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">{t('about.members')}</h4>
                      <p>500+ athletes</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">{t('about.clubs')}</h4>
                      <p>15+ clubs</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">{t('about.international')}</h4>
                      <p>ITTF Member</p>
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
                    {t('about.goals')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('about.strategicGoals')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-6">
                  <div className="grid gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">01</Badge>
                        {t('about.sportDevelopment')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('about.sportDevelopmentDesc')}
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">02</Badge>
                        {t('about.youthDevelopment')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('about.youthDevelopmentDesc')}
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">03</Badge>
                        {t('about.internationalCooperation')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('about.internationalCooperationDesc')}
                      </p>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                        <Badge variant="outline" className="mr-3 border-green-400 text-green-400">04</Badge>
                        {t('about.infrastructureDevelopment')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('about.infrastructureDevelopmentDesc')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab - Timeline */}
            <TabsContent value="management" id="management">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-green-400" />
                    {t('about.history')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('about.historicalMilestones')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300">
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <Badge className="bg-green-600 text-white">
                      <Users className="w-4 h-4 mr-1" />
                      {t('timeline.categories.foundation')}
                    </Badge>
                    <Badge className="bg-yellow-600 text-white">
                      <Award className="w-4 h-4 mr-1" />
                      {t('timeline.categories.achievement')}
                    </Badge>
                    <Badge className="bg-blue-600 text-white">
                      <Globe className="w-4 h-4 mr-1" />
                      {t('timeline.categories.international')}
                    </Badge>
                    <Badge className="bg-purple-600 text-white">
                      <Trophy className="w-4 h-4 mr-1" />
                      {t('timeline.categories.development')}
                    </Badge>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Central timeline line */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-green-400 via-green-500 to-green-600 h-full rounded-full shadow-lg"></div>

                    <div className="space-y-12">
                      {[
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
                      ].map((event, index) => {
                        const isLeft = index % 2 === 0;
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
                                <Card className={`bg-gray-800 border-gray-700 max-w-md ${isLeft ? 'ml-auto' : ''} hover:scale-105 transition-transform duration-300`}>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leadership Tab */}
            <TabsContent value="leadership" id="leadership">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Award className="w-6 h-6 mr-3 text-green-400" />
                    {t('about.members')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('about.federationMembers')}
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