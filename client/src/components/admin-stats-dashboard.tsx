import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Shield, Building, Trophy, Calendar, Newspaper, TrendingUp, Award } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminStatsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Нийт хэрэглэгчид",
      value: stats?.totals?.users || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Бүртгэгдсэн тоглогчид",
      value: stats?.totals?.players || 0,
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Клубууд",
      value: stats?.totals?.clubs || 0,
      icon: Building,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Тэмцээнүүд",
      value: stats?.totals?.tournaments || 0,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Лигүүд",
      value: stats?.totals?.leagues || 0,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Мэдээ нийтлэлүүд",
      value: stats?.totals?.news || 0,
      icon: Newspaper,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Хэрэглэгчдийн төрөл
            </CardTitle>
            <CardDescription>Системд бүртгэгдсэн хэрэглэгчдийн ангилал</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={stats?.roleDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {(stats?.roleDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tournament Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Тэмцээний статус
            </CardTitle>
            <CardDescription>Тэмцээнүүдийн одоогийн төлөв</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.tournamentStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Сарын бүртгэл
            </CardTitle>
            <CardDescription>Сүүлийн 6 сарын хэрэглэгчдийн бүртгэл</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.monthlyRegistrations || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* News by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Мэдээний категори
            </CardTitle>
            <CardDescription>Категори бүрээр мэдээний тоо</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.newsByCategory || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Шилдэг тоглогчид
          </CardTitle>
          <CardDescription>Хожлын тооноос хамааруулсан шилдэг 10 тоглогч</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats?.topPlayers || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wins" fill="#00C49F" name="Хожил" />
              <Bar dataKey="losses" fill="#FF8042" name="Ялагдал" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}