import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Target, Users, Award } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

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
                          src="/objects/uploads/e777df81-a401-41a6-90d7-67d7b521b73a" 
                          alt="President Ts. Gantulga" 
                          className="w-32 h-40 object-cover rounded-lg border-2 border-green-400/30"
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

            {/* Management Tab */}
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