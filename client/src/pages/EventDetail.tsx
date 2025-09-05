import { useEffect, useState } from "react";
import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import EventHeroRow from "@/components/EventHeroRow";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          throw new Error("Failed to fetch event");
        }
        const data = await res.json();
        if (!ignore) {
          setEvent({
            ...data,
            categories: data.categories ?? [],
            prizePool: data.prizePool ??
              (data.prizeAmount && data.prizeCurrency
                ? { amount: data.prizeAmount, currency: data.prizeCurrency }
                : undefined),
          });
          setNotFound(false);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { label: "Тойм", hash: "#overview" },
    { label: "Draw", hash: "#draw" },
    { label: "Match schedule", hash: "#schedule" },
    { label: "Results", hash: "#results" },
    { label: "Медальтнууд", hash: "#medals" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <EventHeroRow event={event} priority detailPage />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((t) => (
              <a
                key={t.hash}
                href={t.hash}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <section id="register" className="h-32" />
      <Footer />
    </div>
  );
}

