/**
 * Origin-specific settings for Time Lens
 * Handles per-site enable/disable state
 */

import type { Settings } from '@/shared/types';
import { DEFAULT_ENABLED } from '@/shared/constants';

/**
 * Get the base origin from a URL (e.g., 'https://github.com')
 */
export function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

/**
 * Check if Time Lens is enabled for a specific origin
 */
export function isEnabledForOrigin(settings: Settings, origin: string): boolean {
  if (origin in settings.enabledSites) {
    return settings.enabledSites[origin];
  }
  return DEFAULT_ENABLED;
}

/**
 * Set enabled state for a specific origin
 * Only stores enabled sites; disabling removes the origin from the record
 */
export function setEnabledForOrigin(
  settings: Settings,
  origin: string,
  enabled: boolean
): Settings {
  if (enabled) {
    return {
      ...settings,
      enabledSites: {
        ...settings.enabledSites,
        [origin]: true,
      },
    };
  } else {
    // Remove the origin from the record (disabled is the default)
    const { [origin]: _, ...rest } = settings.enabledSites;
    return {
      ...settings,
      enabledSites: rest,
    };
  }
}
