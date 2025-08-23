import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  judgeType: string;
}

export default function JudgesPage() {
  const [tab, setTab] = useState("domestic");

  const { data: judges, isLoading: judgesLoading, error: judgesError } = useQuery<Judge[]>({
    queryKey: ["/api/judges", tab],
    queryFn: async () => {
      const res = await fetch(`/api/judges?type=${tab}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  console.log('Judges data:', { judges, judgesLoading, judgesError });

  return (
    <PageWithLoading isLoading={judgesLoading} error={judgesError}>
      <Navigation />
      <div className="main-bg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">Шүүгчид</h1>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800 border-gray-700">
              <TabsTrigger value="domestic" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Дотоодын шүүгчид</TabsTrigger>
              <TabsTrigger value="international" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Олон улсын шүүгчид</TabsTrigger>
            </TabsList>
            <TabsContent value={"domestic"}>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {judges && Array.isArray(judges) ?
                  judges.filter(judge => judge.judgeType === 'domestic').map(judge => (
                    <Card key={judge.id} className="bg-gray-800 text-white hover:bg-gray-700 transition-colors aspect-[4/3] flex flex-col">
                      <CardContent className="flex flex-col items-center justify-center p-6 h-full text-center">
                        <Avatar className="w-20 h-20 mb-4">
                          <AvatarImage src={judge.imageUrl} alt={judge.firstName} />
                          <AvatarFallback className="text-lg">{judge.firstName?.[0]}{judge.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg mb-1">{judge.firstName} {judge.lastName}</div>
                          <div className="text-sm text-gray-400">Дотоодын шүүгч</div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : null
                }
                {judges && Array.isArray(judges) && judges.filter(judge => judge.judgeType === 'domestic').length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Дотоодын шүүгч байхгүй байна
                  </div>
                )}
                {!judges && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Ачааллаж байна...
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value={"international"}>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {judges && Array.isArray(judges) ?
                  judges.filter(judge => judge.judgeType === 'international').map(judge => (
                    <Card key={judge.id} className="bg-gray-800 text-white hover:bg-gray-700 transition-colors aspect-[4/3] flex flex-col">
                      <CardContent className="flex flex-col items-center justify-center p-6 h-full text-center">
                        <Avatar className="w-20 h-20 mb-4">
                          <AvatarImage src={judge.imageUrl} alt={judge.firstName} />
                          <AvatarFallback className="text-lg">{judge.firstName?.[0]}{judge.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg mb-1">{judge.firstName} {judge.lastName}</div>
                          <div className="text-sm text-gray-400">Олон улсын шүүгч</div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : null
                }
                {judges && Array.isArray(judges) && judges.filter(judge => judge.judgeType === 'international').length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Олон улсын шүүгч байхгүй байна
                  </div>
                )}
                {!judges && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Ачааллаж байна...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
}