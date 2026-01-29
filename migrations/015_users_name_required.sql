-- Migration: Make user name required
-- Set default name for existing users with NULL name, then make column NOT NULL

UPDATE users SET name = 'Unnamed User' WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;