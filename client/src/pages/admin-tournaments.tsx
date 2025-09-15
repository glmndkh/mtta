import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, Trophy, Settings, Eye } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  format: string;
  status: string;
  prize?: string;
  createdAt: string;
  isPublished: boolean;
}

export default function AdminTournaments() {
  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/admin/tournaments'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'upcoming': { label: 'Удахгүй', variant: 'default' as const },
      'ongoing': { label: 'Үргэлжилж байна', variant: 'default' as const },
      'completed': { label: 'Дууссан', variant: 'secondary' as const },
      'cancelled': { label: 'Цуцлагдсан', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Тэмцээний удирдлага</h1>
            <p className="text-gray-600 mt-2">Бүх тэмцээнүүдийг удирдах, засварлах, үр дүн оруулах</p>
          </div>
          <Link href="/admin/tournament-create">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Шинэ тэмцээн үүсгэх
            </Button>
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trophy className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Тэмцээн байхгүй байна</h3>
              <p className="text-gray-500 text-center mb-6">
                Анхны тэмцээнээ үүсгэж эхлүүлээрэй
              </p>
              <Link href="/admin/tournament-create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Шинэ тэмцээн үүсгэх
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <div className="flex gap-2">
                      {getStatusBadge(tournament.status)}
                      <Badge variant={tournament.isPublished ? "default" : "secondary"}>
                        {tournament.isPublished ? "Нийтлэгдсэн" : "Ноорог"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {tournament.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Хамгийн ихдээ {tournament.maxParticipants} оролцогч</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Trophy className="w-4 h-4" />
                      <span>{tournament.format}</span>
                    </div>

                    {tournament.prize && (
                      <div className="text-sm font-medium text-green-600">
                        Шагнал: {tournament.prize}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Link href={`/tournament/${tournament.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          Харах
                        </Button>
                      </Link>
                      <Link href={`/tournaments/${tournament.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="w-4 h-4 mr-1" />
                          Засах
                        </Button>
                      </Link>

                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}