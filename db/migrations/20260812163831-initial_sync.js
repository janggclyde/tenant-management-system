"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. SubscriptionTiers
    await queryInterface.createTable("SubscriptionTiers", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      max_buildings: { type: Sequelize.INTEGER, allowNull: false },
      allow_email: { type: Sequelize.BOOLEAN, defaultValue: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      features_json: { type: Sequelize.JSON, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    // 2. Users
    await queryInterface.createTable("Users", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      role: {
        type: Sequelize.ENUM("tenant", "admin", "super_admin"),
        allowNull: false,
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: "active" },
      tier_id: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addIndex("Users", ["email"]);
    await queryInterface.addIndex("Users", ["role"]);
    await queryInterface.addConstraint("Users", {
      fields: ["tier_id"],
      type: "foreign key",
      name: "fk_users_tier_id",
      references: { table: "SubscriptionTiers", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 3. SystemSettings
    await queryInterface.createTable("SystemSettings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      hitpay_api_key: { type: Sequelize.STRING, allowNull: true },
      hitpay_salt: { type: Sequelize.STRING, allowNull: true },
      hitpay_mode: { type: Sequelize.STRING, defaultValue: "sandbox" },
      currency: { type: Sequelize.STRING, defaultValue: "PHP" },
      tax_rate_default: { type: Sequelize.DECIMAL(5, 2), defaultValue: 12.0 },
      email_provider: { type: Sequelize.STRING, defaultValue: "smtp" },
      email_api_key: { type: Sequelize.STRING, allowNull: true },
      smtp_host: { type: Sequelize.STRING, allowNull: true },
      smtp_port: { type: Sequelize.INTEGER, defaultValue: 505 },
      smtp_user: { type: Sequelize.STRING, allowNull: true },
      default_sender_email: {
        type: Sequelize.STRING,
        defaultValue: "noreply@aptsaas.com",
      },
      default_sender_name: {
        type: Sequelize.STRING,
        defaultValue: "ApartManager Platform",
      },
      platform_name: {
        type: Sequelize.STRING,
        defaultValue: "ApartManager SaaS",
      },
      support_email: {
        type: Sequelize.STRING,
        defaultValue: "support@aptsaas.com",
      },
      support_phone: { type: Sequelize.STRING, allowNull: true },
      default_logo: {
        type: Sequelize.STRING,
        defaultValue: "/assets/default-logo.png",
      },
      default_colors: { type: Sequelize.JSON, allowNull: true },
      maintenance_mode: { type: Sequelize.BOOLEAN, defaultValue: false },
      allow_customer_registration: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      session_timeout_hours: { type: Sequelize.INTEGER, defaultValue: 24 },
      max_file_upload_mb: { type: Sequelize.INTEGER, defaultValue: 10 },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    // 4. Buildings
    await queryInterface.createTable("Buildings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Buildings", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_buildings_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Buildings", ["admin_id"]);

    // 5. Units
    await queryInterface.createTable("Units", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      building_id: { type: Sequelize.INTEGER, allowNull: false },
      unit_number: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: "vacant" },
      monthly_rent: { type: Sequelize.DECIMAL(10, 2), defaultValue: 15000.0 },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Units", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_units_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Units", {
      fields: ["building_id"],
      type: "foreign key",
      name: "fk_units_building_id",
      references: { table: "Buildings", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Units", ["admin_id"]);
    await queryInterface.addIndex("Units", ["building_id"]);

    // 6. Tenants
    await queryInterface.createTable("Tenants", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      personal_info_json: { type: Sequelize.JSON, allowNull: true },
      emergency_contact: { type: Sequelize.STRING, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Tenants", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_tenants_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Tenants", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_tenants_user_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Tenants", ["admin_id"]);
    await queryInterface.addIndex("Tenants", ["user_id"]);

    // 7. Contracts
    await queryInterface.createTable("Contracts", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      move_in_date: { type: Sequelize.DATEONLY, allowNull: false },
      move_out_date: { type: Sequelize.DATEONLY, allowNull: true },
      document_url: { type: Sequelize.STRING, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Contracts", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_contracts_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Contracts", {
      fields: ["tenant_id"],
      type: "foreign key",
      name: "fk_contracts_tenant_id",
      references: { table: "Tenants", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Contracts", {
      fields: ["unit_id"],
      type: "foreign key",
      name: "fk_contracts_unit_id",
      references: { table: "Units", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Contracts", ["admin_id"]);

    // 8. BillingTypes
    await queryInterface.createTable("BillingTypes", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      due_date_type: {
        type: Sequelize.ENUM("fixed_day", "days_after_posting"),
        defaultValue: "days_after_posting",
      },
      due_date_value: { type: Sequelize.INTEGER, defaultValue: 15 },
      late_fee_type: {
        type: Sequelize.ENUM("none", "fixed", "percentage"),
        defaultValue: "none",
      },
      late_fee_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      grace_period_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      tax_percentage: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      transfer_fee: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      has_meter_reading: { type: Sequelize.BOOLEAN, defaultValue: false },
      rate_per_unit: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      electricity_rate_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 12.5,
      },
      water_rate_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 45.0,
      },
      allow_partial: { type: Sequelize.BOOLEAN, defaultValue: false },
      auto_generate: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("BillingTypes", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_billingtypes_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("BillingTypes", ["admin_id"]);

    // 9. Billings
    await queryInterface.createTable("Billings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      billing_type_id: { type: Sequelize.INTEGER, allowNull: false },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      base_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      tax_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      transfer_fee: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      late_fee_applied: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      meter_readings_json: { type: Sequelize.JSON, allowNull: true },
      extra_charges_json: { type: Sequelize.JSON, allowNull: true },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("draft", "posted"),
        defaultValue: "draft",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Billings", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_billings_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Billings", {
      fields: ["billing_type_id"],
      type: "foreign key",
      name: "fk_billings_billing_type_id",
      references: { table: "BillingTypes", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Billings", {
      fields: ["tenant_id"],
      type: "foreign key",
      name: "fk_billings_tenant_id",
      references: { table: "Tenants", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Billings", {
      fields: ["unit_id"],
      type: "foreign key",
      name: "fk_billings_unit_id",
      references: { table: "Units", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Billings", ["admin_id"]);
    await queryInterface.addIndex("Billings", ["status"]);

    // 10. Collections
    await queryInterface.createTable("Collections", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      billing_id: { type: Sequelize.INTEGER, allowNull: false },
      amount_paid: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_method: {
        type: Sequelize.ENUM("gcash", "qr", "cash"),
        allowNull: false,
      },
      hitpay_reference: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.STRING, defaultValue: "pending" },
      receipt_url: { type: Sequelize.STRING, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Collections", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_collections_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Collections", {
      fields: ["billing_id"],
      type: "foreign key",
      name: "fk_collections_billing_id",
      references: { table: "Billings", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Collections", ["admin_id"]);

    // 11. AdvancedPayments
    await queryInterface.createTable("AdvancedPayments", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      remaining_balance: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("AdvancedPayments", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_advancedpayments_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("AdvancedPayments", {
      fields: ["tenant_id"],
      type: "foreign key",
      name: "fk_advancedpayments_tenant_id",
      references: { table: "Tenants", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("AdvancedPayments", ["admin_id"]);

    // 12. MaintenanceTickets
    await queryInterface.createTable("MaintenanceTickets", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      photos_json: { type: Sequelize.JSON, allowNull: true },
      status: {
        type: Sequelize.ENUM("open", "in_progress", "resolved"),
        defaultValue: "open",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("MaintenanceTickets", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_maintenancetickets_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("MaintenanceTickets", {
      fields: ["tenant_id"],
      type: "foreign key",
      name: "fk_maintenancetickets_tenant_id",
      references: { table: "Tenants", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("MaintenanceTickets", {
      fields: ["unit_id"],
      type: "foreign key",
      name: "fk_maintenancetickets_unit_id",
      references: { table: "Units", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("MaintenanceTickets", ["admin_id"]);

    // 13. Announcements
    await queryInterface.createTable("Announcements", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false },
      building_id: { type: Sequelize.INTEGER, allowNull: true },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Announcements", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_announcements_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Announcements", {
      fields: ["building_id"],
      type: "foreign key",
      name: "fk_announcements_building_id",
      references: { table: "Buildings", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("Announcements", ["admin_id"]);

    // 14. Subscriptions
    await queryInterface.createTable("Subscriptions", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: Sequelize.INTEGER, allowNull: false },
      tier_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: "active" },
      hitpay_reference: { type: Sequelize.STRING, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Subscriptions", {
      fields: ["admin_id"],
      type: "foreign key",
      name: "fk_subscriptions_admin_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Subscriptions", {
      fields: ["tier_id"],
      type: "foreign key",
      name: "fk_subscriptions_tier_id",
      references: { table: "SubscriptionTiers", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Subscriptions", ["admin_id"]);

    // 15. Notifications
    await queryInterface.createTable("Notifications", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
    await queryInterface.addConstraint("Notifications", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_notifications_user_id",
      references: { table: "Users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("Notifications", ["user_id", "is_read"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.dropTable("Notifications");
    await queryInterface.dropTable("Subscriptions");
    await queryInterface.dropTable("Announcements");
    await queryInterface.dropTable("MaintenanceTickets");
    await queryInterface.dropTable("AdvancedPayments");
    await queryInterface.dropTable("Collections");
    await queryInterface.dropTable("Billings");
    await queryInterface.dropTable("BillingTypes");
    await queryInterface.dropTable("Contracts");
    await queryInterface.dropTable("Tenants");
    await queryInterface.dropTable("Units");
    await queryInterface.dropTable("Buildings");
    await queryInterface.dropTable("SystemSettings");
    await queryInterface.dropTable("Users");
    await queryInterface.dropTable("SubscriptionTiers");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  },
};
