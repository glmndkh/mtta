import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowDown, ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

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

/** 1) Нэр → Зураг mapping  */
const imgBase = "/picture/past-champions/";
const imageMap: Record<string, string> = {
  "Г.Нооной": imgBase + "G.Noonoi.jpeg",
  "Д.Баньдхүү": imgBase + "D.Banidkhuu.jpeg",
  "Б.Амарсанаа": imgBase + "B.Amarsanaa.jpeg",
  "Ц.Томбуу": imgBase + "Ts.Tombuu.jpeg",
  "Г.Нансалмаа": imgBase + "G.Nansalmaa.jpeg",
  "Д.Алимаа": imgBase + "D.Alimaa.jpeg",
  "Б.Наран": imgBase + "B.Naran.jpeg",
  "Б.Отгонжаргал": imgBase + "B.Otgonjargal.jpeg",
  "Г.Мөнхцэцэг": imgBase + "G.Munkhtsetseg.jpeg",
  "М.Нэргүй": imgBase + "M.Nergui.jpeg",
  "О.Цэдэнбалжир": imgBase + "O.Tsedenbaljir.jpeg",
  "Т.Болд": imgBase + "T.Bold.jpeg",
  "С.Галбадрах": imgBase + "S.Galbadrakh.jpeg",
  "Г.Жаргалсайхан": imgBase + "G.Jargalsaikhan.jpeg",
  "Б.Баясгалан": imgBase + "B.Bayasgalan.jpeg",
  "Б.Мөнхням": imgBase + "B.Monkhnyam.jpeg",
  "Б.Андхүү": imgBase + "B.Andkhuu.jpeg",
  "Д.Баяраа": imgBase + "D.Bayaraa.jpeg",
  "Б.Баярмагнай": imgBase + "B.Bayarmagnai.jpeg",
  "Ц.Наранцацрал": imgBase + "Ts.Narantsatsral.jpeg",
  "О.Лхагвасүрэн": imgBase + "O.Lkhagvasuren.jpeg",
  "К.Оюунчимэг": imgBase + "K.Oyunchimeg.jpeg",
  "Ц.Оюун-Эрдэнэ": imgBase + "Ts.Oyun-Erdene.jpeg",
  "Б.Содболор": imgBase + "B.Sodbolor.jpeg",
  "Б.Лхагвамаа": imgBase + "B.Lkhagvamaa.jpeg",
  "О.Бадамцоо": imgBase + "O.Badamtsoo.jpeg",
  "Я.Бэгз": imgBase + "Ya.Begz.jpeg",
  "Э.Лхагвасүрэн": imgBase + "E.Lkhagvasuren.jpeg",
  "Л.Алтантулга": imgBase + "L.Altantulga.jpeg",
  "Т.Энхтөр": imgBase + "T.Enkhtor.jpeg",
  "Н.Энхсайхан": imgBase + "N.Enkhsaikhan.jpeg",
  "Ч.Номин-Эрдэнэ": imgBase + "Ch.Nomin-Erdene.jpeg",
  "З.Төрболд": imgBase + "Z.Torbold.jpeg",
  "Б.Билэгт": imgBase + "B.Bilegt.jpeg",
  "М.Дэлгэрмаа": imgBase + "M.Delgermaa.jpeg",
  "Б.Энхжин": imgBase + "Enkhjin.jpeg",
  "Б.Эрдэнэсувд": imgBase + "Erdenesuvd.jpeg",
  "Г.Оюунчимэг": imgBase + "G.Oyunchimeg.jpeg",
  "Б.Батхишиг": imgBase + "B.Batkhishig.jpeg",
  "Ч.Алтанцэцэг": imgBase + "Ch.Altantsetseg.jpeg",
  "Л. Батхишиг": imgBase + "L.Batkhishig.jpeg",
  "Ө.Балжинням": imgBase + "U.Baljinnyam.jpeg",
  "Б.Болор-Эрдэнэ": imgBase + "B.Bolor-Erdene.jpeg",
  "Ч.Эрдэнэбаяр": imgBase + "Ch.Erdenebayar.jpeg",
  "М.Ундрам": imgBase + "M.Undram.jpg",
  "Г.Сэр-Од": imgBase + "cat.jpg",
  "М.Манлайжаргал": imgBase + "M.Manlai-Jargal.jpg"
};

