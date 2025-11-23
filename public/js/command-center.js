// Command Center JavaScript

// State
let clubsData = [];
let performanceChart = null;

// Club logos mapping
const CLUB_LOGOS = {
  'Arsenal': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiMfZT4Lr84KN4dCLUqsvZedeF-oYenU7mWen0Jl5LkZmC5uWnGHp4FCxaBpr9DxuF6CkFieUorF0aeDkf-Z9RQv7Ozd8AjXZMSuYgvCJcB5-2P3pGDHoN00Tm32Vb_worr2TDL7fyb-Wl5bjz4BTjhCixwO__dJGXcL3sg87lrTWkg2naTJrQRy68wD_RKJPq3zmxs3GD0DyK6NZ1XLjTUAO-IBJ61CV1iyleN0HjPMAbQc39-Dvor8HlbTsSRQCHLwlB25G_2ciJ',
  'Man City': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmm23wnD-JMFvYS8sugL-nP0G_Yk9qi_ltlLx4o1LT6O0z44AsiBXk2zOorrfxOf67eyws-K7nS6jAf0ptRew53tpn8ojDOdEY4C2GLu7-KpxSmlYMr3Jv4vje_hNmwVZROTIR3QOn8suh7AdWSHOM04FzRjTOpCfFgAOiL2n1wQrxmuReL41kXeNgNZ1SrR47xvHgN5fU_WBdsObN-hvNmC6sN3CX0skzH82a-W3mfTdqGj_iy2IAa__sfmZSftrbOdJkPkZ6SPZl',
  'Bayern': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF7d_g_H02Pslr4nEi9y1Df4gzECxUS_H4p3QZ_ixwYOsUgFcJaFMTicUavT52sc7zKw87uPpWEeSs6Cx5Bq94DQkOOc0UYjs60-PWvSXMKsINA6OGOt2MoH5-AOZAPa1sPpxdy-egDa5IS3O6vRP-hzpuAVkniXWuwVq8pTRTZtxHh1Fmla67aWOsU6NSfbRJuv6AIU_YrgtgMy3aFVc4GineyFlGsBq8a2ZQH4ySSBI7GV2eFT5YIQFPcV4BJwmI55ygAchww0Al',
  'Liverpool': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0kasuC4BzSLTTk_rP6Cwm8espTMwdXL69k0K0u9DI-IjmF5fb4fdD57pRcclLqizOxBQUrU6ZtD3mha8IfSHkEVVbKcS2gSwYHXGN7Gmi-6OtRFSTA5IZF_e25hy5wXOEi8Au-qtJHb_FbPnU7ZFjvxoL1fVhn7AMTwie1a1rGsGARFuHbgVEFkfg1rVZKljvLlq_suQWQKboUtfQrRZ9hv6oV72DMiOFqNjoWaUoBJ6zaCh3u3NUVuEm5foh1j966SuBr1foc2F',
  'Paris SG': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGDOHMQDPDMUOGf4XEickAPphrdvEKvbWHy1Nf1JHzWxWaa8STd21EAErVqGxcuRy-PjriMYtLrc7tVss_WexUta-s5EC5c8xomLbPs0-XDU02pXAbzjkW2YMeNV7y9Yw8Rkg5s7tqNc0TJjbnc9pbYSBxMoHs9lY_-QK_jT9fjD5BYCtXZxolrKz1oDi_jJwvfNG6rV4QD6kyhOeh7DoeAuZGjvoVcEPcSYftsr9Y3TOoviBA2d3JMsx1x-8OVOYZiSDkKPLC7vU4',
  'Real Madrid': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc9WXzLewsJaqwOerG1BCn-OVzwnWeUjwuulmMzC60y8UTJTqxgeDD-5cnFUmIH2xUV40S4cH-ZUYPLEYCVT5xFIDpZmADZUhlO7kKZYUrYRgqRYk65Qf02yp2KGSVKa5-3HfCQOtZFtLMQg9-_-nyQ2u4mLqMlhaxKHNGA5bUOh4tYgsgf8Fp6FsSPsirA3nGs4lBo0NoLMAE8m3KFpYxzf-pv8vcSNH9X27yFsq8gocmdolMoQEJtLORaWlfgtpHIZVdTF4tbwuu',
  'Barcelona': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRfxTxTKzF5GoHNkG0AsFLBH6kdIz4ni8uwHdMBoDYTlOM2A_WCNowhYaHXeq5Xsdk6C6dc9KLzfobis3ce-vwGGsCSGEmn8RYUggEqn_9QGOvWqGoEwuaqaQoMql7ydz_vg6FUB2blT9OZ2R8dIvy2POgMau6CC0hq8nRldUx5ekAbrFWsGRoK-S1SaKW1sFX6iMUfMTpV9uaXyPGVybszRonSzbJObKJqi2mwdubmhFkm-5Axu_23eUmPPwescSKt89riNHva1Ot',
  'Inter': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIfVpN-wlZSw2c7G5ZN2PlvEP6bk-z5ODr2cDkMuVgnSkayTEXlZCAN8jYCRYP5o3x6SNwsRlIcv7aPV8DIm3Y8ro9bqF7Dhimip4C71dv5dqqN8tRoOFlQu4dJY5DVwzxl4RS1Cwu06kbLEQ4edEy6Fjpon3MMDw8nYb_3cKC3ThoaOkMgPlHmx-xObl-TXoTCHqQf5L1u-Un8LcEk2gkYC55s7OGQisa_l6FbCfZOijfD7Y0y2yVDXe0S8bm59QehBOxJDERf_66',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
};

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

  tbody.innerHTML = clubsData.slice(0, 8).map((club, index) => {
    const logoUrl = CLUB_LOGOS[club.displayName] || CLUB_LOGOS[club.apiName];

    return `
      <tr class="border-t border-card-border hover:bg-card-border/30 transition-colors">
        <td class="py-2.5 px-2 text-white">${index + 1}</td>
        <td class="py-2.5 px-2 flex items-center gap-3 text-white">
          ${logoUrl ? `<img alt="${club.displayName} logo" class="club-logo-lg" src="${logoUrl}"/>` :
            `<div class="club-logo-lg flex items-center justify-center text-xs font-bold text-white">${getClubInitials(club.displayName || club.apiName)}</div>`}
          <span>${club.displayName || club.apiName}</span>
        </td>
        <td class="py-2.5 px-2 text-right font-bold text-white">${Math.round(club.elo)}</td>
      </tr>
    `;
  }).join('');
}

