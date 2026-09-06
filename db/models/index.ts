import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import mysql2 from "mysql2";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sylvia";

// const sequelize = new Sequelize(dbUrl, {
//   dialect: "mysql",
//   logging: false,
// });

const sequelizeOptions = {
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  dialect: "mysql" as const,
  dialectModule: mysql2,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
  logging: false,
};

const sequelize =
  (global as any).sequelize ||
  new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USERNAME!,
    process.env.DB_PASSWORD!,
    sequelizeOptions
  );

if (process.env.NODE_ENV !== "production") {
  (global as any).sequelize = sequelize;
}

export const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role: {
    type: DataTypes.ENUM("tenant", "admin", "super_admin"),
    allowNull: false,
  },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  tier_id: { type: DataTypes.INTEGER, allowNull: true },
});

export const Building = sequelize.define("Building", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
});

export const Unit = sequelize.define("Unit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  building_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_number: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "vacant" },
  monthly_rent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 15000.0 },
});

export const Tenant = sequelize.define("Tenant", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  personal_info_json: { type: DataTypes.JSON, allowNull: true },
  emergency_contact: { type: DataTypes.STRING, allowNull: true },
});

export const Contract = sequelize.define("Contract", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_id: { type: DataTypes.INTEGER, allowNull: false },
  move_in_date: { type: DataTypes.DATEONLY, allowNull: false },
  move_out_date: { type: DataTypes.DATEONLY, allowNull: true },
  document_url: { type: DataTypes.STRING, allowNull: true },
});

export const BillingType = sequelize.define("BillingType", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  frequency: {
    type: DataTypes.ENUM("monthly", "quarterly", "annually", "one_time"),
    defaultValue: "monthly",
  },
  due_date_type: {
    type: DataTypes.ENUM("fixed_day", "days_after_posting"),
    defaultValue: "days_after_posting",
  },
  due_date_value: { type: DataTypes.INTEGER, defaultValue: 15 },
  late_fee_type: {
    type: DataTypes.ENUM("none", "fixed", "percentage"),
    defaultValue: "none",
  },
  late_fee_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  grace_period_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  tax_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  transfer_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  has_meter_reading: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_electricity: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_water: { type: DataTypes.BOOLEAN, defaultValue: false },
  rate_per_unit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  electricity_rate_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 12.5,
  },
  water_rate_per_unit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 45.0 },
  allow_partial: { type: DataTypes.BOOLEAN, defaultValue: false },
  auto_generate: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export const Billing = sequelize.define("Billing", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  billing_type_id: { type: DataTypes.INTEGER, allowNull: false },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_id: { type: DataTypes.INTEGER, allowNull: false },
  billing_cycle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "monthly",
  },
  base_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  transfer_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  late_fee_applied: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  meter_readings_json: { type: DataTypes.JSON, allowNull: true },
  extra_charges_json: { type: DataTypes.JSON, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("draft", "posted"), defaultValue: "draft" },
});

export const Collection = sequelize.define("Collection", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  billing_id: { type: DataTypes.INTEGER, allowNull: false },
  amount_paid: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: {
    type: DataTypes.ENUM("gcash", "qr", "cash"),
    allowNull: false,
  },
  hitpay_reference: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "pending" },
  receipt_url: { type: DataTypes.STRING, allowNull: true },
});

export const AdvancedPayment = sequelize.define("AdvancedPayment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  remaining_balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

export const MaintenanceTicket = sequelize.define("MaintenanceTicket", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  tenant_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  photos_json: { type: DataTypes.JSON, allowNull: true },
  status: {
    type: DataTypes.ENUM("open", "in_progress", "resolved"),
    defaultValue: "open",
  },
});

export const Announcement = sequelize.define("Announcement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false },
  building_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
});

export const SubscriptionTier = sequelize.define("SubscriptionTier", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  max_buildings: { type: DataTypes.INTEGER, allowNull: false },
  allow_email: { type: DataTypes.BOOLEAN, defaultValue: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  features_json: { type: DataTypes.JSON, allowNull: true },
});

export const Subscription = sequelize.define("Subscription", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER, allowNull: false },
  tier_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  hitpay_reference: { type: DataTypes.STRING, allowNull: true },
});

