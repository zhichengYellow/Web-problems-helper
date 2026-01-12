-- Initialize database/schema for local dev

CREATE DATABASE IF NOT EXISTS wph DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'wph'@'%' IDENTIFIED BY 'wph';
GRANT ALL PRIVILEGES ON wph.* TO 'wph'@'%';
FLUSH PRIVILEGES;

USE wph;

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(36) NOT NULL,
  external_id VARCHAR(255) NULL,
  platform VARCHAR(64) NULL,
  url VARCHAR(2048) NULL,
  type VARCHAR(64) NULL,
  question_text LONGTEXT NULL,
  answer LONGTEXT NULL,
  source VARCHAR(255) NULL,
  options_json JSON NULL,
  knowledge_points_json JSON NULL,
  tags_json JSON NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_questions_external_id (external_id),
  KEY idx_questions_updated_at (updated_at),
  KEY idx_questions_platform (platform)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wrong_stats (
  question_id VARCHAR(36) NOT NULL,
  wrong_count BIGINT NOT NULL,
  last_wrong_at VARCHAR(64) NULL,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB;
