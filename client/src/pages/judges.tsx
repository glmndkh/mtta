import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouncilHero } from "@/components/council/CouncilHero";
import { CouncilMemberCard } from "@/components/council/CouncilMemberCard";
import { formatName } from "@/lib/utils";

interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  judgeType: "domestic" | "international" | string;
  role?: string | null;
  biography?: string | null;
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1758518729685-f88df7890776?auto=format&fit=crop&w=1600&q=80";
const HERO_SUBTITLE =
  "Монгол Улсын шүүхийн тогтолцоог төлөөлөн ажилладаг мэргэжлийн шүүгчдийн баг";

const STATUS_LABEL: Record<string, string> = {
  domestic: "Дотоодын шүүгч",
  international: "Олон улсын шүүгч",
};

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
    queryKey: ["judges", tab],
    queryFn: async () => {
      const res = await fetch(`/api/judges?type=${tab}`);
      if (!res.ok) {
        throw new Error("Шүүгчдийн мэдээллийг татахад алдаа гарлаа.");
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredJudges = useMemo(() => {
    if (!Array.isArray(judges)) return [];
    return judges.filter((judge) => judge.judgeType === tab);
  }, [judges, tab]);

  return (
    <PageWithLoading isLoading={judgesLoading} error={judgesError}>
      <Navigation />
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-emerald-50">
        <CouncilHero title="Шүүгчдийн Зөвлөл" subtitle={HERO_SUBTITLE} backgroundImage={HERO_IMAGE} />
        <section className="relative -mt-16 pb-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/60 p-6 shadow-2xl backdrop-blur">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 gap-3 rounded-full bg-emerald-950/40 p-2">
                  <TabsTrigger
                    value="domestic"
                    className="rounded-full border border-emerald-500/20 bg-emerald-900/40 px-6 py-3 text-sm font-semibold text-emerald-200 transition data-[state=active]:!border-transparent data-[state=active]:!bg-emerald-400 data-[state=active]:!text-emerald-950 data-[state=active]:shadow-lg"
                  >
                    Дотоодын шүүгчид
                  </TabsTrigger>
                  <TabsTrigger
                    value="international"
                    className="rounded-full border border-emerald-500/20 bg-emerald-900/40 px-6 py-3 text-sm font-semibold text-emerald-200 transition data-[state=active]:!border-transparent data-[state=active]:!bg-emerald-400 data-[state=active]:!text-emerald-950 data-[state=active]:shadow-lg"
                  >
                    Олон улсын шүүгчид
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="domestic" className="mt-8 focus-visible:outline-none">
                  <JudgesGrid judges={filteredJudges} tab={tab} />
                </TabsContent>
                <TabsContent value="international" className="mt-8 focus-visible:outline-none">
                  <JudgesGrid judges={filteredJudges} tab={tab} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </div>
    </PageWithLoading>
  );
}

function JudgesGrid({ judges, tab }: { judges: Judge[]; tab: string }) {
  if (!judges.length) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-900/40 p-12 text-center text-emerald-200">
        {tab === "domestic" ? "Дотоодын шүүгч байхгүй байна" : "Олон улсын шүүгч байхгүй байна"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {judges.map((judge) => {
        const name = formatName(judge.firstName, judge.lastName);
        const status = STATUS_LABEL[judge.judgeType] ?? STATUS_LABEL[tab] ?? "";
        const highlight = Boolean(judge.role?.toLowerCase().includes("дарга"));

        return (
          <CouncilMemberCard
            key={judge.id}
            imageUrl={judge.imageUrl}
            name={name}
            role={judge.role ?? "Шүүгчдийн Зөвлөлийн Гишүүн"}
            status={status}
            description={judge.biography}
            highlight={highlight}
          />
        );
      })}
    </div>
  );
}
