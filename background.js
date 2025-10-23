// Background service worker for Chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveUrl') {
    handleSaveUrl(request.data)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Handle saving URL to external service
async function handleSaveUrl(data) {
  try {
    console.log('Saving URL data:', data);

    // Store in local storage for now (you can replace this with your API call)
    const savedItems = (await chrome.storage.local.get(['savedUrls'])) || {
      savedUrls: [],
    };
    const urls = savedItems.savedUrls || [];

    // Check if URL already exists
    const existingIndex = urls.findIndex((item) => item.url === data.url);

    if (existingIndex >= 0) {
      // Update existing entry
      urls[existingIndex] = {
        ...urls[existingIndex],
        ...data,
        lastSaved: new Date().toISOString(),
      };
    } else {
      // Add new entry
      urls.push({
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        lastSaved: new Date().toISOString(),
      });
    }

    // Save to storage
    await chrome.storage.local.set({ savedUrls: urls });

    // TODO: Replace this with actual API call to your website
    await sendToExternalAPI(data);

    return { success: true, message: 'URL saved successfully' };
  } catch (error) {
    console.error('Error saving URL:', error);
    return { success: false, error: error.message };
  }
}

// Placeholder function for sending data to external API
async function sendToExternalAPI(data) {
  // This is a placeholder - replace with your actual API endpoint
  const API_ENDPOINT = 'https://your-website.com/api/save-url'; // Replace with your actual endpoint

  try {
    // Simulate API call (replace with actual fetch)
    console.log('Would send to API:', {
      endpoint: API_ENDPOINT,
      data: {
        url: data.url,
        title: data.title,
        siteName: data.siteName,
        domain: data.domain,
        timestamp: data.timestamp,
      },
    });

    // Uncomment and modify this when you have your actual API:
    /*
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        url: data.url,
        title: data.title,
        siteName: data.siteName,
        domain: data.domain,
        timestamp: data.timestamp
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
    */

    // For now, just simulate success
    return { success: true };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Airdrop Tracker extension installed');

    // Initialize storage
    chrome.storage.local.set({
      savedUrls: [],
      settings: {
        enabled: true,
        showNotifications: true,
      },
    });
  }
});

// Handle tab updates to potentially refresh the button
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script if needed
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ['content.js'],
      })
      .catch((error) => {
        // Ignore errors for restricted pages
        console.log('Could not inject script:', error);
      });
  }
});
