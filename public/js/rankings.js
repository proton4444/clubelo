/**
 * Rankings page logic
 *
 * This script handles:
 * - Loading and displaying club rankings
 * - Filter controls (date, country, limit)
 * - Clicking a club row to navigate to its detail page
 */

// DOM elements
const dateInput = document.getElementById('date-input');
const countrySelect = document.getElementById('country-select');
const limitSelect = document.getElementById('limit-select');
const applyButton = document.getElementById('apply-filters');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const tableContainer = document.getElementById('table-container');
const rankingsBody = document.getElementById('rankings-body');
const dateInfo = document.getElementById('date-info');

// Current state
let currentData = null;

/**
 * Initialize the page
 * Sets default date to today and loads initial rankings
 */
function init() {
  // Set date input to today by default
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Load initial rankings
  loadRankings();

  // Set up event listeners
  applyButton.addEventListener('click', loadRankings);

  // Allow pressing Enter in inputs to apply filters
  dateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadRankings();
  });
}

/**
 * Load rankings from the API based on current filter values
 */
async function loadRankings() {
  try {
    // Show loading state
    showLoading(true);
    hideError();

    // Get filter values
    const date = dateInput.value || undefined;
    const country = countrySelect.value;
    const limit = parseInt(limitSelect.value, 10);

    // Fetch rankings from API
    const data = await fetchRankings({ date, country, limit });
    currentData = data;

    // Display the rankings
    displayRankings(data);

    // Update date info
    dateInfo.textContent = `Showing rankings for ${data.date} ${
      data.country ? `(${data.country} only)` : '(all countries)'
    }`;

  } catch (error) {
    console.error('Error loading rankings:', error);
    showError(`Failed to load rankings: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Display rankings in the table
 *
 * @param {Object} data - Response from fetchRankings()
 */
function displayRankings(data) {
  // Clear existing rows
  rankingsBody.innerHTML = '';

  if (!data.clubs || data.clubs.length === 0) {
    rankingsBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #888;">
          No clubs found for the selected filters
        </td>
      </tr>
    `;
    return;
  }

  // Create a row for each club
  data.clubs.forEach((club) => {
    const row = document.createElement('tr');

    // Make row clickable - navigate to club detail page
    row.addEventListener('click', () => {
      window.location.href = `/club.html?id=${club.id}`;
    });

    row.innerHTML = `
      <td class="rank">${club.rank}</td>
      <td>${club.displayName}</td>
      <td class="country">${club.country}</td>
      <td class="level">${club.level}</td>
      <td class="elo">${club.elo.toFixed(1)}</td>
    `;

    rankingsBody.appendChild(row);
  });
}

/**
 * Show or hide the loading indicator
 */
function showLoading(show) {
  loadingEl.style.display = show ? 'block' : 'none';
  tableContainer.style.display = show ? 'none' : 'block';
}

/**
 * Show an error message
 */
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  tableContainer.style.display = 'none';
}

/**
 * Hide the error message
 */
function hideError() {
  errorEl.style.display = 'none';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
