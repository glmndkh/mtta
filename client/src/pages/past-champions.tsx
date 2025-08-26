
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import PageWithLoading from "@/components/PageWithLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl } from "@/lib/utils";

export default function PastChampions() {
  const { data: champions = [] } = useQuery({ queryKey: ['/api/champions'] });
  const [activeTab, setActiveTab] = useState("all");

  // Filter champions by different criteria
  const filterChampions = (filterType: string) => {
    switch (filterType) {
      case "male":
        return champions.filter((champ: any) => champ.gender === "male");
      case "female":
        return champions.filter((champ: any) => champ.gender === "female");
      case "өсвөрийн":
        return champions.filter((champ: any) => champ.championType === "өсвөрийн");
      case "ахмадын":
        return champions.filter((champ: any) => champ.championType === "ахмадын");
      case "улсын":
        return champions.filter((champ: any) => champ.championType === "улсын");
      default:
        return champions;
    }
  };

  const renderChampionsGrid = (filteredChampions: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {filteredChampions.map((champ: any) => (
        <div key={champ.id} className="text-center">
          {champ.imageUrl && (
            <div className="w-full aspect-[3/4] rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <img
                src={getImageUrl(champ.imageUrl)}
                alt={champ.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                console.error('Champion image failed to load:', champ.imageUrl);
                
                if (!target.hasAttribute('data-fallback-tried')) {
                  target.setAttribute('data-fallback-tried', 'true');
                  // Try direct objects path
                  const cleanPath = champ.imageUrl.replace(/^\/+/, '').replace(/^(public-)?objects\//, '');
                  target.src = `/objects/uploads/${cleanPath}`;
                } else if (!target.hasAttribute('data-fallback-2-tried')) {
                  target.setAttribute('data-fallback-2-tried', 'true');
                  // Try without uploads prefix
                  const cleanPath = champ.imageUrl.replace(/^\/+/, '').replace(/^(public-)?objects\/(uploads\/)?/, '');
                  target.src = `/objects/${cleanPath}`;
                } else {
                  // Hide image if all attempts fail
                  target.style.display = 'none';
                }
              }}
              />
            </div>
          )}
          <h2 className="mt-2 font-semibold">{champ.name}</h2>
          <p className="text-sm text-gray-400">{champ.year} оны аварга</p>
          {champ.gender && (
            <p className="text-xs text-gray-500">
              {champ.gender === 'male' ? 'Эрэгтэй' : 
               champ.gender === 'female' ? 'Эмэгтэй' : 'Бусад'}
            </p>
          )}
          {champ.championType && (
            <p className="text-xs text-gray-500">{champ.championType}</p>
          )}
        </div>
      ))}
      {filteredChampions.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          Энэ ангилалд аварга байхгүй байна
        </div>
      )}
    </div>
  );

  return (
    <PageWithLoading>
      <PageLayout>
        <h1 className="text-3xl font-bold mb-8">Үе үеийн аваргууд</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="all">Бүгд</TabsTrigger>
            <TabsTrigger value="male">Эрэгтэй</TabsTrigger>
            <TabsTrigger value="female">Эмэгтэй</TabsTrigger>
            <TabsTrigger value="өсвөрийн">Өсвөрийн</TabsTrigger>
            <TabsTrigger value="ахмадын">Ахмадын</TabsTrigger>
            <TabsTrigger value="улсын">Улсын</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderChampionsGrid(champions)}
          </TabsContent>
          
          <TabsContent value="male">
            {renderChampionsGrid(filterChampions("male"))}
          </TabsContent>
          
          <TabsContent value="female">
            {renderChampionsGrid(filterChampions("female"))}
          </TabsContent>
          
          <TabsContent value="өсвөрийн">
            {renderChampionsGrid(filterChampions("өсвөрийн"))}
          </TabsContent>
          
          <TabsContent value="ахмадын">
            {renderChampionsGrid(filterChampions("ахмадын"))}
          </TabsContent>
          
          <TabsContent value="улсын">
            {renderChampionsGrid(filterChampions("улсын"))}
          </TabsContent>
        </Tabs>
      </PageLayout>
    </PageWithLoading>
  );
}
