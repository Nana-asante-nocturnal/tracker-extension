// Popup script for extension settings and stats
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSettings();
  setupEventListeners();
});

// Load and display statistics
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['savedUrls']);
    const urls = result.savedUrls || [];

    // Update total saved count
    document.getElementById('totalSaved').textContent = urls.length;

    // Calculate this week's count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekCount = urls.filter((item) => {
      const savedDate = new Date(item.lastSaved || item.createdAt);
      return savedDate >= oneWeekAgo;
    }).length;

    document.getElementById('thisWeek').textContent = thisWeekCount;

    // Update last saved time
    if (urls.length > 0) {
      const lastSaved = urls.reduce((latest, current) => {
        const currentTime = new Date(current.lastSaved || current.createdAt);
        const latestTime = new Date(latest.lastSaved || latest.createdAt);
        return currentTime > latestTime ? current : latest;
      });

      const lastSavedDate = new Date(
        lastSaved.lastSaved || lastSaved.createdAt
      );
      const now = new Date();
      const diffMs = now - lastSavedDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let lastSavedText;
      if (diffMins < 1) {
        lastSavedText = 'Just now';
      } else if (diffMins < 60) {
        lastSavedText = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        lastSavedText = `${diffHours}h ago`;
      } else {
        lastSavedText = `${diffDays}d ago`;
      }

      document.getElementById('lastSaved').textContent = lastSavedText;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {
      showNotifications: true,
      autoSave: false,
    };

    // Update toggle states
    const notificationsToggle = document.getElementById('notificationsToggle');
    const autoSaveToggle = document.getElementById('autoSaveToggle');

    notificationsToggle.classList.toggle('active', settings.showNotifications);
    autoSaveToggle.classList.toggle('active', settings.autoSave);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // View all saved URLs
  document.getElementById('viewAll').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('saved-urls.html') });
  });

  // Export data
  document.getElementById('exportData').addEventListener('click', exportData);

  // Clear data
  document.getElementById('clearData').addEventListener('click', clearData);

  // Settings toggles
  document
    .getElementById('notificationsToggle')
    .addEventListener('click', () => {
      toggleSetting('showNotifications');
    });

  document.getElementById('autoSaveToggle').addEventListener('click', () => {
    toggleSetting('autoSave');
  });
}

// Toggle setting
async function toggleSetting(settingName) {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    settings[settingName] = !settings[settingName];

    await chrome.storage.local.set({ settings });

    // Update UI
    const toggle = document.getElementById(settingName + 'Toggle');
    toggle.classList.toggle('active', settings[settingName]);
  } catch (error) {
    console.error('Error toggling setting:', error);
  }
}

// Export data as JSON
async function exportData() {
  try {
    const result = await chrome.storage.local.get(['savedUrls']);
    const urls = result.savedUrls || [];

    if (urls.length === 0) {
      alert('No data to export');
      return;
    }

    const dataStr = JSON.stringify(urls, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-tracker-export-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data');
  }
}

// Clear all data
async function clearData() {
  if (
    confirm(
      'Are you sure you want to clear all saved URLs? This action cannot be undone.'
    )
  ) {
    try {
      await chrome.storage.local.set({ savedUrls: [] });
      await loadStats(); // Refresh stats
      alert('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data');
    }
  }
}
