
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getImageUrl } from "@/lib/utils";

interface Champion {
  id: string;
  name: string;
  year: string;
  gender?: string;
  championType?: string;
  imageUrl?: string;
  createdAt?: string;
}

export default function PastChampions() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChampions();
  }, []);

  const fetchChampions = async () => {
    try {
      const response = await fetch('/api/champions');
      if (!response.ok) {
        throw new Error('Champions олж авахад алдаа гарлаа');
      }
      const data = await response.json();
      setChampions(data);
    } catch (error) {
      console.error('Error fetching champions:', error);
      setError('Champions-уудыг ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWithLoading>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-10">
          <div className="container mx-auto flex flex-col items-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p>Аваргуудыг ачааллаж байна...</p>
            </div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  if (error) {
    return (
      <PageWithLoading>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-10">
          <div className="container mx-auto flex flex-col items-center">
            <div className="text-red-400 text-center">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </PageWithLoading>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-10">
        <div className="container mx-auto flex flex-col items-center px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Үе үеийн аваргууд
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto"></div>
          </div>

          {/* Champions Grid */}
          <div className="flex flex-wrap justify-center gap-8 max-w-6xl">
            {champions.map((champion) => (
              <Card 
                key={champion.id} 
                className="w-64 md:w-72 bg-white/95 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-0 rounded-xl overflow-hidden"
              >
                <CardHeader className="p-6 pb-3 text-center bg-gradient-to-b from-gray-50 to-white">
                  <CardTitle className="text-2xl font-bold text-gray-800 tracking-wide">
                    {champion.year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center">
                  {/* Champion Image */}
                  <div className="w-full px-6 pb-4">
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg">
                      <img
                        src={champion.imageUrl ? getImageUrl(champion.imageUrl) : "https://via.placeholder.com/200x270.png?text=No+Photo"}
                        alt={champion.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/200x270.png?text=No+Photo";
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Champion Name */}
                  <div className="w-full px-6 pb-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                      {champion.name}
                    </h3>
                    {champion.championType && (
                      <p className="text-sm text-gray-600 mt-1 capitalize">
                        {champion.championType.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {champions.length === 0 && !loading && !error && (
            <div className="text-center text-gray-400 mt-12">
              <p className="text-xl">Одоогоор аваргууд бүртгэгдээгүй байна</p>
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}
