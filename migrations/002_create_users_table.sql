-- Create users table for Supabase user synchronization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_supabase_user_id (supabase_user_id),
    INDEX idx_email (email)
);

-- Enable the pgcrypto extension for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;