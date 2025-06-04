let isCapturing = false;
let startX, startY, endX, endY;
let overlay;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    startScreenCapture();
  }
});

function startScreenCapture() {
  if (isCapturing) return;
  
  isCapturing = true;
  
  // Create overlay
  overlay = document.createElement('div');
  overlay.className = 'screen-capture-overlay';
  overlay.innerHTML = `
    <div class="capture-instructions">
      Drag to select area to capture and lookup
    </div>
    <div class="selection-box"></div>
  `;
  
  document.body.appendChild(overlay);
  
  let isSelecting = false;
  const selectionBox = overlay.querySelector('.selection-box');
  
  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  });
  
  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    
    endX = e.clientX;
    endY = e.clientY;
    
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });
  
  overlay.addEventListener('mouseup', async (e) => {
    if (!isSelecting) return;
    
    isSelecting = false;
    endX = e.clientX;
    endY = e.clientY;
    
    // Calculate selection area
    const selection = {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    };
    
    // Only proceed if selection is large enough
    if (selection.width > 10 && selection.height > 10) {
      await captureAndLookup(selection);
    }
    
    cleanup();
  });
  
  // ESC key to cancel
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

async function captureAndLookup(selection) {
  try {
    // Take a screenshot of the entire viewport
    const canvas = await html2canvas(document.body, {
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      useCORS: true
    });
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      // Create a form data object for Google Images
      const formData = new FormData();
      formData.append('encoded_image', blob);
      
      // Open Google Lens/Images search in new tab
      const dataUrl = canvas.toDataURL();
      const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(dataUrl)}`;
      
      // Fallback to Google Images reverse search
      window.open('https://images.google.com/', '_blank');
      
      // Show success message
      showNotification('Screenshot captured! Google Images opened for lookup.');
    });
    
  } catch (error) {
    console.error('Capture failed:', error);
    showNotification('Capture failed. Try again.');
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'capture-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function cleanup() {
  isCapturing = false;
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

// Inject html2canvas library
if (!window.html2canvas) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(script);
}
