-- Create users table for Supabase user synchronization
-- Enable the pgcrypto extension for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supabase_user_id ON users (supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_email ON users (email);