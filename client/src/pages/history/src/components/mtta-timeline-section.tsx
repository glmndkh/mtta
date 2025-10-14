import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { MTTATimelineEvent } from "./mtta-timeline-event";

const mttaEvents = [
  {
    year: "2024",
    title: "Олон улсын аварга шалгаруулах тэмцээн",
    description:
      "Монголын шилдэг тамирчид дэлхийн аваргатай өрсөлдөж, шинэ амжилт тогтоолоо. Залуу үеийнхний дэвшил гайхалтай байлаа.",
    images: [
      "https://images.unsplash.com/photo-1758634016761-74aaacbf8739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHBsYXllciUyMGNvbXBldGl0aW9ufGVufDF8fHx8MTc2MDMzNjc2NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1576617497557-22895ee5930b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5nJTIwcG9uZyUyMHRvdXJuYW1lbnQlMjB3aW5uZXJ8ZW58MXx8fHwxNzYwMzM2NzY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
  {
    year: "2023",
    title: "Үндэсний аварга шалгаруулах тэмцээн",
    description:
      "Улсын хэмжээний томоохон тэмцээн зохион байгуулж, 200 гаруй тамирчин оролцлоо. Шинэ авьяаслаг тамирчид илэрлээ.",
    images: [
      "https://images.unsplash.com/photo-1624936187819-6a64403d63eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHRlYW0lMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjAzMzY3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
  {
    year: "2022",
    title: "Дасгалжуулагчдын олон улсын семинар",
    description:
      "Азийн болон дэлхийн шилдэг дасгалжуулагчдын хамтын ажиллагаагаар чадавхи дээшлүүлэх сургалт зохион байгууллаа.",
    images: [
      "https://images.unsplash.com/photo-1743456103143-0c0f23c3853b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHRyYWluaW5nfGVufDF8fHx8MTc2MDMzNjc2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1659303388050-6340719de9d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5nJTIwcG9uZyUyMGF0aGxldGVzfGVufDF8fHx8MTc2MDMzNjc2Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
  {
    year: "2021",
    title: "Залуучуудын хөгжлийн хөтөлбөр",
    description:
      "Хот хөдөөгүй залуу тамирчдад зориулсан сургалт, тоног төхөөрөмжийн дэмжлэг үзүүлэх хөтөлбөр амжилттай хэрэгжлээ.",
    images: [
      "https://images.unsplash.com/photo-1576617497557-22895ee5930b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMGNoYW1waW9uc2hpcHxlbnwxfHx8fDE3NjAzMzY3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
  {
    year: "2020",
    title: "Шинэ сургалтын төв нээлтээ хийлээ",
    description:
      "Олон улсын стандартад нийцсэн орчин үеийн тоног төхөөрөмж бүхий сургалтын төв байгуулж, үйл ажиллагаа эхлүүллээ.",
    images: [
      "https://images.unsplash.com/photo-1743456103143-0c0f23c3853b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHRyYWluaW5nfGVufDF8fHx8MTc2MDMzNjc2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1758634016761-74aaacbf8739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHBsYXllciUyMGNvbXBldGl0aW9ufGVufDF8fHx8MTc2MDMzNjc2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
  {
    year: "2019",
    title: "Монголын Ширээний Теннисний Холбоо байгуулагдсан",
    description:
      "МШТХ албан ёсоор бүртгүүлж, ширээний теннисийг Монголд хөгжүүлэх эрхэм зорилго дэвшүүлсэн түүхэн өдөр болсон.",
    images: [
      "https://images.unsplash.com/photo-1624936187819-6a64403d63eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZSUyMHRlbm5pcyUyMHRlYW0lMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjAzMzY3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
];

export function MTTATimelineSection() {
  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#0B0F17" }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-40 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "#00C16A" }}
        />
        <div
          className="absolute bottom-40 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: "#00C16A" }}
        />
      </div>

      {/* Header Section */}
      <div className="relative pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <h1 className="text-white mb-4">🏓 Манай түүхэн мөчүүд</h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-3">
              Монголын ширээний теннисний холбооны он дарааллын түүх
            </p>
            {/* Green underline effect */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 w-24 mx-auto rounded-full"
              style={{
                backgroundColor: "#00C16A",
                boxShadow: "0 0 15px rgba(0, 193, 106, 0.6)",
              }}
            />
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.9 }}
            className="mt-16 flex flex-col items-center"
          >
            <span className="text-gray-500 mb-3">Үргэлжлүүлэн үзэх</span>
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="w-7 h-7" style={{ color: "#00C16A" }} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 pb-32">
        {/* Central vertical glowing line */}
        <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 hidden md:block pointer-events-none">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-0.5 h-full origin-top"
            style={{
              backgroundColor: "#00C16A",
              boxShadow: "0 0 10px rgba(0, 193, 106, 0.8), 0 0 20px rgba(0, 193, 106, 0.4)",
            }}
          />
        </div>

        {/* Mobile vertical line */}
        <div
          className="absolute left-8 top-0 bottom-0 w-0.5 md:hidden"
          style={{
            backgroundColor: "#00C16A",
            opacity: 0.4,
          }}
        />

        {/* Timeline Events */}
        <div className="relative pt-8">
          {mttaEvents.map((event, index) => (
            <MTTATimelineEvent key={index} {...event} index={index} />
          ))}
        </div>

        {/* End marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mt-12"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "#00C16A",
              boxShadow: "0 0 30px rgba(0, 193, 106, 0.6), 0 0 60px rgba(0, 193, 106, 0.3)",
            }}
          >
            <div className="w-7 h-7 rounded-full bg-[#0B0F17]" />
          </div>
        </motion.div>
      </div>

      {/* Footer gradient fade */}
      <div
        className="h-32"
        style={{
          background: "linear-gradient(180deg, #0B0F17 0%, #05070C 100%)",
        }}
      />
    </div>
  );
}
