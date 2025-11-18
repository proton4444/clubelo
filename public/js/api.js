/**
 * API client helper for ClubElo backend
 *
 * This module provides simple functions to call our backend API endpoints.
 * All functions return promises that resolve with the JSON response data.
 */

const API_BASE = window.location.origin;

/**
 * Fetch club rankings for a specific date
 *
 * @param {Object} params - Query parameters
 * @param {string} params.date - ISO date string (YYYY-MM-DD), optional
 * @param {string} params.country - Country code filter, optional
 * @param {number} params.limit - Maximum results, optional
 * @returns {Promise<Object>} Rankings data with date and clubs array
 */
async function fetchRankings({ date, country, limit } = {}) {
  const params = new URLSearchParams();

  if (date) params.append('date', date);
  if (country && country !== 'ALL') params.append('country', country);
  if (limit) params.append('limit', limit);

  const url = `${API_BASE}/api/elo/rankings?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch rankings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Elo history for a specific club
 *
 * @param {string|number} clubId - Club ID or API name
 * @param {Object} params - Query parameters
 * @param {string} params.from - Start date (YYYY-MM-DD), optional
 * @param {string} params.to - End date (YYYY-MM-DD), optional
 * @returns {Promise<Object>} Club data with history array
 */
async function fetchClubHistory(clubId, { from, to } = {}) {
  const params = new URLSearchParams();

  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const url = `${API_BASE}/api/elo/clubs/${clubId}/history?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch club history: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for clubs
 *
 * @param {Object} params - Query parameters
 * @param {string} params.q - Search query, optional
 * @param {string} params.country - Country filter, optional
 * @param {number} params.limit - Maximum results, optional
 * @returns {Promise<Object>} Object with clubs array
 */
async function searchClubs({ q, country, limit } = {}) {
  const params = new URLSearchParams();

  if (q) params.append('q', q);
  if (country) params.append('country', country);
  if (limit) params.append('limit', limit);

  const url = `${API_BASE}/api/elo/clubs?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to search clubs: ${response.statusText}`);
  }

  return response.json();
}
