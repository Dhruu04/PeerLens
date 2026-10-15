import React from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Users, Sparkles, Mail, GraduationCap, 
  Globe, Languages, CheckCircle2, Clock, 
  Layers, Lock, Plane, Award, Info, Command
} from 'lucide-react';
import type { Student } from '../utils/math';
import type { GroupDiversityReport } from '../utils/grouping';
import type { ModuleItem } from '../utils/moduleRegistry';

export type QuickLookPayload = 
  | { type: 'student'; student: Student; teamReport?: GroupDiversityReport | null }
  | { type: 'team'; team: GroupDiversityReport; isLocked?: boolean }
  | { type: 'module'; module: ModuleItem }
  | { type: 'action'; label: string; description: string; shortcut?: string; icon?: React.ReactNode }
  | { type: 'generic'; title: string; subtitle?: string; details?: string };

const MODULE_SPECIFIC_GUIDES: Record<string, {
  badge: string;
  whatItDoes: string;
  howToUse: string;
  pedagogicalValue: string;
}> = {
  // --- Header & Top Navigation ---
  showClassPicker: {
    badge: 'Class Section Switcher',
    whatItDoes: 'Switches the workspace between different lecture sections, course terms, and class cohorts.',
    howToUse: 'Click to select or search among your active courses and sections from the dropdown.',
    pedagogicalValue: 'Allows instructors teaching multiple parallel sections to maintain independent cohorts, peer ratings, and rubrics without cross-contamination.'
  },
  showDeleteClassButton: {
    badge: 'Classroom Archive / Purge',
    whatItDoes: 'Permanently deletes or archives the active classroom section after confirmation.',
    howToUse: 'Click the trash icon next to the classroom selector to purge the current class cohort.',
    pedagogicalValue: 'Maintains workspace hygiene and data security at the conclusion of an academic semester.'
  },
  showNewClassButton: {
    badge: 'Cohort Provisioning',
    whatItDoes: 'Initializes an empty classroom cohort with clean enrollment rosters and peer evaluation criteria.',
    howToUse: 'Click "+ Class" in the top bar to instantiate a fresh class section for your new semester.',
    pedagogicalValue: 'Enables instructors to quickly spin up parallel sections with standardized course configurations.'
  },
  showSettingsButton: {
    badge: 'Workspace Preferences',
    whatItDoes: 'Opens workspace configuration, theme options, grading defaults, and granular feature toggles.',
    howToUse: 'Click the gear icon in the top right to configure class settings and enable/disable modules.',
    pedagogicalValue: 'Enables syllabus customization tailored to the specific grading criteria of any academic discipline.'
  },
  showThemeSwitcher: {
    badge: 'Visual Accessibility',
    whatItDoes: 'Toggles between high-contrast light, sleek dark, and system-synchronized display modes.',
    howToUse: 'Click to alternate between light mode for bright lecture halls and dark mode for reduced eye fatigue.',
    pedagogicalValue: 'Optimizes visual readability across auditorium projectors, student laptops, and tablet displays.'
  },
  showProfilePill: {
    badge: 'Admin Identity Center',
    whatItDoes: 'Displays current administrator credentials, role badges, and authentication state.',
    howToUse: 'Click to view instructor profile details, sign in, or manage workspace permissions.',
    pedagogicalValue: 'Guarantees instructor-only grading privileges and protects double-blind student evaluation privacy.'
  },
  showProjectorButton: {
    badge: 'Lecture Projector Mode',
    whatItDoes: 'Expands the dashboard into a distraction-free, maximized fullscreen auditorium presentation view.',
    howToUse: 'Click before presenting in class to hide navigation headers and enlarge text and QR codes.',
    pedagogicalValue: 'Keeps student focus locked onto live group activities, team assignments, and classroom presentations.'
  },
  showCommandSearch: {
    badge: 'Omni Command Palette',
    whatItDoes: 'Instant fuzzy search console and keyboard shortcut navigator (press Ctrl+K or ⌘K).',
    howToUse: 'Press Ctrl+K to jump to any student, trigger calculations, or toggle modules without mouse clicks.',
    pedagogicalValue: 'Empowers instructors to navigate large cohorts of 100+ students in fractions of a second.'
  },
  showEmailButton: {
    badge: 'Evaluation Link Dispatcher',
    whatItDoes: 'Dispatches secure, private peer review submission tokens to all enrolled students via email.',
    howToUse: 'Click to batch-send individualized student review portal links directly to student inboxes.',
    pedagogicalValue: 'Removes student login friction and password fatigue by utilizing direct, cryptographically signed tokens.'
  },
  showGuideButton: {
    badge: 'Academic Guidance Center',
    whatItDoes: 'Interactive tours, WebPA methodology references, and accreditation rubric guidance.',
    howToUse: 'Click the compass icon to explore step-by-step walkthroughs and best practice rubrics.',
    pedagogicalValue: 'Shortens the learning curve for new teaching assistants and professors adopting peer evaluation.'
  },
  showCloudStatus: {
    badge: 'Cloud Sync Engine',
    whatItDoes: 'Live indicator displaying cloud database sync status and offline failover caching state.',
    howToUse: 'Check green checkmark for synchronized state; click to force manual synchronization.',
    pedagogicalValue: 'Guarantees zero data loss even during auditorium Wi-Fi interruptions during lecture.'
  },
  showCustomizeViewButton: {
    badge: 'Granular Module Manager',
    whatItDoes: 'Opens the visual module catalog to toggle any card, button, or analytics strip on or off.',
    howToUse: 'Click to customize which tools are visible on your dashboard for this specific course.',
    pedagogicalValue: 'Declutters the interface so professors only see the tools relevant to their syllabus needs.'
  },
  showEditModeButton: {
    badge: 'Interactive Layout Editor',
    whatItDoes: 'Enables on-screen visual editing mode to hide, reveal, or reorder dashboard elements.',
    howToUse: 'Click the pencil icon to toggle visual editing markers directly over modules.',
    pedagogicalValue: 'Allows live WYSIWYG customization without opening complex settings menus.'
  },
  showQuickActionPill: {
    badge: 'Floating Quick Action Dock',
    whatItDoes: 'Sticky quick-dock anchored at the bottom of the viewport for fast navigation.',
    howToUse: 'Hover or click to access search, module toggles, projector, and export tools from anywhere.',
    pedagogicalValue: 'Provides effortless one-click access to essential tools regardless of scroll depth.'
  },

  // --- Home Hub & Sub-Bar Navigation ---
  showPresetsBanner: {
    badge: 'One-Click Layout Presets',
    whatItDoes: 'Switches between Essentials, Recommended, and Show All interface configurations.',
    howToUse: 'Click a preset chip to instantly reconfigure visible dashboard components.',
    pedagogicalValue: 'Instantly adapts the workspace for either quick reviews or deep statistical audits.'
  },
  showHubOverviewBanner: {
    badge: 'Classroom Header Card',
    whatItDoes: 'Displays current course code, semester label, active student count, and enrollment status.',
    howToUse: 'Review high-level course identification and cohort enrollment statistics at a glance.',
    pedagogicalValue: 'Establishes clear context for which lecture section is actively being administered.'
  },
  showHubOverviewStats: {
    badge: 'Live Metric Snapshot Strip',
    whatItDoes: 'Real-time counters for enrolled students, active teams, criteria, and submission rate.',
    howToUse: 'Glance at aggregate participation progress and rubric completeness across the cohort.',
    pedagogicalValue: 'Gives instantaneous feedback on cohort readiness before peer evaluation rounds.'
  },
  showSectionNavBreadcrumbs: {
    badge: 'Workflow Breadcrumb Trail',
    whatItDoes: 'Interactive hierarchical navigation trail indicating active section and workflow phase.',
    howToUse: 'Click any breadcrumb segment to navigate back to parent overview screens.',
    pedagogicalValue: 'Keeps instructors oriented within complex multi-stage peer review workflows.'
  },
  showClassIdBadge: {
    badge: 'Enrollment Code Token',
    whatItDoes: 'One-click copy badge displaying the unique alphanumeric join code for student registration.',
    howToUse: 'Click the badge to copy the join code to clipboard and share with students in class.',
    pedagogicalValue: 'Facilitates fast, error-free onboarding during in-person lectures and lab orientations.'
  },
  showEnrollmentCard: {
    badge: 'Phase 1: Students & Groups Hub',
    whatItDoes: 'Primary navigation card for classroom roster ingestion, student import, and team formation.',
    howToUse: 'Click to jump into roster management and automated group balance studio.',
    pedagogicalValue: 'Guides the instructor through the first milestone of the peer evaluation process.'
  },
  showReviewSystemCard: {
    badge: 'Phase 2: Rubric & Form Hub',
    whatItDoes: 'Primary navigation card for configuring criteria, weights, deadlines, and review parameters.',
    howToUse: 'Click to jump into rubric authoring, IPAF presets, and student view previews.',
    pedagogicalValue: 'Coordinates the assessment design phase before releasing reviews to students.'
  },
  showGradingAnalyticsCard: {
    badge: 'Phase 3: Grades & WebPA Hub',
    whatItDoes: 'Primary navigation card for reviewing submissions, calibrating grades, and exporting to LMS.',
    howToUse: 'Click to jump into WebPA multiplier calculations, radar charts, and gradebooks.',
    pedagogicalValue: 'Synthesizes qualitative and quantitative student reviews into fair, defensible grades.'
  },
  showHubCardMetrics: {
    badge: 'Hub Progress Gauges',
    whatItDoes: 'Compact progress indicators displaying readiness percentages inside section cards.',
    howToUse: 'Monitor checklist completion before advancing to subsequent evaluation phases.',
    pedagogicalValue: 'Prevents launching peer evaluation rounds before rubrics or rosters are complete.'
  },
  showHubQuickActions: {
    badge: 'Fast-Forward Action Links',
    whatItDoes: 'Direct action shortcut links embedded within hub section cards.',
    howToUse: 'Click shortcuts like "Import CSV" or "Apply IPAF" to jump straight into tasks.',
    pedagogicalValue: 'Minimizes redundant clicks when performing standard class preparation tasks.'
  },

  // --- Roster & Enrollment ---
  showSelfEnrollmentCard: {
    badge: 'Real-Time QR Self-Enrollment',
    whatItDoes: 'Generates live projector QR codes and join URLs for self-enrollment during lecture.',
    howToUse: 'Project QR code onto the auditorium screen; students scan to self-register.',
    pedagogicalValue: 'Eliminates hours of manual student spreadsheet data entry and email chasing.'
  },
  showSelfEnrollmentQr: {
    badge: 'Enrollment QR Code Graphic',
    whatItDoes: 'High-resolution scannable QR code linking directly to the student enrollment portal.',
    howToUse: 'Enlarge on classroom displays for effortless smartphone camera scanning.',
    pedagogicalValue: 'Ensures 100% cohort enrollment in the first five minutes of the introductory lecture.'
  },
  showSelfEnrollmentPresentationBtn: {
    badge: 'Auditorium Projector Presentation',
    whatItDoes: 'Launches an enlarged, high-contrast QR display optimized for large lecture halls.',
    howToUse: 'Click to project full-screen enrollment instructions with large legible URLs.',
    pedagogicalValue: 'Guarantees students seated in the rear rows can scan the QR code reliably.'
  },
  showQuickActionsCard: {
    badge: 'Roster Operations Console',
    whatItDoes: 'Toolbar containing student addition, sample demo cohorts, and roster wiping tools.',
    howToUse: 'Use toolbar buttons to quickly populate or clear classroom participant lists.',
    pedagogicalValue: 'Accelerates class setup and demo testing for instructional workshops.'
  },
  showAddStudentButton: {
    badge: 'Manual Student Addition',
    whatItDoes: 'Modal form to input individual student names, emails, and university affiliations.',
    howToUse: 'Click to manually add late-enrolling or audit students to the active roster.',
    pedagogicalValue: 'Handles individual student exceptions without re-importing the full class file.'
  },
  showDemoSampleButton: {
    badge: 'Load 100 Demo Cohort',
    whatItDoes: 'Populates the classroom with 100 realistic, diverse university students for testing.',
    howToUse: 'Click to instantly populate realistic international demographics and test algorithms.',
    pedagogicalValue: 'Allows instructors to test team balancing and WebPA analytics before live classes.'
  },
  showClearRosterButton: {
    badge: 'Reset Classroom Roster',
    whatItDoes: 'Purges all enrolled students and group assignments after two-step confirmation.',
    howToUse: 'Click to reset the student roster when starting a new semester from scratch.',
    pedagogicalValue: 'Ensures no lingering student records contaminate new academic cohorts.'
  },
  showImportWizardCard: {
    badge: 'CSV / Excel Roster Importer',
    whatItDoes: 'Drag-and-drop file ingestion engine supporting Canvas, Blackboard, Excel, and CSV.',
    howToUse: 'Drop your university LMS roster file into the box to parse all students instantly.',
    pedagogicalValue: 'Seamlessly parses varied spreadsheet formats, column headers, and foreign accents.'
  },
  showImportDropzone: {
    badge: 'Interactive File Dropzone',
    whatItDoes: 'Visual drop target with automatic encoding detection and header auto-mapping.',
    howToUse: 'Drag and drop .csv, .xlsx, or .tsv student roster files onto this surface.',
    pedagogicalValue: 'Provides instant visual confirmation of file upload readiness.'
  },
  showExportRosterBtn: {
    badge: 'Export Roster to Excel/CSV',
    whatItDoes: 'Downloads current classroom participant list including assigned teams and emails.',
    howToUse: 'Click to download an up-to-date roster spreadsheet for institutional backup.',
    pedagogicalValue: 'Facilitates archival record-keeping and external department reporting.'
  },
  showDownloadTemplateBtn: {
    badge: 'Download CSV Template',
    whatItDoes: 'Provides pre-formatted CSV template file with sample headers for easy data prep.',
    howToUse: 'Click to obtain a clean spreadsheet template matching PeerLens column schema.',
    pedagogicalValue: 'Prevents column formatting errors when preparing student rosters for import.'
  },
  showDuplicateDetector: {
    badge: 'Anti-Duplicate Collusion Audit',
    whatItDoes: 'Scans active roster for duplicate emails, matching student IDs, or identical names.',
    howToUse: 'Click warning badges to inspect matched student pairs and resolve duplicates.',
    pedagogicalValue: 'Guarantees evaluation database integrity, preventing double voting or spoofing.'
  },
  showRosterTable: {
    badge: 'Master Student Directory Table',
    whatItDoes: 'Searchable, sortable master data table tracking student IDs, teams, and statuses.',
    howToUse: 'Click column headers to sort; click student rows to edit records or inspect info.',
    pedagogicalValue: 'Serves as the central command center for cohort participation and team placement.'
  },
  showRosterSearchFilter: {
    badge: 'Roster Quick Search Filter',
    whatItDoes: 'Real-time text filter scanning names, emails, student IDs, and assigned teams.',
    howToUse: 'Type any keyword to filter the student directory table instantaneously.',
    pedagogicalValue: 'Enables instantaneous location of specific participants in classes of 200+ students.'
  },
  showExportButtons: {
    badge: 'Roster File Format Converters',
    whatItDoes: 'Quick-export buttons for generating Excel (.xlsx), CSV, and formatted text rosters.',
    howToUse: 'Click desired export format to save local copies of current cohort assignments.',
    pedagogicalValue: 'Provides flexibility when sharing team lists with teaching assistants or LMS.'
  },
  showRosterAddStudentBtn: {
    badge: 'In-Table Add Student Action',
    whatItDoes: 'Compact add button embedded in the student roster table header.',
    howToUse: 'Click to append a new student record directly above the active table.',
    pedagogicalValue: 'Streamlines quick additions while reviewing active classroom enrollments.'
  },
  showBulkActionBar: {
    badge: 'Batch Student Operations Bar',
    whatItDoes: 'Floating bulk action drawer that appears when one or more students are checked.',
    howToUse: 'Select students via checkboxes to trigger batch reassignments, emails, or deletes.',
    pedagogicalValue: 'Saves substantial administrative effort when managing large cohort movements.'
  },
  showTeamOverviewCards: {
    badge: 'Formed Teams Grid Cards',
    whatItDoes: 'Visual cards for every formed team, displaying assigned members and diversity marks.',
    howToUse: 'Inspect team compositions and verify balanced headcount distribution.',
    pedagogicalValue: 'Gives visual assurance that all students belong to healthy, functioning groups.'
  },
  showTeamKickoffAndRoles: {
    badge: 'Team Roles & Charters',
    whatItDoes: 'Assigns functional roles (Team Lead, Scribe, Presenter) and sets group agreements.',
    howToUse: 'Allocate student roles to balance responsibilities within project teams.',
    pedagogicalValue: 'Clarifies individual accountability, preventing bystander apathy in group work.'
  },

  // --- AutoGroup Studio ---
  showAutoGroupStudio: {
    badge: 'Multi-Attribute Optimizer Studio',
    whatItDoes: 'Algorithmic group balancing engine balancing university origins, gender, and language.',
    howToUse: 'Configure parameters and run the heuristic optimizer to generate equitable teams.',
    pedagogicalValue: 'Eliminates demographic isolation and tokenization in team-based collaborative projects.'
  },
  showAutoGroupTargetSize: {
    badge: 'Target Team Size Selector',
    whatItDoes: 'Steppers and inputs defining desired student headcount per project team (e.g., 3-6).',
    howToUse: 'Set desired team size; optimizer calculates exact team counts and balance.',
    pedagogicalValue: 'Aligns group sizes with course syllabus workload and project scope requirements.'
  },
  showAutoGroupNamingFormat: {
    badge: 'Team Naming Schema',
    whatItDoes: 'Custom prefix and numbering formats (e.g., "Team 1", "Squad Alpha", "Group A").',
    howToUse: 'Select standard numeric or alphabetical prefixes or define a custom naming convention.',
    pedagogicalValue: 'Personalizes team identities according to course conventions and themes.'
  },
  showAutoGroupRulesCard: {
    badge: 'Diversity Criteria Priority Levels',
    whatItDoes: '3 priority level controls (Low, Medium, High) for University, Nationality, Gender, Language, and Custom Attributes.',
    howToUse: 'Select priority levels (Low, Medium, High) for each rule. The algorithm dynamically splits total weight to an exact 100% allocation.',
    pedagogicalValue: 'Gives instructors intuitive, balanced control over classroom diversity without complex slider calibration.'
  },
  showAutoGroupResetRulesBtn: {
    badge: 'Reset Weights to Default',
    whatItDoes: 'Restores diversity rule weightings to scientifically balanced baseline presets.',
    howToUse: 'Click to reset all rule weights back to standard pedagogically validated values.',
    pedagogicalValue: 'Quickly recovers default multi-attribute balance after experimental testing.'
  },
  showAutoGroupRulePercentages: {
    badge: 'Rule Focus % Weight Badges',
    whatItDoes: 'Toggles visibility of dynamic percentage focus badges on each grouping rule and the 100% allocated header tag.',
    howToUse: 'Click the % icon in the rules header or toggle in settings to display exact mathematical focus percentages.',
    pedagogicalValue: 'Keeps the grouping rules interface minimal and uncluttered by default, with complete transparency available on demand.'
  },
  showAutoGroupDiscoveredFields: {
    badge: 'Custom Roster Attribute Detector',
    whatItDoes: 'Auto-detects custom columns from imported rosters (e.g. major, technical skill, track).',
    howToUse: 'Click detected field pills to automatically generate custom diversity rules.',
    pedagogicalValue: 'Expands optimization beyond standard demographics to domain-specific skills.'
  },
  showAutoGroupQuickTargets: {
    badge: 'Sticky Team Quick Jump Bar',
    whatItDoes: 'Horizontal bar of team pills for fast navigation and direct 1-click student transfer.',
    howToUse: 'Click any team pill to scroll directly to that team card or transfer selected students.',
    pedagogicalValue: 'Accelerates manual fine-tuning and visual inspection across 20+ teams.'
  },
  showAutoGroupToolbar: {
    badge: 'Studio Toolbar Controls',
    whatItDoes: 'Central toolbar containing view switchers, search filter, and optimization tools.',
    howToUse: 'Use toolbar buttons to alter layouts, search members, and inspect metrics.',
    pedagogicalValue: 'Organizes core group management operations in a unified, accessible strip.'
  },
  showAutoGroupViewGrid: {
    badge: 'Card Grid View',
    whatItDoes: 'Displays teams in an intuitive multi-column responsive card grid layout.',
    howToUse: 'Review team cards at a glance; click the Send button to reassign students.',
    pedagogicalValue: 'High-density visual layout ideal for checking member dispersion and roles.'
  },
  showAutoGroupViewKanban: {
    badge: 'Kanban Column Board',
    whatItDoes: 'Renders teams as vertical columns with native HTML5 drag-and-drop and lock buttons.',
    howToUse: 'Drag student cards directly between columns or lock finalized teams.',
    pedagogicalValue: 'Agile project perspective familiar to software engineering and design courses.'
  },
  showAutoGroupViewTable: {
    badge: 'Tabular Team Analytics',
    whatItDoes: 'Comparative table summarizing team headcounts, diversity percentages, and entropy.',
    howToUse: 'Scan table rows to immediately detect outlier teams with low balance scores.',
    pedagogicalValue: 'Enables rapid administrative compliance verification for accreditation.'
  },
  showAutoGroupViewCompact: {
    badge: 'Ultra-Dense Grid Overview',
    whatItDoes: 'Minimalist multi-column view showing all teams side-by-side with minimal scroll.',
    howToUse: 'Use when managing cohorts of 25+ teams to view the entire cohort at once.',
    pedagogicalValue: 'Minimizes cognitive load and eliminates scrolling on standard laptop displays.'
  },
  showAutoGroupHistoryControls: {
    badge: 'Undo / Redo Transaction Stack',
    whatItDoes: 'Full history stack tracking every team transfer, drag-and-drop, and student swap.',
    howToUse: 'Click Undo (Ctrl+Z) or Redo to step back and forth through assignment revisions.',
    pedagogicalValue: 'Encourages risk-free exploration of team configurations with instant recovery.'
  },
  showAutoGroupUnassignedDrawer: {
    badge: 'Floating Unassigned Students Dock',
    whatItDoes: 'Quarantine holding drawer for newly imported, late, or unplaced students.',
    howToUse: 'Click to expand drawer; click Send button or drag students directly into teams.',
    pedagogicalValue: 'Prevents unassigned participants from skewing active team calculations.'
  },
  showAutoGroupSearchFilter: {
    badge: 'Roster Attribute Filter',
    whatItDoes: 'Real-time search bar scanning names, universities, nationalities, and degrees.',
    howToUse: 'Type keywords or prefixes (e.g., "Germany" or "Exchange") to highlight matches.',
    pedagogicalValue: 'Rapidly pinpoints specific students in large cohorts of 100+ participants.'
  },
  showAutoGroupBottomBar: {
    badge: 'Optimization Action Bar',
    whatItDoes: 'Action bar containing the Reshuffle, Export Charters, and Apply Teams buttons.',
    howToUse: 'Execute optimizations, export agreements, and synchronize teams with roster.',
    pedagogicalValue: 'Consolidates primary decision triggers into a prominent workflow footer.'
  },
  showAutoGroupShuffleBtn: {
    badge: 'Algorithmic Reshuffle Core',
    whatItDoes: 'Executes simulated annealing to search billions of team permutations.',
    howToUse: 'Click "Reshuffle Teams" to find fresh global optima matching active rules.',
    pedagogicalValue: 'Solves complex combinatorial optimization problems in less than two seconds.'
  },
  showAutoGroupCharterBtn: {
    badge: 'Team Agreement Exporter',
    whatItDoes: 'Generates customized team charter contracts outlining communication and roles.',
    howToUse: 'Click to export contract templates for all formed groups prior to kickoff.',
    pedagogicalValue: 'Establishes psychological contracts early, drastically curbing social loafing.'
  },
  showAutoGroupApplyBtn: {
    badge: 'Classroom Roster Synchronizer',
    whatItDoes: 'Commits optimized group allocations directly into the active classroom roster.',
    howToUse: 'Click Apply once satisfied with diversity scores to lock official memberships.',
    pedagogicalValue: 'Ensures seamless data synchronization with downstream peer review systems.'
  },
  showAutoGroupRuleCompliance: {
    badge: 'Mathematical Cohort Score',
    whatItDoes: 'Aggregate balance score (0–100%) measuring Shannon entropy, variance, and parity.',
    howToUse: 'Aim for 75%+ diversity score before finalizing groups for best collaboration.',
    pedagogicalValue: 'Provides defensible metrics proving equitable team composition.'
  },
  showAutoGroupWeightDistribution: {
    badge: 'Relative Weight Breakdown',
    whatItDoes: 'Visual percentage bar showing how total optimization weight is distributed.',
    howToUse: 'Check relative weightings to ensure one rule does not overpower all others.',
    pedagogicalValue: 'Prevents algorithmic bias where a single attribute dominates grouping.'
  },
  showAutoGroupDiversityPercentages: {
    badge: 'Team Diversity Percentages',
    whatItDoes: 'Individual percentage score badges displayed on each team card or column.',
    howToUse: 'Compare individual team diversity percentages to identify outlier groups.',
    pedagogicalValue: 'Highlights groups that may require a manual student swap for better balance.'
  },
  showAutoGroupDiversityStrip: {
    badge: 'Sub-Attribute Metric Pills',
    whatItDoes: 'Miniature pills indicating satisfaction for university, nationality, and gender rules.',
    howToUse: 'Inspect specific rule compliance scores (e.g. 95% Uni, 100% Gender) per team.',
    pedagogicalValue: 'Provides granular transparency into why a team achieved its diversity score.'
  },
  showAutoGroupTeamComposition: {
    badge: 'Demographic Headcount Summary',
    whatItDoes: 'Text summary showing distinct country counts, universities, and gender ratios.',
    howToUse: 'Glance at summary strings like "3 Countries • 2 Unis • 2F • 2M" on team cards.',
    pedagogicalValue: 'Gives instantaneous human-readable verification of team balance.'
  },
  showAutoGroupStudentDemographics: {
    badge: 'Student Demographics Badges',
    whatItDoes: 'Individual student demographic tags (university, country, CEFR level) on cards.',
    howToUse: 'Review student background tags directly on their draggable cards.',
    pedagogicalValue: 'Informs instructors during manual fine-tuning and student swap decisions.'
  },

  // --- Rubric & Review System ---
  showRubricHeader: {
    badge: 'Rubric Dimension Framework',
    whatItDoes: 'Master rubric manager defining evaluation criteria, descriptions, and weightings.',
    howToUse: 'Edit criterion names, descriptions, and weights; ensure total weight is 100%.',
    pedagogicalValue: 'Establishes transparent evaluation dimensions before student teamwork commences.'
  },
  showCustomCriterionButton: {
    badge: 'Add Custom Criterion Button',
    whatItDoes: 'Appends a new customizable evaluation dimension to the active grading rubric.',
    howToUse: 'Click "+ Add Criterion" to define specialized course-specific competencies.',
    pedagogicalValue: 'Allows instructors to tailor evaluations to unique project deliverables.'
  },
  showRubricPresets: {
    badge: 'Accreditation Standard Templates',
    whatItDoes: 'Validated academic templates including AACSB, ABET, and Bologna IPAF.',
    howToUse: 'Click any preset chip to load validated pedagogical evaluation dimensions.',
    pedagogicalValue: 'Aligns classroom peer assessments with institutional accreditation standards.'
  },
  showTargetScaleCard: {
    badge: 'Grading Scale Norm',
    whatItDoes: 'Sets final normalized grade ceiling: /20 (European standard) or /100 (percentage).',
    howToUse: 'Select your syllabus grade scale or enter a custom points maximum.',
    pedagogicalValue: 'Directly matches peer evaluation outputs to university grade reporting scales.'
  },
  showDeadlineTimer: {
    badge: 'Submission Deadline Enforcer',
    whatItDoes: 'Countdown timer and scheduling tool locking student submissions at deadline.',
    howToUse: 'Pick closing date and time; students see live deadline countdown on review forms.',
    pedagogicalValue: 'Encourages prompt submission and prevents post-deadline score tampering.'
  },
  showWeightBalanceBar: {
    badge: '100% Weight Sum Validator',
    whatItDoes: 'Real-time progress gauge enforcing that criterion weightings sum to exactly 100.0%.',
    howToUse: 'Adjust criterion sliders until bar turns teal and confirms exact 100% sum.',
    pedagogicalValue: 'Guarantees mathematical validity for WebPA weighted average grade calculations.'
  },
  showCriterionCards: {
    badge: 'Criterion Dimension Cards',
    whatItDoes: 'Editable cards configuring criterion titles, descriptions, and scoring scales.',
    howToUse: 'Customize qualitative level descriptors from Unsatisfactory to Exemplary.',
    pedagogicalValue: 'Sets clear behavioral anchors, minimizing subjective grading variance.'
  },
  showEvaluationSimulator: {
    badge: 'Student Review Form Preview',
    whatItDoes: 'Interactive simulator showing exact mobile/desktop submission experience.',
    howToUse: 'Click Preview to test-drive student review submission flow before publishing.',
    pedagogicalValue: 'Validates rubric clarity from the student perspective, avoiding confusion.'
  },
  showEvaluationFormControls: {
    badge: 'Feedback Settings Console',
    whatItDoes: 'Toggles qualitative review options: anonymous praise badges, tips, and self-ratings.',
    howToUse: 'Enable praise badges or written comments to gather constructive peer feedback.',
    pedagogicalValue: 'Fosters psychological safety while delivering meaningful qualitative growth.'
  },
  showTeamHealthPulse: {
    badge: 'Early-Warning Pulse Check',
    whatItDoes: '30-second intermediate check-ins capturing team morale, friction, and blockers.',
    howToUse: 'Review pulse gauges during active project sprints to intervene early with teams.',
    pedagogicalValue: 'Surfaces communication bottlenecks before milestone deadlines become crises.'
  },
  showLivePresentationScoring: {
    badge: 'Auditorium Presentation Console',
    whatItDoes: 'Live real-time scoring console for in-class presentations and project pitches.',
    howToUse: 'Select presenting team, tap scoring criteria live, and synthesize marks instantly.',
    pedagogicalValue: 'Enables immediate, standardized presentation grading without paper forms.'
  },

  // --- Analytics & WebPA Grading ---
  showResultsHeaderCard: {
    badge: 'Gradebook Overview & Stats',
    whatItDoes: 'Aggregate analytics card showing class GPA, multiplier spread, and completion rate.',
    howToUse: 'Review high-level grade distributions and submission compliance statistics.',
    pedagogicalValue: 'Provides instant high-level confirmation of class-wide peer review results.'
  },
  showSubmissionReset: {
    badge: 'Submission Reset & Unlock',
    whatItDoes: 'Administrative control to reset individual or classroom-wide student reviews.',
    howToUse: 'Use when a student makes an accidental error and needs to re-submit ratings.',
    pedagogicalValue: 'Provides compassionate administrative flexibility for honest student mistakes.'
  },
  showCompetencyRadar: {
    badge: 'Multi-Axis Competency Radar',
    whatItDoes: 'Spider radar chart visualizing individual student skill polygons vs team averages.',
    howToUse: 'Select students to compare technical, communicative, and leadership axes.',
    pedagogicalValue: 'Delivers rich visual feedback for student mentoring and career development.'
  },
  showJohariMatrix: {
    badge: 'Self-Awareness Johari Matrix',
    whatItDoes: 'Maps students into Open, Blind Spot, Hidden Potential, and Unknown quadrants.',
    howToUse: 'Identify students in the Blind Spot quadrant for gentle self-awareness coaching.',
    pedagogicalValue: 'Builds critical emotional intelligence and realistic self-perception.'
  },
  showQualitativeFeedback: {
    badge: 'Synthesized Peer Comments',
    whatItDoes: 'Aggregates anonymous praise tags and constructive written advice for each student.',
    howToUse: 'Review qualitative peer comments before releasing grade reports to students.',
    pedagogicalValue: 'Supplies actionable qualitative context that numbers alone cannot provide.'
  },
  showWebPACalibration: {
    badge: 'Loughborough WebPA Engine',
    whatItDoes: 'Calibrates individual student marks based on peer consensus and weighting factors.',
    howToUse: 'Adjust the WebPA Fudge Factor slider (0.0 to 1.0) to calibrate differentiation.',
    pedagogicalValue: 'Penalizes social loafing and rewards high contributors with zero inflation.'
  },
  showAnomalyAudit: {
    badge: 'Collusion & Outlier Filter',
    whatItDoes: 'Automated statistical audit flagging reciprocal grading pacts and spiteful marks.',
    howToUse: 'Review flagged outliers and choose whether to exclude biased reviewer scores.',
    pedagogicalValue: 'Protects honest students from malicious grading or unfair collusion pacts.'
  },
  showMilestonesHistory: {
    badge: 'Multi-Round Milestone Tracker',
    whatItDoes: 'Tracks longitudinal student contribution trends across multiple project milestones.',
    howToUse: 'Compare peer ratings across sprints to identify improving or disengaging students.',
    pedagogicalValue: 'Measures sustained collaborative growth across the entire semester.'
  },
  showLmsExport: {
    badge: 'Canvas / Moodle LMS Exporter',
    whatItDoes: 'Formats calibrated student grades for direct import into institutional LMS.',
    howToUse: 'Select LMS platform (Canvas, Blackboard, Moodle) and download ready CSV.',
    pedagogicalValue: 'Eliminates tedious manual gradebook data entry at the end of the semester.'
  },
  showResultsSummarySheet: {
    badge: 'Calibrated Master Gradebook',
    whatItDoes: 'Full classroom gradebook table with live recalculations and sorting.',
    howToUse: 'Input base project marks; individual student final marks update live.',
    pedagogicalValue: 'Transparent, instantaneous grade compilation ready for syllabus archiving.'
  },
  showExportReportButtons: {
    badge: 'Batch PDF & Excel Report Generator',
    whatItDoes: 'Generates individual student PDF feedback reports and classroom spreadsheets.',
    howToUse: 'Download comprehensive individual performance summaries for student feedback.',
    pedagogicalValue: 'Provides students professional, private feedback certificates for learning.'
  },
  showGradebookSearchFilter: {
    badge: 'Gradebook Student Filter',
    whatItDoes: 'Real-time search bar scanning student names, teams, and letter grades.',
    howToUse: 'Type student names to inspect individual WebPA multipliers and final marks.',
    pedagogicalValue: 'Enables quick resolution of student grade inquiries during office hours.'
  },
  showDetailedReviewMatrix: {
    badge: 'Double-Blind Review Matrix',
    whatItDoes: 'Cell-by-cell matrix showing every rating given and received within each team.',
    howToUse: 'Inspect reviewer-to-reviewee marks to verify consensus or investigate disputes.',
    pedagogicalValue: 'Provides indisputable evidentiary audit trails for contested student grades.'
  },
  showTeammateAuditLog: {
    badge: 'Chronological Event Audit Trail',
    whatItDoes: 'Timestamped log tracking evaluation submissions, edits, and administrative actions.',
    howToUse: 'Review submission timestamps to verify compliance with assignment deadlines.',
    pedagogicalValue: 'Guarantees academic integrity and non-repudiation of student evaluations.'
  },

  // --- Footer & Metadata ---
  showFooterBrandLogo: {
    badge: 'PeerLens Institutional Brand Seal',
    whatItDoes: 'PeerLens academic seal confirming verified algorithmic calculation standards.',
    howToUse: 'Visual marker signifying academic peer review rigour and integrity.',
    pedagogicalValue: 'Reinforces institutional trust and professional presentation.'
  },
  showFooterBrandName: {
    badge: 'Platform Identity Marker',
    whatItDoes: 'PeerLens platform trademark and version identification header.',
    howToUse: 'Confirms active application version and operational build information.',
    pedagogicalValue: 'Ensures reproducibility across different academic terms.'
  },
  showFooterBrandTagline: {
    badge: 'Pedagogical Philosophy Statement',
    whatItDoes: 'Classroom fairness and equitable team collaboration mission statement.',
    howToUse: 'Displays the founding academic principles behind multi-attribute peer review.',
    pedagogicalValue: 'Reminds students and faculty of the core educational mission of fairness.'
  },
  showFooterWorkspaceContext: {
    badge: 'Active Class Workspace Context',
    whatItDoes: 'Summary badge indicating active classroom ID and total enrolled participants.',
    howToUse: 'Quick verification of current session scope at the foot of long dashboards.',
    pedagogicalValue: 'Prevents accidental operations on the wrong classroom section.'
  },
  showFooterDoubleBlindBadge: {
    badge: 'Double-Blind Security Guarantee',
    whatItDoes: 'Cryptographic verification seal certifying peer evaluations are strictly anonymous.',
    howToUse: 'Reassures students that ratings and feedback remain completely confidential.',
    pedagogicalValue: 'Protects student psychological safety, leading to honest evaluations.'
  },
  showFooterSecurePrivateBadge: {
    badge: 'FERPA & GDPR Privacy Compliance',
    whatItDoes: 'Data privacy certification confirming student records are protected and private.',
    howToUse: 'Indicates compliance with international academic privacy standards.',
    pedagogicalValue: 'Guarantees institutional compliance with student data protection laws.'
  },
  showFooterCopyright: {
    badge: 'Academic License & Copyright',
    whatItDoes: 'PeerLens academic peer evaluation copyright and licensing information.',
    howToUse: 'Standard institutional copyright and intellectual property attribution.',
    pedagogicalValue: 'Protects instructional software licensing and attribution.'
  }
};

