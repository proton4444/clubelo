// Country Page JavaScript

let countryData = [];
let countryCode = new URLSearchParams(window.location.search).get('country') || 'ENG';
let distributionChart = null;

// Club logos mapping
const clubLogos = {
  'Real Madrid': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc9WXzLewsJaqwOerG1BCn-OVzwnWeUjwuulmMzC60y8UTJTqxgeDD-5cnFUmIH2xUV40S4cH-ZUYPLEYCVT5xFIDpZmADZUhlO7kKZYUrYRgqRYk65Qf02yp2KGSVKa5-3HfCQOtZFtLMQg9-_-nyQ2u4mLqMlhaxKHNGA5bUOh4tYgsgf8Fp6FsSPsirA3nGs4lBo0NoLMAE8m3KFpYxzf-pv8vcSNH9X27yFsq8gocmdolMoQEJtLORaWlfgtpHIZVdTF4tbwuu',
  'Liverpool': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0kasuC4BzSLTTk_rP6Cwm8espTMwdXL69k0K0u9DI-IjmF5fb4fdD57pRcclLqizOxBQUrU6ZtD3mha8IfSHkEVVbKcS2gSwYHXGN7Gmi-6OtRFSTA5IZF_e25hy5wXOEi8Au-qtJHb_FbPnU7ZFjvxoL1fVhn7AMTwie1a1rGsGARFuHbgVEFkfg1rVZKljvLlq_suQWQKboUtfQrRZ9hv6oV72DMiOFqNjoWaUoBJ6zaCh3u3NUVuEm5foh1j966SuBr1foc2F',
  'Arsenal': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiMfZT4Lr84KN4dCLUqsvZedeF-oYenU7mWen0Jl5LkZmC5uWnGHp4FCxaBpr9DxuF6CkFieUorF0aeDkf-Z9RQv7Ozd8AjXZMSuYgvCJcB5-2P3pGDHoN00Tm32Vb_worr2TDL7fyb-Wl5bjz4BTjhCixwO__dJGXcL3sg87lrTWkg2naTJrQRy68wD_RKJPq3zmxs3GD0DyK6NZ1XLjTUAO-IBJ61CV1iyleN0HjPMAbQc39-Dvor8HlbTsSRQCHLwlB25G_2ciJ',
  'Man City': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc9WXzLewsJaqwOerG1BCn-OVzwnWeUjwuulmMzC60y8UTJTqxgeDD-5cnFUmIH2xUV40S4cH-ZUYPLEYCVT5xFIDpZmADZUhlO7kKZYUrYRgqRYk65Qf02yp2KGSVKa5-3HfCQOtZFtLMQg9-_-nyQ2u4mLqMlhaxKHNGA5bUOh4tYgsgf8Fp6FsSPsirA3nGs4lBo0NoLMAE8m3KFpYxzf-pv8vcSNH9X27yFsq8gocmdolMoQEJtLORaWlfgtpHIZVdTF4tbwuu',
  'Chelsea': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiMfZT4Lr84KN4dCLUqsvZedeF-oYenU7mWen0Jl5LkZmC5uWnGHp4FCxaBpr9DxuF6CkFieUorF0aeDkf-Z9RQv7Ozd8AjXZMSuYgvCJcB5-2P3pGDHoN00Tm32Vb_worr2TDL7fyb-Wl5bjz4BTjhCixwO__dJGXcL3sg87lrTWkg2naTJrQRy68wD_RKJPq3zmxs3GD0DyK6NZ1XLjTUAO-IBJ61CV1iyleN0HjPMAbQc39-Dvor8HlbTsSRQCHLwlB25G_2ciJ',
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  renderCountries();
  renderCountryData();
  renderDistributionChart();
});

