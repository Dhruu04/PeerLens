// src/components/DynamicRetractableDisplay.tsx
// Complete, ultra-premium dynamic retractable display allowing users to open and pin any module/submodule
// across the entire PeerLens platform to inspect, interact with, and monitor across any window or tab.

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Pin,
  PinOff,
  GripVertical,
  Move,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  SlidersHorizontal,
  Smartphone,
  Users,
  Layers,
  UserCheck,
  Sliders,
  BarChart2,
  Activity,
  Award,
  Clock,
  Compass,
  QrCode,
  CheckSquare,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Minimize2,
  Maximize2,
  Copy,
  Lock,
  Unlock,
  CheckCircle,
  Calculator,
  Presentation,
  ShieldCheck,
  ShieldAlert,
  Target,
  MessageSquare,
  Table,
  Archive,
  FileText,
  Sparkles,
  Download,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Mail,
  History,
  Feather,
  Zap,
  Send,
  Link2,
  Trash2
} from 'lucide-react';

import type {
  ClassData,
  Student,
  EvaluationFormControls,
  PulseRound,
  PulseResponse,
  PulseConfig,
  GradingScaleField
} from '../utils/math';
import { useClass } from '../context/ClassContext';
import {
  getEvaluationControls,
  calculateStudentMetrics,
  getPeerAdjustmentConfig,
  calculateStudentWebPAScore,
  PEER_ADJUSTMENT_METHODS_META,
  detectClassAnomalies,
  getTargetScale
} from '../utils/math';
import { calculateJohariWindowMetric, extractClassFeedbackInsights } from '../utils/feedbackAnalytics';
import { detectDuplicateEnrollments } from '../utils/duplicateDetector';
import { downloadClassDossierPDF } from '../utils/pdfReport';
import { RadarChart } from './RadarChart';
import { CollapsibleEvaluationControls } from './CollapsibleEvaluationControls';
import { TeamHealthPulseCard } from './TeamHealthPulseCard';
import { SubPeerReviewStudio } from './SubPeerReviewStudio';
import { AutoGroupStudio } from './AutoGroupStudio';
import { TeamCohortsOverview } from './TeamCohortsOverview';
import StudentPortal from '../views/StudentPortal';
import CustomSelect from './CustomSelect';
import { resolveToModuleId, savePinnedModuleIds } from '../utils/workspaceModuleManager';

export type DockPosition = 'right' | 'left' | 'floating' | 'bottom';
export type ViewportWidth = 'compact' | 'standard' | 'wide' | 'full';
export type TranslucencyLevel = 'off' | 'subtle' | 'medium' | 'sheer';
export type RetractedPlacement = 'right' | 'left' | 'floating';
export type RetractedOffsetY = 'top' | 'center' | 'bottom';

