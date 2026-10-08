import type { LucideIcon } from 'lucide-react';
import {
  Settings, BookOpen, Trash2, Maximize2, Sun, User, Search, Mail, 
  Compass, Database, Sliders, LayoutGrid, CheckSquare, QrCode, 
  Sparkles, Users, CheckCircle, Download, ShieldCheck, Clock, 
  SlidersHorizontal, Activity, Award, RefreshCw, MessageSquare, 
  Key, Zap, Edit3, Plus, Type, UserCheck, Presentation
} from 'lucide-react';
import type { FeatureToggles } from './featurePreferences';

export type ModuleCategory = 'header' | 'hub' | 'roster' | 'rubric' | 'analytics' | 'footer';
export type ModuleSlotType = 'card' | 'button' | 'bar' | 'table' | 'banner' | 'dock';

export interface ModuleItem {
  key: keyof FeatureToggles;
  title: string;
  desc: string;
  icon: LucideIcon;
  category: ModuleCategory;
  slotType: ModuleSlotType;
  defaultHeight?: number; // approximate min-height for empty placeholder slot
  parentKey?: keyof FeatureToggles;
}

export interface ModuleGroup {
  id: ModuleCategory;
  title: string;
  icon: LucideIcon;
  keys: (keyof FeatureToggles)[];
  items: ModuleItem[];
}

