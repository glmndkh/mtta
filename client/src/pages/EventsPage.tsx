import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import PageWithLoading from "@/components/PageWithLoading";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import EventHeroRow from "@/components/EventHeroRow";
import { Trophy } from "lucide-react";

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue?: string;
  city?: string;
  country?: string;
  categories: string[];
  coverUrl?: string;
  prizePool?: { amount: number; currency: string };
  timezone?: string;
}

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const sorted = [...events].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const mapped: Event[] = sorted.map((e: any) => ({
    ...e,
    categories: e.categories ?? [],
    prizePool: e.prizePool ??
      (e.prizeAmount && e.prizeCurrency
        ? { amount: e.prizeAmount, currency: e.prizeCurrency }
        : undefined),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithLoading>
      <Navigation />
      <div className="bg-gradient-to-r from-mtta-green to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Тэмцээнүүд</h1>
          <p className="text-xl text-green-100">
            Ширээний теннисний тэмцээнүүдийн бүрэн жагсаалт
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {mapped.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Тэмцээн байхгүй байна
            </h3>
            <p className="text-gray-600">
              Тун удахгүй шинэ тэмцээнүүд нэмэгдэх болно.
            </p>
          </div>
        ) : (
          mapped.map((e, idx) => (
            <EventHeroRow key={e.id} event={e} priority={idx < 1} />
          ))
        )}
      </div>

      <Footer />
    </PageWithLoading>
  );
}

