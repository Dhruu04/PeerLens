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
  FileSpreadsheet,
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
  Edit3,
  UserCheck,
  Presentation,
  ShieldCheck,
  History,
  Layers,
  Building2,
  Pin,
  Lock,
  Unlock,
  Gauge,
  AlertTriangle,
  Shuffle,
  Zap
} from 'lucide-react';
import type { ClassData, EvaluationFormControls, Student } from '../utils/math';
import { getEvaluationControls, detectClassAnomalies } from '../utils/math';
import type { FeatureToggles } from '../utils/featurePreferences';
import { MODULE_ITEMS } from '../utils/moduleRegistry';
import {
  getPinnedModuleIds,
  subscribePinnedModules,
  togglePinModule
} from '../utils/workspaceModuleManager';
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
import FeatureInfoButton from './FeatureInfoButton';

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
  onApplyPreset: (preset: 'minimal' | 'standard' | 'full' | 'none') => void;
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
  onOpenLivePresentation?: () => void;
  onOpenTeamKickoff?: (tab?: 'roles_config' | 'icebreakers' | 'charters') => void;
  onOpenEnrollmentBuilder?: () => void;
  onOpenSnapshots?: () => void;
  onClearRoster?: () => void;
  onExportLMS?: (platform: 'canvas' | 'blackboard' | 'moodle' | 'brightspace') => void;
  onExportPulseCSV?: () => void;
  shortcutsEnabled?: boolean;
  onToggleShortcutsEnabled?: (enabled: boolean) => void;
  onOpenLayoutLibrary?: () => void;
  onOpenBranding?: () => void;
  onResetLayout?: () => void;
  embedded?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;

  // Advanced Omniscient Callbacks
  onUpdateEvaluationControls?: (controls: Partial<EvaluationFormControls>) => void;
  onApplyRubricPreset?: (presetId: string) => void;
  onSetTargetScale?: (scale: number) => void;
  onSetFudgeWeight?: (weight: number) => void;
  onExportResultsCSV?: () => void;
  onExportPDFSummary?: () => void;
  onLaunchStudentSimulator?: (student: Student) => void;
  onSelectTeamFilter?: (teamName: string) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
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
  onOpenProfile: _onOpenProfile,
  onOpenShortcuts,
  onOpenTour,
  isCloudSynced,
  activeAdminProfile: _activeAdminProfile,
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
  onHidePill: _onHidePill,
  onOpenWizard,
  onPopulateAuditData,
  onOpenStudentReport: _onOpenStudentReport,
  onOpenArchive,
  onOpenTeamBaseGrades,
  onOpenLmsGuide: _onOpenLmsGuide,
  onCopyJoinLink,
  onResetReviews,
  onBackupJSON,
  onOpenEditMode,
  onOpenLivePresentation,
  onOpenTeamKickoff,
  onOpenEnrollmentBuilder: _onOpenEnrollmentBuilder,
  onOpenSnapshots,
  onClearRoster,
  onExportLMS,
  onExportPulseCSV,
  shortcutsEnabled: propShortcutsEnabled,
  onToggleShortcutsEnabled,
  onOpenLayoutLibrary,
  onOpenBranding,
  onResetLayout,
  embedded = false,
  isExpanded: propIsExpanded,
  onExpandChange,
  onUpdateEvaluationControls,
  onApplyRubricPreset,
  onSetTargetScale,
  onSetFudgeWeight: _onSetFudgeWeight,
  onExportResultsCSV,
  onExportPDFSummary,
  onLaunchStudentSimulator,
  onSelectTeamFilter,
  onToast
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalExpanded;
  const toggleExpanded = (val: boolean) => {
    if (propIsExpanded === undefined) {
      setInternalExpanded(val);
    }
    if (onExpandChange) onExpandChange(val);
  };
  const setIsExpanded = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof valOrFn === 'function' ? valOrFn(isExpanded) : valOrFn;
    toggleExpanded(nextVal);
  };

  // Tabs: Cockpit (Live Telemetry & In-Place Controls), Tools (Catalog of 40+ Operations), Modules (70+ Canvas & Dock), Profiles (Views & Config)
  const [dockTab, setDockTab] = useState<'cockpit' | 'tools' | 'modules' | 'profiles'>('cockpit');
  const [omniSearchQuery, setOmniSearchQuery] = useState('');
  const [moduleFilterTab, setModuleFilterTab] = useState<'all' | 'pinned' | 'dock' | 'visible' | 'hidden'>('all');
  const [copiedClassId, setCopiedClassId] = useState(false);
  const [copiedJoinLinkState, setCopiedJoinLinkState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Synchronized Retractable Workspace Dock Pin IDs
  const [dockPinnedIds, setDockPinnedIds] = useState<string[]>(getPinnedModuleIds);
  useEffect(() => {
    return subscribePinnedModules((ids) => setDockPinnedIds(ids));
  }, []);

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

  // Optional Ambient Live Status Ticker (Default: false for compact pill)
  const [showTelemetry, setShowTelemetry] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('peer_pill_telemetry');
      return saved !== null ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
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

  // Custom View Profiles & Shortcuts State
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
    if (onToast) onToast(`Saved layout view profile "${trimmed}"`, 'success');
  };

  const deleteCustomProfileHandler = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomProfile(id);
    if (onToast) onToast('Deleted view profile', 'info');
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
    if (onToast) onToast(`Loaded view profile "${profile.name}"`, 'success');
  };

  // Master Section Fold / Expand Across All Foldable Cards
  const handleMasterExpandAll = () => {
    window.dispatchEvent(new CustomEvent('peerlens_expand_all'));
    if (onToast) onToast('Expanded all cards across workspace', 'info');
  };

  const handleMasterCollapseAll = () => {
    window.dispatchEvent(new CustomEvent('peerlens_collapse_all'));
    if (onToast) onToast('Collapsed all cards across workspace', 'info');
  };

  // Omniscient Telemetry Calculations
  const totalStudents = activeClass?.students?.length ?? 0;
  const submittedStudents = useMemo(() => (activeClass?.students || []).filter(s => s.submitted).length, [activeClass]);
  const pendingStudents = totalStudents - submittedStudents;
  const completionPct = totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0;

  // Unique Teams & Team Roster Breakdown
  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    (activeClass?.students || []).forEach(s => {
      if (s.groupName && s.groupName.trim()) set.add(s.groupName.trim());
    });
    return Array.from(set).sort();
  }, [activeClass]);
  const teamsCount = uniqueTeams.length;

  // Criteria & Weights calculation
  const criteriaCount = activeClass?.fields?.length ?? 0;
  const totalWeight = useMemo(() => {
    return (activeClass?.fields || []).reduce((sum, f) => sum + (Number(f.weight) || 0), 0);
  }, [activeClass]);
  const isWeightBalanced = criteriaCount > 0 ? totalWeight === 100 : true;

  // Form Controls (Evaluation Round locks, permissions, rubrics)
  const evalControls = useMemo(() => getEvaluationControls(activeClass), [activeClass]);

  // Active Pulse Surveys
  const activePulseCount = useMemo(() => {
    return (activeClass?.pulseRounds || []).filter(r => r.status === 'active').length;
  }, [activeClass]);

  // Unassigned students count & list
  const unassignedStudents = useMemo(() => {
    return (activeClass?.students || []).filter(s => !s.groupName || !s.groupName.trim());
  }, [activeClass]);

  // Detected anomalies in active class reviews
  const anomalyCount = useMemo(() => {
    if (!activeClass || !activeClass.reviews || activeClass.reviews.length === 0) return 0;
    try {
      return detectClassAnomalies(activeClass).length;
    } catch {
      return 0;
    }
  }, [activeClass]);

  // Selected student for quick simulator launcher
  const [selectedSimStudentId, setSelectedSimStudentId] = useState<string>(() => {
    return activeClass?.students?.[0]?.id || '';
  });
  useEffect(() => {
    if (activeClass?.students?.length && !activeClass.students.some(s => s.id === selectedSimStudentId)) {
      setSelectedSimStudentId(activeClass.students[0].id);
    }
  }, [activeClass, selectedSimStudentId]);

  const selectedSimStudent = useMemo(() => {
    return (activeClass?.students || []).find((s) => s.id === selectedSimStudentId) || activeClass?.students?.[0] || null;
  }, [activeClass, selectedSimStudentId]);

  const handleLaunchRandomSimulator = () => {
    if (!activeClass?.students || activeClass.students.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeClass.students.length);
    const randomStudent = activeClass.students[randomIndex];
    setSelectedSimStudentId(randomStudent.id);
    setIsExpanded(false);
    if (onLaunchStudentSimulator) {
      onLaunchStudentSimulator(randomStudent);
    } else {
      onLaunchSimulator();
    }
  };

  const applyPermissionPreset = (preset: 'standard' | 'formative' | 'strict') => {
    if (!onUpdateEvaluationControls) return;
    if (preset === 'standard') {
      onUpdateEvaluationControls({
        unlockMainPeerReview: true,
        allowSelfReview: false,
        showGrowthSuggestions: true,
        showPraiseTags: true
      });
      if (onToast) onToast('Applied Standard Peer Review permissions', 'success');
    } else if (preset === 'formative') {
      onUpdateEvaluationControls({
        unlockMainPeerReview: true,
        allowSelfReview: true,
        showGrowthSuggestions: true,
        showPraiseTags: true
      });
      if (onToast) onToast('Applied Formative 360° permissions (Self-Review + Feedback enabled)', 'success');
    } else if (preset === 'strict') {
      onUpdateEvaluationControls({
        unlockMainPeerReview: true,
        allowSelfReview: false,
        showGrowthSuggestions: false,
        showPraiseTags: false
      });
      if (onToast) onToast('Applied Strict Exam Mode (Scores only)', 'info');
    }
  };

  // Close dock on Escape key or outside click; focus search on '/' key when expanded
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      } else if (e.key === '/' && isExpanded && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
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
      if (onToast) onToast(`Copied Classroom ID: ${activeClass.id}`, 'info');
    }
  };

  // Structured Module Sections
  const MODULE_SECTIONS: {
    category: string;
    icon: React.ElementType;
    items: { key: keyof FeatureToggles; label: string; desc: string; icon: React.ElementType; isSubmodule?: boolean }[];
  }[] = useMemo(() => [
    {
      category: 'Top Bar & Global Header',
      icon: LayoutGrid,
      items: MODULE_ITEMS.filter((m) => m.category === 'header').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'Home Hub Screen',
      icon: Compass,
      items: MODULE_ITEMS.filter((m) => m.category === 'hub').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'Section 1: Enrollment & Roster',
      icon: Users,
      items: MODULE_ITEMS.filter((m) => m.category === 'roster').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'AutoGroup Studio & Teams',
      icon: Sparkles,
      items: MODULE_ITEMS.filter((m) => m.category === 'autogroup').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'Section 2: Review System',
      icon: Sliders,
      items: MODULE_ITEMS.filter((m) => m.category === 'rubric').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'Section 3: Grading & Performance Analytics',
      icon: Award,
      items: MODULE_ITEMS.filter((m) => m.category === 'analytics').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    },
    {
      category: 'Section 4: Application Footer Elements',
      icon: ShieldCheck,
      items: MODULE_ITEMS.filter((m) => m.category === 'footer').map((m) => ({
        key: m.key,
        label: m.title,
        desc: m.desc,
        icon: m.icon,
        isSubmodule: !!m.parentKey
      }))
    }
  ], []);

  // Intelligent synonym aliases for fast semantic search
  const MODULE_ALIASES: Record<string, string[]> = useMemo(() => ({
    showLmsExport: ['custom lms', 'canvas', 'moodle', 'blackboard', 'brightspace', 'd2l', 'lms', 'sis', 'gradebook', 'export', 'sync', 'csv', 'tsv'],
    showTeamHealthPulse: ['pulse', 'health', 'morale', 'check-in', 'survey', 'sprint', 'sparkline', 'feedback', 'blocker', 'standup'],
    showAutoGroupStudio: ['autogroup', 'group', 'cohort', 'diversity', 'balance', 'formation', 'algorithm', 'team', 'shuffle'],
    showTeamKickoffAndRoles: ['roles', 'lead', 'scribe', 'icebreaker', 'charter', 'kickoff', 'agreements', 'teamwork'],
    showLivePresentationScoring: ['presentation', 'scoring', 'live', 'cockpit', 'audience', 'qr', 'voting', 'timer', 'leaderboard', 'pitch'],
    showSelfEnrollmentCard: ['qr', 'join', 'link', 'enroll', 'self', 'code', 'mobile', 'questions', 'form builder'],
    showQuickActionsCard: ['demo', 'sample', '100', 'populate', 'random', 'fast add'],
    showImportWizardCard: ['import', 'csv', 'excel', 'upload', 'file', 'roster'],
    showRosterTable: ['roster', 'student', 'table', 'enrolled', 'list', 'class'],
    showRubricPresets: ['ipaf', 'preset', 'standard', 'aacsb', 'rubric'],
    showEvaluationSimulator: ['simulator', 'preview', 'student view', 'test'],
    showEvaluationFormControls: ['questions', 'permissions', 'form controls', 'praise', 'tags', 'self review', 'constructive', 'profile lock', 'lock round'],
    showResultsSummarySheet: ['matrix', 'sheet', 'gradebook', 'webpa', 'grades', 'scores'],
    showWebPACalibration: ['webpa', 'calibration', 'fudge', 'factor', 'multiplier', 'weight'],
    showExportReportButtons: ['pdf', 'report', 'export', 'download report'],
    showDetailedReviewMatrix: ['who rated whom', 'matrix', 'cross matrix', 'ratings grid', 'raw scores'],
    showJohariMatrix: ['johari', 'window', 'blind spot', 'hidden', 'perception'],
    showQualitativeFeedback: ['comments', 'feedback', 'written', 'qualitative', 'text'],
    showAnomalyAudit: ['anomaly', 'collusion', 'cheat', 'outlier', 'suspicious'],
    showThemeSwitcher: ['theme', 'dark', 'light', 'mode', 'color', 'moon', 'sun'],
    showCommandSearch: ['search', 'command', 'palette', 'ctrl+k', 'bar', 'omni', 'spotlight'],
    showProjectorButton: ['projector', 'fullscreen', 'lecture', 'screen'],
    showClassPicker: ['switch class', 'dropdown', 'course', 'picker']
  }), []);

  // Map of all modules
  const allModulesMap = useMemo(() => {
    const map = new Map<string, { key: keyof FeatureToggles; label: string; desc: string; category: string; icon: React.ElementType }>();
    MODULE_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        map.set(item.key, { ...item, category: sec.category, icon: item.icon || sec.icon });
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

  // Modules filter
  const filteredModuleSections = useMemo(() => {
    const q = omniSearchQuery.trim().toLowerCase();
    return MODULE_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        const isPinned = pinnedKeys.includes(item.key);
        const isInDock = dockPinnedIds.includes(item.key);
        const isVisible = !!featureToggles[item.key];
        if (moduleFilterTab === 'pinned' && !isPinned) return false;
        if (moduleFilterTab === 'dock' && !isInDock) return false;
        if (moduleFilterTab === 'visible' && !isVisible) return false;
        if (moduleFilterTab === 'hidden' && isVisible) return false;

        if (!q) return true;

        const matchesLabel = item.label.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        const matchesCategory = sec.category.toLowerCase().includes(q);
        const aliases = MODULE_ALIASES[item.key] || [];
        const matchesAlias = aliases.some((a) => a.includes(q) || q.includes(a));

        return matchesLabel || matchesDesc || matchesCategory || matchesAlias;
      })
    })).filter((sec) => sec.items.length > 0);
  }, [MODULE_SECTIONS, omniSearchQuery, moduleFilterTab, pinnedKeys, dockPinnedIds, featureToggles, MODULE_ALIASES]);

  const allModuleKeys = useMemo(() => MODULE_SECTIONS.flatMap((sec) => sec.items.map((i) => i.key)), [MODULE_SECTIONS]);
  const activeModuleCount = allModuleKeys.filter((k) => featureToggles[k]).length;
  const densityPercentage = Math.round((activeModuleCount / Math.max(1, allModuleKeys.length)) * 100);

  const activePreset: 'minimal' | 'standard' | 'full' | 'none' = useMemo(() => {
    if (activeModuleCount === 0) return 'none';
    if (densityPercentage <= 30) return 'minimal';
    if (densityPercentage >= 75) return 'full';
    return 'standard';
  }, [activeModuleCount, densityPercentage]);

  // Master Action Catalog: Universal search entries
  const ALL_ACTIONS_CATALOG = useMemo(() => [
    { id: 'lock_round', title: !evalControls.unlockMainPeerReview ? 'Unlock Evaluation Submissions' : 'Lock Evaluation Submissions', category: 'Evaluation Controls', icon: !evalControls.unlockMainPeerReview ? Unlock : Lock, badge: !evalControls.unlockMainPeerReview ? 'Locked' : 'Open', action: () => onUpdateEvaluationControls && onUpdateEvaluationControls({ unlockMainPeerReview: !evalControls.unlockMainPeerReview }) },
    { id: 'self_review', title: evalControls.allowSelfReview ? 'Disable Student Self-Review' : 'Allow Student Self-Review', category: 'Evaluation Controls', icon: UserCheck, badge: evalControls.allowSelfReview ? 'Allowed' : 'Disabled', action: () => onUpdateEvaluationControls && onUpdateEvaluationControls({ allowSelfReview: !evalControls.allowSelfReview }) },
    { id: 'peer_comments', title: evalControls.showGrowthSuggestions ? 'Disable Constructive Feedback' : 'Enable Constructive Feedback', category: 'Evaluation Controls', icon: FileText, badge: evalControls.showGrowthSuggestions ? 'Enabled' : 'Disabled', action: () => onUpdateEvaluationControls && onUpdateEvaluationControls({ showGrowthSuggestions: !evalControls.showGrowthSuggestions }) },
    { id: 'praise_tags', title: evalControls.showPraiseTags ? 'Disable Praise Tags' : 'Enable Strengths & Praise Tags', category: 'Evaluation Controls', icon: ShieldCheck, badge: evalControls.showPraiseTags ? 'Active' : 'Off', action: () => onUpdateEvaluationControls && onUpdateEvaluationControls({ showPraiseTags: !evalControls.showPraiseTags }) },
    { id: 'add_student', title: 'Enroll New Student', category: 'Roster & Teams', icon: Plus, badge: 'Modal', action: () => { setIsExpanded(false); onAddStudent(); } },
    { id: 'import_wizard', title: 'Roster Import Wizard (CSV/Excel)', category: 'Roster & Teams', icon: Upload, badge: 'Batch', action: () => { setIsExpanded(false); onOpenWizard && onOpenWizard(); } },
    { id: 'autogroup', title: 'AutoGroup Studio (Team Formations)', category: 'Roster & Teams', icon: Users, badge: 'Solver', action: () => { setIsExpanded(false); onOpenAutoGroup(); } },
    { id: 'join_qr', title: 'Student Join QR & Self-Enroll Link', category: 'Roster & Teams', icon: QrCode, badge: 'QR', action: () => { setIsExpanded(false); onOpenQRCode(); } },
    { id: 'demo_100', title: 'Load 100 Sample Cohort Students', category: 'Roster & Teams', icon: Sparkles, badge: 'Demo', action: () => { setIsExpanded(false); onPopulate100Demo(); } },
    { id: 'add_criterion', title: 'Add Rubric Criterion Field', category: 'Rubrics & Scales', icon: Plus, badge: `${criteriaCount} active`, action: () => { setIsExpanded(false); onAddCriterion(); } },
    { id: 'autobalance', title: 'Auto-Balance Weights to 100%', category: 'Rubrics & Scales', icon: CheckCircle, badge: `${totalWeight}%`, action: () => { onAutoBalanceWeights(); } },
    { id: 'ipaf_preset', title: 'Apply IPAF Research Rubric Preset', category: 'Rubrics & Scales', icon: BookOpen, badge: 'Preset', action: () => { onApplyIPAF(); } },
    { id: 'student_simulator', title: 'Launch Student Mobile Simulator', category: 'Simulation', icon: Smartphone, badge: 'Preview', action: () => { setIsExpanded(false); onLaunchSimulator(); } },
    { id: 'export_excel', title: 'Export Full Classroom Workbook (Excel)', category: 'Exports', icon: FileSpreadsheet, badge: 'XLSX', action: () => { setIsExpanded(false); onExportExcel(); } },
    { id: 'export_csv', title: 'Export Roster CSV', category: 'Exports', icon: Download, badge: 'CSV', action: () => { setIsExpanded(false); onExportCSV(); } },
    { id: 'export_results_csv', title: 'Export Results Summary CSV', category: 'Exports', icon: BarChart2, badge: 'Grades', action: () => { setIsExpanded(false); onExportResultsCSV && onExportResultsCSV(); } },
    { id: 'export_pdf', title: 'Export Evaluation Report PDF', category: 'Exports', icon: FileText, badge: 'PDF', action: () => { setIsExpanded(false); onExportPDFSummary && onExportPDFSummary(); } },
    { id: 'canvas_export', title: 'Export Canvas LMS Gradebook', category: 'LMS Sync', icon: Share2, badge: 'Canvas', action: () => { setIsExpanded(false); onExportLMS && onExportLMS('canvas'); } },
    { id: 'moodle_export', title: 'Export Moodle LMS Gradebook', category: 'LMS Sync', icon: Share2, badge: 'Moodle', action: () => { setIsExpanded(false); onExportLMS && onExportLMS('moodle'); } },
    { id: 'blackboard_export', title: 'Export Blackboard Gradebook', category: 'LMS Sync', icon: Share2, badge: 'Blackboard', action: () => { setIsExpanded(false); onExportLMS && onExportLMS('blackboard'); } },
    { id: 'pulse_csv', title: 'Export Pulse Morale & Blockers CSV', category: 'Exports', icon: Activity, badge: 'Pulse', action: () => { setIsExpanded(false); onExportPulseCSV && onExportPulseCSV(); } },
    { id: 'projector', title: 'Projector Auditorium View (P)', category: 'Presentation', icon: Maximize2, badge: 'Fullscreen', action: () => { setIsExpanded(false); onOpenProjector(); } },
    { id: 'live_presentation', title: 'Live Presentation Scoring Cockpit', category: 'Presentation', icon: Presentation, badge: 'Live Scoring', action: () => { setIsExpanded(false); onOpenLivePresentation && onOpenLivePresentation(); } },
    { id: 'email_dispatcher', title: 'Email Magic Links Dispatcher', category: 'Delivery', icon: Mail, badge: 'Brevo/EmailJS', action: () => { setIsExpanded(false); onOpenEmailDispatcher(); } },
    { id: 'kickoff_charter', title: 'Team Agreements & 5-Min Kickoff', category: 'Roster & Teams', icon: UserCheck, badge: 'Charters', action: () => { setIsExpanded(false); onOpenTeamKickoff && onOpenTeamKickoff('charters'); } },
    { id: 'edit_mode', title: 'Interactive Layout Edit Mode (Alt+E)', category: 'Layout & Design', icon: Edit3, badge: 'Visual', action: () => { setIsExpanded(false); onOpenEditMode && onOpenEditMode(); } },
    { id: 'layout_library', title: 'Layout Library (7 Professor Presets)', category: 'Layout & Design', icon: Layers, badge: 'Presets', action: () => { setIsExpanded(false); onOpenLayoutLibrary && onOpenLayoutLibrary(); } },
    { id: 'institutional_branding', title: 'Institutional Branding Customizer', category: 'Layout & Design', icon: Building2, badge: 'Logo & Colors', action: () => { setIsExpanded(false); onOpenBranding && onOpenBranding(); } },
    { id: 'populate_reviews', title: 'Populate Simulated Peer Reviews', category: 'Audits & Testing', icon: Sparkles, badge: 'Test Data', action: () => { setIsExpanded(false); onPopulateAuditData && onPopulateAuditData(); } },
    { id: 'reset_reviews', title: 'Reset All Peer Review Submissions', category: 'Audits & Testing', icon: RotateCcw, badge: 'Danger', action: () => { setIsExpanded(false); onResetReviews && onResetReviews(); } },
    { id: 'clear_roster', title: 'Clear Entire Classroom Roster', category: 'Roster & Teams', icon: Trash2, badge: 'Danger', action: () => { setIsExpanded(false); onClearRoster && onClearRoster(); } },
    { id: 'backup_json', title: 'Download JSON Snapshot Backup', category: 'System', icon: Database, badge: 'JSON', action: () => { setIsExpanded(false); onBackupJSON && onBackupJSON(); } },
    { id: 'tour', title: 'Interactive Guided Walkthrough Tour', category: 'Help & Docs', icon: Compass, badge: 'Tutorial', action: () => { setIsExpanded(false); onOpenTour(); } },
    { id: 'guide_center', title: 'Academic Manual & Guide Center', category: 'Help & Docs', icon: BookOpen, badge: 'Manual', action: () => { setIsExpanded(false); onOpenGuideCenter(); } },
    { id: 'settings', title: 'Workspace Settings & Cloud Sync', category: 'System', icon: Settings, badge: isCloudSynced ? 'Synced' : 'Local', action: () => { setIsExpanded(false); onOpenSettings(); } },
    { id: 'shortcuts', title: 'Keyboard Shortcuts Cheat Sheet (?)', category: 'System', icon: Keyboard, badge: 'Hotkeys', action: () => { setIsExpanded(false); onOpenShortcuts(); } }
  ], [
    evalControls,
    criteriaCount,
    totalWeight,
    isCloudSynced,
    onUpdateEvaluationControls,
    onAddStudent,
    onOpenWizard,
    onOpenAutoGroup,
    onOpenQRCode,
    onPopulate100Demo,
    onAddCriterion,
    onAutoBalanceWeights,
    onApplyIPAF,
    onLaunchSimulator,
    onExportExcel,
    onExportCSV,
    onExportResultsCSV,
    onExportPDFSummary,
    onExportLMS,
    onExportPulseCSV,
    onOpenProjector,
    onOpenLivePresentation,
    onOpenEmailDispatcher,
    onOpenTeamKickoff,
    onOpenEditMode,
    onOpenLayoutLibrary,
    onOpenBranding,
    onPopulateAuditData,
    onResetReviews,
    onClearRoster,
    onBackupJSON,
    onOpenTour,
    onOpenGuideCenter,
    onOpenSettings,
    onOpenShortcuts
  ]);

  // Omni-Search filtered lists
  const omniQuery = omniSearchQuery.trim().toLowerCase();
  const searchMatchedActions = useMemo(() => {
    if (!omniQuery) return [];
    return ALL_ACTIONS_CATALOG.filter(
      (a) => a.title.toLowerCase().includes(omniQuery) || a.category.toLowerCase().includes(omniQuery)
    );
  }, [ALL_ACTIONS_CATALOG, omniQuery]);

  const searchMatchedStudents = useMemo(() => {
    if (!omniQuery || !activeClass?.students) return [];
    return activeClass.students.filter(
      (s) => s.name.toLowerCase().includes(omniQuery) || (s.groupName && s.groupName.toLowerCase().includes(omniQuery)) || (s.email && s.email.toLowerCase().includes(omniQuery))
    ).slice(0, 6);
  }, [activeClass, omniQuery]);

  const searchMatchedTeams = useMemo(() => {
    if (!omniQuery) return [];
    return uniqueTeams.filter((t) => t.toLowerCase().includes(omniQuery)).slice(0, 6);
  }, [uniqueTeams, omniQuery]);

  return (
    <div
      ref={containerRef}
      data-tour="quick-action-pill"
      style={{
        position: embedded ? 'relative' : 'fixed',
        bottom: embedded ? undefined : '20px',
        left: embedded ? undefined : '50%',
        transform: embedded ? undefined : 'translateX(-50%)',
        zIndex: embedded ? 10 : 1050,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'inherit',
        pointerEvents: 'auto',
        width: embedded ? '100%' : undefined
      }}
    >
      {/* EXPANDED CONTROL CENTER DOCK (Crisp, solid surface with no blur artifacts) */}
      {isExpanded && (
        <div
          className="quick-action-dock-container"
          style={{
            position: 'fixed',
            bottom: '76px',
            left: 0,
            right: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 'min(860px, calc(100vw - 28px))',
            maxHeight: 'min(680px, calc(100vh - 96px))',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 24px 60px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1250,
            pointerEvents: 'auto',
            transform: 'none'
          }}
        >
          {/* Top Ambient Header */}
          <div
            style={{
              borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(20, 184, 166, 0.06) 100%), var(--bg-app)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Row 1: Header Branding & Minimalist Action Controls */}
            <div
              style={{
                padding: '0.8rem 1.15rem 0.65rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'nowrap'
              }}
            >
              {/* Left: Branding, Title & Live Telemetry Snippet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 12px rgba(99, 102, 241, 0.22)',
                    flexShrink: 0
                  }}
                >
                  <Compass size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)', letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>
                      Quick Action Center
                    </span>
                    <FeatureInfoButton featureId="quick-action-pill" size="sm" tooltipText="Master Operations & Telemetry Control Center" />
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.38rem',
                        borderRadius: '5px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0
                      }}
                      title="Shortcut key: Q (Toggle anytime)"
                    >
                      <Keyboard size={10} /> Q
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '2px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: completionPct >= 80 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : 'var(--primary)',
                        boxShadow: completionPct >= 80 ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(99, 102, 241, 0.5)',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{activeClass.name}</strong> ({totalStudents} students • {teamsCount} teams)
                    </span>
                    <span style={{ color: 'var(--border-color)', flexShrink: 0 }}>•</span>
                    <span style={{ color: completionPct >= 80 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : 'var(--text-primary)', fontWeight: 700, flexShrink: 0 }}>
                      {submittedStudents}/{totalStudents} submitted ({completionPct}%)
                    </span>
                    {!isWeightBalanced && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.05rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        Weights: {totalWeight}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Sleek Action Controls & Utility Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                {/* 1. Ticker Toggle Chip */}
                <button
                  type="button"
                  onClick={toggleTelemetry}
                  title={showTelemetry ? 'Bottom status ticker ON (Click to turn off)' : 'Bottom status ticker OFF (Click to turn on)'}
                  style={{
                    height: '28px',
                    padding: '0 0.6rem',
                    borderRadius: '7px',
                    border: showTelemetry ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                    backgroundColor: showTelemetry ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                    color: showTelemetry ? '#059669' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Activity size={12} className={showTelemetry ? 'text-teal' : ''} />
                  <span>Ticker</span>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      padding: '0.04rem 0.3rem',
                      borderRadius: '4px',
                      backgroundColor: showTelemetry ? 'rgba(16, 185, 129, 0.22)' : 'var(--bg-app)',
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
                    height: '28px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '7px',
                    padding: '1px',
                    gap: '1px'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleMasterExpandAll}
                    title="Expand all foldable cards across dashboard"
                    style={{
                      height: '24px',
                      padding: '0 0.5rem',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronsDown size={12} />
                    <span>Expand</span>
                  </button>
                  <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }} />
                  <button
                    type="button"
                    onClick={handleMasterCollapseAll}
                    title="Collapse all foldable cards across dashboard"
                    style={{
                      height: '24px',
                      padding: '0 0.5rem',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronsUp size={12} />
                    <span>Collapse</span>
                  </button>
                </div>

                <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.15rem' }} />

                {/* 3. Global Search Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenSearch();
                  }}
                  title="Search commands & actions (Ctrl+K or ⌘K)"
                  style={{
                    height: '28px',
                    padding: '0 0.55rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Search size={12} className="text-primary" />
                  <kbd style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.04rem 0.3rem', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    ⌘K
                  </kbd>
                </button>

                {/* 4. Theme Toggle */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title="Toggle theme (Light / Dark)"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
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
                  {themeMode === 'dark' ? <Sun size={13} className="text-amber" /> : <Moon size={13} />}
                </button>

                {/* 5. Shortcuts Cheat Sheet */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenShortcuts();
                  }}
                  title="Keyboard Shortcuts Cheat Sheet (?)"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
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
                  <Keyboard size={13} />
                </button>

                {/* 6. Close Dock */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Close Quick Action Center (Esc or Q)"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
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
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>

            {/* Row 2: Universal Omni-Search Bar */}
            <div style={{ padding: '0 1.15rem 0.65rem 1.15rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: omniSearchQuery ? 'var(--primary)' : 'var(--text-muted)',
                    pointerEvents: 'none',
                    transition: 'color 0.15s ease'
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search actions, modules, students, teams, or shortcuts..."
                  value={omniSearchQuery}
                  onChange={(e) => setOmniSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '35px',
                    padding: '0 2.2rem 0 2.45rem',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                />
                {omniSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOmniSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    title="Clear search"
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <kbd
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.08rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        fontFamily: 'inherit'
                      }}
                      title="Press / to focus search"
                    >
                      /
                    </kbd>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Segmented Navigation Tabs */}
            <div style={{ padding: '0 1.15rem 0.65rem 1.15rem', display: 'flex', alignItems: 'center' }}>
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
                  onClick={() => setDockTab('cockpit')}
                  style={{
                    flex: 1,
                    padding: '0.38rem 0.6rem',
                    fontSize: '0.76rem',
                    fontWeight: dockTab === 'cockpit' ? 800 : 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dockTab === 'cockpit' ? 'var(--primary)' : 'transparent',
                    color: dockTab === 'cockpit' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.18s ease',
                    boxShadow: dockTab === 'cockpit' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  <Gauge size={13} />
                  <span>Cockpit &amp; Ops</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      backgroundColor: dockTab === 'cockpit' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-app)',
                      color: dockTab === 'cockpit' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800
                    }}
                  >
                    {completionPct}%
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
                  <span>Tools Catalog</span>
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
                    {ALL_ACTIONS_CATALOG.length}
                  </span>
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
                  <span>Modules &amp; Dock</span>
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
                  onClick={() => setDockTab('profiles')}
                  style={{
                    flex: 1,
                    padding: '0.38rem 0.6rem',
                    fontSize: '0.76rem',
                    fontWeight: dockTab === 'profiles' ? 800 : 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dockTab === 'profiles' ? 'var(--primary)' : 'transparent',
                    color: dockTab === 'profiles' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.18s ease',
                    boxShadow: dockTab === 'profiles' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  <Layers size={13} />
                  <span>Views &amp; Config</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '9999px',
                      backgroundColor: dockTab === 'profiles' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-app)',
                      color: dockTab === 'profiles' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800
                    }}
                  >
                    {customProfiles.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dock Body Content */}
          <div
            style={{
              padding: '0.9rem 1rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            {/* OMNI-SEARCH RESULTS (Shown whenever omniQuery is active) */}
            {omniQuery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Search size={13} />
                  <span>Search Results for "{omniQuery}"</span>
                </div>

                {/* Matched Actions */}
                {searchMatchedActions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Quick Actions ({searchMatchedActions.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.45rem' }}>
                      {searchMatchedActions.map((act) => {
                        const IconComp = act.icon;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={act.action}
                            className="quick-tool-card"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '9px',
                              backgroundColor: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconComp size={13} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {act.title}
                                </div>
                                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{act.category}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                              {act.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matched Students */}
                {searchMatchedStudents.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Enrolled Students ({searchMatchedStudents.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.45rem' }}>
                      {searchMatchedStudents.map((st) => (
                        <div
                          key={st.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: st.submitted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: st.submitted ? '#059669' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                              {st.name.charAt(0)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.name}
                              </div>
                              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{st.groupName || 'Unassigned'} • {st.submitted ? 'Submitted' : 'Pending'}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsExpanded(false);
                              if (onLaunchStudentSimulator) {
                                onLaunchStudentSimulator(st);
                              } else {
                                onLaunchSimulator();
                              }
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.65rem', height: '24px', padding: '0 0.45rem', gap: '0.2rem' }}
                            title="Launch simulator as this student"
                          >
                            <Smartphone size={11} /> Simulate
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Teams */}
                {searchMatchedTeams.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Classroom Teams ({searchMatchedTeams.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {searchMatchedTeams.map((team) => (
                        <button
                          key={team}
                          type="button"
                          onClick={() => {
                            setIsExpanded(false);
                            if (onSelectTeamFilter) onSelectTeamFilter(team);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.6rem', gap: '0.3rem' }}
                        >
                          <Users size={12} className="text-teal" />
                          <span>{team}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            ({activeClass.students.filter(s => s.groupName === team).length})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchMatchedActions.length === 0 && searchMatchedStudents.length === 0 && searchMatchedTeams.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No exact actions or records found for "{omniQuery}". Try browsing the tabs below.
                  </div>
                )}
                <div style={{ borderBottom: '1px dashed var(--border-color)', margin: '0.4rem 0' }} />
              </div>
            )}

            {/* TAB 1: COCKPIT & LIVE OPS */}
            {dockTab === 'cockpit' && !omniQuery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* 0. Intelligent Autonomous Readiness & Health Engine */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: !evalControls.unlockMainPeerReview
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : completionPct === 100
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    background: !evalControls.unlockMainPeerReview
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, var(--bg-app) 100%)'
                      : completionPct === 100
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-app) 100%)'
                      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, var(--bg-app) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: !evalControls.unlockMainPeerReview
                            ? 'rgba(239, 68, 68, 0.15)'
                            : completionPct === 100
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(99, 102, 241, 0.15)',
                          color: !evalControls.unlockMainPeerReview ? '#dc2626' : completionPct === 100 ? '#059669' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Zap size={14} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Ops Intelligence &amp; Readiness
                          </span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '0.08rem 0.45rem',
                              borderRadius: '9999px',
                              backgroundColor: !evalControls.unlockMainPeerReview
                                ? 'rgba(239, 68, 68, 0.15)'
                                : completionPct === 100
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(99, 102, 241, 0.15)',
                              color: !evalControls.unlockMainPeerReview
                                ? '#dc2626'
                                : completionPct === 100
                                ? '#059669'
                                : 'var(--primary)'
                            }}
                          >
                            {!evalControls.unlockMainPeerReview
                              ? 'Locked Stage'
                              : completionPct === 100
                              ? 'All 100% Submitted'
                              : `Round Active (${completionPct}%)`}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {!evalControls.unlockMainPeerReview
                            ? `Cohort setup ready with ${totalStudents} students in ${teamsCount} teams • Submissions locked`
                            : completionPct === 100
                            ? `Evaluation cycle complete • All ${totalStudents} students submitted`
                            : `${submittedStudents} submitted • ${pendingStudents} pending evaluations • Accepting student reviews`}
                        </div>
                      </div>
                    </div>

                    {/* Contextual 1-Click Smart Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {!evalControls.unlockMainPeerReview ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateEvaluationControls) {
                              onUpdateEvaluationControls({ unlockMainPeerReview: true });
                            } else if (onOpenEvaluationControls) {
                              onOpenEvaluationControls();
                            }
                            if (onToast) onToast('Round unlocked — students can now submit reviews', 'success');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
                          title="Unlock submissions and allow students to review peers"
                        >
                          <Unlock size={12} />
                          <span>Launch &amp; Unlock Round</span>
                        </button>
                      ) : completionPct === 100 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsExpanded(false);
                            onNavigateTab('results');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
                        >
                          <Award size={12} />
                          <span>View Results Matrix</span>
                        </button>
                      ) : (
                        <>
                          {onCopyJoinLink && (
                            <button
                              type="button"
                              onClick={() => {
                                onCopyJoinLink();
                                setCopiedJoinLinkState(true);
                                setTimeout(() => setCopiedJoinLinkState(false), 2000);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.55rem', gap: '0.3rem', fontWeight: 700 }}
                              title="Copy student evaluation link"
                            >
                              {copiedJoinLinkState ? <Check size={11} className="text-teal" /> : <Link size={11} />}
                              <span>{copiedJoinLinkState ? 'Copied Link' : 'Copy Join Link'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsExpanded(false);
                              onOpenEmailDispatcher();
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.55rem', gap: '0.3rem' }}
                            title="Send review reminders to unsubmitted students"
                          >
                            <Mail size={11} className="text-primary" />
                            <span>Notify Pending</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic Health Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.2rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: unassignedStudents.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        color: unassignedStudents.length > 0 ? '#b45309' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {unassignedStudents.length > 0 ? (
                        <>
                          <AlertTriangle size={11} className="text-amber" />
                          <span>{unassignedStudents.length} Unassigned Students</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsExpanded(false);
                              onOpenAutoGroup();
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#b45309',
                              fontWeight: 800,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: '0.64rem'
                            }}
                          >
                            AutoGroup
                          </button>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={11} className="text-teal" />
                          <span>{totalStudents} Students in {teamsCount} Teams</span>
                        </>
                      )}
                    </span>

                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: !isWeightBalanced ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        color: !isWeightBalanced ? '#b45309' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {!isWeightBalanced ? (
                        <>
                          <AlertTriangle size={11} className="text-amber" />
                          <span>Weights: {totalWeight}%</span>
                          <button
                            type="button"
                            onClick={onAutoBalanceWeights}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#b45309',
                              fontWeight: 800,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: '0.64rem'
                            }}
                          >
                            Balance 100%
                          </button>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={11} className="text-teal" />
                          <span>Rubric: 100% Balanced ({criteriaCount} criteria)</span>
                        </>
                      )}
                    </span>

                    {submittedStudents > 0 && (
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: anomalyCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                          color: anomalyCount > 0 ? '#b45309' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {anomalyCount > 0 ? (
                          <>
                            <AlertTriangle size={11} className="text-amber" />
                            <span>{anomalyCount} Flagged Anomalies</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={11} className="text-teal" />
                            <span>0 Anomalies Detected</span>
                          </>
                        )}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      Scale: {activeClass?.scaleMax ? `Out of ${activeClass.scaleMax}` : 'Raw Sum'}
                    </span>
                  </div>
                </div>

                {/* 1. Live Cohort Telemetry Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: '200px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
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
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Classroom Cohort</div>
                        <select
                          value={activeClass.id}
                          onChange={(e) => onSelectClass(e.target.value)}
                          style={{
                            fontSize: '0.86rem',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleCopyClassId}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.55rem', gap: '0.3rem' }}
                        title="Copy Classroom ID code"
                      >
                        {copiedClassId ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                        <span>{copiedClassId ? 'Copied' : `ID: ${activeClass.id.substring(0, 8)}...`}</span>
                      </button>

                      {onCopyJoinLink && (
                        <button
                          type="button"
                          onClick={() => {
                            onCopyJoinLink();
                            setCopiedJoinLinkState(true);
                            setTimeout(() => setCopiedJoinLinkState(false), 2000);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.55rem', gap: '0.3rem' }}
                          title="Copy student self-enrollment URL"
                        >
                          {copiedJoinLinkState ? <Check size={12} className="text-teal" /> : <Link size={12} />}
                          <span>{copiedJoinLinkState ? 'Copied URL' : 'Join Link'}</span>
                        </button>
                      )}

                      {/* Productivity cohort actions */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenEmailDispatcher();
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.45rem', gap: '0.25rem' }}
                        title="Open Email Dispatcher"
                      >
                        <Mail size={12} />
                        <span>Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenQRCode();
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.45rem', gap: '0.25rem' }}
                        title="Display Student Enrollment QR Code"
                      >
                        <QrCode size={12} />
                        <span>QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onNewClass();
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
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
                          style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.45rem' }}
                          title="Delete Classroom"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submission Rate Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Round Completion: <strong>{submittedStudents} of {totalStudents}</strong> students evaluated
                      </span>
                      <span style={{ color: completionPct >= 80 ? '#059669' : 'var(--primary)' }}>
                        {completionPct}% Complete ({pendingStudents} pending)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${completionPct}%`,
                          height: '100%',
                          background: completionPct >= 80 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #6366f1 0%, #0d9488 100%)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Cohort Quick Telemetry Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.1rem' }}>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Enrolled: <strong style={{ color: 'var(--text-primary)' }}>{totalStudents}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Teams: <strong style={{ color: 'var(--text-primary)' }}>{teamsCount}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Submitted: <strong style={{ color: '#059669' }}>{submittedStudents}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Pending: <strong style={{ color: pendingStudents > 0 ? '#d97706' : '#059669' }}>{pendingStudents}</strong>
                    </span>
                    {activePulseCount > 0 && (
                      <>
                        <span style={{ color: 'var(--border-color)' }}>•</span>
                        <span style={{ fontSize: '0.64rem', color: '#0d9488', fontWeight: 700 }}>
                          Pulse Active ({activePulseCount})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Live Evaluation Permissions & Round Lock Controls */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      In-Place Evaluation Round Permissions
                    </div>
                    {onUpdateEvaluationControls && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>Modes:</span>
                        <button
                          type="button"
                          onClick={() => applyPermissionPreset('standard')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.62rem', height: '22px', padding: '0 0.4rem' }}
                          title="Standard: Unlocked, Peer Feedback ON, Praise Tags ON, Self-Review OFF"
                        >
                          Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPermissionPreset('formative')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.62rem', height: '22px', padding: '0 0.4rem' }}
                          title="Formative 360°: Self-Review ON, Peer Feedback ON, Praise Tags ON"
                        >
                          360° Formative
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPermissionPreset('strict')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.62rem', height: '22px', padding: '0 0.4rem' }}
                          title="Strict Exam: Peer Scores only, No Comments, No Praise"
                        >
                          Strict Exam
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '0.55rem' }}>
                    {/* Switch 1: Round Submissions Lock */}
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-app)',
                        border: !evalControls.unlockMainPeerReview ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>Submission Cycle</span>
                        <div
                          onClick={() => {
                            if (onUpdateEvaluationControls) {
                              onUpdateEvaluationControls({ unlockMainPeerReview: !evalControls.unlockMainPeerReview });
                            } else if (onOpenEvaluationControls) {
                              onOpenEvaluationControls();
                            }
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Click switch to toggle"
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '16px',
                              borderRadius: '9999px',
                              backgroundColor: evalControls.unlockMainPeerReview ? '#10b981' : '#ef4444',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: evalControls.unlockMainPeerReview ? '16px' : '2px',
                                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {!evalControls.unlockMainPeerReview ? 'Locked (No new reviews)' : 'Open (Accepting reviews)'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateEvaluationControls) {
                            onUpdateEvaluationControls({ unlockMainPeerReview: !evalControls.unlockMainPeerReview });
                          } else if (onOpenEvaluationControls) {
                            onOpenEvaluationControls();
                          }
                        }}
                        style={{
                          marginTop: '0.2rem',
                          height: '24px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: !evalControls.unlockMainPeerReview ? '#10b981' : '#ef4444',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {!evalControls.unlockMainPeerReview ? <Unlock size={11} /> : <Lock size={11} />}
                        <span>{!evalControls.unlockMainPeerReview ? 'Unlock Submissions' : 'Lock Submissions'}</span>
                      </button>
                    </div>

                    {/* Switch 2: Student Self-Review */}
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>Student Self-Review</span>
                        <div
                          onClick={() => {
                            if (onUpdateEvaluationControls) {
                              onUpdateEvaluationControls({ allowSelfReview: !evalControls.allowSelfReview });
                            }
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Click switch to toggle"
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '16px',
                              borderRadius: '9999px',
                              backgroundColor: evalControls.allowSelfReview ? 'var(--primary)' : 'var(--border-color)',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: evalControls.allowSelfReview ? '16px' : '2px',
                                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {evalControls.allowSelfReview ? 'Allowed (Students rate selves)' : 'Disabled (Peer-only)'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateEvaluationControls) {
                            onUpdateEvaluationControls({ allowSelfReview: !evalControls.allowSelfReview });
                          }
                        }}
                        style={{
                          marginTop: '0.2rem',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: evalControls.allowSelfReview ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                          color: evalControls.allowSelfReview ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {evalControls.allowSelfReview ? 'Disable Self-Review' : 'Allow Self-Review'}
                      </button>
                    </div>

                    {/* Switch 3: Peer Written Comments */}
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>Constructive Feedback</span>
                        <div
                          onClick={() => {
                            if (onUpdateEvaluationControls) {
                              onUpdateEvaluationControls({ showGrowthSuggestions: !evalControls.showGrowthSuggestions });
                            }
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Click switch to toggle"
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '16px',
                              borderRadius: '9999px',
                              backgroundColor: evalControls.showGrowthSuggestions ? '#0d9488' : 'var(--border-color)',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: evalControls.showGrowthSuggestions ? '16px' : '2px',
                                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {evalControls.showGrowthSuggestions ? 'Enabled (Suggestions prompt)' : 'Disabled (Scores only)'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateEvaluationControls) {
                            onUpdateEvaluationControls({ showGrowthSuggestions: !evalControls.showGrowthSuggestions });
                          }
                        }}
                        style={{
                          marginTop: '0.2rem',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: evalControls.showGrowthSuggestions ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-surface)',
                          color: evalControls.showGrowthSuggestions ? '#0d9488' : 'var(--text-muted)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {evalControls.showGrowthSuggestions ? 'Disable Suggestions' : 'Enable Suggestions'}
                      </button>
                    </div>

                    {/* Switch 4: Strengths & Praise Tags */}
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>Strengths &amp; Praise Tags</span>
                        <div
                          onClick={() => {
                            if (onUpdateEvaluationControls) {
                              onUpdateEvaluationControls({ showPraiseTags: !evalControls.showPraiseTags });
                            }
                          }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Click switch to toggle"
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '16px',
                              borderRadius: '9999px',
                              backgroundColor: evalControls.showPraiseTags ? 'var(--primary)' : 'var(--border-color)',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: evalControls.showPraiseTags ? '16px' : '2px',
                                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {evalControls.showPraiseTags ? 'Active (Praise badges shown)' : 'Off (Scores only)'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateEvaluationControls) {
                            onUpdateEvaluationControls({ showPraiseTags: !evalControls.showPraiseTags });
                          }
                        }}
                        style={{
                          marginTop: '0.2rem',
                          height: '24px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: evalControls.showPraiseTags ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                          color: evalControls.showPraiseTags ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {evalControls.showPraiseTags ? 'Disable Praise Tags' : 'Enable Praise Tags'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Rubric Weights & Presets Cockpit */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Sliders size={15} className="text-primary" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rubric Criteria &amp; Weights ({criteriaCount} Criteria)
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          padding: '0.06rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: isWeightBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                          color: isWeightBalanced ? '#059669' : '#b45309'
                        }}
                      >
                        Total: {totalWeight}% {isWeightBalanced ? '(Balanced)' : '(Not 100%)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={onAutoBalanceWeights}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.55rem', gap: '0.25rem', fontWeight: 700 }}
                        title="Equalize criterion weights to exactly 100%"
                      >
                        <CheckCircle size={11} className="text-teal" /> Balance 100%
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyRubricPreset) {
                            onApplyRubricPreset('ipaf_research_synthesized');
                          } else {
                            onApplyIPAF();
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.55rem', gap: '0.25rem' }}
                        title="Apply Integrated Peer Assessment Framework (IPAF) preset"
                      >
                        <BookOpen size={11} className="text-primary" /> IPAF Preset
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onAddCriterion();
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.7rem', height: '26px', padding: '0 0.55rem', gap: '0.25rem', fontWeight: 700 }}
                      >
                        <Plus size={12} /> Add Criterion
                      </button>
                    </div>
                  </div>

                  {/* Visual Weight Distribution Ribbon */}
                  {criteriaCount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          width: '100%',
                          height: '7px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--border-color)'
                        }}
                      >
                        {activeClass.fields.map((field, idx) => {
                          const pct = Math.max(0, Math.min(100, Number(field.weight) || 0));
                          const color = ['#6366f1', '#0d9488', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f97316'][idx % 8];
                          return (
                            <div
                              key={field.id || idx}
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: color,
                                transition: 'width 0.3s ease'
                              }}
                              title={`${field.name || `Criterion ${idx + 1}`}: ${pct}% weight`}
                            />
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        {activeClass.fields.map((field, idx) => {
                          const color = ['#6366f1', '#0d9488', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f97316'][idx % 8];
                          return (
                            <span key={field.id || idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{field.name || `Crit ${idx + 1}`}</span>
                              <strong style={{ color: 'var(--text-primary)' }}>({field.weight}%)</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Target Scale Selector Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.1rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Grade Scale:</span>
                    {[
                      { scale: 0, label: 'Raw Sum' },
                      { scale: 20, label: 'Out of 20' },
                      { scale: 100, label: 'Out of 100%' },
                      { scale: 4, label: '4.0 GPA' }
                    ].map((sc) => {
                      const isCurrent = (activeClass?.scaleMax ?? 0) === sc.scale;
                      return (
                        <button
                          key={sc.scale}
                          type="button"
                          onClick={() => onSetTargetScale && onSetTargetScale(sc.scale)}
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '5px',
                            border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isCurrent ? 'var(--primary-light)' : 'var(--bg-surface)',
                            color: isCurrent ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Student Simulator & Mobile Portal Quick-Launcher */}
                {totalStudents > 0 && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: '220px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Smartphone size={15} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Student Simulator &amp; Portal Preview
                          </span>
                          {selectedSimStudent && (
                            <span
                              style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '0.04rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: selectedSimStudent.submitted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: selectedSimStudent.submitted ? '#059669' : '#d97706'
                              }}
                            >
                              {selectedSimStudent.submitted ? 'Submitted' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          Experience the exact student mobile evaluation view
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <select
                        value={selectedSimStudentId}
                        onChange={(e) => setSelectedSimStudentId(e.target.value)}
                        style={{
                          fontSize: '0.74rem',
                          height: '28px',
                          padding: '0 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          maxWidth: '190px'
                        }}
                      >
                        {activeClass.students.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.groupName || 'No Team'})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleLaunchRandomSimulator}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.55rem', gap: '0.25rem' }}
                        title="Simulate a random student in cohort"
                      >
                        <Shuffle size={12} className="text-amber" />
                        <span>Random</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targetStudent = activeClass.students.find((s) => s.id === selectedSimStudentId) || activeClass.students[0];
                          setIsExpanded(false);
                          if (onLaunchStudentSimulator && targetStudent) {
                            onLaunchStudentSimulator(targetStudent);
                          } else {
                            onLaunchSimulator();
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
                      >
                        <Smartphone size={12} />
                        <span>Launch Simulator</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TOOLS CATALOG (ORGANIZED INTO 5 FUNCTIONAL ZONES) */}
            {dockTab === 'tools' && !omniQuery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Zone 1: Roster, Teams & Enrollment */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    1. Enrollment, Roster &amp; Teams Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onAddStudent();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Plus size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>+ Enroll Student</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Single student dialog</div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <Upload size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Import Wizard</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>CSV / Excel batch roster</div>
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
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Users size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>AutoGroup Studio</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Balanced team partitioner</div>
                      </div>
                    </button>

                    {onOpenTeamKickoff && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenTeamKickoff();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                          <UserCheck size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Agreements &amp; Roles</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>5-min kickoff studio</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenQRCode();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <QrCode size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Join QR &amp; Link</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Student self-enrollment</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onPopulate100Demo();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', flexShrink: 0 }}>
                        <Sparkles size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>100 Demo Cohort</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>35+ countries diversity</div>
                      </div>
                    </button>

                    {onClearRoster && activeClass.students.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onClearRoster();
                        }}
                        className="quick-tool-card text-rose"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#dc2626' }}>Clear Roster</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Remove {activeClass.students.length} students</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone 2: Rubrics, Grading & Simulation */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    2. Rubrics, Grading &amp; Simulation
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onAddCriterion();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Plus size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>+ Add Criterion</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>New evaluation metric</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onAutoBalanceWeights}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <CheckCircle size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auto-Balance 100%</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Equalize criterion weights</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onApplyIPAF}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                        <BookOpen size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Apply IPAF Rubric</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Research-backed standard</div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                          <Sliders size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Base Marks</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Base scores &amp; multipliers</div>
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
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <Smartphone size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Simulator</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Mobile student portal view</div>
                      </div>
                    </button>

                    {onOpenLivePresentation && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenLivePresentation();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                          <Presentation size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Presentation</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Real-time team pitch scoring</div>
                        </div>
                      </button>
                    )}

                    {onOpenEvaluationControls && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenEvaluationControls();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                          <SlidersHorizontal size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Form Permissions</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Questions &amp; praise tags</div>
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
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Activity size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Health Pulse</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>30s check-in &amp; sparklines</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Zone 3: Analytics, Exports & Audits */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    3. Analytics, Exports &amp; Audit Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onExportExcel();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                        <FileSpreadsheet size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Excel</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Multi-tab gradebook</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onExportCSV();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                        <Download size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Roster CSV</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Plain roster sheet</div>
                      </div>
                    </button>

                    {onExportResultsCSV && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onExportResultsCSV();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                          <BarChart2 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Results CSV</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>WebPA calibrated grades</div>
                        </div>
                      </button>
                    )}

                    {onExportPDFSummary && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onExportPDFSummary();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                          <FileText size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export PDF Report</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Evaluation dossier PDF</div>
                        </div>
                      </button>
                    )}

                    {onExportLMS && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onExportLMS('canvas');
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
                          <Share2 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Canvas LMS Sync</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Direct gradebook import</div>
                        </div>
                      </button>
                    )}

                    {onPopulateAuditData && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onPopulateAuditData();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                          <Sparkles size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Simulate Reviews</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Complete cohort test ratings</div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                          <RotateCcw size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#dc2626' }}>Reset All Reviews</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Wipe {activeClass.reviews.length} submissions</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone 4: Presentation, Audiences & Delivery */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    4. Presentation, Audiences &amp; Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenProjector();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                        <Maximize2 size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projector Mode (P)</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Auditorium fullscreen</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenEmailDispatcher();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                        <Mail size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email Links</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Brevo / EmailJS dispatch</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenTour();
                      }}
                      className="quick-tool-card"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                    >
                      <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                        <Compass size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Interactive Tour</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Guided product walkthrough</div>
                      </div>
                    </button>

                    {onOpenSnapshots && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenSnapshots();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                          <History size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Snapshots</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Version history &amp; rollback</div>
                        </div>
                      </button>
                    )}

                    {onOpenArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenArchive();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(107, 114, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', flexShrink: 0 }}>
                          <Archive size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Archive Manager</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Past cohorts &amp; restore</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone 5: Layouts, Customization & System */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    5. Layouts, Customization &amp; System
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {onOpenEditMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenEditMode();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <Edit3 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Layout Edit Mode</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Visual in-place drag &amp; toggles</div>
                        </div>
                      </button>
                    )}

                    {onOpenLayoutLibrary && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenLayoutLibrary();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', flexShrink: 0 }}>
                          <Layers size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Layout Library</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>7 Curated professor views</div>
                        </div>
                      </button>
                    )}

                    {onOpenBranding && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onOpenBranding();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                          <Building2 size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Institutional Branding</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Logo, emblem &amp; custom title</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        if (!featureToggles.showRetractableDisplay) {
                          onToggleFeature('showRetractableDisplay', true);
                        }
                        window.dispatchEvent(new CustomEvent('peerlens_toggle_retractable_display'));
                      }}
                      className="quick-tool-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        background: featureToggles.showRetractableDisplay
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)'
                          : undefined
                      }}
                    >
                      <div
                        className="tool-icon-wrapper"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: featureToggles.showRetractableDisplay ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: featureToggles.showRetractableDisplay ? '#059669' : 'var(--primary)',
                          flexShrink: 0
                        }}
                      >
                        <Pin size={14} />
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Retractable Dock</div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          {featureToggles.showRetractableDisplay ? 'Active • Click to toggle' : 'Enable floating dock'}
                        </div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                          <Database size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Backup JSON</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Snapshot archive download</div>
                        </div>
                      </button>
                    )}

                    {onResetLayout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          onResetLayout();
                        }}
                        className="quick-tool-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px' }}
                      >
                        <div className="tool-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                          <RotateCcw size={14} />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reset Layout</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Restore default configuration</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MODULE VISIBILITY & RETRACTABLE DOCK PINNING */}
            {dockTab === 'modules' && !omniQuery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Presets Header Strip */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Interface Density &amp; Visibility Presets
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Active: <strong>{activeModuleCount} of {allModuleKeys.length} modules visible ({densityPercentage}%)</strong> • Dock: <strong>{dockPinnedIds.length} pinned</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onApplyPreset('minimal')}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        fontWeight: 700,
                        backgroundColor: activePreset === 'minimal' ? 'rgba(245, 158, 11, 0.16)' : undefined,
                        borderColor: activePreset === 'minimal' ? '#f59e0b' : undefined,
                        color: activePreset === 'minimal' ? '#b45309' : undefined
                      }}
                    >
                      Essentials (30%)
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplyPreset('standard')}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        fontWeight: 700,
                        backgroundColor: activePreset === 'standard' ? 'rgba(99, 102, 241, 0.16)' : undefined,
                        borderColor: activePreset === 'standard' ? 'var(--primary)' : undefined,
                        color: activePreset === 'standard' ? 'var(--primary)' : undefined
                      }}
                    >
                      Recommended (60%)
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplyPreset('full')}
                      className="btn btn-teal btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        fontWeight: 700,
                        backgroundColor: activePreset === 'full' ? 'rgba(16, 185, 129, 0.22)' : undefined,
                        borderColor: activePreset === 'full' ? '#10b981' : undefined
                      }}
                    >
                      Show All (100%)
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplyPreset('none')}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        fontWeight: 700,
                        backgroundColor: activePreset === 'none' ? 'rgba(239, 68, 68, 0.16)' : undefined,
                        borderColor: activePreset === 'none' ? '#ef4444' : undefined,
                        color: activePreset === 'none' ? '#ef4444' : undefined
                      }}
                    >
                      <EyeOff size={11} style={{ marginRight: '3px' }} /> Clean Canvas
                    </button>
                  </div>
                </div>

                {/* Filter Sub-Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(
                    [
                      { id: 'all', label: 'All Modules', count: allModuleKeys.length },
                      { id: 'dock', label: 'In Workspace Dock', count: dockPinnedIds.length },
                      { id: 'pinned', label: 'Quick Favorites', count: pinnedItems.length },
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
                        {tab.id === 'dock' && (
                          <Pin size={11} className="text-teal" />
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

                {/* Categorized Modules List with Canvas Switch & Dock Pin Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredModuleSections.map((sec) => {
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
                        <div
                          style={{
                            padding: '0.55rem 0.8rem',
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

                        <div style={{ padding: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {sec.items.map((item) => {
                            const isVisible = !!featureToggles[item.key];
                            const isFavorite = pinnedKeys.includes(item.key);
                            const isInDock = dockPinnedIds.includes(item.key);

                            return (
                              <div
                                key={item.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.65rem',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '8px',
                                  backgroundColor: isVisible ? 'var(--bg-surface)' : 'transparent',
                                  border: isVisible ? '1px solid var(--border-color)' : '1px solid transparent',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                                  {/* Favorite Star */}
                                  <button
                                    type="button"
                                    onClick={(e) => togglePin(item.key, e)}
                                    title={isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      color: isFavorite ? '#f59e0b' : 'var(--text-muted)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Star size={13} fill={isFavorite ? '#f59e0b' : 'none'} />
                                  </button>

                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.76rem', fontWeight: isVisible ? 750 : 500, color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.label}
                                    </div>
                                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.desc}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                  {/* Workspace Retractable Dock Pin Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => togglePinModule(item.key)}
                                    title={isInDock ? 'Unpin from Retractable Workspace Dock' : 'Pin to Retractable Workspace Dock'}
                                    style={{
                                      height: '24px',
                                      padding: '0 0.45rem',
                                      borderRadius: '6px',
                                      border: isInDock ? '1px solid #10b981' : '1px solid var(--border-color)',
                                      backgroundColor: isInDock ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-app)',
                                      color: isInDock ? '#059669' : 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.64rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                  >
                                    <Pin size={10} />
                                    <span>{isInDock ? 'Docked' : 'Dock'}</span>
                                  </button>

                                  {/* Canvas Visibility Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => onToggleFeature(item.key, !isVisible)}
                                    style={{
                                      height: '24px',
                                      padding: '0 0.55rem',
                                      borderRadius: '6px',
                                      border: isVisible ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                      backgroundColor: isVisible ? 'var(--primary-light)' : 'var(--bg-app)',
                                      color: isVisible ? 'var(--primary)' : 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                                    <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: VIEWS & WORKSPACE CONFIG */}
            {dockTab === 'profiles' && !omniQuery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Custom Profiles Manager */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Saved Custom View Profiles ({customProfiles.length})
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        Save your active modules and hotkey states to restore anytime
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingProfile(true)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.6rem', gap: '0.3rem', fontWeight: 700 }}
                    >
                      <FolderPlus size={12} /> Save Current View
                    </button>
                  </div>

                  {/* Add profile form */}
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
                        placeholder="Profile name (e.g. Midterm Evaluation Week, Presentation Day)"
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

                  {/* Saved Profiles List */}
                  {customProfiles.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.45rem' }}>
                      {customProfiles.map((prof) => (
                        <div
                          key={prof.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)'
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
                              fontSize: '0.74rem',
                              textAlign: 'left'
                            }}
                            title="Apply this layout profile"
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
                              padding: '2px',
                              color: 'var(--text-muted)'
                            }}
                            title="Delete profile"
                          >
                            <Trash2 size={12} className="text-rose" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No custom view profiles saved yet. Click "Save Current View" to store your favorite card configuration.
                    </div>
                  )}
                </div>

                {/* Global Shortcuts & Checklist Configuration */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Workspace Preferences &amp; Controls
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.4rem 0' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Global Hotkeys &amp; Keyboard Shortcuts</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Quick keys like Q (Quick Dock), P (Projector), Alt+E (Edit Mode), ? (Shortcuts)</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !shortcutsEnabled;
                        setShortcutsEnabled(next);
                        saveShortcutsEnabled(next);
                        if (onToggleShortcutsEnabled) onToggleShortcutsEnabled(next);
                        if (onToast) onToast(next ? 'Keyboard shortcuts enabled' : 'Keyboard shortcuts disabled', 'info');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.6rem', fontWeight: 700 }}
                    >
                      {shortcutsEnabled ? <CheckCircle size={12} className="text-teal" /> : null}
                      <span>{shortcutsEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--border-color)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.4rem 0' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instructor Onboarding Checklist</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Step-by-step 4-part classroom launch checklist on Home screen</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleChecklist(!showChecklist)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.6rem', fontWeight: 700 }}
                    >
                      {showChecklist ? <CheckCircle size={12} className="text-teal" /> : null}
                      <span>{showChecklist ? 'Visible' : 'Hidden'}</span>
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
          gap: '0.35rem',
          transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Optional Ambient Live Status Ticker (Can be toggled in expanded dock) */}
        {showTelemetry && activeClass ? (
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
              title={`Active: ${activeClass.name} • ${totalStudents} students • ${submittedStudents}/${totalStudents} submitted (${completionPct}%) • Click to open Cockpit & Ops`}
              onClick={() => {
                setIsExpanded(true);
                setDockTab('cockpit');
              }}
            >
              <span
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  backgroundColor: !evalControls.unlockMainPeerReview
                    ? '#ef4444'
                    : completionPct >= 80
                    ? '#10b981'
                    : completionPct >= 40
                    ? '#f59e0b'
                    : 'var(--primary)',
                  boxShadow: `0 0 6px ${!evalControls.unlockMainPeerReview ? '#ef4444' : completionPct >= 80 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : 'var(--primary)'}`,
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
              {!evalControls.unlockMainPeerReview && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    padding: '0.04rem 0.32rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#dc2626',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                  title="Submissions locked"
                >
                  <Lock size={8} /> Locked
                </span>
              )}
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
        ) : null}

        {/* Clean Canvas (0 modules) quick restore pill */}
        {activeModuleCount === 0 && (
          <>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                height: '30px',
                padding: '0 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                fontSize: '0.72rem',
                fontWeight: 750,
                color: 'var(--accent-rose, #ef4444)'
              }}
              title="Clean Canvas mode active (all optional modules hidden). Click Restore to apply Recommended modules."
            >
              <EyeOff size={12} />
              <span>Clean Canvas</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyPreset('standard');
                }}
                style={{
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Restore Recommended modules"
              >
                Restore
              </button>
            </div>
            <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.05rem' }} />
          </>
        )}

        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setDockTab('cockpit');
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          title="Quick Search &amp; Cockpit (Ctrl+K or Q)"
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
          <span>Quick Actions</span>
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
            Q
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
            title="Section 1: Enrollment &amp; Teams"
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
            title="Section 3: Grading &amp; Analytics"
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
          title={activeModuleCount === 0 ? 'Clean Canvas mode (all optional modules hidden). Click to customize.' : `Module Visibility (${activeModuleCount} active modules)`}
          style={{
            padding: '0 0.55rem',
            height: '28px',
            borderRadius: '9999px',
            border: activeModuleCount === 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
            backgroundColor: activeModuleCount === 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-app)',
            color: activeModuleCount === 0 ? '#ef4444' : 'var(--text-primary)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease'
          }}
        >
          {activeModuleCount === 0 ? <EyeOff size={12} className="text-rose" /> : <Sliders size={12} className="text-primary" />}
          <span>{activeModuleCount === 0 ? 'Canvas' : 'Modules'}</span>
          <span
            style={{
              fontSize: '0.64rem',
              padding: '0.05rem 0.35rem',
              borderRadius: '9999px',
              backgroundColor: activeModuleCount === 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary-light)',
              color: activeModuleCount === 0 ? '#ef4444' : 'var(--primary)',
              fontWeight: 800
            }}
          >
            {activeModuleCount === 0 ? 'Clean' : activeModuleCount}
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
