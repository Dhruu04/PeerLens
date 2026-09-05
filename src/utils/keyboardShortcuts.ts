export interface KeyboardShortcut {
  id: string;
  actionId: string; // References AVAILABLE_SHORTCUT_ACTIONS id
  label: string;
  category: 'Navigation' | 'Tools & Modals' | 'Roster & Teams' | 'Rubric & Scales' | 'Grading & Analytics' | 'Layout & Presets' | 'General' | 'Custom';
  key: string; // Primary key (e.g. '1', 'g', 'e', 's', '/', '?', 'k')
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  description: string;
  isCustom?: boolean;
  disabled?: boolean;
}

export interface ShortcutActionDefinition {
  id: string;
  label: string;
  category: 'Navigation' | 'Tools & Modals' | 'Roster & Teams' | 'Rubric & Scales' | 'Grading & Analytics' | 'Layout & Presets' | 'General';
  description: string;
  suggestedKey?: string;
  suggestedModifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean };
}

export const AVAILABLE_SHORTCUT_ACTIONS: ShortcutActionDefinition[] = [
  // --- Navigation ---
  {
    id: 'tab_hub',
    label: 'Classroom Hub Overview',
    category: 'Navigation',
    description: 'Return to the main Home Hub overview screen with 3 section cards.',
    suggestedKey: 'h'
  },
  {
    id: 'tab_roster',
    label: 'Section 1: Enrollment & Teams',
    category: 'Navigation',
    description: 'Jump to Section 1 student roster, group manager, and enrollment portal.',
    suggestedKey: '1'
  },
  {
    id: 'tab_rubric',
    label: 'Section 2: Review System',
    category: 'Navigation',
    description: 'Jump to Section 2 multi-criteria rubric editor and weight balance.',
    suggestedKey: '2'
  },
  {
    id: 'tab_analytics',
    label: 'Section 3: Grading & Analytics',
    category: 'Navigation',
    description: 'Jump to Section 3 WebPA calculation matrix, Johari perception & results.',
    suggestedKey: '3'
  },
  {
    id: 'tab_cloud',
    label: 'Cloud Sync & Data Settings',
    category: 'Navigation',
    description: 'Switch to Firebase cloud database sync and JSON workspace backup.',
    suggestedKey: '4'
  },
  {
    id: 'nav_prev_class',
    label: 'Previous Classroom',
    category: 'Navigation',
    description: 'Cycle to the previous enrolled classroom in your workspace.',
    suggestedKey: '['
  },
  {
    id: 'nav_next_class',
    label: 'Next Classroom',
    category: 'Navigation',
    description: 'Cycle to the next enrolled classroom in your workspace.',
    suggestedKey: ']'
  },
  {
    id: 'scroll_top',
    label: 'Scroll to Top of Page',
    category: 'Navigation',
    description: 'Quickly scroll the view smoothly back to the top of the dashboard.',
    suggestedKey: 'Home'
  },

  // --- Tools & Modals ---
  {
    id: 'focus_search',
    label: 'Quick Search & Command Finder',
    category: 'Tools & Modals',
    description: 'Launch spotlight command palette to search students, teams, or actions.',
    suggestedKey: 'k',
    suggestedModifiers: { ctrl: true }
  },
  {
    id: 'open_customize_view',
    label: 'Customize View (Modules Manager)',
    category: 'Tools & Modals',
    description: 'Open modular interface toggles to add or remove dashboard sections.',
    suggestedKey: 'v'
  },
  {
    id: 'open_guide_center',
    label: 'Academic Guidance Center',
    category: 'Tools & Modals',
    description: 'Open complete algorithm manuals, spotlight tours, and feature catalog.',
    suggestedKey: 'm'
  },
  {
    id: 'open_projector',
    label: 'Launch Live Projector View',
    category: 'Tools & Modals',
    description: 'Open full-screen privacy-safe auditorium display with live QR code.',
    suggestedKey: 'p'
  },
  {
    id: 'open_email',
    label: 'Classroom Email Center',
    category: 'Tools & Modals',
    description: 'Open cohort email composer and evaluation link transmitter.',
    suggestedKey: 'e'
  },
  {
    id: 'open_autogroup',
    label: 'AutoGroup Diversity Studio',
    category: 'Tools & Modals',
    description: 'Open intelligent team formation and combinatorial diversity balancer.',
    suggestedKey: 'g'
  },
  {
    id: 'open_qr_code',
    label: 'Mobile QR Enrollment Code',
    category: 'Tools & Modals',
    description: 'Display high-resolution QR code for student smartphone self-registration.',
    suggestedKey: 'q'
  },
  {
    id: 'open_settings',
    label: 'Settings Hub',
    category: 'Tools & Modals',
    description: 'Open preferences, cloud synchronization, and email API credentials.',
    suggestedKey: 's'
  },
  {
    id: 'open_shortcuts_sheet',
    label: 'Keyboard Shortcuts Cheat-Sheet',
    category: 'Tools & Modals',
    description: 'Display quick reference cheat-sheet for all active shortcuts.',
    suggestedKey: '?'
  },
  {
    id: 'open_tour',
    label: 'Interactive Guided Tour',
    category: 'Tools & Modals',
    description: 'Start step-by-step interactive walkthrough tailored to active modules.',
    suggestedKey: 't'
  },
  {
    id: 'open_student_portal',
    label: 'Launch Student Portal Simulator',
    category: 'Tools & Modals',
    description: 'Simulate smartphone peer evaluation experience from student perspective.',
    suggestedKey: 'j'
  },
  {
    id: 'toggle_theme',
    label: 'Toggle Dark / Light Theme',
    category: 'Tools & Modals',
    description: 'Quickly switch interface aesthetic between dark and light modes.',
    suggestedKey: 'f'
  },
  {
    id: 'toggle_quick_pill',
    label: 'Toggle Quick Action Pill',
    category: 'Tools & Modals',
    description: 'Toggle the floating all-in-one Quick Action Pill at the bottom of the window.',
    suggestedKey: 'q'
  },

  // --- Roster & Teams ---
  {
    id: 'new_class',
    label: 'Create New Classroom',
    category: 'Roster & Teams',
    description: 'Open modal to create a new classroom or course section.',
    suggestedKey: 'c'
  },
  {
    id: 'delete_class',
    label: 'Delete Active Classroom',
    category: 'Roster & Teams',
    description: 'Permanently remove the currently selected classroom after confirmation.',
    suggestedKey: 'Backspace',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'add_student',
    label: 'Add New Student',
    category: 'Roster & Teams',
    description: 'Open quick student manual enrollment dialog.',
    suggestedKey: 'n'
  },
  {
    id: 'import_roster',
    label: 'Smart Roster Import Wizard',
    category: 'Roster & Teams',
    description: 'Open CSV/Excel/PDF spreadsheet onboarding wizard with auto column mapping.',
    suggestedKey: 'i'
  },
  {
    id: 'populate_100_demo',
    label: 'Populate 100 Diverse Demo Students',
    category: 'Roster & Teams',
    description: 'Instantly load 100 sample students across 35+ countries and CEFR levels.',
    suggestedKey: 'd',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'toggle_duplicate_filter',
    label: 'Toggle Duplicate Student Filter',
    category: 'Roster & Teams',
    description: 'Filter roster table to only show duplicate email or name registrations.',
    suggestedKey: 'u'
  },
  {
    id: 'copy_class_id',
    label: 'Copy Classroom ID to Clipboard',
    category: 'Roster & Teams',
    description: 'Instantly copy active classroom code for syllabus or smartphone join.',
    suggestedKey: 'y'
  },
  {
    id: 'copy_portal_url',
    label: 'Copy Student Self-Enrollment Link',
    category: 'Roster & Teams',
    description: 'Copy direct URL for students to self-enroll in this course section.',
    suggestedKey: 'l',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'export_roster_csv',
    label: 'Export Student Roster (CSV)',
    category: 'Roster & Teams',
    description: 'Download current classroom enrollment roster as a CSV spreadsheet.',
    suggestedKey: 'o'
  },
  {
    id: 'download_sample_csv',
    label: 'Download Sample Roster Template (CSV)',
    category: 'Roster & Teams',
    description: 'Save example CSV template formatted for bulk student imports.',
    suggestedKey: 'k',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'clear_roster',
    label: 'Clear Entire Classroom Roster',
    category: 'Roster & Teams',
    description: 'Remove all enrolled students and their reviews from this class.',
    suggestedKey: 'Delete',
    suggestedModifiers: { alt: true }
  },

  // --- Rubric & Scales ---
  {
    id: 'add_criterion',
    label: 'Add Rubric Criterion',
    category: 'Rubric & Scales',
    description: 'Add a new custom evaluation criterion to the active rubric.',
    suggestedKey: 'a'
  },
  {
    id: 'auto_balance_weights',
    label: 'Auto-Balance Weights (100%)',
    category: 'Rubric & Scales',
    description: 'Evenly distribute criteria weights to equal exactly 100%.',
    suggestedKey: 'b'
  },
  {
    id: 'apply_ipaf_preset',
    label: 'Load IPAF Standard Rubric (Research-Synthesized)',
    category: 'Rubric & Scales',
    description: 'Apply unified Integrated Peer Assessment Framework (IPAF) with 6 validated dimensions (100% balanced).',
    suggestedKey: '1',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'set_deadline',
    label: 'Set Evaluation Deadline',
    category: 'Rubric & Scales',
    description: 'Open calendar to configure submission closing date and countdown timer.',
    suggestedKey: 'l'
  },
  {
    id: 'set_scale_20',
    label: 'Target Scale: Out of 20 (European Standard)',
    category: 'Rubric & Scales',
    description: 'Normalize calibrated marks to standard European / Bologna 0–20 grading bounds.',
    suggestedKey: '2',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'set_scale_100',
    label: 'Target Scale: Out of 100% (Percentage)',
    category: 'Rubric & Scales',
    description: 'Normalize calibrated marks to standard 0–100 percentage grading bounds.',
    suggestedKey: '3',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'set_scale_4',
    label: 'Target Scale: 4.0 GPA Scale',
    category: 'Rubric & Scales',
    description: 'Normalize calibrated marks to standard US 0–4.0 grade point average scale.',
    suggestedKey: '4',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'set_scale_sum',
    label: 'Target Scale: Direct Raw Rubric Sum',
    category: 'Rubric & Scales',
    description: 'Use direct summation of raw criterion score values without scaling.',
    suggestedKey: '5',
    suggestedModifiers: { alt: true }
  },

  // --- Grading & Analytics ---
  {
    id: 'export_excel',
    label: 'Export Complete Excel Gradebook',
    category: 'Grading & Analytics',
    description: 'Download complete multi-sheet institutional gradebook workbook.',
    suggestedKey: 'x'
  },
  {
    id: 'export_results_csv',
    label: 'Export Calibrated Results (CSV)',
    category: 'Grading & Analytics',
    description: 'Download calculated WebPA peer grades and multipliers as a CSV file.',
    suggestedKey: 'x',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'export_student_pdfs',
    label: 'Batch Export Student PDFs',
    category: 'Grading & Analytics',
    description: 'Open individual student PDF report card generator with formative comments.',
    suggestedKey: 'r'
  },
  {
    id: 'calibrate_webpa_0',
    label: 'Set WebPA Fudge Weight to 0% (Cohort Mean)',
    category: 'Grading & Analytics',
    description: 'All students receive pure team average mark with no peer differentiation.',
    suggestedKey: '7',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'calibrate_webpa_50',
    label: 'Set WebPA Fudge Weight to 50% (Standard Balance)',
    category: 'Grading & Analytics',
    description: 'Calibrate WebPA factor balance to standard 50% group/individual split.',
    suggestedKey: 'w'
  },
  {
    id: 'calibrate_webpa_100',
    label: 'Set WebPA Fudge Weight to 100% (Pure Peer Differentiation)',
    category: 'Grading & Analytics',
    description: 'Individual marks are multiplied 100% by peer performance ratio.',
    suggestedKey: '8',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'populate_test_reviews',
    label: 'Populate Simulated Peer Reviews',
    category: 'Grading & Analytics',
    description: 'Generate realistic test ratings with collusion & outlier diagnostics.',
    suggestedKey: '0',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'reset_reviews',
    label: 'Reset All Submitted Peer Reviews',
    category: 'Grading & Analytics',
    description: 'Wipe submitted peer evaluations to start a fresh assessment round.',
    suggestedKey: 'z',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'trigger_email_reminders',
    label: 'Send Email Reminders to Pending Students',
    category: 'Grading & Analytics',
    description: 'Dispatch automated grading link reminders only to students yet to submit.',
    suggestedKey: 'e',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'trigger_email_all',
    label: 'Send Evaluation Links to All Students',
    category: 'Grading & Analytics',
    description: 'Dispatch secure personal evaluation links to the entire enrolled roster.',
    suggestedKey: 'e',
    suggestedModifiers: { ctrl: true }
  },

  // --- Layout & Presets ---
  {
    id: 'preset_standard',
    label: 'Apply Standard Mode (Default Layout)',
    category: 'Layout & Presets',
    description: 'Switch workspace interface density to balanced Standard Mode.',
    suggestedKey: 's',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'preset_minimal',
    label: 'Apply Minimal Mode (Clean Essentials)',
    category: 'Layout & Presets',
    description: 'Hide auxiliary banners and toolbars for distraction-free grading.',
    suggestedKey: 'm',
    suggestedModifiers: { alt: true }
  },
  {
    id: 'preset_full',
    label: 'Apply Full Suite (All Modules Enabled)',
    category: 'Layout & Presets',
    description: 'Enable every single header tool, sub-banner, and analysis card.',
    suggestedKey: 'f',
    suggestedModifiers: { alt: true }
  },

  // --- General ---
  {
    id: 'undo_action',
    label: 'Undo Last Action (30s Safety Net)',
    category: 'General',
    description: 'Instantly restore deleted students, cleared rosters, or reset evaluations within 30 seconds.',
    suggestedKey: 'z',
    suggestedModifiers: { ctrl: true }
  },
  {
    id: 'close_modal',
    label: 'Close Active Modal / Escape',
    category: 'General',
    description: 'Dismiss any open dialog, modal, or dropdown and return to Hub.',
    suggestedKey: 'Escape'
  }
];

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'tab_hub',
    actionId: 'tab_hub',
    label: 'Classroom Hub Overview',
    category: 'Navigation',
    key: 'h',
    description: 'Return to main classroom hub and overview screen.'
  },
  {
    id: 'tab_roster',
    actionId: 'tab_roster',
    label: 'Switch to Enrollment & Teams',
    category: 'Navigation',
    key: '1',
    description: 'Jump to student roster, group manager, and enrollment portal.'
  },
  {
    id: 'tab_rubric',
    actionId: 'tab_rubric',
    label: 'Switch to Evaluation Rubric',
    category: 'Navigation',
    key: '2',
    description: 'Jump to multi-criteria rubric editor, presets, and scale configuration.'
  },
  {
    id: 'tab_analytics',
    actionId: 'tab_analytics',
    label: 'Switch to Grade Analytics',
    category: 'Navigation',
    key: '3',
    description: 'Jump to score matrix, Johari perception analysis, and grade exports.'
  },

  // Tools & Modals
  {
    id: 'focus_search',
    actionId: 'focus_search',
    label: 'Quick Search & Command Finder',
    category: 'Tools & Modals',
    key: 'k',
    modifiers: { ctrl: true },
    description: 'Open intelligent search bar and command assistant (Ctrl+K or /).'
  },
  {
    id: 'open_customize_view',
    actionId: 'open_customize_view',
    label: 'Customize View (Modules Manager)',
    category: 'Tools & Modals',
    key: 'v',
    description: 'Open modular interface toggles and layout density settings.'
  },
  {
    id: 'open_guide_center',
    actionId: 'open_guide_center',
    label: 'Academic Guidance Center',
    category: 'Tools & Modals',
    key: 'm',
    description: 'Open complete algorithm manuals, spotlight tours, and feature library.'
  },
  {
    id: 'open_autogroup',
    actionId: 'open_autogroup',
    label: 'Open Auto-Group Studio',
    category: 'Tools & Modals',
    key: 'g',
    description: 'Open intelligent team formation and diversity balancing studio.'
  },
  {
    id: 'open_email',
    actionId: 'open_email',
    label: 'Classroom Email Center',
    category: 'Tools & Modals',
    key: 'e',
    description: 'Open cohort email composer and evaluation link transmitter.'
  },
  {
    id: 'open_projector',
    actionId: 'open_projector',
    label: 'Launch Live Projector View',
    category: 'Tools & Modals',
    key: 'p',
    description: 'Open full-screen classroom QR code and live submission hub.'
  },
  {
    id: 'open_settings',
    actionId: 'open_settings',
    label: 'Settings Hub',
    category: 'Tools & Modals',
    key: 's',
    description: 'Open unified settings for email APIs, cloud sync, and shortcuts.'
  },
  {
    id: 'toggle_quick_pill',
    actionId: 'toggle_quick_pill',
    label: 'Toggle Quick Action Pill',
    category: 'Tools & Modals',
    key: 'q',
    description: 'Toggle the floating all-in-one Quick Action Pill at the bottom of the window (Q).'
  },

  // Actions
  {
    id: 'new_class',
    actionId: 'new_class',
    label: 'Create New Classroom',
    category: 'Roster & Teams',
    key: 'c',
    description: 'Open new classroom group creation modal.'
  },
  {
    id: 'add_student',
    actionId: 'add_student',
    label: 'Add New Student',
    category: 'Roster & Teams',
    key: 'n',
    description: 'Open quick student enrollment modal.'
  },
  {
    id: 'import_roster',
    actionId: 'import_roster',
    label: 'Open Import Wizard',
    category: 'Roster & Teams',
    key: 'i',
    description: 'Open CSV/Excel roster import wizard.'
  },
  {
    id: 'add_criterion',
    actionId: 'add_criterion',
    label: 'Add Rubric Criterion',
    category: 'Rubric & Scales',
    key: 'a',
    description: 'Add a new custom evaluation criterion to active rubric.'
  },
  {
    id: 'export_excel',
    actionId: 'export_excel',
    label: 'Export Gradebook Data',
    category: 'Grading & Analytics',
    key: 'x',
    description: 'Export class assessment results to CSV or Excel spreadsheet.'
  },

  // General
  {
    id: 'undo_action',
    actionId: 'undo_action',
    label: 'Undo Last Action (30s Safety Net)',
    category: 'General',
    key: 'z',
    modifiers: { ctrl: true },
    description: 'Instantly restore deleted students, cleared rosters, or reset evaluations within 30 seconds.'
  },
  {
    id: 'open_shortcuts_sheet',
    actionId: 'open_shortcuts_sheet',
    label: 'Keyboard Shortcuts Cheat-Sheet',
    category: 'General',
    key: '?',
    description: 'Display quick reference cheat-sheet for all shortcuts.'
  },
  {
    id: 'close_modal',
    actionId: 'close_modal',
    label: 'Close Active Modal / Escape',
    category: 'General',
    key: 'Escape',
    description: 'Dismiss any open dialog, modal, or dropdown.'
  }
];

