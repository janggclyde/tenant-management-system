"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hash = await bcrypt.hash("password123", 10);
    const errors = [];

    // Helper to try each insert and catch the exact error
    const tryInsert = async (tableName, records) => {
      try {
        await queryInterface.bulkInsert(tableName, records);
        console.log(`✅ ${tableName}: OK (${records.length} rows)`);
      } catch (err) {
        console.error(`\n❌ ${tableName} FAILED:`);
        console.error("   Message:", err.message);
        if (err.errors) {
          err.errors.forEach((e, i) => {
            console.error(
              `   Field #${i + 1}: ${e.path || e.instance || "unknown"}`,
            );
            console.error(`   Value:`, e.value);
            console.error(`   Validator:`, e.validatorKey);
            console.error(`   Message:`, e.message);
          });
        }
        if (err.original) {
          console.error(
            "   SQL Error:",
            err.original.sqlMessage || err.original.message,
          );
        }
        errors.push({ table: tableName, error: err.message });
        throw err;
      }
    };

    // 1. Subscription Tiers
    await tryInsert("SubscriptionTiers", [
      {
        name: "Starter",
        max_buildings: 1,
        allow_email: false,
        price: 999.0,
        features_json: JSON.stringify({
          max_units: 10,
          max_tenants: 10,
          analytics: "basic",
          custom_branding: false,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pro",
        max_buildings: 999,
        allow_email: true,
        price: 2499.0,
        features_json: JSON.stringify({
          max_units: null,
          max_tenants: null,
          analytics: "advanced",
          custom_branding: true,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 2. Users
    await tryInsert("Users", [
      {
        role: "super_admin",
        email: "superadmin@apartmanager.com",
        password_hash: hash,
        status: "active",
        tier_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "admin",
        email: "admin1@sunrise.com",
        password_hash: hash,
        status: "active",
        tier_id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "admin",
        email: "admin2@greenview.com",
        password_hash: hash,
        status: "active",
        tier_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "tenant",
        email: "juan.delacruz@email.com",
        password_hash: hash,
        status: "active",
        tier_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "tenant",
        email: "maria.santos@email.com",
        password_hash: hash,
        status: "active",
        tier_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "tenant",
        email: "pedro.reyes@email.com",
        password_hash: hash,
        status: "active",
        tier_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        role: "tenant",
        email: "ana.lim@email.com",
        password_hash: hash,
        status: "active",
        tier_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 3. System Settings
    await tryInsert("SystemSettings", [
      {
        hitpay_api_key: null,
        email_api_key: null,
        default_logo: "/assets/default-logo.png",
        default_colors: JSON.stringify({
          primary: "#3B82F6",
          secondary: "#10B981",
          accent: "#F59E0B",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 4. Buildings
    await tryInsert("Buildings", [
      {
        admin_id: 2,
        name: "Sunrise Apartments",
        address: "123 Main St, Makati City, Metro Manila",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        name: "Sunrise Annex",
        address: "125 Main St, Makati City, Metro Manila",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        name: "Greenview Residences",
        address: "456 Oak Ave, Quezon City, Metro Manila",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 5. Units
    await tryInsert("Units", [
      {
        admin_id: 2,
        building_id: 1,
        unit_number: "101",
        status: "occupied",
        monthly_rent: 15500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 1,
        unit_number: "102",
        status: "occupied",
        monthly_rent: 14000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 1,
        unit_number: "103",
        status: "vacant",
        monthly_rent: 15000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 1,
        unit_number: "201",
        status: "occupied",
        monthly_rent: 18000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 1,
        unit_number: "202",
        status: "vacant",
        monthly_rent: 16500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 2,
        unit_number: "A1",
        status: "vacant",
        monthly_rent: 12000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 2,
        unit_number: "A2",
        status: "vacant",
        monthly_rent: 12500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        building_id: 3,
        unit_number: "101",
        status: "occupied",
        monthly_rent: 10000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        building_id: 3,
        unit_number: "102",
        status: "occupied",
        monthly_rent: 11000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        building_id: 3,
        unit_number: "103",
        status: "vacant",
        monthly_rent: 10500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 6. Tenants
    await tryInsert("Tenants", [
      {
        admin_id: 2,
        user_id: 4,
        personal_info_json: JSON.stringify({
          first_name: "Juan",
          last_name: "Dela Cruz",
          phone: "+63 912 345 6789",
          address: "789 Pine St, Makati City",
          id_type: "Passport",
          id_number: "P1234567",
        }),
        emergency_contact: JSON.stringify({
          name: "Ana Dela Cruz",
          phone: "+63 912 345 6790",
          relationship: "Spouse",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        user_id: 5,
        personal_info_json: JSON.stringify({
          first_name: "Maria",
          last_name: "Santos",
          phone: "+63 917 123 4567",
          address: "321 Elm St, Quezon City",
          id_type: "Drivers License",
          id_number: "N01-12-345678",
        }),
        emergency_contact: JSON.stringify({
          name: "Jose Santos",
          phone: "+63 917 123 4568",
          relationship: "Father",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        user_id: 6,
        personal_info_json: JSON.stringify({
          first_name: "Pedro",
          last_name: "Reyes",
          phone: "+63 918 987 6543",
          address: "654 Maple Ave, Pasig City",
          id_type: "UMID",
          id_number: "1234-5678-9012",
        }),
        emergency_contact: JSON.stringify({
          name: "Luz Reyes",
          phone: "+63 918 987 6544",
          relationship: "Mother",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        user_id: 7,
        personal_info_json: JSON.stringify({
          first_name: "Ana",
          last_name: "Lim",
          phone: "+63 915 111 2222",
          address: "999 Cedar Rd, Quezon City",
          id_type: "Passport",
          id_number: "P7654321",
        }),
        emergency_contact: JSON.stringify({
          name: "Ben Lim",
          phone: "+63 915 111 2223",
          relationship: "Brother",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 7. Contracts
    await tryInsert("Contracts", [
      {
        admin_id: 2,
        tenant_id: 1,
        unit_id: 1,
        move_in_date: "2024-01-15",
        move_out_date: "2025-01-14",
        document_url: "/contracts/contract_001.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        tenant_id: 2,
        unit_id: 2,
        move_in_date: "2024-03-01",
        move_out_date: "2025-02-28",
        document_url: "/contracts/contract_002.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        tenant_id: 1,
        unit_id: 4,
        move_in_date: "2024-06-01",
        move_out_date: "2025-05-31",
        document_url: "/contracts/contract_003.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        tenant_id: 3,
        unit_id: 8,
        move_in_date: "2024-02-01",
        move_out_date: "2025-01-31",
        document_url: "/contracts/contract_004.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        tenant_id: 4,
        unit_id: 9,
        move_in_date: "2024-07-01",
        move_out_date: "2025-06-30",
        document_url: "/contracts/contract_005.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 8. Billing Types
    await tryInsert("BillingTypes", [
      {
        admin_id: 2,
        name: "Monthly Rent",
        description: "Standard unit rent",
        auto_generate: true,
        due_date_type: "fixed_day",
        due_date_value: 5,
        late_fee_type: "fixed",
        late_fee_amount: 500.0,
        allow_partial: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        name: "Electricity",
        description: "Electricity utility",
        auto_generate: true,
        due_date_type: "days_after_posting",
        due_date_value: 15,
        late_fee_type: "percentage",
        late_fee_amount: 5.0,
        allow_partial: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        name: "Water",
        description: "Water utility",
        auto_generate: true,
        due_date_type: "days_after_posting",
        due_date_value: 15,
        late_fee_type: "percentage",
        late_fee_amount: 3.0,
        allow_partial: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        name: "Parking Fee",
        description: "Reserved slot",
        auto_generate: true,
        due_date_type: "fixed_day",
        due_date_value: 1,
        late_fee_type: "fixed",
        late_fee_amount: 200.0,
        allow_partial: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        name: "Monthly Rent",
        description: "Greenview Monthly Rent",
        auto_generate: true,
        due_date_type: "fixed_day",
        due_date_value: 1,
        late_fee_type: "fixed",
        late_fee_amount: 300.0,
        allow_partial: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        name: "Association Dues",
        description: "Building maintenance dues",
        auto_generate: true,
        due_date_type: "days_after_posting",
        due_date_value: 10,
        late_fee_type: "percentage",
        late_fee_amount: 2.0,
        allow_partial: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 9. Billings
    await tryInsert("Billings", [
      {
        admin_id: 2,
        billing_type_id: 1,
        tenant_id: 1,
        unit_id: 1,
        base_amount: 15000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 15000.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 1,
        tenant_id: 1,
        unit_id: 1,
        base_amount: 15000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 15000.0,
        due_date: "2024-09-01",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 2,
        tenant_id: 1,
        unit_id: 1,
        base_amount: 2500.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 2500.0,
        due_date: "2024-08-15",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 3,
        tenant_id: 1,
        unit_id: 1,
        base_amount: 800.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 800.0,
        due_date: "2024-08-15",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 4,
        tenant_id: 1,
        unit_id: 1,
        base_amount: 1500.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 1500.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 1,
        tenant_id: 2,
        unit_id: 2,
        base_amount: 12000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 500.0,
        amount: 12500.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 2,
        tenant_id: 2,
        unit_id: 2,
        base_amount: 1800.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 1800.0,
        due_date: "2024-08-15",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 3,
        tenant_id: 2,
        unit_id: 2,
        base_amount: 600.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 600.0,
        due_date: "2024-08-15",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 1,
        tenant_id: 1,
        unit_id: 4,
        base_amount: 18000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 18000.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_type_id: 2,
        tenant_id: 1,
        unit_id: 4,
        base_amount: 3200.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 3200.0,
        due_date: "2024-08-15",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        billing_type_id: 5,
        tenant_id: 3,
        unit_id: 8,
        base_amount: 10000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 10000.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        billing_type_id: 6,
        tenant_id: 3,
        unit_id: 8,
        base_amount: 500.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 500.0,
        due_date: "2024-08-05",
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        billing_type_id: 5,
        tenant_id: 4,
        unit_id: 9,
        base_amount: 11000.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 300.0,
        amount: 11300.0,
        due_date: "2024-08-01",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        billing_type_id: 6,
        tenant_id: 4,
        unit_id: 9,
        base_amount: 550.0,
        tax_amount: 0,
        transfer_fee: 0,
        late_fee_applied: 0,
        amount: 550.0,
        due_date: "2024-08-05",
        status: "posted",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 10. Collections
    await tryInsert("Collections", [
      {
        admin_id: 2,
        billing_id: 3,
        amount_paid: 2500.0,
        payment_method: "gcash",
        hitpay_reference: "HPAY_20240810_001",
        status: "completed",
        receipt_url: "/receipts/receipt_001.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_id: 5,
        amount_paid: 1500.0,
        payment_method: "qr",
        hitpay_reference: "HPAY_20240805_002",
        status: "completed",
        receipt_url: "/receipts/receipt_002.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_id: 9,
        amount_paid: 10000.0,
        payment_method: "cash",
        hitpay_reference: null,
        status: "partial",
        receipt_url: "/receipts/receipt_003.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        billing_id: 1,
        amount_paid: 15000.0,
        payment_method: "gcash",
        hitpay_reference: "HPAY_20240802_004",
        status: "completed",
        receipt_url: "/receipts/receipt_004.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        billing_id: 11,
        amount_paid: 10000.0,
        payment_method: "gcash",
        hitpay_reference: "HPAY_20240803_005",
        status: "completed",
        receipt_url: "/receipts/receipt_005.pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 11. Advanced Payments
    await tryInsert("AdvancedPayments", [
      {
        admin_id: 2,
        tenant_id: 1,
        amount: 5000.0,
        remaining_balance: 5000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        tenant_id: 3,
        amount: 2000.0,
        remaining_balance: 1500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 12. Maintenance Tickets
    await tryInsert("MaintenanceTickets", [
      {
        admin_id: 2,
        tenant_id: 1,
        unit_id: 1,
        title: "Leaking faucet in kitchen",
        description:
          "The kitchen sink faucet has been dripping constantly for 3 days. Water is pooling under the sink.",
        photos_json: JSON.stringify([
          "/uploads/ticket_001_1.jpg",
          "/uploads/ticket_001_2.jpg",
        ]),
        status: "open",
        createdAt: new Date("2024-08-10"),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        tenant_id: 2,
        unit_id: 2,
        title: "AC not cooling",
        description:
          "The air conditioner in the bedroom is blowing warm air even at the lowest temperature setting.",
        photos_json: null,
        status: "in_progress",
        createdAt: new Date("2024-08-08"),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        tenant_id: 1,
        unit_id: 1,
        title: "Broken light switch",
        description:
          "Living room light switch is loose and sometimes doesn't work. Need replacement.",
        photos_json: JSON.stringify(["/uploads/ticket_003_1.jpg"]),
        status: "resolved",
        createdAt: new Date("2024-07-20"),
        updatedAt: new Date("2024-07-22"),
      },
      {
        admin_id: 3,
        tenant_id: 3,
        unit_id: 8,
        title: "Clogged drain",
        description:
          "Bathroom drain is clogged and water is draining very slowly.",
        photos_json: JSON.stringify(["/uploads/ticket_004_1.jpg"]),
        status: "open",
        createdAt: new Date("2024-08-12"),
        updatedAt: new Date(),
      },
    ]);

    // 13. Announcements
    await tryInsert("Announcements", [
      {
        admin_id: 2,
        building_id: 1,
        title: "Water Interruption Notice",
        content:
          "Please be advised that there will be a water interruption on August 20, 2024 from 9AM to 12NN due to maintenance work.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: null,
        title: "New Garbage Collection Schedule",
        content:
          "Starting September 1, garbage collection will be every Tuesday and Friday at 6AM. Please have your trash ready.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        building_id: 3,
        title: "Fire Drill Reminder",
        content:
          "Mandatory fire drill will be conducted on August 25, 2024 at 2PM. All tenants must participate.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 2,
        building_id: 1,
        title: "Parking Area Repainting",
        content:
          "The basement parking area will be repainted on August 18-19. Please park at the overflow area during this time.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 14. Subscriptions
    await tryInsert("Subscriptions", [
      {
        admin_id: 2,
        tier_id: 2,
        status: "active",
        hitpay_reference: "HPAY_SUB_001",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 3,
        tier_id: 1,
        status: "active",
        hitpay_reference: "HPAY_SUB_002",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 15. Notifications
    await tryInsert("Notifications", [
      {
        user_id: 4,
        type: "new_bill",
        message:
          "A new bill for Monthly Rent (₱15,000.00) has been posted for Unit 101. Due on Aug 1, 2024.",
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 4,
        type: "payment_received",
        message:
          "Your payment of ₱2,500.00 for Electricity has been received. Receipt #REC-001.",
        is_read: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 5,
        type: "late_fee",
        message:
          "A late fee of ₱500.00 has been applied to your Monthly Rent bill for Unit 102. Please settle immediately.",
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 6,
        type: "new_bill",
        message:
          "A new bill for Monthly Rent (₱10,000.00) has been posted for Unit 101. Due on Aug 1, 2024.",
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 7,
        type: "new_bill",
        message:
          "A new bill for Monthly Rent (₱11,000.00) has been posted for Unit 102. Due on Aug 1, 2024.",
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 4,
        type: "maintenance_update",
        message:
          "Your maintenance ticket #3 (Broken light switch) has been resolved.",
        is_read: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: 5,
        type: "announcement",
        message:
          "New announcement: AC not cooling ticket #2 is now in progress. Technician assigned.",
        is_read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("\n🎉 All demo data seeded successfully with user ownership!");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Notifications", null, {});
    await queryInterface.bulkDelete("Subscriptions", null, {});
    await queryInterface.bulkDelete("Announcements", null, {});
    await queryInterface.bulkDelete("MaintenanceTickets", null, {});
    await queryInterface.bulkDelete("AdvancedPayments", null, {});
    await queryInterface.bulkDelete("Collections", null, {});
    await queryInterface.bulkDelete("Billings", null, {});
    await queryInterface.bulkDelete("BillingTypes", null, {});
    await queryInterface.bulkDelete("Contracts", null, {});
    await queryInterface.bulkDelete("Tenants", null, {});
    await queryInterface.bulkDelete("Units", null, {});
    await queryInterface.bulkDelete("Buildings", null, {});
    await queryInterface.bulkDelete("SystemSettings", null, {});
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("SubscriptionTiers", null, {});
  },
};
