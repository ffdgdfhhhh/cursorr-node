const sequelize = require('../config/database');
const UserModel = require('./User');
const ChannelModel = require('./Channel');
const PostModel = require('./Post');
const LikeModel = require('./Like');
const CommentModel = require('./Comment');
const ReportModel = require('./Report');
const ConversationModel = require('./Conversation');
const MessageModel = require('./Message');
const FollowModel = require('./Follow');

const User = UserModel(sequelize);
const Channel = ChannelModel(sequelize);
const Post = PostModel(sequelize);
const Like = LikeModel(sequelize);
const Comment = CommentModel(sequelize);
const Report = ReportModel(sequelize);
const Conversation = ConversationModel(sequelize);
const Message = MessageModel(sequelize);
const Follow = FollowModel(sequelize);

User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

User.hasMany(Like, { foreignKey: 'user_id' });
Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Post.hasMany(Like, { foreignKey: 'post_id' });
Like.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Post.hasMany(Comment, { foreignKey: 'post_id' });
Comment.belongsTo(Post, { foreignKey: 'post_id' });

Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reportsMade' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Post.hasMany(Report, { foreignKey: 'post_id' });
Report.belongsTo(Post, { foreignKey: 'post_id' });

Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id' });

Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'following_id', as: 'following' });
User.hasMany(Follow, { foreignKey: 'follower_id', as: 'followsOutgoing' });
User.hasMany(Follow, { foreignKey: 'following_id', as: 'followsIncoming' });

module.exports = {
  sequelize,
  User,
  Channel,
  Post,
  Like,
  Comment,
  Report,
  Conversation,
  Message,
  Follow,
};
