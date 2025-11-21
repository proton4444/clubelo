// Enhanced Rankings Page JavaScript

let currentPage = 1;
let currentFilters = {};
let totalPages = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeDatePicker();
  setupEventListeners();
  loadRankings();
});

// Initialize date picker with today's date
function initializeDatePicker() {
  const dateInput = document.getElementById('date-input');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.max = today;
}

// Setup all event listeners
function setupEventListeners() {
  document.getElementById('apply-filters').addEventListener('click', () => {
    currentPage = 1;
    loadRankings();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('date-input').value = new Date().toISOString().split('T')[0];
    document.getElementById('country-select').value = 'ALL';
    document.getElementById('level-select').value = 'ALL';
    document.getElementById('limit-select').value = '100';
    document.getElementById('search-input').value = '';
    currentPage = 1;
    loadRankings();
  });

  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadRankings();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadRankings();
    }
  });

  // Search on Enter key
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadRankings();
    }
  });
}

// Load rankings from API
async function loadRankings() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const tableContainer = document.getElementById('rankings-card');

  // Show loading state
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  tableContainer.style.opacity = '0.5';

  try {
    // Get filter values
    const date = document.getElementById('date-input').value;
    const country = document.getElementById('country-select').value;
    const level = document.getElementById('level-select').value;
    const pageSize = parseInt(document.getElementById('limit-select').value);
    const searchQuery = document.getElementById('search-input').value.trim();

    // Build query params
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (country !== 'ALL') params.append('country', country);
    if (level !== 'ALL') params.append('level', level);
    params.append('page', currentPage);
    params.append('pageSize', pageSize);

    // Fetch rankings
    const response = await fetch(`/api/elo/rankings?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch rankings: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter by search query if provided
    let clubs = data.clubs || [];
    if (searchQuery) {
      clubs = clubs.filter(club =>
        club.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update pagination
    if (data.pagination) {
      totalPages = data.pagination.totalPages;
      updatePagination(data.pagination);
    }

    // Update stats
    updateStats(clubs, data);

    // Render table
    renderTable(clubs);

    // Update date info
    updateDateInfo(data.date);

    // Hide loading
    loadingEl.style.display = 'none';
    tableContainer.style.opacity = '1';

  } catch (error) {
    console.error('Error loading rankings:', error);
    loadingEl.style.display = 'none';
    errorEl.textContent = `Failed to load rankings: ${error.message}`;
    errorEl.style.display = 'block';
    tableContainer.style.opacity = '1';
  }
}

// Update stats cards
function updateStats(clubs, data) {
  const totalClubs = data.pagination?.total || clubs.length;
  const countries = new Set(clubs.map(c => c.country)).size;
  const avgElo = clubs.length > 0
    ? Math.round(clubs.reduce((sum, c) => sum + c.elo, 0) / clubs.length)
    : 0;
  const topElo = clubs.length > 0
    ? Math.round(Math.max(...clubs.map(c => c.elo)))
    : 0;

  document.getElementById('total-clubs').textContent = totalClubs.toLocaleString();
  document.getElementById('total-countries').textContent = countries;
  document.getElementById('avg-elo').textContent = avgElo.toLocaleString();
  document.getElementById('top-elo').textContent = topElo.toLocaleString();
}

// Render rankings table
function renderTable(clubs) {
  const tbody = document.getElementById('rankings-body');

  if (clubs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
          <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No clubs found</div>
          <div>Try adjusting your filters or search query</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clubs.map(club => `
    <tr>
      <td class="col-rank">
        <div class="rank-badge ${getRankClass(club.rank)}">${club.rank}</div>
      </td>
      <td class="col-club">
        <div class="club-name">${escapeHtml(club.displayName)}</div>
      </td>
      <td class="col-country">
        <span class="country-badge">${escapeHtml(club.country)}</span>
      </td>
      <td class="col-level" style="text-align: center;">
        ${club.level}
      </td>
      <td class="col-elo">
        ${Math.round(club.elo).toLocaleString()}
      </td>
      <td class="col-actions">
        <button class="btn-view" onclick="viewClubHistory(${club.id})">
          View History
        </button>
      </td>
    </tr>
  `).join('');
}

// Get rank badge class
function getRankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
}

// Update pagination controls
function updatePagination(pagination) {
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  prevBtn.disabled = pagination.page === 1;
  nextBtn.disabled = pagination.page >= pagination.totalPages;

  pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
}

// Update date info badge
function updateDateInfo(date) {
  const dateInfo = document.getElementById('date-info');
  if (date) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateInfo.textContent = `📅 ${formattedDate}`;
  }
}

// View club history (navigate to club page)
function viewClubHistory(clubId) {
  window.location.href = `/club.html?id=${clubId}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
