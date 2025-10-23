// Content script for injecting the floating + button
(function () {
  'use strict';

  // Check if button already exists to prevent duplicates
  if (document.getElementById('airdrop-tracker-button')) {
    return;
  }

  // Create the floating button
  function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'airdrop-tracker-button';
    button.className = 'airdrop-tracker-button';
    button.title = 'Save to Airdrop Tracker';

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'airdrop-tracker-tooltip';
    tooltip.textContent = 'Save to Airdrop Tracker';

    button.appendChild(tooltip);

    // Add click event listener
    button.addEventListener('click', handleButtonClick);

    // Add hover events for tooltip
    button.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
    });

    button.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    // Append to body
    document.body.appendChild(button);
  }

  // Handle button click
  async function handleButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.target;
    const tooltip = button.querySelector('.airdrop-tracker-tooltip');

    // Set loading state
    button.classList.add('loading');
    button.classList.remove('success', 'error');
    tooltip.textContent = 'Saving...';

    try {
      // Get current page info directly from the page
      const url = window.location.href;
      const title = document.title;

      if (!url) {
        throw new Error('Unable to get current URL');
      }

      // Extract site name from title or URL
      const siteName = extractSiteName(title, url);

      // Prepare data to send
      const data = {
        url: url,
        title: title,
        siteName: siteName,
        timestamp: new Date().toISOString(),
        domain: new URL(url).hostname,
      };

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'saveUrl',
        data: data,
      });

      if (response.success) {
        // Success state
        button.classList.remove('loading');
        button.classList.add('success');
        tooltip.textContent = 'Saved successfully!';

        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove('success');
          tooltip.textContent = 'Save to Airdrop Tracker';
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Airdrop Tracker Error:', error);

      // Error state
      button.classList.remove('loading');
      button.classList.add('error');
      tooltip.textContent = 'Failed to save';

      // Reset after 3 seconds
      setTimeout(() => {
        button.classList.remove('error');
        tooltip.textContent = 'Save to Airdrop Tracker';
      }, 3000);
    }
  }

  // Extract site name from title or URL
  function extractSiteName(title, url) {
    try {
      // First try to get a clean site name from the title
      if (title && title.trim()) {
        // Remove common suffixes and clean up
        let cleanTitle = title
          .replace(/\s*[-|]\s*.*$/, '') // Remove everything after - or |
          .replace(/\s*:\s*.*$/, '') // Remove everything after :
          .replace(/\s*\(.*\)$/, '') // Remove parenthetical content
          .trim();

        if (cleanTitle.length > 0 && cleanTitle.length < 50) {
          return cleanTitle;
        }
      }

      // Fallback to domain name
      const urlObj = new URL(url);
      let domain = urlObj.hostname;

      // Remove www prefix
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      // Capitalize first letter
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (error) {
      console.error('Error extracting site name:', error);
      return 'Unknown Site';
    }
  }

  // Initialize the button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }

  // Re-inject button if page content changes (for SPAs)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'childList' &&
        !document.getElementById('airdrop-tracker-button')
      ) {
        createFloatingButton();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
