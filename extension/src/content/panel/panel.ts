/**
 * Time Lens Panel Component
 * Fixed, draggable panel that shows parsed time info
 */

import type { ParseResult, Settings, FormatPreset } from '@/shared/types';
import { getCommonTimezones, getZoneLabel } from '../parse/timezone';
import { formatTime } from '../parse/format';
import { DateTime } from 'luxon';

import tokenStyles from '../tokens.css?inline';
import panelStyles from './panel.css?inline';
import { 
  PANEL_POSITION_KEY, 
  PANEL_DEFAULT_TOP, 
  PANEL_DEFAULT_RIGHT, 
  PANEL_VIEWPORT_PADDING 
} from '@/shared/constants';

export interface PanelController {
  show: (result: ParseResult) => void;
  hide: () => void;
  updateResult: (result: ParseResult) => void;
  updateSettings: (newSettings: Settings, shouldRender?: boolean) => void;
  getElement: () => HTMLElement;
  destroy: () => void;
}

interface Position {
  top: number;
  right: number;
}

function loadPosition(): Position {
  try {
    const saved = localStorage.getItem(PANEL_POSITION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { top: PANEL_DEFAULT_TOP, right: PANEL_DEFAULT_RIGHT };
}

function savePosition(pos: Position): void {
  try {
    localStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(pos));
  } catch {}
}

export function createPanel(
  initialSettings: Settings,
  onSettingsChange: (settings: Partial<Settings>) => void
): PanelController {
  const container = document.createElement('div');
  container.className = 'tl-root';
  container.setAttribute('data-visible', 'false');
  
  const shadow = container.attachShadow({ mode: 'closed' });
  
  const styleEl = document.createElement('style');
  styleEl.textContent = tokenStyles + '\n' + panelStyles;
  shadow.appendChild(styleEl);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'tl-container';
  wrapper.setAttribute('data-visible', 'false');
  shadow.appendChild(wrapper);
  
  const panel = document.createElement('div');
  panel.className = 'tl-panel';
  panel.setAttribute('data-state', 'hidden');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Time Lens');
  wrapper.appendChild(panel);
  
  let currentResult: ParseResult | null = null;
  let settings: Settings = initialSettings;
  let visible = false;
  let position = loadPosition();
  
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRight = 0;
  let dragStartTop = 0;

  document.documentElement.appendChild(container);
  
  // Show panel immediately with empty state
  renderEmpty();
  applyPosition();
  container.setAttribute('data-visible', 'true');
  wrapper.setAttribute('data-visible', 'true');
  requestAnimationFrame(() => {
    panel.setAttribute('data-state', 'visible');
  });
  
  function applyPosition(): void {
    panel.style.top = `${position.top}px`;
    panel.style.right = `${position.right}px`;
    panel.style.left = 'auto';
  }
  
  function clampPosition(): void {
    const rect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    position.top = Math.max(PANEL_VIEWPORT_PADDING, Math.min(position.top, viewportHeight - rect.height - PANEL_VIEWPORT_PADDING));
    position.right = Math.max(PANEL_VIEWPORT_PADDING, Math.min(position.right, viewportWidth - rect.width - PANEL_VIEWPORT_PADDING));
  }
  
  function handleDragStart(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartRight = position.right;
    dragStartTop = position.top;
    
    panel.style.transition = 'none';
    document.addEventListener('pointermove', handleDragMove);
    document.addEventListener('pointerup', handleDragEnd);
  }
  
  function handleDragMove(e: PointerEvent): void {
    if (!isDragging) return;
    
    const deltaX = dragStartX - e.clientX;
    const deltaY = e.clientY - dragStartY;
    
    position.right = dragStartRight + deltaX;
    position.top = dragStartTop + deltaY;
    
    clampPosition();
    applyPosition();
  }
  
  function handleDragEnd(): void {
    isDragging = false;
    panel.style.transition = '';
    document.removeEventListener('pointermove', handleDragMove);
    document.removeEventListener('pointerup', handleDragEnd);
    savePosition(position);
  }
  
  function renderEmpty(): void {
    // Ensure container is still in DOM
    if (!document.documentElement.contains(container)) {
      document.documentElement.appendChild(container);
    }
    
    panel.innerHTML = `
      <div class="tl-drag-handle" data-action="drag"></div>
      <div class="tl-empty">
        <span class="tl-empty-text">Select a date or time to convert</span>
      </div>
    `;
    
    const dragHandle = panel.querySelector('[data-action="drag"]');
    if (dragHandle) {
      dragHandle.addEventListener('pointerdown', handleDragStart as EventListener);
    }
  }
  
  function render(): void {
    // Ensure container is still in DOM
    if (!document.documentElement.contains(container)) {
      document.documentElement.appendChild(container);
    }
    
    if (!currentResult) {
      renderEmpty();
      return;
    }
    
    const { parsed, target } = currentResult;
    
    // Format Row 2: Parsed datetime in source timezone
    const parsedDt = parsed.sourceZone === 'local' 
      ? DateTime.fromISO(parsed.isoString)
      : DateTime.fromISO(parsed.isoString, { zone: parsed.sourceZone });
    const parsedFormatted = formatTime(parsedDt, settings.formatPreset, settings.customFormat);
    
    // Copy icon SVG
    const copyIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.5"/></svg>`;
    
    panel.innerHTML = `
      <div class="tl-drag-handle" data-action="drag"></div>
      
      <div class="tl-row tl-row--original">
        <div class="tl-row-label">Original:</div>
        <div class="tl-original-text">${parsed.originalText}</div>
      </div>
      
      <div class="tl-divider"></div>
      
      <div class="tl-row tl-row--parsed">
        <div class="tl-datetime">${parsedFormatted}</div>
        <div class="tl-timezone">${getZoneLabel(parsed.sourceZone)}</div>
        <button class="tl-copy-btn" data-action="copy-parsed" title="Copy parsed time">
          ${copyIcon}
        </button>
      </div>
      
      <div class="tl-divider"></div>
      
      <div class="tl-row tl-row--converted">
        <div class="tl-datetime">${target.formatted}</div>
        <select class="tl-zone-select" data-action="change-target">
          ${getCommonTimezones().map(zone => `
            <option value="${zone}" ${zone === settings.defaultTargetZone ? 'selected' : ''}>
              ${getZoneLabel(zone)}
            </option>
          `).join('')}
        </select>
        <button class="tl-copy-btn" data-action="copy-target" title="Copy converted time">
          ${copyIcon}
        </button>
      </div>
      
      <div class="tl-divider"></div>
      
      <div class="tl-format-controls">
        <span class="tl-format-label">Format:</span>
        <select class="tl-format-select" data-action="change-format">
          <option value="system" ${settings.formatPreset === 'system' ? 'selected' : ''}>System</option>
          <option value="short" ${settings.formatPreset === 'short' ? 'selected' : ''}>Short</option>
          <option value="long" ${settings.formatPreset === 'long' ? 'selected' : ''}>Long</option>
          <option value="iso" ${settings.formatPreset === 'iso' ? 'selected' : ''}>ISO 8601</option>
        </select>
      </div>
    `;
    
    attachEventHandlers();
  }
  
  function attachEventHandlers(): void {
    const dragHandle = panel.querySelector('[data-action="drag"]');
    if (dragHandle) {
      dragHandle.addEventListener('pointerdown', handleDragStart as EventListener);
    }
    
    // Copy parsed time (Row 2)
    panel.querySelectorAll('[data-action="copy-parsed"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentResult) {
          const { parsed } = currentResult;
          const parsedDt = parsed.sourceZone === 'local' 
            ? DateTime.fromISO(parsed.isoString)
            : DateTime.fromISO(parsed.isoString, { zone: parsed.sourceZone });
          const parsedFormatted = formatTime(parsedDt, settings.formatPreset, settings.customFormat);
          copyToClipboard(parsedFormatted, btn as HTMLElement);
        }
      });
    });
    
    // Copy converted time (Row 3)
    panel.querySelectorAll('[data-action="copy-target"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentResult) {
          copyToClipboard(currentResult.target.formatted, btn as HTMLElement);
        }
      });
    });
    
    // Change target timezone
    panel.querySelectorAll('[data-action="change-target"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        onSettingsChange({ defaultTargetZone: value });
      });
    });
    
    // Change format preset
    panel.querySelectorAll('[data-action="change-format"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as FormatPreset;
        onSettingsChange({ formatPreset: value });
      });
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
  
  function show(result: ParseResult): void {
    currentResult = result;
    visible = true;
    
    // Ensure container is still in DOM
    if (!document.documentElement.contains(container)) {
      document.documentElement.appendChild(container);
    }
    
    render();
    applyPosition();
    
    container.setAttribute('data-visible', 'true');
    wrapper.setAttribute('data-visible', 'true');
    
    requestAnimationFrame(() => {
      panel.setAttribute('data-state', 'visible');
    });
  }
  
  function hide(): void {
    if (!visible) return;
    
    visible = false;
    panel.setAttribute('data-state', 'hiding');
    
    setTimeout(() => {
      if (!visible) {
        container.setAttribute('data-visible', 'false');
        wrapper.setAttribute('data-visible', 'false');
        panel.setAttribute('data-state', 'hidden');
      }
    }, 150);
  }
  
  function updateResult(result: ParseResult): void {
    currentResult = result;
    render();
  }
  
  function updateSettings(newSettings: Settings, shouldRender = true): void {
    settings = newSettings;
    if (shouldRender) {
      render();
    }
  }
  
  function getElement(): HTMLElement {
    return container;
  }
  
  function destroy(): void {
    document.removeEventListener('pointermove', handleDragMove);
    document.removeEventListener('pointerup', handleDragEnd);
    container.remove();
  }

  
  return {
    show,
    hide,
    updateResult,
    updateSettings,
    getElement,
    destroy,
  };
}
