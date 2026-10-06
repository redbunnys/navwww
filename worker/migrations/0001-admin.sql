-- 已有数据库升级用：新增 users.role 与 app_config 表
-- 全新部署直接执行 worker/schema.sql 即可，不需要跑这个文件
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_config (key, value) VALUES ('allow_register', '1');

-- 最早注册的账号提升为管理员（没有管理员时）
UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
