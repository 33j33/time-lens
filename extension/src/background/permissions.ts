/**
 * Content script injection for Time Lens
 */

/**
 * Inject content scripts into a tab
 * Uses allFrames: true to support iframes
 */
export async function injectContentScripts(tabId: number): Promise<void> {
  try {
    // First inject the CSS
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: ['content/tooltip.css'],
    }).catch(() => {
      // CSS might not exist yet or injection failed - continue anyway
    });

    // Then inject the content script
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content/index.js'],
    });

    console.log('[Time Lens] Content scripts injected into tab', tabId);
  } catch (error) {
    // This can fail on restricted pages (chrome://, chrome-extension://, etc.)
    console.debug('[Time Lens] Could not inject scripts:', error);
    throw error;
  }
}
