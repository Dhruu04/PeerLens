import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  Users,
  Sliders,
  SlidersHorizontal,
  Award,
  ChevronUp,
  ChevronDown,
  Compass,
  Maximize2,
  Mail,
  Plus,
  Settings,
  Sun,
  Moon,
  User,
  Trash2,
  Copy,
  Keyboard,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Wrench,
  Download,
  QrCode,
  CheckSquare,
  FileSpreadsheet,
  ArrowUp,
  BookOpen,
  Check,
  Upload,
  FileText,
  Smartphone,
  Archive,
  BarChart2,
  Link,
  Database,
  RotateCcw,
  Share2,
  Activity,
  Star,
  X,
  ChevronsDown,
  ChevronsUp,
  FolderPlus,
  Edit3
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import type { FeatureToggles } from '../utils/featurePreferences';
import {
  getShortcutsEnabled,
  setShortcutsEnabled as saveShortcutsEnabled,
  subscribeShortcutsEnabled,
  getCustomProfiles,
  saveCustomProfile,
  deleteCustomProfile,
  subscribeCustomProfiles,
  type CustomViewProfile
} from '../utils/customViewProfiles';

export interface QuickActionPillProps {
  activeTab: string;
  onNavigateTab: (tab: 'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud') => void;
  activeClass: ClassData;
  classes: ClassData[];
  onSelectClass: (classId: string) => void;
  onDeleteClass?: (classId: string) => void;
  onNewClass: () => void;
  onOpenSearch: () => void;
  onOpenGuideCenter: (tab?: 'system' | 'tours' | 'features') => void;
  onOpenProjector: () => void;
  onOpenEmailDispatcher: () => void;
  onOpenSettings: (tab?: 'cloud' | 'email' | 'shortcuts' | 'appearance' | 'modules') => void;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
  onOpenTour: () => void;
  isCloudSynced: boolean;
  activeAdminProfile: string;
  themeMode?: string;
  onToggleTheme: () => void;
  featureToggles: FeatureToggles;
  onToggleFeature: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyPreset: (preset: 'minimal' | 'standard' | 'full') => void;
  showChecklist: boolean;
  onToggleChecklist: (show: boolean) => void;
  onAddStudent: () => void;
  onOpenAutoGroup: () => void;
  onOpenQRCode: () => void;
  onPopulate100Demo: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onAddCriterion: () => void;
  onAutoBalanceWeights: () => void;
  onApplyIPAF: () => void;
  onLaunchSimulator: () => void;
  onOpenEvaluationControls?: () => void;
  onHidePill: () => void;
  onOpenWizard?: () => void;
  onPopulateAuditData?: () => void;
  onOpenStudentReport?: () => void;
  onOpenArchive?: () => void;
  onOpenTeamBaseGrades?: () => void;
  onOpenLmsGuide?: () => void;
  onCopyJoinLink?: () => void;
  onResetReviews?: () => void;
  onBackupJSON?: () => void;
  onOpenEditMode?: () => void;
  shortcutsEnabled?: boolean;
  onToggleShortcutsEnabled?: (enabled: boolean) => void;
}

