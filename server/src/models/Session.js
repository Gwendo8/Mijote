import { DataTypes } from 'sequelize';

// Session d'un appareil connecté. tokenHash ne sort jamais dans l'API.
export default (sequelize) =>
  sequelize.define(
    'Session',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      lastUsedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'sessions' },
  );
