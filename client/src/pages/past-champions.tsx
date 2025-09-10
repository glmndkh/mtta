
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Medal, 
  Crown,
  Search,
  Star,
  ChevronDown
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Champion {
  id: string;
  name: string;
  year: string;
  gender: 'male' | 'female' | 'other' | null;
  championType: 'өсвөрийн' | 'ахмадын' | 'улсын' | null;
  imageUrl?: string;
  createdAt: string;
}

// Helper function to group champions by decades
const groupByDecades = (champions: Champion[]) => {
  const grouped: Record<string, Champion[]> = {};
  
  champions.forEach(champion => {
    // Handle year ranges like "2023-2024" by taking the first year
    const yearStr = champion.year.split('-')[0];
    const year = parseInt(yearStr);
    const decade = Math.floor(year / 10) * 10;
    const decadeKey = `${decade}s`;
    
    if (!grouped[decadeKey]) {
      grouped[decadeKey] = [];
    }
    grouped[decadeKey].push(champion);
  });
  
  // Sort decades in reverse chronological order (recent first)
  const sortedDecades = Object.keys(grouped).sort((a, b) => {
    const yearA = parseInt(a.replace('s', ''));
    const yearB = parseInt(b.replace('s', ''));
    return yearB - yearA;
  });
  
  const result: Record<string, Champion[]> = {};
  sortedDecades.forEach(decade => {
    // Sort champions within each decade by year (recent first)
    result[decade] = grouped[decade].sort((a, b) => {
      const yearA = parseInt(a.year.split('-')[0]);
      const yearB = parseInt(b.year.split('-')[0]);
      return yearB - yearA;
    });
  });
  
  return result;
};

export default function PastChampions() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch champions from API
  const { data: champions = [], isLoading } = useQuery<Champion[]>({
    queryKey: ['/api/champions'],
  });

  // Filter champions based on search
  const filteredChampions = champions.filter(champion => 
    champion.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group champions by decades
  const championsByDecade = groupByDecades(filteredChampions);

  const getGenderIcon = (gender: string | null) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '🏆';
    }
  };

  const getChampionTypeColor = (type: string | null) => {
    switch (type) {
      case 'өсвөрийн': return 'bg-blue-500';
      case 'ахмадын': return 'bg-green-500';
      case 'улсын': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text flex items-center justify-center">
              <Crown className="mr-4 h-10 w-10 text-yellow-400" />
              Аваргуудын танхим
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Монголын ширээний теннисний түүхэн аваргуудын алдар цуурай
            </p>
            <div className="flex justify-center">
              <ChevronDown className="w-8 h-8 text-green-400 animate-bounce" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Аваргын нэрээр хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-lg backdrop-blur-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              <p className="text-gray-300 mt-4">Аваргуудын мэдээлэл уншиж байна...</p>
            </div>
          ) : Object.keys(championsByDecade).length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">
                {searchQuery ? 'Хайлтанд тохирох аварга олдсонгүй' : 'Аваргуудын мэдээлэл байхгүй байна'}
              </p>
            </div>
          ) : (
            /* Champions by Decades */
            <div className="space-y-16">
              {Object.entries(championsByDecade).map(([decade, champions]) => (
                <section key={decade} className="relative">
                  {/* Decade Header */}
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {decade.replace('s', '-ны жилүүд')}
                    </h2>
                    <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mb-4"></div>
                    <div className="flex justify-center items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">{champions.length} аварга</span>
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>

                  {/* Champions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {champions.map((champion, index) => (
                      <div 
                        key={champion.id} 
                        className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900 hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-float-slow"
                        style={{
                          animationDelay: `${index * 200}ms`,
                          animationDuration: `${3 + (index % 3)}s`,
                          aspectRatio: '3/4'
                        }}
                      >
                        {/* Full-bleed player photo */}
                        <div className="absolute inset-0">
                          {champion.imageUrl ? (
                            <img 
                              src={champion.imageUrl} 
                              alt={champion.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <div className="text-6xl font-bold text-gray-400">
                                {champion.name.charAt(0)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Crown icon overlay */}
                        <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 shadow-lg">
                          <Crown className="w-5 h-5 text-gray-800" />
                        </div>

                        {/* Champion type badge */}
                        {champion.championType && (
                          <div className="absolute top-4 left-4">
                            <Badge 
                              className={`${getChampionTypeColor(champion.championType)} text-white shadow-lg`}
                            >
                              {champion.championType}
                            </Badge>
                          </div>
                        )}

                        {/* Bottom green gradient band */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 via-green-500/90 to-transparent px-4 py-6">
                          <div className="text-white">
                            <h3 className="text-lg font-bold mb-1 drop-shadow-lg">
                              {champion.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-white/20 text-white border-white/30">
                                  {champion.year}
                                </Badge>
                                <span className="text-xl">{getGenderIcon(champion.gender)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-yellow-300">
                                <Trophy className="w-4 h-4" />
                                <Medal className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-1deg); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>
    </PageWithLoading>
  );
}
