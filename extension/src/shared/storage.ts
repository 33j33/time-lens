/**
 * Storage module for Time Lens settings
 * Handles chrome.storage.sync read/write with defaults
 */

import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/shared/constants';

/**
 * Load settings from storage
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.sync.get(SETTINGS_KEY);
    const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
    
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    
    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  } catch (error) {
    console.error('[Time Lens] Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  } catch (error) {
    console.error('[Time Lens] Failed to save settings:', error);
    throw error;
  }
}

/**
 * Update specific settings fields
 */
export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const updated = { ...current, ...updates };
  await saveSettings(updated);
  return updated;
}

/**
 * Subscribe to settings changes
 * @returns Unsubscribe function
 */
export function onSettingsChange(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName !== 'sync') return;
    
    if (changes[SETTINGS_KEY]) {
      const newValue = changes[SETTINGS_KEY].newValue as Settings | undefined;
      if (newValue) {
        callback({
          ...DEFAULT_SETTINGS,
          ...newValue,
        });
      }
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}