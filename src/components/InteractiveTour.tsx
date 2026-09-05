import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, ArrowLeft, X, CheckCircle, 
  Sparkles, QrCode, Sliders, Users, Award, Mail,
  Layers, ShieldCheck, Maximize2, Search,
  Settings, Activity, BookOpen, Download, RotateCcw,
  Play, Check, Compass, Calculator, FileText, Zap, Heart
} from 'lucide-react';
import { type FeatureToggles, loadFeatureToggles } from '../utils/featurePreferences';

export interface TourStep {
  id: string;
  targetSelector: string;
  stage: string;
  title: string;
  description: string;
  demoLabel?: string;
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
  // --- STAGE 1: SETUP & NAVIGATION ---
  {
    id: 'class_header',
    targetSelector: '[data-tour="class-header"]',
    stage: 'Setup & Navigation',
    featureKey: 'showClassPicker',
    title: 'Classroom Selector & Section ID',
    description: 'Switch between course sections and copy your unique Classroom ID for student onboarding.',
    demoLabel: 'Copy Classroom ID',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <BookOpen size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'workspace_switcher',
    targetSelector: '[data-tour="workspace-selector"]',
    stage: 'Setup & Navigation',
    featureKey: 'showProfilePill',
    title: 'Multi-Workspace Profiles',
    description: 'Manage distinct teaching workspaces to isolate course terms, syllabi, and TA permissions.',
    demoLabel: 'Open Profile Manager',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Layers size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'command_palette',
    targetSelector: '[data-tour="command-palette-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showCommandSearch',
    title: 'Omni Command Palette',
    description: 'Hit Ctrl+K (or /) to search students, jump to teams, export marks, and run actions at keyboard speed.',
    demoLabel: 'Open Command Palette',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Search size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'guide_center_btn',
    targetSelector: '[data-tour="guide-center-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showGuideButton',
    title: 'Academic Guidance Center',
    description: 'Access complete algorithm manuals (WebPA, Johari Window), guided spotlight tracks, and feature docs.',
    demoLabel: 'Open Guidance Center',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Compass size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'projector_mode',
    targetSelector: '[data-tour="projector-mode-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showProjectorButton',
    title: 'Auditorium Projector View',
    description: 'Display an auditorium-ready view with live QR check-in and team rosters while keeping grades hidden.',
    demoLabel: 'Launch Projector Mode',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Maximize2 size={16} style={{ color: 'var(--accent-teal)' }} />
  },
  {
    id: 'email_dispatcher',
    targetSelector: '[data-tour="email-dispatcher-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showEmailButton',
    title: 'Email Link Dispatcher',
    description: 'Broadcast personalized, 1-click evaluation access links to students via SMTP or EmailJS.',
    demoLabel: 'Open Email Dispatcher',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Mail size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'customize_view',
    targetSelector: '[data-tour="customize-view-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showCustomizeViewButton',
    title: 'Customize View & Presets',
    description: 'Toggle individual cards or switch presets between Minimal and Standard modes for clean presentation.',
    demoLabel: 'Open Customizer',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Settings size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'settings_hub',
    targetSelector: '[data-tour="settings-hub-btn"]',
    stage: 'Setup & Navigation',
    featureKey: 'showSettingsButton',
    title: 'Settings & Cloud Sync',
    description: 'Configure cloud backup, shortcut keybindings, LMS export formats, and interface preferences.',
    demoLabel: 'Open Settings',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Settings size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'quick_action_dock',
    targetSelector: '[data-tour="quick-action-pill"]',
    stage: 'Setup & Navigation',
    title: 'Quick Action Center',
    description: 'Floating bottom dock for instant module toggling, classroom switching, and direct tool launches.',
    demoLabel: 'Inspect Quick Pill',
    tab: 'hub',
    preferredPlacement: 'top',
    icon: <Zap size={16} style={{ color: 'var(--primary)' }} />
  },

