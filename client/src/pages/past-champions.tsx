
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Medal, 
  Users, 
  Globe, 
  Award, 
  History as HistoryIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: 'foundation' | 'achievement' | 'international' | 'development';
  imageUrl?: string;
  link?: string;
}

interface Champion {
  id: string;
  name: string;
  year: string;
  gender: 'male' | 'female';
  category: string;
  finalScore?: string;
  imageUrl?: string;
  runnerUp?: string;
  bronze?: string[];
}

const timelineEvents: TimelineEvent[] = [
  {
    year: '1965',
    title: 'Холбоо байгуулагдав',
    description: 'Монголын Ширээний Теннисний Холбоо албан ёсоор байгуулагдаж, олон улсын тэмцээнд оролцох эрх олжээ.',
    category: 'foundation',
    imageUrl: '/objects/uploads/foundation-1965.jpg'
  },
  {
    year: '1971',
    title: 'ITTF гишүүнчлэл',
    description: 'Олон улсын ширээний теннисний холбооны (ITTF) гишүүн болж, дэлхийн тэмцээнд оролцох боломж нээгдэв.',
    category: 'international',
    imageUrl: '/objects/uploads/ittf-membership.jpg'
  },
  {
    year: '1980',
    title: 'Анхны үндэсний аварга шалгаруулалт',
    description: 'Монгол улсын анхны албан ёсны ширээний теннисний аварга шалгаруулалт зохион байгуулагдлаа.',
    category: 'development',
    imageUrl: '/objects/uploads/first-championship.jpg'
  },
  {
    year: '1990',
    title: 'Азийн тэмцээнд анхны медаль',
    description: 'Азийн ширээний теннисний тэмцээнээс анхны медалиа хүртэж, олон улсын тавцанд нэрээ дурсгалаа.',
    category: 'achievement',
    imageUrl: '/objects/uploads/first-medal.jpg'
  },
  {
    year: '2000',
    title: 'Дэд бүтцийн хөгжил',
    description: 'Үндэсний спортын цогцолборт орчин үеийн ширээний теннисний заал нээгдэж, сургалтын чанар сайжирлаа.',
    category: 'development',
    imageUrl: '/objects/uploads/infrastructure.jpg'
  },
  {
    year: '2008',
    title: 'Олимпийн тэмцээнд оролцлоо',
    description: 'Бээжингийн олимпийн наадамд Монголын ширээний теннисчин анх удаа оролцож, түүхэн амжилт бүртгэлээ.',
    category: 'achievement',
    imageUrl: '/objects/uploads/olympics-2008.jpg'
  },
  {
    year: '2012',
    title: 'Дэлхийн аваргын тэмцээнд давхар медаль',
    description: 'Дэлхийн аваргын тэмцээнээс давхар медаль хүртэж, Монголын ширээний теннисний шинэ түүх бичлээ.',
    category: 'international',
    imageUrl: '/objects/uploads/world-championship.jpg'
  },
  {
    year: '2016',
    title: 'Залуучуудын хөгжлийн хөтөлбөр',
    description: 'Залуучуудын спортыг дэмжих хөтөлбөр гарч, орон нутагт олон сургалтын төв байгуулагдлаа.',
    category: 'development',
    imageUrl: '/objects/uploads/youth-program.jpg'
  },
  {
    year: '2020',
    title: 'Цахим платформ нэвтрүүлэлт',
    description: 'COVID-19 цар тахлын үеэр цахим тэмцээн, сургалтын систем нэвтрүүлж, шинэ эрин эхэллээ.',
    category: 'development',
    imageUrl: '/objects/uploads/digital-platform.jpg'
  },
  {
    year: '2024',
    title: 'Азийн аваргын тэмцээнд түүхэн амжилт',
    description: 'Азийн аваргын тэмцээнээс алтан медаль хүртэж, Монголын ширээний теннисний шинэ түүх бичлээ.',
    category: 'achievement',
    imageUrl: '/objects/uploads/asian-gold.jpg'
  }
];

