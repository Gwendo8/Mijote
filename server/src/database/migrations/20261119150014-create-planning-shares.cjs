'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Qui voit mon planning, en lecture seule.
    // user_id vide = tout le monde ; week_start vide = tout le planning (sinon le lundi de la semaine partagée).
    await queryInterface.createTable('planning_shares', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      week_start: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    // NULLS NOT DISTINCT (PostgreSQL 15+) : deux partages « tout le monde, tout le planning » sont des doublons.
    // Sans ça, PostgreSQL considère deux valeurs vides comme différentes et accepterait le doublon.
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX planning_shares_owner_user_week_unique ' +
        'ON planning_shares (owner_id, user_id, week_start) NULLS NOT DISTINCT',
    );
    await queryInterface.addIndex('planning_shares', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('planning_shares');
  },
};
