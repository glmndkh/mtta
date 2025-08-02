import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAutocomplete } from "@/components/UserAutocomplete";
import { Plus, Trash2, Save, Download, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

// Mock users for demonstration - replace with real data
const mockUsers: User[] = [
  { id: "1", firstName: "Батbayar", lastName: "Ganbaatar", email: "bat@example.com", phone: "+97699123456", role: "player", clubAffiliation: "Улаанбаатар ТТК", gender: "male", dateOfBirth: "1995-03-15", password: null, createdAt: new Date(), updatedAt: null },
  { id: "2", firstName: "Сарangerel", lastName: "Munkhbat", email: "sara@example.com", phone: "+97699234567", role: "player", clubAffiliation: "Эрдэнэт ТТК", gender: "female", dateOfBirth: "1998-07-22", password: null, createdAt: new Date(), updatedAt: null },
  { id: "3", firstName: "Дөлгөөн", lastName: "Tseveendorj", email: "dolgoon@example.com", phone: "+97699345678", role: "player", clubAffiliation: "Дархан ТТК", gender: "male", dateOfBirth: "1992-11-08", password: null, createdAt: new Date(), updatedAt: null },
  { id: "4", firstName: "Oюunaa", lastName: "Batbold", email: "oyunaa@example.com", phone: "+97699456789", role: "player", clubAffiliation: "Улаанбаатар ТТК", gender: "female", dateOfBirth: "1997-05-30", password: null, createdAt: new Date(), updatedAt: null },
  { id: "5", firstName: "Энхбаяр", lastName: "Munkhjargal", email: "enkhbayar@example.com", phone: "+97699567890", role: "player", clubAffiliation: "Эрдэнэт ТТК", gender: "male", dateOfBirth: "1994-01-18", password: null, createdAt: new Date(), updatedAt: null },
];

interface MatchResult {
  id: string;
  playerA: { id: string; name: string; club: string } | null;
  playerB: { id: string; name: string; club: string } | null;
  score: string;
  winner: "playerA" | "playerB" | null;
}

interface ExcelLikeTournamentTableProps {
  users?: User[];
  onSave?: (results: MatchResult[]) => void;
  className?: string;
}

export function ExcelLikeTournamentTable({ 
  users = mockUsers, 
  onSave,
  className = ""
}: ExcelLikeTournamentTableProps) {
  const [matches, setMatches] = useState<MatchResult[]>([
    {
      id: "match_1",
      playerA: null,
      playerB: null,
      score: "",
      winner: null,
    }
  ]);
  
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  // Add new match row
  const addMatch = () => {
    const newMatch: MatchResult = {
      id: `match_${Date.now()}_${Math.random()}`,
      playerA: null,
      playerB: null,
      score: "",
      winner: null,
    };
    setMatches([...matches, newMatch]);
  };

  // Remove match row
  const removeMatch = (matchId: string) => {
    if (matches.length <= 1) {
      toast({
        title: "Анхааруулга",
        description: "Хамгийн багадаа нэг тоглолт байх ёстой",
        variant: "destructive",
      });
      return;
    }
    setMatches(matches.filter(match => match.id !== matchId));
  };

  // Update match data
  const updateMatch = (matchId: string, field: keyof MatchResult, value: any) => {
    setMatches(matches.map(match => {
      if (match.id === matchId) {
        const updated = { ...match, [field]: value };
        
        // Auto-validate winner selection
        if (field === 'winner' && value && updated.playerA && updated.playerB) {
          const selectedPlayer = value === 'playerA' ? updated.playerA : updated.playerB;
          if (!selectedPlayer) {
            updated.winner = null;
          }
        }
        
        return updated;
      }
      return match;
    }));
  };

  // Validate matches
  const validateMatches = (): string[] => {
    const errors: string[] = [];
    
    matches.forEach((match, index) => {
      const matchNum = index + 1;
      
      // Check if both players are selected
      if (!match.playerA || !match.playerB) {
        errors.push(`Тоглолт ${matchNum}: Хоёр тоглогчийг сонгоно уу`);
      }
      
      // Check if players are different
      if (match.playerA && match.playerB && match.playerA.id === match.playerB.id) {
        errors.push(`Тоглолт ${matchNum}: Ижил тоглогч сонгож болохгүй`);
      }
      
      // Validate score format
      if (match.score && !match.score.match(/^\d+-\d+$/)) {
        errors.push(`Тоглолт ${matchNum}: Оноо буруу форматтай (жишээ: 3-2)`);
      }
    });
    
    return errors;
  };

  // Save results
  const handleSave = () => {
    const errors = validateMatches();
    
    if (errors.length > 0) {
      toast({
        title: "Алдаа илэрлээ",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (onSave) {
      onSave(matches);
    }
    
    toast({
      title: "Амжилттай хадгаллаа",
      description: `${matches.length} тоглолтын үр дүн хадгаллагдлаа`,
    });
  };

  // Export as JSON
  const handleExport = () => {
    const errors = validateMatches();
    
    if (errors.length > 0) {
      toast({
        title: "Экспорт хийхийн өмнө алдаа засна уу",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      totalMatches: matches.length,
      results: matches.map(match => ({
        matchId: match.id,
        playerA: match.playerA,
        playerB: match.playerB,
        score: match.score,
        winner: match.winner,
      }))
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    toast({
      title: "JSON экспорт хийгдлээ",
      description: "Үр дүн clipboard-д хуулагдлаа",
    });
  };

  // Get available players for winner selection
  const getWinnerOptions = (match: MatchResult) => {
    const options = [];
    if (match.playerA) {
      options.push({ value: "playerA", label: match.playerA.name });
    }
    if (match.playerB) {
      options.push({ value: "playerB", label: match.playerB.name });
    }
    return options;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Тэмцээний үр дүн оруулах
            </CardTitle>
            <CardDescription>
              Excel хэлбэрээр тоглолтын үр дүн оруулж, хадгалах
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button onClick={addMatch} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Тоглолт нэмэх
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              JSON экспорт
            </Button>
            <Button onClick={handleSave} size="sm" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Хадгалах
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div ref={tableRef} className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50 border-b-2 border-blue-200 font-semibold text-sm">
              <div className="col-span-1 text-center">№</div>
              <div className="col-span-3">Тоглогч A</div>
              <div className="col-span-3">Тоглогч B</div>
              <div className="col-span-2 text-center">Оноо</div>
              <div className="col-span-2 text-center">Ялагч</div>
              <div className="col-span-1 text-center">Үйлдэл</div>
            </div>

            {/* Table Rows */}
            {matches.map((match, index) => {
              const isInvalid = match.playerA && match.playerB && match.playerA.id === match.playerB.id;
              const winnerOptions = getWinnerOptions(match);
              
              return (
                <div 
                  key={match.id} 
                  className={`grid grid-cols-12 gap-2 p-3 border-b hover:bg-gray-50 ${
                    isInvalid ? 'bg-red-50 border-red-200' : 'border-gray-200'
                  } ${
                    match.winner ? 'bg-green-50' : ''
                  }`}
                >
                  {/* Match Number */}
                  <div className="col-span-1 flex items-center justify-center font-medium">
                    {index + 1}
                  </div>

                  {/* Player A */}
                  <div className="col-span-3">
                    <UserAutocomplete
                      users={users}
                      value={match.playerA?.name || ''}
                      onSelect={(user) => {
                        updateMatch(match.id, 'playerA', {
                          id: user.id,
                          name: `${user.firstName} ${user.lastName}`,
                          club: user.clubAffiliation || ''
                        });
                      }}
                      placeholder="Тоглогч A хайх..."
                      className="w-full"
                    />
                    {match.playerA && (
                      <div className="text-xs text-gray-500 mt-1">
                        {match.playerA.club}
                      </div>
                    )}
                  </div>

                  {/* Player B */}
                  <div className="col-span-3">
                    <UserAutocomplete
                      users={users}
                      value={match.playerB?.name || ''}
                      onSelect={(user) => {
                        updateMatch(match.id, 'playerB', {
                          id: user.id,
                          name: `${user.firstName} ${user.lastName}`,
                          club: user.clubAffiliation || ''
                        });
                      }}
                      placeholder="Тоглогч B хайх..."
                      className="w-full"
                    />
                    {match.playerB && (
                      <div className="text-xs text-gray-500 mt-1">
                        {match.playerB.club}
                      </div>
                    )}
                    {isInvalid && (
                      <div className="text-xs text-red-500 mt-1">
                        Өөр тоглогч сонгоно уу
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="col-span-2">
                    <Input
                      value={match.score}
                      onChange={(e) => updateMatch(match.id, 'score', e.target.value)}
                      placeholder="3-2"
                      className="text-center"
                    />
                  </div>

                  {/* Winner */}
                  <div className="col-span-2">
                    <Select
                      value={match.winner || ''}
                      onValueChange={(value) => updateMatch(match.id, 'winner', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ялагч сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        {winnerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMatch(match.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {matches.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  Тоглолт нэмж эхлэнэ үү
                </p>
                <Button onClick={addMatch} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Эхний тоглолт нэмэх
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {matches.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{matches.length}</div>
                <div className="text-gray-600">Нийт тоглолт</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {matches.filter(m => m.playerA && m.playerB).length}
                </div>
                <div className="text-gray-600">Бүрэн тоглолт</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {matches.filter(m => m.score).length}
                </div>
                <div className="text-gray-600">Оноотой</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {matches.filter(m => m.winner).length}
                </div>
                <div className="text-gray-600">Ялагчтай</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}