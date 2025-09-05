import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";

interface NationalTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  imageUrl?: string | null;
}

export default function NationalTeamPage() {
  const { data: players = [], isLoading, error } = useQuery<NationalTeamPlayer[]>({
    queryKey: ["/api/national-team"],
  });

  return (
    <PageWithLoading isLoading={isLoading} error={error}>
      <Navigation />
      <div className="main-bg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">
            Үндэсний шигшээ
          </h1>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {players.map((player) => (
              <Card
                key={player.id}
                className="bg-gray-800 text-white overflow-hidden"
              >
                <CardContent className="p-0">
                  {player.imageUrl ? (
                    <img
                      src={player.imageUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl">
                        {player.firstName?.[0]}
                        {player.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-lg font-semibold">
                      {player.firstName} {player.lastName}
                    </div>
                    {player.age !== null && (
                      <div className="text-sm text-gray-400">
                        {player.age} настай
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {players.length === 0 && !isLoading && (
              <div className="col-span-full text-center text-gray-400">
                Шигшээ тоглогч байхгүй байна
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWithLoading>
  );
}

