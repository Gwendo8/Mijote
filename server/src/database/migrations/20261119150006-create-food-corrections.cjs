'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Corrections de l'admin, rangées à côté de l'aliment : la valeur d'origine reste intacte dans foods.
    // Un champ vide veut dire « pas corrigé ».
    await queryInterface.createTable('food_corrections', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      food_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'foods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: true },
      energy_kcal: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
      proteins_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      carbs_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      fats_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      corrected_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('food_corrections', ['corrected_by_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('food_corrections');
  },
};
