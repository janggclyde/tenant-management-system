"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add separate toggle columns for electricity and water
    await queryInterface.addColumn("BillingTypes", "has_electricity", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("BillingTypes", "has_water", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Migrate existing data: copy has_meter_reading value into both new columns
    await queryInterface.sequelize.query(
      "UPDATE `BillingTypes` SET `has_electricity` = `has_meter_reading`, `has_water` = `has_meter_reading`"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("BillingTypes", "has_electricity");
    await queryInterface.removeColumn("BillingTypes", "has_water");
  },
};
