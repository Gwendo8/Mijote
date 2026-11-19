import { DataTypes } from 'sequelize';

// Lien recette ↔ étiquette
export default (sequelize) =>
  sequelize.define(
    'RecipeTag',
    {
      recipeId: { type: DataTypes.INTEGER, allowNull: false },
      tagId: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'recipe_tags' },
  );
