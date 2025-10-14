import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface TimelineEventProps {
  year: string;
  title: string;
  description: string;
  images: string[];
  side: "left" | "right";
  index: number;
}

export function TimelineEvent({
  year,
  title,
  description,
  images,
  side,
  index,
}: TimelineEventProps) {
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
        threshold: 0.2,
        rootMargin: "0px 0px -100px 0px",
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
    <div
      ref={ref}
      className="relative flex items-center justify-center mb-24 md:mb-32"
    >
      {/* Timeline dot with pulse animation */}
      <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isVisible ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-red-600 shadow-lg" />
          <motion.div
            animate={
              isVisible
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0, 0.7],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-red-600"
          />
        </motion.div>
      </div>

      {/* Event card */}
      <motion.div
        initial={{
          opacity: 0,
          x: side === "left" ? -50 : 50,
          y: 30,
        }}
        animate={
          isVisible
            ? {
                opacity: 1,
                x: 0,
                y: 0,
              }
            : {}
        }
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`w-full md:w-[calc(50%-3rem)] ${
          side === "left"
            ? "md:pr-12 md:text-right"
            : "md:pl-12 md:ml-auto md:text-left"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 md:p-8 border border-gray-100">
          {/* Year badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`inline-block mb-4 ${
              side === "right" ? "md:ml-0" : "md:ml-auto"
            }`}
          >
            <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full shadow-md inline-block">
              {year}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-3"
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-gray-600 mb-6"
          >
            {description}
          </motion.p>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`flex gap-4 ${
              side === "left" ? "md:justify-end" : "md:justify-start"
            } justify-start`}
          >
            {images.map((image, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-lg shadow-md w-24 h-24 md:w-28 md:h-28"
              >
                <img
                  src={image}
                  alt={`${title} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