// Get club initials
function getClubInitials(name) {
  const words = name.split(' ');
  if (words.length >= 2) {
    return words[0][0] + words[1][0];
  }
  return name.substring(0, 2).toUpperCase();
}

// Load Competition Ranking
async function loadCompetitionRanking() {
  const competitions = [
    { league: 'England - Premier', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 2038 },
    { league: 'Spain - La Liga', country: '🇪🇸', rating: 1997 },
    { league: 'Germany - Bundesliga', country: '🇩🇪', rating: 1979 },
    { league: 'France - Ligue 1', country: '🇫🇷', rating: 1978 },
    { league: 'Italy - Serie A', country: '🇮🇹', rating: 1968 },
    { league: 'Portugal - Primeira', country: '🇵🇹', rating: 1946 },
    { league: 'Netherlands - Eredivisie', country: '🇳🇱', rating: 1933 },
    { league: 'Belgium - Pro League', country: '🇧🇪', rating: 1933 },
  ];

  const tbody = document.getElementById('competition-tbody');
  if (!tbody) return;

  tbody.innerHTML = competitions.map(comp => `
    <tr class="border-t border-card-border hover:bg-card-border/30 transition-colors">
      <td class="py-2.5 px-2 text-white">${comp.league}</td>
      <td class="py-2.5 px-2 text-center text-xl">${comp.country}</td>
      <td class="py-2.5 px-2 text-right font-bold text-white">${comp.rating}</td>
    </tr>
  `).join('');
}

