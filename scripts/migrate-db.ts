import sequelize, { 
  Building, 
  Unit, 
  User, 
  Tenant, 
  Contract, 
  BillingType, 
  Billing, 
  Collection 
} from '../db/models';

async function migrateDatabase() {
  console.log('🚀 Starting Database Migration & Schema Sync...');
  try {
    // 1. Authenticate connection
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database.');

    // 2. Sync all schemas with alter: true
    await sequelize.sync({ alter: true });
    console.log('✅ All database tables synced successfully with { alter: true } and admin_id isolation.');

    // 3. Seed default admin user if none exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const admin = await User.create({
        role: 'admin',
        email: 'admin1@sunrise.com',
        password_hash: '$2b$10$defaultpasswordhashplaceholder',
        status: 'active',
        tier_id: 2
      });
      console.log('🌱 Seeded default Admin user (admin1@sunrise.com).');
    }

    console.log('🎉 Migration finished successfully.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Migration Error:', err.message);
    process.exit(1);
  }
}

migrateDatabase();