export const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export const SystemSetting = sequelize.define("SystemSetting", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hitpay_api_key: { type: DataTypes.STRING, allowNull: true },
  hitpay_salt: { type: DataTypes.STRING, allowNull: true },
  hitpay_mode: { type: DataTypes.STRING, defaultValue: "sandbox" },
  currency: { type: DataTypes.STRING, defaultValue: "PHP" },
  tax_rate_default: { type: DataTypes.DECIMAL(5, 2), defaultValue: 12.0 },
  email_provider: { type: DataTypes.STRING, defaultValue: "smtp" },
  email_api_key: { type: DataTypes.STRING, allowNull: true },
  smtp_host: { type: DataTypes.STRING, allowNull: true },
  smtp_port: { type: DataTypes.INTEGER, defaultValue: 505 },
  smtp_user: { type: DataTypes.STRING, allowNull: true },
  default_sender_email: {
    type: DataTypes.STRING,
    defaultValue: "noreply@aptsaas.com",
  },
  default_sender_name: {
    type: DataTypes.STRING,
    defaultValue: "ApartManager Platform",
  },
  platform_name: { type: DataTypes.STRING, defaultValue: "ApartManager SaaS" },
  support_email: {
    type: DataTypes.STRING,
    defaultValue: "support@aptsaas.com",
  },
  support_phone: { type: DataTypes.STRING, allowNull: true },
  default_logo: {
    type: DataTypes.STRING,
    defaultValue: "/assets/default-logo.png",
  },
  default_colors: { type: DataTypes.JSON, allowNull: true },
  maintenance_mode: { type: DataTypes.BOOLEAN, defaultValue: false },
  allow_customer_registration: { type: DataTypes.BOOLEAN, defaultValue: true },
  session_timeout_hours: { type: DataTypes.INTEGER, defaultValue: 24 },
  max_file_upload_mb: { type: DataTypes.INTEGER, defaultValue: 10 },
});

// Associations
User.hasMany(Building, { foreignKey: "admin_id" });
Building.belongsTo(User, { foreignKey: "admin_id" });

User.hasMany(Unit, { foreignKey: "admin_id" });
Unit.belongsTo(User, { foreignKey: "admin_id" });

Building.hasMany(Unit, { foreignKey: "building_id" });
Unit.belongsTo(Building, { foreignKey: "building_id" });

User.hasMany(Tenant, { as: "ManagedTenants", foreignKey: "admin_id" });
Tenant.belongsTo(User, { as: "Admin", foreignKey: "admin_id" });

User.hasOne(Tenant, { as: "TenantProfile", foreignKey: "user_id" });
Tenant.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Contract, { foreignKey: "admin_id" });
Contract.belongsTo(User, { foreignKey: "admin_id" });

Tenant.hasMany(Contract, { foreignKey: "tenant_id" });
Contract.belongsTo(Tenant, { foreignKey: "tenant_id" });

Unit.hasMany(Contract, { foreignKey: "unit_id" });
Contract.belongsTo(Unit, { foreignKey: "unit_id" });

User.hasMany(BillingType, { foreignKey: "admin_id" });
BillingType.belongsTo(User, { foreignKey: "admin_id" });

BillingType.hasMany(Billing, { foreignKey: "billing_type_id" });
Billing.belongsTo(BillingType, { foreignKey: "billing_type_id" });

User.hasMany(Billing, { foreignKey: "admin_id" });
Billing.belongsTo(User, { foreignKey: "admin_id" });

Tenant.hasMany(Billing, { foreignKey: "tenant_id" });
Billing.belongsTo(Tenant, { foreignKey: "tenant_id" });

Unit.hasMany(Billing, { foreignKey: "unit_id" });
Billing.belongsTo(Unit, { foreignKey: "unit_id" });

User.hasMany(Collection, { foreignKey: "admin_id" });
Collection.belongsTo(User, { foreignKey: "admin_id" });

Billing.hasMany(Collection, { foreignKey: "billing_id" });
Collection.belongsTo(Billing, { foreignKey: "billing_id" });

User.hasMany(AdvancedPayment, { foreignKey: "admin_id" });
AdvancedPayment.belongsTo(User, { foreignKey: "admin_id" });

Tenant.hasMany(AdvancedPayment, { foreignKey: "tenant_id" });
AdvancedPayment.belongsTo(Tenant, { foreignKey: "tenant_id" });

User.hasMany(MaintenanceTicket, { foreignKey: "admin_id" });
MaintenanceTicket.belongsTo(User, { foreignKey: "admin_id" });

Tenant.hasMany(MaintenanceTicket, { foreignKey: "tenant_id" });
MaintenanceTicket.belongsTo(Tenant, { foreignKey: "tenant_id" });

Unit.hasMany(MaintenanceTicket, { foreignKey: "unit_id" });
MaintenanceTicket.belongsTo(Unit, { foreignKey: "unit_id" });

User.hasMany(Announcement, { foreignKey: "admin_id" });
Announcement.belongsTo(User, { foreignKey: "admin_id" });

Building.hasMany(Announcement, { foreignKey: "building_id" });
Announcement.belongsTo(Building, { foreignKey: "building_id" });

SubscriptionTier.hasMany(Subscription, { foreignKey: "tier_id" });
Subscription.belongsTo(SubscriptionTier, { foreignKey: "tier_id" });

User.hasMany(Subscription, { foreignKey: "admin_id" });
Subscription.belongsTo(User, { foreignKey: "admin_id" });

User.belongsTo(SubscriptionTier, { foreignKey: "tier_id" });
SubscriptionTier.hasMany(User, { foreignKey: "tier_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

let isSynced = false;

export async function syncDatabase() {
  if (!isSynced) {
    try {
      await sequelize.authenticate();
      // await sequelize.sync({ alter: true }); // Disabled for performance. Use migrations instead.
      isSynced = true;
    } catch (err: any) {
      // If DB is offline, continue gracefully
    }
  }
}

export default sequelize;
