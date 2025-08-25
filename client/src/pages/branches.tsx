
import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, MapPin, Users, Phone, Mail, Globe, Zap, Map } from "lucide-react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import MongoliaMap from "@/components/MongoliaMap";

// Mock data for branches with coordinates on the map (accurately positioned on Mongolia aimags)
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
    x: "57%", // Accurate position for Ulaanbaatar
    y: "48%",
    lat: 47.9184,
    lng: 106.9177,
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
    x: "53%", // Accurate position for Darkhan-Uul aimag
    y: "30%",
    lat: 49.4861,
    lng: 105.9222,
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
    x: "48%", // Accurate position for Uvurkhangai aimag
    y: "55%",
    lat: 46.2764,
    lng: 102.7753,
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
    x: "8%", // Accurate position for Bayan-Ulgii aimag (far west)
    y: "22%",
    lat: 48.9667,
    lng: 89.9167,
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
    x: "73%", // Accurate position for Dornogovi aimag (southeast)
    y: "70%",
    lat: 44.8833,
    lng: 110.1167,
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
    x: "15%", // Accurate position for Khovd aimag (west)
    y: "42%",
    lat: 48.0056,
    lng: 91.6419,
    description: "Баруун бүсийн спортын хөгжлийн салбар"
  },
  {
    id: "7",
    name: "Орхон аймгийн салбар",
    province: "Орхон",
    address: "Эрдэнэт хот",
    phone: "+976 35 123456",
    email: "orkhon@mtta.mn",
    members: 78,
    clubs: 3,
    x: "52%",
    y: "38%",
    lat: 49.0347,
    lng: 104.0828,
    description: "Уул уурхайн бүсийн салбар"
  },
  {
    id: "8",
    name: "Хөвсгөл аймгийн салбар",
    province: "Хөвсгөл",
    address: "Мөрөн сум",
    phone: "+976 38 123456",
    email: "khovsgol@mtta.mn",
    members: 41,
    clubs: 2,
    x: "48%",
    y: "25%",
    lat: 49.6342,
    lng: 100.1625,
    description: "Хөвсгөл нуурын эргийн салбар"
  }
];

// International branches data
const internationalBranches = [
  {
    id: "int1",
    name: "Бээжин салбар холбоо",
    country: "Хятад",
    address: "Beijing, China",
    phone: "+86 10 12345678",
    email: "beijing@mtta.mn",
    members: 23,
    clubs: 1,
    lat: 39.9042,
    lng: 116.4074,
    description: "Хятад дахь монгол теннисчдын холбоо"
  },
  {
    id: "int2",
    name: "Сеул салбар холбоо",
    country: "Солонгос",
    address: "Seoul, South Korea",
    phone: "+82 2 1234 5678",
    email: "seoul@mtta.mn",
    members: 15,
    clubs: 1,
    lat: 37.5665,
    lng: 126.9780,
    description: "Солонгос дахь монгол теннисчдын холбоо"
  },
  {
    id: "int3",
    name: "Токио салбар холбоо",
    country: "Япон",
    address: "Tokyo, Japan",
    phone: "+81 3 1234 5678",
    email: "tokyo@mtta.mn",
    members: 18,
    clubs: 1,
    lat: 35.6762,
    lng: 139.6503,
    description: "Япон дахь монгол теннисчдын холбоо"
  }
];

