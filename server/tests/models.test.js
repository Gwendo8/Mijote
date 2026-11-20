import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  Food,
  Invitation,
  MealPlanEntry,
  MealSlot,
  PlanningShare,
  Recipe,
  RecipeIngredient,
  Session,
  Tag,
  User,
  sequelize,
} from '../src/models/index.js';

// Vérifie que la base applique bien les règles décidées pour le schéma (suppressions, unicités).
// Tourne sur la base de test uniquement (voir tests/setup.js).

const TABLES = [
  'planning_shares',
  'meal_plan_entries',
  'meal_slots',
  'recipe_shares',
  'recipe_tags',
  'recipe_ingredients',
  'recipes',
  'tags',
  'food_corrections',
  'foods',
  'sessions',
  'password_reset_tokens',
  'invitations',
  'app_settings',
  'users',
];

const createUser = (email = 'julie@example.com') =>
  User.create({ email, passwordHash: 'empreinte', displayName: 'Julie' });

beforeEach(async () => {
  await sequelize.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Comptes', () => {
  it('supprime les sessions avec le compte et refuse deux fois la même empreinte', async () => {
    const user = await createUser();
    const soon = new Date(Date.now() + 60_000);
    const values = {
      userId: user.id,
      tokenHash: 'a'.repeat(64),
      expiresAt: soon,
      lastUsedAt: new Date(),
    };
    await Session.create(values);
    await expect(Session.create(values)).rejects.toThrow();
    await user.destroy();
    expect(await Session.count()).toBe(0);
  });

  it('cherche sans accents grâce à unaccent', async () => {
    const [[row]] = await sequelize.query("SELECT unaccent(lower('Gâteau RÔTI')) AS texte");
    expect(row.texte).toBe('gateau roti');
  });

  it("range l'e-mail en minuscules", async () => {
    const user = await createUser('  Julie@Example.COM ');
    expect(user.email).toBe('julie@example.com');
  });

  it('refuse un e-mail en majuscules écrit directement en base', async () => {
    await expect(
      sequelize.query(
        "INSERT INTO users (email, password_hash, display_name, role, created_at, updated_at) VALUES ('A@B.FR', 'x', 'A', 'user', now(), now())",
      ),
    ).rejects.toThrow();
  });

  it("supprime avec le compte ses recettes, aliments perso et créneaux, et garde les invitations qu'il a envoyées", async () => {
    const user = await createUser();
    await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Lasagnes' });
    await Food.create({
      source: 'user',
      ownerId: user.id,
      name: 'Mon pain',
      searchName: 'mon pain',
    });
    await MealSlot.create({ userId: user.id, name: 'Midi', position: 1, isDefault: true });
    const invitation = await Invitation.create({
      email: 'ami@example.com',
      tokenHash: 'h1',
      invitedById: user.id,
      expiresAt: new Date(),
    });

    await user.destroy();

    expect(await Recipe.count()).toBe(0);
    expect(await Food.count()).toBe(0);
    expect(await MealSlot.count()).toBe(0);
    await invitation.reload();
    expect(invitation.invitedById).toBeNull();
  });
});

describe('Recettes', () => {
  it('supprime les ingrédients avec la recette et transforme la case du planning en texte libre', async () => {
    const user = await createUser();
    const recipe = await Recipe.create({ ownerId: user.id, kind: 'idea', title: 'Bowl poulet' });
    await RecipeIngredient.create({ recipeId: recipe.id, position: 1, label: 'Poulet 150 g' });
    const slot = await MealSlot.create({ userId: user.id, name: 'Midi', position: 1 });
    const entry = await MealPlanEntry.create({
      userId: user.id,
      date: '2026-11-23',
      mealSlotId: slot.id,
      recipeId: recipe.id,
      label: recipe.title,
    });

    await recipe.destroy();

    expect(await RecipeIngredient.count()).toBe(0);
    await entry.reload();
    expect(entry.recipeId).toBeNull();
    expect(entry.label).toBe('Bowl poulet');
  });

  it("garde la copie quand l'originale est supprimée", async () => {
    const user = await createUser();
    const original = await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Crêpes' });
    const copy = await Recipe.create({
      ownerId: user.id,
      kind: 'recipe',
      title: 'Crêpes',
      copiedFromId: original.id,
    });

    await original.destroy();

    await copy.reload();
    expect(copy.copiedFromId).toBeNull();
  });

  it('relie les étiquettes aux recettes', async () => {
    const user = await createUser();
    const recipe = await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Chili' });
    const tag = await Tag.create({ name: 'Batch cooking' });
    await recipe.addTag(tag);

    const tags = await recipe.getTags();
    expect(tags.map((t) => t.name)).toEqual(['Batch cooking']);
  });

  it('refuse un type de recette inconnu', async () => {
    const user = await createUser();
    await expect(Recipe.create({ ownerId: user.id, kind: 'menu', title: 'X' })).rejects.toThrow();
  });
});

describe('Aliments', () => {
  it("n'accepte qu'un produit Open Food Facts par code-barres, mais laisse un aliment perso le reprendre", async () => {
    const user = await createUser();
    const off = { source: 'off', name: 'Skyr', searchName: 'skyr', barcode: '3017620422003' };
    await Food.create(off);
    await expect(Food.create(off)).rejects.toThrow();
    await expect(Food.create({ ...off, source: 'user', ownerId: user.id })).resolves.toBeDefined();
  });
});

describe('Partage du planning', () => {
  it('refuse deux partages « tout le monde, tout le planning » identiques', async () => {
    const user = await createUser();
    await PlanningShare.create({ ownerId: user.id });
    await expect(PlanningShare.create({ ownerId: user.id })).rejects.toThrow();
  });

  it('accepte une semaine précise à côté du partage complet, et exige un lundi', async () => {
    const user = await createUser();
    await PlanningShare.create({ ownerId: user.id });
    await expect(
      PlanningShare.create({ ownerId: user.id, weekStart: '2026-11-23' }),
    ).resolves.toBeDefined();
    await expect(
      PlanningShare.create({ ownerId: user.id, weekStart: '2026-11-25' }),
    ).rejects.toThrow();
  });
});
