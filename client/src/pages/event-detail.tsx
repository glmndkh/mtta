import { useParams } from 'wouter';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold'>Event Detail</h1>
      {id && <p>Event ID: {id}</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Clock } from "lucide-react";
import PageWithLoading from "@/components/PageWithLoading";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  backgroundImageUrl?: string;
  coverUrl?: string;
  backgroundUrl?: string;
  background?: string;
  heroImage?: string;
  imageUrl?: string;
  image?: string;
  venue?: string;
  city?: string;
  country?: string;
  participationTypes: string[];
}

export default function EventDetail() {
  const { id } = useParams();
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch tournament data
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${id}`],
    enabled: !!id,
  });

  // Handle hash navigation
  useEffect(() => {
    const hash = location.split('#')[1];
    if (hash) {
      setActiveTab(hash);
      // Smooth scroll to section after data loads
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location, tournament]);

  // Helper function to get image URL
  const getImageUrl = (tournament: Tournament): string => {
    const imageFields = [
      tournament.coverUrl,
      tournament.backgroundImageUrl,
      tournament.backgroundUrl,
      tournament.background,
      tournament.heroImage,
      tournament.imageUrl,
      tournament.image
    ];
    
    const imageUrl = imageFields.find(url => url);
    
    if (!imageUrl) return '';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }

    return `/${imageUrl}`;
  };

  // Format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, 'yyyy.MM.dd', { locale: mn });
    }
    
    return `${format(start, 'yyyy.MM.dd', { locale: mn })}–${format(end, 'yyyy.MM.dd', { locale: mn })}`;
  };

  const tabs = [
    { id: 'overview', label: 'Тойм' },
    { id: 'groups', label: 'Хэсгийн тоглолтууд' },
    { id: 'schedule', label: 'Хуваарь' },
    { id: 'players', label: 'Баг тамирчид' },
    { id: 'album', label: 'Альбом' },
    { id: 'about', label: 'Тэмцээний дэлгэрэнгүй' },
  ];

  if (isLoading) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-80 w-full rounded-2xl mb-8" />
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  if (!tournament) {
    return (
      <PageWithLoading>
        <div className="min-h-screen">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Тэмцээн олдсонгүй</h1>
              <p className="text-gray-600">Уучлаарай, энэ тэмцээний мэдээлэл олдсонгүй.</p>
            </div>
          </div>
        </div>
        <Footer />
      </PageWithLoading>
    );
  }

  const imageUrl = getImageUrl(tournament);
  const venue = tournament.venue || tournament.location;
  const cityCountry = [tournament.city, tournament.country].filter(Boolean).join(', ');

  return (
    <PageWithLoading>
      <div className="min-h-screen">
        <Navigation />
        
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="relative h-[280px] md:h-[360px] rounded-2xl overflow-hidden"
            style={{
              backgroundImage: imageUrl 
                ? `url(${imageUrl})` 
                : 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/0"></div>
            
            <div className="absolute left-6 bottom-6 text-white max-w-[70%]">
              <div className="mb-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg mb-3 leading-tight">
                {tournament.name}
              </h1>
              
              {(venue || cityCountry) && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{[venue, cityCountry].filter(Boolean).join(' / ')}</span>
                </div>
              )}
              
              <Button 
                onClick={() => {
                  setActiveTab('register');
                  setTimeout(() => {
                    const element = document.getElementById('register');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="rounded-full bg-white text-gray-900 px-4 py-2 font-bold hover:bg-gray-100 focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              >
                Бүртгүүлэх
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="sticky top-16 z-10 bg-white border-b mt-8">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const element = document.getElementById(tab.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-mtta-green text-mtta-green font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-8 space-y-16">
            
            {/* Overview */}
            <section id="overview" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Тойм</h2>
              <div className="prose max-w-none">
                {tournament.description ? (
                  <p className="text-gray-600 leading-relaxed">{tournament.description}</p>
                ) : (
                  <p className="text-gray-500 italic">Тэмцээний тойм одоогоор бэлэн болоогүй байна.</p>
                )}
              </div>
            </section>

            {/* Groups */}
            <section id="groups" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Хэсгийн тоглолтууд</h2>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Хэсгийн тоглолтуудын мэдээлэл удахгүй нэмэгдэх болно.</p>
              </div>
            </section>

            {/* Schedule */}
            <section id="schedule" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Хуваарь</h2>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Тэмцээний хуваарь удахгүй нэмэгдэх болно.</p>
              </div>
            </section>

            {/* Players */}
            <section id="players" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Баг тамирчид</h2>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Оролцогч тамирчдын жагсаалт удахгүй нэмэгдэх болно.</p>
              </div>
            </section>

            {/* Album */}
            <section id="album" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Альбом</h2>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Тэмцээний зургийн цомог удахгүй нэмэгдэх болно.</p>
              </div>
            </section>

            {/* About */}
            <section id="about" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Тэмцээний дэлгэрэнгүй</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Үндсэн мэдээлэл</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Огноо:</dt>
                      <dd className="text-sm font-medium">{formatDateRange(tournament.startDate, tournament.endDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Байршил:</dt>
                      <dd className="text-sm font-medium">{venue || 'Тодорхойгүй'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Төлөв:</dt>
                      <dd className="text-sm font-medium">
                        <Badge variant={tournament.status === 'upcoming' ? 'default' : 'secondary'}>
                          {tournament.status === 'upcoming' ? 'Удахгүй' : 
                           tournament.status === 'ongoing' ? 'Явагдаж байгаа' : 'Дууссан'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Оролцооны төрлүүд</h3>
                  <div className="flex flex-wrap gap-2">
                    {tournament.participationTypes.map((type) => (
                      <Badge key={type} variant="outline">
                        {type === 'singles_men' ? 'Эрэгтэй дан' :
                         type === 'singles_women' ? 'Эмэгтэй дан' :
                         type === 'doubles_men' ? 'Эрэгтэй хос' :
                         type === 'doubles_women' ? 'Эмэгтэй хос' :
                         type === 'mixed_doubles' ? 'Холимог хос' : type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Registration Section */}
            <section id="register" tabIndex={-1} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Бүртгүүлэх</h2>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Бүртгүүлэх систем удахгүй нэмэгдэх болно.</p>
                <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed">
                  Удахгүй нээгдэх
                </Button>
              </div>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </PageWithLoading>
  );
}
