import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import LeagueTable from "@/components/league-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Calendar, Crown, Target, TrendingUp, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Leagues() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  // Remove authentication requirement - allow viewing for all users

  // Fetch leagues - allow for all users
  const { data: leagues = [], isLoading: leaguesLoading } = useQuery({
    queryKey: ["/api/leagues"],
    retry: false,
  });

  // Fetch teams for selected league
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/leagues", selectedLeague, "teams"],
    enabled: !!selectedLeague,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  // Remove authentication check - show content for all users

  const selectedLeagueData = leagues.find((league: any) => league.id === selectedLeague);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Лигүүд</h1>
              <p className="text-gray-600">Клубуудын хоорондын лигийн тэмцээнүүд</p>
            </div>
            
            {leagues.length > 0 && (
              <Select value={selectedLeague || ""} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Лиг сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league: any) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name} - {league.season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* League List */}
        {leaguesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtta-green mx-auto mb-4"></div>
            <p className="text-gray-600">Лигүүдийг уншиж байна...</p>
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Лиг байхгүй байна</h3>
            <p className="text-gray-600 mb-6">Одоогоор идэвхтэй лиг байхгүй байна</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* League Cards */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Идэвхтэй лигүүд</h2>
              {leagues.map((league: any) => (
                <Card 
                  key={league.id} 
                  className={`cursor-pointer transition-all ${
                    selectedLeague === league.id 
                      ? 'ring-2 ring-mtta-green shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedLeague(league.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="mtta-green text-white w-10 h-10 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{league.name}</h3>
                        <p className="text-sm text-gray-600">{league.season}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(league.startDate).toLocaleDateString('mn-MN')}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Идэвхтэй
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* League Details and Table */}
            <div className="lg:col-span-3">
              {selectedLeague && selectedLeagueData ? (
                <div className="space-y-6">
                  {/* League Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl">{selectedLeagueData.name}</CardTitle>
                          <p className="text-gray-600 mt-1">{selectedLeagueData.season}</p>
                        </div>
                        <Badge className="mtta-green text-white">Идэвхтэй</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{selectedLeagueData.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-mtta-green" />
                          <div>
                            <p className="font-medium">Эхлэх огноо</p>
                            <p className="text-gray-600">{new Date(selectedLeagueData.startDate).toLocaleDateString('mn-MN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-mtta-green" />
                          <div>
                            <p className="font-medium">Дуусах огноо</p>
                            <p className="text-gray-600">{new Date(selectedLeagueData.endDate).toLocaleDateString('mn-MN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-mtta-green" />
                          <div>
                            <p className="font-medium">Багуудын тоо</p>
                            <p className="text-gray-600">{teams.length} баг</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <Link href={`/leagues/${selectedLeague}`}>
                      <Button className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Дэлгэрэнгүй үзэх
                      </Button>
                    </Link>
                  </div>

                  {/* League Table */}
                  <LeagueTable teams={teams} />

                  {/* Top Performers */}
                  {teams.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Leading Team */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                            Тэргүүлэгч
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {teams[0] && (
                            <div className="text-center">
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
                                style={{ backgroundColor: teams[0].colorTheme || '#22C55E' }}
                              >
                                {teams[0].name.charAt(0)}
                              </div>
                              <h3 className="font-bold text-lg">{teams[0].name}</h3>
                              <p className="text-gray-600">{teams[0].points} оноо</p>
                              <div className="flex justify-center space-x-4 mt-2 text-sm">
                                <span className="text-mtta-green">{teams[0].wins}Х</span>
                                <span className="text-red-500">{teams[0].losses}Я</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Most Wins */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Target className="mr-2 h-5 w-5 text-mtta-green" />
                            Хамгийн олон хожсон
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {teams.sort((a: any, b: any) => b.wins - a.wins)[0] && (
                            <div className="text-center">
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
                                style={{ backgroundColor: teams.sort((a: any, b: any) => b.wins - a.wins)[0].colorTheme || '#22C55E' }}
                              >
                                {teams.sort((a: any, b: any) => b.wins - a.wins)[0].name.charAt(0)}
                              </div>
                              <h3 className="font-bold text-lg">{teams.sort((a: any, b: any) => b.wins - a.wins)[0].name}</h3>
                              <p className="text-mtta-green font-bold">{teams.sort((a: any, b: any) => b.wins - a.wins)[0].wins} хожлого</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Best Performance */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                            Шилдэг гүйцэтгэл
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {teams.sort((a: any, b: any) => {
                            const aRatio = a.wins / (a.wins + a.losses || 1);
                            const bRatio = b.wins / (b.wins + b.losses || 1);
                            return bRatio - aRatio;
                          })[0] && (
                            <div className="text-center">
                              <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
                                style={{ backgroundColor: teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].colorTheme || '#22C55E' }}
                              >
                                {teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].name.charAt(0)}
                              </div>
                              <h3 className="font-bold text-lg">
                                {teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].name}
                              </h3>
                              <p className="text-blue-500 font-bold">
                                {Math.round((teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].wins / (teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].wins + teams.sort((a: any, b: any) => {
                                  const aRatio = a.wins / (a.wins + a.losses || 1);
                                  const bRatio = b.wins / (b.wins + b.losses || 1);
                                  return bRatio - aRatio;
                                })[0].losses || 1)) * 100)}% хожлын хувь
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
                      Лигийн хүснэгт
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Лиг сонгоно уу</h3>
                      <p className="text-gray-600">Лигийн хүснэгт болон дэлгэрэнгүй мэдээллийг үзэхийн тулд лиг сонгоно уу</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
