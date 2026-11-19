'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ce qui est prévu un jour dans un créneau (plusieurs lignes possibles) : recette, idée ou texte libre
    await queryInterface.createTable('meal_plan_entries', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Un jour du calendrier, sans heure : pas de souci de fuseau horaire
      date: { type: Sequelize.DATEONLY, allowNull: false },
      meal_slot_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'meal_slots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      // Vide = texte libre. Recette supprimée : la ligne garde son titre et devient du texte libre.
      recipe_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'recipes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      label: { type: Sequelize.STRING(255), allowNull: false },
      servings: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      // Calories saisies pour un texte libre
      calories_manual: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('meal_plan_entries', ['user_id', 'date']);
    await queryInterface.addIndex('meal_plan_entries', ['meal_slot_id']);
    await queryInterface.addIndex('meal_plan_entries', ['recipe_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meal_plan_entries');
  },
};
