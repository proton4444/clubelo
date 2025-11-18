/**
 * Unit tests for import logic
 *
 * Tests data validation, parsing, and database operations
 */

import { importDailySnapshot, importClubHistory } from '../importer';
import { db } from '../db';
import type { ClubEloRow } from '../clubelo-api';

// Mock the database module
jest.mock('../db', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('Import Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('importDailySnapshot', () => {
    it('should import valid club ratings', async () => {
      const mockRows: ClubEloRow[] = [
        {
          Rank: '1',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: '2050.5',
          From: '1894-01-01',
          To: '2099-06-06',
        },
        {
          Rank: '2',
          Club: 'Liverpool',
          Country: 'ENG',
          Level: '1',
          Elo: '2010.3',
          From: '1892-01-01',
          To: '2099-06-06',
        },
      ];

      // Mock database responses
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // First club upsert
        .mockResolvedValueOnce({ rows: [] }) // First rating upsert
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Second club upsert
        .mockResolvedValueOnce({ rows: [] }); // Second rating upsert

      const snapshotDate = new Date('2025-11-18');
      await importDailySnapshot(mockRows, snapshotDate);

      // Verify database calls
      expect(db.query).toHaveBeenCalledTimes(4);

      // Verify club upsert calls include correct data
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clubs'),
        expect.arrayContaining(['ManCity', 'ManCity', 'ENG', 1])
      );

      // Verify rating upsert calls include correct data
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO elo_ratings'),
        expect.arrayContaining([1, snapshotDate, 1, 'ENG', 1, 2050.5, 'clubelo'])
      );
    });

    it('should skip rows with invalid Elo values', async () => {
      const mockRows: ClubEloRow[] = [
        {
          Rank: '1',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: 'invalid', // Invalid Elo value
          From: '1894-01-01',
          To: '2099-06-06',
        },
      ];

      const snapshotDate = new Date('2025-11-18');
      await importDailySnapshot(mockRows, snapshotDate);

      // Should not make any database calls for invalid data
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockRows: ClubEloRow[] = [
        {
          Rank: '1',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: '2050.5',
          From: '1894-01-01',
          To: '2099-06-06',
        },
      ];

      // Mock database error
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

      const snapshotDate = new Date('2025-11-18');

      // Should not throw - errors are caught and logged
      await expect(importDailySnapshot(mockRows, snapshotDate)).resolves.not.toThrow();
    });
  });

  describe('importClubHistory', () => {
    it('should import multiple historical ratings for a club', async () => {
      const mockRows: ClubEloRow[] = [
        {
          Rank: '5',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: '1950.0',
          From: '2025-11-01',
          To: '2025-11-01',
        },
        {
          Rank: '3',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: '2000.0',
          From: '2025-11-15',
          To: '2025-11-15',
        },
      ];

      // Mock database responses for club and rating upserts
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

      await importClubHistory(mockRows, 'ManCity');

      // Should process both historical records
      // Each record: 1 club upsert + 1 rating upsert = 2 calls per record
      expect(db.query).toHaveBeenCalledTimes(4);
    });

    it('should parse dates from From field correctly', async () => {
      const mockRows: ClubEloRow[] = [
        {
          Rank: '1',
          Club: 'ManCity',
          Country: 'ENG',
          Level: '1',
          Elo: '2050.5',
          From: '2025-11-18',
          To: '2025-11-18',
        },
      ];

      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

      await importClubHistory(mockRows, 'ManCity');

      // Verify the date was parsed correctly (as Date object)
      const ratingUpsertCall = (db.query as jest.Mock).mock.calls.find(
        call => call[0].includes('INSERT INTO elo_ratings')
      );

      expect(ratingUpsertCall).toBeDefined();
      expect(ratingUpsertCall[1][1]).toBeInstanceOf(Date);
      expect(ratingUpsertCall[1][1].toISOString()).toContain('2025-11-18');
    });
  });
});
