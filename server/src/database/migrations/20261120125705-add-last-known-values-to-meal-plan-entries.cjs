'use strict';

// Dernières calories et protéines connues de la recette, PAR PART.
// Gardées pour que la case garde ses chiffres si la recette n'est plus visible (partage retiré, recette supprimée).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meal_plan_entries', 'last_known_kcal_per_serving', {
      type: Sequelize.DECIMAL(7, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('meal_plan_entries', 'last_known_proteins_per_serving', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('meal_plan_entries', 'last_known_proteins_per_serving');
    await queryInterface.removeColumn('meal_plan_entries', 'last_known_kcal_per_serving');
  },
};
