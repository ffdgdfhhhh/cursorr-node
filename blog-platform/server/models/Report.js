const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define(
    'Report',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'posts', key: 'id' },
      },
      reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      reason: {
        type: DataTypes.ENUM('spam', 'harassment', 'copyright', 'other'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'reports',
      indexes: [{ unique: true, fields: ['post_id', 'reporter_id'] }],
    }
  );

  return Report;
};
