// src/utils/workspaceModuleManager.ts
// Centralized manager for Workspace Dock pinned modules, universal ID resolver,
// multi-component sync, and comprehensive state tracking (pinned, enabled, locked, prioritized).

import type { ClassData, EvaluationFormControls } from './math';
import { getEvaluationControls } from './math';
import type { FeatureToggles } from './featurePreferences';
import { isCardPinned } from './cardLayoutPreferences';

export const PINNED_MODULES_STORAGE_KEY = 'peer_pinned_module_ids_v2';
export const ACTIVE_MODULE_STORAGE_KEY = 'peer_pinned_active_module_id_v2';

export const DEFAULT_PINNED_MODULE_IDS = [
  'eval_controls',
  'smartphone_simulator',
  'autogroup_studio',
  'rubric_system',
  'grading_analytics',
  'live_stats_hud'
];

export const VALID_MODULE_IDS = [
  'live_stats_hud',
  'eval_controls',
  'rubric_system',
  'grading_analytics',
  'webpa_calibration',
  'live_presentation',
  'grade_curve_calibrator',
  'rubric_ai_optimizer',
  'autogroup_studio',
  'team_health_pulse',
  'team_charters',
  'student_enrollment',
  'matrix_evaluator',
  'radar_competency',
  'reports_hub',
  'johari_window',
  'feedback_thematics',
  'audit_log',
  'grade_snapshot_rollback',
  'email_dispatcher',
  'smartphone_simulator',
  'classroom_projector',
  'branding_customizer',
  'layout_library',
  'density_calibrator',
  'keyboard_shortcuts',
  'anomalies_auditor',
  'unsubmitted_nudge'
] as const;

export type ValidModuleId = typeof VALID_MODULE_IDS[number];

/**
 * Returns current pinned module IDs from localStorage.
 */
export function getPinnedModuleIds(): string[] {
  try {
    const saved = localStorage.getItem(PINNED_MODULES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Return only IDs that exist in VALID_MODULE_IDS
        const validOnly = parsed.filter(id => (VALID_MODULE_IDS as readonly string[]).includes(id));
        if (validOnly.length > 0) return validOnly;
      }
    }
  } catch {}
  return [...DEFAULT_PINNED_MODULE_IDS];
}

/**
 * Persists pinned module IDs and emits global synchronization events.
 */
