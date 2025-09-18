
import { db } from './server/db.js';
import { users, players } from './shared/schema.js';
import bcrypt from 'bcrypt';

const usersToRegister = [
  {
    username: 'player-artuna-2025',
    email: 'battushigaan@tmind.mn',
    phone: '+976-9966-2345',
    password: 'password123',
    name: 'Артуна'
  },
  {
    username: 'player-batbayar-2025',
    email: 'batbayar.bold@gmail.com',
    phone: '+976-9911-1234',
    password: 'password123',
    name: 'Батбаяр'
  },
  {
    username: 'player-enkhjin-2025',
    email: 'enkhjin.munkh@gmail.com',
    phone: '+976-9955-7890',
    password: 'password123',
    name: 'Энхжин'
  },
  {
    username: 'player-munkhbat-2025',
    email: 'munkhbat.ganbat@gmail.com',
    phone: '+976-9933-9012',
    password: 'password123',
    name: 'Мөнхбат'
  },
  {
    username: 'player-oyunaa-2025',
    email: 'oyunaa.tseren@gmail.com',
    phone: '+976-9922-5678',
    password: 'password123',
    name: 'Оюунаа'
  },
  {
    username: 'player-saikhan-2025',
    email: 'saikhan.bayar@gmail.com',
    phone: '+976-9974-3456',
    password: 'password123',
    name: 'Сайхан'
  },
  {
    username: 'user_1755165593210_itl',
    email: 'galsanbayar@gmail.com',
    phone: '94808760',
    password: '123123',
    name: 'Галсанбаяр'
  },
  {
    username: 'user_1755169184453_itl',
    email: 'teamfiregg@gmail.com',
    phone: '94594000',
    password: '123123',
    name: 'Баттуулга'
  },
  {
    username: 'user_1755171492879_9gs',
    email: 'nyffy@gmail.com',
    phone: '99119900',
    password: '123123',
    name: 'Нямбаяр'
  },
  {
    username: 'user_1755928713644_jm9',
    email: null,
    phone: null,
    password: null,
    name: 'test1'
  },
  {
    username: 'user_1755968461814_f3n',
    email: 'boldoo@gmail.com',
    phone: '99885566',
    password: '123123',
    name: 'Болдоо'
  },
  {
    username: 'user_1757399541667_9mn',
    email: 'sarantuya.batsukhgmail.com',
    phone: '99001004',
    password: 'password123',
    name: 'Сарантуяа'
  },
  {
    username: 'user_1757399541705_trb',
    email: 'purevjav.munkhbat@gmail.com',
    phone: '99001003',
    password: 'password123',
    name: 'Пүрэвжав'
  },
  {
    username: 'user_1757399541706_h2m',
    email: 'munkhzul.battugs@gmail.com',
    phone: '99001006',
    password: 'password123',
    name: 'Мөнхзул'
  },
  {
    username: 'user_1757399541707_ugx',
    email: 'oyuntsetseg.enkhtuya@gmail.com',
    phone: '99001005',
    password: 'password123',
    name: 'Оюунцэцэг'
  },
  {
    username: 'user_1757399541771_cvw',
    email: 'gantulga.batbayar@gmail.com',
    phone: '99001002',
    password: 'password123',
    name: 'Гантулга'
  },
  {
    username: 'user_1757399541799_1rt',
    email: 'baterdene.tsogtbaatar@gmail.com',
    phone: '99001001',
    password: 'password123',
    name: 'Бат-Эрдэнэ'
  },
  {
    username: 'user_1757399552753_3yu',
    email: 'altantsetseg.purevdorj@gmail.com',
    phone: '99001012',
    password: 'password123',
    name: 'Алтанцэцэг'
  },
  {
    username: 'user_1757399552754_h5x',
    email: 'narantuya.javkhlan@gmail.com',
    phone: '99001011',
    password: 'password123',
    name: 'Нарантуяа'
  },
  {
    username: 'user_1757399552866_1pt',
    email: 'enkhbayar.davaa@gmail.com',
    phone: '99001008',
    password: 'password123',
    name: 'Энхбаяр'
  },
  {
    username: 'user_1757399552873_h8j',
    email: 'tsagaantsetseg.munkhbo@gmail.com',
    phone: '99001010',
    password: 'password123',
    name: 'Цагаанцэцэг'
  },
  {
    username: 'user_1757399552902_qlg',
    email: 'amarsaikhan.byambasure@gmail.com',
    phone: '99001009',
    password: 'password123',
    name: 'Амарсайхан'
  },
  {
    username: 'user_1757399552912_bu0',
    email: 'boldbaatar.tseveen@gmail.com',
    phone: '99001007',
    password: 'password123',
    name: 'Болдбаатар'
  },
  {
    username: 'user_1757399562072_k3c',
    email: 'saykhantsetseg.battulg@gmail.com',
    phone: '99001017',
    password: 'password123',
    name: 'Сайханцэцэг'
  },
  {
    username: 'user_1757399562098_yuz',
    email: 'urantuya.enkhbat@gmail.com',
    phone: '99001016',
    password: 'password123',
    name: 'Урантуяа'
  },
  {
    username: 'user_1757399562101_otb',
    email: 'oyunchimeg.gerelt@gmail.com',
    phone: '99001018',
    password: 'password123',
    name: 'Оюунчимэг'
  },
  {
    username: 'user_1757399562121_jvl',
    email: 'munkhbat.tsendsuran@gmail.com',
    phone: '99001015',
    password: 'password123',
    name: 'Мөнхбат'
  },
  {
    username: 'user_1757399562131_s1g',
    email: 'tumubaatar.ganbat@gmail.com',
    phone: '99001014',
    password: 'password123',
    name: 'Төмөрбаатар'
  },
  {
    username: 'user_1757399562144_b1t',
    email: 'khuselbaatar.badamsure@gmail.com',
    phone: '99001013',
    password: 'password123',
    name: 'Хүсэлбаатар'
  }
];

async function registerUsers() {
  console.log('Starting bulk user registration...');
  
  for (const userData of usersToRegister) {
    try {
      // Skip users without required data
      if (!userData.email && !userData.name) {
        console.log(`Skipping user ${userData.username} - missing required data`);
        continue;
      }

      // Hash password if provided
      let hashedPassword = null;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }

      // Insert user
      const [user] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        passwordHash: hashedPassword,
        role: 'player',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`✅ Created user: ${userData.username} (${userData.name})`);

      // Create corresponding player profile
      if (user && userData.name) {
        await db.insert(players).values({
          userId: user.id,
          name: userData.name,
          email: userData.email || '',
          phone: userData.phone || '',
          clubId: null,
          rating: 1500,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Created player profile for: ${userData.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.username}:`, error.message);
      
      // If user already exists, try to update
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`User ${userData.username} already exists, skipping...`);
      }
    }
  }
  
  console.log('Bulk user registration completed!');
  process.exit(0);
}

registerUsers().catch(console.error);