interface QuickLookHUDProps {
  payload: QuickLookPayload | null;
  cursorPos: { x: number; y: number };
}

export const QuickLookHUD: React.FC<QuickLookHUDProps> = ({ payload, cursorPos }) => {
  if (!payload || typeof document === 'undefined') return null;

  // Compute safe viewport positioning
  const hudWidth = payload.type === 'student' ? 360 : payload.type === 'team' ? 380 : payload.type === 'module' ? 380 : 320;
  const margin = 16;
  
  let left = cursorPos.x + margin;
  let top = cursorPos.y + margin;

  if (typeof window !== 'undefined') {
    if (left + hudWidth > window.innerWidth - margin) {
      left = Math.max(margin, cursorPos.x - hudWidth - margin);
    }
    if (top + 400 > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - 420);
    }
  }

  const renderContent = () => {
    switch (payload.type) {
      case 'student': {
        const { student } = payload;
        const isUnassigned = !student.groupName || student.groupName === 'Unassigned' || student.groupName === 'None';
        const role = student.role || 'Role Pending';
        const isExchange = student.isExchange;

        return (
          <div className="quicklook-card student-quicklook">
            {/* Header Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--accent-teal, #0d9488), var(--primary, #6366f1))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  flexShrink: 0
                }}
              >
                {student.name ? student.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.name || 'Unnamed Student'}
                  </h4>
                  <span style={{ fontSize: '0.66rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{student.id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  <Mail size={12} style={{ opacity: 0.7 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                </div>
              </div>
            </div>

            {/* Team & Role Status Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: isUnassigned ? 'rgba(225, 29, 72, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                color: isUnassigned ? 'var(--accent-rose, #e11d48)' : 'var(--accent-teal, #0d9488)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Users size={12} />
                {isUnassigned ? 'Unassigned' : student.groupName}
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: student.role ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-app)',
                color: student.role ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Award size={12} />
                {role}
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: student.submitted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: student.submitted ? '#10b981' : '#d97706',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginLeft: 'auto'
              }}>
                {student.submitted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {student.submitted ? 'Submitted' : 'Pending'}
              </span>
            </div>

            {/* Demographics & Academic Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-app)',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '0.65rem',
              fontSize: '0.74rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Globe size={11} /> Nationality
                </span>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '0.1rem' }}>
                  {student.nationality || 'Unspecified'}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Languages size={11} /> English
                </span>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '0.1rem' }}>
                  {student.englishProficiency || 'Intermediate'}
                </strong>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <GraduationCap size={11} /> University & Degree
                </span>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.university || 'General Institution'} {student.degree ? `• ${student.degree}` : ''}
                </strong>
                {isExchange && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-teal, #0d9488)', fontSize: '0.68rem', marginTop: '0.15rem' }}>
                    <Plane size={10} /> Exchange: {student.originalUniversity || 'Home'} → {student.currentUniversity || 'Host'}
                  </span>
                )}
              </div>
            </div>

            {/* Gender & Student Type */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
              <span>Gender: <strong style={{ color: 'var(--text-secondary)' }}>{student.gender || 'Not specified'}</strong></span>
              <span>Type: <strong style={{ color: 'var(--text-secondary)' }}>{student.studentType || 'Standard'}</strong></span>
            </div>
          </div>
        );
      }

      case 'team': {
        const { team, isLocked } = payload;
        return (
          <div className="quicklook-card team-quicklook">
            {/* Team Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(13, 148, 136, 0.15)',
                  color: 'var(--accent-teal, #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 800
                }}>
                  <Users size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {team.groupName}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {team.studentCount} {team.studentCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {isLocked && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#d97706',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <Lock size={10} /> Locked
                  </span>
                )}
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: team.diversityScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: team.diversityScore >= 80 ? '#10b981' : 'var(--primary, #6366f1)'
                }}>
                  {team.diversityScore}%
                </span>
              </div>
            </div>

            {/* Team Roster Members Preview */}
            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Assigned Teammates ({team.students.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.35rem', maxHeight: '150px', overflowY: 'auto' }}>
                {team.students.map(s => (
                  <div 
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.28rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-app)',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </span>
                      {s.role && (
                        <span style={{ fontSize: '0.64rem', padding: '0.04rem 0.25rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #6366f1)', fontWeight: 700 }}>
                          {s.role}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {s.nationality || s.university || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diversity Breakdown Summary */}
            {team.ruleSatisfactions && team.ruleSatisfactions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                {team.ruleSatisfactions.map(rs => (
                  <span 
                    key={rs.ruleId}
                    style={{
                      fontSize: '0.66rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      backgroundColor: rs.satisfactionScore >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: rs.satisfactionScore >= 75 ? '#10b981' : '#d97706',
                      fontWeight: 700
                    }}
                  >
                    {rs.ruleName}: {rs.satisfactionScore}%
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'module': {
        const { module } = payload;
        const info = MODULE_SPECIFIC_GUIDES[module.key] || {
          badge: `${module.category.toUpperCase()} TOOL`,
          whatItDoes: module.desc || 'Provides dedicated classroom management and configuration controls.',
          howToUse: 'Interact directly with this component to configure classroom settings or inspect cohort data.',
          pedagogicalValue: 'Enhances instructor workflow efficiency and supports equitable team collaboration.'
        };

        return (
          <div className="quicklook-card module-quicklook">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Layers size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {module.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', padding: '0.08rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {module.category}
                  </span>
                  {info.badge && (
                    <span style={{ fontSize: '0.65rem', padding: '0.08rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(13, 148, 136, 0.12)', color: 'var(--accent-teal, #0d9488)', fontWeight: 700 }}>
                      {info.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In-Depth Concrete Description */}
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {info.whatItDoes}
            </p>

            {/* How It Operates / Practical Guidance */}
            {info.howToUse && (
              <div style={{
                backgroundColor: 'var(--bg-app)',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '0.65rem',
                fontSize: '0.72rem'
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                  <Info size={11} /> Practical Guidance
                </span>
                <span style={{ color: 'var(--text-primary)', lineHeight: 1.4, display: 'block' }}>
                  {info.howToUse}
                </span>
              </div>
            )}

            {/* Pedagogical Insight / Value */}
            {info.pedagogicalValue && (
              <div style={{
                backgroundColor: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.18)',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'var(--primary, #6366f1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                lineHeight: 1.35
              }}>
                <Sparkles size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{info.pedagogicalValue}</span>
              </div>
            )}
          </div>
        );
      }

      case 'action': {
        return (
          <div className="quicklook-card action-quicklook">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                color: 'var(--accent-teal, #0d9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {payload.icon || <Sparkles size={15} />}
              </div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {payload.label}
              </h4>
            </div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {payload.description}
            </p>
            {payload.shortcut && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <Command size={11} />
                <span>Shortcut: <strong style={{ color: 'var(--text-primary)' }}>{payload.shortcut}</strong></span>
              </div>
            )}
          </div>
        );
      }

      case 'generic': {
        return (
          <div className="quicklook-card generic-quicklook">
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {payload.title}
            </h4>
            {payload.subtitle && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                {payload.subtitle}
              </span>
            )}
            {payload.details && (
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {payload.details}
              </p>
            )}
          </div>
        );
      }
    }
  };

  return createPortal(
    <div 
      className="quicklook-hud-overlay"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${hudWidth}px`,
        zIndex: 999999,
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div 
        className="quicklook-hud-glass"
        style={{
          backgroundColor: 'var(--bg-surface, rgba(255, 255, 255, 0.96))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.2))',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '1rem',
          animation: 'quickLookPop 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {renderContent()}

        {/* Spacebar Release Hint Footer */}
        <div 
          style={{
            marginTop: '0.65rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.66rem',
            color: 'var(--text-muted)'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.08rem 0.35rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              fontWeight: 800,
              fontFamily: 'monospace',
              fontSize: '0.64rem'
            }}>
              Space
            </span>
            Release to dismiss
          </span>
          <span style={{ opacity: 0.7 }}>PeerLens Quick Look</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
