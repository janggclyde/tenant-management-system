"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('Billings', 'extra_charges_json', {
    //   type: Sequelize.JSON,
    //   allowNull: true,
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Billings", "extra_charges_json");
  },
};
