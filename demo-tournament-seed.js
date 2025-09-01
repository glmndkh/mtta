
const { nanoid } = require('nanoid');

// Demo tournament data
const demoTournament = {
  id: 'demo-tournament-2025',
  name: 'Улаанбаатар хотын нээлттэй аварга шалгаруулалт 2025',
  description: 'Улаанбаатар хотын ширээний теннисний холбооны зохион байгуулж буй жилийн хамгийн том тэмцээн',
  richDescription: '<p>Энэхүү тэмцээн нь Улаанбаатар хотын ширээний теннисний холбооны зохион байгуулж буй жилийн хамгийн том тэмцээн юм. Тэмцээнд улс орны өнцөг булан бүрээс тамирчид оролцох боломжтой.</p><p><strong>Тэмцээний онцлог:</strong></p><ul><li>Өндөр түвшинтэй зохион байгуулалт</li><li>Үнэ цэнэтэй шагнал урамшуулал</li><li>Олон улсын шүүгчид</li><li>Шууд дамжуулга</li></ul>',
  startDate: new Date('2025-03-15T09:00:00'),
  endDate: new Date('2025-03-17T18:00:00'),
  registrationDeadline: new Date('2025-03-10T23:59:59'),
  location: 'Монголын Ширээний Теннисний Холбооны Төв Спорт Заал',
  organizer: 'Монголын Ширээний Теннисний Холбоо',
  maxParticipants: 64,
  entryFee: '25000',
  status: 'registration',
  participationTypes: [
    'Эрэгтэй дангаар',
    'Эмэгтэй дангаар', 
    'Эрэгтэй хосоор',
    'Эмэгтэй хосоор',
    'Холимог хосоор'
  ],
  rules: 'ITTF-ийн албан ёсны дүрмийг баримтална. Тоглолт нь 11 оноог эхлээд хүрсэн тоглогч ялна. Тэмцээн нь шууд хасагдах (elimination) системээр явагдана.',
  prizes: '1-р байр: 500,000₮, 2-р байр: 300,000₮, 3-р байр: 200,000₮, Оролцсон бүхэн: Дурсгалын бэлэг',
  contactInfo: 'Утас: +976 7010-1234, И-мэйл: info@mtta.mn, Веб: www.mtta.mn',
  schedule: JSON.stringify({
    description: 'Өдөр 1: Бүлгийн шат (09:00-18:00), Өдөр 2: 1/8, 1/4 финал (09:00-18:00), Өдөр 3: Хагас финал, Финал (09:00-18:00)'
  }),
  requirements: 'Насны хязгаарлалт байхгүй. Аматёр болон мэргэжлийн тоглогч оролцох боломжтой. Эрүүл мэндийн үнэмлэх шаардлагатай.',
  isPublished: true,
  organizerId: '120ec006-ec32-4bd7-ba9a-14edc8e16e0e', // Use existing admin user ID
  clubId: null,
  backgroundImageUrl: null,
  regulationDocumentUrl: null,
  minRating: null,
  maxRating: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Demo participants
const demoParticipants = [
  {
    id: nanoid(),
    tournamentId: 'demo-tournament-2025',
    playerId: 'demo-player-1',
    participationType: 'Эрэгтэй дангаар',
    registeredAt: new Date(),
    status: 'registered'
  },
  {
    id: nanoid(),
    tournamentId: 'demo-tournament-2025', 
    playerId: 'demo-player-2',
    participationType: 'Эрэгтэй дангаар',
    registeredAt: new Date(),
    status: 'registered'
  },
  {
    id: nanoid(),
    tournamentId: 'demo-tournament-2025',
    playerId: 'demo-player-3',
    participationType: 'Эмэгтэй дангаар',
    registeredAt: new Date(),
    status: 'registered'
  },
  {
    id: nanoid(),
    tournamentId: 'demo-tournament-2025',
    playerId: 'demo-player-4', 
    participationType: 'Эмэгтэй дангаар',
    registeredAt: new Date(),
    status: 'registered'
  }
];

// Demo users for participants
const demoUsers = [
  {
    id: 'demo-player-1',
    email: 'bold.bat@demo.mn',
    phone: '+976-9999-0001',
    firstName: 'Болд',
    lastName: 'Бат',
    gender: 'male',
    dateOfBirth: new Date('1995-05-15'),
    clubAffiliation: 'Улаанбаатар клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-player-2', 
    email: 'erdene.ochir@demo.mn',
    phone: '+976-9999-0002',
    firstName: 'Эрдэнэ',
    lastName: 'Очир',
    gender: 'male',
    dateOfBirth: new Date('1992-08-22'),
    clubAffiliation: 'Төв клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-player-3',
    email: 'oyunaa.tseren@demo.mn', 
    phone: '+976-9999-0003',
    firstName: 'Оюунаа',
    lastName: 'Цэрэн',
    gender: 'female',
    dateOfBirth: new Date('1998-12-10'),
    clubAffiliation: 'Багануур клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'demo-player-4',
    email: 'altantsetseg.ganbold@demo.mn',
    phone: '+976-9999-0004', 
    firstName: 'Алтанцэцэг',
    lastName: 'Ганболд',
    gender: 'female',
    dateOfBirth: new Date('1990-03-25'),
    clubAffiliation: 'Чингэлтэй клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Demo players
const demoPlayers = [
  {
    id: 'demo-player-data-1',
    userId: 'demo-player-1',
    memberNumber: 'MTTA2025001',
    rank: '1-р зэрэг',
    points: 1250,
    achievements: 'УБ хотын аварга 2024, Үндэсний тэмцээн 2-р байр',
    dateOfBirth: new Date('1995-05-15'),
    wins: 45,
    losses: 12,
    winPercentage: 79,
    createdAt: new Date()
  },
  {
    id: 'demo-player-data-2',
    userId: 'demo-player-2',
    memberNumber: 'MTTA2025002', 
    rank: 'спортын дэд мастер',
    points: 1580,
    achievements: 'Үндэсний аварга 2023, Олон улсын тэмцээн 3-р байр',
    dateOfBirth: new Date('1992-08-22'),
    wins: 62,
    losses: 18,
    winPercentage: 77,
    createdAt: new Date()
  },
  {
    id: 'demo-player-data-3',
    userId: 'demo-player-3',
    memberNumber: 'MTTA2025003',
    rank: '2-р зэрэг',
    points: 950,
    achievements: 'Залуучуудын аварга 2024, УБ хотын тэмцээн 1-р байр',
    dateOfBirth: new Date('1998-12-10'),
    wins: 38,
    losses: 15,
    winPercentage: 72,
    createdAt: new Date()
  },
  {
    id: 'demo-player-data-4',
    userId: 'demo-player-4',
    memberNumber: 'MTTA2025004',
    rank: '1-р зэрэг', 
    points: 1120,
    achievements: 'Эмэгтэйчүүдийн аварга 2024, Клубын тэмцээн 1-р байр',
    dateOfBirth: new Date('1990-03-25'),
    wins: 52,
    losses: 20,
    winPercentage: 72,
    createdAt: new Date()
  }
];

// Demo tournament results
const demoTournamentResults = {
  id: nanoid(),
  tournamentId: 'demo-tournament-2025',
  groupStageResults: {
    'Эрэгтэй дангаар': [
      {
        groupName: 'А бүлэг',
        players: [
          { name: 'Болд Бат', playerId: 'demo-player-1', wins: 2, losses: 0, points: 6 },
          { name: 'Эрдэнэ Очир', playerId: 'demo-player-2', wins: 1, losses: 1, points: 3 },
          { name: 'Дэмо Тоглогч 5', wins: 0, losses: 2, points: 0 }
        ]
      }
    ],
    'Эмэгтэй дангаар': [
      {
        groupName: 'А бүлэг',
        players: [
          { name: 'Оюунаа Цэрэн', playerId: 'demo-player-3', wins: 2, losses: 0, points: 6 },
          { name: 'Алтанцэцэг Ганболд', playerId: 'demo-player-4', wins: 1, losses: 1, points: 3 },
          { name: 'Дэмо Тоглогч 6', wins: 0, losses: 2, points: 0 }
        ]
      }
    ]
  },
  knockoutResults: {
    'Эрэгтэй дангаар': [
      {
        round: 'Хагас финал',
        player1: { name: 'Болд Бат', playerId: 'demo-player-1' },
        player2: { name: 'Эрдэнэ Очир', playerId: 'demo-player-2' },
        winner: { name: 'Болд Бат', playerId: 'demo-player-1' },
        sets: [{ player1: 11, player2: 8 }, { player1: 11, player2: 6 }, { player1: 11, player2: 9 }]
      }
    ],
    'Эмэгтэй дангаар': [
      {
        round: 'Хагас финал',
        player1: { name: 'Оюунаа Цэрэн', playerId: 'demo-player-3' },
        player2: { name: 'Алтанцэцэг Ганболд', playerId: 'demo-player-4' },
        winner: { name: 'Оюунаа Цэрэн', playerId: 'demo-player-3' },
        sets: [{ player1: 11, player2: 7 }, { player1: 9, player2: 11 }, { player1: 11, player2: 5 }, { player1: 11, player2: 8 }]
      }
    ]
  },
  finalRankings: {
    'Эрэгтэй дангаар': [
      { position: 1, name: 'Болд Бат', playerId: 'demo-player-1' },
      { position: 2, name: 'Эрдэнэ Очир', playerId: 'demo-player-2' }
    ],
    'Эмэгтэй дангаар': [
      { position: 1, name: 'Оюунаа Цэрэн', playerId: 'demo-player-3' },
      { position: 2, name: 'Алтанцэцэг Ганболд', playerId: 'demo-player-4' }
    ]
  },
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

module.exports = {
  demoTournament,
  demoParticipants,
  demoUsers,
  demoPlayers,
  demoTournamentResults
};
