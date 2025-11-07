import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { useState } from "react";

interface JudgeCardProps {
  image: string;
  role: "Шүүгчдийн Зөвлөлийн Дарга" | "Шүүгчдийн Зөвлөлийн Гишүүн";
  name: string;
  status: "Олон улсын шүүгч" | "Дотоодын шүүгч";
  description: string;
  isChairperson?: boolean;
}

export function JudgeCard({ image, role, name, status, description }: JudgeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div 
      className="flex flex-col"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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
          {/* Front of card */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="relative overflow-hidden bg-black group h-full">
              <ImageWithFallback
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-600/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="relative inline-block">
                  <p className="text-white text-sm tracking-wide uppercase">
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

          {/* Back of card */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 p-6 flex flex-col justify-center"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div className="space-y-4">
              <h3 className="text-emerald-50 border-b-2 border-emerald-400 pb-2">Танилцуулга</h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="bg-white p-6 border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-colors duration-300 rounded-b-2xl mt-2"
        whileHover={{ backgroundColor: "#f0fdf4" }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="mb-2 text-emerald-900">{name}</h3>
        <p className="text-emerald-700/70 text-sm">{status}</p>
      </motion.div>
    </motion.div>
  );
}
