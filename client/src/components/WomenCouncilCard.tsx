"use client";

import { ImageWithFallback } from "./ImageWithFallback";
import { motion } from "framer-motion";
import { useState } from "react";

interface WomenCouncilCardProps {
  image?: string | null;
  role: "chairperson" | "member";
  name: string;

  // Эмэгтэйчүүдийн ангилал (хэрвээ дараа хэрэгтэй бол)
  status?: "senior" | "youth" | "other";

  description?: string | null;

  roleTextOverride?: string;
  statusTextOverride?: string;

  //  - "women"  → Эмэгтэйчүүдийн зөвлөл
  //  - "leader" → Тэргүүлэгч
  variant?: "women" | "leader";
}

export function WomenCouncilCard({
  image,
  role,
  name,
  status,
  description,
  roleTextOverride,
  statusTextOverride,
  variant = "women",
}: WomenCouncilCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const roleText =
    roleTextOverride ||
    (role === "chairperson" ? "Зөвлөлийн Дарга" : "Зөвлөлийн Гишүүн");

  const statusText =
    statusTextOverride ||
    (status === "senior"
      ? "Ахлах ангилал"
      : status === "youth"
      ? "Залуучууд"
      : "Эмэгтэйчүүдийн төлөөлөл");

  const defaultImage =
    "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  const finalImage =
    variant === "women" ? image || defaultImage : image || null;

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

                {variant === "women" && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white text-sm tracking-wide uppercase">
                      {roleText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 p-6 flex flex-col justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <h3 className="text-emerald-50 border-b-2 border-emerald-400 pb-2 mb-4">
                Танилцуулга
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                {description || "Танилцуулга удахгүй нэмэгдэнэ."}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* TEXT */}
      <motion.div
        className={`bg-white dark:bg-gray-800 p-6 border-2 border-pink-400/20 hover:border-pink-400/40 rounded-2xl transition-colors ${
          hasImage ? "mt-3" : ""
        }`}
        whileHover={{ backgroundColor: "#fff1f2" }}
      >
        <h3 className="mb-2 text-pink-900 dark:text-pink-100">{name}</h3>

        {variant === "leader" ? (
          <p className="text-pink-700/80 text-sm">{roleText}</p>
        ) : (
          <p className="text-pink-700/70 text-sm">{statusText}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
