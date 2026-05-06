-- 创享社区 MySQL 8.0 初始化脚本
-- 使用：mysql -u root -p < database.sql
-- 或在客户端中执行以下语句后，再由 Sequelize sync 维护结构（推荐开发时用 npm run dev 自动建表）
-- 关注表 follows 已包含在文末（原独立脚本 add-follows-table.sql 已合并至此）。老库补表可整文件执行，CREATE TABLE IF NOT EXISTS 不影响已有表。

CREATE DATABASE IF NOT EXISTS `chuangxiang_blog`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `chuangxiang_blog`;

-- 以下为参考 DDL，与 Sequelize 模型字段一致；若已使用 sequelize.sync() 建表，可跳过 CREATE TABLE。

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `channels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` ENUM('text','image','video','mixed') NOT NULL DEFAULT 'text',
  `title` VARCHAR(200) NULL,
  `content` TEXT NULL,
  `media_urls` JSON NULL,
  `channel` VARCHAR(50) NOT NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `comments_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','reported','banned') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `posts_user_id` (`user_id`),
  KEY `posts_channel` (`channel`),
  CONSTRAINT `posts_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `likes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `likes_user_post_unique` (`user_id`, `post_id`),
  KEY `likes_post_id` (`post_id`),
  CONSTRAINT `likes_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `likes_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `parent_id` INT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `comments_post_id` (`post_id`),
  KEY `comments_user_id` (`user_id`),
  KEY `comments_parent_id` (`parent_id`),
  CONSTRAINT `comments_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `reporter_id` INT NOT NULL,
  `reason` ENUM('spam','harassment','copyright','other') NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('pending','resolved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reports_post_reporter_unique` (`post_id`, `reporter_id`),
  KEY `reports_reporter_id` (`reporter_id`),
  CONSTRAINT `reports_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reports_reporter_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user1_id` INT NOT NULL,
  `user2_id` INT NOT NULL,
  `last_message` TEXT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversations_users_unique` (`user1_id`, `user2_id`),
  CONSTRAINT `conv_u1_fk` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `conv_u2_fk` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `messages_conv_id` (`conversation_id`),
  KEY `messages_sender_id` (`sender_id`),
  CONSTRAINT `messages_conv_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_sender_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follows` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `follower_id` INT NOT NULL,
  `following_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `follows_pair_unique` (`follower_id`, `following_id`),
  KEY `follows_following_id` (`following_id`),
  CONSTRAINT `follows_follower_fk` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `follows_following_fk` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
