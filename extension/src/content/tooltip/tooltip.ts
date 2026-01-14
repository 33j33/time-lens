/**
 * Time Lens Tooltip Component
 * ShadowRoot-based tooltip with collapsed/expanded states
 */

import type { ParseResult, Settings, FormatPreset } from '@/shared/types';
import { getCommonTimezones, getZoneLabel } from '@/parse/timezone';
import { formatDate, formatTimeOnly } from '@/parse/format';
import { DateTime } from 'luxon';

// Load CSS as string (will be injected into shadow root)
import tooltipStyles from './tooltip.css?inline';
import tokenStyles from './tokens.css?inline';

/** Gap between selection and tooltip */
const SELECTION_GAP = 8;

/** Viewport padding to prevent tooltip from going off-screen */
const VIEWPORT_PADDING = 12;

export interface TooltipController {
  show: (result: ParseResult, anchorX: number, anchorY: number) => void;
  hide: () => void;
  updateResult: (result: ParseResult) => void;
  getElement: () => HTMLElement;
  destroy: () => void;
}

/**
 * Create the tooltip controller
 */
export function createTooltip(
  settings: Settings,
  onSettingsChange: (settings: Partial<Settings>) => void
): TooltipController {
  // Create container element
  const container = document.createElement('div');
  container.className = 'tl-root';
  container.setAttribute('data-visible', 'false');
  
  // Attach shadow root
  const shadow = container.attachShadow({ mode: 'closed' });
  
  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = tokenStyles + '\n' + tooltipStyles;
  shadow.appendChild(styleEl);
  
  // Create tooltip wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'tl-container';
  wrapper.setAttribute('data-visible', 'false');
  shadow.appendChild(wrapper);
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'tl-tooltip';
  tooltip.setAttribute('data-state', 'hidden');
  tooltip.setAttribute('role', 'tooltip');
  wrapper.appendChild(tooltip);
  
  // State
  let currentResult: ParseResult | null = null;
  let isExpanded = false;
  let visible = false;
  
  // Build tooltip content
  function render(): void {
    if (!currentResult) {
      tooltip.innerHTML = '';
      return;
    }
    
    const { parsed, local, primary, targets } = currentResult;
    
    // Parse the local time for hero display
    const localDt = DateTime.fromISO(local.isoString);
    const heroTime = formatTimeOnly(localDt, settings.formatPreset);
    const heroDate = formatDate(localDt, settings.formatPreset);
    
    tooltip.innerHTML = `
      <div class="tl-header">
        <span class="tl-label">Converted</span>
        <div class="tl-actions">
          <button class="tl-btn" data-action="copy-local" title="Copy local time">
            Copy Local
          </button>
          <button class="tl-btn tl-btn--accent" data-action="copy-primary" title="Copy primary zone time">
            Copy ${primary.label}
          </button>
        </div>
      </div>
      
      <div class="tl-hero">
        <div class="tl-hero-time">${heroTime}</div>
        <div class="tl-hero-date">${heroDate}</div>
      </div>
      
      <div class="tl-primary">
        <select class="tl-zone-select" data-action="change-primary">
          ${getCommonTimezones().map(zone => `
            <option value="${zone}" ${zone === settings.primaryTargetZone ? 'selected' : ''}>
              ${getZoneLabel(zone)}
            </option>
          `).join('')}
        </select>
        <span class="tl-primary-time">${primary.formatted}</span>
      </div>
      
      <div class="tl-context">
        <span class="tl-selection-preview" title="${parsed.originalText}">
          "${truncate(parsed.originalText, 40)}"
        </span>
        <span class="tl-source-chip">
          ${parsed.sourceZoneExplicit ? parsed.sourceZone : 'Assumed: ' + getZoneLabel(parsed.sourceZone)}
        </span>
      </div>
      
      <button class="tl-expand" aria-expanded="${isExpanded}" data-action="toggle-expand">
        <span>${isExpanded ? 'Hide zones' : 'Show all zones'}</span>
        <svg class="tl-expand-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="tl-zones" data-expanded="${isExpanded}">
        <ul class="tl-zone-list">
          ${targets.map(target => `
            <li class="tl-zone-item">
              <span class="tl-zone-name">${target.label}</span>
              <span class="tl-zone-time">${target.formatted}</span>
            </li>
          `).join('')}
        </ul>
        
        <div class="tl-format-controls">
          <span class="tl-format-label">Format:</span>
          <select class="tl-format-select" data-action="change-format">
            <option value="system" ${settings.formatPreset === 'system' ? 'selected' : ''}>System</option>
            <option value="short" ${settings.formatPreset === 'short' ? 'selected' : ''}>Short</option>
            <option value="long" ${settings.formatPreset === 'long' ? 'selected' : ''}>Long</option>
            <option value="iso" ${settings.formatPreset === 'iso' ? 'selected' : ''}>ISO 8601</option>
          </select>
        </div>
      </div>
    `;
    
    // Attach event handlers
    attachEventHandlers();
  }
  
  function attachEventHandlers(): void {
    // Copy buttons
    tooltip.querySelectorAll('[data-action="copy-local"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentResult) {
          copyToClipboard(currentResult.local.formatted, btn as HTMLElement);
        }
      });
    });
    
    tooltip.querySelectorAll('[data-action="copy-primary"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentResult) {
          copyToClipboard(currentResult.primary.formatted, btn as HTMLElement);
        }
      });
    });
    
    // Primary zone select
    tooltip.querySelectorAll('[data-action="change-primary"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        onSettingsChange({ primaryTargetZone: value });
      });
    });
    
    // Format select
    tooltip.querySelectorAll('[data-action="change-format"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as FormatPreset;
        onSettingsChange({ formatPreset: value });
      });
    });
    
    // Expand toggle
    tooltip.querySelectorAll('[data-action="toggle-expand"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = !isExpanded;
        render();
      });
    });
    
    // Prevent clicks from bubbling (keeps tooltip pinned)
    tooltip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }
  
  async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      button.setAttribute('data-copied', 'true');
      setTimeout(() => {
        button.removeAttribute('data-copied');
      }, 1500);
    } catch (error) {
      console.error('[Time Lens] Failed to copy:', error);
    }
  }
  
  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '…';
  }
  
  /**
   * Position tooltip below the selection anchor point
   * Flips above if not enough space below
   */
  function positionTooltip(anchorX: number, anchorY: number): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get tooltip dimensions
    const rect = tooltip.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 200;
    
    // Position below selection by default
    let left = anchorX;
    let top = anchorY + SELECTION_GAP;
    
    // Flip above if not enough space below
    if (top + height + VIEWPORT_PADDING > viewportHeight) {
      top = anchorY - height - SELECTION_GAP;
    }
    
    // Keep within horizontal bounds
    if (left + width + VIEWPORT_PADDING > viewportWidth) {
      left = viewportWidth - width - VIEWPORT_PADDING;
    }
    left = Math.max(VIEWPORT_PADDING, left);
    
    // Keep within vertical bounds
    top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - height - VIEWPORT_PADDING));
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  
  function show(result: ParseResult, anchorX: number, anchorY: number): void {
    currentResult = result;
    visible = true;
    
    render();
    positionTooltip(anchorX, anchorY);
    
    container.setAttribute('data-visible', 'true');
    wrapper.setAttribute('data-visible', 'true');
    
    // Trigger animation
    requestAnimationFrame(() => {
      tooltip.setAttribute('data-state', 'visible');
    });
  }
  
  function hide(): void {
    if (!visible) return;
    
    visible = false;
    tooltip.setAttribute('data-state', 'hiding');
    
    // Wait for animation to complete
    setTimeout(() => {
      if (!visible) {
        container.setAttribute('data-visible', 'false');
        wrapper.setAttribute('data-visible', 'false');
        tooltip.setAttribute('data-state', 'hidden');
      }
    }, 150);
  }
  
  function updateResult(result: ParseResult): void {
    currentResult = result;
    render();
  }
  
  function getElement(): HTMLElement {
    return container;
  }
  
  function destroy(): void {
    container.remove();
  }
  
  // Append to document
  document.documentElement.appendChild(container);
  
  return {
    show,
    hide,
    updateResult,
    getElement,
    destroy,
  };
}
