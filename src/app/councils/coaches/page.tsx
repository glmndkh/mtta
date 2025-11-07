import { CHAIR, COACHES } from "./_data";
import {
  GradientCard,
  Hero,
  MemberCard,
  Section,
  Stat,
  Step
} from "./_components";

const stats = [
  {
    label: "Жилийн хөтөлбөрүүд",
    value: "18+",
    hint: "Орон нутаг, клуб бүрийг хамарсан жилийн сургалтын төлөвлөгөө"
  },
  {
    label: "Сургалтын цаг",
    value: "2,400",
    hint: "Сар бүрийн лайв болон танхимын сургалтын нийт цаг"
  },
  {
    label: "Баталгаажуулсан дасгалжуулагчид",
    value: "120",
    hint: "Үндэсний лицензийн шатлал баталгаажуулсан дасгалжуулагч"
  }
];

const initiatives = [
  {
    title: "Сургалтын семинар",
    description:
      "Аймаг, дүүргийн төвүүдэд ээлжлэн зохион байгуулж, шинэчлэгдсэн стандарт, гарын авлагыг танилцуулдаг." 
  },
  {
    title: "U13/U17 хөгжлийн хөтөлбөр",
    description:
      "Ирээдүйн шигшээг бүрдүүлэх хүүхэд, өсвөрийн тамирчдын шаталсан сургалтын системийг клубуудтай уялдуулдаг." 
  },
  {
    title: "Шүүгч-дасгалжуулагч хамтын сургалт",
    description:
      "Тэмцээний дүрмийн шинэчлэл, шүүлтийн стандарт, дасгалжуулалтын тактикийн уялдааг нэгтгэсэн модуль сургалт." 
  },
  {
    title: "Цахим контент, видео сан",
    description:
      "Шинжилгээ, дасгалын жишээ, дасгалжуулагчийн кейс судалгааг нэг дор төвлөрүүлсэн интерактив сан." 
  }
];

const steps = [
  {
    title: "Шалгуур",
    description:
      "Зөвлөлийн дүрэмд заасан мэргэжлийн ур чадвар, туршлагын босгыг хангаж буй эсэхээ баталгаажуулна." 
  },
  {
    title: "Өргөдөл",
    description:
      "Онлайн маягтыг бөглөж, клубийн тодорхойлолт, сургалтын төлөвлөгөө, хамтын ажиллагааны саналаа ирүүлнэ." 
  },
  {
    title: "Ярилцлага",
    description:
      "Салбарын ментор дасгалжуулагчидтай мэргэжлийн ярилцлага хийж, хөгжлийн зорилтоо тодорхойлно." 
  },
  {
    title: "Батламж",
    description:
      "Зөвлөлийн шийдвэрээр гишүүнчлэл баталгаажиж, сургалт болон санаачлагад оролцох эрх нээгдэнэ." 
  }
];

export async function generateMetadata() {
  const title = "Дасгалжуулагчдын зөвлөл | MTTA";
  const description =
    "Монголын ширээний теннисний дасгалжуулагчдын хөгжлийг нэгдсэн бодлого, стандарт, сургалтаар манлайлагч зөвлөлийн танилцуулга.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://mtta.mn/councils/coaches",
      type: "website"
    }
  };
}

