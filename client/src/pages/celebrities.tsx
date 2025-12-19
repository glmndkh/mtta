import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { CouncilHero } from "@/components/council/CouncilHero";
import { CouncilMemberCard } from "@/components/council/CouncilMemberCard";
import buyanbatImage from "@/assets/councilimages/buyanbat.jpg";
import damdinbayarImage from "@/assets/councilimages/Damdinbayar.jpeg";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import tumenImage from "@/assets/councilimages/Tumen.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

interface Celebrity {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  role: "chairperson" | "member";
  status: string;
  description: string;
  displayName?: string;
}

const staticCelebrities: Celebrity[] = [
  {
    id: "1",
    firstName: "Буянбат",
    lastName: "Б",
    imageUrl: buyanbatImage,
    role: "chairperson",
    status: "Алдарт тамирчин",
    description:
      "Монгол Улсын Ширээний Теннисний алдарт тамирчин, олон улсын тэмцээнүүдийн медальт",
  },
  {
    id: "2",
    firstName: "Дамдинбаяр",
    lastName: "Х",
    imageUrl: damdinbayarImage,
    role: "member",
    status: "Алдарт тамирчин",
    description: "Монгол Улсын Ширээний Теннисний алдарт тамирчин",
  },
  {
    id: "3",
    firstName: "Цогзолмаа",
    lastName: "Р",
    imageUrl: tsogzolmaaImage,
    role: "member",
    status: "Алдарт тамирчин",
    description: "Монгол Улсын Ширээний Теннисний алдарт тамирчин",
    displayName: "Р. Цогзолмаа",
  },
  {
    id: "4",
    firstName: "Түмэн-Өлзий",
    lastName: "Д",
    imageUrl: tumenImage,
    role: "member",
    status: "Алдарт тамирчин",
    description: "Монгол Улсын Ширээний Теннисний алдарт тамирчин",
  },
];

export default function CelebritiesPage() {
  const sortedCelebrities = [...staticCelebrities].sort((a, b) => {
    if (a.role === "chairperson") return -1;
    if (b.role === "chairperson") return 1;
    return 0;
  });

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-emerald-0 via-emerald-0 to-green-0 text-emerald-0">
        <CouncilHero
          title="Алдартнууд"
          subtitle="Монгол Ширээний Теннисний алдартнууд"
          backgroundImage={teamImage}
        />
          <div className="mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedCelebrities.map((celebrity) => {
                  const name =
                    celebrity.displayName ||
                    `${celebrity.lastName.charAt(0)}. ${celebrity.firstName}`;

                  return (
                    <CouncilMemberCard
                      key={celebrity.id}
                      imageUrl={celebrity.imageUrl}
                      name={name}
                      role={celebrity.status}
                      status={celebrity.status}
                      description={celebrity.description}
                      highlight={celebrity.role === "chairperson"}
                    />
                  );
                })}
            </div>
          </div>
      </div>
    </PageWithLoading>
  );
}
