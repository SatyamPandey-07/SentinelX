-- Flyway Migration V1: Initial Auth Schema

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(32) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    phone VARCHAR(32),
    role_id VARCHAR(32) REFERENCES roles(id),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_account_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Seed Initial Roles
INSERT INTO roles (id, name, description) VALUES
('ROLE_USER', 'USER', 'Standard campus community reporter'),
('ROLE_RESPONDER', 'RESPONDER', 'Emergency first responder'),
('ROLE_SUPERVISOR', 'SUPERVISOR', 'Emergency operations shift supervisor'),
('ROLE_ADMIN', 'ADMIN', 'System and campus safety administrator'),
('ROLE_SYSTEM', 'SYSTEM', 'Internal microservice automated principal')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Admin User: username 'admin', password 'Admin@12345' (BCrypt hashed)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, role_id, is_enabled, is_account_locked)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'admin@sentinelx.local',
    '$2a$12$e8Yy82v/4oHwLgJ4q79lbe023t3n8O10eKj05E1k6xZJk5Cg0mK3m',
    'System',
    'Administrator',
    '+10000000000',
    'ROLE_ADMIN',
    TRUE,
    FALSE
)
ON CONFLICT (username) DO NOTHING;