export default function CoachesCouncilPage() {
  return (
    <main className="space-y-12 bg-[#0B0F17] px-4 py-12 text-white sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <Hero
          title="Дасгалжуулагчдын зөвлөл"
          subtitle="Монголын ширээний теннисний ирээдүйн аваргуудыг бэлтгэх нэгдсэн бодлого, стандарт, сургалтын чанарыг манлайлагч зөвлөл."
          breadcrumbs={["Бидний тухай", "Зөвлөлүүд", "Дасгалжуулагчдын зөвлөл"]}
          primaryCta={{ label: "Зөвлөлд нэгдэх хүсэлт илгээх", href: "#join" }}
          secondaryCta={{ label: "Дүрэм, журам татах (PDF)", href: "/downloads/coaches-council.pdf" }}
        />

        <Section title="Танилцуулга" eyebrow="Overview">
          <p>
            Дасгалжуулагчдын зөвлөл нь улсын хэмжээний клуб, сургууль, аймаг/дүүргийн багш, мэргэжилтнүүдийг холбоход чиглэсэн мэргэжлийн хамтын нийгэмлэг юм.
          </p>
          <p>
            Бид сургалтын стандарт, насны шатлалт хөгжлийн загвар, сургалтын материал, үнэлгээний аргачлалыг нэг загварт оруулж, бүс нутгийн ялгааг бууруулна.
          </p>
          <p>
            Жил бүрийн сургалт, семинар, лицензийн шатлалын шалгалтыг зохион байгуулж, дасгалжуулагчдыг олон улсын жишигт хүргэнэ.
          </p>
          <p>
            Зөвлөл нь MTTA-гийн спортын бодлого, хөтөлбөртэй уялдан ажиллаж, тамирчин хөгжүүлэх шаталсан экосистемийг бэхжүүлэхэд чиглэнэ.
          </p>
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Эрхэм зорилго" description="Дасгалжуулагчдын манлайлал, тасралтгүй хөгжлийг дэмжих стратегийн зорилтууд.">
            <ul className="list-disc space-y-2 pl-5 text-white/80">
              <li>Насны ангилал бүрт тохирсон хөгжлийн шатлалыг хэрэгжүүлэх</li>
              <li>Дасгалжуулагчийн мэргэжлийн чадамж, ёс зүйн стандартыг баталгаажуулах</li>
              <li>Үндэсний шигшээ бааз бэлтгэлийн системтэй уялдуулах</li>
            </ul>
          </Section>
          <Section title="Үүрэг, чиг үүрэг" description="Гишүүдийн хамтын ажиллагаа, хариуцлагын чиглэлүүд." eyebrow="Roles">
            <ul className="list-disc space-y-2 pl-5 text-white/80">
              <li>Сургалтын хөтөлбөр, сургалтын материал боловсруулах</li>
              <li>Лицензийн сургалт, шалгалт, давтан баталгаажуулалт</li>
              <li>Клубуудын сургалтын чанарын үнэлгээ, зөвлөгөө</li>
              <li>Аюулгүй ажиллагаа, хүүхдийн хамгааллын бодлого хэрэгжилт</li>
            </ul>
          </Section>
        </div>

        <Section
          title="Гол үзүүлэлтүүд"
          eyebrow="Stats"
          description="Сургалтын чанарыг хэмжихэд ашигладаг үндсэн үзүүлэлтүүд."
          className="bg-[#10161E]/80"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </div>
        </Section>

        <Section title="Зөвлөлийн дарга" eyebrow="Leadership" description="Зөвлөлийг чиглүүлж буй манлайллын баг.">
          <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <GradientCard>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-32 w-32 overflow-hidden rounded-full border border-[#00C16A]/40 bg-[#0B0F17]">
                  <img
                    src={CHAIR.photo}
                    alt={`${CHAIR.name} - зөвлөлийн дарга`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-white">{CHAIR.name}</h3>
                  <p className="text-[#00C16A]">{CHAIR.level}</p>
                  <p className="text-sm text-white/60">
                    {CHAIR.club}, {CHAIR.city}
                  </p>
                </div>
              </div>
            </GradientCard>
            <GradientCard>
              <h4 className="text-lg font-semibold text-white">Гол онцлогууд</h4>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-white/80">
                <li>АЗБХ-ны III түвшний лицензтэй</li>
                <li>10+ жилийн туршлагатай</li>
                <li>Үндэсний аварга шавьтай</li>
                <li>Сургалтын арга зүйн судалгааны багийн гишүүн</li>
              </ul>
            </GradientCard>
          </div>
        </Section>

        <Section title="Гишүүд" eyebrow="Members" description="Аймаг, дүүргийн клубуудыг төлөөлсөн дасгалжуулагчдын нэгдэл.">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {COACHES.map((coach) => (
              <MemberCard key={coach.id} coach={coach} />
            ))}
          </div>
        </Section>

        <Section title="Санаачилга, хөтөлбөрүүд" eyebrow="Programs" description="Дасгалжуулагчдын нийгэмлэгийг хөгжүүлэх инновац, түншлэлүүд.">
          <div className="grid gap-6 md:grid-cols-2">
            {initiatives.map((initiative) => (
              <GradientCard key={initiative.title}>
                <h3 className="text-xl font-semibold text-white">{initiative.title}</h3>
                <p className="mt-3 text-sm text-white/70">{initiative.description}</p>
              </GradientCard>
            ))}
          </div>
        </Section>

        <Section id="join" title="Гишүүнчлэлийн алхам" eyebrow="Join" description="Зөвлөлд нэгдэх үйл явц, шалгуурын товч танилцуулга.">
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <Step key={step.title} index={index + 1} {...step} />
            ))}
          </div>
        </Section>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-[#10161E]/80 p-8 text-white shadow-lg">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold">Асуулт байна уу?</h2>
            <p className="text-white/70">
              Бид таны клуб, аймаг, сургалтын төвтэй хамтран ажиллахад бэлэн. Гишүүнчлэл, сургалтын хөтөлбөртэй холбоотой асуултаа шууд илгээх боломжтой.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center gap-2 text-[#00C16A] transition hover:text-[#19d37d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C16A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
              href="mailto:info@mtta.mn"
            >
              <span className="font-semibold">info@mtta.mn</span>
            </a>
            <a
              className="inline-flex items-center gap-2 text-[#00C16A] transition hover:text-[#19d37d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C16A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
              href="tel:+97611123456"
            >
              <span className="font-semibold">+976-11-123456</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
