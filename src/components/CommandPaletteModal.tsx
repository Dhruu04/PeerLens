import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Users, Sliders, Award, Tv, Send, Download, Settings, Keyboard,
  UserPlus, FileText, Globe, CornerDownLeft, X, Compass, Sparkles, QrCode,
  RefreshCw, Clock, Moon, Sun, HelpCircle, BookOpen, ArrowLeft, Layers, Zap,
  Tag, Palette, Eye, EyeOff, LayoutDashboard, Gauge, Cpu, ToggleLeft,
  Lightbulb, BarChart2, Grid,
  Filter, Mail, Cloud, GraduationCap, Activity
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import { FEATURE_INFO_REGISTRY, type FeatureInfoItem } from '../data/featureDescriptions';
import { useTheme } from '../context/ThemeContext';
import type { FeatureToggles } from '../utils/featurePreferences';
import { DEFAULT_FEATURE_TOGGLES, MINIMAL_FEATURE_TOGGLES, FULL_FEATURE_TOGGLES } from '../utils/featurePreferences';

// ── NLP SYNONYMS & INTENT DETECTION ─────────────────────────────────────────
const SYNONYMS_SHOW   = ['show','enable','turn on','activate','visible','display','unhide','reveal','make visible'];
const SYNONYMS_HIDE   = ['hide','disable','turn off','deactivate','remove','conceal','make invisible'];
const SYNONYMS_HELP   = ['how to','what is','explain','help','what does','how does','why','formula','guide'];
const SYNONYMS_MODE   = ['mode','preset','minimal','standard','full','power','simple','basic','advanced'];
const SYNONYMS_NAV    = ['go to','switch to','navigate','take me to','jump to'];
const SYNONYMS_THEME  = ['theme','dark','light','appearance','color'];
const SYNONYMS_EXPORT = ['export','download','save as','csv','xlsx','excel','lms','pdf','canvas','moodle','blackboard','brightspace','pulse','pulse csv','micro-pulse'];
const SYNONYMS_FILTER = ['filter','pending','unsubmitted','submitted','unassigned','duplicate','team','jump','cohort'];

type IntentType = 'show_feature'|'hide_feature'|'navigate'|'help'|'mode_switch'|'theme'|'export'|'filter'|'general';
interface NLPIntent { type: IntentType; confidence: number; }

