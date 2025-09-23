import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Clock, Trophy, UserPlus, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue?: string;
  city?: string;
  country?: string;
  location?: string;
  coverUrl?: string;
  backgroundUrl?: string;
  background?: string;
  heroImage?: string;
  imageUrl?: string;
  image?: string;
  categories: string[];
  participationTypes?: string[];
  prizePool?: { amount: number; currency: string };
  timezone?: string;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EventHeroRowProps {
  event: Event;
  priority?: boolean;
}

const categoryLabels: Record<string, string> = {
  singles_men: "MS",
  singles_women: "WS",
  doubles_men: "MD",
  doubles_women: "WD",
  mixed_doubles: "XD",
  MS: "MS",
  WS: "WS",
  MD: "MD",
  WD: "WD",
  XD: "XD",
};

const getNow = (timezone?: string) => {
  if (!timezone) return new Date();
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone })
  );
};

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${format(s, "MMM dd")} – ${format(e, "MMM dd yyyy")}`;
};

const formatPrize = (prize?: { amount: number; currency: string }) => {
  if (!prize) return null;
  if (prize.currency === "MNT") {
    return new Intl.NumberFormat("mn-MN", {
      style: "currency",
      currency: "MNT",
      minimumFractionDigits: 0,
    }).format(prize.amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: prize.currency,
    minimumFractionDigits: 0,
  }).format(prize.amount);
};

function getCover(ev: Event) {
  const src =
    ev.coverUrl ??
    ev.backgroundUrl ??
    ev.background ??
    ev.heroImage ??
    ev.imageUrl ??
    ev.image ??
    '';
  if (!src) return null;
  const isAbs = /^https?:\/\//i.test(src);
  return isAbs ? src : src.startsWith('/') ? src : `/${src}`;
}

export default function EventHeroRow({ event, priority = false }: EventHeroRowProps) {
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "past">(
    "upcoming"
  );
  const [imgErr, setImgErr] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.closest('button') || target.closest('select')) {
      return;
    }
    window.location.href = `/events/${event.id}`;
  };

  useEffect(() => {
    const update = () => {
      const now = getNow(event.timezone);
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      let target = start;
      if (now < start) {
        setStatus("upcoming");
        target = start;
      } else if (now >= start && now <= end) {
        setStatus("ongoing");
        target = end;
      } else {
        setStatus("past");
        target = end;
      }
      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [event.startDate, event.endDate, event.timezone]);

  const formatNum = (n: number) => n.toString().padStart(2, "0");

  const cats = event.categories
    .map((c) => categoryLabels[c] || c.substring(0, 2).toUpperCase())
    .filter((c) => ["MS", "MD", "WS", "WD", "XD"].includes(c));
  const leftCats = cats.filter((c) => ["MS", "MD", "XD"].includes(c));
  const rightCats = cats.filter((c) => ["WS", "WD"].includes(c));

  const prize = formatPrize(event.prizePool);

  const bg = !imgErr ? getCover(event) : null;

  const { user } = useAuth();

  // Check user registration status
  const { data: userRegistrations = [] } = useQuery({
    queryKey: ["/api/registrations/me", event.id],
    queryFn: async () => {
      const res = await fetch(`/api/registrations/me?tid=${event.id}`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 1000,
    enabled: !!user && !!event.id,
  });

  const isRegistered = Array.isArray(userRegistrations) && userRegistrations.length > 0;

  // Fetch participants for this tournament
  const { data: participants = [] } = useQuery({
    queryKey: ["/api/tournaments", event.id, "participants"],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${event.id}/participants`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 1000,
    enabled: !!event.id,
  });

  return (
      <div className="relative h-[280px] sm:h-[320px] md:h-[360px] w-full overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-xl sm:hover:shadow-2xl" onClick={handleCardClick}>
        {bg ? (
          <img
            src={bg}
            onError={() => setImgErr(true)}
            alt='Event cover'
            className='absolute inset-0 h-full w-full object-cover object-center'
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300' />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/0" />

        {/* Left info */}
        <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 md:left-6 md:bottom-6 max-w-[65%] sm:max-w-[70%] text-white">
          <div className="bg-white/15 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold inline-block mb-1.5 sm:mb-2">
            {formatDateRange(event.startDate, event.endDate)}
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold drop-shadow line-clamp-2">
            {event.name}
          </h2>
          {event.venue && (
            <div className="text-sm sm:text-base text-white/85">{event.venue}</div>
          )}
          <div className="text-sm sm:text-base text-white/85">
            {event.city || event.location}
            {event.country && `, ${event.country}`}
          </div>
          {prize && (
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/85 font-semibold">
              PRIZE MONEY: {prize}
            </div>
          )}
          {status === 'upcoming' ? (
                  <div className="flex items-center gap-2 mt-4">
                    {/* Category Selection Dropdown */}
                    {event.participationTypes && event.participationTypes.length > 0 && (
                      <select
                        className="rounded-full bg-white/20 text-white border border-white/30 px-3 py-2 text-sm font-medium backdrop-blur-sm focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-green-600"
                        defaultValue=""
                      >
                        <option value="" disabled>Ангилал сонгох</option>
                        {event.participationTypes.map((type: string) => (
                          <option key={type} value={type} className="text-gray-900">
                            {type}
                          </option>
                        ))}
                      </select>
                    )}

                    {isRegistered ? (
                      <Button disabled className="px-6 py-2 rounded-full font-bold bg-green-600 text-white cursor-not-allowed">
                        БҮРТГЭГДСЭН
                      </Button>
                    ) : (
                      <Link href={`/events/${event.id}#register`}>
                        <Button className="px-6 py-2 rounded-full font-bold hover:bg-green-700">
                          БҮРТГҮҮЛЭХ
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : status === 'ongoing' ? (
                  <Link href={`/events/${event.id}#schedule`}>
                    <Button className="mt-4 px-4 py-2 rounded-full font-medium hover:bg-green-700">
                      Хуваарь
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/events/${event.id}#results`}>
                    <Button className="mt-4 px-4 py-2 rounded-full font-medium hover:bg-green-700">
                      Үр дүн
                    </Button>
                  </Link>
                )}
        </div>

        {/* Right side countdown & categories */}
        <div className="absolute left-3 right-3 bottom-20 sm:bottom-24 translate-y-0 flex flex-col gap-2 sm:gap-3 sm:left-auto sm:right-3 md:right-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:items-end">
          <div className="relative flex items-center justify-end gap-2">
            {status === "ongoing" && (
              <div className="flex items-center gap-1 text-red-500 mr-1">
                <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
                <span className="text-[10px] md:text-xs font-bold">LIVE</span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {["Days", "Hours", "Minutes", "Seconds"].map((label, idx) => {
                const value = [
                  countdown.days,
                  countdown.hours,
                  countdown.minutes,
                  countdown.seconds,
                ][idx];
                return (
                  <div
                    key={label}
                    className="bg-black/60 backdrop-blur rounded-lg sm:rounded-xl px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 lg:px-5 lg:py-4 text-white text-center"
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold">
                      {formatNum(value)}
                    </div>
                    <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] md:text-xs uppercase opacity-80">
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
            {status === "past" && (
              <div className="absolute -top-3 right-0">
                <span className="bg-white text-gray-900 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Finished
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {leftCats.length > 0 && (
              <div className="bg-black/55 backdrop-blur rounded-lg px-4 py-3 min-w-[220px] text-white space-y-2">
                {leftCats.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between last:mb-0"
                  >
                    <span>{cat}</span>
                    <div className="h-6 w-6 rounded-full bg-cyan-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {cat}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rightCats.length > 0 && (
              <div className="bg-black/55 backdrop-blur rounded-lg px-4 py-3 min-w-[220px] text-white space-y-2">
                {rightCats.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between last:mb-0"
                  >
                    <span>{cat}</span>
                    <div className="h-6 w-6 rounded-full bg-cyan-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {cat}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Display participants count */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-white opacity-90">
          <Users className="h-5 w-5" />
          <span>{participants.length} оролцогч</span>
        </div>
      </div>
  );
}