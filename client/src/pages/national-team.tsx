
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

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl?: string | null;
}

// Статик өгөгдөл - Дасгалжуулагчид
const staticCoaches: Coach[] = [
  {
    id: "coach-1",
    firstName: "Ерөнхий",
    lastName: "Дасгалжуулагч",
    role: "Ерөнхий дасгалжуулагч",
    imageUrl: null
  }
];

// Статик өгөгдөл - Үндэсний шигшээний тоглогчид
const staticPlayers: NationalTeamPlayer[] = [
  {
    id: "nt-player-1",
    firstName: "Мяндал",
    lastName: "Тэмүүлэн",
    age: 24,
    imageUrl: "/picture/Үндэсний шигшээ/Temuulen.jpg"
  },
  {
    id: "nt-player-2",
    firstName: "Батмөнх",
    lastName: "Болор-Эрдэнэ",
    age: 23,
    imageUrl: "/picture/Үндэсний шигшээ/Bolor-Erdene.jpg"
  },
  {
    id: "nt-player-3",
    firstName: "Бат-Эрдэнэ",
    lastName: "Эгшиглэн",
    age: 21,
    imageUrl: "/picture/Үндэсний шигшээ/Egshiglen.jpg"
  },
  {
    id: "nt-player-4",
    firstName: "Өвгөнбүргэд",
    lastName: "Балжинням",
    age: 21,
    imageUrl: "/picture/Үндэсний шигшээ/Baljinnyam.jpg"
  },
  {
    id: "nt-player-5",
    firstName: "М.",
    lastName: "Манлайжаргал",
    age: 18,
    imageUrl: "/picture/Үндэсний шигшээ/Manlai.jpg"
  },
  {
    id: "nt-player-6",
    firstName: "Б.",
    lastName: "Билгүүн",
    age: 15,
    imageUrl: "/picture/Үндэсний шигшээ/Bilguun.jpg"
  }
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

            {/* Coaches Section */}
            <div className="bg-gray-50 py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                  Дасгалжуулагчид
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {staticCoaches.map((coach) => (
                    <Card key={coach.id} className="overflow-hidden">
                      <div className="relative">
                        {coach.imageUrl ? (
                          <img
                            src={coach.imageUrl}
                            alt={formatName(coach.firstName, coach.lastName)}
                            className="w-full h-96 object-contain bg-gray-100"
                          />
                        ) : (
                          <div className="w-full h-96 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <div className="text-white text-4xl font-bold">
                              {coach.firstName?.[0]}{coach.lastName?.[0]}
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 bg-white text-gray-800">
                        <div className="text-center">
                          <p className="text-sm text-blue-600 font-semibold mb-2">
                            {coach.role}
                          </p>
                          <h3 className="text-lg font-bold mb-1 text-blue-700">
                            {coach.firstName}
                          </h3>
                          <h4 className="text-lg font-bold text-blue-600">
                            {coach.lastName}
                          </h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

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
