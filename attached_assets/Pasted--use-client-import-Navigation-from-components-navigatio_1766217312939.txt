"use client";

import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { JudgeCard } from "@/components/JudgeCard";
import otgonjargalImage from "@/assets/celebrities/otgonjargal.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

interface Celebrity {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: any;
  role: string;
  status: string;
  description: string;
  displayName?: string;
}

const staticCelebrities: Celebrity[] = [
  {
    id: "1",
    firstName: "Отгонжаргал",
    lastName: "Б",
    imageUrl: otgonjargalImage,
    role: "Монгол",
    status: "монгол",
    description:
      "Монгол Улсын ширээний теннисний түүхэнд гайхалтай ой дурсамж үлдээсэн алдартан",
    displayName: "Б. Отгонжаргал",
  },
];

export default function Celebrities() {
  const sortedCelebrities = [...staticCelebrities].sort((a, b) => {
    if (a.role === "legend") return -1;
    if (b.role === "legend") return 1;
    return 0;
  });

  const heroBg =
    (teamImage as any)?.src ? (teamImage as any).src : teamImage;

  return (
    <PageWithLoading>
      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-emerald-550 via-emerald-500 to-green-550">
        {/* ================= HERO ================= */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-black/50 md:bg-black/60" />

          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]">
                Алдартнууд
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                Монгол Ширээний Теннисний түүхэнд гайхалтай ой дурсамж үлдээсэн алдартнууд
              </p>
            </div>
          </div>
        </div>

        {/* ================= CARDS ================= */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedCelebrities.map((celebrity) => {
              const name =
                celebrity.displayName ||
                `${celebrity.lastName.charAt(0)}. ${celebrity.firstName}`;

              const image =
                (celebrity.imageUrl as any)?.src
                  ? (celebrity.imageUrl as any).src
                  : celebrity.imageUrl;

              return (
                <JudgeCard
                  key={celebrity.id}
                  image={image}
                  name={name}
                  description={celebrity.description}
                  variant="celebrity"
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}