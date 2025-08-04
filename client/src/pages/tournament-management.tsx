import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Play, Zap, Users } from "lucide-react";
import { useState } from "react";

export default function TournamentManagement() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleBackToAdmin = () => {
    setLocation("/admin");
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Баг нэмэх</h3>
                <p className="text-gray-600">
                  Энэ хэсэгт та шинэ баг үүсгэж, багийн нэр, лого оруулж, 
                  багийн тоглогчдыг бүртгэх боломжтой.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Баг үүсгэхэд шаардлагатай:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Багийн нэр</li>
                    <li>Багийн лого (сонголттой)</li>
                    <li>Багийн тоглогчдын жагсаалт</li>
                    <li>Ахлагчийн мэдээлэл</li>
                  </ul>
                </div>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Баг үүсгэх формыг нээх
                </Button>
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