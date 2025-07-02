-- Social Media Monitor Database Schema
-- This file provides the SQL schema for reference
-- Actual tables are created via Sequelize models

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator', 'analyst')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    last_login DATETIME,
    preferences JSON NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platform connections table
CREATE TABLE IF NOT EXISTS platform_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram', 'reddit', 'telegram', 'discord')),
    platform_user_id TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at DATETIME,
    is_active BOOLEAN DEFAULT true,
    permissions JSON DEFAULT '[]',
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sync_at DATETIME,
    metadata JSON DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, platform)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    salary_type TEXT CHECK (salary_type IN ('hourly', 'annual', 'contract')),
    requirements JSON DEFAULT '[]',
    benefits JSON DEFAULT '[]',
    type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
    remote BOOLEAN DEFAULT false,
    posted_at DATETIME NOT NULL,
    expires_at DATETIME,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'applied', 'expired', 'closed', 'saved', 'hidden')),
    match_score REAL,
    ai_analysis JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, external_id)
);

-- Social content table
CREATE TABLE IF NOT EXISTS social_content (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram', 'reddit', 'telegram', 'discord')),
    external_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    author_display_name TEXT NOT NULL,
    author_avatar TEXT,
    content_text TEXT,
    content_images JSON DEFAULT '[]',
    content_videos JSON DEFAULT '[]',
    content_links JSON DEFAULT '[]',
    metrics_likes INTEGER DEFAULT 0,
    metrics_shares INTEGER DEFAULT 0,
    metrics_comments INTEGER DEFAULT 0,
    metrics_views INTEGER DEFAULT 0,
    metrics_engagement REAL DEFAULT 0,
    hashtags JSON DEFAULT '[]',
    mentions JSON DEFAULT '[]',
    posted_at DATETIME NOT NULL,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sentiment_score REAL,
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    sentiment_confidence REAL,
    moderation_flagged BOOLEAN DEFAULT false,
    moderation_flags JSON DEFAULT '[]',
    moderation_reviewed BOOLEAN DEFAULT false,
    moderation_approved BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, external_id)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('monitoring', 'engagement', 'content_curation', 'analytics')),
    platforms JSON NOT NULL DEFAULT '[]',
    targets JSON NOT NULL DEFAULT '[]',
    keywords JSON NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    budget_total REAL,
    budget_spent REAL DEFAULT 0,
    budget_currency TEXT DEFAULT 'USD',
    schedule_start_date DATETIME NOT NULL,
    schedule_end_date DATETIME,
    schedule_frequency TEXT CHECK (schedule_frequency IN ('once', 'daily', 'weekly', 'monthly')),
    metrics JSON DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSON DEFAULT '{}',
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    error TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    data JSON NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_is_active ON platform_connections(is_active);

CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score);

CREATE INDEX IF NOT EXISTS idx_social_content_platform ON social_content(platform);
CREATE INDEX IF NOT EXISTS idx_social_content_posted_at ON social_content(posted_at);
CREATE INDEX IF NOT EXISTS idx_social_content_moderation_flagged ON social_content(moderation_flagged);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON compliance_reports(generated_at);