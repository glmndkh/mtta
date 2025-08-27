import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'mn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  mn: {
    // Navigation
    'nav.about': 'Бидний тухай',
    'nav.federation': 'Холбоо',
    'nav.introduction': 'Танилцуулга',
    'nav.goals': 'Бидний зорилго',
    'nav.history': 'Түүхэн замнал',
    'nav.members': 'Холбооны гишүүд',
    'nav.branches': 'Салбар холбоод',
    'nav.nationalTeam': 'Үндэсний шигшээ',
    'nav.judges': 'Шүүгчид',
    'nav.pastChampions': 'Үе үеийн аваргууд',
    'nav.tournaments': 'Тэмцээн',
    'nav.clubs': 'Клубууд',
    'nav.leagues': 'Лиг',
    'nav.news': 'Мэдээ',
    'nav.register': 'Бүртгүүлэх',
    'nav.login': 'Нэвтрэх',
    'nav.logout': 'Гарах',
    'nav.profile': 'Миний профайл',
    'nav.admin': 'Админ самбар',
    'nav.createTournament': 'Тэмцээн үүсгэх',
    'nav.historyTimeline': 'Түүхэн замнал',

    // About page
    'about.title': 'Бидний тухай',
    'about.subtitle': 'Монголын ширээний теннисний холбооны тухай дэлгэрэнгүй мэдээлэл',
    'about.introduction': 'Танилцуулга',
    'about.goals': 'Бидний зорилго',
    'about.history': 'Түүхэн замнал',
    'about.members': 'Холбооны гишүүд',
    'about.federationTitle': 'Холбооны тухай',
    'about.federationDesc': 'Монголын ширээний теннисний холбоо нь 1965 онд байгуулагдсан бөгөөд тэр цагаас хойш Монгол орны ширээний теннисний спортыг хөгжүүлэх чиглэлээр үйл ажиллагаа явуулж ирсэн. Холбоо нь Олон улсын ширээний теннисний холбоо (ITTF)-ын гишүүн байдаг.',
    'about.goalsTitle': 'Зорилго, зорилт',
    'about.goalsDesc': 'Манай холбоо нь Монгол орны ширээний теннисний спортыг олон улсын түвшинд хүргэх, залуучуудыг спортын үйл ажиллагаанд татан оролцуулах, эрүүл амьдрах дадлыг төлөвшүүлэх зорилготой ажиллаж байна.',
    'about.established': 'Байгуулагдсан',
    'about.members': 'Гишүүдийн тоо',
    'about.clubs': 'Клубын тоо',
    'about.international': 'Олон улсын гишүүнчлэл',
    'about.strategicGoals': 'Холбооны стратеги зорилго болон үйл ажиллагааны чиглэл',
    'about.sportDevelopment': 'Спортын хөгжил',
    'about.sportDevelopmentDesc': 'Монгол орны ширээний теннисний спортыг олон улсын түвшинд хүргэж, дэлхийн тэмцээнд амжилттай оролцох боломжийг бүрдүүлэх.',
    'about.youthDevelopment': 'Залуучуудын хөгжил',
    'about.youthDevelopmentDesc': 'Залуу үеийнхнийг спортын үйл ажиллагаанд татан оролцуулж, эрүүл амьдрах дадал, хамт олны ухамсрыг төлөвшүүлэх.',
    'about.internationalCooperation': 'Олон улсын хамтын ажиллагаа',
    'about.internationalCooperationDesc': 'Олон улсын ширээний теннисний холбоотой хамтран ажиллаж, дэлхийн шилдэг туршлагыг нутагшуулах.',
    'about.infrastructureDevelopment': 'Дэд бүтцийн хөгжил',
    'about.infrastructureDevelopmentDesc': 'Орон нутагт ширээний теннисний спортын дэд бүтцийг хөгжүүлж, тамирчдад тохиромжтой нөхцөлийг бүрдүүлэх.',
    'about.historicalMilestones': 'Холбооны түүхэн хөгжлийн тэмдэглэл үеүүд',
    'about.federationMembers': 'Холбооны гишүүдийн бүрэлдэхүүн болон үүрэг хариуцлага',
    'about.presidentGreeting': 'Ерөнхийлөгчийн мэндчилгээ',
    'about.presidentGreetingText': 'Эрхэм тамирчид болон дэмжигчид ээ! Монголын ширээний теннисний холбооны Ерөнхийлөгчийн хувьд та бүхэнд чин сэтгэлээсээ хандлагаа илэрхийлж байна. 1965 онд байгуулагдсан цагаасаа хойш бид Монголын ширээний тенниснийг олон улсын стандартад хүргэх, залуучуудыг спортын үйл ажиллагаанд татан оролцуулахад шамдан ажиллаж ирсэн. Ирээдүйд илүү амжилт гаргаж, Монгол улсаа дэлхийн тавцанд төлөөлөхийг эрмэлзэж байна.',

    // Timeline page
    'timeline.title': 'Түүхэн хөгжлийн замнал',
    'timeline.subtitle': 'Монголын ширээний теннисний холбооны 60 жилийн түүхэн замнал',
    'timeline.categories.foundation': 'Үндэслэл',
    'timeline.categories.achievement': 'Амжилт',
    'timeline.categories.international': 'Олон улсын хамтын ажиллагаа',
    'timeline.categories.development': 'Хөгжил',
    'timeline.stats.years': 'Жилийн туршлага',
    'timeline.stats.athletes': 'Тамирчин',
    'timeline.stats.clubs': 'Клуб',
    'timeline.stats.tournaments': 'Тэмцээн',

    // Timeline events
    'timeline.1965.title': 'Холбоо байгуулагдав',
    'timeline.1965.description': 'Монголын ширээний теннисний холбоо албан ёсоор байгуулагдаж, спортын салбарт шинэ эрин эхэлсэн.',
    'timeline.1971.title': 'ITTF-д элссэн',
    'timeline.1971.description': 'Олон улсын ширээний теннисний холбоонд (ITTF) элсэж, дэлхийн спортын нийгэмлэгт нэгдсэн.',
    'timeline.1980.title': 'Анхны үндэсний аварга',
    'timeline.1980.description': 'Анхны үндэсний аваргын тэмцээн зохион байгуулагдаж, улсын түвшинд спорт хөгжсөн.',
    'timeline.1990.title': 'Олон улсын тэмцээнд оролцсон',
    'timeline.1990.description': 'Анх удаа олон улсын томоохон тэмцээнд Монголын тамирчид амжилттай оролцсон.',
    'timeline.2000.title': 'Клубын системийг бий болгосон',
    'timeline.2000.description': 'Орон нутагт клубын системийг бий болгож, залуучуудын дунд спортыг өргөн дэлгэрүүлсэн.',
    'timeline.2008.title': 'Азийн тэмцээнд медаль хүртсэн',
    'timeline.2008.description': 'Анх удаа Азийн түвшинд медаль хүртэж, Монголын ширээний теннисний нэр хүндийг өсгөсөн.',
    'timeline.2012.title': 'Шинэ өртөө барьсан',
    'timeline.2012.description': 'Орчин үеийн стандартын дагуу шинэ дасгалжуулалтын өртөө барьж, дэд бүтцийг сайжруулсан.',
    'timeline.2016.title': 'Залуучуудын хөгжлийн хөтөлбөр',
    'timeline.2016.description': 'Залуучуудын спортыг дэмжих тусгай хөтөлбөр хэрэгжүүлж, цаашдын хөгжлийн суурийг бэхжүүлсэн.',
    'timeline.2020.title': 'Дижитал шилжилт',
    'timeline.2020.description': 'COVID-19 цар тахлын үед онлайн тэмцээн, сургалт зохион байгуулж дижитал шилжилтийг хийсэн.',
    'timeline.2024.title': 'Шинэ стратегийн төлөвлөгөө',
    'timeline.2024.description': '2030 хүртэлх хөгжлийн стратегийн төлөвлөгөө батлагдаж, ирээдүйн зорилтыг тодорхойлсон.',
  },
  en: {
    // Navigation
    'nav.about': 'About Us',
    'nav.federation': 'Federation',
    'nav.introduction': 'Introduction',
    'nav.goals': 'Our Goals',
    'nav.history': 'Historical Journey',
    'nav.members': 'Federation Members',
    'nav.branches': 'Branches',
    'nav.nationalTeam': 'National Team',
    'nav.judges': 'Judges',
    'nav.pastChampions': 'Past Champions',
    'nav.tournaments': 'Tournaments',
    'nav.clubs': 'Clubs',
    'nav.leagues': 'Leagues',
    'nav.news': 'News',
    'nav.register': 'Register',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'nav.admin': 'Admin Dashboard',
    'nav.createTournament': 'Create Tournament',
    'nav.historyTimeline': 'History Timeline',

    // About page
    'about.title': 'About Us',
    'about.subtitle': 'Detailed information about the Mongolian Table Tennis Association',
    'about.introduction': 'Introduction',
    'about.goals': 'Our Goals',
    'about.history': 'Historical Journey',
    'about.members': 'Federation Members',
    'about.federationTitle': 'About the Federation',
    'about.federationDesc': 'The Mongolian Table Tennis Association was established in 1965 and has been working to develop table tennis sports in Mongolia ever since. The federation is a member of the International Table Tennis Federation (ITTF).',
    'about.goalsTitle': 'Goals and Objectives',
    'about.goalsDesc': 'Our federation works with the goal of bringing Mongolian table tennis to international standards, involving young people in sports activities, and developing healthy living habits.',
    'about.established': 'Established',
    'about.members': 'Number of Members',
    'about.clubs': 'Number of Clubs',
    'about.international': 'International Membership',
    'about.strategicGoals': 'Strategic goals and operational directions of the federation',
    'about.sportDevelopment': 'Sports Development',
    'about.sportDevelopmentDesc': 'Bringing Mongolian table tennis to international standards and creating opportunities for successful participation in world competitions.',
    'about.youthDevelopment': 'Youth Development',
    'about.youthDevelopmentDesc': 'Involving young people in sports activities and developing healthy living habits and team spirit.',
    'about.internationalCooperation': 'International Cooperation',
    'about.internationalCooperationDesc': 'Cooperating with international table tennis federations and adapting world-class practices.',
    'about.infrastructureDevelopment': 'Infrastructure Development',
    'about.infrastructureDevelopmentDesc': 'Developing table tennis sports infrastructure in rural areas and creating suitable conditions for athletes.',
    'about.historicalMilestones': 'Historical milestones of the federation\'s development',
    'about.federationMembers': 'Federation member composition and responsibilities',
    'about.presidentGreeting': 'Presidential Greeting',
    'about.presidentGreetingText': 'Dear athletes and supporters! As the President of the Mongolian Table Tennis Federation, I extend warm greetings to all of you. Since our federation was established in 1965, we have been working tirelessly to elevate Mongolian table tennis to international standards and engage young people in sports activities. We aim to achieve greater success in the future and proudly represent Mongolia on the world stage.',

    // Timeline page
    'timeline.title': 'Historical Journey',
    'timeline.subtitle': '60 years of Mongolian Table Tennis Federation history',
    'timeline.categories.foundation': 'Foundation',
    'timeline.categories.achievement': 'Achievement',
    'timeline.categories.international': 'International Cooperation',
    'timeline.categories.development': 'Development',
    'timeline.stats.years': 'Years of Experience',
    'timeline.stats.athletes': 'Athletes',
    'timeline.stats.clubs': 'Clubs',
    'timeline.stats.tournaments': 'Tournaments',

    // Timeline events
    'timeline.1965.title': 'Federation Established',
    'timeline.1965.description': 'The Mongolian Table Tennis Association was officially established, marking the beginning of a new era in sports development.',
    'timeline.1971.title': 'Joined ITTF',
    'timeline.1971.description': 'Became a member of the International Table Tennis Federation (ITTF), joining the global table tennis community.',
    'timeline.1980.title': 'First National Championship',
    'timeline.1980.description': 'The first national championship was organized, establishing competitive table tennis at the national level.',
    'timeline.1990.title': 'International Competition Debut',
    'timeline.1990.description': 'Mongolian athletes successfully participated in major international competitions for the first time.',
    'timeline.2000.title': 'Club System Established',
    'timeline.2000.description': 'Established a comprehensive club system nationwide, expanding table tennis among youth.',
    'timeline.2008.title': 'First Asian Medal',
    'timeline.2008.description': 'Won the first medal at Asian level, enhancing Mongolia\'s reputation in table tennis.',
    'timeline.2012.title': 'New Training Facility',
    'timeline.2012.description': 'Built a modern training facility meeting international standards, improving infrastructure.',
    'timeline.2016.title': 'Youth Development Program',
    'timeline.2016.description': 'Implemented special youth development programs, strengthening the foundation for future growth.',
    'timeline.2020.title': 'Digital Transformation',
    'timeline.2020.description': 'During COVID-19, organized online competitions and training, embracing digital transformation.',
    'timeline.2024.title': 'New Strategic Plan',
    'timeline.2024.description': 'Adopted a comprehensive development strategy until 2030, defining future goals and objectives.',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'mn';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}