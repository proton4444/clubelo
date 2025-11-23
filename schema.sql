-- ClubElo Database Schema
-- Create tables for storing club Elo ratings

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Elo ratings table
CREATE TABLE IF NOT EXISTS elo_ratings (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL,
    date DATE NOT NULL,
    rank INTEGER NOT NULL,
    country VARCHAR(10) NOT NULL,
    level INTEGER NOT NULL,
    elo DOUBLE PRECISION NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'clubelo',
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    UNIQUE (club_id, date)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_elo_ratings_date ON elo_ratings(date);
CREATE INDEX IF NOT EXISTS idx_elo_ratings_country ON elo_ratings(country);

-- Display success message
SELECT 'Database schema created successfully!' AS status;
