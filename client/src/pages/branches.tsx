
import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Users, Phone, Mail, Globe, Zap } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";

// Mock data for branches with coordinates on the map
const branchesData = [
  {
    id: "1",
    name: "Улаанбаатар хотын салбар",
    province: "Улаанбаатар",
    address: "СБД, 1-р хороо, Энхтайваны өргөн чөлөө 54",
    phone: "+976 11 123456",
    email: "ulaanbaatar@mtta.mn",
    website: "www.mtta-ub.mn",
    members: 456,
    clubs: 12,
    x: "65%", // Position on map
    y: "45%",
    description: "Монголын хамгийн том хотын ширээний теннисний салбар"
  },
  {
    id: "2",
    name: "Дархан-Уул аймгийн салбар",
    province: "Дархан-Уул",
    address: "Дархан хот, 1-р хороо",
    phone: "+976 70 123456",
    email: "darkhan@mtta.mn",
    members: 89,
    clubs: 3,
    x: "58%",
    y: "25%",
    description: "Хойд Монголын спортын хөгжлийн төв"
  },
  {
    id: "3",
    name: "Өвөрхангай аймгийн салбар",
    province: "Өвөрхангай",
    address: "Арвайхээр сум",
    phone: "+976 70 234567",
    email: "uvurkhangai@mtta.mn",
    members: 67,
    clubs: 2,
    x: "45%",
    y: "55%",
    description: "Төв Монголын уламжлалт спортын салбар"
  },
  {
    id: "4",
    name: "Баян-Өлгий аймгийн салбар",
    province: "Баян-Өлгий",
    address: "Өлгий сум",
    phone: "+976 70 345678",
    email: "bayan-ulgii@mtta.mn",
    members: 45,
    clubs: 2,
    x: "8%",
    y: "15%",
    description: "Баруун Монголын уулархаг бүсийн салбар"
  },
  {
    id: "5",
    name: "Дорноговь аймгийн салбар",
    province: "Дорноговь",
    address: "Сайншанд сум",
    phone: "+976 70 456789",
    email: "dornogovi@mtta.mn",
    members: 34,
    clubs: 1,
    x: "75%",
    y: "70%",
    description: "Говийн бүсийн ширээний теннисний салбар"
  },
  {
    id: "6",
    name: "Ховд аймгийн салбар",
    province: "Ховд",
    address: "Ховд сум",
    phone: "+976 70 567890",
    email: "khovd@mtta.mn",
    members: 52,
    clubs: 2,
    x: "15%",
    y: "40%",
    description: "Баруун бүсийн спортын хөгжлийн салбар"
  }
];

const LightningSpot = ({ branch, onClick }: { branch: any, onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{ left: branch.x, top: branch.y }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Lightning effect */}
      <div className={`relative transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}>
        {/* Pulsing outer circle */}
        <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
        
        {/* Main circle */}
        <div className="relative w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
          <Zap className="w-4 h-4 text-white" />
        </div>
        
        {/* Hover glow effect */}
        {isHovered && (
          <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full opacity-50 blur-sm"></div>
        )}
      </div>
      
      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black bg-opacity-80 text-white text-sm rounded-lg whitespace-nowrap z-10">
          {branch.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-t-opacity-80"></div>
        </div>
      )}
    </div>
  );
};

const BranchDetailDialog = ({ branch, isOpen, onClose }: { branch: any, isOpen: boolean, onClose: () => void }) => {
  if (!branch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-mtta-green" />
            {branch.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Branch Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ерөнхий мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{branch.email}</span>
                </div>
                {branch.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{branch.website}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Статистик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Гишүүд</span>
                  <Badge variant="secondary">{branch.members}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Клубууд</span>
                  <Badge variant="secondary">{branch.clubs}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Аймаг/хот</span>
                  <Badge className="mtta-green text-white">{branch.province}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {branch.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Дэлгэрэнгүй</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{branch.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="mtta-green text-white hover:bg-mtta-green-dark flex-1">
              <Users className="h-4 w-4 mr-2" />
              Гишүүдийг харах
            </Button>
            <Button variant="outline" className="border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white flex-1">
              <ChevronRight className="h-4 w-4 mr-2" />
              Дэлгэрэнгүй
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Branches() {
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleBranchClick = (branch: any) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedBranch(null);
  };

  return (
    <PageWithLoading>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Салбар холбоод</h1>
                <p className="text-gray-600 mt-2">
                  Монгол орны хэмжээнд үйл ажиллагаа явуулж буй МШТХ-ны салбар холбоод
                </p>
              </div>
              <Badge className="mtta-green text-white text-lg px-4 py-2">
                {branchesData.length} салбар
              </Badge>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-mtta-green" />
                Интерактив газрын зураг
              </CardTitle>
              <p className="text-sm text-gray-600">
                Салбарын дэлгэрэнгүй мэдээллийг харахын тулд цэнхэр цэгэн дээр дарна уу
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative bg-slate-100">
                {/* Map Image */}
                <img 
                  src="/src/assets/mongolia-map.png" 
                  alt="Mongolia Map" 
                  className="w-full h-auto"
                  style={{ maxHeight: '600px', objectFit: 'contain' }}
                />
                
                {/* Lightning Spots */}
                {branchesData.map((branch) => (
                  <LightningSpot
                    key={branch.id}
                    branch={branch}
                    onClick={() => handleBranchClick(branch)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Branches List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Бүх салбарууд</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branchesData.map((branch) => (
                <Card key={branch.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleBranchClick(branch)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{branch.name}</CardTitle>
                      <Badge variant="outline" className="ml-2">{branch.province}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{branch.address}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-mtta-green" />
                        <span>{branch.members} гишүүн</span>
                      </div>
                      <div className="text-gray-500">
                        {branch.clubs} клуб
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white"
                    >
                      Дэлгэрэнгүй <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Detail Dialog */}
        <BranchDetailDialog 
          branch={selectedBranch}
          isOpen={isDialogOpen}
          onClose={closeDialog}
        />
      </div>
    </PageWithLoading>
  );
}