/** 2) 1956–2025 оны өгөг (тайлбарууд 1956–1970 онуудад нэмсэн) */
type Row = { year: number; male?: string; female?: string; description?: string };

const championsRaw: Row[] = [
  {
    year: 1956,
    description:
      "• Нийслэлд анх удаа ширээний теннисний (одон бөмбөгийн) тэмцээн зохион байгуулагдсан.\n" +
      "• Энэ жилээс эхлэн сургуулиуд, байгууллагууд дунд тогтмол тэмцээн явагдаж эхэлжээ.\n" +
      "• Монголд ширээний теннис сонирхогчдын тоо нэмэгдэж, спортын анхны үндэс тавигдав."
  },
  {
    year: 1957,
    description:
      "• Монголд анхны улсын аваргын төлөө тэмцээн болсон.\n" +
      "• “Хөдөлмөр” нийгэмлэг болон сургуулиудын дэргэд секцүүд байгуулагдаж, сонирхогчдын тоо улам өсөв.\n" +
      "• Одон бөмбөгийн спорт албан байгууллагуудын дунд өргөн дэлгэрч эхэлжээ."
  },
  {
    year: 1958,
    male: "Г.Нооной",
    female: "Б.Наран",
    description:
      "• Улаанбаатар хотод улсын аварга шалгаруулах анхны тэмцээн болсон.\n" +
      "• “Хөдөлмөр” нийгэмлэгийн залуус анх удаа өрсөлдөж, эмэгтэй 1, эрэгтэй 2 тамирчин оролцсон.\n" +
      "• Тэмцээний дүрэм, зохион байгуулалт сайжирч, спортын стандарт тогтоогдов."
  },
  {
    year: 1959,
    male: "Д.Баньдхүү",
    female: "Б.Наран",
    description:
      "• Сургуулиудын дэргэд бэлтгэл сургалт тогтмол явагдаж эхэлсэн.\n" +
      "• Монголын залуучуудын анхдугаар их наадамд ширээний теннис төрөл орсон.\n" +
      "• Энэ үеэс секц, дугуйлангууд нэмэгдэж, оролцогчдын тоо өсөв."
  },
  {
    year: 1960,
    male: "Д.Баньдхүү",
    female: "Г.Нансалмаа",
    description:
      "• Ширээний теннисний үндсэн холбоо албан ёсоор тогтож, зохион байгуулалт сайжив.\n" +
      "• Монголын тамирчид БНСУ-ын төлөөлөгчидтэй нөхөрсөг тоглолт хийв.\n" +
      "• Бэлтгэлийн тогтолцоо бүрэлдэн, албан ёсны тэмцээний системд шилжив."
  },
  {
    year: 1961,
    male: "Б.Амарсанаа",
    female: "Д.Алимаа",
    description:
      "• Монголын тамирчид анх удаа БНХАУ-д очиж туршлага судлав.\n" +
      "• Улсын аварга 5 төрлөөр зохион байгуулагдаж, цар хүрээ нь тэлэв.\n" +
      "• Техник, тактикийн бэлтгэлийн чанар ахисан он байв."
  },
  {
    year: 1962,
    male: "Б.Амарсанаа",
    female: "Б.Наран",
    description:
      "• Монголын баг Дэлхийн оюутны IV наадамд оролцов.\n" +
      "• Хотын аваргад 27 эрэгтэй, 26 эмэгтэй тамирчин өрсөлджээ.\n" +
      "• Улсын хэмжээнд зохион байгуулалт, оролцоо тогтмол өсөв."
  },
  {
    year: 1963,
    description:
      "• Улсын шигшээ баг байгуулагдав.\n" +
      "• Б.Наран спортын мастер цол хүртсэн (анхны мастер).\n" +
      "• БНМАУ–БНХАУ найрамдлын тэмцээнд Монголын тамирчид анх оролцов; С.Бямбажав, Ц.Төмбүү нар хосоор IV байрт.\n"
  },
  {
    year: 1964,
    male: "Ц.Томбуу",
    female: "Б.Наран",
    description:
      "• Сургууль, үйлдвэр, байгууллагуудын тэмцээн тогтмолжив.\n• Ширээний теннис нийтийн спортын түвшинд дэлгэрэв."
  },
  {
    year: 1965,
    description:
      "• Пионерийн сургуулиуд, үйлдвэрийн хоршоодын дэргэд секцүүд олноор байгуулагдав.\n" +
      "• Залуу тамирчдын тоо эрс өссөн үе эхэллээ."
  },
  {
    year: 1966,
    male: "Б.Амарсанаа",
    female: "Б.Отгонжаргал",
    description:
      "• Өсвөр үеийн уралдаан, сургалт идэвхжив; шинэ авьяастнууд тодорч эхлэв."
  },
  {
    year: 1967,
    description:
      "• Улсын аваргад оролцогчдын тоо огцом өсөв (түүхэн дээд амжилтуудын нэг)."
  },
  {
    year: 1968,
    description:
      "• Оролцогчдын хүрээ, клубүүдийн тоо улам нэмэгдэв; бэлтгэлийн бааз суурь сайжрав."
  },
  {
    year: 1969,
    male: "Ц.Томбуу",
    female: "Б.Отгонжаргал",
    description:
      "• Улсын аваргад 84 эрэгтэй, 36 эмэгтэй тамирчин оролцлоо."
  },
  {
    year: 1970,
    description:
      "• Шинэ үеийн тамирчид тодорч, Д.Жамъянсүрэн, Д.Цэмбэл, Х.Жамъянсүрэн, Б.Долгормаа, Ш.Цагаар зэрэг олон тамирчин амжилт гаргав.\n" +
      "• Спорт бүрэн тогтолцоотой (тогтмол тэмцээн, сургалт, холбоо, шигшээ) хэмжээнд төлөвшив."
  },

  // 1971–2016 (анх байсан аваргууд)
  { year: 1971, male: "Ц.Томбуу", female: "Г.Мөнхцэцэг" },
  { year: 1973, male: "М.Нэргүй", female: "Б.Отгонжаргал" },
  { year: 1975, male: "М.Нэргүй", female: "Г.Нансалмаа" },
  { year: 1976, male: "О.Цэдэнбалжир", female: "Б.Отгонжаргал" },
  { year: 1978, male: "О.Цэдэнбалжир", female: "Б.Отгонжаргал" },
  { year: 1979, male: "М.Нэргүй", female: "Г.Мөнхцэцэг" },
  { year: 1980, male: "О.Цэдэнбалжир", female: "Г.Мөнхцэцэг" },
  { year: 1981, male: "М.Нэргүй", female: "Г.Мөнхцэцэг" },
  { year: 1983, male: "О.Цэдэнбалжир", female: "Г.Мөнхцэцэг" },
  { year: 1985, male: "Т.Болд", female: "Г.Мөнхцэцэг" },
  { year: 1986, male: "Т.Болд", female: "Г.Мөнхцэцэг" },
  { year: 1988, male: "Л. Батхишиг", female: "Б.Отгонжаргал" },
  { year: 1989, male: "Т.Болд", female: "Г.Мөнхцэцэг" },
  { year: 1990, male: "Т.Болд", female: "Ч.Алтанцэцэг" },
  { year: 1991, male: "С.Галбадрах", female: "Г.Мөнхцэцэг" },
  { year: 1992, male: "Г.Жаргалсайхан", female: "К.Оюунчимэг" },
  { year: 1993, male: "Г.Жаргалсайхан", female: "Б.Отгонжаргал" },
  { year: 1994, male: "Б.Баясгалан", female: "Ц.Наранцацрал" },
  { year: 1995, male: "Б.Мөнхням", female: "Г.Мөнхцэцэг" },
  { year: 1996, male: "Б.Андхүү", female: "Б.Лхагвамаа" },
  { year: 1997, male: "Б.Мөнхням", female: "О.Бадамцоо" },
  { year: 1998, male: "Д.Баяраа", female: "Г.Оюунчимэг" },
  { year: 1999, male: "Б.Баярмагнай", female: "Ц.Наранцацрал" },
  { year: 2000, male: "Б.Баярмагнай", female: "О.Лхагвасүрэн" },
  { year: 2001, male: "С.Галбадрах", female: "К.Оюунчимэг" },
  { year: 2002, male: "Я.Бэгз", female: "Ц.Оюун-Эрдэнэ" },
  { year: 2003, male: "С.Галбадрах", female: "Б.Содболор" },
  { year: 2004, male: "Я.Бэгз", female: "Б.Содболор" },
  { year: 2005, male: "Э.Лхагвасүрэн", female: "Б.Батхишиг" },
  { year: 2006, male: "Л.Алтантулга", female: "Б.Батхишиг" },
  { year: 2007, male: "Т.Энхтөр", female: "Б.Батхишиг" },
  { year: 2008, male: "Л.Алтантулга", female: "Б.Батхишиг" },
  { year: 2009, male: "Л.Алтантулга", female: "Б.Батхишиг" },
  { year: 2010, male: "Н.Энхсайхан", female: "Ч.Номин-Эрдэнэ" },
  { year: 2011, male: "Л.Алтантулга", female: "Б.Батхишиг" },
  { year: 2012, male: "З.Төрболд", female: "Б.Эрдэнэсувд" },
  { year: 2013, male: "Э.Лхагвасүрэн", female: "Б.Энхжин" },
  { year: 2014, male: "Б.Билэгт", female: "Б.Батхишиг" },
  { year: 2015, male: "Э.Лхагвасүрэн", female: "М.Дэлгэрмаа" },
  { year: 2016, male: "Б.Билэгт", female: "Б.Батхишиг" },
  { year: 2017, male: "Э.Лхагвасүрэн", female: "Б.Батхишиг" },
  { year: 2018, male: "Я.Бэгз", female: "Б.Болор-Эрдэнэ" },
  { year: 2019, male: "Э.Лхагвасүрэн", female: "Ө.Балжинням" },
  { year: 2020, male: "Ч.Эрдэнэбаяр", female: "М.Ундрам" },
  { year: 2021, male: "Б.Билэгт", female: "Б.Болор-Эрдэнэ" },
  { year: 2022, male: "Ч.Эрдэнэбаяр", female: "Б.Болор-Эрдэнэ" },
  { year: 2023, male: "Г.Сэр-Од", female: "М.Ундрам" },
  { year: 2024, male: "Г.Сэр-Од", female: "Б.Болор-Эрдэнэ" },
  { year: 2025, male: "М.Манлайжаргал", female: "Б.Болор-Эрдэнэ" }
];

