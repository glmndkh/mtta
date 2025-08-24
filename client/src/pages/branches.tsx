
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Globe2, MapPin, Users, Phone, Mail } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import PageWithLoading from "@/components/PageWithLoading";

interface Branch {
  id: string;
  name: string;
  location?: string;
  leader?: string;
  leadershipMembers?: string;
  address?: string;
  activities?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
}

function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) return "";
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/public-objects/")) return imageUrl;
  if (imageUrl.startsWith("/objects/")) return imageUrl;
  if (imageUrl.startsWith("/")) return `/public-objects${imageUrl}`;
  return `/public-objects/${imageUrl}`;
}

// Fallback image for branches without images
const fallback =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360'>` +
      `<rect width='100%' height='100%' fill='#10b981' />` +
      `<g transform='translate(300,180)'>` +
      `<circle r='60' fill='none' stroke='white' stroke-width='3'/>` +
      `<text x='0' y='8' fill='white' font-family='sans-serif' font-size='16' text-anchor='middle'>Салбар</text>` +
      `</g>` +
    `</svg>`
  );

// Mongolia provinces mapping
const MONGOLIA_PROVINCES = [
  { name: "Улаанбаатар", path: "M380,220 L420,220 L420,250 L380,250 Z", x: 400, y: 235 },
  { name: "Архангай", path: "M300,180 L350,180 L350,220 L300,220 Z", x: 325, y: 200 },
  { name: "Баян-Өлгий", path: "M50,100 L120,100 L120,150 L50,150 Z", x: 85, y: 125 },
  { name: "Баянхонгор", path: "M200,220 L280,220 L280,270 L200,270 Z", x: 240, y: 245 },
  { name: "Булган", path: "M320,120 L380,120 L380,180 L320,180 Z", x: 350, y: 150 },
  { name: "Говь-Алтай", path: "M120,250 L200,250 L200,320 L120,320 Z", x: 160, y: 285 },
  { name: "Говьсүмбэр", path: "M380,250 L450,250 L450,300 L380,300 Z", x: 415, y: 275 },
  { name: "Дархан-Уул", path: "M360,80 L420,80 L420,120 L360,120 Z", x: 390, y: 100 },
  { name: "Дорноговь", path: "M450,250 L520,250 L520,320 L450,320 Z", x: 485, y: 285 },
  { name: "Дорнод", path: "M520,150 L600,150 L600,250 L520,250 Z", x: 560, y: 200 },
  { name: "Дундговь", path: "M350,250 L420,250 L420,320 L350,320 Z", x: 385, y: 285 },
  { name: "Завхан", path: "M200,120 L280,120 L280,180 L200,180 Z", x: 240, y: 150 },
  { name: "Орхон", path: "M330,150 L370,150 L370,180 L330,180 Z", x: 350, y: 165 },
  { name: "Өвөрхангай", path: "M280,180 L350,180 L350,250 L280,250 Z", x: 315, y: 215 },
  { name: "Өмнөговь", path: "M200,320 L400,320 L400,380 L200,380 Z", x: 300, y: 350 },
  { name: "Сүхбаатар", path: "M450,300 L550,300 L550,380 L450,380 Z", x: 500, y: 340 },
  { name: "Сэлэнгэ", path: "M380,100 L450,100 L450,150 L380,150 Z", x: 415, y: 125 },
  { name: "Төв", path: "M350,180 L420,180 L420,250 L350,250 Z", x: 385, y: 215 },
  { name: "Увс", path: "M120,150 L200,150 L200,220 L120,220 Z", x: 160, y: 185 },
  { name: "Ховд", path: "M80,180 L160,180 L160,250 L80,250 Z", x: 120, y: 215 },
  { name: "Хөвсгөл", path: "M280,80 L360,80 L360,150 L280,150 Z", x: 320, y: 115 },
  { name: "Хэнтий", path: "M450,150 L520,150 L520,220 L450,220 Z", x: 485, y: 185 }
];

