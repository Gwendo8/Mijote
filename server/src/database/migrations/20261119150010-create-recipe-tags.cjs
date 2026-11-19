'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lien recette ↔ étiquette
    await queryInterface.createTable('recipe_tags', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      recipe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'recipes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tags', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    // L'index unique (recipe_id, tag_id) sert aussi d'index sur recipe_id
    await queryInterface.addIndex('recipe_tags', ['recipe_id', 'tag_id'], { unique: true });
    await queryInterface.addIndex('recipe_tags', ['tag_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipe_tags');
  },
};
