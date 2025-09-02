
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, TrendingUp, TrendingDown, Download, Search, Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import PageWithLoading from "@/components/PageWithLoading";
import type { Tournament, TournamentResults, User } from "@shared/schema";

interface PlayerRanking {
  id: string;
  rank: number;
  name: string;
  club?: string;
  avatar?: string;
  points: number;
  lastChange: number; // positive for up, negative for down
  matchesPlayed: number;
  wins: number;
  losses: number;
}

interface MatchSchedule {
  id: string;
  date: string;
  time: string;
  table: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  round: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  score?: string;
}

const mockPlayerRankings: PlayerRanking[] = [
  { id: '1', rank: 1, name: 'Б.Болдбаатар', club: 'Улаанбаатар ТТК', points: 2450, lastChange: 2, matchesPlayed: 15, wins: 13, losses: 2 },
  { id: '2', rank: 2, name: 'Ц.Цэндбаатар', club: 'Дархан клуб', points: 2380, lastChange: -1, matchesPlayed: 12, wins: 10, losses: 2 },
  { id: '3', rank: 3, name: 'Г.Ганбаатар', club: 'Эрдэнэт ТТК', points: 2320, lastChange: 1, matchesPlayed: 14, wins: 11, losses: 3 },
  { id: '4', rank: 4, name: 'Д.Дулмаа', club: 'Улаанбаатар ТТК', points: 2280, lastChange: 0, matchesPlayed: 13, wins: 9, losses: 4 },
  { id: '5', rank: 5, name: 'Л.Лхагвасүрэн', club: 'Говь-Алтай клуб', points: 2240, lastChange: -2, matchesPlayed: 11, wins: 8, losses: 3 },
];

const mockMatchSchedule: MatchSchedule[] = [
  {
    id: '1',
    date: '2024-01-15',
    time: '10:00',
    table: 'Ширээ 1',
    player1: { id: '1', name: 'Б.Болдбаатар' },
    player2: { id: '2', name: 'Ц.Цэндбаатар' },
    round: 'Хагас финал',
    status: 'scheduled'
  },
  {
    id: '2',
    date: '2024-01-15',
    time: '11:30',
    table: 'Ширээ 2',
    player1: { id: '3', name: 'Г.Ганбаатар' },
    player2: { id: '4', name: 'Д.Дулмаа' },
    round: 'Хагас финал',
    status: 'scheduled'
  },
  {
    id: '3',
    date: '2024-01-15',
    time: '14:00',
    table: 'Ширээ 1',
    player1: { id: '1', name: 'TBD' },
    player2: { id: '2', name: 'TBD' },
    round: 'Финал',
    status: 'scheduled'
  }
];

