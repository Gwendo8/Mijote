'use strict';

// Un aliment perso peut porter un code-barres (retrouvé au scan). Une même personne ne l'utilise qu'une fois
// (parmi ses aliments non archivés) ; deux personnes, ou un produit Open Food Facts en cache, peuvent avoir le même.
// L'index existant `foods_barcode_off_unique` ne concerne que les produits Open Food Facts.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('foods', ['owner_id', 'barcode'], {
      unique: true,
      where: { source: 'user', barcode: { [require('sequelize').Op.ne]: null }, archived_at: null },
      name: 'foods_barcode_user_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('foods', 'foods_barcode_user_unique');
  },
};
