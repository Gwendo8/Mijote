import { DataTypes } from 'sequelize';

export const USER_ROLES = ['user', 'admin'];

// Un compte. passwordHash ne doit jamais sortir dans une réponse de l'API.
export default (sequelize) =>
  sequelize.define(
    'User',
    {
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        // Toujours en minuscules (la base le vérifie aussi)
        set(value) {
          this.setDataValue(
            'email',
            typeof value === 'string' ? value.trim().toLowerCase() : value,
          );
        },
      },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      displayName: { type: DataTypes.STRING(100), allowNull: false },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user',
        validate: { isIn: [USER_ROLES] },
      },
    },
    { tableName: 'users' },
  );
