'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('app_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      registration_open: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    // Une seule ligne de réglages pour toute l'appli (id = 1). Absente = valeurs par défaut.
    await queryInterface.addConstraint('app_settings', {
      type: 'check',
      fields: ['id'],
      where: { id: 1 },
      name: 'app_settings_single_row',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('app_settings');
  },
};
