
import React from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface ChampionCard {
  name: string;
  title: string;
  image?: string;
}

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  champions: ChampionCard[];
}

const timelineEvents: TimelineEvent[] = [
  {
    year: "2024",
    title: "Олон улсын аварга шалгаруулах тэмцээн",
    description: "Монголын шилдэг тамирчид дэлхийн аваргатай өрсөлдөж, шинэ амжилт тогтоолоо. Залуу үеийнхний дэвшил гайхалтай байлаа.",
    champions: [
      {
        name: "Б. Энхтуул",
        title: "Эмэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/uploads/champion-1.jpg"
      },
      {
        name: "Д. Батбаяр",
        title: "Эрэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/picture/past-champions/D.Alimaa.jpeg"
      }
    ]
  },
  {
    year: "2023",
    title: "Азийн аварга шалгаруулах тэмцээн",
    description: "Монголын баг Азийн тэмцээнд амжилттай оролцож, олон медаль хүртлээ. Залуу тамирчдын өсөлт мэдэгдэхүйц байв.",
    champions: [
      {
        name: "С. Оюунцэцэг",
        title: "Эмэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/uploads/champion-3.jpg"
      },
      {
        name: "Г. Болд",
        title: "Эрэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/uploads/champion-4.jpg"
      }
    ]
  },
  {
    year: "2022",
    title: "Үндэсний лиг",
    description: "Үндэсний лигийн шинэчлэгдсэн форматаар зохион байгуулагдаж, илүү олон тамирчдын оролцоо нэмэгдлээ.",
    champions: [
      {
        name: "Н. Мөнхбаяр",
        title: "Эмэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/uploads/champion-5.jpg"
      },
      {
        name: "Ч. Ганбат",
        title: "Эрэгтэйчүүдийн ганцаарчилсан аварга",
        image: "/uploads/champion-6.jpg"
      }
    ]
  }
];

function ChampionCard({ champion }: { champion: ChampionCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative rounded-lg overflow-hidden bg-gray-800/50 border border-green-500/20 p-4 hover:border-green-500/40 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
          {champion.image ? (
            <img 
              src={champion.image} 
              alt={champion.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Trophy className="w-16 h-16 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold">{champion.name}</h4>
          <p className="text-green-400 text-sm">{champion.title}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function MTTATimelineSection() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-20 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏓 Бидний түүх
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Монголын ширээний теннисний холбооны түүхэн замнал
          </p>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="max-w-7xl mx-auto relative">
        {/* Central line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-green-500 to-green-600 transform -translate-x-1/2 hidden md:block" />

        {/* Timeline Events */}
        <div className="space-y-16">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={event.year}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Event info */}
                <div className={`${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:order-2 md:pl-12'}`}>
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-green-500/20 rounded-lg p-6 hover:border-green-500/40 transition-all">
                    <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{event.description}</p>
                  </div>
                </div>

                {/* Center - Year badge */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block">
                  <span className="text-6xl font-bold text-green-400">{event.year}</span>
                </div>

                {/* Mobile year badge */}
                <div className="md:hidden mb-4">
                  <span className="text-5xl font-bold text-green-400">{event.year}</span>
                </div>

                {/* Right side - Champions */}
                <div className={`${index % 2 === 0 ? 'md:pl-12' : 'md:order-1 md:pr-12'}`}>
                  <div className="space-y-3">
                    {event.champions.map((champion, idx) => (
                      <ChampionCard key={idx} champion={champion} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* End marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mt-16"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/50">
            <div className="w-8 h-8 rounded-full bg-white" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
