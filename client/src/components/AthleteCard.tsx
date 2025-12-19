"use client";

import { ImageWithFallback } from "./ImageWithFallback";
import { motion } from "framer-motion";
import { useState } from "react";

interface AthleteCardProps {
  image?: string | null;
  role: "chairperson" | "member";
  name: string;

  // тамирчны ангилал (шаардлагаасаа шалтгаалаад нэмэж болно)
  status: "national" | "youth" | "junior" | "other";

  description?: string | null;

  roleTextOverride?: string;
  statusTextOverride?: string;

  //  - "athlete" → Тамирчдын зөвлөл (зурган дээр роль)
  //  - "leader"  → Тэргүүлэгч гишүүд (зурган дээр текстгүй, зураг байхгүй бол зөвхөн name+role)
  variant?: "athlete" | "leader";
}

export function AthleteCard({
  image,
  role,
  name,
  status,
  description,
  roleTextOverride,
  statusTextOverride,
  variant = "athlete",
}: AthleteCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const roleText =
    roleTextOverride ||
    (role === "chairperson" ? "Зөвлөлийн Дарга" : "Зөвлөлийн Гишүүн");

  const statusText =
    statusTextOverride ||
    (status === "national"
      ? "Үндэсний шигшээ"
      : status === "youth"
      ? "Залуучууд"
      : status === "junior"
      ? "Өсвөр"
      : "Тамирчин");

  // Stock зураг – зөвхөн athlete variant дээр fallback болгон ашиглана
  const defaultImage =
    "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080";

  // Leaders дээр fallback зураг ашиглахгүй
  const finalImage =
    variant === "athlete" ? image || defaultImage : image || null;

  const hasImage = Boolean(finalImage);

  return (
    <motion.div
      className="flex flex-col h-full"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Зурагтай хэсэг */}
      {hasImage && (
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1000px" }}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
          data-testid={`card-athlete-${name}`}
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
              <div className="relative overflow-hidden bg-black group h-full">
                <ImageWithFallback
                  src={finalImage as string}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Зурган дээрх текст – зөвхөн athlete variant */}
                {variant === "athlete" && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="relative inline-block">
                      <p className="text-white text-sm tracking-wide uppercase">
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

            {/* BACK */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 p-6 flex flex-col justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="space-y-4">
                <h3 className="text-emerald-50 border-b-2 border-emerald-400 pb-2">
                  Танилцуулга
                </h3>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  {description || "Танилцуулга удахгүй нэмэгдэнэ."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* NAME + STATUS / ROLE */}
      <motion.div
        className={`bg-white dark:bg-gray-800 p-6 border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-colors duration-300 rounded-2xl ${
          hasImage ? "mt-3" : ""
        }`}
        whileHover={{ backgroundColor: "#f0fdf4" }}
        transition={{ duration: 0.3 }}
      >
        <h3
          className="mb-2 text-emerald-900 dark:text-emerald-100"
          data-testid={`text-name-${name}`}
        >
          {name}
        </h3>

        {variant === "leader" ? (
          <p className="text-emerald-700/80 dark:text-emerald-300/80 text-sm">
            {roleText}
          </p>
        ) : (
          <p
            className="text-emerald-700/70 dark:text-emerald-300/70 text-sm"
            data-testid={`text-status-${name}`}
          >
            {statusText}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
