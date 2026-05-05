-- 若早期库表没有 avatar 字段，在 MySQL 中执行一次（已有该列时会报错，可忽略）。
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL DEFAULT NULL COMMENT '头像路径，如 /uploads/xxx.webp';
