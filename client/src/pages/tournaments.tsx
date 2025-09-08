import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import PageWithLoading from "@/components/PageWithLoading";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import EventHeroRow from "@/components/EventHeroRow";
import { Trophy } from "lucide-react";

// Assuming these imports are needed for the mapping logic, though not directly used in the provided snippet:
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  city?: string;
  country?: string;
  venue?: string;
  timezone?: string;
  categories: string[];
  coverUrl?: string;
  prizePool?: { amount: number; currency: string };
  backgroundImageUrl?: string;
  participationTypes?: string[];
  prizes?: string;
  description?: string; // Added based on the changes snippet
  fee?: number; // Added based on the changes snippet
}

// Assuming RegistrationStatus component is defined elsewhere and imported,
// and it expects a tournamentId of type string.
// Example placeholder for RegistrationStatus:
// const RegistrationStatus = ({ tournamentId }: { tournamentId: string }) => {
//   // ... component logic
//   return <div>Registration Status for {tournamentId}</div>;
// };


export default function Tournaments() {
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["/api/tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const sorted = [...tournaments].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const mapped: Tournament[] = sorted.map((t: any) => ({
    ...t,
    city: t.city || t.location?.split(",")[0]?.trim(),
    country: t.country || "Mongolia",
    venue: t.venue || t.location,
    categories: t.categories || t.participationTypes || [],
    coverUrl: t.coverUrl || t.backgroundImageUrl,
    prizePool: t.prizePool ||
      (t.prizes ? { amount: parseFloat(t.prizes.replace(/[^\d.]/g, "")) || 0, currency: "MNT" } : null),
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
          mapped.map((t, idx) => (
            // The following snippet was modified to pass `tournament.id` instead of `tournament`
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{t.description}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>📅 {format(new Date(t.startDate), 'PPP', { locale: mn })}</p>
                    <p>📍 {t.location}</p>
                    <p>💰 {t.fee?.toLocaleString() || '0'} ₮</p>
                  </div>
                </div>
                <RegistrationStatus tournamentId={t.id} />
              </div>
            </div>
          ))
        )}
      </div>

      <Footer />
    </PageWithLoading>
  );
}