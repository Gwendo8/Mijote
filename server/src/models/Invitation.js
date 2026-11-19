import { DataTypes } from 'sequelize';

// Invitation par e-mail. tokenHash = empreinte du jeton, jamais renvoyée par l'API.
export default (sequelize) =>
  sequelize.define(
    'Invitation',
    {
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue(
            'email',
            typeof value === 'string' ? value.trim().toLowerCase() : value,
          );
        },
      },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      invitedById: { type: DataTypes.INTEGER, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      acceptedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'invitations' },
  );
