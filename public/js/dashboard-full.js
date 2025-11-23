// Full Dashboard JavaScript

let clubsData = [];
let recentChart = null;
let erasChart = null;

// Country data
const countries = [
  { name: 'Brazil', elo: 320, progress: 85 },
  { name: 'UK Chads', elo: 283, progress: 75 },
  { name: 'Germany', elo: 287, progress: 76 },
  { name: 'Germany', elo: 291, progress: 77 },
  { name: 'France', elo: 288, progress: 76 },
  { name: 'Spain', elo: 277, progress: 73 },
  { name: 'Russisa', elo: 283, progress: 75 },
  { name: 'Brazil', elo: 289, progress: 76 },
  { name: 'Italy', elo: 286, progress: 76 },
  { name: 'France', elo: 269, progress: 71 },
  { name: 'Sumwol', elo: 265, progress: 70 },
  { name: 'Germany', elo: 283, progress: 75 },
  { name: 'Bontars', elo: 266, progress: 70 },
  { name: 'Sonland', elo: 255, progress: 67 },
  { name: 'Spain', elo: 264, progress: 70 },
  { name: 'Mexico', elo: 263, progress: 69 },
  { name: 'Greece', elo: 263, progress: 69 },
  { name: 'Southerlands', elo: 262, progress: 69 },
  { name: 'Nevannia', elo: 261, progress: 69 },
  { name: 'Netherlands', elo: 259, progress: 68 },
  { name: 'France', elo: 209, progress: 55 },
  { name: 'Italy', elo: 207, progress: 55 },
  { name: 'Finland', elo: 208, progress: 55 },
  { name: 'Russisa', elo: 206, progress: 54 },
  { name: 'Mutrin', elo: 207, progress: 55 },
];

// Club logos
const clubLogos = {
  'Real Madrid': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc9WXzLewsJaqwOerG1BCn-OVzwnWeUjwuulmMzC60y8UTJTqxgeDD-5cnFUmIH2xUV40S4cH-ZUYPLEYCVT5xFIDpZmADZUhlO7kKZYUrYRgqRYk65Qf02yp2KGSVKa5-3HfCQOtZFtLMQg9-_-nyQ2u4mLqMlhaxKHNGA5bUOh4tYgsgf8Fp6FsSPsirA3nGs4lBo0NoLMAE8m3KFpYxzf-pv8vcSNH9X27yFsq8gocmdolMoQEJtLORaWlfgtpHIZVdTF4tbwuu',
  'Liverpool': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0kasuC4BzSLTTk_rP6Cwm8espTMwdXL69k0K0u9DI-IjmF5fb4fdD57pRcclLqizOxBQUrU6ZtD3mha8IfSHkEVVbKcS2gSwYHXGN7Gmi-6OtRFSTA5IZF_e25hy5wXOEi8Au-qtJHb_FbPnU7ZFjvxoL1fVhn7AMTwie1a1rGsGARFuHbgVEFkfg1rVZKljvLlq_suQWQKboUtfQrRZ9hv6oV72DMiOFqNjoWaUoBJ6zaCh3u3NUVuEm5foh1j966SuBr1foc2F',
  'Arsenal': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiMfZT4Lr84KN4dCLUqsvZedeF-oYenU7mWen0Jl5LkZmC5uWnGHp4FCxaBpr9DxuF6CkFieUorF0aeDkf-Z9RQv7Ozd8AjXZMSuYgvCJcB5-2P3pGDHoN00Tm32Vb_worr2TDL7fyb-Wl5bjz4BTjhCixwO__dJGXcL3sg87lrTWkg2naTJrQRy68wD_RKJPq3zmxs3GD0DyK6NZ1XLjTUAO-IBJ61CV1iyleN0HjPMAbQc39-Dvor8HlbTsSRQCHLwlB25G_2ciJ',
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderCountries();
  loadEuroTop25();
  renderTodayTable();
  renderYesterdayTable();
  renderCoachesTable();
  renderRecentChart();
  renderErasChart();
});