export const MODULE_ITEMS: ModuleItem[] = [
  // --- Header & Top Navigation ---
  {
    key: 'showClassPicker',
    title: 'Active Classroom Dropdown Selector',
    desc: 'Class dropdown on top-left to switch between active course sections.',
    icon: BookOpen,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showDeleteClassButton',
    title: 'Delete Classroom Action Icon',
    desc: 'Trash icon next to classroom name to remove the active classroom.',
    icon: Trash2,
    category: 'header',
    slotType: 'button',
    parentKey: 'showClassPicker'
  },
  {
    key: 'showNewClassButton',
    title: 'New Class (+ Class) Action Button',
    desc: 'Top-right button to create new classroom cohorts.',
    icon: Plus,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showSettingsButton',
    title: 'Workspace Settings Button',
    desc: 'Gear button in top-right to open settings & module configuration.',
    icon: Settings,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showThemeSwitcher',
    title: 'Theme Mode Switcher',
    desc: 'Compact toggle button for dark, light, or system themes.',
    icon: Sun,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showProfilePill',
    title: 'Admin Profile & Account Center Icon',
    desc: 'Top dock button to open the workspace profile selector and account center.',
    icon: User,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showProjectorButton',
    title: 'Live Classroom Projector Button',
    desc: '1-click fullscreen projector mode button for lecture screens.',
    icon: Maximize2,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showCommandSearch',
    title: 'Quick Search & Command Palette',
    desc: 'Search shortcut button to quickly filter students or trigger actions.',
    icon: Search,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showEmailButton',
    title: 'Classroom Email Center Button',
    desc: 'Dispatches secure assessment links to students via Brevo or EmailJS.',
    icon: Mail,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showGuideButton',
    title: 'Academic Guidance Center Button',
    desc: 'Opens academic guidance instructions and interactive tours.',
    icon: Compass,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showCloudStatus',
    title: 'Cloud Sync Status Indicator',
    desc: 'Minimal cloud connection icon button in top navigation bar.',
    icon: Database,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showCustomizeViewButton',
    title: 'Customize View Button',
    desc: 'Minimalist sliders button in the top navigation dock to customize visible modules.',
    icon: Sliders,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showEditModeButton',
    title: 'Interactive Layout Edit Mode Button',
    desc: 'Pencil button in the top dock to toggle interactive on-screen layout editing.',
    icon: Edit3,
    category: 'header',
    slotType: 'button'
  },
  {
    key: 'showQuickActionPill',
    title: 'Floating Quick Action Pill (Bottom Center)',
    desc: 'Contractable & expandable floating dock at the bottom of the window for instant access to top bar functions, search, modules, and tools.',
    icon: Compass,
    category: 'header',
    slotType: 'dock'
  },

  // --- Home Hub & Sub-Bar Navigation ---
  {
    key: 'showPresetsBanner',
    title: 'Interface Density & Layout Presets Card',
    desc: 'Quick preset density buttons at the top of the Interface & Modules tab.',
    icon: LayoutGrid,
    category: 'hub',
    slotType: 'banner'
  },
  {
    key: 'showHubOverviewBanner',
    title: 'Classroom Hub Overview Banner',
    desc: 'Displays the active classroom header, status badge, and shortcut hints.',
    icon: LayoutGrid,
    category: 'hub',
    slotType: 'banner'
  },
  {
    key: 'showHubOverviewStats',
    title: 'Live Metrics Snapshot Strip',
    desc: 'Live students, criteria count, and submission progress chips inside the banner.',
    icon: Sparkles,
    category: 'hub',
    slotType: 'bar',
    parentKey: 'showHubOverviewBanner'
  },
  {
    key: 'showSectionNavBreadcrumbs',
    title: 'Section Breadcrumb Trail',
    desc: 'Displays the "Class A / Section Name" trail in the section bar.',
    icon: Compass,
    category: 'hub',
    slotType: 'bar'
  },
  {
    key: 'showClassIdBadge',
    title: 'Classroom ID Copy Pill',
    desc: 'Clickable badge in the sub-bar displaying class ID for student enrollment.',
    icon: Key,
    category: 'hub',
    slotType: 'button'
  },
  {
    key: 'showEnrollmentCard',
    title: 'Hub Card: Section 1 (Enrollment & Teams)',
    desc: 'Large interactive section card on the Home Hub screen.',
    icon: Users,
    category: 'hub',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showReviewSystemCard',
    title: 'Hub Card: Section 2 (Review System)',
    desc: 'Large interactive section card on the Home Hub screen.',
    icon: Sliders,
    category: 'hub',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showGradingAnalyticsCard',
    title: 'Hub Card: Section 3 (Grading & Analytics)',
    desc: 'Large interactive section card on the Home Hub screen.',
    icon: Award,
    category: 'hub',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showHubCardMetrics',
    title: 'Hub Cards: Status & Progress Meters',
    desc: 'Readiness progress tracks and real-time student/rubric/submission metrics on Hub cards.',
    icon: Activity,
    category: 'hub',
    slotType: 'bar',
    parentKey: 'showEnrollmentCard'
  },
  {
    key: 'showHubQuickActions',
    title: 'Hub Cards: Quick Action Launch Buttons',
    desc: 'Direct 1-click shortcut buttons (+ Add Student, QR Link, VALUE Presets, etc.) on Hub cards.',
    icon: Zap,
    category: 'hub',
    slotType: 'bar',
    parentKey: 'showEnrollmentCard'
  },

  // --- Section 1: Enrollment & Teams ---
  {
    key: 'showSelfEnrollmentCard',
    title: 'Self-Enrollment QR Code & Link Card',
    desc: 'Card showing class QR code preview and 1-click student self-enrollment URL.',
    icon: QrCode,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showSelfEnrollmentQr',
    title: 'Self-Enrollment QR & URL Link Box',
    desc: 'Displays the interactive QR code preview and direct class join URL.',
    icon: QrCode,
    category: 'roster',
    slotType: 'bar',
    parentKey: 'showSelfEnrollmentCard'
  },
  {
    key: 'showSelfEnrollmentPresentationBtn',
    title: 'QR Presentation Mode Button',
    desc: 'Full-screen projector presentation button for live classroom onboarding.',
    icon: Maximize2,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showSelfEnrollmentCard'
  },
  {
    key: 'showQuickActionsCard',
    title: 'Quick Actions Card',
    desc: 'Card containing manual participant enrollment, demo roster loading, and roster reset.',
    icon: Sparkles,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showAddStudentButton',
    title: 'Add Member / Participant Button',
    desc: 'Primary button to manually enroll an individual student or participant into the active roster.',
    icon: Users,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showQuickActionsCard'
  },
  {
    key: 'showDemoSampleButton',
    title: 'Load 100 Demo Sample Button',
    desc: 'One-click action to populate the class with 100 diverse sample student records and teams.',
    icon: Sparkles,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showQuickActionsCard'
  },
  {
    key: 'showClearRosterButton',
    title: 'Clear Class Roster Button',
    desc: 'Action button to wipe the current student roster and reset team assignments.',
    icon: Trash2,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showQuickActionsCard'
  },
  {
    key: 'showImportWizardCard',
    title: 'Import & Export Hub Card',
    desc: 'Unified hub to drag-and-drop rosters from CSV/Excel/PDF/clipboard, export rosters, or download templates.',
    icon: Download,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showImportDropzone',
    title: 'Roster File Dropzone Area',
    desc: 'Interactive drag-and-drop upload zone for XLSX, PDF, CSV, and clipboard data.',
    icon: Download,
    category: 'roster',
    slotType: 'banner',
    parentKey: 'showImportWizardCard'
  },
  {
    key: 'showExportRosterBtn',
    title: 'Export Roster Action Button',
    desc: 'Exports current student roster and team assignments to CSV / Excel.',
    icon: Download,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showImportWizardCard'
  },
  {
    key: 'showDownloadTemplateBtn',
    title: 'Download Template Action Button',
    desc: 'Downloads a clean CSV/Excel template ready for student roster population.',
    icon: Download,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showImportWizardCard'
  },
  {
    key: 'showAutoGroupStudio',
    title: 'AutoGroup Algorithmic Formation Studio',
    desc: 'Automated team formation studio balancing cohorts by diversity, skill, and size.',
    icon: Users,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 120
  },
  {
    key: 'showDuplicateDetector',
    title: 'Duplicate Enrollment Warning Banner',
    desc: 'Alert banner flagging duplicate student names or emails in roster.',
    icon: ShieldCheck,
    category: 'roster',
    slotType: 'banner'
  },
  {
    key: 'showRosterTable',
    title: 'Enrolled Students Roster Table',
    desc: 'Main table listing all students, assigned teams, and individual actions.',
    icon: Users,
    category: 'roster',
    slotType: 'table',
    defaultHeight: 220
  },
  {
    key: 'showRosterSearchFilter',
    title: 'Roster Search & Team Filter Bar',
    desc: 'Search input and team filter dropdown inside the roster table toolbar.',
    icon: Search,
    category: 'roster',
    slotType: 'bar',
    parentKey: 'showRosterTable'
  },
  {
    key: 'showExportButtons',
    title: 'Roster Export Buttons (Excel & CSV)',
    desc: 'Export to Excel and CSV buttons inside the roster table toolbar.',
    icon: Download,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showRosterTable'
  },
  {
    key: 'showRosterAddStudentBtn',
    title: 'Roster Header Add Student Button',
    desc: '+ Add Student action button inside the Classroom Roster header toolbar.',
    icon: Users,
    category: 'roster',
    slotType: 'button',
    parentKey: 'showRosterTable'
  },
  {
    key: 'showBulkActionBar',
    title: 'Multi-Select Bulk Actions Toolbar',
    desc: 'Floating action bar when students are selected (move team, delete selected).',
    icon: CheckSquare,
    category: 'roster',
    slotType: 'bar',
    parentKey: 'showRosterTable'
  },
  {
    key: 'showTeamOverviewCards',
    title: 'Teams & Group Breakdown Cards',
    desc: 'Grid of team cards displaying members per team.',
    icon: Users,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 160
  },
  {
    key: 'showTeamKickoffAndRoles',
    title: 'Team Charter, Roles & Icebreaker Studio',
    desc: 'Customizable role allocator (Tech Lead, Scribe, Presenter) & tailored 5-minute multicultural team icebreaker activity generator.',
    icon: UserCheck,
    category: 'roster',
    slotType: 'card',
    defaultHeight: 120
  },

  // --- Section 2: Review System ---
  {
    key: 'showRubricHeader',
    title: 'Rubric Title & Criteria Counter Header',
    desc: 'Header title, rubric description, and guide info button.',
    icon: Sliders,
    category: 'rubric',
    slotType: 'bar'
  },
  {
    key: 'showCustomCriterionButton',
    title: 'Add Custom Criterion Button',
    desc: '+ Add Custom Criterion button to create individual evaluation metrics.',
    icon: Sliders,
    category: 'rubric',
    slotType: 'button',
    parentKey: 'showRubricHeader'
  },
  {
    key: 'showRubricPresets',
    title: 'Standardized Rubric (IPAF) Ribbon',
    desc: 'Quick-apply library banner for the research-synthesized IPAF peer evaluation standard (CATME, Salas, AAC&U, WebPA).',
    icon: BookOpen,
    category: 'rubric',
    slotType: 'banner',
    defaultHeight: 90
  },
  {
    key: 'showTargetScaleCard',
    title: 'Final Grade Scaling Target Scale Card',
    desc: 'Sets grade scaling target (Out of 20, Out of 100, or Rubric Sum).',
    icon: Sliders,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 90
  },
  {
    key: 'showDeadlineTimer',
    title: 'Milestone Deadline & Countdown Timer Card',
    desc: 'Submission cutoff date & countdown timer that locks evaluations upon expiration.',
    icon: Clock,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 90
  },
  {
    key: 'showWeightBalanceBar',
    title: 'Rubric Weight Auto-Balance Bar',
    desc: 'Validation bar indicating criteria weight percentage sum and 100% balance.',
    icon: CheckCircle,
    category: 'rubric',
    slotType: 'bar'
  },
  {
    key: 'showCriterionCards',
    title: 'Evaluation Rubric Criteria Cards List',
    desc: 'Configured rubric criteria cards with score ranges and behavioral anchors.',
    icon: Sliders,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 180
  },
  {
    key: 'showEvaluationSimulator',
    title: 'Student Interface Experience Preview',
    desc: 'Interactive simulator showing how students see and submit peer evaluation sliders.',
    icon: Sparkles,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 180
  },
  {
    key: 'showEvaluationFormControls',
    title: 'Peer Evaluation Form Fields & Controls Card',
    desc: 'Card to toggle question prompts, praise tags, self-review, and permissions directly on the page.',
    icon: SlidersHorizontal,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 110
  },
  {
    key: 'showTeamHealthPulse',
    title: 'Team Health "Micro-Pulse" Check-ins',
    desc: 'On-demand 30-second pulse surveys tracking team morale, communication, and project blockers with sparklines.',
    icon: Activity,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 110
  },
  {
    key: 'showLivePresentationScoring',
    title: 'Live Presentation Day Scoring Cockpit',
    desc: 'Mobile QR code for real-time audience voting, presentation countdown timer, live criteria analytics, and leaderboard.',
    icon: Presentation,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 120
  },

  // --- Section 3: Grading & Performance Analytics ---
  {
    key: 'showResultsHeaderCard',
    title: 'Real-Time Calculation Matrix Header Card',
    desc: 'Top title card explaining non-self peer averaging and real-time updates.',
    icon: Award,
    category: 'analytics',
    slotType: 'banner'
  },
  {
    key: 'showSubmissionReset',
    title: 'Reset All Evaluations Action Button',
    desc: 'Danger zone button allowing instructors to wipe reviews back to pending.',
    icon: RefreshCw,
    category: 'analytics',
    slotType: 'button'
  },
  {
    key: 'showCompetencyRadar',
    title: 'Competency Spider Radar Chart',
    desc: 'Multi-axis radar chart showing class rubric benchmarks vs individual team averages.',
    icon: Sparkles,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 280
  },
  {
    key: 'showJohariMatrix',
    title: 'Johari Window & Self-Awareness Alignment',
    desc: 'Identifies student self-awareness anomalies, over-raters, and under-raters vs team consensus.',
    icon: Award,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 280
  },
  {
    key: 'showQualitativeFeedback',
    title: 'Qualitative Feedback Themes Card',
    desc: 'Automated keyword extraction across all written teammate feedback comments.',
    icon: MessageSquare,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showWebPACalibration',
    title: 'WebPA Grade Calibration Card',
    desc: 'Base Grade mark input and Fudge weight slider for individual peer mark multipliers.',
    icon: Sliders,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showAnomalyAudit',
    title: 'Statistical Anomaly & Collusion Audit Card',
    desc: 'Statistical conflict auditing flagging collusion, outlier ratings, and uniform grades.',
    icon: ShieldCheck,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showMilestonesHistory',
    title: 'Milestone & Sprints History Card',
    desc: 'Archive evaluations into permanent sprint records to freeze marks over time.',
    icon: RefreshCw,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showLmsExport',
    title: 'LMS Gradebook Integration & Smart Export Formats',
    desc: '1-click export presets for Canvas LMS, Blackboard Learn, Moodle, and Brightspace D2L.',
    icon: Download,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 130
  },
  {
    key: 'showResultsSummarySheet',
    title: 'Results Summary Sheet & Gradebook Table',
    desc: 'Master gradebook table with individual student multipliers, raw scores, and actions.',
    icon: Award,
    category: 'analytics',
    slotType: 'table',
    defaultHeight: 240
  },
  {
    key: 'showExportReportButtons',
    title: 'Export Gradebook & Student PDF Reports Buttons',
    desc: 'Download class Excel gradebook and generate individual PDF report cards.',
    icon: Download,
    category: 'analytics',
    slotType: 'button',
    parentKey: 'showResultsSummarySheet'
  },
  {
    key: 'showGradebookSearchFilter',
    title: 'Gradebook Search & Team Filter Bar',
    desc: 'Search by student name and team filter dropdown on the gradebook.',
    icon: Search,
    category: 'analytics',
    slotType: 'bar',
    parentKey: 'showResultsSummarySheet'
  },
  {
    key: 'showDetailedReviewMatrix',
    title: 'Who Rated Whom: Evaluation Audit Cross-Matrix',
    desc: 'Cross-grid audit matrix in Team modal displaying reviewer vs recipient ratings.',
    icon: Sliders,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 160,
    parentKey: 'showResultsSummarySheet'
  },
  {
    key: 'showTeammateAuditLog',
    title: 'Teammate Evaluation Audit Log',
    desc: 'Written qualitative feedback comments and review records in Team modal.',
    icon: MessageSquare,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 160,
    parentKey: 'showResultsSummarySheet'
  },

  // --- Section 4: Footer Elements ---
  {
    key: 'showFooterBrandLogo',
    title: 'Footer Brand Logo Icon',
    desc: 'Display the circular PeerLens icon on the bottom-left of the application footer.',
    icon: Sparkles,
    category: 'footer',
    slotType: 'button'
  },
  {
    key: 'showFooterBrandName',
    title: 'Footer Brand Name (PeerLens)',
    desc: 'Display the bold "PeerLens" brand name in the bottom-left of the application footer.',
    icon: Type,
    category: 'footer',
    slotType: 'button'
  },
  {
    key: 'showFooterBrandTagline',
    title: 'Footer Tagline Subtitle',
    desc: 'Display "Intelligent Peer Assessment, Simplified" underneath the brand name.',
    icon: MessageSquare,
    category: 'footer',
    slotType: 'button'
  },
  {
    key: 'showFooterWorkspaceContext',
    title: 'Footer Workspace & Active Course Capsule',
    desc: 'Display the center pill badge showing the active workspace profile and course name.',
    icon: Users,
    category: 'footer',
    slotType: 'banner'
  },
  {
    key: 'showFooterDoubleBlindBadge',
    title: 'Footer Double-Blind Anonymity Trust Badge',
    desc: 'Display the double-blind privacy shield indicator on the bottom-right of the footer.',
    icon: Zap,
    category: 'footer',
    slotType: 'button'
  },
  {
    key: 'showFooterSecurePrivateBadge',
    title: 'Footer Secure & Private Trust Badge',
    desc: 'Display the verified client-side privacy & security badge on the bottom-right.',
    icon: ShieldCheck,
    category: 'footer',
    slotType: 'button'
  },
  {
    key: 'showFooterCopyright',
    title: 'Footer Copyright Notice',
    desc: 'Display the legal copyright notice (e.g. © 2026 PeerLens) on the far right.',
    icon: Clock,
    category: 'footer',
    slotType: 'button'
  }
];