  // --- STAGE 2: HOME HUB OVERVIEW ---
  {
    id: 'hub_enrollment',
    targetSelector: '[data-tour="hub-enrollment-card"]',
    stage: 'Home Hub Overview',
    title: 'Section 1: Enrollment & Teams',
    description: 'Onboard student rosters, distribute join QR codes, and generate balanced teams with diversity algorithms.',
    demoLabel: 'Go to Section 1',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Users size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'hub_review',
    targetSelector: '[data-tour="hub-review-card"]',
    stage: 'Home Hub Overview',
    title: 'Section 2: Review System',
    description: 'Configure criteria rubrics, auto-balance weights to 100%, and deploy 30-second team health pulses.',
    demoLabel: 'Go to Section 2',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Sliders size={16} style={{ color: 'var(--accent-amber)' }} />
  },
  {
    id: 'hub_analytics',
    targetSelector: '[data-tour="hub-analytics-card"]',
    stage: 'Home Hub Overview',
    title: 'Section 3: Grading & Analytics',
    description: 'Calculate Loughborough WebPA multipliers, inspect Johari radars, and export master gradebooks.',
    demoLabel: 'Go to Section 3',
    tab: 'hub',
    preferredPlacement: 'bottom',
    icon: <Award size={16} style={{ color: 'var(--accent-teal)' }} />
  },

  // --- STAGE 3: SECTION 1 (ENROLLMENT & TEAMS) ---
  {
    id: 'section_roster_tab',
    targetSelector: '[data-tour="section-roster-btn"]',
    stage: 'Section 1: Enrollment & Teams',
    title: 'Roster & Team Management',
    description: 'Full roster table showing enrolled students, demographics, team allocations, and review progress.',
    demoLabel: 'Open Section 1',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Users size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'self_enrollment',
    targetSelector: '[data-tour="self-enrollment-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showSelfEnrollmentCard',
    title: 'Self-Enrollment QR Code',
    description: 'Students scan this QR code on mobile devices to self-enroll instantly without needing passwords.',
    demoLabel: 'Show QR Code',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <QrCode size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'quick_actions',
    targetSelector: '[data-tour="quick-actions-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showQuickActionsCard',
    title: 'Sample Cohort Generator',
    description: 'Populate demo cohorts with balanced demographics to test algorithms and rubrics immediately.',
    demoLabel: 'Load Demo Cohort',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
  },
  {
    id: 'import_wizard',
    targetSelector: '[data-tour="import-wizard-card"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showImportWizardCard',
    title: 'Spreadsheet Import Wizard',
    description: 'Import class rosters from CSV, Excel, or TSV with smart auto-column mapping and error checking.',
    demoLabel: 'Open Import Wizard',
    tab: 'roster',
    preferredPlacement: 'bottom',
    icon: <Download size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'autogroup_studio',
    targetSelector: '[data-tour="autogroup-studio"]',
    stage: 'Section 1: Enrollment & Teams',
    featureKey: 'showAutoGroupStudio',
    title: 'AutoGroup Diversity Studio',
    description: 'Form balanced teams using simulated annealing to optimize for skill distribution, gender, and nationality.',
    demoLabel: 'Open AutoGroup',
    tab: 'roster',
    preferredPlacement: 'top',
    icon: <Users size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'classroom_roster',
    targetSelector: '[data-tour="classroom-roster-table"]',
    stage: 'Section 1: Enrollment & Teams',
    title: 'Interactive Roster Table',
    description: 'Search, filter, and bulk-manage students, team transfers, and individual submission statuses.',
    demoLabel: 'Filter by Student',
    tab: 'roster',
    preferredPlacement: 'top',
    icon: <Users size={16} style={{ color: 'var(--primary)' }} />
  },