// Render countries sidebar
function renderCountries() {
  const list = document.getElementById('countries-list');
  list.innerHTML = countries.map(country => `
    <div class="sidebar-item">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="w-4 h-4 bg-purple-600 rounded-full"></span>
          <span class="text-sm text-white">${country.name}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${country.progress}%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"></div>
        </div>
      </div>
      <span class="text-sm font-semibold text-white ml-2">${country.elo}</span>
    </div>
  `).join('');
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
  const list = document.getElementById('euro-top-list');
  const colors = ['#4ade80', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  list.innerHTML = clubsData.map((club, index) => {
    const barWidth = (club.elo / 2100) * 100;
    const color = colors[index % colors.length];

    return `
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-400 w-6">${index + 1}</span>
        <img src="${clubLogos[club.displayName] || ''}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
        <span class="flex-1 text-white">${club.displayName || club.apiName}</span>
        <div class="w-24 h-6 bg-gray-700 rounded overflow-hidden">
          <div class="h-full" style="width: ${barWidth}%; background: ${color}"></div>
        </div>
        <span class="text-white font-semibold w-12 text-right">${Math.round(club.elo)}</span>
      </div>
    `;
  }).join('');
}

// Render Today table
function renderTodayTable() {
  const tbody = document.getElementById('today-tbody');
  const matches = [
    { rank: 1, club: 'Real Madrid', date: '19 Oct 21', rankNum: 76, elo: 1360, odds: ['1.29', '3.88', '1.11'] },
    { rank: 2, club: 'Liverpool', date: '13 Oct 21', rankNum: 35, elo: 1298, odds: ['3.88', '1.70', '1.70'] },
    { rank: 3, club: 'Arsenal', date: '21 Oct 21', rankNum: 38, elo: 1780, odds: ['1.40', '2.18', '2.18'] },
    { rank: 4, club: 'Vionsow', date: '18 Oct 21', rankNum: 60, elo: 1778, odds: ['1.87', '1.00', '1.00'] },
  ];

  tbody.innerHTML = matches.map(match => `
    <tr class="border-b border-gray-700">
      <td class="py-3 text-gray-400">${match.rank}</td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <img src="${clubLogos[match.club] || ''}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
          <span class="text-white">${match.club}</span>
        </div>
      </td>
      <td class="py-3 text-gray-400"><span class="material-symbols-outlined text-purple-400 text-sm">calendar_today</span> ${match.date}</td>
      <td class="py-3 text-white">${match.rankNum}</td>
      <td class="py-3 text-white font-semibold">${match.elo}</td>
      <td class="py-3">
        <div class="flex gap-1">
          ${match.odds.map(odd => `<span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">${odd}</span>`).join('')}
          <span class="text-gray-400 text-xs ml-1">vss</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-emerald-500 rounded text-xs text-white font-semibold">W</span>
          <span class="px-2 py-1 bg-red-500 rounded text-xs text-white font-semibold">L</span>
        </div>
      </td>
    </tr>
  `).join('');
}

// Render Yesterday table
function renderYesterdayTable() {
  const tbody = document.getElementById('yesterday-tbody');
  const matches = [
    { rank: 1, club: 'Mome', date: '13 Oct 21', rankNum: 10, elo: 1294, odds: ['3.81', '1.50', '1.50'] },
    { rank: 2, club: 'Liverpool', date: '18 Oct 21', rankNum: 61, elo: 1221, odds: ['1.40', '1.33', '1.33'] },
    { rank: 3, club: 'Mamson', date: '18 Oct 21', rankNum: 72, elo: 1209, odds: ['1.57', '1.53', '1.53'] },
    { rank: 4, club: 'Venina', date: '18 Oct 21', rankNum: 53, elo: 1174, odds: ['1.19', '1.00', '1.00'] },
  ];

  tbody.innerHTML = matches.map(match => `
    <tr class="border-b border-gray-700">
      <td class="py-3 text-gray-400">${match.rank}</td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white">M</span>
          <span class="text-white">${match.club}</span>
        </div>
      </td>
      <td class="py-3 text-gray-400"><span class="material-symbols-outlined text-purple-400 text-sm">calendar_today</span> ${match.date}</td>
      <td class="py-3 text-white">${match.rankNum}</td>
      <td class="py-3 text-white font-semibold">${match.elo}</td>
      <td class="py-3">
        <div class="flex gap-1">
          ${match.odds.map(odd => `<span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">${odd}</span>`).join('')}
          <span class="text-gray-400 text-xs ml-1">vss</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-emerald-500 rounded text-xs text-white font-semibold">W</span>
          <span class="px-2 py-1 bg-red-500 rounded text-xs text-white font-semibold">L</span>
        </div>
      </td>
    </tr>
  `).join('');
}

// Render Coaches table
function renderCoachesTable() {
  const tbody = document.getElementById('coaches-tbody');
  const coaches = [
    { name: 'Pep Guardiola', club: 'Real Madrid', tenure: '11 Juins', games: 675, elo: 789 },
    { name: 'Hansi Flick', club: 'Bendujema', tenure: '17 Griee', games: 123, elo: 765 },
    { name: 'Jürgen Klopp', club: 'Liverpool', tenure: '3 Years', games: 65, elo: 731 },
    { name: 'Hans Shannign', club: 'Forcenis', tenure: '31 June', games: 78, elo: 754 },
    { name: 'Hans Elickin', club: 'Arsenal', tenure: '11 Juaa', games: 50, elo: 733 },
    { name: 'Van Hosgkat', club: 'Liverpool', tenure: '19 Days', games: 60, elo: 730 },
  ];

  tbody.innerHTML = coaches.map(coach => `
    <tr class="border-b border-gray-700">
      <td class="py-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gray-700 rounded-full"></div>
          <span class="text-white text-sm">${coach.name}</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <img src="${clubLogos[coach.club] || ''}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
          <span class="text-white text-sm">${coach.club}</span>
        </div>
      </td>
      <td class="py-3 text-sm">
        <span class="px-3 py-1 bg-purple-900/50 text-purple-300 rounded">${coach.tenure}</span>
      </td>
      <td class="py-3 text-white">${coach.games}</td>
      <td class="py-3">
        <span class="px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded font-semibold">${coach.elo}</span>
      </td>
      <td class="py-3">
        <span class="material-symbols-outlined text-gray-400">trending_up</span>
      </td>
    </tr>
  `).join('');
}

// Render Recent Chart
function renderRecentChart() {
  const ctx = document.getElementById('recent-chart').getContext('2d');

  if (recentChart) recentChart.destroy();

  const labels = [];
  for (let year = 2000; year <= 2020; year += 2) {
    labels.push(year.toString());
  }

  recentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Real Madrid', data: generateData(), borderColor: '#ef4444', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Liverpool', data: generateData(), borderColor: '#8b5cf6', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Arsenal', data: generateData(), borderColor: '#06b6d4', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Lithirum', data: generateData(), borderColor: '#10b981', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'United Kindom', data: generateData(), borderColor: '#ec4899', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Arsenal', data: generateData(), borderColor: '#f59e0b', borderWidth: 2, tension: 0.4, pointRadius: 0 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#9ca3af', font: { size: 11 } } }
      },
      scales: {
        x: { grid: { color: '#2a2d3a' }, ticks: { color: '#6b7280' } },
        y: { grid: { color: '#2a2d3a' }, ticks: { color: '#6b7280' } }
      }
    }
  });
}

// Render Eras Chart
function renderErasChart() {
  const ctx = document.getElementById('eras-chart').getContext('2d');

  if (erasChart) erasChart.destroy();

  const labels = [];
  for (let year = 1910; year <= 2020; year += 10) {
    labels.push(year.toString());
  }

  erasChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Real Madrid', data: generateEraData(), borderColor: '#ef4444', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Liverpool', data: generateEraData(), borderColor: '#8b5cf6', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Arsenal', data: generateEraData(), borderColor: '#06b6d4', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Chensea', data: generateEraData(), borderColor: '#10b981', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Bemore', data: generateEraData(), borderColor: '#ec4899', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Norman', data: generateEraData(), borderColor: '#f59e0b', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Barfan', data: generateEraData(), borderColor: '#3b82f6', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'United Kincan', data: generateEraData(), borderColor: '#14b8a6', borderWidth: 2, tension: 0.4, pointRadius: 0 },
        { label: 'Bestlaoh', data: generateEraData(), borderColor: '#84cc16', borderWidth: 2, tension: 0.4, pointRadius: 0 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#9ca3af', font: { size: 11 } } }
      },
      scales: {
        x: { grid: { color: '#2a2d3a' }, ticks: { color: '#6b7280' } },
        y: { grid: { color: '#2a2d3a' }, ticks: { color: '#6b7280' }, min: 100, max: 260 }
      }
    }
  });
}

// Helper functions
function generateData() {
  const data = [];
  let value = 180 + Math.random() * 60;
  for (let i = 0; i < 11; i++) {
    value += (Math.random() - 0.5) * 40;
    value = Math.max(160, Math.min(260, value));
    data.push(Math.round(value));
  }
  return data;
}

function generateEraData() {
  const data = [];
  let value = 130 + Math.random() * 80;
  for (let i = 0; i < 12; i++) {
    value += (Math.random() - 0.5) * 30;
    value = Math.max(100, Math.min(260, value));
    data.push(Math.round(value));
  }
  return data;
}