// Load all data from API
async function loadAllData() {
  try {
    const response = await fetch(`/api/elo/rankings?limit=200&pageSize=200`);
    const data = await response.json();

    // Filter by country code
    countryData = (data.clubs || []).filter(club => club.country === countryCode);
    countryData.sort((a, b) => b.elo - a.elo);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Render countries sidebar
function renderCountries() {
  const list = document.getElementById('countries-list');
  const countryMap = {};

  // Group clubs by country and calculate averages
  fetch(`/api/elo/rankings?limit=200&pageSize=200`)
    .then(r => r.json())
    .then(data => {
      const clubs = data.clubs || [];

      clubs.forEach(club => {
        const country = club.country || 'Unknown';
        if (!countryMap[country]) {
          countryMap[country] = { elo: [], count: 0 };
        }
        countryMap[country].elo.push(club.elo);
        countryMap[country].count += 1;
      });

      const countries = Object.entries(countryMap)
        .map(([code, data]) => ({
          code: code,
          name: code, // You can add a country name mapping here
          avgElo: Math.round(data.elo.reduce((a, b) => a + b, 0) / data.elo.length),
          count: data.count,
          progress: Math.min((data.elo.reduce((a, b) => a + b, 0) / (data.count * 2000)) * 100, 100)
        }))
        .sort((a, b) => b.avgElo - a.avgElo);

      list.innerHTML = countries.map(country => `
        <div class="sidebar-item ${country.code === countryCode ? 'bg-purple-600 bg-opacity-30' : ''}" onclick="navigateToCountry('${country.code}')">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-4 h-4 bg-purple-600 rounded-full"></span>
              <span class="text-sm text-white">${country.name}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${country.progress}%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"></div>
            </div>
          </div>
          <span class="text-sm font-semibold text-white ml-2">${country.avgElo}</span>
        </div>
      `).join('');
    });
}

// Navigate to country page
function navigateToCountry(code) {
  window.location.href = `/country.html?country=${code}`;
}

// Render country data
function renderCountryData() {
  // Update title and stats
  document.getElementById('country-title').textContent = `${countryCode} Clubs`;
  document.getElementById('country-code').textContent = countryCode;
  document.getElementById('total-clubs').textContent = countryData.length;

  const avgElo = countryData.length > 0
    ? Math.round(countryData.reduce((sum, club) => sum + club.elo, 0) / countryData.length)
    : 0;
  document.getElementById('avg-elo').textContent = avgElo;

  const topElo = countryData.length > 0 ? Math.round(countryData[0].elo) : 0;
  document.getElementById('top-elo').textContent = topElo;

  // Render clubs list
  const list = document.getElementById('clubs-list');
  list.innerHTML = countryData.map((club, index) => `
    <div class="club-row">
      <div class="flex items-center gap-3 flex-1">
        <span class="text-gray-400 font-semibold w-8">${index + 1}</span>
        <img src="${clubLogos[club.displayName] || ''}" class="w-6 h-6 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
        <div class="flex-1">
          <div class="text-white font-medium">${club.displayName || club.apiName}</div>
          <div class="text-gray-500 text-xs">Level ${club.level}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-white font-bold text-lg">${Math.round(club.elo)}</div>
        <div class="text-gray-400 text-xs">Rank #${club.rank}</div>
      </div>
    </div>
  `).join('');
}

// Render distribution chart
function renderDistributionChart() {
  const ctx = document.getElementById('distribution-chart').getContext('2d');

  if (distributionChart) distributionChart.destroy();

  // Create histogram data (Elo ranges)
  const ranges = [];
  const counts = [];

  for (let i = 1400; i <= 2100; i += 100) {
    const count = countryData.filter(c => c.elo >= i && c.elo < i + 100).length;
    if (count > 0) {
      ranges.push(`${i}-${i + 100}`);
      counts.push(count);
    }
  }

  distributionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ranges,
      datasets: [
        {
          label: 'Number of Clubs',
          data: counts,
          backgroundColor: '#8b5cf6',
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#9ca3af' } }
      },
      scales: {
        x: {
          grid: { color: '#2a2d3a' },
          ticks: { color: '#6b7280' }
        },
        y: {
          grid: { color: '#2a2d3a' },
          ticks: { color: '#6b7280' },
          beginAtZero: true
        }
      }
    }
  });
}
