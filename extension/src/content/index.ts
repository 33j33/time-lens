/**
 * Time Lens Content Script Entry Point
 * 
 * FLOW:
 * 1. User selects text → if parseable, show panel in top-right corner
 * 2. Panel stays visible while selection is valid
 * 3. Panel is draggable so user can move it out of the way
 */

import { DEFAULT_SETTINGS } from '@/shared/constants';
import { isEnabledForOrigin } from '@/shared/origin-settings';
import type { SelectionSnapshot, Settings, ParseResult } from '@/shared/types';
import { startSelectionTracking, stopSelectionTracking, registerSelectionChangeCallback } from './selection';
import { createPanel } from './panel/panel';
import { parseTime } from './parse/chrono';
import { convertTime } from './parse/convert';
import { loadSettings, saveSettings, onSettingsChange as onStorageSettingsChange } from '@/shared/storage';

// ============================================================================
// Injection Guard - Prevent duplicate script execution
// ============================================================================

// Check if already injected to prevent duplicate initialization
declare global {
  interface Window {
    __TIME_LENS_INJECTED__?: boolean;
  }
}

if (window.__TIME_LENS_INJECTED__) {
  console.debug('[Time Lens] Content script already injected, skipping initialization');
  throw new Error('Time Lens already injected'); // Stop execution
}

// Mark as injected
window.__TIME_LENS_INJECTED__ = true;

// Current page origin
const currentOrigin = window.location.origin;

// ============================================================================
// State
// ============================================================================

let currentSnapshot: SelectionSnapshot | null = null;
let settings: Settings = { ...DEFAULT_SETTINGS };
let visible = false;

// Parse cache
let lastParsedVersion = -1;
let lastParseResult: ParseResult | null = null;
let lastParseFailureVersion = -1;

// Panel controller
let panel: ReturnType<typeof createPanel> | null = null;

// Abort controller for parsing
let parseAbortController: AbortController | null = null;

// Guard against multiple initializations
let initialized = false;
let storageUnsubscribe: (() => void) | null = null;

// ============================================================================
// Panel Management
// ============================================================================

function updatePanel(result: ParseResult): void {
  if (!panel) return;
  
  if (!visible) {
    panel.show(result);
    visible = true;
  } else {
    panel.updateResult(result);
  }
}

// ============================================================================
// Parsing
// ============================================================================

function tryParse(snapshot: SelectionSnapshot): ParseResult | null {
  if (snapshot.version === lastParsedVersion && lastParseResult) {
    return lastParseResult;
  }
  
  if (snapshot.version === lastParseFailureVersion) {
    return null;
  }
  
  if (parseAbortController) {
    parseAbortController.abort();
  }
  parseAbortController = new AbortController();
  
  const chronoResult = parseTime(snapshot.text, parseAbortController.signal);
  
  if (!chronoResult) {
    lastParseFailureVersion = snapshot.version;
    lastParsedVersion = -1;
    lastParseResult = null;
    return null;
  }
  
  const result = convertTime(chronoResult, settings, snapshot.sourceHint.origin);
  
  if (!result) {
    lastParseFailureVersion = snapshot.version;
    lastParsedVersion = -1;
    lastParseResult = null;
    return null;
  }
  
  lastParsedVersion = snapshot.version;
  lastParseResult = result;
  lastParseFailureVersion = -1;
  
  return result;
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleSelectionChange(snapshot: SelectionSnapshot | null): void {
  currentSnapshot = snapshot;
  
  if (snapshot) {
    const result = tryParse(snapshot);
    if (result) {
      updatePanel(result);
    }
  }
}



function handleSettingsUpdate(newSettings: Partial<Settings>): void {
  settings = { ...settings, ...newSettings };
  saveSettings(settings).catch(console.error);
  
  if (currentSnapshot && visible && panel) {
    // Update panel settings without rendering (we'll render after updating result)
    panel.updateSettings(settings, false);
    
    // Regenerate result with new settings
    lastParsedVersion = -1;
    const result = tryParse(currentSnapshot);
    if (result) {
      // This will render with both new settings and new result
      panel.updateResult(result);
    }
  } else if (panel) {
    // Just update settings if no active result (render this time)
    panel.updateSettings(settings, true);
  }
}

// ============================================================================
// Initialization & Cleanup
// ============================================================================

async function initialize(): Promise<void> {
  if (initialized) return;
  
  try {
    settings = await loadSettings();
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
  
  // Check if enabled for current site
  if (!isEnabledForOrigin(settings, currentOrigin)) return;
  
  initialized = true;
  
  panel = createPanel(settings, handleSettingsUpdate);
  
  startSelectionTracking();
  registerSelectionChangeCallback(handleSelectionChange);
}

function cleanup(): void {
  if (!initialized) return;
  
  stopSelectionTracking();
  
  if (panel) {
    panel.destroy();
    panel = null;
  }
  
  if (parseAbortController) {
    parseAbortController.abort();
    parseAbortController = null;
  }
  
  currentSnapshot = null;
  visible = false;
  lastParsedVersion = -1;
  lastParseResult = null;
  lastParseFailureVersion = -1;
  
  initialized = false;
}

// Set up storage change listener (only once)
storageUnsubscribe = onStorageSettingsChange((newSettings) => {
  // Check if disabled for current site
  if (!isEnabledForOrigin(newSettings, currentOrigin) && initialized) {
    cleanup();
    return;
  }
  
  // Check if enabled for current site but not initialized - re-initialize
  if (isEnabledForOrigin(newSettings, currentOrigin) && !initialized) {
    initialize();
    return;
  }
  
  settings = newSettings;
  
  if (currentSnapshot && visible && panel) {
    // Update panel settings without rendering (we'll render after updating result)
    panel.updateSettings(settings, false);
    
    // Regenerate result with new settings
    lastParsedVersion = -1;
    const result = tryParse(currentSnapshot);
    if (result) {
      // This will render with both new settings and new result
      panel.updateResult(result);
    }
  } else if (panel) {
    // Just update settings if no active result (render this time)
    panel.updateSettings(settings, true);
  }
});

// Initial initialization
initialize();