const LightningSpot = ({ branch, onClick }: { branch: any, onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
      style={{ left: branch.x, top: branch.y }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Radar sweep effect */}
      <div className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="radar-effect absolute inset-0 w-full h-full border-2 border-mtta-green rounded-full opacity-30"></div>
      </div>
      
      {/* Lightning effect */}
      <div className={`relative transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}>
        {/* Pulsing outer circles */}
        <div className="absolute inset-0 w-10 h-10 bg-mtta-green rounded-full opacity-20 animate-ping -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>
        <div className="absolute inset-0 w-8 h-8 bg-mtta-green rounded-full opacity-40 animate-ping animation-delay-150 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>
        
        {/* Main lightning spot */}
        <div className="relative w-6 h-6 bg-gradient-to-r from-mtta-green to-green-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white lightning-spot">
          <Zap className="w-3 h-3 text-white animate-pulse" />
        </div>
        
        {/* Hover glow effect */}
        {isHovered && (
          <div className="absolute inset-0 w-6 h-6 bg-mtta-green rounded-full opacity-60 blur-md glow-border"></div>
        )}
      </div>
      
      {/* Enhanced tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 bg-opacity-95 text-white text-sm rounded-lg whitespace-nowrap z-20 border border-mtta-green shadow-lg">
          <div className="font-semibold">{branch.name}</div>
          <div className="text-xs text-gray-300">{branch.members} гишүүн</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
                  <span className="text-sm text-gray-600">{branch.province ? 'Аймаг/хот' : 'Улс'}</span>
                  <Badge className="mtta-green text-white">{branch.province || branch.country}</Badge>
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
  const [activeTab, setActiveTab] = useState("domestic");

  const handleBranchClick = (branch: any) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedBranch(null);
  };

  const currentBranches = activeTab === "domestic" ? branchesData : internationalBranches;
  const apiKey = "AIzaSyCoaMbDgEr6zX7fqx6yxOg1GJmjIZiW9u0";

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
                  Монгол орон болон гадаадад үйл ажиллагаа явуулж буй МШТХ-ны салбар холбоод
                </p>
              </div>
              <Badge className="mtta-green text-white text-lg px-4 py-2">
                {branchesData.length + internationalBranches.length} салбар
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="domestic" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Монгол дахь салбарууд ({branchesData.length})
              </TabsTrigger>
              <TabsTrigger value="international" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Гадаад дахь салбарууд ({internationalBranches.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="domestic" className="space-y-8">
              {/* Interactive Map for Domestic Branches */}
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-mtta-green" />
                    Монгол дахь салбарууд - Интерактив газрын зураг
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Салбарын дэлгэрэнгүй мэдээллийг харахын тулд цэнхэр цэгэн дээр дарна уу
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                    {/* Map Image */}
                    <img 
                      src="/src/assets/mongolia-map.png" 
                      alt="Mongolia Map" 
                      className="w-full h-auto block"
                      style={{ maxHeight: '600px', objectFit: 'contain', minHeight: '400px' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('/src/assets/')) {
                          target.src = "./src/assets/mongolia-map.png";
                        } else if (target.src.includes('./src/')) {
                          target.src = "client/src/assets/mongolia-map.png";
                        } else {
                          target.style.display = 'none';
                          target.parentElement!.style.background = `
                            linear-gradient(135deg, #1e3a8a, #3730a3, #1e40af),
                            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><rect width="800" height="400" fill="%23334155"/><text x="400" y="200" text-anchor="middle" fill="white" font-size="20">Mongolia Map</text></svg>')
                          `;
                          target.parentElement!.style.backgroundSize = 'contain';
                          target.parentElement!.style.backgroundRepeat = 'no-repeat';
                          target.parentElement!.style.backgroundPosition = 'center';
                          target.parentElement!.style.minHeight = '500px';
                        }
                      }}
                    />
                    
                    {/* Lightning Spots */}
                    {branchesData.map((branch) => (
                      <LightningSpot
                        key={branch.id}
                        branch={branch}
                        onClick={() => handleBranchClick(branch)}
                      />
                    ))}
                    
                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-mtta-green rounded-full animate-pulse"></div>
                        <span className="text-gray-700">Салбар холбоо</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Дэлгэрэнгүй мэдээлэл харахын тулд цэг дээр дарна уу
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps for Domestic Branches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-mtta-green" />
                    Google Maps дээрх салбарууд
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MongoliaMap 
                    branches={branchesData}
                    height="600px"
                    apiKey={apiKey}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="international" className="space-y-8">
              {/* Google Maps for International Branches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-mtta-green" />
                    Олон улсын салбарууд - Google Maps
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Гадаад орнууд дахь Монгол Ширээний Теннисний салбар холбоод
                  </p>
                </CardHeader>
                <CardContent>
                  <MongoliaMap 
                    branches={internationalBranches}
                    height="600px"
                    apiKey={apiKey}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Branches List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeTab === "domestic" ? "Монгол дахь бүх салбарууд" : "Гадаад дахь бүх салбарууд"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentBranches.map((branch) => (
                <Card key={branch.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleBranchClick(branch)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{branch.name}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {branch.province || branch.country}
                      </Badge>
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
