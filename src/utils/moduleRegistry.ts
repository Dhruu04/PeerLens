import type { LucideIcon } from 'lucide-react';
import {
  Settings, BookOpen, Trash2, Maximize2, Sun, User, Search, Mail, 
  Compass, Database, Sliders, LayoutGrid, CheckSquare, QrCode, 
  Sparkles, Users, CheckCircle, Download, ShieldCheck, Clock, 
  SlidersHorizontal, Activity, Award, RefreshCw, MessageSquare, 
  Key, Zap, Edit3, Plus, Type, UserCheck, Presentation,
  Layers, Kanban, Table, Columns3, Undo2, Shuffle, Settings2, Target, RotateCcw, Check, Percent, Globe, UserX
} from 'lucide-react';
import type { FeatureToggles } from './featurePreferences';

export type ModuleCategory = 'header' | 'hub' | 'roster' | 'autogroup' | 'rubric' | 'analytics' | 'footer';
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
    title: 'Email Links to Students',
    desc: 'Sends private evaluation links to students via email.',
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
    title: 'Cloud Sync / Offline Mode',
    desc: 'Shows whether class data is saved in Firebase cloud or local browser storage.',
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
    title: 'Layout Presets',
    desc: 'Switch between Essentials, Recommended, or Show All layouts.',
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
    title: 'Hub Card: 1. Students & Teams',
    desc: 'Large interactive section card on the Class Overview screen.',
    icon: Users,
    category: 'hub',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showReviewSystemCard',
    title: 'Hub Card: 2. Grading Rubric',
    desc: 'Large interactive section card on the Class Overview screen.',
    icon: Sliders,
    category: 'hub',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showGradingAnalyticsCard',
    title: 'Hub Card: 3. Grades & Reports',
    desc: 'Large interactive section card on the Class Overview screen.',
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
    title: 'Student Join Code & Link',
    desc: 'Generates a QR code and URL for students to register themselves.',
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
    title: 'Load Demo Students',
    desc: 'Populates 100 sample students to test the software.',
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
    title: 'Auto-Group Teams',
    desc: 'Automatically forms balanced student groups using rules (diversity, skills, size).',
    icon: Users,
    category: 'autogroup',
    slotType: 'card',
    defaultHeight: 120
  },
  {
    key: 'showAutoGroupTargetSize',
    title: 'AutoGroup: Target Team Size Controls',
    desc: 'Target size stepper input, planned team count indicator, and quick size preset buttons.',
    icon: Users,
    category: 'autogroup',
    slotType: 'card',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupNamingFormat',
    title: 'Team Name Style',
    desc: 'Chooses naming format (e.g., "Team 1", "Group A", "Squad").',
    icon: Layers,
    category: 'autogroup',
    slotType: 'card',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupRulesCard',
    title: 'AutoGroup: Rules & Constraints Studio Card',
    desc: 'Active custom grouping rules, attribute weightage buttons, and optimization constraints card.',
    icon: Settings2,
    category: 'autogroup',
    slotType: 'card',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupResetRulesBtn',
    title: 'AutoGroup: Reset Defaults & Clear Rules Buttons',
    desc: 'Reset to balanced rules and Clear All buttons in the rules header.',
    icon: RotateCcw,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupDiscoveredFields',
    title: 'Balance by (Gender, Major, etc.)',
    desc: 'Auto-detected spreadsheet columns to balance across teams.',
    icon: Sparkles,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupQuickTargets',
    title: 'AutoGroup: Quick Team Drop & Jump Strip',
    desc: 'Sticky or scrollable target strip to jump between teams and drop students with live simulation.',
    icon: Target,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupToolbar',
    title: 'AutoGroup: Preview Layout & History Toolbar',
    desc: 'Toolbar containing layout switchers, undo/redo move history, and roster search filter.',
    icon: LayoutGrid,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupViewGrid',
    title: 'AutoGroup Layout: Grid View Option',
    desc: 'Grid preview layout tab showing responsive team cards with member rosters.',
    icon: LayoutGrid,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupViewKanban',
    title: 'Board View',
    desc: 'Drag-and-drop column view to move students between teams.',
    icon: Kanban,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupViewTable',
    title: 'AutoGroup Layout: Detailed Table Option',
    desc: 'Comprehensive spreadsheet table layout tab listing all team compositions and demographics.',
    icon: Table,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupViewCompact',
    title: 'Compact Cards',
    desc: 'Dense view showing all teams side-by-side.',
    icon: Columns3,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupHistoryControls',
    title: 'AutoGroup: Undo & Redo History Buttons',
    desc: 'Undo and Redo buttons to revert or re-apply manual student drag-and-drop moves.',
    icon: Undo2,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupUnassignedDrawer',
    title: 'AutoGroup: Unassigned Students Drawer Trigger',
    desc: 'Quick toolbar trigger button that toggles the floating drawer for unassigned students.',
    icon: UserX,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupSearchFilter',
    title: 'AutoGroup: Search & Filter Input',
    desc: 'Instant search input to filter students across all teams by name, nationality, or skill.',
    icon: Search,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupBottomBar',
    title: 'AutoGroup: Bottom Finalization Action Bar',
    desc: 'Bottom bar containing formation summary status, reshuffle, agreements, and roster save buttons.',
    icon: CheckCircle,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupShuffleBtn',
    title: 'AutoGroup: Shuffle Combinations Button',
    desc: 'Button in the bottom bar to re-run optimization and produce a fresh balanced allocation.',
    icon: Shuffle,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupCharterBtn',
    title: 'AutoGroup: Team Agreements & Roles Button',
    desc: 'Button at the bottom to launch Team Collaboration Agreements, activity roles, and icebreakers.',
    icon: Sparkles,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupApplyBtn',
    title: 'AutoGroup: Apply to Class Roster Button',
    desc: 'Primary button in bottom bar to commit and save generated team assignments to the class roster.',
    icon: Check,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupRuleCompliance',
    title: 'AutoGroup: Rule Compliance Overall Score',
    desc: 'Displays the class-wide diversity rule compliance percentage score in the Auto-Group header.',
    icon: CheckCircle,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupWeightDistribution',
    title: 'AutoGroup: Overall Optimization Weight Distribution',
    desc: 'Shows the criteria weight distribution progress bar and percentage breakdown across active grouping rules.',
    icon: Sliders,
    category: 'autogroup',
    slotType: 'card',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupDiversityPercentages',
    title: 'AutoGroup: Team Header % Score Badge',
    desc: 'Displays the percentage score badge (e.g. 99%, 100%) in each team card header.',
    icon: Percent,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupDiversityStrip',
    title: 'AutoGroup: Rule Satisfaction Breakdown Strip',
    desc: 'Displays the sub-metrics strip (Gender, University, Nationality percentages) under team headers.',
    icon: Sliders,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupTeamComposition',
    title: 'AutoGroup: Team Demographic Composition Strip',
    desc: 'Displays the demographic composition summary strip (e.g. 4 Countries, 4 Unis, 2F 1M) under team headers.',
    icon: Globe,
    category: 'autogroup',
    slotType: 'bar',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showAutoGroupStudentDemographics',
    title: 'AutoGroup: Student Demographics Line',
    desc: 'Displays the country, gender, and language metadata row at the bottom of student cards.',
    icon: User,
    category: 'autogroup',
    slotType: 'button',
    parentKey: 'showAutoGroupStudio'
  },
  {
    key: 'showDuplicateDetector',
    title: 'Duplicate Student Alert',
    desc: 'Flags identical student names, IDs, or emails in the roster.',
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
    title: 'Team Roles & Icebreaker',
    desc: 'Assigns student roles (Lead, Scribe, Presenter) and sets group agreements.',
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
    title: 'Grade Scale',
    desc: 'Sets whether final grades are out of 20, 100, or a custom maximum.',
    icon: Sliders,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 90
  },
  {
    key: 'showDeadlineTimer',
    title: 'Submission Deadline',
    desc: 'Sets the date/time when peer evaluation closes.',
    icon: Clock,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 90
  },
  {
    key: 'showWeightBalanceBar',
    title: 'Weight Total (100%)',
    desc: 'Shows whether your criteria percentages add up to 100%.',
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
    title: 'Preview Student View',
    desc: 'Test-drives what students see when filling out peer reviews on their phones/laptops.',
    icon: Sparkles,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 180
  },
  {
    key: 'showEvaluationFormControls',
    title: 'Feedback Settings',
    desc: 'Toggles praise badges, written comments, and self-evaluations.',
    icon: SlidersHorizontal,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 110
  },
  {
    key: 'showTeamHealthPulse',
    title: 'Team Health Check-ins',
    desc: 'Quick 30-second morale and blocker check-ins during group projects.',
    icon: Activity,
    category: 'rubric',
    slotType: 'card',
    defaultHeight: 110
  },
  {
    key: 'showLivePresentationScoring',
    title: 'Live Presentation Scoring',
    desc: 'Lets audience and professors score live group presentations in real time.',
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
    title: 'Skills Radar Chart',
    desc: 'Visual chart comparing team strengths across all rubric criteria.',
    icon: Sparkles,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 280
  },
  {
    key: 'showJohariMatrix',
    title: 'Self vs. Peer Rating Comparison',
    desc: 'Shows if students rate themselves much higher or lower than teammates rated them.',
    icon: Award,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 280
  },
  {
    key: 'showQualitativeFeedback',
    title: 'Written Feedback Summary',
    desc: 'Summarizes common themes and praise words written by teammates.',
    icon: MessageSquare,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 220
  },
  {
    key: 'showWebPACalibration',
    title: 'Peer Score Adjustment',
    desc: 'Adjusts individual student grades up or down based on teammate reviews.',
    icon: Sliders,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showAnomalyAudit',
    title: 'Suspicious Ratings Alert',
    desc: 'Detects students who trade high scores, grade randomly, or give uniform marks.',
    icon: ShieldCheck,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showMilestonesHistory',
    title: 'Past Review Rounds',
    desc: 'Archives past peer evaluations (e.g., Midterm Review, Final Review).',
    icon: RefreshCw,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 140
  },
  {
    key: 'showLmsExport',
    title: 'Export to Canvas / Blackboard / Moodle',
    desc: '1-click grade exports formatted for standard school LMS gradebooks.',
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
    title: 'Who Rated Whom Grid',
    desc: 'Breakdown table showing exactly who gave what score to whom.',
    icon: Sliders,
    category: 'analytics',
    slotType: 'card',
    defaultHeight: 160,
    parentKey: 'showResultsSummarySheet'
  },
  {
    key: 'showTeammateAuditLog',
    title: 'Student Comments Log',
    desc: 'Full list of written feedback comments per team.',
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
    title: '100% Anonymous Reviews',
    desc: 'Assures students that teammates cannot see who gave which score.',
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
    title: 'Header & Navigation',
    icon: Settings,
    keys: MODULE_ITEMS.filter(m => m.category === 'header').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'header')
  },
  {
    id: 'hub',
    title: 'Class Overview',
    icon: LayoutGrid,
    keys: MODULE_ITEMS.filter(m => m.category === 'hub').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'hub')
  },
  {
    id: 'roster',
    title: '1. Enrollment & Roster',
    icon: Users,
    keys: MODULE_ITEMS.filter(m => m.category === 'roster').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'roster')
  },
  {
    id: 'autogroup',
    title: 'AutoGroup Studio & Teams',
    icon: Sparkles,
    keys: MODULE_ITEMS.filter(m => m.category === 'autogroup').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'autogroup')
  },
  {
    id: 'rubric',
    title: '2. Grading Rubric',
    icon: Sliders,
    keys: MODULE_ITEMS.filter(m => m.category === 'rubric').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'rubric')
  },
  {
    id: 'analytics',
    title: '3. Grades & Reports',
    icon: Award,
    keys: MODULE_ITEMS.filter(m => m.category === 'analytics').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'analytics')
  },
  {
    id: 'footer',
    title: 'Footer & Trust Badges',
    icon: ShieldCheck,
    keys: MODULE_ITEMS.filter(m => m.category === 'footer').map(m => m.key),
    items: MODULE_ITEMS.filter(m => m.category === 'footer')
  }
];

export function hasSubmodules(key: keyof FeatureToggles): boolean {
  return MODULE_ITEMS.some(m => m.parentKey === key);
}

export type DashboardTab = 'hub' | 'roster' | 'grading' | 'results';

export function getTabForModuleCategory(category: ModuleCategory): DashboardTab | null {
  switch (category) {
    case 'hub':
      return 'hub';
    case 'roster':
    case 'autogroup':
      return 'roster';
    case 'rubric':
      return 'grading';
    case 'analytics':
      return 'results';
    case 'header':
    case 'footer':
    default:
      return null;
  }
}

export function getModuleTab(key: keyof FeatureToggles): DashboardTab | null {
  const item = getModuleByKey(key);
  if (!item) return null;
  return getTabForModuleCategory(item.category);
}
