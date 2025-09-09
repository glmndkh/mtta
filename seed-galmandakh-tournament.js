
import { db } from './server/db.js';
import { users, players, tournaments, tournamentParticipants } from './shared/schema.js';

// Нас ангилалууд
const ageCategories = [
  { name: '8-10 нас', minAge: 8, maxAge: 10, gender: 'male' },
  { name: '11-12 нас', minAge: 11, maxAge: 12, gender: 'male' },
  { name: '13-14 нас', minAge: 13, maxAge: 14, gender: 'male' },
  { name: '15-16 нас', minAge: 15, maxAge: 16, gender: 'male' },
  { name: '17-18 нас', minAge: 17, maxAge: 18, gender: 'male' },
  { name: '19+ нас', minAge: 19, maxAge: 45, gender: 'male' }
];

// Монгол нэрсийн жагсаалт
const mongolianNames = {
  male: [
    'Батбаяр', 'Отгонбаяр', 'Энхбаяр', 'Мөнхбаяр', 'Төмөрбаяр', 'Алтанбаяр',
    'Бямбасүрэн', 'Цагаансувд', 'Эрдэнэбат', 'Баярмандах', 'Бүхбат', 'Мандах',
    'Амарсанаа', 'Бөхбаяр', 'Цэвээнжав', 'Лхагвасүрэн', 'Дамдинсүрэн', 'Цогтбаяр',
    'Мөнхжаргал', 'Батмөнх', 'Энхтөр', 'Алтансух', 'Ганбаяр', 'Жавхлан',
    'Пүрэвдорж', 'Сүхбаяр', 'Мөнхтөр', 'Батболд', 'Энхбат', 'Цэндсүрэн',
    'Нямсүрэн', 'Мөнхдалай', 'Батсайхан', 'Энхжаргал', 'Алтантөгс', 'Болдбаяр'
  ]
};

const mongolianSurnames = [
  'Доржпүрэв', 'Батбаяр', 'Гантулга', 'Цэндсүрэн', 'Лхагвасүрэн', 'Мөнхбат',
  'Энхбаяр', 'Алтансух', 'Батбold', 'Цагаан', 'Мөнхжаргал', 'Сүхбаяр',
  'Дамдинсүрэн', 'Пүрэвдорж', 'Бүхбаяр', 'Нямдаваа', 'Цэвээн', 'Жавхлан',
  'Мөнхдалай', 'Энхтөр', 'Алтанбаяр', 'Болдсайхан', 'Цогтбаяр', 'Мандах',
  'Бямбасүрэн', 'Цагаансувд', 'Эрдэнэбат', 'Баярмандах', 'Батсайхан', 'Түвшин',
  'Очирбат', 'Мөнхбаяр', 'Энхбат', 'Алтантөгс', 'Цэндбаяр', 'Ганбаяр'
];

function getRandomName() {
  const firstName = mongolianNames.male[Math.floor(Math.random() * mongolianNames.male.length)];
  const lastName = mongolianSurnames[Math.floor(Math.random() * mongolianSurnames.length)];
  return { firstName, lastName };
}

function getRandomBirthDate(minAge, maxAge) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month - 1, day);
}

