'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Une recette (kind = recipe) ou une idée de plat (kind = idea). Séparées dans l'appli, rangées ensemble ici.
    await queryInterface.createTable('recipes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      kind: { type: Sequelize.STRING(10), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      // Étapes, une par ligne (recettes seulement)
      instructions: { type: Sequelize.TEXT, allowNull: true },
      servings: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      prep_time_minutes: { type: Sequelize.INTEGER, allowNull: true },
      cook_time_minutes: { type: Sequelize.INTEGER, allowNull: true },
      source_url: { type: Sequelize.STRING(2048), allowNull: true },
      photo_path: { type: Sequelize.STRING(255), allowNull: true },
      // private | shared | public
      visibility: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'private' },
      // Correction à la main ; sinon les valeurs sont calculées depuis les ingrédients
      calories_per_serving_manual: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
      proteins_per_serving_manual: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      // Si c'est une copie : la recette d'origine (vidé si l'originale est supprimée)
      copied_from_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'recipes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('recipes', ['owner_id', 'kind']);
    await queryInterface.addIndex('recipes', ['visibility']);
    await queryInterface.addIndex('recipes', ['copied_from_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipes');
  },
};
