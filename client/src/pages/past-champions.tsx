
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn, getImageUrl } from "@/lib/utils";

interface Champion {
  id: string;
  name: string;
  year: string;
  gender?: string;
  championType?: string;
  imageUrl?: string;
}

// Static өгөгдөл - Үе үеийн аваргууд
const staticChampions: Champion[] = [
  {
    id: "champion-1",
    name: "Д. Алимаа",
    year: "2024",
    gender: "female",
    championType: "эмэгтэйчүүдийн ганцаарчилсан аварга",
    imageUrl: "/picture/past-champions/D.Alimaa.jpeg"
  },
  {
    id: "champion-2",
    name: "Б. Энхтуул",
    year: "2024",
    gender: "female",
    championType: "ахмадын",
    imageUrl: null
  },
  {
    id: "champion-2",
    name: "Д. Батбаяр",
    year: "2024",
    gender: "male",
    championType: "ахмадын",
    imageUrl: null
  },
  {
    id: "champion-3",
    name: "С. Оюунцэцэг",
    year: "2023",
    gender: "female",
    championType: "улсын",
    imageUrl: null
  },
  {
    id: "champion-4",
    name: "Г. Болд",
    year: "2023",
    gender: "male",
    championType: "улсын",
    imageUrl: null
  },
  {
    id: "champion-5",
    name: "Н. Мөнхбаяр",
    year: "2022",
    gender: "female",
    championType: "өсвөрийн",
    imageUrl: null
  },
  {
    id: "champion-6",
    name: "Ч. Ганбат",
    year: "2022",
    gender: "male",
    championType: "өсвөрийн",
    imageUrl: null
  }
];

export default function PastChampions() {
  const [champions] = useState<Champion[]>(staticChampions);
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const backgroundClass = isDark
    ? "bg-gradient-to-b from-gray-900 via-gray-800 to-black"
    : "bg-gradient-to-b from-slate-100 via-white to-slate-200";
  const headingTextClass = isDark ? "text-white" : "text-slate-900";
  const emptyStateTextClass = isDark ? "text-gray-300" : "text-slate-600";
  const cardBorderClass = isDark ? "border-slate-500/60" : "border-slate-200";

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
                        src={champion.imageUrl || "https://via.placeholder.com/200x270.png?text=No+Photo"}
                        alt={champion.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/200x270.png?text=No+Photo";
                        }}
                      />
                    </div>
                  </div>

                  {/* Champion Details */}
                  <div className="w-full px-6 pb-6 text-center space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                      {champion.name}
                    </h3>
                    {champion.championType && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {champion.championType}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {champions.length === 0 && (
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
