/**
 * Club detail page logic
 *
 * This script handles:
 * - Loading club data from the API
 * - Displaying club information
 * - Rendering an Elo history chart using Chart.js
 */

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const clubHeader = document.getElementById('club-header');
const chartSection = document.getElementById('chart-section');
const clubNameEl = document.getElementById('club-name');
const clubCountryEl = document.getElementById('club-country');
const clubLevelEl = document.getElementById('club-level');

// Chart instance (Chart.js)
let eloChart = null;

/**
 * Initialize the page
 * Gets club ID from URL query parameter and loads data
 */
function init() {
  // Get club ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');

  if (!clubId) {
    showError('No club ID provided in URL');
    return;
  }

  // Load club data
  loadClubData(clubId);
}

/**
 * Load club data and history from the API
 *
 * @param {string|number} clubId - Club ID or API name
 */
async function loadClubData(clubId) {
  try {
    // Show loading state
    showLoading(true);
    hideError();

    // Fetch club history from API
    const data = await fetchClubHistory(clubId);

    // Display club information
    displayClubInfo(data.club);

    // Render the Elo history chart
    renderChart(data.history);

    // Show the content
    clubHeader.style.display = 'block';
    chartSection.style.display = 'block';

  } catch (error) {
    console.error('Error loading club data:', error);
    showError(`Failed to load club data: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Display club basic information
 *
 * @param {Object} club - Club object from API
 */
function displayClubInfo(club) {
  clubNameEl.textContent = club.displayName;
  clubCountryEl.textContent = `Country: ${club.country}`;
  clubLevelEl.textContent = `League Level: ${club.level}`;

  // Update page title
  document.title = `${club.displayName} - ClubElo`;
}

/**
 * Render the Elo history chart using Chart.js
 *
 * @param {Array} history - Array of {date, elo, rank} objects
 */
function renderChart(history) {
  if (!history || history.length === 0) {
    chartSection.innerHTML = '<p style="text-align: center; color: #888;">No historical data available</p>';
    return;
  }

  // Extract dates and Elo values for the chart
  const dates = history.map(entry => entry.date);
  const eloValues = history.map(entry => entry.elo);

  // Get the canvas element
  const canvas = document.getElementById('elo-chart');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (eloChart) {
    eloChart.destroy();
  }

  // Create the chart using Chart.js
  eloChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Elo Rating',
        data: eloValues,
        borderColor: '#4a9eff',
        backgroundColor: 'rgba(74, 158, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1, // Slight curve to the line
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide legend since we only have one dataset
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#4a9eff',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return `Date: ${context[0].label}`;
            },
            label: function(context) {
              return `Elo: ${context.parsed.y.toFixed(1)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#333',
          },
          ticks: {
            color: '#888',
            maxRotation: 45,
            minRotation: 0,
          }
        },
        y: {
          grid: {
            color: '#333',
          },
          ticks: {
            color: '#888',
            callback: function(value) {
              return value.toFixed(0); // Show whole numbers on Y axis
            }
          },
          // Set min/max to give some padding around the data
          suggestedMin: Math.min(...eloValues) - 50,
          suggestedMax: Math.max(...eloValues) + 50,
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      }
    }
  });
}

/**
 * Show or hide the loading indicator
 */
function showLoading(show) {
  loadingEl.style.display = show ? 'block' : 'none';
  clubHeader.style.display = show ? 'none' : clubHeader.style.display;
  chartSection.style.display = show ? 'none' : chartSection.style.display;
}

/**
 * Show an error message
 */
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  clubHeader.style.display = 'none';
  chartSection.style.display = 'none';
}

/**
 * Hide the error message
 */
function hideError() {
  errorEl.style.display = 'none';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