export function savePinnedModuleIds(ids: string[]): void {
  try {
    const sanitized = Array.from(new Set(ids)).filter(id => (VALID_MODULE_IDS as readonly string[]).includes(id));
    const finalIds = sanitized.length > 0 ? sanitized : [DEFAULT_PINNED_MODULE_IDS[0]];
    localStorage.setItem(PINNED_MODULES_STORAGE_KEY, JSON.stringify(finalIds));
    window.dispatchEvent(new CustomEvent('peerlens_pinned_ids_changed', { detail: { pinnedIds: finalIds } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

/**
 * Checks if a specific module ID is currently pinned.
 */
export function isModulePinned(moduleId: string): boolean {
  const current = getPinnedModuleIds();
  return current.includes(moduleId);
}

/**
 * Pins a module to the Workspace Dock and focuses it.
 */
export function pinModule(moduleId: string): boolean {
  if (!(VALID_MODULE_IDS as readonly string[]).includes(moduleId)) return false;
  const current = getPinnedModuleIds();
  if (!current.includes(moduleId)) {
    const next = [...current, moduleId];
    savePinnedModuleIds(next);
  }
  try {
    localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, moduleId);
  } catch {}
  window.dispatchEvent(new CustomEvent('peerlens_pin_module', { detail: { moduleId } }));
  return true;
}

/**
 * Unpins a module from the Workspace Dock.
 */
export function unpinModule(moduleId: string): boolean {
  const current = getPinnedModuleIds();
  if (!current.includes(moduleId)) return false;
  if (current.length <= 1) {
    return false; // Preserve at least one pinned item
  }
  const next = current.filter(id => id !== moduleId);
  savePinnedModuleIds(next);
  window.dispatchEvent(new CustomEvent('peerlens_unpin_module', { detail: { moduleId } }));
  return true;
}

/**
 * Toggles pin state for a given module ID.
 * Returns true if now pinned, false if unpinned.
 */
export function togglePinModule(moduleId: string): boolean {
  if (isModulePinned(moduleId)) {
    const success = unpinModule(moduleId);
    return !success; // If couldn't unpin (last item), remains true
  } else {
    pinModule(moduleId);
    return true;
  }
}

/**
 * Subscribes to real-time changes in pinned module IDs.
 */
export function subscribePinnedModules(callback: (pinnedIds: string[]) => void): () => void {
  const handler = (e?: Event) => {
    if (e && 'detail' in e && (e as CustomEvent).detail?.pinnedIds) {
      callback((e as CustomEvent).detail.pinnedIds);
    } else {
      callback(getPinnedModuleIds());
    }
  };

  window.addEventListener('peerlens_pinned_ids_changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('peerlens_pinned_ids_changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// ── UNIVERSAL MODULE ID RESOLVER ─────────────────────────────────────────────
/**
 * Maps ANY command palette action ID, feature toggle key, card ID, or keyword
 * into its corresponding Workspace Dock module ID.
 */
export function resolveToModuleId(
  rawIdOrKey?: string,
  title?: string,
  keywords?: string[]
): ValidModuleId | null {
  if (!rawIdOrKey && !title) return null;
  const id = (rawIdOrKey || '').trim();

  // 1. Direct match with valid modules
  if ((VALID_MODULE_IDS as readonly string[]).includes(id)) {
    return id as ValidModuleId;
  }

  // 2. Strip 'pin_module_' prefix
  if (id.startsWith('pin_module_')) {
    const stripped = id.replace(/^pin_module_/, '');
    if ((VALID_MODULE_IDS as readonly string[]).includes(stripped)) {
      return stripped as ValidModuleId;
    }
  }

  // 3. Known Action & Feature to Module Mappings
  const explicitMap: Record<string, ValidModuleId> = {
    // Live Stats & Pulse
    act_live_stats: 'live_stats_hud',
    tab_hub: 'live_stats_hud',
    smart_stats_overview: 'live_stats_hud',
    showHubOverviewStats: 'live_stats_hud',
    showHubOverviewBanner: 'live_stats_hud',
    showHubCardMetrics: 'live_stats_hud',

    // Evaluation Controls & Permissions
    act_eval_controls: 'eval_controls',
    act_eval_lock: 'eval_controls',
    act_self_review_control: 'eval_controls',
    act_praise_control: 'eval_controls',
    act_constructive_control: 'eval_controls',
    act_profile_editing_control: 'eval_controls',
    act_toggle_evaluation_card: 'eval_controls',
    showEvaluationFormControls: 'eval_controls',
    showReviewSystemCard: 'eval_controls',

    // Rubric & Weights
    act_rubric_weights: 'rubric_system',
    act_preset_ipaf: 'rubric_system',
    act_scale_100: 'rubric_system',
    tab_grading: 'rubric_system',
    nav_rubrics: 'rubric_system',
    showWeightBalanceBar: 'rubric_system',

    // Grading Analytics & Multipliers
    act_grading_analytics: 'grading_analytics',
    tab_results: 'grading_analytics',
    nav_results: 'grading_analytics',
    showGradingAnalyticsCard: 'grading_analytics',

    // WebPA Calibration
    act_webpa_calibrator: 'webpa_calibration',
    smart_explain_webpa: 'webpa_calibration',
    act_fudge_weight: 'webpa_calibration',
    act_base_grade: 'webpa_calibration',

    // Presentation Scoring
    act_live_presentation: 'live_presentation',
    act_presentation_scorer: 'live_presentation',
    showLivePresentationBtn: 'live_presentation',

    // Grade Curver
    act_grade_curve: 'grade_curve_calibrator',
    act_bell_curve: 'grade_curve_calibrator',

    // Rubric Optimizer
    act_rubric_auditor: 'rubric_ai_optimizer',
    act_ai_rubric: 'rubric_ai_optimizer',

    // AutoGroup & Teams
    act_autogroup: 'autogroup_studio',
    act_autogroup_studio: 'autogroup_studio',
    nav_teams: 'autogroup_studio',
    showAutoGroupStudio: 'autogroup_studio',

    // Team Health Micro-Pulse
    act_team_health_pulse: 'team_health_pulse',
    act_launch_pulse: 'team_health_pulse',
    smart_active_pulse_round: 'team_health_pulse',
    showTeamHealthPulse: 'team_health_pulse',

    // Team Charters & Roles
    act_team_charter: 'team_charters',
    act_roles_selection: 'team_charters',

    // Student Enrollment & Roster
    act_add_student: 'student_enrollment',
    act_enrollment_builder: 'student_enrollment',
    tab_roster: 'student_enrollment',
    nav_roster: 'student_enrollment',
    showEnrollmentCard: 'student_enrollment',
    showSelfEnrollmentCard: 'student_enrollment',
    showImportWizardCard: 'student_enrollment',

    // Milestone Matrix
    act_matrix_evaluator: 'matrix_evaluator',
    act_milestones: 'matrix_evaluator',

    // Radar Competency Chart
    act_radar_chart: 'radar_competency',
    nav_competencies: 'radar_competency',

    // Student Reports & Dossier
    act_student_report: 'reports_hub',
    act_reports_hub: 'reports_hub',
    act_dossier: 'reports_hub',

    // Johari Window
    act_johari: 'johari_window',
    act_johari_window: 'johari_window',

    // Qualitative Feedback Thematics
    act_feedback_thematics: 'feedback_thematics',
    act_sentiment_analysis: 'feedback_thematics',

    // Audit Log
    act_audit_log: 'audit_log',
    act_audit_history: 'audit_log',

    // Grade Snapshots
    act_snapshots_manage: 'grade_snapshot_rollback',
    act_snapshots: 'grade_snapshot_rollback',
    act_rollback: 'grade_snapshot_rollback',

    // Email Dispatcher
    act_dispatcher: 'email_dispatcher',
    act_email_dispatcher: 'email_dispatcher',
    showEmailButton: 'email_dispatcher',

    // Smartphone Simulator
    act_smartphone_sim: 'smartphone_simulator',
    act_mobile_sim: 'smartphone_simulator',

    // Projector
    act_projector: 'classroom_projector',
    act_fullscreen_projector: 'classroom_projector',
    showProjectorButton: 'classroom_projector',

    // Branding
    act_branding: 'branding_customizer',
    act_branding_customizer: 'branding_customizer',

    // Layout Library
    act_layout_library: 'layout_library',
    act_customize_layout: 'layout_library',

    // Density Calibrator
    act_density: 'density_calibrator',
    act_density_calibrator: 'density_calibrator',

    // Shortcuts
    act_shortcuts: 'keyboard_shortcuts',
    act_keybindings: 'keyboard_shortcuts',

    // Anomalies
    act_anomalies: 'anomalies_auditor',
    act_anomaly_audit: 'anomalies_auditor',
    smart_anomaly_flagged: 'anomalies_auditor',
    showAnomaliesAlert: 'anomalies_auditor',

    // Unsubmitted Nudge
    act_unsubmitted_nudge: 'unsubmitted_nudge',
    smart_unsubmitted_students: 'unsubmitted_nudge'
  };

  if (explicitMap[id]) {
    return explicitMap[id];
  }

  // 4. Keyword / Title Fallback Matching
  const textToScan = `${id} ${title || ''} ${(keywords || []).join(' ')}`.toLowerCase();

  if (textToScan.includes('pulse') || textToScan.includes('morale') || textToScan.includes('standup')) return 'team_health_pulse';
  if (textToScan.includes('autogroup') || textToScan.includes('kanban') || textToScan.includes('group formation')) return 'autogroup_studio';
  if (textToScan.includes('charter') || textToScan.includes('icebreaker') || textToScan.includes('team role')) return 'team_charters';
  if (textToScan.includes('presentation') || textToScan.includes('stopwatch') || textToScan.includes('pitch')) return 'live_presentation';
  if (textToScan.includes('rubric') || textToScan.includes('weight balance') || textToScan.includes('criteria')) return 'rubric_system';
  if (textToScan.includes('webpa') || textToScan.includes('multiplier') || textToScan.includes('fudge')) return 'webpa_calibration';
  if (textToScan.includes('curve') || textToScan.includes('bell curve') || textToScan.includes('curver')) return 'grade_curve_calibrator';
  if (textToScan.includes('radar') || textToScan.includes('spider chart') || textToScan.includes('competency')) return 'radar_competency';
  if (textToScan.includes('johari') || textToScan.includes('blind spot') || textToScan.includes('self-peer')) return 'johari_window';
  if (textToScan.includes('thematic') || textToScan.includes('sentiment') || textToScan.includes('word cloud')) return 'feedback_thematics';
  if (textToScan.includes('report') || textToScan.includes('dossier') || textToScan.includes('card 360')) return 'reports_hub';
  if (textToScan.includes('snapshot') || textToScan.includes('rollback') || textToScan.includes('version history')) return 'grade_snapshot_rollback';
  if (textToScan.includes('dispatcher') || textToScan.includes('email') || textToScan.includes('invite links')) return 'email_dispatcher';
  if (textToScan.includes('projector') || textToScan.includes('live monitor')) return 'classroom_projector';
  if (textToScan.includes('simulator') || textToScan.includes('mobile test') || textToScan.includes('preview student')) return 'smartphone_simulator';
  if (textToScan.includes('enroll') || textToScan.includes('roster') || textToScan.includes('student')) return 'student_enrollment';
  if (textToScan.includes('anomaly') || textToScan.includes('outlier') || textToScan.includes('collusion')) return 'anomalies_auditor';
  if (textToScan.includes('unsubmitted') || textToScan.includes('missing') || textToScan.includes('nudge')) return 'unsubmitted_nudge';
  if (textToScan.includes('branding') || textToScan.includes('logo') || textToScan.includes('color accent')) return 'branding_customizer';
  if (textToScan.includes('density') || textToScan.includes('spacing') || textToScan.includes('compact mode')) return 'density_calibrator';
  if (textToScan.includes('shortcut') || textToScan.includes('hotkey')) return 'keyboard_shortcuts';

  return null;
}

// ── EVALUATION CONTROLS KEY MAPPER ───────────────────────────────────────────
export const EVAL_CONTROL_KEYS_MAP: Record<string, keyof EvaluationFormControls> = {
  act_eval_lock: 'unlockMainPeerReview',
  act_self_review_control: 'allowSelfReview',
  act_praise_control: 'showPraiseTags',
  act_constructive_control: 'showGrowthSuggestions',
  act_strengths_control: 'showStrengthsFeedback',
  act_profile_editing_control: 'allowProfileEditing',
  act_roles_control: 'showRoleSelection',
  act_icebreaker_control: 'showIcebreaker'
};

// ── ITEM STATE SUMMARY INTERFACE ─────────────────────────────────────────────
export interface ItemStateSummary {
  resolvedModuleId: ValidModuleId | null;
  isPinned: boolean;
  
  hasFeatureToggle: boolean;
  featureKey: keyof FeatureToggles | null;
  isFeatureOn: boolean | null;

  hasEvalControl: boolean;
  evalControlKey: keyof EvaluationFormControls | null;
  isEvalControlOn: boolean | null;

  hasCardPriority: boolean;
  cardId: string | null;
  isCardPinnedPriority: boolean | null;

  statusBadge: string;
  statusColor: string;
  canToggle: boolean;
  toggleType: 'pin' | 'feature' | 'eval_control' | 'card' | 'none';
  toggleLabel: string;
}

/**
 * Computes an exhaustive, real-time status summary for ANY command palette item,
 * checking whether it is pinned to dock, enabled in feature toggles, unlocked
 * in evaluation permissions, or starred as priority.
 */
export function inspectItemState(
  item: {
    id: string;
    title: string;
    featureKey?: keyof FeatureToggles;
    keywords?: string[];
  },
  classData: ClassData | null,
  featureToggles: FeatureToggles,
  pinnedIds: string[]
): ItemStateSummary {
  // 1. Resolve Module ID & Pin state
  const resolvedModuleId = resolveToModuleId(item.featureKey || item.id, item.title, item.keywords);
  const isPinned = resolvedModuleId ? pinnedIds.includes(resolvedModuleId) : false;

  // 2. Feature Toggle state
  const featureKey = item.featureKey || null;
  const hasFeatureToggle = !!featureKey && typeof featureToggles[featureKey] === 'boolean';
  const isFeatureOn = hasFeatureToggle ? !!featureToggles[featureKey!] : null;

  // 3. Evaluation Control state
  const evalControlKey = EVAL_CONTROL_KEYS_MAP[item.id] || null;
  const hasEvalControl = !!evalControlKey;
  let isEvalControlOn: boolean | null = null;
  if (hasEvalControl && classData) {
    const controls = getEvaluationControls(classData);
    isEvalControlOn = !!controls[evalControlKey!];
  }

  // 4. Card Priority Pin state
  const cardId = item.id.startsWith('card_') ? item.id : null;
  const hasCardPriority = !!cardId;
  const isCardPinnedPriority = hasCardPriority ? isCardPinned(cardId!) : null;

  // Determine Primary Status Badge & Action
  let statusBadge = isPinned ? '● Pinned to Dock' : '○ Not Pinned';
  let statusColor = isPinned ? '#f59e0b' : 'var(--text-muted)';
  let canToggle = !!resolvedModuleId || hasFeatureToggle || hasEvalControl || hasCardPriority;
  let toggleType: ItemStateSummary['toggleType'] = 'pin';
  let toggleLabel = isPinned ? 'Unpin from Dock' : 'Pin to Dock';

  if (hasFeatureToggle) {
    toggleType = 'feature';
    statusBadge = isFeatureOn ? '● Visible on Canvas' : '○ Hidden from Canvas';
    statusColor = isFeatureOn ? '#10b981' : 'var(--text-muted)';
    toggleLabel = isFeatureOn ? 'Hide Feature' : 'Show Feature';
  } else if (hasEvalControl) {
    toggleType = 'eval_control';
    statusBadge = isEvalControlOn ? 'Permission Active' : 'Locked / Off';
    statusColor = isEvalControlOn ? '#10b981' : '#f43f5e';
    toggleLabel = isEvalControlOn ? 'Deactivate' : 'Activate';
  } else if (hasCardPriority) {
    toggleType = 'card';
    statusBadge = isCardPinnedPriority ? 'Priority Top' : 'Normal Order';
    statusColor = isCardPinnedPriority ? '#f59e0b' : 'var(--text-muted)';
    toggleLabel = isCardPinnedPriority ? 'Unstar Priority' : 'Star Priority Top';
  }

  return {
    resolvedModuleId,
    isPinned,
    hasFeatureToggle,
    featureKey,
    isFeatureOn,
    hasEvalControl,
    evalControlKey,
    isEvalControlOn,
    hasCardPriority,
    cardId,
    isCardPinnedPriority,
    statusBadge,
    statusColor,
    canToggle,
    toggleType,
    toggleLabel
  };
}
