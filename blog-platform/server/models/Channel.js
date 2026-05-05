const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Channel = sequelize.define(
    'Channel',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'channels',
      timestamps: false,
    }
  );

  return Channel;
};
