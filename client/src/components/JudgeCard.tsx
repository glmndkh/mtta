
"use client";

import { ImageWithFallback } from "./ImageWithFallback";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  image?: string | null;
  role: "chairperson" | "member";
  name: string;
  status: "domestic" | "international";
  description?: string | null;
  roleTextOverride?: string;
  statusTextOverride?: string;
  variant?: "judge" | "leader";
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
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 text-3xl font-semibold text-emerald-100">
        {initials || "?"}
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={imageUrl}
      alt={name}
      className="h-full w-full object-cover"
      onError={() => setDidError(true)}
    />
  );
}

export function Card({
  image,
  role,
  name,
  status,
  description,
  roleTextOverride,
  statusTextOverride,
  variant = "judge",
  highlight = false,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const roleText =
    roleTextOverride ||
    (role === "chairperson" ? "Зөвлөлийн Дарга" : "Зөвлөлийн Гишүүн");

  const statusText =
    statusTextOverride ||
    (status === "international" ? "Олон улсын шүүгч" : "Дотоодын шүүгч");

  return (
    <motion.article
      className="flex h-full flex-col"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {image && (
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1200px" }}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
          onFocus={() => setIsFlipped(true)}
          onBlur={() => setIsFlipped(false)}
          tabIndex={0}
          data-testid={`card-judge-${name}`}
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
                <MemberImage imageUrl={image} name={name} />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-700/20 to-transparent" />
                {variant === "judge" && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="relative inline-block">
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
                        {roleText}
                      </p>
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: isFlipped ? "100%" : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="absolute inset-0 flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 p-6"
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
      )}

      <motion.div
        className={cn(
          "rounded-2xl border-2 border-emerald-500/20 bg-white p-6 text-left shadow-lg transition-colors duration-300 dark:bg-gray-800",
          image ? "mt-3" : "",
          highlight ? "border-emerald-400/60" : "hover:border-emerald-500/40"
        )}
        whileHover={{ backgroundColor: "#f0fdf4" }}
        transition={{ duration: 0.3 }}
      >
        <h3 
          className="text-xl font-semibold text-emerald-900 dark:text-emerald-100"
          data-testid={`text-name-${name}`}
        >
          {name}
        </h3>
        {variant === "leader" ? (
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
            {roleText}
          </p>
        ) : (
          <p 
            className="text-sm text-emerald-700/70 dark:text-emerald-300/70"
            data-testid={`text-status-${name}`}
          >
            {statusText}
          </p>
        )}
      </motion.div>
    </motion.article>
  );
}

// Keep JudgeCard as export alias for backwards compatibility
export { Card as JudgeCard };
