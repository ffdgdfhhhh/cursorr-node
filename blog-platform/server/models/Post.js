const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define(
    'Post',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      type: {
        type: DataTypes.ENUM('text', 'image', 'video', 'mixed'),
        allowNull: false,
        defaultValue: 'text',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      channel: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      likes_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      comments_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('active', 'reported', 'banned'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'posts',
    }
  );

  return Post;
};