const SHORTCUTS_STORAGE_KEY = 'peerlens_shortcuts_v3';
const LEGACY_STORAGE_KEY_V2 = 'peerlens_custom_shortcuts_v2';
const LEGACY_STORAGE_KEY_V1 = 'peerlens_custom_shortcuts_v1';

export function getStoredShortcuts(): KeyboardShortcut[] {
  try {
    const rawV3 = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (rawV3) {
      const parsed = JSON.parse(rawV3);
      if (Array.isArray(parsed)) {
        let list: KeyboardShortcut[] = parsed.map((p: any) => ({
          id: p.id || `sc_${Math.random().toString(36).substring(2, 7)}`,
          actionId: p.actionId || p.id,
          label: p.label || 'Shortcut',
          category: p.category || 'General',
          key: p.key !== undefined ? p.key : '',
          modifiers: p.modifiers,
          description: p.description || '',
          disabled: !!p.disabled,
          isCustom: !!p.isCustom
        }));

        // Ensure toggle_quick_pill is present and uses key 'q' and category 'Tools & Modals'
        const pillIdx = list.findIndex(s => s.actionId === 'toggle_quick_pill' || s.id === 'toggle_quick_pill');
        if (pillIdx === -1) {
          const def = DEFAULT_KEYBOARD_SHORTCUTS.find(d => d.actionId === 'toggle_quick_pill');
          if (def) {
            list.push({ ...def });
            saveStoredShortcuts(list);
          }
        } else if (list[pillIdx].key !== 'q' || list[pillIdx].category !== 'Tools & Modals') {
          list[pillIdx] = {
            ...list[pillIdx],
            label: 'Toggle Quick Action Pill',
            category: 'Tools & Modals',
            key: 'q',
            modifiers: undefined,
            description: 'Toggle the floating all-in-one Quick Action Pill at the bottom of the window (Q).'
          };
          saveStoredShortcuts(list);
        }

        // Add any other missing default shortcuts
        const existingActionIds = new Set(list.map((p) => p.actionId || p.id));
        const missingDefaults = DEFAULT_KEYBOARD_SHORTCUTS.filter(d => !existingActionIds.has(d.actionId || d.id));
        if (missingDefaults.length > 0) {
          list.push(...missingDefaults);
          saveStoredShortcuts(list);
        }
        return list;
      }
    }

    // Check for legacy migration if v3 is not yet populated
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_V2) || localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveStoredShortcuts(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load shortcuts:', e);
  }
  return [...DEFAULT_KEYBOARD_SHORTCUTS];
}

