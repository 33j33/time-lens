/**
 * Selection tracking module
 * Handles selectionchange events and creates SelectionSnapshot objects
 */

import type { SelectionSnapshot } from '@/shared/types';
import { MAX_SELECTION_LENGTH, SELECTION_DEBOUNCE_DELAY } from '@/shared/constants';

/** Current selection version (incremented on each meaningful change) */
let currentVersion = 0;

/** Debounce timer */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Callback for selection changes */
type SelectionChangeCallback = (snapshot: SelectionSnapshot | null) => void;

/** Registered callbacks */
const callbacks: Set<SelectionChangeCallback> = new Set();

/**
 * Create a SelectionSnapshot from the current selection
 * Returns null if selection is invalid
 */
function createSnapshot(): SelectionSnapshot | null {
  const selection = window.getSelection();
  
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  
  const text = selection.toString().trim();
  if (!text) {
    return null;
  }
  
  currentVersion++;
  
  return {
    version: currentVersion,
    text: text.slice(0, MAX_SELECTION_LENGTH),
    sourceHint: {
      origin: window.location.origin,
    },
  };
}

/**
 * Handle selection change event
 */
function handleSelectionChange(): void {
  // Clear any pending debounce
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  
  // Debounce the actual processing
  debounceTimer = setTimeout(() => {
    const snapshot = createSnapshot();
    
    // Notify all callbacks
    callbacks.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('[Time Lens] Error in selection callback:', error);
      }
    });
  }, SELECTION_DEBOUNCE_DELAY);
}

/**
 * Subscribe to selection changes
 * @returns Unsubscribe function
 */
export function registerSelectionChangeCallback(callback: SelectionChangeCallback): () => void {
  callbacks.add(callback);
  
  return () => {
    callbacks.delete(callback);
  };
}

/**
 * Start listening for selection changes
 */
export function startSelectionTracking(): void {
  document.addEventListener('selectionchange', handleSelectionChange);
}

/**
 * Stop listening for selection changes
 */
export function stopSelectionTracking(): void {
  document.removeEventListener('selectionchange', handleSelectionChange);
  
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
