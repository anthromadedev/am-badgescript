/**
 * Anthromade Verified Badge Script v2.0 (Batch)
 * 
 * Automatically loads and renders verified creator badges on any page.
 * Supports multiple badges per page with a single API request.
 * 
 * Usage:
 * 1. Add badge elements: <div data-verified-badge data-identifier="EXTERNAL_ID"></div>
 * 2. Include this script: <script src="https://cdn.anthromade.com/badge-v1.js" async></script>
 */

(function() {
    'use strict';
  
    // ============================================================================
    // Configuration
    // ============================================================================
    
    const CONFIG = {
      apiEndpoint: 'https://am-alpha-qpehx8zo8-anthromade.vercel.app/api/badge/render',
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
    // Main Badge Verification Function (Batch)
    // ============================================================================
    
    async function checkVerification() {
      try {
        // Find ALL badge containers
        const containers = document.querySelectorAll('[data-verified-badge]');
        
        if (containers.length === 0) {
          console.warn('[Anthromade Badge] No badge containers found. Add <div data-verified-badge data-identifier="YOUR_ID"></div>');
          return;
        }
  
        console.log(`[Anthromade Badge] Found ${containers.length} badge container(s)`);
  
        // Collect identifiers and validate
        const badgeRequests = [];
        const containerMap = new Map(); // Map identifier to container element(s)
  
        containers.forEach((container, index) => {
          const identifier = container.getAttribute('data-identifier');
          
          if (!identifier) {
            console.error('[Anthromade Badge] Missing data-identifier attribute on badge container', container);
            container.innerHTML = '<div style="color: #999; font-size: 12px;">Badge configuration error</div>';
            return;
          }
  
          // Add to requests array (avoid duplicates)
          if (!badgeRequests.includes(identifier)) {
            badgeRequests.push(identifier);
          }
  
          // Map identifier to container(s) - there might be multiple containers with same ID
          if (!containerMap.has(identifier)) {
            containerMap.set(identifier, []);
          }
          containerMap.get(identifier).push(container);
        });
  
        if (badgeRequests.length === 0) {
          console.error('[Anthromade Badge] No valid identifiers found');
          return;
        }
  
        console.log('[Anthromade Badge] Requesting badges for:', {
          identifiers: badgeRequests,
          url: window.location.href,
          count: badgeRequests.length,
        });
  
        // Build API URL with bypass token
        const apiUrl = `${CONFIG.apiEndpoint}?x-vercel-protection-bypass=${CONFIG.bypassToken}`;
  
        // Set up request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
  
        // Make batch POST request
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            external_ids: badgeRequests,
            url: window.location.href,
          }),
          signal: controller.signal,
        });
  
        clearTimeout(timeoutId);
  
        // Handle response based on status code
        await handleBatchResponse(response, containerMap);
  
      } catch (error) {
        handleError(error);
      }
    }
  
    // ============================================================================
    // Batch Response Handler
    // ============================================================================
    
    async function handleBatchResponse(response, containerMap) {
      // Success - Batch badge response received
      if (response.ok) {
        const data = await response.json();
        
        // Response format: { badges: [{ external_id, html, error? }] }
        if (!data.badges || !Array.isArray(data.badges)) {
          console.error('[Anthromade Badge] Invalid response format:', data);
          return;
        }
  
        console.log(`[Anthromade Badge] Received ${data.badges.length} badge result(s)`);
  
        // Distribute HTML to containers
        data.badges.forEach(badge => {
          const containers = containerMap.get(badge.external_id);
          
          if (!containers) {
            console.warn('[Anthromade Badge] No container found for identifier:', badge.external_id);
            return;
          }
  
          if (badge.error) {
            // Silent fail - just log the error
            console.warn(`[Anthromade Badge] Badge failed for ${badge.external_id}:`, badge.error);
            containers.forEach(container => {
              container.innerHTML = '';
            });
          } else if (badge.html) {
            // Success - render badge in all containers with this ID
            containers.forEach(container => {
              container.innerHTML = badge.html;
            });
            console.log(`[Anthromade Badge] Rendered badge for ${badge.external_id} in ${containers.length} container(s)`);
          }
        });
  
        return;
      }
  
      // Rate Limited - Retry once after delay
      if (response.status === 429) {
        console.warn('[Anthromade Badge] Rate limited. Retrying in 60 seconds...');
        
        if (state.retryCount < CONFIG.maxRetries) {
          state.retryCount++;
          setTimeout(checkVerification, CONFIG.retryDelay);
        } else {
          console.error('[Anthromade Badge] Max retries reached. Badges unavailable.');
          // Clear all containers
          containerMap.forEach(containers => {
            containers.forEach(container => {
              container.innerHTML = '';
            });
          });
        }
        return;
      }
  
      // Badge Limit Exceeded - Silent fail
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.warn('[Anthromade Badge] Badges unavailable:', data.error || 'Limit exceeded');
        containerMap.forEach(containers => {
          containers.forEach(container => {
            container.innerHTML = '';
          });
        });
        return;
      }
  
      // Bad Request - Show error in development
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        console.error('[Anthromade Badge] Bad request:', data.error);
        containerMap.forEach(containers => {
          containers.forEach(container => {
            container.innerHTML = '';
          });
        });
        return;
      }
  
      // Other Errors - Silent fail
      console.error('[Anthromade Badge] Failed to load badges. Status:', response.status);
      containerMap.forEach(containers => {
        containers.forEach(container => {
          container.innerHTML = '';
        });
      });
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
  
      console.log('[Anthromade Badge] Script initialized (batch mode)');
    }
  
    // ============================================================================
    // Start
    // ============================================================================
    
    init();
  
    // ============================================================================
    // Public API (optional - for manual control)
    // ============================================================================
    
    window.AnthromadeBadge = {
      version: '2.0.0',
      reload: checkVerification,
      config: CONFIG,
    };
  
  })();