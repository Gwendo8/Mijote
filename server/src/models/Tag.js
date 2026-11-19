import { DataTypes } from 'sequelize';

// Étiquette de la liste gérée par l'admin
export default (sequelize) =>
  sequelize.define(
    'Tag',
    {
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'tags' },
  );
