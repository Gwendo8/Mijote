import { DataTypes } from 'sequelize';

// Qui voit le planning de ownerId, en lecture seule.
// userId vide = tout le monde ; weekStart vide = tout le planning (sinon le lundi de la semaine).
export default (sequelize) =>
  sequelize.define(
    'PlanningShare',
    {
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      weekStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isMonday(value) {
            if (value && new Date(`${value}T00:00:00Z`).getUTCDay() !== 1) {
              throw new Error('weekStart doit être un lundi');
            }
          },
        },
      },
    },
    { tableName: 'planning_shares' },
  );
