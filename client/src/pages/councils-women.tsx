import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { JudgeCard } from "@/components/JudgeCard";
import buyanbatImage from "@/assets/councilimages/buyanbat.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import tumenImage from "@/assets/councilimages/Tumen.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

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

const staticJudges: Judge[] = [
  {
    id: "1",
    firstName: "Буянбат",
    lastName: "Б",
    imageUrl: buyanbatImage,
    judgeType: "international",
    role: "chairperson",
    description:
      "Олон улсын шүүгч, Монгол Улсын Ширээний Теннисний Холбооны Шүүгчдийн Зөвлөлийн Дарга",
  },
  {
    id: "2",
    firstName: "Дамдинбаяр",
    lastName: "Х",
    imageUrl: damdinbayarImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн",
  },
  {
    id: "3",
    firstName: "Цогзолмаа",
    lastName: "Р",
    imageUrl: tsogzolmaaImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн",
    displayName: "Р. Цогзолмаа",
  },
  {
    id: "4",
    firstName: "Түмэн-Өлзий",
    lastName: "Д",
    imageUrl: tumenImage,
    judgeType: "international",
    role: "member",
    description: "Олон улсын шүүгч, Шүүгчдийн Зөвлөлийн Гишүүн",
  },
];

export default function RefereesCouncil() {
  const sortedJudges = [...staticJudges].sort((a, b) => {
    if (a.role === "chairperson") return -1;
    if (b.role === "chairperson") return 1;
    return 0;
  });

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-emerald-550 via-emerald-500 to-green-550 dark:from-emerald-550 dark:via-emerald-500 dark:to-green-550">

        {/* ========================= */}
        {/*        HERO SECTION       */}
        {/* ========================= */}

        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">

          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${teamImage})` }}
          />

          {/* Dark overlay to make text readable */}
          <div className="absolute inset-0 bg-black/50 md:bg-black/60"></div>

          {/* Text layer */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <h1
                className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                data-testid="heading-council"
              >
                Эмэгтэйчүүдийн Зөвлөл
              </h1>
              <p className="text-white/95 text-lg max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                Монгол Ширээний Теннисний Холбооны эмэгтэйчүүдийн баг
              </p>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/*     JUDGE CARDS SECTION   */}
        {/* ========================= */}

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedJudges.map((judge) => {
              const judgeName =
                judge.displayName || `${judge.lastName.charAt(0)}. ${judge.firstName}`;

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
