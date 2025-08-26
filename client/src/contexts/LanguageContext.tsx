
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
    'about.federationMembers': 'Federation members\' composition and responsibilities',
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
