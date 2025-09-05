import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlayerRecord {
  players: { id: string };
  users?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string | null;
    province?: string | null; // Using province as country placeholder
  };
}

export default function NationalTeamPage() {
  const { data: players = [], isLoading } = useQuery<PlayerRecord[]>({
    queryKey: ["/api/players"],
  });
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState<PlayerRecord[]>([]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      const c = p.users?.province || "Unknown";
      set.add(c);
    });
    return Array.from(set);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const c = p.users?.province || "Unknown";
      return country === "all" || c === country;
    });
  }, [players, country]);

  const addToTeam = (player: PlayerRecord) => {
    setTeam((prev) =>
      prev.some((p) => p.players.id === player.players.id)
        ? prev
        : [...prev, player]
    );
  };

  const removeFromTeam = (id: string) => {
    setTeam((prev) => prev.filter((p) => p.players.id !== id));
  };

  return (
    <PageWithLoading>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Үндэсний шигшээ
        </h1>

        <Card className="mb-8 bg-gray-800 text-white">
          <CardHeader>
            <CardTitle>Шигшээ бүрэлдэхүүн</CardTitle>
          </CardHeader>
          <CardContent>
            {team.length === 0 && (
              <p className="text-gray-400">Одоогоор сонгосон тоглогч алга.</p>
            )}
            {team.length > 0 && (
              <ul className="space-y-2">
                {team.map((p) => (
                  <li key={p.players.id} className="flex items-center justify-between">
                    <span>
                      {p.users?.firstName} {p.users?.lastName}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromTeam(p.players.id)}
                    >
                      Хасах
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Улс сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх улс</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => {
              const inTeam = team.some((p) => p.players.id === player.players.id);
              const countryName = player.users?.province || "Unknown";
              return (
                <Card key={player.players.id} className="bg-gray-800 text-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {player.users?.profileImageUrl ? (
                        <img
                          src={player.users.profileImageUrl}
                          className="w-12 h-12 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-sm">N/A</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {player.users?.firstName} {player.users?.lastName}
                        </p>
                        <p className="text-sm text-gray-400">{countryName}</p>
                      </div>
                    </div>
                    {inTeam ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromTeam(player.players.id)}
                      >
                        Хасах
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => addToTeam(player)}>
                        Нэмэх
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageWithLoading>
  );
}

