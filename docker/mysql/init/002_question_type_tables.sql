-- Add per-question-type tables (classic naming)
-- NOTE: MySQL official image only executes init scripts on first-time volume init.
-- If you already have mysql_data volume, apply this manually or recreate the volume.

USE wph;

-- Choice questions (single / multiple)
CREATE TABLE IF NOT EXISTS question_choice (
  question_id VARCHAR(36) NOT NULL,
  mode VARCHAR(32) NOT NULL, -- single_choice / multiple_choice
  options_json JSON NULL,
  correct_options_json JSON NULL,
  explanation LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB;

-- True/False questions
CREATE TABLE IF NOT EXISTS question_true_false (
  question_id VARCHAR(36) NOT NULL,
  correct TINYINT(1) NULL,
  explanation LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB;

-- Fill-in-the-blank questions
CREATE TABLE IF NOT EXISTS question_fill_blank (
  question_id VARCHAR(36) NOT NULL,
  answers_json JSON NULL,
  explanation LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB;

-- Programming / Function design questions
CREATE TABLE IF NOT EXISTS question_programming (
  question_id VARCHAR(36) NOT NULL,
  subtype VARCHAR(32) NOT NULL, -- programming / function
  language VARCHAR(32) NULL,
  starter_code LONGTEXT NULL,
  reference_answer LONGTEXT NULL,
  explanation LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB;

-- Helpful indexes on base table for classic type names (idempotent)
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'questions'
    AND index_name = 'idx_questions_type'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_questions_type ON questions(type)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
