
import { db } from './server/db.ts';
import { users, players, tournamentParticipants } from './shared/schema.ts';

const tournamentId = '4f1651de-eb33-4bb0-987f-b8d162ace245';

// 16 demo тамирчин - бүгдийг 20-40 насны ангилалд оруулах
const demoUsers = [];
const demoPlayers = [];
const demoParticipants = [];

// Эрэгтэй тамирчид (8 хүн) - 20-40 нас
const maleNames = [
  ['Болд', 'Батбаяр'], ['Төмөр', 'Түмэнбаяр'], ['Цагаан', 'Дашням'], ['Алтан', 'Цогтбаяр'],
  ['Энх', 'Амгалан'], ['Мөнх', 'Дэлгэр'], ['Баяр', 'Сайхан'], ['Ганбат', 'Зориг']
];

for (let i = 0; i < 8; i++) {
  const [lastName, firstName] = maleNames[i];
  const age = Math.floor(Math.random() * 21) + 20; // 20-40 нас
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  const userId = `demo-user-male-${i + 1}`;
  const playerId = `demo-player-male-${i + 1}`;

  demoUsers.push({
    id: userId,
    firstName,
    lastName,
    gender: 'male',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.mn`,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    phone: `9999${String(i + 10).padStart(4, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  demoPlayers.push({
    id: playerId,
    userId,
    clubAffiliation: i % 2 === 0 ? 'demo-club-1' : 'demo-club-2',
    registrationNumber: `2025${String(i + 10).padStart(3, '0')}`,
    rank: i < 2 ? '1-р зэрэг' : i < 4 ? '2-р зэрэг' : '3-р зэрэг',
    points: Math.floor(Math.random() * 500) + 800,
    achievements: i < 2 ? 'Клубын аварга' : null,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    wins: Math.floor(Math.random() * 20) + 10,
    losses: Math.floor(Math.random() * 10) + 3,
    winPercentage: Math.floor(Math.random() * 30) + 65,
    createdAt: new Date()
  });

  // 20-40 насны эрэгтэй ангилал
  const participationType = JSON.stringify({ minAge: 20, maxAge: 40, gender: 'male' });

  demoParticipants.push({
    id: `demo-participant-male-${i + 1}`,
    tournamentId,
    playerId,
    participationType,
    registeredAt: new Date(),
    status: 'registered'
  });
}

// Эмэгтэй тамирчид (8 хүн) - 20-40 нас
const femaleNames = [
  ['Сайхан', 'Цэцэг'], ['Алтан', 'Гэрэл'], ['Оюун', 'Чимэг'], ['Номин', 'Эрдэнэ'],
  ['Энх', 'Туяа'], ['Мөнх', 'Сэцэн'], ['Баяр', 'Мандах'], ['Цэнд', 'Оюунаа']
];

for (let i = 0; i < 8; i++) {
  const [lastName, firstName] = femaleNames[i];
  const age = Math.floor(Math.random() * 21) + 20; // 20-40 нас
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  const userId = `demo-user-female-${i + 1}`;
  const playerId = `demo-player-female-${i + 1}`;

  demoUsers.push({
    id: userId,
    firstName,
    lastName,
    gender: 'female',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.mn`,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    phone: `9999${String(i + 20).padStart(4, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  demoPlayers.push({
    id: playerId,
    userId,
    clubAffiliation: i % 2 === 0 ? 'demo-club-1' : 'demo-club-2',
    registrationNumber: `2025${String(i + 20).padStart(3, '0')}`,
    rank: i < 2 ? '1-р зэрэг' : i < 4 ? '2-р зэрэг' : '3-р зэрэг',
    points: Math.floor(Math.random() * 400) + 700,
    achievements: i < 2 ? 'Клубын аварга' : null,
    dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
    wins: Math.floor(Math.random() * 18) + 8,
    losses: Math.floor(Math.random() * 8) + 2,
    winPercentage: Math.floor(Math.random() * 25) + 60,
    createdAt: new Date()
  });

  // 20-40 насны эмэгтэй ангилал
  const participationType = JSON.stringify({ minAge: 20, maxAge: 40, gender: 'female' });

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
    console.log(`Тэмцээн ${tournamentId}-д 20-40 насны ангилал ба 16 тамирчин нэмж байна...`);

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
    
    console.log('\n📊 Насны ангилал:');
    console.log('20-40 нас эрэгтэй: 8 тамирчин');
    console.log('20-40 нас эмэгтэй: 8 тамирчин');
    
  } catch (error) {
    console.error('❌ Алдаа гарлаа:', error);
  } finally {
    process.exit(0);
  }
}

// Script ажиллуулах
seedTournamentCategories();