export const MODULE_MAP: Map<keyof FeatureToggles, ModuleItem> = new Map(
  MODULE_ITEMS.map(item => [item.key, item])
);

export const getModuleByKey = (key: keyof FeatureToggles): ModuleItem | undefined => {
  return MODULE_MAP.get(key);
};

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'header',
    title: 'Header & Top Navigation',
    icon: Settings,
    keys: MODULE_ITEMS.filter(m => m.category === 'header').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'header')
  },
  {
    id: 'hub',
    title: 'Home Hub & Sub-Bar Navigation',
    icon: LayoutGrid,
    keys: MODULE_ITEMS.filter(m => m.category === 'hub').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'hub')
  },
  {
    id: 'roster',
    title: 'Section 1: Enrollment & Teams',
    icon: Users,
    keys: MODULE_ITEMS.filter(m => m.category === 'roster').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'roster')
  },
  {
    id: 'rubric',
    title: 'Section 2: Review System',
    icon: Sliders,
    keys: MODULE_ITEMS.filter(m => m.category === 'rubric').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'rubric')
  },
  {
    id: 'analytics',
    title: 'Section 3: Grading & Performance Analytics',
    icon: Award,
    keys: MODULE_ITEMS.filter(m => m.category === 'analytics').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'analytics')
  },
  {
    id: 'footer',
    title: 'Footer Elements',
    icon: Compass,
    keys: MODULE_ITEMS.filter(m => m.category === 'footer').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'footer')
  }
];