  // --- STAGE 4: SECTION 2 (REVIEW SYSTEM & RUBRICS) ---
  {
    id: 'rubric_tab',
    targetSelector: '[data-tour="rubric-tab-btn"]',
    stage: 'Section 2: Review System',
    title: 'Review System & Rubrics Tab',
    description: 'Define evaluation criteria, auto-balance weights to 100%, and configure student form permissions.',
    demoLabel: 'Open Section 2',
    tab: 'grading',
    preferredPlacement: 'bottom',
    icon: <Sliders size={16} style={{ color: 'var(--accent-amber)' }} />
  },
  {
    id: 'rubric_builder',
    targetSelector: '[data-tour="rubric-builder-card"]',
    stage: 'Section 2: Review System',
    title: 'Rubric Builder & IPAF Preset',
    description: 'Create multi-criteria rubrics with auto-balancing weights, or load the research-backed 6-dimension IPAF standard.',
    demoLabel: 'Apply IPAF Preset',
    tab: 'grading',
    preferredPlacement: 'bottom',
    icon: <Sliders size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'target_scale',
    targetSelector: '[data-tour="target-scale-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showTargetScaleCard',
    title: 'Target Grading Scale',
    description: 'Normalize rubric marks into standard institutional grading scales: Percentage (0-100), French (0-20), or GPA 4.0.',
    demoLabel: 'Check Scale Converter',
    tab: 'grading',
    preferredPlacement: 'bottom',
    icon: <Sliders size={16} style={{ color: 'var(--accent-teal)' }} />
  },
  {
    id: 'eval_simulator',
    targetSelector: '[data-tour="eval-simulator-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showEvaluationSimulator',
    title: 'Student Simulator Preview',
    description: 'Test the exact smartphone peer review experience your students see before publishing evaluation rounds.',
    demoLabel: 'Simulate Rating Mark',
    tab: 'grading',
    preferredPlacement: 'top',
    icon: <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
  },
  {
    id: 'eval_controls',
    targetSelector: '[data-tour="eval-controls-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showEvaluationFormControls',
    title: 'Evaluation Form Controls',
    description: 'Govern student forms: toggle self-evaluations, praise badges across 6 competency dimensions, and lock profiles.',
    demoLabel: 'Inspect Form Controls',
    tab: 'grading',
    preferredPlacement: 'top',
    icon: <ShieldCheck size={16} style={{ color: 'var(--accent-amber)' }} />
  },
  {
    id: 'team_health_pulse',
    targetSelector: '[data-tour="team-health-pulse-card"]',
    stage: 'Section 2: Review System',
    featureKey: 'showTeamHealthPulse',
    title: 'Team Health Micro-Pulse',
    description: 'Launch 30-second check-in surveys with 5 scale presets and qualitative blocker triage to spot failing teams early.',
    demoLabel: 'View Pulse Radar',
    tab: 'grading',
    preferredPlacement: 'top',
    icon: <Heart size={16} style={{ color: 'var(--accent-rose)' }} />
  },

