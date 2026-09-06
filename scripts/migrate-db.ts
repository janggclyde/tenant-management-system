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

    const queryInterface = sequelize.getQueryInterface();

    // 2. Check and add frequency to BillingTypes if missing
    try {
      const billingTypesCols = await queryInterface.describeTable('BillingTypes');
      if (!billingTypesCols.frequency) {
        console.log('Adding frequency column to BillingTypes table...');
        await sequelize.query("ALTER TABLE `BillingTypes` ADD COLUMN `frequency` ENUM('monthly', 'quarterly', 'annually', 'one_time') DEFAULT 'monthly'");
        console.log('✅ Added frequency column to BillingTypes.');
      } else {
        console.log('ℹ️ frequency column already exists in BillingTypes.');
      }
    } catch (colErr: any) {
      console.warn('⚠️ Warning checking BillingTypes columns:', colErr.message);
    }

    // 3. Check and add billing_cycle to Billings if missing
    try {
      const billingsCols = await queryInterface.describeTable('Billings');
      if (!billingsCols.billing_cycle) {
        console.log('Adding billing_cycle column to Billings table...');
        await sequelize.query("ALTER TABLE `Billings` ADD COLUMN `billing_cycle` VARCHAR(50) DEFAULT 'monthly'");
        console.log('✅ Added billing_cycle column to Billings.');
      } else {
        console.log('ℹ️ billing_cycle column already exists in Billings.');
      }
    } catch (colErr: any) {
      console.warn('⚠️ Warning checking Billings columns:', colErr.message);
    }

    // 4. Seed default admin user if none exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await User.create({
        role: 'admin',
        email: 'admin1@sunrise.com',
        password_hash: '$2b$10$defaultpasswordhashplaceholder',
        status: 'active',
        tier_id: 2
      });
      console.log('🌱 Seeded default Admin user (admin1@sunrise.com).');
    }

    // 5. Test fetching BillingTypes
    const [types]: any = await sequelize.query('SELECT id, name, frequency FROM BillingTypes');
    console.log(`✅ BillingTypes loaded (${types.length} records):`, types.map((t: any) => `${t.id}: ${t.name} (${t.frequency})`).join(', '));

    console.log('🎉 Migration finished successfully.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Migration Error:', err.message);
    process.exit(1);
  }
}

migrateDatabase();
