/**
 * Anthromade Verified Badge Script v1.0
 * 
 * Automatically loads and renders verified creator badges on any page.
 * 
 * Usage:
 * 1. Add badge element: <div data-verified-badge data-identifier="EXTERNAL_ID"></div>
 * 2. Include this script: <script src="https://cdn.anthromade.com/badge-v1.js" async></script>
 */

(function() {
    'use strict';
  
    // ============================================================================
    // Configuration
    // ============================================================================
    
    const CONFIG = {
      apiEndpoint: 'https://am-alpha-clu0wkocc-anthromade.vercel.app/api/badge/render',
      bypassToken: 'nfFWhzTsutwMsqKGE4Yx4dmJlriFIwg3', // Vercel protection bypass
      requestTimeout: 5000, // 5 seconds
      retryDelay: 60000, // 1 minute for rate limit retries
      maxRetries: 1, // Only retry once on 429
    };
  
    // ============================================================================
    // Prevent Multiple Initializations
    // ============================================================================
    
    if (window.verifiedBadgeInitialized) {
      console.log('[Anthromade Badge] Already initialized, skipping...');
      return;
    }
    window.verifiedBadgeInitialized = true;
  
    // ============================================================================
    // State Management
    // ============================================================================
    
    const state = {
      retryCount: 0,
    };
  
    // ============================================================================
    // Main Badge Verification Function
    // ============================================================================
    
    async function checkVerification() {
      try {
        // Find the badge container
        const container = document.querySelector('[data-verified-badge]');
        if (!container) {
          console.warn('[Anthromade Badge] Container element not found. Add <div data-verified-badge data-identifier="YOUR_ID"></div>');
          return;
        }
  
        // Get the external identifier from data attribute
        const identifier = container.getAttribute('data-identifier');
        if (!identifier) {
          console.error('[Anthromade Badge] Missing data-identifier attribute on badge container.');
          container.innerHTML = '<div style="color: #999; font-size: 12px;">Badge configuration error</div>';
          return;
        }
  
        // Build API URL with query parameters
        const currentUrl = encodeURIComponent(window.location.href);
        const externalId = encodeURIComponent(identifier);
        const apiUrl = `${CONFIG.apiEndpoint}?external_id=${externalId}&url=${currentUrl}&x-vercel-protection-bypass=${CONFIG.bypassToken}`;
  
        console.log('[Anthromade Badge] Requesting badge for:', {
          externalId: identifier,
          url: window.location.href,
        });
  
        // Set up request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
  
        // Make the API request (simple GET - no custom headers to avoid preflight)
        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: controller.signal,
        });
  
        clearTimeout(timeoutId);
  
        // Handle response based on status code
        await handleResponse(response, container);
  
      } catch (error) {
        handleError(error);
      }
    }
  
    // ============================================================================
    // Response Handler
    // ============================================================================
    
    async function handleResponse(response, container) {
      // Success - Badge HTML received
      if (response.ok) {
        const html = await response.text();
        container.innerHTML = html;
        console.log('[Anthromade Badge] Badge rendered successfully');
        return;
      }
  
      // Rate Limited - Retry once after delay
      if (response.status === 429) {
        console.warn('[Anthromade Badge] Rate limited. Retrying in 60 seconds...');
        
        if (state.retryCount < CONFIG.maxRetries) {
          state.retryCount++;
          setTimeout(checkVerification, CONFIG.retryDelay);
        } else {
          console.error('[Anthromade Badge] Max retries reached. Badge unavailable.');
          container.innerHTML = '';
        }
        return;
      }
  
      // Badge Limit Exceeded - Silent fail
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.warn('[Anthromade Badge] Badge unavailable:', data.error || 'Limit exceeded');
        container.innerHTML = '';
        return;
      }
  
      // Bad Request - Show error in development
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        console.error('[Anthromade Badge] Bad request:', data.error);
        container.innerHTML = '';
        return;
      }
  
      // Other Errors - Silent fail
      console.error('[Anthromade Badge] Failed to load badge. Status:', response.status);
      container.innerHTML = '';
    }
  
    // ============================================================================
    // Error Handler
    // ============================================================================
    
    function handleError(error) {
      if (error.name === 'AbortError') {
        console.error('[Anthromade Badge] Request timeout - server took too long to respond');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('[Anthromade Badge] Network error - check internet connection');
      } else {
        console.error('[Anthromade Badge] Unexpected error:', error.message);
      }
    }
  
    // ============================================================================
    // Initialization
    // ============================================================================
    
    function init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkVerification);
      } else {
        // DOM already loaded, run immediately
        checkVerification();
      }
  
      console.log('[Anthromade Badge] Script initialized');
    }
  
    // ============================================================================
    // Start
    // ============================================================================
    
    init();
  
    // ============================================================================
    // Public API (optional - for manual control)
    // ============================================================================
    
    window.AnthromadeBadge = {
      version: '1.0.0',
      reload: checkVerification,
      config: CONFIG,
    };
  
  })();