-- Create marketplaces table
CREATE TABLE IF NOT EXISTS marketplaces (
  code VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_marketplaces_title ON marketplaces(title);
