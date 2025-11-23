-- Performance Optimization: Additional Database Indexes
-- These indexes improve query performance for common access patterns

-- Additional indexes for elo_ratings table
-- These optimize queries that filter/sort by elo value or combine filters

-- Index for queries filtering by Elo rating (e.g., minElo filter)
-- Supports: WHERE elo >= X ORDER BY elo DESC
CREATE INDEX IF NOT EXISTS idx_elo_ratings_elo ON elo_ratings(elo DESC);

-- Composite index for country + date queries
-- Supports: WHERE country = X AND date = Y
CREATE INDEX IF NOT EXISTS idx_elo_ratings_country_date ON elo_ratings(country, date);

-- Composite index for level filtering
-- Supports: WHERE level = X AND date = Y ORDER BY elo DESC
CREATE INDEX IF NOT EXISTS idx_elo_ratings_level_date_elo ON elo_ratings(level, date, elo DESC);

-- Index explanation:
-- - idx_elo_ratings_elo: Fast lookups for minElo filter and Elo-based sorting
-- - idx_elo_ratings_country_date: Optimizes country+date combinations (common query pattern)
-- - idx_elo_ratings_level_date_elo: Optimizes level filtering with date and Elo sorting

SELECT 'Performance indexes added successfully!' AS status;

-- Show all indexes on elo_ratings
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'elo_ratings'
ORDER BY indexname;
