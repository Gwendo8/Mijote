import { DataTypes } from 'sequelize';

// Réglages de l'appli : une seule ligne (id = 1). Absente = valeurs par défaut.
export default (sequelize) =>
  sequelize.define(
    'AppSetting',
    {
      registrationOpen: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'app_settings' },
  );
