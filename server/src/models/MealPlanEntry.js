import { DataTypes } from 'sequelize';

// Ce qui est prévu un jour dans un créneau : recette ou idée (recipeId), ou texte libre (recipeId vide)
export default (sequelize) =>
  sequelize.define(
    'MealPlanEntry',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      // Jour du calendrier, sans heure (« 2026-11-23 »)
      date: { type: DataTypes.DATEONLY, allowNull: false },
      mealSlotId: { type: DataTypes.INTEGER, allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      recipeId: { type: DataTypes.INTEGER, allowNull: true },
      // Titre affiché, gardé si la recette est supprimée
      label: { type: DataTypes.STRING(255), allowNull: false },
      servings: { type: DataTypes.DECIMAL(5, 2), allowNull: true, validate: { min: 0 } },
      caloriesManual: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      // Dernières valeurs connues de la recette, par part : gardées si la recette n'est plus visible
      lastKnownKcalPerServing: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
      lastKnownProteinsPerServing: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    },
    { tableName: 'meal_plan_entries' },
  );
