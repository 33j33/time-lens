/**
 * Selection tracking module
 * Handles selectionchange events and creates SelectionSnapshot objects
 */

import type { SelectionSnapshot } from '@/shared/types';
import { MAX_SELECTION_LENGTH } from '@/shared/constants';

/** Current selection version (incremented on each meaningful change) */
let currentVersion = 0;

/** Track if pointer/mouse is currently pressed (during active selection) */
let isPointerDown = false;

/** Track if we need to process selection after pointer release */
let pendingSelectionChange = false;

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
 * Process the current selection and notify callbacks
 */
function processSelection(): void {
  const snapshot = createSnapshot();
  
  // Notify all callbacks
  callbacks.forEach((callback) => {
    try {
      callback(snapshot);
    } catch (error) {
      console.error('[Time Lens] Error in selection callback:', error);
    }
  });
  
  pendingSelectionChange = false;
}

/**
 * Handle selection change event
 * Only processes immediately if pointer is not down (not actively selecting)
 */
function handleSelectionChange(): void {
  if (isPointerDown) {
    // User is actively selecting - mark as pending but don't process yet
    pendingSelectionChange = true;
    return;
  }
  
  // Process immediately for keyboard selections or cleared selections
  processSelection();
}

/**
 * Handle pointer down - user started selecting
 */
function handlePointerDown(): void {
  isPointerDown = true;
  pendingSelectionChange = false;
}

/**
 * Handle pointer up - user finished selecting
 */
function handlePointerUp(): void {
  isPointerDown = false;
  
  // If there was a pending selection change, process it now
  if (pendingSelectionChange) {
    processSelection();
  }
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
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointerup', handlePointerUp);
}

/**
 * Stop listening for selection changes
 */
export function stopSelectionTracking(): void {
  document.removeEventListener('selectionchange', handleSelectionChange);
  document.removeEventListener('pointerdown', handlePointerDown);
  document.removeEventListener('pointerup', handlePointerUp);
  
  // Reset state
  isPointerDown = false;
  pendingSelectionChange = false;
}
