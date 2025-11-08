
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { formatName } from "@/lib/utils";
import { useState } from "react";
import { ChampionsSpotlightDark } from "@/components/ChampionsSpotlightDark";

interface NationalTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  imageUrl?: string | null;
}

// Статик өгөгдөл
const staticPlayers: NationalTeamPlayer[] = [
  // Энд үндэсний шигшээний тоглогчдын мэдээллийг нэмнэ
  // Жишээ:
  // {
  //   id: "1",
  //   firstName: "Батболд",
  //   lastName: "Доржийн",
  //   age: 25,
  //   imageUrl: null
  // },
];

export default function NationalTeamPage() {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const goToPlayer = (index: number) => {
    setCurrentPlayerIndex(index);
  };

  const goToPrevious = () => {
    setCurrentPlayerIndex((prev) => 
      prev === 0 ? staticPlayers.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentPlayerIndex((prev) => 
      prev === staticPlayers.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen">
        {staticPlayers.length === 0 ? (
          <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            <div className="text-white text-xl">
              Үндэсний шигшээний мэдээлэл одоогоор байхгүй байна
            </div>
          </div>
        ) : (
          <>
            {/* Champions Spotlight Dark Component */}
            <ChampionsSpotlightDark
              variant="default"
              players={staticPlayers}
              currentPlayerIndex={currentPlayerIndex}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onPlayerSelect={goToPlayer}
            />

            {/* All Players Grid */}
            <div className="bg-white py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                  Үндэсний шигшээний бүрэлдэхүүн
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {staticPlayers.map((player, index) => (
                    <Card 
                      key={player.id} 
                      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 ${
                        index === currentPlayerIndex ? 'ring-4 ring-green-500' : ''
                      }`}
                      onClick={() => goToPlayer(index)}
                    >
                      <div className="relative">
                        {player.imageUrl ? (
                          <img
                            src={player.imageUrl}
                            alt={formatName(player.firstName, player.lastName)}
                            className="w-full h-96 object-contain bg-gray-100"
                          />
                        ) : (
                          <div className="w-full h-96 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <div className="text-white text-4xl font-bold">
                              {player.firstName?.[0]}{player.lastName?.[0]}
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 bg-white text-gray-800">
                        <div className="text-center">
                          <h3 className="text-lg font-bold mb-1 text-green-700">
                            {player.firstName}
                          </h3>
                          <h4 className="text-lg font-bold mb-2 text-green-600">
                            {player.lastName}
                          </h4>
                          {player.age !== undefined && (
                            <p className="text-gray-600">{player.age} нас</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageWithLoading>
  );
}