function detectIntent(rawQ: string): NLPIntent {
  const q = rawQ.toLowerCase().trim();
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

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
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
    kws.forEach(kw => {
      if (kw === tok) sc += 60;
      else if (kw.startsWith(tok)) sc += 40;
      else if (kw.includes(tok)) sc += 25;
      else if (tok.includes(kw) && kw.length > 3) sc += 15;
    });
  });

  if (intent.type === 'help' && item.category === 'Help') sc += 50;
  if (intent.type === 'hide_feature' && item.category === 'Features' && item.intentTag === 'hide') sc += 80;
  if (intent.type === 'show_feature' && item.category === 'Features' && item.intentTag === 'show') sc += 80;
  if (intent.type === 'mode_switch' && item.category === 'Modes') sc += 60;
  if (intent.type === 'theme' && item.category === 'Appearance') sc += 60;
  if (intent.type === 'navigate' && item.category === 'Navigation') sc += 30;
  if (intent.type === 'export' && (item.badge === 'Export' || item.badge === 'Excel' || item.badge === 'Pulse CSV' || item.badge === 'Canvas' || item.badge === 'Moodle' || item.badge === 'Blackboard' || item.badge === 'Brightspace' || item.badge === 'PDF' || item.badge === 'CSV' || item.keywords?.includes('export') || item.title.toLowerCase().startsWith('export'))) sc += 85;
  if (intent.type === 'filter' && (item.badge === 'Filter' || item.category === 'Teams' || item.keywords?.includes('filter') || item.title.toLowerCase().includes('filter'))) sc += 80;
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
  showEmailButton:          { label: 'Email Dispatch Button',     desc: 'Quick-access email center button',             section: 'Header',     icon: Mail },
  showGuideButton:          { label: 'Guide Center Button',       desc: 'Academic guidance & tutorials button',         section: 'Header',     icon: BookOpen },
  showCloudStatus:          { label: 'Cloud Sync Status',         desc: 'Firebase sync indicator badge',                section: 'Header',     icon: Cloud },
  showCustomizeViewButton:  { label: 'Customize View Button',     desc: 'Open interface module toggle panel',           section: 'Header',     icon: Sliders },
  showQuickActionPill:      { label: 'Floating Quick Action Pill',desc: 'Contractable & expandable dock at bottom of window', section: 'Header', icon: Compass },
  showSectionNavBreadcrumbs:{ label: 'Section Breadcrumbs',       desc: 'Step 1/2/3 breadcrumb navigation bar',         section: 'Nav',        icon: LayoutDashboard },
  showClassIdBadge:         { label: 'Class ID Badge',            desc: 'Technical class ID in the sub-header',         section: 'Nav',        icon: Tag },
  showHubOverviewBanner:    { label: 'Hub Overview Banner',       desc: 'Full-width overview banner on Home Hub',       section: 'Hub',        icon: LayoutDashboard },
  showHubOverviewStats:     { label: 'Hub Overview Stats',        desc: 'Stats row with class metrics on Hub',          section: 'Hub',        icon: BarChart2 },
  showPresetsBanner:        { label: 'Rubric Presets Banner',     desc: 'Research preset rubric quick-select buttons',  section: 'Hub',        icon: Sparkles },
  showEnrollmentCard:       { label: 'Enrollment Hub Card',       desc: 'Section 1 card on the Classroom Hub',         section: 'Hub',        icon: Users },
  showReviewSystemCard:     { label: 'Review System Hub Card',    desc: 'Section 2 card on the Classroom Hub',         section: 'Hub',        icon: Sliders },
  showGradingAnalyticsCard: { label: 'Analytics Hub Card',        desc: 'Section 3 card on the Classroom Hub',         section: 'Hub',        icon: Award },
  showHubCardMetrics:       { label: 'Hub Card Metrics',          desc: 'Stats shown inside each Hub section card',     section: 'Hub',        icon: Activity },
  showHubQuickActions:      { label: 'Hub Quick Actions',         desc: 'Quick action buttons on the Classroom Hub',   section: 'Hub',        icon: Zap },
  showSelfEnrollmentCard:   { label: 'Self-Enrollment Card',      desc: 'QR code & join-link self-enrollment card',    section: 'Section 1',  icon: QrCode },
  showQuickActionsCard:     { label: 'Quick Actions Card',        desc: 'Demo sample, shuffle, quick-add actions',     section: 'Section 1',  icon: Zap },
  showImportWizardCard:     { label: 'Import Wizard Card',        desc: 'CSV/Excel roster import wizard card',          section: 'Section 1',  icon: Download },
  showAutoGroupStudio:      { label: 'AutoGroup Studio',          desc: 'Diversity-balanced team formation algorithm',  section: 'Section 1',  icon: Users },
  showAddStudentButton:     { label: 'Add Student Button',        desc: 'Manual one-by-one student add button',         section: 'Section 1',  icon: UserPlus },
  showExportButtons:        { label: 'Export Buttons (S1)',       desc: 'CSV export buttons in Section 1',              section: 'Section 1',  icon: Download },
  showRosterSearchFilter:   { label: 'Roster Search Filter',      desc: 'Search & filter bar above roster table',       section: 'Section 1',  icon: Filter },
  showBulkActionBar:        { label: 'Bulk Action Bar',           desc: 'Multi-select bulk operations toolbar',         section: 'Section 1',  icon: Grid },
  showDuplicateDetector:    { label: 'Duplicate Detector',        desc: 'Flags duplicate emails or student IDs',        section: 'Section 1',  icon: HelpCircle },
  showRosterTable:          { label: 'Roster Table',              desc: 'Main student list table view',                 section: 'Section 1',  icon: FileText },
  showTeamOverviewCards:    { label: 'Team Overview Cards',       desc: 'Card grid showing each team and its members',  section: 'Section 1',  icon: Globe },
  showRubricHeader:         { label: 'Rubric Header',             desc: 'Header bar at top of the Review System',      section: 'Section 2',  icon: Sliders },
  showRubricPresets:        { label: 'Rubric Presets Bar',        desc: 'Research-based one-click rubric presets',      section: 'Section 2',  icon: Sparkles },
  showTargetScaleCard:      { label: 'Target Scale Card',         desc: 'Grade scale converter (%, GPA, rubric max)',   section: 'Section 2',  icon: Gauge },
  showDeadlineTimer:        { label: 'Deadline Timer',            desc: 'Submission cutoff countdown timer card',       section: 'Section 2',  icon: Clock },
  showWeightBalanceBar:     { label: 'Weight Balance Bar',        desc: 'Visual rubric weight distribution bar',        section: 'Section 2',  icon: BarChart2 },
  showCustomCriterionButton:{ label: 'Add Criterion Button',      desc: 'Button to add custom evaluation criteria',     section: 'Section 2',  icon: Zap },
  showCriterionCards:       { label: 'Criterion Cards',           desc: 'Individual rubric criterion slider cards',     section: 'Section 2',  icon: Sliders },
  showEvaluationSimulator:  { label: 'Evaluation Simulator',      desc: 'Live preview of student evaluation portal',    section: 'Section 2',  icon: Eye },
  showEvaluationFormControls:{ label: 'Form Controls Card',       desc: 'Card in Section 2 for questions & permissions',section: 'Section 2',  icon: Sliders },
  showTeamHealthPulse:      { label: 'Team Health Micro-Pulse',   desc: 'On-demand 30-second pulse surveys & sparklines',section: 'Section 2', icon: Activity },
  showResultsHeaderCard:    { label: 'Results Header Card',       desc: 'Overview stats card in Section 3',             section: 'Section 3',  icon: BarChart2 },
  showExportReportButtons:  { label: 'Export Report Buttons',     desc: 'PDF, Excel, and CSV export action buttons',    section: 'Section 3',  icon: Download },
  showSubmissionReset:      { label: 'Submission Reset Button',   desc: 'Dangerous reset-all-reviews action button',    section: 'Section 3',  icon: RefreshCw },
  showCompetencyRadar:      { label: 'Competency Radar Chart',    desc: 'Spider radar chart for multi-criteria view',   section: 'Section 3',  icon: Activity },
  showJohariMatrix:         { label: 'Johari Matrix',             desc: 'Blind-spot perception gap heatmap grid',       section: 'Section 3',  icon: Grid },
  showQualitativeFeedback:  { label: 'Qualitative Feedback',      desc: 'Free-text peer comment display panel',         section: 'Section 3',  icon: FileText },
  showWebPACalibration:     { label: 'WebPA Calibration',         desc: 'Peer factor fudge-weight slider calibrator',   section: 'Section 3',  icon: Sliders },
  showAnomalyAudit:         { label: 'Anomaly & Collusion Audit', desc: 'Flags suspicious reciprocal grading patterns', section: 'Section 3',  icon: HelpCircle },
  showMilestonesHistory:    { label: 'Milestones History',        desc: 'Sprint archive and historical milestone log',  section: 'Section 3',  icon: Clock },
  showLmsExport:            { label: 'LMS Gradebook Export',      desc: 'Canvas, Blackboard, Moodle, Brightspace sync',section: 'Section 3',  icon: GraduationCap },
  showResultsSummarySheet:  { label: 'Results Summary Sheet',     desc: 'Full gradebook table with all student scores', section: 'Section 3',  icon: FileText },
  showGradebookSearchFilter:{ label: 'Gradebook Search Filter',   desc: 'Search & sort filter bar in the gradebook',   section: 'Section 3',  icon: Filter },
  showDetailedReviewMatrix: { label: 'Detailed Review Matrix',    desc: 'Full peer review score breakdown matrix',      section: 'Section 3',  icon: Grid },
  showTeammateAuditLog:     { label: 'Teammate Audit Log',        desc: 'Log of who rated whom with what scores',      section: 'Section 3',  icon: FileText },
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

