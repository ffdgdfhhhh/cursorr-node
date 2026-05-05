-- 关注功能：若还没有 follows 表，在「与 server/.env 里 DB_NAME 相同」的数据库中执行本脚本。
-- 命令行示例：mysql -u root -p 库名 < add-follows-table.sql
-- 或在图形客户端中先 USE `你的库名`; 再执行下面 CREATE TABLE。

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
