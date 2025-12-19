"use client";

import React, { useState } from "react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Eye, HandHeart, Users } from "lucide-react";
import { JudgeCard } from "@/components/JudgeCard";
import bgImage from "@/assets/councilimages/Shuugchid.jpg";

const presidentImage = "/uploads/president-gantulga.jpg";

const tabs = [
  { id: "intro", label: "Мэндчилгээ" },
  { id: "leaders", label: "Тэргүүлэгч гишүүд" },
  { id: "mission", label: "Бидний зорилго" },
  { id: "structure", label: "Бүтэц зохион байгуулалт" },
] as const;

const leaders = [
  {
    id: "1",
    name: "Ц. Гантулга",
    image: "/uploads/president-gantulga.jpg",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "2",
    name: "Мандах",
    image: "client/src/assets/councilimages/Damdinbayar.jpeg",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Тэргүүн дэд еранхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "3",
    name: "Одончимэг",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Тэргүүн дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "4",
    name: "Ганбаатар",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "5",
    name: "О. Цогтбаатар",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "6",
    name: "Чинбат",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "7",
    name: "Ганхуяг",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "8",
    name: "Ууганбаяр",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "9",
    name: "С. Галбадрах",
    image: "",
    role: "chairperson" as const,
    status: "domestic" as const,
    roleText: "Дотоод үйл ажиллагаа хариуцсан дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "10",
    name: "Б. Баярмагнай",
    image: "",
    role: "chairperson" as const,
    status: "international" as const,
    roleText: "Гадаад харилцаа хариуцсан дэд ерөнхийлөгч",
    statusText: "",
    description: "",
  },
  {
    id: "11",
    name: "Пүрэв",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "12",
    name: "Лхагвадрож",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "13",
    name: "Чинтөгс",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "14",
    name: "Ганбат",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "15",
    name: "Дөлбадрах",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "16",
    name: "Ган-Эрдэнэ",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "17",
    name: "Нарандаваа",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "18",
    name: "Батсайхан",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "19",
    name: "Батгэрэл",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "20",
    name: "Одноцүрэн",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "21",
    name: "Ууганбаяр",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тэргүүлэгч гишүүн",
    statusText: "",
    description: "",
  },
  {
    id: "22",
    name: "С. Галбадрах",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Ерөнхий нарийн бичгийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "23",
    name: "Мөнхбилэг",
    image: "picture/Terguulegch_gishuud/Мөнхбилэг.jpg",
    role: "member" as const,
    status: "international" as const,
    roleText: "Гадаад харилцааны албаны дарга",
    statusText: "",
    description: "",
  },
  {
    id: "24",
    name: "Чимэддаваа",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Ахмадын зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "25",
    name: "Билгүүн",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Дасгалжуулагчдын зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "26",
    name: "Б. Буянбат",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Шүүгчдийн зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "27",
    name: "Ц. Оюн-Эрдэнэ",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Эмэгтэйчүүдийн зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "28",
    name: "Ч. Энэрэлзаяа",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Тамирчдын зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "29",
    name: "Мөнгөнзул",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Пара зөвлөлийн дарга",
    statusText: "",
    description: "",
  },
  {
    id: "30",
    name: "Б. Цэрэнтогтох",
    image: "",
    role: "member" as const,
    status: "domestic" as const,
    roleText: "Шигшээ багийн дасгалжуулагч",
    statusText: "",
    description: "",
  },
];


