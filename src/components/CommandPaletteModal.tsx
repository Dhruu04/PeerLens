import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Users, Sliders, Award, Tv, Send, Download, Settings, Settings2, Keyboard,
  UserPlus, FileText, Globe, CornerDownLeft, X, Compass, Sparkles, QrCode, Percent,
  RefreshCw, Clock, Moon, Sun, HelpCircle, BookOpen, ArrowLeft, Layers, Zap,
  Tag, Palette, Eye, EyeOff, LayoutDashboard, Gauge, Cpu, ToggleLeft,
  Lightbulb, BarChart2, Grid,
  Filter, Mail, Cloud, GraduationCap, Activity, Trash2, Star, Info,
  ChevronsDown, ChevronsUp, CheckCircle2, ShieldCheck, Scale, Copy, Check,
  AlertTriangle,
  Edit3,
  Presentation,
  Calculator,
  History,
  RotateCcw,
  Building2,
  Pin,
  PinOff,
  ExternalLink,
  Dices,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';
import type { ClassData, EvaluationFormControls, Student } from '../utils/math';
import { generateStudentDisputeAudit } from '../utils/math';
import { FEATURE_INFO_REGISTRY, type FeatureInfoItem } from '../data/featureDescriptions';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_FEATURE_TOGGLES, MINIMAL_FEATURE_TOGGLES, FULL_FEATURE_TOGGLES, type FeatureToggles } from '../utils/featurePreferences';
import { getBranding, saveBranding } from '../utils/brandingPreferences';
import { setDisplayDensity, type DisplayDensity } from '../utils/displayDensity';
import { BUILT_IN_LAYOUT_PROFILES, applyFullLayoutProfile } from '../utils/customViewProfiles';
import { AVAILABLE_PINNABLE_MODULES } from './DynamicRetractableDisplay';
import {
  getPinnedModuleIds,
  subscribePinnedModules,
  togglePinModule,
  pinModule,
  resolveToModuleId,
  inspectItemState
} from '../utils/workspaceModuleManager';

// ── NLP SYNONYMS & INTENT DETECTION ─────────────────────────────────────────
const SYNONYMS_SHOW   = ['show','enable','turn on','activate','visible','display','unhide','reveal','make visible'];
const SYNONYMS_HIDE   = ['hide','disable','turn off','deactivate','remove','conceal','make invisible'];
const SYNONYMS_HELP   = ['how to','what is','explain','help','what does','how does','why','formula','guide'];
const SYNONYMS_MODE   = ['mode','preset','minimal','standard','full','none','clean canvas','hide all','blank canvas','clear modules','power','simple','basic','advanced'];
const SYNONYMS_NAV    = ['go to','switch to','navigate','take me to','jump to'];
const SYNONYMS_THEME  = ['theme','dark','light','appearance','color'];
const SYNONYMS_EXPORT = ['export','download','save as','csv','xlsx','excel','lms','pdf','canvas','moodle','blackboard','brightspace','pulse','pulse csv','micro-pulse'];
const SYNONYMS_FILTER = ['filter','pending','unsubmitted','submitted','unassigned','duplicate','team','jump','cohort'];
const SYNONYMS_CLEAR  = ['clear','delete','wipe','empty','purge','disband','remove all','reset roster','clear roster'];
const SYNONYMS_PRESENTATION = ['presentation', 'pitch', 'live presentation', 'scoring', 'audience vote', 'qr score', 'leaderboard', 'timer', 'presentation mode', 'presentation day', 'cockpit'];
const SYNONYMS_CHARTER = ['team charter', 'charter', 'kickoff', 'icebreaker', 'roles', 'agreements', 'team contract', 'lead', 'scribe', 'presenter', 'activity roles', 'team agreement', '5-min'];
const SYNONYMS_ENROLLMENT_BUILDER = ['enrollment questions', 'form questions', 'custom fields', 'registration questions', 'form builder', 'survey questions', 'onboarding questions', 'custom question', 'survey fields'];
const SYNONYMS_MATRIX = ['who rated whom', 'detailed matrix', 'cross matrix', 'ratings matrix', 'audit grid', 'who scored who', 'rating grid', 'score transmissions'];
const SYNONYMS_PULSE = ['pulse', 'team health', 'micro-pulse', 'morale', 'blocker', 'check-in', 'roadblocks', 'sparklines', 'sprint health'];
const SYNONYMS_HUD = ['quicklook', 'hud', 'preview student', 'peek student', 'spacebar', 'hover student', 'instant peek'];
const SYNONYMS_BRANDING = ['branding', 'institution logo', 'custom header', 'course badge', 'term banner', 'university emblem', 'school logo', 'brand'];
const SYNONYMS_DENSITY = ['density', 'compact', 'balanced', 'spacious', 'display density', 'table density', 'padding', 'row height'];
const SYNONYMS_PRESETS = ['layout library', 'workspace presets', 'professor presets', 'preset', 'final grading', 'week 1', 'presentation scoring', 'team health pulse', 'accreditation audit', 'speed grader'];

// Extended Universal NLP Synonym Vocabularies
const SYNONYMS_MATH = ['calc', 'calculate', 'compute', 'math', 'percentage', 'convert scale'];
const SYNONYMS_RANDOM = ['random', 'pick student', 'spin student', 'call student', 'cold call', 'who speaks next', 'spotlight student', 'random speaker', 'random member', 'pick someone', 'roll'];
const SYNONYMS_EVAL_LOCK = ['unlock review', 'unlock peer review', 'open evaluation', 'open review round', 'allow submissions', 'unlock round', 'lock review', 'lock peer review', 'close round', 'freeze grades', 'freeze round', 'close submissions', 'review round'];
const SYNONYMS_PIN_DOCK = ['pin', 'unpin', 'dock', 'float dock', 'retract dock', 'pin module', 'pinned modules', 'workspace dock'];
const SYNONYMS_OUTLIERS = ['outliers', 'anomaly', 'anomalies', 'collusion', 'dispute', 'disputes', 'suspicious', 'retaliation', 'retaliation risk', 'unusual scores', 'flagged'];
const SYNONYMS_UNSUBMITTED = ['who has not submitted', 'who didn\'t submit', 'who hasnt submitted', 'who did not submit', 'missing', 'unsubmitted', 'pending students', 'who to email', 'send reminder', 'nudge pending', 'remind all'];

// ── KNOWLEDGE BASE & INSTANT FAQ DICTIONARY ─────────────────────────────────
export interface FaqItem {
  id: string;
  question: string;
  summary: string;
  answer: string;
  formula?: string;
  actionText?: string;
  actionTab?: 'hub' | 'roster' | 'grading' | 'results';
  actionSpecial?: 'dispatcher' | 'autogroup' | 'eval_controls' | 'presets';
}

export const FAQ_KNOWLEDGE_BASE: FaqItem[] = [
  {
    id: 'faq_webpa',
    question: 'How is WebPA calculated and what does it mean?',
    summary: 'WebPA scales individual grades using peer ratings.',
    formula: 'Individual Grade = Baseline Grade × (Individual Peer Score / Team Average Peer Score)',
    answer: 'WebPA (Web Peer Assessment) algorithm compares each student\'s received rating against their group average. A factor of 1.00 indicates expected contribution, >1.00 indicates above-average contribution, and <1.00 indicates lower relative contribution. Tutors can dampen or amplify this multiplier using the WebPA Calibrator slider.',
    actionText: 'Open Section 3 Analytics',
    actionTab: 'results'
  },
  {
    id: 'faq_excuse',
    question: 'How do I excuse an absent or sick student?',
    summary: 'Excused students have their multiplier locked to 1.00.',
    answer: 'Search for the student by typing #studentName, then click "Mark Excused / Medical Exemption" in their dossier. This automatically neutralizes their peer factor so their grade defaults safely to the team base mark without penalty.',
    actionText: 'View Classroom Roster',
    actionTab: 'roster'
  },
  {
    id: 'faq_anonymity',
    question: 'Are peer ratings and comments anonymous to students?',
    summary: 'PeerLens is 100% double-blind by academic design.',
    answer: 'Students can only see aggregate team scores, anonymized feedback tags, and thematic written comments. No student can ever trace individual scores or comments back to specific classmates.',
    actionText: 'Check Security Status',
    actionTab: 'hub'
  },
  {
    id: 'faq_unsubmitted',
    question: 'What happens if a student does not submit their review?',
    summary: 'Teammates still grade them, but they get no submission credit.',
    answer: 'Students who fail to submit on time still receive peer evaluations from teammates, but are marked Pending. You can use the Link Dispatcher (Cmd+E) to send immediate 1-click email reminders before locking the round.',
    actionText: 'Open Link Dispatcher',
    actionSpecial: 'dispatcher'
  },
  {
    id: 'faq_outliers',
    question: 'How does anomaly detection detect collusion or free-riders?',
    summary: 'Flags uniform scoring, score trading, and retaliation.',
    answer: 'The algorithm inspects self-peer rating gaps (>20%), retaliation risks (student down-voting someone who down-voted them), and uniform grading (giving everyone straight 5s or 1s). Flagged students are highlighted in the Anomaly Audit with a one-click dispute dossier.',
    actionText: 'Inspect Anomaly Audit',
    actionTab: 'results'
  },
  {
    id: 'faq_export_lms',
    question: 'How do I export final grades into Canvas, Moodle, or Blackboard?',
    summary: '1-click standard CSV format matched to your school LMS.',
    answer: 'Go to Section 3 or type ">export" to download gradebooks mapped with SIS IDs, Usernames, and scaled peer score columns directly importable into Canvas, Moodle, Blackboard, or Brightspace D2L.',
    actionText: 'Export LMS Gradebook',
    actionTab: 'results'
  }
];

// ── SAFE MATHEMATICAL EVALUATOR ─────────────────────────────────────────────
export function evaluateMathExpression(expr: string): { result: number; formatted: string; isPercentage: boolean } | null {
  const clean = expr.trim().toLowerCase().replace(/^calc\s+/i, '').replace(/^=\s*/, '');
  if (!/^[\d\s+\-*/().%]+$/.test(clean) || !/\d/.test(clean)) return null;
  try {
    const isPercentage = clean.includes('%');
    const sanitized = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');
    const val = Function(`'use strict'; return (${sanitized});`)();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      const rounded = Math.round(val * 1000) / 1000;
      return { result: rounded, formatted: String(rounded), isPercentage };
    }
  } catch {
    return null;
  }
  return null;
}

type IntentType = 
  | 'show_feature'
  | 'hide_feature'
  | 'navigate'
  | 'help'
  | 'mode_switch'
  | 'theme'
  | 'export'
  | 'filter'
  | 'clear_action'
  | 'presentation'
  | 'charter'
  | 'enrollment_builder'
  | 'matrix'
  | 'pulse'
  | 'hud'
  | 'branding'
  | 'density'
  | 'presets'
  | 'calc_math'
  | 'random_caller'
  | 'eval_lock'
  | 'pin_dock'
  | 'outliers'
  | 'unsubmitted'
  | 'general';

interface NLPIntent { type: IntentType; confidence: number; }

function detectIntent(rawQ: string): NLPIntent {
  const q = rawQ.toLowerCase().trim();
  if (q.startsWith('=') || SYNONYMS_MATH.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'calc_math', confidence: 0.98 };
  if (SYNONYMS_RANDOM.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'random_caller', confidence: 0.96 };
  if (SYNONYMS_EVAL_LOCK.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'eval_lock', confidence: 0.95 };
  if (SYNONYMS_PIN_DOCK.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'pin_dock', confidence: 0.92 };
  if (SYNONYMS_OUTLIERS.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'outliers', confidence: 0.95 };
  if (SYNONYMS_UNSUBMITTED.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'unsubmitted', confidence: 0.95 };
  if (SYNONYMS_CLEAR.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'clear_action', confidence: 0.95 };
  if (SYNONYMS_BRANDING.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'branding', confidence: 0.95 };
  if (SYNONYMS_DENSITY.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'density', confidence: 0.95 };
  if (SYNONYMS_PRESETS.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'presets', confidence: 0.95 };
  if (SYNONYMS_PRESENTATION.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'presentation', confidence: 0.95 };
  if (SYNONYMS_CHARTER.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'charter', confidence: 0.95 };
  if (SYNONYMS_ENROLLMENT_BUILDER.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'enrollment_builder', confidence: 0.95 };
  if (SYNONYMS_MATRIX.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'matrix', confidence: 0.95 };
  if (SYNONYMS_PULSE.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'pulse', confidence: 0.95 };
  if (SYNONYMS_HUD.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'hud', confidence: 0.95 };
  if (SYNONYMS_HIDE.some(s => q.startsWith(s) || q.includes(s + ' '))) return { type: 'hide_feature', confidence: 0.9 };
  if (SYNONYMS_SHOW.some(s => q.startsWith(s) || q.includes(s + ' ')) && !SYNONYMS_NAV.some(s => q.startsWith(s))) return { type: 'show_feature', confidence: 0.85 };
  if (SYNONYMS_EXPORT.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'export', confidence: 0.95 };
  if (SYNONYMS_FILTER.some(s => q === s || q.startsWith(s + ' ') || q.includes(' ' + s))) return { type: 'filter', confidence: 0.95 };
  if (SYNONYMS_MODE.some(s => q.includes(s))) return { type: 'mode_switch', confidence: 0.9 };
  if (SYNONYMS_THEME.some(s => q.includes(s))) return { type: 'theme', confidence: 0.85 };
  if (SYNONYMS_HELP.some(s => q.startsWith(s) || q === '?')) return { type: 'help', confidence: 0.9 };
  if (SYNONYMS_NAV.some(s => q.startsWith(s))) return { type: 'navigate', confidence: 0.8 };
  return { type: 'general', confidence: 0.5 };
}

const TYPO_MAP: Record<string, string> = {
  rubrik: 'rubric',
  rubrix: 'rubric',
  rostor: 'roster',
  rostr: 'roster',
  studnet: 'student',
  studnets: 'student',
  stduent: 'student',
  projctor: 'projector',
  projecktor: 'projector',
  excle: 'excel',
  exel: 'excel',
  dispacher: 'dispatcher',
  dispach: 'dispatcher',
  anonymus: 'anonymous',
  anonymos: 'anonymous',
  autogrpu: 'autogroup',
  autogrup: 'autogroup',
  submited: 'submitted',
  submitt: 'submitted',
  calibaration: 'calibration',
  calbrate: 'calibration',
  presetts: 'presets',
  peset: 'preset',
  guid: 'guide',
  guidence: 'guidance',
  precent: 'percent',
  precentage: 'percentage',
  anomoly: 'anomaly',
  anomolies: 'anomalies',
  colusion: 'collusion',
  deadlin: 'deadline',
  dedline: 'deadline',
  persentation: 'presentation',
  presenation: 'presentation',
  icebraker: 'icebreaker',
  agrement: 'agreement',
  enrolment: 'enrollment',
  quetions: 'questions',
  matrx: 'matrix',
  radr: 'radar',
  morle: 'morale',
};

function tokenize(s: string): string[] {
  const rawTokens = s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
  const result: string[] = [];
  rawTokens.forEach(t => {
    result.push(t);
    if (TYPO_MAP[t]) {
      result.push(TYPO_MAP[t]);
    }
  });
  return result;
}

export function parsePrefix(raw: string): { prefix: '@' | '#' | '>' | '?' | '=' | null; cleanQuery: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@')) return { prefix: '@', cleanQuery: trimmed.slice(1).trim() };
  if (trimmed.startsWith('#')) return { prefix: '#', cleanQuery: trimmed.slice(1).trim() };
  if (trimmed.startsWith('>')) return { prefix: '>', cleanQuery: trimmed.slice(1).trim() };
  if (trimmed.startsWith('?')) return { prefix: '?', cleanQuery: trimmed.slice(1).trim() };
  if (trimmed.startsWith('=')) return { prefix: '=', cleanQuery: trimmed.slice(1).trim() };
  return { prefix: null, cleanQuery: trimmed };
}

function isFuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  if (a.length < 4 || b.length < 4) return false;
  let edits = 0;
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] !== b[j]) {
      edits++;
      if (edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    } else {
      i++;
      j++;
    }
  }
  if (i < a.length || j < b.length) edits++;
  return edits <= 1;
}

function scoreItem(item: CPAction, queryTokens: string[], rawQ: string, intent: NLPIntent): number {
  if (!rawQ.trim()) return 0;
  let sc = 0;
  const titleL = item.title.toLowerCase();
  const subL = (item.subtitle || '').toLowerCase();
  const kws = (item.keywords || []).map(k => k.toLowerCase());

  if (titleL === rawQ) sc += 200;
  else if (titleL.startsWith(rawQ)) sc += 120;
  else if (titleL.includes(rawQ)) sc += 70;

  if (subL.includes(rawQ)) sc += 35;

  queryTokens.forEach(tok => {
    if (tok.length < 2) return;
    if (titleL.includes(tok)) sc += 55;
    if (subL.includes(tok)) sc += 22;

    const titleTokens = tokenize(titleL);
    if (titleTokens.some(w => isFuzzyMatch(tok, w))) {
      sc += 40;
    }

    kws.forEach(kw => {
      if (kw === tok) sc += 60;
      else if (kw.startsWith(tok)) sc += 40;
      else if (kw.includes(tok)) sc += 25;
      else if (tok.includes(kw) && kw.length > 3) sc += 15;
      else if (isFuzzyMatch(tok, kw)) sc += 35;
    });
  });

  if (intent.type === 'calc_math' && (item.id.includes('math') || item.category === 'Actions')) sc += 160;
  if (intent.type === 'random_caller' && (item.id.includes('random') || item.id.includes('roll') || item.keywords?.includes('random'))) sc += 170;
  if (intent.type === 'eval_lock' && (item.id.includes('eval_round') || item.keywords?.includes('unlock') || item.keywords?.includes('lock'))) sc += 160;
  if (intent.type === 'pin_dock' && (item.id.startsWith('pin_module_') || item.keywords?.includes('pin'))) sc += 145;
  if (intent.type === 'outliers' && (item.id.includes('outlier') || item.keywords?.includes('outlier') || item.keywords?.includes('anomaly'))) sc += 140;
  if (intent.type === 'unsubmitted' && (item.id.includes('pending') || item.keywords?.includes('unsubmitted') || item.keywords?.includes('missing'))) sc += 140;
  if (intent.type === 'help' && item.category === 'Help') sc += 50;
  if (intent.type === 'hide_feature' && item.category === 'Features' && item.intentTag === 'hide') sc += 80;
  if (intent.type === 'show_feature' && item.category === 'Features' && item.intentTag === 'show') sc += 80;
  if (intent.type === 'mode_switch' && item.category === 'Modes') sc += 60;
  if (intent.type === 'theme' && item.category === 'Appearance') sc += 60;
  if (intent.type === 'navigate' && item.category === 'Navigation') sc += 30;
  if (intent.type === 'presentation' && (item.id.includes('presentation') || item.title.toLowerCase().includes('presentation') || item.keywords?.some(k => ['presentation', 'pitch', 'leaderboard', 'live scoring'].includes(k)))) sc += 110;
  if (intent.type === 'charter' && (item.id.includes('charter') || item.title.toLowerCase().includes('charter') || item.title.toLowerCase().includes('roles') || item.keywords?.some(k => ['icebreaker', 'roles', 'agreements', 'kickoff'].includes(k)))) sc += 110;
  if (intent.type === 'enrollment_builder' && (item.id.includes('enrollment_builder') || item.keywords?.some(k => ['form builder', 'custom questions', 'enrollment questions'].includes(k)))) sc += 110;
  if (intent.type === 'matrix' && (item.id.includes('matrix') || item.keywords?.some(k => ['who rated whom', 'detailed matrix', 'cross matrix', 'ratings matrix'].includes(k)) || item.title.toLowerCase().includes('matrix'))) sc += 110;
  if (intent.type === 'pulse' && (item.id.includes('pulse') || item.keywords?.some(k => ['pulse', 'team health', 'morale', 'blocker'].includes(k)) || item.title.toLowerCase().includes('pulse'))) sc += 110;
  if (intent.type === 'hud' && (item.id.includes('hud') || item.keywords?.some(k => ['quicklook', 'hud', 'spacebar', 'inspect student'].includes(k)))) sc += 110;
  if (intent.type === 'branding' && (item.id.includes('branding') || item.keywords?.some(k => ['branding', 'logo', 'course badge', 'term banner'].includes(k)) || item.title.toLowerCase().includes('branding'))) sc += 120;
  if (intent.type === 'density' && (item.id.includes('density') || item.keywords?.some(k => ['density', 'compact', 'balanced', 'spacious'].includes(k)) || item.title.toLowerCase().includes('density'))) sc += 120;
  if (intent.type === 'presets' && (item.id.includes('preset') || item.id.includes('layout') || item.keywords?.some(k => ['preset', 'layout library', 'template'].includes(k)))) sc += 120;
  if (intent.type === 'export' && (item.badge === 'Export' || item.badge === 'Excel' || item.badge === 'Pulse CSV' || item.badge === 'Canvas' || item.badge === 'Moodle' || item.badge === 'Blackboard' || item.badge === 'Brightspace' || item.badge === 'PDF' || item.badge === 'CSV' || item.keywords?.includes('export') || item.title.toLowerCase().startsWith('export'))) sc += 85;
  if (intent.type === 'filter' && (item.badge === 'Filter' || item.category === 'Teams' || item.keywords?.includes('filter') || item.title.toLowerCase().includes('filter'))) sc += 80;
  if (intent.type === 'clear_action' && (
    item.badge === 'Danger' ||
    item.badge === 'Remove' ||
    item.keywords?.some(k => ['clear', 'delete', 'wipe', 'reset', 'remove', 'purge', 'disband'].includes(k)) ||
    item.title.toLowerCase().includes('clear') ||
    item.title.toLowerCase().includes('delete') ||
    item.title.toLowerCase().includes('wipe')
  )) sc += 95;
  if (item.badge && item.badge.toLowerCase().includes(rawQ)) sc += 20;
  if (item.category.toLowerCase().includes(rawQ)) sc += 15;

  return sc;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx !== -1) {
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(99,102,241,0.22)', color: 'var(--primary)', borderRadius: '3px', padding: '0 2px', fontWeight: 800 }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  }
  const tokens = tokenize(query).filter(t => t.length > 2);
  if (!tokens.length) return text;
  const regex = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((p, i) =>
    regex.test(p) ? (
      <mark key={i} style={{ background: 'rgba(99,102,241,0.22)', color: 'var(--primary)', borderRadius: '3px', padding: '0 2px', fontWeight: 800 }}>
        {p}
      </mark>
    ) : (
      p
    )
  );
}

