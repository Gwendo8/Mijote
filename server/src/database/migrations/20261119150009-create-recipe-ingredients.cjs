'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Une ligne d'ingrédient. Comptée dans les calories si elle a un aliment et des grammes, ou si négligeable.
    await queryInterface.createTable('recipe_ingredients', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      recipe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'recipes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      position: { type: Sequelize.INTEGER, allowNull: false },
      // Texte affiché : « 2 œufs », « 1 pincée de sel »
      label: { type: Sequelize.STRING(255), allowNull: false },
      // Aliment supprimé : la ligne garde son texte et redevient « à compléter »
      food_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'foods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      grams: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      // Sel, poivre… : compte pour 0 et ne bloque pas le calcul
      is_negligible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('recipe_ingredients', ['recipe_id']);
    await queryInterface.addIndex('recipe_ingredients', ['food_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipe_ingredients');
  },
};
