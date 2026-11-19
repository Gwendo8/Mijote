'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créneaux de chaque personne : 4 par défaut (créés par le back à l'inscription, masquables),
    // plus ceux qu'elle ajoute (supprimables)
    await queryInterface.createTable('meal_slots', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_hidden: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('meal_slots', ['user_id', 'name'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meal_slots');
  },
};
