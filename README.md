# Airdrop Tracker Chrome Extension

A Chrome extension that adds a floating + button to capture URLs and site names, similar to a bookmark function but sends data to an external website.

## Features

- **Floating + Button**: Appears on the right side of any webpage
- **URL Capture**: Captures the current tab's URL
- **Site Name Extraction**: Intelligently extracts site names from page titles
- **Visual Feedback**: Button shows loading, success, and error states
- **Local Storage**: Temporarily stores captured URLs
- **Export Functionality**: Export saved URLs as JSON
- **Settings Panel**: Configure notifications and auto-save options
- **Saved URLs Page**: View and manage all captured URLs

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## Usage

1. Navigate to any webpage
2. Look for the floating + button on the right side
3. Click the button to capture the current URL and site name
4. The button will show visual feedback (loading → success/error)
5. Access saved URLs through the extension popup or the dedicated page

## File Structure

```
airdrop-tracker-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for background tasks
├── content.js            # Content script for floating button
├── styles.css            # CSS for floating button styling
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── saved-urls.html       # Saved URLs management page
├── saved-urls.js         # Saved URLs functionality
└── icons/                # Extension icons (placeholder)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## API Integration

The extension includes a placeholder for API integration in `background.js`. To connect to your website:

1. Update the `API_ENDPOINT` variable in `background.js`
2. Uncomment and modify the fetch request in the `sendToExternalAPI` function
3. Add any required authentication headers
4. Adjust the data payload format as needed

## Permissions

- `activeTab`: Access to current tab information
- `storage`: Local storage for saved URLs
- `scripting`: Inject content scripts
- `host_permissions`: Access to all URLs for the floating button

## Development

The extension uses:

- Manifest V3 (latest Chrome extension standard)
- Service Worker for background tasks
- Content Scripts for DOM manipulation
- Chrome Storage API for data persistence
- Modern CSS with gradients and animations

## Customization

- Modify `styles.css` to change button appearance
- Update `content.js` to change button behavior
- Customize the popup interface in `popup.html`
- Add new features in `background.js`

## Notes

- The floating button automatically adapts to different websites
- Site names are intelligently extracted from page titles
- All data is stored locally until API integration is configured
- The extension works on all websites except restricted pages (chrome://, etc.)