// ── FEATURE LABELS ────────────────────────────────────────────────────────────
const FL: Record<keyof FeatureToggles, { label: string; desc: string; section: string; icon: React.ElementType }> = {
  showClassPicker:          { label: 'Class Picker',              desc: 'Switch between classroom groups',              section: 'Header',     icon: LayoutDashboard },
  showDeleteClassButton:    { label: 'Delete Class Button',       desc: 'Permanently delete a class button',            section: 'Header',     icon: X },
  showNewClassButton:       { label: 'New Class Button',          desc: 'Create a fresh classroom group button',        section: 'Header',     icon: BookOpen },
  showSettingsButton:       { label: 'Settings Button',           desc: 'Settings & workspace config button',           section: 'Header',     icon: Settings },
  showThemeSwitcher:        { label: 'Theme Switcher',            desc: 'Quick dark/light toggle in top bar',           section: 'Header',     icon: Palette },
  showProfilePill:          { label: 'Profile Pill',              desc: 'User profile badge in the header',             section: 'Header',     icon: Users },
  showProjectorButton:      { label: 'Projector Button',          desc: 'Launch fullscreen projector display',          section: 'Header',     icon: Tv },
  showCommandSearch:        { label: 'Command Search Bar',        desc: 'Smart search/command palette trigger',         section: 'Header',     icon: Search },
  showEmailButton:          { label: 'Email Links to Students',   desc: 'Sends private evaluation links to students via email', section: 'Header', icon: Mail },
  showGuideButton:          { label: 'Help & Guides',             desc: 'Step-by-step guides and tips',                 section: 'Header',     icon: BookOpen },
  showCloudStatus:          { label: 'Cloud Sync / Offline Mode', desc: 'Shows whether class data is saved in Firebase cloud or local browser storage', section: 'Header', icon: Cloud },
  showCustomizeViewButton:  { label: 'Show / Hide Modules',       desc: 'Choose which modules appear on screen',        section: 'Header',     icon: Sliders },
  showEditModeButton:       { label: 'Edit Page Layout',          desc: 'Customize and arrange page modules',           section: 'Header',     icon: Edit3 },
  showQuickActionPill:      { label: 'Quick Tools Button',        desc: 'Floating shortcut menu at bottom of screen',  section: 'Header',     icon: Compass },
  showRetractableDisplay:   { label: 'Dynamic Retractable Display', desc: 'Retractable floating viewport to pin and use any module anywhere', section: 'Header', icon: Pin },
  showSectionNavBreadcrumbs:{ label: 'Step Navigation Bar',       desc: 'Jump between steps 1, 2, and 3',               section: 'Nav',        icon: LayoutDashboard },
  showClassIdBadge:         { label: 'Class ID Badge',            desc: 'Shows the current class ID code',              section: 'Nav',        icon: Tag },
  showHubOverviewBanner:    { label: 'Hub Overview Banner',       desc: 'Welcome banner at the top of the hub',         section: 'Hub',        icon: LayoutDashboard },
  showHubOverviewStats:     { label: 'Hub Overview Stats',        desc: 'Quick summary cards on the hub',               section: 'Hub',        icon: BarChart2 },
  showPresetsBanner:        { label: 'Rubric Presets Banner',     desc: 'One-click rubric templates',                   section: 'Hub',        icon: Sparkles },
  showEnrollmentCard:       { label: 'Students & Teams Card',     desc: 'Step 1 card on the main hub',                  section: 'Hub',        icon: Users },
  showReviewSystemCard:     { label: 'Grading Rubric Card',       desc: 'Step 2 card on the main hub',                  section: 'Hub',        icon: Sliders },
  showGradingAnalyticsCard: { label: 'Grades & Reports Card',     desc: 'Step 3 card on the main hub',                  section: 'Hub',        icon: Award },
  showHubCardMetrics:       { label: 'Hub Card Stats',            desc: 'Summary numbers inside hub cards',             section: 'Hub',        icon: Activity },
  showHubQuickActions:      { label: 'Hub Quick Actions',         desc: 'Shortcut buttons inside hub cards',            section: 'Hub',        icon: Zap },
  showSelfEnrollmentCard:   { label: 'Student Join Code & Link',  desc: 'Generates a QR code and URL for students to register themselves', section: 'Section 1', icon: QrCode },
  showSelfEnrollmentQr:     { label: 'Student Join QR Code',      desc: 'QR code box for students to scan',             section: 'Section 1',  icon: QrCode },
  showSelfEnrollmentPresentationBtn:{ label: 'Projector Join Mode', desc: 'Display QR code full screen for students',  section: 'Section 1',  icon: Eye },
  showQuickActionsCard:     { label: 'Roster Tools',              desc: 'Quick tools to manage your student list',      section: 'Section 1',  icon: Zap },
  showAddStudentButton:     { label: 'Add Student Button',        desc: 'Manually add a student to the roster',         section: 'Section 1',  icon: UserPlus },
  showDemoSampleButton:     { label: 'Load Demo Students',        desc: 'Populates 100 sample students to test the software', section: 'Section 1', icon: Sparkles },
  showClearRosterButton:    { label: 'Clear Roster Button',       desc: 'Remove all students from the class',           section: 'Section 1',  icon: Trash2 },
  showImportWizardCard:     { label: 'Import Spreadsheet',        desc: 'Upload class roster from Excel or CSV',        section: 'Section 1',  icon: Download },
  showImportDropzone:       { label: 'File Upload Box',           desc: 'Drag-and-drop area to upload roster files',    section: 'Section 1',  icon: Download },
  showExportRosterBtn:      { label: 'Export Roster Button',      desc: 'Download roster as CSV or Excel file',         section: 'Section 1',  icon: Download },
  showDownloadTemplateBtn:  { label: 'Download Template Button',  desc: 'Download blank spreadsheet template',          section: 'Section 1',  icon: Download },
  showAutoGroupStudio:      { label: 'Auto-Group Teams',          desc: 'Automatically forms balanced student groups using rules (diversity, skills, size)', section: 'Section 1', icon: Users },
  showAutoGroupTargetSize:  { label: 'Team Size Selector',        desc: 'Set the target number of students per team',   section: 'Section 1',  icon: Users },
  showAutoGroupNamingFormat:{ label: 'Team Name Style',           desc: 'Chooses naming format (e.g., "Team 1", "Group A", "Squad")', section: 'Section 1', icon: Tag },
  showAutoGroupRulesCard:   { label: 'Group Balancing Rules (3 Levels)', desc: '3 priority levels (Low, Med, High) to balance diversity and skills', section: 'Section 1', icon: Settings2 },
  showAutoGroupResetRulesBtn:{ label: 'Rules Header Action Icons',    desc: 'Minimal action icon buttons in rules header',  section: 'Section 1',  icon: RefreshCw },
  showAutoGroupRulePercentages:{ label: 'Rule % Focus Badges',        desc: 'Show or hide percentage weight badges on grouping rules', section: 'Section 1', icon: Percent },
  showAutoGroupDiscoveredFields:{ label: 'Balance by (Gender, Major, etc.)', desc: 'Auto-detected spreadsheet columns to balance across teams', section: 'Section 1', icon: Layers },
  showAutoGroupQuickTargets:{ label: 'Quick Team Targets',        desc: 'Clickable team targets to review balance',     section: 'Section 1',  icon: LayoutDashboard },
  showAutoGroupToolbar:     { label: 'Team Preview Toolbar',      desc: 'Switch views and undo/redo changes',           section: 'Section 1',  icon: Sliders },
  showAutoGroupViewGrid:    { label: 'Grid View',                 desc: 'Show teams as card grid',                      section: 'Section 1',  icon: Grid },
  showAutoGroupViewKanban:  { label: 'Board View',                desc: 'Drag-and-drop column view to move students between teams', section: 'Section 1', icon: LayoutDashboard },
  showAutoGroupViewTable:   { label: 'Table View',                desc: 'Show teams as detailed table',                 section: 'Section 1',  icon: FileText },
  showAutoGroupViewCompact: { label: 'Compact Cards',             desc: 'Dense view showing all teams side-by-side',    section: 'Section 1',  icon: Grid },
  showAutoGroupHistoryControls:{ label: 'Undo / Redo Buttons',    desc: 'Undo or redo group formation steps',           section: 'Section 1',  icon: RefreshCw },
  showAutoGroupUnassignedDrawer:{ label: 'Unassigned Students Drawer', desc: 'Floating staging drawer for unplaced students', section: 'Section 1', icon: Users },
  showAutoGroupSearchFilter:{ label: 'Team Search Filter',        desc: 'Search students within formed groups',         section: 'Section 1',  icon: Filter },
  showAutoGroupBottomBar:   { label: 'Team Action Bar',           desc: 'Buttons to reshuffle and save teams',          section: 'Section 1',  icon: Sliders },
  showAutoGroupShuffleBtn:  { label: 'Reshuffle Button',          desc: 'Instantly generate new balanced teams',        section: 'Section 1',  icon: Sparkles },
  showAutoGroupCharterBtn:  { label: 'Team Roles & Icebreaker',   desc: 'Assigns student roles (Lead, Scribe, Presenter) and sets group agreements', section: 'Section 1', icon: Sparkles },
  showAutoGroupApplyBtn:    { label: 'Save Groups Button',        desc: 'Save and apply generated teams to roster',     section: 'Section 1',  icon: Check },
  showAutoGroupRuleCompliance: { label: 'Rule Compliance Overall Score', desc: 'Displays overall diversity rule compliance score', section: 'Section 1', icon: CheckCircle2 },
  showAutoGroupWeightDistribution: { label: 'Weight Distribution Bar', desc: 'Shows criteria weight allocation across rules', section: 'Section 1', icon: Sliders },
  showAutoGroupDiversityPercentages: { label: 'Team Diversity % Scores', desc: 'Displays percentage score badges on team card headers', section: 'Section 1', icon: BarChart2 },
  showAutoGroupDiversityStrip: { label: 'Rule Satisfaction Strip', desc: 'Displays percentage satisfaction strip under team headers', section: 'Section 1', icon: Sliders },
  showAutoGroupTeamComposition: { label: 'Team Composition Summary', desc: 'Displays summary counts (Countries, Unis, Gender) under team headers', section: 'Section 1', icon: Globe },
  showAutoGroupStudentDemographics: { label: 'Student Demographics Row', desc: 'Displays country, gender, and language metadata on student cards', section: 'Section 1', icon: Users },
  showExportButtons:        { label: 'Export Buttons',            desc: 'Buttons to download roster files',             section: 'Section 1',  icon: Download },
  showRosterSearchFilter:   { label: 'Student Search Bar',        desc: 'Search and filter the student roster table',   section: 'Section 1',  icon: Filter },
  showRosterAddStudentBtn:  { label: 'Add Student (Table)',       desc: 'Quick button to add a student to table',       section: 'Section 1',  icon: UserPlus },
  showBulkActionBar:        { label: 'Bulk Action Bar',           desc: 'Actions for multiple selected students',       section: 'Section 1',  icon: Grid },
  showDuplicateDetector:    { label: 'Duplicate Student Alert',   desc: 'Flags identical student names, IDs, or emails in the roster', section: 'Section 1', icon: HelpCircle },
  showRosterTable:          { label: 'Student Roster Table',      desc: 'Complete list of all enrolled students',       section: 'Section 1',  icon: FileText },
  showTeamOverviewCards:    { label: 'Team Overview Cards',       desc: 'Cards showing all teams and their members',    section: 'Section 1',  icon: Globe },
  showTeamKickoffAndRoles:  { label: 'Team Roles & Icebreaker',   desc: 'Assigns student roles (Lead, Scribe, Presenter) and sets group agreements', section: 'Section 1', icon: UserPlus },
  showRubricHeader:         { label: 'Rubric Header',             desc: 'Title and controls for grading rubric',        section: 'Section 2',  icon: Sliders },
  showRubricPresets:        { label: 'Rubric Presets',            desc: 'Pre-made rubric templates (IPAF, CATME, etc.)',section: 'Section 2',  icon: Sparkles },
  showTargetScaleCard:      { label: 'Grade Scale', desc: 'Sets whether final grades are out of 20, 100, or a custom maximum', section: 'Section 2', icon: Gauge },
  showDeadlineTimer:        { label: 'Submission Deadline',       desc: 'Sets the date/time when peer evaluation closes', section: 'Section 2', icon: Clock },
  showWeightBalanceBar:     { label: 'Weight Total (100%)',       desc: 'Shows whether your criteria percentages add up to 100%', section: 'Section 2', icon: BarChart2 },
  showCustomCriterionButton:{ label: 'Add Criterion Button',      desc: 'Add a new grading criteria to the rubric',     section: 'Section 2',  icon: Zap },
  showCriterionCards:       { label: 'Criteria Cards',            desc: 'Cards to edit each grading criteria',          section: 'Section 2',  icon: Sliders },
  showEvaluationSimulator:  { label: 'Preview Student View',      desc: 'Test-drives what students see when filling out peer reviews on their phones/laptops', section: 'Section 2', icon: Eye },
  showEvaluationFormControls:{ label: 'Feedback Settings',        desc: 'Toggles praise badges, written comments, and self-evaluations', section: 'Section 2', icon: Sliders },
  showTeamHealthPulse:      { label: 'Team Health Check-ins',     desc: 'Quick 30-second morale and blocker check-ins during group projects', section: 'Section 2', icon: Activity },
  showLivePresentationScoring:{ label: 'Live Presentation Scoring', desc: 'Lets audience and professors score live group presentations in real time', section: 'Section 2', icon: Tv },
  showResultsHeaderCard:    { label: 'Grades Overview Card',      desc: 'High-level class grade stats summary',         section: 'Section 3',  icon: BarChart2 },
  showExportReportButtons:  { label: 'Export Report Buttons',     desc: 'Export to Excel, PDF, or CSV',                 section: 'Section 3',  icon: Download },
  showSubmissionReset:      { label: 'Reset Reviews Button',      desc: 'Clear submitted reviews for a fresh round',    section: 'Section 3',  icon: RefreshCw },
  showCompetencyRadar:      { label: 'Skills Radar Chart',        desc: 'Visual chart comparing team strengths across all rubric criteria', section: 'Section 3', icon: Activity },
  showJohariMatrix:         { label: 'Self vs. Peer Rating Comparison', desc: 'Shows if students rate themselves much higher or lower than teammates rated them', section: 'Section 3', icon: Grid },
  showQualitativeFeedback:  { label: 'Written Feedback Summary',  desc: 'Summarizes common themes and praise words written by teammates', section: 'Section 3', icon: FileText },
  showWebPACalibration:     { label: 'Peer Score Adjustment',     desc: 'Adjusts individual student grades up or down based on teammate reviews', section: 'Section 3', icon: Sliders },
  showInspectCalculationsBtn: { label: 'Inspect Calculations Button', desc: 'Modal launcher to inspect step-by-step WebPA algorithm and peer score math', section: 'Section 3', icon: Calculator },
  showPeerImpactGuide:      { label: 'Peer Impact Guide',         desc: 'Educational guide explaining peer adjustments and weighting factors', section: 'Section 3', icon: BookOpen },
  showAnomalyAudit:         { label: 'Suspicious Ratings Alert',  desc: 'Detects students who trade high scores, grade randomly, or give uniform marks', section: 'Section 3', icon: HelpCircle },
  showMilestonesHistory:    { label: 'Past Review Rounds',        desc: 'Archives past peer evaluations (e.g., Midterm Review, Final Review)', section: 'Section 3', icon: Clock },
  showLmsExport:            { label: 'Export to Canvas / Blackboard / Moodle', desc: '1-click grade exports formatted for standard school LMS gradebooks', section: 'Section 3', icon: GraduationCap },
  showResultsSummarySheet:  { label: 'Class Gradebook Table',     desc: 'Complete gradebook table with all student scores', section: 'Section 3', icon: FileText },
  showGradebookSearchFilter:{ label: 'Gradebook Search Filter',   desc: 'Search and sort filters for the gradebook',    section: 'Section 3',  icon: Filter },
  showDetailedReviewMatrix: { label: 'Who Rated Whom Grid',       desc: 'Breakdown table showing exactly who gave what score to whom', section: 'Section 3', icon: Grid },
  showTeammateAuditLog:     { label: 'Student Comments Log',      desc: 'Full list of written feedback comments per team', section: 'Section 3', icon: FileText },
  showFooterBrandLogo:      { label: 'Footer Logo',               desc: 'Show PeerLens logo in footer',                 section: 'Footer',     icon: Sparkles },
  showFooterBrandName:      { label: 'Footer Name',               desc: 'Show PeerLens name in footer',                 section: 'Footer',     icon: Tag },
  showFooterBrandTagline:   { label: 'Footer Tagline',            desc: 'Show subtitle tagline in footer',              section: 'Footer',     icon: FileText },
  showFooterWorkspaceContext:{ label: 'Footer Class Info',        desc: 'Show active class and profile in footer',      section: 'Footer',     icon: Users },
  showFooterDoubleBlindBadge:{ label: '100% Anonymous Reviews',   desc: 'Assures students that teammates cannot see who gave which score', section: 'Footer', icon: Zap },
  showFooterSecurePrivateBadge:{ label: 'Private & Secure Badge', desc: 'Show local encryption trust badge in footer',  section: 'Footer',     icon: HelpCircle },
  showFooterCopyright:      { label: 'Footer Copyright',          desc: 'Show copyright notice in footer',              section: 'Footer',     icon: Clock },
};

// ── RECENT COMMANDS ───────────────────────────────────────────────────────────
const RECENT_KEY = 'peer_recent_commands';
function loadRecent(): string[] {
  try {
    const s = localStorage.getItem(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}
function pushRecent(id: string) {
  try {
    const e = loadRecent().filter(x => x !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...e].slice(0, 8)));
  } catch {}
}

// ── CATEGORY COLOURS ──────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Navigation: '#6366f1',
  Actions:    '#0ea5e9',
  Students:   '#f59e0b',
  Teams:      '#10b981',
  Help:       '#8b5cf6',
  Appearance: '#ec4899',
  Features:   '#3b82f6',
  Modes:      '#14b8a6',
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
export interface CPAction {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Students' | 'Teams' | 'Help' | 'Appearance' | 'Features' | 'Modes';
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  helpItem?: FeatureInfoItem;
  intentTag?: 'show' | 'hide';
  featureKey?: keyof FeatureToggles;
  onExecute: () => void;
}

export type CommandPaletteAction = CPAction;

type CategoryId = 'all' | 'actions' | 'features' | 'modes' | 'students' | 'teams' | 'calc' | 'help' | 'appearance';

const CATEGORY_TABS: { id: CategoryId; label: string; icon: React.ElementType; cats: string[]; prefix?: string }[] = [
  { id: 'all',        label: 'All',        icon: Layers,      cats: [] },
  { id: 'actions',    label: 'Actions',    icon: Zap,         cats: ['Actions', 'Navigation'], prefix: '>' },
  { id: 'features',   label: 'Features',   icon: ToggleLeft,  cats: ['Features'] },
  { id: 'modes',      label: 'Modes',      icon: Cpu,         cats: ['Modes'] },
  { id: 'students',   label: 'Students',   icon: Users,       cats: ['Students'], prefix: '#' },
  { id: 'teams',      label: 'Teams',      icon: Tag,         cats: ['Teams'], prefix: '@' },
  { id: 'calc',       label: 'Math',       icon: Calculator,  cats: ['Actions'], prefix: '=' },
  { id: 'help',       label: 'Guides',     icon: HelpCircle,  cats: ['Help'], prefix: '?' },
  { id: 'appearance', label: 'Theme',      icon: Palette,     cats: ['Appearance'] },
];

function detectActiveMode(ft: FeatureToggles): 'minimal' | 'standard' | 'full' | 'none' | 'custom' {
  const keys = Object.keys(FULL_FEATURE_TOGGLES) as (keyof FeatureToggles)[];
  if (keys.every(k => !ft[k])) return 'none';
  if (keys.every(k => ft[k] === FULL_FEATURE_TOGGLES[k])) return 'full';
  if (keys.every(k => ft[k] === MINIMAL_FEATURE_TOGGLES[k])) return 'minimal';
  if (keys.every(k => ft[k] === DEFAULT_FEATURE_TOGGLES[k])) return 'standard';
  return 'custom';
}

function getIntentFeedback(intent: NLPIntent, q: string, count: number): string | null {
  if (!q.trim() && intent.type === 'general') return null;
  switch (intent.type) {
    case 'calc_math': return `Academic Score & Percentage Calculator active — press Enter to copy or apply result`;
    case 'random_caller': return `Random Student Spotlight Generator — pick an active student for live presentations`;
    case 'eval_lock': return `Evaluation Round Access Control — 1-click lock or unlock student review portals`;
    case 'pin_dock': return `Dock & Module Workspace Pinning — pin any module into the floating retractable dock`;
    case 'outliers': return `Grade Outlier & Anomaly Audit — inspect flagged students with extreme WebPA ratios`;
    case 'unsubmitted': return `Pending Reviews & Missing Submissions Tracker — send nudges or review missing roster`;
    case 'presentation': return `Live Presentation Cockpit & Mobile Scoring found — press Enter to launch`;
    case 'charter':      return `Team Kickoff & Agreements Studio found — assign roles & launch 5-min icebreakers`;
    case 'enrollment_builder': return `Custom Enrollment Questions Designer — configure self-registration fields`;
    case 'matrix':       return `Who-Rated-Whom Cross Matrix Audit — inspect raw evaluation scores & transmissions`;
    case 'pulse':        return `Team Health Micro-Pulse Check-in rounds & blocker analysis`;
    case 'hud':          return `Student QuickLook HUD — hover over any student row and press Space`;
    case 'branding':     return `Institutional Branding & Custom Header — customize logo, badges & banners`;
    case 'density':      return `Display Density Engine — switch between Compact, Balanced, and Spacious`;
    case 'presets':      return `Layout Library & Workspace Presets — apply professor-tailored templates`;
    case 'hide_feature': return `Hiding features matching "${q}" — press Enter or click to toggle`;
    case 'show_feature': return `Showing features matching "${q}" — press Enter or click to toggle`;
    case 'mode_switch':  return `Mode presets found — apply Minimal, Standard, or Full`;
    case 'help':         return `Found ${count} guide article${count !== 1 ? 's' : ''} for "${q}"`;
    case 'navigate':     return `Navigation targets for "${q}"`;
    case 'theme':        return `Theme & appearance options`;
    case 'export':       return `Direct export shortcuts for "${q}" — download Excel, Canvas, Moodle, PDF, CSV`;
    case 'filter':       return `Quick filter jumpers matching "${q}" — click or press Enter to set`;
    case 'clear_action': return `Roster & data clearing actions matching "${q}" — execute safely with confirmation`;
    default:             return null;
  }
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  featureToggles: FeatureToggles;
  onToggleFeature: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyMode: (mode: 'minimal' | 'standard' | 'full' | 'none') => void;
  onNavigateTab: (tab: 'roster' | 'grading' | 'results' | 'hub') => void;
  onOpenProjector: () => void;
  onOpenDispatcher: () => void;
  onOpenSettings: (tab?: 'email' | 'cloud' | 'shortcuts' | 'modules') => void;
  onOpenShortcuts: () => void;
  onOpenAddStudent: () => void;
  onOpenReportModal: (studentId?: string) => void;
  onExportExcel: () => void;
  onOpenTour?: () => void;
  onOpenGuideCenter?: (tab?: 'system' | 'tours' | 'features') => void;
  onSelectTeamFilter?: (teamName: string) => void;
  onSetFilter?: (filter: { group?: string; search?: string; duplicatesOnly?: boolean }) => void;
  onApplyRubricPreset?: (presetId: string) => void;
  onSetTargetScale?: (scale: number | null) => void;
  onSetFudgeWeight?: (weight: number) => void;
  onExportLMS?: (platform: 'canvas' | 'blackboard' | 'moodle' | 'brightspace') => void;
  onExportResultsCSV?: () => void;
  onExportPDFSummary?: () => void;
  onOpenNewClass?: () => void;
  onOpenImportWizard?: () => void;
  onOpenAutoGroup?: () => void;
  onOpenQRCode?: () => void;
  onOpenDeadline?: () => void;
  onResetSubmissions?: () => void;
  onClearRoster?: () => void;
  onDeleteStudent?: (studentId: string, studentName: string) => void;
  onDeleteClass?: () => void;
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onOpenEvaluationControls?: () => void;
  onUpdateEvaluationControls?: (controls: Partial<EvaluationFormControls>) => void;
  onToggleExcused?: (studentId: string, reason?: string) => void;
  onOpenEditMode?: () => void;
  shortcutsEnabled?: boolean;
  onToggleShortcutsEnabled?: (enabled: boolean) => void;
  onOpenTeamCharter?: () => void;
  onOpenLivePresentation?: () => void;
  onOpenEnrollmentBuilder?: () => void;
  onOpenSnapshots?: () => void;
  onOpenLayoutLibrary?: () => void;
  onOpenBranding?: () => void;
  displayDensity?: DisplayDensity;
  onSetDisplayDensity?: (density: DisplayDensity) => void;
  onResetLayout?: () => void;
}

