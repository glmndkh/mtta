import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { WomenCouncilCard } from "@/components/WomenCouncilCard";
import tsogzolmaaImage from "@/assets/councilimages/Tsogzolmaa.jpg";
import bilegtImage from "@/assets/councilimages/bilegt.jpg";
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

interface WomanMember {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: any;
  role: "chairperson" | "member";
  description: string;
  displayName?: string;
}

const staticWomen: WomanMember[] = [
  {
    id: "1",
    firstName: "Ц",
    lastName: "Оюун-Эрдэнэ",
    imageUrl: tsogzolmaaImage,
    role: "chairperson",
    description:
      "Монгол Улсын Ширээний Теннисний Холбооны Эмэгтэйчүүдийн Зөвлөлийн Дарга, Олон Улсын Хэмжээний Мастер",
    displayName: "Ц. Оюун-Эрдэнэ",
  },
  {
    id: "2",
    firstName: "",
    lastName: "",
    imageUrl: "",
    role: "member",
    description:
      "Эмэгтэйчүүдийн спортыг хөгжүүлэх чиглэлээр ажиллаж буй зөвлөлийн гишүүн",
    displayName: "Тун удахгүй"
  },
  {
    id: "3",
    firstName: "",
    lastName: "",
    imageUrl: "",
    role: "member",
    description:
      "Эмэгтэйчүүдийн спортыг хөгжүүлэх чиглэлээр ажиллаж буй зөвлөлийн гишүүн",
    displayName: "Тун удахгүй"
  },
];

export default function WomenCouncil() {
  const sortedWomen = [...staticWomen].sort((a, b) => {
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
        {/* HERO */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-black/50 md:bg-black/60" />

          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Эмэгтэйчүүдийн Зөвлөл
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Монгол Ширээний Теннисний Холбооны эмэгтэйчүүдийн төлөөлөл
              </p>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedWomen.map((woman) => {
              const name =
                woman.displayName ||
                `${woman.lastName.charAt(0)}. ${woman.firstName}`;

              const image =
                (woman.imageUrl as any)?.src
                  ? (woman.imageUrl as any).src
                  : woman.imageUrl;

              return (
                <WomenCouncilCard
                  key={woman.id}
                  image={image}
                  role={woman.role}
                  name={name}
                  description={woman.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
