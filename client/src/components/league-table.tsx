import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react";

interface Team {
  id: string;
  name: string;
  colorTheme: string;
  sponsor?: string;
  points: number;
  wins: number;
  losses: number;
  club?: {
    name: string;
  };
}

interface LeagueTableProps {
  teams: Team[];
}

export default function LeagueTable({ teams }: LeagueTableProps) {
  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
            Лигийн хүснэгт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Одоогоор багууд байхгүй байна</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort teams by points (descending), then by wins (descending)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.wins - a.wins;
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-600 font-bold";
      case 2:
        return "text-gray-500 font-semibold";
      case 3:
        return "text-amber-600 font-semibold";
      default:
        return "text-gray-900";
    }
  };

  const getTrendIcon = (team: Team, position: number) => {
    // This would typically come from historical data
    // For now, we'll use a simple logic based on win rate
    const totalGames = team.wins + team.losses;
    const winRate = totalGames > 0 ? team.wins / totalGames : 0;
    
    if (winRate > 0.7) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (winRate < 0.3) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const calculateWinPercentage = (team: Team) => {
    const totalGames = team.wins + team.losses;
    if (totalGames === 0) return 0;
    return Math.round((team.wins / totalGames) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-mtta-green" />
          Лигийн хүснэгт
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Баг</TableHead>
                <TableHead className="text-center">Т</TableHead>
                <TableHead className="text-center">Х</TableHead>
                <TableHead className="text-center">Я</TableHead>
                <TableHead className="text-center">Х%</TableHead>
                <TableHead className="text-center">Оноо</TableHead>
                <TableHead className="text-center">Хандлага</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team, index) => {
                const position = index + 1;
                const totalGames = team.wins + team.losses;
                const winPercentage = calculateWinPercentage(team);
                
                return (
                  <TableRow 
                    key={team.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      position <= 3 ? 'bg-gradient-to-r from-gray-50 to-transparent' : ''
                    }`}
                  >
                    <TableCell className="text-center">
                      <div className={`flex items-center justify-center space-x-1 ${getPositionColor(position)}`}>
                        {getPositionIcon(position)}
                        <span className="font-bold">{position}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.colorTheme || '#22C55E' }}
                        >
                          {team.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{team.name}</div>
                          <div className="text-sm text-gray-500">
                            {team.club?.name || 'Клуб тодорхойгүй'}
                            {team.sponsor && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                {team.sponsor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center font-medium">
                      {totalGames}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="text-mtta-green font-semibold">{team.wins}</span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="text-red-500 font-semibold">{team.losses}</span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge 
                        variant={winPercentage >= 70 ? "default" : winPercentage >= 50 ? "secondary" : "outline"}
                        className={winPercentage >= 70 ? "mtta-green text-white" : ""}
                      >
                        {winPercentage}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-bold text-lg text-gray-900">{team.points}</span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {getTrendIcon(team, position)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* League Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-mtta-green">
              {sortedTeams.reduce((sum, team) => sum + team.wins, 0)}
            </div>
            <div className="text-sm text-gray-600">Нийт хожлого</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {sortedTeams.reduce((sum, team) => sum + team.wins + team.losses, 0)}
            </div>
            <div className="text-sm text-gray-600">Нийт тоглолт</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sortedTeams.length}
            </div>
            <div className="text-sm text-gray-600">Багуудын тоо</div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="sm" className="mtta-green text-white hover:bg-mtta-green-dark">
            Хуваарь үзэх
          </Button>
          <Button size="sm" variant="outline">
            Статистик татах
          </Button>
          <Button size="sm" variant="outline">
            Тоглолтын түүх
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
