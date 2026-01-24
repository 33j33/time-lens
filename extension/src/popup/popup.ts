/**
 * Time Lens Popup
 * Compact settings UI with per-site enable/disable toggle
 */

import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/types';
import { isEnabledForOrigin, setEnabledForOrigin, getOrigin } from '@/shared/origin-settings';
import { loadSettings, saveSettings } from '@/shared/storage';

// All IANA timezones from the browser
const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

// Group timezones by region
function groupTimezonesByRegion(zones: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  
  for (const zone of zones) {
    const parts = zone.split('/');
    const region = parts.length >= 2 ? parts[0] : 'Other';
    
    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region)!.push(zone);
  }
  
  return groups;
}

function getZoneLabel(zone: string): string {
  if (zone === 'local') return 'Local';
  if (zone === 'UTC') return 'UTC';
  const parts = zone.split('/');
  return parts.length === 2 ? parts[1].replace(/_/g, ' ') : zone;
}

// DOM Elements
const messageEl = document.getElementById('message') as HTMLDivElement;
const toggleBtnEl = document.getElementById('toggle-btn') as HTMLButtonElement;
const toggleTextEl = toggleBtnEl.querySelector('.toggle-text') as HTMLSpanElement;
const currentSiteEl = document.getElementById('current-site') as HTMLSpanElement;
const targetZoneEl = document.getElementById('target-zone') as HTMLSelectElement;
const formatPresetEl = document.getElementById('format-preset') as HTMLSelectElement;

let currentSettings: Settings = { ...DEFAULT_SETTINGS };
let currentOrigin: string | null = null;

// ============================================================================
// Helpers
// ============================================================================

function showMessage(text: string, type: 'success' | 'error'): void {
  messageEl.textContent = text;
  messageEl.className = `message message--${type}`;
  messageEl.classList.remove('hidden');
  
  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 2500);
}

function populateSelect(select: HTMLSelectElement, includeLocal = true): void {
  select.innerHTML = '';
  
  // Add Local and UTC at the top
  if (includeLocal) {
    const localOption = document.createElement('option');
    localOption.value = 'local';
    localOption.textContent = 'Local';
    select.appendChild(localOption);
  }
  
  const utcOption = document.createElement('option');
  utcOption.value = 'UTC';
  utcOption.textContent = 'UTC';
  select.appendChild(utcOption);
  
  // Group all IANA timezones by region
  const grouped = groupTimezonesByRegion(ALL_TIMEZONES);
  const sortedRegions = [...grouped.keys()].sort();
  
  for (const region of sortedRegions) {
    const zones = grouped.get(region)!;
    const optgroup = document.createElement('optgroup');
    optgroup.label = region;
    
    zones.sort();
    
    for (const zone of zones) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = getZoneLabel(zone);
      optgroup.appendChild(option);
    }
    
    select.appendChild(optgroup);
  }
}

function getDisplayOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

function updateToggleUI(): void {
  if (!currentOrigin) {
    toggleBtnEl.classList.remove('btn--enabled');
    toggleTextEl.textContent = 'No site';
    currentSiteEl.textContent = '';
    toggleBtnEl.disabled = true;
    return;
  }
  
  toggleBtnEl.disabled = false;
  currentSiteEl.textContent = getDisplayOrigin(currentOrigin);
  
  const isEnabled = isEnabledForOrigin(currentSettings, currentOrigin);
  if (isEnabled) {
    toggleBtnEl.classList.add('btn--enabled');
    toggleTextEl.textContent = 'Enabled';
  } else {
    toggleBtnEl.classList.remove('btn--enabled');
    toggleTextEl.textContent = 'Disabled';
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleToggleClick(): Promise<void> {
  if (!currentOrigin) return;
  
  const isCurrentlyEnabled = isEnabledForOrigin(currentSettings, currentOrigin);
  const newSettings = setEnabledForOrigin(currentSettings, currentOrigin, !isCurrentlyEnabled);
  currentSettings = newSettings;
  await saveSettings(currentSettings);
  updateToggleUI();
}

async function handleTargetZoneChange(): Promise<void> {
  currentSettings.defaultTargetZone = targetZoneEl.value;
  await saveSettings(currentSettings);
}

async function handleFormatChange(): Promise<void> {
  currentSettings.formatPreset = formatPresetEl.value as Settings['formatPreset'];
  await saveSettings(currentSettings);
}

// ============================================================================
// Initialize
// ============================================================================

async function init(): Promise<void> {
  // Get current tab's origin
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      currentOrigin = getOrigin(tab.url);
    }
  } catch {
    currentOrigin = null;
  }
  
  // Load settings
  try {
    currentSettings = await loadSettings();
  } catch {
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  
  // Populate dropdowns
  populateSelect(targetZoneEl);
  
  // Set current values
  targetZoneEl.value = currentSettings.defaultTargetZone;
  formatPresetEl.value = currentSettings.formatPreset;
  
  // Update toggle UI
  updateToggleUI();
  
  // Attach event listeners
  toggleBtnEl.addEventListener('click', handleToggleClick);
  targetZoneEl.addEventListener('change', handleTargetZoneChange);
  formatPresetEl.addEventListener('change', handleFormatChange);
}

init();
