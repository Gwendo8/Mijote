import { DataTypes } from 'sequelize';

// ciqual = table officielle, off = produit Open Food Facts gardé en cache, user = aliment perso
export const FOOD_SOURCES = ['ciqual', 'off', 'user'];

// Tous les aliments, valeurs pour 100 g. Les aliments Ciqual ne sont jamais modifiés en place :
// les corrections de l'admin vont dans FoodCorrection.
export default (sequelize) =>
  sequelize.define(
    'Food',
    {
      source: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { isIn: [FOOD_SOURCES] },
      },
      ownerId: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      searchName: { type: DataTypes.STRING(255), allowNull: false },
      brand: { type: DataTypes.STRING(255), allowNull: true },
      category: { type: DataTypes.STRING(255), allowNull: true },
      ciqualCode: { type: DataTypes.STRING(20), allowNull: true, unique: true },
      barcode: { type: DataTypes.STRING(32), allowNull: true },
      energyKcal: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      proteinsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      carbsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      fatsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      fetchedAt: { type: DataTypes.DATE, allowNull: true },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'foods' },
  );
