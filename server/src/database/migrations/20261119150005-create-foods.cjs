'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('foods', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      // ciqual | off (Open Food Facts) | user (aliment perso)
      source: { type: Sequelize.STRING(20), allowNull: false },
      // Rempli seulement pour un aliment perso
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      // Nom en minuscules sans accents, pour la recherche
      search_name: { type: Sequelize.STRING(255), allowNull: false },
      brand: { type: Sequelize.STRING(255), allowNull: true },
      category: { type: Sequelize.STRING(255), allowNull: true },
      ciqual_code: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      barcode: { type: Sequelize.STRING(32), allowNull: true },
      // Valeurs pour 100 g (vides si inconnues : Ciqual a des trous)
      energy_kcal: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
      proteins_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      carbs_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      fats_g: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      fetched_at: { type: Sequelize.DATE, allowNull: true },
      // Aliment absent de la dernière table Ciqual : gardé pour ne pas casser les recettes
      archived_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('foods', ['owner_id']);
    await queryInterface.addIndex('foods', ['search_name']);
    // Un produit Open Food Facts n'est gardé qu'une fois par code-barres ; un aliment perso peut avoir le même
    await queryInterface.addIndex('foods', ['barcode'], {
      unique: true,
      where: { source: 'off' },
      name: 'foods_barcode_off_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('foods');
  },
};
