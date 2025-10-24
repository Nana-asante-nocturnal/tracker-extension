// Content script for injecting the floating + button
(function () {
  'use strict';

  // Flag to prevent multiple button creation
  let buttonCreated = false;

  // Check if button already exists to prevent duplicates
  if (document.getElementById('airdrop-tracker-button') || buttonCreated) {
    return;
  }

  // Create the floating button
  async function createFloatingButton() {
    // Prevent multiple button creation
    if (buttonCreated || document.getElementById('airdrop-tracker-button')) {
      return;
    }

    buttonCreated = true;

    const button = document.createElement('button');
    button.id = 'airdrop-tracker-button';
    button.className = 'airdrop-tracker-button';
    button.title = 'Save to Airdrop Tracker';

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'airdrop-tracker-tooltip';
    tooltip.textContent = 'Save to Airdrop Tracker';

    button.appendChild(tooltip);

    // Load saved position
    await loadButtonPosition(button);

    // Add click event listener
    button.addEventListener('click', handleButtonClick);

    // Add drag event listeners
    addDragListeners(button);

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

  // Load button position from storage
  async function loadButtonPosition(button) {
    try {
      const result = await chrome.storage.local.get(['buttonPosition']);
      const position = result.buttonPosition || { top: '50%', right: '0' };

      // Apply saved position
      button.style.top = position.top;
      button.style.right = position.right;
      button.style.left = position.left || 'auto';
      button.style.bottom = position.bottom || 'auto';

      // **UPDATED:** Add helper classes based on loaded position
      if (position.top !== '50%') {
        button.classList.add('is-positioned');
      }
      if (position.left === '0px' || position.right === 'auto') {
        button.classList.add('snapped-left');
      } else {
        button.classList.remove('snapped-left');
      }
    } catch (error) {
      console.error('Error loading button position:', error);
    }
  }

  // Save button position to storage
  async function saveButtonPosition(button) {
    try {
      const position = {
        top: button.style.top,
        right: button.style.right,
        left: button.style.left,
        bottom: button.style.bottom,
      };

      await chrome.storage.local.set({ buttonPosition: position });
    } catch (error) {
      console.error('Error saving button position:', error);
    }
  }

  // Snap button to the nearest edge
  function snapToEdge(button) {
    // **UPDATED:** Add this class to ensure transforms are off
    button.classList.add('is-positioned');

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = rect.width;
    const buttonHeight = rect.height;

    const currentLeft = rect.left;
    const currentTop = rect.top;

    // Calculate distances to left and right edges only
    const distanceToLeft = currentLeft;
    const distanceToRight = viewportWidth - currentLeft - buttonWidth;

    // Determine which edge is closest (left or right only)
    const distances = [
      { edge: 'left', distance: distanceToLeft },
      { edge: 'right', distance: distanceToRight },
    ];

    // Sort by distance and get the closest
    distances.sort((a, b) => a.distance - b.distance);
    const closestEdge = distances[0];

    // Always snap to the closest edge
    console.log(
      `Snapping to ${closestEdge.edge} edge (distance: ${closestEdge.distance})`
    );

    // Add visual feedback for snapping
    button.classList.add('snapping');
    setTimeout(() => button.classList.remove('snapping'), 300);

    if (closestEdge.edge === 'left') {
      // Snap to left edge
      button.style.left = '0px';
      button.style.right = 'auto';
      button.style.top = currentTop + 'px'; // Preserve vertical drag position
      button.style.bottom = 'auto';
      button.classList.add('snapped-left'); // **UPDATED:** Add left class
    } else if (closestEdge.edge === 'right') {
      // Snap to right edge
      button.style.left = 'auto';
      button.style.right = '0px';
      button.style.top = currentTop + 'px'; // Preserve vertical drag position
      button.style.bottom = 'auto';
      button.classList.remove('snapped-left'); // **UPDATED:** Remove left class
    }
  }

  // Add drag functionality to the button
  function addDragListeners(button) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // Mouse events
    button.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Touch events for mobile
    button.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDragTouch);

    function startDrag(e) {
      if (e.target.classList.contains('airdrop-tracker-tooltip')) return;
      e.preventDefault();

      isDragging = true;
      button.classList.add('dragging');
      // **UPDATED:** Add class to disable transform:translateY
      button.classList.add('is-positioned');

      const rect = button.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      // **UPDATED:** Set top to pixel value to prevent jump
      button.style.top = startTop + 'px';
      button.style.transform = 'none'; // Explicitly override transform during drag
    }

    function startDragTouch(e) {
      if (e.target.classList.contains('airdrop-tracker-tooltip')) return;
      e.preventDefault();

      isDragging = true;
      button.classList.add('dragging');
      // **UPDATED:** Add class to disable transform:translateY
      button.classList.add('is-positioned');

      const rect = button.getBoundingClientRect();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startLeft = rect.left;
      startTop = rect.top;

      // **UPDATED:** Set top to pixel value to prevent jump
      button.style.top = startTop + 'px';
      button.style.transform = 'none'; // Explicitly override transform during drag
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      // Constrain to viewport
      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      newLeft = Math.max(
        0,
        Math.min(newLeft, viewportWidth - buttonRect.width)
      );
      newTop = Math.max(
        0,
        Math.min(newTop, viewportHeight - buttonRect.height)
      );

      // Apply new position
      button.style.left = newLeft + 'px';
      button.style.top = newTop + 'px'; // Update vertical position as user drags
      button.style.right = 'auto';
      button.style.bottom = 'auto';
      button.style.transform = 'none'; // Keep transform off
    }

    function dragTouch(e) {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      // Constrain to viewport
      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      newLeft = Math.max(
        0,
        Math.min(newLeft, viewportWidth - buttonRect.width)
      );
      newTop = Math.max(
        0,
        Math.min(newTop, viewportHeight - buttonRect.height)
      );

      // Apply new position
      button.style.left = newLeft + 'px';
      button.style.top = newTop + 'px'; // Update vertical position as user drags
      button.style.right = 'auto';
      button.style.bottom = 'auto';
      button.style.transform = 'none'; // Keep transform off
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      button.classList.remove('dragging');
      button.style.transform = ''; // Remove inline override, let CSS classes handle it

      // Apply magnetic snapping to edges (left/right only)
      snapToEdge(button);

      // Save position
      saveButtonPosition(button);
    }

    function endDragTouch() {
      if (!isDragging) return;
      isDragging = false;
      button.classList.remove('dragging');
      button.style.transform = ''; // Remove inline override, let CSS classes handle it

      // Apply magnetic snapping to edges (left/right only)
      snapToEdge(button);

      // Save position
      saveButtonPosition(button);
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
      if (mutation.type === 'childList') {
        // Check if our button was actually removed
        const removedNodes = Array.from(mutation.removedNodes);
        const wasButtonRemoved = removedNodes.some(
          (node) =>
            node.id === 'airdrop-tracker-button' ||
            (node.querySelector &&
              node.querySelector('#airdrop-tracker-button'))
        );

        // Only create a new button if it was actually removed and we're not dragging
        if (
          wasButtonRemoved &&
          !document.querySelector('.airdrop-tracker-button.dragging')
        ) {
          buttonCreated = false; // Reset flag
          createFloatingButton();
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
