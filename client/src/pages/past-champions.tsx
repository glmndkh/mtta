import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn, getImageUrl } from "@/lib/utils";

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
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const backgroundClass = isDark
    ? "bg-gradient-to-b from-gray-900 via-gray-800 to-black"
    : "bg-gradient-to-b from-slate-100 via-white to-slate-200";
  const headingTextClass = isDark ? "text-white" : "text-slate-900";
  const loadingTextClass = isDark ? "text-white" : "text-slate-900";
  const emptyStateTextClass = isDark ? "text-gray-300" : "text-slate-600";
  const cardBorderClass = isDark ? "border-slate-500/60" : "border-slate-200";

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
        <div className={cn("min-h-screen py-10 transition-colors duration-500", backgroundClass)}>
          <div className="container mx-auto flex flex-col items-center">
            <div className={cn("text-center", loadingTextClass)}>
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
        <div className={cn("min-h-screen py-10 transition-colors duration-500", backgroundClass)}>
          <div className="container mx-auto flex flex-col items-center">
            <div
              className={cn(
                "text-center",
                isDark ? "text-red-400" : "text-red-500"
              )}
            >
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
      <div
        className={cn(
          "min-h-screen py-10 transition-colors duration-500",
          backgroundClass
        )}
      >
        <div className="container mx-auto flex flex-col items-center px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className={cn(
                "text-4xl md:text-5xl font-bold mb-4 transition-colors duration-500",
                headingTextClass
              )}
            >
              Үе үеийн аваргууд
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto"></div>
          </div>

          {/* Champions Grid */}
          <div className="flex flex-wrap justify-center gap-8 max-w-6xl">
            {champions.map((champion) => (
              <Card
                key={champion.id}
                className={cn(
                  "champion-card w-64 md:w-72 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 rounded-xl overflow-hidden border",
                  cardBorderClass
                )}
              >
                <CardHeader className="p-6 pb-3 text-center bg-slate-50 dark:bg-slate-800">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
                    {champion.year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center text-slate-900">
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
                    <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                      {champion.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {champions.length === 0 && !loading && !error && (
            <div className="text-center mt-12">
              <p className={cn("text-xl", emptyStateTextClass)}>
                Одоогоор аваргууд бүртгэгдээгүй байна
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}