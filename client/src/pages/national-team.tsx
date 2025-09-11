import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { formatName } from "@/lib/utils";

interface NationalTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  imageUrl?: string | null;
}

export default function NationalTeamPage() {
  const { data: players = [], isLoading } = useQuery<NationalTeamPlayer[]>({
    queryKey: ["/api/national-team"],
  });

  return (
    <PageWithLoading>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Үндэсний шигшээ
        </h1>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <Card key={player.id} className="overflow-hidden">
                {player.imageUrl && (
                  <img
                    src={player.imageUrl}
                    alt={formatName(player.firstName, player.lastName)}
                    className="w-full h-48 object-contain bg-gray-100"
                  />
                )}
                <CardContent className="p-4 bg-gradient-to-r from-green-700 to-green-600 text-white">
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold">
                      {formatName(player.firstName, player.lastName)}
                    </span>
                    {player.age !== undefined && (
                      <span className="text-sm text-gray-200">{player.age} нас</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWithLoading>
  );
}
