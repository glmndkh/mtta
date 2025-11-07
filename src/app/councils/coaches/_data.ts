export type CoachLevel = "I түвшин" | "II түвшин" | "III түвшин" | "Мастер тренер";

export type Coach = {
  id: string;
  name: string;
  level: CoachLevel;
  club: string;
  city: string;
  specialties: string[];
  photo: string;
};

export const CHAIR: Coach = {
  id: "chair",
  name: "Б. Эрдэнэбаяр",
  level: "Мастер тренер",
  club: "MTTA Сургалтын төв",
  city: "Улаанбаатар",
  specialties: [
    "Техник, тактик",
    "Хүүхдийн бэлтгэл",
    "Шигшээ бэлтгэл"
  ],
  photo: "/images/coaches/chair.jpg"
};

export const COACHES: Coach[] = [
  {
    id: "c1",
    name: "А. Энхжин",
    level: "III түвшин",
    club: "Хан-Уул клуб",
    city: "УБ",
    specialties: ["U13 хөгжүүлэлт", "Серв, ресив"],
    photo: "/images/coaches/c1.jpg"
  },
  {
    id: "c2",
    name: "Д. Баттөмөр",
    level: "II түвшин",
    club: "Эрдэнэт клуб",
    city: "Орхон",
    specialties: ["Биеийн бэлтгэл", "Сэтгэлзүй"],
    photo: "/images/coaches/c2.jpg"
  },
  {
    id: "c3",
    name: "М. Сарангуа",
    level: "III түвшин",
    club: "Тайвшрал академи",
    city: "Дархан",
    specialties: ["U17 ахисан шат", "Довтолгооны тактик"],
    photo: "/images/coaches/c3.jpg"
  },
  {
    id: "c4",
    name: "Г. Хулан",
    level: "I түвшин",
    club: "Ирээдүй клуб",
    city: "Хөвсгөл",
    specialties: ["Анхан шат", "Хүүхдийн сэтгэлзүй"],
    photo: "/images/coaches/c4.jpg"
  },
  {
    id: "c5",
    name: "Э. Амарсанаа",
    level: "II түвшин",
    club: "Чингис хот",
    city: "Хэнтий",
    specialties: ["Шигшээ бэлтгэл", "Видео шинжилгээ"],
    photo: "/images/coaches/c5.jpg"
  },
  {
    id: "c6",
    name: "С. Номин",
    level: "III түвшин",
    club: "Олимп клуб",
    city: "УБ",
    specialties: ["Эмэгтэй баг", "Шуурхай довтолгоо"],
    photo: "/images/coaches/c6.jpg"
  },
  {
    id: "c7",
    name: "П. Давааням",
    level: "I түвшин",
    club: "Баянхонгор клуб",
    city: "Баянхонгор",
    specialties: ["Аймаг, дүүргийн хөтөлбөр", "Тэмцээн зохион байгуулалт"],
    photo: "/images/coaches/c7.jpg"
  },
  {
    id: "c8",
    name: "Ц. Энхболд",
    level: "II түвшин",
    club: "Говь спорт",
    city: "Дорноговь",
    specialties: ["Техник сайжруулалт", "Фитнесс"],
    photo: "/images/coaches/c8.jpg"
  }
];
