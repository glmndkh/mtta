import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { JudgeCard } from "@/components/JudgeCard";
import { useQuery } from "@tanstack/react-query";
import buyanbatImage from "@/assets/councilimages/buyanbat.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";

interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  judgeType: "domestic" | "international";
  role?: "chairperson" | "member" | null;
  description?: string | null;
}

const teamImage = "https://images.unsplash.com/photo-1758518729685-f88df7890776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWFtJTIwbWVldGluZ3xlbnwxfHx8fDE3NjIzMzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export default function RefereesCouncil() {
  const { data: judges, isLoading, isError } = useQuery<Judge[]>({
    queryKey: ["/api/judges"],
  });

  const sortedJudges = judges?.sort((a, b) => {
    if (a.role === "chairperson") return -1;
    if (b.role === "chairperson") return 1;
    return 0;
  }) || [];

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 dark:from-emerald-950 dark:via-emerald-900 dark:to-green-950">
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${teamImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-900/70 to-emerald-950/90" />
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <h1 className="text-5xl font-bold text-emerald-50" data-testid="heading-council">Шүүгчдийн Зөвлөл</h1>
              <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
                Монгол Улсын шүүхийн тогтолцоог төлөөлөн ажилладаг мэргэжлийн шүүгчдийн баг
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          {isLoading ? (
            <div className="text-center text-emerald-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
              <p className="mt-4">Уншиж байна...</p>
            </div>
          ) : isError ? (
            <div className="text-center text-emerald-200 py-12">
              <p className="text-xl">Шүүгчдийн мэдээлэл ачаалахад алдаа гарлаа.</p>
              <p className="text-sm mt-2">Дахин оролдоно уу.</p>
            </div>
          ) : sortedJudges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {sortedJudges.map((judge) => {
                let judgeImage = judge.imageUrl;
                
                // Apply specific images based on judge
                if (judge.role === "chairperson") {
                  judgeImage = buyanbatImage;
                } else if (judge.firstName === "Дамдинбаяр" && judge.lastName.charAt(0) === "Х") {
                  judgeImage = damdinbayarImage;
                }
                
                return (
                  <JudgeCard
                    key={judge.id}
                    image={judgeImage}
                    role={judge.role || "member"}
                    name={`${judge.lastName.charAt(0)}. ${judge.firstName}`}
                    status={judge.judgeType}
                    description={judge.description}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center text-emerald-200 py-12">
              <p className="text-xl">Шүүгчдийн мэдээлэл одоогоор байхгүй байна.</p>
            </div>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}
