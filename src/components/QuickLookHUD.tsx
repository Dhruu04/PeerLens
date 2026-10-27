import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Users, Sparkles, Mail, GraduationCap, 
  Globe, Languages, CheckCircle2, Clock, 
  Layers, Lock, Plane, Award, Command,
  TrendingUp, BarChart2, BookOpen,
  Calculator, Lightbulb, Check, Pin, PinOff, X,
  Copy, ExternalLink, Flag, AlertTriangle,
  Activity, Zap, Compass, Eye, EyeOff, Code, Sliders, SlidersHorizontal, CheckCircle
} from 'lucide-react';
import type { Student, ClassData, GradingScaleField } from '../utils/math';
import { calculateStudentMetrics, calculateStudentWebPAScore, getTargetScale } from '../utils/math';
import { calculateJohariWindowMetric } from '../utils/feedbackAnalytics';
import type { GroupDiversityReport } from '../utils/grouping';
import type { ModuleItem } from '../utils/moduleRegistry';
import { FEATURE_INFO_REGISTRY } from '../data/featureDescriptions';
import { AnimatedNumber } from './AnimatedNumber';

export type QuickLookPayload = 
  | { 
      type: 'student'; 
      student: Student; 
      context?: 'grouping' | 'grading';
      teamReport?: GroupDiversityReport | null;
      classData?: ClassData | null;
      baseGroupGrade?: number;
      fudgeWeight?: number;
    }
  | { 
      type: 'team'; 
      team: GroupDiversityReport; 
      context?: 'grouping' | 'grading';
      isLocked?: boolean;
      classData?: ClassData | null;
    }
  | {
      type: 'criterion';
      criterion: GradingScaleField;
      classData?: ClassData | null;
      stats?: {
        averageScore: number;
        stdDev: number;
        count: number;
        consensusLabel: string;
      };
    }
  | {
      type: 'metric';
      metricKey: string;
      label: string;
      value: string | number;
      student?: Student;
      teamName?: string;
      classData?: ClassData | null;
      breakdown?: {
        baseGrade?: number;
        webpaRatio?: number;
        fudgeWeight?: number;
        rawScore?: number;
        calibratedScore?: number;
        penaltyApplied?: boolean;
        maxCapApplied?: boolean;
        belowMin?: boolean;
        minScore?: number;
        maxScore?: number;
        explanation?: string;
        formula?: string;
      };
      historicalTrend?: string;
    }
  | {
      type: 'control';
      controlKey: string;
      title: string;
      currentValue: string | number;
      description: string;
      impactAnalysis: string;
      pedagogicalRationale?: string;
      recommendation?: string;
    }
  | { 
      type: 'module'; 
      module: ModuleItem;
      isEnabled?: boolean;
      classData?: ClassData | null;
      liveTelemetry?: Record<string, string | number>;
    }
  | { 
      type: 'action'; 
      label: string; 
      description: string; 
      shortcut?: string; 
      icon?: React.ReactNode;
      impact?: string;
      prerequisites?: string;
      isDestructive?: boolean;
      tip?: string;
    }
  | { 
      type: 'generic'; 
      title: string; 
      subtitle?: string; 
      details?: string;
      metrics?: Array<{ label: string; value: string | number }>;
      tip?: string;
    };

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

const MODULE_KEY_TO_FEATURE_ID: Record<string, string> = {
  // Navigation & Tools
  showClassPicker: 'density-presets',
  showDeleteClassButton: 'density-presets',
  showNewClassButton: 'density-presets',
  showLayoutPresets: 'density-presets',
  showCommandPalette: 'command-palette',
  showQuickActionPill: 'quick-action-pill',
  showClassroomSnapshots: 'classroom-snapshots',

  // Section 1: Roster, Enrollment & Teams
  showSelfEnrollmentCard: 'classroom-qr',
  showClassroomQRCard: 'classroom-qr',
  showQuickActionsCard: 'quick-actions',
  showImportWizardCard: 'import-wizard',
  showRosterTable: 'classroom-roster',
  showDuplicateDetector: 'duplicate-detector',
  showTeamOverviewCards: 'team-cohorts',
  showTeamCohorts: 'team-cohorts',
  showAutoGroupStudio: 'auto-group-studio',
  showTeamKickoffAndRoles: 'team-kickoff-roles',

  // Section 2: Rubric & Grading Scales
  showRubricBuilder: 'grading-rubric',
  showRubricPresets: 'rubric-presets',
  showTargetScale: 'target-scale',

  // Section 3: Evaluation Controls & Windows
  showSubmissionWindow: 'submission-window',
  showEmailAutomation: 'email-automation',
  showLinkDispatcher: 'link-dispatcher',
  showCloudSync: 'cloud-sync',
  showLivePresentationScoring: 'presentation-scoring',

  // Section 4: Analytics & Score Adjustment
  showResultsHeaderCard: 'calculation-matrix',
  showCalculationMatrix: 'calculation-matrix',
  showDetailedReviewMatrix: 'who-rated-whom',
  showSkillsRadarAnalytics: 'radar-analytics',
  showJohariWindow: 'johari-window',
  showQualitativeFeedback: 'feedback-sentiment',
  showWebPACalibration: 'webpa-calibration',
  showAnomalyAudit: 'anomaly-detection',
  showMilestonesHistory: 'milestones-sprints',

  // Section 5: Gradebook & Exports
  showLmsExport: 'lms-export',
  showLmsCustomExport: 'lms-custom-export',
  showResultsSummarySheet: 'results-summary-sheet',
  showExportReportButtons: 'results-summary-sheet',
  showGradebookSearchFilter: 'results-summary-sheet'
};

const CATEGORY_THEMES: Record<string, { bg: string; color: string; border: string }> = {
  'Algorithm': {
    bg: 'rgba(139, 92, 246, 0.12)',
    color: '#8b5cf6',
    border: 'rgba(139, 92, 246, 0.25)'
  },
  'Grading': {
    bg: 'rgba(13, 148, 136, 0.12)',
    color: '#0d9488',
    border: 'rgba(13, 148, 136, 0.25)'
  },
  'Analytics': {
    bg: 'rgba(37, 99, 235, 0.12)',
    color: '#2563eb',
    border: 'rgba(37, 99, 235, 0.25)'
  },
  'Roster': {
    bg: 'rgba(5, 150, 105, 0.12)',
    color: '#059669',
    border: 'rgba(5, 150, 105, 0.25)'
  },
  'Student Portal': {
    bg: 'rgba(217, 119, 6, 0.12)',
    color: '#d97706',
    border: 'rgba(245, 158, 11, 0.25)'
  },
  'Interface & Layout': {
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#6366f1',
    border: 'rgba(99, 102, 241, 0.25)'
  },
  'Security': {
    bg: 'rgba(225, 29, 72, 0.12)',
    color: '#e11d48',
    border: 'rgba(225, 29, 72, 0.25)'
  }
};

interface QuickLookHUDProps {
  payload: QuickLookPayload | null;
  cursorPos: { x: number; y: number };
  isPinned?: boolean;
  onTogglePin?: () => void;
  onDismiss?: () => void;
  onAction?: (actionId: string, payload?: any) => void;
}

