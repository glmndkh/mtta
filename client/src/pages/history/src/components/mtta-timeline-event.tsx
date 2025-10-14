import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface MTTATimelineEventProps {
  year: string;
  title: string;
  description: string;
  images: string[];
  index: number;
}

export function MTTATimelineEvent({
  year,
  title,
  description,
  images,
  index,
}: MTTATimelineEventProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref} className="relative mb-32 md:mb-40">
      {/* Grid layout: text left, year center, images right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Left: Event Title & Description */}
        <motion.div
          initial={{ opacity: 0, x: -40, y: 20 }}
          animate={isVisible ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="md:col-span-5 md:text-right order-2 md:order-1"
        >
          <h3 className="text-white mb-3">{title}</h3>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </motion.div>

        {/* Center: Year with glowing dot */}
        <div className="md:col-span-2 flex justify-center items-center order-1 md:order-2">
          <div className="relative flex items-center justify-center">
            {/* Glowing dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={isVisible ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative">
                {/* Main dot */}
                <div
                  className="w-5 h-5 rounded-full shadow-lg shadow-[#00C16A]/50"
                  style={{ backgroundColor: "#00C16A" }}
                />
              </div>
            </motion.div>

            {/* Large year text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative z-10"
            >
              <div
                className="text-5xl md:text-6xl px-6 py-3 rounded-lg"
                style={{
                  fontWeight: 700,
                  color: "#00C16A",
                  textShadow: "0 0 20px rgba(0, 193, 106, 0.5), 0 0 40px rgba(0, 193, 106, 0.3)",
                }}
              >
                {year}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right: Images */}
        <motion.div
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={isVisible ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="md:col-span-5 order-3"
        >
          <div className="flex gap-4 md:gap-5">
            {images.map((image, idx) => (
              <motion.div
                key={idx}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(0, 193, 106, 0.6)",
                }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-xl flex-1"
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 193, 106, 0.2)",
                }}
              >
                <div className="aspect-[4/3]">
                  <img
                    src={image}
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
