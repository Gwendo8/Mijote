'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invitations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING(255), allowNull: false },
      // Empreinte du jeton envoyé par e-mail, jamais le jeton lui-même
      token_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      invited_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('invitations', ['invited_by_id']);
    await queryInterface.addIndex('invitations', ['email']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invitations');
  },
};
