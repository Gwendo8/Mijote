import request from 'supertest';
import app from '../src/app.js';
import { sentEmails } from '../src/integrations/mailer.js';
import { resetRateLimits } from '../src/middlewares/rateLimits.js';
import { resetOffBudget } from '../src/integrations/openfoodfacts.js';
import {
  Food,
  Invitation,
  Recipe,
  RecipeIngredient,
  sequelize,
  Tag,
  User,
} from '../src/models/index.js';
import { hashPassword } from '../src/utils/password.js';
import { generateToken } from '../src/utils/tokens.js';

export const PASSWORD = 'Motdepasse1!';

// À appeler dans beforeEach : base vide, compteurs de limites et e-mails remis à zéro
export async function resetAll() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  resetRateLimits();
  resetOffBudget();
  sentEmails.length = 0;
}

export async function createUser({
  email = 'gwen@example.fr',
  password = PASSWORD,
  firstName = 'Gwen',
  lastName = 'Martin',
  role = 'user',
} = {}) {
  return User.create({
    email,
    firstName,
    lastName,
    role,
    passwordHash: await hashPassword(password),
  });
}

// Navigateur de test connecté (garde le cookie de session entre les requêtes)
export async function loginAgent(user, password = PASSWORD) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: user.email, password }).expect(200);
  return agent;
}

export async function createInvitation({
  email = 'ami@example.fr',
  expiresInMs = 86_400_000,
} = {}) {
  const { token, tokenHash } = generateToken();
  const invitation = await Invitation.create({
    email,
    tokenHash,
    expiresAt: new Date(Date.now() + expiresInMs),
  });
  return { token, invitation };
}

// Jeton contenu dans le dernier e-mail « envoyé »
export function lastEmailToken() {
  const email = sentEmails.at(-1);
  return email?.text.match(/token=([\w-]+)/)?.[1];
}

// Raccourci : un compte admin
export const createAdmin = (overrides = {}) =>
  createUser({
    email: 'admin@example.fr',
    firstName: 'Admin',
    lastName: 'Test',
    role: 'admin',
    ...overrides,
  });

// Un aliment directement en base (par défaut : Ciqual)
export function createFood({ name = 'Poulet, blanc, cuit', ...data } = {}) {
  return Food.create({
    source: 'ciqual',
    name,
    searchName: name.toLowerCase(),
    energyKcal: 151,
    proteinsG: 29.8,
    carbsG: 0,
    fatsG: 3.5,
    ...data,
  });
}

export const createTag = (name = 'Plat', position = 0) => Tag.create({ name, position });

// Une recette directement en base (kind « recipe », privée, une part par défaut).
// `ingredients` : [{ food, grams, label, isNegligible }]
export async function createRecipe(owner, { ingredients = [], ...data } = {}) {
  const recipe = await Recipe.create({
    ownerId: owner.id,
    kind: 'recipe',
    title: 'Poulet au citron',
    servings: 1,
    ...data,
  });
  for (const [position, ingredient] of ingredients.entries()) {
    await RecipeIngredient.create({
      recipeId: recipe.id,
      position,
      label: ingredient.label ?? ingredient.food?.name ?? 'Ingrédient',
      foodId: ingredient.food?.id ?? null,
      grams: ingredient.grams ?? null,
      isNegligible: ingredient.isNegligible ?? false,
    });
  }
  return recipe;
}
