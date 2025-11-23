// Minimalist FootballRatings Dashboard

// State
let clubsData = [];
let performanceChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  initializeSearch();
});

// Load all data
async function loadAllData() {
  try {
    await Promise.all([
      loadEuroTop25(),
      loadCompetitionRanking(),
      loadFixtures()
    ]);

    renderPerformanceChart();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Load Euro Top 25
async function loadEuroTop25() {
  try {
    const response = await fetch('/api/elo/rankings?limit=25');
    const data = await response.json();
    clubsData = data.clubs || [];

    renderEuroTop25();
  } catch (error) {
    console.error('Error loading Euro Top 25:', error);
  }
}

// Render Euro Top 25
function renderEuroTop25() {
  const tbody = document.getElementById('euro-top-tbody');
  if (!tbody) return;

  tbody.innerHTML = clubsData.map((club, index) => `
    <tr class="border-t border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
      <td class="py-2.5 px-2">${index + 1}</td>
      <td class="py-2.5 px-2 flex items-center gap-2">
        <div class="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
          ${getClubInitials(club.displayName || club.apiName)}
        </div>
        <span>${club.displayName || club.apiName}</span>
      </td>
      <td class="py-2.5 px-2 text-right font-semibold">${Math.round(club.elo)}</td>
    </tr>
  `).join('');
}

// Get club initials
function getClubInitials(name) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return words[0][0] + words[1][0];
  }
  return name.substring(0, 2).toUpperCase();
}

// Load Competition Ranking (mock data for now)
async function loadCompetitionRanking() {
  const competitions = [
    { league: 'England - Premier', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 2038 },
    { league: 'Spain - La Liga', country: '🇪🇸', rating: 1997 },
    { league: 'Germany - Bundesliga', country: '🇩🇪', rating: 1979 },
    { league: 'France - Ligue 1', country: '🇫🇷', rating: 1978 },
    { league: 'Italy - Serie A', country: '🇮🇹', rating: 1968 },
    { league: 'Portugal - Primeira', country: '🇵🇹', rating: 1946 },
    { league: 'Netherlands - Eredivisie', country: '🇳🇱', rating: 1933 },
    { league: 'Belgium - Pro League', country: '🇧🇪', rating: 1890 },
  ];

  renderCompetitionRanking(competitions);
}

// Render Competition Ranking
function renderCompetitionRanking(competitions) {
  const tbody = document.getElementById('competition-tbody');
  if (!tbody) return;

  tbody.innerHTML = competitions.map(comp => `
    <tr class="border-t border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
      <td class="py-2.5 px-2">${comp.league}</td>
      <td class="py-2.5 px-2 text-center text-xl">${comp.country}</td>
      <td class="py-2.5 px-2 text-right font-semibold">${comp.rating}</td>
    </tr>
  `).join('');
}

// Load Fixtures
async function loadFixtures() {
  // Mock data - in production, fetch from /api/fixtures
  const fixtures = [
    {
      home: 'Man City',
      away: 'Liverpool',
      homeElo: 1997,
      awayElo: 1979,
      homeWin: '1.50',
      draw: '4.20',
      awayWin: '2.20'
    },
    {
      home: 'Arsenal',
      away: 'Chelsea',
      homeElo: 2038,
      awayElo: 1907,
      homeWin: '1.35',
      draw: '4.80',
      awayWin: '2.85'
    },
    {
      home: 'Real Madrid',
      away: 'Barcelona',
      homeElo: 1946,
      awayElo: 1933,
      homeWin: '1.95',
      draw: '3.40',
      awayWin: '1.98'
    }
  ];

  renderFixtures(fixtures);
}

// Render Fixtures
function renderFixtures(fixtures) {
  const tbody = document.getElementById('fixtures-tbody');
  if (!tbody) return;

  tbody.innerHTML = fixtures.map(fixture => `
    <tr class="border-t border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
      <td class="py-3 px-3 text-left font-medium">${fixture.home}</td>
      <td class="py-3 px-3 text-left font-medium">${fixture.away}</td>
      <td class="py-3 px-3 font-semibold">${fixture.homeElo}</td>
      <td class="py-3 px-3 font-semibold">${fixture.awayElo}</td>
      <td class="py-3 px-3 font-semibold text-primary">${fixture.homeWin}</td>
      <td class="py-3 px-3 font-semibold text-primary">${fixture.draw}</td>
      <td class="py-3 px-3 font-semibold text-primary">${fixture.awayWin}</td>
    </tr>
  `).join('');
}

// Render Performance Chart
function renderPerformanceChart() {
  const canvas = document.getElementById('performance-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart
  if (performanceChart) {
    performanceChart.destroy();
  }

  // Generate mock historical data
  const labels = [];
  const datasets = [];
  const clubs = ['Man City', 'Real Madrid', 'Arsenal', 'Bayer Leverkusen'];
  const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b'];
  const baseElos = [2010, 1950, 1980, 1930];

  // Generate 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }

  clubs.forEach((club, index) => {
    const data = [];
    let value = baseElos[index];

    for (let i = 0; i < 12; i++) {
      value += (Math.random() - 0.5) * 40;
      value = Math.max(1500, Math.min(2100, value));
      data.push(Math.round(value));
    }

    datasets.push({
      label: club,
      data: data,
      borderColor: colors[index],
      backgroundColor: colors[index] + '20',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: colors[index],
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    });
  });

  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#615448',
            padding: 15,
            font: {
              size: 11,
              family: 'Inter'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: '#c8c0b4',
          titleColor: '#615448',
          bodyColor: '#615448',
          borderColor: '#b9b0a3',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#8d7b68',
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: '#b9b0a3',
            drawBorder: false
          },
          ticks: {
            color: '#8d7b68',
            font: {
              size: 11
            }
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

// Initialize search
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterClubs(query);
  });
}

// Filter clubs
function filterClubs(query) {
  const tbody = document.getElementById('euro-top-tbody');
  if (!tbody) return;

  const filtered = clubsData.filter(club =>
    (club.displayName || club.apiName).toLowerCase().includes(query)
  );

  tbody.innerHTML = filtered.map((club, index) => `
    <tr class="border-t border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
      <td class="py-2.5 px-2">${club.rank || index + 1}</td>
      <td class="py-2.5 px-2 flex items-center gap-2">
        <div class="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
          ${getClubInitials(club.displayName || club.apiName)}
        </div>
        <span>${club.displayName || club.apiName}</span>
      </td>
      <td class="py-2.5 px-2 text-right font-semibold">${Math.round(club.elo)}</td>
    </tr>
  `).join('');
}

// Export for potential reuse
window.FootballRatings = {
  loadAllData,
  filterClubs
};
