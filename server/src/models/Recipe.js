import { DataTypes } from 'sequelize';

export const RECIPE_KINDS = ['recipe', 'idea'];
export const VISIBILITIES = ['private', 'shared', 'public'];

// Une recette ou une idée de plat (kind). Séparées dans l'appli, rangées dans la même table.
export default (sequelize) =>
  sequelize.define(
    'Recipe',
    {
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      kind: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: { isIn: [RECIPE_KINDS] },
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      instructions: { type: DataTypes.TEXT, allowNull: true },
      servings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      prepTimeMinutes: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
      cookTimeMinutes: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
      sourceUrl: { type: DataTypes.STRING(2048), allowNull: true },
      photoPath: { type: DataTypes.STRING(255), allowNull: true },
      visibility: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'private',
        validate: { isIn: [VISIBILITIES] },
      },
      caloriesPerServingManual: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      proteinsPerServingManual: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      copiedFromId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'recipes' },
  );
