'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      display_name: { type: Sequelize.STRING(100), allowNull: false },
      role: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'user' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    // L'e-mail est toujours stocké en minuscules : « Julie@x.fr » et « julie@x.fr » sont le même compte
    await queryInterface.addConstraint('users', {
      type: 'check',
      fields: ['email'],
      where: {
        email: Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('email')),
          Sequelize.col('email'),
        ),
      },
      name: 'users_email_lowercase',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
