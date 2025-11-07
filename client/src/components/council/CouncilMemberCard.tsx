import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface CouncilMemberCardProps {
  imageUrl?: string | null;
  name: string;
  role?: string;
  status?: string;
  description?: string | null;
  highlight?: boolean;
}

function MemberImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [didError, setDidError] = useState(false);
  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  if (!imageUrl || didError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-3xl font-semibold text-emerald-100">
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setDidError(true)}
    />
  );
}

export function CouncilMemberCard({
  imageUrl,
  name,
  role = "Шүүгчдийн Зөвлөлийн Гишүүн",
  status,
  description,
  highlight = false,
}: CouncilMemberCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.article
      className="flex h-full flex-col"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        onFocus={() => setIsFlipped(true)}
        onBlur={() => setIsFlipped(false)}
        tabIndex={0}
      >
        <motion.div
          className="relative aspect-[3/4] w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="group relative h-full overflow-hidden bg-black">
              <MemberImage imageUrl={imageUrl ?? undefined} name={name} />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-700/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="relative inline-block">
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
                    {role}
                  </p>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: isFlipped ? "100%" : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-emerald-50">Танилцуулга</h3>
              <p className="text-sm leading-relaxed text-emerald-100/90">
                {description?.trim() || "Танилцуулга бэлтгэгдэж байна."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className={cn(
          "mt-3 rounded-2xl border-2 border-emerald-500/20 bg-white p-6 text-left shadow-lg transition-colors duration-300",
          highlight ? "border-emerald-400/60" : "hover:border-emerald-500/40"
        )}
        whileHover={{ backgroundColor: "#f0fdf4" }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-emerald-900">{name}</h3>
        {status ? <p className="text-sm text-emerald-700/70">{status}</p> : null}
      </motion.div>
    </motion.article>
  );
}

