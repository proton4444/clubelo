-- Fixtures table for upcoming/recent matches
-- Stores match predictions with Elo-based probabilities

CREATE TABLE IF NOT EXISTS fixtures (
    id SERIAL PRIMARY KEY,
    home_club_id INTEGER NOT NULL,
    away_club_id INTEGER NOT NULL,
    match_date DATE NOT NULL,
    country VARCHAR(10) NOT NULL,
    competition VARCHAR(255),
    home_level INTEGER NOT NULL,
    away_level INTEGER NOT NULL,
    home_elo DOUBLE PRECISION NOT NULL,
    away_elo DOUBLE PRECISION NOT NULL,
    home_win_prob DOUBLE PRECISION,
    draw_prob DOUBLE PRECISION,
    away_win_prob DOUBLE PRECISION,
    source VARCHAR(50) NOT NULL DEFAULT 'clubelo',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (home_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (away_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    UNIQUE (home_club_id, away_club_id, match_date)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_match_date ON fixtures(match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_club ON fixtures(home_club_id, match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_club ON fixtures(away_club_id, match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_country ON fixtures(country);
CREATE INDEX IF NOT EXISTS idx_fixtures_competition ON fixtures(competition);

-- Display success message
SELECT 'Fixtures table created successfully!' AS status;
