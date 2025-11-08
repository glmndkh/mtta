
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { JudgeCard } from "@/components/JudgeCard";
import buyanbatImage from "@/assets/councilimages/buyanbat.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import tumenImage from "@/assets/councilimages/Tumen.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg"


interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  judgeType: "domestic" | "international";
  role: "chairperson" | "member";
  description: string;
  displayName?: string;
}


// Static мэдээлэл
const staticJudges: Judge[] = [
  {
    id: "1",
    firstName: "Буянбат",
    lastName: "Б",
    imageUrl: buyanbatImage,
    judgeType: "international",
    role: "chairperson",
    description: "Олон улсын шүүгч, Монгол Улсын Ширээний Теннисний Холбооны Шүүгчдийн Зөвлөлийн Дарга"
  },
  {
    id: "2",
    firstName: "Дамдинбаяр",
    lastName: "Х",
    imageUrl: damdinbayarImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн"
  },
  {
    id: "3",
    firstName: "Цогзолмаа",
    lastName: "Р",
    imageUrl: tsogzolmaaImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн",
    displayName: "Р. Цогзолмаа"
  },
  {
    id: "4",
    firstName: "Түмэн-Өлзий",
    lastName: "Д",
    imageUrl: tumenImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн"
  }];

export default function RefereesCouncil() {
  // Даргыг эхэнд байрлуулах
  const sortedJudges = [...staticJudges].sort((a, b) => {
    if (a.role === "chairperson") return -1;
    if (b.role === "chairperson") return 1;
    return 0;
  });

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
                Монгол Ширээний Теннисний Холбооны шүүгчдийн баг
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedJudges.map((judge) => {
              const judgeName = judge.displayName || `${judge.lastName.charAt(0)}. ${judge.firstName}`;
              
              return (
                <JudgeCard
                  key={judge.id}
                  image={judge.imageUrl}
                  role={judge.role}
                  name={judgeName}
                  status={judge.judgeType}
                  description={judge.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
