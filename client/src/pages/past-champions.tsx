import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Champion {
  year: number;
  name: string;
  image: string;
}

const champions: Champion[] = [
  {
    year: 2025,
    name: "Б. Билэгт",
    image: "https://via.placeholder.com/150x200.png?text=2025",
  },
  {
    year: 2024,
    name: "Б. Лхавсүрэн",
    image: "https://via.placeholder.com/150x200.png?text=2024",
  },
  {
    year: 2023,
    name: "Б. Билэгт",
    image: "https://via.placeholder.com/150x200.png?text=2023",
  },
];

export default function PastChampions() {
  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg py-10">
        <div className="container mx-auto flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-6">
            {champions.map((champion) => (
              <Card key={champion.year} className="w-40 md:w-48 text-center">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {champion.year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 px-4 pb-4 flex flex-col items-center">
                  <img
                    src={champion.image}
                    alt={champion.name}
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                  <p className="font-medium">{champion.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}
