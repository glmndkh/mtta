import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
          <>
            <Carousel className="w-full mx-auto mb-8 max-w-5xl p-8 rounded-lg bg-white dark:bg-black">
              <CarouselContent>
                {players.map((player) => (
                  <CarouselItem key={player.id}>
                    <div className="flex flex-col items-center gap-4">
                      {player.imageUrl && (
                        <img
                          src={player.imageUrl}
                          alt={formatName(player.firstName, player.lastName)}
                          className="w-48 h-64 object-contain rounded"
                        />
                      )}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-black dark:text-white">
                          {formatName(player.firstName, player.lastName)}
                        </h2>
                        {player.age !== undefined && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{player.age} нас</p>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="text-mtta-green border-mtta-green" />
              <CarouselNext className="text-mtta-green border-mtta-green" />
            </Carousel>

            <div className="space-y-6">
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
          </>
        )}
      </div>
    </PageWithLoading>
  );
}