type CategoryId = 'all' | 'actions' | 'features' | 'modes' | 'students' | 'teams' | 'help' | 'appearance';

const CATEGORY_TABS: { id: CategoryId; label: string; icon: React.ElementType; cats: string[] }[] = [
  { id: 'all',        label: 'All',        icon: Layers,      cats: [] },
  { id: 'actions',    label: 'Actions',    icon: Zap,         cats: ['Actions', 'Navigation'] },
  { id: 'features',   label: 'Features',   icon: ToggleLeft,  cats: ['Features'] },
  { id: 'modes',      label: 'Modes',      icon: Cpu,         cats: ['Modes'] },
  { id: 'students',   label: 'Students',   icon: Users,       cats: ['Students'] },
  { id: 'teams',      label: 'Teams',      icon: Tag,         cats: ['Teams'] },
  { id: 'help',       label: 'Help',       icon: HelpCircle,  cats: ['Help'] },
  { id: 'appearance', label: 'Theme',      icon: Palette,     cats: ['Appearance'] },
];

function detectActiveMode(ft: FeatureToggles): 'minimal' | 'standard' | 'full' | 'custom' {
  const keys = Object.keys(FULL_FEATURE_TOGGLES) as (keyof FeatureToggles)[];
  if (keys.every(k => ft[k] === FULL_FEATURE_TOGGLES[k])) return 'full';
  if (keys.every(k => ft[k] === MINIMAL_FEATURE_TOGGLES[k])) return 'minimal';
  if (keys.every(k => ft[k] === DEFAULT_FEATURE_TOGGLES[k])) return 'standard';
  return 'custom';
}

