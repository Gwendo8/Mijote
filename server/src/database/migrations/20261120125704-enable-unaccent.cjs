'use strict';

// Recherche sans accents (« gateau » trouve « Gâteau »), comme dans Platine.
// unaccent est une extension « de confiance » depuis PostgreSQL 13 : le propriétaire de la base peut l'activer.
// Côté back : WHERE unaccent(lower(colonne)) LIKE unaccent(lower(:recherche)).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS unaccent');
  },
};