export const QuickActionPill: React.FC<QuickActionPillProps> = ({
  activeTab,
  onNavigateTab,
  activeClass,
  classes,
  onSelectClass,
  onDeleteClass,
  onNewClass,
  onOpenSearch,
  onOpenGuideCenter,
  onOpenProjector,
  onOpenEmailDispatcher,
  onOpenSettings,
  onOpenProfile,
  onOpenShortcuts,
  onOpenTour,
  isCloudSynced,
  activeAdminProfile,
  themeMode,
  onToggleTheme,
  featureToggles,
  onToggleFeature,
  onApplyPreset,
  showChecklist,
  onToggleChecklist,
  onAddStudent,
  onOpenAutoGroup,
  onOpenQRCode,
  onPopulate100Demo,
  onExportCSV,
  onExportExcel,
  onAddCriterion,
  onAutoBalanceWeights,
  onApplyIPAF,
  onLaunchSimulator,
  onOpenEvaluationControls,
  onHidePill,
  onOpenWizard,
  onPopulateAuditData,
  onOpenStudentReport,
  onOpenArchive,
  onOpenTeamBaseGrades,
  onOpenLmsGuide,
  onCopyJoinLink,
  onResetReviews,
  onBackupJSON,
  onOpenEditMode,
  shortcutsEnabled: propShortcutsEnabled,
  onToggleShortcutsEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dockTab, setDockTab] = useState<'topbar' | 'modules' | 'tools'>('topbar');
  const [moduleFilter, setModuleFilter] = useState('');
  const [moduleFilterTab, setModuleFilterTab] = useState<'all' | 'pinned' | 'visible' | 'hidden'>('all');
  const [copiedClassId, setCopiedClassId] = useState(false);
  const [copiedJoinLinkState, setCopiedJoinLinkState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinned / Favorite modules persisted in localStorage
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('peer_pinned_modules');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      'showRosterTable',
      'showTeamOverviewCards',
      'showCriterionCards',
      'showResultsSummarySheet',
      'showLmsExport',
      'showTeamHealthPulse'
    ];
  });

  const togglePin = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedKeys((prev) => {
      const exists = prev.includes(key);
      const updated = exists ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem('peer_pinned_modules', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Optional Ambient Live Status Ticker (Default: true, user can toggle off for simple pill)
  const [showTelemetry, setShowTelemetry] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('peer_pill_telemetry');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const toggleTelemetry = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowTelemetry((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('peer_pill_telemetry', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  // Custom View Profiles saved by instructor & shortcuts enabled state
  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(() => {
    return propShortcutsEnabled !== undefined ? propShortcutsEnabled : getShortcutsEnabled();
  });
  const [customProfiles, setCustomProfiles] = useState<CustomViewProfile[]>(getCustomProfiles);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');

  useEffect(() => {
    if (propShortcutsEnabled !== undefined) {
      setShortcutsEnabled(propShortcutsEnabled);
    }
  }, [propShortcutsEnabled]);

  useEffect(() => {
    const unsubShortcuts = subscribeShortcutsEnabled((enabled) => setShortcutsEnabled(enabled));
    const unsubProfiles = subscribeCustomProfiles((profs) => setCustomProfiles(profs));
    return () => {
      unsubShortcuts();
      unsubProfiles();
    };
  }, []);

  const saveCurrentProfile = () => {
    const trimmed = profileNameInput.trim();
    if (!trimmed) return;
    saveCustomProfile(trimmed, featureToggles, shortcutsEnabled);
    setProfileNameInput('');
    setIsAddingProfile(false);
  };

  const deleteCustomProfileHandler = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomProfile(id);
  };

  const applyCustomProfile = (profile: CustomViewProfile) => {
    Object.entries(profile.toggles).forEach(([k, v]) => {
      onToggleFeature(k as keyof FeatureToggles, v);
    });
    if (profile.shortcutsEnabled !== undefined) {
      setShortcutsEnabled(profile.shortcutsEnabled);
      saveShortcutsEnabled(profile.shortcutsEnabled);
      if (onToggleShortcutsEnabled) onToggleShortcutsEnabled(profile.shortcutsEnabled);
    }
  };

  // Master Section Fold / Expand Across All Foldable Cards
  const handleMasterExpandAll = () => {
    window.dispatchEvent(new CustomEvent('peerlens_expand_all'));
  };

  const handleMasterCollapseAll = () => {
    window.dispatchEvent(new CustomEvent('peerlens_collapse_all'));
  };

  // Telemetry metrics for optional ambient live status ticker
  const totalStudents = activeClass?.students.length ?? 0;
  const submittedStudents = activeClass?.students.filter(s => s.submitted).length ?? 0;
  const completionPct = totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0;
  const activePulseCount = (activeClass?.pulseRounds || []).filter(r => r.status === 'active').length;

  // Close dock on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Open modules tab from external command / search
  useEffect(() => {
    const handleOpenModules = () => {
      setIsExpanded(true);
      setDockTab('modules');
      setModuleFilterTab('pinned');
    };
    window.addEventListener('peerlens_open_quick_pill_modules', handleOpenModules);
    return () => window.removeEventListener('peerlens_open_quick_pill_modules', handleOpenModules);
  }, []);

  const handleCopyClassId = () => {
    if (activeClass) {
      navigator.clipboard.writeText(activeClass.id);
      setCopiedClassId(true);
      setTimeout(() => setCopiedClassId(false), 1800);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comprehensive Structured module sections covering all 52 feature toggles
  const MODULE_SECTIONS: {
    category: string;
    icon: React.ElementType;
    items: { key: keyof FeatureToggles; label: string; desc: string }[];
  }[] = useMemo(() => [
    {
      category: 'Top Bar & Global Header',
      icon: LayoutGrid,
      items: [
        { key: 'showClassPicker', label: 'Classroom Selector Dropdown', desc: 'Dropdown in top header to switch courses' },
        { key: 'showDeleteClassButton', label: 'Delete Classroom Action', desc: 'Trash icon next to classroom title' },
        { key: 'showNewClassButton', label: 'New Classroom Button', desc: '+ New Class button in top bar' },
        { key: 'showCommandSearch', label: 'Quick Search / Command Bar', desc: 'Top bar search pill (Ctrl+K or /)' },
        { key: 'showGuideButton', label: 'Academic Guide Button', desc: 'Guidance center & academic documentation' },
        { key: 'showProjectorButton', label: 'Classroom Projector Button', desc: 'Fullscreen lecture projector monitor' },
        { key: 'showEmailButton', label: 'Classroom Email Center Button', desc: 'Link dispatcher modal trigger' },
        { key: 'showSettingsButton', label: 'Workspace Settings Button', desc: 'System settings & preference controls' },
        { key: 'showCustomizeViewButton', label: 'Customize View (Sliders) Button', desc: 'Sliders button in top bar' },
        { key: 'showThemeSwitcher', label: 'Theme Mode Switcher', desc: 'Light / dark mode toggle in top bar' },
        { key: 'showProfilePill', label: 'Admin Profile & Account Pill', desc: 'Workspace account center trigger' },
        { key: 'showCloudStatus', label: 'Cloud Sync Status Dot', desc: 'Real-time database connection badge' },
        { key: 'showQuickActionPill', label: 'Floating Quick Action Pill', desc: 'Contractable & expandable dock at bottom of window' }
      ]
    },
    {
      category: 'Home Hub Screen',
      icon: Compass,
      items: [
        { key: 'showPresetsBanner', label: 'Density Presets Banner', desc: 'Presets header on Home Hub' },
        { key: 'showHubOverviewBanner', label: 'Hub Overview Banner', desc: 'Header overview strip on Home Hub' },
        { key: 'showHubOverviewStats', label: 'Live Metrics Strip', desc: 'Enrollment & completion stats' },
        { key: 'showSectionNavBreadcrumbs', label: 'Breadcrumb Trail', desc: 'Course / Step navigation breadcrumbs' },
        { key: 'showClassIdBadge', label: 'Classroom ID Badge', desc: 'Course ID chip in sub-bar' },
        { key: 'showEnrollmentCard', label: 'Section 1 Card (Enrollment)', desc: 'Large Hub card for enrollment & teams' },
        { key: 'showReviewSystemCard', label: 'Section 2 Card (Rubric)', desc: 'Large Hub card for peer review rubric' },
        { key: 'showGradingAnalyticsCard', label: 'Section 3 Card (Analytics)', desc: 'Large Hub card for grading calculations' },
        { key: 'showHubCardMetrics', label: 'Card Progress Indicators', desc: 'Readiness completion tracks on cards' },
        { key: 'showHubQuickActions', label: 'Card Quick Launch Buttons', desc: '1-click shortcuts directly on cards' }
      ]
    },
    {
      category: 'Section 1: Enrollment & Teams',
      icon: Users,
      items: [
        { key: 'showSelfEnrollmentCard', label: 'Self-Enrollment QR & Link Card', desc: 'QR code and self-join link' },
        { key: 'showQuickActionsCard', label: 'Quick Actions & Sample Card', desc: '100 demo sample students and fast add' },
        { key: 'showImportWizardCard', label: 'Smart Import Wizard Card', desc: 'CSV and Excel upload dropzone' },
        { key: 'showAutoGroupStudio', label: 'AutoGroup Algorithmic Studio', desc: 'Diversity and skill team formation' },
        { key: 'showBulkActionBar', label: 'Bulk Action Toolbar', desc: 'Batch selection floating bar' },
        { key: 'showDuplicateDetector', label: 'Duplicate Detection Banner', desc: 'Alert for duplicate names or emails' },
        { key: 'showExportButtons', label: 'Roster Export Action Buttons', desc: 'CSV & Excel export shortcuts' },
        { key: 'showRosterSearchFilter', label: 'Search & Team Filter Bar', desc: 'Student search and group filter' },
        { key: 'showTeamOverviewCards', label: 'Team Overview & Formation Cards', desc: 'Collapsible deep-dive cards summarizing each team cohort' },
        { key: 'showRosterTable', label: 'Enrolled Students Roster Table', desc: 'Main tabular student roster' },
        { key: 'showAddStudentButton', label: 'Add Student Action Button', desc: 'Manual single-student enrollment button' }
      ]
    },
    {
      category: 'Section 2: Review System',
      icon: Sliders,
      items: [
        { key: 'showRubricHeader', label: 'Rubric Header & Counter', desc: 'Title, description, and criteria counter' },
        { key: 'showRubricPresets', label: 'Standardized IPAF Ribbon', desc: 'Research-backed peer assessment presets' },
        { key: 'showTargetScaleCard', label: 'Target Scaling Converter Card', desc: 'Scale to /20, /100%, GPA 4.0, or Raw' },
        { key: 'showDeadlineTimer', label: 'Milestone Deadline Timer Card', desc: 'Closing date and countdown clock' },
        { key: 'showWeightBalanceBar', label: 'Rubric 100% Weight Balance Bar', desc: 'Criteria weight validation progress' },
        { key: 'showCustomCriterionButton', label: 'Add Custom Criterion Button', desc: '+ Add Criterion action button' },
        { key: 'showCriterionCards', label: 'Rubric Criteria Cards List', desc: 'Configured criteria cards' },
        { key: 'showEvaluationSimulator', label: 'Student Portal Simulator Card', desc: 'Preview of student evaluation UI' },
        { key: 'showEvaluationFormControls', label: 'Evaluation Form Controls Card', desc: 'Card for question prompts, tags & permissions' },
        { key: 'showTeamHealthPulse', label: 'Team Health "Micro-Pulse" Check-ins', desc: 'On-demand 30-second pulse surveys with sparklines' }
      ]
    },
    {
      category: 'Section 3: Grading & Performance Analytics',
      icon: Award,
      items: [
        { key: 'showResultsHeaderCard', label: 'Results Overview & Metric Banner', desc: 'Top summary metrics, completion rates, and WebPA spread' },
        { key: 'showResultsSummarySheet', label: 'Results Summary Sheet (Gradebook)', desc: 'Tabular gradebook with WebPA factors, raw and calibrated scores' },
        { key: 'showWebPACalibration', label: 'WebPA Calibration Slider', desc: 'Non-linear penalty weight tuning and scaling control' },
        { key: 'showExportReportButtons', label: 'Export Report Action Buttons', desc: 'PDF dossier, CSV & Excel reports' },
        { key: 'showLmsExport', label: 'LMS Gradebook Integration & Smart Export Formats', desc: 'Collapsible 1-click export presets for Canvas, Blackboard, Moodle, Brightspace' },
        { key: 'showDetailedReviewMatrix', label: 'Detailed Cross-Evaluation Review Matrix', desc: 'Interactive peer-to-peer score breakdown table' },
        { key: 'showTeammateAuditLog', label: 'Teammate Evaluation Audit Log', desc: 'Submission timestamps, member reviews, and completion audits' },
        { key: 'showCompetencyRadar', label: 'Competency Radar Chart', desc: 'Multi-axis radar distribution chart' },
        { key: 'showJohariMatrix', label: 'Johari Window Matrix', desc: 'Blind spots, hidden strengths, and perception analysis' },
        { key: 'showQualitativeFeedback', label: 'Qualitative Written Comments', desc: 'Formative text feedback browser with search & filter' },
        { key: 'showAnomalyAudit', label: 'Anomaly & Outlier Audit', desc: 'Collusion, inflation, and suspicious pattern detection' },
        { key: 'showMilestonesHistory', label: 'Milestones & Assessment History', desc: 'Sprint archive and historical milestone comparisons' },
        { key: 'showSubmissionReset', label: 'Submission Reset & Unlock Controls', desc: 'Reset all reviews or unlock submitted evaluations' },
        { key: 'showGradebookSearchFilter', label: 'Gradebook Search & Filter Bar', desc: 'Filter final marks by team or student name' }
      ]
    }
  ], []);

  // Intelligent synonym aliases for fast semantic search
  const MODULE_ALIASES: Record<string, string[]> = useMemo(() => ({
    showLmsExport: ['canvas', 'moodle', 'blackboard', 'brightspace', 'd2l', 'lms', 'sis', 'gradebook', 'export', 'sync', 'csv', 'tsv'],
    showTeamHealthPulse: ['pulse', 'health', 'morale', 'check-in', 'survey', 'sprint', 'sparkline', 'question', 'feedback', 'blocker'],
    showAutoGroupStudio: ['group', 'cohort', 'diversity', 'balance', 'formation', 'algorithm', 'team', 'shuffle'],
    showTeamOverviewCards: ['team', 'cohort', 'deep dive', 'groups', 'members', 'cards'],
    showRosterTable: ['roster', 'student', 'table', 'enrolled', 'list', 'class'],
    showSelfEnrollmentCard: ['qr', 'join', 'link', 'enroll', 'self', 'code', 'mobile'],
    showQuickActionsCard: ['demo', 'sample', '100', 'populate', 'random', 'fast add'],
    showImportWizardCard: ['import', 'csv', 'excel', 'upload', 'file', 'roster'],
    showBulkActionBar: ['bulk', 'batch', 'select', 'delete all', 'mass'],
    showDuplicateDetector: ['duplicate', 'warning', 'same', 'collision', 'detector'],
    showExportButtons: ['download', 'csv', 'excel', 'export roster'],
    showRosterSearchFilter: ['search student', 'filter team', 'find'],
    showRubricHeader: ['rubric', 'title', 'criteria count', 'header'],
    showRubricPresets: ['ipaf', 'preset', 'standard', 'aacsb', 'rubric'],
    showTargetScaleCard: ['scale', 'target', 'gpa', 'percentage', 'converter', 'max'],
    showDeadlineTimer: ['timer', 'deadline', 'countdown', 'date', 'cutoff', 'time'],
    showWeightBalanceBar: ['weight', 'balance', '100%', 'progress', 'bar'],
    showCustomCriterionButton: ['add criterion', 'new criterion', 'custom'],
    showCriterionCards: ['criteria', 'cards', 'rubric sliders', 'criterion'],
    showEvaluationSimulator: ['simulator', 'preview', 'student view', 'test'],
    showEvaluationFormControls: ['questions', 'permissions', 'form controls', 'praise', 'tags', 'self review'],
    showResultsHeaderCard: ['results', 'banner', 'overview', 'stats', 'average'],
    showResultsSummarySheet: ['matrix', 'sheet', 'gradebook', 'webpa', 'grades', 'scores'],
    showWebPACalibration: ['webpa', 'calibration', 'fudge', 'factor', 'multiplier', 'weight'],
    showExportReportButtons: ['pdf', 'report', 'export', 'download report'],
    showDetailedReviewMatrix: ['matrix', 'cross', 'evaluation', 'peer scores', 'grid'],
    showTeammateAuditLog: ['audit', 'log', 'teammate', 'timestamp', 'history'],
    showCompetencyRadar: ['radar', 'spider', 'chart', 'competency', 'visual'],
    showJohariMatrix: ['johari', 'window', 'blind spot', 'hidden', 'perception'],
    showQualitativeFeedback: ['comments', 'feedback', 'written', 'qualitative', 'text'],
    showAnomalyAudit: ['anomaly', 'collusion', 'cheat', 'outlier', 'suspicious'],
    showMilestonesHistory: ['milestone', 'history', 'sprint', 'archive', 'past'],
    showSubmissionReset: ['reset', 'unlock', 'clear reviews', 'danger'],
    showGradebookSearchFilter: ['search gradebook', 'filter results', 'find grade'],
    showThemeSwitcher: ['theme', 'dark', 'light', 'mode', 'color', 'moon', 'sun'],
    showCommandSearch: ['search', 'command', 'palette', 'ctrl+k', 'bar'],
    showProjectorButton: ['projector', 'fullscreen', 'lecture', 'screen'],
    showClassPicker: ['switch class', 'dropdown', 'course', 'picker'],
    showSettingsButton: ['settings', 'preferences', 'configuration'],
    showGuideButton: ['guide', 'help', 'docs', 'documentation', 'academic'],
    showProfilePill: ['profile', 'account', 'user', 'instructor'],
    showEmailButton: ['email', 'dispatcher', 'send', 'mail'],
    showCloudStatus: ['cloud', 'firebase', 'sync', 'online']
  }), []);

  // Map of all modules for fast O(1) lookup
  const allModulesMap = useMemo(() => {
    const map = new Map<string, { key: keyof FeatureToggles; label: string; desc: string; category: string; icon: React.ElementType }>();
    MODULE_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        map.set(item.key, { ...item, category: sec.category, icon: sec.icon });
      });
    });
    return map;
  }, [MODULE_SECTIONS]);

  // Pinned items derived list
  const pinnedItems = useMemo(() => {
    return pinnedKeys
      .map((k) => allModulesMap.get(k))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
  }, [pinnedKeys, allModulesMap]);

  // Intelligent filter matcher
  const filteredModuleSections = useMemo(() => {
    const q = moduleFilter.trim().toLowerCase();
    return MODULE_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        // Tab filter
        const isPinned = pinnedKeys.includes(item.key);
        const isVisible = !!featureToggles[item.key];
        if (moduleFilterTab === 'pinned' && !isPinned) return false;
        if (moduleFilterTab === 'visible' && !isVisible) return false;
        if (moduleFilterTab === 'hidden' && isVisible) return false;

        if (!q) return true;

        // Query match
        const matchesLabel = item.label.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        const matchesCategory = sec.category.toLowerCase().includes(q);
        const aliases = MODULE_ALIASES[item.key] || [];
        const matchesAlias = aliases.some((a) => a.includes(q) || q.includes(a));

        return matchesLabel || matchesDesc || matchesCategory || matchesAlias;
      })
    })).filter((sec) => sec.items.length > 0);
  }, [MODULE_SECTIONS, moduleFilter, moduleFilterTab, pinnedKeys, featureToggles, MODULE_ALIASES]);

  const allModuleKeys = useMemo(() => MODULE_SECTIONS.flatMap((sec) => sec.items.map((i) => i.key)), [MODULE_SECTIONS]);
  const activeModuleCount = allModuleKeys.filter((k) => featureToggles[k]).length;
  const densityPercentage = Math.round((activeModuleCount / allModuleKeys.length) * 100);

  return (
    <div
      ref={containerRef}
      data-tour="quick-action-pill"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'inherit',
        pointerEvents: 'auto'
      }}
    >
      {/* EXPANDED CONTROL CENTER DOCK (Stationary & Floats Over Window) */}
      {isExpanded && (
        <div
          className="quick-action-dock-container"
          style={{
            position: 'absolute',
            bottom: '58px',
            width: 'min(760px, calc(100vw - 24px))',
            maxHeight: 'min(620px, calc(100vh - 90px))',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '22px',
            boxShadow: '0 28px 64px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-color)',
            backdropFilter: 'blur(28px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Top Ambient Header */}
          <div
            style={{
              borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(20, 184, 166, 0.05) 100%), var(--bg-app)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Row 1: Header Branding & Minimalist Action Controls */}
            <div
              style={{
                padding: '0.65rem 1rem 0.55rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
                flexWrap: 'nowrap'
              }}
            >
              {/* Left: Branding, Title & Active Class Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.28)',
                    flexShrink: 0
                  }}
                >
                  <Compass size={15} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      Quick Action Center
                    </span>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.06rem 0.35rem',
                        borderRadius: '5px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0
                      }}
                      title="Shortcut key: Q (Press Q to toggle anytime)"
                    >
                      <Keyboard size={9} /> Q
                    </span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Active: <strong style={{ color: 'var(--text-primary)' }}>{activeClass.name}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)', flexShrink: 0 }}>•</span>
                    <span style={{ flexShrink: 0 }}>{activeClass.students.length} Students</span>
                  </div>
                </div>
              </div>

              {/* Right: Sleek, Minimalist Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                {/* 1. Ticker Toggle Chip */}
                <button
                  type="button"
                  onClick={toggleTelemetry}
                  title={showTelemetry ? 'Live status ticker ON on bottom pill (Click to turn off)' : 'Live status ticker OFF on bottom pill (Click to turn on)'}
                  style={{
                    height: '26px',
                    padding: '0 0.42rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: showTelemetry ? 'rgba(16, 185, 129, 0.09)' : 'var(--bg-surface)',
                    color: showTelemetry ? '#059669' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Activity size={11} className={showTelemetry ? 'text-teal' : ''} />
                  <span>Ticker</span>
                  <span
                    style={{
                      fontSize: '0.56rem',
                      fontWeight: 800,
                      padding: '0.02rem 0.25rem',
                      borderRadius: '4px',
                      backgroundColor: showTelemetry ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-app)',
                      color: showTelemetry ? '#047857' : 'var(--text-muted)'
                    }}
                  >
                    {showTelemetry ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 2. Unified Master Section Fold / Expand Group */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '1px',
                    gap: '1px'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleMasterExpandAll}
                    title="Expand all collapsible dashboard sections"
                    style={{
                      height: '24px',
                      padding: '0 0.4rem',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronsDown size={11} />
                    <span>Expand</span>
                  </button>
                  <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }} />
                  <button
                    type="button"
                    onClick={handleMasterCollapseAll}
                    title="Collapse all collapsible dashboard sections"
                    style={{
                      height: '24px',
                      padding: '0 0.4rem',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronsUp size={11} />
                    <span>Collapse</span>
                  </button>
                </div>

                <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />

                {/* 3. Search Shortcut Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenSearch();
                  }}
                  title="Search commands & actions (Ctrl+K)"
                  style={{
                    height: '26px',
                    padding: '0 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Search size={11} className="text-primary" />
                  <kbd style={{ fontSize: '0.58rem', padding: '0.04rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    ⌘K
                  </kbd>
                </button>

                {/* 4. Keyboard Shortcuts Icon */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenShortcuts();
                  }}
                  title="Keyboard Shortcuts Cheat Sheet (?)"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Keyboard size={12} />
                </button>

                <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />

                {/* 5. Hide Pill Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onHidePill();
                  }}
                  title="Hide Quick Action Pill (Press Q or enable in Settings anytime)"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <EyeOff size={12} />
                </button>

                {/* 6. Contract Dock Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Contract Quick Action Dock (Q)"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Row 2: Full-Width Segmented Dock Navigation Tabs */}
            <div
              style={{
                padding: '0 1.15rem 0.65rem 1.15rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '3px',
                  gap: '3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setDockTab('topbar')}
                  style={{
                    flex: 1,
                    padding: '0.38rem 0.6rem',
                    fontSize: '0.76rem',
                    fontWeight: dockTab === 'topbar' ? 800 : 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dockTab === 'topbar' ? 'var(--primary)' : 'transparent',
                    color: dockTab === 'topbar' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.18s ease',
                    boxShadow: dockTab === 'topbar' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  <LayoutGrid size={13} />
                  <span>Top Bar Actions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDockTab('modules')}
                  style={{
                    flex: 1,
                    padding: '0.38rem 0.6rem',
                    fontSize: '0.76rem',
                    fontWeight: dockTab === 'modules' ? 800 : 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dockTab === 'modules' ? 'var(--primary)' : 'transparent',
                    color: dockTab === 'modules' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.18s ease',
                    boxShadow: dockTab === 'modules' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  <Sliders size={13} />
                  <span>Module Visibility</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      backgroundColor: dockTab === 'modules' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-app)',
                      color: dockTab === 'modules' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800
                    }}
                  >
                    {activeModuleCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDockTab('tools')}
                  style={{
                    flex: 1,
                    padding: '0.38rem 0.6rem',
                    fontSize: '0.76rem',
                    fontWeight: dockTab === 'tools' ? 800 : 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dockTab === 'tools' ? 'var(--primary)' : 'transparent',
                    color: dockTab === 'tools' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.18s ease',
                    boxShadow: dockTab === 'tools' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  <Wrench size={13} />
                  <span>Quick Tools &amp; Actions</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      backgroundColor: dockTab === 'tools' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-app)',
                      color: dockTab === 'tools' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800
                    }}
                  >
                    28
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dock Body Content */}
          <div
            style={{
              padding: '1rem 1.15rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* TAB 1: TOP BAR ACTIONS */}
            {dockTab === 'topbar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {/* Classroom Selector Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: '180px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Classroom Cohort</div>
                      <select
                        value={activeClass.id}
                        onChange={(e) => onSelectClass(e.target.value)}
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          outline: 'none',
                          padding: 0
                        }}
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.students.length} students)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={handleCopyClassId}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', height: '28px', padding: '0 0.6rem', gap: '0.3rem' }}
                      title="Copy Classroom ID code"
                    >
                      {copiedClassId ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                      <span>{copiedClassId ? 'Copied!' : `ID: ${activeClass.id.substring(0, 8)}...`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onNewClass();
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.74rem', height: '28px', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
                      title="Create New Classroom Group"
                    >
                      <Plus size={13} /> <span>New Class</span>
                    </button>
                    {onDeleteClass && classes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onDeleteClass(activeClass.id);
                        }}
                        className="btn btn-secondary btn-sm text-rose"
                        style={{ fontSize: '0.74rem', height: '28px', padding: '0 0.45rem' }}
                        title="Delete Active Classroom"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Group: Core Workspace Actions */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Core Navigation &amp; Tools
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                      gap: '0.55rem'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenSearch();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Search size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Search Finder</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Ctrl+K / Slash</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenGuideCenter('system');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Compass size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Guide Center</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Manual &amp; Tours</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenProjector();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                        <Maximize2 size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projector Mode</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Auditorium Screen</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenEmailDispatcher();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <Mail size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Links</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Brevo &amp; EmailJS</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Group: Configuration & Personalization */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Workspace Customization &amp; Preferences
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                      gap: '0.55rem'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenSettings('modules');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Settings size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Preferences &amp; Cloud</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDockTab('modules');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', flexShrink: 0 }}>
                        <Sliders size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Customize View</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Module Toggles</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', flexShrink: 0 }}>
                        {themeMode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Toggle Theme</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Dark / Light</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenProfile();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                        <User size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Profile Center</span>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isCloudSynced ? '#10b981' : 'var(--text-muted)' }} title={isCloudSynced ? 'Cloud Synced' : 'Local Offline'} />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{activeAdminProfile}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenShortcuts();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Keyboard size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Shortcuts (?)</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Key Bindings</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenTour();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Sparkles size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Start Tour</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Interactive Guide</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MODULE VISIBILITY SWITCHER */}
            {dockTab === 'modules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Presets Header Strip */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Interface Density Presets</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Current layout: <strong>{activeModuleCount} of {allModuleKeys.length} modules visible ({densityPercentage}%)</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onApplyPreset('minimal')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 700 }}
                      >
                        Minimal
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyPreset('standard')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 700 }}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyPreset('full')}
                        className="btn btn-teal btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 700 }}
                      >
                        Full Power
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          if (onOpenEditMode) onOpenEditMode();
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', fontWeight: 700, gap: '0.25rem' }}
                        title="Launch interactive on-screen layout edit mode"
                      >
                        <Edit3 size={12} />
                        <span>Edit Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingProfile(true)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 700, gap: '0.25rem', color: 'var(--primary)' }}
                        title="Save current module toggles as a custom view profile"
                      >
                        <FolderPlus size={12} />
                        <span>Save View</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Save Custom Profile Form */}
                  {isAddingProfile && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--primary)'
                      }}
                    >
                      <input
                        type="text"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        placeholder="Profile name (e.g. Grading Week, Presentation)"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCurrentProfile();
                          if (e.key === 'Escape') setIsAddingProfile(false);
                        }}
                        style={{
                          flex: 1,
                          fontSize: '0.76rem',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={saveCurrentProfile}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', height: '26px' }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingProfile(false);
                          setProfileNameInput('');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: '26px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Custom Saved Profiles Chips */}
                  {customProfiles.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>Custom Profiles:</span>
                      {customProfiles.map((prof) => (
                        <div
                          key={prof.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.69rem',
                            fontWeight: 600
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => applyCustomProfile(prof)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.69rem'
                            }}
                            title="Click to apply this saved module layout"
                          >
                            {prof.name}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteCustomProfileHandler(prof.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '1px',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete custom view profile"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Featured Instructor Onboarding Checklist Toggle */}
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: showChecklist ? '#ecfdf5' : 'var(--bg-app)',
                          color: showChecklist ? '#059669' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <CheckSquare size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Instructor Onboarding &amp; Setup Checklist
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          Progressive 4-step classroom setup widget (hidden by default)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleChecklist(!showChecklist)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        border: showChecklist ? '1px solid #10b981' : '1px solid var(--border-color)',
                        backgroundColor: showChecklist ? '#ecfdf5' : 'var(--bg-app)',
                        color: showChecklist ? '#047857' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0
                      }}
                    >
                      {showChecklist ? <CheckCircle size={13} /> : null}
                      {showChecklist ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  {/* Featured Peer Evaluation Form Fields Quick Trigger */}
                  {onOpenEvaluationControls && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(20, 184, 166, 0.15)',
                            color: '#0d9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <SlidersHorizontal size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Peer Evaluation Form Fields &amp; Permissions
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            Configure questions, praise tags, self-review &amp; profile lock
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenEvaluationControls();
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          flexShrink: 0
                        }}
                      >
                        <SlidersHorizontal size={12} className="text-teal" />
                        Configure
                      </button>
                    </div>
                  )}
                </div>

                {/* Pinned / Favorites Quick-Access Section */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(99, 102, 241, 0.04) 100%), var(--bg-app)',
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          backgroundColor: 'rgba(245, 158, 11, 0.18)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Pinned &amp; Favorite Modules
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#d97706',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            {pinnedItems.length} Pinned
                          </span>
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                          1-click toggle your most needed modules without scrolling down
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {pinnedItems.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const starter = ['showRosterTable', 'showTeamOverviewCards', 'showCriterionCards', 'showResultsSummarySheet', 'showLmsExport', 'showTeamHealthPulse'];
                            setPinnedKeys(starter);
                            localStorage.setItem('peer_pinned_modules', JSON.stringify(starter));
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', fontWeight: 700, gap: '0.25rem', color: '#d97706' }}
                        >
                          <Sparkles size={11} /> Pin Starter Modules
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPinnedKeys([]);
                            localStorage.setItem('peer_pinned_modules', JSON.stringify([]));
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.66rem', padding: '0.15rem 0.45rem', color: 'var(--text-muted)' }}
                          title="Clear all pinned modules"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pinned Items List */}
                  {pinnedItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {pinnedItems.map((item) => {
                        const isVisible = !!featureToggles[item.key];
                        return (
                          <div
                            key={`pinned_${item.key}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.65rem',
                              padding: '0.35rem 0.55rem',
                              borderRadius: '8px',
                              backgroundColor: isVisible ? 'var(--bg-surface)' : 'rgba(0,0,0,0.02)',
                              border: isVisible ? '1px solid var(--border-color)' : '1px solid transparent',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                              <button
                                type="button"
                                onClick={(e) => togglePin(item.key, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.15rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                                title="Unpin from top favorites"
                              >
                                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              </button>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
                                  <span
                                    style={{
                                      fontSize: '0.76rem',
                                      fontWeight: isVisible ? 700 : 500,
                                      color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      padding: '0.05rem 0.35rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--bg-app)',
                                      color: 'var(--text-muted)',
                                      border: '1px solid var(--border-color)',
                                      flexShrink: 0
                                    }}
                                  >
                                    {item.category.split(':')[0]}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.desc}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onToggleFeature(item.key, !isVisible)}
                              style={{
                                padding: '0.22rem 0.6rem',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: isVisible ? '1px solid #10b981' : '1px solid var(--border-color)',
                                backgroundColor: isVisible ? '#ecfdf5' : 'var(--bg-app)',
                                color: isVisible ? '#047857' : 'var(--text-muted)',
                                cursor: 'pointer',
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                              {isVisible ? 'Visible' : 'Hidden'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                      Click the star icon next to any module below to pin it here for immediate 1-click access.
                    </div>
                  )}
                </div>

                {/* Instant Search Bar & Filter Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search 52 modules by keyword (e.g. lms, canvas, moodle, teams, pulse, rubric, gradebook)..."
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 2.2rem 0.45rem 2.1rem',
                        fontSize: '0.78rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    {moduleFilter && (
                      <button
                        type="button"
                        onClick={() => setModuleFilter('')}
                        style={{
                          position: 'absolute',
                          right: '0.65rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.1rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {(
                      [
                        { id: 'all', label: 'All Modules', count: allModuleKeys.length },
                        { id: 'pinned', label: 'Pinned', count: pinnedItems.length },
                        { id: 'visible', label: 'Visible', count: activeModuleCount },
                        { id: 'hidden', label: 'Hidden', count: allModuleKeys.length - activeModuleCount }
                      ] as const
                    ).map((tab) => {
                      const isActive = moduleFilterTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModuleFilterTab(tab.id)}
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: isActive ? 800 : 600,
                            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-surface)',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab.id === 'pinned' && (
                            <Star size={11} fill={isActive ? 'currentColor' : '#f59e0b'} color={isActive ? 'currentColor' : '#f59e0b'} />
                          )}
                          <span>{tab.label}</span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '0 4px',
                              borderRadius: '9999px',
                              backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-app)',
                              color: isActive ? '#fff' : 'var(--text-muted)',
                              fontWeight: 700
                            }}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categorized Module Toggles Accordion List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredModuleSections.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-color)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <Search size={22} style={{ margin: '0 auto 0.4rem', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        No modules found matching "{moduleFilter}"
                      </div>
                      <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                        Try searching for keywords like "canvas", "roster", "pulse", "rubric", or reset filters.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModuleFilter('');
                          setModuleFilterTab('all');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.75rem', fontSize: '0.72rem' }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    filteredModuleSections.map((sec) => {
                      const SectionIcon = sec.icon;
                      const secVisibleCount = sec.items.filter((i) => featureToggles[i.key]).length;

                      return (
                        <div
                          key={sec.category}
                          style={{
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Section Header */}
                          <div
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: 'rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <SectionIcon size={14} className="text-primary" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {sec.category}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {secVisibleCount}/{sec.items.length} Active
                            </span>
                          </div>

                          {/* Items Grid */}
                          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {sec.items.map((item) => {
                              const isVisible = !!featureToggles[item.key];
                              const isPinned = pinnedKeys.includes(item.key);
                              return (
                                <div
                                  key={item.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: '8px',
                                    backgroundColor: isVisible ? 'var(--bg-surface)' : 'transparent',
                                    border: isVisible ? '1px solid var(--border-color)' : '1px solid transparent',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                    {/* Pin / Favorite Star Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => togglePin(item.key, e)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: isPinned ? '#f59e0b' : 'var(--text-muted)',
                                        transition: 'transform 0.15s ease'
                                      }}
                                      title={isPinned ? 'Unpin from Quick Action favorites' : 'Pin to top of Quick Action Center'}
                                    >
                                      <Star size={14} fill={isPinned ? '#f59e0b' : 'none'} color={isPinned ? '#f59e0b' : 'currentColor'} />
                                    </button>

                                    <div style={{ minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: '0.76rem',
                                          fontWeight: isVisible ? 700 : 500,
                                          color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)'
                                        }}
                                      >
                                        {item.label}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '0.66rem',
                                          color: 'var(--text-secondary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {item.desc}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => onToggleFeature(item.key, !isVisible)}
                                    style={{
                                      padding: '0.22rem 0.55rem',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      borderRadius: '6px',
                                      border: isVisible ? '1px solid #10b981' : '1px solid var(--border-color)',
                                      backgroundColor: isVisible ? '#ecfdf5' : 'var(--bg-app)',
                                      color: isVisible ? '#047857' : 'var(--text-muted)',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {isVisible ? 'Visible' : 'Hidden'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: QUICK TOOLS & ACTIONS */}
            {dockTab === 'tools' && (
              <div className="quick-pill-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Zone 1: Roster & Enrollment Studio */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      1. Cohort Enrollment &amp; Team Partitioning
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {activeClass.students.length} Enrolled
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onAddStudent();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Plus size={15} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>+ Enroll Student</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Single student dialog</div>
                      </div>
                    </button>

                    {onOpenWizard && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenWizard();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <Upload size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Import Wizard</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>CSV / Excel batch roster</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenAutoGroup();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Users size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>AutoGroup Studio</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Balanced team partitioner</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenQRCode();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <QrCode size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Join QR &amp; Link</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Student self-enrollment</div>
                      </div>
                    </button>

                    {onCopyJoinLink && (
                      <button
                        type="button"
                        onClick={() => {
                          onCopyJoinLink();
                          setCopiedJoinLinkState(true);
                          setTimeout(() => setCopiedJoinLinkState(false), 2000);
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                          {copiedJoinLinkState ? <Check size={14} className="text-teal" /> : <Link size={14} />}
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{copiedJoinLinkState ? 'Copied Link!' : 'Copy Join Link'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Direct student URL</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onPopulate100Demo();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', flexShrink: 0 }}>
                        <Sparkles size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>100 Demo Cohort</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>35+ countries diversity</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onExportCSV();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                        <Download size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Roster CSV</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Plain spreadsheet format</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onExportExcel();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                        <FileSpreadsheet size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Excel</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Multi-tab cohort workbook</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Zone 2: Review System & Rubrics */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      2. Review System &amp; Rubrics Tools
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {activeClass.fields.length} Criteria Configured
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onAddCriterion();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Plus size={15} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>+ Add Criterion</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>New 1-20 evaluation scale</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onAutoBalanceWeights();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <CheckCircle size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auto-Balance 100%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Equalize criterion weights</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onApplyIPAF();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                        <BookOpen size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Apply IPAF Rubric</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Research-backed standard</div>
                      </div>
                    </button>

                    {onOpenTeamBaseGrades && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenTeamBaseGrades();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                          <Sliders size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Base Grades</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Base scores &amp; multipliers</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onLaunchSimulator();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <Smartphone size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Simulator</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Preview mobile portal UI</div>
                      </div>
                    </button>

                    {onOpenEvaluationControls && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenEvaluationControls();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                          <SlidersHorizontal size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Form Fields &amp; Controls</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Questions, tags &amp; permissions</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onNavigateTab('grading');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Activity size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Health Pulse</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>30s check-in &amp; sparklines</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Zone 3: Evaluation Diagnostics & Analytics Studio */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      3. Evaluation Diagnostics &amp; Analytics Studio
                    </span>
                    <span style={{ fontSize: '0.66rem', color: '#d97706', fontWeight: 700 }}>
                      {activeClass.reviews.length} Submissions Live
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    {onPopulateAuditData && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onPopulateAuditData();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                          <Sparkles size={15} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Populate Reviews</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Full cohort test evaluations</div>
                        </div>
                      </button>
                    )}

                    {onResetReviews && activeClass.reviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onResetReviews();
                        }}
                        className="quick-tool-card text-rose"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                          <RotateCcw size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#dc2626' }}>Reset All Reviews</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Clear {activeClass.reviews.length} submissions</div>
                        </div>
                      </button>
                    )}

                    {onOpenStudentReport && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenStudentReport();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <FileText size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Dossier</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Progress report cards</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onNavigateTab('results');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <BarChart2 size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Johari Perception</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Blind spots &amp; matrix</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onNavigateTab('results');
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                        <Award size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Outlier Audit</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Collusion &amp; grade anomaly</div>
                      </div>
                    </button>

                    {onOpenLmsGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenLmsGuide();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                          <Share2 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>LMS Gradebook Sync</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Canvas, Moodle, Blackboard</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone 4: Presentation & Classroom Operations */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    4. Presentation &amp; Classroom Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenProjector();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Maximize2 size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projector View (P)</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Fullscreen presentation</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenEmailDispatcher();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <Mail size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Dispatcher</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Send links via Brevo/EmailJS</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenTour();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                        <Compass size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Interactive Tour</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Step-by-step guidance</div>
                      </div>
                    </button>

                    {onOpenArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenArchive();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(107, 114, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', flexShrink: 0 }}>
                          <Archive size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Archive Manager</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Archived cohorts &amp; restore</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone 5: Workspace Utilities & Preferences */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    5. Workspace Utilities &amp; Preferences
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        {themeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Toggle Theme</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Light / Dark mode</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenShortcuts();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                        <Keyboard size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Shortcuts (?)</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Hotkeys reference</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleChecklist(!showChecklist);
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                        <CheckSquare size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Setup Checklist</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{showChecklist ? 'Visible on home' : 'Hidden'}</div>
                      </div>
                    </button>

                    {onBackupJSON && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onBackupJSON();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <Database size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Backup JSON</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Download cohort snapshot</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                        <ArrowUp size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Scroll to Top</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Smooth window return</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTRACTED FLOATING PILL CAPSULE (Stationary at Bottom Center of Window) */}
      <div
        className="quick-action-pill-capsule"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '9999px',
          padding: '0.28rem 0.42rem',
          boxShadow: '0 16px 40px -6px rgba(0, 0, 0, 0.28), 0 0 0 1px var(--border-color)',
          backdropFilter: 'blur(28px)',
          gap: '0.35rem',
          transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Optional Ambient Live Status Ticker (Can be toggled in expanded dock) */}
        {showTelemetry && activeClass && (
          <>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.42rem',
                padding: '0 0.6rem',
                height: '30px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-app)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                userSelect: 'none',
                cursor: 'pointer'
              }}
              title={`Active: ${activeClass.name} • ${totalStudents} students • ${submittedStudents}/${totalStudents} submitted (${completionPct}%) • Click to expand dock`}
              onClick={() => setIsExpanded(true)}
            >
              <span
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  backgroundColor: completionPct >= 80 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : 'var(--primary)',
                  boxShadow: `0 0 6px ${completionPct >= 80 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : 'var(--primary)'}`,
                  display: 'inline-block'
                }}
              />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeClass.name}
              </span>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <span style={{ color: completionPct >= 80 ? '#059669' : 'var(--text-secondary)', fontWeight: 700 }}>
                {submittedStudents}/{totalStudents} ({completionPct}%)
              </span>
              {activePulseCount > 0 && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    padding: '0.04rem 0.32rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(13, 148, 136, 0.15)',
                    color: '#0d9488',
                    fontWeight: 800
                  }}
                  title="Active Team Health Micro-Pulse survey underway"
                >
                  Pulse
                </span>
              )}
            </div>
            <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />
          </>
        )}

        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Quick Search (Ctrl+K or /)"
          style={{
            height: '30px',
            padding: '0 0.65rem 0 0.55rem',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            transition: 'all 0.15s ease'
          }}
        >
          <Search size={13} className="text-primary" />
          <span>Search</span>
          <kbd
            style={{
              fontSize: '0.62rem',
              padding: '0.08rem 0.35rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Separator */}
        <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />

        {/* Section Quick Jump Segmented Group */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '9999px',
            padding: '2px',
            gap: '2px'
          }}
        >
          <button
            type="button"
            onClick={() => onNavigateTab('hub')}
            title="Classroom Home Hub"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: activeTab === 'hub' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'hub' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'hub' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none'
            }}
          >
            <LayoutGrid size={13} />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('roster')}
            title="Section 1: Enrollment & Teams"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: activeTab === 'roster' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'roster' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'roster' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none'
            }}
          >
            <Users size={13} />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('grading')}
            title="Section 2: Review System"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: activeTab === 'grading' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'grading' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'grading' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none'
            }}
          >
            <Sliders size={13} />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('results')}
            title="Section 3: Grading & Analytics"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: activeTab === 'results' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'results' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'results' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none'
            }}
          >
            <Award size={13} />
          </button>
        </div>

        {/* Separator */}
        <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />

        {/* Modules Visibility Shortcut Trigger */}
        <button
          type="button"
          onClick={() => {
            setDockTab('modules');
            setIsExpanded(true);
          }}
          title={`Module Visibility (${activeModuleCount} active modules)`}
          style={{
            padding: '0 0.55rem',
            height: '28px',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={12} className="text-primary" />
          <span>Modules</span>
          <span
            style={{
              fontSize: '0.64rem',
              padding: '0.05rem 0.35rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 800
            }}
          >
            {activeModuleCount}
          </span>
        </button>

        {/* Expand / Contract Toggle Chevron */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Contract Quick Action Dock (Q)' : 'Expand All Tools & Functions (Q)'}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isExpanded ? 'var(--primary)' : 'var(--bg-app)',
            color: isExpanded ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: isExpanded ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none'
          }}
        >
          <ChevronUp
            size={15}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease'
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default QuickActionPill;
