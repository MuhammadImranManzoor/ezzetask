-- Ezzetask MySQL schema (import via cPanel phpMyAdmin)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS members (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color_index INT NOT NULL DEFAULT 0,
  team ENUM('frontend', 'backend', 'other') NOT NULL DEFAULT 'other',
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') NOT NULL,
  member_id CHAR(36) NULL,
  created_at BIGINT NOT NULL,
  CONSTRAINT fk_users_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color_index INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  task_description TEXT NOT NULL,
  status ENUM('todo', 'inProgress', 'done') NOT NULL,
  assignee_id CHAR(36) NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  completed_at BIGINT NULL,
  deadline BIGINT NULL,
  notification_enabled TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_completed ON tasks(completed_at);

CREATE TABLE IF NOT EXISTS task_attachments (
  id CHAR(36) PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  data LONGBLOB NOT NULL,
  created_at BIGINT NOT NULL,
  CONSTRAINT fk_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attachments_task ON task_attachments(task_id);

SET FOREIGN_KEY_CHECKS = 1;
