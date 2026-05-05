const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Follow = sequelize.define(
    'Follow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      following_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'follows',
      indexes: [{ unique: true, fields: ['follower_id', 'following_id'] }],
    }
  );

  return Follow;
};
