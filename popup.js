document.getElementById('captureBtn').addEventListener('click', async () => {
  // Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Inject the capture overlay into the current tab
  await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
  
  // Close the popup
  window.close();
});
