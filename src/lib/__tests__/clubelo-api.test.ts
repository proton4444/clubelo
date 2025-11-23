/**
 * Unit tests for ClubElo API client
 *
 * Tests CSV parsing, data mapping, and API response handling
 */

import { fetchDailySnapshot, fetchClubHistory, fetchFixtures } from '../clubelo-api';

// Mock the fetch function to avoid actual HTTP calls during tests
global.fetch = jest.fn();

describe('ClubElo API Client', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('fetchDailySnapshot', () => {
    it('should parse CSV data correctly', async () => {
      // Mock successful CSV response
      const mockCsvData = `Rank,Club,Country,Level,Elo,From,To
1,ManCity,ENG,1,2050.5,1894-01-01,2099-06-06
2,Liverpool,ENG,1,2010.3,1892-01-01,2099-06-06`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData,
      });

      const result = await fetchDailySnapshot('2025-11-18');

      // Verify correct parsing
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        Rank: '1',
        Club: 'ManCity',
        Country: 'ENG',
        Level: '1',
        Elo: '2050.5',
        From: '1894-01-01',
        To: '2099-06-06',
      });
      expect(result[1].Club).toBe('Liverpool');
    });

    it('should handle empty CSV response', async () => {
      // Mock empty CSV (only headers)
      const mockCsvData = `Rank,Club,Country,Level,Elo,From,To`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData,
      });

      const result = await fetchDailySnapshot('2025-11-18');

      expect(result).toHaveLength(0);
    });

    it('should retry on network failure', async () => {
      // First call fails, second succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => `Rank,Club,Country,Level,Elo,From,To\n1,ManCity,ENG,1,2050.5,1894-01-01,2099-06-06`,
        });

      const result = await fetchDailySnapshot('2025-11-18');

      // Should succeed after retry
      expect(result).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchClubHistory', () => {
    it('should fetch club history with correct URL encoding', async () => {
      const mockCsvData = `Rank,Club,Country,Level,Elo,From,To
10,Man City,ENG,1,2000.0,2025-11-01,2025-11-01`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData,
      });

      const result = await fetchClubHistory('Man City');

      // Verify URL encoding (space should be encoded)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Man%20City'),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchFixtures', () => {
    it('should parse fixture CSV correctly', async () => {
      const mockCsvData = `Date,HomeTeam,AwayTeam,Country,Competition,HomeLevel,AwayLevel,HomeElo,AwayElo,HomeProbW,ProbD,AwayProbW
2025-11-23,ManCity,Liverpool,ENG,PremierLeague,1,1,2050.5,2010.3,0.55,0.25,0.20`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData,
      });

      const result = await fetchFixtures();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Date: '2025-11-23',
        HomeTeam: 'ManCity',
        AwayTeam: 'Liverpool',
        Country: 'ENG',
        Competition: 'PremierLeague',
        HomeLevel: '1',
        AwayLevel: '1',
        HomeElo: '2050.5',
        AwayElo: '2010.3',
        HomeProbW: '0.55',
        ProbD: '0.25',
        AwayProbW: '0.20',
      });
    });

    it('should use date parameter when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => `Date,HomeTeam,AwayTeam,Country,Competition,HomeLevel,AwayLevel,HomeElo,AwayElo,HomeProbW,ProbD,AwayProbW`,
      });

      await fetchFixtures('2025-11-25');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fixtures/2025-11-25'),
        expect.any(Object)
      );
    });
  });
});
