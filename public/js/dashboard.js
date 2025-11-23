// Tactician's Dashboard JavaScript

// State management
let currentRegion = 'EUR';
let currentLimit = 25;
let rankingsData = [];
let overallTrendChart = null;

// Club logo mapping (using shields.io and team-logos)
const LOGO_SOURCES = {
  'Man City': 'https://cdn.simpleicons.org/mancity/skyblue',
  'Real Madrid': 'https://cdn.simpleicons.org/realmadrid/white',
  'Inter Milan': 'https://cdn.simpleicons.org/internazionale/blue',
  'Bayern Munich': 'https://cdn.simpleicons.org/bayernmunich/red',
  'Liverpool': 'https://cdn.simpleicons.org/liverpool/red',
  'Arsenal': 'https://cdn.simpleicons.org/arsenal/red',
  'Barcelona': 'https://cdn.simpleicons.org/fcbarcelona/darkred',
  'PSG': 'https://cdn.simpleicons.org/psg/navy',
  'AC Milan': 'https://cdn.simpleicons.org/acmilan/red',
  'Napoli': 'https://cdn.simpleicons.org/sscnapoli/skyblue',
  'Man Utd': 'https://cdn.simpleicons.org/manchesterunited/red',
  'Tottenham': 'https://cdn.simpleicons.org/tottenhamhotspur/navy',
  'Chelsea': 'https://cdn.simpleicons.org/chelsea/blue',
  'Dortmund': 'https://cdn.simpleicons.org/borussiadortmund/yellow',
  'Juventus': 'https://cdn.simpleicons.org/juventus/black',
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadRankings();
});

// Event listeners
function initializeEventListeners() {
  const menuBtn = document.getElementById('menu-btn');
  const searchBtn = document.getElementById('search-btn');
  const filterBtn = document.getElementById('filter-btn');
  const sortBtn = document.getElementById('sort-btn');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      console.log('Menu clicked');
      // Future: Open sidebar menu
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      console.log('Search clicked');
      // Future: Open search modal
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      console.log('Filter clicked');
      // Future: Open filter modal
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      console.log('Sort clicked');
      // Future: Open sort options
    });
  }
}

// Load rankings data
async function loadRankings() {
  showLoading(true);

  try {
    // Fetch from API
    const response = await fetch(`/api/elo/rankings?limit=${currentLimit}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    rankingsData = data.rankings || [];

    renderRankingsTable();
    await loadHistoricalData();
  } catch (error) {
    console.error('Error loading rankings:', error);
    showError('Failed to load rankings data');
  } finally {
    showLoading(false);
  }
}

// Render rankings table
function renderRankingsTable() {
  const tbody = document.getElementById('rankings-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  rankingsData.forEach((club, index) => {
    const rank = index + 1;
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="col-rank">${rank}</td>
      <td class="col-club">
        <div class="club-cell">
          <div class="club-logo">
            ${getClubLogo(club.display_name || club.club_name)}
          </div>
          <span class="club-name">${club.display_name || club.club_name}</span>
        </div>
      </td>
      <td class="col-elo">${Math.round(club.elo)}</td>
      <td class="col-trend">
        <canvas class="trend-sparkline" data-club="${club.club_name}"></canvas>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Draw sparklines after DOM update
  setTimeout(() => drawSparklines(), 100);
}

// Get club logo
function getClubLogo(clubName) {
  const logoUrl = LOGO_SOURCES[clubName];

  if (logoUrl) {
    return `<img src="${logoUrl}" alt="${clubName}" onerror="this.parentElement.innerHTML='${getInitials(clubName)}'">`;
  }

  return getInitials(clubName);
}

// Get club initials as fallback
function getInitials(clubName) {
  const words = clubName.split(' ');
  if (words.length >= 2) {
    return words[0][0] + words[1][0];
  }
  return clubName.substring(0, 2).toUpperCase();
}

// Draw sparkline charts
function drawSparklines() {
  const sparklines = document.querySelectorAll('.trend-sparkline');

  sparklines.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const clubName = canvas.dataset.club;

    // Generate mock trend data (in production, fetch from API)
    const trendData = generateMockTrendData();

    drawSparkline(ctx, canvas, trendData);
  });
}

// Generate mock trend data
function generateMockTrendData() {
  const points = 30;
  const data = [];
  let value = 1800 + Math.random() * 200;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 30;
    value = Math.max(1500, Math.min(2100, value));
    data.push(value);
  }

  return data;
}

// Draw individual sparkline
function drawSparkline(ctx, canvas, data) {
  const width = canvas.width = canvas.offsetWidth * 2;
  const height = canvas.height = canvas.offsetHeight * 2;

  ctx.scale(2, 2);

  const displayWidth = canvas.offsetWidth;
  const displayHeight = canvas.offsetHeight;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * displayWidth;
    const y = displayHeight - ((value - min) / range) * (displayHeight - 4) - 2;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

// Load historical data and draw overall trend chart
async function loadHistoricalData() {
  try {
    // In production, fetch real historical data
    // For now, generate mock data
    const monthlyData = generateMonthlyTrendData();

    renderOverallTrendChart(monthlyData);
  } catch (error) {
    console.error('Error loading historical data:', error);
  }
}

// Generate monthly trend data
function generateMonthlyTrendData() {
  const months = 90; // 3 months of daily data
  const data = [];
  let value = 1750;

  for (let i = 0; i < months; i++) {
    value += (Math.random() - 0.5) * 20;
    value = Math.max(1600, Math.min(1900, value));
    data.push(value);
  }

  return data;
}

// Render overall trend chart
function renderOverallTrendChart(data) {
  const canvas = document.getElementById('overall-trend-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if any
  if (overallTrendChart) {
    overallTrendChart.destroy();
  }

  // Create labels for 3 months
  const labels = data.map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (data.length - index));
    return date;
  });

  overallTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        borderColor: '#00ff88',
        borderWidth: 2.5,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#00ff88',
        pointHoverBorderColor: '#000000',
        pointHoverBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: '#1f1f1f',
          titleColor: '#ffffff',
          bodyColor: '#a0a0a0',
          borderColor: '#333333',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const date = context[0].parsed.x;
              return new Date(labels[date]).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            },
            label: function(context) {
              return `Avg Elo: ${Math.round(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            display: true,
            maxTicksLimit: 3,
            color: '#666666',
            font: {
              size: 11
            },
            callback: function(value, index, ticks) {
              const date = labels[value];
              if (!date) return '';

              // Show month names at roughly equal intervals
              const totalTicks = ticks.length;
              if (index === 0 || index === Math.floor(totalTicks / 2) || index === totalTicks - 1) {
                return date.toLocaleDateString('en-US', { month: 'short' });
              }
              return '';
            }
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
}

// Show/hide loading overlay
function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// Show error message
function showError(message) {
  console.error(message);
  const tbody = document.getElementById('rankings-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          ${message}
        </td>
      </tr>
    `;
  }
}

// Export functions for potential reuse
window.ClubEloDashboard = {
  loadRankings,
  setRegion: (region) => {
    currentRegion = region;
    loadRankings();
  },
  setLimit: (limit) => {
    currentLimit = limit;
    loadRankings();
  }
};