export default function AboutIntro() {
  const [activeTab, setActiveTab] =
    useState<"intro" | "leaders" | "mission" | "structure">("intro");

  return (
    <PageWithLoading>
      <Navigation />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* HERO */}
        <section className="relative h-[260px] md:h-[320px] lg:h-[360px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }} // өөрийн зургаар солино
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white text-color-white">
                Танилцуулга
              </h1>
            </div>
          </div>
        </section>


        {/* TAB BAR */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`
                      group relative py-4 px-0
                      font-medium whitespace-nowrap
                      text-gray-700 dark:text-gray-300
                      hover:text-green-600 dark:hover:text-green-400
                      transition-colors
                    `}
                  >
                    {tab.label}

                    {/* Ногоон зураас */}
                    <span
                      className={`
                        pointer-events-none
                        absolute left-0 right-0 -bottom-[2px]
                        h-[3px] rounded-full bg-green-500
                        transform origin-center
                        transition-transform duration-300
                        ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                      `}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        {/* TAB CONTENTS */}
        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* 1. Танилцуулга */}
          {activeTab === "intro" && (
            <>
              {/* Ерөнхийлөгчийн мэндчилгээ */}
              <section className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Ерөнхийлөгчийн мэндчилгээ
                  </h2>
                  <div className="w-20 h-1 bg-green-400 mx-auto" />
                </div>

                <div className="max-w-4xl mx-auto">
                  <Card className="card-dark p-8">
                    <CardContent className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-shrink-0">
                        <div className="w-48 h-64 overflow-hidden rounded-2xl shadow-xl">
                          <img
                            src={presidentImage}
                            alt="Ерөнхийлөгч Ц. Гантулга"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.hasAttribute("data-fallback-tried")) {
                                target.setAttribute(
                                  "data-fallback-tried",
                                  "true"
                                );
                                target.src = "/uploads/president-gantulga.jpg";
                              } else {
                                target.style.display = "none";
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Ц. Гантулга
                        </h3>
                        <p className="text-green-400 text-lg mb-6">
                          Монголын Ширээний Теннисний Холбооны Ерөнхийлөгч
                        </p>

                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                          <p>
                            Эрхэм хүндэт тамирчид, дасгалжуулагчид, ширээний
                            теннисийн спортыг дэмжигч бүхэнд мэндчилж байна.
                          </p>
                          <p>
                            Монголын ширээний теннисний холбоо нь 1965 онд
                            байгуулагдсанаас хойш спортын хөгжил, тамирчдын
                            сургалт дэмжлэгт чиглэсэн олон ажил хэрэгжүүлж ирсэн.
                          </p>
                          <p>
                            Манай холбоо нь ITTF болон Азийн ширээний теннисний
                            холбооны идэвхтэй гишүүн болж, олон улсын хамтын
                            ажиллагааг өргөжүүлэн хөгжиж байна.
                          </p>
                        </div>

                        <div className="mt-6 text-right">
                          <div className="text-gray-900 dark:text-white font-semibold">
                            Хүндэтгэсэн,
                          </div>
                          <div className="text-green-400 font-bold text-lg">
                            Ц. Гантулга
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Он цагийн хэлхээс */}
              <section className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Он цагийн хэлхээс
                  </h2>
                  <div className="w-20 h-1 bg-green-400 mx-auto mb-8" />
                  <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                    Монголын ширээний теннисний холбооны түүхэн замнал - 1965
                    онд анх байгуулагдсанаас өнөөг хүртэл спортын хөгжилд
                    оруулсан хувь нэмэр.
                  </p>
                </div>

                <div className="relative">
                  <div className="flex overflow-x-auto pb-4 space-x-8">
                    {[
                      {
                        year: "1965",
                        title: "Холбоо байгуулагдсан",
                        description:
                          "Монголын ширээний теннисний холбоо анх байгуулагдав",
                        image: "/picture/past-champions/B.Bilegt.jpeg",
                      },
                      {
                        year: "1970",
                        title: "Эхний тэмцээн",
                        description:
                          "Улсын хэмжээний анхны ширээний теннисний тэмцээн зохион байгуулав",
                        image: "/picture/past-champions/T.Bold.jpeg",
                      },
                      {
                        year: "1990",
                        title: "ITTF-д элссэн",
                        description:
                          "Олон улсын ширээний теннисний холбооны гишүүн болсон",
                        image: "/picture/past-champions/O.Lkhagvasuren.jpeg",
                      },
                      {
                        year: "1993",
                        title: "Дэлхийн аварга",
                        description:
                          "Анхны олон улсын тэмцээнд оролцов",
                        image: "/picture/past-champions/B.Bayarmagnai.jpeg",
                      },
                      {
                        year: "1994",
                        title: "Азийн наадам",
                        description:
                          "Азийн наадамд анх удаа оролцлоо",
                        image: "/picture/past-champions/S.Galbadrakh.jpeg",
                      },
                      {
                        year: "1996",
                        title: "Сургалтын төв",
                        description:
                          "Үндэсний сургалтын төвийг байгуулсан",
                        image: "/picture/past-champions/G.Oyunchimeg.jpeg",
                      },
                      {
                        year: "1997",
                        title: "Залуучуудын хөтөлбөр",
                        description:
                          "Залуучуудын хөгжлийн хөтөлбөр эхэлсэн",
                        image: "/picture/past-champions/Ts.Oyun-Erdene.jpeg",
                      },
                      {
                        year: "1998",
                        title: "Эмэгтэйчүүдийн спорт",
                        description:
                          "Эмэгтэйчүүдийн ширээний теннисийг хөгжүүлэх хөтөлбөр",
                        image: "/picture/past-champions/M.Delgermaa.jpeg",
                      },
                      {
                        year: "2000",
                        title: "Олон улсын харилцаа",
                        description:
                          "Өмнөд Солонгос, Хятадтай хамтын ажиллагаа эхэлсэн",
                        image: "/picture/past-champions/U.Baljinnyam.jpeg",
                      },
                    ].map((event) => (
                      <div key={event.year} className="flex-shrink-0 w-80">
                        <div className="relative">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                              {event.year}
                            </div>
                            <div className="flex-1 h-0.5 bg-gray-600" />
                          </div>
                          <Card className="card-dark overflow-hidden">
                            <CardContent className="p-0">
                              {event.image && (
                                <div className="w-full h-48 overflow-hidden">
                                  <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="p-6">
                                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">
                                  {event.title}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  {event.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Статистик */}
              <section className="mb-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      60+
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Жилийн туршлага
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      500+
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Тамирчин
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      15+
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Клуб
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      100+
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Тэмцээн
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 2. Тэргүүлэгч гишүүд – эргэдэг карт */}
          {activeTab === "leaders" && (
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Тэргүүлэгч гишүүд
                </h2>
                <div className="w-20 h-1 bg-green-400 mx-auto" />
                <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Монголын Ширээний Теннисний Холбооны удирдлагын баг.
                </p>
              </div>

              {/* ⇩ Шүүгчдийн зөвлөлийн page-тай ижил grid тохиргоо */}
              <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                  {leaders.map((leader) => (
                    <JudgeCard
                      key={leader.id}
                      image={leader.image}
                      name={leader.name}
                      role={leader.role}
                      status={leader.status}
                      description={leader.description}
                      roleTextOverride={leader.roleText}
                      statusTextOverride={leader.statusText}
                      variant="leader"
                    />
                  ))}
                </div>
              </div>
            </section>
          )}


          {/* 3. Бидний зорилго */}
          {activeTab === "mission" && (
            <>
              <section className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Эрхэм зорилго
                  </h2>
                  <div className="w-20 h-1 bg-green-400 mx-auto" />
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mountain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                        ЭРХЭМ ЗОРИЛГО
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Монголын ширээний теннисний холбоо нь спортын хөгжил,
                        тамирчдын сургалт, дэмжлэгт чиглэсэн үйл ажиллагаа
                        явуулж, олон улсын хамтын ажиллагааг хөгжүүлнэ.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Eye className="w-10 h-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">
                        АЛСЫН ХАРАА
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Монгол тамирчдыг олон улсын түвшинд тэмцэж, дэлхийн
                        аварга болж, ширээний теннисийг Монголд түгээмэл спорт
                        болгох зорилготой.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HandHeart className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                        ҮНЭТ ЗҮЙЛС
                      </h3>
                      <div className="text-left">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Спортын ёс зүй
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Хамтын ажиллагаа
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Залуусын дэмжлэг
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Олон улсын стандарт
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Тэргүүлэх арга барил
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Стратегийн зорилтууд */}
              <section className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Стратегийн зорилтууд
                  </h2>
                  <div className="w-20 h-1 bg-green-400 mx-auto" />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Спортын хөгжүүлэлт
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        Ширээний теннисийг Монголд өргөн дэлгэрүүлж, бүх насны
                        иргэдэд энэ спортыг дэмжиж, тамирчдын техникийг
                        сайжруулах.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Залуусын сургалт
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        Залуу тамирчдыг олон улсын түвшинд бэлтгэж,
                        дасгалжуулагчдын чадвар дээшлүүлэх сургалтыг зохион
                        байгуулах.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-dark text-center p-6">
                    <CardContent className="pt-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Олон улсын хамтын ажиллагаа
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        ITTF болон бусад олон улсын байгууллагуудтай хамтын
                        ажиллагааг өргөжүүлж, тамирчдын солилцоог дэмжих.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </>
          )}

          {/* 4. Бүтэц зохион байгуулалт */}
          {activeTab === "structure" && (
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Бүтэц, зохион байгуулалт
                </h2>
                <div className="w-20 h-1 bg-green-400 mx-auto" />
              </div>

              <div className="bg-gray-900 p-8 rounded-lg">
                <div className="flex flex-col items-center space-y-8">
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Их хурал
                    </div>
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Удирдах зөвлөл
                    </div>
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Тэргүүлэгч
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-600" />

                  <div className="bg-purple-600 text-white px-6 py-3 rounded-lg text-center font-medium">
                    Ерөнхийлөгч
                  </div>

                  <div className="w-px h-8 bg-gray-600" />

                  <div className="bg-orange-500 text-white px-4 py-2 rounded text-center font-medium">
                    Ажлын захирал
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                    <div className="bg-gray-700 p-4 rounded-lg text-center">
                      <div className="text-purple-400 font-medium mb-2">
                        Спортын хөгжлийн алба
                      </div>
                      <div className="text-gray-300 text-sm space-y-1">
                        <div>Тамирчдын бэлтгэлийн хэлтэс</div>
                        <div>Тэмцээний зохион байгуулалтын хэлтэс</div>
                        <div>Дасгалжуулагчдын сургалтын хэлтэс</div>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg text-center">
                      <div className="text-pink-400 font-medium mb-2">
                        Олон улсын харилцааны алба
                      </div>
                      <div className="text-gray-300 text-sm space-y-1">
                        <div>ITTF-тэй харилцах хэлтэс</div>
                        <div>Азийн холбооны харилцааны хэлтэс</div>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg text-center">
                      <div className="text-green-400 font-medium mb-2">
                        Залуучуудын спортын алба
                      </div>
                      <div className="text-gray-300 text-sm space-y-1">
                        <div>Сургуулийн спортын хэлтэс</div>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg text-center">
                      <div className="text-blue-400 font-medium mb-2">
                        Захиргааны алба
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="bg-orange-600 p-4 rounded text-center">
                      <div className="text-gray-900 dark:text-white font-medium mb-2">
                        Клубуудын харилцааны алба
                      </div>
                      <div className="text-gray-200 text-sm">
                        Холбооны гишүүд клубуудтай харилцах
                      </div>
                    </div>

                    <div className="bg-orange-600 p-4 rounded text-center">
                      <div className="text-gray-900 dark:text-white font-medium mb-2">
                        Олон нийтийн харилцааны алба
                      </div>
                      <div className="text-gray-200 text-sm">
                        Хэвлэл мэдээлэл, сурталчилгаа
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </PageWithLoading>
  );
}