export default function ResultsRankingsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedCategory, setSelectedCategory] = useState("MS");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tournaments for draws
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Filter tournaments for ongoing/recent ones
  const activeTournaments = useMemo(() => {
    return tournaments.filter(tournament => 
      tournament.status === 'ongoing' || tournament.status === 'completed'
    );
  }, [tournaments]);

  // Filter rankings based on search
  const filteredRankings = useMemo(() => {
    if (!searchQuery) return mockPlayerRankings;
    return mockPlayerRankings.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.club && player.club.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const navigateToPlayer = (playerId: string) => {
    setLocation(`/player/${playerId}`);
  };

  const downloadCSV = () => {
    const headers = ['Байр', 'Нэр', 'Клуб', 'Оноо', 'Тоглолт', 'Ялалт', 'Хожигдол'];
    const csvContent = [
      headers.join(','),
      ...filteredRankings.map(player => [
        player.rank,
        `"${player.name}"`,
        `"${player.club || ''}"`,
        player.points,
        player.matchesPlayed,
        player.wins,
        player.losses
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rankings_${selectedCategory}_${selectedPeriod}.csv`;
    link.click();
  };

  const getParticipationChips = (types: string[] = []) => {
    return types.map(type => {
      switch (type) {
        case 'men_singles':
          return { label: 'MS', color: 'bg-blue-600' };
        case 'women_singles':
          return { label: 'WS', color: 'bg-pink-600' };
        case 'men_doubles':
          return { label: 'MD', color: 'bg-green-600' };
        case 'women_doubles':
          return { label: 'WD', color: 'bg-purple-600' };
        case 'mixed_doubles':
          return { label: 'XD', color: 'bg-orange-600' };
        default:
          return { label: type.slice(0, 2).toUpperCase(), color: 'bg-gray-600' };
      }
    });
  };

  return (
    <PageWithLoading>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Үр дүн / Чансаа</h1>
            <p className="text-gray-300">Тэмцээний үр дүн, тоглолтын хуваарь, тамирчдын чансаа</p>
          </div>
          
          {activeTab === "rankings" && (
            <Button
              onClick={downloadCSV}
              variant="outline"
              className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              CSV татах
            </Button>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-600">
            <TabsTrigger value="draws" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">
              Таны Ялга (Draw)
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">
              Тоглолтын хуваарь
            </TabsTrigger>
            <TabsTrigger value="rankings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300">
              Чансаа (Rankings)
            </TabsTrigger>
          </TabsList>

          {/* Tournament Draws */}
          <TabsContent value="draws" className="space-y-6">
            <div className="grid gap-6">
              {activeTournaments.length > 0 ? (
                activeTournaments.map((tournament) => (
                  <Card key={tournament.id} className="card-dark">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{tournament.name}</CardTitle>
                          <CardDescription className="text-gray-300 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(tournament.startDate), 'yyyy/MM/dd')}
                            {tournament.endDate && tournament.endDate !== tournament.startDate && (
                              ` - ${format(new Date(tournament.endDate), 'MM/dd')}`
                            )}
                          </CardDescription>
                        </div>
                        <Badge className={
                          tournament.status === 'ongoing' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                        }>
                          {tournament.status === 'ongoing' ? 'Болж байна' : 'Дууссан'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Participation Type Chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {getParticipationChips(tournament.participationTypes || []).map((chip, index) => (
                          <span key={index} className={`${chip.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                            {chip.label}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setLocation(`/tournament/${tournament.id}`)}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Дэлгэрэнгүй
                        </Button>
                        <Button
                          onClick={() => setLocation(`/tournament/${tournament.id}/results`)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Үр дүн харах
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="card-dark">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-4" />
                      <p>Одоогоор идэвхитэй тэмцээн байхгүй байна</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Match Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Filters */}
            <Card className="card-dark">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Ангилал сонгох" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="MS">Эрэгтэй дан (MS)</SelectItem>
                        <SelectItem value="WS">Эмэгтэй дан (WS)</SelectItem>
                        <SelectItem value="MD">Эрэгтэй давхар (MD)</SelectItem>
                        <SelectItem value="WD">Эмэгтэй давхар (WD)</SelectItem>
                        <SelectItem value="XD">Холимог давхар (XD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Cards */}
            <div className="space-y-4">
              {mockMatchSchedule.map((match) => (
                <Card key={match.id} className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {match.round}
                          </Badge>
                          <Badge className={
                            match.status === 'ongoing' ? 'bg-blue-600' :
                            match.status === 'completed' ? 'bg-green-600' : 'bg-gray-600'
                          }>
                            {match.status === 'ongoing' ? 'Болж байна' :
                             match.status === 'completed' ? 'Дууссан' : 'Төлөвлөгдсөн'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-lg font-medium">
                          <span className="text-green-400">{match.player1.name}</span>
                          <span className="text-gray-300">vs</span>
                          <span className="text-green-400">{match.player2.name}</span>
                        </div>
                        
                        {match.score && (
                          <div className="text-gray-300 mt-1">Оноо: {match.score}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(match.date), 'MM/dd')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {match.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.table}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            {/* Filters */}
            <Card className="card-dark">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Тамирчин, клубаар хайх..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-full sm:w-48">
                        <SelectValue placeholder="Ангилал" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="MS">Эрэгтэй дан (MS)</SelectItem>
                        <SelectItem value="WS">Эмэгтэй дан (WS)</SelectItem>
                        <SelectItem value="MD">Эрэгтэй давхар (MD)</SelectItem>
                        <SelectItem value="WD">Эмэгтэй давхар (WD)</SelectItem>
                        <SelectItem value="XD">Холимог давхар (XD)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-full sm:w-32">
                        <SelectValue placeholder="Сар/Он" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="2024-01">2024/01</SelectItem>
                        <SelectItem value="2023-12">2023/12</SelectItem>
                        <SelectItem value="2023-11">2023/11</SelectItem>
                        <SelectItem value="2023-10">2023/10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rankings Table - Desktop */}
            <Card className="card-dark hidden lg:block">
              <CardHeader className="sticky top-0 bg-gray-900 z-10 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-green-400" />
                  Тамирчдын чансаа ({selectedCategory})
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {selectedPeriod} сарын байдлаар
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="sticky top-20 bg-gray-800">
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableHead className="text-gray-300 font-semibold">#</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Тамирчин</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-center">Оноо</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-center">Өөрчлөлт</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-center">Тоглолт</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-center">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRankings.map((player) => (
                      <TableRow key={player.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="font-medium">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            player.rank === 1 ? 'bg-yellow-500' :
                            player.rank === 2 ? 'bg-gray-400' :
                            player.rank === 3 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {player.rank}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <button
                                onClick={() => navigateToPlayer(player.id)}
                                className="font-medium text-green-400 hover:text-green-300 hover:underline"
                              >
                                {player.name}
                              </button>
                              {player.club && (
                                <p className="text-sm text-gray-400">{player.club}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-white">
                          {player.points}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {player.lastChange > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-500 font-medium">+{player.lastChange}</span>
                              </>
                            ) : player.lastChange < 0 ? (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-red-500 font-medium">{player.lastChange}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-gray-300">
                          {player.wins}/{player.losses} ({player.matchesPlayed})
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToPlayer(player.id)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Профайл
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Rankings Cards - Mobile */}
            <div className="lg:hidden space-y-3">
              {filteredRankings.map((player) => (
                <Card key={player.id} className="card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          player.rank === 1 ? 'bg-yellow-500' :
                          player.rank === 2 ? 'bg-gray-400' :
                          player.rank === 3 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {player.rank}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <button
                            onClick={() => navigateToPlayer(player.id)}
                            className="font-medium text-green-400 hover:text-green-300 hover:underline"
                          >
                            {player.name}
                          </button>
                          {player.club && (
                            <p className="text-xs text-gray-400">{player.club}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{player.points}</div>
                        <div className="flex items-center justify-end gap-1 text-xs">
                          {player.lastChange > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              <span className="text-green-500">+{player.lastChange}</span>
                            </>
                          ) : player.lastChange < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3 text-red-500" />
                              <span className="text-red-500">{player.lastChange}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <span>Тоглолт: {player.wins}/{player.losses} ({player.matchesPlayed})</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPlayer(player.id)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Профайл
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRankings.length === 0 && (
              <Card className="card-dark">
                <CardContent className="py-8">
                  <div className="text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4" />
                    <p>Хайлтанд тохирох тамирчин олдсонгүй</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageWithLoading>
  );
}