export default function Branches() {
  const [tab, setTab] = useState<string>("mn");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<Branch | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  // Split branches into Mongolian and International
  const mongolianBranches = useMemo(() => {
    return branches.filter(branch => 
      !branch.location || 
      branch.location.includes("Монгол") || 
      branch.location.includes("Улаанбаатар") ||
      branch.location.includes("аймаг") ||
      !branch.location.match(/[A-Za-z]/)
    );
  }, [branches]);

  const internationalBranches = useMemo(() => {
    return branches.filter(branch => 
      branch.location && 
      (branch.location.match(/[A-Za-z]/) && 
       !branch.location.includes("Монгол") && 
       !branch.location.includes("Улаанбаатар"))
    );
  }, [branches]);

  const currentList = tab === "mn" ? mongolianBranches : internationalBranches;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((b) =>
      [b.name, b.location, b.leader].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [currentList, query]);

  // Get branches for selected province
  const provinceBranches = useMemo(() => {
    if (!selectedProvince) return [];
    return mongolianBranches.filter(branch => 
      branch.location?.includes(selectedProvince) || branch.name.includes(selectedProvince)
    );
  }, [mongolianBranches, selectedProvince]);

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

  return (
    <PageWithLoading>
      <PageLayout>
        <div className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8">
          {/* Header and Search */}
          <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Салбар холбоод
              </h1>
              <p className="text-muted-foreground">
                Монгол болон олон улсын салбар холбоодууд — газрын зураг дээрх аймгийг дарж дэлгэрэнгүй мэдээлэл үзнэ үү.
              </p>
            </div>

            <div className="w-full max-w-md">
              <Input
                placeholder="Хайх: нэр, байршил, дарга..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="mn" className="gap-2">
                <MapPin className="h-4 w-4" /> Монгол
              </TabsTrigger>
              <TabsTrigger value="int" className="gap-2">
                <Globe2 className="h-4 w-4" /> Олон улс
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mn" className="space-y-6">
              {/* Mongolia Map */}
              <MongoliaMaps 
                onProvinceClick={setSelectedProvince}
                selectedProvince={selectedProvince}
                branches={mongolianBranches}
              />
              
              {/* Selected Province Details */}
              {selectedProvince && (
                <ProvinceDetails 
                  province={selectedProvince}
                  branches={provinceBranches}
                />
              )}

              {/* Grid layout fallback */}
              {!selectedProvince && (
                <DirectoryGrid
                  branches={filtered}
                  selectedId={selected?.id}
                  onSelect={(b) => setSelected(b)}
                />
              )}

              {/* Detail panel */}
              <DetailPanel branch={selected} tab={tab} />
            </TabsContent>

            <TabsContent value="int" className="space-y-6">
              <DirectoryGrid
                branches={filtered}
                selectedId={selected?.id}
                onSelect={(b) => setSelected(b)}
              />

              {/* Detail panel */}
              <DetailPanel branch={selected} tab={tab} />
            </TabsContent>
          </Tabs>
        </div>
      </PageLayout>
    </PageWithLoading>
  );
}

