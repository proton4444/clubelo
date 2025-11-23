// Full Dashboard JavaScript

let clubsData = [];
let countryData = [];
let recentChart = null;
let erasChart = null;

// Club logos
const clubLogos = {
  "Real Madrid":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCc9WXzLewsJaqwOerG1BCn-OVzwnWeUjwuulmMzC60y8UTJTqxgeDD-5cnFUmIH2xUV40S4cH-ZUYPLEYCVT5xFIDpZmADZUhlO7kKZYUrYRgqRYk65Qf02yp2KGSVKa5-3HfCQOtZFtLMQg9-_-nyQ2u4mLqMlhaxKHNGA5bUOh4tYgsgf8Fp6FsSPsirA3nGs4lBo0NoLMAE8m3KFpYxzf-pv8vcSNH9X27yFsq8gocmdolMoQEJtLORaWlfgtpHIZVdTF4tbwuu",
  Liverpool:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCD0kasuC4BzSLTTk_rP6Cwm8espTMwdXL69k0K0u9DI-IjmF5fb4fdD57pRcclLqizOxBQUrU6ZtD3mha8IfSHkEVVbKcS2gSwYHXGN7Gmi-6OtRFSTA5IZF_e25hy5wXOEi8Au-qtJHb_FbPnU7ZFjvxoL1fVhn7AMTwie1a1rGsGARFuHbgVEFkfg1rVZKljvLlq_suQWQKboUtfQrRZ9hv6oV72DMiOFqNjoWaUoBJ6zaCh3u3NUVuEm5foh1j966SuBr1foc2F",
  Arsenal:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBiMfZT4Lr84KN4dCLUqsvZedeF-oYenU7mWen0Jl5LkZmC5uWnGHp4FCxaBpr9DxuF6CkFieUorF0aeDkf-Z9RQv7Ozd8AjXZMSuYgvCJcB5-2P3pGDHoN00Tm32Vb_worr2TDL7fyb-Wl5bjz4BTjhCixwO__dJGXcL3sg87lrTWkg2naTJrQRy68wD_RKJPq3zmxs3GD0DyK6NZ1XLjTUAO-IBJ61CV1iyleN0HjPMAbQc39-Dvor8HlbTsSRQCHLwlB25G_2ciJ",
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const countryCode = params.get("country");

  await loadAllData();
  renderCountries();

  if (countryCode) {
    showCountryPage(countryCode);
  } else {
    renderEuroTop25();
    renderTodayTable();
    renderYesterdayTable();
    renderCoachesTable();
    renderRecentChart();
    renderErasChart();
  }
});

