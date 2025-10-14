import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { TimelineEvent } from "./timeline-event";

const timelineEvents = [
  {
    year: "1206",
    title: "The Great Beginning",
    description:
      "The foundation of the Mongol Empire marked a turning point in world history, uniting nomadic tribes under visionary leadership.",
    images: [
      "https://images.unsplash.com/photo-1682270073849-7ae39cc14190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwbW9udW1lbnQlMjBoaXN0b3J5fGVufDF8fHx8MTc2MDMzNjIwMXww&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
  {
    year: "1271",
    title: "Era of Expansion",
    description:
      "A period of unprecedented territorial growth and cultural exchange, connecting East and West through the Silk Road.",
    images: [
      "https://images.unsplash.com/photo-1676487861605-31948402f652?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhc3RsZSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NjAzMzYyMDF8MA&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
  {
    year: "1368",
    title: "Cultural Renaissance",
    description:
      "The flourishing of arts, literature, and philosophy created lasting impacts on Asian and world culture.",
    images: [
      "https://images.unsplash.com/photo-1572625259591-a99f7ff63a9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW5haXNzYW5jZSUyMGFydCUyMG11c2V1bXxlbnwxfHx8fDE3NjAyODMyMDF8MA&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
  {
    year: "1921",
    title: "Modern Awakening",
    description:
      "Independence and sovereignty ushered in a new chapter of self-determination and national identity.",
    images: [
      "https://images.unsplash.com/photo-1641402452068-c8e17bb74557?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcmV2b2x1dGlvbiUyMGZhY3Rvcnl8ZW58MXx8fHwxNzYwMzE3NDc3fDA&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
  {
    year: "1990",
    title: "Democratic Transformation",
    description:
      "Peaceful transition to democracy and market economy opened new opportunities for growth and international cooperation.",
    images: [
      "https://images.unsplash.com/photo-1730315661998-dadff57d7f8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwY2l0eXxlbnwxfHx8fDE3NjAzMzYyMDJ8MA&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
  {
    year: "2024",
    title: "Innovation & Future",
    description:
      "Embracing technology and innovation while honoring traditions, shaping a bright future for generations to come.",
    images: [
      "https://images.unsplash.com/photo-1758464643301-e4122c014fb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFjZSUyMGV4cGxvcmF0aW9uJTIwcm9ja2V0fGVufDF8fHx8MTc2MDMzNjIwM3ww&ixlib=rb-4.1.0&q=80&w=400",
    ],
  },
];

export function TimelineSection() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4">🏓 Our Historical Journey</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore the milestones that shaped our legacy through the ages
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 flex flex-col items-center"
          >
            <span className="text-gray-500 mb-2">Scroll to Explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-6 h-6 text-blue-600" />
            </motion.div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative max-w-6xl mx-auto px-4 pb-20">
        {/* Central vertical line with gradient */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 transform -translate-x-1/2 hidden md:block">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full bg-gradient-to-b from-blue-400 via-purple-400 to-red-400 origin-top rounded-full"
            style={{
              background:
                "linear-gradient(180deg, rgba(37, 99, 235, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)",
            }}
          />
        </div>

        {/* Mobile vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-red-400 md:hidden opacity-30" />

        {/* Timeline Events */}
        <div className="relative">
          {timelineEvents.map((event, index) => (
            <TimelineEvent
              key={index}
              {...event}
              side={index % 2 === 0 ? "left" : "right"}
              index={index}
            />
          ))}
        </div>

        {/* End marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mt-8"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-red-600 flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