async function createTournamentWithParticipants() {
  console.log('Galmandakh Burmaa тэмцээн үүсгэж байна...');

  // Тэмцээн үүсгэх
  const tournamentId = `galmandakh-tournament-${Date.now()}`;
  const tournament = {
    id: tournamentId,
    name: 'Galmandakh Burmaa',
    description: 'Galmandakh Burmaa нэрэмжит тэмцээн',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 хоногийн дараа
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 хоногийн дараа
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 хоногийн дараа
    location: 'Улаанбаатар хот',
    organizer: 'МШТХ',
    maxParticipants: 100,
    entryFee: '0',
    status: 'registration',
    participationTypes: ageCategories.map(cat => 
      JSON.stringify({ minAge: cat.minAge, maxAge: cat.maxAge, gender: cat.gender })
    ),
    rules: 'ITTF дүрэм',
    prizes: 'Медаль, цом',
    contactInfo: 'contact@mtta.mn',
    schedule: null,
    requirements: null,
    isPublished: true,
    organizerId: '120ec006-ec32-4bd7-ba9a-14edc8e16e0e', // Admin user ID
    clubId: null,
    backgroundImageUrl: null,
    regulationDocumentUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    await db.insert(tournaments).values(tournament);
    console.log(`Тэмцээн үүсгэгдлээ: ${tournament.name}`);
  } catch (error) {
    console.log('Тэмцээн аль хэдийн үүссэн байж магадгүй');
  }

  // Нас ангилал бүрт 6 тоглогч үүсгэх
  let totalParticipants = 0;
  
  for (const category of ageCategories) {
    console.log(`${category.name} ангилалд тоглогчид үүсгэж байна...`);
    
    for (let i = 1; i <= 6; i++) {
      const { firstName, lastName } = getRandomName();
      const birthDate = getRandomBirthDate(category.minAge, category.maxAge);
      
      const userId = `galmandakh-user-${category.minAge}-${category.maxAge}-${i}`;
      const playerId = `galmandakh-player-${category.minAge}-${category.maxAge}-${i}`;
      const participantId = `galmandakh-participant-${category.minAge}-${category.maxAge}-${i}`;
      
      // Хэрэглэгч үүсгэх
      const user = {
        id: userId,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@demo.mn`,
        phone: `+976-${Math.floor(Math.random() * 90000000) + 10000000}`,
        password: '123456',
        firstName: firstName,
        lastName: lastName,
        gender: category.gender,
        dateOfBirth: birthDate,
        clubAffiliation: `Клуб ${Math.floor(Math.random() * 10) + 1}`,
        role: 'player',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Тоглогч үүсгэх
      const player = {
        id: playerId,
        userId: userId,
        memberNumber: `MTTA2025${String(totalParticipants + 1).padStart(3, '0')}`,
        rank: ['3-р зэрэг', '2-р зэрэг', '1-р зэрэг'][Math.floor(Math.random() * 3)],
        points: Math.floor(Math.random() * 1000) + 500,
        achievements: null,
        dateOfBirth: birthDate,
        wins: Math.floor(Math.random() * 20) + 5,
        losses: Math.floor(Math.random() * 10) + 2,
        winPercentage: Math.floor(Math.random() * 30) + 60,
        createdAt: new Date()
      };

      // Тэмцээнд бүртгэх
      const participant = {
        id: participantId,
        tournamentId: tournamentId,
        playerId: playerId,
        participationType: JSON.stringify({ 
          minAge: category.minAge, 
          maxAge: category.maxAge, 
          gender: category.gender 
        }),
        registeredAt: new Date(),
        status: 'registered'
      };

      try {
        await db.insert(users).values(user).onConflictDoNothing();
        await db.insert(players).values(player).onConflictDoNothing();
        await db.insert(tournamentParticipants).values(participant).onConflictDoNothing();
        
        console.log(`  ✓ ${firstName} ${lastName} (${category.minAge}-${category.maxAge} нас)`);
        totalParticipants++;
      } catch (error) {
        console.log(`  ✗ Алдаа: ${firstName} ${lastName} - ${error.message}`);
      }
    }
  }

  console.log(`\n🎉 Амжилттай дууслаа!`);
  console.log(`📊 Нийт үүсгэсэн тоглогчид: ${totalParticipants}`);
  console.log(`🏆 Тэмцээний нэр: ${tournament.name}`);
  console.log(`🆔 Тэмцээний ID: ${tournamentId}`);
  console.log(`\nТэмцээнийг харахын тулд: http://localhost:5000/tournaments/${tournamentId}`);
}

// Скрипт ажиллуулах
createTournamentWithParticipants().catch(console.error);
