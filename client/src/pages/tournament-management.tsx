import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Play, Zap, Users, Upload, Plus, Trash2, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function TournamentManagement() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState<File | null>(null);
  const [players, setPlayers] = useState<Array<{id: number, name: string, playerId?: string}>>([
    { id: 1, name: "", playerId: undefined },
    { id: 2, name: "", playerId: undefined },
    { id: 3, name: "", playerId: undefined },
    { id: 4, name: "", playerId: undefined }
  ]);
  const [searchOpen, setSearchOpen] = useState<{[key: number]: boolean}>({});

  const handleBackToAdmin = () => {
    setLocation("/admin/dashboard");
  };

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeSection === 'add-team'
  });

  const handleAddPlayer = () => {
    const newId = Math.max(...players.map(p => p.id)) + 1;
    setPlayers([...players, { id: newId, name: "", playerId: undefined }]);
  };

  const handleRemovePlayer = (id: number) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handlePlayerNameChange = (id: number, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name, playerId: undefined } : p));
  };

  const handleSelectPlayer = (teamPlayerId: number, user: any) => {
    // Use name if available, otherwise use email but prefer the name
    const displayName = user.name && user.name.trim() ? user.name : user.email;
    setPlayers(players.map(p => 
      p.id === teamPlayerId ? { ...p, name: displayName, playerId: user.id } : p
    ));
    setSearchOpen({ ...searchOpen, [teamPlayerId]: false });
  };

  const getAvailableUsers = (currentPlayerId?: string) => {
    const selectedPlayerIds = players
      .filter(p => p.playerId && p.playerId !== currentPlayerId)
      .map(p => p.playerId);
    
    return (allUsers as any[]).filter((user: any) => 
      !selectedPlayerIds.includes(user.id) && 
      // Only show users that have a name (not just email)
      user.name && user.name.trim()
    );
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTeamLogo(file);
    }
  };

  const handleSaveTeam = () => {
    // TODO: Implement team saving logic
    console.log("Saving team:", {
      name: teamName,
      logo: teamLogo,
      players: players.filter(p => p.name && p.name.trim() !== "")
    });
  };

  const managementOptions = [
    {
      id: 'add-team',
      title: 'Баг нэмэх',
      description: 'Багийн нэр, лого оруулж, багийн тоглогчдыг бүртгэх',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      details: 'Багийн мэдээлэл, лого, тоглогчдын жагсаалт'
    },
    {
      id: 'add-group-match',
      title: 'Бүлгийн тоглолт нэмэх',
      description: 'Бүлгийн шатны тоглолтуудыг тохируулах ба удирдах',
      icon: Users,
      color: 'bg-green-500 hover:bg-green-600',
      details: 'Бүлгийн тоглолтын хуваарь ба дүрэм'
    },
    {
      id: 'create-match',
      title: 'Тоглолт үүсгэх',
      description: 'Хоёр багийн хоорондох дэлгэрэнгүй тоглолтын мэдээлэл оруулах',
      icon: Zap,
      color: 'bg-orange-500 hover:bg-orange-600',
      details: 'Тоглолтын огноо, цаг, байршил, тоглогчид'
    },
    {
      id: 'create-playoff',
      title: 'Play-off буюу баг хуваах',
      description: 'Шөвгийн шатны тоглолтын хэлбэрийг үүсгэх',
      icon: Play,
      color: 'bg-purple-500 hover:bg-purple-600',
      details: 'Элиминацийн шатны бүтэц ба дүрэм'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToAdmin}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Админ самбар руу буцах
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Тэмцээний удирдлага</h1>
            <p className="text-gray-600">ID: {id}</p>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Удирдлагын цэс
        </Badge>
      </div>

      {/* Management Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {managementOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card 
              key={option.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200"
              onClick={() => setActiveSection(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${option.color} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-4">
                  {option.details}
                </div>
                <Button 
                  className={`w-full ${option.color} text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(option.id);
                  }}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {option.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Section Content */}
      {activeSection && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const option = managementOptions.find(opt => opt.id === activeSection);
                if (option) {
                  const IconComponent = option.icon;
                  return (
                    <>
                      <IconComponent className="w-5 h-5" />
                      {option.title}
                    </>
                  );
                }
                return null;
              })()}
            </CardTitle>
            <CardDescription>
              {managementOptions.find(opt => opt.id === activeSection)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSection === 'add-team' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Баг нэмэх</h3>
                  <p className="text-gray-600">
                    Энэ хэсэгт та шинэ баг үүсгэж, багийн нэр, лого оруулж, 
                    багийн тоглогчдыг бүртгэх боломжтой.
                  </p>
                </div>

                {/* Team Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Багийн нэр</Label>
                      <Input
                        id="teamName"
                        placeholder="Багийн нэрийг оруулна уу"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="teamLogo">Багийн лого</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="teamLogo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {teamLogo && (
                        <p className="text-sm text-green-600 mt-1">
                          Сонгосон файл: {teamLogo.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Багийн мэдээлэл:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Багийн нэр: {teamName || "Оруулаагүй"}</li>
                      <li>• Лого: {teamLogo ? "Оруулсан" : "Оруулаагүй"}</li>
                      <li>• Тоглогчдын тоо: {players.filter(p => p.name && p.name.trim()).length}</li>
                    </ul>
                  </div>
                </div>

                {/* Players Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">Тоглогчдын жагсаалт</h4>
                    <Button 
                      onClick={handleAddPlayer}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Тоглогч нэмэх
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">№</TableHead>
                          <TableHead>Тоглогчийн нэр</TableHead>
                          <TableHead className="w-20">Үйлдэл</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player, index) => (
                          <TableRow key={player.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Тоглогчийн нэрийг оруулна уу"
                                  value={player.name}
                                  onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                                  className="flex-1"
                                />
                                <Popover 
                                  open={searchOpen[player.id] || false} 
                                  onOpenChange={(open) => setSearchOpen({ ...searchOpen, [player.id]: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="px-2">
                                      <Search className="w-4 h-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Хэрэглэгч хайх..." />
                                      <CommandList>
                                        <CommandEmpty>Хэрэглэгч олдсонгүй</CommandEmpty>
                                        <CommandGroup heading="Бүртгэлтэй хэрэглэгчид">
                                          {getAvailableUsers(player.playerId).map((user: any) => (
                                            <CommandItem
                                              key={user.id}
                                              value={user.name || user.email}
                                              onSelect={() => handleSelectPlayer(player.id, user)}
                                              className="flex items-center justify-between"
                                            >
                                              <div>
                                                <div className="font-medium">{user.name || user.email}</div>
                                                <div className="text-xs text-gray-500">
                                                  {user.email} • {user.role === 'admin' ? 'Админ' : user.role === 'club_owner' ? 'Клубын эзэн' : 'Тоглогч'}
                                                </div>
                                              </div>
                                              {player.playerId === user.id && (
                                                <Check className="w-4 h-4" />
                                              )}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {player.playerId && (
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Бүртгэлтэй хэрэглэгч сонгосон
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemovePlayer(player.id)}
                                disabled={players.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveTeam}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!teamName.trim() || players.filter(p => p.name && p.name.trim()).length === 0}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Баг хадгалах
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'add-group-match' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Бүлгийн тоглолт нэмэх</h3>
                <p className="text-gray-600">
                  Бүлгийн шатны тоглолтуудыг тохируулж, хуваарийг зохион байгуулах.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Бүлгийн тоглолтын тохиргоо:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Бүлэг үүсгэх ба багуудыг хуваах</li>
                    <li>Тоглолтын хуваарь гаргах</li>
                    <li>Оноо тооцооны систем тохируулах</li>
                    <li>Шөвгийн шатанд шилжих шалгуур</li>
                  </ul>
                </div>
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  Бүлгийн тоглолт эхлүүлэх
                </Button>
              </div>
            )}

            {activeSection === 'create-match' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Тоглолт үүсгэх</h3>
                <p className="text-gray-600">
                  Хоёр багийн хоорондох дэлгэрэнгүй тоглолтын мэдээлэл оруулах.
                </p>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Тоглолтын мэдээлэл:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Тоглох багууд сонгох</li>
                    <li>Тоглолтын огноо ба цаг</li>
                    <li>Байршил ба талбай</li>
                    <li>Шүүгчийн мэдээлэл</li>
                    <li>Дүрэм ба онооны систем</li>
                  </ul>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Тоглолт үүсгэх
                </Button>
              </div>
            )}

            {activeSection === 'create-playoff' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Play-off буюу баг хуваах</h3>
                <p className="text-gray-600">
                  Шөвгийн шатны элиминацийн тоглолтын бүтцийг үүсгэх.
                </p>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Play-off тохиргоо:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Шөвгийн шатанд орох багуудыг тодорхойлох</li>
                    <li>Элиминацийн бүтэц үүсгэх</li>
                    <li>Тоглолтын хуваарь гаргах</li>
                    <li>Финалын форматыг тохируулах</li>
                  </ul>
                </div>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                  Play-off үүсгэх
                </Button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setActiveSection(null)}
                className="mr-2"
              >
                Буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Тэмцээний төлөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Нийт багууд</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Хуваарийн тоглолт</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Гүйцэтгэсэн тоглолт</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">-</div>
              <div className="text-sm text-gray-600">Play-off төлөв</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}