export const QuickLookHUD: React.FC<QuickLookHUDProps> = ({ 
  payload, 
  cursorPos,
  isPinned = false,
  onTogglePin,
  onDismiss,
  onAction
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(380);

  useEffect(() => {
    if (!hudRef.current) return;
    const updateSize = () => {
      if (hudRef.current) {
        const rect = hudRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          setMeasuredHeight(Math.ceil(rect.height));
        }
      }
    };
    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      ro.observe(hudRef.current);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [payload, isPinned]);

  if (!payload || typeof document === 'undefined') return null;

  const handleCopy = (text: string, fieldId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1600);
    }
  };

  // Viewport-safe bounds computation
  const hudWidth = payload.type === 'student' ? 390 : payload.type === 'team' ? 415 : payload.type === 'module' ? 390 : (payload.type === 'criterion' || payload.type === 'metric' || payload.type === 'control') ? 400 : 340;
  const margin = 16;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Horizontal positioning: Flip to left of cursor if overflowing right edge
  let left = cursorPos.x + margin;
  if (left + hudWidth > screenW - margin) {
    left = cursorPos.x - hudWidth - margin;
  }
  left = Math.max(margin, Math.min(left, screenW - hudWidth - margin));

  // Vertical positioning: Flip above cursor if overflowing bottom edge
  const effectiveCardHeight = Math.min(measuredHeight, screenH - 32);
  let top = cursorPos.y + margin;
  if (top + effectiveCardHeight > screenH - margin) {
    top = cursorPos.y - effectiveCardHeight - margin;
  }
  top = Math.max(margin, Math.min(top, screenH - effectiveCardHeight - margin));

  const renderContent = () => {
    switch (payload.type) {
      case 'student': {
        const defaultScale = payload.classData ? getTargetScale(payload.classData) : 31;
        const { student, classData, baseGroupGrade = defaultScale, fudgeWeight = 0.5, context = 'grouping' } = payload;
        const isGradingContext = context === 'grading';
        const isUnassigned = !student.groupName || student.groupName === 'Unassigned' || student.groupName === 'None';
        const role = student.role || 'Role Pending';
        const isExchange = student.isExchange || student.studentType === 'Erasmus' || student.studentType === 'Exchange';
        const isIntl = student.isInternational || student.studentType === 'International';
        const studentTypeLabel = isExchange ? 'Exchange / Erasmus' : isIntl ? 'International' : 'Domestic';

        if (!isGradingContext) {
          // =========================================================================
          // CONTEXT: AUTO-GROUP TEAMS / ROSTER / FORMATION (Personal & Demographics)
          // =========================================================================
          const nationality = student.nationality || student.currentCountry || student.originalCountry || 'Unspecified';
          const degree = student.degree || 'General Program';
          const university = student.university || student.currentUniversity || student.originalUniversity || 'Host Campus';
          const english = student.englishProficiency || 'Proficient';

          return (
            <div className="quicklook-card student-quicklook-profile" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Header Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--accent-teal, #0d9488), var(--primary, #6366f1))',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                    flexShrink: 0
                  }}
                >
                  {student.name ? student.name.charAt(0).toUpperCase() : <User size={20} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {student.name || 'Unnamed Student'}
                    </h4>
                    {student.flaggedForReview && (
                      <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem' }}>
                        Flagged
                      </span>
                    )}
                    {student.isExcused && (
                      <span className="badge badge-amber" style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem' }}>
                        Excused
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                    <Mail size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                  </div>
                </div>
              </div>

              {/* Team, Role & Cohort Pill Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                  backgroundColor: isExchange ? 'rgba(16, 185, 129, 0.12)' : isIntl ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-app)',
                  color: isExchange ? '#059669' : isIntl ? '#0284c7' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  marginLeft: 'auto'
                }}>
                  {isExchange ? <Plane size={12} /> : isIntl ? <Globe size={12} /> : <User size={12} />}
                  {studentTypeLabel}
                </span>
              </div>

              {/* Personal & Academic Profile 2x2 Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.45rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem'
              }}>
                {/* 1. Nationality & Region */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <Globe size={11} style={{ color: 'var(--accent-teal, #0d9488)' }} /> Nationality &amp; Origin
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={nationality}>
                    {nationality}
                  </strong>
                </div>

                {/* 2. Degree / Program */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <GraduationCap size={11} style={{ color: 'var(--primary, #6366f1)' }} /> Degree / Major
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={degree}>
                    {degree}
                  </strong>
                </div>

                {/* 3. University / Campus */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <BookOpen size={11} style={{ color: '#d97706' }} /> Origin Campus
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={university}>
                    {university}
                  </strong>
                </div>

                {/* 4. Language Level */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <Languages size={11} style={{ color: '#10b981' }} /> Language Level
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={english}>
                    {english}
                  </strong>
                </div>
              </div>

              {/* Extra Personal Notes / Charter Agreement / Exemption */}
              {student.roleDetails && (
                <div style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Award size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span><strong>Charter Responsibility:</strong> {student.roleDetails}</span>
                </div>
              )}

              {student.isExcused && student.excusedReason && (
                <div style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.68rem',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Clock size={12} style={{ flexShrink: 0 }} />
                  <span><strong>Approved Leave:</strong> {student.excusedReason}</span>
                </div>
              )}

              {student.flaggedForReview && student.suspiciousReason && (
                <div style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  fontSize: '0.68rem',
                  color: '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Flag size={12} style={{ flexShrink: 0 }} />
                  <span><strong>Audit Flag:</strong> {student.suspiciousReason}</span>
                </div>
              )}

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('open_student', student);
                  }}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.7rem',
                    fontWeight: 750,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }}
                  title="Open Student Profile Modal (E)"
                >
                  <ExternalLink size={11} style={{ color: 'var(--primary)' }} />
                  <span>Profile</span>
                  <kbd style={{ fontSize: '0.58rem', padding: '0.05rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>E</kbd>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('toggle_flag', student.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: student.flaggedForReview ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-app)',
                    border: student.flaggedForReview ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid var(--border-color)',
                    fontSize: '0.7rem',
                    fontWeight: 750,
                    color: student.flaggedForReview ? '#e11d48' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }}
                  title="Toggle Audit Flag (F)"
                >
                  <Flag size={11} />
                  <span>{student.flaggedForReview ? 'Flagged' : 'Flag'}</span>
                  <kbd style={{ fontSize: '0.58rem', padding: '0.05rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>F</kbd>
                </button>
              </div>
            </div>
          );
        }

        // =========================================================================
        // CONTEXT: RESULTS SUMMARY SHEET & GRADEBOOK (Gradebook & WebPA Performance)
        // =========================================================================
        const hasClassData = !!(classData && classData.students && classData.students.length > 0);
        const metrics = hasClassData ? calculateStudentMetrics(student, classData) : null;
        const webpa = hasClassData ? calculateStudentWebPAScore(student.id, student.groupName, classData, baseGroupGrade, fudgeWeight) : null;
        const johari = hasClassData ? calculateJohariWindowMetric(student.id, classData) : null;

        const selfReview = hasClassData
          ? (classData.reviews || []).find(r => r.reviewerId === student.id && r.recipientId === student.id)
          : null;

        const webpaRatio = webpa ? webpa.ratio : 1.0;
        const webpaColor = webpaRatio >= 1.05
          ? '#059669'
          : webpaRatio >= 0.98
            ? 'var(--primary, #6366f1)'
            : webpaRatio >= 0.90
              ? '#d97706'
              : '#e11d48';

        const webpaBg = webpaRatio >= 1.05
          ? 'rgba(16, 185, 129, 0.12)'
          : webpaRatio >= 0.98
            ? 'rgba(99, 102, 241, 0.1)'
            : webpaRatio >= 0.90
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(225, 29, 72, 0.12)';

        // Smart Context-Aware Diagnostics
        const smartAlerts: Array<{ icon: any; color: string; bg: string; text: string }> = [];

        if (student.flaggedForReview) {
          smartAlerts.push({
            icon: Flag,
            color: '#e11d48',
            bg: 'rgba(225, 29, 72, 0.1)',
            text: student.suspiciousReason || 'Flagged for grading audit'
          });
        }

        if (!student.submitted) {
          smartAlerts.push({
            icon: Clock,
            color: '#d97706',
            bg: 'rgba(245, 158, 11, 0.1)',
            text: `Review pending: At risk of non-submission penalty (-${classData?.peerAdjustmentConfig?.nonSubmitterPenalty ?? 10}%)`
          });
        }

        if (webpa && webpa.ratio >= 1.15) {
          smartAlerts.push({
            icon: TrendingUp,
            color: '#059669',
            bg: 'rgba(16, 185, 129, 0.1)',
            text: `High contributor: Rated +${((webpa.ratio - 1) * 100).toFixed(0)}% above team contribution benchmark`
          });
        } else if (webpa && webpa.ratio <= 0.85) {
          smartAlerts.push({
            icon: AlertTriangle,
            color: '#e11d48',
            bg: 'rgba(225, 29, 72, 0.1)',
            text: `Contribution gap: Rated ${((1 - webpa.ratio) * 100).toFixed(0)}% below team average`
          });
        }

        if (johari && johari.category === 'underestimating') {
          smartAlerts.push({
            icon: Sparkles,
            color: '#6366f1',
            bg: 'rgba(99, 102, 241, 0.1)',
            text: `Hidden Talent: Peers rate student higher than self-evaluation (+${johari.gapPct}%)`
          });
        } else if (johari && johari.category === 'overestimating') {
          smartAlerts.push({
            icon: AlertTriangle,
            color: '#d97706',
            bg: 'rgba(245, 158, 11, 0.1)',
            text: `Perception Gap: Student self-rating exceeds peer assessment (-${Math.abs(johari.gapPct || 0)}%)`
          });
        }

        return (
          <div className="quicklook-card student-quicklook-grading">
            {/* Header Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--accent-teal, #0d9488), var(--primary, #6366f1))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                  flexShrink: 0
                }}
              >
                {student.name ? student.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {student.name || 'Unnamed Student'}
                  </h4>
                  {student.flaggedForReview && (
                    <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem' }}>
                      Flagged
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  <Mail size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                </div>
              </div>
            </div>

            {/* Smart Diagnostics Banner */}
            {smartAlerts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.65rem' }}>
                {smartAlerts.slice(0, 2).map((alert, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: alert.bg,
                      border: `1px solid ${alert.color}33`,
                      fontSize: '0.68rem',
                      color: alert.color,
                      fontWeight: 700,
                      lineHeight: 1.3
                    }}
                  >
                    <alert.icon size={12} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{alert.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Team & Role Status Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
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

            {/* Gradebook & Evaluation Results */}
            {hasClassData && (
              <div style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem 0.75rem',
                marginBottom: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <BarChart2 size={12} style={{ color: 'var(--primary)' }} />
                    Gradebook &amp; Evaluation Results
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>
                    {metrics ? `${metrics.reviewsReceived}/${metrics.expectedReviewsCount} reviews` : ''}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  <div style={{
                    backgroundColor: webpaBg,
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.45rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      WebPA
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: webpaColor, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
                      <TrendingUp size={11} /> {webpa ? <AnimatedNumber value={webpa.ratio} decimals={2} suffix="x" /> : '1.00x'}
                    </strong>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.45rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      Final Mark
                    </span>
                    <strong 
                      style={{ 
                        fontSize: '0.92rem', 
                        color: webpa?.isInsufficient ? 'var(--accent-rose, #e11d48)' : 'var(--text-primary)', 
                        display: 'block', 
                        marginTop: '0.1rem', 
                        whiteSpace: 'nowrap',
                        cursor: webpa?.isInsufficient ? 'help' : 'default'
                      }}
                      title={
                        webpa
                          ? webpa.isInsufficient
                            ? `Real Score: ${webpa.adjustedGrade.toFixed(1)} / ${webpa.teamBaseGrade} (Below minimum passing threshold of ${webpa.minScore} pts)`
                            : webpa.isCapped
                              ? `Capped at max ${webpa.maxScore} pts (raw: ${webpa.rawAdjustedGrade.toFixed(1)})`
                              : undefined
                          : undefined
                      }
                    >
                      {webpa
                        ? webpa.isInsufficient
                          ? 'Insufficient'
                          : <AnimatedNumber value={webpa.adjustedGrade} decimals={1} />
                        : '—'}
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {' '}/ {webpa ? webpa.teamBaseGrade : defaultScale}
                      </span>
                    </strong>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.45rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      Peer Score
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--primary)', display: 'block', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
                      {metrics?.overallPercentage !== null ? `${metrics?.overallPercentage}%` : 'N/A'}
                    </strong>
                  </div>
                </div>

                {johari && johari.category !== 'insufficient_data' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: johari.bgColor || 'var(--bg-surface)',
                    border: `1px solid ${johari.color}33`,
                    fontSize: '0.68rem',
                    gap: '0.4rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 750, color: johari.color }}>
                      <Sparkles size={11} /> {johari.label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.64rem' }}>
                      Self: {johari.selfScorePct}% vs Peers: {johari.peerScorePct}% ({johari.gapPct !== null && johari.gapPct > 0 ? '+' : ''}{johari.gapPct}%)
                    </span>
                  </div>
                )}

                {/* Rubric Criteria Teammate Averages */}
                {classData.fields && classData.fields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Rubric Criteria Teammate Averages
                    </span>
                    {classData.fields.slice(0, 3).map(f => {
                      const avg = metrics?.fieldAverages?.[f.id] ?? f.min;
                      const fMax = f.max || 5;
                      const fMin = f.min || 1;
                      const pct = Math.max(0, Math.min(100, ((avg - fMin) / (fMax - fMin || 1)) * 100));
                      const selfScore = selfReview?.scores?.[f.id];

                      return (
                        <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 650, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }} title={f.name}>
                              {f.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, flexShrink: 0 }}>
                              <span style={{ color: 'var(--text-primary)' }}>{avg.toFixed(1)} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>/ {fMax}</span></span>
                              {selfScore !== undefined && (
                                <span style={{ color: 'var(--accent-teal, #0d9488)', fontSize: '0.62rem', fontWeight: 700 }}>
                                  (Self {selfScore})
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Smart Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('open_student', student);
                }}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.7rem',
                  fontWeight: 750,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                title="Open Student Profile Modal (E)"
              >
                <ExternalLink size={11} style={{ color: 'var(--primary)' }} />
                <span>Profile</span>
                <kbd style={{ fontSize: '0.58rem', padding: '0.05rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>E</kbd>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('toggle_flag', student.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: student.flaggedForReview ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-app)',
                  border: student.flaggedForReview ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid var(--border-color)',
                  fontSize: '0.7rem',
                  fontWeight: 750,
                  color: student.flaggedForReview ? '#e11d48' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                title="Toggle Audit Flag (F)"
              >
                <Flag size={11} />
                <span>{student.flaggedForReview ? 'Flagged' : 'Flag'}</span>
                <kbd style={{ fontSize: '0.58rem', padding: '0.05rem 0.25rem', borderRadius: '3px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>F</kbd>
              </button>
            </div>
          </div>
        );
      }

      case 'team': {
        const { team, isLocked, classData, context = 'grouping' } = payload;
        const isGradingContext = context === 'grading';
        const total = team.students.length;
        const submitted = team.students.filter(s => s.submitted).length;
        const submitPct = total > 0 ? Math.round((submitted / total) * 100) : 0;
        const filledRoles = team.students.filter(s => Boolean(s.role)).length;

        const baseGroupGrade = classData?.teamBaseGrades?.[team.groupName] ?? (classData ? getTargetScale(classData) : 31);
        const fudgeWeight = classData?.peerAdjustmentConfig?.fudgeWeight ?? 1.0;

        if (!isGradingContext) {
          // =========================================================================
          // CONTEXT: AUTO-GROUP TEAMS / ROSTER / FORMATION (Diversity & Composition)
          // =========================================================================
          const genderEntries = Object.entries(team.genderCounts || {}).filter(([, c]) => c > 0);
          const fullGenderSummary = genderEntries.map(([g, c]) => `${c} ${g}`).join(' • ');
          const genderSummary = genderEntries.length > 2 || fullGenderSummary.length > 18
            ? genderEntries.map(([g, c]) => `${c}${g.charAt(0).toUpperCase()}`).join(' • ')
            : fullGenderSummary;

          const hasOptimalBalance = team.diversityScore >= 85;
          const hasSoloGender = Object.values(team.genderCounts || {}).some(c => c === 1) && total >= 3;
          const allRolesFilled = filledRoles === total && total > 0;

          return (
            <div className="quicklook-card team-quicklook-formation" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Team Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
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
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {team.groupName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {team.studentCount} {team.studentCount === 1 ? 'member' : 'members'}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '0.68rem', color: allRolesFilled ? 'var(--accent-teal, #0d9488)' : 'var(--text-muted)', fontWeight: 650 }}>
                        {filledRoles}/{total} Roles Claimed
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {isLocked && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.12rem 0.4rem',
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
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: team.diversityScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: team.diversityScore >= 80 ? '#10b981' : 'var(--primary, #6366f1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1
                  }}>
                    <span>{team.diversityScore}%</span>
                    <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', opacity: 0.8, marginTop: '2px' }}>Mix</span>
                  </div>
                </div>
              </div>

              {/* Diversity & Composition Breakdown Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.45rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.55rem'
              }}>
                {/* 1. Nationalities */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <Globe size={11} style={{ color: 'var(--accent-teal, #0d9488)' }} /> Nationalities
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team.nationalities.join(', ')}>
                    {team.uniqueNationalityCount} {team.uniqueNationalityCount === 1 ? 'Country' : 'Countries'} ({team.nationalities.slice(0, 2).join(', ')}{team.nationalities.length > 2 ? ` +${team.nationalities.length - 2}` : ''})
                  </strong>
                </div>

                {/* 2. Campuses / Universities */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <GraduationCap size={11} style={{ color: 'var(--primary, #6366f1)' }} /> Campuses
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team.universities.join(', ')}>
                    {team.uniqueUniversityCount} {team.uniqueUniversityCount === 1 ? 'Institution' : 'Institutions'}
                  </strong>
                </div>

                {/* 3. Language Proficiency */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <Languages size={11} style={{ color: '#10b981' }} /> Language Level
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Avg {team.avgEnglishCEFR || 'Fluent'}
                  </strong>
                </div>

                {/* 4. Gender Balance */}
                <div style={{ padding: '0.35rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.2px' }}>
                    <Users size={11} style={{ color: '#d97706' }} /> Gender Parity
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fullGenderSummary}>
                    {genderSummary || 'Balanced'}
                  </strong>
                </div>
              </div>

              {/* Smart Composition Highlight Banner */}
              {hasOptimalBalance ? (
                <div style={{
                  padding: '0.35rem 0.55rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: '#059669'
                }}>
                  <Sparkles size={12} style={{ flexShrink: 0 }} />
                  <span><strong>Optimal Balance:</strong> High demographic mixing across grouping criteria.</span>
                </div>
              ) : hasSoloGender ? (
                <div style={{
                  padding: '0.35rem 0.55rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: '#d97706'
                }}>
                  <Lightbulb size={12} style={{ flexShrink: 0 }} />
                  <span><strong>Composition Tip:</strong> Solo gender representation detected. Consider swapping to ensure peer support.</span>
                </div>
              ) : null}

              {/* Grouping Rule Satisfaction Pills */}
              {team.ruleSatisfactions && team.ruleSatisfactions.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {team.ruleSatisfactions.slice(0, 3).map(r => (
                    <span 
                      key={r.ruleId}
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '5px',
                        backgroundColor: r.satisfactionScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app)',
                        color: r.satisfactionScore >= 80 ? '#059669' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{r.ruleName}:</span>
                      <strong>{r.satisfactionScore}%</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Assigned Teammates Roster Overview */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Assigned Members ({team.students.length})
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    Role &amp; Origin
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {team.students.map(s => {
                    const nat = s.nationality || s.currentCountry || '';
                    const deg = s.degree || '';
                    const originTag = [deg, nat].filter(Boolean).join(' • ');

                    return (
                      <div 
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-app)',
                          fontSize: '0.74rem',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </span>
                          {s.role && (
                            <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #6366f1)', fontWeight: 700, flexShrink: 0 }}>
                              {s.role}
                            </span>
                          )}
                        </div>

                        {originTag && (
                          <span style={{
                            fontSize: '0.64rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                            flexShrink: 1,
                            textAlign: 'right'
                          }} title={originTag}>
                            {originTag}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // =========================================================================
        // CONTEXT: RESULTS SUMMARY SHEET & GRADEBOOK (Gradebook, WebPA, Velocity)
        // =========================================================================
        const memberScores = classData ? team.students.map(s => {
          return calculateStudentWebPAScore(s.id, team.groupName, classData, baseGroupGrade, fudgeWeight);
        }).filter(Boolean) : [];

        const ratios = memberScores.map(m => m!.ratio);
        const minRatio = ratios.length > 0 ? Math.min(...ratios) : 1.0;
        const maxRatio = ratios.length > 0 ? Math.max(...ratios) : 1.0;
        const spread = maxRatio - minRatio;

        return (
          <div className="quicklook-card team-quicklook-grading" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Team Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {team.groupName}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {team.studentCount} {team.studentCount === 1 ? 'member' : 'members'}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 650 }}>
                      Base Grade: {baseGroupGrade} pts
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {isLocked && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.12rem 0.4rem',
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
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary, #6366f1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1
                }}>
                  <span>{minRatio.toFixed(2)}x – {maxRatio.toFixed(2)}x</span>
                  <span style={{ fontSize: '0.54rem', textTransform: 'uppercase', opacity: 0.8, marginTop: '2px' }}>Spread</span>
                </div>
              </div>
            </div>

            {/* Smart Peer Consensus Insight Banner */}
            <div style={{
              padding: '0.35rem 0.55rem',
              borderRadius: '6px',
              backgroundColor: spread <= 0.10 ? 'rgba(13, 148, 136, 0.08)' : spread <= 0.30 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${spread <= 0.10 ? 'rgba(13, 148, 136, 0.22)' : spread <= 0.30 ? 'rgba(99, 102, 241, 0.22)' : 'rgba(245, 158, 11, 0.22)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.7rem',
              color: spread <= 0.10 ? '#0d9488' : spread <= 0.30 ? 'var(--primary, #6366f1)' : '#d97706'
            }}>
              {spread <= 0.10 ? (
                <>
                  <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                  <span><strong>High Team Consensus:</strong> Teammates evaluated each other with strong agreement (Spread: {spread.toFixed(2)}x).</span>
                </>
              ) : spread <= 0.30 ? (
                <>
                  <Activity size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Moderate Variation:</strong> Minor differentiation in individual student contributions (Spread: {spread.toFixed(2)}x).</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Contribution Gap Flagged:</strong> Significant peer rating divergence across members (Spread: {spread.toFixed(2)}x).</span>
                </>
              )}
            </div>

            {/* Smart Submission Velocity Meter */}
            <div style={{
              padding: '0.4rem 0.55rem',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontWeight: 650 }}>
                  <Clock size={11} style={{ color: submitPct === 100 ? '#10b981' : '#d97706' }} />
                  Evaluation Submissions
                </span>
                <strong style={{ color: submitPct === 100 ? '#10b981' : submitPct >= 50 ? 'var(--primary)' : '#d97706', fontSize: '0.72rem' }}>
                  {submitted} of {total} ({submitPct}%)
                </strong>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${submitPct}%`, height: '100%', backgroundColor: submitPct === 100 ? '#10b981' : 'var(--primary)', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Team Roster Members Evaluation Preview */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Teammate Multipliers &amp; Marks ({team.students.length})
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  ● Submitted / ○ Pending
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                {team.students.map(s => {
                  const sScore = classData ? calculateStudentWebPAScore(s.id, team.groupName, classData, baseGroupGrade, fudgeWeight) : null;
                  const ratioColor = sScore ? (sScore.ratio >= 1.05 ? '#059669' : sScore.ratio < 0.95 ? '#d97706' : 'var(--text-primary)') : 'var(--text-primary)';

                  return (
                    <div 
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-app)',
                        fontSize: '0.74rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1, marginRight: '0.4rem' }}>
                        {s.submitted ? (
                          <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                        ) : (
                          <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </span>
                        {s.role && (
                          <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary, #6366f1)', fontWeight: 700, flexShrink: 0 }}>
                            {s.role}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        {sScore ? (
                          <span 
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 750,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface)',
                              border: sScore.isInsufficient ? '1px solid rgba(225, 29, 72, 0.35)' : '1px solid var(--border-color)',
                              color: sScore.isInsufficient ? 'var(--accent-rose, #e11d48)' : ratioColor,
                              fontVariantNumeric: 'tabular-nums',
                              cursor: sScore.isInsufficient ? 'help' : 'default'
                            }}
                            title={
                              sScore.isInsufficient
                                ? `Real Score: ${sScore.adjustedGrade.toFixed(1)} / ${sScore.teamBaseGrade} (Below minimum passing threshold of ${sScore.minScore} pts)`
                                : sScore.isCapped
                                  ? `Capped at max ${sScore.maxScore} pts (raw calculation: ${sScore.rawAdjustedGrade.toFixed(1)})`
                                  : undefined
                            }
                          >
                            <AnimatedNumber value={sScore.ratio} decimals={2} suffix="x" /> &bull; {sScore.isInsufficient ? 'Insufficient' : <AnimatedNumber value={sScore.adjustedGrade} decimals={1} />}
                            {sScore.isCapped && ' (Cap)'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                            {s.submitted ? 'Submitted' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'criterion': {
        const { criterion, classData, stats } = payload;
        const fMax = criterion.max || 5;
        const fMin = criterion.min || 1;
        const weight = criterion.weight ?? (classData ? Math.round(100 / Math.max(1, classData.fields.length)) : 25);
        
        let avgScore = stats?.averageScore ?? 0;
        let stdDev = stats?.stdDev ?? 0;
        let ratingCount = stats?.count ?? 0;
        let consensusLabel = stats?.consensusLabel ?? 'Gathering Reviews';
        
        if (!stats && classData && classData.reviews && classData.reviews.length > 0) {
          const scores = classData.reviews
            .map(r => r.scores[criterion.id])
            .filter((s): s is number => typeof s === 'number' && !isNaN(s));
          ratingCount = scores.length;
          if (ratingCount > 0) {
            avgScore = Number((scores.reduce((a, b) => a + b, 0) / ratingCount).toFixed(2));
            const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / ratingCount;
            stdDev = Number(Math.sqrt(variance).toFixed(2));
            consensusLabel = stdDev < 0.65 ? 'High Consensus' : stdDev < 1.15 ? 'Moderate Consensus' : 'Divided Opinions';
          }
        }

        const consensusColor = consensusLabel === 'High Consensus' ? '#10b981' : consensusLabel === 'Moderate Consensus' ? 'var(--primary)' : '#f59e0b';
        const consensusBg = consensusLabel === 'High Consensus' ? 'rgba(16, 185, 129, 0.12)' : consensusLabel === 'Moderate Consensus' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(245, 158, 11, 0.12)';

        return (
          <div className="quicklook-card criterion-quicklook" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
                  color: '#8b5cf6',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sliders size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                      Rubric Dimension
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 750, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      {weight}% Weight
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {criterion.name}
                  </h4>
                </div>
              </div>
            </div>

            {/* Description / Behavioral Guidance */}
            {criterion.description ? (
              <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px', display: 'block', marginBottom: '0.2rem' }}>
                  Behavioral Guidance
                </span>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {criterion.description}
                </p>
              </div>
            ) : (
              <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Standard behavioral scale ranging from {fMin} ({classData?.scaleMin ?? 1} lowest) to {fMax} ({classData?.scaleMax ?? 5} highest).
              </div>
            )}

            {/* Live Class Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <div style={{ padding: '0.35rem 0.45rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Cohort Mean</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px' }}>
                  {ratingCount > 0 ? <><AnimatedNumber value={avgScore} decimals={2} /> <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{fMax}</span></> : '—'}
                </strong>
              </div>

              <div style={{ padding: '0.35rem 0.45rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Reviews</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px' }}>
                  <AnimatedNumber value={ratingCount} />
                </strong>
              </div>

              <div style={{ padding: '0.35rem 0.45rem', backgroundColor: consensusBg, borderRadius: '6px', border: `1px solid ${consensusColor}33`, textAlign: 'center' }}>
                <span style={{ fontSize: '0.56rem', color: consensusColor, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Consensus</span>
                <strong style={{ fontSize: '0.74rem', color: consensusColor, display: 'block', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {consensusLabel}
                </strong>
              </div>
            </div>

            {/* Pedagogical Guidance Tip */}
            <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong style={{ color: 'var(--primary)' }}>Pedagogical Tip: </strong>
                <span>
                  {stdDev > 1.15
                    ? 'High polarization detected among teammate ratings. Check for communication misalignment or free-rider reports.'
                    : 'Ratings are consistent across team cohorts. This dimension accurately differentiates student deliverables.'}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case 'metric': {
        const { label, value, breakdown, student } = payload;
        const b = breakdown;

        return (
          <div className="quicklook-card metric-quicklook" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(99, 102, 241, 0.2))',
                  color: 'var(--accent-teal, #0d9488)',
                  border: '1px solid rgba(13, 148, 136, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Calculator size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-teal, #0d9488)', letterSpacing: '0.3px', display: 'block' }}>
                    Performance &amp; Grade Math
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {label}
                  </h4>
                </div>
              </div>

              {/* Big Live Value Display */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                  {typeof value === 'number' ? <AnimatedNumber value={value} decimals={label.includes('Ratio') || label.includes('Multiplier') ? 2 : 1} suffix={label.includes('Ratio') || label.includes('Multiplier') ? 'x' : ' pts'} /> : value}
                </span>
                {student && (
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 650, display: 'block', marginTop: '2px' }}>
                    {student.name} ({student.groupName})
                  </span>
                )}
              </div>
            </div>

            {/* Step-by-Step Calculation Breakdown if present */}
            {b && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
                  Mathematical Calculation Trace
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: '0.3rem' }}>
                  {b.baseGrade !== undefined && (
                    <div style={{ padding: '0.25rem 0.35rem', backgroundColor: 'var(--bg-surface)', borderRadius: '5px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>Team Base</span>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{b.baseGrade} pt</strong>
                    </div>
                  )}
                  {b.webpaRatio !== undefined && (
                    <div style={{ padding: '0.25rem 0.35rem', backgroundColor: 'var(--bg-surface)', borderRadius: '5px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>WebPA Ratio</span>
                      <strong style={{ fontSize: '0.78rem', color: b.webpaRatio >= 1.0 ? '#10b981' : '#f59e0b' }}>{b.webpaRatio.toFixed(2)}x</strong>
                    </div>
                  )}
                  {b.fudgeWeight !== undefined && (
                    <div style={{ padding: '0.25rem 0.35rem', backgroundColor: 'var(--bg-surface)', borderRadius: '5px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>Sensitivity</span>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{Math.round(b.fudgeWeight * 100)}%</strong>
                    </div>
                  )}
                  {b.calibratedScore !== undefined && (
                    <div style={{ padding: '0.25rem 0.35rem', backgroundColor: 'var(--bg-surface)', borderRadius: '5px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>Adjusted Mark</span>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{b.calibratedScore.toFixed(1)} pt</strong>
                    </div>
                  )}
                </div>

                {/* Bounds and Penalties Alerts */}
                {b.maxCapApplied && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.66rem', color: '#10b981', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                    <span><strong>Capped at Max:</strong> Student earned more than maximum ({b.maxScore ?? 31} pts), score held at ceiling.</span>
                  </div>
                )}
                {b.belowMin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.66rem', color: '#e11d48', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(225, 29, 72, 0.1)' }}>
                    <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                    <span><strong>Below Minimum:</strong> Raw score ({b.rawScore?.toFixed(1) ?? '—'}) is below min threshold ({b.minScore ?? 15} pts). Displayed as Insufficient.</span>
                  </div>
                )}
                {b.penaltyApplied && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.66rem', color: '#d97706', padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                    <span><strong>Penalty Applied:</strong> Deduction applied due to missing peer evaluation submission.</span>
                  </div>
                )}
              </div>
            )}

            {/* Formula Box with 1-click Copy */}
            {b?.formula && (
              <div
                onClick={(e) => handleCopy(b.formula!, 'formula', e)}
                style={{
                  padding: '0.35rem 0.55rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                title="Click to copy formula to clipboard"
              >
                <Code size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    <span>Applied Algorithm</span>
                    <span style={{ color: copiedField === 'formula' ? '#10b981' : 'var(--text-muted)' }}>
                      {copiedField === 'formula' ? 'Copied!' : 'Copy'}
                    </span>
                  </div>
                  <code style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.formula}
                  </code>
                </div>
              </div>
            )}

            {/* Explanation / Guidance */}
            {b?.explanation && (
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {b.explanation}
              </p>
            )}
          </div>
        );
      }

      case 'control': {
        const { title, currentValue, description, impactAnalysis, pedagogicalRationale } = payload;

        return (
          <div className="quicklook-card control-quicklook" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(99, 102, 241, 0.2))',
                  color: '#d97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.3px', display: 'block' }}>
                    Algorithm Parameter Control
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {title}
                  </h4>
                </div>
              </div>

              {/* Current Active Setting Pill */}
              <div style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#d97706',
                fontSize: '0.82rem',
                fontWeight: 800,
                flexShrink: 0
              }}>
                {currentValue}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {description}
              </p>
            )}

            {/* Live Dynamic Impact Box */}
            {impactAnalysis && (
              <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Activity size={11} style={{ color: 'var(--primary)' }} /> Live Simulation &amp; Impact
                </span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                  {impactAnalysis}
                </p>
              </div>
            )}

            {/* Pedagogical Rationale */}
            {pedagogicalRationale && (
              <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                <BookOpen size={13} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong style={{ color: 'var(--primary)' }}>Accredited Standard: </strong>
                  <span>{pedagogicalRationale}</span>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'module': {
        const { module, isEnabled, liveTelemetry, classData } = payload;
        const featureId = MODULE_KEY_TO_FEATURE_ID[module.key] || module.key;
        const featureInfo = FEATURE_INFO_REGISTRY[featureId] || (FEATURE_INFO_REGISTRY[module.key as string]);
        const guide = MODULE_SPECIFIC_GUIDES[module.key];

        const title = featureInfo?.title || module.title;
        const rawCategory = featureInfo?.category || module.category || 'General';
        const normalizedCategory = rawCategory.toLowerCase();
        const theme = Object.entries(CATEGORY_THEMES).find(([k]) => k.toLowerCase() === normalizedCategory)?.[1] || {
          bg: 'rgba(99, 102, 241, 0.12)',
          color: 'var(--primary, #6366f1)',
          border: 'rgba(99, 102, 241, 0.25)'
        };

        const categorySectionMap: Record<string, string> = {
          header: 'Navigation & Tools',
          hub: 'Hub Overview',
          roster: 'Section 1: Roster & Enrollment',
          autogroup: 'Section 1: Auto-Group Teams',
          rubric: 'Section 2: Rubric & Scales',
          analytics: 'Section 3: Grades & Analytics',
          footer: 'Footer & Compliance'
        };
        const sectionLabel = categorySectionMap[module.category] || rawCategory;

        const description = featureInfo?.summary || guide?.whatItDoes || featureInfo?.whatItDoes || module.desc;
        const formula = featureInfo?.formula;
        const whatToDo = featureInfo?.whatToDo || (guide?.howToUse ? [guide.howToUse] : []);

        const IconComp = module.icon || Layers;

        // Auto-discover live telemetry from workspace state
        const telemetryData: Record<string, string | number> = { ...(liveTelemetry || {}) };
        if (classData) {
          if (module.key === 'showRosterTable' || module.key === 'showBulkActionBar') {
            if (!telemetryData['Enrolled']) telemetryData['Enrolled'] = `${classData.students.length} Students`;
            if (!telemetryData['Teams']) telemetryData['Teams'] = `${new Set(classData.students.map(s => s.groupName).filter(Boolean)).size} Cohorts`;
          } else if (module.key === 'showRubricHeader' || module.key === 'showCriterionCards' || module.key === 'showRubricPresets') {
            if (!telemetryData['Criteria']) telemetryData['Criteria'] = `${classData.fields.length} Dimensions`;
            if (!telemetryData['Target Scale']) telemetryData['Target Scale'] = `${classData.targetScale ?? 100} Pts`;
          } else if (module.key === 'showDeadlineTimer' || module.key === 'showEvaluationFormControls') {
            if (!telemetryData['Deadline']) telemetryData['Deadline'] = classData.deadline ? new Date(classData.deadline).toLocaleDateString() : 'Open / Unset';
            if (!telemetryData['Reviews']) telemetryData['Reviews'] = `${classData.reviews.length} Received`;
          } else if (module.key === 'showQualitativeFeedback') {
            if (!telemetryData['Written Notes']) telemetryData['Written Notes'] = `${classData.reviews.filter(r => Boolean(r.strengthsText || r.growthText)).length} Feedback`;
          } else if (module.key === 'showWebPACalibration') {
            if (!telemetryData['Algorithm']) telemetryData['Algorithm'] = (classData.peerAdjustmentConfig?.method ?? 'WebPA').toUpperCase();
            if (!telemetryData['Sensitivity']) telemetryData['Sensitivity'] = `${Math.round((classData.peerAdjustmentConfig?.fudgeWeight ?? 1) * 100)}%`;
          } else if (module.key === 'showSelfEnrollmentCard' || module.key === 'showSelfEnrollmentQr') {
            if (!telemetryData['Status']) telemetryData['Status'] = 'Open / Ready';
            if (!telemetryData['Enrolled']) telemetryData['Enrolled'] = `${classData.students.length} Members`;
          } else if (module.key === 'showResultsHeaderCard' || module.key === 'showResultsSummarySheet') {
            if (!telemetryData['Reviews']) telemetryData['Reviews'] = `${classData.reviews.length} Completed`;
            if (!telemetryData['Roster']) telemetryData['Roster'] = `${classData.students.length} Students`;
          } else if (module.key === 'showAutoGroupStudio') {
            if (!telemetryData['Roster Pool'] && !telemetryData['Pool'] && !telemetryData['Students in Pool']) {
              const poolCount = classData.students.length;
              const teamsCount = new Set(classData.students.map(s => s.groupName).filter(Boolean)).size;
              telemetryData['Roster Pool'] = `${poolCount} Students`;
              telemetryData['Formed Teams'] = `${teamsCount} Cohorts`;
              telemetryData['Target Size'] = '4–5 Members';
            }
          }
        }

        // Clean up any duplicate telemetry keys to prevent repetitive metrics
        if (telemetryData['Students in Pool'] && (telemetryData['Pool'] || telemetryData['Roster Pool'])) {
          delete telemetryData['Students in Pool'];
        }
        if (telemetryData['Pool'] && telemetryData['Roster Pool']) {
          delete telemetryData['Pool'];
        }

        return (
          <div 
            className="quicklook-card module-quicklook"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}
          >
            {/* Header: Icon, Category Pill, Status Badge, Title, and Inline Quick Toggle */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: theme.bg,
                  color: theme.color,
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComp size={18} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '0.08rem 0.38rem',
                      borderRadius: '4px',
                      backgroundColor: theme.bg,
                      color: theme.color,
                      border: `1px solid ${theme.border}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}>
                      {sectionLabel}
                    </span>

                    {isEnabled !== undefined && (
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 750,
                        padding: '0.08rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: isEnabled ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-app)',
                        color: isEnabled ? '#10b981' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isEnabled ? '#10b981' : 'var(--text-muted)' }} />
                        {isEnabled ? 'Active' : 'Hidden'}
                      </span>
                    )}
                  </div>
                  <h4 
                    style={{ 
                      margin: 0, 
                      fontSize: '0.94rem', 
                      fontWeight: 800, 
                      color: 'var(--text-primary)', 
                      lineHeight: 1.25 
                    }} 
                    title={title}
                  >
                    {title}
                  </h4>
                </div>
              </div>

              {/* In-Header Quick Toggle Action Button */}
              {isEnabled !== undefined && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('toggle_module', module.key);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.22rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: isEnabled ? 'rgba(225, 29, 72, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${isEnabled ? 'rgba(225, 29, 72, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    fontSize: '0.66rem',
                    fontWeight: 750,
                    color: isEnabled ? 'var(--accent-rose, #e11d48)' : 'var(--accent-teal, #0d9488)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    flexShrink: 0
                  }}
                  title={isEnabled ? "Hide module (T)" : "Enable module (T)"}
                >
                  {isEnabled ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{isEnabled ? 'Hide' : 'Enable'}</span>
                  <kbd style={{ fontSize: '0.55rem', padding: '0.04rem 0.22rem', borderRadius: '3px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>T</kbd>
                </button>
              )}
            </div>

            {/* Live Workspace Telemetry Stats Grid */}
            {Object.keys(telemetryData).length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(3, Object.keys(telemetryData).length)}, 1fr)`,
                gap: '0.4rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.45rem'
              }}>
                {Object.entries(telemetryData).slice(0, 3).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center', padding: '0.2rem 0.35rem', backgroundColor: 'var(--bg-surface)', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.3px', display: 'block' }}>{k}</span>
                    <strong style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(v)}>{v}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Core Description - Crisp & High Signal */}
            {description && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {description}
              </p>
            )}

            {/* Formula / Calculation Standard with Click-to-Copy */}
            {formula && (
              <div 
                onClick={(e) => handleCopy(formula, 'formula', e)}
                style={{
                  padding: '0.35rem 0.55rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'background-color 0.15s ease'
                }}
                title="Click to copy formula to clipboard"
              >
                <Calculator size={13} style={{ color: theme.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px', lineHeight: 1 }}>
                    <span>Calculation Standard</span>
                    <span style={{ color: copiedField === 'formula' ? '#10b981' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      {copiedField === 'formula' ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
                    </span>
                  </div>
                  <code 
                    style={{ 
                      fontSize: '0.68rem', 
                      fontFamily: 'monospace', 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      display: 'block', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      marginTop: '0.15rem' 
                    }} 
                    title={formula}
                  >
                    {formula}
                  </code>
                </div>
              </div>
            )}

            {/* Practical Pro Tip or Actionable Highlight */}
            {featureInfo?.proTip ? (
              <div style={{
                padding: '0.4rem 0.55rem',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                fontSize: '0.71rem',
                lineHeight: 1.35,
                color: 'var(--text-secondary)'
              }}>
                <Lightbulb size={13} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong style={{ color: '#d97706' }}>Instructor Tip: </strong>
                  <span>{featureInfo.proTip}</span>
                </div>
              </div>
            ) : whatToDo && whatToDo.length > 0 ? (
              <div style={{
                padding: '0.35rem 0.55rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                {whatToDo.slice(0, 2).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    <CheckCircle2 size={12} style={{ color: theme.color, flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ flex: 1 }}>{step}</span>
                  </div>
                ))}
              </div>
            ) : guide?.pedagogicalValue ? (
              <div style={{
                padding: '0.35rem 0.55rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                fontSize: '0.7rem',
                lineHeight: 1.35,
                color: 'var(--text-secondary)'
              }}>
                <GraduationCap size={13} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Syllabus Value: </strong>
                  <span>{guide.pedagogicalValue}</span>
                </div>
              </div>
            ) : null}
          </div>
        );
      }

      case 'action': {
        const isDestructive = Boolean(
          payload.impact?.toLowerCase().includes('delete') || 
          payload.impact?.toLowerCase().includes('wipe') || 
          payload.impact?.toLowerCase().includes('purge') || 
          payload.impact?.toLowerCase().includes('reset') ||
          payload.label.toLowerCase().includes('clear') ||
          payload.label.toLowerCase().includes('reset')
        );

        return (
          <div className="quicklook-card action-quicklook" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isDestructive ? 'rgba(225, 29, 72, 0.12)' : 'rgba(13, 148, 136, 0.15)',
                  color: isDestructive ? 'var(--accent-rose, #e11d48)' : 'var(--accent-teal, #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {payload.icon || (isDestructive ? <AlertTriangle size={16} /> : <Zap size={16} />)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', color: isDestructive ? 'var(--accent-rose, #e11d48)' : 'var(--text-muted)', display: 'block' }}>
                    {isDestructive ? 'Destructive Action' : 'Action Tool'}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {payload.label}
                  </h4>
                </div>
              </div>

              {payload.shortcut && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.62rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '5px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontWeight: 700
                }}>
                  <Command size={10} style={{ color: 'var(--text-muted)' }} />
                  <span>{payload.shortcut}</span>
                </div>
              )}
            </div>

            {payload.description && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {payload.description}
              </p>
            )}

            {payload.impact && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: isDestructive ? 'rgba(225, 29, 72, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                border: `1px solid ${isDestructive ? 'rgba(225, 29, 72, 0.22)' : 'rgba(99, 102, 241, 0.2)'}`,
                fontSize: '0.68rem',
                color: isDestructive ? 'var(--accent-rose, #e11d48)' : 'var(--primary, #6366f1)',
                fontWeight: 650
              }}>
                {isDestructive ? <AlertTriangle size={12} style={{ flexShrink: 0 }} /> : <Activity size={12} style={{ flexShrink: 0 }} />}
                <span>{payload.impact}</span>
              </div>
            )}

            {payload.prerequisites && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '5px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                fontSize: '0.66rem',
                color: 'var(--text-muted)'
              }}>
                <CheckCircle size={11} style={{ color: 'var(--accent-teal, #0d9488)', flexShrink: 0 }} />
                <span><strong>Prerequisite:</strong> {payload.prerequisites}</span>
              </div>
            )}

            {payload.tip && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '5px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.66rem',
                color: '#d97706'
              }}>
                <Lightbulb size={11} style={{ flexShrink: 0 }} />
                <span><strong>Pro Tip:</strong> {payload.tip}</span>
              </div>
            )}
          </div>
        );
      }

      case 'generic': {
        return (
          <div className="quicklook-card generic-quicklook" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Compass size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--text-muted)', display: 'block' }}>
                  Workspace Component
                </span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                  {payload.title}
                </h4>
              </div>
            </div>

            {payload.subtitle && payload.subtitle !== payload.title && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                {payload.subtitle}
              </span>
            )}
            {payload.details && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {payload.details}
              </p>
            )}
            {payload.metrics && payload.metrics.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, payload.metrics.length)}, 1fr)`, gap: '0.35rem', marginTop: '0.2rem' }}>
                {payload.metrics.map((m, i) => (
                  <div key={i} style={{ padding: '0.3rem 0.4rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 750 }}>{m.label}</span>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px' }}>{m.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {payload.tip && (
              <div style={{
                padding: '0.35rem 0.55rem',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                fontSize: '0.7rem',
                lineHeight: 1.35,
                color: 'var(--text-secondary)',
                marginTop: '0.2rem'
              }}>
                <Sparkles size={12} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong style={{ color: 'var(--primary)' }}>Pro Tip: </strong>
                  <span>{payload.tip}</span>
                </div>
              </div>
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
        maxHeight: 'calc(100vh - 32px)',
        zIndex: 999999,
        pointerEvents: isPinned ? 'auto' : 'none',
        userSelect: isPinned ? 'text' : 'none',
        WebkitUserSelect: isPinned ? 'text' : 'none',
        transition: isPinned ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div 
        ref={hudRef}
        className="quicklook-hud-glass"
        style={{
          backgroundColor: 'var(--bg-surface, rgba(255, 255, 255, 0.98))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isPinned 
            ? '2px solid var(--primary, #6366f1)' 
            : '1px solid var(--border-color, rgba(255, 255, 255, 0.2))',
          borderRadius: '14px',
          boxShadow: isPinned
            ? '0 24px 60px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3)'
            : '0 20px 45px -10px rgba(0, 0, 0, 0.35)',
          padding: '0.85rem',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* HUD Smart Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              padding: '0.12rem 0.45rem',
              borderRadius: '5px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {payload.type === 'student' ? <User size={10} style={{ color: payload.context === 'grading' ? '#6366f1' : '#0d9488' }} /> :
               payload.type === 'team' ? <Users size={10} style={{ color: payload.context === 'grading' ? '#6366f1' : '#0d9488' }} /> :
               payload.type === 'criterion' ? <Sliders size={10} style={{ color: '#8b5cf6' }} /> :
               payload.type === 'metric' ? <Calculator size={10} style={{ color: '#0d9488' }} /> :
               payload.type === 'control' ? <SlidersHorizontal size={10} style={{ color: '#f59e0b' }} /> :
               payload.type === 'module' ? <Layers size={10} style={{ color: '#6366f1' }} /> :
               payload.type === 'action' ? <Zap size={10} style={{ color: '#d97706' }} /> :
               <Compass size={10} style={{ color: 'var(--text-secondary)' }} />}
              {payload.type === 'student' ? (payload.context === 'grading' ? 'Student Evaluation' : 'Student Profile') :
               payload.type === 'team' ? (payload.context === 'grading' ? 'Team Gradebook' : 'Team Composition') :
               payload.type === 'criterion' ? 'Rubric Dimension' :
               payload.type === 'metric' ? 'Grade & Formula Trace' :
               payload.type === 'control' ? 'Parameter Inspector' :
               payload.type === 'module' ? 'Module Assistant' :
               payload.type === 'action' ? 'Quick Action' : 'Live Inspector'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={onTogglePin}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 5px',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: isPinned ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                pointerEvents: 'auto'
              }}
              title={isPinned ? "Unpin HUD (P)" : "Pin HUD to screen (P)"}
            >
              {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
              <kbd style={{ fontSize: '0.55rem', opacity: 0.7 }}>P</kbd>
            </button>

            {isPinned && (
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  color: 'var(--text-muted)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'auto'
                }}
                title="Dismiss (Esc)"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div 
          className="quicklook-content-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            paddingRight: '2px'
          }}
        >
          {renderContent()}
        </div>

        {/* Smart QuickLook Master Footer */}
        <div 
          style={{
            marginTop: '0.65rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            flexShrink: 0,
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {isPinned ? (
              <span>Press <kbd style={{ padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>Esc</kbd> to close • <kbd style={{ padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>P</kbd> to unpin</span>
            ) : (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <kbd style={{ padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontWeight: 800 }}>
                    Space
                  </kbd>
                  Scrub &amp; Peek
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <kbd style={{ padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontWeight: 800 }}>
                    P
                  </kbd>
                  Pin HUD
                </span>
              </>
            )}
          </div>
          <span style={{ opacity: 0.75, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
            Smart Peek
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
