import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";

export default function PastChampions() {
  const { data: champions = [] } = useQuery({ queryKey: ['/api/champions'] });

  return (
    <PageWithLoading>
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Үе үеийн аваргууд</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {champions.map((champ: any) => (
            <div key={champ.id} className="text-center">
              {champ.imageUrl && (
                <img
                  src={champ.imageUrl}
                  alt={champ.name}
                  className="w-full h-40 object-cover rounded"
                />
              )}
              <h2 className="mt-2 font-semibold">{champ.name}</h2>
              <p className="text-sm text-gray-600">{champ.year} оны аварга</p>
            </div>
          ))}
        </div>
      </div>
    </PageWithLoading>
  );
}

