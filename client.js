(function() {
    // API Configuration
    const API_ENDPOINT = 'https://am-alpha-l91ilpkeu-anthromade.vercel.app/api/badge/render';
    
    // Get configuration from script URL or data attributes
    const script = document.currentScript;
    const identifier = script.getAttribute('data-identifier');
    
    if (!identifier) {
      console.error('Verified Badge: Missing required data-identifier attribute');
      return;
    }
  
    // Prevent multiple initializations
    if (window.verifiedBadgeInitialized) return;
    window.verifiedBadgeInitialized = true;
  
    // Main function to check verification and render badge
    async function checkVerification() {
      try {
        const container = document.querySelector('[data-verified-badge]');
        if (!container) {
          console.warn('Verified Badge: Container not found. Add a div with data-verified-badge attribute.');
          return;
        }
  
        // Build API URL with query parameters
        const url = encodeURIComponent(window.location.href);
        const externalId = encodeURIComponent(identifier);
        const apiUrl = `${API_ENDPOINT}?external_id=${externalId}&url=${url}`;
        
        // Set timeout for request (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
  
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle different response codes
        if (response.ok) {
          const html = await response.text();
          container.innerHTML = html;
        } else if (response.status === 429) {
          // Rate limited - retry once after 60 seconds
          console.warn('Verified Badge: Rate limited. Retrying in 60 seconds...');
          setTimeout(checkVerification, 60000);
        } else if (response.status === 403) {
          // Badge limit exceeded - silent fail
          console.warn('Verified Badge: Badge unavailable (limit reached)');
        } else {
          // Other errors - silent fail
          console.error('Verified Badge: Failed to load badge', response.status);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Verified Badge: Request timeout');
        } else {
          console.error('Verified Badge: Error checking verification:', error);
        }
      }
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkVerification);
    } else {
      checkVerification();
    }
  })();