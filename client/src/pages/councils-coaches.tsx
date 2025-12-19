import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { CoachCard } from "@/components/CoachCard";

import bilegtImage from "@/assets/councilimages/bilegt.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import tumenImage from "@/assets/councilimages/Tumen.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

interface Coach {
  id: string;
  firstName: string;
  lastName: string;

  // asset import (StaticImageData байж болно) — CoachCard image?: string | null
  // тул any гэж авч байгаад доор string болгон дамжуулна.
  imageUrl: any;

  coachType: "head" | "assistant";
  role: "chairperson" | "member";
  description: string;
  displayName?: string;
}

const staticCoaches: Coach[] = [
  {
    id: "1",
    firstName: "Билэгт",
    lastName: "Б",
    imageUrl: bilegtImage,
    coachType: "head",
    role: "chairperson",
    description:
      "Ахлах дасгалжуулагч, Монгол Улсын Ширээний Теннисний Холбооны Дасгалжуулагчдын Зөвлөлийн Дарга",
  },
  {
    id: "2",
    firstName: "Дамдинбаяр",
    lastName: "Х",
    imageUrl: damdinbayarImage,
    coachType: "assistant",
    role: "member",
    description: "Дасгалжуулагч, Дасгалжуулагчдын Зөвлөлийн Гишүүн",
  },
  {
    id: "3",
    firstName: "Цогзолмаа",
    lastName: "Р",
    imageUrl: tsogzolmaaImage,
    coachType: "assistant",
    role: "member",
    description: "Дасгалжуулагч, Дасгалжуулагчдын Зөвлөлийн Гишүүн",
    displayName: "Р. Цогзолмаа",
  },
  {
    id: "4",
    firstName: "Түмэн-Өлзий",
    lastName: "Д",
    imageUrl: tumenImage,
    coachType: "assistant",
    role: "member",
    description: "Дасгалжуулагч, Дасгалжуулагчдын Зөвлөлийн Гишүүн",
  },
];

export default function CoachesCouncil() {
  const sortedCoaches = [...staticCoaches].sort((a, b) => {
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
            style={{
              backgroundImage: `url(${
                (teamImage as any)?.src ? (teamImage as any).src : (teamImage as any)
              })`,
            }}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 md:bg-black/60" />

          {/* Text */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <h1
                className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                data-testid="heading-council"
              >
                Дасгалжуулагчдын Зөвлөл
              </h1>
              <p className="text-white/95 text-lg max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                Монгол Ширээний Теннисний Холбооны дасгалжуулагчдын баг
              </p>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/*     COACH CARDS SECTION   */}
        {/* ========================= */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedCoaches.map((coach) => {
              const coachName =
                coach.displayName ||
                `${coach.lastName.charAt(0)}. ${coach.firstName}`;

              const coachImage =
                (coach.imageUrl as any)?.src ? (coach.imageUrl as any).src : coach.imageUrl;

              return (
                <CoachCard
                  key={coach.id}
                  image={coachImage}
                  role={coach.role}
                  name={coachName}
                  status={coach.coachType}
                  description={coach.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