// ── RESULT ROW COMPONENT (MINIMAL & POLISHED) ─────────────────────────────────
interface ResultRowProps {
  item: CPAction;
  isSelected: boolean;
  query: string;
  isPinned?: boolean;
  onSelect: () => void;
  onExecute: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ item, isSelected, query, isPinned, onSelect, onExecute }) => {
  const IconComp = item.icon;
  const catColor = CAT_COLOR[item.category] ?? '#6366f1';
  const isPositiveBadge = item.badge === 'Active' || item.badge?.includes('Visible') || item.badge === 'Submitted';

  return (
    <div
      data-selected={isSelected ? 'true' : undefined}
      onClick={onExecute}
      onMouseEnter={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.46rem 0.75rem',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.09)' : 'transparent',
        border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.28)' : 'transparent'}`,
        transition: 'background-color 80ms ease, border-color 80ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: isSelected ? `${catColor}1a` : 'var(--bg-app)',
            color: isSelected ? catColor : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${isSelected ? `${catColor}33` : 'var(--border-color)'}`,
            transition: 'all 80ms ease',
          }}
        >
          <IconComp size={14} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: isSelected ? 700 : 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {query.trim() ? highlightText(item.title, query) : item.title}
            </span>

            {item.badge && (
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.08rem 0.38rem',
                  borderRadius: '6px',
                  flexShrink: 0,
                  backgroundColor: item.badgeColor
                    ? `${item.badgeColor}1c`
                    : isPositiveBadge
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'var(--border-color)',
                  color: item.badgeColor
                    ? item.badgeColor
                    : isPositiveBadge
                    ? '#10b981'
                    : 'var(--text-secondary)',
                  border: item.badgeColor ? `1px solid ${item.badgeColor}33` : 'none',
                }}
              >
                {item.badge}
              </span>
            )}

            {isPinned && (
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '0.06rem 0.35rem',
                  borderRadius: '4px',
                  flexShrink: 0,
                  backgroundColor: 'rgba(245, 158, 11, 0.16)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
                title="Currently pinned to Workspace Dock"
              >
                <Pin size={8} style={{ transform: 'rotate(45deg)' }} />
                <span>Pinned</span>
              </span>
            )}
          </div>

          {item.subtitle && (
            <span
              style={{
                fontSize: '0.71rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '0.04rem',
                lineHeight: 1.25,
              }}
            >
              {item.subtitle}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            color: 'var(--primary)',
            fontSize: '0.69rem',
            fontWeight: 700,
            padding: '0.14rem 0.44rem',
            borderRadius: '5px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.22)',
            flexShrink: 0,
          }}
        >
          <CornerDownLeft size={11} />
          <span>
            {item.category === 'Features'
              ? item.intentTag === 'show' ? 'Enable' : 'Disable'
              : item.category === 'Modes'
              ? 'Apply'
              : item.category === 'Help'
              ? 'Read'
              : item.badge === 'Filter' || item.category === 'Teams'
              ? 'Filter'
              : item.badge === 'Export' || item.badge === 'Excel' || item.badge === 'Canvas' || item.badge === 'Moodle' || item.badge === 'Blackboard' || item.badge === 'Brightspace' || item.badge === 'PDF' || item.badge === 'CSV' || item.keywords?.includes('export')
              ? 'Download'
              : 'Run'}
          </span>
        </div>
      )}
    </div>
  );
};

// ── MEANINGFUL TELEMETRY & CONTEXT BUILDER FOR PREVIEW PANE ────────────────
interface ActionDetails {
  purpose?: string;
  telemetry: { label: string; value: string; color?: string }[];
  specs: { scope: string; safety: string; trigger: string };
  actionLabel: string;
  section?: string;
  capabilities?: string[];
  moduleKey?: keyof FeatureToggles;
  isFeatureToggle?: boolean;
  featureIsOn?: boolean;
}

function getFeatureCapabilities(key?: keyof FeatureToggles): string[] {
  if (!key) {
    return [
      'Real-time client-side DOM render without page reload',
      'Layout state automatically saved to your profile',
      'Accessible across all enrolled classroom sections'
    ];
  }
  switch (key) {
    case 'showCompetencyRadar':
      return [
        'Multi-axis radar comparing individual scores vs. team averages',
        'Visualizes skill imbalances and identifies team leadership anchors',
        'Accreditation-ready metric for ABET & AACSB competency rubrics'
      ];
    case 'showLmsExport':
      return [
        'FERPA-compliant CSV / JSON output for Canvas SpeedGrader',
        'Supports Moodle, Blackboard Ultra, and Brightspace D2L schemas',
        'Automatic WebPA penalty multiplier computation for LMS gradebooks'
      ];
    case 'showTeamHealthPulse':
      return [
        '30-second weekly sentiment check-ins for active student teams',
        'Sparklines for team morale trends and early sprint roadblock warnings',
        'Configurable Likert, Star rating, and Traffic Light scales'
      ];
    case 'showJohariMatrix':
      return [
        'Cross-examines self-ratings vs. peer evaluation ratings',
        'Identifies blind spots, hidden strengths, and impostor syndrome',
        'Flags potential collusion or retaliatory score discrepancies'
      ];
    case 'showAnomalyAudit':
      return [
        'Mathematical outlier detector (|Self - Peer| > 1.5 multiplier)',
        'Flags uniform scoring, retaliatory marks, and reciprocal grading pacts',
        'Provides 1-click audit dossier for academic dispute hearings'
      ];
    case 'showWebPACalibration':
      return [
        'Interactive dampening weight slider (0% neutral to 100% pure peer)',
        'Calculates individual contribution multipliers relative to group mark',
        'Prevents free-riders from sharing identical group grades'
      ];
    case 'showDetailedReviewMatrix':
      return [
        'Complete who-rated-whom cross tabular matrix with raw criterion scores',
        'Audits reviewer variance and identifies harsh vs. lenient graders',
        'Exportable raw evaluation matrix for institutional records'
      ];
    case 'showEvaluationFormControls':
      return [
        'Toggle praise chips, constructive feedback, and self-review fields',
        'Freeze student profiles to prevent unauthorized roster alterations',
        'Lock or unlock review submission portals with 1 click'
      ];
    case 'showTeamOverviewCards':
      return [
        'High-density cohort overview cards with student role assignments',
        'Review submission progress bars per team with missing alerts',
        'Instant 1-click filter dashboard to specific team'
      ];
    case 'showLivePresentationScoring':
      return [
        'Real-time projector and mobile presentation evaluation cockpit',
        'Synchronized peer and professor rubric scoring during live talks',
        'Instant aggregated audience feedback and timer countdown'
      ];
    case 'showAutoGroupStudentDemographics':
      return [
        'Displays gender, nationality, and programming skill balance chips',
        'Ensures balanced student representation in project cohorts',
        'Supports multi-objective optimization with constraint solver'
      ];
    default:
      return [
        'Real-time client-side DOM render without page reload',
        'Layout state automatically saved to your profile',
        'Accessible across all enrolled classroom sections'
      ];
  }
}

function getActionMeaningfulInfo(
  item: CPAction,
  classData: ClassData | null,
  featureToggles: FeatureToggles,
  activeMode: string
): ActionDetails {
  const totalStudents = classData?.students.length || 0;
  const submittedCount = classData?.students.filter(s => s.submitted).length || 0;
  const unsubmittedCount = totalStudents - submittedCount;
  const pct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
  const distinctTeams = Array.from(new Set(classData?.students.map(s => s.groupName).filter(Boolean)));
  const reviewsCount = classData?.reviews.length || 0;
  const isLocked = classData?.evaluationControls?.unlockMainPeerReview === false;
  const excusedCount = classData?.students.filter(s => s.isExcused).length || 0;
  const targetScale = classData?.targetScale || 100;
  const idLower = item.id.toLowerCase();
  const titleLower = item.title.toLowerCase();

  // 1. Snapshots & Version History
  if (idLower.includes('snapshot') || titleLower.includes('snapshot') || titleLower.includes('version history')) {
    return {
      purpose: 'Creates or inspects immutable point-in-time state images. Allows safe rollbacks of student rosters, scores, and WebPA multiplier configurations.',
      telemetry: [
        { label: 'Checkpoints', value: 'Persistent System', color: '#6366f1' },
        { label: 'Class Roster', value: `${totalStudents} Enrolled (${distinctTeams.length} Teams)` },
        { label: 'Review Records', value: `${reviewsCount} Evaluations Recorded` },
        { label: 'Rollback Safety', value: 'Non-Destructive Stack', color: '#10b981' }
      ],
      specs: { scope: 'Full Classroom State', safety: 'Non-Destructive', trigger: '↵ Enter' },
      actionLabel: 'Open Snapshot Manager (↵)',
      section: 'Section 3: Grading & Analytics',
      capabilities: [
        'Creates immutable timestamped JSON state checkpoints',
        'One-click rollback of grades, multipliers, and rosters',
        'Non-destructive diff inspection before restoring'
      ]
    };
  }

  // 2. AutoGroup Solver & Team Management
  if (idLower.includes('autogroup') || titleLower.includes('autogroup') || idLower.includes('smart group')) {
    return {
      purpose: 'Heuristic constraint solver that automatically partitions the classroom into balanced cohorts based on skill diversity, gender distribution, and GPA spread.',
      telemetry: [
        { label: 'Total Students', value: `${totalStudents} Active Students` },
        { label: 'Current Cohorts', value: `${distinctTeams.length} Teams Established` },
        { label: 'Target Team Size', value: `~${(totalStudents / (distinctTeams.length || 1)).toFixed(1)} Students/Team` },
        { label: 'Constraint Engine', value: 'Balanced Heuristics', color: '#10b981' }
      ],
      specs: { scope: 'Classroom Teams', safety: 'Draft Preview First', trigger: '↵ Enter' },
      actionLabel: 'Launch AutoGroup Solver (↵)',
      section: 'Section 1: Enrollment & Teams',
      capabilities: [
        'Multi-objective genetic solver balancing diversity & skill',
        'Prevents isolated minorities and balances GPA spread',
        'Draft preview with 1-click roster commit and rollback'
      ]
    };
  }

  // 3. Link Dispatcher & Email Reminders
  if (idLower.includes('dispatcher') || titleLower.includes('dispatcher') || titleLower.includes('reminder') || titleLower.includes('email')) {
    return {
      purpose: 'Generates secure tokenized evaluation URLs for students and dispatches automated reminder nudges with personalized submission links.',
      telemetry: [
        { label: 'Pending Reviews', value: `${unsubmittedCount} Students Awaiting`, color: unsubmittedCount > 0 ? '#f59e0b' : '#10b981' },
        { label: 'Submission Rate', value: `${pct}% (${submittedCount}/${totalStudents})` },
        { label: 'Delivery Mode', value: 'Magic Token Links' },
        { label: 'Nudge Engine', value: '1-Click Broadcast', color: '#6366f1' }
      ],
      specs: { scope: 'Student Communications', safety: 'FERPA Compliant', trigger: '↵ Enter' },
      actionLabel: 'Open Link Dispatcher (↵)',
      section: 'Section 1: Enrollment & Teams',
      capabilities: [
        'Magic token evaluation links with personalized student URLs',
        'FERPA & GDPR compliant student privacy preservation',
        'Real-time delivery and submission status tracking'
      ]
    };
  }

  // 4. Export Engines (Excel, LMS, CSV, PDF)
  if (item.category === 'Actions' && (idLower.includes('export') || titleLower.includes('export') || item.badge?.includes('Export') || item.badge?.includes('Excel') || item.badge?.includes('Canvas') || item.badge?.includes('Moodle'))) {
    return {
      purpose: 'Compiles normalized peer ratings, raw score matrices, individual WebPA multipliers, and grade penalty divisors formatted for institutional LMS ingestion.',
      telemetry: [
        { label: 'Target Cohort', value: `Entire Class (${totalStudents} Students)` },
        { label: 'Grading Ceiling', value: `0 to ${targetScale} Maximum Pts` },
        { label: 'Data Included', value: 'WebPA, Z-Scores & Comments' },
        { label: 'Compatibility', value: 'Excel, Canvas, Moodle, CSV', color: '#10b981' }
      ],
      specs: { scope: 'Full Gradebook Export', safety: 'Read-Only Download', trigger: '↵ Enter' },
      actionLabel: 'Execute Grade Export (↵)',
      section: 'Section 3: Grading & Analytics',
      capabilities: [
        'Pre-formatted CSV, Excel, Canvas & Moodle schemas',
        'Includes individual WebPA multipliers & student feedback',
        'Raw evaluation scores matrix exportable for audits'
      ]
    };
  }

  // 5. Evaluation Round & Lock Controls
  if (idLower.includes('eval_lock') || idLower.includes('unlock') || titleLower.includes('unlock') || titleLower.includes('round') || titleLower.includes('evaluation controls')) {
    return {
      purpose: 'Controls student portal submission access. Opening the round allows students to submit ratings; locking freezes all scores for instructor moderation and final grading.',
      telemetry: [
        { label: 'Current State', value: isLocked ? 'Locked (Frozen)' : 'Open (Accepting)', color: isLocked ? '#ef4444' : '#10b981' },
        { label: 'Completed Reviews', value: `${submittedCount} of ${totalStudents} (${pct}%)` },
        { label: 'Pending Students', value: `${unsubmittedCount} Students Remaining`, color: unsubmittedCount > 0 ? '#f59e0b' : '#10b981' },
        { label: 'Workflow Phase', value: isLocked ? 'Final Moderation' : 'Active Submissions' }
      ],
      specs: { scope: 'Student Submission Portal', safety: 'Reversible Toggle', trigger: '↵ Enter' },
      actionLabel: isLocked ? 'Unlock Evaluation Round (↵)' : 'Lock Evaluation Round (↵)',
      section: 'Section 2: Review System',
      capabilities: [
        '1-click freeze to prevent student edits during grade review',
        'Protects final marks during academic appeals & hearings',
        'Instant unlock to accept late make-up evaluations'
      ]
    };
  }

  // 6. Outliers & Dispute Resolution
  if (idLower.includes('outlier') || titleLower.includes('outlier') || titleLower.includes('dispute') || titleLower.includes('retaliation')) {
    return {
      purpose: 'Flags statistical anomalies where self-ratings deviate severely from peer ratings (|Self - Peer| > 1.5), identifying potential collusion, free-riders, or retaliation.',
      telemetry: [
        { label: 'Excused Exemptions', value: `${excusedCount} Medical/Approved`, color: '#6366f1' },
        { label: 'Discrepancy Gap', value: '|Self - Peer| > 1.5 Multiplier' },
        { label: 'Audit Dossier', value: '1-Click Student Dossier', color: '#10b981' },
        { label: 'Bias Adjustment', value: 'Peer Penalty Neutralizer' }
      ],
      specs: { scope: 'Grade Quality Assurance', safety: 'Non-Destructive Audit', trigger: '↵ Enter' },
      actionLabel: 'Inspect Outliers & Disputes (↵)',
      section: 'Section 3: Grading & Analytics',
      capabilities: [
        'Flags severe divergences between self and peer marks',
        '1-click comprehensive dispute dossier with bias audit',
        'Peer penalty neutralizer to correct retaliatory scores'
      ]
    };
  }

  // 7. Projector / Presentation Mode
  if (idLower.includes('presentation') || idLower.includes('projector') || titleLower.includes('presentation') || titleLower.includes('projector')) {
    return {
      purpose: 'Classroom lecture hall projector mode that anonymizes sensitive student data while displaying live submission counts and a countdown timer.',
      telemetry: [
        { label: 'Privacy Standard', value: 'FERPA & GDPR Safe (Masked)', color: '#10b981' },
        { label: 'Display Profile', value: 'Big-Screen Lecture Mode' },
        { label: 'Live Telemetry', value: 'Real-Time Progress & Timer' },
        { label: 'Student Identifiers', value: 'Anonymized Peer Codes' }
      ],
      specs: { scope: 'Audience Projector Display', safety: 'Privacy-Safe Mode', trigger: '↵ Enter' },
      actionLabel: 'Launch Presentation Mode (↵)',
      section: 'Top Navigation Hub',
      capabilities: [
        'Anonymized student codes for large lecture hall projection',
        'Real-time peer scoring and submission progress gauge',
        'Integrated presentation timer and countdown clock'
      ]
    };
  }

  // 8. Feature Toggles
  if (item.category === 'Features' || item.featureKey) {
    const featKey = item.featureKey;
    const isVisible = featKey ? !!featureToggles[featKey] : item.title.toLowerCase().startsWith('show') || item.intentTag === 'show';
    const isShowAction = item.intentTag === 'show' ||
      item.title.toLowerCase().startsWith('show') ||
      item.title.toLowerCase().startsWith('enable') ||
      (item.title.toLowerCase().startsWith('toggle') && !isVisible);

    const targetActionStr = isShowAction ? 'Show / Enable Module' : 'Hide / Disable Module';
    const targetActionColor = isShowAction ? '#10b981' : '#f43f5e';
    const flInfo = featKey ? FL[featKey] : undefined;
    const sectionName = flInfo?.section || 'Dashboard Viewports';
    const capabilities = getFeatureCapabilities(featKey);

    return {
      purpose: flInfo?.desc || item.subtitle || 'Toggles individual analytics, grading, and visualization modules on the dashboard without reloading the page.',
      telemetry: [
        { label: 'Current Visibility', value: isVisible ? 'Visible on Dashboard' : 'Hidden from Dashboard', color: isVisible ? '#10b981' : '#f59e0b' },
        { label: 'Target Action', value: targetActionStr, color: targetActionColor },
        { label: 'Placement', value: sectionName, color: '#6366f1' },
        { label: 'Performance Impact', value: 'Instant Client Render', color: '#10b981' }
      ],
      specs: { scope: sectionName, safety: 'Non-Destructive Toggle', trigger: '↵ Enter' },
      actionLabel: `${item.title} (↵)`,
      section: sectionName,
      capabilities,
      moduleKey: featKey,
      isFeatureToggle: true,
      featureIsOn: isVisible
    };
  }

  // 9. Workspace Modes
  if (item.category === 'Modes' || idLower.includes('mode_')) {
    const isCurrent = activeMode.toLowerCase() === item.title.toLowerCase().replace(' mode', '');
    return {
      purpose: 'Presets the dashboard layout by batch-toggling modules tailored for grading, presentation, high-density analytics, or a clean canvas.',
      telemetry: [
        { label: 'Target Preset', value: item.title, color: '#6366f1' },
        { label: 'Status', value: isCurrent ? 'Currently Active' : 'Not Active', color: isCurrent ? '#10b981' : 'var(--text-muted)' },
        { label: 'Reconfigurable', value: 'Customizable Anytime' },
        { label: 'Scope', value: 'Entire Dashboard Layout' }
      ],
      specs: { scope: 'Global Workspace Layout', safety: 'Reversible Preset', trigger: '↵ Enter' },
      actionLabel: `Apply ${item.title} (↵)`,
      section: 'Top Navigation Hub',
      capabilities: [
        'Batch-toggles dashboard modules according to workflow',
        'Tailored presets for Grading, Lecture, Analytics, or Clean Canvas',
        'Preserves student evaluation data while changing layout'
      ]
    };
  }

  // 10. Math & Scale
  if (idLower.includes('scale') || titleLower.includes('scale') || titleLower.includes('fudge') || titleLower.includes('webpa')) {
    return {
      purpose: 'Configures WebPA multiplier sensitivity and sets the baseline points ceiling used to compute final student peer grades.',
      telemetry: [
        { label: 'Grade Ceiling', value: `0 to ${targetScale} Maximum Points`, color: '#6366f1' },
        { label: 'WebPA Formula', value: 'Individual / Team Average' },
        { label: 'Precision', value: '2 Decimal Places' },
        { label: 'Scale Standard', value: 'University Accreditation Gradebook' }
      ],
      specs: { scope: 'Scoring Engine', safety: 'Recalculates Reactively', trigger: '↵ Enter' },
      actionLabel: 'Apply Scoring Configuration (↵)',
      section: 'Section 2: Review System',
      capabilities: [
        'Configures WebPA multiplier dampening (0% to 100%)',
        'Sets final grade baseline ceiling (out of 20, 100, or GPA 4.0)',
        'Recalculates peer adjustments reactively in real time'
      ]
    };
  }

  // 11. Generic Fallback
  return {
    purpose: item.subtitle || 'Executes this command within the active PeerLens classroom environment.',
    telemetry: [
      { label: 'Active Classroom', value: classData?.name || 'Class A', color: '#6366f1' },
      { label: 'Enrolled Cohort', value: `${totalStudents} Students (${distinctTeams.length} Teams)` },
      { label: 'Command Category', value: item.category },
      { label: 'Execution Environment', value: 'Instant Client-Side', color: '#10b981' }
    ],
    specs: { scope: 'Classroom Workspace', safety: 'Client-Side Safe', trigger: '↵ Enter' },
    actionLabel: 'Execute Command (↵)',
    capabilities: [
      'Executes instantaneously in the browser client environment',
      'Non-destructive operation with automatic state persistence',
      'Synchronized across all active student records'
    ]
  };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen, onClose, classData, featureToggles, onToggleFeature, onApplyMode,
  onNavigateTab, onOpenProjector, onOpenDispatcher, onOpenSettings, onOpenShortcuts,
  onOpenAddStudent, onOpenReportModal, onExportExcel, onOpenTour, onOpenGuideCenter,
  onSelectTeamFilter, onSetFilter, onApplyRubricPreset, onSetTargetScale,
  onSetFudgeWeight, onExportLMS, onExportResultsCSV, onExportPDFSummary,
  onOpenNewClass, onOpenImportWizard, onOpenAutoGroup,
  onOpenQRCode, onOpenDeadline, onResetSubmissions, onClearRoster, onDeleteStudent, onDeleteClass, onToast,
  onOpenEvaluationControls, onUpdateEvaluationControls, onToggleExcused,
  onOpenEditMode, shortcutsEnabled, onToggleShortcutsEnabled,
  onOpenTeamCharter, onOpenLivePresentation, onOpenEnrollmentBuilder,
  onOpenSnapshots,
  onOpenLayoutLibrary, onResetLayout,
  onOpenBranding, displayDensity: propDisplayDensity, onSetDisplayDensity
}) => {
  const { setThemeMode, themeMode } = useTheme();
  const [query,            setQuery]            = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [selectedIndex,    setSelectedIndex]    = useState(0);
  const [activeHelpArticle,setActiveHelpArticle]= useState<FeatureInfoItem|null>(null);
  const [recentIds,        setRecentIds]        = useState<string[]>([]);
  const [pinnedIds,        setPinnedIds]        = useState<string[]>(() => getPinnedModuleIds());

  useEffect(() => {
    return subscribePinnedModules((updated) => {
      setPinnedIds(updated);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPinnedIds(getPinnedModuleIds());
    }
  }, [isOpen]);

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const saved = localStorage.getItem('peer_recent_searches_v2');
      const prev: string[] = saved ? JSON.parse(saved) : [];
      const next = [trimmed, ...prev.filter(x => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      localStorage.setItem('peer_recent_searches_v2', JSON.stringify(next));
    } catch (e) {}
  }, []);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'canvas' | 'moodle' | 'blackboard' | 'brightspace' | 'pulse' | 'pdf'>('csv');
  const [exportCohort, setExportCohort] = useState<string>('all');

  const [activeDisputeStudentId, setActiveDisputeStudentId] = useState<string | null>(null);
  const [copiedDisputeDraft, setCopiedDisputeDraft] = useState(false);
  const [spotlightStudent, setSpotlightStudent] = useState<Student | null>(null);

  const { prefix, cleanQuery } = useMemo(() => parsePrefix(query), [query]);
  const effectiveQuery = cleanQuery;
  const intent      = useMemo(() => detectIntent(effectiveQuery), [effectiveQuery]);
  const queryTokens = useMemo(() => tokenize(effectiveQuery), [effectiveQuery]);

  const mathResult = useMemo(() => {
    if (!effectiveQuery.trim()) return null;
    return evaluateMathExpression(effectiveQuery);
  }, [effectiveQuery]);

  const inputRef      = useRef<HTMLInputElement>(null);
  const listRef       = useRef<HTMLDivElement>(null);
  const isKeyboardNav = useRef(false);

  const activeMode = useMemo(() => detectActiveMode(featureToggles), [featureToggles]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setQuery('');
      setSelectedCategory('all');
      setSelectedIndex(0);
      setActiveHelpArticle(null);
      setIsExportDialogOpen(false);
      setActiveDisputeStudentId(null);
      setSpotlightStudent(null);
      setExportCohort('all');
      setRecentIds(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        document.body.style.overflow = prev;
        document.documentElement.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  const executeAndTrack = useCallback((item: CPAction) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    } else {
      saveRecentSearch(item.title);
    }
    pushRecent(item.id);
    setRecentIds(loadRecent());
    item.onExecute();
  }, [query, saveRecentSearch]);

  // ── PULSE CSV EXPORT HELPER ──────────────────────────────────────────────
  const handleExportPulseCSV = useCallback(() => {
    if (!classData) {
      if (onToast) onToast('No classroom data available to export pulse.', 'warning');
      return;
    }
    const rounds = classData.pulseRounds || [];
    if (rounds.length === 0) {
      if (onToast) onToast('No pulse check-in rounds found. Launch a round in Section 2 first.', 'warning');
      return;
    }
    const targetRound = rounds.find(r => r.status === 'active') || rounds[0];

    const headers = [
      'Round Title',
      'Status',
      'Student Name',
      'Team Name',
      'Morale Rating',
      'Scale Type',
      'Milestone Status',
      'Blocker Note',
      'Submitted At',
      'Custom Answers'
    ];

    const rows: string[][] = [];

    if (targetRound.responses.length === 0) {
      rows.push([
        `"${targetRound.title.replace(/"/g, '""')}"`,
        targetRound.status,
        'No responses submitted yet',
        '',
        '',
        targetRound.config?.scaleType || 'stars_5',
        '',
        '',
        '',
        ''
      ]);
    } else {
      targetRound.responses.forEach(resp => {
        const customFormatted = resp.customAnswers
          ? Object.entries(resp.customAnswers).map(([k, v]) => `${k}: ${v}`).join('; ')
          : '';
        rows.push([
          `"${targetRound.title.replace(/"/g, '""')}"`,
          targetRound.status,
          `"${resp.studentName.replace(/"/g, '""')}"`,
          `"${resp.groupName.replace(/"/g, '""')}"`,
          String(resp.moraleScore),
          resp.scaleType,
          resp.status,
          `"${(resp.blockerNote || '').replace(/"/g, '""')}"`,
          new Date(resp.submittedAt).toLocaleString(),
          `"${customFormatted.replace(/"/g, '""')}"`
        ]);
      });
    }

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = targetRound.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${classData.name.replace(/\s+/g, '_')}_${safeTitle}_Pulse_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded pulse responses CSV successfully!', 'success');
  }, [classData, onToast]);

  // ── COHORT LMS EXPORT HELPER ──────────────────────────────────────────────
  const generateCohortLMSExport = useCallback((platform: 'canvas' | 'moodle' | 'blackboard' | 'brightspace', teamName: string, students: any[]) => {
    if (!classData) return;
    let headers: string[] = [];
    const rows: string[][] = [];

    if (platform === 'canvas') {
      headers = ['Student', 'ID', 'SIS User ID', 'SIS Login ID', 'Section', 'Peer Evaluation Score (Scaled)'];
      rows.push(['Points Possible', '', '', '', '', '100']);
      students.forEach(s => {
        rows.push([
          `"${s.name.replace(/"/g, '""')}"`,
          s.id,
          s.id,
          (s.email || '').split('@')[0] || s.id,
          `"${teamName.replace(/"/g, '""')}"`,
          '100'
        ]);
      });
    } else if (platform === 'moodle') {
      headers = ['Identifier', 'Full name', 'ID number', 'Email address', 'Status', 'Peer Evaluation Grade'];
      students.forEach(s => {
        rows.push([
          `"Participant ${s.id}"`,
          `"${s.name.replace(/"/g, '""')}"`,
          s.id,
          s.email || '',
          s.submitted ? 'Graded' : 'Not submitted',
          '100.00'
        ]);
      });
    } else if (platform === 'blackboard') {
      headers = ['Username', 'Last Name', 'First Name', 'Student ID', 'Peer Evaluation [Total Pts: 100]'];
      students.forEach(s => {
        const parts = s.name.split(' ');
        const first = parts[0] || '';
        const last = parts.slice(1).join(' ') || '';
        rows.push([
          (s.email || '').split('@')[0] || s.id,
          `"${last.replace(/"/g, '""')}"`,
          `"${first.replace(/"/g, '""')}"`,
          s.id,
          '100'
        ]);
      });
    } else {
      // brightspace
      headers = ['OrgDefinedId', 'Username', 'End-of-Line Indicator', 'Peer Evaluation Points Grade'];
      students.forEach(s => {
        rows.push([
          s.id,
          (s.email || '').split('@')[0] || s.id,
          '#',
          '100'
        ]);
      });
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name.replace(/\s+/g, '_')}_${teamName.replace(/\s+/g, '_')}_${platform.toUpperCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [classData]);

  // ── SMART EXPORT EXECUTION ROUTER ─────────────────────────────────────────
  const handleSmartExportExecute = useCallback(() => {
    if (!classData) return;
    const targetStudents = exportCohort === 'all'
      ? classData.students
      : classData.students.filter(s => s.groupName === exportCohort);

    if (exportFormat === 'csv') {
      const headers = ['Student ID', 'Full Name', 'Email', 'Team Cohort', 'Degree / Major', 'Evaluation Status', 'WebPA Factor', 'Final Scaled Grade'];
      const rows = targetStudents.map(s => [
        `"${s.id.replace(/"/g, '""')}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.groupName || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(s.degree || '').replace(/"/g, '""')}"`,
        s.submitted ? 'Submitted' : 'Pending',
        '1.00',
        '100%'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cohortSuffix = exportCohort === 'all' ? 'All_Teams' : exportCohort.replace(/\s+/g, '_');
      a.download = `${classData.name.replace(/\s+/g, '_')}_${cohortSuffix}_Gradebook.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onToast) onToast(`Exported CSV for ${exportCohort === 'all' ? 'Entire Class' : exportCohort}!`, 'success');
      onClose();
    } else if (exportFormat === 'excel') {
      onExportExcel();
      if (onToast) onToast(`Exported Excel Gradebook (${exportCohort === 'all' ? 'Entire Class' : exportCohort})`, 'success');
      onClose();
    } else if (['canvas', 'moodle', 'blackboard', 'brightspace'].includes(exportFormat)) {
      if (exportCohort === 'all') {
        if (onExportLMS) onExportLMS(exportFormat as any);
      } else {
        generateCohortLMSExport(exportFormat as any, exportCohort, targetStudents);
      }
      if (onToast) onToast(`Exported ${exportFormat.toUpperCase()} for ${exportCohort === 'all' ? 'Entire Class' : exportCohort}`, 'success');
      onClose();
    } else if (exportFormat === 'pulse') {
      handleExportPulseCSV();
      onClose();
    } else if (exportFormat === 'pdf') {
      if (onExportPDFSummary) onExportPDFSummary();
      onClose();
    }
  }, [classData, exportCohort, exportFormat, onExportExcel, onExportLMS, generateCohortLMSExport, handleExportPulseCSV, onExportPDFSummary, onToast, onClose]);

  // ── BUILD ALL ITEMS ─────────────────────────────────────────────────────────
  const allItems = useMemo<CPAction[]>(() => {
    const list: CPAction[] = [];

    // NAVIGATION
    list.push(
      { id: 'nav_hub',     title: 'Classroom Hub (Home)',                   category: 'Navigation', subtitle: 'Return to the 3-section core module overview', icon: Layers,         badge: 'Hub',    keywords: ['home','start','modules','overview','dashboard','return','main'],     onExecute: () => { onNavigateTab('hub'); onClose(); } },
      { id: 'nav_roster',  title: 'Section 1: Enrollment & Teams',          category: 'Navigation', subtitle: 'Manage students, team formations, and roster',   icon: Users,          badge: 'Step 1', keywords: ['roster','students','members','groups','teams','cohort','enrollment'], onExecute: () => { onNavigateTab('roster'); onClose(); } },
      { id: 'nav_grading', title: 'Section 2: Review System',               category: 'Navigation', subtitle: 'Configure rubric sliders, scale anchors, weights',icon: Sliders,        badge: 'Step 2', keywords: ['rubric','criteria','weights','scale','presets','section 2','step 2'],onExecute: () => { onNavigateTab('grading'); onClose(); } },
      { id: 'nav_results', title: 'Section 3: Grading & Analytics',         category: 'Navigation', subtitle: 'Calculation matrix, radar charts, and gradebook', icon: Award,          badge: 'Step 3', keywords: ['grades','scores','matrix','radar','webpa','export','analytics'],    onExecute: () => { onNavigateTab('results'); onClose(); } },
    );

    // LIVE MATH CALCULATOR ACTION
    if (mathResult) {
      list.push({
        id: 'act_live_math_calc',
        title: `Calculate: ${effectiveQuery} = ${mathResult.formatted}${mathResult.isPercentage ? '%' : ''}`,
        category: 'Actions',
        subtitle: `Academic calculation result. Press Enter to copy "${mathResult.formatted}" to clipboard`,
        icon: Calculator,
        badge: `Result: ${mathResult.formatted}`,
        badgeColor: '#10b981',
        keywords: ['calc', 'math', 'calculate', 'result', effectiveQuery],
        onExecute: () => {
          navigator.clipboard.writeText(mathResult.formatted);
          if (onToast) onToast(`Copied "${mathResult.formatted}" to clipboard!`, 'success');
        }
      });
    }

    // EVALUATION ROUND ACCESS TOGGLE ACTION
    if (classData) {
      const isRoundUnlocked = classData.evaluationControls?.unlockMainPeerReview !== false;
      list.push({
        id: 'act_eval_round_toggle',
        title: isRoundUnlocked ? 'Lock Evaluation Round (Close Submissions)' : 'Unlock Evaluation Round (Open Submissions)',
        category: 'Actions',
        subtitle: isRoundUnlocked 
          ? 'Peer review is currently OPEN. Press Enter to lock round and prevent further student submissions'
          : 'Peer review is currently LOCKED. Press Enter to unlock round so students can submit peer evaluations',
        icon: isRoundUnlocked ? Lock : Unlock,
        badge: isRoundUnlocked ? 'Round Open' : 'Round Locked',
        badgeColor: isRoundUnlocked ? '#10b981' : '#dc2626',
        keywords: ['unlock', 'lock', 'open evaluation', 'close evaluation', 'allow submissions', 'freeze grades', 'evaluation round', 'toggle round', 'lock review', 'unlock review', 'round'],
        onExecute: () => {
          if (onUpdateEvaluationControls) {
            onUpdateEvaluationControls({ unlockMainPeerReview: !isRoundUnlocked });
          } else if (onOpenEvaluationControls) {
            onOpenEvaluationControls();
          }
          if (onToast) {
            onToast(isRoundUnlocked ? 'Evaluation round is now LOCKED for students' : 'Evaluation round is now OPEN for students', isRoundUnlocked ? 'warning' : 'success');
          }
        }
      });
    }

    // RANDOM STUDENT SPOTLIGHT ACTION
    if (classData && classData.students.length > 0) {
      list.push({
        id: 'act_roll_random_student',
        title: 'Pick a Random Student (Classroom Spotlight)',
        category: 'Actions',
        subtitle: `Cold-calling & presentation speaker picker across all ${classData.students.length} students. Press Enter to select`,
        icon: Dices,
        badge: 'Spotlight',
        badgeColor: '#f59e0b',
        keywords: ['random', 'pick student', 'spin student', 'call student', 'cold call', 'who speaks next', 'spotlight student', 'random speaker', 'random member', 'pick someone', 'roll'],
        onExecute: () => {
          const pool = classData.students;
          const picked = pool[Math.floor(Math.random() * pool.length)];
          setSpotlightStudent(picked);
          if (onToast) onToast(`Spotlighted: ${picked.name} (${picked.groupName || 'Unassigned'})`, 'info');
        }
      });

      const allTeams = Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean)));
      allTeams.forEach(tName => {
        list.push({
          id: `act_roll_team_${tName}`,
          title: `Pick Random Speaker from Team: ${tName}`,
          category: 'Actions',
          subtitle: `Selects a random presenter from ${tName}. Press Enter to spotlight`,
          icon: Dices,
          badge: tName,
          badgeColor: '#10b981',
          keywords: ['random', 'pick student', 'speaker', tName.toLowerCase(), `random ${tName.toLowerCase()}`],
          onExecute: () => {
            const teamPool = classData.students.filter(s => s.groupName === tName);
            if (teamPool.length > 0) {
              const picked = teamPool[Math.floor(Math.random() * teamPool.length)];
              setSpotlightStudent(picked);
              if (onToast) onToast(`Selected from ${tName}: ${picked.name}`, 'info');
            }
          }
        });
      });
    }

    // SMART NLP TELEMETRY & LIVE QUERIES
    if (classData) {
      const totalStudents = classData.students.length;
      const submittedCount = classData.students.filter(s => s.submitted).length;
      const pendingCount = totalStudents - submittedCount;
      const pct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
      const teams = Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean)));

      list.push(
        {
          id: 'smart_submission_pulse',
          title: `Submission Progress: ${submittedCount} / ${totalStudents} Completed (${pct}%)`,
          category: 'Actions',
          subtitle: `${pendingCount} student${pendingCount !== 1 ? 's' : ''} pending. Press Enter to open Link Dispatcher and email reminders`,
          icon: CheckCircle2,
          badge: `${pendingCount} Pending`,
          badgeColor: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#6366f1',
          keywords: ['pending', 'unsubmitted', 'submitted', 'who has not submitted', 'submission progress', 'missing reviews', 'turnout', 'nudge', 'reminder', 'remind pending', 'submission status', 'how many submitted', 'how many pending', 'status'],
          onExecute: () => {
            onClose();
            onOpenDispatcher();
          }
        },
        {
          id: 'smart_roster_count',
          title: `Classroom Roster: ${totalStudents} Students Across ${teams.length} Teams`,
          category: 'Actions',
          subtitle: `Click or press Enter to navigate directly to Section 1 (Enrollment & Teams)`,
          icon: Users,
          badge: `${totalStudents} Students`,
          badgeColor: '#6366f1',
          keywords: ['how many students', 'student count', 'class count', 'total students', 'class size', 'students enrolled', 'roster count', 'how many members', 'roster'],
          onExecute: () => {
            onClose();
            onNavigateTab('roster');
          }
        },
        {
          id: 'smart_deadline_status',
          title: classData.deadline ? `Active Milestone Deadline: ${new Date(classData.deadline).toLocaleString()}` : 'No Milestone Deadline Configured',
          category: 'Actions',
          subtitle: classData.deadline ? 'Active countdown underway. Press Enter to configure, extend, or lock' : 'Press Enter to set submission cutoff countdown timer',
          icon: Clock,
          badge: 'Deadline',
          badgeColor: '#f59e0b',
          keywords: ['deadline', 'timer', 'countdown', 'cutoff', 'how much time', 'due date', 'time left', 'remaining time', 'lock date'],
          onExecute: () => {
            onClose();
            if (onOpenDeadline) onOpenDeadline();
          }
        }
      );

      // Pending Students Direct Nudge Action
      const pendingStudents = classData.students.filter(s => !s.submitted);
      if (pendingStudents.length > 0) {
        const sampleNames = pendingStudents.slice(0, 4).map(s => s.name).join(', ') + (pendingStudents.length > 4 ? ` +${pendingStudents.length - 4} more` : '');
        list.push({
          id: 'smart_pending_list',
          title: `Pending Students (${pendingStudents.length}): ${sampleNames}`,
          category: 'Actions',
          subtitle: `Awaiting peer evaluations. Press Enter to open Link Dispatcher and email nudges`,
          icon: Mail,
          badge: `${pendingStudents.length} Missing`,
          badgeColor: '#f59e0b',
          keywords: ['who has not submitted', 'who didn\'t submit', 'who hasnt submitted', 'who did not submit', 'missing', 'unsubmitted students', 'pending students', 'who to email', 'send reminder', 'nudge pending'],
          onExecute: () => {
            onClose();
            onOpenDispatcher();
          }
        });
      }

      // Outliers & Grade Anomaly Intelligence
      let outlierCount = 0;
      const outlierSample: string[] = [];
      if (classData.reviews.length > 0) {
        classData.students.forEach(st => {
          try {
            const audit = generateStudentDisputeAudit(st, classData);
            if (audit.retaliationRisk || audit.webpaRatio < 0.85 || audit.webpaRatio > 1.25 || Math.abs(audit.overallGapDelta || 0) > 20) {
              outlierCount++;
              if (outlierSample.length < 3) outlierSample.push(st.name);
            }
          } catch (e) {}
        });
      }
      if (outlierCount > 0) {
        list.push({
          id: 'smart_outliers_detected',
          title: `Anomaly Audit: ${outlierCount} Grade Outlier${outlierCount !== 1 ? 's' : ''} Flagged (${outlierSample.join(', ')})`,
          category: 'Actions',
          subtitle: `Extreme WebPA multipliers (<0.85 or >1.25) or high self-peer gap. Press Enter to inspect Section 3 Audit`,
          icon: AlertTriangle,
          badge: `${outlierCount} Outliers`,
          badgeColor: '#ef4444',
          keywords: ['outliers', 'anomaly', 'collusion', 'disputes', 'anomalies', 'flagged', 'suspicious', 'grade disputes', 'retaliation', 'unusual scores'],
          onExecute: () => {
            onClose();
            onNavigateTab('results');
            if (!featureToggles.showAnomalyAudit && onToggleFeature) {
              onToggleFeature('showAnomalyAudit', true);
            }
            setTimeout(() => {
              const el = document.getElementById('collusion-anomaly-audit') || document.getElementById('anomaly-audit-card');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }
        });
      }

      // Class Average Performance Pulse
      if (classData.reviews.length > 0) {
        let sumScore = 0;
        let countScore = 0;
        classData.reviews.forEach(r => {
          Object.values(r.scores).forEach(val => {
            sumScore += val;
            countScore++;
          });
        });
        const avgRubricScore = countScore > 0 ? (sumScore / countScore) : 0;
        const avgPct = Math.min(100, Math.round((avgRubricScore / 20) * 100));
        list.push({
          id: 'smart_class_avg',
          title: `Classroom Performance: ~${avgPct}% Average Rating Across Rubric`,
          category: 'Actions',
          subtitle: `Based on ${classData.reviews.length} completed peer reviews. Press Enter to view Gradebook & Radar Analytics in Section 3`,
          icon: BarChart2,
          badge: 'Performance',
          badgeColor: '#10b981',
          keywords: ['average grade', 'class average', 'performance', 'how is class doing', 'average score', 'grades stats', 'overall score'],
          onExecute: () => {
            onClose();
            onNavigateTab('results');
          }
        });
      }

      // Team Health Pulse Status Check
      const pulseRounds = classData.pulseRounds || [];
      const activePulse = pulseRounds.find(r => r.status === 'active');
      if (activePulse) {
        const respCount = activePulse.responses.length;
        const blockerCount = activePulse.responses.filter(r => (r.blockerNote || '').trim().length > 0).length;
        list.push({
          id: 'smart_active_pulse_round',
          title: `Active Pulse Survey: "${activePulse.title}" (${respCount} Responses)`,
          category: 'Actions',
          subtitle: `${blockerCount} blocker note${blockerCount !== 1 ? 's' : ''} reported. Press Enter to inspect responses and sparklines in Section 2`,
          icon: Activity,
          badge: `${respCount} Responses`,
          badgeColor: '#0d9488',
          keywords: ['pulse', 'active pulse', 'team health', 'sprint health', 'morale', 'blockers', 'roadblocks', 'check-in status'],
          onExecute: () => {
            onClose();
            onNavigateTab('grading');
            if (!featureToggles.showTeamHealthPulse && onToggleFeature) {
              onToggleFeature('showTeamHealthPulse', true);
            }
            setTimeout(() => {
              const el = document.getElementById('team-health-pulse-card');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }
        });
      }

      // Instant WebPA Methodology Explainer
      list.push({
        id: 'smart_explain_webpa',
        title: 'WebPA Formula & Grade Adjustment Explained',
        category: 'Help',
        subtitle: 'Individual Grade = (Individual Peer Rating / Average Peer Rating) × Baseline Team Grade',
        icon: HelpCircle,
        badge: 'Formula',
        badgeColor: '#6366f1',
        keywords: ['what is webpa', 'how does webpa work', 'webpa formula', 'explain webpa', 'webpa calculation', 'formula', 'math formula', 'how are grades calculated', 'multiplier formula'],
        onExecute: () => {
          const article = FEATURE_INFO_REGISTRY['webpa-scoring'] || Object.values(FEATURE_INFO_REGISTRY)[0];
          if (article) {
            setActiveHelpArticle(article);
          } else {
            window.open('/guide.html', '_blank');
            onClose();
          }
        }
      });
    }

    // ACTIONS
    if (onOpenNewClass) {
      list.push({ id: 'act_new_class', title: 'Create New Classroom Group', category: 'Actions', subtitle: 'Initialize a fresh classroom cohort', icon: BookOpen, badge: 'Cmd C', keywords: ['new class','create','cohort','course'], onExecute: () => { onClose(); onOpenNewClass(); } });
    }
    list.push(
      { id: 'act_add_student',  title: 'Enroll New Student',                category: 'Actions', subtitle: 'Add a student manually with email, team, degree', icon: UserPlus,   badge: 'Cmd N',  keywords: ['add student','enroll','participant','member','register'],       onExecute: () => { onClose(); onOpenAddStudent(); } },
      { id: 'act_enrollment_builder', title: 'Enrollment Form Questions (Custom Fields)', category: 'Actions', subtitle: 'Customize self-registration questions, degree, nationality, and survey prompts', icon: FileText, badge: 'Alt Q', keywords: ['enrollment questions','form builder','custom questions','fields','registration','questions','survey','self-enrollment'], onExecute: () => { onClose(); if (onOpenEnrollmentBuilder) onOpenEnrollmentBuilder(); } },
      { id: 'act_dispatcher',   title: 'Email Center & Link Dispatcher',    category: 'Actions', subtitle: 'Dispatch double-blind evaluation links to students', icon: Send,      badge: 'Cmd E',  keywords: ['email','mail','send','links','dispatcher','brevo','invite'],    onExecute: () => { onClose(); onOpenDispatcher(); } },
      { id: 'act_projector',    title: 'Launch Live Classroom Projector',   category: 'Actions', subtitle: 'Full-screen monitor with QR and submission ticker',  icon: Tv,        badge: 'Cmd P',  keywords: ['projector','fullscreen','display','screen','lecture','live'],   onExecute: () => { onClose(); onOpenProjector(); } },
      { id: 'act_settings',     title: 'Workspace Settings & Cloud Sync',   category: 'Actions', subtitle: 'Firebase, email API keys, and workspace profile',    icon: Settings,  badge: 'Cmd S',  keywords: ['settings','cloud','firebase','api','sync','config'],            onExecute: () => { onClose(); onOpenSettings('email'); } },
      { id: 'act_shortcuts',    title: 'Keyboard Shortcuts Reference',      category: 'Actions', subtitle: 'Full cheat sheet of keyboard controls',              icon: Keyboard,  badge: 'Cmd ?',  keywords: ['shortcuts','hotkeys','keyboard','cheat sheet','bindings'],      onExecute: () => { onClose(); onOpenShortcuts(); } },
      { id: 'act_customize',    title: 'Customize View (Module Toggles)',   category: 'Actions', subtitle: 'Toggle modular cards, top bar, and density presets', icon: Sliders,   badge: 'Cmd V',  keywords: ['customize','modules','interface','density','toggles','view'],   onExecute: () => { onClose(); onOpenSettings('modules'); } },
      { id: 'act_toggle_edit_mode', title: 'Toggle Dashboard Layout Edit Mode', category: 'Actions', subtitle: 'Visually highlight and click modules on-screen to hide or show them', icon: Edit3, badge: 'Alt E', keywords: ['edit mode','edit layout','layout editor','in-place editor','highlight modules','customize','visual layout'], onExecute: () => { onClose(); if (onOpenEditMode) onOpenEditMode(); } },
      {
        id: 'act_snapshots_manage',
        title: 'Classroom Snapshots & Version History',
        category: 'Actions',
        subtitle: 'Inspect point-in-time state snapshots, restore past grades, or rollback rosters',
        icon: History,
        badge: 'Snapshots',
        badgeColor: '#6366f1',
        keywords: ['snapshots', 'history', 'rollback', 'version history', 'checkpoint', 'restore', 'undo', 'backup'],
        onExecute: () => {
          onClose();
          if (onOpenSnapshots) onOpenSnapshots();
        }
      },
      {
        id: 'act_density_compact',
        title: 'Display Density: Compact (13in Laptop Mode)',
        category: 'Appearance',
        subtitle: 'High information density with tight padding and compact rows for large cohorts',
        icon: Sliders,
        badge: propDisplayDensity === 'compact' ? 'Active' : 'Density',
        badgeColor: '#f59e0b',
        keywords: ['density compact', 'compact view', 'compact rows', 'tight spacing', 'density', 'high density', 'laptop mode'],
        onExecute: () => {
          onClose();
          setDisplayDensity('compact');
          if (onSetDisplayDensity) onSetDisplayDensity('compact');
          if (onToast) onToast('Applied Compact Display Density (Dense rows)', 'success');
        }
      },
      {
        id: 'act_density_balanced',
        title: 'Display Density: Balanced (Default Modern)',
        category: 'Appearance',
        subtitle: 'Standard balanced spacing with optimal touch targets and clean typography',
        icon: Sliders,
        badge: propDisplayDensity === 'balanced' ? 'Active' : 'Density',
        badgeColor: '#3b82f6',
        keywords: ['density balanced', 'balanced view', 'standard spacing', 'default density'],
        onExecute: () => {
          onClose();
          setDisplayDensity('balanced');
          if (onSetDisplayDensity) onSetDisplayDensity('balanced');
          if (onToast) onToast('Applied Balanced Display Density (Standard)', 'info');
        }
      },
      {
        id: 'act_density_spacious',
        title: 'Display Density: Spacious (Podium & iPad Touch Mode)',
        category: 'Appearance',
        subtitle: 'Relaxed reading mode with generous whitespace and larger touch targets',
        icon: Sliders,
        badge: propDisplayDensity === 'spacious' ? 'Active' : 'Density',
        badgeColor: '#10b981',
        keywords: ['density spacious', 'spacious view', 'relaxed spacing', 'large rows', 'comfortable', 'ipad mode', 'podium'],
        onExecute: () => {
          onClose();
          setDisplayDensity('spacious');
          if (onSetDisplayDensity) onSetDisplayDensity('spacious');
          if (onToast) onToast('Applied Spacious Display Density (Large targets)', 'info');
        }
      },
      {
        id: 'act_branding_customizer',
        title: 'Institutional Branding & Custom Header',
        category: 'Appearance',
        subtitle: 'Upload institution emblem/logo, customize course badge, term banner & logo shape',
        icon: Building2,
        badge: 'Branding',
        badgeColor: '#6366f1',
        keywords: ['branding', 'institution', 'university', 'college', 'logo', 'course badge', 'term banner', 'custom header', 'emblem', 'school name', 'brand', 'crest'],
        onExecute: () => {
          onClose();
          if (onOpenBranding) onOpenBranding();
        }
      },
      {
        id: 'act_toggle_header_branding',
        title: 'Toggle Header Institutional Branding',
        category: 'Appearance',
        subtitle: 'Show or hide course badge and term banner in top header',
        icon: Eye,
        badge: 'Header',
        badgeColor: '#10b981',
        keywords: ['header branding', 'show branding', 'hide branding', 'branding in header', 'course badge header', 'term banner header', 'toggle branding'],
        onExecute: () => {
          const b = getBranding(classData?.id);
          const next = !b.showInHeader;
          saveBranding({ showInHeader: next }, classData?.id);
          if (onToast) onToast(next ? 'Institutional header branding visible' : 'Institutional header branding hidden', 'info');
          onClose();
        }
      },
      {
        id: 'act_theme_accent_indigo',
        title: 'Workspace Accent: Classic Indigo',
        category: 'Appearance',
        subtitle: 'Deep modern indigo brand theme with vibrant purple undertones',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#6366f1',
        keywords: ['theme indigo', 'accent indigo', 'indigo color', 'blue purple', 'default accent'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'indigo' } }));
          if (onToast) onToast('Workspace accent set to Classic Indigo', 'success');
        }
      },
      {
        id: 'act_theme_accent_teal',
        title: 'Workspace Accent: Oceanic Teal',
        category: 'Appearance',
        subtitle: 'Calm and focused marine teal accent theme tailored for high-contrast grading',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#0d9488',
        keywords: ['theme teal', 'accent teal', 'teal color', 'cyan', 'ocean'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'teal' } }));
          if (onToast) onToast('Workspace accent set to Oceanic Teal', 'success');
        }
      },
      {
        id: 'act_theme_accent_purple',
        title: 'Workspace Accent: Royal Purple',
        category: 'Appearance',
        subtitle: 'Rich violet aesthetic with high-saturation gradient glows',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#8b5cf6',
        keywords: ['theme purple', 'accent purple', 'purple color', 'violet'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'purple' } }));
          if (onToast) onToast('Workspace accent set to Royal Purple', 'success');
        }
      },
      {
        id: 'act_theme_accent_rose',
        title: 'Workspace Accent: Velvet Rose',
        category: 'Appearance',
        subtitle: 'Warm and expressive crimson rose palette',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#f43f5e',
        keywords: ['theme rose', 'accent rose', 'pink color', 'red', 'crimson'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'rose' } }));
          if (onToast) onToast('Workspace accent set to Velvet Rose', 'success');
        }
      },
      {
        id: 'act_theme_accent_amber',
        title: 'Workspace Accent: Warm Sunset Amber',
        category: 'Appearance',
        subtitle: 'High-visibility golden amber accents with warm dark mode contrasts',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#f59e0b',
        keywords: ['theme amber', 'accent amber', 'orange color', 'gold', 'yellow'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'amber' } }));
          if (onToast) onToast('Workspace accent set to Sunset Amber', 'success');
        }
      },
      {
        id: 'act_theme_accent_emerald',
        title: 'Workspace Accent: Forest Emerald',
        category: 'Appearance',
        subtitle: 'Refreshing natural emerald green for clean data clarity',
        icon: Palette,
        badge: 'Accent',
        badgeColor: '#10b981',
        keywords: ['theme emerald', 'accent emerald', 'green color', 'forest'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_set_theme_accent', { detail: { accent: 'emerald' } }));
          if (onToast) onToast('Workspace accent set to Forest Emerald', 'success');
        }
      },
      { id: 'act_toggle_shortcuts', title: shortcutsEnabled ? 'Disable Keyboard Shortcuts' : 'Enable Keyboard Shortcuts', category: 'Actions', subtitle: shortcutsEnabled ? 'Currently Active — click to disable/pause keyboard hotkeys' : 'Currently Disabled — click to activate keyboard hotkeys across workspace', icon: Keyboard, badge: shortcutsEnabled ? 'Active' : 'Disabled', keywords: ['shortcuts','keyboard','hotkeys','enable shortcuts','disable shortcuts','keybindings'], onExecute: () => { onClose(); if (onToggleShortcutsEnabled) onToggleShortcutsEnabled(!shortcutsEnabled); } },
      { id: 'act_toggle_quick_pill', title: featureToggles.showQuickActionPill ? 'Hide Floating Quick Action Pill' : 'Show Floating Quick Action Pill', category: 'Actions', subtitle: 'Contractable & expandable quick dock anchored at window bottom', icon: Compass, badge: 'Dock', keywords: ['quick action pill','pill','dock','bottom pill','floating dock','quick actions'], onExecute: () => { onClose(); if (onToggleFeature) onToggleFeature('showQuickActionPill', !featureToggles.showQuickActionPill); } },
      {
        id: 'act_toggle_retractable_display',
        title: featureToggles.showRetractableDisplay ? 'Hide Dynamic Retractable Display' : 'Show Dynamic Retractable Display',
        category: 'Actions',
        subtitle: 'Custom retractable floating workspace to pin and interact with any module across all tabs',
        icon: Pin,
        badge: 'Pin Display',
        badgeColor: '#f59e0b',
        keywords: ['pin', 'pinned', 'retractable', 'display', 'floating module', 'side dock', 'dock', 'pip', 'picture in picture'],
        onExecute: () => {
          onClose();
          if (onToggleFeature) onToggleFeature('showRetractableDisplay', !featureToggles.showRetractableDisplay);
        }
      },
      {
        id: 'act_quick_action_pinned',
        title: 'Quick Action Center: Pinned & Favorite Modules',
        category: 'Actions',
        subtitle: '1-click access to your pinned modules without scrolling',
        icon: Star,
        badge: 'Favorites',
        badgeColor: '#f59e0b',
        keywords: ['pin', 'pinned', 'favorite', 'favourites', 'quick action', 'dock', 'modules', 'star'],
        onExecute: () => {
          onClose();
          if (onToggleFeature && !featureToggles.showQuickActionPill) {
            onToggleFeature('showQuickActionPill', true);
          }
          window.dispatchEvent(new CustomEvent('peerlens_open_quick_pill_modules'));
        }
      },
      {
        id: 'act_toggle_cohorts',
        title: featureToggles.showTeamOverviewCards ? 'Toggle: Team Cohorts Overview & Formation Cards' : 'Show: Team Cohorts Overview & Formation Cards',
        category: 'Features',
        subtitle: 'Collapsible deep-dive cards summarizing each team cohort and student profiles',
        icon: Users,
        badge: featureToggles.showTeamOverviewCards ? 'Active' : 'Hidden',
        badgeColor: featureToggles.showTeamOverviewCards ? '#10b981' : '#6b7280',
        keywords: ['team cohorts', 'cohorts', 'deep dive', 'team cards', 'collapse teams', 'expand teams', 'formation', 'teams'],
        onExecute: () => {
          onClose();
          if (onToggleFeature) onToggleFeature('showTeamOverviewCards', !featureToggles.showTeamOverviewCards);
        }
      },
      {
        id: 'act_toggle_lms',
        title: featureToggles.showLmsExport ? 'Toggle: LMS Gradebook Integration (Canvas, Moodle, Blackboard)' : 'Show: LMS Gradebook Integration (Canvas, Moodle, Blackboard)',
        category: 'Features',
        subtitle: 'Collapsible 1-click export presets and custom LMS column schema builder',
        icon: GraduationCap,
        badge: featureToggles.showLmsExport ? 'Active' : 'Hidden',
        badgeColor: featureToggles.showLmsExport ? '#10b981' : '#6b7280',
        keywords: ['lms', 'canvas', 'moodle', 'blackboard', 'brightspace', 'd2l', 'gradebook', 'export lms', 'collapse lms', 'expand lms'],
        onExecute: () => {
          onClose();
          if (onToggleFeature) onToggleFeature('showLmsExport', !featureToggles.showLmsExport);
        }
      },
      {
        id: 'act_toggle_health',
        title: featureToggles.showTeamHealthPulse ? 'Toggle: Team Health Micro-Pulse Check-ins' : 'Show: Team Health Micro-Pulse Check-ins',
        category: 'Features',
        subtitle: 'Collapsible on-demand 30-second pulse surveys with sparklines and blocker notes',
        icon: Activity,
        badge: featureToggles.showTeamHealthPulse ? 'Active' : 'Hidden',
        badgeColor: featureToggles.showTeamHealthPulse ? '#10b981' : '#6b7280',
        keywords: ['team health', 'pulse', 'micro-pulse', 'morale', 'survey', 'check-in', 'collapse health', 'expand health', 'sprint'],
        onExecute: () => {
          onClose();
          if (onToggleFeature) onToggleFeature('showTeamHealthPulse', !featureToggles.showTeamHealthPulse);
        }
      },
    );

    // SMART EXPORT STUDIO & MACRO ACTIONS
    list.push(
      {
        id: 'act_smart_export_dialog',
        title: 'Smart Export Studio: Gradebook, CSV & LMS Formats',
        category: 'Actions',
        subtitle: 'Choose export format (Simple CSV, Excel, Canvas, Moodle, Blackboard) and scope (All Teams vs Specific Cohort)',
        icon: Download,
        badge: 'Export Studio',
        badgeColor: '#10b981',
        keywords: [
          'export', 'download', 'export format', 'cohort export', 'team export', 'lms export',
          'simple csv', 'csv', 'ask export', 'export dialog', 'export gradebook', 'export options',
          'export canvas team', 'export moodle team', 'export csv team', 'export team'
        ],
        onExecute: () => {
          setIsExportDialogOpen(true);
        }
      },
      {
        id: 'act_macro_expand_all',
        title: 'Master Action: Expand All Foldable Sections',
        category: 'Actions',
        subtitle: 'Expand Roster Table, Auto-Group Studio, Rubric Controls, Team Health Pulse, Cohorts, LMS Export, Audit Matrix, and Results Gradebook simultaneously',
        icon: ChevronsDown,
        badge: 'Macro',
        badgeColor: '#6366f1',
        keywords: ['expand all', 'expand', 'unfold all', 'open all', 'expand sections', 'master expand'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_expand_all'));
          if (onToast) onToast('Expanded all foldable dashboard sections', 'success');
        }
      },
      {
        id: 'act_macro_collapse_all',
        title: 'Master Action: Collapse All Foldable Sections',
        category: 'Actions',
        subtitle: 'Fold Roster Table, Auto-Group Studio, Rubric Controls, Team Health Pulse, Cohorts, LMS Export, Audit Matrix, and Results Gradebook into compact view',
        icon: ChevronsUp,
        badge: 'Macro',
        badgeColor: '#6366f1',
        keywords: ['collapse all', 'collapse', 'fold all', 'close all', 'collapse sections', 'master collapse'],
        onExecute: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('peerlens_collapse_all'));
          if (onToast) onToast('Collapsed all foldable dashboard sections', 'info');
        }
      },
      {
        id: 'act_macro_flag_outliers',
        title: 'Audit: Check Outliers & Collusion Patterns',
        category: 'Actions',
        subtitle: 'Highlight suspicious reciprocal scoring, collusion rings, and grade anomalies in Section 3',
        icon: Award,
        badge: 'Audit',
        badgeColor: '#f43f5e',
        keywords: ['flag outliers', 'check collusion', 'outliers', 'collusion', 'anomaly', 'audit outliers', 'grade anomaly', 'suspicious scoring'],
        onExecute: () => {
          onClose();
          onNavigateTab('results');
          if (!featureToggles.showAnomalyAudit && onToggleFeature) {
            onToggleFeature('showAnomalyAudit', true);
          }
          setTimeout(() => {
            const el = document.getElementById('collusion-anomaly-audit') || document.getElementById('anomaly-audit-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
          if (onToast) onToast('Navigated to Section 3: Anomaly & Collusion Audit', 'info');
        }
      },
    );

    // DIRECT EXPORT SHORTCUTS (Instant 1-Click File Downloads)
    list.push(
      {
        id: 'act_export_excel',
        title: 'Export: Excel Gradebook (.xlsx)',
        category: 'Actions',
        subtitle: 'Export 2-sheet workbook with student scores, multipliers, and rubric breakdown',
        icon: Download,
        badge: 'Excel',
        badgeColor: '#10b981',
        keywords: ['export', 'excel', 'xlsx', 'spreadsheet', 'download excel', 'export excel', 'gradebook', 'workbook'],
        onExecute: () => { onClose(); onExportExcel(); },
      },
      {
        id: 'act_export_pulse_csv',
        title: 'Export: Team Health Pulse Responses (CSV)',
        category: 'Actions',
        subtitle: 'Download student check-in morale ratings, milestone statuses, and blocker notes as CSV',
        icon: Download,
        badge: 'Pulse CSV',
        badgeColor: '#0d9488',
        keywords: ['export pulse', 'pulse csv', 'download pulse', 'micro-pulse csv', 'export team health', 'pulse data', 'student morale csv', 'blockers csv', 'export'],
        onExecute: () => { onClose(); handleExportPulseCSV(); },
      },
      {
        id: 'act_export_canvas',
        title: 'Export: Canvas LMS Gradebook (CSV)',
        category: 'Actions',
        subtitle: 'Canvas SIS-compatible CSV format ready for direct gradebook upload',
        icon: GraduationCap,
        badge: 'Canvas',
        badgeColor: '#e11d48',
        keywords: ['export', 'canvas', 'lms', 'csv', 'instructure', 'download canvas', 'export canvas', 'canvas export', 'gradebook'],
        onExecute: () => { onClose(); if (onExportLMS) onExportLMS('canvas'); },
      },
      {
        id: 'act_export_moodle',
        title: 'Export: Moodle LMS Gradebook (CSV / XML)',
        category: 'Actions',
        subtitle: 'Moodle grade import CSV format with email identifiers and scaled grades',
        icon: GraduationCap,
        badge: 'Moodle',
        badgeColor: '#ea580c',
        keywords: ['export', 'moodle', 'lms', 'xml', 'csv', 'download moodle', 'export moodle', 'moodle export', 'gradebook'],
        onExecute: () => { onClose(); if (onExportLMS) onExportLMS('moodle'); },
      },
      {
        id: 'act_export_blackboard',
        title: 'Export: Blackboard Learn Gradebook (CSV)',
        category: 'Actions',
        subtitle: 'Blackboard Ultra/Original batch upload CSV file with user IDs and marks',
        icon: GraduationCap,
        badge: 'Blackboard',
        badgeColor: '#0284c7',
        keywords: ['export', 'blackboard', 'lms', 'csv', 'ultra', 'download blackboard', 'export blackboard', 'gradebook'],
        onExecute: () => { onClose(); if (onExportLMS) onExportLMS('blackboard'); },
      },
      {
        id: 'act_export_brightspace',
        title: 'Export: Brightspace / D2L Gradebook (CSV)',
        category: 'Actions',
        subtitle: 'D2L Brightspace CSV with OrgDefinedId and End-of-Line indicator',
        icon: GraduationCap,
        badge: 'Brightspace',
        badgeColor: '#9333ea',
        keywords: ['export', 'brightspace', 'd2l', 'desire2learn', 'lms', 'csv', 'export brightspace', 'gradebook'],
        onExecute: () => { onClose(); if (onExportLMS) onExportLMS('brightspace'); },
      },
      {
        id: 'act_export_csv',
        title: 'Export: Results Summary Sheet (CSV)',
        category: 'Actions',
        subtitle: 'Tabular CSV sheet of student IDs, teams, peer multipliers, and final grades',
        icon: FileText,
        badge: 'CSV',
        keywords: ['export', 'csv', 'results', 'sheet', 'raw data', 'grades csv', 'download csv', 'export csv'],
        onExecute: () => { onClose(); if (onExportResultsCSV) onExportResultsCSV(); },
      },
      {
        id: 'act_export_pdf',
        title: 'Export: Class Evaluation Summary (PDF)',
        category: 'Actions',
        subtitle: 'Comprehensive visual evaluation report with competency distributions',
        icon: Award,
        badge: 'PDF',
        badgeColor: '#ef4444',
        keywords: ['export', 'pdf', 'summary', 'report', 'class summary', 'evaluation report', 'download pdf', 'export pdf'],
        onExecute: () => { onClose(); if (onExportPDFSummary) onExportPDFSummary(); },
      },
    );

    // SMART CONFIGURATION SHORTCUTS (Rubrics, Scales & Calibrations)
    list.push(
      {
        id: 'act_evaluation_controls',
        title: 'Peer Evaluation Form Fields & Student Permissions',
        category: 'Actions',
        subtitle: 'Toggle self-review, praise tags, constructive suggestions, strengths, role baseline & profile lock',
        icon: Sliders,
        badge: 'Form Controls',
        badgeColor: '#14b8a6',
        keywords: [
          'evaluation form', 'form fields', 'peer evaluation form fields', 'self review', 'constructive suggestion',
          'strengths', 'praise tags', 'role baseline', 'profile edit', 'profile editing', 'lock roster', 'permissions',
          'controls', 'toggle', 'questions', 'survey', 'form questions'
        ],
        onExecute: () => { onClose(); if (onOpenEvaluationControls) onOpenEvaluationControls(); },
      },
      {
        id: 'act_self_review_control',
        title: 'Self-Review Calibration (Student Portal)',
        category: 'Actions',
        subtitle: 'Require students to evaluate their own contributions, strengths, and perceived grade',
        icon: Sliders,
        badge: 'Form Controls',
        badgeColor: '#14b8a6',
        keywords: ['self review', 'self assessment', 'self evaluation', 'calibration', 'peer evaluation form fields', 'self rating'],
        onExecute: () => { onClose(); if (onOpenEvaluationControls) onOpenEvaluationControls(); },
      },
      {
        id: 'act_praise_tags_control',
        title: 'Strengths & Praise Recognition Tags',
        category: 'Actions',
        subtitle: 'Quick-select peer recognition chips (Code Quality, Team Player, Problem Solver, etc.)',
        icon: Sliders,
        badge: 'Form Controls',
        badgeColor: '#14b8a6',
        keywords: ['praise tags', 'recognition tags', 'strengths tags', 'peer praise', 'badges', 'chips', 'peer evaluation form fields'],
        onExecute: () => { onClose(); if (onOpenEvaluationControls) onOpenEvaluationControls(); },
      },
      {
        id: 'act_constructive_control',
        title: 'Constructive Improvement & Qualitative Feedback',
        category: 'Actions',
        subtitle: 'Actionable peer growth feedback prompts on student evaluation forms',
        icon: Sliders,
        badge: 'Form Controls',
        badgeColor: '#14b8a6',
        keywords: ['constructive improvement', 'growth suggestions', 'actionable feedback', 'qualitative suggestions', 'peer evaluation form fields', 'strengths feedback'],
        onExecute: () => { onClose(); if (onOpenEvaluationControls) onOpenEvaluationControls(); },
      },
      {
        id: 'act_profile_editing_control',
        title: 'Student Profile Self-Editing & Tamper Lock',
        category: 'Actions',
        subtitle: 'Lock or freeze student names, emails, and roles to prevent tampering',
        icon: Sliders,
        badge: 'Permissions',
        badgeColor: '#f43f5e',
        keywords: ['profile edit', 'profile editing', 'lock profile', 'freeze profile', 'student permissions', 'tamper lock', 'freeze identity'],
        onExecute: () => { onClose(); if (onOpenEvaluationControls) onOpenEvaluationControls(); },
      },
      {
        id: 'act_toggle_evaluation_card',
        title: featureToggles.showEvaluationFormControls ? 'Hide Evaluation Form Controls Card in Section 2' : 'Show Evaluation Form Controls Card in Section 2',
        category: 'Actions',
        subtitle: 'Toggle visibility of the form controls and student permissions card on Section 2 page',
        icon: Sliders,
        badge: 'Toggle S2',
        keywords: ['show evaluation form controls', 'hide evaluation form controls', 'evaluation controls card', 'section 2 card', 'review system card'],
        onExecute: () => { onClose(); if (onToggleFeature) onToggleFeature('showEvaluationFormControls', !featureToggles.showEvaluationFormControls); },
      },
      {
        id: 'act_team_health_pulse',
        title: 'Team Health "Micro-Pulse" Check-ins',
        category: 'Actions',
        subtitle: 'On-demand 30-second pulse surveys with customizable reviewing scales & sparklines',
        icon: Activity,
        badge: 'Pulse Check',
        badgeColor: '#0d9488',
        keywords: ['pulse', 'micro pulse', 'micro-pulse', 'team health', 'morale', 'standup', 'blocker', 'roadblock', 'sprint check', 'pulse survey', 'team pulse', 'health check', 'likert', 'stars', 'traffic light', 'sparkline', 'check-in'],
        onExecute: () => {
          onClose();
          onNavigateTab('grading');
          if (!featureToggles.showTeamHealthPulse && onToggleFeature) {
            onToggleFeature('showTeamHealthPulse', true);
          }
          setTimeout(() => {
            const el = document.getElementById('team-health-pulse-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        },
      },
      {
        id: 'act_launch_pulse',
        title: 'Launch New Team Health Micro-Pulse Check-in',
        category: 'Actions',
        subtitle: 'Trigger on-demand 30-second pulse survey directly on student dashboards',
        icon: Activity,
        badge: 'Launch',
        badgeColor: '#0d9488',
        keywords: ['launch pulse', 'start pulse', 'new pulse round', 'open pulse', 'run micro-pulse', 'trigger check-in', 'standup', 'sprint health', 'morale survey', 'pulse check', 'micro-pulse'],
        onExecute: () => {
          onClose();
          onNavigateTab('grading');
          if (!featureToggles.showTeamHealthPulse && onToggleFeature) {
            onToggleFeature('showTeamHealthPulse', true);
          }
          setTimeout(() => {
            const el = document.getElementById('team-health-pulse-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
          if (onToast) onToast('Navigated to Team Health Pulse — click "+ Launch Pulse Round"', 'info');
        },
      },
      {
        id: 'act_pulse_scales',
        title: 'Micro-Pulse Scale: Stars, Likert, Traffic Light, Points',
        category: 'Actions',
        subtitle: 'Configure reviewing rubric scale (1-5 Stars, 1-7 Likert, RAG Traffic Light, 0-10 Points)',
        icon: Sliders,
        badge: 'Pulse Rubric',
        badgeColor: '#0d9488',
        keywords: ['pulse scale', 'pulse rubric', 'likert scale', 'stars scale', 'traffic light scale', 'points scale', 'custom scale', 'rubric style', 'pulse questions', 'reviewing scale'],
        onExecute: () => {
          onClose();
          onNavigateTab('grading');
          if (!featureToggles.showTeamHealthPulse && onToggleFeature) {
            onToggleFeature('showTeamHealthPulse', true);
          }
          setTimeout(() => {
            const el = document.getElementById('team-health-pulse-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        },
      },
      {
        id: 'act_pulse_responses',
        title: 'Team Health Responses & Blocker Audit Log',
        category: 'Actions',
        subtitle: 'Review student morale submissions, roadblock notes, and team sparkline health trends',
        icon: FileText,
        badge: 'Pulse Audit',
        badgeColor: '#0d9488',
        keywords: ['pulse responses', 'pulse audit', 'blockers log', 'roadblocks', 'student morale', 'pulse answers', 'sprint blockers', 'health trends', 'pulse table'],
        onExecute: () => {
          onClose();
          onNavigateTab('grading');
          if (!featureToggles.showTeamHealthPulse && onToggleFeature) {
            onToggleFeature('showTeamHealthPulse', true);
          }
          setTimeout(() => {
            const el = document.getElementById('team-health-pulse-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        },
      },
      {
        id: 'act_toggle_team_health_pulse',
        title: featureToggles.showTeamHealthPulse ? 'Hide Team Health Pulse Card in Section 2' : 'Show Team Health Pulse Card in Section 2',
        category: 'Actions',
        subtitle: 'Toggle visibility of the on-demand team health pulse card in Section 2',
        icon: Activity,
        badge: 'Toggle S2',
        keywords: ['show team health pulse', 'hide team health pulse', 'pulse card', 'section 2 card', 'team pulse toggle'],
        onExecute: () => { onClose(); if (onToggleFeature) onToggleFeature('showTeamHealthPulse', !featureToggles.showTeamHealthPulse); },
      },
      {
        id: 'act_team_cohorts',
        title: 'Team Cohorts Overview & Formation Cards',
        category: 'Actions',
        subtitle: 'Inspect team rosters, member distributions, and peer evaluation completion in Section 1',
        icon: Users,
        badge: 'Teams',
        badgeColor: '#3b82f6',
        onExecute: () => {
          onClose();
          onNavigateTab('roster');
          if (!featureToggles.showTeamOverviewCards && onToggleFeature) {
            onToggleFeature('showTeamOverviewCards', true);
          }
        },
      },
      {
        id: 'act_team_charters_roles',
        title: 'Team Roles, Icebreakers & Collaboration Agreements',
        category: 'Actions',
        subtitle: 'Assign activity roles (Tech Lead, Scribe, Presenter, Facilitator), balance by background, and launch culturally tailored 5-min kickoff agreements',
        icon: UserPlus,
        badge: 'Team Kickoff',
        badgeColor: '#10b981',
        keywords: [
          'team charter', 'charter', 'role allocator', 'roles', 'icebreaker', 'team kickoff',
          'multicultural icebreaker', 'tech lead', 'scribe', 'presenter', 'activity roles',
          'assign roles', 'agreements', 'team contract', '5-min kickoff', 'agreements studio'
        ],
        onExecute: () => {
          onClose();
          if (onOpenTeamCharter) {
            onOpenTeamCharter();
          } else {
            onNavigateTab('roster');
          }
        },
      },
      {
        id: 'act_live_presentation_scoring',
        title: 'Live Presentation Scoring Cockpit (Mobile QR & Leaderboard)',
        category: 'Actions',
        subtitle: 'Display live mobile scoring QR code on projector, collect audience rubric ratings in real time, run timer, and project live leaderboard',
        icon: Presentation,
        badge: 'Live Scoring',
        badgeColor: '#0d9488',
        keywords: [
          'live presentation', 'presentation scoring', 'qr scoring', 'mobile qr', 'projector scoring',
          'presentation day', 'audience vote', 'presentation leaderboard', 'presentation timer',
          'pitch day', 'live pitch', 'live scoring', 'cockpit', 'audience ratings'
        ],
        onExecute: () => {
          onClose();
          if (onOpenLivePresentation) {
            onOpenLivePresentation();
          } else {
            onNavigateTab('grading');
          }
        },
      },
      {
        id: 'act_who_rated_whom_matrix',
        title: 'Who-Rated-Whom Cross Matrix Audit Grid',
        category: 'Actions',
        subtitle: 'Direct breakdown table showing exactly who gave what score to whom, identifying zero-variance and mutual rating clusters',
        icon: Grid,
        badge: 'Audit Grid',
        badgeColor: '#8b5cf6',
        keywords: [
          'who rated whom', 'matrix', 'cross matrix', 'detailed matrix', 'ratings matrix',
          'audit grid', 'who scored who', 'score transmission', 'peer scores grid', 'ratings grid'
        ],
        onExecute: () => {
          onClose();
          onNavigateTab('results');
          if (!featureToggles.showDetailedReviewMatrix && onToggleFeature) {
            onToggleFeature('showDetailedReviewMatrix', true);
          }
          setTimeout(() => {
            const el = document.getElementById('detailed-review-matrix');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        },
      },
      {
        id: 'act_custom_lms_schema',
        title: 'Custom LMS Column Schema Builder & Export Presets',
        category: 'Actions',
        subtitle: 'Configure custom LMS export columns, separator delimiters (comma, semicolon, tab), and sync directly to Canvas, Moodle, Blackboard, or Brightspace',
        icon: GraduationCap,
        badge: 'LMS Builder',
        badgeColor: '#0ea5e9',
        keywords: [
          'custom lms', 'lms schema', 'column builder', 'canvas', 'moodle', 'blackboard',
          'brightspace', 'd2l', 'delimiter', 'custom columns', 'sis id', 'gradebook export'
        ],
        onExecute: () => {
          onClose();
          onNavigateTab('results');
          if (!featureToggles.showLmsExport && onToggleFeature) {
            onToggleFeature('showLmsExport', true);
          }
          setTimeout(() => {
            const el = document.getElementById('lms-export-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        },
      },
      {
        id: 'act_quicklook_hud',
        title: 'Student QuickLook HUD Inspection (Spacebar Shortcut)',
        category: 'Actions',
        subtitle: 'Hover or focus any student row across roster or gradebook and press Space to open an instant telemetry inspection card',
        icon: Eye,
        badge: 'Space Key',
        badgeColor: '#6366f1',
        keywords: [
          'quicklook', 'hud', 'student hud', 'spacebar', 'space', 'peek', 'inspect student',
          'hover student', 'instant preview', 'quick inspection'
        ],
        onExecute: () => {
          onClose();
          if (onToast) onToast('QuickLook HUD: Hover over any student row and tap Spacebar for instant telemetry!', 'info');
        },
      },
      {
        id: 'act_reset_layout_default',
        title: 'Reset to Default Workspace Views & Layout',
        category: 'Actions',
        subtitle: 'Restore standard card sequence across all sections, clear all pinned cards, and apply recommended module defaults',
        icon: RotateCcw,
        badge: 'Reset Layout',
        badgeColor: '#f59e0b',
        keywords: [
          'reset layout', 'default layout', 'reset to default', 'restore layout', 'reset views',
          'clear custom layout', 'original layout', 'clean layout', 'default view', 'workspace reset'
        ],
        onExecute: () => {
          onClose();
          if (onResetLayout) {
            onResetLayout();
          } else {
            onApplyMode('standard');
          }
        },
      },
      {
        id: 'act_open_layout_library',
        title: 'Layout Library & Workspace Presets',
        category: 'Actions',
        subtitle: 'Browse curated pedagogical templates (Enrollment, Grading Day, LMS Audit) and manage your custom workspaces',
        icon: Layers,
        badge: 'Layout Library',
        badgeColor: '#6366f1',
        keywords: [
          'layout library', 'layouts', 'workspace templates', 'saved layouts', 'library',
          'presets', 'custom layouts', 'view profiles', 'workspace presets'
        ],
        onExecute: () => {
          onClose();
          if (onOpenLayoutLibrary) {
            onOpenLayoutLibrary();
          } else if (onOpenEditMode) {
            onOpenEditMode();
          }
        },
      },
      {
        id: 'act_student_report_general',
        title: 'Student 360° Comprehensive Report & PDF Generator',
        category: 'Actions',
        subtitle: 'Open full progress report cards, Johari blind spots, radar competency distributions, and printable PDFs',
        icon: Award,
        badge: 'Report Card',
        badgeColor: '#ec4899',
        keywords: [
          'student report', '360 report', 'pdf report', 'dossier', 'report card', 'student pdf',
          'progress report', 'export pdf student', 'individual report'
        ],
        onExecute: () => {
          onClose();
          onOpenReportModal();
        },
      },
      {
        id: 'act_rubric_weights',
        title: 'Rubric Weight Distribution & Balance Bar',
        category: 'Actions',
        subtitle: 'Review criteria percentage weightings and verify 100% total balance in Section 2',
        icon: BarChart2,
        badge: 'Weights',
        badgeColor: '#6366f1',
        keywords: ['weights', 'weight box', 'weight balance', 'criteria weight', 'percentage weight', 'rubric weights', '100% weight', 'weightage'],
        onExecute: () => {
          onClose();
          onNavigateTab('grading');
          if (!featureToggles.showWeightBalanceBar && onToggleFeature) {
            onToggleFeature('showWeightBalanceBar', true);
          }
        },
      },
      {
        id: 'act_open_modules_settings',
        title: 'Interface & Modules Settings (With Form Fields)',
        category: 'Actions',
        subtitle: 'Open Interface & Modules settings to configure density and peer evaluation form fields',
        icon: Settings,
        badge: 'Settings',
        keywords: ['interface and modules', 'modules', 'interface', 'peer evaluation form fields', 'density presets', 'feature toggles', 'settings modules'],
        onExecute: () => { onClose(); onOpenSettings('modules'); },
      },
      {
        id: 'act_preset_ipaf',
        title: 'Apply Rubric: IPAF Standard (6 Dimensions)',
        category: 'Actions',
        subtitle: 'Research-synthesized CATME & AAC&U rubric (Contribution, Reliability, Problem-Solving, etc.)',
        icon: Sparkles,
        badge: 'Rubric',
        badgeColor: '#6366f1',
        keywords: ['rubric', 'ipaf', 'preset', 'standard rubric', 'research rubric', 'apply rubric', 'catme'],
        onExecute: () => { if (onApplyRubricPreset) onApplyRubricPreset('ipaf_research_synthesized'); onClose(); },
      },
      {
        id: 'act_scale_100',
        title: 'Target Scale: Percentage (0 – 100)',
        category: 'Actions',
        subtitle: 'Normalize student evaluation scores to standard 0–100 percentage scale',
        icon: Gauge,
        badge: 'Scale',
        keywords: ['scale', 'scale 100', 'percentage', 'target scale', 'grade scale 100', '100%'],
        onExecute: () => { if (onSetTargetScale) onSetTargetScale(100); onClose(); },
      },
      {
        id: 'act_scale_20',
        title: 'Target Scale: European / French (0 – 20)',
        category: 'Actions',
        subtitle: 'Normalize student evaluation scores to standard 0–20 scale',
        icon: Gauge,
        badge: 'Scale',
        keywords: ['scale', 'scale 20', 'french', 'european', 'target scale', 'out of 20'],
        onExecute: () => { if (onSetTargetScale) onSetTargetScale(20); onClose(); },
      },
      {
        id: 'act_scale_4',
        title: 'Target Scale: GPA 4.0 (0.0 – 4.0)',
        category: 'Actions',
        subtitle: 'Normalize student evaluation scores to standard 4.0 GPA scale',
        icon: Gauge,
        badge: 'Scale',
        keywords: ['scale', 'scale 4', 'gpa', '4.0', 'grade point', 'target scale'],
        onExecute: () => { if (onSetTargetScale) onSetTargetScale(4); onClose(); },
      },
      {
        id: 'act_scale_raw',
        title: 'Target Scale: Raw Sum (Unscaled)',
        category: 'Actions',
        subtitle: 'Show unscaled sum of criterion ratings without scale normalization',
        icon: Gauge,
        badge: 'Scale',
        keywords: ['scale', 'raw scale', 'raw sum', 'unscaled', 'criterion sum', 'target scale'],
        onExecute: () => { if (onSetTargetScale) onSetTargetScale(null); onClose(); },
      },
      {
        id: 'act_fudge_100',
        title: 'WebPA Calibrator: 100% Peer Factor (Pure Peer Score)',
        category: 'Actions',
        subtitle: 'Full peer differentiation — peer factor directly multiplies grades with zero tutor dampening',
        icon: Sliders,
        badge: 'WebPA',
        keywords: ['webpa', 'webpa 100', 'fudge 100', 'pure peer', 'calibration', 'calibrator'],
        onExecute: () => { if (onSetFudgeWeight) onSetFudgeWeight(1.0); onClose(); },
      },
      {
        id: 'act_fudge_50',
        title: 'WebPA Calibrator: 50% Blended (Recommended Balance)',
        category: 'Actions',
        subtitle: '50% baseline grade + 50% peer multiplier for balanced equity',
        icon: Sliders,
        badge: 'WebPA',
        badgeColor: '#10b981',
        keywords: ['webpa', 'webpa 50', 'fudge 50', 'blended', 'calibration', 'balanced'],
        onExecute: () => { if (onSetFudgeWeight) onSetFudgeWeight(0.5); onClose(); },
      },
      {
        id: 'act_fudge_0',
        title: 'WebPA Calibrator: 0% Neutral (Disable Peer Modifiers)',
        category: 'Actions',
        subtitle: 'All students receive 100% baseline mark with peer multipliers neutralized',
        icon: Sliders,
        badge: 'WebPA',
        keywords: ['webpa', 'webpa 0', 'fudge 0', 'neutral', 'disable peer factor', 'calibration'],
        onExecute: () => { if (onSetFudgeWeight) onSetFudgeWeight(0.0); onClose(); },
      },
      {
        id: 'act_remind_pending',
        title: 'Dispatch Reminders: Pending Students',
        category: 'Actions',
        subtitle: 'Open Link Dispatcher to send nudges and links to all pending students',
        icon: Mail,
        badge: 'Email',
        badgeColor: '#0ea5e9',
        keywords: ['remind', 'reminder', 'nudge', 'pending reminder', 'email pending', 'dispatcher'],
        onExecute: () => { onClose(); onOpenDispatcher(); },
      }
    );

    if (onOpenImportWizard) list.push({ id: 'act_import', title: 'Smart Roster Import Wizard', category: 'Actions', subtitle: 'Upload roster from CSV, Excel, or paste rows', icon: Download, badge: 'Import', keywords: ['import','upload','csv','excel','xlsx','bulk','wizard'], onExecute: () => { onClose(); onOpenImportWizard(); } });
    if (onOpenAutoGroup)    list.push({ id: 'act_autogroup', title: 'AutoGroup Diversity Formation', category: 'Actions', subtitle: 'Balance teams by gender, nationality, language', icon: Users, badge: 'Algorithm', keywords: ['autogroup','teams','balance','diversity','formation','auto'], onExecute: () => { onClose(); onOpenAutoGroup(); } });
    if (onOpenQRCode)       list.push({ id: 'act_qr', title: 'Self-Enrollment QR Code & Link', category: 'Actions', subtitle: 'Instant QR badge and registration join link', icon: QrCode, badge: 'QR', keywords: ['qr','code','link','join','registration','self-enroll','scan'], onExecute: () => { onClose(); onOpenQRCode(); } });
    if (onOpenDeadline)     list.push({ id: 'act_deadline', title: 'Set Milestone Deadline & Countdown', category: 'Actions', subtitle: 'Configure submission cutoff and archive sprints', icon: Clock, badge: 'Timer', keywords: ['deadline','timer','cutoff','countdown','sprint','lock','archive'], onExecute: () => { onClose(); onOpenDeadline(); } });
    if (onResetSubmissions) list.push({ id: 'act_reset', title: 'Reset All Submissions', category: 'Actions', subtitle: 'Wipe all reviews back to pending for a new round', icon: RefreshCw, badge: 'Danger', badgeColor: '#f43f5e', keywords: ['reset','clear','wipe','delete submissions','restart'], onExecute: () => { onClose(); onResetSubmissions(); } });
    if (onClearRoster && classData) {
      list.push({
        id: 'act_clear_roster',
        title: 'Clear Classroom Roster (Delete All Students)',
        category: 'Actions',
        subtitle: `Permanently delete all ${classData.students.length} students and their evaluation records from "${classData.name}"`,
        icon: Trash2,
        badge: 'Danger',
        badgeColor: '#f43f5e',
        keywords: [
          'clear roster', 'clear class roster', 'delete all students', 'wipe roster',
          'delete roster', 'remove all students', 'empty class', 'wipe students',
          'reset roster', 'clear all', 'delete all', 'clear students', 'purge roster', 'clear class',
          'empty roster', 'remove students', 'drop all students'
        ],
        onExecute: () => {
          onClose();
          onClearRoster();
        }
      });
    }
    if (onDeleteClass && classData) {
      list.push({
        id: 'act_delete_class',
        title: `Delete Classroom: ${classData.name}`,
        category: 'Actions',
        subtitle: `Permanently delete "${classData.name}" and all associated cohort data`,
        icon: Trash2,
        badge: 'Danger',
        badgeColor: '#f43f5e',
        keywords: ['delete class', 'remove class', 'drop class', 'delete classroom', 'destroy class', 'delete current class'],
        onExecute: () => {
          onClose();
          onDeleteClass();
        }
      });
    }
    if (onOpenTour)         list.push({ id: 'act_tour', title: 'Start App Walkthrough Tour', category: 'Actions', subtitle: 'Interactive spotlight tour showing every feature', icon: Compass, badge: 'Tour', keywords: ['tour','walkthrough','guide','tutorial','demo','onboard'], onExecute: () => { onClose(); onOpenTour(); } });
    list.push(
      {
        id: 'act_guide_manual',
        title: 'Full Institutional Operational Manual',
        category: 'Help',
        subtitle: 'Open complete 17-chapter handbook, WebPA math specifications, and LMS guide in a new tab',
        icon: BookOpen,
        badge: 'Manual',
        badgeColor: '#6366f1',
        keywords: ['manual', 'guide', 'handbook', 'docs', 'documentation', 'instructions', 'help', 'tutorial', 'formulas', 'lms manual'],
        onExecute: () => {
          onClose();
          window.open('/guide.html', '_blank');
        },
      }
    );
    if (onOpenGuideCenter) {
      list.push(
        {
          id: 'act_guide',
          title: 'Academic Guidance & Tutorial Center',
          category: 'Actions',
          subtitle: 'Pedagogy guides, research docs, and feature walkthroughs',
          icon: BookOpen,
          badge: 'Guide',
          keywords: ['guide', 'help', 'docs', 'manual', 'pedagogy', 'research', 'tutorial'],
          onExecute: () => { onClose(); onOpenGuideCenter('system'); },
        }
      );
    }

    // APPEARANCE
    list.push(
      { id: 'theme_dark',   title: 'Switch to Dark Mode',         category: 'Appearance', subtitle: 'Deep obsidian, eye-friendly for low-light',        icon: Moon,     badge: themeMode === 'dark'   ? 'Active' : undefined, keywords: ['dark mode','theme','black','night','obsidian'], onExecute: () => { setThemeMode('dark');   if (onToast) onToast('Switched to Dark Mode', 'info'); onClose(); } },
      { id: 'theme_light',  title: 'Switch to Light Mode',        category: 'Appearance', subtitle: 'Crisp, high-contrast academic surfaces',           icon: Sun,      badge: themeMode === 'light'  ? 'Active' : undefined, keywords: ['light mode','theme','white','day','bright'],    onExecute: () => { setThemeMode('light');  if (onToast) onToast('Switched to Light Mode', 'info'); onClose(); } },
      { id: 'theme_system', title: 'Sync Theme with System Auto', category: 'Appearance', subtitle: 'Follow your OS theme preference automatically',    icon: Sparkles, badge: themeMode === 'system' ? 'Active' : undefined, keywords: ['system theme','auto theme','os','automatic'],   onExecute: () => { setThemeMode('system'); if (onToast) onToast('Theme set to System Auto', 'info'); onClose(); } },
    );

    // MODES & PROFESSOR LAYOUT PRESETS
    list.push(
      { id: 'mode_minimal',  title: 'Apply Essentials Only',        category: 'Modes', subtitle: 'Hides advanced analytics to keep the interface clean and simple', icon: LayoutDashboard, badge: activeMode === 'minimal'  ? 'Active' : 'Essentials', badgeColor: activeMode === 'minimal'  ? '#10b981' : undefined, keywords: ['minimal','simple','basic','clean','essentials','essentials only','hide extras'],   onExecute: () => { onApplyMode('minimal');  if (onToast) onToast('Essentials Only mode activated', 'success'); onClose(); } },
      { id: 'mode_standard', title: 'Apply Recommended Mode',       category: 'Modes', subtitle: 'The balanced classroom layout with essential tools',              icon: Gauge,           badge: activeMode === 'standard' ? 'Active' : 'Recommended',badgeColor: activeMode === 'standard' ? '#10b981' : undefined, keywords: ['standard','default','normal','balanced','moderate','recommended'],     onExecute: () => { onApplyMode('standard'); if (onToast) onToast('Recommended mode activated', 'success'); onClose(); } },
      { id: 'mode_full',     title: 'Show All Modules',             category: 'Modes', subtitle: 'Turns on every available feature and tool',                       icon: Cpu,             badge: activeMode === 'full'     ? 'Active' : 'All Modules', badgeColor: activeMode === 'full'     ? '#10b981' : undefined, keywords: ['full','power user','advanced','all features','show all modules','everything'], onExecute: () => { onApplyMode('full');     if (onToast) onToast('Show All Modules activated', 'success'); onClose(); } },
      { id: 'mode_none',     title: 'Hide All Modules (Clean Canvas)', category: 'Modes', subtitle: 'Hides all optional modules for an uncluttered blank canvas',  icon: EyeOff,          badge: activeMode === 'none'     ? 'Active' : 'Hide All',    badgeColor: activeMode === 'none'     ? '#ef4444' : undefined, keywords: ['none','clean canvas','hide all','blank canvas','clear modules','empty workspace','clear all'], onExecute: () => { onApplyMode('none'); if (onToast) onToast('All modules hidden (Clean canvas)', 'info'); onClose(); } },
      ...BUILT_IN_LAYOUT_PROFILES.map((profile): CPAction => ({
        id: `preset_${profile.id}`,
        title: `Apply Preset: ${profile.name}`,
        category: 'Modes',
        subtitle: profile.description || 'Pre-configured professor layout template',
        icon: Layers,
        badge: profile.badge || 'Preset',
        badgeColor: '#6366f1',
        keywords: [
          'preset', 'layout preset', 'template', 'layout library', profile.name.toLowerCase(),
          ...(profile.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean))
        ],
        onExecute: () => {
          applyFullLayoutProfile(profile, {
            onToggleFeature,
            onToast: onToast ? (msg, type) => onToast(msg, type || 'info') : undefined
          });
          if (onToast) onToast(`Applied "${profile.name}" layout preset!`, 'success');
          onClose();
        },
      }))
    );

    // DOCK & WORKSPACE PINNING ACTIONS FOR ALL MODULES
    AVAILABLE_PINNABLE_MODULES.forEach(m => {
      const IconComp = m.icon;
      const isPinned = pinnedIds.includes(m.id);
      list.push({
        id: `pin_module_${m.id}`,
        title: `${isPinned ? 'Unpin from' : 'Pin to'} Workspace Dock: ${m.title}`,
        category: 'Actions',
        subtitle: `${m.description} · Currently ${isPinned ? 'PINNED in Dock' : 'Not Pinned'}. Press Enter to toggle`,
        icon: IconComp,
        badge: isPinned ? 'Pinned' : 'Pin Dock',
        badgeColor: isPinned ? '#f59e0b' : m.accentColor,
        keywords: ['pin', 'unpin', 'dock', 'floating', m.title.toLowerCase(), m.shortTitle.toLowerCase(), ...(m.keywords || [])],
        onExecute: () => {
          const next = togglePinModule(m.id);
          if (onToast) onToast(`${next ? 'Pinned' : 'Unpinned'} "${m.shortTitle}" ${next ? 'into' : 'from'} Workspace Dock`, next ? 'success' : 'info');
          onClose();
        }
      });
    });

    // KNOWLEDGE BASE FAQ ARTICLES
    FAQ_KNOWLEDGE_BASE.forEach(faq => {
      list.push({
        id: `faq_${faq.id}`,
        title: `Q&A: ${faq.question}`,
        category: 'Help',
        subtitle: faq.summary,
        icon: HelpCircle,
        badge: 'FAQ',
        badgeColor: '#8b5cf6',
        keywords: ['faq', 'help', 'guide', 'explain', faq.question.toLowerCase(), ...faq.summary.toLowerCase().split(/\s+/)],
        onExecute: () => {
          if (faq.actionTab) {
            onNavigateTab(faq.actionTab);
            onClose();
          } else if (faq.actionSpecial === 'dispatcher') {
            onOpenDispatcher();
            onClose();
          } else if (faq.actionSpecial === 'autogroup') {
            if (onOpenAutoGroup) onOpenAutoGroup();
            onClose();
          }
        }
      });
    });

    // FEATURE TOGGLES
    (Object.keys(FL) as (keyof FeatureToggles)[]).forEach(key => {
      const m = FL[key];
      const isOn = featureToggles[key];
      const keyStr = String(key);
      list.push({
        id: `feat_show_${keyStr}`,
        title: `Show ${m.label}`,
        category: 'Features',
        subtitle: `${m.desc} · ${m.section} · Currently ${isOn ? 'visible' : 'hidden'}`,
        icon: isOn ? Eye : EyeOff,
        badge: isOn ? 'Visible' : 'Hidden',
        badgeColor: isOn ? '#10b981' : '#94a3b8',
        keywords: ['show','enable','turn on','activate','visible',m.label.toLowerCase(),keyStr.toLowerCase(),m.section.toLowerCase()],
        intentTag: 'show',
        featureKey: key,
        onExecute: () => {
          onToggleFeature(key, true);
          if (onToast) onToast(`${m.label} is now visible`, 'success');
        },
      });
      list.push({
        id: `feat_hide_${keyStr}`,
        title: `Hide ${m.label}`,
        category: 'Features',
        subtitle: `${m.desc} · ${m.section} · Currently ${isOn ? 'visible' : 'hidden'}`,
        icon: EyeOff,
        badge: isOn ? 'Visible' : 'Hidden',
        badgeColor: isOn ? '#10b981' : '#94a3b8',
        keywords: ['hide','disable','turn off','deactivate','hidden',m.label.toLowerCase(),keyStr.toLowerCase(),m.section.toLowerCase()],
        intentTag: 'hide',
        featureKey: key,
        onExecute: () => {
          onToggleFeature(key, false);
          if (onToast) onToast(`${m.label} is now hidden`, 'info');
        },
      });
    });

    // HELP ARTICLES
    Object.values(FEATURE_INFO_REGISTRY).forEach(info => {
      list.push({
        id: `help_${info.id}`,
        title: info.title,
        category: 'Help',
        subtitle: info.summary,
        icon: HelpCircle,
        badge: info.category,
        keywords: ['how to','what is','explain','help','formula',info.id,info.category.toLowerCase(),...(info.proTip ? ['protip','tip'] : [])],
        helpItem: info,
        onExecute: () => setActiveHelpArticle(info),
      });
    });

    // QUICK FILTER JUMPERS (STATUS & ATTRIBUTES)
    list.push(
      {
        id: 'jump_filter_pending',
        title: 'Pending Students (Filter Unsubmitted)',
        category: 'Students',
        subtitle: 'Filter roster and gradebook to show students with unsubmitted evaluations',
        icon: Filter,
        badge: 'Filter',
        badgeColor: '#f59e0b',
        keywords: ['pending', 'unsubmitted', 'filter pending', 'status pending', 'awaiting', 'not submitted', 'filter', 'incomplete'],
        onExecute: () => {
          if (onSetFilter) onSetFilter({ search: 'pending', group: 'all', duplicatesOnly: false });
          onNavigateTab('roster');
          if (onToast) onToast('Filtered to Pending students (Roster & Gradebook)', 'info');
          onClose();
        },
      },
      {
        id: 'jump_filter_submitted',
        title: 'Submitted Students (Filter Completed)',
        category: 'Students',
        subtitle: 'Filter roster and gradebook to show students with completed peer evaluations',
        icon: Filter,
        badge: 'Filter',
        badgeColor: '#10b981',
        keywords: ['submitted', 'completed', 'filter submitted', 'status submitted', 'done', 'finished', 'filter'],
        onExecute: () => {
          if (onSetFilter) onSetFilter({ search: 'submitted', group: 'all', duplicatesOnly: false });
          onNavigateTab('roster');
          if (onToast) onToast('Filtered to Completed students (Roster & Gradebook)', 'info');
          onClose();
        },
      },
      {
        id: 'jump_filter_unassigned',
        title: 'Unassigned Students (Filter No Team)',
        category: 'Students',
        subtitle: 'Filter roster to show students not assigned to any group',
        icon: Filter,
        badge: 'Filter',
        badgeColor: '#ec4899',
        keywords: ['unassigned', 'no team', 'orphan', 'filter unassigned', 'without team', 'filter'],
        onExecute: () => {
          if (onSetFilter) onSetFilter({ search: 'unassigned', group: 'all', duplicatesOnly: false });
          onNavigateTab('roster');
          if (onToast) onToast('Filtered to Unassigned students', 'info');
          onClose();
        },
      },
      {
        id: 'jump_filter_duplicates',
        title: 'Duplicate Students (Filter Collisions)',
        category: 'Students',
        subtitle: 'Filter roster to show duplicate email or student ID registrations',
        icon: Filter,
        badge: 'Filter',
        badgeColor: '#f43f5e',
        keywords: ['duplicate', 'duplicates', 'filter duplicate', 'conflict', 'collision', 'filter'],
        onExecute: () => {
          if (onSetFilter) onSetFilter({ search: '', group: 'all', duplicatesOnly: true });
          onNavigateTab('roster');
          if (onToast) onToast('Filtered to Duplicate student registrations', 'info');
          onClose();
        },
      },
      {
        id: 'jump_filter_reset',
        title: 'Reset All Filters (Show All Students)',
        category: 'Students',
        subtitle: 'Clear search terms, group selections, and duplicate flags across roster and gradebook',
        icon: RefreshCw,
        badge: 'Reset',
        keywords: ['reset filters', 'clear filter', 'show all', 'all students', 'reset search', 'clear search', 'unfilter', 'filter'],
        onExecute: () => {
          if (onSetFilter) onSetFilter({ search: '', group: 'all', duplicatesOnly: false });
          onNavigateTab('roster');
          if (onToast) onToast('All filters cleared — showing all students', 'info');
          onClose();
        },
      },
    );

    // TEAMS & STUDENTS
    if (classData) {
      Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean))).forEach(team => {
        const members = classData.students.filter(s => s.groupName === team);
        const subs = members.filter(s => s.submitted).length;
        const normalizedTeamTitle = team.toLowerCase().startsWith('team') ? team : `Team ${team}`;
        list.push({
          id: `team_${team}`,
          title: `${normalizedTeamTitle} (Filter Roster & Gradebook)`,
          category: 'Teams',
          subtitle: `${members.length} members · ${subs}/${members.length} submitted · Click to filter`,
          icon: Globe,
          badge: `${members.length} Students`,
          keywords: [
            'team',
            team.toLowerCase(),
            normalizedTeamTitle.toLowerCase(),
            normalizedTeamTitle.toLowerCase().replace(/\s+/g, ''),
            'filter',
            `filter ${team.toLowerCase()}`,
            'group',
            'members',
          ],
          onExecute: () => {
            if (onSetFilter) {
              onSetFilter({ group: team, search: '', duplicatesOnly: false });
            } else if (onSelectTeamFilter) {
              onSelectTeamFilter(team);
            }
            onNavigateTab('roster');
            if (onToast) onToast(`Filtered to ${team} (Roster & Gradebook)`, 'info');
            onClose();
          },
        });
      });

      classData.students.forEach(s => {
        list.push({
          id: `student_${s.id}`,
          title: s.name,
          category: 'Students',
          subtitle: `${s.groupName || 'Unassigned'} · ${s.email || s.id}${s.degree ? ` · ${s.degree}` : ''}${s.isExcused ? ' · [Excused Absence]' : ''}`,
          icon: s.isExcused ? ShieldCheck : FileText,
          badge: s.isExcused ? 'Excused' : s.submitted ? 'Submitted' : 'Pending',
          badgeColor: s.isExcused ? '#6366f1' : s.submitted ? '#10b981' : '#f59e0b',
          keywords: [
            s.name.toLowerCase(),
            s.id.toLowerCase(),
            s.email ? s.email.toLowerCase() : '',
            s.groupName ? s.groupName.toLowerCase() : '',
            s.submitted ? 'submitted' : 'pending',
            s.submitted ? 'completed' : 'unsubmitted',
            s.isExcused ? 'excused' : '',
            s.isExcused ? 'medical' : '',
            s.isExcused ? 'exemption' : '',
            s.nationality ? s.nationality.toLowerCase() : '',
          ],
          onExecute: () => {
            onOpenReportModal(s.id);
            onClose();
          },
        });

        // 1-Click Grade Dispute Resolution Dossier action
        list.push({
          id: `dispute_${s.id}`,
          title: `Grade Dispute Dossier: ${s.name}`,
          category: 'Actions',
          subtitle: `Self vs peer gap, retaliation audit, and ready-to-send draft for ${s.name}`,
          icon: Scale,
          badge: 'Dispute',
          badgeColor: '#4f46e5',
          keywords: [
            'dispute',
            `dispute ${s.name.toLowerCase()}`,
            `audit ${s.name.toLowerCase()}`,
            'grade dispute',
            'office hours',
            'appeal',
            s.name.toLowerCase(),
          ],
          onExecute: () => {
            setActiveDisputeStudentId(s.id);
          },
        });

        // Toggle Excused Exemption action
        if (onToggleExcused) {
          list.push({
            id: `excuse_${s.id}`,
            title: s.isExcused ? `Remove Excused Exemption: ${s.name}` : `Grant Excused / Medical Exemption: ${s.name}`,
            category: 'Actions',
            subtitle: s.isExcused ? 'Restore to standard WebPA calculation' : 'Neutralize WebPA factor to 1.00 & protect team denominator',
            icon: ShieldCheck,
            badge: s.isExcused ? 'Unexcuse' : 'Excuse',
            badgeColor: s.isExcused ? '#b45309' : '#0d9488',
            keywords: [
              'excuse',
              'excused',
              'medical',
              'exemption',
              `excuse ${s.name.toLowerCase()}`,
              s.name.toLowerCase(),
            ],
            onExecute: () => {
              onToggleExcused(s.id);
            },
          });
        }

        if (onDeleteStudent) {
          list.push({
            id: `del_student_${s.id}`,
            title: `Delete Student: ${s.name}`,
            category: 'Students',
            subtitle: `Remove ${s.name} (${s.groupName || 'Unassigned'}) from roster and terminate active session`,
            icon: Trash2,
            badge: 'Delete',
            badgeColor: '#f43f5e',
            keywords: [
              `delete ${s.name.toLowerCase()}`,
              `remove ${s.name.toLowerCase()}`,
              `wipe ${s.name.toLowerCase()}`,
              'delete student',
              'remove student',
              s.name.toLowerCase(),
              s.id.toLowerCase()
            ],
            onExecute: () => {
              onClose();
              onDeleteStudent(s.id, s.name);
            }
          });
        }
      });
    }

    return list;
  }, [
    classData, featureToggles, themeMode, activeMode, onNavigateTab, onOpenProjector,
    onOpenDispatcher, onOpenSettings, onOpenShortcuts, onOpenAddStudent, onOpenReportModal,
    onExportExcel, onOpenTour, onOpenGuideCenter, onSelectTeamFilter, onOpenNewClass,
    onOpenImportWizard, onOpenAutoGroup, onOpenQRCode, onOpenDeadline, onResetSubmissions,
    onClearRoster, onDeleteStudent, onDeleteClass,
    onToast, onClose, onToggleFeature, onApplyMode, setThemeMode,
    onSetFilter, onApplyRubricPreset, onSetTargetScale, onSetFudgeWeight, onExportLMS,
    onExportResultsCSV, onExportPDFSummary, onOpenEnrollmentBuilder, onOpenTeamCharter,
    onOpenLivePresentation, onOpenEvaluationControls, onUpdateEvaluationControls, onToggleExcused, onOpenEditMode,
    shortcutsEnabled, onToggleShortcutsEnabled, onOpenSnapshots,
    onOpenLayoutLibrary, onResetLayout, mathResult, effectiveQuery
  ]);

  // ── NLP FILTER & SCORE WITH PREFIX SUPPORT ──────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Smart Filter Prefixes: @ (Teams), # (Students), > (Commands), ? (Guides), = (Math)
    if (prefix === '@') {
      result = result.filter(i => i.category === 'Teams');
    } else if (prefix === '#') {
      result = result.filter(i => i.category === 'Students');
    } else if (prefix === '>') {
      result = result.filter(i => ['Actions', 'Navigation', 'Features', 'Modes'].includes(i.category));
    } else if (prefix === '?') {
      result = result.filter(i => i.category === 'Help');
    } else if (prefix === '=') {
      result = result.filter(i => i.category === 'Actions' && (i.id.includes('math') || i.keywords?.includes('calc')));
    } else {
      const tab = CATEGORY_TABS.find(t => t.id === selectedCategory);
      if (tab && tab.cats.length > 0) {
        result = result.filter(i => tab.cats.includes(i.category));
      }
    }

    if (!effectiveQuery.trim()) return result;
    const rawQ = effectiveQuery.toLowerCase().trim();
    return result
      .map(item => ({ item, sc: scoreItem(item, queryTokens, rawQ, intent) }))
      .filter(x => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map(x => x.item);
  }, [allItems, prefix, effectiveQuery, selectedCategory, queryTokens, intent]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: 0, actions: 0, features: 0, modes: 0, students: 0, teams: 0, calc: 0, help: 0, appearance: 0,
    };
    const rawQ = effectiveQuery.toLowerCase().trim();
    const base = !rawQ ? allItems : allItems.filter(i => scoreItem(i, queryTokens, rawQ, intent) > 0);
    base.forEach(i => {
      const t = CATEGORY_TABS.find(x => x.cats.includes(i.category));
      if (t) counts[t.id] = (counts[t.id] || 0) + 1;
      counts.all = (counts.all || 0) + 1;
    });
    return counts;
  }, [allItems, effectiveQuery, queryTokens, intent]);

  const recentItems = useMemo(() => {
    return recentIds
      .map(id => allItems.find(i => i.id === id))
      .filter(Boolean) as CPAction[];
  }, [recentIds, allItems]);

  // ── SMART CONTEXTUAL ACTIONS ───────────────────────────────────────────────
  const smartRecommendations = useMemo<CPAction[]>(() => {
    const list: CPAction[] = [];
    if (!classData) return list;
    const total = classData.students.length;
    const submitted = classData.students.filter(s => s.submitted).length;

    if (total === 0 && onOpenImportWizard) {
      list.push({
        id: 'rec_import',
        title: 'Import Student Roster',
        category: 'Actions',
        subtitle: 'No students enrolled yet — upload CSV/Excel or paste roster',
        icon: Download,
        badge: 'Recommended',
        badgeColor: '#6366f1',
        onExecute: () => { onClose(); onOpenImportWizard(); },
      });
    }

    if (total > 0 && submitted < total && onOpenDispatcher) {
      list.push({
        id: 'rec_dispatch',
        title: 'Send Evaluation Links',
        category: 'Actions',
        subtitle: `${total - submitted} student${total - submitted > 1 ? 's have' : ' has'} not submitted peer reviews yet`,
        icon: Send,
        badge: 'Action Needed',
        badgeColor: '#f59e0b',
        onExecute: () => { onClose(); onOpenDispatcher(); },
      });
    }

    if (!featureToggles.showCompetencyRadar) {
      list.push({
        id: 'rec_radar',
        title: 'Enable Skills Radar Chart',
        category: 'Features',
        subtitle: 'Turn on visual chart comparing team strengths across all rubric criteria',
        icon: Eye,
        badge: 'Recommended',
        badgeColor: '#10b981',
        intentTag: 'show',
        featureKey: 'showCompetencyRadar',
        onExecute: () => { onToggleFeature('showCompetencyRadar', true); if (onToast) onToast('Skills Radar Chart enabled', 'success'); },
      });
    }

    if (!featureToggles.showLmsExport) {
      list.push({
        id: 'rec_lms',
        title: 'Enable Export to Canvas / Blackboard / Moodle',
        category: 'Features',
        subtitle: 'Sync scores formatted for Canvas, Blackboard, or Moodle',
        icon: GraduationCap,
        badge: 'Recommended',
        badgeColor: '#10b981',
        intentTag: 'show',
        featureKey: 'showLmsExport',
        onExecute: () => { onToggleFeature('showLmsExport', true); if (onToast) onToast('Export to Canvas / Blackboard / Moodle enabled', 'success'); },
      });
    }

    if (activeMode !== 'minimal') {
      list.push({
        id: 'rec_mode_minimal',
        title: 'Switch to Essentials Only',
        category: 'Modes',
        subtitle: 'Hides advanced analytics to keep the interface clean and simple',
        icon: LayoutDashboard,
        badge: 'Mode',
        onExecute: () => { onApplyMode('minimal'); if (onToast) onToast('Switched to Essentials Only', 'info'); onClose(); },
      });
    }

    return list.slice(0, 3);
  }, [classData, featureToggles, activeMode, onOpenImportWizard, onOpenDispatcher, onToggleFeature, onApplyMode, onToast, onClose]);

  // ── UNIFIED DISPLAYED ITEMS: SINGLE SOURCE OF TRUTH ────────────────────────
  const displayedItems = useMemo<(CPAction & { sectionLabel?: string })[]>(() => {
    // Search query active or specific category tab active
    if (query.trim() !== '' || selectedCategory !== 'all') {
      return filteredItems;
    }

    // Empty state on 'All' tab: combine Recent, Smart Suggestions, Quick Actions
    const result: (CPAction & { sectionLabel?: string })[] = [];
    const seenIds = new Set<string>();

    // 1. Recent Commands
    const recents = recentItems.slice(0, 3);
    recents.forEach((item, i) => {
      seenIds.add(item.id);
      result.push({
        ...item,
        sectionLabel: i === 0 ? 'Recent Commands' : undefined,
      });
    });

    // 2. Smart Recommendations
    smartRecommendations.forEach((item, i) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push({
          ...item,
          sectionLabel: i === 0 ? 'Smart Suggestions' : undefined,
        });
      }
    });

    // 3. Quick Start Core Actions
    const quickIds = ['nav_hub', 'nav_roster', 'nav_grading', 'nav_results', 'act_projector', 'act_export_excel', 'mode_standard', 'act_guide'];
    const quickItems = allItems.filter(i => quickIds.includes(i.id));
    let firstQuick = true;
    quickItems.forEach(item => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push({
          ...item,
          sectionLabel: firstQuick ? 'Quick Start' : undefined,
        });
        firstQuick = false;
      }
    });

    return result;
  }, [query, selectedCategory, filteredItems, recentItems, smartRecommendations, allItems]);

  // Reset index on filter or query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Ensure index is clamped within valid bounds
  useEffect(() => {
    if (selectedIndex >= displayedItems.length && displayedItems.length > 0) {
      setSelectedIndex(displayedItems.length - 1);
    }
  }, [displayedItems.length, selectedIndex]);

  // ── KEYBOARD NAVIGATION HANDLER ─────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        isKeyboardNav.current = true;
        if (displayedItems.length > 0) {
          setSelectedIndex(prev => (prev + 1) % displayedItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        isKeyboardNav.current = true;
        if (displayedItems.length > 0) {
          setSelectedIndex(prev => (prev - 1 + displayedItems.length) % displayedItems.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeHelpArticle) {
          setActiveHelpArticle(null);
        } else if (displayedItems[selectedIndex]) {
          executeAndTrack(displayedItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (activeHelpArticle) {
          setActiveHelpArticle(null);
        } else {
          onClose();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const idx = CATEGORY_TABS.findIndex(t => t.id === selectedCategory);
        const next = CATEGORY_TABS[(idx + 1) % CATEGORY_TABS.length].id;
        setSelectedCategory(next);
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, selectedIndex, displayedItems, activeHelpArticle, selectedCategory, executeAndTrack, onClose]);

  // Auto-scroll highlighted row into view smoothly
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const distinctTeams = useMemo(() => {
    if (!classData) return [];
    return Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean))) as string[];
  }, [classData]);

  if (!isOpen) return null;
  const portalTarget = (typeof document !== 'undefined' && (document.fullscreenElement || document.body)) || document.body;
  const intentFeedback = getIntentFeedback(intent, query, filteredItems.length);
  const totalStudents = classData?.students.length ?? 0;
  const submittedCount = classData?.students.filter(s => s.submitted).length ?? 0;
  const pct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
  const activeHighlightedItem = displayedItems[selectedIndex];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(8, 12, 24, 0.72)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5vh 1rem 2rem',
        animation: 'fadeIn 140ms ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: isExportDialogOpen ? '720px' : activeHelpArticle ? '740px' : '960px',
          width: '100%',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 32px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #0ea5e9, #10b981)', flexShrink: 0 }} />

        {/* Sleek, Minimal Search & Integrated Context Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.15rem',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Search size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (activeHelpArticle) setActiveHelpArticle(null);
              if (isExportDialogOpen) setIsExportDialogOpen(false);
              if (activeDisputeStudentId) setActiveDisputeStudentId(null);
            }}
            placeholder="Type a command or search (#students, @teams, >actions, ?guides)..."
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: '0.92rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: 'none',
              width: '100%',
              minWidth: 0,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('all');
                inputRef.current?.focus();
              }}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}

          {/* Integrated Minimal Class & Mode Badge */}
          {classData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.18rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.68rem',
                  fontWeight: 650,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <LayoutDashboard size={11} style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{classData.name}</span>
                <span style={{ opacity: 0.35 }}>•</span>
                <span style={{ color: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : 'var(--text-secondary)' }}>
                  {submittedCount}/{totalStudents} ({pct}%)
                </span>
                <span
                  style={{
                    padding: '0.05rem 0.32rem',
                    borderRadius: '4px',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    color: 'var(--primary)',
                    marginLeft: '0.15rem'
                  }}
                >
                  {activeMode === 'custom' ? 'Custom' : activeMode === 'full' ? 'Full' : activeMode === 'minimal' ? 'Min' : activeMode === 'none' ? 'Clean' : 'Std'}
                </span>
              </div>
            </div>
          )}

          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '0.12rem 0.38rem',
              borderRadius: '5px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            ESC
          </span>
        </div>

        {/* Live Academic Math Calculation Banner */}
        {mathResult && (
          <div
            style={{
              padding: '0.65rem 1.15rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(16, 185, 129, 0.16)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Academic Calculation
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {effectiveQuery} = <span style={{ color: '#10b981' }}>{mathResult.formatted}{mathResult.isPercentage ? '%' : ''}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(mathResult.formatted);
                  if (onToast) onToast(`Copied "${mathResult.formatted}" to clipboard!`, 'success');
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Copy size={11} /> Copy Result
              </button>
              {onSetTargetScale && !isNaN(mathResult.result) && mathResult.result > 0 && mathResult.result <= 1000 && (
                <button
                  type="button"
                  onClick={() => {
                    onSetTargetScale(mathResult.result);
                    if (onToast) onToast(`Set Target Grade Scale to ${mathResult.result} pts!`, 'success');
                    onClose();
                  }}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Check size={11} /> Set as Grade Scale
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Classroom Spotlight Cold-Caller Banner */}
        {spotlightStudent && (
          <div
            style={{
              padding: '0.65rem 1.15rem',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dices size={16} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.04em' }}>Spotlighted Student</span>
                  <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)' }}>
                    {spotlightStudent.groupName || 'Unassigned'}
                  </span>
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {spotlightStudent.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {spotlightStudent.email || spotlightStudent.id} • {spotlightStudent.submitted ? 'Submitted Review' : 'Pending Review'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (classData && classData.students.length > 0) {
                    const others = classData.students.filter(s => s.id !== spotlightStudent.id);
                    const next = others[Math.floor(Math.random() * others.length)] || spotlightStudent;
                    setSpotlightStudent(next);
                  }
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <RefreshCw size={11} /> Roll Next
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDisputeStudentId(spotlightStudent.id);
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Scale size={11} /> Inspect Dossier
              </button>
              <button
                type="button"
                onClick={() => setSpotlightStudent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                title="Dismiss spotlight"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* NLP intent feedback strip */}
        {intentFeedback && effectiveQuery.trim() && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 1.15rem',
              backgroundColor: 'rgba(99,102,241,0.06)',
              borderBottom: '1px solid rgba(99,102,241,0.1)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}
          >
            <Lightbulb size={12} style={{ flexShrink: 0 }} />
            <span>{intentFeedback}</span>
          </div>
        )}

        {/* Unified Minimal Category Filter Tabs Bar */}
        {!isExportDialogOpen && !activeHelpArticle && (
          <div
            className="cp-no-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.22rem',
              padding: '0.28rem 0.85rem',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              flexShrink: 0,
              scrollbarWidth: 'none',
              scrollBehavior: 'smooth',
            }}
          >
            {CATEGORY_TABS.map(tab => {
              const isPrefixed = prefix === tab.prefix && tab.prefix !== undefined;
              const isSel = isPrefixed || (!prefix && selectedCategory === tab.id);
              const Icon = tab.icon;
              const cnt = categoryCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'all') {
                      setQuery(cleanQuery);
                      setSelectedCategory('all');
                    } else if (tab.prefix) {
                      if (prefix === tab.prefix) {
                        setQuery(cleanQuery);
                        setSelectedCategory('all');
                      } else {
                        setQuery(`${tab.prefix} ${cleanQuery}`.trim());
                        setSelectedCategory(tab.id);
                      }
                    } else {
                      setQuery(cleanQuery);
                      setSelectedCategory(tab.id);
                    }
                    if (activeHelpArticle) setActiveHelpArticle(null);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: '0.18rem 0.44rem',
                    borderRadius: '6px',
                    fontSize: '0.69rem',
                    fontWeight: isSel ? 750 : 550,
                    border: isSel ? '1px solid var(--primary)' : '1px solid transparent',
                    backgroundColor: isSel ? 'var(--primary-light)' : 'transparent',
                    color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.24rem',
                    transition: 'all 0.1s ease',
                    flexShrink: 0,
                  }}
                  title={tab.prefix ? `Filter by ${tab.label} (Type "${tab.prefix}")` : `Filter by ${tab.label}`}
                >
                  <Icon size={12} style={{ flexShrink: 0, opacity: isSel ? 1 : 0.75 }} />
                  <span>{tab.label}</span>
                  {tab.prefix && (
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontWeight: 750,
                        padding: '0.01rem 0.2rem',
                        borderRadius: '3px',
                        backgroundColor: isSel ? 'rgba(99, 102, 241, 0.18)' : 'var(--border-color)',
                        color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {tab.prefix}
                    </span>
                  )}
                  {cnt > 0 && (
                    <span
                      style={{
                        padding: '0.02rem 0.28rem',
                        borderRadius: '9999px',
                        fontSize: '0.6rem',
                        fontWeight: 750,
                        backgroundColor: isSel ? 'var(--primary)' : 'var(--border-color)',
                        color: isSel ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN BODY: GRADE DISPUTE DOSSIER, SMART EXPORT STUDIO, HELP ARTICLE, OR LIVE SPLIT-VIEW */}
        {activeDisputeStudentId ? (() => {
          const s = classData?.students.find(st => st.id === activeDisputeStudentId);
          if (!s || !classData) {
            return (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Student not found.</p>
                <button type="button" onClick={() => setActiveDisputeStudentId(null)} className="btn btn-secondary btn-sm">
                  Back to Search
                </button>
              </div>
            );
          }
          const audit = generateStudentDisputeAudit(s, classData);
          return (
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header navigation & status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveDisputeStudentId(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem', fontSize: '0.74rem' }}
                >
                  <ArrowLeft size={13} /> Back to Search
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: '#4f46e5',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Scale size={11} />
                    Office Hours Dispute Dossier
                  </span>
                  {s.isExcused && (
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <ShieldCheck size={11} />
                      Excused Exemption Active
                    </span>
                  )}
                </div>
              </div>

              {/* Student identity strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {s.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <span>{s.email || s.id}</span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span>Team: <strong>{s.groupName || 'Unassigned'}</strong></span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span>{audit.reviewsReceivedCount} / {audit.teammatesCount} evaluations received</span>
                  </div>
                </div>

                {onToggleExcused && (
                  <button
                    type="button"
                    onClick={() => onToggleExcused(s.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', fontWeight: 700, gap: '0.35rem', color: s.isExcused ? '#b45309' : '#0d9488' }}
                  >
                    <ShieldCheck size={13} />
                    <span>{s.isExcused ? 'Remove Excused Exemption' : 'Mark Excused / Medical Exemption'}</span>
                  </button>
                )}
              </div>

              {/* 4-Stat Grid: Team Base, WebPA, Calibrated Score, Self-Peer Gap */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                <div style={{ padding: '0.7rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>TEAM BASE GRADE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                    {audit.teamBaseGrade.toFixed(1)} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>pts</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Baseline for {s.groupName}</div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>WEBPA MULTIPLIER</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: audit.webpaRatio >= 1.0 ? '#10b981' : '#f59e0b', marginTop: '0.1rem' }}>
                    {audit.webpaRatio.toFixed(2)}x
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{audit.isExcused ? 'Neutralized to 1.00 (Excused)' : '1.00 = Expected Contribution'}</div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>FINAL CALIBRATED GRADE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
                    {audit.adjustedGrade.toFixed(1)} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>pts</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Scaled with {Math.round(audit.fudgeWeight * 100)}% fudge weight</div>
                </div>

                <div style={{ padding: '0.7rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>SELF VS PEER GAP</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: (audit.overallGapDelta ?? 0) > 15 ? '#f59e0b' : '#10b981', marginTop: '0.1rem' }}>
                    {audit.overallGapDelta !== null ? `${audit.overallGapDelta > 0 ? '+' : ''}${audit.overallGapDelta}%` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    Self: {audit.overallSelfPercentage !== null ? `${audit.overallSelfPercentage}%` : 'N/A'} • Peers: {audit.overallPeerPercentage !== null ? `${audit.overallPeerPercentage}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Retaliation & Consensus Status Alert */}
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: audit.retaliationRisk ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${audit.retaliationRisk ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                {audit.retaliationRisk ? (
                  <AlertTriangle size={17} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: audit.retaliationRisk ? '#b91c1c' : '#047857' }}>
                    {audit.retaliationRisk ? 'Potential Score Retaliation Detected' : 'Objective Peer Consensus Confirmed'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.05rem' }}>
                    {audit.retaliationRisk
                      ? audit.retaliationDetails
                      : audit.unanimousPeerConsensus
                      ? 'All teammates evaluated this student with uniform consensus across rubric dimensions (low variance).'
                      : 'Peer scores have moderate distribution among team members with no evidence of reciprocal collusion or retaliation.'}
                  </div>
                </div>
              </div>

              {/* Criteria-by-Criteria Breakdown Table */}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                  Criteria-by-Criteria Evidence Breakdown
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
                        <th style={{ padding: '0.45rem 0.75rem' }}>Rubric Dimension</th>
                        <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>Self Score</th>
                        <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>Peer Average</th>
                        <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>Gap Delta</th>
                        <th style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>Consensus Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.criteriaBreakdown.map((row, idx) => (
                        <tr key={row.fieldId} style={{ borderBottom: idx < audit.criteriaBreakdown.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {row.fieldName}
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
                              Max: {row.maxScore} pts (Weight: {Math.round(row.weight)}%)
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                            {row.selfScore !== null ? `${row.selfScore} / ${row.maxScore}` : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                            {row.peerAverage !== null ? `${row.peerAverage} / ${row.maxScore}` : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                            {row.delta !== null ? (
                              <span style={{ color: row.delta > 1.0 ? '#b45309' : row.delta < -1.0 ? '#0d9488' : '#10b981' }}>
                                {row.delta > 0 ? `+${row.delta}` : row.delta}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                backgroundColor: row.consensusLevel === 'strong' ? 'rgba(16, 185, 129, 0.12)' : row.consensusLevel === 'moderate' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: row.consensusLevel === 'strong' ? '#047857' : row.consensusLevel === 'moderate' ? '#b45309' : '#b91c1c'
                              }}
                            >
                              {row.consensusLevel === 'strong' ? 'Strong Agreement' : row.consensusLevel === 'moderate' ? 'Moderate Spread' : 'Divergent Outlier'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Qualitative Feedback Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Star size={13} className="text-amber" />
                    <span>Peer Recognition Badges ({audit.praiseTags.length})</span>
                  </div>
                  {audit.praiseTags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {audit.praiseTags.map(tag => (
                        <span key={tag} style={{ padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No recognition badges recorded.</div>
                  )}
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={13} className="text-primary" />
                    <span>Constructive Growth Comments ({audit.qualitativeGrowthSuggestions.length})</span>
                  </div>
                  {audit.qualitativeGrowthSuggestions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '100px', overflowY: 'auto' }}>
                      {audit.qualitativeGrowthSuggestions.map((comment, i) => (
                        <div key={i} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', padding: '0.3rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                          "{comment}"
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No written growth comments recorded.</div>
                  )}
                </div>
              </div>

              {/* Ready-to-Send Email & Office Hours Draft Card */}
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Ready-to-Send Dispute Defense Draft (Anonymized)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(audit.suggestedEmailResponse);
                      setCopiedDisputeDraft(true);
                      setTimeout(() => setCopiedDisputeDraft(false), 2200);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.72rem', fontWeight: 700, gap: '0.3rem' }}
                  >
                    {copiedDisputeDraft ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedDisputeDraft ? 'Copied to Clipboard!' : 'Copy Response Draft'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.7rem',
                    lineHeight: 1.45,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  {audit.suggestedEmailResponse}
                </pre>
              </div>
            </div>
          );
        })() : isExportDialogOpen ? (
          /* SMART LMS & GRADEBOOK EXPORT STUDIO */
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem', fontSize: '0.74rem' }}
              >
                <ArrowLeft size={13} /> Back to Search
              </button>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-teal" style={{ fontSize: '0.7rem', fontWeight: 800 }}>Smart Export Studio</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Configure Gradebook &amp; Cohort Export
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Choose your desired file format and whether to export the entire class or filter down to a specific cohort.
              </p>
            </div>

            {/* Step 1: Cohort Scope */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                1. Select Cohort Scope
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => setExportCohort('all')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: exportCohort === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: exportCohort === 'all' ? 'var(--primary-light)' : 'var(--bg-app)',
                    color: exportCohort === 'all' ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: exportCohort === 'all' ? 800 : 600,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Users size={13} />
                  <span>Entire Class ({totalStudents} Students)</span>
                </button>

                {distinctTeams.map(team => {
                  const teamMembers = classData?.students.filter(s => s.groupName === team) || [];
                  const isSelected = exportCohort === team;
                  return (
                    <button
                      key={`export_cohort_${team}`}
                      type="button"
                      onClick={() => setExportCohort(team)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-app)',
                        color: isSelected ? '#047857' : 'var(--text-primary)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Globe size={13} />
                      <span>{team} ({teamMembers.length})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Format Selection */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                2. Select Export Format
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.55rem' }}>
                {[
                  { id: 'csv', name: 'Simple CSV Sheet', desc: 'Plain CSV table of students, multipliers & grades', badge: 'CSV', color: '#10b981' },
                  { id: 'excel', name: 'Excel Gradebook (.xlsx)', desc: 'Multi-tab analytical workbook with calculations', badge: 'Excel', color: '#059669' },
                  { id: 'canvas', name: 'Canvas LMS (CSV)', desc: 'Canvas SIS-compatible gradebook upload file', badge: 'Canvas', color: '#e11d48' },
                  { id: 'moodle', name: 'Moodle LMS (CSV)', desc: 'Moodle grade import schema with email IDs', badge: 'Moodle', color: '#ea580c' },
                  { id: 'blackboard', name: 'Blackboard Learn (CSV)', desc: 'Ultra/Original batch grade upload format', badge: 'Blackboard', color: '#0284c7' },
                  { id: 'brightspace', name: 'Brightspace / D2L (CSV)', desc: 'D2L OrgDefinedId CSV with End-of-Line flag', badge: 'D2L', color: '#9333ea' },
                  { id: 'pulse', name: 'Team Health Pulse (CSV)', desc: 'Student check-in morale ratings & blocker notes', badge: 'Pulse', color: '#0d9488' },
                  { id: 'pdf', name: 'Class Summary (PDF)', desc: 'Institution-ready visual evaluation report', badge: 'PDF', color: '#ef4444' }
                ].map(fmt => {
                  const isSelected = exportFormat === fmt.id;
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id as any)}
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt.name}</span>
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: `${fmt.color}1a`,
                            color: fmt.color
                          }}
                        >
                          {fmt.badge}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>{fmt.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Summary & Execute Button */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.65rem'
              }}
            >
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Target: <strong style={{ color: 'var(--text-primary)' }}>{exportCohort === 'all' ? 'Entire Class (All Teams)' : `Team: ${exportCohort}`}</strong> • Format: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{exportFormat}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => setIsExportDialogOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSmartExportExecute}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.74rem', fontWeight: 800, gap: '0.35rem' }}
                >
                  <Download size={13} />
                  <span>Download File Now</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeHelpArticle ? (
          /* INTERACTIVE HELP ARTICLE VIEW */
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setActiveHelpArticle(null)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem', fontSize: '0.74rem' }}
              >
                <ArrowLeft size={13} /> Back to Search
              </button>
              <span className="badge badge-teal" style={{ fontSize: '0.69rem' }}>{activeHelpArticle.category}</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{activeHelpArticle.title}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {activeHelpArticle.summary}
              </p>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>What It Does</div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{activeHelpArticle.whatItDoes}</p>
            </div>
            {activeHelpArticle.formula && (
              <div style={{ backgroundColor: 'rgba(99,102,241,0.07)', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.15rem' }}>Formula</div>
                <code style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 700 }}>{activeHelpArticle.formula}</code>
              </div>
            )}
            {activeHelpArticle.whatToDo && activeHelpArticle.whatToDo.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>Steps to Take</div>
                <ol style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {activeHelpArticle.whatToDo.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
            {activeHelpArticle.proTip && (
              <div style={{ backgroundColor: 'rgba(245,158,11,0.07)', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', gap: '0.5rem' }}>
                <Sparkles size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.72rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                  <b style={{ color: 'var(--text-primary)' }}>Pro Tip: </b>{activeHelpArticle.proTip}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LIVE SPLIT-VIEW CONTAINER: RESULTS LIST + DOSSIER PREVIEW PANE */
          <div className="cp-split-container">
            {/* Left: Scrollable Results List */}
            <div className="cp-results-pane">
              <div
                ref={listRef}
                onMouseMove={() => { isKeyboardNav.current = false; }}
                style={{
                  padding: '0.35rem 0.45rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                }}
              >
                {displayedItems.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Search size={28} style={{ margin: '0 auto 0.6rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      No matching items found
                    </p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Try filtering with prefixes: <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>@team</kbd>,{' '}
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>#student</kbd>, or{' '}
                      <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>&gt;export</kbd>
                    </p>
                  </div>
                ) : (
                  displayedItems.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {item.sectionLabel && (
                        <div
                          style={{
                            padding: '0.5rem 0.75rem 0.2rem',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          {item.sectionLabel === 'Recent Commands' && <Clock size={11} />}
                          {item.sectionLabel === 'Smart Suggestions' && <Sparkles size={11} style={{ color: '#f59e0b' }} />}
                          {item.sectionLabel === 'Quick Start' && <Zap size={11} style={{ color: '#6366f1' }} />}
                          <span>{item.sectionLabel}</span>
                        </div>
                      )}
                      <ResultRow
                        item={item}
                        isSelected={idx === selectedIndex}
                        query={query}
                        isPinned={(() => {
                          const modId = resolveToModuleId(item.featureKey || item.id, item.title, item.keywords);
                          return modId ? pinnedIds.includes(modId) : false;
                        })()}
                        onSelect={() => {
                          if (!isKeyboardNav.current) setSelectedIndex(idx);
                        }}
                        onExecute={() => executeAndTrack(item)}
                      />
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            {/* Right: Live Dossier Preview Pane */}
            {activeHighlightedItem && (
              <div className="cp-dossier-pane">
                {/* 1. Student Dossier Preview */}
                {(activeHighlightedItem.id.startsWith('student_') || activeHighlightedItem.id.startsWith('del_student_') || activeHighlightedItem.category === 'Students') && (() => {
                  const sId = activeHighlightedItem.id.replace('student_', '').replace('del_student_', '');
                  const s = classData?.students.find(st => st.id === sId);
                  if (!s) return null;
                  const initials = s.name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
                  const reviewsReceived = classData?.reviews.filter(r => r.recipientId === s.id).length ?? 0;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.email || s.id}
                          </div>
                        </div>
                      </div>

                      {/* Status & Team Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {s.isExcused ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(99, 102, 241, 0.12)',
                              color: '#6366f1',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <ShieldCheck size={12} />
                            Excused Absence
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: s.submitted ? '#ecfdf5' : '#fffbeb',
                              color: s.submitted ? '#047857' : '#b45309',
                              border: `1px solid ${s.submitted ? '#10b981' : '#f59e0b'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {s.submitted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {s.submitted ? 'Completed' : 'Pending'}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {s.groupName ? `Team: ${s.groupName}` : 'Unassigned'}
                        </span>
                      </div>

                      {/* Evaluation Metrics Card */}
                      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUBMISSION</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: s.isExcused ? '#6366f1' : s.submitted ? '#10b981' : '#f59e0b' }}>
                            {s.isExcused ? 'Excused (1.00x)' : s.submitted ? 'Turned In' : 'Awaiting'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>REVIEWS RECD</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {reviewsReceived} ratings
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenReportModal(s.id);
                            onClose();
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <FileText size={12} />
                          <span>View Student Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDisputeStudentId(s.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem', color: '#4f46e5', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
                          title="Open full self vs peer gap, retaliation audit, and ready-to-send draft"
                        >
                          <Scale size={12} />
                          <span>Dispute Resolution Dossier</span>
                        </button>

                        {onToggleExcused && (
                          <button
                            type="button"
                            onClick={() => onToggleExcused(s.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.72rem', fontWeight: 600, justifyContent: 'center', gap: '0.3rem', color: s.isExcused ? '#b45309' : '#0d9488' }}
                            title={s.isExcused ? 'Remove excused exemption and restore normal grading' : 'Neutralize WebPA factor to 1.00 and exclude from team penalty divisor'}
                          >
                            <ShieldCheck size={12} />
                            <span>{s.isExcused ? 'Remove Excused Exemption' : 'Mark Excused / Medical Exemption'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDispatcher();
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 600, justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Mail size={12} />
                          <span>Send Reminder Link</span>
                        </button>
                        {onDeleteStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onDeleteStudent(s.id, s.name);
                            }}
                            className="btn btn-secondary btn-sm text-rose"
                            style={{ fontSize: '0.72rem', fontWeight: 600, justifyContent: 'center', gap: '0.3rem' }}
                          >
                            <Trash2 size={12} />
                            <span>Delete Student</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Team Cohort Dossier Preview */}
                {(activeHighlightedItem.id.startsWith('team_') || activeHighlightedItem.category === 'Teams') && (() => {
                  const tName = activeHighlightedItem.id.replace('team_', '');
                  const members = classData?.students.filter(st => st.groupName === tName) || [];
                  const subs = members.filter(st => st.submitted).length;
                  const tPct = members.length > 0 ? Math.round((subs / members.length) * 100) : 0;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Globe size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {tName.toLowerCase().startsWith('team') ? tName : `Team ${tName}`}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            {members.length} enrolled members
                          </div>
                        </div>
                      </div>

                      {/* Submission Progress */}
                      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700 }}>
                          <span>Evaluation Progress</span>
                          <span style={{ color: tPct === 100 ? '#10b981' : 'var(--text-primary)' }}>{subs}/{members.length} ({tPct}%)</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: 'var(--bg-app)', overflow: 'hidden' }}>
                          <div style={{ width: `${tPct}%`, height: '100%', borderRadius: '9999px', backgroundColor: tPct === 100 ? '#10b981' : tPct >= 50 ? '#f59e0b' : 'var(--primary)' }} />
                        </div>
                      </div>

                      {/* Team Member Roster List */}
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                          Members Roster
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '140px', overflowY: 'auto' }}>
                          {members.map(m => (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-surface)',
                                fontSize: '0.72rem',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {m.name}
                              </span>
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: m.submitted ? '#10b981' : '#f59e0b',
                                  flexShrink: 0
                                }}
                                title={m.submitted ? 'Submitted' : 'Pending'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSetFilter) onSetFilter({ group: tName, search: '', duplicatesOnly: false });
                            else if (onSelectTeamFilter) onSelectTeamFilter(tName);
                            onNavigateTab('roster');
                            onClose();
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Filter size={12} />
                          <span>Filter Dashboard to Team</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportCohort(tName);
                            setIsExportDialogOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 600, justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Download size={12} />
                          <span>Export Gradebook for Team</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Academic Guide / Formula Preview */}
                {activeHighlightedItem.helpItem && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span className="badge badge-teal" style={{ alignSelf: 'flex-start', fontSize: '0.64rem' }}>
                      {activeHighlightedItem.helpItem.category}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {activeHighlightedItem.helpItem.title}
                      </div>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {activeHighlightedItem.helpItem.summary}
                      </p>
                    </div>

                    {activeHighlightedItem.helpItem.formula && (
                      <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.07)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>FORMULA</div>
                        <code style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-all' }}>
                          {activeHighlightedItem.helpItem.formula}
                        </code>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveHelpArticle(activeHighlightedItem.helpItem || null)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem', marginTop: '0.3rem' }}
                    >
                      <BookOpen size={12} />
                      <span>Read Full Guide Article (↵)</span>
                    </button>
                  </div>
                )}

                {/* 4. Knowledge Base FAQ Preview */}
                {activeHighlightedItem.id.startsWith('faq_') && (() => {
                  const fId = activeHighlightedItem.id.replace('faq_', '');
                  const faq = FAQ_KNOWLEDGE_BASE.find(f => f.id === fId);
                  if (!faq) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <span className="badge badge-indigo" style={{ alignSelf: 'flex-start', fontSize: '0.64rem' }}>
                        Knowledge Base FAQ
                      </span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {faq.question}
                        </div>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {faq.answer}
                        </p>
                      </div>

                      {faq.formula && (
                        <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', padding: '0.6rem', borderRadius: '7px', border: '1px solid rgba(99, 102, 241, 0.22)' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>CORE FORMULA</div>
                          <code style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-all' }}>
                            {faq.formula}
                          </code>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => executeAndTrack(activeHighlightedItem)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }}
                      >
                        <Zap size={12} />
                        <span>{faq.actionText || 'Jump to Feature (↵)'}</span>
                      </button>
                    </div>
                  );
                })()}

                {/* 5. Live Math Result Preview */}
                {activeHighlightedItem.id === 'act_live_math_calc' && mathResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span className="badge badge-teal" style={{ alignSelf: 'flex-start', fontSize: '0.64rem' }}>
                      Score Calculator Result
                    </span>
                    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Expression</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                        {effectiveQuery} = {mathResult.formatted}{mathResult.isPercentage ? '%' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(mathResult.formatted);
                          if (onToast) onToast(`Copied "${mathResult.formatted}" to clipboard!`, 'success');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem' }}
                      >
                        <Copy size={12} />
                        <span>Copy Calculation Result</span>
                      </button>
                      {onSetTargetScale && !isNaN(mathResult.result) && mathResult.result > 0 && mathResult.result <= 1000 && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetTargetScale(mathResult.result);
                            if (onToast) onToast(`Set Target Grade Scale to ${mathResult.result} pts!`, 'success');
                            onClose();
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.72rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Check size={12} />
                          <span>Apply as Target Scale ({mathResult.result} pts)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Action / Command / Mode Preview - Minimal, Focused & Important Info Only */}
                {!activeHighlightedItem.id.startsWith('student_') &&
                  !activeHighlightedItem.id.startsWith('del_student_') &&
                  activeHighlightedItem.category !== 'Students' &&
                  !activeHighlightedItem.id.startsWith('team_') &&
                  activeHighlightedItem.category !== 'Teams' &&
                  !activeHighlightedItem.id.startsWith('faq_') &&
                  activeHighlightedItem.id !== 'act_live_math_calc' &&
                  !activeHighlightedItem.helpItem && (() => {
                    const info = getActionMeaningfulInfo(activeHighlightedItem, classData, featureToggles, activeMode);
                    const ActionIcon = activeHighlightedItem.icon;
                    const stateSummary = inspectItemState(activeHighlightedItem, classData, featureToggles, pinnedIds);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', boxSizing: 'border-box' }}>
                        {/* Compact Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', minWidth: 0 }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <ActionIcon size={17} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeHighlightedItem.title}>
                              {activeHighlightedItem.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.12rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {activeHighlightedItem.category}
                              </span>
                              {info.section && (
                                <span
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    padding: '0.04rem 0.32rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--primary)'
                                  }}
                                >
                                  {info.section.split(':')[0]}
                                </span>
                              )}
                              {activeHighlightedItem.badge && (
                                <span
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    padding: '0.04rem 0.32rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
                                    color: activeHighlightedItem.badgeColor || 'var(--text-secondary)'
                                  }}
                                >
                                  {activeHighlightedItem.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                          type="button"
                          onClick={() => executeAndTrack(activeHighlightedItem)}
                          className="btn btn-primary btn-sm"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.7rem',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <Zap size={12} />
                          <span>{info.actionLabel}</span>
                        </button>

                        {/* Live State & Quick Toggles Cockpit */}
                        {(stateSummary.hasFeatureToggle || stateSummary.hasEvalControl || stateSummary.resolvedModuleId) && (
                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              padding: '0.5rem 0.65rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.45rem',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                <Activity size={10} style={{ color: 'var(--primary)' }} />
                                <span>Module Telemetry</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {stateSummary.isPinned && (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      fontWeight: 800,
                                      padding: '0.04rem 0.32rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(245, 158, 11, 0.16)',
                                      color: '#f59e0b',
                                      border: '1px solid rgba(245, 158, 11, 0.45)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                  >
                                    <Pin size={8} style={{ transform: 'rotate(45deg)' }} />
                                    In Dock
                                  </span>
                                )}
                                {stateSummary.hasFeatureToggle && (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      fontWeight: 800,
                                      padding: '0.04rem 0.32rem',
                                      borderRadius: '4px',
                                      backgroundColor: stateSummary.isFeatureOn ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-app)',
                                      color: stateSummary.isFeatureOn ? '#10b981' : 'var(--text-muted)',
                                      border: `1px solid ${stateSummary.isFeatureOn ? '#10b981' : 'var(--border-color)'}`
                                    }}
                                  >
                                    {stateSummary.isFeatureOn ? 'Canvas On' : 'Canvas Off'}
                                  </span>
                                )}
                                {stateSummary.hasEvalControl && (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      fontWeight: 800,
                                      padding: '0.04rem 0.32rem',
                                      borderRadius: '4px',
                                      backgroundColor: stateSummary.isEvalControlOn ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                                      color: stateSummary.isEvalControlOn ? '#10b981' : '#f43f5e',
                                      border: `1px solid ${stateSummary.isEvalControlOn ? '#10b981' : '#f43f5e'}`
                                    }}
                                  >
                                    {stateSummary.isEvalControlOn ? 'Unlocked' : 'Locked'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Feature Visibility Switch */}
                            {stateSummary.hasFeatureToggle && stateSummary.featureKey && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Canvas Visibility
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = !stateSummary.isFeatureOn;
                                    onToggleFeature(stateSummary.featureKey!, next);
                                    if (onToast) onToast(`${FL[stateSummary.featureKey!]?.label || 'Feature'} is now ${next ? 'enabled' : 'disabled'}`, next ? 'success' : 'info');
                                  }}
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    backgroundColor: stateSummary.isFeatureOn ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-surface)',
                                    color: stateSummary.isFeatureOn ? '#10b981' : 'var(--text-muted)',
                                    border: `1px solid ${stateSummary.isFeatureOn ? '#10b981' : 'var(--border-color)'}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  {stateSummary.isFeatureOn ? <Check size={10} /> : <Eye size={10} />}
                                  <span>{stateSummary.isFeatureOn ? 'Visible (Hide)' : 'Hidden (Show)'}</span>
                                </button>
                              </div>
                            )}

                            {/* Evaluation Control Switch */}
                            {stateSummary.hasEvalControl && stateSummary.evalControlKey && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Evaluation Access
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUpdateEvaluationControls && stateSummary.evalControlKey) {
                                      const next = !stateSummary.isEvalControlOn;
                                      onUpdateEvaluationControls({ [stateSummary.evalControlKey]: next });
                                      if (onToast) onToast(`Permission ${next ? 'unlocked' : 'locked'}`, next ? 'success' : 'info');
                                    }
                                  }}
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    backgroundColor: stateSummary.isEvalControlOn ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.14)',
                                    color: stateSummary.isEvalControlOn ? '#10b981' : '#f43f5e',
                                    border: `1px solid ${stateSummary.isEvalControlOn ? '#10b981' : '#f43f5e'}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  {stateSummary.isEvalControlOn ? <Unlock size={10} /> : <Lock size={10} />}
                                  <span>{stateSummary.isEvalControlOn ? 'Unlocked (Lock)' : 'Locked (Unlock)'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Important Info Card: Overview */}
                        <div
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            padding: '0.6rem 0.7rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            <Info size={11} style={{ color: 'var(--primary)' }} />
                            <span>Important Info</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {activeHighlightedItem.subtitle || info.purpose}
                          </p>
                        </div>

                        {/* Key Metrics: Top 2 Only */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', width: '100%', boxSizing: 'border-box' }}>
                          {info.telemetry.slice(0, 2).map((t, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                padding: '0.4rem 0.5rem',
                                minWidth: 0,
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: t.color || 'var(--text-primary)',
                                  marginTop: '0.08rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={t.value}
                              >
                                {t.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Workspace Dock Controls & Navigation Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', marginTop: '0.1rem', boxSizing: 'border-box' }}>
                          {stateSummary.resolvedModuleId ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', width: '100%' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = togglePinModule(stateSummary.resolvedModuleId!);
                                  if (onToast) onToast(`${next ? 'Pinned' : 'Unpinned'} "${activeHighlightedItem.title}" ${next ? 'to' : 'from'} Workspace Dock`, next ? 'success' : 'info');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  justifyContent: 'center',
                                  gap: '0.3rem',
                                  padding: '0.38rem 0.5rem',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  backgroundColor: stateSummary.isPinned ? 'rgba(245, 158, 11, 0.12)' : undefined,
                                  color: stateSummary.isPinned ? '#f59e0b' : undefined,
                                  borderColor: stateSummary.isPinned ? 'rgba(245, 158, 11, 0.4)' : undefined
                                }}
                              >
                                {stateSummary.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                                <span>{stateSummary.isPinned ? 'Unpin Dock' : 'Pin to Dock'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  pinModule(stateSummary.resolvedModuleId!);
                                  onClose();
                                  if (onToast) onToast(`Opened in Workspace Dock`, 'success');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  justifyContent: 'center',
                                  gap: '0.3rem',
                                  padding: '0.38rem 0.5rem',
                                  width: '100%',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <ExternalLink size={11} />
                                <span>Open Dock</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('peerlens_toggle_retractable_display'));
                                onClose();
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.68rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem', padding: '0.35rem 0.55rem', width: '100%', boxSizing: 'border-box' }}
                            >
                              <Layers size={11} />
                              <span>Toggle Workspace Dock</span>
                            </button>
                          )}

                          {info.section && info.section.startsWith('Section') && (
                            <button
                              type="button"
                              onClick={() => {
                                const tab = info.section?.includes('Section 1') ? 'roster' : info.section?.includes('Section 2') ? 'grading' : 'results';
                                onNavigateTab(tab);
                                onClose();
                                if (onToast) onToast(`Navigated to ${info.section}`, 'info');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.68rem', fontWeight: 700, justifyContent: 'center', gap: '0.3rem', padding: '0.35rem 0.55rem', width: '100%', boxSizing: 'border-box' }}
                            >
                              <ArrowRight size={11} />
                              <span>Go to {info.section.split(':')[0]}</span>
                            </button>
                          )}
                        </div>

                        {/* Keyboard Cue */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', paddingTop: '0.25rem', borderTop: '1px dashed var(--border-color)', marginTop: '0.05rem' }}>
                          <span><kbd style={{ padding: '0.06rem 0.25rem', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700 }}>↵</kbd> Select</span>
                          <span><kbd style={{ padding: '0.06rem 0.25rem', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700 }}>ESC</kbd> Close</span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>
        )}

        {/* Minimal status footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 1.15rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            fontSize: '0.68rem',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span><kbd style={{ padding: '0.12rem 0.32rem', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '0.12rem 0.32rem', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>↵</kbd> {isExportDialogOpen ? 'Export' : activeHelpArticle ? 'Back' : 'Select'}</span>
            <span><kbd style={{ padding: '0.12rem 0.32rem', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>Tab</kbd> Filter</span>
            <span><kbd style={{ padding: '0.12rem 0.32rem', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>ESC</kbd> Close</span>
          </div>
          <span style={{ fontWeight: 600 }}>
            {query.trim() ? `${filteredItems.length} results` : `${allItems.length} commands`}
          </span>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default CommandPaletteModal;
