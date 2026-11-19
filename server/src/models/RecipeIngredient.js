import { DataTypes } from 'sequelize';

// Une ligne d'ingrédient : texte affiché, et si possible aliment + grammes pour le calcul
export default (sequelize) =>
  sequelize.define(
    'RecipeIngredient',
    {
      recipeId: { type: DataTypes.INTEGER, allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
      label: { type: DataTypes.STRING(255), allowNull: false },
      foodId: { type: DataTypes.INTEGER, allowNull: true },
      grams: { type: DataTypes.DECIMAL(8, 2), allowNull: true, validate: { min: 0 } },
      isNegligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'recipe_ingredients' },
  );