// Mongolia Interactive Map Component
function MongoliaMaps({ onProvinceClick, selectedProvince, branches }: {
  onProvinceClick: (province: string) => void;
  selectedProvince: string | null;
  branches: Branch[];
}) {
  const getProvinceColor = (provinceName: string) => {
    const hasBranches = branches.some(branch => 
      branch.location?.includes(provinceName) || branch.name.includes(provinceName)
    );
    
    if (selectedProvince === provinceName) {
      return "#ef4444"; // Red for selected
    }
    
    if (hasBranches) {
      return "#10b981"; // Green for provinces with branches
    }
    
    return "#64748b"; // Gray for provinces without branches
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-mtta-green" />
          Монголын Газрын Зураг
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Аймгийг дарж салбар холбооны мэдээлэл үзнэ үү. Ногоон өнгөтэй аймагт салбар холбоо байна.
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg 
            viewBox="0 0 650 400" 
            className="w-full h-auto min-h-[400px] border rounded-lg"
            style={{ backgroundColor: '#1e293b' }}
          >
            {/* Background */}
            <rect width="650" height="400" fill="#1e293b" />
            
            {/* Province paths */}
            {MONGOLIA_PROVINCES.map((province) => (
              <g key={province.name}>
                <path
                  d={province.path}
                  fill={getProvinceColor(province.name)}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer transition-all duration-200 hover:opacity-80"
                  style={{
                    transform: selectedProvince === province.name ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: `${province.x}px ${province.y}px`,
                    filter: selectedProvince === province.name ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                  }}
                  onClick={() => onProvinceClick(province.name)}
                />
                <text
                  x={province.x}
                  y={province.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none select-none"
                  fill="white"
                >
                  {province.name}
                </text>
              </g>
            ))}
            
            {/* Title */}
            <text
              x="325"
              y="30"
              textAnchor="middle"
              className="text-lg font-bold"
              fill="white"
            >
              МОНГОЛ УЛСЫН САЛБАР ХОЛБООД
            </text>
            
            {/* Legend */}
            <g transform="translate(20, 350)">
              <rect x="0" y="0" width="20" height="15" fill="#10b981" />
              <text x="25" y="12" className="text-xs" fill="white">Салбар холбоотай</text>
              
              <rect x="150" y="0" width="20" height="15" fill="#64748b" />
              <text x="175" y="12" className="text-xs" fill="white">Салбар холбоогүй</text>
              
              <rect x="300" y="0" width="20" height="15" fill="#ef4444" />
              <text x="325" y="12" className="text-xs" fill="white">Сонгогдсон</text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

// Province Details Component
function ProvinceDetails({ province, branches }: { province: string; branches: Branch[] }) {
  return (
    <Card className="border-l-4 border-l-mtta-green">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-mtta-green" />
          {province}
          <Badge variant="secondary">{branches.length} салбар холбоо</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {branches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.map((branch) => (
              <Card key={branch.id} className="p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">{branch.name}</h4>
                  {branch.leader && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {branch.leader}
                    </p>
                  )}
                  {branch.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {branch.phone}
                    </p>
                  )}
                  {branch.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {branch.email}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{province} аймагт салбар холбоо байхгүй байна</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grid layout for branch cards
function DirectoryGrid({
  branches,
  selectedId,
  onSelect,
}: {
  branches: Branch[];
  selectedId?: string;
  onSelect: (b: Branch) => void;
}) {
  if (branches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Салбар холбоо олдсонгүй</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {branches.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          className={
            "group relative overflow-hidden rounded-2xl border bg-card text-left transition " +
            (selectedId === b.id ? "ring-2 ring-primary" : "hover:shadow-md")
          }
        >
          <div className="aspect-[4/3] w-full">
            <img
              src={getImageUrl(b.imageUrl) || fallback}
              alt={b.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gradient-to-t from-black/70 to-black/0 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-sm font-semibold text-white">{b.name}</span>
              <ChevronRight className="h-4 w-4 text-white/80 transition group-hover:translate-x-0.5" />
            </div>
            {b.location && (
              <div className="mt-1">
                <Badge variant="secondary" className="bg-white/90 text-[10px]">
                  {b.location}
                </Badge>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// Detail panel for selected branch
function DetailPanel({ branch, tab }: { branch: Branch | null; tab: string }) {
  if (!branch) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            {tab === "mn" ? "Монголын салбар холбоо сонгоно уу" : "Олон улсын салбар холбоо сонгоно уу"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Дээрх картын зураг дээр дарж дэлгэрэнгүй мэдээллээ үзнэ үү.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl">{branch.name}</CardTitle>
          {branch.location && (
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="outline">{branch.location}</Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Холбоо барих</Button>
          <Button size="sm">Илүү дэлгэрэнгүй</Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="grid grid-cols-1 gap-6 py-6 md:grid-cols-5">
        {/* Image */}
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-xl border">
            <img
              src={getImageUrl(branch.imageUrl) || fallback}
              alt={branch.name}
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>

        {/* Information */}
        <div className="md:col-span-3">
          <div className="space-y-4 text-sm">
            {branch.activities && <p className="leading-6">{branch.activities}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info label="Хаяг" value={branch.address || "—"} />
              <Info label="Дарга" value={branch.leader || "—"} />
              <Info label="Байршил" value={branch.location || "—"} />
              <Info label="Удирдлагын гишүүд" value={branch.leadershipMembers || "—"} />
              {branch.phone && <Info label="Утас" value={branch.phone} />}
              {branch.email && <Info label="Имэйл" value={branch.email} />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
