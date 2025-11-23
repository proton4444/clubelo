-- Fix rank column to allow NULL values
ALTER TABLE elo_ratings ALTER COLUMN rank DROP NOT NULL;
