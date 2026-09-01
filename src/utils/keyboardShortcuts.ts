export interface KeyboardShortcut {
  id: string;
  label: string;
  category: 'Navigation' | 'Actions' | 'Tools' | 'General';
  key: string; // The primary key (e.g. '1', 'g', 'e', 's', '/', '?', 'n', 'i', 'x', 'd', 'a', 'p')
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  description: string;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'tab_roster',
    label: 'Switch to Enrollment & Teams',
    category: 'Navigation',
    key: '1',
    description: 'Jump to student roster, group manager, and enrollment portal.'
  },
  {
    id: 'tab_rubric',
    label: 'Switch to Evaluation Rubric',
    category: 'Navigation',
    key: '2',
    description: 'Jump to multi-criteria rubric editor, presets, and scale configuration.'
  },
  {
    id: 'tab_analytics',
    label: 'Switch to Grade Analytics',
    category: 'Navigation',
    key: '3',
    description: 'Jump to score matrix, Johari perception analysis, and grade exports.'
  },

  // Tools & Modals
  {
    id: 'open_autogroup',
    label: 'Open Auto-Group Studio',
    category: 'Tools',
    key: 'g',
    description: 'Open intelligent team formation and diversity balancing studio.'
  },
  {
    id: 'open_email',
    label: 'Open Classroom Email Center',
    category: 'Tools',
    key: 'e',
    description: 'Open cohort email composer and evaluation link transmitter.'
  },
  {
    id: 'open_projector',
    label: 'Launch Live Projector View',
    category: 'Tools',
    key: 'p',
    description: 'Open full-screen classroom QR code and live submission hub.'
  },
  {
    id: 'open_settings',
    label: 'Open Settings Hub',
    category: 'Tools',
    key: 's',
    description: 'Open unified settings for email APIs, cloud sync, and shortcuts.'
  },

  // Actions
  {
    id: 'add_student',
    label: 'Add New Student',
    category: 'Actions',
    key: 'n',
    description: 'Open quick student enrollment modal.'
  },
  {
    id: 'import_roster',
    label: 'Open Import Wizard',
    category: 'Actions',
    key: 'i',
    description: 'Open CSV/Excel roster import wizard.'
  },
  {
    id: 'set_deadline',
    label: 'Set Submission Deadline',
    category: 'Actions',
    key: 'd',
    description: 'Open calendar deadline selector.'
  },
  {
    id: 'add_criterion',
    label: 'Add Rubric Criterion',
    category: 'Actions',
    key: 'a',
    description: 'Add a new custom evaluation criterion to active rubric.'
  },
  {
    id: 'export_data',
    label: 'Export Gradebook Data',
    category: 'Actions',
    key: 'x',
    description: 'Export class assessment results to CSV or Excel spreadsheet.'
  },

  // General
  {
    id: 'focus_search',
    label: 'Focus Search Bar',
    category: 'General',
    key: '/',
    description: 'Focus student search input instantly.'
  },
  {
    id: 'open_shortcuts_sheet',
    label: 'Keyboard Shortcuts Cheat-Sheet',
    category: 'General',
    key: '?',
    description: 'Display quick reference cheat-sheet for all shortcuts.'
  },
  {
    id: 'close_modal',
    label: 'Close Active Modal / Escape',
    category: 'General',
    key: 'Escape',
    description: 'Dismiss any open dialog, modal, or dropdown.'
  }
];

const SHORTCUTS_STORAGE_KEY = 'peerlens_custom_shortcuts_v1';

export function getStoredShortcuts(): KeyboardShortcut[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_KEYBOARD_SHORTCUTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with defaults to guarantee all IDs exist
      return DEFAULT_KEYBOARD_SHORTCUTS.map(def => {
        const found = parsed.find((p: KeyboardShortcut) => p.id === def.id);
        return found ? { ...def, key: found.key, modifiers: found.modifiers } : def;
      });
    }
  } catch (e) {
    console.error('Failed to load custom shortcuts:', e);
  }
  return DEFAULT_KEYBOARD_SHORTCUTS;
}

export function saveStoredShortcuts(shortcuts: KeyboardShortcut[]): void {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch (e) {
    console.error('Failed to save custom shortcuts:', e);
  }
}

export function resetStoredShortcuts(): KeyboardShortcut[] {
  try {
    localStorage.removeItem(SHORTCUTS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset shortcuts:', e);
  }
  return DEFAULT_KEYBOARD_SHORTCUTS;
}

/** Formats a key for human-readable display */
export function formatShortcutDisplay(key: string, modifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean }): string {
  const parts: string[] = [];
  if (modifiers?.ctrl) parts.push('Ctrl');
  if (modifiers?.alt) parts.push('Alt');
  if (modifiers?.shift) parts.push('Shift');

  if (key === ' ') {
    parts.push('Space');
  } else if (key === 'Escape') {
    parts.push('Esc');
  } else if (key.length === 1) {
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }

  return parts.join(' + ');
}
