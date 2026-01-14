/**
 * Tooltip hover detection module
 * Tracks when pointer enters/leaves the tooltip element
 * 
 * SOLUTION 3: Auto-Dismiss with Hover Rescue
 * - Tooltip auto-hides after AUTO_DISMISS_DELAY unless user hovers over it
 * - Once user hovers, tooltip stays until they leave (with short grace period)
 */

/** Auto-dismiss delay when tooltip first appears (ms) */
const AUTO_DISMISS_DELAY = 4000;

/** Grace period when pointer leaves tooltip after hovering (ms) */
const LEAVE_GRACE_PERIOD = 300;

/** Tooltip element reference */
let tooltipElement: HTMLElement | null = null;

/** Auto-dismiss timer (for initial show) */
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

/** Leave timer (for when pointer leaves after hovering) */
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

/** Whether user has engaged (hovered over tooltip at least once) */
let userEngaged = false;

/** Callbacks for tooltip hover state changes */
type TooltipHoverCallback = (isHovering: boolean) => void;
const hoverCallbacks: Set<TooltipHoverCallback> = new Set();

/**
 * Handle pointer entering tooltip
 */
function handlePointerEnter(): void {
  // User engaged - cancel auto-dismiss
  userEngaged = true;
  
  if (autoDismissTimer !== null) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }
  
  if (leaveTimer !== null) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  
  // Notify: hovering over tooltip
  notifyCallbacks(true);
}

/**
 * Handle pointer leaving tooltip
 */
function handlePointerLeave(): void {
  // Only start leave timer if user has engaged
  // (otherwise auto-dismiss timer handles it)
  if (userEngaged) {
    leaveTimer = setTimeout(() => {
      leaveTimer = null;
      notifyCallbacks(false);
    }, LEAVE_GRACE_PERIOD);
  }
}

/**
 * Notify all callbacks of hover state change
 */
function notifyCallbacks(isHovering: boolean): void {
  hoverCallbacks.forEach((callback) => {
    try {
      callback(isHovering);
    } catch (error) {
      console.error('[Time Lens] Error in hover callback:', error);
    }
  });
}

/**
 * Set the tooltip element to track hover on
 */
export function setTooltipElement(element: HTMLElement | null): void {
  // Remove listeners from old element
  if (tooltipElement) {
    tooltipElement.removeEventListener('pointerenter', handlePointerEnter);
    tooltipElement.removeEventListener('pointerleave', handlePointerLeave);
  }
  
  tooltipElement = element;
  
  // Add listeners to new element
  if (tooltipElement) {
    tooltipElement.addEventListener('pointerenter', handlePointerEnter);
    tooltipElement.addEventListener('pointerleave', handlePointerLeave);
  }
}

/**
 * Subscribe to tooltip hover state changes
 * @returns Unsubscribe function
 */
export function onTooltipHover(callback: TooltipHoverCallback): () => void {
  hoverCallbacks.add(callback);
  
  return () => {
    hoverCallbacks.delete(callback);
  };
}

/**
 * Cancel all pending timers
 */
export function cancelCloseTimer(): void {
  if (autoDismissTimer !== null) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }
  if (leaveTimer !== null) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
}

/**
 * Start the auto-dismiss timer
 * Called when tooltip is first shown
 */
export function startAutoDismissTimer(): void {
  cancelCloseTimer();
  userEngaged = false;
  
  autoDismissTimer = setTimeout(() => {
    autoDismissTimer = null;
    // Only auto-dismiss if user hasn't engaged
    if (!userEngaged) {
      notifyCallbacks(false);
    }
  }, AUTO_DISMISS_DELAY);
}

/**
 * Cleanup hover tracking
 */
export function stopHoverTracking(): void {
  if (tooltipElement) {
    tooltipElement.removeEventListener('pointerenter', handlePointerEnter);
    tooltipElement.removeEventListener('pointerleave', handlePointerLeave);
    tooltipElement = null;
  }
  
  cancelCloseTimer();
  userEngaged = false;
  hoverCallbacks.clear();
}