function getIntentFeedback(intent: NLPIntent, q: string, count: number): string | null {
  if (!q.trim() || count === 0) return null;
  switch (intent.type) {
    case 'hide_feature': return `Hiding features matching "${q}" — press Enter or click to toggle`;
    case 'show_feature': return `Showing features matching "${q}" — press Enter or click to toggle`;
    case 'mode_switch':  return `Mode presets found — apply Minimal, Standard, or Full`;
    case 'help':         return `Found ${count} guide article${count !== 1 ? 's' : ''} for "${q}"`;
    case 'navigate':     return `Navigation targets for "${q}"`;
    case 'theme':        return `Theme & appearance options`;
    case 'export':       return `Direct export shortcuts for "${q}" — download Excel, Canvas, Moodle, PDF, CSV`;
    case 'filter':       return `Quick filter jumpers matching "${q}" — click or press Enter to set`;
    default:             return null;
  }
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  featureToggles: FeatureToggles;
  onToggleFeature: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyMode: (mode: 'minimal' | 'standard' | 'full') => void;
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
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onOpenEvaluationControls?: () => void;
}

// ── RESULT ROW COMPONENT (MINIMAL & POLISHED) ─────────────────────────────────
interface ResultRowProps {
  item: CPAction;
  isSelected: boolean;
  query: string;
  onSelect: () => void;
  onExecute: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ item, isSelected, query, onSelect, onExecute }) => {
  const IconComp = item.icon;
  const catColor = CAT_COLOR[item.category] ?? '#6366f1';
  const isPositiveBadge = item.badge?.includes('✓') || item.badge?.includes('Visible') || item.badge === 'Submitted';

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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen, onClose, classData, featureToggles, onToggleFeature, onApplyMode,
  onNavigateTab, onOpenProjector, onOpenDispatcher, onOpenSettings, onOpenShortcuts,
  onOpenAddStudent, onOpenReportModal, onExportExcel, onOpenTour, onOpenGuideCenter,
  onSelectTeamFilter, onSetFilter, onApplyRubricPreset, onSetTargetScale,
  onSetFudgeWeight, onExportLMS, onExportResultsCSV, onExportPDFSummary,
  onOpenNewClass, onOpenImportWizard, onOpenAutoGroup,
  onOpenQRCode, onOpenDeadline, onResetSubmissions, onToast,
  onOpenEvaluationControls,
}) => {
  const { setThemeMode, themeMode } = useTheme();
  const [query,            setQuery]            = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [selectedIndex,    setSelectedIndex]    = useState(0);
  const [activeHelpArticle,setActiveHelpArticle]= useState<FeatureInfoItem|null>(null);
  const [recentIds,        setRecentIds]        = useState<string[]>([]);

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
      setRecentIds(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        document.body.style.overflow = prev;
        document.documentElement.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  const executeAndTrack = useCallback((item: CPAction) => {
    pushRecent(item.id);
    setRecentIds(loadRecent());
    item.onExecute();
  }, []);

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

    // ACTIONS
    if (onOpenNewClass) {
      list.push({ id: 'act_new_class', title: 'Create New Classroom Group', category: 'Actions', subtitle: 'Initialize a fresh classroom cohort', icon: BookOpen, badge: 'Cmd C', keywords: ['new class','create','cohort','course'], onExecute: () => { onClose(); onOpenNewClass(); } });
    }
    list.push(
      { id: 'act_add_student',  title: 'Enroll New Student',                category: 'Actions', subtitle: 'Add a student manually with email, team, degree', icon: UserPlus,   badge: 'Cmd N',  keywords: ['add student','enroll','participant','member','register'],       onExecute: () => { onClose(); onOpenAddStudent(); } },
      { id: 'act_dispatcher',   title: 'Email Center & Link Dispatcher',    category: 'Actions', subtitle: 'Dispatch double-blind evaluation links to students', icon: Send,      badge: 'Cmd E',  keywords: ['email','mail','send','links','dispatcher','brevo','invite'],    onExecute: () => { onClose(); onOpenDispatcher(); } },
      { id: 'act_projector',    title: 'Launch Live Classroom Projector',   category: 'Actions', subtitle: 'Full-screen monitor with QR and submission ticker',  icon: Tv,        badge: 'Cmd P',  keywords: ['projector','fullscreen','display','screen','lecture','live'],   onExecute: () => { onClose(); onOpenProjector(); } },
      { id: 'act_settings',     title: 'Workspace Settings & Cloud Sync',   category: 'Actions', subtitle: 'Firebase, email API keys, and workspace profile',    icon: Settings,  badge: 'Cmd S',  keywords: ['settings','cloud','firebase','api','sync','config'],            onExecute: () => { onClose(); onOpenSettings('email'); } },
      { id: 'act_shortcuts',    title: 'Keyboard Shortcuts Reference',      category: 'Actions', subtitle: 'Full cheat sheet of keyboard controls',              icon: Keyboard,  badge: 'Cmd ?',  keywords: ['shortcuts','hotkeys','keyboard','cheat sheet','bindings'],      onExecute: () => { onClose(); onOpenShortcuts(); } },
      { id: 'act_customize',    title: 'Customize View (Module Toggles)',   category: 'Actions', subtitle: 'Toggle modular cards, top bar, and density presets', icon: Sliders,   badge: 'Cmd V',  keywords: ['customize','modules','interface','density','toggles','view'],   onExecute: () => { onClose(); onOpenSettings('modules'); } },
      { id: 'act_toggle_quick_pill', title: featureToggles.showQuickActionPill ? 'Hide Floating Quick Action Pill' : 'Show Floating Quick Action Pill', category: 'Actions', subtitle: 'Contractable & expandable quick dock anchored at window bottom', icon: Compass, badge: 'Dock', keywords: ['quick action pill','pill','dock','bottom pill','floating dock','quick actions'], onExecute: () => { onClose(); if (onToggleFeature) onToggleFeature('showQuickActionPill', !featureToggles.showQuickActionPill); } },
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
        keywords: ['cohorts', 'team cohorts', 'teams overview', 'inspect team', 'group cards', 'team members', 'cohort hub', 'balance teams', 'formation'],
        onExecute: () => {
          onClose();
          onNavigateTab('roster');
          if (!featureToggles.showTeamOverviewCards && onToggleFeature) {
            onToggleFeature('showTeamOverviewCards', true);
          }
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
    if (onOpenTour)         list.push({ id: 'act_tour', title: 'Start App Walkthrough Tour', category: 'Actions', subtitle: 'Interactive spotlight tour showing every feature', icon: Compass, badge: 'Tour', keywords: ['tour','walkthrough','guide','tutorial','demo','onboard'], onExecute: () => { onClose(); onOpenTour(); } });
    list.push(
      {
        id: 'act_guide_manual',
        title: 'Full Institutional Operational Manual',
        category: 'Help',
        subtitle: 'Open complete 17-chapter handbook, WebPA math specifications, and LMS guide in a new tab',
        icon: BookOpen,
        badge: 'Manual ↗',
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
      { id: 'theme_dark',   title: 'Switch to Dark Mode',         category: 'Appearance', subtitle: 'Deep obsidian, eye-friendly for low-light',        icon: Moon,     badge: themeMode === 'dark'   ? '✓ Active' : undefined, keywords: ['dark mode','theme','black','night','obsidian'], onExecute: () => { setThemeMode('dark');   if (onToast) onToast('Switched to Dark Mode', 'info'); onClose(); } },
      { id: 'theme_light',  title: 'Switch to Light Mode',        category: 'Appearance', subtitle: 'Crisp, high-contrast academic surfaces',           icon: Sun,      badge: themeMode === 'light'  ? '✓ Active' : undefined, keywords: ['light mode','theme','white','day','bright'],    onExecute: () => { setThemeMode('light');  if (onToast) onToast('Switched to Light Mode', 'info'); onClose(); } },
      { id: 'theme_system', title: 'Sync Theme with System Auto', category: 'Appearance', subtitle: 'Follow your OS theme preference automatically',    icon: Sparkles, badge: themeMode === 'system' ? '✓ Active' : undefined, keywords: ['system theme','auto theme','os','automatic'],   onExecute: () => { setThemeMode('system'); if (onToast) onToast('Theme set to System Auto', 'info'); onClose(); } },
    );

    // MODES
    list.push(
      { id: 'mode_minimal',  title: 'Apply Minimal Mode',           category: 'Modes', subtitle: 'Clean, distraction-free — hides advanced tools',  icon: LayoutDashboard, badge: activeMode === 'minimal'  ? '✓ Active' : 'Minimal',  badgeColor: activeMode === 'minimal'  ? '#10b981' : undefined, keywords: ['minimal','simple','basic','clean','lite','beginner','hide extras'],   onExecute: () => { onApplyMode('minimal');  if (onToast) onToast('Minimal Mode activated', 'success'); onClose(); } },
      { id: 'mode_standard', title: 'Apply Standard Mode',          category: 'Modes', subtitle: 'Default balanced — recommended for instructors',   icon: Gauge,           badge: activeMode === 'standard' ? '✓ Active' : 'Standard', badgeColor: activeMode === 'standard' ? '#10b981' : undefined, keywords: ['standard','default','normal','balanced','moderate','recommended'],     onExecute: () => { onApplyMode('standard'); if (onToast) onToast('Standard Mode activated', 'success'); onClose(); } },
      { id: 'mode_full',     title: 'Apply Full / Power User Mode', category: 'Modes', subtitle: 'All features on — radar, LMS export, audit & more', icon: Cpu,             badge: activeMode === 'full'     ? '✓ Active' : 'Full',     badgeColor: activeMode === 'full'     ? '#10b981' : undefined, keywords: ['full','power user','advanced','all features','everything','expert','pro'],onExecute: () => { onApplyMode('full');     if (onToast) onToast('Full Mode activated — everything visible', 'success'); onClose(); } },
    );

    // FEATURE TOGGLES
    (Object.keys(FL) as (keyof FeatureToggles)[]).forEach(key => {
      const m = FL[key];
      const isOn = featureToggles[key];
      list.push({
        id: `feat_show_${key}`,
        title: `Show ${m.label}`,
        category: 'Features',
        subtitle: `${m.desc} · ${m.section} · Currently ${isOn ? 'visible ✓' : 'hidden'}`,
        icon: isOn ? Eye : EyeOff,
        badge: isOn ? 'Visible' : 'Hidden',
        badgeColor: isOn ? '#10b981' : '#94a3b8',
        keywords: ['show','enable','turn on','activate','visible',m.label.toLowerCase(),key.toLowerCase(),m.section.toLowerCase()],
        intentTag: 'show',
        featureKey: key,
        onExecute: () => {
          onToggleFeature(key, true);
          if (onToast) onToast(`${m.label} is now visible`, 'success');
        },
      });
      list.push({
        id: `feat_hide_${key}`,
        title: `Hide ${m.label}`,
        category: 'Features',
        subtitle: `${m.desc} · ${m.section} · Currently ${isOn ? 'visible' : 'hidden ✓'}`,
        icon: EyeOff,
        badge: isOn ? 'Visible' : 'Hidden',
        badgeColor: isOn ? '#10b981' : '#94a3b8',
        keywords: ['hide','disable','turn off','deactivate','hidden',m.label.toLowerCase(),key.toLowerCase(),m.section.toLowerCase()],
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
          subtitle: `${s.groupName || 'Unassigned'} · ${s.email || s.id}${s.degree ? ` · ${s.degree}` : ''}`,
          icon: FileText,
          badge: s.submitted ? 'Submitted' : 'Pending',
          badgeColor: s.submitted ? '#10b981' : '#f59e0b',
          keywords: [
            s.name.toLowerCase(),
            s.id.toLowerCase(),
            s.email ? s.email.toLowerCase() : '',
            s.groupName ? s.groupName.toLowerCase() : '',
            s.submitted ? 'submitted' : 'pending',
            s.submitted ? 'completed' : 'unsubmitted',
            s.nationality ? s.nationality.toLowerCase() : '',
          ],
          onExecute: () => {
            onOpenReportModal(s.id);
            onClose();
          },
        });
      });
    }

    return list;
  }, [
    classData, featureToggles, themeMode, activeMode, onNavigateTab, onOpenProjector,
    onOpenDispatcher, onOpenSettings, onOpenShortcuts, onOpenAddStudent, onOpenReportModal,
    onExportExcel, onOpenTour, onOpenGuideCenter, onSelectTeamFilter, onOpenNewClass,
    onOpenImportWizard, onOpenAutoGroup, onOpenQRCode, onOpenDeadline, onResetSubmissions,
    onToast, onClose, onToggleFeature, onApplyMode, setThemeMode,
    onSetFilter, onApplyRubricPreset, onSetTargetScale, onSetFudgeWeight, onExportLMS,
    onExportResultsCSV, onExportPDFSummary,
  ]);

  // ── NLP FILTER & SCORE ──────────────────────────────────────────────────────
  const intent      = useMemo(() => detectIntent(query), [query]);
  const queryTokens = useMemo(() => tokenize(query), [query]);

  const filteredItems = useMemo(() => {
    let result = allItems;
    const tab = CATEGORY_TABS.find(t => t.id === selectedCategory);
    if (tab && tab.cats.length > 0) {
      result = result.filter(i => tab.cats.includes(i.category));
    }
    if (!query.trim()) return result;
    const rawQ = query.toLowerCase().trim();
    return result
      .map(item => ({ item, sc: scoreItem(item, queryTokens, rawQ, intent) }))
      .filter(x => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map(x => x.item);
  }, [allItems, query, selectedCategory, queryTokens, intent]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: 0, actions: 0, features: 0, modes: 0, students: 0, teams: 0, help: 0, appearance: 0,
    };
    const rawQ = query.toLowerCase().trim();
    const base = !rawQ ? allItems : allItems.filter(i => scoreItem(i, queryTokens, rawQ, intent) > 0);
    base.forEach(i => {
      const t = CATEGORY_TABS.find(x => x.cats.includes(i.category));
      if (t) counts[t.id] = (counts[t.id] || 0) + 1;
      counts.all = (counts.all || 0) + 1;
    });
    return counts;
  }, [allItems, query, queryTokens, intent]);

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
        title: 'Enable Competency Radar Chart',
        category: 'Features',
        subtitle: 'Turn on visual spider chart for multi-criterion skill profiling',
        icon: Eye,
        badge: 'Recommended',
        badgeColor: '#10b981',
        intentTag: 'show',
        featureKey: 'showCompetencyRadar',
        onExecute: () => { onToggleFeature('showCompetencyRadar', true); if (onToast) onToast('Competency Radar enabled', 'success'); },
      });
    }

    if (!featureToggles.showLmsExport) {
      list.push({
        id: 'rec_lms',
        title: 'Enable LMS Gradebook Export',
        category: 'Features',
        subtitle: 'Sync scores formatted for Canvas, Blackboard, Moodle, or Brightspace',
        icon: GraduationCap,
        badge: 'Recommended',
        badgeColor: '#10b981',
        intentTag: 'show',
        featureKey: 'showLmsExport',
        onExecute: () => { onToggleFeature('showLmsExport', true); if (onToast) onToast('LMS Export enabled', 'success'); },
      });
    }

    if (activeMode !== 'minimal') {
      list.push({
        id: 'rec_mode_minimal',
        title: 'Switch to Minimal Mode',
        category: 'Modes',
        subtitle: 'Distraction-free interface with only essential tools',
        icon: LayoutDashboard,
        badge: 'Mode',
        onExecute: () => { onApplyMode('minimal'); if (onToast) onToast('Switched to Minimal Mode', 'info'); onClose(); },
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

  if (!isOpen) return null;
  const portalTarget = (typeof document !== 'undefined' && (document.fullscreenElement || document.body)) || document.body;
  const intentFeedback = getIntentFeedback(intent, query, filteredItems.length);
  const totalStudents = classData?.students.length ?? 0;
  const submittedCount = classData?.students.filter(s => s.submitted).length ?? 0;
  const pct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

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
          maxWidth: '680px',
          width: '100%',
          maxHeight: '84vh',
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

        {/* Minimalist context strip */}
        {classData && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 1.15rem',
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '0.69rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                <LayoutDashboard size={11} style={{ color: 'var(--primary)' }} />
                {classData.name}
              </span>
              <span>{totalStudents} student{totalStudents !== 1 ? 's' : ''}</span>
              <span style={{ color: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : 'var(--text-secondary)' }}>
                {submittedCount}/{totalStudents} submitted ({pct}%)
              </span>
            </div>

            <span
              style={{
                padding: '0.1rem 0.45rem',
                borderRadius: '6px',
                fontSize: '0.62rem',
                fontWeight: 700,
                backgroundColor:
                  activeMode === 'full'
                    ? 'rgba(99,102,241,0.12)'
                    : activeMode === 'minimal'
                    ? 'rgba(20,184,166,0.12)'
                    : 'rgba(245,158,11,0.12)',
                color:
                  activeMode === 'full'
                    ? '#6366f1'
                    : activeMode === 'minimal'
                    ? '#14b8a6'
                    : '#f59e0b',
              }}
            >
              {activeMode === 'custom' ? 'Custom' : activeMode === 'full' ? 'Full Mode' : activeMode === 'minimal' ? 'Minimal' : 'Standard'}
            </span>
          </div>
        )}

        {/* Search input bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1.15rem', backgroundColor: 'var(--bg-surface)' }}>
          <Search size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (activeHelpArticle) setActiveHelpArticle(null);
            }}
            placeholder="Search commands, micro-pulse, cohorts, rubrics, students..."
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
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '0.12rem 0.35rem',
              borderRadius: '4px',
              backgroundColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            ESC
          </span>
        </div>

        {/* NLP intent feedback strip */}
        {intentFeedback && query.trim() && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 1.15rem',
              backgroundColor: 'rgba(99,102,241,0.06)',
              borderTop: '1px solid rgba(99,102,241,0.1)',
              borderBottom: '1px solid rgba(99,102,241,0.1)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}
          >
            <Lightbulb size={11} style={{ flexShrink: 0 }} />
            <span>{intentFeedback}</span>
          </div>
        )}

        {/* Category filter pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.45rem 1.15rem',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            flexShrink: 0,
          }}
        >
          {CATEGORY_TABS.map(tab => {
            const isSel = selectedCategory === tab.id;
            const Icon = tab.icon;
            const cnt = categoryCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  if (activeHelpArticle) setActiveHelpArticle(null);
                }}
                style={{
                  padding: '0.18rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.69rem',
                  fontWeight: isSel ? 700 : 500,
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSel ? 'var(--primary-light)' : 'var(--bg-surface)',
                  color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.28rem',
                  transition: 'all 80ms ease',
                  flexShrink: 0,
                }}
              >
                <Icon size={11} />
                <span>{tab.label}</span>
                {cnt > 0 && (
                  <span
                    style={{
                      padding: '0.02rem 0.25rem',
                      borderRadius: '6px',
                      fontSize: '0.58rem',
                      fontWeight: 700,
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

        {/* Main body: Interactive help or unified results list */}
        {activeHelpArticle ? (
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
                  No matching commands found
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Try searching <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>hide radar</kbd>,{' '}
                  <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>minimal mode</kbd>, or{' '}
                  <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--border-color)', fontSize: '0.7rem' }}>pending</kbd>
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
                    onSelect={() => {
                      if (!isKeyboardNav.current) setSelectedIndex(idx);
                    }}
                    onExecute={() => executeAndTrack(item)}
                  />
                </React.Fragment>
              ))
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
            <span><kbd style={{ padding: '0.12rem 0.32rem', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>↵</kbd> {activeHelpArticle ? 'Back' : 'Select'}</span>
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
