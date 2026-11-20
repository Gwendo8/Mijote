'use strict';

// Le nom affiché (display_name) devient prénom + nom, comme dans Platine.
// Les comptes existants gardent leur ancien nom comme prénom ; le nom reste vide
// (la personne le complète dans son profil).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'first_name',
        { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
        { transaction },
      );
      await queryInterface.addColumn(
        'users',
        'last_name',
        { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
        { transaction },
      );
      await queryInterface.sequelize.query('UPDATE users SET first_name = display_name', {
        transaction,
      });
      // Les défauts n'étaient là que pour remplir les lignes existantes
      await queryInterface.sequelize.query(
        'ALTER TABLE users ALTER COLUMN first_name DROP DEFAULT, ALTER COLUMN last_name DROP DEFAULT',
        { transaction },
      );
      await queryInterface.removeColumn('users', 'display_name', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'display_name',
        { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
        { transaction },
      );
      await queryInterface.sequelize.query(
        "UPDATE users SET display_name = btrim(first_name || ' ' || last_name)",
        { transaction },
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE users ALTER COLUMN display_name DROP DEFAULT',
        { transaction },
      );
      await queryInterface.removeColumn('users', 'first_name', { transaction });
      await queryInterface.removeColumn('users', 'last_name', { transaction });
    });
  },
};