const mockChampions: Champion[] = [
  {
    id: '1',
    name: 'Б.Болдбаатар',
    year: '2024',
    gender: 'male',
    category: 'Эрэгтэй дан',
    finalScore: '4:2',
    runnerUp: 'Ц.Цэндбаатар',
    bronze: ['Г.Ганбаатар', 'Д.Дулмаа'],
    imageUrl: '/objects/uploads/champion-boldbaatar.jpg'
  },
  {
    id: '2',
    name: 'Д.Дулмаа',
    year: '2024',
    gender: 'female',
    category: 'Эмэгтэй дан',
    finalScore: '4:1',
    runnerUp: 'С.Сэлэнгэ',
    bronze: ['О.Оюунгэрэл', 'Н.Нарангэрэл'],
    imageUrl: '/objects/uploads/champion-dulmaa.jpg'
  },
  {
    id: '3',
    name: 'Ц.Цэндбаатар',
    year: '2023',
    gender: 'male',
    category: 'Эрэгтэй дан',
    finalScore: '4:3',
    runnerUp: 'Г.Ганбаатар',
    bronze: ['Б.Болдбаатар', 'Л.Лхагвасүрэн'],
    imageUrl: '/objects/uploads/champion-tsendbaatar.jpg'
  },
  {
    id: '4',
    name: 'С.Сэлэнгэ',
    year: '2023',
    gender: 'female',
    category: 'Эмэгтэй дан',
    finalScore: '4:2',
    runnerUp: 'О.Оюунгэрэл',
    bronze: ['Д.Дулмаа', 'Н.Нарангэрэл'],
    imageUrl: '/objects/uploads/champion-selenge.jpg'
  }
];

