/**
 * Time Lens Content Script Entry Point
 * 
 * FLOW:
 * 1. User selects text → tooltip shows immediately if parseable
 * 2. Tooltip stays for 4 seconds, or until user hovers over it
 * 3. Once hovered, tooltip stays until pointer leaves
 */

import { TooltipState, DEFAULT_SETTINGS } from '@/shared/types';
import type { SelectionSnapshot, Settings, ParseResult } from '@/shared/types';
import { startSelectionTracking, stopSelectionTracking, onSelectionChange } from './selection';
import { setTooltipElement, onTooltipHover, cancelCloseTimer, startAutoDismissTimer, stopHoverTracking } from './hover';
import { createTooltip } from './tooltip/tooltip';
import { parseTime } from '@/parse/chrono';
import { convertTime } from '@/parse/convert';
import { loadSettings, saveSettings, onSettingsChange as onStorageSettingsChange } from '@/options/storage';

// ============================================================================
// State
// ============================================================================

let state: TooltipState = TooltipState.IDLE;
let currentSnapshot: SelectionSnapshot | null = null;
let settings: Settings = { ...DEFAULT_SETTINGS };

// Parse cache
let lastParsedVersion = -1;
let lastParseResult: ParseResult | null = null;
let lastParseFailureVersion = -1;

// Tooltip controller
let tooltip: ReturnType<typeof createTooltip> | null = null;

// Abort controller for parsing
let parseAbortController: AbortController | null = null;

// Guard against multiple initializations
let initialized = false;

// ============================================================================
// State Machine
// ============================================================================

function setState(newState: TooltipState): void {
  if (state === newState) return;
  state = newState;
}

// ============================================================================
// Tooltip Management
// ============================================================================

function showTooltip(result: ParseResult, x: number, y: number): void {
  if (!tooltip) return;
  
  tooltip.show(result, x, y);
  setState(TooltipState.PREVIEW);
  startAutoDismissTimer();
}

function hideTooltip(): void {
  if (!tooltip) return;
  
  tooltip.hide();
  setState(TooltipState.IDLE);
  
  if (parseAbortController) {
    parseAbortController.abort();
    parseAbortController = null;
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
      showTooltip(result, snapshot.anchorX, snapshot.anchorY);
    } else if (state !== TooltipState.IDLE) {
      hideTooltip();
    }
  } else {
    hideTooltip();
  }
}

function handleTooltipHover(isHovering: boolean): void {
  if (isHovering) {
    cancelCloseTimer();
    if (state === TooltipState.PREVIEW) {
      setState(TooltipState.PINNED);
    }
  } else {
    hideTooltip();
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    cancelCloseTimer();
    hideTooltip();
  }
}

function handleScrollResize(): void {
  if (state !== TooltipState.IDLE) {
    cancelCloseTimer();
    hideTooltip();
  }
}

function handleVisibilityChange(): void {
  if (document.hidden && state !== TooltipState.IDLE) {
    cancelCloseTimer();
    hideTooltip();
  }
}

function handleSettingsUpdate(newSettings: Partial<Settings>): void {
  settings = { ...settings, ...newSettings };
  saveSettings(settings).catch(console.error);
  
  if (currentSnapshot && state !== TooltipState.IDLE) {
    lastParsedVersion = -1;
    const result = tryParse(currentSnapshot);
    if (result && tooltip) {
      tooltip.updateResult(result);
    }
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
  
  if (!settings.enabled) return;
  
  initialized = true;
  
  tooltip = createTooltip(settings, handleSettingsUpdate);
  setTooltipElement(tooltip.getElement());
  
  startSelectionTracking();
  onSelectionChange(handleSelectionChange);
  onTooltipHover(handleTooltipHover);
  
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('scroll', handleScrollResize, { capture: true, passive: true });
  window.addEventListener('resize', handleScrollResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  onStorageSettingsChange((newSettings) => {
    if (!newSettings.enabled && initialized) {
      cleanup();
      return;
    }
    
    settings = newSettings;
    if (currentSnapshot && state !== TooltipState.IDLE) {
      lastParsedVersion = -1;
      const result = tryParse(currentSnapshot);
      if (result && tooltip) {
        tooltip.updateResult(result);
      }
    }
  });
}

function cleanup(): void {
  if (!initialized) return;
  
  stopSelectionTracking();
  stopHoverTracking();
  
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('scroll', handleScrollResize, { capture: true });
  window.removeEventListener('resize', handleScrollResize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  if (tooltip) {
    tooltip.destroy();
    tooltip = null;
  }
  
  if (parseAbortController) {
    parseAbortController.abort();
    parseAbortController = null;
  }
  
  initialized = false;
}

window.addEventListener('beforeunload', cleanup);
initialize();