export function saveStoredShortcuts(shortcuts: KeyboardShortcut[]): void {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    window.dispatchEvent(new CustomEvent('peerlens_shortcuts_changed', { detail: shortcuts }));
  } catch (e) {
    console.error('Failed to save shortcuts:', e);
  }
}

export function resetStoredShortcuts(): KeyboardShortcut[] {
  try {
    localStorage.removeItem(SHORTCUTS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch (e) {
    console.error('Failed to reset shortcuts:', e);
  }
  const defaults = [...DEFAULT_KEYBOARD_SHORTCUTS];
  saveStoredShortcuts(defaults);
  return defaults;
}

/** Formats a key for human-readable display */
export function formatShortcutDisplay(key: string, modifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean }): string {
  const parts: string[] = [];
  if (modifiers?.ctrl) parts.push('Ctrl');
  if (modifiers?.alt) parts.push('Alt');
  if (modifiers?.shift) parts.push('Shift');

  if (!key) {
    return 'None';
  }

  if (key === ' ') {
    parts.push('Space');
  } else if (key === 'Escape') {
    parts.push('Esc');
  } else if (key === '?') {
    // If it's ?, and shift wasn't explicitly added to parts, show ?
    parts.push('?');
  } else if (key.length === 1) {
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }

  return parts.join(' + ');
}

/** Robust, platform-independent shortcut matching logic */
export function matchShortcut(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (shortcut.disabled || !shortcut.key) return false;

  const pressedKey = e.key ? e.key.toLowerCase() : '';
  const shortcutKey = shortcut.key.toLowerCase();

  // Primary key check (literal key, lowercase, or digit / letter code)
  const isKeyMatch = 
    shortcutKey === pressedKey ||
    shortcut.key === e.key ||
    (shortcutKey === '1' && (e.code === 'Digit1' || e.code === 'Numpad1')) ||
    (shortcutKey === '2' && (e.code === 'Digit2' || e.code === 'Numpad2')) ||
    (shortcutKey === '3' && (e.code === 'Digit3' || e.code === 'Numpad3')) ||
    (shortcutKey === '4' && (e.code === 'Digit4' || e.code === 'Numpad4')) ||
    (shortcutKey === '0' && (e.code === 'Digit0' || e.code === 'Numpad0')) ||
    (shortcutKey === 'q' && (pressedKey === 'q' || e.code === 'KeyQ')) ||
    (shortcutKey === 'p' && (pressedKey === 'p' || e.code === 'KeyP')) ||
    (shortcutKey === ' ' && (e.key === ' ' || e.code === 'Space')) ||
    (shortcutKey === 'escape' && (e.key === 'Escape' || e.code === 'Escape'));

  if (!isKeyMatch) return false;

  const reqCtrl = !!shortcut.modifiers?.ctrl;
  const reqAlt = !!shortcut.modifiers?.alt;
  const actCtrl = e.ctrlKey || e.metaKey;
  const actAlt = e.altKey;

  if (reqCtrl !== actCtrl) return false;
  if (reqAlt !== actAlt) return false;

  // Shift handling:
  // Keys like '?', '!', '@', '#', '$' naturally require shift on standard keyboards.
  const naturallyShifted = /[~!@#$%^&*()_+{}|:"<>?]/.test(shortcut.key);
  if (shortcut.modifiers && 'shift' in shortcut.modifiers && shortcut.modifiers.shift !== undefined) {
    if (shortcut.modifiers.shift !== e.shiftKey) return false;
  } else if (!naturallyShifted) {
    if (e.shiftKey) return false;
  }

  return true;
}