export default function PastChampions() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Timeline state
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [activeTab, setActiveTab] = useState<string>('timeline');
  
  // Champions state
  const [selectedChampionYear, setSelectedChampionYear] = useState<string>('2024');
  const [selectedGender, setSelectedGender] = useState<string>('male');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab === 'timeline' && selectedYear !== '2024') {
      params.set('year', selectedYear);
    }
    if (activeTab === 'champions') {
      if (selectedChampionYear !== '2024') params.set('year', selectedChampionYear);
      if (selectedGender !== 'male') params.set('gender', selectedGender);
      if (searchQuery) params.set('search', searchQuery);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState(null, '', `/past-champions${newUrl}`);
  }, [selectedYear, selectedChampionYear, selectedGender, searchQuery, activeTab]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlYear = params.get('year');
    const urlGender = params.get('gender');
    const urlSearch = params.get('search');
    
    if (urlYear) {
      setSelectedYear(urlYear);
      setSelectedChampionYear(urlYear);
    }
    if (urlGender) {
      setSelectedGender(urlGender);
      setActiveTab('champions');
    }
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setActiveTab('champions');
    }
  }, []);

  // Keyboard navigation for years
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'timeline') {
        const currentIndex = timelineEvents.findIndex(event => event.year === selectedYear);
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          setSelectedYear(timelineEvents[currentIndex - 1].year);
        } else if (e.key === 'ArrowRight' && currentIndex < timelineEvents.length - 1) {
          e.preventDefault();
          setSelectedYear(timelineEvents[currentIndex + 1].year);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedYear, activeTab]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'foundation': return 'bg-blue-600 text-white';
      case 'achievement': return 'bg-yellow-600 text-white';
      case 'international': return 'bg-green-600 text-white';
      case 'development': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foundation': return <Users className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'international': return <Globe className="w-4 h-4" />;
      case 'development': return <Trophy className="w-4 h-4" />;
      default: return <HistoryIcon className="w-4 h-4" />;
    }
  };

  // Filter champions
  const filteredChampions = mockChampions.filter(champion => {
    if (selectedChampionYear !== 'all' && champion.year !== selectedChampionYear) return false;
    if (selectedGender !== 'all' && champion.gender !== selectedGender) return false;
    if (searchQuery && !champion.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedEvent = timelineEvents.find(event => event.year === selectedYear);
  const currentEventIndex = timelineEvents.findIndex(event => event.year === selectedYear);

  // Get available years for champions
  const championYears = Array.from(new Set(mockChampions.map(c => c.year))).sort().reverse();

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
                <HistoryIcon className="mr-3 h-8 w-8 text-mtta-green" />
                Түүх / Аваргууд
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Монголын ширээний теннисний түүхэн замнал болон үндэсний аваргуудын мэдээлэл
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-mtta-green data-[state=active]:text-white"
              >
                Түүхэн замнал
              </TabsTrigger>
              <TabsTrigger 
                value="champions" 
                className="data-[state=active]:bg-mtta-green data-[state=active]:text-white"
              >
                Үндэсний аваргууд
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              {/* Horizontal Year Selector */}
              <Card className="card-dark">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = timelineEvents.findIndex(event => event.year === selectedYear);
                        if (currentIndex > 0) {
                          setSelectedYear(timelineEvents[currentIndex - 1].year);
                        }
                      }}
                      disabled={currentEventIndex === 0}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white">{selectedYear}</h2>
                      <p className="text-sm text-gray-400">
                        {currentEventIndex + 1} / {timelineEvents.length}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = timelineEvents.findIndex(event => event.year === selectedYear);
                        if (currentIndex < timelineEvents.length - 1) {
                          setSelectedYear(timelineEvents[currentIndex + 1].year);
                        }
                      }}
                      disabled={currentEventIndex === timelineEvents.length - 1}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Year Timeline */}
                  <div className="flex justify-center mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                      {timelineEvents.map((event) => (
                        <button
                          key={event.year}
                          onClick={() => setSelectedYear(event.year)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            selectedYear === event.year
                              ? 'bg-mtta-green text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {event.year}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Event Details */}
                  {selectedEvent && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white flex items-center">
                            {getCategoryIcon(selectedEvent.category)}
                            <span className="ml-2">{selectedEvent.title}</span>
                          </CardTitle>
                          <Badge className={getCategoryColor(selectedEvent.category)}>
                            {selectedEvent.category === 'foundation' ? 'Үндэслэл' :
                             selectedEvent.category === 'achievement' ? 'Амжилт' :
                             selectedEvent.category === 'international' ? 'Олон улс' : 'Хөгжил'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col lg:flex-row gap-6">
                          {selectedEvent.imageUrl && (
                            <div className="flex-shrink-0">
                              <img
                                src={selectedEvent.imageUrl}
                                alt={selectedEvent.title}
                                className="w-full lg:w-64 h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/objects/uploads/placeholder-history.jpg';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-gray-300 leading-relaxed">
                              {selectedEvent.description}
                            </p>
                            {selectedEvent.link && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => window.open(selectedEvent.link, '_blank')}
                              >
                                Дэлгэрэнгүй унших
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Champions Tab */}
            <TabsContent value="champions" className="space-y-6">
              {/* Champions Filters */}
              <Card className="card-dark">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Аваргын нэрээр хайх..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* Year Filter */}
                    <Select value={selectedChampionYear} onValueChange={setSelectedChampionYear}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-full lg:w-32">
                        <SelectValue placeholder="Жил" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">Бүх жил</SelectItem>
                        {championYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Gender Filter */}
                    <div className="flex gap-2">
                      <Button
                        variant={selectedGender === 'male' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGender('male')}
                        className={`${selectedGender === 'male' ? 'bg-mtta-green text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                      >
                        Эрэгтэй
                      </Button>
                      <Button
                        variant={selectedGender === 'female' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGender('female')}
                        className={`${selectedGender === 'female' ? 'bg-mtta-green text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                      >
                        Эмэгтэй
                      </Button>
                      <Button
                        variant={selectedGender === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGender('all')}
                        className={`${selectedGender === 'all' ? 'bg-mtta-green text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                      >
                        Бүгд
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Champions Grid */}
              {filteredChampions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredChampions.map((champion) => (
                    <Card key={champion.id} className="card-dark hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={champion.imageUrl} />
                              <AvatarFallback className="bg-mtta-green text-white text-lg font-bold">
                                {champion.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-white">{champion.name}</CardTitle>
                              <CardDescription className="text-gray-300">
                                {champion.category} • {champion.year}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-center">
                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                            <Badge className="bg-yellow-600 text-white">Аварга</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Final Score */}
                        {champion.finalScore && (
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-sm text-gray-400 mb-1">Финалын оноо</div>
                            <div className="text-lg font-bold text-white">{champion.finalScore}</div>
                            {champion.runnerUp && (
                              <div className="text-sm text-gray-300">vs {champion.runnerUp}</div>
                            )}
                          </div>
                        )}

                        {/* Medalists */}
                        {champion.bronze && champion.bronze.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Медальтнууд</div>
                            <div className="space-y-2">
                              {champion.runnerUp && (
                                <div className="flex items-center gap-2">
                                  <Medal className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-300 text-sm">{champion.runnerUp} (Мөнгөн)</span>
                                </div>
                              )}
                              {champion.bronze.map((bronzeWinner, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Medal className="w-4 h-4 text-amber-600" />
                                  <span className="text-gray-300 text-sm">{bronzeWinner} (Хүрэл)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => setLocation(`/player/${champion.id}`)}
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Профайл харах
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-dark">
                  <CardContent className="py-12">
                    <div className="text-center text-gray-400">
                      <Trophy className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Аварга олдсонгүй</h3>
                      <p>Таны сонгосон шүүлтүүрт тохирох аварга байхгүй байна</p>
                      <Button
                        onClick={() => {
                          setSelectedChampionYear('all');
                          setSelectedGender('all');
                          setSearchQuery('');
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Бүх шүүлтүүр арилгах
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
}