// Load all data from API
async function loadAllData() {
  try {
    // Load top 100 clubs for both Euro Top 25 and country aggregation
    const response = await fetch("/api/elo/rankings?limit=100&pageSize=100");
    const data = await response.json();
    clubsData = data.clubs || [];

    // Calculate country averages
    countryData = calculateCountryAverages(clubsData);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Calculate average elo by country
function calculateCountryAverages(clubs) {
  const countryMap = {};

  clubs.forEach((club) => {
    const country = club.country || "Unknown";
    if (!countryMap[country]) {
      countryMap[country] = { elo: [], names: [] };
    }
    countryMap[country].elo.push(club.elo);
    countryMap[country].names.push(club.displayName || club.apiName);
  });

  // Convert to array with averages
  const countries = Object.entries(countryMap).map(([country, data]) => {
    const avgElo = data.elo.reduce((a, b) => a + b, 0) / data.elo.length;
    const maxElo = Math.max(...data.elo);
    const progress = Math.min((avgElo / maxElo) * 100, 100);

    return {
      name: country,
      elo: Math.round(avgElo),
      progress: Math.round(progress),
      clubs: data.names,
    };
  });

  // Sort by elo descending and return top 25
  return countries.sort((a, b) => b.elo - a.elo).slice(0, 25);
}

// Render countries sidebar
function renderCountries() {
  const list = document.getElementById("countries-list");
  list.innerHTML = countryData
    .map(
      (country) => `
    <div class="sidebar-item cursor-pointer hover:bg-purple-900/30 transition" onclick="navigateToCountry('${country.name}')">
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
  `,
    )
    .join("");
}

// Navigate to country page
function navigateToCountry(countryCode) {
  window.location.href = `/country.html?country=${countryCode}`;
}

// Render Euro Top 25
function renderEuroTop25() {
  const list = document.getElementById("euro-top-list");
  const colors = ["#4ade80", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

  list.innerHTML = clubsData
    .slice(0, 25)
    .map((club, index) => {
      const barWidth = (club.elo / 2100) * 100;
      const color = colors[index % colors.length];

      return `
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-400 w-6">${index + 1}</span>
        <img src="${clubLogos[club.displayName] || ""}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
        <span class="flex-1 text-white">${club.displayName || club.apiName}</span>
        <div class="w-24 h-6 bg-gray-700 rounded overflow-hidden">
          <div class="h-full" style="width: ${barWidth}%; background: ${color}"></div>
        </div>
        <span class="text-white font-semibold w-12 text-right">${Math.round(club.elo)}</span>
      </div>
    `;
    })
    .join("");
}

// Render Today table - use top clubs from API as "today's" data
function renderTodayTable() {
  const tbody = document.getElementById("today-tbody");
  const topClubs = clubsData.slice(0, 4);

  tbody.innerHTML = topClubs
    .map(
      (club, index) => `
    <tr class="border-b border-gray-700">
      <td class="py-3 text-gray-400">${index + 1}</td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <img src="${clubLogos[club.displayName] || ""}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
          <span class="text-white">${club.displayName || club.apiName}</span>
        </div>
      </td>
      <td class="py-3 text-gray-400"><span class="material-symbols-outlined text-purple-400 text-sm">calendar_today</span> Today</td>
      <td class="py-3 text-white">${club.rank}</td>
      <td class="py-3 text-white font-semibold">${Math.round(club.elo)}</td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">1.50</span>
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">3.20</span>
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">4.50</span>
          <span class="text-gray-400 text-xs ml-1">vs</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-emerald-500 rounded text-xs text-white font-semibold">W</span>
          <span class="px-2 py-1 bg-red-500 rounded text-xs text-white font-semibold">L</span>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Render Yesterday table - use next 4 clubs from API as "yesterday's" data
function renderYesterdayTable() {
  const tbody = document.getElementById("yesterday-tbody");
  const clubs = clubsData.slice(4, 8);

  tbody.innerHTML = clubs
    .map(
      (club, index) => `
    <tr class="border-b border-gray-700">
      <td class="py-3 text-gray-400">${index + 1}</td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <img src="${clubLogos[club.displayName] || ""}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
          <span class="text-white">${club.displayName || club.apiName}</span>
        </div>
      </td>
      <td class="py-3 text-gray-400"><span class="material-symbols-outlined text-purple-400 text-sm">calendar_today</span> Yesterday</td>
      <td class="py-3 text-white">${club.rank}</td>
      <td class="py-3 text-white font-semibold">${Math.round(club.elo)}</td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">2.10</span>
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">3.50</span>
          <span class="px-2 py-1 bg-gray-700 rounded text-xs text-white">3.20</span>
          <span class="text-gray-400 text-xs ml-1">vs</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex gap-1">
          <span class="px-2 py-1 bg-emerald-500 rounded text-xs text-white font-semibold">W</span>
          <span class="px-2 py-1 bg-red-500 rounded text-xs text-white font-semibold">L</span>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Render Coaches table - use top clubs as coaches
function renderCoachesTable() {
  const tbody = document.getElementById("coaches-tbody");
  const topClubs = clubsData.slice(0, 6);

  tbody.innerHTML = topClubs
    .map(
      (club, index) => `
    <tr class="border-b border-gray-700">
      <td class="py-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gray-700 rounded-full"></div>
          <span class="text-white text-sm">${club.displayName || club.apiName}</span>
        </div>
      </td>
      <td class="py-3">
        <div class="flex items-center gap-2">
          <img src="${clubLogos[club.displayName] || ""}" class="w-5 h-5 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
          <span class="text-white text-sm">${club.displayName || club.apiName}</span>
        </div>
      </td>
      <td class="py-3 text-sm">
        <span class="px-3 py-1 bg-purple-900/50 text-purple-300 rounded">Active</span>
      </td>
      <td class="py-3 text-white">${club.rank * 10}</td>
      <td class="py-3">
        <span class="px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded font-semibold">${Math.round(club.elo)}</span>
      </td>
      <td class="py-3">
        <span class="material-symbols-outlined text-gray-400">trending_up</span>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Render Recent Chart
function renderRecentChart() {
  const ctx = document.getElementById("recent-chart").getContext("2d");

  if (recentChart) recentChart.destroy();

  // Get top 6 clubs for chart
  const topClubs = clubsData.slice(0, 6);
  const colors = [
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#ec4899",
    "#f59e0b",
  ];

  const labels = [];
  for (let year = 2000; year <= 2020; year += 2) {
    labels.push(year.toString());
  }

  const datasets = topClubs.map((club, idx) => ({
    label: club.displayName || club.apiName,
    data: generateData(),
    borderColor: colors[idx],
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 0,
  }));

  recentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: { color: "#9ca3af", font: { size: 11 } },
        },
      },
      scales: {
        x: { grid: { color: "#2a2d3a" }, ticks: { color: "#6b7280" } },
        y: { grid: { color: "#2a2d3a" }, ticks: { color: "#6b7280" } },
      },
    },
  });
}

// Render Eras Chart
function renderErasChart() {
  const ctx = document.getElementById("eras-chart").getContext("2d");

  if (erasChart) erasChart.destroy();

  // Get top 8 clubs for chart
  const topClubs = clubsData.slice(0, 8);
  const colors = [
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#ec4899",
    "#f59e0b",
    "#3b82f6",
    "#14b8a6",
  ];

  const labels = [];
  for (let year = 1910; year <= 2020; year += 10) {
    labels.push(year.toString());
  }

  const datasets = topClubs.map((club, idx) => ({
    label: club.displayName || club.apiName,
    data: generateEraData(),
    borderColor: colors[idx],
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 0,
  }));

  erasChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: { color: "#9ca3af", font: { size: 11 } },
        },
      },
      scales: {
        x: { grid: { color: "#2a2d3a" }, ticks: { color: "#6b7280" } },
        y: {
          grid: { color: "#2a2d3a" },
          ticks: { color: "#6b7280" },
          min: 100,
          max: 260,
        },
      },
    },
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

// Country Page Functions
function showCountryPage(countryCode) {
  const mainContent = document.querySelector("main > div");
  mainContent.innerHTML = `
    <div class="p-6">
      <button onclick="window.location.href='/'" class="flex items-center gap-2 px-4 py-2 rounded mb-6 bg-purple-600 hover:bg-purple-700 transition">
        <span class="material-symbols-outlined">arrow_back</span>
        Back to Dashboard
      </button>

      <h1 class="text-3xl font-bold text-white mb-6">${countryCode} - Clubs Ranking</h1>

      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card">
          <div class="text-gray-400 text-sm mb-1">Total Clubs</div>
          <div id="total-clubs" class="text-3xl font-bold text-white">0</div>
        </div>
        <div class="card">
          <div class="text-gray-400 text-sm mb-1">Avg Elo</div>
          <div id="avg-elo" class="text-3xl font-bold text-purple-400">0</div>
        </div>
        <div class="card">
          <div class="text-gray-400 text-sm mb-1">Top Club Elo</div>
          <div id="top-elo" class="text-3xl font-bold text-green-400">0</div>
        </div>
        <div class="card">
          <div class="text-gray-400 text-sm mb-1">Avg Rank</div>
          <div id="avg-rank" class="text-3xl font-bold text-blue-400">0</div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold text-white mb-4">Clubs Ranked by Elo</h2>
        <div id="clubs-list" class="space-y-2">
          <!-- Populated by JS -->
        </div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold text-white mb-4">Elo Distribution</h2>
        <div style="position: relative; height: 300px;">
          <canvas id="distribution-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  renderCountryData(countryCode);
}

function renderCountryData(countryCode) {
  const countryClubs = clubsData.filter((club) => club.country === countryCode);
  countryClubs.sort((a, b) => b.elo - a.elo);

  // Update stats
  const totalClubs = countryClubs.length;
  const avgElo =
    totalClubs > 0
      ? Math.round(
          countryClubs.reduce((sum, club) => sum + club.elo, 0) / totalClubs,
        )
      : 0;
  const topElo = totalClubs > 0 ? Math.round(countryClubs[0].elo) : 0;
  const avgRank =
    totalClubs > 0
      ? Math.round(
          countryClubs.reduce((sum, club) => sum + club.rank, 0) / totalClubs,
        )
      : 0;

  document.getElementById("total-clubs").textContent = totalClubs;
  document.getElementById("avg-elo").textContent = avgElo;
  document.getElementById("top-elo").textContent = topElo;
  document.getElementById("avg-rank").textContent = avgRank;

  // Render clubs list
  const list = document.getElementById("clubs-list");
  if (countryClubs.length === 0) {
    list.innerHTML =
      '<div class="text-gray-400 text-center py-8">No clubs found for this country</div>';
    return;
  }

  list.innerHTML = countryClubs
    .map(
      (club, index) => `
    <div class="club-row flex items-center justify-between p-3 rounded hover:bg-gray-800 transition">
      <div class="flex items-center gap-3 flex-1">
        <span class="text-gray-400 font-semibold w-8">${index + 1}</span>
        <img src="${clubLogos[club.displayName] || ""}" class="w-6 h-6 rounded-full bg-gray-700" onerror="this.style.display='none'"/>
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
  `,
    )
    .join("");

  // Render distribution chart
  renderCountryDistributionChart(countryClubs);
}

function renderCountryDistributionChart(countryClubs) {
  const ctx = document.getElementById("distribution-chart");
  if (!ctx) return;

  const chartCtx = ctx.getContext("2d");

  // Create histogram data (Elo ranges)
  const ranges = [];
  const counts = [];

  for (let i = 1400; i <= 2100; i += 100) {
    const count = countryClubs.filter(
      (c) => c.elo >= i && c.elo < i + 100,
    ).length;
    if (count > 0 || ranges.length === 0) {
      ranges.push(`${i}-${i + 100}`);
      counts.push(count);
    }
  }

  new Chart(chartCtx, {
    type: "bar",
    data: {
      labels: ranges,
      datasets: [
        {
          label: "Number of Clubs",
          data: counts,
          backgroundColor: "#8b5cf6",
          borderColor: "#6366f1",
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: "#9ca3af" } },
      },
      scales: {
        x: {
          grid: { color: "#2a2d3a" },
          ticks: { color: "#6b7280" },
        },
        y: {
          grid: { color: "#2a2d3a" },
          ticks: { color: "#6b7280" },
          beginAtZero: true,
        },
      },
    },
  });
}
