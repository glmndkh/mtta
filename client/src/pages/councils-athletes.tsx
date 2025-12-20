import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { AthleteCard } from "@/components/AthleteCard";
import erdenebayrImage from "@/assets/councilimages/Erdenebayr.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: any;

  athleteType: "national" | "youth" | "junior" | "other";
  role: "chairperson" | "member";
  description: string;
  displayName?: string;
}

const staticAthletes: Athlete[] = [
  {
    id: "1",
    firstName: "Ч.",
    lastName: "Эрдэнэбаяр",
    imageUrl: erdenebayrImage,
    athleteType: "national",
    role: "chairperson",
    description:
      "Үндэсний шигшээ багийн тамирчин, Монгол Улсын Ширээний Теннисний Холбооны Тамирчдын Зөвлөлийн Дарга",
  },
  {
    id: "2",
    firstName: "a",
    lastName: "a",
    imageUrl: "a",
    athleteType: "national",
    role: "member",
    description:
      "",
    displayName: "Тун удахгүй",
  },
  {
    id: "3",
    firstName: "a",
    lastName: "",
    imageUrl: "a",
    athleteType: "youth",
    role: "member",
    description:
      "",
    displayName: "Тун удахгүй",
  },
  {
    id: "4",
    firstName: "Түмэн-Өлзий",
    lastName: "Д",
    imageUrl: "a",
    athleteType: "junior",
    role: "member",
    description:
      "",
    displayName: "Тун удахгүй",
  },
];

export default function AthletesCouncil() {
  const sortedAthletes = [...staticAthletes].sort((a, b) => {
    if (a.role === "chairperson") return -1;
    if (b.role === "chairperson") return 1;
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
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Тамирчдын Зөвлөл
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Монгол Ширээний Теннисний Холбооны тамирчдын төлөөлөл
              </p>
            </div>
          </div>
        </div>

        {/* ================= CARDS ================= */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedAthletes.map((athlete) => {
              const athleteName =
                athlete.displayName ||
                `${athlete.lastName.charAt(0)}. ${athlete.firstName}`;

              const athleteImage =
                (athlete.imageUrl as any)?.src
                  ? (athlete.imageUrl as any).src
                  : athlete.imageUrl;

              return (
                <AthleteCard
                  key={athlete.id}
                  image={athleteImage}
                  role={athlete.role}
                  name={athleteName}
                  status={athlete.athleteType}
                  description={athlete.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
