(function() {
    // API Configuration
    const API_ENDPOINT = 'https://am-alpha-c9rjwie8r-anthromade.vercel.app/api/badge/render';
    const BYPASS_TOKEN = 'nfFWhzTsutwMsqKGE4Yx4dmJlriFIwg3';
    
    // Prevent multiple initializations
    if (window.verifiedBadgeInitialized) return;
    window.verifiedBadgeInitialized = true;
  
    // Main function to check verification and render badge
    async function checkVerification() {
      try {
        // Find the badge container
        const container = document.querySelector('[data-verified-badge]');
        if (!container) {
          console.warn('Verified Badge: Container not found.');
          return;
        }
        
        // Get the identifier
        const identifier = container.getAttribute('data-identifier');
        if (!identifier) {
          console.error('Verified Badge: Missing data-identifier attribute.');
          return;
        }
  
        // Build API URL - No need to send the page URL anymore!
        const externalId = encodeURIComponent(identifier);
        const apiUrl = `${API_ENDPOINT}?external_id=${externalId}&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
        
        // Set timeout for request (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
  
        // Simple GET request - URL is automatically detected from referer header
        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle different response codes
        if (response.ok) {
          const html = await response.text();
          container.innerHTML = html;
          console.log('Badge rendered successfully');
        } else if (response.status === 429) {
          console.warn('Verified Badge: Rate limited. Retrying in 60 seconds...');
          setTimeout(checkVerification, 60000);
        } else if (response.status === 403) {
          console.warn('Verified Badge: Badge unavailable (limit reached)');
        } else {
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