import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA and offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Import Workbox only in production
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/sw.js');
    
    // Show update prompt when new service worker is available
    wb.addEventListener('waiting', () => {
      const updateNow = confirm(
        'A new version of KAEVA is available. Update now for the latest features?'
      );
      
      if (updateNow) {
        wb.addEventListener('controlling', () => {
          window.location.reload();
        });
        wb.messageSkipWaiting();
      }
    });
    
    // Log successful registration
    wb.register().then(() => {
      console.log('✓ Service worker registered - offline support enabled');
    }).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
