import { Sequelize } from 'sequelize';
import { env } from '../config/env.js';
import defineAppSetting from './AppSetting.js';
import defineFood from './Food.js';
import defineFoodCorrection from './FoodCorrection.js';
import defineInvitation from './Invitation.js';
import defineMealPlanEntry from './MealPlanEntry.js';
import defineMealSlot from './MealSlot.js';
import definePasswordResetToken from './PasswordResetToken.js';
import definePlanningShare from './PlanningShare.js';
import defineRecipe from './Recipe.js';
import defineRecipeIngredient from './RecipeIngredient.js';
import defineRecipeShare from './RecipeShare.js';
import defineRecipeTag from './RecipeTag.js';
import defineSession from './Session.js';
import defineTag from './Tag.js';
import defineUser from './User.js';

// Connexion unique à la base, partagée par tous les modèles.
// La structure des tables se change UNIQUEMENT par des migrations, jamais avec sequelize.sync().
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
});

export const User = defineUser(sequelize);
export const AppSetting = defineAppSetting(sequelize);
export const Invitation = defineInvitation(sequelize);
export const PasswordResetToken = definePasswordResetToken(sequelize);
export const Session = defineSession(sequelize);
export const Food = defineFood(sequelize);
export const FoodCorrection = defineFoodCorrection(sequelize);
export const Tag = defineTag(sequelize);
export const Recipe = defineRecipe(sequelize);
export const RecipeIngredient = defineRecipeIngredient(sequelize);
export const RecipeTag = defineRecipeTag(sequelize);
export const RecipeShare = defineRecipeShare(sequelize);
export const MealSlot = defineMealSlot(sequelize);
export const MealPlanEntry = defineMealPlanEntry(sequelize);
export const PlanningShare = definePlanningShare(sequelize);

// ---------- Relations ----------
// Les suppressions en cascade sont faites par la base (contraintes des migrations) ;
// on les rappelle ici pour que Sequelize les connaisse.

// Comptes
User.hasMany(Invitation, { as: 'sentInvitations', foreignKey: 'invitedById' });
Invitation.belongsTo(User, { as: 'invitedBy', foreignKey: 'invitedById' });

User.hasMany(PasswordResetToken, {
  as: 'passwordResetTokens',
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
PasswordResetToken.belongsTo(User, { as: 'user', foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

User.hasMany(Session, { as: 'sessions', foreignKey: 'userId', onDelete: 'CASCADE' });
Session.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Aliments
User.hasMany(Food, { as: 'personalFoods', foreignKey: 'ownerId', onDelete: 'CASCADE' });
Food.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

Food.hasOne(FoodCorrection, { as: 'correction', foreignKey: 'foodId', onDelete: 'CASCADE' });
FoodCorrection.belongsTo(Food, { as: 'food', foreignKey: 'foodId' });
FoodCorrection.belongsTo(User, { as: 'correctedBy', foreignKey: 'correctedById' });

// Recettes et idées
User.hasMany(Recipe, { as: 'recipes', foreignKey: 'ownerId', onDelete: 'CASCADE' });
Recipe.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

Recipe.belongsTo(Recipe, { as: 'copiedFrom', foreignKey: 'copiedFromId' });
Recipe.hasMany(Recipe, { as: 'copies', foreignKey: 'copiedFromId' });

Recipe.hasMany(RecipeIngredient, {
  as: 'ingredients',
  foreignKey: 'recipeId',
  onDelete: 'CASCADE',
});
RecipeIngredient.belongsTo(Recipe, { as: 'recipe', foreignKey: 'recipeId' });
RecipeIngredient.belongsTo(Food, { as: 'food', foreignKey: 'foodId' });
Food.hasMany(RecipeIngredient, { as: 'ingredientUses', foreignKey: 'foodId' });

Recipe.belongsToMany(Tag, {
  through: RecipeTag,
  as: 'tags',
  foreignKey: 'recipeId',
  otherKey: 'tagId',
});
Tag.belongsToMany(Recipe, {
  through: RecipeTag,
  as: 'recipes',
  foreignKey: 'tagId',
  otherKey: 'recipeId',
});

Recipe.hasMany(RecipeShare, { as: 'shares', foreignKey: 'recipeId', onDelete: 'CASCADE' });
RecipeShare.belongsTo(Recipe, { as: 'recipe', foreignKey: 'recipeId' });
RecipeShare.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(RecipeShare, { as: 'recipesSharedWithMe', foreignKey: 'userId', onDelete: 'CASCADE' });

// Planning
User.hasMany(MealSlot, { as: 'mealSlots', foreignKey: 'userId', onDelete: 'CASCADE' });
MealSlot.belongsTo(User, { as: 'user', foreignKey: 'userId' });

MealSlot.hasMany(MealPlanEntry, { as: 'entries', foreignKey: 'mealSlotId', onDelete: 'CASCADE' });
MealPlanEntry.belongsTo(MealSlot, { as: 'mealSlot', foreignKey: 'mealSlotId' });
MealPlanEntry.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(MealPlanEntry, { as: 'mealPlanEntries', foreignKey: 'userId', onDelete: 'CASCADE' });
MealPlanEntry.belongsTo(Recipe, { as: 'recipe', foreignKey: 'recipeId' });
Recipe.hasMany(MealPlanEntry, { as: 'planEntries', foreignKey: 'recipeId' });

User.hasMany(PlanningShare, { as: 'planningShares', foreignKey: 'ownerId', onDelete: 'CASCADE' });
PlanningShare.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
PlanningShare.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(PlanningShare, {
  as: 'planningsSharedWithMe',
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