/** 3) Raw → TimelineEvent хөрвүүлэгч */
function buildTimelineEvents(rows: Row[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  rows.forEach((r) => {
    const champions: ChampionCard[] = [];
    if (r.male) {
      const key = r.male.trim();
      champions.push({
        name: r.male,
        title: "Эрэгтэйчүүдийн улсын аварга",
        image: imageMap[key]
      });
    }
    if (r.female) {
      const key = r.female.trim();
      champions.push({
        name: r.female,
        title: "Эмэгтэйчүүдийн улсын аварга",
        image: imageMap[key]
      });
    }
    if (!r.description && champions.length === 0) return;
    events.push({
      year: String(r.year),
      title: "Онцлох үйл явдал",
      description:
        r.description ||
        "Тухайн жилд улсын аварга болсон тамирчид. (Түүхэн бичвэрийг дараа нь дэлгэрүүлж болно.)",
      champions
    });
  });
  return events.sort((a, b) => Number(b.year) - Number(a.year));
}

const allTimelineEvents = buildTimelineEvents(championsRaw);

/** 4) Компонентууд */
function ChampionCardView({ champion }: { champion: ChampionCard }) {
  const [hasError, setHasError] = useState(false);
  const showFallback = hasError || !champion.image;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative rounded-lg overflow-hidden bg-card border border-border p-4 hover:border-primary/40 transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Зураг бүрэн харагдахаар – aspect нь автоматаар, crop хийхгүй */}
        <div className="w-32 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {showFallback ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <img
              src={champion.image}
              alt={champion.name}
              loading="lazy"
              className="w-full h-auto object-contain rounded-lg"
              onError={() => {
                console.error("IMAGE LOAD FAILED:", champion.name, champion.image);
                setHasError(true);
              }}
            />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-card-foreground font-semibold">{champion.name}</h4>
          <p className="text-primary text-sm">{champion.title}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function MTTATimelineSection() {
  const { theme } = useTheme();
  const [searchYear, setSearchYear] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const timelineEvents = useMemo(() => {
    let filtered = allTimelineEvents;

    if (searchYear.trim()) {
      filtered = filtered.filter((event) =>
        event.year.includes(searchYear.trim())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const yearA = Number(a.year);
      const yearB = Number(b.year);
      return sortOrder === "newest" ? yearB - yearA : yearA - yearB;
    });

    return sorted;
  }, [searchYear, sortOrder]);

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-7xl mx-auto text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Бидний түүх
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Монголын ширээний теннисний холбооны түүхэн замнал
          </p>
        </motion.div>
      </div>

      {/* Search and Sort Controls */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          {/* Year Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Он хайх..."
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="pl-10 bg-card border-border text-foreground"
            />
          </div>

          {/* Sort Direction Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={() => setSortOrder("newest")}
              variant={sortOrder === "newest" ? "default" : "outline"}
              className={
                sortOrder === "newest"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Шинээс хуучин руу
            </Button>
            <Button
              onClick={() => setSortOrder("oldest")}
              variant={sortOrder === "oldest" ? "default" : "outline"}
              className={
                sortOrder === "oldest"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Хуучнаас шинэ рүү
            </Button>
          </div>
        </div>

        {/* Results Count */}
        {searchYear.trim() && (
          <p className="text-center text-muted-foreground mt-4">
            {timelineEvents.length} үр дүн олдлоо
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary to-primary transform -translate-x-1/2 hidden md:block" />

        <div className="space-y-16">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={event.year}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.03 }}
              className="relative"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div
                  className={`${
                    index % 2 === 0
                      ? "md:text-right md:pr-12"
                      : "md:order-2 md:pl-12"
                  }`}
                >
                  <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-6 hover:border-primary/40 transition-all">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2">
                      {event.title}
                    </h3>
                    {/* newline харагдуулна */}
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block">
                  <span className="text-6xl font-bold text-primary">
                    {event.year}
                  </span>
                </div>

                <div className="md:hidden mb-4">
                  <span className="text-5xl font-bold text-primary">
                    {event.year}
                  </span>
                </div>

                <div
                  className={`${
                    index % 2 === 0 ? "md:pl-12" : "md:order-1 md:pr-12"
                  }`}
                >
                  <div className="space-y-3">
                    {event.champions.map((c, idx) => (
                      <ChampionCardView key={idx} champion={c} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mt-16"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 rounded-full bg-background" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default MTTATimelineSection;
