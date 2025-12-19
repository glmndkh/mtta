"use client";

import { ImageWithFallback } from "./ImageWithFallback";
import { motion } from "framer-motion";
import { useState } from "react";

interface SeniorsCouncilCardProps {
  image?: string | null;
  role: "chairperson" | "member";
  name: string;

  // Ахмадын ангилал (хэрэгтэй бол)
  status?: "veteran" | "senior" | "other";

  description?: string | null;

  roleTextOverride?: string;
  statusTextOverride?: string;

  //  - "senior" → Ахмадын зөвлөл
  //  - "leader" → Тэргүүлэгч
  variant?: "senior" | "leader";
}

export function SeniorsCouncilCard({
  image,
  role,
  name,
  status,
  description,
  roleTextOverride,
  statusTextOverride,
  variant = "senior",
}: SeniorsCouncilCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const roleText =
    roleTextOverride ||
    (role === "chairperson" ? "Зөвлөлийн Дарга" : "Зөвлөлийн Гишүүн");

  const statusText =
    statusTextOverride ||
    (status === "veteran"
      ? "Ахмад тамирчин"
      : status === "senior"
      ? "Ахмадын төлөөлөл"
      : "Ахмадын төлөөлөл");

  const defaultImage =
    "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  const finalImage =
    variant === "senior" ? image || defaultImage : image || null;

  const hasImage = Boolean(finalImage);

  return (
    <motion.div
      className="flex flex-col h-full"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {hasImage && (
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1000px" }}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
        >
          <motion.div
            className="relative w-full aspect-[3/4]"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* FRONT */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="relative bg-black h-full">
                <ImageWithFallback
                  src={finalImage as string}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {variant === "senior" && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="relative inline-block">
                      <p className="text-white text-sm tracking-wide uppercase">
                        {roleText}
                      </p>
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-amber-300"
                        initial={{ width: 0 }}
                        animate={{ width: isFlipped ? "100%" : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-700 via-yellow-800 to-stone-900 p-6 flex flex-col justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="space-y-4">
                <h3 className="text-amber-50 border-b-2 border-amber-300 pb-2">
                  Танилцуулга
                </h3>
                <p className="text-amber-100 text-sm leading-relaxed">
                  {description || "Танилцуулга удахгүй нэмэгдэнэ."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* TEXT */}
      <motion.div
        className={`bg-white dark:bg-gray-800 p-6 border-2 border-amber-400/20 hover:border-amber-400/40 rounded-2xl transition-colors ${
          hasImage ? "mt-3" : ""
        }`}
        whileHover={{ backgroundColor: "#fffbeb" }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="mb-2 text-amber-900 dark:text-amber-100">{name}</h3>

        {variant === "leader" ? (
          <p className="text-amber-700/80 dark:text-amber-300/80 text-sm">
            {roleText}
          </p>
        ) : (
          <p className="text-amber-700/70 dark:text-amber-300/70 text-sm">
            {statusText}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
