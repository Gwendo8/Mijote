import { DataTypes } from 'sequelize';

// Personne choisie qui voit une recette en mode « shared »
export default (sequelize) =>
  sequelize.define(
    'RecipeShare',
    {
      recipeId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'recipe_shares' },
  );
