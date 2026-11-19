import { DataTypes } from 'sequelize';

// Correction de l'admin d'un aliment commun, à côté de la valeur d'origine. Champ vide = pas corrigé.
export default (sequelize) =>
  sequelize.define(
    'FoodCorrection',
    {
      foodId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      energyKcal: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      proteinsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      carbsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      fatsG: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      correctedById: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'food_corrections' },
  );
