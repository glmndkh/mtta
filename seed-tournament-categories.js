
const { db } = require('./server/db.ts');
const { users, players, tournamentParticipants } = require('./shared/schema.ts');

const tournamentId = '4f1651de-eb33-4bb0-987f-b8d162ace245';

// Насны ангиллууд
const ageCategories = [
  { category: 'U-12 эрэгтэй', minAge: 8, maxAge: 12, gender: 'male' },
  { category: 'U-15 эрэгтэй', minAge: 13, maxAge: 15, gender: 'male' },
  { category: 'U-18 эрэгтэй', minAge: 16, maxAge: 18, gender: 'male' },
  { category: 'Ахмад эрэгтэй', minAge: 19, maxAge: 50, gender: 'male' },
  { category: 'U-12 эмэгтэй', minAge: 8, maxAge: 12, gender: 'female' },
  { category: 'U-15 эмэгтэй', minAge: 13, maxAge: 15, gender: 'female' },
  { category: 'U-18 эмэгтэй', minAge: 16, maxAge: 18, gender: 'female' },
  { category: 'Ахмад эмэгтэй', minAge: 19, maxAge: 50, gender: 'female' }
];

// 16 demo тамирчин
const demoUsers = [];
const demoPlayers = [];
const demoParticipants = [];

// Эрэгтэй тамирчид (8 хүн)
const maleNames = [
  ['Болд', 'Батбаяр'], ['Төмөр', 'Түмэнбаяр'], ['Цагаан', 'Дашням'], ['Алтан', 'Цогтбаяр'],
  ['Энх', 'Амгалан'], ['Мөнх', 'Дэлгэр'], ['Баяр', 'Сайхан'], ['Ганбат', 'Зориг']
];

// Эмэгтэй тамирчид (8 хүн)  
const femaleNames = [
  ['Сайхан', 'Цэцэг'], ['Алтан', 'Гэрэл'], ['Оюун', 'Чимэг'], ['Номин', 'Эрдэнэ'],
  ['Энх', 'Туяа'], ['Мөнх', 'Сарнай'], ['Цагаан', 'Одон'], ['Дулам', 'Сүрэн']
];

// Насны хуваарилалт
const ageRanges = [
  { min: 10, max: 12 }, // U-12
  { min: 13, max: 15 }, // U-15
  { min: 16, max: 18 }, // U-18
  { min: 20, max: 35 }  // Ахмад
];

