-- Sample test data for fixtures (upcoming matches)
-- This simulates match predictions that would come from the ClubElo API

-- Insert sample fixtures with predictions
INSERT INTO fixtures (
  home_club_id, away_club_id, match_date, country, competition,
  home_level, away_level, home_elo, away_elo,
  home_win_prob, draw_prob, away_win_prob,
  source
) VALUES
-- Premier League matches
((SELECT id FROM clubs WHERE api_name = 'ManCity'), (SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-23', 'ENG', 'Premier League', 1, 1, 1997.5, 1972.1, 0.45, 0.28, 0.27, 'clubelo'),
((SELECT id FROM clubs WHERE api_name = 'Arsenal'), (SELECT id FROM clubs WHERE api_name = 'Chelsea'), '2025-11-23', 'ENG', 'Premier League', 1, 1, 1938.4, 1922.6, 0.42, 0.30, 0.28, 'clubelo'),
((SELECT id FROM clubs WHERE api_name = 'ManUtd'), (SELECT id FROM clubs WHERE api_name = 'Liverpool'), '2025-11-24', 'ENG', 'Premier League', 1, 1, 1915.3, 1972.1, 0.32, 0.29, 0.39, 'clubelo'),

-- La Liga matches
((SELECT id FROM clubs WHERE api_name = 'RealMadrid'), (SELECT id FROM clubs WHERE api_name = 'Barcelona'), '2025-11-24', 'ESP', 'La Liga', 1, 1, 1985.3, 1955.2, 0.48, 0.27, 0.25, 'clubelo'),

-- Bundesliga match
((SELECT id FROM clubs WHERE api_name = 'BayernMunich'), (SELECT id FROM clubs WHERE api_name = 'ManCity'), '2025-11-25', 'GER', 'Bundesliga', 1, 1, 1968.7, 1997.5, 0.38, 0.28, 0.34, 'clubelo'),

-- Champions League matches (different dates)
((SELECT id FROM clubs WHERE api_name = 'ManCity'), (SELECT id FROM clubs WHERE api_name = 'RealMadrid'), '2025-11-26', 'EUR', 'Champions League', 1, 1, 1997.5, 1985.3, 0.46, 0.28, 0.26, 'clubelo'),
((SELECT id FROM clubs WHERE api_name = 'Liverpool'), (SELECT id FROM clubs WHERE api_name = 'Barcelona'), '2025-11-26', 'EUR', 'Champions League', 1, 1, 1972.1, 1955.2, 0.44, 0.29, 0.27, 'clubelo'),
((SELECT id FROM clubs WHERE api_name = 'BayernMunich'), (SELECT id FROM clubs WHERE api_name = 'PSG'), '2025-11-27', 'EUR', 'Champions League', 1, 1, 1968.7, 1945.8, 0.47, 0.28, 0.25, 'clubelo')

ON CONFLICT (home_club_id, away_club_id, match_date) DO NOTHING;

SELECT 'Sample fixtures data inserted successfully!' AS status;
SELECT COUNT(*) AS fixture_count FROM fixtures;
