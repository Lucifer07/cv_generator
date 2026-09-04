-- 0001_init: users, ai_credentials, resumes for cv_generator
-- MySQL 8.0+ required (uses CHECK constraints and JSON column)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TABLE IF NOT EXISTS ai_credentials (
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  endpoint_url VARCHAR(2048) NOT NULL,
  api_token_cipher MEDIUMTEXT NOT NULL,
  api_token_nonce VARCHAR(64) NOT NULL,
  model VARCHAR(255) NULL,
  last_verified_at VARCHAR(40) NULL,
  updated_at VARCHAR(40) NOT NULL,
  CONSTRAINT ai_credentials_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS resumes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  UNIQUE KEY resumes_user_title_unique (user_id, title),
  CONSTRAINT resumes_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
