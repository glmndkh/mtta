
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database(".data/sqlite.db");

async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get('admin@gmail.com');

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    const userId = `user_${Date.now()}_admin`;
    db.prepare(`
      INSERT INTO users (
        id, email, phone, password, firstName, lastName, 
        gender, dateOfBirth, role, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'admin@gmail.com',
      '99999999',
      hashedPassword,
      'Admin',
      'User',
      'male',
      '1990-01-01',
      'admin',
      new Date().toISOString(),
      new Date().toISOString()
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    db.close();
  }
}

seedAdminUser();
