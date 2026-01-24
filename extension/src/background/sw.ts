/**
 * Time Lens Service Worker
 * Handles navigation-based injection for all sites when enabled
 */

import { injectContentScripts } from './permissions';
import { loadSettings } from '@/shared/storage';
import { isEnabledForOrigin, getOrigin } from '@/shared/origin-settings';

// ============================================================================
// Navigation Handler (inject on enabled sites)
// ============================================================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when page finishes loading
  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Skip restricted URLs
  if (tab.url.startsWith('chrome://') || 
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('about:')) {
    return;
  }

  try {
    // Check if Time Lens is enabled for this site
    const settings = await loadSettings();
    const origin = getOrigin(tab.url);
    
    if (isEnabledForOrigin(settings, origin)) {
      await injectContentScripts(tabId);
    }
  } catch (error) {
    // Silently fail for restricted pages
    console.debug('[Time Lens] Could not inject on tab update:', error);
  }
});

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get('settings').then(({ settings }) => {
      sendResponse({ success: true, data: settings });
    });
    return true; // Keep channel open for async response
  }
});
