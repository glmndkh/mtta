
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Globe2, MapPin, Users } from "lucide-react";
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

export default function Branches() {
  const [tab, setTab] = useState<string>("mn");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<Branch | null>(null);

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
                Монгол болон олон улсын салбар холбоодууд — картын зураг дээр дарж дэлгэрэнгүй мэдээлэл үзнэ үү.
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

            <TabsContent value={tab} className="space-y-6">
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
