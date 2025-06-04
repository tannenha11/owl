// Background script for handling extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('Screen Lookup extension installed');
});

// Handle any background tasks if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureTab') {
    // This could be used for more advanced capture functionality
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      sendResponse({dataUrl: dataUrl});
    });
    return true; // Keep message channel open for async response
  }
});
