import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { formatName } from "@/lib/utils";

interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  judgeType: string;
}

export default function JudgesPage() {
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "domestic";
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    return type === "international" ? "international" : "domestic";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("type", tab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [tab]);

  const {
    data: judges,
    isLoading: judgesLoading,
    error: judgesError,
  } = useQuery<Judge[]>({
    queryKey: ["/api/judges", tab],
    queryFn: async () => {
      const res = await fetch(`/api/judges?type=${tab}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const renderJudgeCard = (judge: Judge) => (
    <Card key={judge.id} className="overflow-hidden">
      {judge.imageUrl && (
        <img
          src={judge.imageUrl}
          alt={formatName(judge.firstName, judge.lastName)}
          className="w-full h-48 object-contain bg-gray-100"
        />
      )}
      <CardContent className="p-4 bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="flex flex-col">
          <span className="text-xl font-semibold">
            {formatName(judge.firstName, judge.lastName)}
          </span>
          <span className="text-sm text-gray-200">
            {judge.judgeType === "domestic" ? "Дотоодын шүүгч" : "Олон улсын шүүгч"}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  console.log("Judges data:", { judges, judgesLoading, judgesError });

  return (
    <PageWithLoading isLoading={judgesLoading} error={judgesError}>
      <Navigation />
      <div className="main-bg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">
            Шүүгчид
          </h1>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800 border-gray-700">
              <TabsTrigger
                value="domestic"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Дотоодын шүүгчид
              </TabsTrigger>
              <TabsTrigger
                value="international"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Олон улсын шүүгчид
              </TabsTrigger>
            </TabsList>
            <TabsContent value="domestic">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {judges && Array.isArray(judges)
                  ? judges
                      .filter((judge) => judge.judgeType === "domestic")
                      .map(renderJudgeCard)
                  : null}
                {judges &&
                  Array.isArray(judges) &&
                  judges.filter((judge) => judge.judgeType === "domestic").length === 0 && (
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
            <TabsContent value="international">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {judges && Array.isArray(judges)
                  ? judges
                      .filter((judge) => judge.judgeType === "international")
                      .map(renderJudgeCard)
                  : null}
                {judges &&
                  Array.isArray(judges) &&
                  judges.filter((judge) => judge.judgeType === "international").length === 0 && (
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
