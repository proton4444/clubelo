-- Sample test data for ClubElo database
-- This simulates data that would normally come from the ClubElo API

-- Insert some sample clubs
INSERT INTO clubs (api_name, display_name, country, level, created_at, updated_at) VALUES
('ManCity', 'Manchester City', 'ENG', 1, NOW(), NOW()),
('Liverpool', 'Liverpool', 'ENG', 1, NOW(), NOW()),
('Arsenal', 'Arsenal', 'ENG', 1, NOW(), NOW()),
('RealMadrid', 'Real Madrid', 'ESP', 1, NOW(), NOW()),
('Barcelona', 'Barcelona', 'ESP', 1, NOW(), NOW()),
('BayernMunich', 'Bayern Munich', 'GER', 1, NOW(), NOW()),
('PSG', 'Paris Saint-Germain', 'FRA', 1, NOW(), NOW()),
('Chelsea', 'Chelsea', 'ENG', 1, NOW(), NOW()),
('ManUtd', 'Manchester United', 'ENG', 1, NOW(), NOW()),
('Juventus', 'Juventus', 'ITA', 1, NOW(), NOW())
ON CONFLICT (api_name) DO NOTHING;

-- Insert sample Elo ratings for 2025-11-17
INSERT INTO elo_ratings (club_id, date, rank, country, level, elo) VALUES
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-11-17', 1, 'ENG', 1, 1997.5),
((SELECT id FROM clubs WHERE api_name = 'RealMadrid'), '2025-11-17', 2, 'ESP', 1, 1985.3),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-17', 3, 'ENG', 1, 1972.1),
((SELECT id FROM clubs WHERE api_name = 'BayernMunich'), '2025-11-17', 4, 'GER', 1, 1968.7),
((SELECT id FROM clubs WHERE api_name = 'Barcelona'), '2025-11-17', 5, 'ESP', 1, 1955.2),
((SELECT id FROM clubs WHERE api_name = 'PSG'), '2025-11-17', 6, 'FRA', 1, 1945.8),
((SELECT id FROM clubs WHERE api_name = 'Arsenal'), '2025-11-17', 7, 'ENG', 1, 1938.4),
((SELECT id FROM clubs WHERE api_name = 'Chelsea'), '2025-11-17', 8, 'ENG', 1, 1922.6),
((SELECT id FROM clubs WHERE api_name = 'ManUtd'), '2025-11-17', 9, 'ENG', 1, 1915.3),
((SELECT id FROM clubs WHERE api_name = 'Juventus'), '2025-11-17', 10, 'ITA', 1, 1908.1)
ON CONFLICT (club_id, date) DO NOTHING;

-- Insert some historical data for Manchester City (last 30 days)
INSERT INTO elo_ratings (club_id, date, rank, country, level, elo) VALUES
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-10-18', 1, 'ENG', 1, 1985.2),
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-10-25', 1, 'ENG', 1, 1988.7),
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-11-01', 1, 'ENG', 1, 1992.1),
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-11-08', 1, 'ENG', 1, 1995.3),
((SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-11-15', 1, 'ENG', 1, 1996.8)
ON CONFLICT (club_id, date) DO NOTHING;

-- Insert some historical data for Liverpool
INSERT INTO elo_ratings (club_id, date, rank, country, level, elo) VALUES
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-10-18', 3, 'ENG', 1, 1955.4),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-10-25', 3, 'ENG', 1, 1960.2),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-01', 3, 'ENG', 1, 1965.5),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-08', 3, 'ENG', 1, 1968.9),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-15', 3, 'ENG', 1, 1970.7)
ON CONFLICT (club_id, date) DO NOTHING;

SELECT 'Sample test data inserted successfully!' AS status;
SELECT COUNT(*) AS club_count FROM clubs;
SELECT COUNT(*) AS rating_count FROM elo_ratings;
