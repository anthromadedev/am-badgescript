(function() {
    // Get configuration from script URL
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
  
        const response = await fetch(
          `https://[YOUR-PROJECT-REF].supabase.co/functions/v1/verify-badge?pageUrl=${encodeURIComponent(window.location.href)}&identifier=${encodeURIComponent(identifier)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
  
        const data = await response.json();
  
        if (data.verified && data.badgeHtml) {
          container.innerHTML = data.badgeHtml;
        }
      } catch (error) {
        console.error('Verified Badge: Error checking verification:', error);
      }
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkVerification);
    } else {
      checkVerification();
    }
  })();