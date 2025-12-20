import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card } from "@/components/JudgeCard";
import { CouncilHero } from "@/components/council/CouncilHero";
import buyanbatImage from "@/assets/councilimages/buyanbat.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import tumenImage from "@/assets/councilimages/Tumen.jpg";
import boldImage from "@/assets/councilimages/Bold.jpg";
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
  {
    id: "5",
      firstName: "Болд",
      lastName: "Т",
      imageUrl: boldImage,
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
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-emerald-50">
        <CouncilHero 
          title="Шүүгчдийн Зөвлөл" 
          subtitle="Монгол Ширээний Теннисний Холбооны мэргэжилтэй шүүгчдийн баг"
          backgroundImage={teamImage}
        />
        
        <section className="relative -mt-16 pb-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {sortedJudges.map((judge) => {
                const judgeName =
                  judge.displayName || `${judge.lastName.charAt(0)}. ${judge.firstName}`;
                const highlight = judge.role === "chairperson";

                return (
                  <Card
                    key={judge.id}
                    image={judge.imageUrl}
                    role={judge.role}
                    name={judgeName}
                    status={judge.judgeType}
                    description={judge.description}
                    highlight={highlight}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </PageWithLoading>
  );
}
