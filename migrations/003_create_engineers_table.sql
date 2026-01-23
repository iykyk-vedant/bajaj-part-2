-- Create engineers table for storing engineer names
CREATE TABLE IF NOT EXISTS engineers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_engineer_name ON engineers (name);

-- Insert some initial engineer names (optional)
-- INSERT INTO engineers (name) VALUES 
-- ('John Smith'),
-- ('Jane Doe'),
-- ('Mike Johnson'),
-- ('Sarah Wilson'),
-- ('David Brown');