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
  Activity
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import type { FeatureToggles } from '../utils/featurePreferences';

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
  onBackupJSON
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dockTab, setDockTab] = useState<'topbar' | 'modules' | 'tools'>('topbar');
  const [moduleFilter, setModuleFilter] = useState('');
  const [copiedClassId, setCopiedClassId] = useState(false);
  const [copiedJoinLinkState, setCopiedJoinLinkState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Structured module sections with icons
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
        { key: 'showCloudStatus', label: 'Cloud Sync Status Dot', desc: 'Real-time database connection badge' }
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
        { key: 'showTeamOverviewCards', label: 'Team Overview Cards Grid', desc: 'Cards summarizing each team roster' },
        { key: 'showRosterTable', label: 'Enrolled Students Roster Table', desc: 'Main tabular student roster' }
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
        { key: 'showResultsSummarySheet', label: 'Results Summary Sheet', desc: 'Tabular gradebook with WebPA factors' },
        { key: 'showWebPACalibration', label: 'WebPA Calibration Slider', desc: 'Non-linear penalty weight tuning' },
        { key: 'showExportReportButtons', label: 'Export Report Action Buttons', desc: 'LMS (Canvas, Moodle), CSV & Excel' },
        { key: 'showCompetencyRadar', label: 'Competency Radar Chart', desc: 'Multi-axis radar distribution chart' },
        { key: 'showJohariMatrix', label: 'Johari Window Matrix', desc: 'Blind spots and perception analysis' },
        { key: 'showQualitativeFeedback', label: 'Qualitative Written Comments', desc: 'Formative text comment browser' },
        { key: 'showAnomalyAudit', label: 'Anomaly & Outlier Audit', desc: 'Collusion and outlier detection' },
        { key: 'showGradebookSearchFilter', label: 'Gradebook Search & Filter', desc: 'Filter final marks by team or student' }
      ]
    }
  ], []);

  const filteredModuleSections = useMemo(() => {
    return MODULE_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) =>
          item.label.toLowerCase().includes(moduleFilter.toLowerCase()) ||
          item.desc.toLowerCase().includes(moduleFilter.toLowerCase()) ||
          sec.category.toLowerCase().includes(moduleFilter.toLowerCase())
      )
    })).filter((sec) => sec.items.length > 0);
  }, [MODULE_SECTIONS, moduleFilter]);

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
            width: 'min(720px, calc(100vw - 28px))',
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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(20, 184, 166, 0.07) 100%), var(--bg-app)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Row 1: Title, Status Chip, Quick Search, Shortcuts, Hide & Contract */}
            <div
              style={{
                padding: '0.8rem 1.15rem 0.6rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'nowrap'
              }}
            >
              {/* Left: Branding, Q Key & Class Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                    flexShrink: 0
                  }}
                >
                  <Compass size={17} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      Quick Action Center
                    </span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.48rem',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0
                      }}
                      title="Shortcut key: Q (Press Q to toggle anytime)"
                    >
                      <Keyboard size={10} /> Q
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pillPulse 2s infinite' }} />
                    <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Active: <strong style={{ color: 'var(--text-primary)' }}>{activeClass.name}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <span>{activeClass.students.length} Students</span>
                  </div>
                </div>
              </div>

              {/* Right: Search, Shortcuts, Hide & Contract (Pinned to top-right, NEVER wraps) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenSearch();
                  }}
                  title="Search commands & actions (Ctrl+K)"
                  style={{
                    height: '30px',
                    padding: '0 0.65rem 0 0.5rem',
                    borderRadius: '8px',
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
                  <Search size={13} className="text-primary" />
                  <span>Search</span>
                  <kbd style={{ fontSize: '0.62rem', padding: '0.08rem 0.3rem', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    ⌘K
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenShortcuts();
                  }}
                  title="Keyboard Shortcuts Cheat Sheet (?)"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
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

                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.1rem' }} />

                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onHidePill();
                  }}
                  title="Hide Quick Action Pill (Press Q or enable in Settings anytime)"
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0 0.55rem',
                    height: '30px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <EyeOff size={13} />
                  <span>Hide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Contract Quick Action Pill"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ChevronDown size={15} />
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

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
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
                    </div>
                  </div>

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

                {/* Instant Module Filter Input */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search module toggles by name or keyword..."
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem 0.45rem 2.1rem',
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Categorized Module Toggles Accordion List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                  })}
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
