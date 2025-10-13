
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface PodiumPlayer {
  position: number;
  player: {
    id: string;
    name: string;
    photoUrl?: string;
    profileImageUrl?: string;
  };
  points?: number;
  note?: string;
}

interface PodiumSectionProps {
  rankings: PodiumPlayer[];
}

export function PodiumSection({ rankings }: PodiumSectionProps) {
  // Extract top 3 by position field
  const first = rankings.find((r) => r.position === 1);
  const second = rankings.find((r) => r.position === 2);
  const third = rankings.find((r) => r.position === 3);

  // Log for debugging
  console.log("[PodiumSection] Rendering podium with rankings:", rankings);
  console.log("[PodiumSection] First place:", first);
  console.log("[PodiumSection] Second place:", second);
  console.log("[PodiumSection] Third place:", third);

  // Don't render if no top 3 exist
  if (!first && !second && !third) {
    console.log("[PodiumSection] No top 3 rankings found");
    return null;
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="mb-8" data-testid="podium-section">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white flex items-center justify-center gap-2">
        <Trophy className="w-7 h-7 md:w-8 md:h-8 text-yellow-500" />
        Шилдэг гурав
      </h2>

      <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6">
        {/* 2nd Place - Left on desktop, 2nd on mobile */}
        {second && (
          <Card 
            className="w-full md:w-64 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600 order-2 md:order-1 md:h-72"
            data-testid="podium-position-2"
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-3">🥈</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white mb-3">2-р байр</div>
              <Avatar className="w-20 h-20 mb-3 border-4 border-gray-400">
                <AvatarImage 
                  src={second.player.profileImageUrl || second.player.photoUrl} 
                  alt={second.player.name} 
                />
                <AvatarFallback className="bg-gray-500 text-white text-lg">
                  {getInitials(second.player.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {second.player.name}
              </div>
              {second.points !== undefined && (
                <div className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                  {second.points} оноо
                </div>
              )}
              {second.note && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {second.note}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 1st Place - Center - Larger */}
        {first && (
          <Card 
            className="w-full md:w-80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700 border-yellow-400 dark:border-yellow-500 order-1 md:order-2 md:h-80 shadow-2xl"
            data-testid="podium-position-1"
          >
            <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="text-7xl mb-4">🥇</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">1-р байр</div>
              <Avatar className="w-24 h-24 mb-4 border-4 border-yellow-600">
                <AvatarImage 
                  src={first.player.profileImageUrl || first.player.photoUrl} 
                  alt={first.player.name} 
                />
                <AvatarFallback className="bg-yellow-600 text-white text-xl">
                  {getInitials(first.player.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-3xl font-bold text-yellow-950 dark:text-white mb-2">
                {first.player.name}
              </div>
              {first.points !== undefined && (
                <div className="text-xl font-semibold text-yellow-900 dark:text-yellow-200">
                  {first.points} оноо
                </div>
              )}
              {first.note && (
                <div className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  {first.note}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3rd Place - Right on desktop, 3rd on mobile */}
        {third && (
          <Card 
            className="w-full md:w-64 bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 dark:from-orange-600 dark:via-orange-700 dark:to-orange-800 border-orange-400 dark:border-orange-600 order-3 md:h-72"
            data-testid="podium-position-3"
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-3">🥉</div>
              <div className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-3">3-р байр</div>
              <Avatar className="w-20 h-20 mb-3 border-4 border-orange-600">
                <AvatarImage 
                  src={third.player.profileImageUrl || third.player.photoUrl} 
                  alt={third.player.name} 
                />
                <AvatarFallback className="bg-orange-600 text-white text-lg">
                  {getInitials(third.player.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-2xl font-semibold text-orange-950 dark:text-white mb-1">
                {third.player.name}
              </div>
              {third.points !== undefined && (
                <div className="text-lg text-orange-800 dark:text-orange-200 font-medium">
                  {third.points} оноо
                </div>
              )}
              {third.note && (
                <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {third.note}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
