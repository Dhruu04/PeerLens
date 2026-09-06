import type { FeatureToggles } from './featurePreferences';

export interface CustomViewProfile {
  id: string;
  name: string;
  createdAt: number;
  toggles: FeatureToggles;
  shortcutsEnabled: boolean;
}

const STORAGE_KEY_PROFILES = 'peer_custom_layout_profiles';
const STORAGE_KEY_SHORTCUTS_ENABLED = 'peerlens_shortcuts_enabled';
const EVENT_PROFILES_CHANGED = 'peerlens_custom_profiles_changed';
const EVENT_SHORTCUTS_ENABLED_CHANGED = 'peerlens_shortcuts_enabled_changed';

/**
 * Get whether keyboard shortcuts are enabled globally.
 * Default is FALSE (disabled by default as per user request).
 */
export const getShortcutsEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_SHORTCUTS_ENABLED);
    if (val !== null) {
      return val === 'true';
    }
  } catch (e) {
    console.warn('Failed to read shortcuts enabled state from storage:', e);
  }
  return false; // Disabled by default
};

/**
 * Set whether keyboard shortcuts are enabled globally.
 */
export const setShortcutsEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SHORTCUTS_ENABLED, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(EVENT_SHORTCUTS_ENABLED_CHANGED, { detail: enabled }));
  } catch (e) {
    console.error('Failed to save shortcuts enabled state to storage:', e);
  }
};

/**
 * Subscribe to changes in keyboard shortcuts enabled state.
 */
export const subscribeShortcutsEnabled = (callback: (enabled: boolean) => void): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<boolean>;
    callback(custom.detail !== undefined ? custom.detail : getShortcutsEnabled());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_SHORTCUTS_ENABLED) {
      callback(getShortcutsEnabled());
    }
  };
  window.addEventListener(EVENT_SHORTCUTS_ENABLED_CHANGED, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_SHORTCUTS_ENABLED_CHANGED, handler);
    window.removeEventListener('storage', storageHandler);
  };
};

/**
 * Retrieve all saved custom view profiles.
 */
export const getCustomProfiles = (): CustomViewProfile[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        return list.map((item: any) => ({
          id: item.id || `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: item.name || 'Custom View',
          createdAt: item.createdAt || Date.now(),
          toggles: { ...item.toggles },
          shortcutsEnabled: item.shortcutsEnabled !== undefined ? !!item.shortcutsEnabled : false
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load custom view profiles:', e);
  }
  return [];
};

/**
 * Save current toggles & shortcuts enabled state as a custom view profile.
 */
export const saveCustomProfile = (
  name: string,
  toggles: FeatureToggles,
  shortcutsEnabled: boolean
): CustomViewProfile | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const current = getCustomProfiles();
  const newProf: CustomViewProfile = {
    id: `prof_${Date.now()}`,
    name: trimmed,
    createdAt: Date.now(),
    toggles: { ...toggles },
    shortcutsEnabled: !!shortcutsEnabled
  };

  const updated = [newProf, ...current.filter(p => p.name.toLowerCase() !== trimmed.toLowerCase())].slice(0, 12);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_PROFILES_CHANGED, { detail: updated }));
  } catch (e) {
    console.error('Failed to save custom view profiles:', e);
  }
  return newProf;
};

/**
 * Delete a custom view profile by ID.
 */
export const deleteCustomProfile = (id: string): void => {
  const current = getCustomProfiles();
  const updated = current.filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_PROFILES_CHANGED, { detail: updated }));
  } catch (e) {
    console.error('Failed to delete custom view profile:', e);
  }
};

/**
 * Subscribe to changes in custom view profiles.
 */
export const subscribeCustomProfiles = (callback: (profiles: CustomViewProfile[]) => void): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<CustomViewProfile[]>;
    callback(custom.detail || getCustomProfiles());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_PROFILES) {
      callback(getCustomProfiles());
    }
  };
  window.addEventListener(EVENT_PROFILES_CHANGED, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_PROFILES_CHANGED, handler);
    window.removeEventListener('storage', storageHandler);
  };
};
