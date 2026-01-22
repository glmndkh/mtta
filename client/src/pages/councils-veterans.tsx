import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { SeniorsCouncilCard } from "@/components/SeniorsCouncilCard";
import chimeddagvaImage from "@/assets/councilimages/Chimeddagva.jpeg"; // hero зураг түр
import teamImage from "@/assets/councilimages/Shuugchid.jpg";

type Img = any;

interface SeniorMember {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: Img;
  role: "chairperson" | "member";
  description: string;
  displayName?: string;
  status?: "veteran" | "senior" | "other";
}

const staticSeniors: SeniorMember[] = [
  {
    id: "1",
    firstName: "Ахмад",
    lastName: "А",
    imageUrl: chimeddagvaImage,
    role: "chairperson",
    status: "veteran",
    description:
      "Ахмадын зөвлөлийн дарга. Холбооны ахмад гишүүдийн үйл ажиллагааг зохицуулдаг.",
    displayName: "Д. Чимэддагва",
  },
  {
    id: "2",
    firstName: "Ахмад",
    lastName: "Б",
    imageUrl: "a",
    role: "member",
    status: "senior",
    description: "Ахмадын зөвлөлийн гишүүн.",
    displayName: "Тун удахгүй",
  },
  {
    id: "3",
    firstName: "Ахмад",
    lastName: "Б",
    imageUrl: "a",
    role: "member",
    status: "senior",
    description: "Ахмадын зөвлөлийн гишүүн.",
    displayName: "Тун удахгүй",
  },
  {
    id: "4",
    firstName: "Ахмад",
    lastName: "Б",
    imageUrl: "a",
    role: "member",
    status: "senior",
    description: "Ахмадын зөвлөлийн гишүүн.",
    displayName: "Тун удахгүй",
  },
  {
    id: "5",
    firstName: "Ахмад",
    lastName: "Б",
    imageUrl: "a",
    role: "member",
    status: "senior",
    description: "Ахмадын зөвлөлийн гишүүн.",
    displayName: "Тун удахгүй",
  },
];

export default function SeniorsCouncil() {
  const sortedSeniors = [...staticSeniors].sort((a, b) => {
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
                Ахмадын Зөвлөл
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Монгол Ширээний Теннисний Холбооны ахмад гишүүдийн төлөөлөл
              </p>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {sortedSeniors.map((m) => {
              const name =
                m.displayName || `${m.lastName.charAt(0)}. ${m.firstName}`;

              const image =
                (m.imageUrl as any)?.src ? (m.imageUrl as any).src : m.imageUrl;

              return (
                <SeniorsCouncilCard
                  key={m.id}
                  image={image}
                  role={m.role}
                  name={name}
                  status={m.status}
                  description={m.description}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
