import { DataTypes } from 'sequelize';

// Lien de réinitialisation du mot de passe. tokenHash ne sort jamais dans l'API.
export default (sequelize) =>
  sequelize.define(
    'PasswordResetToken',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      // Rempli quand c'est l'admin qui a créé le lien
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'password_reset_tokens' },
  );
