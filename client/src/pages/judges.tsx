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

  const { data: judges = [] } = useQuery<Judge[]>({
    queryKey: ["/api/judges", tab],
    queryFn: async () => {
      const res = await fetch(`/api/judges?type=${tab}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  return (
    <PageWithLoading>
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
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {judges.map(judge => (
                  <Card key={judge.id} className="bg-gray-800 text-white">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={judge.imageUrl} alt={judge.firstName} />
                        <AvatarFallback>{judge.firstName[0]}{judge.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{judge.firstName} {judge.lastName}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value={"international"}>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {judges.map(judge => (
                  <Card key={judge.id} className="bg-gray-800 text-white">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={judge.imageUrl} alt={judge.firstName} />
                        <AvatarFallback>{judge.firstName[0]}{judge.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{judge.firstName} {judge.lastName}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageWithLoading>
  );
}