// Эрэгтэй тамирчид үүсгэх
for (let i = 0; i < 8; i++) {
  const userId = `demo-male-${i + 1}`;
  const playerId = `demo-male-player-${i + 1}`;
  const [firstName, lastName] = maleNames[i];
  const ageRange = ageRanges[i % 4];
  const age = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  demoUsers.push({
    id: userId,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.mn`,
    phone: `+976-8888-${String(i + 1).padStart(4, '0')}`,
    firstName,
    lastName,
    gender: 'male',
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    clubAffiliation: i % 2 === 0 ? 'Төв клуб' : 'Багануур клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  demoPlayers.push({
    id: playerId,
    userId,
    memberNumber: `MTTA2025${String(i + 10).padStart(3, '0')}`,
    rank: i < 2 ? '1-р зэрэг' : i < 4 ? '2-р зэрэг' : '3-р зэрэг',
    points: Math.floor(Math.random() * 500) + 800,
    achievements: i < 2 ? 'Клубын аварга' : null,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    wins: Math.floor(Math.random() * 20) + 10,
    losses: Math.floor(Math.random() * 10) + 3,
    winPercentage: Math.floor(Math.random() * 30) + 65,
    createdAt: new Date()
  });

  // Оролцооны төрөл тодорхойлох
  let participationType;
  if (age <= 12) participationType = JSON.stringify({ minAge: 8, maxAge: 12, gender: 'male' });
  else if (age <= 15) participationType = JSON.stringify({ minAge: 13, maxAge: 15, gender: 'male' });
  else if (age <= 18) participationType = JSON.stringify({ minAge: 16, maxAge: 18, gender: 'male' });
  else participationType = JSON.stringify({ minAge: 19, maxAge: 50, gender: 'male' });

  demoParticipants.push({
    id: `demo-participant-male-${i + 1}`,
    tournamentId,
    playerId,
    participationType,
    registeredAt: new Date(),
    status: 'registered'
  });
}

// Эмэгтэй тамирчид үүсгэх
for (let i = 0; i < 8; i++) {
  const userId = `demo-female-${i + 1}`;
  const playerId = `demo-female-player-${i + 1}`;
  const [firstName, lastName] = femaleNames[i];
  const ageRange = ageRanges[i % 4];
  const age = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  demoUsers.push({
    id: userId,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.mn`,
    phone: `+976-7777-${String(i + 1).padStart(4, '0')}`,
    firstName,
    lastName,
    gender: 'female',
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    clubAffiliation: i % 2 === 0 ? 'Чингэлтэй клуб' : 'Сүхбаатар клуб',
    role: 'player',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  demoPlayers.push({
    id: playerId,
    userId,
    memberNumber: `MTTA2025${String(i + 20).padStart(3, '0')}`,
    rank: i < 2 ? '1-р зэрэг' : i < 4 ? '2-р зэрэг' : '3-р зэрэг',
    points: Math.floor(Math.random() * 400) + 700,
    achievements: i < 2 ? 'Клубын аварга' : null,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    wins: Math.floor(Math.random() * 18) + 8,
    losses: Math.floor(Math.random() * 8) + 2,
    winPercentage: Math.floor(Math.random() * 25) + 60,
    createdAt: new Date()
  });

  // Оролцооны төрөл тодорхойлох
  let participationType;
  if (age <= 12) participationType = JSON.stringify({ minAge: 8, maxAge: 12, gender: 'female' });
  else if (age <= 15) participationType = JSON.stringify({ minAge: 13, maxAge: 15, gender: 'female' });
  else if (age <= 18) participationType = JSON.stringify({ minAge: 16, maxAge: 18, gender: 'female' });
  else participationType = JSON.stringify({ minAge: 19, maxAge: 50, gender: 'female' });

  demoParticipants.push({
    id: `demo-participant-female-${i + 1}`,
    tournamentId,
    playerId,
    participationType,
    registeredAt: new Date(),
    status: 'registered'
  });
}

async function seedTournamentCategories() {
  try {
    console.log(`Тэмцээн ${tournamentId}-д насны ангилал ба 16 тамирчин нэмж байна...`);

    // Хэрэглэгчид үүсгэх
    console.log('16 demo хэрэглэгчид үүсгэж байна...');
    for (const user of demoUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Тоглогчид үүсгэх
    console.log('16 demo тоглогчид үүсгэж байна...');
    for (const player of demoPlayers) {
      await db.insert(players).values(player).onConflictDoNothing();
    }

    // Оролцогчид бүртгэх
    console.log('16 оролцогчид тэмцээнд бүртгэж байна...');
    for (const participant of demoParticipants) {
      await db.insert(tournamentParticipants).values(participant).onConflictDoNothing();
    }

    console.log('✅ Амжилттай дууслаа!');
    console.log('Тэмцээний ID:', tournamentId);
    console.log('Нийт оролцогчид:', demoParticipants.length);
    
    console.log('\n📊 Насны ангиллаар:');
    const categoryCounts = {};
    demoParticipants.forEach(p => {
      const cat = JSON.parse(p.participationType);
      const key = `${cat.minAge}-${cat.maxAge} ${cat.gender === 'male' ? 'эрэгтэй' : 'эмэгтэй'}`;
      categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`${category}: ${count} тамирчин`);
    });

    console.log('\n🌐 Тэмцээнийг үзэх:');
    console.log(`/tournaments/${tournamentId}`);
    console.log(`/admin/tournament/${tournamentId}/results`);

  } catch (error) {
    console.error('❌ Алдаа гарлаа:', error);
  }
}

// Run the seeding function
seedTournamentCategories();
