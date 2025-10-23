// Script for saved URLs page
let allUrls = [];
let filteredUrls = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadUrls();
  setupEventListeners();
});

// Load URLs from storage
async function loadUrls() {
  try {
    const result = await chrome.storage.local.get(['savedUrls']);
    allUrls = result.savedUrls || [];
    filteredUrls = [...allUrls];

    updateStats();
    updateDomainFilter();
    renderUrls();
  } catch (error) {
    console.error('Error loading URLs:', error);
    document.getElementById('urlsContainer').innerHTML =
      '<div class="empty-state"><h3>Error loading URLs</h3><p>Please try refreshing the page.</p></div>';
  }
}

// Update statistics
function updateStats() {
  const totalCount = allUrls.length;
  document.getElementById('totalCount').textContent = totalCount;

  // Calculate this week's count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeekCount = allUrls.filter((item) => {
    const savedDate = new Date(item.lastSaved || item.createdAt);
    return savedDate >= oneWeekAgo;
  }).length;

  document.getElementById('thisWeekCount').textContent = thisWeekCount;

  // Calculate unique domains
  const uniqueDomains = new Set(allUrls.map((item) => item.domain)).size;
  document.getElementById('uniqueDomains').textContent = uniqueDomains;
}

// Update domain filter dropdown
function updateDomainFilter() {
  const domainFilter = document.getElementById('domainFilter');
  const domains = [...new Set(allUrls.map((item) => item.domain))].sort();

  // Clear existing options except "All Domains"
  domainFilter.innerHTML = '<option value="">All Domains</option>';

  domains.forEach((domain) => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    domainFilter.appendChild(option);
  });
}

// Render URLs
function renderUrls() {
  const container = document.getElementById('urlsContainer');

  if (filteredUrls.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No URLs found</h3>
        <p>Start capturing URLs with the floating + button!</p>
      </div>
    `;
    return;
  }

  // Sort by date (newest first)
  const sortedUrls = [...filteredUrls].sort((a, b) => {
    const dateA = new Date(a.lastSaved || a.createdAt);
    const dateB = new Date(b.lastSaved || b.createdAt);
    return dateB - dateA;
  });

  const urlsHtml = sortedUrls.map((url) => createUrlCard(url)).join('');
  container.innerHTML = `<div class="urls-grid">${urlsHtml}</div>`;
}

// Create URL card HTML
function createUrlCard(url) {
  const savedDate = new Date(url.lastSaved || url.createdAt);
  const formattedDate =
    savedDate.toLocaleDateString() + ' ' + savedDate.toLocaleTimeString();

  return `
    <div class="url-card">
      <div class="url-title">${escapeHtml(url.title || 'Untitled')}</div>
      <a href="${url.url}" target="_blank" class="url-link">${url.url}</a>
      <div class="url-meta">
        <span class="url-domain">${url.domain}</span>
        <span class="url-date">${formattedDate}</span>
      </div>
      <div class="actions">
        <button class="btn btn-primary btn-small" onclick="openUrl('${
          url.url
        }')">Open</button>
        <button class="btn btn-secondary btn-small" onclick="copyUrl('${
          url.url
        }')">Copy</button>
        <button class="btn btn-secondary btn-small" onclick="deleteUrl('${
          url.id
        }')">Delete</button>
      </div>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  document.getElementById('searchBox').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterUrls(searchTerm);
  });

  // Domain filter
  document.getElementById('domainFilter').addEventListener('change', (e) => {
    const selectedDomain = e.target.value;
    filterUrls(
      document.getElementById('searchBox').value.toLowerCase(),
      selectedDomain
    );
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadUrls);

  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportUrls);
}

// Filter URLs based on search term and domain
function filterUrls(searchTerm = '', domain = '') {
  filteredUrls = allUrls.filter((url) => {
    const matchesSearch =
      !searchTerm ||
      url.title.toLowerCase().includes(searchTerm) ||
      url.url.toLowerCase().includes(searchTerm) ||
      url.domain.toLowerCase().includes(searchTerm) ||
      (url.siteName && url.siteName.toLowerCase().includes(searchTerm));

    const matchesDomain = !domain || url.domain === domain;

    return matchesSearch && matchesDomain;
  });

  renderUrls();
}

// Open URL in new tab
function openUrl(url) {
  chrome.tabs.create({ url: url });
}

// Copy URL to clipboard
async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    // You could add a toast notification here
    console.log('URL copied to clipboard');
  } catch (error) {
    console.error('Error copying URL:', error);
  }
}

// Delete URL
async function deleteUrl(urlId) {
  if (confirm('Are you sure you want to delete this URL?')) {
    try {
      allUrls = allUrls.filter((url) => url.id !== urlId);
      await chrome.storage.local.set({ savedUrls: allUrls });

      // Update filtered URLs
      const searchTerm = document
        .getElementById('searchBox')
        .value.toLowerCase();
      const selectedDomain = document.getElementById('domainFilter').value;
      filterUrls(searchTerm, selectedDomain);

      updateStats();
      updateDomainFilter();
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  }
}

// Export URLs
async function exportUrls() {
  try {
    const dataStr = JSON.stringify(filteredUrls, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-tracker-urls-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting URLs:', error);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
