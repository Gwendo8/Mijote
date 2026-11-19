import { DataTypes } from 'sequelize';

// Créneaux créés pour chaque nouveau compte (par le back, à l'inscription)
export const DEFAULT_MEAL_SLOTS = ['Petit-déjeuner', 'Midi', 'Collation', 'Soir'];

// Créneau de repas d'une personne. Ceux par défaut se masquent, les autres se suppriment.
export default (sequelize) =>
  sequelize.define(
    'MealSlot',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
      isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'meal_slots' },
  );