  // --- STAGE 5: SECTION 3 (GRADING & ANALYTICS) ---
  {
    id: 'analytics_tab',
    targetSelector: '[data-tour="analytics-tab-btn"]',
    stage: 'Section 3: Grading & Analytics',
    title: 'Grading & Analytics Tab',
    description: 'Inspect individual WebPA multipliers, perception radars, statistical collusion flags, and gradebook exports.',
    demoLabel: 'Open Section 3',
    tab: 'results',
    preferredPlacement: 'bottom',
    icon: <Award size={16} style={{ color: 'var(--accent-teal)' }} />
  },
  {
    id: 'perception_deck',
    targetSelector: '[data-tour="perception-deck-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showCompetencyRadar',
    title: 'Competency Radar & Johari Window',
    description: 'Overlay individual competency spider radars against team averages and identify self-evaluation blind spots.',
    demoLabel: 'Select Alpha Team Radar',
    tab: 'results',
    preferredPlacement: 'bottom',
    icon: <Activity size={16} style={{ color: 'var(--primary)' }} />
  },
  {
    id: 'webpa_calibrator',
    targetSelector: '[data-tour="webpa-calibrator-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showWebPACalibration',
    title: 'WebPA Calibrator & Fudge Weight',
    description: 'Tune the 0%-100% Fudge Weight slider to control how strongly peer ratings adjust final marks relative to team base grades.',
    demoLabel: 'Set 50% Weighting',
    tab: 'results',
    preferredPlacement: 'bottom',
    icon: <Calculator size={16} style={{ color: 'var(--accent-teal)' }} />
  },
  {
    id: 'anomaly_audit',
    targetSelector: '[data-tour="anomaly-audit-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showAnomalyAudit',
    title: 'Anomaly & Collusion Audit',
    description: 'Statistical audit flagging reciprocal score pacts, outlier harsh graders, and spiteful scoring discrepancies.',
    demoLabel: 'Inspect Collusion Flags',
    tab: 'results',
    preferredPlacement: 'top',
    icon: <ShieldCheck size={16} style={{ color: 'var(--accent-rose)' }} />
  },
  {
    id: 'results_summary',
    targetSelector: '[data-tour="results-summary-card"]',
    stage: 'Section 3: Grading & Analytics',
    featureKey: 'showResultsSummarySheet',
    title: 'Results Summary & Export Suite',
    description: 'Review final calibrated grades and export complete workbooks for Canvas, Moodle, Blackboard, or Excel in 1 click.',
    demoLabel: 'Inspect Grade Breakdown',
    tab: 'results',
    preferredPlacement: 'top',
    icon: <FileText size={16} style={{ color: 'var(--accent-teal)' }} />
  },
  {
    id: 'gradebook_matrix',
    targetSelector: '[data-tour="gradebook-matrix-card"]',
    stage: 'Section 3: Grading & Analytics',
    title: 'Master Gradebook Matrix',
    description: 'Detailed student-by-student mark matrix with per-criterion scores, WebPA factors, and batch student PDF reports.',
    demoLabel: 'Review Gradebook',
    tab: 'results',
    preferredPlacement: 'top',
    icon: <Award size={16} style={{ color: 'var(--accent-teal)' }} />
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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: string }>({ top: 120, left: 24, placement: 'bottom' });
  const [demoExecuted, setDemoExecuted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const highlightedElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

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

    const visibleSteps = baseSteps.filter(step => {
      if (!step.featureKey) return true;
      return effectiveToggles[step.featureKey] === true;
    });

    return visibleSteps.length > 0 ? visibleSteps : baseSteps;
  }, [customStepIds, effectiveToggles]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setDemoExecuted(false);
    }
  }, [isOpen, customStepIds]);

  const safeIndex = Math.min(currentStepIndex, Math.max(0, activeSteps.length - 1));
  const step = activeSteps[safeIndex] || activeSteps[0];

  // High-performance position calculator (GPU-friendly, non-overlapping)
  const calculatePosition = useCallback((targetEl: Element) => {
    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    const isInsideDock = !!targetEl.closest('.dashboard-sticky-dock');
    const dockEl = document.querySelector('.dashboard-sticky-dock');
    const dockBottom = (dockEl && !isInsideDock) ? Math.max(0, dockEl.getBoundingClientRect().bottom) : 0;

    const popoverWidth = Math.min(350, window.innerWidth - 32);
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 210;
    const margin = 12;

    const safeTopBound = isInsideDock ? 0 : dockBottom;
    const spaceAbove = rect.top - safeTopBound - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceLeft = rect.left - margin;
    const spaceRight = window.innerWidth - rect.right - margin;

    const isLargeElement = rect.height > 260 || rect.width > window.innerWidth * 0.78;
    let chosenPlacement = step?.preferredPlacement || (isInsideDock ? 'bottom' : 'corner');

    if (isInsideDock) {
      chosenPlacement = 'bottom';
    } else if (chosenPlacement === 'corner' || isLargeElement) {
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
        top: Math.max(dockBottom + 12, window.innerHeight - popoverHeight - 16),
        left: Math.max(16, window.innerWidth - popoverWidth - 20),
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

    const minSafeTop = isInsideDock ? (rect.bottom + 6) : (dockBottom + 10);
    const clampedTop = Math.max(minSafeTop, Math.min(top, window.innerHeight - popoverHeight - 14));
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

    if (highlightedElRef.current) {
      highlightedElRef.current.style.zIndex = '';
      highlightedElRef.current.style.position = '';
      highlightedElRef.current = null;
    }

    if (step.tab && onNavigateTab) {
      onNavigateTab(step.tab);
    }

    const attemptHighlight = (retryCount = 0) => {
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (el) {
        el.style.position = 'relative';
        el.style.zIndex = '10001';
        highlightedElRef.current = el;

        const isInsideDock = !!el.closest('.dashboard-sticky-dock');
        const elemRect = el.getBoundingClientRect();
        const isInView = elemRect.top >= 90 && elemRect.bottom <= (window.innerHeight - 80);

        // Only scroll if element is not already comfortably visible
        if (!isInsideDock && !isInView) {
          const dockEl = document.querySelector('.dashboard-sticky-dock');
          const dockHeight = dockEl ? dockEl.getBoundingClientRect().height : 120;
          const absoluteTop = elemRect.top + window.scrollY;
          const targetScrollY = Math.max(0, absoluteTop - (dockHeight + 20));
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        }

        requestAnimationFrame(() => {
          calculatePosition(el);
        });
      } else if (retryCount < 3) {
        setTimeout(() => attemptHighlight(retryCount + 1), 60);
      } else {
        setTargetRect(null);
        setPopoverPos({
          top: 140,
          left: Math.max(16, (window.innerWidth / 2) - 175),
          placement: 'center'
        });
      }
    };

    // Low latency target snap
    requestAnimationFrame(() => attemptHighlight(0));
  }, [step, onNavigateTab, calculatePosition]);

  useEffect(() => {
    return () => {
      if (highlightedElRef.current) {
        highlightedElRef.current.style.zIndex = '';
        highlightedElRef.current.style.position = '';
        highlightedElRef.current = null;
      }
    };
  }, []);

  // Smooth throttled tracking with requestAnimationFrame (Zero lag!)
  useEffect(() => {
    if (!isOpen) return;

    setDemoExecuted(false);
    syncStepTarget();

    const handleFollow = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const el = document.querySelector(step?.targetSelector || '');
        if (el) {
          calculatePosition(el);
        }
      });
    };

    window.addEventListener('resize', handleFollow, { passive: true });
    window.addEventListener('scroll', handleFollow, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot();
    }
    localStorage.setItem('peer_has_completed_tour', 'true');
    if (onNavigateTab) {
      onNavigateTab('hub');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  const handleSkip = () => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot();
    }
    localStorage.setItem('peer_has_completed_tour', 'true');
    if (onNavigateTab) {
      onNavigateTab('hub');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  const handleTriggerDemo = () => {
    if (onExecuteDemoStep && step) {
      onExecuteDemoStep(step.id);
      setDemoExecuted(true);
    }
  };

  if (!isOpen || !step) return null;

  const progressPercent = Math.round(((safeIndex + 1) / activeSteps.length) * 100);

  return createPortal(
    <div
      className="interactive-tour-overlay"
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'none'
      }}
    >
      {/* 4 PHYSICAL BACKDROP CUTOUT PANELS */}
      {targetRect ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
          {/* Top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${Math.max(0, targetRect.top - 5)}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
              pointerEvents: 'auto'
            }}
          />
          {/* Bottom */}
          <div
            style={{
              position: 'absolute',
              top: `${targetRect.bottom + 5}px`,
              left: 0,
              width: '100%',
              height: `${Math.max(0, window.innerHeight - targetRect.bottom - 5)}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
              pointerEvents: 'auto'
            }}
          />
          {/* Left */}
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(0, targetRect.top - 5)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left - 5)}px`,
              height: `${targetRect.height + 10}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
              pointerEvents: 'auto'
            }}
          />
          {/* Right */}
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(0, targetRect.top - 5)}px`,
              left: `${targetRect.right + 5}px`,
              width: `${Math.max(0, window.innerWidth - targetRect.right - 5)}px`,
              height: `${targetRect.height + 10}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
              pointerEvents: 'auto'
            }}
          />
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: 'rgba(15, 23, 42, 0.58)', pointerEvents: 'auto' }} />
      )}

      {/* Target Pulsing Halo Box */}
      {targetRect && (
        <div
          className="tour-target-halo"
          style={{
            top: `${targetRect.top - 5}px`,
            left: `${targetRect.left - 5}px`,
            width: `${targetRect.width + 10}px`,
            height: `${targetRect.height + 10}px`,
            position: 'fixed'
          }}
        />
      )}

      {/* Floating Tour Popover Card - Minimal, Sleek, Precise */}
      <div
        ref={popoverRef}
        className={`tour-popover-card placement-${popoverPos.placement}`}
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          pointerEvents: 'auto'
        }}
      >
        {/* Minimal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light, rgba(99, 102, 241, 0.1))',
                padding: '0.12rem 0.45rem',
                borderRadius: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
            >
              {step.stage}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
              {safeIndex + 1} of {activeSteps.length}
            </span>
          </div>

          <button
            type="button"
            className="tour-close-btn"
            onClick={handleSkip}
            title="Exit Tour (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
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

        {/* Minimal Thin Progress Bar */}
        <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--border-color, #f1f5f9)', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              transition: 'width 0.2s ease'
            }}
          />
        </div>

        {/* Title with Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.1rem' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-app, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {step.icon}
          </span>
          <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {step.title}
          </h4>
        </div>

        {/* Crisp 1-2 sentence overview */}
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.45 }}>
          {step.description}
        </p>

        {/* Optional 1-Click Interactive Test Action */}
        {step.demoLabel && onExecuteDemoStep && (
          <button
            type="button"
            onClick={handleTriggerDemo}
            style={{
              marginTop: '0.1rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: demoExecuted ? '1px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
              backgroundColor: demoExecuted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app, #f8fafc)',
              color: demoExecuted ? '#059669' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            {demoExecuted ? (
              <>
                <Check size={12} style={{ color: '#059669' }} /> Action Executed Live!
              </>
            ) : (
              <>
                <Play size={11} style={{ fill: 'currentColor' }} /> Test: {step.demoLabel}
              </>
            )}
          </button>
        )}

        {/* Minimal Footer Controls */}
        <div
          style={{
            marginTop: '0.2rem',
            paddingTop: '0.45rem',
            borderTop: '1px solid var(--border-color, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          {hasSnapshot && safeIndex === activeSteps.length - 1 ? (
            <button
              type="button"
              onClick={handleComplete}
              title="Restores workspace to clean state"
              style={{
                fontSize: '0.72rem',
                padding: '0.3rem 0.55rem',
                gap: '0.25rem',
                color: '#b45309',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center'
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
                padding: '0.3rem 0.45rem',
                color: 'var(--text-muted, #64748b)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Exit Tour
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex === 0}
              style={{
                padding: '0.32rem 0.6rem',
                gap: '0.25rem',
                opacity: safeIndex === 0 ? 0.35 : 1,
                backgroundColor: 'var(--bg-app, #f8fafc)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: safeIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={11} /> Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '0.32rem 0.8rem',
                gap: '0.3rem',
                fontWeight: 700,
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {safeIndex === activeSteps.length - 1 ? (
                <>
                  <CheckCircle size={11} /> Finish
                </>
              ) : (
                <>
                  Next <ArrowRight size={11} />
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
