
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatName } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const goToPlayer = (index: number) => {
    setCurrentPlayerIndex(index);
  };

  const goToPrevious = () => {
    setCurrentPlayerIndex((prev) => 
      prev === 0 ? players.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentPlayerIndex((prev) => 
      prev === players.length - 1 ? 0 : prev + 1
    );
  };

  const currentPlayer = players[currentPlayerIndex];

  return (
    <PageWithLoading>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        ) : players.length > 0 ? (
          <>
            {/* Main Champion Spotlight */}
            <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
              {/* WTT Logo and Title */}
              <div className="absolute top-8 left-8 text-white">
                <div className="text-2xl font-bold mb-2">🏓 MTTA</div>
                <div className="text-xl font-bold tracking-wider">ҮНДЭСНИЙ ШИГШЭЭ</div>
              </div>

              {/* Navigation Arrows */}
              {players.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="absolute left-8 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                    onClick={goToNext}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}

              {/* Main Content */}
              <div className="flex items-center gap-16 max-w-6xl mx-auto">
                {/* Player Image */}
                <div className="flex-shrink-0">
                  {currentPlayer?.imageUrl ? (
                    <img
                      src={currentPlayer.imageUrl}
                      alt={formatName(currentPlayer.firstName, currentPlayer.lastName)}
                      className="w-[28rem] h-[32rem] object-cover rounded-lg border-0"
                    />
                  ) : (
                    <div className="w-[28rem] h-[32rem] bg-white/20 rounded-lg flex items-center justify-center border-0">
                      <div className="text-white text-8xl font-bold">
                        {currentPlayer?.firstName?.[0]}{currentPlayer?.lastName?.[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="text-white space-y-8">
                  <div>
                    <h1 className="text-7xl font-bold mb-6 leading-tight">
                      <div>{currentPlayer?.firstName || ''}</div>
                      <div>{currentPlayer?.lastName || ''}</div>
                    </h1>
                    {currentPlayer?.age && (
                      <div className="text-3xl">
                        <span className="text-white/80">Нас:</span>
                        <span className="font-bold ml-3">{currentPlayer.age}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dots Indicator */}
              {players.length > 1 && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
                  {players.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToPlayer(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentPlayerIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* All Players Grid */}
            <div className="bg-white py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                  Үндэсний шигшээний бүрэлдэхүүн
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {players.map((player, index) => (
                    <Card 
                      key={player.id} 
                      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 ${
                        index === currentPlayerIndex ? 'ring-4 ring-blue-500' : ''
                      }`}
                      onClick={() => goToPlayer(index)}
                    >
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={formatName(player.firstName, player.lastName)}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <div className="text-white text-4xl font-bold">
                            {player.firstName?.[0]}{player.lastName?.[0]}
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <div className="text-center">
                          <h3 className="text-xl font-bold mb-2 leading-tight">
                            <div>{player.firstName}</div>
                            <div>{player.lastName}</div>
                          </h3>
                          {player.age !== undefined && (
                            <p className="text-blue-100">{player.age} нас</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center min-h-screen text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Үндэсний шигшээний тамирчид</h2>
              <p>Одоогоор тамирчид бүртгэгдээгүй байна.</p>
            </div>
          </div>
        )}
      </div>
    </PageWithLoading>
  );
}