// Load Fixtures
async function loadFixtures() {
  const fixtures = [
    {
      home: 'Man City',
      away: 'Liverpool',
      homeElo: 1997,
      awayElo: 1979,
      homeWin: '1.50',
      draw: '2.20',
      awayWin: '4.20'
    },
    {
      home: 'Real Madrid',
      away: 'Barcelona',
      homeElo: 1946,
      awayElo: 1933,
      homeWin: '1.80',
      draw: '3.50',
      awayWin: '3.00'
    }
  ];

  const container = document.getElementById('fixtures-container');
  if (!container) return;

  container.innerHTML = fixtures.map(fixture => {
    const homeLogo = CLUB_LOGOS[fixture.home];
    const awayLogo = CLUB_LOGOS[fixture.away];

    return `
      <div class="bg-card-bg p-4 rounded-lg shadow-lg border border-card-border flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3 border-b border-card-border pb-3">
          <div class="flex items-center gap-2">
            <img alt="${fixture.home} logo" class="w-10 h-10 rounded-full object-contain bg-gray-700 p-1" src="${homeLogo}"/>
            <span class="text-lg font-semibold text-white">${fixture.home}</span>
          </div>
          <span class="text-2xl font-bold text-accent mx-2">VS</span>
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-white">${fixture.away}</span>
            <img alt="${fixture.away} logo" class="w-10 h-10 rounded-full object-contain bg-gray-700 p-1" src="${awayLogo}"/>
          </div>
        </div>
        <div class="grid grid-cols-3 text-center text-sm">
          <div>
            <span class="block text-secondary-text">Home Win</span>
            <span class="block text-lg font-bold text-white">${fixture.homeWin}</span>
          </div>
          <div>
            <span class="block text-secondary-text">Draw</span>
            <span class="block text-lg font-bold text-white">${fixture.draw}</span>
          </div>
          <div>
            <span class="block text-secondary-text">Away Win</span>
            <span class="block text-lg font-bold text-white">${fixture.awayWin}</span>
          </div>
        </div>
        <div class="flex justify-around text-center text-xs mt-3 border-t border-card-border pt-3">
          <div>
            <span class="block text-secondary-text">Home Elo</span>
            <span class="block font-bold text-white">${fixture.homeElo}</span>
          </div>
          <div>
            <span class="block text-secondary-text">Away Elo</span>
            <span class="block font-bold text-white">${fixture.awayElo}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Performance Chart
function renderPerformanceChart() {
  const canvas = document.getElementById('performance-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (performanceChart) {
    performanceChart.destroy();
  }

  const labels = [];
  const datasets = [];
  const clubs = ['Man City', 'Liverpool', 'Arsenal', 'Bayer Leverkusen'];
  const colors = ['#4dff00', '#00d9ff', '#ff00ff', '#ffaa00'];
  const baseElos = [2010, 1995, 1980, 1930];

  // Generate 12 months
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
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: colors[index],
      pointHoverBorderColor: '#000',
      pointHoverBorderWidth: 2,
    });
  });

  // Update trending clubs list
  const trendingList = document.getElementById('trending-clubs');
  if (trendingList) {
    trendingList.innerHTML = clubs.map((club, index) => {
      const currentElo = datasets[index].data[datasets[index].data.length - 1];
      return `<li><span class="font-semibold text-accent">${club}</span> - <span class="font-bold text-white graph-label-glow">${currentElo}</span></li>`;
    }).join('');
  }

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
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: '#1a1a1e',
          titleColor: '#4dff00',
          bodyColor: '#d1d1d1',
          borderColor: '#4dff00',
          borderWidth: 1,
          padding: 12,
        }
      },
      scales: {
        x: {
          grid: {
            color: '#333333',
            drawBorder: false
          },
          ticks: {
            color: '#a0a0a0',
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            color: '#333333',
            drawBorder: false
          },
          ticks: {
            color: '#a0a0a0',
            font: { size: 11 }
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

  tbody.innerHTML = filtered.slice(0, 8).map((club, index) => {
    const logoUrl = CLUB_LOGOS[club.displayName] || CLUB_LOGOS[club.apiName];

    return `
      <tr class="border-t border-card-border hover:bg-card-border/30 transition-colors">
        <td class="py-2.5 px-2 text-white">${club.rank || index + 1}</td>
        <td class="py-2.5 px-2 flex items-center gap-3 text-white">
          ${logoUrl ? `<img alt="${club.displayName} logo" class="club-logo-lg" src="${logoUrl}"/>` :
            `<div class="club-logo-lg flex items-center justify-center text-xs font-bold text-white">${getClubInitials(club.displayName || club.apiName)}</div>`}
          <span>${club.displayName || club.apiName}</span>
        </td>
        <td class="py-2.5 px-2 text-right font-bold text-white">${Math.round(club.elo)}</td>
      </tr>
    `;
  }).join('');
}

// Export
window.CommandCenter = {
  loadAllData,
  filterClubs
};
