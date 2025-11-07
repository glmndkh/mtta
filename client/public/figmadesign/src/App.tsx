import { JudgeCard } from "./components/JudgeCard";

const teamImage = "https://images.unsplash.com/photo-1758518729685-f88df7890776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWFtJTIwbWVldGluZ3xlbnwxfHx8fDE3NjIzMzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const allMembers = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjI0ODI4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    role: "Шүүгчдийн Зөвлөлийн Дарга" as const,
    name: "Б. Галмандах",
    status: "Олон улсын шүүгч" as const,
    description: "Шүүгчдийн Зөвлөлийн Даргын албыг 2018 оноос хойш хашиж байна. Олон улсын хуулийн чиглэлээр мэргэшсэн, 25 жилийн туршлагатай. Олон улсын арбитрын асуудлаар Монгол Улсыг төлөөлж ажиллаж байна. Хууль зүйн салбарт гарсан онцлох амжилтуудыг үнэлэн Төрийн шагналаар шагнагдсан.",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1563132337-f159f484226c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGV4ZWN1dGl2ZSUyMHdvbWFufGVufDF8fHx8MTc2MjMyNTMwNHww&ixlib=rb-4.1.0&q=80&w=1080",
    role: "Шүүгчдийн Зөвлөлийн Гишүүн" as const,
    name: "Д. Энхжаргал",
    status: "Олон улсын шүүгч" as const,
    description: "Олон улсын худалдааны хууль, гэрээ хэлцлийн асуудлаар мэргэшсэн. 18 жилийн туршлагатай, олон улсын арбитрын шүүгчээр ажилласан. Европын хуулийн их сургуульд мастерын зэрэгтэй.",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBsYXd5ZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjIyNDU3NDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    role: "Шүүгчдийн Зөвлөлийн Гишүүн" as const,
    name: "С. Төвшинжаргал",
    status: "Дотоодын шүүгч" as const,
    description: "Эрүү, иргэний хэргийн талаар мэргэшсэн. Дотоодын шүүхэд 15 жил шүүгчээр ажиллаж байна. Хууль зүйн их сургуульд багшилж, судлаач нараар магадлагдсан олон тоот шинжлэх ухааны ажлын зохиогч.",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1561731885-e0591a34659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMG1hbnxlbnwxfHx8fDE3NjIzMDI3NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    role: "Шүүгчдийн Зөвлөлийн Гишүүн" as const,
    name: "Г. Батхуяг",
    status: "Олон улсын шүүгч" as const,
    description: "Санхүү, банкны хуулийн асуудлаар гадаад улсад суралцаж, докторын зэрэгтэй. Олон улсын арбитрын байгууллагуудад шүүгчээр сонгогдож ажилласан 20 жилийн туршлагатай.",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1731093714827-ba0353e09bfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqdWRnZSUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjM0Mzk3NXww&ixlib=rb-4.1.0&q=80&w=1080",
    role: "Шүүгчдийн Зөвлөлийн Гишүүн" as const,
    name: "Н. Оюунбилэг",
    status: "Дотоодын шүүгч" as const,
    description: "Захиргааны хууль, төрийн байгууллагын удирдлагын асуудлаар мэргэшсэн. Улаанбаатар хотын шүүхэд 12 жилийн турш ажилласан. Шүүгчдийн мэргэжлийн түвшин дээшлүүлэх сургалтуудыг зохион байгуулж байна.",
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950">
      {/* Hero Header with Team Image */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${teamImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-900/70 to-emerald-950/90" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <h1 className="text-emerald-50">Шүүгчдийн Зөвлөл</h1>
            <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
              Монгол Улсын шүүхийн тогтолцоог төлөөлөн ажилладаг мэргэжлийн шүүгчдийн баг
            </p>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {allMembers.map((member) => (
            <JudgeCard
              key={member.id}
              image={member.image}
              role={member.role}
              name={member.name}
              status={member.status}
              description={member.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
