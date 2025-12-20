"use client";

import { ImageWithFallback } from "@/components/ImageWithFallback";
import { motion } from "framer-motion";
import { useState } from "react";

interface CouncilMemberCardProps {
  imageUrl?: any;
  name: string;

  // backend-ээ өөрчлөхгүй: page дээрээс role/status string-үүд ирнэ
  role?: string;
  status?: string;

  description?: string;
  highlight?: boolean;
}

export function CouncilMemberCard({
  imageUrl,
  name,
  role,
  status,
  description,
  highlight = false,
}: CouncilMemberCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const hasImage = Boolean(imageUrl);

  return (
    <motion.div
      className="flex flex-col h-full"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* IMAGE (flip) */}
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
              <div className="relative overflow-hidden bg-black h-full">
                <ImageWithFallback
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />

                {/* ✅ JudgeCard шиг хар/ногоон туяа */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Доод текст (Aldartnuud дээр status хамгийн тохиромжтой) */}
                {(status || role) && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="relative inline-block">
                      <p className="text-white text-sm tracking-wide uppercase">
                        {status || role}
                      </p>

                      {/* underline animation */}
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

            {/* BACK (Taniltsuulga) */}
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

      {/* BOTTOM BOX */}
      <motion.div
        className={[
          "bg-white dark:bg-gray-800 p-6 border-2 rounded-2xl transition-colors duration-300",
          hasImage ? "mt-3" : "",
          highlight ? "border-emerald-500/50" : "border-emerald-500/20",
          "hover:border-emerald-500/40",
        ].join(" ")}
        whileHover={{ backgroundColor: "#f0fdf4" }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="mb-2 text-emerald-900 dark:text-emerald-100 text-lg font-bold">
          {name}
        </h3>

        {/* Aldartnuud дээр доор role/status-аа хүссэнээрээ харуулж болно */}
        {role ? (
          <p className="text-emerald-700/80 dark:text-emerald-300/80 text-sm">
            {role}
          </p>
        ) : status ? (
          <p className="text-emerald-700/80 dark:text-emerald-300/80 text-sm">
            {status}
          </p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
