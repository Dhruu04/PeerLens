import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, ArrowLeft, X, CheckCircle, 
  Sparkles, QrCode, Sliders, Users, Award, Mail,
  Layers, Lightbulb, ShieldCheck, Maximize2, Search,
  Settings, Activity, BookOpen, Download, RotateCcw,
  MousePointer, Play, HelpCircle, Check, Compass,
  Calculator, FileText
} from 'lucide-react';
import { type FeatureToggles, loadFeatureToggles } from '../utils/featurePreferences';

export interface TourStep {
  id: string;
  targetSelector: string;
  stage: string;
  stageNumber?: number;
  totalStages?: number;
  title: string;
  description: string;
  actionPrompt?: string;
  howToProceed?: string[];
  demoPreview?: {
    actionLabel: string;
    description: string;
    expectedResult: string;
  };
  proTip?: string;
  hotkey?: string;
  tab?: 'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud';
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'corner';
  icon: React.ReactNode;
  featureKey?: keyof FeatureToggles;
}

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud') => void;
  activeTab?: string;
  customStepIds?: string[] | null;
  onRestoreSnapshot?: () => void;
  hasSnapshot?: boolean;
  onExecuteDemoStep?: (stepId: string) => void;
  featureToggles?: FeatureToggles;
}

export const TOUR_STEPS: TourStep[] = [
  // ==========================================
  // --- STAGE 1: TOP NAVIGATION & SETUP ---
  // ==========================================
  {
    id: 'class_header',
    targetSelector: '[data-tour="class-header"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showClassPicker',
    title: 'Active Classroom & Course Section',
    description: 'Switch active classrooms, find your 1-click Classroom ID copy pill inside the dropdown, and manage course sections.',
    actionPrompt: 'Open the dropdown to view your classroom options and copy your unique Classroom ID.',
    howToProceed: [
      'Click the Course Header dropdown to switch active sections.',
      'Notice the "Copy Class ID" button right inside the dropdown menu.',
      'Distribute the code to students self-enrolling via smartphone.'
    ],
    demoPreview: {
      actionLabel: 'Copy Classroom ID to Clipboard',
      description: 'Instantly copies classroom code for syllabus and mobile registration.',
      expectedResult: 'Confirmation toast: "Classroom ID copied to clipboard!"'
    },
    proTip: 'The Classroom ID is neatly embedded inside the class dropdown to keep the top navigation bar clean and uncluttered.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <BookOpen size={17} className="text-primary" />
  },
  {
    id: 'workspace_switcher',
    targetSelector: '[data-tour="workspace-selector"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showProfilePill',
    title: 'Multi-Workspace Profile Hub',
    description: 'Switch between instructor workspaces or create isolated class profiles for different academic courses, terms, or teaching assistants.',
    actionPrompt: 'Click the workspace selector dropdown to see how professor profiles isolate classes.',
    howToProceed: [
      'Look at the highlighted Workspace profile button in the top header.',
      'Click the dropdown to view available instructor environments.',
      'Select a profile to switch or click "New Workspace Profile" to create one.'
    ],
    demoPreview: {
      actionLabel: 'Open Workspace Profile Manager',
      description: 'Isolates courses and keeps student records completely separated.',
      expectedResult: 'Workspace manager dialog opens for multi-course administration.'
    },
    proTip: 'Profiles isolate student records, rubrics, and settings completely.',
    hotkey: 'Click dropdown',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Layers size={17} className="text-indigo" />
  },
  {
    id: 'command_palette',
    targetSelector: '[data-tour="command-palette-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showCommandSearch',
    title: 'Quick Command Palette & Finder',
    description: 'Instantly find any student record, jump across sections, filter teams, or trigger classroom operations with keyboard speed.',
    actionPrompt: 'Try pressing Ctrl+K (or Cmd+K) on your keyboard to test opening the Finder.',
    howToProceed: [
      'Press Ctrl+K (or Cmd+K on macOS) or click the Search bar.',
      'Type any student name, team name, or navigation command.',
      'Press Enter to immediately jump to the student or execute the action.'
    ],
    demoPreview: {
      actionLabel: 'Open Command Palette (Ctrl+K)',
      description: 'Instant spotlight search across entire classroom roster and commands.',
      expectedResult: 'Spotlight modal opens with keyboard-driven quick jump.'
    },
    proTip: 'Press Ctrl+K (or Cmd+K) anywhere in the application to launch.',
    hotkey: 'Ctrl + K / ⌘K',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Search size={17} className="text-primary" />
  },
  {
    id: 'guide_center_btn',
    targetSelector: '[data-tour="guide-center-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showGuideButton',
    title: 'Academic Guidance Center',
    description: 'Access complete algorithm manuals (WebPA, Johari Window, Simulated Annealing), 5 focused spotlight walkthroughs, and an exhaustive 26-item feature catalog with live search.',
    actionPrompt: 'Click the Academic Guidance button to explore the system manual or run focused spotlight tours.',
    howToProceed: [
      'Click the Guidance Center compass button in the top bar.',
      'Browse the 3 tabs: System Manual, Spotlight Tours, and Feature Catalog.',
      'Search any grading topic (e.g., "WebPA", "Johari", "Collusion") for formulas & tips.'
    ],
    demoPreview: {
      actionLabel: 'Open Academic Guidance Center',
      description: 'Launches full documentation hub with formulas, guides, and feature cards.',
      expectedResult: 'Academic Guidance Center opens with searchable documentation.'
    },
    proTip: 'Standard Mode displays this guidance button by default so academic help is always 1 click away.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Compass size={17} className="text-primary" />
  },
  {
    id: 'projector_mode',
    targetSelector: '[data-tour="projector-mode-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showProjectorButton',
    title: 'Fullscreen Live Projector Mode',
    description: 'Launch a privacy-safe monitor display designed for auditorium screens. Displays live QR check-ins and team diversity without exposing individual grades.',
    actionPrompt: 'Click the Projector button to preview the full-screen lecture hall display.',
    howToProceed: [
      'Click the "Projector" button in the top action dock.',
      'Project this screen onto your classroom display during group workshops.',
      'Students scan the big QR code and view team rosters without grade exposure.'
    ],
    demoPreview: {
      actionLabel: 'Open Projector Auditorium Display',
      description: 'Privacy-safe auditorium presentation with live digital clock & QR.',
      expectedResult: 'Full-screen lecture display opens.'
    },
    proTip: 'Features a live digital clock, team filter matrix, and big QR code for lecture halls.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Maximize2 size={17} className="text-teal" />
  },
  {
    id: 'email_dispatcher',
    targetSelector: '[data-tour="email-dispatcher-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showEmailButton',
    title: 'Email Notification & Link Dispatcher',
    description: 'Distribute secure personal evaluation links to all students in 1 click using Brevo SMTP API or EmailJS adapters with live delivery progress.',
    actionPrompt: 'Click the Email button (or press E) to inspect the automated link transmitter.',
    howToProceed: [
      'Click the Email icon or press "E" on your keyboard.',
      'Choose whether to email individual student links or batch broadcast.',
      'Monitor real-time delivery logs and transmission progress.'
    ],
    demoPreview: {
      actionLabel: 'Open Email Notification Dispatcher',
      description: 'Dispatches private peer review URLs directly to student inboxes.',
      expectedResult: 'Link transmitter modal opens with SMTP configuration.'
    },
    proTip: 'Press "E" on your keyboard to quickly open the email transmitter.',
    hotkey: 'Press E',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Mail size={17} className="text-primary" />
  },
  {
    id: 'customize_view',
    targetSelector: '[data-tour="customize-view-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showCustomizeViewButton',
    title: 'Customize View: Add & Remove Sections',
    description: 'Tailor your workspace layout to match your exact teaching workflow. PeerLens features a modular interface engine: add, hide, or restore individual sections and cards at any time.',
    actionPrompt: 'Click "Customize View" to choose between Minimal Mode, Standard Mode, Full Suite, or toggle individual cards.',
    howToProceed: [
      'Click the "Customize View" button in the top navigation dock.',
      'Switch between presets: Minimal Mode (clean & focused) or Standard Mode (balanced default).',
      'Toggle any module on or off — such as Anomaly Audit, QR Enrollment, or Johari Window.',
      'Sections automatically expand and fill empty space when optional modules are turned off!'
    ],
    demoPreview: {
      actionLabel: 'Open Interface & Modules Manager',
      description: 'Opens modular layout settings to enable or remove sections and cards.',
      expectedResult: 'Settings hub mounts directly to the Interface & Modules tab.'
    },
    proTip: 'You have complete control: hide modules you don\'t need for a clean interface, or activate advanced analytics when final grades are due.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Sliders size={17} className="text-primary" />
  },
  {
    id: 'settings_hub',
    targetSelector: '[data-tour="settings-hub-btn"]',
    stage: 'Top Navigation & Setup',
    featureKey: 'showSettingsButton',
    title: 'Settings & System Preferences Hub',
    description: 'Configure interface layout presets, custom keyboard shortcuts, Firebase cloud sync, and Brevo SMTP credentials in one centralized hub.',
    actionPrompt: 'Click Settings to customize interface density or configure Firebase cloud backup.',
    howToProceed: [
      'Click the Settings gear icon in the top right.',
      'Select "Interface & Modules" to pick Minimal Mode, Standard Mode, or Full Suite.',
      'Customize hotkeys or configure Brevo SMTP credentials in the dedicated tabs.'
    ],
    demoPreview: {
      actionLabel: 'Open Settings Hub',
      description: 'Manage interface density presets, cloud synchronization, and SMTP keys.',
      expectedResult: 'Settings hub opens with Interface & Modules, Cloud Sync, and Profile tabs.'
    },
    proTip: 'Use "Customize View" in the top bar to jump straight to the Interface & Modules settings tab.',
    hotkey: 'Press S',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Settings size={17} className="text-primary" />
  },

  // ==========================================
  // --- STAGE 2: HOME HUB NAVIGATION ---
  // ==========================================
  {
    id: 'hub_enrollment',
    targetSelector: '[data-tour="hub-enrollment-card"]',
    stage: 'Home Hub Navigation',
    featureKey: 'showEnrollmentCard',
    title: 'Section 1 Hub Card: Enrollment & Teams',
    description: 'Overview card for your classroom roster. Monitor enrolled student count, balanced teams, international diversity flags, and jump directly into Roster setup in 1 click.',
    actionPrompt: 'Click "Open Section 1" or anywhere on the card to jump straight into Enrollment & Teams.',
    howToProceed: [
      'Inspect the live roster count and team breakdown meters.',
      'Click the card or "Open Section 1" button to navigate to Section 1.',
      'Use the quick action links for instant QR presentation or AutoGroup partitioning.'
    ],
    demoPreview: {
      actionLabel: 'Jump to Section 1: Enrollment & Teams',
      description: 'Switches directly from Home Hub to Section 1 roster workspace.',
      expectedResult: 'Section 1 mounts with roster tables and import tools.'
    },
    proTip: 'When optional sections are hidden via Customize View, these cards automatically expand to fill available width.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Users size={17} className="text-indigo" />
  },
  {
    id: 'hub_review',
    targetSelector: '[data-tour="hub-review-card"]',
    stage: 'Home Hub Navigation',
    featureKey: 'showReviewSystemCard',
    title: 'Section 2 Hub Card: Review System',
    description: 'Overview card for your evaluation rubrics. Monitor criteria count, 100% weight balance validation, and student mobile rating preview.',
    actionPrompt: 'Click "Open Section 2" to jump straight into the rubric criteria & weight builder.',
    howToProceed: [
      'Inspect the green "Total Weightage: 100% (Balanced)" health badge.',
      'Click "Open Section 2" to customize criteria, descriptors, or weights.',
      'Test student mobile scoring using the built-in simulator.'
    ],
    demoPreview: {
      actionLabel: 'Jump to Section 2: Review System',
      description: 'Switches from Home Hub to Section 2 rubric builder.',
      expectedResult: 'Section 2 mounts with accredited presets and criteria cards.'
    },
    proTip: 'PeerLens automatically verifies that criteria weights sum to exactly 100% before peer reviews begin.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Sliders size={17} className="text-amber" />
  },
  {
    id: 'hub_analytics',
    targetSelector: '[data-tour="hub-analytics-card"]',
    stage: 'Home Hub Navigation',
    featureKey: 'showGradingAnalyticsCard',
    title: 'Section 3 Hub Card: Grading & Analytics',
    description: 'Overview card for grading results. Track cohort submission percentage, class average, WebPA factor calibration, and export reports in 1 click.',
    actionPrompt: 'Click "Open Section 3" to inspect final grades, perception radar, and WebPA calibrator.',
    howToProceed: [
      'Check current submission completion rate and class mean.',
      'Click "Open Section 3" to view the WebPA matrix and Spider Radar deck.',
      'Generate batch PDF report cards or export formatted Excel spreadsheets.'
    ],
    demoPreview: {
      actionLabel: 'Jump to Section 3: Grading & Analytics',
      description: 'Switches from Home Hub to Section 3 calculation matrix.',
      expectedResult: 'Section 3 mounts with WebPA Calibrator and Results Summary.'
    },
    proTip: 'Quickly export individual student PDF report cards or institutional Excel spreadsheets right from here.',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Award size={17} className="text-teal" />
  },

  // ==========================================
  // --- STAGE 3: SECTION 1: ENROLLMENT & TEAMS ---
  // ==========================================
  {
    id: 'section_roster_tab',
    targetSelector: '[data-tour="section-roster-btn"]',
    stage: 'Section 1: Enrollment & Teams',
    title: 'Section 1: Enrollment & Teams Navigation',
    description: 'This is the main workspace for managing student cohorts, auto-grouping balanced teams, and verifying mobile self-enrollment.',
    actionPrompt: 'Click "1. Enrollment & Teams" (or press 1) to open the roster workspace.',
    howToProceed: [
      'Click the "1. Enrollment & Teams" tab button in the navigation switcher (or press "1").',
      'All roster controls, import tools, and team formation studios are housed here.',
      'Customize which cards appear in this section using the Customize View manager.'
    ],
    demoPreview: {
      actionLabel: 'Switch to Section 1 Workspace',
      description: 'Mounts Section 1 Roster & AutoGroup Studio.',
      expectedResult: 'Section 1 mounts with self-enrollment, quick actions, and roster table.'
    },
    proTip: 'Press "1" on your keyboard anytime to jump straight to Section 1.',
    hotkey: 'Press 1',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Users size={17} className="text-indigo" />
  },
  {
    id: 'self_enrollment',
    targetSelector: '[data-tour="self-enrollment-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showSelfEnrollmentCard',
    title: '1-Click Student Self-Enrollment',
    description: 'Students scan this QR code or use the direct join link on their smartphones to register instantly with duplicate name/email prevention.',
    actionPrompt: 'Click "Open QR Presentation Mode" to see the full-screen mobile check-in code.',
    howToProceed: [
      'Click "Copy Link" to copy your classroom URL for students.',
      'Click "Open QR Presentation Mode" to show a large QR code in class.',
      'Students scan the QR code to register in under 15 seconds.'
    ],
    demoPreview: {
      actionLabel: 'Launch QR Presentation Mode',
      description: 'Allows 100+ students to onboard simultaneously in class.',
      expectedResult: 'High-res QR presentation opens for mobile scanning.'
    },
    proTip: 'Click "Open QR Presentation Mode" to project a high-resolution QR on your classroom screen.',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <QrCode size={17} className="text-teal" />
  },
  {
    id: 'quick_actions',
    targetSelector: '[data-tour="quick-actions-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showQuickActionsCard',
    title: 'Quick Actions & 100 Demo Cohort',
    description: 'Add individual students, populate the classroom with 100 diverse demo students across 35+ countries, or download roster spreadsheets.',
    actionPrompt: 'Click "100 Demo Sample" right now to populate your classroom with 100 diverse students across 35 countries!',
    howToProceed: [
      'Locate the "100 Demo Sample" button inside the Quick Actions card.',
      'Click it to generate 100 realistic student records across 35+ countries.',
      'Notice the badges for Erasmus, CEFR English (C1/C2, Native), and degrees.'
    ],
    demoPreview: {
      actionLabel: 'Populate 100 Demo Students Live',
      description: 'Loads 100 realistic students with international diversity attributes.',
      expectedResult: 'Classroom directory populates with 100 diverse students.'
    },
    proTip: 'Use "100 Demo Sample" to experiment with diversity grouping and grade calculation matrices.',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Sparkles size={17} className="text-indigo" />
  },
  {
    id: 'import_wizard',
    targetSelector: '[data-tour="import-wizard-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showImportWizardCard',
    title: 'Smart Roster Import Wizard',
    description: 'Bulk onboard student cohorts from Excel (.xlsx), PDF, CSV, or clipboard text with intelligent automatic header column mapping.',
    actionPrompt: 'Click "Open Onboarding Wizard" or drop a spreadsheet onto the dropzone.',
    howToProceed: [
      'Click "Open Onboarding Wizard" or drag an Excel/CSV file onto the card.',
      'The smart mapper automatically detects Name, Email, Group, and Nationality.',
      'Click "Confirm & Import" to onboard all students in 1 click.'
    ],
    demoPreview: {
      actionLabel: 'Open Import Wizard Dialog',
      description: 'Auto-maps university spreadsheet columns into student profiles.',
      expectedResult: 'Column mapping dialog with live data preview.'
    },
    proTip: 'Drag and drop university class lists directly onto the dropzone.',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Download size={17} className="text-teal" />
  },
  {
    id: 'autogroup_studio',
    targetSelector: '[data-tour="autogroup-studio"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showAutoGroupStudio',
    title: 'Intelligent AutoGroup & Diversity Studio',
    description: 'Partition students into balanced teams by team size or count with automated gender parity, nationality mix, and CEFR English balancing.',
    actionPrompt: 'Select a Balancing Strategy from the dropdown and click "Re-Shuffle" to see team diversity synergy compute!',
    howToProceed: [
      'Select a strategy: "Multi-Dimensional (Gender + Origin + English)" or "50/50 Gender Parity".',
      'Set target team size (e.g., 4 or 5 members per team).',
      'Click "Re-Shuffle" to run the combinatorial partitioner and view Synergy Scores.'
    ],
    demoPreview: {
      actionLabel: 'Open AutoGroup Studio Live',
      description: 'Executes simulated annealing to balance international teams.',
      expectedResult: 'Teams organized with zero isolated nationalities & 94%+ synergy.'
    },
    proTip: 'Balances international students and CEFR proficiency levels across all teams automatically.',
    tab: 'roster',
    preferredPlacement: 'corner',
    icon: <Users size={17} className="text-indigo" />
  },
  {
    id: 'classroom_roster',
    targetSelector: '[data-tour="classroom-roster-table"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showRosterTable',
    title: 'Classroom Roster & Bulk Actions',
    description: 'Search, filter, and manage enrolled students with the multi-select bulk actions bar. Real-time audit flags alert you if duplicate names or emails are detected.',
    actionPrompt: 'Try typing in the search box or click student checkboxes to test bulk management.',
    howToProceed: [
      'Type any keyword in the search bar to filter by student name, degree, or team.',
      'Click checkboxes to perform bulk actions (bulk team assignment or deletion).',
      'Look for amber audit badges that alert you to duplicate email registrations.'
    ],
    demoPreview: {
      actionLabel: 'Filter Roster for "Sophie"',
      description: 'Search and inspect student attributes, team memberships, and audit alerts.',
      expectedResult: 'Table filters live with zero lag.'
    },
    proTip: 'Use checkboxes for bulk team reassignments, deletion, or batch export.',
    tab: 'roster',
    preferredPlacement: 'corner',
    icon: <ShieldCheck size={17} className="text-primary" />
  },

  // ==========================================
  // --- STAGE 4: SECTION 2: REVIEW SYSTEM ---
  // ==========================================
  {
    id: 'rubric_tab',
    targetSelector: '[data-tour="rubric-tab-btn"]',
    stage: 'Section 2: Review System',
    title: 'Section 2: Review System Navigation',
    description: 'Switch to Section 2 to design multi-criteria evaluation rubrics, define performance anchors, and balance weights to 100%.',
    actionPrompt: 'Click "2. Review System" (or press 2) to navigate to the criteria and weightage builder.',
    howToProceed: [
      'Click the "2. Review System" tab button in the navigation switcher (or press "2").',
      'Here you can customize evaluation metrics, qualitative descriptors, and weights.',
      'Weights are automatically balanced to 100% by default.'
    ],
    demoPreview: {
      actionLabel: 'Switch to Review System Tab',
      description: 'Navigates to the multi-dimensional criteria builder.',
      expectedResult: 'Evaluation Rubrics & Simulator workspace mounts.'
    },
    proTip: 'Press "2" on your keyboard to jump directly to Section 2.',
    hotkey: 'Press 2',
    tab: 'grading',
    preferredPlacement: 'bottom',
    icon: <Sliders size={17} className="text-indigo" />
  },
  {
    id: 'rubric_builder',
    targetSelector: '[data-tour="rubric-builder-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showCriterionCards',
    title: 'Rubric Criteria & 100% Weight Auto-Balancing',
    description: 'Define criteria names, score ranges, and descriptive qualitative indicators. Use the "Auto-Balance" button to ensure weights equal exactly 100%.',
    actionPrompt: 'Click the "IPAF Standard" preset to load the unified research-synthesized rubric, or edit any weight (%) input to see live balance validation.',
    howToProceed: [
      'Click the "IPAF Standard" preset button in the rubric ribbon.',
      'Notice that weights automatically equal 100% across all 6 empirically validated dimensions.',
      'Try editing any percentage input — the top validation bar alerts you if weights need balancing.'
    ],
    demoPreview: {
      actionLabel: 'Load IPAF Standard (6 Dimensions = 100%)',
      description: 'Applies the research-synthesized rubric derived from CATME, Salas, AAC&U, and WebPA.',
      expectedResult: 'Rubric loads with green "Total Weightage: 100% (Balanced & Valid)".'
    },
    proTip: 'Load the Integrated Peer Assessment Framework (IPAF) in 1 click for an empirically validated, 100% balanced rubric.',
    tab: 'grading',
    preferredPlacement: 'corner',
    icon: <Sliders size={17} className="text-indigo" />
  },
  {
    id: 'target_scale',
    targetSelector: '[data-tour="target-scale-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showTargetScaleCard',
    title: 'Final Grade Scaling & Target Scale',
    description: 'Optionally normalize raw criteria score totals to match your university\'s grading scale — such as 0–100%, 0–20 (French/European scale), or 0–4.0 GPA scale.',
    actionPrompt: 'Set your institution\'s target maximum (e.g. 20 for European scale, 100 for percentage).',
    howToProceed: [
      'Look at the Target Scale card located directly above the criteria list.',
      'Enter your institution\'s scale ceiling (e.g., 20 or 100).',
      'All WebPA calculations, summaries, and PDF report cards will scale automatically.'
    ],
    demoPreview: {
      actionLabel: 'Inspect Target Scale Conversion',
      description: 'Demonstrates grade normalization from raw criteria points to target ceiling.',
      expectedResult: 'Grade calculations instantly adopt institutional scale target.'
    },
    proTip: 'Set Target Scale to 20 for French/Bologna master programs, 100 for percentage-based grading, or leave unset.',
    tab: 'grading',
    preferredPlacement: 'bottom',
    icon: <Award size={17} className="text-amber" />
  },
  {
    id: 'eval_simulator',
    targetSelector: '[data-tour="eval-simulator-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showEvaluationSimulator',
    title: 'Student Mobile Evaluation Simulator',
    description: 'Test what students experience on their mobile devices with qualitative tier snap buttons (Needs Work, Good, Excellent) and score fine-tuners.',
    actionPrompt: 'Click "Good (16/20)" or "Excellent (20/20)" and move the slider to experience student mobile scoring!',
    howToProceed: [
      'Click the qualitative tier buttons: "Needs Work (50%)", "Good (80%)", or "Excellent (100%)".',
      'Move the score range slider to fine-tune the mark.',
      'This simulator lets you verify scale clarity before sending evaluation links to students.'
    ],
    demoPreview: {
      actionLabel: 'Test Score Snap "Good (16/20)"',
      description: 'Snaps score slider to 80% mark with behavioral descriptor guidance.',
      expectedResult: 'Score snaps to 16/20 with color-coded feedback.'
    },
    proTip: 'Ensures your rubric scale is intuitive and balanced before broadcasting links.',
    tab: 'grading',
    preferredPlacement: 'corner',
    icon: <Lightbulb size={17} className="text-amber" />
  },

  // ==========================================
  // --- STAGE 5: SECTION 3: GRADING & ANALYTICS ---
  // ==========================================
  {
    id: 'analytics_tab',
    targetSelector: '[data-tour="analytics-tab-btn"]',
    stage: 'Section 3: Grading & Analytics',
    title: 'Section 3: Grading & Analytics Navigation',
    description: 'Switch to Section 3 to inspect the real-time Calculation Matrix, WebPA Calibrator, Competency Spider Radar, and Johari Window.',
    actionPrompt: 'Click "3. Analytics" (or press 3) to view the WebPA matrix and Spider Radar deck.',
    howToProceed: [
      'Click the "3. Analytics" tab button in the navigation switcher (or press "3").',
      'Inspect real-time WebPA factors, self-excluded peer averages, and radar comparisons.',
      'Generate batch PDF report cards or export formatted Excel spreadsheets.'
    ],
    demoPreview: {
      actionLabel: 'Switch to Grade Analytics Tab',
      description: 'Navigates to the calculation matrix and perception decks.',
      expectedResult: 'Grade Analytics & Perception Insights dashboard mounts.'
    },
    proTip: 'Press "3" on your keyboard to navigate directly to Section 3.',
    hotkey: 'Press 3',
    tab: 'results',
    preferredPlacement: 'bottom',
    icon: <Award size={17} className="text-teal" />
  },
  {
    id: 'perception_deck',
    targetSelector: '[data-tour="perception-deck-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showCompetencyRadar',
    title: 'Competency Radar & Johari Perception Window',
    description: 'Compare cohort rubric averages vs specific teams with the Spider Radar, and identify self-overestimation vs underestimation blind spots.',
    actionPrompt: 'Switch the Team Overlay dropdown on the Radar chart to compare specific team competencies against class averages.',
    howToProceed: [
      'Select a team from the Radar dropdown to overlay their polygon against the class mean.',
      'Check the Johari Perception Matrix to spot Blind Spots (overconfident) and Imposters (undervaluing self).',
      'Use this diagnostic data to mentor teams and identify group friction early.'
    ],
    demoPreview: {
      actionLabel: 'Overlay Spider Radar for Alpha Team',
      description: 'Draws multi-dimensional radar polygon comparing team vs class.',
      expectedResult: 'Radar overlay paints team polygon across all rubric axes.'
    },
    proTip: 'Johari alignment automatically highlights blind spots using a ±7.5% self-peer threshold.',
    tab: 'results',
    preferredPlacement: 'corner',
    icon: <Activity size={17} className="text-primary" />
  },
  {
    id: 'webpa_calibrator',
    targetSelector: '[data-tour="webpa-calibrator-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showWebPACalibration',
    title: 'WebPA Grade Calibrator & Loughborough Algorithm',
    description: 'Adjust individual grade multipliers using the Loughborough WebPA algorithm. Drag the 0%–100% Fudge Weight slider to balance group score vs individual peer performance.',
    actionPrompt: 'Adjust the Fudge Weight slider (0% to 100%) to observe how individual student grades scale dynamically!',
    howToProceed: [
      'Look at the WebPA Calibrator card with the Loughborough formula.',
      'Drag the Fudge Weight slider between 0% (pure group mark) and 100% (full peer multiplier impact).',
      'Grades update in real time across the results summary sheet.'
    ],
    demoPreview: {
      actionLabel: 'Set WebPA Fudge Weight to 50%',
      description: 'Adjusts WebPA peer factor influence to 50% across all students.',
      expectedResult: 'Calibrated grades recalculate instantly.'
    },
    proTip: 'A 50% fudge weighting is the higher-education standard: rewarding strong contributors without overly penalizing struggling peers.',
    tab: 'results',
    preferredPlacement: 'corner',
    icon: <Calculator size={17} className="text-teal" />
  },
  {
    id: 'anomaly_audit',
    targetSelector: '[data-tour="anomaly-audit-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showAnomalyAudit',
    title: 'Anomaly & Collusion Audit Deck',
    description: 'Statistical diagnostics scan for peer grading collusion rings (reciprocal maximum scores), harsh outlier graders (spiteful reviews), and lazy uniform grading.',
    actionPrompt: 'Inspect the Anomaly Audit card to see flagged student pairs and collusion severity scores.',
    howToProceed: [
      'Review any flagged pairs in the Collusion Matrix.',
      'Click flagged students to inspect their reciprocal peer score breakdown.',
      'Ensure academic grading integrity before releasing final grades.'
    ],
    demoPreview: {
      actionLabel: 'Inspect Anomaly Audit Flags',
      description: 'Audits peer score patterns across all teams for collusion or spite.',
      expectedResult: 'Anomaly deck displays diagnostic integrity check.'
    },
    proTip: 'Audits flag scores deviating >2.0 standard deviations from team consensus.',
    tab: 'results',
    preferredPlacement: 'corner',
    icon: <ShieldCheck size={17} className="text-rose" />
  },
  {
    id: 'results_summary',
    targetSelector: '[data-tour="results-summary-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showResultsSummarySheet',
    title: 'Results Summary Sheet & Batch Reports',
    description: 'Complete overview of final calibrated grades, WebPA factors, submission statuses, and 1-click batch Excel / PDF report card generation.',
    actionPrompt: 'Click "Export Excel" or "Student PDF Reports" to deliver final feedback.',
    howToProceed: [
      'Search or filter student grades in the clean summary table.',
      'Click "Student PDF Reports" to batch generate individual feedback cards.',
      'Click "Export Excel" for a complete multi-sheet institutional gradebook.'
    ],
    demoPreview: {
      actionLabel: 'Inspect Results Summary Sheet',
      description: 'Shows student calibrated marks, WebPA factors, and export options.',
      expectedResult: 'Summary table highlights final scores and grade status.'
    },
    proTip: 'Reports contain formative comments and qualitative feedback without exposing peer names.',
    tab: 'results',
    preferredPlacement: 'corner',
    icon: <FileText size={17} className="text-indigo" />
  },
  {
    id: 'gradebook_matrix',
    targetSelector: '[data-tour="gradebook-matrix-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showDetailedReviewMatrix',
    title: 'Detailed Peer Evaluation Matrix',
    description: 'Inspect the granular cell-by-cell peer rating matrix with self-excluded averages, individual rubric criterion scores, and raw feedback.',
    actionPrompt: 'Scroll through the matrix to review student-to-student ratings on individual criteria.',
    howToProceed: [
      'Inspect self-excluded student peer ratings across all criteria.',
      'Check qualitative constructive feedback text left by teammates.',
      'Review variance indicators across each rubric competency.'
    ],
    demoPreview: {
      actionLabel: 'Inspect Detailed Matrix Breakdown',
      description: 'Examines individual rubric score vectors across all peer evaluations.',
      expectedResult: 'Granular evaluation matrix expands.'
    },
    proTip: 'Self-evaluations are strictly excluded from calculations to eliminate bias in peer grading.',
    tab: 'results',
    preferredPlacement: 'corner',
    icon: <Activity size={17} className="text-teal" />
  }
];

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  customStepIds,
  onRestoreSnapshot,
  hasSnapshot,
  onExecuteDemoStep,
  featureToggles
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: string }>({ top: 0, left: 0, placement: 'bottom' });
  const [activeSubTab, setActiveSubTab] = useState<'instructions' | 'howTo' | 'demo'>('instructions');
  const [demoExecuted, setDemoExecuted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const highlightedElRef = useRef<HTMLElement | null>(null);

  const effectiveToggles = featureToggles || loadFeatureToggles();

  // Smart adaptive steps: only show steps for features that are visible / enabled
  const activeSteps = useMemo(() => {
    let baseSteps = TOUR_STEPS;
    if (customStepIds && customStepIds.length > 0) {
      const stepMap = new Map(TOUR_STEPS.map(s => [s.id, s]));
      const filtered = customStepIds.map(id => stepMap.get(id)).filter(Boolean) as TourStep[];
      if (filtered.length > 0) {
        baseSteps = filtered;
      }
    }

    // Adaptive filtering: ignore hidden features
    const visibleSteps = baseSteps.filter(step => {
      if (!step.featureKey) return true;
      return effectiveToggles[step.featureKey] === true;
    });

    // Fallback if all steps in custom track happen to be hidden
    return visibleSteps.length > 0 ? visibleSteps : baseSteps;
  }, [customStepIds, effectiveToggles]);

  // Dynamic stage deduction based solely on currently active visible steps
  const stageList = useMemo(() => {
    const list: string[] = [];
    activeSteps.forEach(s => {
      if (!list.includes(s.stage)) {
        list.push(s.stage);
      }
    });
    return list;
  }, [activeSteps]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setActiveSubTab('instructions');
      setDemoExecuted(false);
    }
  }, [isOpen, customStepIds]);

  const safeIndex = Math.min(currentStepIndex, Math.max(0, activeSteps.length - 1));
  const step = activeSteps[safeIndex] || activeSteps[0];
  const currentStageIndex = stageList.indexOf(step?.stage || '');
  const currentStageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 1;
  const totalStages = stageList.length || 1;

  // Smart non-overlapping position calculator taking into account the floating top navigation bars
  const calculatePosition = useCallback((targetEl: Element) => {
    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    const isInsideDock = !!targetEl.closest('.dashboard-sticky-dock');
    const dockEl = document.querySelector('.dashboard-sticky-dock');
    const dockBottom = (dockEl && !isInsideDock) ? Math.max(0, dockEl.getBoundingClientRect().bottom) : 0;

    const popoverWidth = Math.min(380, window.innerWidth - 32);
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 320;
    const margin = 14;

    // Available space taking floating sticky dock into account
    const safeTopBound = isInsideDock ? 0 : dockBottom;
    const spaceAbove = rect.top - safeTopBound - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceLeft = rect.left - margin;
    const spaceRight = window.innerWidth - rect.right - margin;

    const isLargeElement = rect.height > 240 || rect.width > window.innerWidth * 0.75;
    let chosenPlacement = step?.preferredPlacement || (isInsideDock ? 'bottom' : 'corner');

    if (isInsideDock) {
      // Elements inside the floating dock must always have their tooltip below the dock
      chosenPlacement = 'bottom';
    } else if (chosenPlacement === 'corner' || isLargeElement) {
      // For large container cards:
      // Place the popover cleanly in the bottom-right floating dock area so it NEVER covers headers/inputs!
      chosenPlacement = 'corner';
    } else if (chosenPlacement === 'bottom') {
      if (spaceBelow < popoverHeight) {
        if (spaceAbove >= popoverHeight) {
          chosenPlacement = 'top';
        } else if (spaceRight >= popoverWidth) {
          chosenPlacement = 'right';
        } else if (spaceLeft >= popoverWidth) {
          chosenPlacement = 'left';
        } else {
          chosenPlacement = 'corner';
        }
      }
    } else if (chosenPlacement === 'top') {
      if (spaceAbove < popoverHeight) {
        if (spaceBelow >= popoverHeight) {
          chosenPlacement = 'bottom';
        } else {
          chosenPlacement = 'corner';
        }
      }
    } else if (chosenPlacement === 'right') {
      if (spaceRight < popoverWidth) {
        chosenPlacement = spaceLeft >= popoverWidth ? 'left' : spaceBelow >= popoverHeight ? 'bottom' : 'corner';
      }
    } else if (chosenPlacement === 'left') {
      if (spaceLeft < popoverWidth) {
        chosenPlacement = spaceRight >= popoverWidth ? 'right' : spaceBelow >= popoverHeight ? 'bottom' : 'corner';
      }
    }

    if (chosenPlacement === 'corner') {
      setPopoverPos({
        top: Math.max(dockBottom + 16, window.innerHeight - popoverHeight - 20),
        left: Math.max(16, window.innerWidth - popoverWidth - 24),
        placement: 'corner'
      });
      return;
    }

    let top = 0;
    let left = 0;

    if (chosenPlacement === 'bottom') {
      top = rect.bottom + margin;
      left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    } else if (chosenPlacement === 'top') {
      top = rect.top - popoverHeight - margin;
      left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    } else if (chosenPlacement === 'right') {
      top = rect.top + (rect.height / 2) - (popoverHeight / 2);
      left = rect.right + margin;
    } else if (chosenPlacement === 'left') {
      top = rect.top + (rect.height / 2) - (popoverHeight / 2);
      left = rect.left - popoverWidth - margin;
    }

    // Boundary Clamping with zero overlap on sticky top bar
    const minSafeTop = isInsideDock ? (rect.bottom + 8) : (dockBottom + 14);
    const clampedTop = Math.max(minSafeTop, Math.min(top, window.innerHeight - popoverHeight - 16));
    const clampedLeft = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));

    setPopoverPos({
      top: clampedTop,
      left: clampedLeft,
      placement: chosenPlacement
    });
  }, [step]);

  // Navigate, scroll and elevate target element for real interactions
  const syncStepTarget = useCallback(() => {
    if (!step) return;

    // Reset previous elevated element
    if (highlightedElRef.current) {
      highlightedElRef.current.style.zIndex = '';
      highlightedElRef.current.style.position = '';
      highlightedElRef.current = null;
    }

    // Switch tab if step belongs to another tab
    if (step.tab && onNavigateTab) {
      onNavigateTab(step.tab);
    }

    // Allow small delay for DOM tab mounting with retry logic
    const attemptHighlight = (retryCount = 0) => {
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (el) {
        // Elevate element so user can directly click and interact with real buttons/inputs!
        el.style.position = 'relative';
        el.style.zIndex = '10001';
        highlightedElRef.current = el;

        const isInsideDock = !!el.closest('.dashboard-sticky-dock');
        if (isInsideDock) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Smooth scroll leaving comfortable breathing room accounting for the floating dock
          const dockEl = document.querySelector('.dashboard-sticky-dock');
          const dockHeight = dockEl ? dockEl.getBoundingClientRect().height : 130;
          const elemRect = el.getBoundingClientRect();
          const absoluteTop = elemRect.top + window.scrollY;
          const targetScrollY = Math.max(0, absoluteTop - (dockHeight + 20));
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        }

        setTimeout(() => {
          calculatePosition(el);
        }, 150);
      } else if (retryCount < 2) {
        setTimeout(() => attemptHighlight(retryCount + 1), 180);
      } else {
        setTargetRect(null);
        setPopoverPos({
          top: 140,
          left: Math.max(16, (window.innerWidth / 2) - 190),
          placement: 'center'
        });
      }
    };

    setTimeout(() => attemptHighlight(0), 120);
  }, [step, onNavigateTab, calculatePosition]);

  // Cleanup elevated zIndex on unmount
  useEffect(() => {
    return () => {
      if (highlightedElRef.current) {
        highlightedElRef.current.style.zIndex = '';
        highlightedElRef.current.style.position = '';
        highlightedElRef.current = null;
      }
    };
  }, []);

  // Real-time tracking loop during open tour
  useEffect(() => {
    if (!isOpen) return;

    setDemoExecuted(false);
    syncStepTarget();

    const handleFollow = () => {
      const el = document.querySelector(step?.targetSelector || '');
      if (el) {
        calculatePosition(el);
      }
    };

    window.addEventListener('resize', handleFollow, { passive: true });
    window.addEventListener('scroll', handleFollow, { passive: true });

    return () => {
      window.removeEventListener('resize', handleFollow);
      window.removeEventListener('scroll', handleFollow);
    };
  }, [isOpen, safeIndex, syncStepTarget, calculatePosition, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, safeIndex, activeSteps.length]);

  const handleNext = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setActiveSubTab('instructions');
    } else {
      if (onRestoreSnapshot) {
        onRestoreSnapshot();
      }
      localStorage.setItem('peer_has_completed_tour', 'true');
      // Return to home screen tab & scroll to top
      if (onNavigateTab) {
        onNavigateTab('hub');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setActiveSubTab('instructions');
    }
  };

  const handleSkip = () => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot();
    }
    localStorage.setItem('peer_has_completed_tour', 'true');
    // Return to home screen tab & scroll to top
    if (onNavigateTab) {
      onNavigateTab('hub');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  const handleFinishAndRestore = () => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot();
    }
    localStorage.setItem('peer_has_completed_tour', 'true');
    // Return to home screen tab & scroll to top
    if (onNavigateTab) {
      onNavigateTab('hub');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  // Trigger live simulated action on the highlighted element safely
  const handleTriggerLiveDemo = () => {
    setDemoExecuted(true);
    if (onExecuteDemoStep && step) {
      onExecuteDemoStep(step.id);
    }
  };

  if (!isOpen || !step) return null;

  const progressPercent = Math.round(((safeIndex + 1) / activeSteps.length) * 100);

  return createPortal(
    <div className="interactive-tour-overlay" aria-modal="true" role="dialog" style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
      
      {/* 4 PHYSICAL BACKDROP PANELS SURROUNDING THE TARGET (GUARANTEES 100% UNBLOCKED CLICKS ON TARGET) */}
      {targetRect ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
          {/* Top backdrop */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${Math.max(0, targetRect.top - 6)}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.62)',
              pointerEvents: 'auto'
            }}
          />
          {/* Bottom backdrop */}
          <div
            style={{
              position: 'absolute',
              top: `${targetRect.bottom + 6}px`,
              left: 0,
              width: '100%',
              height: `${Math.max(0, window.innerHeight - targetRect.bottom - 6)}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.62)',
              pointerEvents: 'auto'
            }}
          />
          {/* Left backdrop */}
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left - 6)}px`,
              height: `${targetRect.height + 12}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.62)',
              pointerEvents: 'auto'
            }}
          />
          {/* Right backdrop */}
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: `${targetRect.right + 6}px`,
              width: `${Math.max(0, window.innerWidth - targetRect.right - 6)}px`,
              height: `${targetRect.height + 12}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.62)',
              pointerEvents: 'auto'
            }}
          />
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: 'rgba(15, 23, 42, 0.62)', pointerEvents: 'auto' }} />
      )}

      {/* Target Pulsing Halo Box */}
      {targetRect && (
        <div
          className="tour-target-halo"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            pointerEvents: 'none',
            borderRadius: '10px'
          }}
        />
      )}

      {/* Floating Tour Popover Card - Minimal & Clean */}
      <div
        ref={popoverRef}
        className={`tour-popover-card placement-${popoverPos.placement}`}
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          pointerEvents: 'auto',
          width: '380px',
          padding: '1.1rem',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}
      >
        {/* Minimal Header with Stage & Step */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#4f46e5',
              backgroundColor: '#eef2ff',
              padding: '0.15rem 0.5rem',
              borderRadius: '5px',
              border: '1px solid #c7d2fe',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            Stage {currentStageNumber}/{totalStages} &bull; {step.stage}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
              {safeIndex + 1} / {activeSteps.length}
            </span>
            <button
              type="button"
              className="tour-close-btn"
              onClick={handleSkip}
              title="Exit Tour (Esc)"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.15rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Minimal Thin Continuous Progress Bar */}
        <div style={{ width: '100%', height: '3px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#4f46e5',
              transition: 'width 0.25s ease'
            }}
          />
        </div>

        {/* Segmented Mode Switcher */}
        <div style={{ display: 'flex', gap: '2px', padding: '2px', backgroundColor: '#f1f5f9', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('instructions')}
            style={{
              flex: 1,
              padding: '0.3rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: activeSubTab === 'instructions' ? 700 : 600,
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'instructions' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'instructions' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'instructions' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('howTo')}
            style={{
              flex: 1,
              padding: '0.3rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: activeSubTab === 'howTo' ? 700 : 600,
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'howTo' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'howTo' ? '#4f46e5' : '#64748b',
              boxShadow: activeSubTab === 'howTo' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              transition: 'all 0.15s ease'
            }}
          >
            <HelpCircle size={11} /> Steps
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('demo')}
            style={{
              flex: 1.1,
              padding: '0.3rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: '5px',
              border: activeSubTab === 'demo' ? '1px solid #10b981' : '1px solid #bbf7d0',
              cursor: 'pointer',
              background: activeSubTab === 'demo' 
                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' 
                : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              color: '#047857',
              boxShadow: activeSubTab === 'demo' ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={10} style={{ fill: '#047857', color: '#047857' }} />
            <span>Live Demo</span>
          </button>
        </div>

        {/* Card Body Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '42vh', overflowY: 'auto', paddingRight: '2px' }}>
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {step.icon}
            </span>
            <span>{step.title}</span>
          </h4>

          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'instructions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>
                {step.description}
              </p>

              {/* Minimal Interactive Task Callout */}
              {step.actionPrompt && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.45rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: '#f0fdfa',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '7px',
                    border: '1px solid #99f6e4',
                    lineHeight: 1.4
                  }}
                >
                  <MousePointer size={13} style={{ color: '#0d9488', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: '#0d9488', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.03em', display: 'block' }}>
                      Try it on screen:
                    </span>
                    {step.actionPrompt}
                  </div>
                </div>
              )}

              {/* Minimal Pro Tip */}
              {step.proTip && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    padding: '0.4rem 0.65rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.74rem',
                    color: '#334155',
                    lineHeight: 1.38
                  }}
                >
                  <Sparkles size={12} style={{ color: '#4f46e5', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <b style={{ color: '#4f46e5' }}>Tip:</b> {step.proTip}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NUMBERED STEPS */}
          {activeSubTab === 'howTo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(step.howToProceed || [
                'Look at the highlighted section on your real dashboard window.',
                'Click the highlighted buttons or choose options from the menus.',
                'Click "Next" in this tour card when you are ready to proceed.'
              ]).map((instruction, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.76rem', color: '#334155', lineHeight: 1.38 }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#eef2ff', color: '#4f46e5', fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {idx + 1}
                  </span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LIVE DEMO ACTION */}
          {activeSubTab === 'demo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '7px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                  Simulated Action:
                </span>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#0f172a', lineHeight: 1.38 }}>
                  {step.demoPreview?.description || 'Test the real highlighted control on your screen.'}
                </p>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  <b>Result:</b> {step.demoPreview?.expectedResult || 'Real screen updates interactively.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerLiveDemo}
                style={{
                  height: '36px',
                  gap: '0.45rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {demoExecuted ? (
                  <><Check size={14} /> Action Executed Live on Screen!</>
                ) : (
                  <><Play size={13} style={{ fill: '#ffffff' }} /> {step.demoPreview?.actionLabel || 'Demonstrate Action Live'}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div style={{ marginTop: '0.25rem', paddingTop: '0.55rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          {hasSnapshot && safeIndex === activeSteps.length - 1 ? (
            <button
              type="button"
              onClick={handleFinishAndRestore}
              title="Restores workspace to clean pre-tour state and returns to Home"
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.6rem',
                gap: '0.25rem',
                color: '#b45309',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              <RotateCcw size={11} /> Reset Data
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.5rem',
                color: '#64748b',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Skip
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex === 0}
              style={{
                padding: '0.35rem 0.65rem',
                gap: '0.25rem',
                opacity: safeIndex === 0 ? 0.4 : 1,
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: safeIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              <ArrowLeft size={12} /> Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '0.35rem 0.85rem',
                gap: '0.35rem',
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              {safeIndex === activeSteps.length - 1 ? (
                <>
                  <CheckCircle size={12} /> Finish Tour
                </>
              ) : (
                <>
                  Next <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InteractiveTour;