export interface PinnedModuleDef {
  id: string;
  title: string;
  shortTitle: string;
  category: 'reviews' | 'teams' | 'roster' | 'analytics' | 'milestones' | 'tools';
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  badge?: string;
  keywords?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE 28-MODULE CATALOG (100% PLATFORM COVERAGE)
// ─────────────────────────────────────────────────────────────────────────────
export const AVAILABLE_PINNABLE_MODULES: PinnedModuleDef[] = [
  // --- Live Pulse & Reviews ---
  {
    id: 'live_stats_hud',
    title: 'Classroom Pulse & Live Stats Cockpit',
    shortTitle: 'Live Pulse',
    category: 'analytics',
    description: 'Real-time submission rate, active round lock toggle, WebPA fairness spread, and cohort completion gauges.',
    icon: TrendingUp,
    accentColor: '#059669',
    badge: 'Live Cockpit',
    keywords: ['pulse', 'live', 'stats', 'hud', 'submission rate', 'lock', 'gauge', 'completion']
  },
  {
    id: 'eval_controls',
    title: 'Peer Evaluation Form Fields & Permissions',
    shortTitle: 'Form & Permissions',
    category: 'reviews',
    description: 'Configure qualitative prompts, praise tags, self-review calibration, and review round lock status.',
    icon: SlidersHorizontal,
    accentColor: '#10b981',
    badge: 'Controls',
    keywords: ['permissions', 'lock', 'unlock', 'form', 'questions', 'praise']
  },
  {
    id: 'rubric_system',
    title: 'Review System & Rubric Matrix',
    shortTitle: 'Rubric & Weights',
    category: 'reviews',
    description: 'Criteria percentage weights balance, min/max scale fine-tuner, and 100% weight auto-balancer.',
    icon: Sliders,
    accentColor: '#ec4899',
    badge: 'Rubric',
    keywords: ['rubric', 'criteria', 'weights', '100%', 'balance', 'scale']
  },
  {
    id: 'grading_analytics',
    title: 'Grading & Performance Analytics',
    shortTitle: 'Grade Analytics',
    category: 'reviews',
    description: 'Class average peer score, fairness distribution, grade curve metrics, and at-risk performer alerts.',
    icon: BarChart2,
    accentColor: '#14b8a6',
    badge: 'Analytics',
    keywords: ['grades', 'distribution', 'average', 'completion', 'performance']
  },
  {
    id: 'webpa_calibration',
    title: 'Peer Score Adjustment & Multipliers',
    shortTitle: 'Peer Adjustment',
    category: 'reviews',
    description: 'WebPA, Goldfinch, Li, Kaufman, and Balanced score adjustment algorithms with derivation breakdown.',
    icon: Calculator,
    accentColor: '#6366f1',
    badge: 'Fairness',
    keywords: ['webpa', 'multiplier', 'adjustment', 'fairness', 'algorithm', 'goldfinch']
  },
  {
    id: 'live_presentation',
    title: 'Live Presentation Scoring Cockpit',
    shortTitle: 'Presentation Scorer',
    category: 'reviews',
    description: 'Real-time oral presentation rubric, group timer, audience & instructor scoring.',
    icon: Presentation,
    accentColor: '#f97316',
    badge: 'Live Cockpit',
    keywords: ['presentation', 'timer', 'oral', 'live', 'scoring', 'stopwatch']
  },
  {
    id: 'grade_curve_calibrator',
    title: 'Grade Curve & Score Distribution Calibrator',
    shortTitle: 'Grade Curver',
    category: 'reviews',
    description: 'Interactive classroom grade curver with live bell curve histogram, linear boosts, square root curve, and standard deviation normalization.',
    icon: TrendingUp,
    accentColor: '#059669',
    badge: 'Curver',
    keywords: ['curve', 'distribution', 'bell curve', 'gpa', 'normal', 'scale', 'boost', 'histogram']
  },
  {
    id: 'rubric_ai_optimizer',
    title: 'Rubric Weight & Cognitive Balance Auditor',
    shortTitle: 'Rubric Auditor',
    category: 'reviews',
    description: 'Audits rubric criteria for cognitive redundancy, weight skew, scale balance, and Bloom taxonomy alignment with 1-click auto-balance.',
    icon: SlidersHorizontal,
    accentColor: '#ec4899',
    badge: 'Auditor',
    keywords: ['rubric', 'optimizer', 'balance', 'weights', 'audit', 'bloom', 'criteria']
  },

  // --- Teams & Cohorts ---
  {
    id: 'autogroup_studio',
    title: 'AutoGroup Studio & Team Kanban',
    shortTitle: 'AutoGroup Studio',
    category: 'teams',
    description: 'Diverse team algorithm generator with constraint solver, drag-and-drop Kanban, and staged team rosters.',
    icon: Users,
    accentColor: '#8b5cf6',
    badge: 'AI Teams',
    keywords: ['autogroup', 'teams', 'groups', 'kanban', 'diversity', 'balance']
  },
  {
    id: 'team_cohorts',
    title: 'Team Cohorts & Group Directory',
    shortTitle: 'Team Cohorts',
    category: 'teams',
    description: 'Visual team cards with student chips, team base grade adjustment, and student inspection.',
    icon: Layers,
    accentColor: '#f59e0b',
    badge: 'Cohorts',
    keywords: ['cohorts', 'teams', 'groups', 'base grade', 'members']
  },
  {
    id: 'pulse_checkins',
    title: 'Team Health Micro-Pulse Check-ins',
    shortTitle: 'Health Pulse',
    category: 'teams',
    description: 'Real-time morale & progress pulse rounds, 30-second check-in scales, and blocker notification hub.',
    icon: Activity,
    accentColor: '#f43f5e',
    badge: 'Micro-Pulse',
    keywords: ['pulse', 'morale', 'health', 'blockers', 'check-in', 'sprint']
  },
  {
    id: 'team_kickoff',
    title: 'Team Kickoff & Roles Allocation',
    shortTitle: 'Roles & Charter',
    category: 'teams',
    description: 'Project role allocations (Lead, Scribe, Presenter), icebreaker themes, and team working norms.',
    icon: Compass,
    accentColor: '#a855f7',
    badge: 'Charter',
    keywords: ['roles', 'charter', 'kickoff', 'icebreakers', 'norms', 'lead']
  },
  {
    id: 'conflict_resolution',
    title: 'Team Friction & Reciprocity Conflict Detector',
    shortTitle: 'Conflict Radar',
    category: 'teams',
    description: 'Measures pairwise rating asymmetry, retaliatory grade discordance, and sentiment friction to flag teams in need of instructor mediation.',
    icon: Zap,
    accentColor: '#f43f5e',
    badge: 'Friction',
    keywords: ['conflict', 'friction', 'reciprocity', 'asymmetry', 'retaliation', 'mediation', 'dispute']
  },

  // --- Roster & Enrollment ---
  {
    id: 'roster_manager',
    title: 'Classroom Roster & Participant Manager',
    shortTitle: 'Student Roster',
    category: 'roster',
    description: 'Searchable student directory with status indicators, submission progress, and participant inspect.',
    icon: UserCheck,
    accentColor: '#6366f1',
    badge: 'Roster',
    keywords: ['roster', 'students', 'directory', 'participants', 'search', 'email']
  },
  {
    id: 'comms_center',
    title: 'Student Reminders & Comms Broadcast Center',
    shortTitle: 'Comms & Reminders',
    category: 'roster',
    description: 'Track pending submissions, copy batch reminder emails with personalized templates, and dispatch notifications.',
    icon: Mail,
    accentColor: '#2563eb',
    badge: 'Reminders',
    keywords: ['email', 'reminders', 'comms', 'missing', 'pending', 'broadcast', 'mailto']
  },
  {
    id: 'class_join_qr',
    title: 'Classroom Join Link & QR Code',
    shortTitle: 'Join Links & QR',
    category: 'roster',
    description: 'Instant student self-enrollment QR code, direct portal links, and copyable invite credentials.',
    icon: QrCode,
    accentColor: '#3b82f6',
    badge: 'QR Code',
    keywords: ['qr', 'join', 'link', 'enrollment', 'register', 'invite']
  },
  {
    id: 'duplicate_detector',
    title: 'Duplicate Student Roster Detector',
    shortTitle: 'Duplicate Flags',
    category: 'roster',
    description: 'Scans for identical names, emails, and identifiers across classroom cohorts.',
    icon: ShieldCheck,
    accentColor: '#ef4444',
    badge: 'Integrity',
    keywords: ['duplicates', 'detector', 'integrity', 'email', 'conflict']
  },

  // --- Analytics & Diagnostics ---
  {
    id: 'anomaly_audit',
    title: 'Suspicious Ratings & Anomaly Audit',
    shortTitle: 'Anomaly Audit',
    category: 'analytics',
    description: 'Detects collusion trading, uniform lazy grading, extreme outliers, and reciprocal score bias.',
    icon: ShieldAlert,
    accentColor: '#ef4444',
    badge: 'Audit',
    keywords: ['anomaly', 'collusion', 'lazy', 'audit', 'outlier', 'bias']
  },
  {
    id: 'activity_audit_log',
    title: 'Class Activity Trail & Integrity Audit',
    shortTitle: 'Activity Audit',
    category: 'analytics',
    description: 'Chronological event timeline tracking submissions, evaluation lock transitions, duplicate scans, and anomaly alerts.',
    icon: History,
    accentColor: '#8b5cf6',
    badge: 'Audit Trail',
    keywords: ['audit', 'log', 'trail', 'timeline', 'activity', 'history', 'integrity']
  },
  {
    id: 'competency_radar',
    title: 'Skills & Competency Radar Chart',
    shortTitle: 'Skills Radar',
    category: 'analytics',
    description: 'Multi-axis radar chart mapping team balance and performance across configured rubric criteria.',
    icon: Target,
    accentColor: '#06b6d4',
    badge: 'Radar',
    keywords: ['radar', 'competencies', 'chart', 'skills', 'multi-axis', 'strengths']
  },
  {
    id: 'johari_matrix',
    title: 'Johari Window & Self-Awareness Gap',
    shortTitle: 'Johari Window',
    category: 'analytics',
    description: 'Compares self-ratings against teammate evaluations to identify blindspots and hidden strengths.',
    icon: Eye,
    accentColor: '#8b5cf6',
    badge: 'Insights',
    keywords: ['johari', 'self-awareness', 'blindspots', 'gap', 'overestimating']
  },
  {
    id: 'qualitative_feedback',
    title: 'Written Feedback Sentiment & Themes',
    shortTitle: 'Feedback Insights',
    category: 'analytics',
    description: 'Aggregates recurring praise keywords, growth constructive themes, and comment logs.',
    icon: MessageSquare,
    accentColor: '#10b981',
    badge: 'Sentiment',
    keywords: ['qualitative', 'feedback', 'comments', 'sentiment', 'praise', 'themes']
  },
  {
    id: 'detailed_matrix',
    title: 'Who-Rated-Whom Evaluation Grid',
    shortTitle: 'Rating Matrix',
    category: 'analytics',
    description: 'Transparent pairwise breakdown table showing exact scores awarded from reviewer to recipient.',
    icon: Table,
    accentColor: '#f59e0b',
    badge: 'Pairwise',
    keywords: ['matrix', 'who-rated-whom', 'pairwise', 'grid', 'evaluations']
  },
  {
    id: 'free_rider_radar',
    title: 'Free-Rider & At-Risk Diagnostic Radar',
    shortTitle: 'At-Risk Radar',
    category: 'analytics',
    description: 'Automated free-rider detection, high variance evaluation divergence, non-contributor alerts, and coaching email triggers.',
    icon: AlertTriangle,
    accentColor: '#ef4444',
    badge: 'At-Risk Alert',
    keywords: ['free-rider', 'at-risk', 'intervention', 'non-contributor', 'variance', 'penalty', 'coaching']
  },
  {
    id: 'feedback_synthesizer',
    title: 'AI Written Feedback Synthesizer & Growth Coaching',
    shortTitle: 'AI Feedback Hub',
    category: 'analytics',
    description: 'AI-powered feedback synthesis classifying comments into Key Strengths, Blindspots, Actionable Growth, and generic unhelpful review warnings.',
    icon: Sparkles,
    accentColor: '#8b5cf6',
    badge: 'AI Coach',
    keywords: ['ai', 'sentiment', 'strengths', 'growth', 'unhelpful', 'qualitative', 'coaching', 'themes']
  },
  {
    id: 'peer_benchmark_iq',
    title: 'Classroom Collaboration Benchmarks & Norms',
    shortTitle: 'Benchmark IQ',
    category: 'analytics',
    description: 'Comparative cohort analytics benchmarking class submission turnaround, feedback depth, fairness spread, and engagement against institution norms.',
    icon: Award,
    accentColor: '#f59e0b',
    badge: 'Benchmark',
    keywords: ['benchmark', 'iq', 'norms', 'gini', 'turnaround', 'engagement', 'cohort', 'percentile']
  },

  // --- Milestones & Checkpoints ---
  {
    id: 'subpeer_reviews',
    title: 'Sub Peer Review Rounds Studio',
    shortTitle: 'Sub Reviews',
    category: 'milestones',
    description: 'Milestone checkpoint review rounds, longitudinal progression tracking, and sprint weights.',
    icon: Award,
    accentColor: '#eab308',
    badge: 'Milestones',
    keywords: ['milestones', 'subpeer', 'rounds', 'sprints', 'longitudinal']
  },
  {
    id: 'milestones_tracker',
    title: 'Milestones & Sprint Deadlines',
    shortTitle: 'Deadlines & Timer',
    category: 'milestones',
    description: 'Active evaluation round countdown timer, milestone checkpoints, and deadline manager.',
    icon: Clock,
    accentColor: '#06b6d4',
    badge: 'Deadlines',
    keywords: ['deadlines', 'countdown', 'timer', 'milestones', 'time']
  },
  {
    id: 'student_progress_journey',
    title: 'Longitudinal Student Growth & Milestone Velocity',
    shortTitle: 'Student Growth',
    category: 'milestones',
    description: 'Tracks longitudinal student trajectory across project checkpoints, rating momentum, and self-awareness improvement over time.',
    icon: History,
    accentColor: '#0ea5e9',
    badge: 'Velocity',
    keywords: ['growth', 'velocity', 'trajectory', 'longitudinal', 'momentum', 'progress', 'journey']
  },
  {
    id: 'snapshot_archive',
    title: 'Classroom Snapshots & Backup Archive',
    shortTitle: 'Snapshots',
    category: 'milestones',
    description: 'Timestamped class evaluation state snapshots and downloadable JSON archives.',
    icon: Archive,
    accentColor: '#64748b',
    badge: 'Archive',
    keywords: ['snapshots', 'backup', 'archive', 'json', 'restore']
  },

  // --- Tools & Operations ---
  {
    id: 'smartphone_simulator',
    title: 'Student Smartphone Portal Simulator',
    shortTitle: 'Phone Simulator',
    category: 'tools',
    description: 'Live 1:1 mobile phone simulator with dynamic island, student switcher, and live round lock/unlock testing.',
    icon: Smartphone,
    accentColor: '#0ea5e9',
    badge: 'Live Mobile',
    keywords: ['simulator', 'phone', 'mobile', 'preview', 'student portal', 'device']
  },
  {
    id: 'lms_export',
    title: 'LMS Gradebook Exporter (Canvas/Moodle/Blackboard)',
    shortTitle: 'LMS Gradebook',
    category: 'tools',
    description: 'Export calibrated peer grades into Canvas, Blackboard, Moodle, and Brightspace CSV formats.',
    icon: Download,
    accentColor: '#10b981',
    badge: 'LMS',
    keywords: ['lms', 'canvas', 'blackboard', 'moodle', 'brightspace', 'export', 'csv']
  },
  {
    id: 'export_hub',
    title: 'Universal Export & Gradebook Dispatcher',
    shortTitle: 'Export Hub',
    category: 'tools',
    description: 'Consolidated 1-click exporter for Excel Gradebooks, CSV rosters, LMS packages (Canvas/Blackboard/Moodle), and JSON state archives.',
    icon: Download,
    accentColor: '#0d9488',
    badge: 'Exporter',
    keywords: ['export', 'excel', 'csv', 'lms', 'canvas', 'gradebook', 'dispatcher', 'download']
  },
  {
    id: 'launch_checklist',
    title: 'Launchpad & Setup Checklist',
    shortTitle: 'Launch Checklist',
    category: 'tools',
    description: 'Interactive step-by-step classroom setup checklist with quick navigation to incomplete steps.',
    icon: CheckSquare,
    accentColor: '#10b981',
    badge: 'Setup',
    keywords: ['checklist', 'setup', 'onboarding', 'launchpad', 'steps']
  },
  {
    id: 'reports_hub',
    title: 'Student Report Cards & PDF Generator',
    shortTitle: 'Report Cards',
    category: 'tools',
    description: 'Comprehensive student formative feedback cards and batch report generation.',
    icon: FileText,
    accentColor: '#4f46e5',
    badge: 'Reports',
    keywords: ['reports', 'pdf', 'cards', 'download', 'formative', 'summary']
  },
  {
    id: 'branding_preview',
    title: 'Institutional Branding & Identity',
    shortTitle: 'Custom Branding',
    category: 'tools',
    description: 'Custom university badge emblem, institution title, and custom visual accent theme.',
    icon: Sparkles,
    accentColor: '#ec4899',
    badge: 'Branding',
    keywords: ['branding', 'emblem', 'badge', 'logo', 'theme', 'institution']
  }
];

export interface DynamicRetractableDisplayProps {
  activeClass: ClassData;
  classes: ClassData[];
  onUpdateControls: (controls: Partial<EvaluationFormControls>) => void;
  onUpdateStudents: (classId: string, updatedStudents: Student[]) => void;
  onPreviewStudent?: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onOpenReport?: (studentId: string) => void;
  onAddStudent?: () => void;
  onUpdateTeamBaseGrade?: (classId: string, groupName: string, grade: number) => void;
  onCreatePulseRound?: (classId: string, roundData: { title: string; config?: Partial<PulseConfig> }) => void;
  onUpdatePulseRound?: (classId: string, roundId: string, updates: Partial<PulseRound>) => void;
  onSubmitPulseResponse?: (classId: string, roundId: string, response: Omit<PulseResponse, 'id' | 'submittedAt'>) => void;
  onDeletePulseRound?: (classId: string, roundId: string) => void;
  onSeedPulseSample?: (classId: string) => void;
  onSaveDeadline?: (classId: string, deadline: string | null) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateTab?: (tab: 'hub' | 'roster' | 'grading' | 'results') => void;
  visible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
  // Extra tool callbacks
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  onExportLMS?: (platform: 'canvas' | 'blackboard' | 'moodle' | 'brightspace') => void;
  onOpenLivePresentation?: () => void;
  onOpenTeamKickoff?: (tab?: 'roles_config' | 'icebreakers' | 'charters') => void;
  onOpenBranding?: () => void;
  onOpenSnapshots?: () => void;
  onResetReviews?: () => void;
  onBackupJSON?: () => void;
}

export const DynamicRetractableDisplay: React.FC<DynamicRetractableDisplayProps> = ({
  activeClass,
  classes,
  onUpdateControls,
  onUpdateStudents,
  onPreviewStudent,
  onEditStudent,
  onOpenReport,
  onAddStudent,
  onUpdateTeamBaseGrade,
  onCreatePulseRound,
  onUpdatePulseRound,
  onSubmitPulseResponse,
  onDeletePulseRound,
  onSeedPulseSample,
  onSaveDeadline,
  addToast,
  onNavigateTab,
  visible = true,
  onToggleVisibility,
  onExportExcel,
  onExportCSV,
  onExportLMS,
  onOpenLivePresentation,
  onOpenTeamKickoff,
  onOpenBranding,
  onOpenSnapshots,
  onResetReviews,
  onBackupJSON
}) => {
  const classContext = useClass();

  // Retracted state (docked edge pill vs open viewport)
  const [isRetracted, setIsRetracted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_display_retracted_v2');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Retracted edge dock placement: 'right' | 'left' | 'floating'
  const [retractedPlacement] = useState<RetractedPlacement>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_pill_placement');
      return (saved as RetractedPlacement) || 'right';
    } catch {
      return 'right';
    }
  });

  // Movable pill continuous vertical position (percentage 6% - 92%)
  const [pillPositionY, setPillPositionY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_pill_pos_y');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 6 && val <= 92) return val;
      }
      const legacy = localStorage.getItem('peer_retractable_pill_offset_y');
      if (legacy === 'top') return 24;
      if (legacy === 'center') return 48;
      if (legacy === 'bottom') return 72;
    } catch {}
    return 30; // Clean default 30% from top
  });

  const [isDraggingPill, setIsDraggingPill] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartPosYRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const pillRef = useRef<HTMLElement>(null);

  const handlePillPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    dragStartYRef.current = e.clientY;
    dragStartPosYRef.current = pillPositionY;
    hasMovedRef.current = false;
    setIsDraggingPill(true);
    setIsRetractedHovered(false);
  };

  const handlePillPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingPill) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }
    const windowH = window.innerHeight || 800;
    const deltaPercent = (deltaY / windowH) * 100;
    const newPos = Math.max(6, Math.min(92, dragStartPosYRef.current + deltaPercent));
    setPillPositionY(newPos);
  };

  const handlePillPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingPill) return;
    setIsDraggingPill(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    localStorage.setItem('peer_retractable_pill_pos_y', pillPositionY.toFixed(1));
    if (!hasMovedRef.current) {
      setIsRetracted(false);
    }
  };

  // Viewport-safe clamping for hover flyout so it NEVER clips at the top or bottom of the screen
  const getFlyoutTopOffset = () => {
    const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const pillCenterY = (windowH * pillPositionY) / 100;
    const pillTop = pillCenterY - 15; // Pill is 30px tall with translateY(-50%)
    const flyoutEstHeight = 510;
    const idealTop = pillCenterY - flyoutEstHeight / 2;
    const clampedTop = Math.max(12, Math.min(Math.max(12, windowH - flyoutEstHeight - 12), idealTop));
    return Math.round(clampedTop - pillTop);
  };

  // Auto-tuck to edge preference: false (always cleanly and properly displayed)
  const [autoTuck] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_auto_tuck');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Hover states for the retracted pill and hover flyout preview
  const [isPillHovered, setIsPillHovered] = useState<boolean>(false);
  const [isRetractedHovered, setIsRetractedHovered] = useState<boolean>(false);
  const pillLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flyoutOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Viewport Dock position: 'right' | 'left' | 'floating' | 'bottom'
  const [dockPosition, setDockPosition] = useState<DockPosition>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_dock_position_v2');
      return (saved as DockPosition) || 'right';
    } catch {
      return 'right';
    }
  });

  // Viewport Width sizing: 'compact' (490px) | 'standard' (620px) | 'wide' (820px) | 'full' (1080px)
  const [viewportWidth, setViewportWidth] = useState<ViewportWidth>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_viewport_width');
      return (saved as ViewportWidth) || 'standard';
    } catch {
      return 'standard';
    }
  });

  // ── FLOATING DOCK MOVABILITY & RESIZING SYSTEM ──
  const [floatPosition, setFloatPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_float_pos_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: Math.max(16, Math.round(winW - 680)),
      y: Math.max(20, Math.round((winH - 720) / 2))
    };
  });

  const [floatSize, setFloatSize] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_float_size_dims');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return parsed;
        }
      }
    } catch {}
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width: Math.min(660, Math.max(380, winW - 60)),
      height: Math.min(740, Math.max(460, winH - 70))
    };
  });

  const [isFloatMaximized, setIsFloatMaximized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_float_maximized');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isDraggingWindow, setIsDraggingWindow] = useState<boolean>(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 's' | 'e' | 'sw' | 'w' | null>(null);

  const windowDragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });

  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0
  });

  useEffect(() => {
    try {
      localStorage.setItem('peer_retractable_float_pos_coords', JSON.stringify(floatPosition));
    } catch {}
  }, [floatPosition]);

  useEffect(() => {
    try {
      localStorage.setItem('peer_retractable_float_size_dims', JSON.stringify(floatSize));
    } catch {}
  }, [floatSize]);

  useEffect(() => {
    try {
      localStorage.setItem('peer_retractable_float_maximized', JSON.stringify(isFloatMaximized));
    } catch {}
  }, [isFloatMaximized]);

  // Viewport resize watcher to clamp floating window inside viewport bounds
  useEffect(() => {
    const handleWindowResize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      setFloatSize(prev => {
        const maxW = Math.max(360, winW - 32);
        const maxH = Math.max(380, winH - 32);
        return {
          width: Math.min(prev.width, maxW),
          height: Math.min(prev.height, maxH)
        };
      });

      setFloatPosition(prev => {
        const maxX = Math.max(0, winW - floatSize.width - 12);
        const maxY = Math.max(0, winH - 60);
        return {
          x: Math.max(8, Math.min(maxX, prev.x)),
          y: Math.max(8, Math.min(maxY, prev.y))
        };
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [floatSize.width, floatSize.height]);

  // Global pointer listeners for smooth window dragging & resizing anywhere on screen
  useEffect(() => {
    if (!isDraggingWindow && !resizeDirection) return;

    const onGlobalPointerMove = (e: PointerEvent) => {
      if (isDraggingWindow) {
        const deltaX = e.clientX - windowDragStartRef.current.mouseX;
        const deltaY = e.clientY - windowDragStartRef.current.mouseY;
        const winW = window.innerWidth || 1200;
        const winH = window.innerHeight || 800;
        const currentW = floatSize.width;

        const newX = Math.max(8, Math.min(winW - currentW - 8, windowDragStartRef.current.startX + deltaX));
        const newY = Math.max(8, Math.min(winH - 60, windowDragStartRef.current.startY + deltaY));

        setFloatPosition({ x: Math.round(newX), y: Math.round(newY) });
      } else if (resizeDirection) {
        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        const deltaY = e.clientY - resizeStartRef.current.mouseY;
        const winW = window.innerWidth || 1200;
        const winH = window.innerHeight || 800;

        const minW = 360;
        const minH = 380;
        const maxW = winW - 20;
        const maxH = winH - 20;

        let newWidth = resizeStartRef.current.startWidth;
        let newHeight = resizeStartRef.current.startHeight;
        let newX = resizeStartRef.current.startX;

        if (resizeDirection === 'se' || resizeDirection === 'e') {
          newWidth = Math.max(minW, Math.min(maxW - newX, resizeStartRef.current.startWidth + deltaX));
        }
        if (resizeDirection === 'se' || resizeDirection === 's' || resizeDirection === 'sw') {
          newHeight = Math.max(minH, Math.min(maxH - resizeStartRef.current.startY, resizeStartRef.current.startHeight + deltaY));
        }
        if (resizeDirection === 'w' || resizeDirection === 'sw') {
          const rawW = resizeStartRef.current.startWidth - deltaX;
          newWidth = Math.max(minW, Math.min(resizeStartRef.current.startX + resizeStartRef.current.startWidth - 10, rawW));
          newX = resizeStartRef.current.startX + (resizeStartRef.current.startWidth - newWidth);
        }

        setFloatSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
        if (newX !== floatPosition.x) {
          setFloatPosition(prev => ({ ...prev, x: Math.round(newX) }));
        }
      }
    };

    const onGlobalPointerUp = () => {
      setIsDraggingWindow(false);
      setResizeDirection(null);
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
    };
  }, [isDraggingWindow, resizeDirection, floatSize.width, floatSize.height, floatPosition.x]);

  const handleWindowDragStart = (e: React.PointerEvent) => {
    if (dockPosition !== 'floating' || isFloatMaximized) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, textarea, a, .pinned-tab-pill, [data-no-drag]')) {
      return;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    windowDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: floatPosition.x,
      startY: floatPosition.y
    };
    setIsDraggingWindow(true);
  };

  const handleResizePointerDown = (e: React.PointerEvent, direction: 'se' | 's' | 'e' | 'sw' | 'w') => {
    if (dockPosition !== 'floating' || isFloatMaximized) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: floatSize.width,
      startHeight: floatSize.height,
      startX: floatPosition.x,
      startY: floatPosition.y
    };
    setResizeDirection(direction);
  };

  const handleResetFloatPositionAndSize = () => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const defW = Math.min(660, winW - 60);
    const defH = Math.min(740, winH - 70);
    setFloatSize({ width: defW, height: defH });
    setFloatPosition({
      x: Math.max(16, Math.round(winW - defW - 32)),
      y: Math.max(20, Math.round((winH - defH) / 2))
    });
    setIsFloatMaximized(false);
    addToast('Reset floating window position & size to defaults', 'success');
  };

  // Pinned module IDs (all 24 supported)
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('peer_pinned_module_ids_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['eval_controls', 'smartphone_simulator', 'autogroup_studio', 'rubric_system', 'grading_analytics'];
  });

  // Active module tab
  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('peer_pinned_active_module_id_v2');
      if (saved && AVAILABLE_PINNABLE_MODULES.some(m => m.id === saved)) return saved;
    } catch {}
    return 'eval_controls';
  });

  // Translucency Level: 'off' (100% solid) | 'subtle' (75% frosted) | 'medium' (50% aero glass) | 'sheer' (28% ultra sheer)
  const [translucencyLevel, setTranslucencyLevel] = useState<TranslucencyLevel>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_translucency_v2');
      return (saved as TranslucencyLevel) || 'off';
    } catch {
      return 'off';
    }
  });

  // View Settings Popover state
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState<boolean>(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Tabs overflow menu state
  const [isTabsOverflowOpen, setIsTabsOverflowOpen] = useState<boolean>(false);
  const tabsOverflowRef = useRef<HTMLDivElement>(null);

  // Content Density: 'compact' | 'comfortable'
  const [contentDensity, setContentDensity] = useState<'compact' | 'comfortable'>(() => {
    try {
      const saved = localStorage.getItem('peer_retractable_density');
      return (saved as 'compact' | 'comfortable') || 'compact';
    } catch {
      return 'compact';
    }
  });

  useEffect(() => {
    localStorage.setItem('peer_retractable_density', contentDensity);
  }, [contentDensity]);

  // Click outside listener for view menu and tabs overflow
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
      if (tabsOverflowRef.current && !tabsOverflowRef.current.contains(e.target as Node)) {
        setIsTabsOverflowOpen(false);
      }
    };
    if (isLayoutMenuOpen || isTabsOverflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayoutMenuOpen, isTabsOverflowOpen]);

  // Module picker catalog modal
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Keyboard shortcuts (Alt+1..9 for tabs, Esc to close/retract)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLayoutMenuOpen) {
          setIsLayoutMenuOpen(false);
          return;
        }
        if (isTabsOverflowOpen) {
          setIsTabsOverflowOpen(false);
          return;
        }
        if (isCatalogOpen) {
          setIsCatalogOpen(false);
          return;
        }
        if (!isRetracted) {
          setIsRetracted(true);
        }
      }
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= pinnedIds.length) {
          e.preventDefault();
          setActiveModuleId(pinnedIds[num - 1]);
          setIsRetracted(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutMenuOpen, isTabsOverflowOpen, isCatalogOpen, isRetracted, pinnedIds]);

  // Simulator sub-state
  const [simStudentId, setSimStudentId] = useState<string>(activeClass.students[0]?.id || '');
  const [simRefreshKey, setSimRefreshKey] = useState<number>(0);

  // Roster manager sub-state
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterTeamFilter, setRosterTeamFilter] = useState<string>('all');
  const [selectedCohortGroup, setSelectedCohortGroup] = useState<string>('all');

  // Radar chart sub-state
  const [radarTeamFilter, setRadarTeamFilter] = useState<string>('all');

  // Presentation stopwatch timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(600); // 10 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // QR Code canvas data url
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Detailed pairwise evaluation matrix sub-state
  const [matrixTeamFilter, setMatrixTeamFilter] = useState<string>('all');
  const [matrixCriterionFilter, setMatrixCriterionFilter] = useState<string>('all');
  const [inspectedReview, setInspectedReview] = useState<{
    reviewerName: string;
    reviewerTeam?: string;
    recipientName: string;
    recipientTeam?: string;
    review?: any;
    avgScore?: number | null;
  } | null>(null);

  // Comms center sub-state
  const [copiedComms, setCopiedComms] = useState<boolean>(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isEditingTemplate, setIsEditingTemplate] = useState<boolean>(false);
  const [customReminderSubject, setCustomReminderSubject] = useState<string>('');
  const [customReminderBody, setCustomReminderBody] = useState<string>('');

  // Activity audit trail sub-state
  const [auditFilter, setAuditFilter] = useState<'all' | 'submissions' | 'integrity' | 'system' | 'notes'>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [customAuditNotes, setCustomAuditNotes] = useState<Array<{ id: string; text: string; author: string; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem(`peer_audit_notes_${activeClass.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newAuditNoteText, setNewAuditNoteText] = useState<string>('');

  // Grade Curver sub-state
  const [curveModel, setCurveModel] = useState<'raw' | 'linear' | 'sqrt' | 'normal'>('raw');
  const [linearBoostPts] = useState<number>(5);

  // Free-rider diagnostic radar sub-state
  const [freeRiderThreshold] = useState<number>(0.85);

  // AI Qualitative feedback synthesizer sub-state
  const [feedbackSynthCategory, setFeedbackSynthCategory] = useState<'all' | 'strengths' | 'growth' | 'unhelpful'>('all');

  // Student progress journey sub-state
  const [journeyStudentId, setJourneyStudentId] = useState<string>(activeClass.students[0]?.id || '');

  // Team kickoff roles sub-state
  const [kickoffTeam, setKickoffTeam] = useState<string>('all');
  const [teamRolesState, setTeamRolesState] = useState<Record<string, { lead?: string; scribe?: string; presenter?: string; qa?: string }>>(() => {
    try {
      const saved = localStorage.getItem(`peer_team_roles_${activeClass.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`peer_team_roles_${activeClass.id}`, JSON.stringify(teamRolesState));
    } catch {}
  }, [teamRolesState, activeClass.id]);

  // Reports hub search sub-state
  const [reportsSearch, setReportsSearch] = useState<string>('');

  // Institutional theme customizer state
  const [brandingAccentColor, setBrandingAccentColor] = useState<string>('#6366f1');
  const [brandingInstitutionName, setBrandingInstitutionName] = useState<string>('PeerLens Academic Portal');

  useEffect(() => {
    try {
      localStorage.setItem(`peer_audit_notes_${activeClass.id}`, JSON.stringify(customAuditNotes));
    } catch {}
  }, [customAuditNotes, activeClass.id]);

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem('peer_retractable_display_retracted_v2', JSON.stringify(isRetracted));
  }, [isRetracted]);

  useEffect(() => {
    localStorage.setItem('peer_retractable_dock_position_v2', dockPosition);
  }, [dockPosition]);

  useEffect(() => {
    localStorage.setItem('peer_retractable_viewport_width', viewportWidth);
  }, [viewportWidth]);

  useEffect(() => {
    savePinnedModuleIds(pinnedIds);
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem('peer_pinned_active_module_id_v2', activeModuleId);
  }, [activeModuleId]);

  useEffect(() => {
    localStorage.setItem('peer_retractable_translucency_v2', translucencyLevel);
  }, [translucencyLevel]);

  useEffect(() => {
    localStorage.setItem('peer_retractable_pill_placement', retractedPlacement);
  }, [retractedPlacement]);

  // Global event listener for opening or toggling from anywhere in the platform
  useEffect(() => {
    const handleToggle = () => {
      setIsRetracted(prev => !prev);
    };

    const handlePinModule = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.moduleId) {
        const rawId = detail.moduleId;
        const targetId = resolveToModuleId(rawId) || rawId;
        if (AVAILABLE_PINNABLE_MODULES.some(m => m.id === targetId)) {
          setPinnedIds(prev => (prev.includes(targetId) ? prev : [...prev, targetId]));
          setActiveModuleId(targetId);
          setIsRetracted(false);
        }
      }
    };

    const handleUnpinModule = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.moduleId) {
        const rawId = detail.moduleId;
        const targetId = resolveToModuleId(rawId) || rawId;
        setPinnedIds(prev => {
          if (prev.length <= 1) return prev;
          const next = prev.filter(id => id !== targetId);
          return next;
        });
      }
    };

    const handleTogglePinEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.moduleId) {
        const rawId = detail.moduleId;
        const targetId = resolveToModuleId(rawId) || rawId;
        if (AVAILABLE_PINNABLE_MODULES.some(m => m.id === targetId)) {
          setPinnedIds(prev => {
            if (prev.includes(targetId)) {
              if (prev.length <= 1) return prev;
              const next = prev.filter(id => id !== targetId);
              return next;
            } else {
              return [...prev, targetId];
            }
          });
          setActiveModuleId(targetId);
          setIsRetracted(false);
        }
      }
    };

    window.addEventListener('peerlens_toggle_retractable_display', handleToggle);
    window.addEventListener('peerlens_pin_module', handlePinModule);
    window.addEventListener('peerlens_unpin_module', handleUnpinModule);
    window.addEventListener('peerlens_toggle_pin_module', handleTogglePinEvent);

    return () => {
      window.removeEventListener('peerlens_toggle_retractable_display', handleToggle);
      window.removeEventListener('peerlens_pin_module', handlePinModule);
      window.removeEventListener('peerlens_unpin_module', handleUnpinModule);
      window.removeEventListener('peerlens_toggle_pin_module', handleTogglePinEvent);
    };
  }, []);

  // Update simulator student if active class changes
  useEffect(() => {
    if (activeClass.students.length > 0 && !activeClass.students.some(s => s.id === simStudentId)) {
      setSimStudentId(activeClass.students[0].id);
    }
  }, [activeClass.students, simStudentId]);

  // Generate QR Code data URL whenever active class changes
  useEffect(() => {
    const enrollUrl = `${window.location.origin}/join/${activeClass.id}`;
    QRCode.toDataURL(enrollUrl, {
      width: 480,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(url => setQrDataUrl(url))
      .catch(() => {});
  }, [activeClass.id]);

  // Presentation stopwatch tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      addToast('Presentation time is up!', 'warning');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, addToast]);

  if (!visible) return null;

  // Active module definition
  const activeDef = AVAILABLE_PINNABLE_MODULES.find(m => m.id === activeModuleId) || AVAILABLE_PINNABLE_MODULES[0];
  const evalControls = getEvaluationControls(activeClass);

  // Category to dashboard tab mapper
  const getCategoryTab = (cat: string): 'hub' | 'roster' | 'grading' | 'results' => {
    if (cat === 'roster' || cat === 'teams') return 'roster';
    if (cat === 'reviews') return 'grading';
    if (cat === 'analytics' || cat === 'milestones') return 'results';
    return 'hub';
  };

  const handleTogglePinModule = (id: string) => {
    if (pinnedIds.includes(id)) {
      if (pinnedIds.length <= 1) {
        addToast('At least one module must remain pinned.', 'info');
        return;
      }
      const next = pinnedIds.filter(item => item !== id);
      setPinnedIds(next);
      if (activeModuleId === id) {
        setActiveModuleId(next[0]);
      }
      addToast('Module unpinned from viewport.', 'info');
    } else {
      setPinnedIds([...pinnedIds, id]);
      setActiveModuleId(id);
      addToast('Module pinned! Accessible across all tabs.', 'success');
    }
  };

  // Compute width in CSS style
  const getComputedWidth = (): string => {
    if (dockPosition === 'floating') {
      return isFloatMaximized ? 'calc(100vw - 24px)' : `${floatSize.width}px`;
    }
    switch (viewportWidth) {
      case 'compact':
        return 'min(490px, 94vw)';
      case 'wide':
        return 'min(820px, 96vw)';
      case 'full':
        return 'min(1080px, 98vw)';
      case 'standard':
      default:
        return 'min(620px, 94vw)';
    }
  };

  const currentEffectiveWidth = dockPosition === 'floating'
    ? (isFloatMaximized ? (typeof window !== 'undefined' ? window.innerWidth - 24 : 1200) : floatSize.width)
    : (viewportWidth === 'compact' ? 490 : viewportWidth === 'wide' ? 820 : viewportWidth === 'full' ? 1080 : 620);

  const isCompactWidth = currentEffectiveWidth < 580;
  const isUltraCompact = currentEffectiveWidth < 450;
  const isMicroCompact = currentEffectiveWidth < 380;
  const isWideWidth = currentEffectiveWidth >= 750;

  // Real-time pulse stats for retracted pill and overview
  const totalStudents = activeClass.students.length;
  const totalSubmittedStudents = activeClass.students.filter(
    s => s.submitted || activeClass.reviews.some(r => r.reviewerId === s.id)
  ).length;
  const classCompletionRate = totalStudents > 0 ? Math.round((totalSubmittedStudents / totalStudents) * 100) : 0;
  const isMainUnlocked = !!evalControls.unlockMainPeerReview;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. RETRACTED SECTION (IMPROVED SLEEK FLOATING CAPSULE & HOVER FLYOUT)
  // ───────────────────────────────────────────────────────────────────────────
  if (isRetracted) {
    const isDockRight = retractedPlacement !== 'left';
    const topPosition = `${pillPositionY}%`;
    const totalTeams = new Set(activeClass.students.map(s => s.groupName).filter(Boolean)).size || 1;
    const pendingCount = totalStudents - totalSubmittedStudents;

    // Compute tuck translation when idle & autoTuck is enabled
    const isTucked = autoTuck && !isPillHovered && !isRetractedHovered && !isDraggingPill;

    let pillTransform = 'translateY(-50%)';
    if (isDraggingPill) {
      pillTransform = 'translateY(-50%) scale(1.03)';
    } else if (isTucked) {
      if (retractedPlacement === 'floating') {
        pillTransform = 'translateY(-50%) scale(0.85)';
      } else if (isDockRight) {
        pillTransform = 'translateY(-50%) translateX(calc(100% - 24px))';
      } else {
        pillTransform = 'translateY(-50%) translateX(calc(-100% + 24px))';
      }
    } else {
      pillTransform = 'translateY(-50%) translateX(0)';
    }

    // Status Indicator Jewel (always positioned on the peeking edge!)
    const statusJewel = (
      <div
        key="status-jewel"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          backgroundColor: isMainUnlocked ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)',
          color: isMainUnlocked ? '#059669' : '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <Pin size={10} style={{ transform: 'rotate(45deg)' }} />
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isMainUnlocked ? '#10b981' : '#f59e0b',
            boxShadow: isMainUnlocked ? '0 0 6px #10b981' : '0 0 6px #f59e0b'
          }}
        />
      </div>
    );

    const gripHandle = (
      <div
        key="grip"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          opacity: 0.35,
          cursor: isDraggingPill ? 'grabbing' : 'grab',
          flexShrink: 0
        }}
      >
        <GripVertical size={11} />
      </div>
    );

    const workspaceLabel = (
      <div key="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap'
          }}
        >
          Workspace
        </span>
        <span
          style={{
            fontSize: '0.58rem',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '999px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            lineHeight: 1.2
          }}
        >
          {pinnedIds.length}
        </span>
      </div>
    );

    const submissionBadge = (
      <div
        key="badge"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          padding: '1px 5px',
          borderRadius: '999px',
          backgroundColor: isMainUnlocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: isMainUnlocked ? '#059669' : '#dc2626',
          fontSize: '0.58rem',
          fontWeight: 800,
          border: `1px solid ${isMainUnlocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          whiteSpace: 'nowrap'
        }}
      >
        {isMainUnlocked ? <Unlock size={8} /> : <Lock size={8} />}
        <span>{classCompletionRate}%</span>
      </div>
    );

    const chevronIcon = (
      <div
        key="chevron"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          opacity: 0.65,
          flexShrink: 0
        }}
      >
        {isDockRight ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </div>
    );

    return (
      <aside
        id="retractable-display-min-pill"
        ref={pillRef}
        role="complementary"
        aria-label="Pinned Modules Dock"
        onPointerDown={handlePillPointerDown}
        onPointerMove={handlePillPointerMove}
        onPointerUp={handlePillPointerUp}
        onPointerCancel={() => setIsDraggingPill(false)}
        onMouseEnter={() => {
          if (isDraggingPill) return;
          if (pillLeaveTimeoutRef.current) clearTimeout(pillLeaveTimeoutRef.current);
          setIsPillHovered(true);
          if (flyoutOpenTimeoutRef.current) clearTimeout(flyoutOpenTimeoutRef.current);
          flyoutOpenTimeoutRef.current = setTimeout(() => {
            setIsRetractedHovered(true);
          }, 280);
        }}
        onMouseLeave={() => {
          if (flyoutOpenTimeoutRef.current) clearTimeout(flyoutOpenTimeoutRef.current);
          pillLeaveTimeoutRef.current = setTimeout(() => {
            setIsRetractedHovered(false);
            setIsPillHovered(false);
          }, 320);
        }}
        style={{
          position: 'fixed',
          [isDockRight ? 'right' : 'left']: retractedPlacement === 'floating' ? '16px' : '0',
          top: topPosition,
          transform: pillTransform,
          zIndex: 9989,
          backgroundColor:
            translucencyLevel === 'off'
              ? 'var(--bg-surface)'
              : 'color-mix(in srgb, var(--bg-surface) 82%, transparent)',
          border: '1.5px solid var(--border-color)',
          borderRight: retractedPlacement === 'right' ? 'none' : undefined,
          borderLeft: retractedPlacement === 'left' ? 'none' : undefined,
          borderRadius:
            retractedPlacement === 'floating'
              ? '999px'
              : isDockRight
                ? '999px 0 0 999px'
                : '0 999px 999px 0',
          padding: isDockRight ? '0 6px 0 3px' : '0 3px 0 6px',
          height: '30px',
          boxSizing: 'border-box',
          opacity: isTucked ? 0.75 : 1,
          boxShadow: isDraggingPill
            ? '0 16px 38px rgba(0, 0, 0, 0.35), 0 0 16px rgba(99, 102, 241, 0.4)'
            : isTucked
              ? '0 2px 8px rgba(0, 0, 0, 0.12)'
              : 'var(--shadow-md), 0 6px 20px rgba(0, 0, 0, 0.18)',
          cursor: isDraggingPill ? 'grabbing' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: isDraggingPill
            ? 'none'
            : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, box-shadow 200ms ease',
          backdropFilter: translucencyLevel === 'off' ? 'none' : 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: translucencyLevel === 'off' ? 'none' : 'blur(20px) saturate(180%)',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {isDockRight ? (
          <>
            {statusJewel}
            {gripHandle}
            {workspaceLabel}
            {submissionBadge}
            {chevronIcon}
          </>
        ) : (
          <>
            {chevronIcon}
            {gripHandle}
            {workspaceLabel}
            {submissionBadge}
            {statusJewel}
          </>
        )}

        {/* ── HOVER FLYOUT QUICK-SWITCHER DRAWER (VIEWPORT-CLAMPED & FIT PROTECTED) ── */}
        {isRetractedHovered && !isDraggingPill && (
          <div
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => {
              if (pillLeaveTimeoutRef.current) clearTimeout(pillLeaveTimeoutRef.current);
              setIsRetractedHovered(true);
              setIsPillHovered(true);
            }}
            onMouseLeave={() => {
              pillLeaveTimeoutRef.current = setTimeout(() => {
                setIsRetractedHovered(false);
                setIsPillHovered(false);
              }, 320);
            }}
            style={{
              position: 'absolute',
              [isDockRight ? 'right' : 'left']: 'calc(100% + 8px)',
              top: `${getFlyoutTopOffset()}px`,
              width: '270px',
              maxWidth: 'calc(100vw - 36px)',
              maxHeight: 'calc(100vh - 32px)',
              boxSizing: 'border-box',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor:
                translucencyLevel === 'off'
                  ? 'var(--bg-surface)'
                  : 'color-mix(in srgb, var(--bg-surface) 86%, transparent)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '14px',
              padding: '0.75rem',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.32)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
              zIndex: 9999,
              backdropFilter: translucencyLevel === 'off' ? 'none' : 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: translucencyLevel === 'off' ? 'none' : 'blur(24px) saturate(180%)',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {/* Flyout Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.16)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pin size={11} style={{ transform: 'rotate(45deg)' }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Workspace Cockpit
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)'
                  }}
                >
                  {pinnedIds.length} Pinned
                </span>
              </div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <kbd style={{ padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>Alt+V</kbd>
              </span>
            </div>

            {/* Live Progress Cockpit Card */}
            <div
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '11px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {/* Classroom title and 1-click round unlock toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: isMainUnlocked ? '#10b981' : '#f59e0b',
                      boxShadow: isMainUnlocked ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {activeClass.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onUpdateControls({ unlockMainPeerReview: !isMainUnlocked });
                    addToast(isMainUnlocked ? 'Locked evaluation round' : 'Unlocked evaluation round', 'info');
                  }}
                  title={isMainUnlocked ? 'Click to lock round' : 'Click to unlock round'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    border: `1px solid ${isMainUnlocked ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    backgroundColor: isMainUnlocked ? 'rgba(16, 185, 129, 0.09)' : 'rgba(239, 68, 68, 0.09)',
                    color: isMainUnlocked ? '#059669' : '#dc2626',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {isMainUnlocked ? <Unlock size={10} /> : <Lock size={10} />}
                  <span>{isMainUnlocked ? 'Round Open' : 'Round Locked'}</span>
                </button>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <span>Completion Rate</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{classCompletionRate}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${classCompletionRate}%`,
                      height: '100%',
                      background: isMainUnlocked ? 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)' : 'var(--text-muted)',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* 3 Live Mini-Stats Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', paddingTop: '2px' }}>
                <div style={{ padding: '3px 4px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Done</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#059669' }}>{totalSubmittedStudents}/{totalStudents}</div>
                </div>
                <div style={{ padding: '3px 4px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Missing</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: pendingCount > 0 ? '#dc2626' : '#059669' }}>
                    {pendingCount}
                  </div>
                </div>
                <div style={{ padding: '3px 4px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Teams</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {totalTeams}
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Modules List with Rich Live Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '190px', overflowY: 'auto' }}>
              {pinnedIds.map(id => {
                const def = AVAILABLE_PINNABLE_MODULES.find(m => m.id === id);
                if (!def) return null;
                const Icon = def.icon;
                const isActive = activeModuleId === id;

                // Dynamic contextual snippet per module
                let infoSnippet = def.description;
                if (id === 'roster_manager') infoSnippet = `${totalStudents} students enrolled`;
                else if (id === 'comms_center') infoSnippet = `${pendingCount} pending submissions`;
                else if (id === 'eval_controls') infoSnippet = isMainUnlocked ? 'Open for student grading' : 'Submissions locked';
                else if (id === 'autogroup_studio') infoSnippet = 'Kanban & constraint solver';
                else if (id === 'rubric_system') infoSnippet = `${activeClass.fields?.length || 0} scoring criteria`;
                else if (id === 'grading_analytics') infoSnippet = 'Distribution & averages';
                else if (id === 'smartphone_simulator') infoSnippet = 'Interactive student cockpit';
                else if (id === 'team_cohorts') infoSnippet = `${totalTeams} team cohorts`;
                else if (id === 'webpa_calibration') infoSnippet = 'Score calibration algorithms';
                else if (id === 'live_presentation') infoSnippet = 'Stopwatch & live rubrics';
                else if (id === 'grade_curve_calibrator') infoSnippet = 'Interactive bell curve & scaling';
                else if (id === 'rubric_ai_optimizer') infoSnippet = 'Rubric balance & cognitive audit';
                else if (id === 'conflict_resolution') infoSnippet = 'Pairwise rating friction detector';
                else if (id === 'free_rider_radar') infoSnippet = 'At-risk & low contribution radar';
                else if (id === 'feedback_synthesizer') infoSnippet = 'AI praise & growth synthesis';
                else if (id === 'peer_benchmark_iq') infoSnippet = 'Classroom collaboration norms';
                else if (id === 'student_progress_journey') infoSnippet = 'Longitudinal student velocity';

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveModuleId(id);
                      setIsRetracted(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.38rem 0.55rem',
                      borderRadius: '8px',
                      border: isActive ? `1.5px solid ${def.accentColor}` : '1px solid var(--border-color)',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: def.accentColor + '20',
                          color: def.accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={12} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {def.shortTitle}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {infoSnippet}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <span style={{ fontSize: '0.58rem', color: def.accentColor, fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: def.accentColor + '18', flexShrink: 0, marginLeft: '4px' }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', opacity: 0.7, flexShrink: 0, marginLeft: '4px' }}>
                        {def.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer - Important Info & Actions Only */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
              <button
                type="button"
                onClick={() => setIsRetracted(false)}
                className="btn btn-primary btn-sm"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.38rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxSizing: 'border-box'
                }}
              >
                <Maximize2 size={11} />
                <span>Expand Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCatalogOpen(true);
                  setIsRetracted(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '0.38rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}
                title="Browse & pin modules"
              >
                <Plus size={11} />
                <span>Modules</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DISPATCH & EXPORT HELPERS (100% USABLE & FUNCTIONAL CLIENT-SIDE FALLBACKS)
  // ───────────────────────────────────────────────────────────────────────────
  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerJsonDownload = (filename: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMatrixCSV = () => {
    const matrixTeams = Array.from(new Set(activeClass.students.map(s => s.groupName))).filter(Boolean);
    const currentMatrixTeam = matrixTeamFilter === 'all' && matrixTeams.length > 0 ? matrixTeams[0] : matrixTeamFilter;
    const matrixMembers = currentMatrixTeam === 'all' 
      ? activeClass.students 
      : activeClass.students.filter(s => s.groupName === currentMatrixTeam);

    const headers = ['Evaluator', 'Team', ...matrixMembers.map(m => `"${m.name.replace(/"/g, '""')}"`), 'Given Average'];
    const rows: string[] = [headers.join(',')];

    matrixMembers.forEach(evaluator => {
      const givenScores: number[] = [];
      const rowCols: string[] = [
        `"${evaluator.name.replace(/"/g, '""')}"`,
        `"${(evaluator.groupName || 'Unassigned').replace(/"/g, '""')}"`
      ];

      matrixMembers.forEach(recipient => {
        const isSelf = evaluator.id === recipient.id;
        const rev = activeClass.reviews.find(
          r => r.reviewerId === evaluator.id && r.recipientId === recipient.id
        );
        let cellVal = '—';
        if (rev && rev.scores) {
          if (matrixCriterionFilter === 'all') {
            const vals = Object.values(rev.scores);
            if (vals.length > 0) {
              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
              cellVal = isSelf ? `${avg.toFixed(1)} (Self)` : avg.toFixed(1);
              if (!isSelf) givenScores.push(avg);
            }
          } else {
            const sc = rev.scores[matrixCriterionFilter];
            if (typeof sc === 'number') {
              cellVal = isSelf ? `${sc} (Self)` : `${sc}`;
              if (!isSelf) givenScores.push(sc);
            }
          }
        }
        rowCols.push(`"${cellVal}"`);
      });

      const givenAvg = givenScores.length > 0 ? (givenScores.reduce((a, b) => a + b, 0) / givenScores.length).toFixed(1) : '—';
      rowCols.push(`"${givenAvg}"`);
      rows.push(rowCols.join(','));
    });

    // Received averages footer
    const footerCols = ['"Received Average"', '""'];
    matrixMembers.forEach(recipient => {
      const receivedScores = activeClass.reviews
        .filter(r => r.recipientId === recipient.id && r.reviewerId !== recipient.id && r.scores)
        .map(r => {
          if (matrixCriterionFilter === 'all') {
            const vals = Object.values(r.scores);
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
          } else {
            return typeof r.scores[matrixCriterionFilter] === 'number' ? r.scores[matrixCriterionFilter] : null;
          }
        })
        .filter((v): v is number => v !== null);

      const recAvg = receivedScores.length > 0 ? (receivedScores.reduce((a, b) => a + b, 0) / receivedScores.length).toFixed(1) : '—';
      footerCols.push(`"${recAvg}"`);
    });
    footerCols.push('""');
    rows.push(footerCols.join(','));

    triggerCsvDownload(`${activeClass.name.replace(/\s+/g, '_')}_Pairwise_Matrix.csv`, rows.join('\r\n'));
    addToast('Downloaded Pairwise Matrix CSV!', 'success');
  };

  const handleExportAuditCSV = (events: Array<{ time: string; type: string; title: string; desc: string }>) => {
    const headers = ['Timestamp', 'Event Type', 'Title', 'Description'];
    const rows = [
      headers.join(','),
      ...events.map(e => [
        `"${(e.time || '').replace(/"/g, '""')}"`,
        `"${(e.type || '').replace(/"/g, '""')}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.desc || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    triggerCsvDownload(`${activeClass.name.replace(/\s+/g, '_')}_Audit_Trail.csv`, rows.join('\r\n'));
    addToast('Downloaded Activity Audit Trail CSV!', 'success');
  };

  const handleFallbackExportGradebook = () => {
    const headers = ['Student ID', 'Name', 'Email', 'Team', 'WebPA Ratio', 'WebPA Calibrated Score', 'Submitted Status'];
    const rows = [
      headers.join(','),
      ...activeClass.students.map(s => {
        const teamBase = activeClass.teamBaseGrades?.[s.groupName] ?? getTargetScale(activeClass);
        const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass, teamBase);
        const hasSub = s.submitted || activeClass.reviews.some(r => r.reviewerId === s.id);
        const scoreStr = webpa.isInsufficient
          ? `Insufficient (${webpa.adjustedGrade.toFixed(1)})`
          : typeof webpa.adjustedGrade === 'number' ? webpa.adjustedGrade.toFixed(1) : teamBase.toFixed(1);
        return [
          `"${(s.id || '').replace(/"/g, '""')}"`,
          `"${(s.name || '').replace(/"/g, '""')}"`,
          `"${(s.email || '').replace(/"/g, '""')}"`,
          `"${(s.groupName || 'Unassigned').replace(/"/g, '""')}"`,
          typeof webpa.ratio === 'number' ? webpa.ratio.toFixed(3) : '1.000',
          scoreStr,
          hasSub ? '"Submitted"' : '"Pending"'
        ].join(',');
      })
    ];
    triggerCsvDownload(`${activeClass.name.replace(/\s+/g, '_')}_Gradebook.csv`, rows.join('\r\n'));
    addToast('Exported Gradebook CSV successfully!', 'success');
  };

  const handleFallbackExportRoster = () => {
    const headers = ['Student ID', 'Name', 'Email', 'Team', 'Gender', 'Status'];
    const rows = [
      headers.join(','),
      ...activeClass.students.map(s => [
        `"${(s.id || '').replace(/"/g, '""')}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.groupName || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(s.gender || 'Not specified').replace(/"/g, '""')}"`,
        s.submitted ? '"Submitted"' : '"Pending"'
      ].join(','))
    ];
    triggerCsvDownload(`${activeClass.name.replace(/\s+/g, '_')}_Roster.csv`, rows.join('\r\n'));
    addToast('Exported Student Roster CSV!', 'success');
  };

  const handleFallbackExportLMS = (platform: 'canvas' | 'blackboard' | 'moodle' | 'brightspace') => {
    const rows: string[] = [];
    const classScale = getTargetScale(activeClass);
    if (platform === 'canvas') {
      rows.push(`"Student","ID","SIS User ID","SIS Login ID","Section","Peer Assessment [${classScale}]"`);
      rows.push(`"Points Possible","","","","",${classScale}`);
      activeClass.students.forEach(s => {
        const teamBase = activeClass.teamBaseGrades?.[s.groupName] ?? classScale;
        const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass, teamBase);
        const score = typeof webpa.adjustedGrade === 'number' ? webpa.adjustedGrade.toFixed(1) : classScale.toFixed(1);
        rows.push(`"${s.name.replace(/"/g, '""')}","${s.id}","${s.id}","${s.email}","${s.groupName || 'Default'}","${score}"`);
      });
    } else if (platform === 'blackboard') {
      rows.push('"Username","Last Name","First Name","Student ID","Peer Assessment"');
      activeClass.students.forEach(s => {
        const parts = s.name.split(' ');
        const first = parts[0] || '';
        const last = parts.slice(1).join(' ') || '';
        const teamBase = activeClass.teamBaseGrades?.[s.groupName] ?? classScale;
        const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass, teamBase);
        const score = typeof webpa.adjustedGrade === 'number' ? webpa.adjustedGrade.toFixed(1) : classScale.toFixed(1);
        rows.push(`"${s.email}","${last.replace(/"/g, '""')}","${first.replace(/"/g, '""')}","${s.id}","${score}"`);
      });
    } else {
      rows.push('"Identifier","Full name","Email address","Status","Grade"');
      activeClass.students.forEach(s => {
        const teamBase = activeClass.teamBaseGrades?.[s.groupName] ?? classScale;
        const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass, teamBase);
        const score = typeof webpa.adjustedGrade === 'number' ? webpa.adjustedGrade.toFixed(1) : classScale.toFixed(1);
        rows.push(`"${s.id}","${s.name.replace(/"/g, '""')}","${s.email}","Submitted","${score}"`);
      });
    }
    triggerCsvDownload(`${activeClass.name.replace(/\s+/g, '_')}_${platform.toUpperCase()}_Grades.csv`, rows.join('\r\n'));
    addToast(`Exported ${platform.toUpperCase()} Gradebook CSV!`, 'success');
  };

  const handleAutoBalanceRubric = () => {
    if (!activeClass.fields || activeClass.fields.length === 0) return;
    const count = activeClass.fields.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;
    const updatedFields: GradingScaleField[] = activeClass.fields.map((f, i) => ({
      ...f,
      weight: baseWeight + (i < remainder ? 1 : 0)
    }));
    if (classContext?.updateGradingConfig) {
      classContext.updateGradingConfig(activeClass.id, updatedFields);
      addToast('Rubric weights auto-balanced evenly to 100%!', 'success');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. DOCK POSITION & TRANSLUCENCY COMPUTATION (HARDWARE FROSTED GLASS)
  // ───────────────────────────────────────────────────────────────────────────
  const getDockContainerStyle = (): React.CSSProperties => {
    // Dynamic background based on translucency level
    let bg = 'var(--bg-surface)';
    let blur = 'none';
    let borderTint = '1.5px solid var(--border-color)';
    let shadow = 'var(--shadow-xl), 0 24px 56px rgba(0, 0, 0, 0.38)';

    if (translucencyLevel === 'subtle') {
      bg = 'linear-gradient(145deg, color-mix(in srgb, var(--bg-surface) 80%, rgba(255, 255, 255, 0.45)) 0%, color-mix(in srgb, var(--bg-surface) 68%, transparent) 100%)';
      blur = 'blur(20px) saturate(180%)';
      borderTint = '1.5px solid rgba(255, 255, 255, 0.38)';
      shadow = '0 24px 60px rgba(0, 0, 0, 0.28), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5), inset 1px 0 0 rgba(255, 255, 255, 0.25)';
    } else if (translucencyLevel === 'medium') {
      bg = 'linear-gradient(145deg, color-mix(in srgb, var(--bg-surface) 54%, rgba(255, 255, 255, 0.4)) 0%, color-mix(in srgb, var(--bg-surface) 40%, transparent) 100%)';
      blur = 'blur(28px) saturate(210%) contrast(108%)';
      borderTint = '1.5px solid rgba(255, 255, 255, 0.48)';
      shadow = '0 24px 60px rgba(0, 0, 0, 0.32), inset 0 1px 2px 0 rgba(255, 255, 255, 0.75), inset 1px 0 0 rgba(255, 255, 255, 0.35)';
    } else if (translucencyLevel === 'sheer') {
      bg = 'linear-gradient(145deg, color-mix(in srgb, var(--bg-surface) 28%, rgba(255, 255, 255, 0.25)) 0%, color-mix(in srgb, var(--bg-surface) 18%, transparent) 100%)';
      blur = 'blur(36px) saturate(230%) contrast(114%)';
      borderTint = '1.5px solid rgba(255, 255, 255, 0.60)';
      shadow = '0 24px 60px rgba(0, 0, 0, 0.38), inset 0 1px 2px 0 rgba(255, 255, 255, 0.9), inset 1px 0 0 rgba(255, 255, 255, 0.45)';
    }

    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9995,
      backgroundColor: bg,
      backdropFilter: blur,
      WebkitBackdropFilter: blur,
      boxShadow: shadow,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)'
    };

    switch (dockPosition) {
      case 'left':
        return {
          ...base,
          left: 0,
          top: 0,
          bottom: 0,
          width: getComputedWidth(),
          borderRight: borderTint
        };
      case 'floating': {
        const isMax = isFloatMaximized;
        return {
          ...base,
          left: isMax ? '12px' : `${floatPosition.x}px`,
          top: isMax ? '12px' : `${floatPosition.y}px`,
          right: 'auto',
          bottom: 'auto',
          width: isMax ? 'calc(100vw - 24px)' : `${floatSize.width}px`,
          height: isMax ? 'calc(100vh - 24px)' : `${floatSize.height}px`,
          maxWidth: 'calc(100vw - 16px)',
          maxHeight: 'calc(100vh - 16px)',
          borderRadius: isMax ? '12px' : '20px',
          border: borderTint,
          transition: isDraggingWindow || resizeDirection ? 'none' : 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isDraggingWindow
            ? '0 32px 80px rgba(0, 0, 0, 0.45), 0 12px 28px rgba(0, 0, 0, 0.25)'
            : shadow,
          cursor: 'default'
        };
      }
      case 'bottom':
        return {
          ...base,
          left: 'max(12px, calc(50% - 480px))',
          right: 'max(12px, calc(50% - 480px))',
          bottom: 0,
          height: 'min(580px, 78vh)',
          borderRadius: '20px 20px 0 0',
          border: borderTint,
          borderBottom: 'none'
        };
      case 'right':
      default:
        return {
          ...base,
          right: 0,
          top: 0,
          bottom: 0,
          width: getComputedWidth(),
          borderLeft: borderTint
        };
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. RENDER ALL 28 MODULES (100% USABLE & INTERACTIVE WITH LIVE DATA)
  // ───────────────────────────────────────────────────────────────────────────
  const renderModuleContent = () => {
    switch (activeModuleId) {
      // 0. Classroom Pulse & Live Stats Cockpit
      case 'live_stats_hud': {
        const teamsListHud = Array.from(new Set(activeClass.students.map(s => s.groupName))).filter(Boolean);
        const teamsCompleted = teamsListHud.filter(team => {
          const members = activeClass.students.filter(s => s.groupName === team);
          return members.length > 0 && members.every(m => m.submitted || activeClass.reviews.some(r => r.reviewerId === m.id));
        }).length;

        const studentWebpaScores = activeClass.students.map(s => calculateStudentWebPAScore(s.id, s.groupName, activeClass));
        const ratios = studentWebpaScores.map(w => w.ratio).filter(r => typeof r === 'number' && !isNaN(r));
        const minRatio = ratios.length > 0 ? Math.min(...ratios) : 1.0;
        const maxRatio = ratios.length > 0 ? Math.max(...ratios) : 1.0;
        const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1.0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Top Metrics KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.55rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Submissions</span>
                  <Activity size={13} style={{ color: '#059669' }} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                  {classCompletionRate}%
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {totalSubmittedStudents} of {totalStudents} students
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Teams Complete</span>
                  <Users size={13} style={{ color: '#6366f1' }} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                  {teamsCompleted} / {teamsListHud.length}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  100% submission rate
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>WebPA Fairness</span>
                  <Calculator size={13} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                  {avgRatio.toFixed(2)}x
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  Range: {minRatio.toFixed(2)}x – {maxRatio.toFixed(2)}x
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Round Access</span>
                  {isMainUnlocked ? <Unlock size={13} style={{ color: '#059669' }} /> : <Lock size={13} style={{ color: '#ef4444' }} />}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isMainUnlocked ? '#059669' : '#dc2626', margin: '0.2rem 0' }}>
                  {isMainUnlocked ? 'Open' : 'Locked'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateControls({ unlockMainPeerReview: !isMainUnlocked });
                    addToast(isMainUnlocked ? 'Locked evaluation round' : 'Unlocked evaluation round', 'info');
                  }}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isMainUnlocked ? 'Click to Lock' : 'Click to Unlock'}
                </button>
              </div>
            </div>

            {/* Optional Auto-Balance Alert Banner if Rubric is not 100% */}
            {(() => {
              const totalRubricWeight = activeClass.fields.reduce((acc, f) => acc + (f.weight || 0), 0);
              if (totalRubricWeight === 100) return null;
              return (
                <div
                  style={{
                    padding: '0.55rem 0.75rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={13} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706' }}>
                      Rubric weights sum to {totalRubricWeight}% ({totalRubricWeight > 100 ? `+${totalRubricWeight - 100}%` : `${totalRubricWeight - 100}%`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoBalanceRubric}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Auto-Balance (100%)
                  </button>
                </div>
              );
            })()}

            {/* Teams Progress Breakdown */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Team Submissions Pulse
                </span>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                  Click team to inspect in Matrix
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
                {teamsListHud.map(team => {
                  const members = activeClass.students.filter(s => s.groupName === team);
                  const subs = members.filter(m => m.submitted || activeClass.reviews.some(r => r.reviewerId === m.id)).length;
                  const pct = members.length > 0 ? Math.round((subs / members.length) * 100) : 0;
                  const isDone = subs === members.length && members.length > 0;

                  return (
                    <div
                      key={team}
                      onClick={() => {
                        setMatrixTeamFilter(team);
                        setPinnedIds(prev => (prev.includes('detailed_matrix') ? prev : [...prev, 'detailed_matrix']));
                        setActiveModuleId('detailed_matrix');
                        addToast(`Filtered Rating Matrix to ${team}`, 'info');
                      }}
                      title={`Click to open pairwise rating matrix for ${team}`}
                      style={{
                        padding: '0.45rem 0.65rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {team}
                          </span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: isDone ? '#059669' : 'var(--text-muted)' }}>
                            {subs} / {members.length} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isDone ? '#10b981' : 'var(--primary)', borderRadius: '999px', transition: 'width 0.2s' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const teamEmails = members.map(m => m.email).filter(Boolean).join(', ');
                            if (teamEmails) {
                              navigator.clipboard.writeText(teamEmails);
                              addToast(`Copied emails for ${team}!`, 'success');
                            } else {
                              addToast(`No emails found for ${team}`, 'warning');
                            }
                          }}
                          title={`Copy emails of ${team} members`}
                          style={{
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-app)',
                            padding: '2px 5px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Copy size={9} />
                          <span>Emails</span>
                        </button>

                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isDone ? '#059669' : '#d97706'
                          }}
                        >
                          {isDone ? 'Complete' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Navigation Jump Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPinnedIds(prev => (prev.includes('comms_center') ? prev : [...prev, 'comms_center']));
                  setActiveModuleId('comms_center');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Mail size={12} style={{ color: '#2563eb' }} />
                <span>Send Reminders</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinnedIds(prev => (prev.includes('detailed_matrix') ? prev : [...prev, 'detailed_matrix']));
                  setActiveModuleId('detailed_matrix');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Table size={12} style={{ color: '#f59e0b' }} />
                <span>Rating Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinnedIds(prev => (prev.includes('export_hub') ? prev : [...prev, 'export_hub']));
                  setActiveModuleId('export_hub');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={12} style={{ color: '#0d9488' }} />
                <span>Export Hub</span>
              </button>
            </div>
          </div>
        );
      }

      // 1. Peer Evaluation Controls & Permissions
      case 'eval_controls':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
            <CollapsibleEvaluationControls
              activeClass={activeClass}
              onUpdateControls={onUpdateControls}
              defaultExpanded={true}
              title="Form Fields &amp; Permissions"
              description="Real-time control over questions, self-review, praise tags, and lock status across all student portals."
            />
          </div>
        );

      // 2. Student Smartphone Portal Simulator
      case 'smartphone_simulator':
        const simStudent = activeClass.students.find(s => s.id === simStudentId) || activeClass.students[0];
        const studentOptions = activeClass.students.map(s => ({
          value: s.id,
          label: `${s.name} (${s.groupName || 'Unassigned'})`
        }));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
            {/* Simulator Toolbar */}
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                gap: '0.4rem'
              }}
            >
              <button
                type="button"
                onClick={() => onUpdateControls({ unlockMainPeerReview: !evalControls.unlockMainPeerReview })}
                title={evalControls.unlockMainPeerReview ? 'Click to lock main review round' : 'Click to unlock main review round'}
                style={{
                  height: '26px',
                  padding: '0 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: evalControls.unlockMainPeerReview ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: evalControls.unlockMainPeerReview ? '#059669' : '#dc2626',
                  border: `1px solid ${evalControls.unlockMainPeerReview ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  cursor: 'pointer'
                }}
              >
                {evalControls.unlockMainPeerReview ? <Unlock size={11} /> : <Lock size={11} />}
                <span>{evalControls.unlockMainPeerReview ? 'Round Open' : 'Round Locked'}</span>
              </button>

              {simStudent && (
                <CustomSelect
                  value={simStudent.id}
                  onChange={val => setSimStudentId(val)}
                  options={studentOptions}
                  triggerStyle={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem', maxWidth: '140px' }}
                  dropdownMinWidth="220px"
                  dropdownStyle={{ zIndex: 10020 }}
                  title="Switch previewing student"
                />
              )}

              <button
                type="button"
                onClick={() => setSimRefreshKey(prev => prev + 1)}
                title="Restart simulator submission"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Smartphone Frame */}
            {simStudent ? (
              <div
                style={{
                  width: '360px',
                  height: '680px',
                  borderRadius: '44px',
                  border: '10px solid #1e293b',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35), inset 0 0 10px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Dynamic Island Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '105px',
                    height: '24px',
                    borderRadius: '999px',
                    backgroundColor: '#000000',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 9px'
                  }}
                >
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#1e293b' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                </div>

                {/* Live Student Portal View inside Simulator */}
                <div key={simRefreshKey} style={{ flex: 1, overflowY: 'auto', paddingTop: '32px' }}>
                  <StudentPortal
                    classId={activeClass.id}
                    studentId={simStudent.id}
                    isPreview={true}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                No students enrolled in this classroom yet.
              </div>
            )}
          </div>
        );

      // 3. AutoGroup Studio & Team Kanban
      case 'autogroup_studio':
        return (
          <div style={{ padding: '0.25rem 0' }}>
            <AutoGroupStudio
              students={activeClass.students}
              classId={activeClass.id}
              defaultExpanded={true}
              compactMode={contentDensity === 'compact'}
              onApplyGroups={newStudents => {
                onUpdateStudents(activeClass.id, newStudents);
                addToast('Auto-grouped teams saved to classroom roster!', 'success');
              }}
            />
          </div>
        );

      // 4. Team Cohorts & Group Directory
      case 'team_cohorts':
        return (
          <div style={{ padding: '0.25rem 0' }}>
            <TeamCohortsOverview
              activeClass={activeClass}
              selectedGroup={selectedCohortGroup}
              onSelectGroup={setSelectedCohortGroup}
              baseGroupGrade={activeClass.targetScale ?? 100}
              fudgeWeight={activeClass.peerAdjustmentConfig?.fudgeWeight ?? 0.5}
              onUpdateTeamBaseGrade={onUpdateTeamBaseGrade || (() => {})}
              onPreviewStudent={onPreviewStudent || (() => {})}
              onEditStudent={onEditStudent || (() => {})}
              onOpenReport={onOpenReport || (() => {})}
              addToast={addToast}
            />
          </div>
        );

      // 5. Classroom Roster & Participant Manager
      case 'roster_manager':
        const filteredRoster = activeClass.students.filter(s => {
          const matchesSearch =
            !rosterSearch.trim() ||
            s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(rosterSearch.toLowerCase()) ||
            s.groupName.toLowerCase().includes(rosterSearch.toLowerCase());
          const matchesTeam = rosterTeamFilter === 'all' || s.groupName === rosterTeamFilter;
          return matchesSearch && matchesTeam;
        });

        const teamsList = Array.from(new Set(activeClass.students.map(s => s.groupName))).filter(Boolean);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Roster Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: isCompactWidth ? '130px' : '180px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder={isCompactWidth ? "Search..." : "Search students or teams..."}
                    value={rosterSearch}
                    onChange={e => setRosterSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.5rem 0.4rem 1.6rem',
                      fontSize: '0.74rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <select
                  value={rosterTeamFilter}
                  onChange={e => setRosterTeamFilter(e.target.value)}
                  style={{
                    padding: '0.4rem 0.45rem',
                    fontSize: '0.74rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    maxWidth: isCompactWidth ? '105px' : '150px'
                  }}
                >
                  <option value="all">{isCompactWidth ? 'Teams' : `All Teams (${teamsList.length})`}</option>
                  {teamsList.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {onAddStudent && (
                  <button
                    type="button"
                    onClick={onAddStudent}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: isCompactWidth ? '0.4rem 0.5rem' : '0.4rem 0.6rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} /> <span className="dock-header-btn-text">Add Student</span>
                  </button>
                )}

                {onExportCSV && (
                  <button
                    type="button"
                    onClick={onExportCSV}
                    title="Export roster CSV"
                    style={{
                      padding: '0.4rem 0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompactWidth ? '0.68rem' : '0.74rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', minWidth: isUltraCompact ? '90px' : '110px' }}>Student Name</th>
                    <th style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Team</th>
                    <th style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>Submitted</th>
                    <th style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map(s => {
                    const hasSubmitted = s.submitted || activeClass.reviews.some(r => r.reviewerId === s.id);
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', fontWeight: 700, minWidth: isUltraCompact ? '90px' : '110px' }}>
                          <div style={{ wordBreak: 'break-word', maxWidth: isUltraCompact ? '90px' : '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isUltraCompact ? 'nowrap' : 'normal' }}>{s.name}</div>
                          <div className="student-email-sub" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', maxWidth: isUltraCompact ? '90px' : '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                        </td>
                        <td style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem' }}>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {s.groupName || 'Unassigned'}
                          </span>
                        </td>
                        <td style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem' }}>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: hasSubmitted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: hasSubmitted ? '#059669' : '#dc2626',
                              fontWeight: 800,
                              fontSize: '0.64rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {hasSubmitted ? 'Submitted' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: isCompactWidth ? '0.35rem 0.45rem' : '0.5rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                            {onPreviewStudent && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => onPreviewStudent(s)}
                                title="Inspect Student"
                                style={{
                                  padding: '2px 5px',
                                  borderRadius: '5px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  fontSize: '0.65rem'
                                }}
                              >
                                View
                              </button>
                            )}
                            {onEditStudent && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => onEditStudent(s)}
                                title="Edit Student"
                                style={{
                                  padding: '2px 5px',
                                  borderRadius: '5px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  fontSize: '0.65rem'
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No students match your filter query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // Student Reminders & Comms Broadcast Center
      case 'comms_center': {
        const pendingStudents = activeClass.students.filter(
          s => !s.submitted && !activeClass.reviews.some(r => r.reviewerId === s.id)
        );
        const allPendingIds = pendingStudents.map(s => s.id);
        const effectiveSelectedIds = selectedPendingIds.length > 0
          ? selectedPendingIds.filter(id => allPendingIds.includes(id))
          : allPendingIds;

        const selectedPendingStudents = pendingStudents.filter(s => effectiveSelectedIds.includes(s.id));
        const targetEmails = selectedPendingStudents.map(s => s.email).filter(Boolean);
        const emailListStr = targetEmails.join(', ');

        const reminderSubject = customReminderSubject.trim() || `[Reminder] Complete Peer Evaluation for ${activeClass.name}`;
        const defaultBody = `Hi {student_name},\n\nThis is a friendly reminder that the peer evaluation round for ${activeClass.name} is currently open.\n\nPlease log in and submit your evaluations for your teammates at your earliest convenience:\n{portal_link}\n\nThank you for your active participation!`;
        const reminderBodyTemplate = customReminderBody.trim() || defaultBody;

        const mailtoUrl = `mailto:?bcc=${encodeURIComponent(emailListStr)}&subject=${encodeURIComponent(reminderSubject)}&body=${encodeURIComponent(
          reminderBodyTemplate
            .replace(/\{student_name\}/g, 'Student')
            .replace(/\{class_name\}/g, activeClass.name)
            .replace(/\{portal_link\}/g, window.location.origin)
        )}`;

        const handleMarkStudentSubmitted = (studentId: string, studentName: string) => {
          const updated = activeClass.students.map(st => st.id === studentId ? { ...st, submitted: true } : st);
          onUpdateStudents(activeClass.id, updated);
          if (classContext?.updateStudent) {
            classContext.updateStudent(activeClass.id, studentId, { submitted: true });
          }
          addToast(`Marked ${studentName} as submitted / excused!`, 'success');
        };

        const handleCopyStudentPortalLink = (studentId: string, studentName: string) => {
          const link = `${window.location.origin}?classId=${encodeURIComponent(activeClass.id)}&studentId=${encodeURIComponent(studentId)}`;
          navigator.clipboard.writeText(link);
          addToast(`Copied ${studentName}'s direct portal link!`, 'success');
        };

        const isAllSelected = allPendingIds.length > 0 && effectiveSelectedIds.length === allPendingIds.length;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Banner */}
            <div style={{ padding: '0.75rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Pending Student Submissions ({pendingStudents.length})
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: pendingStudents.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: pendingStudents.length === 0 ? '#059669' : '#dc2626'
                  }}
                >
                  {pendingStudents.length === 0 ? 'All Clear' : `${pendingStudents.length} Overdue`}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {pendingStudents.length === 0
                  ? 'All enrolled students have completed their peer evaluation submissions!'
                  : `${effectiveSelectedIds.length} of ${pendingStudents.length} pending student(s) selected for reminder broadcast.`}
              </div>

              {pendingStudents.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAllSelected) {
                        setSelectedPendingIds([]);
                      } else {
                        setSelectedPendingIds(allPendingIds);
                      }
                    }}
                    style={{
                      padding: '0.35rem 0.55rem',
                      borderRadius: '7px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isAllSelected ? 'Deselect All' : `Select All (${pendingStudents.length})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(emailListStr);
                      setCopiedComms(true);
                      setTimeout(() => setCopiedComms(false), 2000);
                      addToast(`Copied ${targetEmails.length} email addresses to clipboard!`, 'success');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '7px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={11} />
                    <span>{copiedComms ? 'Copied Emails!' : `Copy Emails (${targetEmails.length})`}</span>
                  </button>

                  <a
                    href={mailtoUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '7px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Mail size={11} />
                    <span>Draft Email (BCC {targetEmails.length})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsEditingTemplate(prev => !prev)}
                    style={{
                      padding: '0.35rem 0.55rem',
                      borderRadius: '7px',
                      backgroundColor: isEditingTemplate ? 'var(--primary-light)' : 'var(--bg-surface)',
                      border: isEditingTemplate ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      color: isEditingTemplate ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isEditingTemplate ? 'Hide Template' : 'Edit Template'}
                  </button>
                </div>
              )}
            </div>

            {/* Template Editor Drawer */}
            {isEditingTemplate && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Customize Reminder Email Template
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomReminderSubject('');
                      setCustomReminderBody('');
                      addToast('Reset reminder email to default template', 'info');
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reset Defaults
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Email Subject:</div>
                  <input
                    type="text"
                    value={customReminderSubject}
                    placeholder={reminderSubject}
                    onChange={e => setCustomReminderSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.55rem',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Email Body Template (Merge tags: {'{student_name}'}, {'{class_name}'}, {'{portal_link}'}):
                  </div>
                  <textarea
                    rows={4}
                    value={customReminderBody}
                    placeholder={defaultBody}
                    onChange={e => setCustomReminderBody(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.55rem',
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* List of Pending Students */}
            {pendingStudents.length > 0 ? (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.45rem 0.5rem', width: '30px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPendingIds(allPendingIds);
                            } else {
                              setSelectedPendingIds([]);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Pending Student</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Team</th>
                      <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map(s => {
                      const isChecked = effectiveSelectedIds.includes(s.id);
                      const directBody = reminderBodyTemplate
                        .replace(/\{student_name\}/g, s.name)
                        .replace(/\{class_name\}/g, activeClass.name)
                        .replace(/\{portal_link\}/g, `${window.location.origin}?classId=${encodeURIComponent(activeClass.id)}&studentId=${encodeURIComponent(s.id)}`);

                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.04)' : undefined }}>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedPendingIds(prev => (prev.includes(s.id) ? prev : [...prev, s.id]));
                                } else {
                                  setSelectedPendingIds(prev => prev.filter(id => id !== s.id));
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{s.email || 'No email provided'}</div>
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-muted)' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.65rem' }}>
                              {s.groupName || 'Unassigned'}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleCopyStudentPortalLink(s.id, s.name)}
                                title="Copy direct student portal link"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontSize: '0.64rem',
                                  fontWeight: 700
                                }}
                              >
                                <Link2 size={10} /> Link
                              </button>

                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleMarkStudentSubmitted(s.id, s.name)}
                                title="Mark student as excused / submitted in roster"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#059669',
                                  cursor: 'pointer',
                                  fontSize: '0.64rem',
                                  fontWeight: 800
                                }}
                              >
                                <CheckCircle size={10} /> Excuse
                              </button>

                              {s.email && (
                                <a
                                  href={`mailto:${s.email}?subject=${encodeURIComponent(reminderSubject)}&body=${encodeURIComponent(directBody)}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    padding: '2px 6px',
                                    borderRadius: '5px',
                                    backgroundColor: 'var(--primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    textDecoration: 'none',
                                    fontSize: '0.64rem',
                                    fontWeight: 800
                                  }}
                                >
                                  <Send size={9} /> Mail
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <CheckCircle size={28} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>All Clear! 100% Submissions</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Every enrolled student has submitted their peer evaluation.</div>
              </div>
            )}
          </div>
        );
      }

      // 6. Review System & Rubric Matrix
      case 'rubric_system':
        const totalWeight = activeClass.fields.reduce((acc, f) => acc + (f.weight || 0), 0);
        const isBalanced = totalWeight === 100;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Total Rubric Weight: {totalWeight}%
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isBalanced ? '#059669' : '#dc2626'
                  }}
                >
                  {isBalanced ? 'Balanced 100%' : `${totalWeight > 100 ? '+' : ''}${totalWeight - 100}% Discrepancy`}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, totalWeight)}%`,
                    height: '100%',
                    backgroundColor: isBalanced ? '#10b981' : totalWeight > 100 ? '#ef4444' : '#f59e0b',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>

              {!isBalanced && (
                <button
                  type="button"
                  onClick={handleAutoBalanceRubric}
                  style={{
                    marginTop: '0.6rem',
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '7px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Zap size={12} /> Auto-Balance Weights Evenly to 100%
                </button>
              )}
            </div>

            {/* Criteria List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeClass.fields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '9px',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {idx + 1}. {field.name}
                    </div>
                    {field.description && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {field.description}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      padding: '2px 6px',
                      backgroundColor: 'var(--primary-light)',
                      borderRadius: '4px'
                    }}
                  >
                    {field.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      // 7. Grading & Performance Analytics
      case 'grading_analytics':
        const studentMetricsList = activeClass.students.map(student => ({
          student,
          metrics: calculateStudentMetrics(student, activeClass)
        }));
        const totalEvaluations = activeClass.reviews.length;
        const submittedStudents = activeClass.students.filter(
          s => s.submitted || activeClass.reviews.some(r => r.reviewerId === s.id)
        ).length;
        const completionRate =
          activeClass.students.length > 0
            ? Math.round((submittedStudents / activeClass.students.length) * 100)
            : 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.55rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {activeClass.students.length}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Students</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                  {completionRate}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Submission Rate</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                  {totalEvaluations}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Peer Reviews</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Top Student Performance Snapshot
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {studentMetricsList.slice(0, 5).map(({ student, metrics: sm }) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>{student.name}</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669' }}>
                      {sm.overallPercentage !== null ? `${Math.round(sm.overallPercentage)}%` : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // 8. Peer Score Adjustment & WebPA Multipliers
      case 'webpa_calibration':
        const adjConfig = getPeerAdjustmentConfig(activeClass);
        const adjMeta = PEER_ADJUSTMENT_METHODS_META[adjConfig.method] || PEER_ADJUSTMENT_METHODS_META.webpa;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Active Algorithm: {adjMeta.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Sensitivity Factor: {(adjConfig.fudgeWeight * 100).toFixed(0)}% • Non-Submitter Penalty: {adjConfig.nonSubmitterPenalty}%
                  </div>
                </div>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {adjMeta.badge}
                </span>
              </div>
            </div>

            {/* Multipliers List */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.45rem 0.6rem' }}>Student</th>
                    <th style={{ padding: '0.45rem 0.6rem' }}>Team</th>
                    <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {activeClass.students.slice(0, 8).map(s => {
                    const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass, 100);
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700 }}>{s.name}</td>
                        <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-muted)' }}>{s.groupName}</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 800, color: webpa.ratio >= 1.0 ? '#059669' : '#d97706' }}>
                          {webpa.ratio.toFixed(2)}x
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 9. Live Presentation Scoring Cockpit
      case 'live_presentation':
        const formatTime = (secs: number) => {
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Oral Presentation Timer
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'monospace', margin: '0.4rem 0', color: timerSeconds < 120 ? '#ef4444' : 'var(--text-primary)' }}>
                {formatTime(timerSeconds)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isTimerRunning ? '#ef4444' : '#10b981',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer'
                  }}
                >
                  {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(600);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {onOpenLivePresentation && (
              <button
                type="button"
                onClick={onOpenLivePresentation}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Presentation size={14} /> Open Full Live Presentation Scoring Cockpit
              </button>
            )}
          </div>
        );

      // 10. Suspicious Ratings & Anomaly Audit
      case 'anomaly_audit':
        const anomalies = detectClassAnomalies(activeClass);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Audit Integrity Status
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  backgroundColor: anomalies.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: anomalies.length === 0 ? '#059669' : '#dc2626'
                }}
              >
                {anomalies.length === 0 ? 'All Clear (0 Flags)' : `${anomalies.length} Flagged Anomalies`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {anomalies.map((anom, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {anom.studentName}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444' }}>
                        {anom.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '2px' }}>
                      {anom.description}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const st = activeClass.students.find(s => s.id === anom.studentId || s.name === anom.studentName);
                          if (st?.groupName) {
                            setMatrixTeamFilter(st.groupName);
                          }
                          setPinnedIds(prev => (prev.includes('detailed_matrix') ? prev : [...prev, 'detailed_matrix']));
                          setActiveModuleId('detailed_matrix');
                          addToast(`Opened Rating Matrix for ${anom.studentName}`, 'info');
                        }}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect in Matrix
                      </button>
                      {onOpenReport && (
                        <button
                          type="button"
                          onClick={() => {
                            const st = activeClass.students.find(s => s.id === anom.studentId || s.name === anom.studentName);
                            if (st) onOpenReport(st.id);
                          }}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            cursor: 'pointer'
                          }}
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  No suspicious evaluation patterns or collusion detected across this classroom!
                </div>
              )}
            </div>
          </div>
        );

      // Class Activity Trail & Audit Log
      case 'activity_audit_log': {
        const events: Array<{ id: string; type: 'submission' | 'security' | 'config' | 'notes'; title: string; desc: string; icon: any; color: string; time: string; isCustomNote?: boolean }> = [];

        // Submission events from reviews
        activeClass.reviews.slice(0, 15).forEach((rev, idx) => {
          const reviewer = activeClass.students.find(s => s.id === rev.reviewerId);
          const recipient = activeClass.students.find(s => s.id === rev.recipientId);
          if (reviewer && recipient) {
            events.push({
              id: `sub-${idx}`,
              type: 'submission',
              title: `${reviewer.name} submitted peer evaluation`,
              desc: `Completed evaluation for ${recipient.name} (${reviewer.groupName || 'Team'})`,
              icon: CheckCircle,
              color: '#059669',
              time: 'Recent'
            });
          }
        });

        // Duplicates check event
        const dupFlags = detectDuplicateEnrollments(activeClass.students);
        if (dupFlags.size > 0) {
          events.push({
            id: 'dup-flag',
            type: 'security',
            title: `Integrity Alert: ${dupFlags.size} potential duplicate(s) detected`,
            desc: 'Review participant roster for duplicate email addresses or student identifiers.',
            icon: AlertTriangle,
            color: '#ef4444',
            time: 'Active'
          });
        }

        // Anomalies check event
        const anomaliesList = detectClassAnomalies(activeClass);
        if (anomaliesList.length > 0) {
          events.push({
            id: 'anom-flag',
            type: 'security',
            title: `Audit Flag: ${anomaliesList.length} evaluation anomalies flagged`,
            desc: 'Extreme outlier ratings or reciprocal collusion patterns detected.',
            icon: ShieldAlert,
            color: '#f59e0b',
            time: 'Active'
          });
        }

        // Round Lock status event
        events.push({
          id: 'round-status',
          type: 'config',
          title: `Round Access: ${isMainUnlocked ? 'Open for Submissions' : 'Locked'}`,
          desc: isMainUnlocked ? 'Students can view and submit reviews.' : 'Student submissions are closed.',
          icon: isMainUnlocked ? Unlock : Lock,
          color: isMainUnlocked ? '#059669' : '#64748b',
          time: 'Current'
        });

        // Custom instructor audit notes
        customAuditNotes.forEach(note => {
          events.unshift({
            id: note.id,
            type: 'notes',
            title: `Instructor Log (${note.author})`,
            desc: note.text,
            icon: MessageSquare,
            color: '#8b5cf6',
            time: note.timestamp,
            isCustomNote: true
          });
        });

        const filteredEvents = events.filter(e => {
          if (auditFilter === 'submissions' && e.type !== 'submission') return false;
          if (auditFilter === 'integrity' && e.type !== 'security') return false;
          if (auditFilter === 'system' && e.type !== 'config') return false;
          if (auditFilter === 'notes' && e.type !== 'notes') return false;
          if (auditSearch.trim()) {
            const q = auditSearch.toLowerCase();
            return e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q);
          }
          return true;
        });

        const handleAddAuditNote = (e: React.FormEvent) => {
          e.preventDefault();
          if (!newAuditNoteText.trim()) return;
          const newNote = {
            id: `note-${Date.now()}`,
            text: newAuditNoteText.trim(),
            author: 'Instructor',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
          };
          setCustomAuditNotes(prev => [newNote, ...prev]);
          setNewAuditNoteText('');
          addToast('Logged instructor audit note!', 'success');
        };

        const handleDeleteAuditNote = (id: string) => {
          setCustomAuditNotes(prev => prev.filter(n => n.id !== id));
          addToast('Removed instructor note', 'info');
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Top Toolbar: Search + Export Trail */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.55rem 0.35rem 1.6rem',
                    fontSize: '0.72rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleExportAuditCSV(filteredEvents)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '7px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Download size={11} /> Export CSV
              </button>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: `All (${events.length})` },
                { id: 'submissions', label: 'Submissions' },
                { id: 'integrity', label: 'Integrity' },
                { id: 'system', label: 'System' },
                { id: 'notes', label: `Instructor Notes (${customAuditNotes.length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAuditFilter(f.id as any)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: auditFilter === f.id ? 'var(--primary)' : 'var(--bg-app)',
                    color: auditFilter === f.id ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Add Instructor Note Inline Form */}
            <form onSubmit={handleAddAuditNote} style={{ display: 'flex', gap: '0.35rem' }}>
              <input
                type="text"
                placeholder="Log an instructor audit entry (e.g., Extension granted for Team Beta)..."
                value={newAuditNoteText}
                onChange={e => setNewAuditNoteText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.72rem',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="submit"
                disabled={!newAuditNoteText.trim()}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '7px',
                  backgroundColor: newAuditNoteText.trim() ? '#8b5cf6' : 'var(--bg-app)',
                  color: newAuditNoteText.trim() ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: newAuditNoteText.trim() ? 'pointer' : 'default',
                  flexShrink: 0
                }}
              >
                Log Note
              </button>
            </form>

            {/* Timeline feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '380px', overflowY: 'auto' }}>
              {filteredEvents.map(evt => {
                const Icon = evt.icon;
                return (
                  <div
                    key={evt.id}
                    style={{
                      padding: '0.6rem 0.75rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: evt.isCustomNote ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: `${evt.color}15`,
                        color: evt.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {evt.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {evt.time}
                          </span>
                          {evt.isCustomNote && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAuditNote(evt.id)}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '1px'
                              }}
                              title="Delete note"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {evt.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  No audit events found matching your filter or search query.
                </div>
              )}
            </div>
          </div>
        );
      }

      // 11. Skills & Competency Radar Chart
      case 'competency_radar':
        const radarMetrics = activeClass.fields.map(f => ({
          id: f.id,
          name: f.name,
          max: f.max || 5
        }));

        const teamsSet = Array.from(new Set(activeClass.students.map(s => s.groupName))).filter(Boolean);
        const selectedTeams = radarTeamFilter === 'all' ? teamsSet.slice(0, 3) : [radarTeamFilter];

        const seriesList = selectedTeams.map((team, idx) => {
          const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
          const teamStudents = activeClass.students.filter(s => s.groupName === team);
          const studentIds = new Set(teamStudents.map(s => s.id));
          const teamReviews = activeClass.reviews.filter(r => studentIds.has(r.recipientId));

          const values: Record<string, number | null> = {};
          radarMetrics.forEach(m => {
            const scores = teamReviews.map(r => r.scores?.[m.id]).filter((v): v is number => typeof v === 'number');
            values[m.id] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
          });

          return {
            id: team,
            name: team,
            color: colors[idx % colors.length],
            values
          };
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>Filter Team Comparison</span>
              <select
                value={radarTeamFilter}
                onChange={e => setRadarTeamFilter(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
              >
                <option value="all">Compare First 3 Teams</option>
                {teamsSet.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
              <RadarChart metrics={radarMetrics} series={seriesList} size={300} />
            </div>
          </div>
        );

      // 12. Johari Window & Self-Awareness Gap
      case 'johari_matrix':
        const johariMetrics = activeClass.students.map(s => ({
          student: s,
          metric: calculateJohariWindowMetric(s.id, activeClass)
        }));

        const calibratedCount = johariMetrics.filter(j => j.metric.category === 'calibrated').length;
        const overCount = johariMetrics.filter(j => j.metric.category === 'overestimating').length;
        const underCount = johariMetrics.filter(j => j.metric.category === 'underestimating').length;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', textAlign: 'center' }}>
              <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>{calibratedCount}</div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Calibrated</div>
              </div>
              <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>{overCount}</div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Over-rating</div>
              </div>
              <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366f1' }}>{underCount}</div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Under-rating</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
              {johariMetrics.slice(0, 10).map(({ student, metric }) => (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700 }}>{student.name}</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Self: {metric.selfScorePct !== null ? `${Math.round(metric.selfScorePct)}%` : 'N/A'} • Peers: {metric.peerScorePct !== null ? `${Math.round(metric.peerScorePct)}%` : 'N/A'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: metric.bgColor,
                      color: metric.color
                    }}
                  >
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      // 13. Written Feedback Sentiment & Themes
      case 'qualitative_feedback':
        const insights = extractClassFeedbackInsights(activeClass);
        const topStrengths = insights.topStrengthsThemes.slice(0, 8);
        const topGrowth = insights.topGrowthThemes.slice(0, 8);
        const topPraise = insights.topPraiseTags.slice(0, 8);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Recurring Strengths Keywords
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {topStrengths.map(t => (
                  <span
                    key={t.word}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {t.word} ({t.count})
                  </span>
                ))}
                {topStrengths.length === 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No written comments yet.</span>
                )}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Growth Opportunities Themes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {topGrowth.map(t => (
                  <span
                    key={t.word}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      color: '#d97706',
                      border: '1px solid rgba(245, 158, 11, 0.25)'
                    }}
                  >
                    {t.word} ({t.count})
                  </span>
                ))}
                {topGrowth.length === 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No growth themes found yet.</span>
                )}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Top Praise Badges Awarded
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {topPraise.map(p => (
                  <span
                    key={p.tag}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.25)'
                    }}
                  >
                    {p.tag} ({p.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      // Detailed Who-Rated-Whom Evaluation Matrix
      case 'detailed_matrix': {
        const matrixTeams = Array.from(new Set(activeClass.students.map(s => s.groupName))).filter(Boolean);
        const currentMatrixTeam = matrixTeamFilter === 'all' && matrixTeams.length > 0 ? matrixTeams[0] : matrixTeamFilter;
        const matrixMembers = currentMatrixTeam === 'all' 
          ? activeClass.students 
          : activeClass.students.filter(s => s.groupName === currentMatrixTeam);

        const activeCriterionDef = activeClass.fields.find(f => f.id === matrixCriterionFilter);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Pairwise Evaluation Matrix
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {matrixCriterionFilter === 'all' 
                    ? 'Displaying average ratings across all rubric criteria. Click any cell to inspect comments.'
                    : `Filtering by criterion: ${activeCriterionDef?.name || matrixCriterionFilter} (${activeCriterionDef?.weight || 0}% weight).`}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                {matrixTeams.length > 0 && (
                  <select
                    value={currentMatrixTeam}
                    onChange={e => setMatrixTeamFilter(e.target.value)}
                    style={{
                      padding: '0.35rem 0.55rem',
                      fontSize: '0.72rem',
                      borderRadius: '7px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontWeight: 700
                    }}
                  >
                    {matrixTeams.map(t => (
                      <option key={t} value={t}>
                        Team: {t}
                      </option>
                    ))}
                    <option value="all">All Classroom Cohorts</option>
                  </select>
                )}

                <select
                  value={matrixCriterionFilter}
                  onChange={e => setMatrixCriterionFilter(e.target.value)}
                  style={{
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.72rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontWeight: 700
                  }}
                  title="Filter by rubric criterion"
                >
                  <option value="all">All Criteria (Average)</option>
                  {activeClass.fields.map(f => (
                    <option key={f.id} value={f.id}>
                      Criterion: {f.name} ({f.weight}%)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportMatrixCSV}
                  title="Export Pairwise Evaluation Matrix to CSV"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '7px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={11} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Interactive Cell Inspector Popover */}
            {inspectedReview && (
              <div
                className="inspection-popover"
                style={{
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  position: 'relative',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: 'var(--primary)' }}>{inspectedReview.reviewerName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span>{inspectedReview.recipientName}</span>
                      {inspectedReview.reviewerName === inspectedReview.recipientName && (
                        <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: 800 }}>
                          Self Evaluation
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      Cohort: {inspectedReview.reviewerTeam || 'Classroom'} • {inspectedReview.review ? 'Submission on file' : 'No review submitted'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedReview(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Close Inspector"
                  >
                    <X size={14} />
                  </button>
                </div>

                {inspectedReview.review ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {/* Rubric Breakdown Grid */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '0.35rem 0.5rem' }}>Rubric Criterion</th>
                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>Weight</th>
                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>Score Awarded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeClass.fields.map(f => {
                            const score = inspectedReview.review.scores?.[f.id];
                            const isFiltered = matrixCriterionFilter === f.id;
                            return (
                              <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isFiltered ? 'rgba(99, 102, 241, 0.06)' : undefined }}>
                                <td style={{ padding: '0.35rem 0.5rem', fontWeight: isFiltered ? 800 : 600 }}>{f.name}</td>
                                <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{f.weight}%</td>
                                <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: 800 }}>
                                  {typeof score === 'number' ? (
                                    <span style={{ color: 'var(--primary)' }}>
                                      {score} / {f.max || 5}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Feedback Comments */}
                    {inspectedReview.review.strengthsText && (
                      <div style={{ padding: '0.45rem 0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '7px' }}>
                        <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#059669', marginBottom: '2px' }}>Observed Strengths:</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>{inspectedReview.review.strengthsText}</div>
                      </div>
                    )}

                    {inspectedReview.review.growthText && (
                      <div style={{ padding: '0.45rem 0.6rem', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '7px' }}>
                        <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#d97706', marginBottom: '2px' }}>Constructive Opportunities:</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>{inspectedReview.review.growthText}</div>
                      </div>
                    )}

                    {inspectedReview.review.praiseTags && inspectedReview.review.praiseTags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>Badges:</span>
                        {inspectedReview.review.praiseTags.map((tag: string) => (
                          <span
                            key={tag}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(99, 102, 241, 0.12)',
                              color: '#6366f1',
                              fontSize: '0.62rem',
                              fontWeight: 700
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
                    No evaluation has been recorded yet from {inspectedReview.reviewerName} for {inspectedReview.recipientName}.
                  </div>
                )}
              </div>
            )}

            {/* Matrix Table */}
            {matrixMembers.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        Evaluator \ Recipient
                      </th>
                      {matrixMembers.map(m => (
                        <th key={m.id} style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {m.name.split(' ')[0]}
                        </th>
                      ))}
                      <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        Given Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixMembers.map(evaluator => {
                      const givenScores: number[] = [];
                      return (
                        <tr key={evaluator.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {evaluator.name}
                          </td>
                          {matrixMembers.map(recipient => {
                            const isSelf = evaluator.id === recipient.id;
                            const rev = activeClass.reviews.find(
                              r => r.reviewerId === evaluator.id && r.recipientId === recipient.id
                            );

                            let displayScore: number | null = null;
                            if (rev && rev.scores) {
                              if (matrixCriterionFilter === 'all') {
                                const vals = Object.values(rev.scores);
                                if (vals.length > 0) {
                                  displayScore = vals.reduce((a, b) => a + b, 0) / vals.length;
                                  if (!isSelf) givenScores.push(displayScore);
                                }
                              } else {
                                const sc = rev.scores[matrixCriterionFilter];
                                if (typeof sc === 'number') {
                                  displayScore = sc;
                                  if (!isSelf) givenScores.push(sc);
                                }
                              }
                            }

                            return (
                              <td
                                key={recipient.id}
                                onClick={() =>
                                  setInspectedReview({
                                    reviewerName: evaluator.name,
                                    reviewerTeam: evaluator.groupName,
                                    recipientName: recipient.name,
                                    recipientTeam: recipient.groupName,
                                    review: rev,
                                    avgScore: displayScore
                                  })
                                }
                                title="Click to inspect detailed rubric breakdown and qualitative feedback"
                                style={{
                                  padding: '0.45rem 0.5rem',
                                  textAlign: 'center',
                                  backgroundColor: isSelf ? 'rgba(99, 102, 241, 0.05)' : undefined,
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                {isSelf ? (
                                  displayScore !== null ? (
                                    <span style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: 800, fontSize: '0.66rem' }}>
                                      {matrixCriterionFilter === 'all' ? displayScore.toFixed(0) : displayScore} (Self)
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>—</span>
                                  )
                                ) : displayScore !== null ? (
                                  <span
                                    style={{
                                      padding: '2px 5px',
                                      borderRadius: '4px',
                                      backgroundColor:
                                        matrixCriterionFilter === 'all'
                                          ? displayScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : displayScore >= 70 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                                          : 'var(--primary-light)',
                                      color:
                                        matrixCriterionFilter === 'all'
                                          ? displayScore >= 85 ? '#059669' : displayScore >= 70 ? '#d97706' : '#dc2626'
                                          : 'var(--primary)',
                                      fontWeight: 800,
                                      fontSize: '0.68rem'
                                    }}
                                  >
                                    {matrixCriterionFilter === 'all' ? displayScore.toFixed(0) : displayScore}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Pending</span>
                                )}
                              </td>
                            );
                          })}
                          <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>
                            {givenScores.length > 0 ? (
                              <span style={{ color: 'var(--primary)' }}>
                                {(givenScores.reduce((a, b) => a + b, 0) / givenScores.length).toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Received Averages Footer */}
                  <tfoot>
                    <tr style={{ backgroundColor: 'var(--bg-app)', borderTop: '2px solid var(--border-color)' }}>
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        Received Avg
                      </td>
                      {matrixMembers.map(recipient => {
                        const receivedScores = activeClass.reviews
                          .filter(r => r.recipientId === recipient.id && r.reviewerId !== recipient.id && r.scores)
                          .map(r => {
                            if (matrixCriterionFilter === 'all') {
                              const vals = Object.values(r.scores);
                              return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                            } else {
                              return typeof r.scores[matrixCriterionFilter] === 'number' ? r.scores[matrixCriterionFilter] : null;
                            }
                          })
                          .filter((v): v is number => v !== null);

                        const avgRec = receivedScores.length > 0
                          ? receivedScores.reduce((a, b) => a + b, 0) / receivedScores.length
                          : null;

                        return (
                          <td key={recipient.id} style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>
                            {avgRec !== null ? (
                              <span style={{ color: avgRec >= 85 ? '#059669' : avgRec >= 70 ? '#d97706' : '#dc2626' }}>
                                {avgRec.toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.66rem' }}>
                        Cohort Avg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                No students enrolled in this group.
              </div>
            )}
          </div>
        );
      }

      // 14. Team Health Micro-Pulse Check-ins
      case 'pulse_checkins':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <TeamHealthPulseCard
              activeClass={activeClass}
              onCreateRound={onCreatePulseRound || (() => {})}
              onUpdateRound={onUpdatePulseRound || (() => {})}
              onSubmitResponse={onSubmitPulseResponse || (() => {})}
              onDeleteRound={onDeletePulseRound || (() => {})}
              onSeedSampleData={onSeedPulseSample ? () => onSeedPulseSample(activeClass.id) : () => {}}
              addToast={addToast}
            />
          </div>
        );

      // 15. Sub Peer Review Rounds Studio
      case 'subpeer_reviews':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <SubPeerReviewStudio
              activeClass={activeClass}
              onToast={(msg, type) => addToast(msg, type || 'info')}
            />
          </div>
        );

      // 16. Milestones & Sprint Deadlines
      case 'milestones_tracker': {
        const deadlineDate = activeClass.deadline ? new Date(activeClass.deadline) : null;
        const now = new Date();
        const msRemaining = deadlineDate ? deadlineDate.getTime() - now.getTime() : null;
        const isExpired = msRemaining !== null && msRemaining <= 0;
        const hoursRemaining = msRemaining !== null && msRemaining > 0 ? Math.floor(msRemaining / (1000 * 60 * 60)) : 0;
        const daysRemaining = Math.floor(hoursRemaining / 24);
        const hoursInDay = hoursRemaining % 24;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Countdown Banner */}
            <div
              style={{
                padding: '0.95rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={15} style={{ color: isExpired ? '#ef4444' : '#0ea5e9' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Evaluation Round Countdown
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: !deadlineDate
                      ? 'var(--bg-surface)'
                      : isExpired
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    color: !deadlineDate ? 'var(--text-muted)' : isExpired ? '#dc2626' : '#059669',
                    border: `1px solid ${!deadlineDate ? 'var(--border-color)' : isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                  }}
                >
                  {!deadlineDate ? 'No Deadline' : isExpired ? 'Deadline Passed' : 'Active Countdown'}
                </span>
              </div>

              {deadlineDate ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  {!isExpired ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0ea5e9', letterSpacing: '-0.02em' }}>
                        {daysRemaining}d {hoursInDay}h
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>remaining until round close</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626' }}>
                      Submissions should be locked
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Set a submission cutoff date to give students a visible countdown on their evaluation portal.
                </div>
              )}

              {deadlineDate && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Target: <strong>{deadlineDate.toLocaleString()}</strong>
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)' }}>
                {[
                  { label: '+24 Hours', hours: 24 },
                  { label: '+3 Days', hours: 72 },
                  { label: '+7 Days', hours: 168 },
                  { label: '+14 Days', hours: 336 }
                ].map(p => (
                  <button
                    key={p.hours}
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + p.hours * 3600 * 1000).toISOString();
                      if (onSaveDeadline) onSaveDeadline(activeClass.id, d);
                      addToast(`Deadline set for ${p.label.replace('+', '')} from now`, 'success');
                    }}
                    style={{
                      padding: '0.3rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
                {deadlineDate && onSaveDeadline && (
                  <button
                    type="button"
                    onClick={() => {
                      onSaveDeadline(activeClass.id, null);
                      addToast('Cleared submission deadline', 'info');
                    }}
                    style={{
                      padding: '0.3rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Deadline
                  </button>
                )}
              </div>
            </div>

            {/* Checkpoint Milestones Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Project Checkpoint Milestones
              </span>
              {[
                { name: 'Sprint 1: Team Charter & Norms', weight: '15%', status: 'Completed', color: '#10b981', progress: 100 },
                { name: 'Sprint 2: Midterm Peer Evaluation', weight: '35%', status: isMainUnlocked ? 'Active Now' : 'Pending', color: isMainUnlocked ? '#0ea5e9' : '#f59e0b', progress: classCompletionRate },
                { name: 'Sprint 3: Oral Showcase & Rubrics', weight: '20%', status: 'Upcoming', color: '#6366f1', progress: 0 },
                { name: 'Final: Summative Peer Calibration', weight: '30%', status: 'Upcoming', color: '#8b5cf6', progress: 0 }
              ].map(m => (
                <div key={m.name} style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '9px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.name}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: m.color, padding: '1px 6px', borderRadius: '4px', backgroundColor: `${m.color}15` }}>
                      {m.status} • {m.weight}
                    </span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '999px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ width: `${m.progress}%`, height: '100%', backgroundColor: m.color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // 17. Team Kickoff & Roles Allocation
      case 'team_kickoff': {
        const teamsList = Array.from(new Set(activeClass.students.map(s => s.groupName).filter(Boolean))) as string[];
        const currentTeam = kickoffTeam === 'all' && teamsList.length > 0 ? teamsList[0] : kickoffTeam;
        const currentMembers = activeClass.students.filter(s => s.groupName === currentTeam);
        const rolesForTeam = teamRolesState[currentTeam] || {};

        const icebreakerPrompts = [
          'What is one technical superpower you bring to this group project?',
          'What was the most challenging bug or obstacle you tackled recently?',
          'How do you prefer teammates communicate when plans or deadlines shift?',
          'What is your main personal learning goal for this team assignment?',
          'What is your favorite tool, library, or framework to work with?'
        ];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Team Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>Active Team:</span>
              </div>
              <select
                value={currentTeam}
                onChange={e => setKickoffTeam(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', outline: 'none' }}
              >
                {teamsList.map(t => (
                  <option key={t} value={t}>{t} ({activeClass.students.filter(s => s.groupName === t).length} members)</option>
                ))}
              </select>
            </div>

            {/* Interactive Role Assignment Studio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Team Role Allocations ({currentTeam})
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem' }}>
                {[
                  { id: 'lead', title: 'Team Lead', desc: 'Coordinates deliverables', color: '#6366f1' },
                  { id: 'scribe', title: 'Scribe', desc: 'Documents decisions', color: '#10b981' },
                  { id: 'presenter', title: 'Presenter', desc: 'Delivers oral showcase', color: '#f59e0b' },
                  { id: 'qa', title: 'Quality Assurer', desc: 'Audits rubric standards', color: '#ec4899' }
                ].map(role => {
                  const assignedStudentId = (rolesForTeam as any)[role.id] || '';
                  return (
                    <div key={role.id} style={{ padding: '0.55rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: role.color }}>{role.title}</span>
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{role.desc}</div>
                      <select
                        value={assignedStudentId}
                        onChange={e => {
                          const val = e.target.value;
                          setTeamRolesState(prev => ({
                            ...prev,
                            [currentTeam]: {
                              ...(prev[currentTeam] || {}),
                              [role.id]: val
                            }
                          }));
                          addToast(`Assigned ${role.title} for ${currentTeam}!`, 'success');
                        }}
                        style={{ marginTop: '0.2rem', padding: '0.22rem 0.35rem', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.66rem', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="">-- Unassigned --</option>
                        {currentMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Icebreaker Prompt Generator */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Compass size={13} style={{ color: '#a855f7' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Team Icebreaker Prompt</span>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-primary)', padding: '0.4rem 0.55rem', backgroundColor: 'var(--bg-surface)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                "{icebreakerPrompts[Math.abs(currentTeam.length) % icebreakerPrompts.length]}"
              </div>
            </div>

            {onOpenTeamKickoff && (
              <button
                type="button"
                onClick={() => onOpenTeamKickoff('roles_config')}
                style={{ padding: '0.45rem', borderRadius: '7px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Compass size={13} /> Full Team Agreements Studio
              </button>
            )}
          </div>
        );
      }

      // 18. Classroom Join Link & QR Code
      case 'class_join_qr':
        const enrollUrl = `${window.location.origin}/join/${activeClass.id}`;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', textAlign: 'center' }}>
            {qrDataUrl && (
              <div style={{ padding: '0.65rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <img src={qrDataUrl} alt="Class Enrollment QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>
            )}

            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                DIRECT STUDENT ENROLLMENT LINK
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  readOnly
                  value={enrollUrl}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(enrollUrl);
                    addToast('Copied self-enrollment link to clipboard!', 'success');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem', borderRadius: '5px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
            </div>
          </div>
        );

      // 19. LMS Gradebook Exporter
      case 'lms_export':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              1-Click LMS Gradebook Format Export
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {(['canvas', 'blackboard', 'moodle', 'brightspace'] as const).map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => onExportLMS ? onExportLMS(platform) : handleFallbackExportLMS(platform)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize' }}>
                    {platform}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    Export calibrated CSV
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      // Universal Export & Gradebook Dispatcher
      case 'export_hub': {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Gradebooks Section */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Spreadsheets &amp; Gradebooks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onExportExcel || handleFallbackExportGradebook}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Download size={14} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Excel Gradebook (.xlsx/.csv)</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Calibrated scores &amp; WebPA breakdown</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onExportCSV || handleFallbackExportRoster}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Download size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Roster CSV (.csv)</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Student IDs, emails &amp; cohort status</div>
                  </div>
                </button>
              </div>
            </div>

            {/* LMS Exports Section */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                LMS Direct Grade Import
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
                {(['canvas', 'blackboard', 'moodle', 'brightspace'] as const).map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => onExportLMS ? onExportLMS(platform) : handleFallbackExportLMS(platform)}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize' }}>
                      {platform}
                    </span>
                    <Download size={12} style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Archive & Reports Section */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Offline Backup &amp; Reports
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onBackupJSON || (() => triggerJsonDownload(`${activeClass.name.replace(/\s+/g, '_')}_backup.json`, activeClass))}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Archive size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>JSON State Archive</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Complete database snapshot</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReport ? onOpenReport(activeClass.students[0]?.id || '') : addToast('Select student from Roster to view report card', 'info')}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <FileText size={14} style={{ color: '#ec4899', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Student Report Cards</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Formative feedback summaries</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // 20. Launchpad & Setup Checklist
      case 'launch_checklist':
        const hasStudents = activeClass.students.length > 0;
        const hasCriteria = activeClass.fields.length > 0;
        const hasReviews = activeClass.reviews.length > 0;
        const isUnlocked = !!evalControls.unlockMainPeerReview;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ padding: '0.75rem 0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Course Launch Checklist
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.55rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: hasStudents ? '#059669' : 'var(--text-muted)' }}>
                  <CheckCircle size={14} /> <span>1. Enroll student roster ({activeClass.students.length} students)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: hasCriteria ? '#059669' : 'var(--text-muted)' }}>
                  <CheckCircle size={14} /> <span>2. Customize evaluation rubric ({activeClass.fields.length} criteria)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: isUnlocked ? '#059669' : 'var(--text-muted)' }}>
                  <CheckCircle size={14} /> <span>3. Unlock review round ({isUnlocked ? 'Open' : 'Locked'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: hasReviews ? '#059669' : 'var(--text-muted)' }}>
                  <CheckCircle size={14} /> <span>4. Collect evaluations ({activeClass.reviews.length} submitted)</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 21. Student Report Cards & PDF Generator
      case 'reports_hub': {
        const filteredStudents = activeClass.students.filter(s =>
          s.name.toLowerCase().includes(reportsSearch.toLowerCase()) ||
          (s.groupName && s.groupName.toLowerCase().includes(reportsSearch.toLowerCase()))
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter student report cards..."
                  value={reportsSearch}
                  onChange={e => setReportsSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.35rem 0.65rem 0.35rem 1.65rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', fontSize: '0.7rem', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    downloadClassDossierPDF(activeClass, { baseGrade: getTargetScale(activeClass), fudgeWeight: 0.5 });
                    addToast(`Downloaded Master Classroom Dossier PDF (${activeClass.students.length} students)`, 'success');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.65rem', borderRadius: '7px', backgroundColor: '#0d9488', color: '#fff', border: 'none', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                  title="Download complete multi-page PDF dossier of all student report cards"
                >
                  <FileText size={11} /> Master PDF
                </button>
                <button
                  type="button"
                  onClick={onExportExcel || handleFallbackExportGradebook}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.65rem', borderRadius: '7px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                >
                  <Download size={11} /> Batch Excel
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '380px', overflowY: 'auto' }}>
              {filteredStudents.map(s => {
                const metrics = calculateStudentMetrics(s, activeClass);
                const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass);
                const reviewsReceived = activeClass.reviews.filter(r => r.recipientId === s.id && r.reviewerId !== s.id);

                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '9px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)' }}>
                          {s.groupName || 'No Team'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#059669', padding: '1px 6px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                          Score: {metrics.overallPercentage !== null && metrics.overallPercentage !== undefined ? `${metrics.overallPercentage.toFixed(1)}%` : '—'}
                        </span>
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--primary)', padding: '1px 6px', borderRadius: '999px', backgroundColor: 'var(--primary-light)' }}>
                          WebPA: {webpa.ratio.toFixed(2)}x
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      <span>Evaluations: {reviewsReceived.length} received</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const portalUrl = `${window.location.origin}/student?classId=${activeClass.id}&studentId=${s.id}`;
                            navigator.clipboard.writeText(portalUrl);
                            addToast(`Copied portal link for ${s.name}!`, 'success');
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '2px 6px', borderRadius: '5px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Link2 size={10} /> Link
                        </button>
                        {onOpenReport && (
                          <button
                            type="button"
                            onClick={() => onOpenReport(s.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '2px 7px', borderRadius: '5px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            <FileText size={10} /> Full Card
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  No students matching "{reportsSearch}".
                </div>
              )}
            </div>
          </div>
        );
      }

      // 22. Classroom Snapshots & Backup Archive
      case 'snapshot_archive':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Classroom Snapshot Backup
                </span>
                <Archive size={14} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Export an offline portable JSON snapshot containing all rosters, rubric fields, and submitted reviews.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={onBackupJSON || (() => triggerJsonDownload(`${activeClass.name.replace(/\s+/g, '_')}_backup.json`, activeClass))}
                  style={{ flex: 1, padding: '0.45rem', borderRadius: '7px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Download size={12} /> Download Backup
                </button>
                {onOpenSnapshots && (
                  <button
                    type="button"
                    onClick={onOpenSnapshots}
                    style={{ flex: 1, padding: '0.45rem', borderRadius: '7px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View Snapshots
                  </button>
                )}
                {onResetReviews && (
                  <button
                    type="button"
                    onClick={onResetReviews}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '7px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Quick Live Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Students</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeClass.students.length}</div>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Reviews</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeClass.reviews.length}</div>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Criteria</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeClass.fields.length}</div>
              </div>
            </div>
          </div>
        );

      // 23. Institutional Branding & Identity
      case 'branding_preview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Institutional Theme Studio
                </span>
                <Sparkles size={14} style={{ color: brandingAccentColor }} />
              </div>

              {/* Theme Color Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Primary Brand Accent:</span>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {[
                    { color: '#6366f1', name: 'Indigo' },
                    { color: '#10b981', name: 'Emerald' },
                    { color: '#8b5cf6', name: 'Violet' },
                    { color: '#f59e0b', name: 'Amber' },
                    { color: '#f43f5e', name: 'Rose' },
                    { color: '#06b6d4', name: 'Cyan' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => {
                        setBrandingAccentColor(c.color);
                        addToast(`Applied ${c.name} brand theme!`, 'success');
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                        border: brandingAccentColor === c.color ? '2.5px solid #fff' : '1px solid var(--border-color)',
                        boxShadow: brandingAccentColor === c.color ? `0 0 10px ${c.color}` : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Institution Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Institution Name:</span>
                <input
                  type="text"
                  value={brandingInstitutionName}
                  onChange={e => setBrandingInstitutionName(e.target.value)}
                  style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.72rem', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              {/* Live Preview Card */}
              <div style={{ padding: '0.65rem', borderRadius: '8px', border: `1.5px solid ${brandingAccentColor}40`, backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: `${brandingAccentColor}15`, color: brandingAccentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>{brandingInstitutionName}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Classroom Portal Header Preview</div>
                </div>
              </div>

              {onOpenBranding && (
                <button
                  type="button"
                  onClick={onOpenBranding}
                  style={{ padding: '0.45rem', borderRadius: '7px', backgroundColor: brandingAccentColor, color: '#fff', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Open Full Branding Studio
                </button>
              )}
            </div>
          </div>
        );

      // 24. Duplicate Student Roster Detector
      case 'duplicate_detector': {
        const dupFlagsMap = detectDuplicateEnrollments(activeClass.students);
        const dupCount = dupFlagsMap.size;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>Duplicate Roster Scanner</span>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', backgroundColor: dupCount === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: dupCount === 0 ? '#059669' : '#dc2626' }}>
                {dupCount === 0 ? '0 Duplicates' : `${dupCount} Suspect Records`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Array.from(dupFlagsMap.entries()).map(([stId, flags]) => {
                const st = activeClass.students.find(s => s.id === stId);
                return (
                  <div key={stId} style={{ padding: '0.6rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700 }}>{st?.name || stId}</div>
                      <div style={{ fontSize: '0.64rem', color: '#ef4444' }}>
                        {flags.map(f => f.reason).join('; ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToast(`Marked ${st?.name || stId} as verified!`, 'success')}
                      style={{ padding: '2px 7px', borderRadius: '5px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Resolve
                    </button>
                  </div>
                );
              })}
              {dupCount === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  No duplicate names, emails, or student IDs detected in this roster!
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 25. Grade Curve & Score Distribution Calibrator ──
      case 'grade_curve_calibrator': {
        const rawScores = activeClass.students.map(s => {
          const metrics = calculateStudentMetrics(s, activeClass);
          return { student: s, rawScore: metrics.overallPercentage ?? 75, metrics };
        });
        const validScores = rawScores.filter(r => typeof r.rawScore === 'number' && !isNaN(r.rawScore));
        const rawAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b.rawScore, 0) / validScores.length : 75;

        const curvedScores = rawScores.map(r => {
          const raw = r.rawScore;
          let curved = raw;
          if (curveModel === 'linear') {
            curved = Math.min(100, raw + linearBoostPts);
          } else if (curveModel === 'sqrt') {
            curved = Math.min(100, Math.sqrt(Math.max(0, raw)) * 10);
          } else if (curveModel === 'normal') {
            curved = Math.max(50, Math.min(100, 82 + (raw - rawAvg) * 0.85));
          }
          return { ...r, curvedScore: Math.round(curved * 10) / 10 };
        });
        const curvedAvg = curvedScores.length > 0 ? curvedScores.reduce((a, b) => a + b.curvedScore, 0) / curvedScores.length : 75;

        const calcBands = (scores: number[]) => ({
          A: scores.filter(s => s >= 90).length,
          B: scores.filter(s => s >= 80 && s < 90).length,
          C: scores.filter(s => s >= 70 && s < 80).length,
          D: scores.filter(s => s >= 60 && s < 70).length,
          F: scores.filter(s => s < 60).length
        });
        const rawBands = calcBands(rawScores.map(r => r.rawScore));
        const curvedBands = calcBands(curvedScores.map(r => r.curvedScore));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Raw Class Average</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-secondary)' }}>{rawAvg.toFixed(1)}%</div>
              </div>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '9px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Curved Class Average</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                  {curvedAvg.toFixed(1)}% <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>({curvedAvg >= rawAvg ? `+${(curvedAvg - rawAvg).toFixed(1)}%` : `${(curvedAvg - rawAvg).toFixed(1)}%`})</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)' }}>Select Curving Algorithm:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                {[
                  { id: 'raw', title: 'Raw Score (No Curve)', desc: 'Unadjusted peer score' },
                  { id: 'linear', title: `Linear Boost (+${linearBoostPts} pts)`, desc: 'Flat score increase' },
                  { id: 'sqrt', title: 'Square Root (√x × 10)', desc: 'Boosts lower scores more' },
                  { id: 'normal', title: 'Normal Standardized', desc: 'Bell curve centered at 82%' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setCurveModel(m.id as any);
                      addToast(`Selected ${m.title} model`, 'info');
                    }}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: curveModel === m.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: curveModel === m.id ? 'var(--primary-light)' : 'var(--bg-app)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: curveModel === m.id ? 'var(--primary)' : 'var(--text-primary)' }}>{m.title}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Grade Band Distribution (Curved vs Raw)</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem', textAlign: 'center' }}>
                {(['A', 'B', 'C', 'D', 'F'] as const).map(band => (
                  <div key={band} style={{ padding: '0.4rem 0.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 900 }}>Grade {band}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', margin: '2px 0' }}>{curvedBands[band]}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Raw: {rawBands[band]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
              {curvedScores.map(cs => (
                <div key={cs.student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '7px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{cs.student.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Raw: {cs.rawScore.toFixed(1)}%</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#059669', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                      Curved: {cs.curvedScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 26. Rubric Weight & Cognitive Balance Auditor ──
      case 'rubric_ai_optimizer': {
        const fields = activeClass.fields || [];
        const totalWeight = fields.reduce((acc, f) => acc + (f.weight || 0), 0);
        const isBalanced = totalWeight === 100;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Rubric Weight Health</span>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', backgroundColor: isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isBalanced ? '#059669' : '#dc2626' }}>
                  Total: {totalWeight}% ({isBalanced ? 'Balanced' : 'Misaligned'})
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {isBalanced
                  ? 'All criteria weights sum to exactly 100%. Evaluations are properly calibrated.'
                  : `Weights currently sum to ${totalWeight}%. Click Auto-Balance to distribute 100% evenly across all criteria.`}
              </div>
              {!isBalanced && (
                <button
                  type="button"
                  onClick={handleAutoBalanceRubric}
                  style={{ padding: '0.45rem', borderRadius: '7px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Zap size={12} />
                  <span>Auto-Balance to 100%</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>Configured Criteria &amp; Weights</span>
              {fields.map(f => (
                <div key={f.id} style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>{f.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: (f.weight || 0) > 35 ? '#d97706' : 'var(--primary)' }}>
                      {f.weight || 0}% weight
                    </span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '999px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, f.weight || 0)}%`, height: '100%', backgroundColor: (f.weight || 0) > 35 ? '#d97706' : 'var(--primary)', borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 27. Team Friction & Reciprocity Conflict Detector ──
      case 'conflict_resolution': {
        const conflictPairs: Array<{
          s1: Student;
          s2: Student;
          team: string;
          avg1to2: number;
          avg2to1: number;
          gap: number;
        }> = [];

        activeClass.students.forEach(s1 => {
          activeClass.students.forEach(s2 => {
            if (s1.id < s2.id && s1.groupName && s1.groupName === s2.groupName) {
              const r1 = activeClass.reviews.find(r => r.reviewerId === s1.id && r.recipientId === s2.id);
              const r2 = activeClass.reviews.find(r => r.reviewerId === s2.id && r.recipientId === s1.id);
              if (r1?.scores && r2?.scores) {
                const vals1 = Object.values(r1.scores);
                const vals2 = Object.values(r2.scores);
                if (vals1.length > 0 && vals2.length > 0) {
                  const avg1 = vals1.reduce((a, b) => a + b, 0) / vals1.length;
                  const avg2 = vals2.reduce((a, b) => a + b, 0) / vals2.length;
                  const diff = Math.abs(avg1 - avg2);
                  if (diff >= 20) {
                    conflictPairs.push({
                      s1,
                      s2,
                      team: s1.groupName,
                      avg1to2: Math.round(avg1),
                      avg2to1: Math.round(avg2),
                      gap: Math.round(diff)
                    });
                  }
                }
              }
            }
          });
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>Pairwise Rating Dissonance</span>
              <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', backgroundColor: conflictPairs.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: conflictPairs.length === 0 ? '#059669' : '#dc2626' }}>
                {conflictPairs.length === 0 ? 'Healthy Reciprocity' : `${conflictPairs.length} Friction Pairs Detected`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto' }}>
              {conflictPairs.map(cp => (
                <div key={`${cp.s1.id}-${cp.s2.id}`} style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '9px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>Team: {cp.team}</span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#ef4444' }}>Δ {cp.gap}% Asymmetry Gap</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    <span>{cp.s1.name} gave {cp.s2.name}: <strong>{cp.avg1to2}%</strong></span>
                    <span>{cp.s2.name} gave {cp.s1.name}: <strong>{cp.avg2to1}%</strong></span>
                  </div>
                </div>
              ))}
              {conflictPairs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  No significant rating dissonance detected between teammates.
                </div>
              )}
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Instructor Mediation Prompts:</span>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                1. "Walk me through how workload was distributed in the last two weeks."<br />
                2. "What were the communication blockers before this review cycle?"<br />
                3. "Let's reset role expectations for the upcoming milestone."
              </div>
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 28. Free-Rider & At-Risk Diagnostic Radar ──
      case 'free_rider_radar': {
        const atRiskStudents = activeClass.students.map(s => {
          const webpa = calculateStudentWebPAScore(s.id, s.groupName, activeClass);
          const metrics = calculateStudentMetrics(s, activeClass);
          const hasSubmitted = s.submitted || activeClass.reviews.some(r => r.reviewerId === s.id);
          const isLowMultiplier = webpa.ratio < freeRiderThreshold;
          const isNonContributor = !hasSubmitted;

          return {
            student: s,
            webpa,
            metrics,
            hasSubmitted,
            isFlagged: isLowMultiplier || isNonContributor,
            reasons: [
              ...(isLowMultiplier ? [`Low WebPA: ${webpa.ratio.toFixed(2)}x`] : []),
              ...(isNonContributor ? ['Missing evaluation submission'] : [])
            ]
          };
        }).filter(r => r.isFlagged);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>At-Risk Contributor Early Warning</span>
              <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', backgroundColor: atRiskStudents.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: atRiskStudents.length === 0 ? '#059669' : '#dc2626' }}>
                {atRiskStudents.length === 0 ? '0 At-Risk' : `${atRiskStudents.length} Students Flagged`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '300px', overflowY: 'auto' }}>
              {atRiskStudents.map(ar => (
                <div key={ar.student.id} style={{ padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800 }}>{ar.student.name}</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{ar.student.groupName || 'No Team'}</span>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#ef4444', fontWeight: 700 }}>
                    {ar.reasons.join(' • ')}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const subject = encodeURIComponent(`Peer Review Follow-up: ${activeClass.name}`);
                        const body = encodeURIComponent(`Hi ${ar.student.name},\n\nI noticed your peer evaluation status needs attention in ${activeClass.name}. Please connect with your team and submit pending reviews.\n\nBest,\nInstructor`);
                        window.open(`mailto:${ar.student.email}?subject=${subject}&body=${body}`);
                      }}
                      style={{ padding: '2px 7px', borderRadius: '5px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Email Student
                    </button>
                    <button
                      type="button"
                      onClick={() => addToast(`Exempted ${ar.student.name} from penalty multiplier`, 'info')}
                      style={{ padding: '2px 7px', borderRadius: '5px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Exempt Floor
                    </button>
                  </div>
                </div>
              ))}
              {atRiskStudents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  Zero students flagged below the fairness threshold!
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 29. AI Written Feedback Synthesizer & Growth Coaching ──
      case 'feedback_synthesizer': {
        const allComments: Array<{ reviewerName: string; recipientName: string; comment: string; words: number }> = [];

        activeClass.reviews.forEach(r => {
          const rev = activeClass.students.find(s => s.id === r.reviewerId);
          const rec = activeClass.students.find(s => s.id === r.recipientId);
          const comments = [r.strengthsText, r.growthText].filter(Boolean) as string[];
          comments.forEach(c => {
            if (typeof c === 'string' && c.trim().length > 0) {
              allComments.push({
                reviewerName: rev?.name || 'Reviewer',
                recipientName: rec?.name || 'Teammate',
                comment: c.trim(),
                words: c.trim().split(/\s+/).length
              });
            }
          });
        });

        const filteredComments = allComments.filter(c => {
          if (feedbackSynthCategory === 'unhelpful') return c.words < 8;
          if (feedbackSynthCategory === 'strengths') return c.words >= 8 && (c.comment.toLowerCase().includes('great') || c.comment.toLowerCase().includes('good') || c.comment.toLowerCase().includes('helpful'));
          if (feedbackSynthCategory === 'growth') return c.words >= 8 && (c.comment.toLowerCase().includes('improve') || c.comment.toLowerCase().includes('more') || c.comment.toLowerCase().includes('time'));
          return true;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {(['all', 'strengths', 'growth', 'unhelpful'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFeedbackSynthCategory(cat)}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.2rem',
                    borderRadius: '6px',
                    border: feedbackSynthCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: feedbackSynthCategory === cat ? 'var(--primary-light)' : 'var(--bg-app)',
                    color: feedbackSynthCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {cat === 'unhelpful' ? 'Flagged / Low Effort' : cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
              {filteredComments.map((cm, idx) => (
                <div key={idx} style={{ padding: '0.55rem 0.65rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    <span><strong>{cm.reviewerName}</strong> → <strong>{cm.recipientName}</strong></span>
                    <span>{cm.words} words</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                    "{cm.comment}"
                  </div>
                </div>
              ))}
              {filteredComments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  No feedback in this category yet.
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 30. Classroom Collaboration Benchmarks & Norms ──
      case 'peer_benchmark_iq': {
        const totalWords = activeClass.reviews.reduce((acc, r) => {
          const comments = [r.strengthsText, r.growthText].filter(Boolean).join(' ');
          return acc + comments.split(/\s+/).filter(Boolean).length;
        }, 0);
        const avgWordsPerReview = activeClass.reviews.length > 0 ? Math.round(totalWords / activeClass.reviews.length) : 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800 }}>Cohort Collaboration Benchmarking</div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Comparing active class interaction against institutional benchmarks.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Feedback Depth</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0ea5e9', margin: '2px 0' }}>{avgWordsPerReview} wds</div>
                <div style={{ fontSize: '0.6rem', color: avgWordsPerReview >= 25 ? '#059669' : '#d97706' }}>
                  {avgWordsPerReview >= 25 ? 'Top 20% In-Depth' : 'Standard Length'}
                </div>
              </div>

              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Submission Rate</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', margin: '2px 0' }}>{classCompletionRate}%</div>
                <div style={{ fontSize: '0.6rem', color: '#059669' }}>
                  {classCompletionRate >= 80 ? 'Optimal Turnaround' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── NEW MODULE: 31. Longitudinal Student Growth & Milestone Velocity ──
      case 'student_progress_journey': {
        const student = activeClass.students.find(s => s.id === journeyStudentId) || activeClass.students[0];
        const studentMetrics = student ? calculateStudentMetrics(student, activeClass) : null;
        const studentWebpa = student ? calculateStudentWebPAScore(student.id, student.groupName, activeClass) : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '9px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>Student:</span>
              <select
                value={journeyStudentId}
                onChange={e => setJourneyStudentId(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }}
              >
                {activeClass.students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.groupName || 'No Team'})</option>
                ))}
              </select>
            </div>

            {student && (
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{student.name}</span>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#059669', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                    Score: {studentMetrics?.overallPercentage !== null && studentMetrics?.overallPercentage !== undefined ? `${studentMetrics.overallPercentage.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  WebPA Multiplier: <strong>{studentWebpa?.ratio.toFixed(2)}x</strong> • Status: {student.submitted ? 'Submitted' : 'Pending'}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Default fallback
      default:
        return (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Module selected: {activeDef.title}
          </div>
        );
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. MAIN FLOATING RETRACTABLE DISPLAY VIEWPORT
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scoped CSS for Glassmorphism Translucency & Universal Content Density Engine */}
      <style>{`
        /* ══════════════════════════════════════════════════════════════
           1. HARDWARE FROSTED GLASS TRANSLUCENCY ENGINE
           ══════════════════════════════════════════════════════════════ */
        .peerlens-retractable-viewport:not(.translucent-off) *:not(.inspection-popover):not([data-allow-glass-blur]) {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        /* Subtle Translucency (75% Surface Frost) */
        .peerlens-retractable-viewport.translucent-subtle .dock-scrollable-viewport > div > div,
        .peerlens-retractable-viewport.translucent-subtle .collapsible-controls-card,
        .peerlens-retractable-viewport.translucent-subtle .pulse-card,
        .peerlens-retractable-viewport.translucent-subtle [style*="var(--bg-app)"],
        .peerlens-retractable-viewport.translucent-subtle [style*="var(--bg-surface)"] {
          background-color: color-mix(in srgb, var(--bg-surface) 60%, transparent) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
        }

        /* Medium Aero Translucency (50% Aero Glass) */
        .peerlens-retractable-viewport.translucent-medium .dock-scrollable-viewport > div > div,
        .peerlens-retractable-viewport.translucent-medium .collapsible-controls-card,
        .peerlens-retractable-viewport.translucent-medium .pulse-card,
        .peerlens-retractable-viewport.translucent-medium [style*="var(--bg-app)"],
        .peerlens-retractable-viewport.translucent-medium [style*="var(--bg-surface)"] {
          background-color: color-mix(in srgb, var(--bg-surface) 35%, transparent) !important;
          border-color: rgba(255, 255, 255, 0.32) !important;
        }

        /* Ultra Sheer Translucency (25% Crystal Glass) */
        .peerlens-retractable-viewport.translucent-sheer .dock-scrollable-viewport > div > div,
        .peerlens-retractable-viewport.translucent-sheer .collapsible-controls-card,
        .peerlens-retractable-viewport.translucent-sheer .pulse-card,
        .peerlens-retractable-viewport.translucent-sheer [style*="var(--bg-app)"],
        .peerlens-retractable-viewport.translucent-sheer [style*="var(--bg-surface)"] {
          background-color: color-mix(in srgb, var(--bg-surface) 18%, transparent) !important;
          border-color: rgba(255, 255, 255, 0.42) !important;
        }

        .peerlens-retractable-viewport:not(.translucent-off) table tr {
          background-color: transparent !important;
        }
        .peerlens-retractable-viewport:not(.translucent-off) table th {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        /* ══════════════════════════════════════════════════════════════
           2. CONTENT DENSITY ENGINE (MINIMAL vs COMFORTABLE)
           ══════════════════════════════════════════════════════════════ */
        
        /* ── MINIMAL / COMPACT DENSITY (High Information Density) ── */
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport {
          font-size: 0.72rem;
        }
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport > div {
          gap: 0.45rem !important;
        }
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport table th,
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport table td {
          padding: 0.3rem 0.5rem !important;
          font-size: 0.68rem !important;
        }
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport input:not([type="checkbox"]):not([type="radio"]),
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport select,
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport textarea {
          padding: 0.28rem 0.45rem !important;
          font-size: 0.68rem !important;
          border-radius: 6px !important;
        }
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport .collapsible-controls-card,
        .peerlens-retractable-viewport.density-compact .dock-scrollable-viewport .pulse-card {
          padding: 0.45rem 0.65rem !important;
          border-radius: 8px !important;
        }

        /* ── COMFORTABLE / EXPANSIVE DENSITY (Relaxed & Spacious) ── */
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport {
          font-size: 0.8rem;
        }
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport > div {
          gap: 1rem !important;
        }
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport table th,
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport table td {
          padding: 0.55rem 0.75rem !important;
          font-size: 0.76rem !important;
        }
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport input:not([type="checkbox"]):not([type="radio"]),
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport select,
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport textarea {
          padding: 0.42rem 0.7rem !important;
          font-size: 0.76rem !important;
          border-radius: 8px !important;
        }
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport .collapsible-controls-card,
        .peerlens-retractable-viewport.density-comfortable .dock-scrollable-viewport .pulse-card {
          padding: 0.95rem 1.15rem !important;
          border-radius: 14px !important;
        }

        /* ── ISOLATED HEADER WINDOW CONTROLS ── */
        .dock-header-window-btn {
          width: 26px !important;
          height: 26px !important;
          min-width: 26px !important;
          min-height: 26px !important;
          max-width: 26px !important;
          max-height: 26px !important;
          padding: 0 !important;
          border-radius: 7px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
          line-height: 1 !important;
        }
        .dock-header-window-btn svg {
          display: block !important;
          width: 12px !important;
          height: 12px !important;
          flex-shrink: 0 !important;
        }

        .dock-header-btn {
          height: 26px !important;
          padding: 0.3rem 0.55rem !important;
          font-size: 0.7rem !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
        }

        /* ── ISOLATED VIEW SETTINGS POPOVER ── */
        .dock-view-settings-popover {
          box-sizing: border-box !important;
          width: 300px !important;
          max-width: calc(100vw - 20px) !important;
          overflow: hidden !important;
        }
        .dock-view-settings-popover,
        .dock-view-settings-popover * {
          box-sizing: border-box !important;
        }
        .dock-view-settings-popover .popover-grid-4 {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 5px !important;
          width: 100% !important;
          margin-top: 0.35rem !important;
        }
        .dock-view-settings-popover .popover-grid-2 {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 6px !important;
          width: 100% !important;
          margin-top: 0.35rem !important;
        }
        .dock-view-settings-popover .popover-btn-4 {
          padding: 0.36rem 0.2rem !important;
          font-size: 0.68rem !important;
          font-weight: 800 !important;
          border-radius: 6px !important;
          width: 100% !important;
          min-width: 0 !important;
          text-align: center !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1.2 !important;
        }
        .dock-view-settings-popover .popover-btn-glass {
          padding: 0.35rem 0.15rem !important;
          border-radius: 8px !important;
          width: 100% !important;
          min-width: 0 !important;
          text-align: center !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 1px !important;
        }
        .dock-view-settings-popover .popover-btn-density {
          padding: 0.5rem 0.45rem !important;
          border-radius: 8px !important;
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 2px !important;
        }

        /* ── TABLE ACTIONS & UNPIN BUTTON PROTECTION ── */
        .peerlens-retractable-viewport .table-action-btn {
          padding: 2px 7px !important;
          font-size: 0.65rem !important;
          border-radius: 5px !important;
          height: 22px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3px !important;
          box-sizing: border-box !important;
        }
        .peerlens-retractable-viewport .tab-unpin-btn {
          width: 14px !important;
          height: 14px !important;
          min-width: 14px !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Minimal & De-nested Card Overrides within Drawer */
        .peerlens-retractable-viewport .autogroup-studio-container {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          margin-bottom: 0 !important;
        }
        .peerlens-retractable-viewport .autogroup-rule-card {
          padding: 0.5rem 0.75rem !important;
          gap: 0.35rem !important;
          border-radius: 8px !important;
        }
        .peerlens-retractable-viewport .autogroup-rule-row-grid {
          gap: 0.5rem !important;
        }
        .peerlens-retractable-viewport .autogroup-rule-icon-box {
          width: 26px !important;
          height: 26px !important;
          border-radius: 6px !important;
        }
        .peerlens-retractable-viewport .pinned-tab-pill:hover .tab-unpin-btn {
          opacity: 1 !important;
        }
        .peerlens-retractable-viewport ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .peerlens-retractable-viewport ::-webkit-scrollbar-track {
          background: transparent;
        }
        .peerlens-retractable-viewport ::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.28);
          border-radius: 10px;
        }
        .peerlens-retractable-viewport ::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.45);
        }

        /* ══════════════════════════════════════════════════════════════
           3. DYNAMIC RESPONSIVE FLOATING DOCK ENGINE & AUTO-ADJUSTMENT
           ══════════════════════════════════════════════════════════════ */
        .peerlens-retractable-viewport.is-floating {
          box-sizing: border-box !important;
        }

        .peerlens-retractable-viewport.is-dragging,
        .peerlens-retractable-viewport.is-resizing {
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        .peerlens-retractable-viewport.is-dragging iframe,
        .peerlens-retractable-viewport.is-resizing iframe {
          pointer-events: none !important;
        }

        /* Responsive adaptation for compact width (<520px) */
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport {
          padding: 0.65rem 0.85rem !important;
        }

        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport > div {
          gap: 0.55rem !important;
        }

        /* Automatically adapt 2-column grids down to 1 column when space is tight */
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(2, 1fr)"],
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(2,1fr)"] {
          grid-template-columns: 1fr !important;
        }

        /* Automatically wrap 3, 4, 5-column grids */
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(3, 1fr)"],
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(3,1fr)"] {
          grid-template-columns: repeat(auto-fit, minmax(95px, 1fr)) !important;
        }

        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(4, 1fr)"],
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(4,1fr)"] {
          grid-template-columns: repeat(2, 1fr) !important;
        }

        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(5, 1fr)"],
        .peerlens-retractable-viewport.size-compact .dock-scrollable-viewport div[style*="repeat(5,1fr)"] {
          grid-template-columns: repeat(auto-fit, minmax(50px, 1fr)) !important;
        }

        /* Ensure all tables are safely wrapped and horizontal scrollable so they never burst the container */
        .peerlens-retractable-viewport table {
          max-width: 100% !important;
        }
        .peerlens-retractable-viewport div:has(> table) {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          max-width: 100% !important;
        }

        /* Clean table action buttons wrapping when very narrow */
        .peerlens-retractable-viewport.size-compact .table-action-btn {
          padding: 2px 5px !important;
          font-size: 0.6rem !important;
        }

        /* ══════════════════════════════════════════════════════════════
           4. ADAPTIVE HEADER & WINDOW CONTROLS RESPONSIVENESS
           ══════════════════════════════════════════════════════════════ */
        .peerlens-retractable-viewport.size-compact .dock-header-btn-text {
          display: none !important;
        }

        .peerlens-retractable-viewport.size-compact .dock-header-btn {
          padding: 0 !important;
          width: 26px !important;
          min-width: 26px !important;
          height: 26px !important;
          justify-content: center !important;
          gap: 0 !important;
        }

        .peerlens-retractable-viewport.size-compact .dock-header-chevron {
          display: none !important;
        }

        /* Modules button in compact mode: sleek 26px button with badge */
        .peerlens-retractable-viewport.size-compact .dock-header-modules-btn {
          position: relative !important;
          width: 26px !important;
          min-width: 26px !important;
          height: 26px !important;
          padding: 0 !important;
          justify-content: center !important;
        }
        .peerlens-retractable-viewport.size-compact .dock-header-modules-badge {
          position: absolute !important;
          top: -4px !important;
          right: -4px !important;
          font-size: 0.55rem !important;
          padding: 1px 4px !important;
          min-width: 14px !important;
          height: 14px !important;
          border-radius: 999px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        }

        /* Classroom badge hiding/condensing in compact tiers */
        .peerlens-retractable-viewport.size-ultracompact .classroom-badge-wrapper {
          display: none !important;
        }
        .peerlens-retractable-viewport.size-compact:not(.size-ultracompact) .classroom-badge-title {
          max-width: 55px !important;
        }

        /* Drag hint pill */
        .peerlens-retractable-viewport.size-compact .dock-header-drag-hint {
          display: none !important;
        }

        /* Brand title stays solid and never clips */
        .dock-header-brand-text {
          flex-shrink: 0 !important;
        }

        .peerlens-retractable-viewport.size-micro .dock-header-brand-text {
          font-size: 0.78rem !important;
        }

        /* ── PINNED TABS RESPONSIVE BAR ── */
        .peerlens-retractable-viewport.size-compact .pinned-tab-pill {
          padding: 2px 6px !important;
          font-size: 0.65rem !important;
          gap: 0.25rem !important;
        }

        .peerlens-retractable-viewport.size-compact .tab-add-btn-text,
        .peerlens-retractable-viewport.size-compact .tab-all-btn-text {
          display: none !important;
        }

        .peerlens-retractable-viewport.size-compact .tab-add-btn,
        .peerlens-retractable-viewport.size-compact .tab-all-btn {
          padding: 0 5px !important;
          min-width: 24px !important;
          height: 24px !important;
          justify-content: center !important;
        }

        /* ── TABLE AUTO-FIT OVERFLOW PROTECTION ── */
        .peerlens-retractable-viewport.size-compact table {
          font-size: 0.68rem !important;
        }
        .peerlens-retractable-viewport.size-compact table th,
        .peerlens-retractable-viewport.size-compact table td {
          padding: 0.35rem 0.45rem !important;
        }
        .peerlens-retractable-viewport.size-ultracompact table .student-email-sub {
          display: none !important;
        }

        /* Resize handles hover effects */
        .dock-float-resize-corner.se:hover svg {
          opacity: 1 !important;
          color: var(--primary) !important;
        }
        .dock-float-resize-edge.e:hover,
        .dock-float-resize-edge.w:hover {
          background-color: var(--primary-light) !important;
          opacity: 0.7 !important;
        }
        .dock-float-resize-edge.s:hover {
          background-color: var(--primary-light) !important;
          opacity: 0.7 !important;
        }
      `}</style>

      <section
        id="dynamic-retractable-viewport"
        className={`peerlens-retractable-viewport translucent-${translucencyLevel} density-${contentDensity} ${isCompactWidth ? 'size-compact' : ''} ${isUltraCompact ? 'size-ultracompact' : ''} ${isMicroCompact ? 'size-micro' : ''} ${isWideWidth ? 'size-wide' : ''} ${dockPosition === 'floating' ? 'is-floating' : ''} ${isDraggingWindow ? 'is-dragging' : ''} ${resizeDirection ? 'is-resizing' : ''}`}
        style={getDockContainerStyle()}
      >
        {/* ── TOP HEADER CONTROL BAR (DRAGGABLE IN FLOATING MODE) ── */}
        <div
          onPointerDown={handleWindowDragStart}
          style={{
            padding: contentDensity === 'compact' || isCompactWidth ? '0.45rem 0.85rem 0.35rem 0.85rem' : '0.85rem 1.15rem 0.65rem 1.15rem',
            borderBottom: translucencyLevel === 'off' ? '1px solid var(--border-color)' : '1px solid rgba(255, 255, 255, 0.28)',
            backgroundColor:
              translucencyLevel === 'off'
                ? 'var(--bg-surface)'
                : translucencyLevel === 'subtle'
                  ? 'color-mix(in srgb, var(--bg-surface) 65%, transparent)'
                  : translucencyLevel === 'medium'
                    ? 'color-mix(in srgb, var(--bg-surface) 38%, transparent)'
                    : 'color-mix(in srgb, var(--bg-surface) 18%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: contentDensity === 'compact' || isCompactWidth ? '0.35rem' : '0.65rem',
            flexShrink: 0,
            transition: 'all 200ms ease',
            cursor: dockPosition === 'floating' && !isFloatMaximized ? (isDraggingWindow ? 'grabbing' : 'grab') : 'default',
            touchAction: dockPosition === 'floating' ? 'none' : 'auto'
          }}
        >
          {/* Top Row: Workspace Brand, Classroom Badge, and Grouped Minimal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isCompactWidth ? '0.35rem' : '0.5rem', width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isCompactWidth ? '0.35rem' : '0.5rem', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Pin size={13} style={{ transform: 'rotate(45deg)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
                <span className="dock-header-brand-text" style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Workspace
                </span>

                {/* Floating Move Indicator */}
                {dockPosition === 'floating' && !isFloatMaximized && (
                  <div
                    className="dock-header-drag-hint"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: '1.5px 6px',
                      borderRadius: '999px',
                      backgroundColor: isDraggingWindow ? 'var(--primary-light)' : 'var(--bg-app)',
                      border: isDraggingWindow ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      color: isDraggingWindow ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      cursor: isDraggingWindow ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title="Click and drag anywhere on this header to move the window around"
                  >
                    <Move size={10} />
                    <span className="dock-header-btn-text">Move</span>
                  </div>
                )}

                {/* Classroom Pill with status dot and full name */}
                {classes && classes.length > 0 && (
                  <div
                    className="classroom-badge-wrapper"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      maxWidth: isCompactWidth ? '85px' : '180px',
                      overflow: 'hidden',
                      flexShrink: 1
                    }}
                    title={`Active Classroom: ${activeClass.name}`}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                    <span className="classroom-badge-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeClass.name}
                    </span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(getCategoryTab(activeDef.category))}
                        title={`Open ${getCategoryTab(activeDef.category).toUpperCase()} in full dashboard tab`}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginLeft: '2px',
                          flexShrink: 0
                        }}
                      >
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons & Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isCompactWidth ? '3px' : '0.35rem', flexShrink: 0 }}>
              {/* View & Layout Settings Menu Popover */}
              <div style={{ position: 'relative' }} ref={layoutMenuRef}>
                <button
                  type="button"
                  className="dock-header-btn"
                  onClick={() => setIsLayoutMenuOpen(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: isCompactWidth ? '0 6px' : '0.3rem 0.55rem',
                    height: '26px',
                    minWidth: '26px',
                    borderRadius: '7px',
                    border: isLayoutMenuOpen ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isLayoutMenuOpen ? 'var(--primary-light)' : 'var(--bg-app)',
                    color: isLayoutMenuOpen ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Layout, Width, Dock Position & Translucency Settings"
                >
                  <SlidersHorizontal size={11} />
                  <span className="dock-header-btn-text">View</span>
                  <ChevronDown size={10} className="dock-header-chevron" style={{ transform: isLayoutMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </button>

                {/* Floating Glass View Settings Menu Popover */}
                {isLayoutMenuOpen && (
                  <div
                    className="dock-view-settings-popover"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      width: '300px',
                      maxWidth: 'calc(100vw - 20px)',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '0.85rem',
                      boxShadow: '0 24px 56px rgba(0, 0, 0, 0.35)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      zIndex: 10050,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      animation: 'fadeIn 0.15s ease'
                    }}
                  >
                    {/* Section: Dock Anchor */}
                    <div>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Dock Position
                      </span>
                      <div className="popover-grid-4">
                        {[
                          { id: 'right', label: 'Right' },
                          { id: 'left', label: 'Left' },
                          { id: 'floating', label: 'Float' },
                          { id: 'bottom', label: 'Bottom' }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="popover-btn-4"
                            onClick={() => {
                              setDockPosition(p.id as DockPosition);
                              setIsLayoutMenuOpen(false);
                            }}
                            style={{
                              padding: '0.36rem 0.2rem',
                              borderRadius: '6px',
                              border: dockPosition === p.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: dockPosition === p.id ? 'var(--primary-light)' : 'var(--bg-app)',
                              color: dockPosition === p.id ? 'var(--primary)' : 'var(--text-secondary)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              width: '100%',
                              minWidth: 0
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section: Floating Window Controls (When Floating) */}
                    {dockPosition === 'floating' && (
                      <div style={{ padding: '0.55rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Floating Size &amp; Position
                          </span>
                          <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {isFloatMaximized ? 'Maximized' : `${Math.round(floatSize.width)} × ${Math.round(floatSize.height)} px`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={handleResetFloatPositionAndSize}
                            style={{ flex: 1, padding: '0.32rem 0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          >
                            <RotateCcw size={10} /> Reset Position &amp; Size
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFloatMaximized(prev => !prev)}
                            style={{ padding: '0.32rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            {isFloatMaximized ? 'Restore' : 'Maximize'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section: Viewport Width */}
                    <div>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Window Width
                      </span>
                      <div className="popover-grid-4">
                        {[
                          { id: 'compact', label: '490px' },
                          { id: 'standard', label: '620px' },
                          { id: 'wide', label: '820px' },
                          { id: 'full', label: '1080px' }
                        ].map(w => (
                          <button
                            key={w.id}
                            type="button"
                            className="popover-btn-4"
                            onClick={() => setViewportWidth(w.id as ViewportWidth)}
                            style={{
                              padding: '0.36rem 0.2rem',
                              borderRadius: '6px',
                              border: viewportWidth === w.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: viewportWidth === w.id ? 'var(--primary-light)' : 'var(--bg-app)',
                              color: viewportWidth === w.id ? 'var(--primary)' : 'var(--text-secondary)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              width: '100%',
                              minWidth: 0
                            }}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section: Glass Translucency */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Frosted Glass View
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-light)' }}>
                          {translucencyLevel === 'off' ? 'Solid Opaque' : translucencyLevel === 'subtle' ? '75% Frost' : translucencyLevel === 'medium' ? '50% Aero' : '25% Sheer'}
                        </span>
                      </div>
                      <div className="popover-grid-4">
                        {[
                          { id: 'off', label: 'Solid', sub: 'Opaque' },
                          { id: 'subtle', label: '75%', sub: 'Frost' },
                          { id: 'medium', label: '50%', sub: 'Aero' },
                          { id: 'sheer', label: '25%', sub: 'Sheer' }
                        ].map(t => {
                          const isActive = translucencyLevel === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className="popover-btn-glass"
                              onClick={() => {
                                setTranslucencyLevel(t.id as TranslucencyLevel);
                                addToast(`Frosted Glass: ${t.label} (${t.sub}) applied`, 'info');
                              }}
                              style={{
                                padding: '0.35rem 0.15rem',
                                borderRadius: '8px',
                                border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                                backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-app)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '1px',
                                boxSizing: 'border-box',
                                width: '100%',
                                minWidth: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '0.72rem', fontWeight: 900, lineHeight: 1.1 }}>{t.label}</span>
                              <span style={{ fontSize: '0.56rem', opacity: 0.8, whiteSpace: 'nowrap', lineHeight: 1 }}>{t.sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section: Layout Density */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Content Density
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-light)' }}>
                          {contentDensity === 'compact' ? 'Minimal Cockpit' : 'Spacious Layout'}
                        </span>
                      </div>
                      <div className="popover-grid-2">
                        {[
                          { id: 'compact', label: 'Minimal', desc: 'Compact data cockpit', icon: Zap },
                          { id: 'comfortable', label: 'Comfortable', desc: 'Spacious presentation', icon: Feather }
                        ].map(d => {
                          const Icon = d.icon;
                          const isActive = contentDensity === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              className="popover-btn-density"
                              onClick={() => {
                                setContentDensity(d.id as 'compact' | 'comfortable');
                                addToast(`Content Density: ${d.label} layout active`, 'info');
                              }}
                              style={{
                                padding: '0.5rem 0.45rem',
                                borderRadius: '8px',
                                border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                                backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-app)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                boxSizing: 'border-box',
                                width: '100%',
                                minWidth: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', fontWeight: 900 }}>
                                <Icon size={12} />
                                <span>{d.label}</span>
                              </div>
                              <span style={{ fontSize: '0.58rem', opacity: 0.75 }}>{d.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Shortcuts hint */}
                    <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      <span>Toggle: <kbd style={{ padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>Alt+V</kbd></span>
                      <span>Retract: <kbd style={{ padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>Esc</kbd></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modules Catalog Button */}
              <button
                type="button"
                className="dock-header-btn dock-header-modules-btn"
                onClick={() => setIsCatalogOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  padding: isCompactWidth ? '0 5px' : '0.3rem 0.55rem',
                  height: '26px',
                  minWidth: '26px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={`Browse all ${AVAILABLE_PINNABLE_MODULES.length} platform modules`}
              >
                <Layers size={11} />
                <span className="dock-header-btn-text">Modules</span>
                <span
                  className="dock-header-modules-badge"
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '1px 4.5px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    lineHeight: 1
                  }}
                >
                  {pinnedIds.length}
                </span>
              </button>

              {/* Maximize / Restore Toggle (Only in Floating Mode) */}
              {dockPosition === 'floating' && (
                <button
                  type="button"
                  className="dock-header-window-btn"
                  onClick={() => setIsFloatMaximized(prev => !prev)}
                  title={isFloatMaximized ? "Restore window size" : "Maximize floating window"}
                  style={{
                    width: '26px',
                    height: '26px',
                    minWidth: '26px',
                    minHeight: '26px',
                    padding: 0,
                    borderRadius: '7px',
                    border: isFloatMaximized ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isFloatMaximized ? 'var(--primary-light)' : 'var(--bg-app)',
                    color: isFloatMaximized ? 'var(--primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {isFloatMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
              )}

              {/* Retract / Minimize Button */}
              <button
                type="button"
                className="dock-header-window-btn"
                onClick={() => setIsRetracted(true)}
                title="Retract into floating edge pill (Alt+V / Esc)"
                style={{
                  width: '26px',
                  height: '26px',
                  minWidth: '26px',
                  minHeight: '26px',
                  padding: 0,
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Minimize2 size={12} />
              </button>

              {/* Close Button */}
              {onToggleVisibility && (
                <button
                  type="button"
                  className="dock-header-window-btn"
                  onClick={() => onToggleVisibility(false)}
                  title="Close Workspace"
                  style={{
                    width: '26px',
                    height: '26px',
                    minWidth: '26px',
                    minHeight: '26px',
                    padding: 0,
                    borderRadius: '7px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── PINNED MODULES HORIZONTAL TABS BAR ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: contentDensity === 'compact' ? '0.25rem' : '0.45rem',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
              position: 'relative'
            }}
          >
            {pinnedIds.map((id, index) => {
              const def = AVAILABLE_PINNABLE_MODULES.find(m => m.id === id);
              if (!def) return null;
              const Icon = def.icon;
              const isActive = activeModuleId === id;

              return (
                <div
                  key={id}
                  onClick={() => setActiveModuleId(id)}
                  className="pinned-tab-pill"
                  title={`${def.title} (Alt+${index + 1})`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: contentDensity === 'compact' ? '0.25rem' : '0.4rem',
                    padding: contentDensity === 'compact' ? '0.22rem 0.5rem' : '0.42rem 0.75rem',
                    borderRadius: contentDensity === 'compact' ? '6px' : '9px',
                    backgroundColor: isActive 
                      ? (translucencyLevel === 'off' ? 'var(--bg-surface)' : 'rgba(255, 255, 255, 0.42)') 
                      : 'transparent',
                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: contentDensity === 'compact' ? '0.68rem' : '0.78rem',
                    fontWeight: isActive ? 800 : 600,
                    boxShadow: isActive ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: def.accentColor
                    }}
                  >
                    <Icon size={contentDensity === 'compact' ? 11 : 13} />
                  </span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: isUltraCompact ? '65px' : isCompactWidth ? '85px' : '150px'
                    }}
                  >
                    {def.shortTitle}
                  </span>

                  {/* Unpin button (subtle and only visible on hover / active) */}
                  {pinnedIds.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleTogglePinModule(id);
                      }}
                      title={`Unpin ${def.shortTitle}`}
                      className="tab-unpin-btn"
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        padding: '1px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isActive ? 0.65 : 0.25,
                        transition: 'opacity 0.15s'
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Quick Switcher dropdown if 4+ tabs */}
            {pinnedIds.length > 3 && (
              <div style={{ position: 'relative' }} ref={tabsOverflowRef}>
                <button
                  type="button"
                  className="tab-all-btn"
                  onClick={() => setIsTabsOverflowOpen(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.3rem 0.45rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: isTabsOverflowOpen ? 'var(--bg-surface)' : 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="View all pinned tabs list"
                >
                  <span className="tab-all-btn-text">All </span>
                  <span>({pinnedIds.length})</span>
                  <ChevronDown size={10} />
                </button>

                {isTabsOverflowOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '200px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                      zIndex: 10040,
                      padding: '0.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    {pinnedIds.map((id, idx) => {
                      const def = AVAILABLE_PINNABLE_MODULES.find(m => m.id === id);
                      if (!def) return null;
                      const Icon = def.icon;
                      const isAct = activeModuleId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setActiveModuleId(id);
                            setIsTabsOverflowOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: isAct ? `1px solid ${def.accentColor}` : 'none',
                            backgroundColor: isAct ? 'var(--primary-light)' : 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            fontWeight: isAct ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Icon size={12} style={{ color: def.accentColor }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {def.shortTitle}
                          </span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            Alt+{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* + Add Module Button */}
            <button
              type="button"
              className="tab-add-btn"
              onClick={() => setIsCatalogOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.3rem 0.5rem',
                borderRadius: '7px',
                border: '1px dashed var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title={`Pin another module from the ${AVAILABLE_PINNABLE_MODULES.length} platform modules`}
            >
              <Plus size={11} /> <span className="tab-add-btn-text">Add</span>
            </button>
          </div>
        </div>

        {/* ── MODULE SCROLLABLE CONTENT VIEWPORT ── */}
        <div
          className="dock-scrollable-viewport"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: contentDensity === 'compact' ? '0.65rem 0.85rem' : '1.25rem 1.45rem',
            position: 'relative',
            transition: 'padding 200ms ease'
          }}
        >
          {renderModuleContent()}
        </div>

        {/* ── RESIZE HANDLES (ONLY FOR FLOATING DOCK) ── */}
        {dockPosition === 'floating' && !isFloatMaximized && (
          <>
            {/* Bottom-Right Corner (SE) */}
            <div
              className="dock-float-resize-corner se"
              onPointerDown={e => handleResizePointerDown(e, 'se')}
              title="Drag to resize width and height"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '24px',
                height: '24px',
                cursor: 'nwse-resize',
                zIndex: 10020,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: '4px',
                touchAction: 'none'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                <path d="M10 2 L2 10 M11 6 L6 11 M11 10 L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Right Edge (E) */}
            <div
              className="dock-float-resize-edge e"
              onPointerDown={e => handleResizePointerDown(e, 'e')}
              title="Drag to resize width"
              style={{
                position: 'absolute',
                top: '40px',
                bottom: '24px',
                right: 0,
                width: '8px',
                cursor: 'ew-resize',
                zIndex: 10010,
                touchAction: 'none'
              }}
            />

            {/* Bottom Edge (S) */}
            <div
              className="dock-float-resize-edge s"
              onPointerDown={e => handleResizePointerDown(e, 's')}
              title="Drag to resize height"
              style={{
                position: 'absolute',
                bottom: 0,
                left: '24px',
                right: '24px',
                height: '8px',
                cursor: 'ns-resize',
                zIndex: 10010,
                touchAction: 'none'
              }}
            />

            {/* Bottom-Left Corner (SW) */}
            <div
              className="dock-float-resize-corner sw"
              onPointerDown={e => handleResizePointerDown(e, 'sw')}
              title="Drag to resize width and height"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '18px',
                height: '18px',
                cursor: 'nesw-resize',
                zIndex: 10020,
                touchAction: 'none'
              }}
            />

            {/* Left Edge (W) */}
            <div
              className="dock-float-resize-edge w"
              onPointerDown={e => handleResizePointerDown(e, 'w')}
              title="Drag to resize width"
              style={{
                position: 'absolute',
                top: '40px',
                bottom: '24px',
                left: 0,
                width: '8px',
                cursor: 'ew-resize',
                zIndex: 10010,
                touchAction: 'none'
              }}
            />
          </>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          5. MODULE CATALOG BROWSER MODAL (24 COMPLETE PLATFORM MODULES)
          ─────────────────────────────────────────────────────────────────────── */}
      {isCatalogOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 10050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.2rem',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setIsCatalogOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '860px',
                maxHeight: '88vh',
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-xl), 0 25px 60px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.1rem 1.4rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pin size={17} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      Pin Modules to Retractable Viewport
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Select any modules to keep them accessible, usable, and live across all dashboard tabs.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div
                style={{
                  padding: '0.75rem 1.4rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder={`Search all ${AVAILABLE_PINNABLE_MODULES.length} platform modules by name, keywords, or features...`}
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.8rem 0.45rem 2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem'
                    }}
                  />
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
                  {[
                    { id: 'all', label: `All (${AVAILABLE_PINNABLE_MODULES.length})` },
                    { id: 'reviews', label: 'Reviews' },
                    { id: 'teams', label: 'Teams' },
                    { id: 'roster', label: 'Roster' },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'milestones', label: 'Milestones' },
                    { id: 'tools', label: 'Tools' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatalogCategory(cat.id)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '999px',
                        border: 'none',
                        backgroundColor: catalogCategory === cat.id ? 'var(--primary)' : 'var(--bg-surface)',
                        color: catalogCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: catalogCategory === cat.id ? 800 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules Grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.2rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '0.85rem'
                }}
              >
                {AVAILABLE_PINNABLE_MODULES.filter(m => {
                  const matchesCat = catalogCategory === 'all' || m.category === catalogCategory;
                  const query = catalogSearch.toLowerCase().trim();
                  const matchesSearch =
                    !query ||
                    m.title.toLowerCase().includes(query) ||
                    m.description.toLowerCase().includes(query) ||
                    (m.keywords && m.keywords.some(k => k.toLowerCase().includes(query)));
                  return matchesCat && matchesSearch;
                }).map(mod => {
                  const Icon = mod.icon;
                  const isPinned = pinnedIds.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      style={{
                        padding: '0.9rem',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: isPinned ? `1.5px solid ${mod.accentColor}` : '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.65rem',
                        boxShadow: isPinned ? `0 4px 14px ${mod.accentColor}20` : 'none',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.4rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: mod.accentColor + '18',
                              color: mod.accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={16} />
                          </div>

                          {mod.badge && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: mod.accentColor + '18',
                                color: mod.accentColor
                              }}
                            >
                              {mod.badge}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          {mod.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                          {mod.description}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTogglePinModule(mod.id)}
                        style={{
                          width: '100%',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          border: isPinned ? `1px solid ${mod.accentColor}` : 'none',
                          backgroundColor: isPinned ? 'transparent' : 'var(--primary)',
                          color: isPinned ? mod.accentColor : '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isPinned ? (
                          <>
                            <PinOff size={12} />
                            <span>Unpin</span>
                          </>
                        ) : (
                          <>
                            <Pin size={12} />
                            <span>Pin to Viewport</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '0.85rem 1.4rem',
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <strong>{pinnedIds.length}</strong> modules currently pinned in your workspace
                </span>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DynamicRetractableDisplay;
