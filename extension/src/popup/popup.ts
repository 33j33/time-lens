/**
 * Time Lens Popup
 * Compact settings UI with global enable/disable toggle
 */

import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/types';
import { loadSettings, saveSettings } from '@/options/storage';

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
const sourceZoneEl = document.getElementById('source-zone') as HTMLSelectElement;
const primaryZoneEl = document.getElementById('primary-zone') as HTMLSelectElement;
const formatPresetEl = document.getElementById('format-preset') as HTMLSelectElement;
const targetZonesEl = document.getElementById('target-zones') as HTMLDivElement;
const addZoneSelectEl = document.getElementById('add-zone-select') as HTMLSelectElement;
const addZoneBtnEl = document.getElementById('add-zone-btn') as HTMLButtonElement;

let currentSettings: Settings = { ...DEFAULT_SETTINGS };

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

function renderTargetZones(): void {
  if (currentSettings.targetZones.length === 0) {
    targetZonesEl.innerHTML = '<span style="color: var(--muted); font-size: 11px;">No zones added</span>';
    return;
  }
  
  targetZonesEl.innerHTML = currentSettings.targetZones.map(zone => `
    <span class="zone-tag" data-zone="${zone}">
      ${getZoneLabel(zone)}
      <button class="zone-tag-remove" data-zone="${zone}" title="Remove">&times;</button>
    </span>
  `).join('');
  
  // Attach remove handlers
  targetZonesEl.querySelectorAll('.zone-tag-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const zone = (e.target as HTMLButtonElement).dataset.zone!;
      currentSettings.targetZones = currentSettings.targetZones.filter(z => z !== zone);
      await saveSettings(currentSettings);
      renderTargetZones();
      updatePrimaryZoneOptions();
    });
  });
}

function updatePrimaryZoneOptions(): void {
  const currentValue = primaryZoneEl.value;
  primaryZoneEl.innerHTML = '';
  
  // Always include local
  const localOption = document.createElement('option');
  localOption.value = 'local';
  localOption.textContent = 'Local';
  primaryZoneEl.appendChild(localOption);
  
  // Add target zones
  currentSettings.targetZones.forEach(zone => {
    if (zone === 'local') return;
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = getZoneLabel(zone);
    primaryZoneEl.appendChild(option);
  });
  
  // Restore selection if still valid
  if ([...primaryZoneEl.options].some(o => o.value === currentValue)) {
    primaryZoneEl.value = currentValue;
  } else {
    primaryZoneEl.value = 'local';
  }
}

function updateToggleUI(): void {
  if (currentSettings.enabled) {
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
  currentSettings.enabled = !currentSettings.enabled;
  await saveSettings(currentSettings);
  updateToggleUI();
  
  if (currentSettings.enabled) {
    showMessage('Time Lens enabled', 'success');
  } else {
    showMessage('Time Lens disabled', 'success');
  }
}

async function handleSourceZoneChange(): Promise<void> {
  currentSettings.defaultSourceZone = sourceZoneEl.value;
  await saveSettings(currentSettings);
}

async function handlePrimaryZoneChange(): Promise<void> {
  currentSettings.primaryTargetZone = primaryZoneEl.value;
  await saveSettings(currentSettings);
}

async function handleFormatChange(): Promise<void> {
  currentSettings.formatPreset = formatPresetEl.value as Settings['formatPreset'];
  await saveSettings(currentSettings);
}

async function handleAddZone(): Promise<void> {
  const zone = addZoneSelectEl.value;
  if (currentSettings.targetZones.includes(zone)) {
    showMessage('Zone already added', 'error');
    return;
  }
  
  currentSettings.targetZones.push(zone);
  await saveSettings(currentSettings);
  renderTargetZones();
  updatePrimaryZoneOptions();
}

// ============================================================================
// Initialize
// ============================================================================

async function init(): Promise<void> {
  // Load settings
  try {
    currentSettings = await loadSettings();
  } catch {
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  
  // Populate dropdowns
  populateSelect(sourceZoneEl);
  populateSelect(addZoneSelectEl);
  
  // Set current values
  sourceZoneEl.value = currentSettings.defaultSourceZone;
  formatPresetEl.value = currentSettings.formatPreset;
  
  // Render target zones and update primary options
  renderTargetZones();
  updatePrimaryZoneOptions();
  primaryZoneEl.value = currentSettings.primaryTargetZone;
  
  // Update toggle UI
  updateToggleUI();
  
  // Attach event listeners
  toggleBtnEl.addEventListener('click', handleToggleClick);
  sourceZoneEl.addEventListener('change', handleSourceZoneChange);
  primaryZoneEl.addEventListener('change', handlePrimaryZoneChange);
  formatPresetEl.addEventListener('change', handleFormatChange);
  addZoneBtnEl.addEventListener('click', handleAddZone);
}

init();
