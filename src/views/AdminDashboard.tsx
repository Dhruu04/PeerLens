import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Users, Plus, Trash2, Download, Upload, Sliders, Mail,
  Database, RefreshCw, CheckCircle, Clock, BookOpen,
  Award, TrendingUp, AlertCircle, FileText,
  Search, Eye, Sparkles, Edit2, User, Info,
  Lightbulb, Heart, MessageSquare, Target, Minus,
  ThumbsUp, ShieldCheck, Rocket, Trophy, BarChart2,
  QrCode, Copy, Check, Globe, AlertTriangle, Lock, Unlock,
  Calendar, Bell, CheckSquare, Zap, Maximize2, Activity, UserCheck, X,
  Settings, Plane, EyeOff, LogOut, Compass, ArrowLeft, ArrowRight, RotateCcw,
  GraduationCap, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useClass } from '../context/ClassContext';
import { useTheme } from '../context/ThemeContext';
import {
  loadFeatureToggles,
  saveFeatureToggles,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  MINIMAL_FEATURE_TOGGLES,
  FULL_FEATURE_TOGGLES,
  type FeatureToggles
} from '../utils/featurePreferences';
import type { FirebaseConfig } from '../context/ClassContext';
import { calculateClassStats, calculateStudentMetrics, calculateStudentWebPAScore, detectClassAnomalies, getTargetScale, normalizeNationality } from '../utils/math';
import type { GradingScaleField, Student, ClassData, Review } from '../utils/math';
import { detectDuplicateEnrollments } from '../utils/duplicateDetector';
import type { DuplicateFlag } from '../utils/duplicateDetector';
import {
  exportClassroomToExcel,
  exportRosterToCSV,
  exportRosterToExcel,
  generateResultsCSV,
  downloadFileContent,
  extractRosterMatrix,
  parseRawPastedText,
  validateEmail,
  hashCode,
  exportLMSGradebook,
  generateLMSPreview,
  generateCanvasLMSCSV,
  generateBlackboardCSV,
  generateMoodleCSV,
  generateBrightspaceCSV,
  generateCustomLMSCSV,
  DEFAULT_CUSTOM_LMS_CONFIG,
  type LmsPlatform,
  type LmsScoreType,
  type LmsExportFilterOptions,
  type CustomLmsConfig,
  type CustomLmsColumn,
  type CustomLmsColumnField
} from '../utils/csv';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import SearchableSelect from '../components/SearchableSelect';
import { NATIONALITY_OPTIONS } from '../utils/nationalities';
import ClassQRCodeModal from '../components/ClassQRCodeModal';
import AutoGroupModal from '../components/AutoGroupModal';
import AutoGroupStudio from '../components/AutoGroupStudio';
import { StudentReportModal } from '../components/StudentReportModal';
import { RadarChart } from '../components/RadarChart';
import ProjectorView from './ProjectorView';
import { LinkDispatcherModal } from '../components/LinkDispatcherModal';
import { calculateJohariWindowMetric, extractClassFeedbackInsights } from '../utils/feedbackAnalytics';
import { DIVERSE_100_STUDENTS, getSampleStudentsCSV, downloadSampleStudentsFile } from '../data/sampleStudents';
import { RUBRIC_PRESETS } from '../utils/rubricPresets';
import { SettingsModal } from '../components/SettingsModal';
import FeatureInfoButton from '../components/FeatureInfoButton';
import CommandPaletteModal from '../components/CommandPaletteModal';
import InteractiveTour from '../components/InteractiveTour';
import GuideCenterModal from '../components/GuideCenterModal';
import { StudentPortalPreviewModal } from '../components/StudentPortalPreviewModal';
import { ContextHelpPopover } from '../components/ContextHelpPopover';
import { OnboardingChecklistWidget } from '../components/OnboardingChecklistWidget';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { GuidedSandboxHUD, type SandboxMission } from '../components/GuidedSandboxHUD';
import { Smartphone } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import {
  getStoredShortcuts,
  saveStoredShortcuts,
  resetStoredShortcuts,
  matchShortcut
} from '../utils/keyboardShortcuts';
import { downloadStudentReportPDF } from '../utils/pdfReport';


const getPraiseTagInfo = (tagText: string) => {
  // Strip historical emojis if any
  const cleanText = tagText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();

  if (cleanText.includes('Creative') || cleanText.includes('Problem')) return { icon: Lightbulb, color: 'hsl(45, 90%, 45%)', bg: 'hsl(45, 90%, 96%)', border: 'hsl(45, 90%, 90%)', text: 'Creative Problem Solver' };
  if (cleanText.includes('Punctual') || cleanText.includes('Reliable')) return { icon: Clock, color: 'hsl(14, 90%, 50%)', bg: 'hsl(14, 90%, 96%)', border: 'hsl(14, 90%, 90%)', text: 'Reliable & Punctual' };
  if (cleanText.includes('Supportive') || cleanText.includes('Player')) return { icon: Heart, color: 'var(--accent-rose)', bg: 'var(--accent-rose-light)', border: 'hsl(346, 84%, 90%)', text: 'Supportive Team Player' };
  if (cleanText.includes('Quality') || cleanText.includes('Deliverables')) return { icon: Award, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'hsl(243, 75%, 92%)', text: 'High Quality Deliverables' };
  if (cleanText.includes('Communicat')) return { icon: MessageSquare, color: 'hsl(199, 89%, 40%)', bg: 'hsl(199, 89%, 95%)', border: 'hsl(199, 89%, 90%)', text: 'Clear Communicator' };
  return { icon: Target, color: 'var(--accent-teal)', bg: 'var(--accent-teal-light)', border: 'hsl(173, 80%, 90%)', text: 'Detail Oriented' };
};

const getTierInfo = (pct: number) => {
  if (pct <= 25) {
    return {
      icon: AlertCircle,
      title: 'Needs Improvement',
      desc: 'Limited contribution or inconsistent delivery; required substantial guidance.',
      color: 'var(--accent-rose)',
      bgColor: 'var(--accent-rose-light)',
      className: 'active-rose',
      index: 0
    };
  } else if (pct <= 50) {
    return {
      icon: TrendingUp,
      title: 'Developing',
      desc: 'Met baseline requirements; opportunities exist to improve consistency and collaboration.',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-light)',
      className: 'active-amber',
      index: 1
    };
  } else if (pct <= 75) {
    return {
      icon: ThumbsUp,
      title: 'Proficient / Meets Expectations',
      desc: 'Consistently met established standards; dependable, communicative, and collaborative.',
      color: 'var(--primary)',
      bgColor: 'var(--primary-light)',
      className: 'active-indigo',
      index: 2
    };
  } else if (pct <= 90) {
    return {
      icon: Rocket,
      title: 'Exemplary / Exceeds Expectations',
      desc: 'Delivered high-quality contributions; took initiative and actively supported teammates.',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      className: 'active-teal',
      index: 3
    };
  } else {
    return {
      icon: Trophy,
      title: 'Distinguished Leadership',
      desc: 'Exceptional technical rigor and leadership; drove significant team outcomes.',
      color: 'hsl(142, 70%, 45%)',
      bgColor: 'hsl(142, 70%, 96%)',
      className: 'active-emerald',
      index: 4
    };
  }
};

const substitutePlaceholders = (template: string, studentName: string, courseName: string, portalLink?: string) => {
  let result = template
    .replace(/\{\{studentName\}\}/g, studentName)
    .replace(/\{\{courseName\}\}/g, courseName);
  if (portalLink) {
    result = result.replace(/\{\{portalLink\}\}/g, portalLink);
  }
  return result;
};

const renderCustomBodyToHtml = (bodyText: string, studentName: string, courseName: string, link: string) => {
  const substituted = substitutePlaceholders(bodyText, studentName, courseName, link);
  return substituted
    .split('\n\n')
    .map(para => `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${para.replace(/\n/g, '<br />')}</p>`)
    .join('');
};

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const CEFR_LEVELS = [
  {
    value: 'Native / Bilingual',
    code: 'Native',
    title: 'Native / Bilingual',
    desc: 'Mother tongue or full bilingual proficiency'
  },
  {
    value: 'Fluent (C1/C2)',
    code: 'C1/C2',
    title: 'Fluent (C1/C2)',
    desc: 'Full professional working proficiency'
  },
  {
    value: 'Intermediate (B1/B2)',
    code: 'B1/B2',
    title: 'Intermediate (B1/B2)',
    desc: 'Can convey main ideas in familiar topics'
  },
  {
    value: 'Basic (A1/A2)',
    code: 'A1/A2',
    title: 'Basic (A1/A2)',
    desc: 'Elementary phrases and foundational comprehension'
  }
];

const DEGREE_SUGGESTIONS = [
  'Computer Science',
  'Software Engineering',
  'Data Science & AI',
  'Business Administration',
  'Mechanical Engineering',
  'Economics & Finance',
  'Information Systems'
];

interface TeamBaseGradeInputProps {
  initialValue: number;
  onCommit: (val: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}

const TeamBaseGradeInput: React.FC<TeamBaseGradeInputProps> = ({
  initialValue,
  onCommit,
  min = 0,
  max = 1000,
  compact = false
}) => {
  const [val, setVal] = useState<string>(String(initialValue));

  useEffect(() => {
    setVal(String(initialValue));
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setVal(raw);
    if (raw !== '' && !isNaN(Number(raw))) {
      const num = Math.min(max, Math.max(min, Number(raw)));
      onCommit(num);
    }
  };

  const handleBlur = () => {
    if (val === '' || isNaN(Number(val))) {
      setVal(String(initialValue));
    } else {
      const num = Math.min(max, Math.max(min, Number(val)));
      setVal(String(num));
      onCommit(num);
    }
  };

  const adjustBy = (delta: number) => {
    const current = Number(val) || 0;
    const updated = Math.min(max, Math.max(min, current + delta));
    setVal(String(updated));
    onCommit(updated);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
      <button
        type="button"
        onClick={() => adjustBy(-1)}
        className="btn btn-secondary btn-sm"
        style={{
          width: compact ? '20px' : '26px',
          height: compact ? '26px' : '32px',
          padding: 0,
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)'
        }}
        title="Decrease by 1"
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        className="form-input"
        value={val}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          width: compact ? '52px' : '64px',
          height: compact ? '26px' : '32px',
          fontSize: compact ? '0.78rem' : '0.88rem',
          fontWeight: 800,
          textAlign: 'center',
          padding: '0 0.25rem'
        }}
      />
      <button
        type="button"
        onClick={() => adjustBy(1)}
        className="btn btn-secondary btn-sm"
        style={{
          width: compact ? '20px' : '26px',
          height: compact ? '26px' : '32px',
          padding: 0,
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)'
        }}
        title="Increase by 1"
      >
        +
      </button>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const {
    classes,
    activeClass,
    createClass,
    deleteClass,
    selectClass,
    updateGradingConfig,
    updateTeamBaseGrade,
    setAllTeamBaseGrades,
    importRoster,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteStudents,
    batchSubmitClassReviews,
    resetClassReviews,
    clearClassRoster,
    saveClassDeadline,
    archiveActiveMilestone,
    deleteMilestone,
    restoreClassesSnapshot,
    saveFirebaseConfig,
    isCloudSynced,
    firebaseConfig,
    activeAdminProfile,
    adminProfiles,
    switchAdminProfile,
    createAdminProfile,
    deleteAdminProfile,
    user,
    authLoading,
    loginAdmin,
    signupAdmin,
    logoutAdmin,
    syncWorkspaceSettingsToCloud,
    addToast
  } = useClass();
  const { toggleThemeMode } = useTheme();

  // Navigation states: persisted to localStorage & cloud so software opens exactly where user left it
  const [activeTab, setActiveTabState] = useState<'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud'>(() => {
    try {
      const saved = localStorage.getItem('peer_active_tab');
      if (saved && ['hub', 'roster', 'grading', 'results', 'automation', 'cloud'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {
      // ignore
    }
    return 'hub';
  });

  const setActiveTab = (tab: 'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud') => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('peer_active_tab', tab);
      syncWorkspaceSettingsToCloud({ activeTab: tab });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const handleTabSynced = (e: any) => {
      const tab = e.detail;
      if (tab && ['hub', 'roster', 'grading', 'results', 'automation', 'cloud'].includes(tab)) {
        setActiveTabState(tab);
      }
    };
    window.addEventListener('peerlens_tab_synced', handleTabSynced);
    return () => window.removeEventListener('peerlens_tab_synced', handleTabSynced);
  }, []);

  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(loadFeatureToggles);

  useEffect(() => {
    return subscribeFeatureToggles((updated) => setFeatureToggles(updated));
  }, []);

  // Admin authentication local states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');

  // Modal control states
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isAutoGroupModalOpen, setIsAutoGroupModalOpen] = useState(false);
  const [copiedEnrollLink, setCopiedEnrollLink] = useState(false);
  const [miniQrUrl, setMiniQrUrl] = useState<string>('');
  const [isMobileProfileModalOpen, setIsMobileProfileModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isGuideCenterOpen, setIsGuideCenterOpen] = useState(false);
  const [guideCenterInitialTab, setGuideCenterInitialTab] = useState<'system' | 'tours' | 'features'>('system');

  const openGuideCenter = (tab: 'system' | 'tours' | 'features' = 'system') => {
    setGuideCenterInitialTab(tab);
    setIsGuideCenterOpen(true);
  };
  const [customTourStepIds, setCustomTourStepIds] = useState<string[] | null>(null);
  const [tourSnapshot, setTourSnapshot] = useState<{
    fields: GradingScaleField[];
    students: Student[];
    targetScale?: number | null;
  } | null>(null);

  const handleStartTour = (stepIds?: string[]) => {
    try {
      sessionStorage.setItem('peer_tour_classes_backup', JSON.stringify(classes));
    } catch (e) {
      console.warn('Failed to snapshot classrooms before tour', e);
    }
    setCustomTourStepIds(stepIds || null);
    setIsTourOpen(true);
  };

  const handleRestoreTourSnapshot = () => {
    const backup = sessionStorage.getItem('peer_tour_classes_backup');
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        restoreClassesSnapshot(parsed);
      } catch (e) {
        console.warn('Failed to restore tour classes backup', e);
      }
      sessionStorage.removeItem('peer_tour_classes_backup');
    }
    // Cleanly reset any state altered during tour demos
    setSearchTerm('');
    setRadarTeamFilter('All');
    setIsCommandPaletteOpen(false);
    setIsProjectorModalOpen(false);
    setIsLinkDispatcherOpen(false);
    setIsSettingsModalOpen(false);
    setIsQRCodeModalOpen(false);
    setIsWizardOpen(false);
    setIsAutoGroupModalOpen(false);
    setIsMobileProfileModalOpen(false);
    setActiveTab('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTourSnapshot(null);
    addToast('Workspace restored back to your clean original state.', 'info');
  };

  const handleExecuteTourDemoStep = (stepId: string) => {
    if (!activeClass) return;
    switch (stepId) {
      case 'workspace_switcher':
        setIsMobileProfileModalOpen(true);
        addToast('Opened Workspace Profile Manager!', 'info');
        break;
      case 'class_header':
        navigator.clipboard.writeText(activeClass.id);
        addToast(`Classroom ID "${activeClass.id}" copied to clipboard!`, 'success');
        break;
      case 'command_palette':
        setIsCommandPaletteOpen(true);
        break;
      case 'projector_mode':
        setIsProjectorModalOpen(true);
        break;
      case 'email_dispatcher':
        setIsLinkDispatcherOpen(true);
        break;
      case 'settings_hub':
        setIsSettingsModalOpen(true);
        break;
      case 'self_enrollment':
        setIsQRCodeModalOpen(true);
        break;
      case 'quick_actions':
        importRoster(activeClass.id, DIVERSE_100_STUDENTS, true);
        addToast('Loaded 100 diverse sample students across 35+ countries and balanced demographics!', 'success');
        break;
      case 'import_wizard':
        setIsWizardOpen(true);
        break;
      case 'autogroup_studio':
        setIsAutoGroupModalOpen(true);
        break;
      case 'classroom_roster':
        setSearchTerm('Sophie');
        addToast('Filtered roster for student "Sophie"', 'info');
        break;
      case 'rubric_tab':
        setActiveTab('grading');
        break;
      case 'rubric_builder':
        handleApplyPreset('ipaf_research_synthesized');
        addToast('Applied IPAF Research-Synthesized preset (6 criteria, weighted 100%)!', 'success');
        break;
      case 'eval_simulator':
        addToast('Simulated peer evaluation rating (16/20 mark)!', 'info');
        break;
      case 'analytics_tab':
        setActiveTab('results');
        break;
      case 'perception_deck':
        setRadarTeamFilter('Alpha Team');
        addToast('Selected Radar overlay for "Alpha Team"!', 'info');
        break;
      case 'gradebook_matrix':
        setFudgeWeight(0.5);
        addToast('WebPA Calibrator adjusted to 50% fudge weighting live!', 'success');
        break;
      case 'guide_center_btn':
        setIsGuideCenterOpen(true);
        addToast('Opened Academic Guidance Center!', 'info');
        break;
      case 'customize_view':
        setSettingsInitialTab('modules');
        setIsSettingsModalOpen(true);
        addToast('Opened Interface & Modules customizer. You can add or remove sections as you wish!', 'info');
        break;
      case 'hub_enrollment':
      case 'section_roster_tab':
        setActiveTab('roster');
        addToast('Navigated to Section 1: Enrollment & Teams', 'info');
        break;
      case 'hub_review':
        setActiveTab('grading');
        addToast('Navigated to Section 2: Review System', 'info');
        break;
      case 'hub_analytics':
        setActiveTab('results');
        addToast('Navigated to Section 3: Grading & Analytics', 'info');
        break;
      case 'target_scale':
        addToast('Target Scale: Convert criteria scores to institution 0-100%, 0-20, or 0-4.0 GPA scale.', 'info');
        break;
      case 'webpa_calibrator':
        setFudgeWeight(0.5);
        addToast('WebPA Calibrator adjusted to 50% fudge weighting live!', 'success');
        break;
      case 'anomaly_audit':
        addToast('Anomaly & Collusion Audit: Inspecting reciprocal grading flags and outlier scores.', 'info');
        break;
      case 'results_summary':
        addToast('Results Summary: Inspecting calibrated grades, WebPA factors, and export options.', 'info');
        break;
      default:
        break;
    }
  };



  // Roster Onboarding Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardRawData, setWizardRawData] = useState<string[][]>([]);
  const [wizardFileName, setWizardFileName] = useState('');
  const [wizardHeaders, setWizardHeaders] = useState<string[]>([]);
  const [wizardMapping, setWizardMapping] = useState<Record<string, number>>({
    name: -1,
    email: -1,
    id: -1,
    groupName: -1,
    university: -1,
    degree: -1,
    studentType: -1,
    gender: -1,
    nationality: -1,
    englishProficiency: -1
  });
  const [wizardStudents, setWizardStudents] = useState<any[]>([]);
  const [wizardErrors, setWizardErrors] = useState<Record<number, string[]>>({});
  const [wizardPasteText, setWizardPasteText] = useState('');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [formatGuideTab, setFormatGuideTab] = useState<'csv' | 'xlsx' | 'pdf' | 'paste'>('csv');

  // Download a pre-built CSV template for the admin
  const handleDownloadTemplate = () => {
    const header = 'Student ID,Full Name,Email,Group / Team,University,Degree,Student Type,Gender,Nationality,English Proficiency';
    const rows = [
      '101,Alice Johnson,alice.johnson@university.edu,Team Alpha,MIT,Computer Science,Erasmus,Female,United States,Native / Bilingual',
      '102,Bob Martinez,bob.martinez@university.edu,Team Beta,Stanford,Software Engineering,Normal,Male,Spain,Fluent (C1/C2)',
      '103,Carol Lee,carol.lee@university.edu,Team Alpha,Oxford,Physics,Normal,Female,United Kingdom,Native / Bilingual',
    ];
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Template downloaded! Open it in Excel or Google Sheets.', 'success');
  };

  // Single student manual add state
  const [newStudent, setNewStudent] = useState({
    id: '',
    name: '',
    email: '',
    groupName: '',
    gender: 'Female',
    isInternational: false,
    isExchange: false,
    nationality: '',
    currentCountry: '',
    englishProficiency: 'Fluent (C1/C2)',
    university: '',
    degree: '',
    originalUniversity: '',
    originalCountry: '',
    currentUniversity: '',
    studentType: 'Normal'
  });

  // UI Filtering, Searching & Duplicate Flagging
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [ignoredDuplicatePairs, setIgnoredDuplicatePairs] = useState<Set<string>>(new Set());

  // Compute potential duplicate student enrollments in real-time (Declared before any early returns)
  const duplicateFlagsMap = useMemo(() => {
    if (!activeClass?.students) return new Map<string, DuplicateFlag[]>();
    return detectDuplicateEnrollments(activeClass.students, ignoredDuplicatePairs);
  }, [activeClass?.students, ignoredDuplicatePairs]);

  // Firebase Config panel states
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const fbStorageBucket = '';
  const fbSenderId = '';
  const [fbAppId, setFbAppId] = useState('');

  // Edit student modal states
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState({
    id: '',
    name: '',
    email: '',
    groupName: '',
    gender: 'Female',
    isInternational: false,
    isExchange: false,
    nationality: '',
    currentCountry: '',
    englishProficiency: 'Fluent (C1/C2)',
    university: '',
    degree: '',
    originalUniversity: '',
    originalCountry: '',
    currentUniversity: '',
    studentType: 'Normal'
  });

  // Advanced settings and controls states
  const [fudgeWeight, setFudgeWeight] = useState<number>(() => {
    const val = localStorage.getItem('peer_fudge_weight');
    return val ? Number(val) : 0.5;
  });
  const [baseGroupGrade, setBaseGroupGrade] = useState<number>(() => {
    const val = localStorage.getItem('peer_base_grade');
    return val ? Number(val) : 100;
  });
  const [isTeamBaseGradesModalOpen, setIsTeamBaseGradesModalOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');

  // LMS Gradebook Integration states
  const [selectedLmsTab, setSelectedLmsTab] = useState<LmsPlatform>('canvas');
  const [lmsScoreType, setLmsScoreType] = useState<LmsScoreType>('calibrated');
  const [lmsTeamFilter, setLmsTeamFilter] = useState<string>('all');
  const [lmsStatusFilter, setLmsStatusFilter] = useState<'all' | 'submitted' | 'pending'>('all');
  const [copiedLms, setCopiedLms] = useState(false);
  const [showLmsGuideModal, setShowLmsGuideModal] = useState(false);
  const [lmsGuideActiveTab, setLmsGuideActiveTab] = useState<LmsPlatform>('canvas');

  // Custom LMS Schema Config state (persisted in localStorage)
  const [customLmsConfig, setCustomLmsConfig] = useState<CustomLmsConfig>(() => {
    try {
      const saved = localStorage.getItem('peer_custom_lms_config');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_LMS_CONFIG;
    } catch (e) {
      return DEFAULT_CUSTOM_LMS_CONFIG;
    }
  });


  useEffect(() => {
    try {
      localStorage.setItem('peer_custom_lms_config', JSON.stringify(customLmsConfig));
    } catch (e) {
      console.warn('Failed to save custom LMS configuration to localStorage', e);
    }
  }, [customLmsConfig]);

  // Student PDF Report Card modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string>('');

  // Live Projector & Link Dispatcher modals
  const [isProjectorModalOpen, setIsProjectorModalOpen] = useState(false);
  const [isLinkDispatcherOpen, setIsLinkDispatcherOpen] = useState(false);
  const [radarTeamFilter, setRadarTeamFilter] = useState<string>('All');

  // Settings Modal & Keyboard Shortcuts States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'email' | 'cloud' | 'shortcuts' | 'appearance' | 'modules'>('email');
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(() => getStoredShortcuts());

  useEffect(() => {
    const handleShortcutsChanged = (e: any) => {
      if (Array.isArray(e.detail)) {
        setShortcuts(e.detail);
      }
    };
    window.addEventListener('peerlens_shortcuts_changed', handleShortcutsChanged);
    return () => window.removeEventListener('peerlens_shortcuts_changed', handleShortcutsChanged);
  }, []);

  // Command Palette & Multi-select Bulk Actions
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bulkTargetTeam, setBulkTargetTeam] = useState<string>('');

  const handleUpdateShortcuts = (updated: KeyboardShortcut[]) => {
    setShortcuts(updated);
    saveStoredShortcuts(updated);
    syncWorkspaceSettingsToCloud({ shortcuts: updated });
  };

  const handleResetShortcuts = () => {
    const defaults = resetStoredShortcuts();
    setShortcuts(defaults);
    syncWorkspaceSettingsToCloud({ shortcuts: defaults });
  };

  const openReportModal = (studentId?: string) => {
    if (studentId) setSelectedReportStudentId(studentId);
    setIsReportModalOpen(true);
  };

  // Custom Glassmorphic Confirmation Modal state manager
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this operation?',
    onConfirm: () => { }
  });

  const [selectedStudentReport, setSelectedStudentReport] = useState<Student | null>(null);
  const [selectedTeamAnalysis, setSelectedTeamAnalysis] = useState<string | null>(null);
  const [activeAuditMetric, setActiveAuditMetric] = useState<string>('overall');

  // Interactive Sandbox & Quality of Life State
  const [isSandboxActive, setIsSandboxActive] = useState<boolean>(false);
  const [sandboxSnapshot, setSandboxSnapshot] = useState<string | null>(null);
  const [previewingStudent, setPreviewingStudent] = useState<Student | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [sandboxMissionIndex, setSandboxMissionIndex] = useState<number>(0);
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState<boolean>(() => {
    return localStorage.getItem('peer_onboarding_dismissed') !== 'true';
  });

  const sandboxMissions: SandboxMission[] = useMemo(() => {
    if (!activeClass) return [];
    return [
      {
        id: 1,
        stageName: '1. Section 1: Enroll',
        title: 'Mission 1: Populate Your Classroom Cohort',
        tab: 'roster',
        instruction: 'In Section 1 (Enrollment & Teams), click the "100 Demo Sample" button in the Quick Actions card (or use "Add Member" / "Import Wizard") to load international students.',
        targetHint: 'Section 1 → Quick Actions card → Click "100 Demo Sample"',
        actionButtonLabel: 'Load 100 Demo Cohort',
        isCompleted: activeClass.students.length > 0
      },
      {
        id: 2,
        stageName: '2. Section 1: AutoGroup',
        title: 'Mission 2: Partition Balanced Teams with AutoGroup Studio',
        tab: 'roster',
        instruction: 'Open the "AutoGroup Studio" in Section 1. Select an optimization strategy (e.g. Multi-Dimensional or 50/50 Gender Parity) and click "Re-Shuffle & Apply".',
        targetHint: 'Section 1 → Roster Header → Click "AutoGroup Studio"',
        actionButtonLabel: 'Auto-Partition 20 Teams',
        isCompleted: activeClass.students.length > 0 && activeClass.students.some(s => s.groupName && s.groupName !== 'Unassigned')
      },
      {
        id: 3,
        stageName: '3. Section 2: Rubric',
        title: 'Mission 3: Define 100% Balanced Evaluation Rubric',
        tab: 'grading',
        instruction: 'Switch to Section 2: Review System (Press 2). Click the research-synthesized "IPAF Standard" preset, and verify weights equal 100%.',
        targetHint: 'Navigation Switcher → "2. Review System" → Apply "IPAF Standard" preset',
        actionButtonLabel: 'Apply 100% IPAF Rubric',
        isCompleted: activeClass.fields.length >= 3 && Math.abs(activeClass.fields.reduce((s, f) => s + (f.weight !== undefined && f.weight > 0 ? f.weight : Math.round(100 / Math.max(1, activeClass.fields.length))), 0) - 100) < 0.1
      },
      {
        id: 4,
        stageName: '4. Student Portal View',
        title: 'Mission 4: Test Student Mobile Assessment Portal',
        tab: 'roster',
        instruction: 'In Section 1 Classroom Roster, click the Smartphone icon in any student\'s row to simulate their smartphone peer rating portal, adjust sliders, and submit test marks.',
        targetHint: 'Section 1 Roster Table → Actions Column → Click Smartphone icon',
        actionButtonLabel: 'Open Smartphone Simulator',
        isCompleted: activeClass.reviews.length > 0 || previewingStudent !== null
      },
      {
        id: 5,
        stageName: '5. Section 3: Analytics',
        title: 'Mission 5: Calibrate WebPA Factor & Inspect Perception Radar',
        tab: 'results',
        instruction: 'Switch to Section 3: Grading & Analytics (Press 3). Drag the WebPA Fudge Weight slider to balance individual peer factors, and inspect Johari blind spots and spider radar charts.',
        targetHint: 'Navigation Switcher → "3. Analytics" → WebPA Calibrator Slider',
        actionButtonLabel: 'Populate Peer Review Scores',
        isCompleted: activeClass.reviews.length > 0
      }
    ];
  }, [activeClass?.students, activeClass?.fields, activeClass?.reviews, previewingStudent]);

  // Memoized data structures (Declared unconditionally at the top before any early returns)
  const stats = useMemo(() => {
    if (!activeClass) {
      return {
        totalStudents: 0,
        submittedCount: 0,
        pendingCount: 0,
        completionRate: 0,
        groupCount: 0,
        classAverage: 0
      };
    }
    return calculateClassStats(activeClass);
  }, [activeClass]);

  const uniqueGroups = useMemo(() => {
    if (!activeClass?.students) return [];
    return Array.from(new Set(activeClass.students.map(s => s.groupName)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [activeClass?.students]);

  const classTeams = useMemo(() => {
    if (!activeClass?.students) return [];
    return Array.from(
      new Set(
        activeClass.students
          .map(s => s.groupName)
          .filter(g => Boolean(g) && g.trim() !== '' && g !== 'Unassigned' && g !== 'None')
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [activeClass?.students]);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return classTeams;
    const q = teamSearchQuery.toLowerCase().trim();
    return classTeams.filter(team => {
      if (team.toLowerCase().includes(q)) return true;
      const members = activeClass?.students.filter(s => s.groupName === team) || [];
      return members.some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    });
  }, [classTeams, teamSearchQuery, activeClass?.students]);

  const filteredStudents = useMemo(() => {
    if (!activeClass?.students) return [];
    return activeClass.students.filter(student => {
      if (showOnlyDuplicates && !duplicateFlagsMap.has(student.id)) {
        return false;
      }
      const term = searchTerm.toLowerCase().trim();
      const isPendingFilter = term === 'pending' || term === 'unsubmitted';
      const isSubmittedFilter = term === 'submitted' || term === 'completed';
      const isUnassignedFilter = term === 'unassigned' || term === 'no team';

      let statusMatch = false;
      if (isPendingFilter) statusMatch = !student.submitted;
      else if (isSubmittedFilter) statusMatch = !!student.submitted;
      else if (isUnassignedFilter) statusMatch = !student.groupName || student.groupName.toLowerCase() === 'unassigned';

      const matchesSearch = !term || statusMatch ||
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term) ||
        (student.nationality && student.nationality.toLowerCase().includes(term)) ||
        (student.gender && student.gender.toLowerCase().includes(term)) ||
        (student.englishProficiency && student.englishProficiency.toLowerCase().includes(term)) ||
        (student.university && student.university.toLowerCase().includes(term)) ||
        (student.degree && student.degree.toLowerCase().includes(term)) ||
        (student.studentType && student.studentType.toLowerCase().includes(term));
      const matchesGroup = groupFilter === 'All Groups' || student.groupName === groupFilter;
      return matchesSearch && matchesGroup;
    }).sort((a, b) => {
      const gA = (a.groupName && a.groupName.trim()) ? a.groupName.trim() : 'Unassigned';
      const gB = (b.groupName && b.groupName.trim()) ? b.groupName.trim() : 'Unassigned';

      const isUnassignedA = gA.toLowerCase() === 'unassigned';
      const isUnassignedB = gB.toLowerCase() === 'unassigned';

      if (isUnassignedA && !isUnassignedB) return 1;
      if (!isUnassignedA && isUnassignedB) return -1;

      const comp = gA.localeCompare(gB, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) return comp;

      return a.name.localeCompare(b.name);
    });
  }, [activeClass?.students, showOnlyDuplicates, duplicateFlagsMap, searchTerm, groupFilter]);

  const profileOptions = useMemo(() => [
    ...adminProfiles.map(p => ({ value: p, label: `Admin: ${p.toUpperCase()}` })),
    { value: '__new__', label: '+ New Workspace' }
  ], [adminProfiles]);

  const classOptions = useMemo(() => classes.map(c => ({
    value: c.id,
    label: c.name,
    sublabel: c.id
  })), [classes]);

  const groupOptions = useMemo(() => [
    { value: 'All Groups', label: 'All Groups' },
    ...uniqueGroups.map(g => ({ value: g, label: g }))
  ], [uniqueGroups]);

  const emailServiceOptions = useMemo(() => [
    { value: 'simulator', label: 'Demo Mode — No emails sent' },
    { value: 'emailjs', label: 'EmailJS Adapter (Send live emails)' },
    { value: 'brevo', label: 'Brevo API Service (300 Free Mails/Day)' }
  ], []);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Yes, Proceed',
    cancelText = 'Cancel'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  React.useEffect(() => {
    localStorage.setItem('peer_fudge_weight', String(fudgeWeight));
    localStorage.setItem('peer_base_grade', String(baseGroupGrade));
  }, [fudgeWeight, baseGroupGrade]);

  // Email Automation Simulator state
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState(0);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  // Email Automation Simulator state with localStorage persistence
  const [emailService, setEmailService] = useState<'simulator' | 'emailjs' | 'brevo'>(
    () => (localStorage.getItem('peer_email_service') as any) || 'simulator'
  );
  const [emailjsServiceId, setEmailjsServiceId] = useState(
    () => localStorage.getItem('peer_emailjs_service_id') || ''
  );
  const [emailjsTemplateId, setEmailjsTemplateId] = useState(
    () => localStorage.getItem('peer_emailjs_template_id') || ''
  );
  const [emailjsUserId, setEmailjsUserId] = useState(
    () => localStorage.getItem('peer_emailjs_user_id') || ''
  );

  // Brevo configuration state
  const [brevoApiKey, setBrevoApiKey] = useState(
    () => localStorage.getItem('peer_brevo_api_key') || ''
  );
  const [brevoSenderEmail, setBrevoSenderEmail] = useState(
    () => localStorage.getItem('peer_brevo_sender_email') || ''
  );
  const [brevoSenderName, setBrevoSenderName] = useState(
    () => localStorage.getItem('peer_brevo_sender_name') || ''
  );

  // Custom Email Template states
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [customEmailSubject, setCustomEmailSubject] = useState(
    () => localStorage.getItem('peer_custom_email_subject') || 'Evaluation Invitation: Anonymous Peer Assessment - {{courseName}}'
  );
  const [customEmailBody, setCustomEmailBody] = useState(
    () => localStorage.getItem('peer_custom_email_body') || `Dear {{studentName}},\n\nYour Professor has initiated the anonymous Peer-to-Peer grading session for the course {{courseName}}. Peer assessment is a vital component of this course, designed to ensure fair, objective, and collaborative feedback within your team.\n\nPlease use the secure, personal link below to evaluate your teammates on their contributions. Your feedback is completely confidential: teammates will only see aggregated group scores, and individual ratings are strictly anonymous.\n\nBest regards,\nYour Professor`
  );

  React.useEffect(() => {
    localStorage.setItem('peer_email_service', emailService);
    localStorage.setItem('peer_emailjs_service_id', emailjsServiceId);
    localStorage.setItem('peer_emailjs_template_id', emailjsTemplateId);
    localStorage.setItem('peer_emailjs_user_id', emailjsUserId);
    localStorage.setItem('peer_brevo_api_key', brevoApiKey);
    localStorage.setItem('peer_brevo_sender_email', brevoSenderEmail);
    localStorage.setItem('peer_brevo_sender_name', brevoSenderName);
    localStorage.setItem('peer_custom_email_subject', customEmailSubject);
    localStorage.setItem('peer_custom_email_body', customEmailBody);
  }, [emailService, emailjsServiceId, emailjsTemplateId, emailjsUserId, brevoApiKey, brevoSenderEmail, brevoSenderName, customEmailSubject, customEmailBody]);

  // Synchronize Firebase Config panel input states when active profile or config changes
  React.useEffect(() => {
    if (firebaseConfig) {
      setFbApiKey(firebaseConfig.apiKey || '');
      setFbProjectId(firebaseConfig.projectId || '');
      setFbAuthDomain(firebaseConfig.authDomain || '');
      setFbAppId(firebaseConfig.appId || '');
    } else {
      setFbApiKey('');
      setFbProjectId('');
      setFbAuthDomain('');
      setFbAppId('');
    }
  }, [firebaseConfig]);

  // Synchronize dynamic browser document tab titles based on active dashboard view
  React.useEffect(() => {
    if (isCloudSynced && !user) {
      document.title = 'Instructor Sign-In - PeerLens';
      return;
    }
    const tabTitles: Record<string, string> = {
      hub: 'Hub Overview',
      roster: 'Enrollment & Teams',
      grading: 'Review System',
      results: 'Grading & Performance Analytics',
      automation: 'Notification Center',
      cloud: 'Data & Sync'
    };
    const classNamePart = activeClass ? ` | ${activeClass.name}` : '';
    document.title = `${tabTitles[activeTab] || 'Dashboard'}${classNamePart} - PeerLens`;
  }, [activeTab, activeClass, isCloudSynced, user]);

  // Synchronize mini QR preview code whenever active classroom changes
  React.useEffect(() => {
    if (activeClass?.id) {
      let url = `${window.location.origin}${window.location.pathname}?enrollClassId=${activeClass.id}`;
      if (isCloudSynced && firebaseConfig && user) {
        const payload = {
          a: firebaseConfig.apiKey,
          p: firebaseConfig.projectId,
          d: firebaseConfig.authDomain,
          i: firebaseConfig.appId,
          o: user.uid
        };
        const encoded = btoa(JSON.stringify(payload));
        url += `&fb=${encoded}`;
      }
      QRCode.toDataURL(url, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then((dataUrl) => setMiniQrUrl(dataUrl))
        .catch((err) => console.error('Failed to generate mini QR:', err));
    }
  }, [activeClass?.id, isCloudSynced, user, firebaseConfig]);

  const executeShortcutActionRef = useRef<(actionId: string) => void>(() => {});

  // Global Keyboard Shortcuts Event Handler (Strictly called before any early return)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.tagName === 'SELECT'
      );

      // Handle Escape to dismiss open overlays/modals
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) { setIsShortcutsModalOpen(false); return; }
        if (isGuideCenterOpen) { setIsGuideCenterOpen(false); return; }
        if (previewingStudent) { setPreviewingStudent(null); return; }
        if (isTourOpen) { setIsTourOpen(false); return; }
        if (isCommandPaletteOpen) { setIsCommandPaletteOpen(false); return; }
        if (isSettingsModalOpen) { setIsSettingsModalOpen(false); return; }
        if (isLinkDispatcherOpen) { setIsLinkDispatcherOpen(false); return; }
        if (isProjectorModalOpen) { setIsProjectorModalOpen(false); return; }
        if (isAutoGroupModalOpen) { setIsAutoGroupModalOpen(false); return; }
        if (isQRCodeModalOpen) { setIsQRCodeModalOpen(false); return; }
        if (isReportModalOpen) { setIsReportModalOpen(false); return; }
        if (isAddStudentModalOpen) { setIsAddStudentModalOpen(false); return; }
        if (isWizardOpen) { setIsWizardOpen(false); return; }
        if (isArchiveModalOpen) { setIsArchiveModalOpen(false); return; }
        if (isNewClassModalOpen) { setIsNewClassModalOpen(false); return; }
        if (isNewProfileModalOpen) { setIsNewProfileModalOpen(false); return; }
        if (isMobileProfileModalOpen) { setIsMobileProfileModalOpen(false); return; }
        if (confirmModal.isOpen) { setConfirmModal(prev => ({ ...prev, isOpen: false })); return; }
        if (activeTab !== 'hub') {
          setActiveTab('hub');
          return;
        }
        return;
      }

      // Ctrl + K / Cmd + K to toggle Command Palette / Finder
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (isInputFocused) return;

      // If any modal/overlay is currently active, don't fire background shortcuts
      const isAnyModalOpen = isShortcutsModalOpen || isGuideCenterOpen || !!previewingStudent || isTourOpen || 
        isCommandPaletteOpen || isSettingsModalOpen || isLinkDispatcherOpen || 
        isProjectorModalOpen || isAutoGroupModalOpen || isQRCodeModalOpen || 
        isReportModalOpen || isAddStudentModalOpen || isWizardOpen || 
        isArchiveModalOpen || confirmModal.isOpen || isNewClassModalOpen || 
        isNewProfileModalOpen || isMobileProfileModalOpen;

      if (isAnyModalOpen) return;

      // Match against configured shortcuts
      const match = shortcuts.find(s => matchShortcut(e, s));
      if (!match) return;

      e.preventDefault();
      e.stopPropagation();

      const actionToRun = match.actionId || match.id;
      executeShortcutActionRef.current(actionToRun);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    shortcuts,
    isShortcutsModalOpen,
    isGuideCenterOpen,
    previewingStudent,
    isTourOpen,
    isCommandPaletteOpen,
    isSettingsModalOpen,
    isLinkDispatcherOpen,
    isProjectorModalOpen,
    isAutoGroupModalOpen,
    isQRCodeModalOpen,
    isReportModalOpen,
    isAddStudentModalOpen,
    isWizardOpen,
    isArchiveModalOpen,
    confirmModal.isOpen,
    isNewClassModalOpen,
    isNewProfileModalOpen,
    isMobileProfileModalOpen,
    activeTab
  ]);

  // Handle Admin Authentication Form Submission (Option A)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Email and Password are required fields.');
      return;
    }
    try {
      if (isSigningUp) {
        await signupAdmin(authEmail.trim(), authPassword.trim());
      } else {
        await loginAdmin(authEmail.trim(), authPassword.trim());
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthError('');
    } catch (err: any) {
      console.error('Authentication gate error:', err);
      setAuthError(err?.message || 'Failed to authenticate. Please check your credentials.');
    }
  };

  // Secure Admin Authentication Gate Returns
  if (isCloudSynced && authLoading) {
    return (
      <div className="auth-loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 500 }}>
          Securing database session...
        </p>
      </div>
    );
  }

  if (isCloudSynced && !user) {
    return (
      <div className="auth-overlay-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
              <ShieldCheck size={32} />
            </div>
            <h2>Instructor Portal</h2>
            <p>Link and authenticate your workspace environment securely under your instructor account.</p>
          </div>

          {authError && (
            <div className="alert-banner-rose" style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Instructor Email</label>
              <input
                type="email"
                placeholder="admin@university.edu"
                className="form-input"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}>
              {isSigningUp ? 'Create Instructor Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsSigningUp(!isSigningUp);
                setAuthError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {isSigningUp ? 'Already have an account? Sign In' : "New instructor? Create an account"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeClass) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
        {/* Unified Topbar for Welcome Screen */}
        <header className="app-header">
          <div className="brand" onClick={() => setActiveTab('hub')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/PeerGrading.png" alt="PeerLens" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
              PeerLens
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm dock-btn"
              onClick={() => setIsNewClassModalOpen(true)}
              style={{ gap: '0.35rem', height: '32px', fontWeight: 700 }}
            >
              <Plus size={14} /> <span>New Class</span>
            </button>
            <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.15rem' }} />
            <ThemeSwitcher />
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1.5rem', flex: 1, padding: '2rem' }}>
          {/* App logo with glow ring + float animation */}
          <div className="welcome-logo-wrapper">
            <div className="welcome-logo-glow" />
            <div className="welcome-logo-ring">
              <img
                src="/PeerGrading.png"
                alt="PeerLens Logo"
                className="welcome-logo-img"
              />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome to PeerLens Instructor Panel</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Get started by creating your first classroom group.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsNewClassModalOpen(true)} style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', gap: '0.5rem' }}>
            <Plus size={18} /> Create Classroom
          </button>
        </div>

        {/* MODAL: CREATE CLASSROOM (Rendered here to allow creation when activeClass is null) */}
        <Modal
          isOpen={isNewClassModalOpen}
          onClose={() => setIsNewClassModalOpen(false)}
          title="Create New Classroom Group"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsNewClassModalOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newClassName.trim()) {
                    createClass(newClassName.trim());
                    setNewClassName('');
                    setIsNewClassModalOpen(false);
                  } else {
                    addToast('Classroom name cannot be empty.', 'warning');
                  }
                }}
              >
                Add Classroom
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Classroom / Course Group Title Name</label>
            <input
              type="text"
              placeholder="e.g. Algorithms Design - Spring 2026"
              className="form-input"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    );
  }

  // Multi-format wizard file selector & parser
  const handleWizardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWizardFileName(file.name);

    try {
      const matrix = await extractRosterMatrix(file);
      if (matrix.length < 2) {
        addToast('Selected file must contain a header row and at least one data row.', 'warning');
        return;
      }
      handleParsedRawMatrix(matrix);
    } catch (err: any) {
      addToast(err.message || 'Failed to read file.', 'error');
    } finally {
      e.target.value = ''; // Reset input element
    }
  };

  // Raw copy-paste spreadsheet splitter
  const handleWizardPasteSubmit = () => {
    if (!wizardPasteText.trim()) {
      addToast('Please paste columns copied from Excel or Google Sheets.', 'warning');
      return;
    }

    const matrix = parseRawPastedText(wizardPasteText);
    if (matrix.length < 2) {
      addToast('Pasted content must contain a header row and at least one data row.', 'warning');
      return;
    }
    setWizardFileName('Pasted Clipboard Spreadsheet');
    handleParsedRawMatrix(matrix);
  };

  // Process extracted roster cells
  const handleParsedRawMatrix = (matrix: string[][]) => {
    const headersList = matrix[0].map(h => h.trim());
    setWizardHeaders(headersList);
    setWizardRawData(matrix);

    // Fuzzy guess mapping for all 10 standard fields
    const newMapping = {
      name: -1,
      email: -1,
      id: -1,
      groupName: -1,
      university: -1,
      degree: -1,
      studentType: -1,
      gender: -1,
      nationality: -1,
      englishProficiency: -1
    };

    headersList.forEach((header, idx) => {
      const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Email
      if (['email', 'emailid', 'mail', 'emailaddress', 'useremail', 'studentemail', 'address'].some(s => norm.includes(s))) {
        if (newMapping.email === -1) newMapping.email = idx;
      }
      // Student ID
      else if (['studentid', 'uniqueid', 'rollno', 'roll', 'matric', 'regno', 'id', 'studentnumber', 'studid'].some(s => norm === s || norm.startsWith('id') || norm.endsWith('id') || norm.includes('studentid'))) {
        if (newMapping.id === -1) newMapping.id = idx;
      }
      // Full Name
      else if (['fullname', 'studentname', 'name', 'member', 'student', 'participant', 'firstlast'].some(s => norm.includes(s))) {
        if (newMapping.name === -1) newMapping.name = idx;
      }
      // Group / Team
      else if (['group', 'team', 'groupname', 'teamname', 'classgroup', 'squad', 'cohort', 'projectgroup'].some(s => norm.includes(s))) {
        if (newMapping.groupName === -1) newMapping.groupName = idx;
      }
      // Gender
      else if (['gender', 'sex', 'pronoun'].some(s => norm.includes(s))) {
        if (newMapping.gender === -1) newMapping.gender = idx;
      }
      // Nationality
      else if (['nationality', 'country', 'citizenship', 'nation', 'origin'].some(s => norm.includes(s))) {
        if (newMapping.nationality === -1) newMapping.nationality = idx;
      }
      // English Proficiency
      else if (['english', 'englishproficiency', 'englishlevel', 'languagelevel', 'proficiency', 'cefr', 'englishskill'].some(s => norm.includes(s))) {
        if (newMapping.englishProficiency === -1) newMapping.englishProficiency = idx;
      }
      // University
      else if (['university', 'uni', 'college', 'institution', 'school', 'campus', 'institute'].some(s => norm.includes(s))) {
        if (newMapping.university === -1) newMapping.university = idx;
      }
      // Degree
      else if (['degree', 'major', 'program', 'course', 'degreefield', 'field', 'branch', 'specialization'].some(s => norm.includes(s))) {
        if (newMapping.degree === -1) newMapping.degree = idx;
      }
      // Student Type
      else if (['studenttype', 'type', 'status', 'erasmus', 'enrollmenttype', 'category'].some(s => norm.includes(s))) {
        if (newMapping.studentType === -1) newMapping.studentType = idx;
      }
    });

    setWizardMapping(newMapping);
    setWizardStep(2); // Go to Column mapping step
  };

  // Mapping verification step
  const handleWizardVerifyClick = () => {
    if (wizardMapping.name === -1 || wizardMapping.email === -1) {
      addToast('Full Name and Email ID columns are required. Please map them.', 'warning');
      return;
    }

    const studentsDraft = wizardRawData.slice(1).map((row, _rIdx) => {
      const nameVal = wizardMapping.name !== -1 ? (row[wizardMapping.name] || '').trim() : '';
      const emailVal = wizardMapping.email !== -1 ? (row[wizardMapping.email] || '').trim() : '';
      const idVal = wizardMapping.id !== -1 ? (row[wizardMapping.id] || '').trim() : '';
      const groupVal = wizardMapping.groupName !== -1 ? (row[wizardMapping.groupName] || '').trim() : 'Unassigned';
      const uniVal = wizardMapping.university !== -1 ? (row[wizardMapping.university] || '').trim() : '';
      const degreeVal = wizardMapping.degree !== -1 ? (row[wizardMapping.degree] || '').trim() : '';
      const studentTypeVal = wizardMapping.studentType !== -1 ? (row[wizardMapping.studentType] || '').trim() : 'Normal';
      const genderVal = wizardMapping.gender !== -1 ? (row[wizardMapping.gender] || '').trim() : 'Prefer not to say';
      const nationalityVal = wizardMapping.nationality !== -1 ? (row[wizardMapping.nationality] || '').trim() : '';
      const englishVal = wizardMapping.englishProficiency !== -1 ? (row[wizardMapping.englishProficiency] || '').trim() : 'Fluent (C1/C2)';

      const rawId = idVal || 'std_' + Math.abs(hashCode(emailVal || nameVal || String(Math.random())));

      return {
        id: String(rawId),
        name: nameVal,
        email: emailVal,
        groupName: groupVal || 'Unassigned',
        university: uniVal || undefined,
        degree: degreeVal || undefined,
        studentType: studentTypeVal || 'Normal',
        gender: genderVal || 'Prefer not to say',
        nationality: normalizeNationality(nationalityVal) || undefined,
        englishProficiency: englishVal || 'Fluent (C1/C2)',
        submitted: false
      };
    });

    setWizardStudents(studentsDraft);
    validateWizardRoster(studentsDraft);
    setWizardStep(3); // Go to verification editor grid
  };

  // Draft spreadsheet editor validations
  const validateWizardRoster = (students: any[]) => {
    const errors: Record<number, string[]> = {};
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();

    students.forEach((s, idx) => {
      const rowErrors: string[] = [];
      if (!s.name.trim()) {
        rowErrors.push('Name is required.');
      }
      if (!s.email.trim()) {
        rowErrors.push('Email is required.');
      } else if (!validateEmail(s.email)) {
        rowErrors.push('Invalid email format.');
      } else if (seenEmails.has(s.email.toLowerCase())) {
        rowErrors.push('Duplicate email.');
      } else {
        seenEmails.add(s.email.toLowerCase());
      }

      if (!s.id.trim()) {
        rowErrors.push('Unique ID is required.');
      } else if (seenIds.has(s.id)) {
        rowErrors.push('Duplicate Unique ID.');
      } else {
        seenIds.add(s.id);
      }

      if (rowErrors.length > 0) {
        errors[idx] = rowErrors;
      }
    });
    setWizardErrors(errors);
  };

  // Cell updates
  const handleWizardCellChange = (index: number, key: string, value: string) => {
    const updated = [...wizardStudents];
    updated[index] = {
      ...updated[index],
      [key]: key === 'nationality' ? normalizeNationality(value) : value
    };
    setWizardStudents(updated);
    validateWizardRoster(updated);
  };

  // Add row
  const handleWizardAddRow = () => {
    const updated = [
      ...wizardStudents,
      {
        id: 'std_' + Math.floor(Math.random() * 100000),
        name: '',
        email: '',
        groupName: 'Unassigned',
        university: '',
        degree: '',
        studentType: 'Normal',
        gender: 'Prefer not to say',
        nationality: '',
        englishProficiency: 'Fluent (C1/C2)',
        submitted: false
      }
    ];
    setWizardStudents(updated);
    validateWizardRoster(updated);
  };

  // Remove row
  const handleWizardRemoveRow = (index: number) => {
    const updated = wizardStudents.filter((_, idx) => idx !== index);
    setWizardStudents(updated);
    validateWizardRoster(updated);
  };

  // Finalize import
  const handleWizardFinalize = () => {
    if (Object.keys(wizardErrors).length > 0) {
      addToast('Please resolve all highlighted row errors before finalizing.', 'warning');
      return;
    }

    importRoster(activeClass.id, wizardStudents, false);
    addToast(`Successfully imported ${wizardStudents.length} classroom members!`, 'success');
    setIsWizardOpen(false);
    resetWizardState();
  };

  // Reset wizard
  const resetWizardState = () => {
    setWizardStep(1);
    setWizardRawData([]);
    setWizardFileName('');
    setWizardHeaders([]);
    setWizardMapping({
      name: -1,
      email: -1,
      id: -1,
      groupName: -1,
      university: -1,
      degree: -1,
      studentType: -1,
      gender: -1,
      nationality: -1,
      englishProficiency: -1
    });
    setWizardStudents([]);
    setWizardErrors({});
    setWizardPasteText('');
  };

  // Add individual student manually
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      addToast('Please enter full name and email address.', 'warning');
      return;
    }

    addStudent(activeClass.id, {
      id: newStudent.id.trim() || 'std_' + Math.floor(Math.random() * 100000),
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      groupName: newStudent.groupName.trim() || 'Unassigned',
      gender: newStudent.gender.trim() || 'Prefer not to say',
      isInternational: newStudent.isInternational,
      isExchange: newStudent.isExchange,
      nationality: normalizeNationality(newStudent.nationality) || undefined,
      currentCountry: newStudent.isInternational
        ? (normalizeNationality(newStudent.currentCountry) || undefined)
        : (normalizeNationality(newStudent.currentCountry || newStudent.nationality) || undefined),
      englishProficiency: newStudent.englishProficiency.trim() || 'Fluent (C1/C2)',
      university: newStudent.isExchange ? (newStudent.currentUniversity.trim() || newStudent.university.trim() || undefined) : (newStudent.university.trim() || undefined),
      degree: newStudent.degree.trim() || undefined,
      originalUniversity: newStudent.isExchange ? newStudent.originalUniversity.trim() || undefined : undefined,
      originalCountry: newStudent.isExchange ? normalizeNationality(newStudent.originalCountry) || undefined : undefined,
      currentUniversity: newStudent.isExchange ? newStudent.currentUniversity.trim() || undefined : undefined,
      studentType: newStudent.isExchange ? 'Erasmus' : newStudent.isInternational ? 'International' : 'Normal'
    });

    // Reset inputs
    setNewStudent({
      id: '',
      name: '',
      email: '',
      groupName: '',
      gender: 'Female',
      isInternational: false,
      isExchange: false,
      nationality: '',
      currentCountry: '',
      englishProficiency: 'Fluent (C1/C2)',
      university: '',
      degree: '',
      originalUniversity: '',
      originalCountry: '',
      currentUniversity: '',
      studentType: 'Normal'
    });
    setIsAddStudentModalOpen(false);
    addToast('Student participant enrolled successfully!', 'success');
  };

  // Submit student edits
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentData.name.trim() || !editStudentData.email.trim()) {
      addToast('Please enter full name and email address.', 'warning');
      return;
    }

    updateStudent(activeClass.id, editStudentData.id, {
      name: editStudentData.name.trim(),
      email: editStudentData.email.trim(),
      groupName: editStudentData.groupName.trim() || 'Unassigned',
      gender: editStudentData.gender.trim() || 'Prefer not to say',
      isInternational: editStudentData.isInternational,
      isExchange: editStudentData.isExchange,
      nationality: normalizeNationality(editStudentData.nationality) || undefined,
      currentCountry: editStudentData.isInternational
        ? (normalizeNationality(editStudentData.currentCountry) || undefined)
        : (normalizeNationality(editStudentData.currentCountry || editStudentData.nationality) || undefined),
      englishProficiency: editStudentData.englishProficiency.trim() || 'Fluent (C1/C2)',
      university: editStudentData.isExchange ? (editStudentData.currentUniversity.trim() || editStudentData.university.trim() || undefined) : (editStudentData.university.trim() || undefined),
      degree: editStudentData.degree.trim() || undefined,
      originalUniversity: editStudentData.isExchange ? editStudentData.originalUniversity.trim() || undefined : undefined,
      originalCountry: editStudentData.isExchange ? normalizeNationality(editStudentData.originalCountry) || undefined : undefined,
      currentUniversity: editStudentData.isExchange ? editStudentData.currentUniversity.trim() || undefined : undefined,
      studentType: editStudentData.isExchange ? 'Erasmus' : editStudentData.isInternational ? 'International' : 'Normal'
    });

    setIsEditStudentModalOpen(false);
    addToast('Student profile updated successfully!', 'success');
  };

  // Helper to generate cloud-synced enrollment link for students
  const getClassEnrollmentUrl = (classId: string) => {
    let url = `${window.location.origin}${window.location.pathname}?enrollClassId=${classId}`;
    if (isCloudSynced && firebaseConfig && user) {
      const payload = {
        a: firebaseConfig.apiKey,
        p: firebaseConfig.projectId,
        d: firebaseConfig.authDomain,
        i: firebaseConfig.appId,
        o: user.uid
      };
      const encoded = btoa(JSON.stringify(payload));
      url += `&fb=${encoded}`;
    }
    return url;
  };

  // Export Results to XLSX Excel Workbook
  const handleExportExcel = () => {
    try {
      if (!activeClass) return;
      exportClassroomToExcel(activeClass);
      addToast('Excel workbook (.xlsx) downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate Excel export file.', 'error');
    }
  };

  // Interactive rubrics scale adder / modifiers
  const handleAddField = () => {
    const nextNum = activeClass.fields.length + 1;
    const newField: GradingScaleField = {
      id: 'f_' + Math.random().toString(36).substring(2, 9),
      name: `Criterion ${nextNum}`,
      description: '',
      min: 1,
      max: 20,
      weight: 0
    };
    const allFields = [...activeClass.fields, newField];
    const base = Math.floor(100 / allFields.length);
    const remainder = 100 - (base * allFields.length);
    const balanced = allFields.map((f, i) => ({
      ...f,
      weight: base + (i === 0 ? remainder : 0)
    }));
    updateGradingConfig(activeClass.id, balanced);
    addToast(`Added Criterion ${nextNum} and balanced weights to 100% (each ~${base}%).`, 'success');
  };

  const handleAutoBalanceWeights = () => {
    const count = activeClass.fields.length;
    if (count === 0) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - (base * count);
    const updated = activeClass.fields.map((f, i) => ({
      ...f,
      weight: base + (i === 0 ? remainder : 0)
    }));
    updateGradingConfig(activeClass.id, updated, undefined, false);
    addToast('Criterion weights automatically balanced to exactly 100%!', 'success');
  };

  const handleUpdateField = (id: string, updates: Partial<GradingScaleField>) => {
    const updated = activeClass.fields.map(f => {
      if (f.id === id) return { ...f, ...updates };
      return f;
    });
    updateGradingConfig(activeClass.id, updated, undefined, false);
  };

  const handleDeleteField = (id: string) => {
    if (activeClass.fields.length === 1) {
      addToast('At least one grading metric is required.', 'warning');
      return;
    }
    const filtered = activeClass.fields.filter(f => f.id !== id);
    const base = Math.floor(100 / filtered.length);
    const remainder = 100 - (base * filtered.length);
    const balanced = filtered.map((f, i) => ({
      ...f,
      weight: base + (i === 0 ? remainder : 0)
    }));
    updateGradingConfig(activeClass.id, balanced);
    addToast(`Rubric criterion removed and weights re-balanced to 100% across remaining ${filtered.length} criteria.`, 'info');
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = RUBRIC_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const newFields: GradingScaleField[] = preset.fields.map((f, idx) => ({
      id: `f_${Date.now()}_${idx}`,
      name: f.name,
      description: f.description,
      min: f.min,
      max: f.max,
      weight: f.weight
    }));
    updateGradingConfig(activeClass.id, newFields, preset.targetScale);
    addToast(`Applied "${preset.name}" (Scale out of 20) with ${newFields.length} criteria.`, 'success');
  };

  // Handler for Guided Sandbox Launch & Step Auto-Completion
  const handleLaunchSandbox = () => {
    try {
      const snap = JSON.stringify(classes);
      setSandboxSnapshot(snap);
      sessionStorage.setItem('peer_sandbox_classes_backup', snap);
    } catch (e) {
      console.warn('Failed to snapshot classrooms', e);
    }
    // Clear active classroom temporarily for clean hands-on walkthrough silently (no toast spam)
    clearClassRoster(activeClass.id, true);
    resetClassReviews(activeClass.id, true);
    setIsSandboxActive(true);
    setSandboxMissionIndex(0);
    setActiveTab('roster');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAutoCompleteSandboxStep = () => {
    const teamNames = [
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
      'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
      'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
      'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon'
    ];

    if (sandboxMissionIndex === 0) {
      // Step 1: Enroll 100 demo students unassigned
      const unassignedStudents = DIVERSE_100_STUDENTS.map(s => ({
        ...s,
        groupName: 'Unassigned',
        submitted: false
      }));
      importRoster(activeClass.id, unassignedStudents, true);
      addToast('Mission 1 Complete! Enrolled 100 international students into roster.', 'success');
      setSandboxMissionIndex(1);
    } else if (sandboxMissionIndex === 1) {
      // Step 2: Auto-partition into 20 balanced teams
      const studentsToPartition = activeClass.students.length > 0 ? activeClass.students : DIVERSE_100_STUDENTS;
      const partitioned = studentsToPartition.map((s, idx) => ({
        ...s,
        groupName: teamNames[Math.floor(idx / 5)] || `Team ${Math.floor(idx / 5) + 1}`,
        submitted: false
      }));
      importRoster(activeClass.id, partitioned, true);
      addToast('Mission 2 Complete! Partitioned students into 20 balanced teams.', 'success');
      setSandboxMissionIndex(2);
      setActiveTab('grading');
    } else if (sandboxMissionIndex === 2) {
      // Step 3: Apply research-synthesized IPAF preset
      handleApplyPreset('ipaf_research_synthesized');
      addToast('Mission 3 Complete! Applied IPAF research-synthesized rubric.', 'success');
      setSandboxMissionIndex(3);
      setActiveTab('roster');
    } else if (sandboxMissionIndex === 3) {
      // Step 4: Launch smartphone preview
      if (activeClass.students.length > 0) {
        setPreviewingStudent(activeClass.students[0]);
      }
      addToast('Mission 4 Active! Opened Smartphone Assessment Portal Simulator.', 'info');
      setSandboxMissionIndex(4);
    } else if (sandboxMissionIndex === 4) {
      // Step 5: High-speed realistic peer reviews population across all teams
      const fields = activeClass.fields && activeClass.fields.length > 0 ? activeClass.fields : [
        { id: 'f1', name: 'Contribution to Team Goals', description: 'Active project involvement', min: 1, max: 20, weight: 20 },
        { id: 'f2', name: 'Communication & Collaboration', description: 'Clear feedback & active listening', min: 1, max: 20, weight: 20 },
        { id: 'f3', name: 'Quality of Work & Problem Solving', description: 'Critical thinking & execution', min: 1, max: 20, weight: 20 },
        { id: 'f4', name: 'Reliability & Meeting Deadlines', description: 'Punctuality & follow-through', min: 1, max: 20, weight: 20 },
        { id: 'f5', name: 'Fostering Team Climate', description: 'Inclusivity & respect', min: 1, max: 20, weight: 20 }
      ];

      const allReviews: Review[] = [];
      const studentIds = activeClass.students.map(s => s.id);

      // Group students by team
      const teamMap = new Map<string, typeof activeClass.students>();
      activeClass.students.forEach(s => {
        const list = teamMap.get(s.groupName) || [];
        list.push(s);
        teamMap.set(s.groupName, list);
      });

      const teamsList = Array.from(teamMap.entries()).filter(([_, members]) => members.length >= 3);

      // Designate educational anomaly test cases across distinct teams
      const collusionTeam = teamsList[0]?.[1]; // Team with reciprocal collusion
      const outlierTeam = teamsList[1]?.[1];   // Team with a spiteful outlier grader
      const lazyTeam = teamsList[2]?.[1];      // Team with a lazy uniform grader

      const collusionPair = collusionTeam && collusionTeam.length >= 2 ? [collusionTeam[0], collusionTeam[1]] : null;
      const outlierPair = outlierTeam && outlierTeam.length >= 2 ? { reviewer: outlierTeam[0], victim: outlierTeam[1] } : null;
      const lazyReviewer = lazyTeam && lazyTeam.length >= 2 ? lazyTeam[0] : null;

      const praiseOptions = [
        'High Quality Deliverables',
        'Creative Problem Solver',
        'Clear Communicator',
        'Supportive Team Player',
        'Reliable & Punctual',
        'Technical Master',
        'Leader & Organizer'
      ];

      const strengthsSamples = [
        'Consistently delivered thorough, well-documented work ahead of schedule.',
        'Outstanding technical execution and creative solutions during roadblocks.',
        'Facilitated team alignment, kept discussions focused, and communicated clearly.',
        'Very supportive team member who proactively helped unblock others.',
        'Exceptional attention to detail and high standard for all deliverables.'
      ];

      const growthSamples = [
        'Could share work-in-progress earlier in the sprint to allow faster feedback.',
        'Encouraged to take on more lead roles during design review sessions.',
        'Could provide more asynchronous documentation in the shared workspace.',
        'Continue to maintain active participation in group check-ins.'
      ];

      activeClass.students.forEach((reviewer, rIdx) => {
        const teammates = teamMap.get(reviewer.groupName) || [reviewer];

        teammates.forEach((recipient, tIdx) => {
          const isSelf = recipient.id === reviewer.id;
          const scores: Record<string, number> = {};

          // Check if this review matches one of the anomaly demonstration archetypes
          const isCollusionForward = collusionPair && reviewer.id === collusionPair[0].id && recipient.id === collusionPair[1].id;
          const isCollusionBackward = collusionPair && reviewer.id === collusionPair[1].id && recipient.id === collusionPair[0].id;
          const isOtherToCollusionStudent = collusionPair && (recipient.id === collusionPair[0].id || recipient.id === collusionPair[1].id) && reviewer.id !== collusionPair[0].id && reviewer.id !== collusionPair[1].id;
          
          const isSpitefulReview = outlierPair && reviewer.id === outlierPair.reviewer.id && recipient.id === outlierPair.victim.id;
          const isOtherToVictim = outlierPair && recipient.id === outlierPair.victim.id && reviewer.id !== outlierPair.reviewer.id && !isSelf;

          const isLazyGrader = lazyReviewer && reviewer.id === lazyReviewer.id && !isSelf;

          // Randomized natural distribution parameters
          const randJitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1 random variance
          const performanceTier = (recipient.name.charCodeAt(0) + recipient.name.length) % 5; // 0=Top, 1-3=Solid, 4=Variable
          const johariTrait = (recipient.name.charCodeAt(1) || 75) % 4; // 0=Accurate, 1=BlindSpot, 2=Imposter, 3=Accurate

          fields.forEach((f, fIdx) => {
            const max = f.max || 20;
            const min = f.min || 1;

            let calculatedScore = Math.round(max * 0.84);

            // Anomaly Case 1: Reciprocal Collusion (Pair exchange max scores; others rate lower)
            if (isCollusionForward || isCollusionBackward) {
              calculatedScore = max; // 100% perfect collusion rating
            } else if (isOtherToCollusionStudent) {
              calculatedScore = Math.round(max * 0.65) + randJitter; // 65% realistic rating from other teammates
            }
            // Anomaly Case 2: Extreme Outlier Grader (One reviewer rates victim harshly; others rate high)
            else if (isSpitefulReview) {
              calculatedScore = Math.round(max * 0.35); // 35% harsh outlier rating
            } else if (isOtherToVictim) {
              calculatedScore = Math.round(max * 0.90) + randJitter; // 90% positive consensus from others
            }
            // Anomaly Case 3: Lazy Uniform Grader (Same identical score for all criteria across all peers)
            else if (isLazyGrader) {
              calculatedScore = Math.round(max * 0.80); // Exact 80% uniform score (stdDev = 0)
            }
            // Standard Natural Distribution for all other students
            else {
              let basePct = 0.84;
              if (performanceTier === 0) basePct = 0.93; // Star performer (~18-20/20)
              else if (performanceTier === 4) basePct = 0.70; // Under-contributor (~13-15/20)
              else basePct = 0.82 + ((rIdx + fIdx) % 3) * 0.04; // Solid contributor (~16-18/20)

              calculatedScore = Math.round(max * basePct) + randJitter;

              // Self evaluation perception (Johari Window)
              if (isSelf) {
                if (johariTrait === 1) calculatedScore = Math.min(max, calculatedScore + 3); // Blind Spot (overestimates)
                else if (johariTrait === 2) calculatedScore = Math.max(min, calculatedScore - 3); // Imposter (underestimates)
              } else {
                const noise = ((reviewer.name.charCodeAt(0) + fIdx) % 3) - 1;
                calculatedScore = calculatedScore + noise;
              }
            }

            scores[f.id] = Math.max(min, Math.min(max, calculatedScore));
          });

          const tagIdx = (recipient.name.length + rIdx + tIdx + Math.floor(Math.random() * 3)) % praiseOptions.length;
          const strengthIdx = (recipient.name.charCodeAt(0) + tIdx + Math.floor(Math.random() * 2)) % strengthsSamples.length;
          const growthIdx = (recipient.name.charCodeAt(1) + rIdx + Math.floor(Math.random() * 2)) % growthSamples.length;

          allReviews.push({
            reviewerId: reviewer.id,
            recipientId: recipient.id,
            scores,
            praiseTags: isSelf ? undefined : [praiseOptions[tagIdx]],
            strengthsText: isSelf ? undefined : strengthsSamples[strengthIdx],
            growthText: isSelf ? undefined : growthSamples[growthIdx]
          });
        });
      });

      // 1-step instant atomic commit
      batchSubmitClassReviews(activeClass.id, allReviews, studentIds, true);
      setActiveTab('results');
      addToast(`Mission 5 Complete! Instantly populated ${allReviews.length} evaluations with Anomaly & Collusion audit diagnostics.`, 'success');
    }
  };

  const handleExitSandbox = () => {
    const snap = sandboxSnapshot || sessionStorage.getItem('peer_sandbox_classes_backup');
    if (snap) {
      try {
        const restored = JSON.parse(snap);
        restoreClassesSnapshot(restored);
        sessionStorage.removeItem('peer_sandbox_classes_backup');
      } catch (e) {
        console.warn('Failed to restore sandbox snapshot', e);
      }
    }
    setIsSandboxActive(false);
    setSandboxSnapshot(null);
    setActiveTab('roster');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('Sandbox exited. Original workspace restored with 100% data integrity.', 'info');
  };

  const handleKeepSandboxData = () => {
    sessionStorage.removeItem('peer_sandbox_classes_backup');
    setIsSandboxActive(false);
    setSandboxSnapshot(null);
    addToast('Sandbox data saved to your active course workspace.', 'success');
  };

  // Helper to generate realistic peer evaluations for testing & diagnostics
  const handlePopulateAuditData = () => {
    if (!activeClass || activeClass.students.length === 0) {
      addToast('Please enroll students or load demo cohort before generating test reviews.', 'warning');
      return;
    }
    const fields = activeClass.fields && activeClass.fields.length > 0 ? activeClass.fields : [
      { id: 'f1', name: 'Contribution to Team Goals', description: 'Active project involvement', min: 1, max: 20, weight: 20 },
      { id: 'f2', name: 'Communication & Collaboration', description: 'Clear feedback & active listening', min: 1, max: 20, weight: 20 },
      { id: 'f3', name: 'Quality of Work & Problem Solving', description: 'Critical thinking & execution', min: 1, max: 20, weight: 20 },
      { id: 'f4', name: 'Reliability & Meeting Deadlines', description: 'Punctuality & follow-through', min: 1, max: 20, weight: 20 },
      { id: 'f5', name: 'Fostering Team Climate', description: 'Inclusivity & respect', min: 1, max: 20, weight: 20 }
    ];

    const allReviews: Review[] = [];
    const studentIds = activeClass.students.map(s => s.id);

    const teamMap = new Map<string, typeof activeClass.students>();
    activeClass.students.forEach(s => {
      const list = teamMap.get(s.groupName) || [];
      list.push(s);
      teamMap.set(s.groupName, list);
    });

    const praiseOptions = [
      'High Quality Deliverables',
      'Creative Problem Solver',
      'Clear Communicator',
      'Supportive Team Player',
      'Reliable & Punctual',
      'Technical Master',
      'Leader & Organizer'
    ];

    activeClass.students.forEach((reviewer, rIdx) => {
      const teammates = teamMap.get(reviewer.groupName) || [reviewer];
      teammates.forEach((recipient, tIdx) => {
        const isSelf = recipient.id === reviewer.id;
        const scores: Record<string, number> = {};
        const randJitter = Math.floor(Math.random() * 3) - 1;

        fields.forEach(f => {
          const max = f.max || 20;
          const min = f.min || 1;
          const calculatedScore = Math.max(min, Math.min(max, Math.round(max * 0.85) + randJitter));
          scores[f.id] = calculatedScore;
        });

        const tagIdx = (recipient.name.length + rIdx + tIdx) % praiseOptions.length;
        allReviews.push({
          reviewerId: reviewer.id,
          recipientId: recipient.id,
          scores,
          praiseTags: isSelf ? undefined : [praiseOptions[tagIdx]],
          strengthsText: isSelf ? undefined : 'Great contribution and proactive participation across all project milestones.',
          growthText: isSelf ? undefined : 'Continue maintaining strong collaboration during team sprint sessions.'
        });
      });
    });

    batchSubmitClassReviews(activeClass.id, allReviews, studentIds, true);
    setActiveTab('results');
    addToast(`Generated ${allReviews.length} evaluations with real-time analytics!`, 'success');
  };

  // Assign live dispatcher to ref on each render without violating Rules of Hooks
  executeShortcutActionRef.current = (actionId: string) => {
    switch (actionId) {
      // --- Navigation ---
      case 'tab_hub':
        setActiveTab('hub');
        addToast('Switched to Classroom Hub Overview', 'info');
        break;
      case 'tab_roster':
        setActiveTab('roster');
        addToast('Switched to Section 1: Enrollment & Teams', 'info');
        break;
      case 'tab_rubric':
        setActiveTab('grading');
        addToast('Switched to Section 2: Review System', 'info');
        break;
      case 'tab_analytics':
        setActiveTab('results');
        addToast('Switched to Section 3: Grading & Analytics', 'info');
        break;
      case 'tab_cloud':
        setSettingsInitialTab('cloud');
        setIsSettingsModalOpen(true);
        break;
      case 'nav_prev_class':
        if (classes.length > 1 && activeClass) {
          const idx = classes.findIndex(c => c.id === activeClass.id);
          const prevIdx = (idx - 1 + classes.length) % classes.length;
          selectClass(classes[prevIdx].id);
          addToast(`Switched to classroom "${classes[prevIdx].name}"`, 'info');
        }
        break;
      case 'nav_next_class':
        if (classes.length > 1 && activeClass) {
          const idx = classes.findIndex(c => c.id === activeClass.id);
          const nextIdx = (idx + 1) % classes.length;
          selectClass(classes[nextIdx].id);
          addToast(`Switched to classroom "${classes[nextIdx].name}"`, 'info');
        }
        break;
      case 'scroll_top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      // --- Tools & Modals ---
      case 'focus_search':
        setIsCommandPaletteOpen(true);
        break;
      case 'open_customize_view':
        setSettingsInitialTab('modules');
        setIsSettingsModalOpen(true);
        break;
      case 'open_guide_center':
        setIsGuideCenterOpen(true);
        break;
      case 'open_projector':
        setIsProjectorModalOpen(true);
        break;
      case 'open_email':
        setIsLinkDispatcherOpen(true);
        break;
      case 'open_autogroup':
        setIsAutoGroupModalOpen(true);
        break;
      case 'open_qr_code':
        setIsQRCodeModalOpen(true);
        break;
      case 'open_settings':
        setSettingsInitialTab('modules');
        setIsSettingsModalOpen(true);
        break;
      case 'open_shortcuts_sheet':
        setIsShortcutsModalOpen(true);
        break;
      case 'open_tour':
        handleStartTour();
        break;
      case 'open_student_portal':
        if (activeClass && activeClass.students.length > 0) {
          setPreviewingStudent(activeClass.students[0]);
          addToast(`Launched Student Simulator for "${activeClass.students[0].name}"`, 'info');
        } else {
          addToast('Please enroll at least one student to launch simulator.', 'warning');
        }
        break;
      case 'toggle_theme':
        toggleThemeMode();
        addToast('Toggled interface color theme', 'info');
        break;

      // --- Roster & Teams ---
      case 'new_class':
        setIsNewClassModalOpen(true);
        break;
      case 'delete_class':
        if (activeClass) {
          triggerConfirm(
            'Delete Classroom',
            `Are you sure you want to permanently delete "${activeClass.name}"? All rosters and evaluations will be removed.`,
            () => deleteClass(activeClass.id),
            'Delete Classroom',
            'Cancel'
          );
        }
        break;
      case 'add_student':
        setIsAddStudentModalOpen(true);
        break;
      case 'import_roster':
        setIsWizardOpen(true);
        break;
      case 'populate_100_demo':
        if (activeClass) {
          importRoster(activeClass.id, DIVERSE_100_STUDENTS, true);
          addToast('Loaded 100 diverse sample students across 35+ countries!', 'success');
        }
        break;
      case 'toggle_duplicate_filter':
        setShowOnlyDuplicates(prev => {
          const next = !prev;
          addToast(next ? 'Filtered roster: showing only duplicate records' : 'Filtered roster: showing all students', 'info');
          return next;
        });
        break;
      case 'copy_class_id':
        if (activeClass) {
          navigator.clipboard.writeText(activeClass.id);
          addToast(`Classroom ID "${activeClass.id}" copied to clipboard!`, 'success');
        }
        break;
      case 'copy_portal_url':
        if (activeClass) {
          const url = `${window.location.origin}${window.location.pathname}?enrollClassId=${activeClass.id}`;
          navigator.clipboard.writeText(url);
          addToast('Student self-enrollment link copied to clipboard!', 'success');
        }
        break;
      case 'export_roster_csv':
        if (activeClass) {
          exportRosterToCSV(activeClass);
          addToast('Exported classroom roster to CSV!', 'success');
        }
        break;
      case 'download_sample_csv':
        downloadSampleStudentsFile('csv');
        addToast('Downloaded sample roster template (CSV)!', 'info');
        break;
      case 'clear_roster':
        if (activeClass) {
          triggerConfirm(
            'Clear Entire Roster',
            'Are you sure you want to remove all students and submitted evaluations from this classroom?',
            () => clearClassRoster(activeClass.id),
            'Clear Roster',
            'Cancel'
          );
        }
        break;

      // --- Rubric & Scales ---
      case 'add_criterion':
        setActiveTab('grading');
        if (activeClass) {
          const nextNum = activeClass.fields.length + 1;
          const newField: GradingScaleField = {
            id: 'f_' + Math.random().toString(36).substring(2, 9),
            name: `Criterion ${nextNum}`,
            description: '',
            min: 1,
            max: 20,
            weight: 1
          };
          updateGradingConfig(activeClass.id, [...activeClass.fields, newField]);
          addToast(`Added Criterion ${nextNum} (Scale 1 to 20).`, 'success');
        }
        break;
      case 'auto_balance_weights':
        if (activeClass && activeClass.fields.length > 0) {
          const count = activeClass.fields.length;
          const baseWeight = Math.floor(100 / count);
          const remainder = 100 - (baseWeight * count);
          const balanced = activeClass.fields.map((f, idx) => ({
            ...f,
            weight: baseWeight + (idx === 0 ? remainder : 0)
          }));
          updateGradingConfig(activeClass.id, balanced);
          addToast(`Auto-balanced ${count} criteria weights to exactly 100%!`, 'success');
        }
        break;
      case 'apply_ipaf_preset':
        handleApplyPreset('ipaf_research_synthesized');
        addToast('Applied Integrated Peer Assessment Framework (IPAF) Rubric Preset (100% balanced)!', 'success');
        break;
      case 'set_deadline':
        setIsArchiveModalOpen(true);
        break;
      case 'set_scale_20':
        if (activeClass) {
          updateGradingConfig(activeClass.id, activeClass.fields, 20);
          addToast('Set Target Scale to Out of 20 (European Standard)', 'success');
        }
        break;
      case 'set_scale_100':
        if (activeClass) {
          updateGradingConfig(activeClass.id, activeClass.fields, 100);
          addToast('Set Target Scale to Out of 100% (Percentage)', 'success');
        }
        break;
      case 'set_scale_4':
        if (activeClass) {
          updateGradingConfig(activeClass.id, activeClass.fields, 4);
          addToast('Set Target Scale to 4.0 GPA Scale', 'success');
        }
        break;
      case 'set_scale_sum':
        if (activeClass) {
          updateGradingConfig(activeClass.id, activeClass.fields, 0);
          addToast('Set Target Scale to Direct Raw Rubric Sum', 'success');
        }
        break;

      // --- Grading & Analytics ---
      case 'export_excel':
        if (activeClass) {
          exportRosterToExcel(activeClass);
          addToast('Exported complete gradebook to Excel!', 'success');
        }
        break;
      case 'export_results_csv':
        if (activeClass) {
          const csv = generateResultsCSV(activeClass);
          downloadFileContent(csv, `${activeClass.name}_Final_Grades.csv`, 'text/csv;charset=utf-8;');
          addToast('Exported calculated grades to CSV!', 'success');
        }
        break;
      case 'export_student_pdfs':
        if (activeClass && activeClass.students.length > 0) {
          openReportModal(activeClass.students[0].id);
        } else {
          addToast('No students enrolled to export report cards.', 'warning');
        }
        break;
      case 'calibrate_webpa_0':
        setFudgeWeight(0.0);
        addToast('WebPA Calibrator set to 0% (Pure Class Mean)', 'info');
        break;
      case 'calibrate_webpa_50':
        setFudgeWeight(0.5);
        addToast('WebPA Calibrator adjusted to 50% fudge weighting live!', 'success');
        break;
      case 'calibrate_webpa_100':
        setFudgeWeight(1.0);
        addToast('WebPA Calibrator set to 100% (Pure Peer Differentiation)', 'info');
        break;
      case 'populate_test_reviews':
        handlePopulateAuditData();
        break;
      case 'reset_reviews':
        if (activeClass) {
          triggerConfirm(
            'Reset All Peer Evaluations',
            'Are you sure you want to wipe all submitted peer reviews for this classroom? This action cannot be undone.',
            () => resetClassReviews(activeClass.id),
            'Reset Submissions',
            'Cancel'
          );
        }
        break;
      case 'trigger_email_reminders':
        triggerEmailAutomation(true);
        break;
      case 'trigger_email_all':
        triggerEmailAutomation(false);
        break;

      // --- Layout & Presets ---
      case 'preset_standard':
        saveFeatureToggles(DEFAULT_FEATURE_TOGGLES);
        addToast('Applied Standard Mode layout preset (Default)', 'success');
        break;
      case 'preset_minimal':
        saveFeatureToggles(MINIMAL_FEATURE_TOGGLES);
        addToast('Applied Minimal Mode layout preset', 'info');
        break;
      case 'preset_full':
        saveFeatureToggles(FULL_FEATURE_TOGGLES);
        addToast('Applied Full Suite layout preset (All modules enabled)', 'success');
        break;

      default:
        console.warn('Unhandled shortcut action:', actionId);
        break;
    }
  };

  // Send secure grading links
  const triggerEmailAutomation = async (reminderOnly: boolean = false) => {
    const targetStudents = reminderOnly
      ? activeClass.students.filter(s => !s.submitted)
      : activeClass.students;

    if (targetStudents.length === 0) {
      addToast(reminderOnly ? 'All participants have already submitted peer evaluations!' : 'Roster is empty. Add students before sending grading links.', 'warning');
      return;
    }

    if (emailService === 'emailjs') {
      if (!emailjsServiceId.trim() || !emailjsTemplateId.trim() || !emailjsUserId.trim()) {
        addToast('Please fill out all EmailJS configuration fields (Service ID, Template ID, and Public Key).', 'warning');
        return;
      }
    }

    if (emailService === 'brevo') {
      if (!brevoApiKey.trim() || !brevoSenderEmail.trim()) {
        addToast('Please fill out all Brevo configuration fields (API Key and Verified Sender Email).', 'warning');
        return;
      }
    }

    setIsSendingEmails(true);
    setEmailProgress(0);
    setEmailLogs([]);

    const total = targetStudents.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < total; i++) {
      const student = targetStudents[i];
      let link = `${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&studentId=${student.id}`;
      if (isCloudSynced && firebaseConfig && user) {
        const payload = {
          a: firebaseConfig.apiKey,
          p: firebaseConfig.projectId,
          d: firebaseConfig.authDomain,
          i: firebaseConfig.appId,
          o: user.uid
        };
        const encoded = btoa(JSON.stringify(payload));
        link += `&fb=${encoded}`;
      }

      if (emailService === 'emailjs') {
        try {
          const templateParams = {
            to_name: student.name,
            to_email: student.email,
            class_name: activeClass.name,
            evaluation_link: link,
            custom_subject: substitutePlaceholders(customEmailSubject, student.name, activeClass.name, link),
            custom_body: substitutePlaceholders(customEmailBody, student.name, activeClass.name, link)
          };

          // Dispatch using EmailJS browser API
          await emailjs.send(
            emailjsServiceId.trim(),
            emailjsTemplateId.trim(),
            templateParams,
            emailjsUserId.trim()
          );

          successCount++;
          const logMsg = `[${i + 1}/${total}] Live email successfully dispatched via EmailJS to ${student.name} (${student.email})`;
          setEmailLogs(prev => [...prev, logMsg]);
        } catch (err: any) {
          failCount++;
          const errMsg = err?.text || err?.message || 'Unknown network error';
          const logMsg = `[${i + 1}/${total}] FAILED sending to ${student.name} (${student.email}): ${errMsg}`;
          setEmailLogs(prev => [...prev, logMsg]);
        }
      } else if (emailService === 'brevo') {
        try {
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey.trim(),
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: {
                name: brevoSenderName.trim() || 'Professor',
                email: brevoSenderEmail.trim()
              },
              to: [{
                email: student.email,
                name: student.name
              }],
              subject: substitutePlaceholders(customEmailSubject, student.name, activeClass.name, link),
              htmlContent: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="background-color: #e0e7ff; color: #4f46e5; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">PeerLens Portal</span>
                  </div>
                  <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">Evaluation Invitation</h2>
                  
                  <div style="color: #1e293b; font-size: 15px; line-height: 1.6;">
                    ${renderCustomBodyToHtml(customEmailBody, student.name, activeClass.name, link)}
                  </div>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${link}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">Open Grading Portal</a>
                  </div>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; text-align: center;">
                    <strong>Security Warning:</strong> This is a secure personal link. Do not share this URL with anyone else in your class.
                  </p>
                </div>
              `
            })
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Brevo REST API rejected with status ${res.status}`);
          }

          successCount++;
          const logMsg = `[${i + 1}/${total}] Live email successfully dispatched via Brevo to ${student.name} (${student.email})`;
          setEmailLogs(prev => [...prev, logMsg]);
        } catch (err: any) {
          failCount++;
          const logMsg = `[${i + 1}/${total}] FAILED sending to ${student.name} (${student.email}): ${err.message}`;
          setEmailLogs(prev => [...prev, logMsg]);
        }
      } else {
        // High-Fidelity Simulator Mode
        await new Promise(resolve => setTimeout(resolve, 800));
        successCount++;
        const logMsg = `[${i + 1}/${total}] Simulated secure link email to ${student.name} (${student.email}) -> ${link}`;
        setEmailLogs(prev => [...prev, logMsg]);
      }

      setEmailProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsSendingEmails(false);

    if (emailService === 'emailjs' || emailService === 'brevo') {
      if (successCount > 0) {
        addToast(`Mailing campaign finished. successfully sent: ${successCount}, failed: ${failCount}`, 'success');
      } else {
        addToast(`Mailing campaign failed. All ${failCount} email dispatches failed.`, 'error');
      }
    } else {
      addToast('All secure peer-grading credentials successfully simulated!', 'success');
    }
  };

  // Firebase activation submit
  const handleFirebaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey || !fbProjectId) {
      addToast('API Key and Project ID are required for cloud storage.', 'warning');
      return;
    }
    const config: FirebaseConfig = {
      apiKey: fbApiKey,
      authDomain: fbAuthDomain,
      projectId: fbProjectId,
      storageBucket: fbStorageBucket,
      messagingSenderId: fbSenderId,
      appId: fbAppId
    };
    saveFirebaseConfig(config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
      {/* UNIFIED PERSISTENT APP TOPBAR */}
      <header className="app-header">
        {/* Left: Brand + Course Picker + ID + Delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexWrap: 'wrap' }}>
          <div
            className="brand"
            onClick={() => setActiveTab('hub')}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
            title="Return to Classroom Hub"
          >
            <img src="/PeerGrading.png" alt="PeerLens" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
              PeerLens
            </span>
          </div>

          {featureToggles.showClassPicker && (
            <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.15rem', flexShrink: 0 }} />
          )}

          {featureToggles.showClassPicker && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }} data-tour="class-header">
              <BookOpen size={16} className="text-primary" style={{ flexShrink: 0 }} />
              <CustomSelect
                options={classOptions}
                value={activeClass.id}
                onChange={(val) => selectClass(val)}
                dropdownMinWidth="220px"
                style={{ width: 'auto', minWidth: '130px' }}
                footer={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem', padding: '0.1rem 0' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      ID: <b style={{ color: 'var(--text-primary)' }}>{activeClass.id}</b>
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', height: '22px', gap: '0.25rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(activeClass.id);
                        addToast(`Class ID ${activeClass.id} copied to clipboard!`, 'info');
                      }}
                      title="Copy active Classroom ID"
                    >
                      <Copy size={11} /> <span>Copy</span>
                    </button>
                  </div>
                }
                triggerStyle={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  padding: '0.15rem 0.35rem',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  height: '30px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap'
                }}
              />
              {featureToggles.showDeleteClassButton && classes.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm text-rose"
                  onClick={() => {
                    triggerConfirm(
                      'Delete Classroom Group',
                      `Are you sure you want to permanently delete the classroom "${activeClass.name}" and all of its student rosters, evaluations, and metrics? This action cannot be undone.`,
                      () => deleteClass(activeClass.id),
                      'Delete Classroom',
                      'Cancel'
                    );
                  }}
                  title="Delete Current Class"
                  style={{ padding: '0.15rem 0.35rem', backgroundColor: 'transparent', border: 'none', color: 'var(--accent-rose)', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Tools & System Controls in exact intuitive order */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Quick Command Search - Prominent Command Bar */}
          {featureToggles.showCommandSearch && (
            <div
              className="topbar-search-bar"
              data-tour="command-palette-btn"
              onClick={() => setIsCommandPaletteOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsCommandPaletteOpen(true)}
              title="Quick Command Palette & Student Finder (Ctrl+K or /)"
            >
              <Search size={15} className="topbar-search-icon" />
              <span className="topbar-search-placeholder">Search students, rubrics, actions...</span>
              <kbd className="topbar-search-kbd">⌘K</kbd>
            </div>
          )}

          {/* Academic Guide */}
          {featureToggles.showGuideButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-btn"
              data-tour="guide-center-btn"
              onClick={() => openGuideCenter('system')}
              title="Open Academic Guidance Center &amp; Manual"
              style={{ gap: '0.35rem', height: '32px' }}
            >
              <Compass size={13} className="text-primary" /> <span>Guide</span>
            </button>
          )}

          {/* Projector Mode */}
          {featureToggles.showProjectorButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-btn"
              data-tour="projector-mode-btn"
              onClick={() => setIsProjectorModalOpen(true)}
              title="Open Fullscreen Classroom Projector Mode"
              style={{ gap: '0.35rem', height: '32px', fontWeight: 700 }}
            >
              <Maximize2 size={13} className="text-teal" /> <span>Projector</span>
            </button>
          )}

          {/* Email Center */}
          {featureToggles.showEmailButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-btn"
              data-tour="email-dispatcher-btn"
              onClick={() => setIsLinkDispatcherOpen(true)}
              title="Classroom Email Center & Evaluation Links"
              style={{ gap: '0.35rem', height: '32px' }}
            >
              <Mail size={13} className="text-primary" /> <span>Email</span>
            </button>
          )}

          {/* New Class Button */}
          {featureToggles.showNewClassButton && (
            <button
              type="button"
              className="btn btn-primary btn-sm dock-btn"
              onClick={() => setIsNewClassModalOpen(true)}
              title="Create new classroom roster"
              style={{ gap: '0.35rem', height: '32px', fontWeight: 700 }}
            >
              <Plus size={14} /> <span>New Class</span>
            </button>
          )}

          {/* Subtle Separator */}
          <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.15rem', flexShrink: 0 }} />

          {/* Minimalist Settings Icon Button */}
          {featureToggles.showSettingsButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-btn"
              data-tour="settings-hub-btn"
              onClick={() => {
                setSettingsInitialTab('modules');
                setIsSettingsModalOpen(true);
              }}
              title="Workspace Settings"
              style={{
                width: '34px',
                height: '32px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={15} className="text-primary" />
            </button>
          )}

          {/* Minimalist Customize View Icon Button (Icon only, placed after settings) */}
          {featureToggles.showCustomizeViewButton && (
            <button
              type="button"
              className="btn btn-secondary btn-sm dock-btn"
              data-tour="customize-view-btn"
              onClick={() => {
                setSettingsInitialTab('modules');
                setIsSettingsModalOpen(true);
              }}
              title="Customize Interface & Modules"
              style={{
                width: '34px',
                height: '32px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders size={14} className="text-primary" />
            </button>
          )}

          {/* Theme Switcher Toggle */}
          {featureToggles.showThemeSwitcher && (
            <ThemeSwitcher />
          )}

          {/* Admin Profile & Account Center Icon */}
          {featureToggles.showProfilePill && (
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm dock-btn"
                data-tour="workspace-selector"
                onClick={() => setIsMobileProfileModalOpen(true)}
                title={`Admin Workspace & Account Center: ${activeAdminProfile.toUpperCase()} (${isCloudSynced ? 'Cloud Synced' : 'Local Offline'})`}
                style={{
                  width: '34px',
                  height: '32px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <User size={15} className="text-primary" />
              </button>
              {/* Perfectly Anchored Connection Status Dot */}
              <span
                style={{
                  position: 'absolute',
                  top: '-1px',
                  right: '-1px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isCloudSynced ? 'var(--accent-teal)' : 'var(--text-muted)',
                  boxShadow: isCloudSynced ? '0 0 6px var(--accent-teal)' : 'none',
                  border: '1.5px solid var(--bg-surface)',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
                title={isCloudSynced ? 'Cloud Synced' : 'Local Offline'}
              />
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div
        className="main-content tab-pane"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: activeTab === 'hub' ? '1320px' : '1380px',
          margin: '0 auto',
          padding: activeTab === 'hub' ? '0.75rem 1.5rem' : '0 1.5rem 2rem',
          justifyContent: activeTab === 'hub' ? 'center' : 'flex-start'
        }}
      >

        {/* DEDICATED SECTION NAVIGATION BAR (Aligned with cards width & spaced properly) */}
        {activeTab !== 'hub' && (
          <div className="section-nav-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="section-back-btn"
                onClick={() => setActiveTab('hub')}
                title="Return to Home Hub (Press Esc or H)"
              >
                <ArrowLeft size={14} /> <span>Back to Hub</span>
              </button>
              {featureToggles.showSectionNavBreadcrumbs && (
                <>
                  <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)' }} />
                  <div className="section-nav-breadcrumb">
                    <span style={{ color: 'var(--text-muted)' }}>{activeClass.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                      {activeTab === 'roster' ? 'Enrollment & Teams' : activeTab === 'grading' ? 'Review System' : 'Grading & Performance Analytics'}
                    </span>
                    <span className={`hub-step-pill ${activeTab === 'roster' ? 'hub-step-indigo' : activeTab === 'grading' ? 'hub-step-amber' : 'hub-step-teal'}`} style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem' }}>
                      {activeTab === 'roster' ? 'Step 1 of 3' : activeTab === 'grading' ? 'Step 2 of 3' : 'Step 3 of 3'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Direct Section Switcher */}
            <div className="section-nav-switcher">
              <button
                type="button"
                data-tour="section-roster-btn"
                className={`section-nav-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
                onClick={() => setActiveTab('roster')}
                title="Switch to Section 1: Enrollment & Teams"
              >
                <Users size={12} /> <span>1. Enrollment</span>
              </button>
              <button
                type="button"
                data-tour="rubric-tab-btn"
                className={`section-nav-tab-btn ${activeTab === 'grading' ? 'active' : ''}`}
                onClick={() => setActiveTab('grading')}
                title="Switch to Section 2: Review System"
              >
                <Sliders size={12} /> <span>2. Review System</span>
              </button>
              <button
                type="button"
                data-tour="analytics-tab-btn"
                className={`section-nav-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
                title="Switch to Section 3: Grading & Analytics"
              >
                <Award size={12} /> <span>3. Analytics</span>
              </button>
            </div>
          </div>
        )}

      {/* Admin Workspace & Account Center Modal */}
      {isMobileProfileModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsMobileProfileModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', fontWeight: 800 }}>
                <User size={17} className="text-primary" /> Admin Workspace & Account Center
              </h3>
              <button className="btn-close" onClick={() => setIsMobileProfileModalOpen(false)} title="Close">×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Workspace Profile</label>
                <CustomSelect
                  options={profileOptions}
                  value={activeAdminProfile}
                  onChange={(val) => {
                    if (val === '__new__') {
                      setIsMobileProfileModalOpen(false);
                      setIsNewProfileModalOpen(true);
                    } else {
                      switchAdminProfile(val);
                    }
                  }}
                  triggerStyle={{ height: '42px', fontSize: '0.88rem', fontWeight: 700 }}
                />
              </div>

              {/* Cloud Synchronization Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CLOUD SYNCHRONIZATION</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: isCloudSynced ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: 700 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isCloudSynced ? 'var(--accent-teal)' : 'var(--text-muted)' }} />
                    {isCloudSynced ? 'Cloud Synced' : 'Local Sandbox Mode'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {isCloudSynced ? 'Connected to Firebase cloud database. Changes sync automatically.' : 'Operating offline on local browser storage. Connect Firebase for multi-device sync.'}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', height: '34px', marginTop: '0.25rem', fontWeight: 600, fontSize: '0.78rem' }}
                  onClick={() => {
                    setIsMobileProfileModalOpen(false);
                    setSettingsInitialTab('cloud');
                    setIsSettingsModalOpen(true);
                  }}
                >
                  <Database size={13} className="text-primary" /> {isCloudSynced ? 'Manage Cloud Settings' : 'Connect Cloud Database'}
                </button>
              </div>

              {isCloudSynced && user && (
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>SIGNED IN ACCOUNT</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user.email}</div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', width: '100%', justifyContent: 'center', height: '36px', marginTop: '0.4rem', fontWeight: 700 }}
                    onClick={() => {
                      setIsMobileProfileModalOpen(false);
                      logoutAdmin();
                    }}
                  >
                    <LogOut size={13} style={{ marginRight: '0.35rem' }} /> Sign Out of Account
                  </button>
                </div>
              )}

              {activeAdminProfile !== 'default' && (
                <button
                  type="button"
                  className="btn btn-rose btn-sm"
                  style={{ width: '100%', justifyContent: 'center', height: '36px' }}
                  onClick={() => {
                    setIsMobileProfileModalOpen(false);
                    triggerConfirm(
                      'Delete Admin Workspace Profile',
                      `Are you sure you want to permanently delete the admin workspace profile "${activeAdminProfile}" and ALL of its associated classroom groups? This action cannot be undone.`,
                      () => deleteAdminProfile(activeAdminProfile),
                      'Delete Workspace',
                      'Cancel'
                    );
                  }}
                >
                  <Trash2 size={13} /> Delete Current Workspace
                </button>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setIsMobileProfileModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HANDS-ON GUIDED SANDBOX MISSION HUD */}
      {isSandboxActive && (
        <GuidedSandboxHUD
          currentMissionIndex={sandboxMissionIndex}
          onSelectMission={(idx) => setSandboxMissionIndex(idx)}
          onAutoCompleteStep={handleAutoCompleteSandboxStep}
          onExitAndReset={handleExitSandbox}
          onKeepData={handleKeepSandboxData}
          missions={sandboxMissions}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* INSTRUCTOR ONBOARDING & SETUP TRACKER */}
      {!isSandboxActive && showOnboardingChecklist && (
        <OnboardingChecklistWidget
          studentCount={stats.totalStudents}
          rubricWeightSum={activeClass.fields.reduce((sum, f) => sum + (f.weight !== undefined && f.weight > 0 ? f.weight : Math.round(100 / Math.max(1, activeClass.fields.length))), 0)}
          hasEvaluations={stats.submittedCount > 0}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onStartTour={() => setIsTourOpen(true)}
          onLaunchSandbox={handleLaunchSandbox}
          onDismiss={() => {
            setShowOnboardingChecklist(false);
            localStorage.setItem('peer_onboarding_dismissed', 'true');
          }}
        />
      )}

      {/* =========================================================================
          HOME HUB: 3 BIG CORE SECTIONS (Directly matching wireframe sketch)
          ========================================================================= */}
      {activeTab === 'hub' && (
        <div className="hub-fullscreen-wrapper">
          {/* Elegant Centered Hero Header */}
          <div className="hub-hero-header">

            <h1 className="hub-hero-title">
              Peer Assessment Workflow
            </h1>
            <p className="hub-hero-subtitle">
              Manage student cohorts, calibrate evaluation rubrics, and inspect real-time performance analytics in three streamlined stages.
            </p>
          </div>

          {/* Minimal but Informative Hub Overview Banner - Only shown if explicitly toggled on */}
          {featureToggles.showHubOverviewBanner && (
            <div className="hub-overview-banner" style={{ marginBottom: '1rem', width: '100%' }}>
              <div className="hub-overview-left">
                <div className="hub-overview-heading-row">
                  <h2 className="hub-overview-title">{activeClass.name} Overview</h2>
                  <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.45rem' }}>
                    Active Classroom
                  </span>
                </div>
                <p className="hub-overview-desc">
                  Select a core module below to get started.
                </p>
              </div>

              <div className="hub-overview-right">
                {featureToggles.showHubOverviewStats && (
                  <div className="hub-summary-stats-strip">
                    <div className="hub-summary-stat-item" title="Enrolled students and peer teams">
                      <Users size={13} className="text-primary" />
                      <span className="hub-summary-stat-val">{stats.totalStudents}</span>
                      <span className="hub-summary-stat-lbl">Students</span>
                      <span className="hub-summary-stat-sub">({stats.groupCount} Teams)</span>
                    </div>

                    <div className="hub-summary-stat-divider" />

                    <div className="hub-summary-stat-item" title="Configured evaluation criteria and scale">
                      <Sliders size={13} className="text-amber" />
                      <span className="hub-summary-stat-val">{activeClass.fields.length}</span>
                      <span className="hub-summary-stat-lbl">Criteria</span>
                      <span className="hub-summary-stat-sub">(Scale {activeClass.targetScale === 0 ? 'Rubric Sum' : activeClass.targetScale || 20})</span>
                    </div>

                    <div className="hub-summary-stat-divider" />

                    <div className="hub-summary-stat-item" title="Evaluation submission progress">
                      <Award size={13} className="text-teal" />
                      <span className="hub-summary-stat-val">{stats.completionRate}%</span>
                      <span className="hub-summary-stat-lbl">Submitted</span>
                      <span className="hub-summary-stat-sub">({stats.submittedCount}/{stats.totalStudents})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THE 3 BIG SECTIONS GRID */}
          {(() => {
            const isHubOptionsActive = featureToggles.showHubCardMetrics || featureToggles.showHubQuickActions;
            return (
              <div className="hub-grid">
                {/* Section 1: Enrollment & Teams */}
                {featureToggles.showEnrollmentCard && (
                  <div
                    className="hub-card hub-card-accent-indigo"
                    data-tour="hub-enrollment-card"
                    onClick={() => setActiveTab('roster')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab('roster')}
                    title="Enter Section 1: Enrollment & Teams"
                  >
                    <div className="hub-card-top">
                      <div className="hub-card-header-row">
                        <div className="hub-card-icon-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          <Users size={24} />
                        </div>
                        <span className="hub-step-pill hub-step-indigo">
                          Step 1
                        </span>
                      </div>

                      <div>
                        <h3 className="hub-card-title">Enrollment &amp; Teams</h3>
                        <p className={isHubOptionsActive ? "hub-card-desc hub-card-desc-minimized" : "hub-card-desc hub-card-desc-full"}>
                          {isHubOptionsActive
                            ? "Manage enrolled students, configure diverse student cohorts, generate QR join links, and organize peer teams."
                            : "Manage enrolled students, configure diverse student cohorts, generate interactive QR join codes, and organize balanced peer teams with intelligent automated grouping tools. Track active rosters, import spreadsheet rosters, and streamline student onboarding seamlessly."}
                        </p>
                      </div>

                      {/* Clean Unified Status & Metric */}
                      {featureToggles.showHubCardMetrics && (
                        <div className="hub-card-progress-box">
                          <div className="hub-card-progress-labels">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <Users size={12} className="text-primary" /> {stats.totalStudents} Students • {stats.groupCount} Teams
                            </span>
                            <span style={{ color: stats.totalStudents > 0 ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: 600 }}>
                              {stats.totalStudents > 0 ? 'Active' : 'Setup Needed'}
                            </span>
                          </div>
                          <div className="hub-card-progress-track">
                            <div
                              className="hub-card-progress-fill hub-progress-indigo"
                              style={{ width: stats.totalStudents > 0 ? `${Math.min(100, Math.max(20, stats.totalStudents * 4))}%` : '8%' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Minimal Quick Actions */}
                      {featureToggles.showHubQuickActions && (
                        <div className="hub-card-quick-actions">
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-indigo"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddStudentModalOpen(true);
                            }}
                            title="Add student manually"
                          >
                            <Plus size={11} /> <span>Add Student</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-indigo"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsQRCodeModalOpen(true);
                            }}
                            title="Open student QR join presentation"
                          >
                            <QrCode size={11} /> <span>QR Link</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-indigo"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAutoGroupModalOpen(true);
                            }}
                            title="Launch Team Generator Studio"
                          >
                            <Users size={11} /> <span>Team Studio</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="hub-card-bottom">
                      <button
                        type="button"
                        className="hub-cta-btn hub-cta-indigo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('roster');
                        }}
                      >
                        <span>Enter Enrollment &amp; Teams</span>
                        <ArrowRight size={14} className="hub-cta-arrow" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 2: Review System */}
                {featureToggles.showReviewSystemCard && (
                  <div
                    className="hub-card hub-card-accent-amber"
                    data-tour="hub-review-card"
                    onClick={() => setActiveTab('grading')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab('grading')}
                    title="Enter Section 2: Review System"
                  >
                    <div className="hub-card-top">
                      <div className="hub-card-header-row">
                        <div className="hub-card-icon-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                          <Sliders size={24} />
                        </div>
                        <span className="hub-step-pill hub-step-amber">
                          Step 2
                        </span>
                      </div>

                      <div>
                        <h3 className="hub-card-title">Review System</h3>
                        <p className={isHubOptionsActive ? "hub-card-desc hub-card-desc-minimized" : "hub-card-desc hub-card-desc-full"}>
                          {isHubOptionsActive
                            ? "Design multi-criteria evaluation rubrics, define performance anchors, adjust weights, and apply templates."
                            : "Design multi-criteria evaluation rubrics, define performance anchors, adjust weights, and apply the accredited IPAF Standard template. Calibrate custom scoring scales, configure peer review submission deadlines, and balance criteria weights for transparent assessment."}
                        </p>
                      </div>

                      {/* Clean Unified Status & Metric */}
                      {featureToggles.showHubCardMetrics && (
                        <div className="hub-card-progress-box">
                          <div className="hub-card-progress-labels">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <Sliders size={12} className="text-amber" /> {activeClass.fields.length} Criteria • Scale {activeClass.targetScale === 0 ? 'Rubric Sum' : activeClass.targetScale || 20}
                            </span>
                            <span style={{ color: '#b45309', fontWeight: 600 }}>
                              {activeClass.fields.length >= 3 ? 'Calibrated' : 'Basic Scale'}
                            </span>
                          </div>
                          <div className="hub-card-progress-track">
                            <div
                              className="hub-card-progress-fill hub-progress-amber"
                              style={{ width: `${Math.min(100, Math.max(25, activeClass.fields.length * 25))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Minimal Quick Actions */}
                      {featureToggles.showHubQuickActions && (
                        <div className="hub-card-quick-actions">
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-amber"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('grading');
                            }}
                            title="Add new grading criteria"
                          >
                            <Plus size={11} /> <span>Add Criterion</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-amber"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('grading');
                            }}
                            title="Apply IPAF Standard Rubric Template"
                          >
                            <Sliders size={11} /> <span>IPAF Template</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-amber"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('grading');
                            }}
                            title="Set peer review deadline"
                          >
                            <Clock size={11} /> <span>Deadline</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="hub-card-bottom">
                      <button
                        type="button"
                        className="hub-cta-btn hub-cta-amber"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('grading');
                        }}
                      >
                        <span>Enter Review System</span>
                        <ArrowRight size={14} className="hub-cta-arrow" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 3: Grading & Performance Analytics */}
                {featureToggles.showGradingAnalyticsCard && (
                  <div
                    className="hub-card hub-card-accent-teal"
                    data-tour="hub-analytics-card"
                    onClick={() => setActiveTab('results')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab('results')}
                    title="Enter Section 3: Grading & Performance Analytics"
                  >
                    <div className="hub-card-top">
                      <div className="hub-card-header-row">
                        <div className="hub-card-icon-badge" style={{ backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal)' }}>
                          <Award size={24} />
                        </div>
                        <span className="hub-step-pill hub-step-teal">
                          Step 3
                        </span>
                      </div>

                      <div>
                        <h3 className="hub-card-title">Grading &amp; Performance Analytics</h3>
                        <p className={isHubOptionsActive ? "hub-card-desc hub-card-desc-minimized" : "hub-card-desc hub-card-desc-full"}>
                          {isHubOptionsActive
                            ? "Real-time calculation matrix, peer perception radar benchmarks, PDF report cards, and gradebook exports."
                            : "Real-time calculation matrix, peer perception radar benchmarks, PDF report cards, and gradebook exports. Analyze peer evaluation distributions with WebPA factor calibration, visualize Johari Window consensus, and export accredited grade summaries to Excel."}
                        </p>
                      </div>

                      {/* Clean Unified Status & Metric */}
                      {featureToggles.showHubCardMetrics && (
                        <div className="hub-card-progress-box">
                          <div className="hub-card-progress-labels">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <Award size={12} className="text-teal" /> {stats.submittedCount}/{stats.totalStudents} Evaluated
                            </span>
                            <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
                              {stats.completionRate}% Submitted
                            </span>
                          </div>
                          <div className="hub-card-progress-track">
                            <div
                              className="hub-card-progress-fill hub-progress-teal"
                              style={{ width: `${Math.max(stats.submittedCount > 0 ? 10 : 0, stats.completionRate)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Minimal Quick Actions */}
                      {featureToggles.showHubQuickActions && (
                        <div className="hub-card-quick-actions">
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('results');
                            }}
                            title="Open WebPA Gradebook Matrix"
                          >
                            <BarChart2 size={11} /> <span>Matrix</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('results');
                            }}
                            title="Open Johari Window Perception Radar"
                          >
                            <Activity size={11} /> <span>Radar</span>
                          </button>
                          <button
                            type="button"
                            className="hub-quick-action-pill hub-quick-pill-teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                exportClassroomToExcel(activeClass);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            title="Export class data to Excel"
                          >
                            <Download size={11} /> <span>Excel</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="hub-card-bottom">
                      <button
                        type="button"
                        className="hub-cta-btn hub-cta-teal"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('results');
                        }}
                      >
                        <span>Enter Grading &amp; Analytics</span>
                        <ArrowRight size={14} className="hub-cta-arrow" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: ROSTER MANAGER */}
      {activeTab === 'roster' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Auxiliary Cards Row - Only rendered if at least 1 card is enabled, leaving zero blank space when all are hidden */}
          {(featureToggles.showSelfEnrollmentCard || featureToggles.showQuickActionsCard || featureToggles.showImportWizardCard) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
              {/* 1. Student Self-Enrollment QR & Link Card */}
              {featureToggles.showSelfEnrollmentCard && (
                <div className="card" data-tour="self-enrollment-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', gap: '0.85rem' }}>
              <div>
                <div className="card-header" style={{ marginBottom: '0.45rem' }}>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', fontWeight: 800 }}>
                    <QrCode size={18} className="text-primary" /> Self-Enrollment
                    <FeatureInfoButton featureId="classroom-qr" size="sm" tooltipText="Self-Enrollment QR Guide" />
                  </h3>
                  <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                    QR &amp; Link
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  Share class QR code or direct join link with students for mobile self-registration.
                </p>

                {/* QR Code preview & URL copy box */}
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', padding: '0.55rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {miniQrUrl ? (
                    <div
                      onClick={() => setIsQRCodeModalOpen(true)}
                      style={{ cursor: 'pointer', flexShrink: 0, width: '58px', height: '58px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Click to expand QR Presentation Mode"
                    >
                      <img src={miniQrUrl} alt="Classroom QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsQRCodeModalOpen(true)}
                      style={{ cursor: 'pointer', flexShrink: 0, width: '58px', height: '58px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}
                      title="Click to expand QR Presentation Mode"
                    >
                      <QrCode size={26} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <input
                        type="text"
                        readOnly
                        className="form-input"
                        value={getClassEnrollmentUrl(activeClass.id)}
                        style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '0.3rem 0.5rem', height: '32px', flex: 1 }}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        className={`btn ${copiedEnrollLink ? 'btn-teal' : 'btn-secondary'} btn-sm`}
                        style={{ flexShrink: 0, padding: '0.25rem 0.55rem', height: '32px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(getClassEnrollmentUrl(activeClass.id));
                          setCopiedEnrollLink(true);
                          addToast('Classroom enrollment link copied to clipboard!', 'success');
                          setTimeout(() => setCopiedEnrollLink(false), 2500);
                        }}
                        title="Copy enrollment link to clipboard"
                      >
                        {copiedEnrollLink ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={11} className="text-teal" /> Cloud Sync Active
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                        {activeClass.students.length} Enrolled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: '0.45rem', padding: '0.55rem', fontSize: '0.84rem', fontWeight: 700 }}
                onClick={() => setIsQRCodeModalOpen(true)}
              >
                <QrCode size={14} /> Open QR Presentation Mode
              </button>
            </div>
          )}

          {/* 2. Quick Actions Card */}
          {featureToggles.showQuickActionsCard && (
            <div className="card" data-tour="quick-actions-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', gap: '0.85rem' }}>
              <div>
                <div className="card-header" style={{ marginBottom: '0.45rem' }}>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', fontWeight: 800 }}>
                    <Sliders size={18} className="text-indigo" /> Quick Actions
                  </h3>
                  <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                    Tools
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  Add individual members, load diverse demo datasets, or export roster records.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsAddStudentModalOpen(true)}
                      style={{ justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.35rem', fontSize: '0.78rem' }}
                    >
                      <Plus size={13} /> Add Member
                    </button>
                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={() => {
                        importRoster(activeClass.id, DIVERSE_100_STUDENTS, true);
                        addToast('Loaded 100 diverse sample students across 35+ countries and balanced demographics!', 'success');
                      }}
                      style={{ fontSize: '0.78rem', gap: '0.35rem', justifyContent: 'center', padding: '0.45rem 0.35rem' }}
                      title="Populate classroom with a diverse dataset of 100 students to test app features"
                    >
                      <Sparkles size={13} /> 100 Demo Sample
                    </button>
                  </div>

                  {/* Export & Download Hub */}
                  <div style={{ padding: '0.5rem 0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Export &amp; Download Center
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        CSV &bull; Excel
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (activeClass.students.length === 0) {
                            addToast('No students enrolled to export.', 'warning');
                            return;
                          }
                          exportRosterToExcel(activeClass);
                          addToast('Class roster exported to Excel (.xlsx)!', 'success');
                        }}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.4rem', justifyContent: 'center', gap: '0.25rem' }}
                        title="Export current classroom roster to Excel"
                      >
                        <Download size={11} className="text-teal" /> Export Roster
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          downloadSampleStudentsFile('xlsx');
                          addToast('Downloaded diverse student template spreadsheet (.xlsx)!', 'success');
                        }}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.4rem', justifyContent: 'center', gap: '0.25rem' }}
                        title="Download sample spreadsheet template with 100 diverse students"
                      >
                        <Download size={11} className="text-indigo" /> Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear Roster Action */}
              <button
                type="button"
                className="btn btn-secondary text-rose btn-sm"
                style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', fontSize: '0.72rem', padding: '0.4rem', justifyContent: 'center', gap: '0.3rem', width: '100%' }}
                onClick={() => {
                  triggerConfirm(
                    'Clear Class Roster',
                    'Are you sure you want to delete all students and peer evaluations for this class? This will wipe the slate completely clean for this classroom group.',
                    () => {
                      clearClassRoster(activeClass.id);
                    },
                    'Clear Roster',
                    'Cancel'
                  );
                }}
                title="Clear all students from this classroom"
              >
                <Trash2 size={11} /> Clear Class Roster
              </button>
            </div>
          )}

          {/* 3. Import Wizard Card */}
          {featureToggles.showImportWizardCard && (
            <div className="card" data-tour="import-wizard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', gap: '0.85rem' }}>
              <div>
                <div className="card-header" style={{ marginBottom: '0.45rem' }}>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', fontWeight: 800 }}>
                    <Upload size={18} className="text-teal" /> Import Wizard
                    <FeatureInfoButton featureId="import-wizard" size="sm" tooltipText="Import Wizard Guide" />
                  </h3>
                  <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    Smart Mapper
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  Onboard student rosters from CSV, Excel, PDF, or clipboard with automatic schema header mapping.
                </p>

                {/* Interactive Dropzone / Format Trigger */}
                <div
                  onClick={() => {
                    setWizardStep(1);
                    setIsWizardOpen(true);
                  }}
                  style={{
                    padding: '0.75rem 0.65rem',
                    borderRadius: '8px',
                    border: '1.5px dashed var(--accent-teal)',
                    backgroundColor: 'rgba(20, 184, 166, 0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Click to launch Roster Onboarding Wizard"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                    <Upload size={14} /> Click to Upload or Paste File
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem', width: '100%' }}>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.2rem 0.25rem', borderRadius: '4px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--accent-teal)' }}>XLSX</span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.2rem 0.25rem', borderRadius: '4px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--accent-rose)' }}>PDF</span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.2rem 0.25rem', borderRadius: '4px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--primary)' }}>CSV</span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.2rem 0.25rem', borderRadius: '4px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--accent-amber)' }}>PASTE</span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setWizardStep(1);
                  setIsWizardOpen(true);
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', gap: '0.45rem', fontWeight: 700, fontSize: '0.84rem' }}
              >
                <Sparkles size={15} /> Open Onboarding Wizard
              </button>
            </div>
          )}

          </div>
        )}

        {/* Intelligent Auto-Group & Diversity Studio - Only rendered when toggled on */}
        {featureToggles.showAutoGroupStudio && (
          <div data-tour="autogroup-studio">
            <AutoGroupStudio
              students={activeClass.students}
              onApplyGroups={(updatedStudents) => {
                importRoster(activeClass.id, updatedStudents, true);
                const uniqueTeamCount = new Set(updatedStudents.map(s => s.groupName)).size;
                addToast(`Successfully partitioned ${updatedStudents.length} students into ${uniqueTeamCount} balanced, diverse teams!`, 'success');
              }}
              onLoadSampleStudents={() => {
                importRoster(activeClass.id, DIVERSE_100_STUDENTS, true);
                addToast('Loaded 100 diverse sample students across 35+ countries and balanced demographics!', 'success');
              }}
            />
          </div>
        )}

          {/* Roster Filter & List Table - Toggleable in Settings */}
          {featureToggles.showRosterTable && (
            <div className="card" data-tour="classroom-roster-table" style={{ padding: '1.25rem' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                    <Users size={20} className="text-indigo" /> Classroom Roster
                    <FeatureInfoButton featureId="classroom-roster" size="sm" tooltipText="Classroom Roster Guide" />
                  </h3>
                  <span className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {filteredStudents.length} of {activeClass.students.length} members
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {featureToggles.showRosterSearchFilter && (
                    <>
                      <div style={{ position: 'relative', width: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search by ID, Name, Country, Email..."
                          className="form-input"
                          style={{ paddingLeft: '2.1rem', paddingRight: searchTerm ? '2rem' : '0.75rem', height: '36px', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                            title="Clear search"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <CustomSelect
                        options={groupOptions}
                        value={groupFilter}
                        onChange={(val) => setGroupFilter(val)}
                        style={{ width: 'auto', minWidth: '150px' }}
                        triggerStyle={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem' }}
                      />
                    </>
                  )}
                  {featureToggles.showExportButtons && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (activeClass.students.length === 0) {
                            addToast('No students enrolled to export.', 'warning');
                            return;
                          }
                          exportRosterToExcel(activeClass);
                          addToast('Class roster exported to Excel (.xlsx)!', 'success');
                        }}
                        style={{ fontSize: '0.8rem', padding: '0 0.75rem', gap: '0.35rem', height: '36px', borderRadius: '8px', fontWeight: 600 }}
                        title="Export complete roster with academic & demographic metadata to Excel"
                      >
                        <Download size={14} className="text-teal" /> Excel
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (activeClass.students.length === 0) {
                            addToast('No students enrolled to export.', 'warning');
                            return;
                          }
                          exportRosterToCSV(activeClass);
                          addToast('Class roster exported to CSV!', 'success');
                        }}
                        style={{ fontSize: '0.8rem', padding: '0 0.65rem', gap: '0.35rem', height: '36px', borderRadius: '8px', fontWeight: 600 }}
                        title="Export roster to CSV"
                      >
                        <Download size={14} /> CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Intelligent Duplicate Enrollment Detection Banner - Toggleable in Settings */}
              {featureToggles.showDuplicateDetector && duplicateFlagsMap.size > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #f59e0b',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <strong style={{ color: '#b45309', fontSize: '0.88rem', display: 'block' }}>
                      {duplicateFlagsMap.size} Suspected Repeating / Duplicate Registrations Detected
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                      Found potential duplicate entries with identical full names, reversed name orders, or repeating emails.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setShowOnlyDuplicates(prev => !prev)}
                    style={{
                      backgroundColor: showOnlyDuplicates ? '#f59e0b' : '#ffffff',
                      color: showOnlyDuplicates ? '#ffffff' : '#b45309',
                      border: '1px solid #f59e0b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      height: '32px',
                      padding: '0 0.75rem'
                    }}
                  >
                    {showOnlyDuplicates ? 'Show All Students' : 'Filter Suspected Duplicates'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const allPairs = new Set<string>();
                      activeClass.students.forEach(s => {
                        const flags = duplicateFlagsMap.get(s.id) || [];
                        flags.forEach(f => allPairs.add([s.id, f.matchedStudentId].sort().join(':::')));
                      });
                      setIgnoredDuplicatePairs(allPairs);
                      setShowOnlyDuplicates(false);
                      addToast('Dismissed all current duplicate warning flags.', 'info');
                    }}
                    style={{ height: '32px', fontSize: '0.74rem', padding: '0 0.6rem' }}
                    title="Dismiss all current duplicate flags"
                  >
                    Dismiss All Flags
                  </button>
                </div>
              </div>
            )}

            {activeClass.students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  <Users size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>No participants yet</p>
                <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '380px', lineHeight: 1.5 }}>
                  Use the <strong>Roster Onboarding Wizard</strong> to upload a spreadsheet, or load our diverse dataset of 100 students to explore all app features.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setWizardStep(1);
                      setIsWizardOpen(true);
                    }}
                  >
                    <Upload size={14} /> Open Onboarding Wizard
                  </button>
                  <button
                    type="button"
                    className="btn btn-teal btn-sm"
                    onClick={() => {
                      importRoster(activeClass.id, DIVERSE_100_STUDENTS, true);
                      addToast('Loaded 100 diverse sample students across 35+ countries and balanced demographics!', 'success');
                    }}
                  >
                    <Sparkles size={14} /> Load 100 Sample Students
                  </button>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No students found matching your filters</p>
                <p style={{ fontSize: '0.82rem', margin: '0 0 1rem 0' }}>Try a different search keyword or reset the group filter.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setGroupFilter('All Groups');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="table-container table-container-sticky">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id))}
                          onChange={() => {
                            if (filteredStudents.every(s => selectedStudentIds.has(s.id))) {
                              setSelectedStudentIds(new Set());
                            } else {
                              setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
                            }
                          }}
                          aria-label="Select all students"
                        />
                      </th>
                      <th style={{ minWidth: '180px' }}>Participant</th>
                      <th style={{ minWidth: '150px' }}>Academic Info</th>
                      <th style={{ minWidth: '130px' }}>Origin &amp; Type</th>
                      <th style={{ minWidth: '140px' }}>Group &amp; English</th>
                      <th style={{ minWidth: '110px' }}>Portal Status</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      let gradingUrl = `${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&studentId=${s.id}`;
                      if (isCloudSynced && firebaseConfig && user) {
                        const payload = {
                          a: firebaseConfig.apiKey,
                          p: firebaseConfig.projectId,
                          d: firebaseConfig.authDomain,
                          i: firebaseConfig.appId,
                          o: user.uid
                        };
                        const encoded = btoa(JSON.stringify(payload));
                        gradingUrl += `&fb=${encoded}`;
                      }
                      const isSelected = selectedStudentIds.has(s.id);

                      return (
                        <tr key={s.id} style={{ backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : undefined }}>
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedStudentIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(s.id)) next.delete(s.id);
                                  else next.add(s.id);
                                  return next;
                                });
                              }}
                              aria-label={`Select ${s.name}`}
                            />
                          </td>

                          {/* Participant Identity (Name + Email + ID + Duplicate Flag) */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{s.name}</span>
                                <code style={{ fontSize: '0.68rem', padding: '0.05rem 0.25rem', borderRadius: '4px', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>
                                  #{s.id}
                                </code>
                                {duplicateFlagsMap.has(s.id) && (
                                  <span
                                    className="badge"
                                    style={{
                                      backgroundColor: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      fontSize: '0.65rem',
                                      padding: '0.05rem 0.35rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      fontWeight: 700,
                                      cursor: 'help'
                                    }}
                                    title={(duplicateFlagsMap.get(s.id) || []).map(f => f.reason).join('\n')}
                                  >
                                    <AlertTriangle size={9} /> Duplicate
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                {s.email}
                              </span>
                            </div>
                          </td>

                          {/* Academic Info (University + Degree) */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {s.university || '—'}
                              </span>
                              {s.degree && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {s.degree}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Origin & Demographics (Nationality + Gender + Student Type) */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {s.nationality ? (
                                  <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Globe size={11} className="text-teal" /> {s.nationality}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                                )}
                                {s.gender && s.gender !== 'Prefer not to say' && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>&bull; {s.gender}</span>
                                )}
                              </div>
                              <div>
                                {s.studentType === 'Erasmus' ? (
                                  <span className="badge badge-secondary" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.66rem', padding: '0.1rem 0.4rem' }}>Erasmus</span>
                                ) : (
                                  <span className="badge badge-secondary" style={{ opacity: 0.85, fontSize: '0.66rem', padding: '0.1rem 0.4rem' }}>{s.studentType || 'Normal'}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Group & Language (Team + English Level) */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div>
                                {s.groupName && s.groupName !== 'Unassigned' ? (
                                  <span className="badge badge-teal" style={{ fontWeight: 700, fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                                    {s.groupName}
                                  </span>
                                ) : (
                                  <span className="badge" style={{ backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                                    Unassigned
                                  </span>
                                )}
                              </div>
                              {s.englishProficiency && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {s.englishProficiency}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Portal Status & Direct Link */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <a
                                href={gradingUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                                title="Open Student Portal"
                              >
                                <Eye size={12} /> Open Portal
                              </a>
                              <div>
                                {s.submitted ? (
                                  <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', gap: '0.2rem' }}>
                                    <CheckCircle size={9} /> Done
                                  </span>
                                ) : (
                                  <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', gap: '0.2rem' }}>
                                    <Clock size={9} /> Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 1-Click Minimal Segmented Action Dock */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-action-dock">
                              <button
                                type="button"
                                className="table-action-btn action-simulator"
                                onClick={() => setPreviewingStudent(s)}
                                title="Simulate smartphone student portal"
                              >
                                <Smartphone size={13} />
                              </button>
                              <button
                                type="button"
                                className="table-action-btn action-copy"
                                onClick={() => {
                                  navigator.clipboard.writeText(gradingUrl);
                                  addToast(`Copied evaluation link for ${s.name}!`, 'success');
                                }}
                                title="Copy personal evaluation link"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                className="table-action-btn action-report"
                                onClick={() => openReportModal(s.id)}
                                title="View & Download PDF Report Card"
                              >
                                <FileText size={13} />
                              </button>
                              <button
                                type="button"
                                className="table-action-btn action-edit"
                                onClick={() => {
                                  const isIntl = s.isInternational ?? (s.studentType === 'International' || s.studentType === 'Erasmus');
                                  setEditStudentData({
                                    id: s.id,
                                    name: s.name,
                                    email: s.email,
                                    groupName: s.groupName,
                                    gender: s.gender || 'Prefer not to say',
                                    isInternational: isIntl,
                                    isExchange: s.isExchange ?? (s.studentType === 'Erasmus' || s.studentType === 'Exchange'),
                                    nationality: s.nationality || '',
                                    currentCountry: s.currentCountry || (isIntl ? '' : (s.nationality || '')),
                                    englishProficiency: s.englishProficiency || 'Fluent (C1/C2)',
                                    university: s.university || '',
                                    degree: s.degree || '',
                                    originalUniversity: s.originalUniversity || '',
                                    originalCountry: s.originalCountry || '',
                                    currentUniversity: s.currentUniversity || s.university || '',
                                    studentType: s.studentType || 'Normal'
                                  });
                                  setIsEditStudentModalOpen(true);
                                }}
                                title="Edit student details"
                              >
                                <Edit2 size={13} />
                              </button>
                              {duplicateFlagsMap.has(s.id) && (
                                <button
                                  type="button"
                                  className="table-action-btn action-dismiss"
                                  onClick={() => {
                                    const flags = duplicateFlagsMap.get(s.id) || [];
                                    setIgnoredDuplicatePairs(prev => {
                                      const next = new Set(prev);
                                      flags.forEach(f => next.add([s.id, f.matchedStudentId].sort().join(':::')));
                                      return next;
                                    });
                                    addToast(`Dismissed duplicate flag for ${s.name}.`, 'info');
                                  }}
                                  title="Dismiss / Ignore duplicate flag"
                                >
                                  <EyeOff size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="table-action-btn action-delete"
                                onClick={() => {
                                  triggerConfirm(
                                    'Remove Student Record',
                                    `Are you sure you want to remove "${s.name}"? This will permanently delete their student record and ALL peer reviews they have either submitted or received.`,
                                    () => deleteStudent(activeClass.id, s.id),
                                    'Remove Student',
                                    'Cancel'
                                  );
                                }}
                                title="Delete student record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Floating Bulk Actions Bar */}
            {featureToggles.showBulkActionBar && selectedStudentIds.size > 0 && (
              <div className="bulk-actions-floating-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', fontWeight: 800 }}>
                    {selectedStudentIds.size} Selected
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    of {filteredStudents.length} students
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Assign to Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CustomSelect
                      value={bulkTargetTeam}
                      onChange={(val) => setBulkTargetTeam(val)}
                      options={[
                        { value: '', label: '-- Assign to Team --' },
                        ...groupOptions.filter(g => g.value !== 'All Groups').map(g => ({ value: g.value, label: g.label }))
                      ]}
                      style={{ width: 'auto', minWidth: '150px' }}
                      triggerStyle={{ height: '34px', fontSize: '0.78rem', padding: '0 0.6rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!bulkTargetTeam}
                      onClick={() => {
                        selectedStudentIds.forEach(id => updateStudent(activeClass.id, id, { groupName: bulkTargetTeam }));
                        addToast(`Assigned ${selectedStudentIds.size} students to "${bulkTargetTeam}"!`, 'success');
                        setSelectedStudentIds(new Set());
                        setBulkTargetTeam('');
                      }}
                      style={{ height: '34px', fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                    >
                      Apply
                    </button>
                  </div>

                  {/* Bulk Export */}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const selectedData: ClassData = {
                        ...activeClass,
                        students: activeClass.students.filter(s => selectedStudentIds.has(s.id))
                      };
                      exportRosterToExcel(selectedData);
                      addToast(`Exported ${selectedStudentIds.size} selected students to Excel!`, 'success');
                    }}
                    style={{ height: '34px', fontSize: '0.78rem', gap: '0.3rem' }}
                    title="Export selected students to Excel"
                  >
                    <Download size={13} className="text-teal" /> Excel
                  </button>

                  {/* Bulk Delete */}
                  <button
                    type="button"
                    className="btn btn-rose btn-sm"
                    onClick={() => {
                      triggerConfirm(
                        'Delete Selected Students',
                        `Are you sure you want to delete ${selectedStudentIds.size} selected students and ALL associated peer evaluations? This action cannot be undone.`,
                        () => {
                          deleteStudents(activeClass.id, Array.from(selectedStudentIds));
                          setSelectedStudentIds(new Set());
                        },
                        'Delete Selected',
                        'Cancel'
                      );
                    }}
                    style={{ height: '34px', fontSize: '0.78rem', gap: '0.3rem' }}
                    title="Delete selected students from roster"
                  >
                    <Trash2 size={13} /> Delete
                  </button>

                  {/* Deselect All */}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedStudentIds(new Set())}
                    style={{ height: '34px', fontSize: '0.78rem' }}
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Overview Cards - Only rendered when enabled in Settings */}
        {featureToggles.showTeamOverviewCards && uniqueGroups.length > 0 && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', fontWeight: 800 }}>
                  <Users size={17} className="text-teal" /> Team Cohorts Overview ({uniqueGroups.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click any card to filter the roster</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {uniqueGroups.map((group) => {
                const teamMembers = activeClass.students.filter(s => s.groupName === group);
                const isSelected = groupFilter === group;
                return (
                  <div
                    key={group}
                    onClick={() => setGroupFilter(isSelected ? 'All Groups' : group)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{group}</strong>
                      <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{teamMembers.length} members</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {teamMembers.map(m => m.name).join(', ') || 'No members'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

      {/* TAB CONTENT: GRADING SCALE CONFIG */}
      {activeTab === 'grading' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" data-tour="rubric-builder-card" style={{ padding: '1.25rem' }}>
            {/* Header & Presets Bar */}
            {featureToggles.showRubricHeader && (
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                      <Sliders size={20} className="text-indigo" /> Evaluation Rubric &amp; Grading Scales
                      <FeatureInfoButton featureId="grading-rubric" size="sm" tooltipText="Rubric & Grading Scales Guide" />
                    </h3>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      {activeClass.fields.length} Criteria
                    </span>
                  </div>
                  <p className="card-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                    Configure multi-criteria rubrics with behavioral guidance. Define custom scales and load accredited academic presets.
                  </p>
                </div>

                {featureToggles.showCustomCriterionButton && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddField} style={{ height: '36px', gap: '0.35rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, padding: '0 0.85rem' }}>
                      <Plus size={15} /> Add Custom Criterion
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rubric Presets Library Banner - Only rendered when enabled in Settings */}
            {featureToggles.showRubricPresets && (
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem 1.15rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={17} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Standardized Rubric Framework (IPAF)
                      </h4>
                      <FeatureInfoButton featureId="rubric-presets" size="sm" tooltipText="IPAF Rubric Guide" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      1-Click load research-synthesized peer evaluation criteria &amp; 100% balanced weights (CATME, Salas, AAC&amp;U, WebPA).
                    </p>
                  </div>
                </div>

                {/* Quick Preset Buttons in a Clean Flex Wrap Ribbon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {RUBRIC_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleApplyPreset(preset.id)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.35rem 0.7rem',
                        height: '32px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${preset.name}: ${preset.description}`}
                    >
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {preset.id === 'ipaf_research_synthesized' ? 'IPAF Standard (Research-Synthesized)' : preset.name}
                      </span>
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '1px 5px', height: '16px', lineHeight: '14px' }}>
                        {preset.fields.length} criteria
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target final scale setting */}
            {featureToggles.showTargetScaleCard && (
              <div data-tour="target-scale-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--primary-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid hsla(243, 75%, 59%, 0.15)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ maxWidth: '520px' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sliders size={15} /> Final Grade Scaling Target Scale
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                      Choose the target scale for final student grade calculations. Averages scale automatically (e.g. Out of 20, 100, or Sum of Rubrics).
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px', flexWrap: 'wrap' }}>
                    <CustomSelect
                      value={activeClass.targetScale === 0 ? 'sum' : activeClass.targetScale ? 'custom' : 'default'}
                      onChange={(val) => {
                        if (val === 'default') {
                          updateGradingConfig(activeClass.id, activeClass.fields, null, true);
                        } else if (val === 'sum') {
                          updateGradingConfig(activeClass.id, activeClass.fields, 0, true);
                        } else {
                          updateGradingConfig(activeClass.id, activeClass.fields, 20, true); // Default to custom scale of 20
                        }
                      }}
                      options={[
                        { value: 'default', label: 'Default Scale (Out of 20)' },
                        { value: 'sum', label: `Sum of rubrics' maximums (${activeClass.fields.reduce((sum, f) => sum + f.max, 0)})` },
                        { value: 'custom', label: 'Custom scaling target...' }
                      ]}
                      style={{ width: 'auto', minWidth: '220px' }}
                      triggerStyle={{ height: '36px', fontSize: '0.82rem', padding: '0 0.85rem' }}
                    />
                    {activeClass.targetScale !== 0 && activeClass.targetScale !== undefined && activeClass.targetScale !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Out of:</span>
                        <input
                          type="number"
                          className="form-input"
                          value={activeClass.targetScale}
                          min={1}
                          max={1000}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              updateGradingConfig(activeClass.id, activeClass.fields, val, false);
                            }
                          }}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '70px', textAlign: 'center' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Milestone Evaluation Deadline Setting Card - Only rendered when enabled in Settings */}
            {featureToggles.showDeadlineTimer && (
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ maxWidth: '520px' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--accent-amber)', margin: 0, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} /> Submission Deadline &amp; Countdown Timer
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                      Set an optional closing deadline. Displays a live countdown timer in the Projector View and Student Portal, and locks evaluations when time expires.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={activeClass.deadline ? new Date(new Date(activeClass.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const iso = new Date(e.target.value).toISOString();
                          saveClassDeadline(activeClass.id, iso);
                        } else {
                          saveClassDeadline(activeClass.id, null);
                        }
                      }}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', height: '36px' }}
                    />
                    {activeClass.deadline && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm text-rose"
                        onClick={() => {
                          saveClassDeadline(activeClass.id, null);
                        }}
                        style={{ height: '36px', padding: '0.4rem 0.6rem' }}
                        title="Clear Deadline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Weightage Validation & Auto-Balance Bar */}
            {featureToggles.showWeightBalanceBar && (() => {
              const totalWeight = activeClass.fields.reduce((sum, f) => sum + (f.weight !== undefined && f.weight > 0 ? f.weight : Math.round(100 / Math.max(1, activeClass.fields.length))), 0);
              const isBalanced = totalWeight === 100;
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.75rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isBalanced ? 'rgba(20, 184, 166, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${isBalanced ? 'rgba(20, 184, 166, 0.25)' : 'rgba(245, 158, 11, 0.3)'}`,
                    marginBottom: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isBalanced ? (
                      <CheckCircle size={16} className="text-teal" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber" />
                    )}
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isBalanced ? 'var(--accent-teal)' : 'var(--accent-amber)' }}>
                        {isBalanced
                          ? `Total Weightage: 100% (Balanced & Valid)`
                          : `Total Weightage: ${totalWeight}% (${totalWeight > 100 ? `${totalWeight - 100}% over 100%` : `${100 - totalWeight}% remaining`})`}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {isBalanced
                          ? `All criteria weights add up to exactly 100%. Scores will calculate weighted contribution averages correctly.`
                          : `Individual criteria weights must sum up to exactly 100% for proper weighted grading calculations.`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAutoBalanceWeights}
                    style={{
                      fontSize: '0.76rem',
                      height: '32px',
                      fontWeight: 700,
                      gap: '0.35rem',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                    title="Distribute 100% weight evenly across all criteria"
                  >
                    <Sparkles size={13} className="text-primary" /> Auto-Distribute Evenly (100%)
                  </button>
                </div>
              );
            })()}

            {/* Criteria List Cards */}
            {featureToggles.showCriterionCards && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeClass.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      backgroundColor: 'var(--bg-app)',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Top Row: Name, Scale, Editable Weightage, and Delete */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(90px, 1fr) minmax(90px, 1fr) minmax(110px, 1fr) auto', gap: '0.85rem', alignItems: 'flex-end' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>#{idx + 1}</span> Criterion Name
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={field.name}
                          placeholder="e.g. Quality of Contribution, Collaboration..."
                          onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                          style={{ height: '36px', fontSize: '0.84rem', fontWeight: 600 }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem' }}>Min Scale</label>
                        <input
                          type="number"
                          className="form-input"
                          value={field.min}
                          onChange={(e) => handleUpdateField(field.id, { min: Number(e.target.value) })}
                          style={{ height: '36px', fontSize: '0.84rem', textAlign: 'center' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem' }}>Max Scale</label>
                        <input
                          type="number"
                          className="form-input"
                          value={field.max}
                          onChange={(e) => handleUpdateField(field.id, { max: Number(e.target.value) })}
                          style={{ height: '36px', fontSize: '0.84rem', textAlign: 'center' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem' }}>Weightage (%)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', height: '36px' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={field.weight !== undefined ? field.weight : Math.round(100 / activeClass.fields.length)}
                            min={0}
                            max={100}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, Number(e.target.value)));
                              handleUpdateField(field.id, { weight: val });
                            }}
                            style={{ height: '36px', fontSize: '0.84rem', textAlign: 'center', width: '70px', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)' }}>%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
                        <button
                          className="btn btn-rose btn-sm"
                          onClick={() => handleDeleteField(field.id)}
                          title="Delete rubric scale"
                          style={{ height: '34px', padding: '0 0.6rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Behavioral Guidance / Criterion Description */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, marginBottom: '0.25rem' }}>
                        Guidance &amp; Behavioral Indicator (Shown to students while grading):
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={field.description || ''}
                        placeholder="e.g. Produces thorough, accurate deliverables on schedule with high attention to detail..."
                        onChange={(e) => handleUpdateField(field.id, { description: e.target.value })}
                        style={{ fontSize: '0.78rem', height: '32px', color: 'var(--text-secondary)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scale visual simulation - Only rendered when enabled in Settings */}
            {featureToggles.showEvaluationSimulator && (
              <div data-tour="eval-simulator-card" style={{ marginTop: '2rem', backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--primary)' }}>
                <h4 style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={18} /> Student Interface Experience Preview
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Students see an engaging, professional tier evaluation selector. Selecting a contribution tier snaps the score, which can then be fine-tuned:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {activeClass.fields.slice(0, 1).map(field => {
                  const range = field.max - field.min;
                  const isNarrowRange = range <= 15;
                  const previewVal = Math.round(field.min + 0.63 * range); // Mimic "Solid Player" (63%)
                  const scoreNodes = [];
                  for (let val = field.min; val <= field.max; val++) {
                    scoreNodes.push(val);
                  }

                  return (
                    <div key={field.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{field.name}</span>
                        <span className="slider-value-bubble" style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)', fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                          {previewVal} / {field.max}
                        </span>
                      </div>

                      {/* Unified Single Scale Simulator Preview */}
                      <div className="score-fine-tuner" style={{ margin: 0, padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)' }}>
                        {/* Dynamic Qualitative Tier Indicator Simulation */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            border: '1px solid hsla(243, 75%, 59%, 0.12)',
                            marginBottom: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary)', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0 }}>
                            <ThumbsUp size={13} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--text-primary)' }}>Solid Player / Meets Expectations</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.25 }}>Met all standards, cooperative, communicative, reliable teamwork.</span>
                          </div>
                        </div>

                        {isNarrowRange ? (
                          <div className="score-nodes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                            {scoreNodes.map((nodeVal) => {
                              const isActive = previewVal === nodeVal;
                              return (
                                <div
                                  key={nodeVal}
                                  className={`score-node-btn ${isActive ? 'active' : ''}`}
                                  style={isActive ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff', cursor: 'default' } : { cursor: 'default' }}
                                >
                                  {nodeVal}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="score-stepper" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button type="button" className="score-stepper-btn" disabled style={{ cursor: 'default' }}>
                                <Minus size={14} />
                              </button>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '45px' }}>
                                <span className="score-stepper-value" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{previewVal}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                  63%
                                </span>
                              </div>

                              <button type="button" className="score-stepper-btn" disabled style={{ cursor: 'default' }}>
                                <Plus size={14} />
                              </button>
                            </div>

                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <input
                                type="range"
                                className="custom-slider"
                                min={field.min}
                                max={field.max}
                                value={previewVal}
                                disabled
                                style={{
                                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) 63%, var(--border-color) 63%, var(--border-color) 100%)`,
                                  cursor: 'default'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeClass.fields.length > 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Additional Configured Metrics ({activeClass.fields.length - 1})
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {activeClass.fields.slice(1).map(field => (
                        <div key={field.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 600 }}>{field.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Range: {field.min} - {field.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INSTANT CALCULATIONS & RESULTS */}
      {activeTab === 'results' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Header Card */}
          {featureToggles.showResultsHeaderCard && (
            <div className="card" data-tour="gradebook-matrix-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Award size={18} className="text-teal" /> Real-time Calculation Matrix
                  <FeatureInfoButton featureId="calculation-matrix" size="sm" tooltipText="Calculation Matrix Guide" />
                </h3>
                <p className="card-subtitle">Self-excluded student averages recalculate instantly as submissions arrive. Calculations do not count self-grading reviews.</p>
              </div>

              <div className="responsive-btn-group">
                {featureToggles.showExportReportButtons && (
                  <button
                    type="button"
                    className="btn btn-teal"
                    onClick={() => openReportModal()}
                    title="View & Download Individual Student PDF Report Cards with Live Preview"
                    style={{ gap: '0.4rem' }}
                  >
                    <FileText size={16} /> Student PDF Reports
                  </button>
                )}

                {featureToggles.showSubmissionReset && (
                  <button
                    className="btn btn-secondary text-amber"
                    style={{ borderColor: 'var(--accent-amber)' }}
                    onClick={() => {
                      triggerConfirm(
                        'Reset All Peer Evaluations',
                        'Are you sure you want to wipe all submitted peer reviews for this classroom? This will reset all student review statuses to pending. This action cannot be undone.',
                        () => resetClassReviews(activeClass.id),
                        'Reset Submissions',
                        'Cancel'
                      );
                    }}
                  >
                    <RefreshCw size={16} /> Reset Submissions
                  </button>
                )}

                {featureToggles.showExportReportButtons && (
                  <button
                    className="btn btn-primary"
                    onClick={handleExportExcel}
                    title="Download comprehensive multi-sheet Excel workbook with grades and written reviews"
                  >
                    <Download size={16} /> Download Excel Report (.xlsx)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Advanced Analytics & Grading Engine Grid - Only rendered if at least one analytics component is enabled */}
          {(featureToggles.showCompetencyRadar || featureToggles.showJohariMatrix || featureToggles.showQualitativeFeedback || featureToggles.showWebPACalibration || featureToggles.showAnomalyAudit || featureToggles.showMilestonesHistory) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Tier 1: Competency Radar, Johari Matrix & Qualitative Themes - Only rendered if enabled */}
              {(featureToggles.showCompetencyRadar || featureToggles.showJohariMatrix || featureToggles.showQualitativeFeedback) && (
                <div data-tour="perception-deck-card" style={{
                  display: 'grid',
                  gridTemplateColumns: (featureToggles.showCompetencyRadar && (featureToggles.showJohariMatrix || featureToggles.showQualitativeFeedback)) ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr',
                  gap: '1.25rem',
                  alignItems: 'stretch'
                }}>

                  {/* Card 1: Multi-Axis Competency Spider Radar */}
                  {featureToggles.showCompetencyRadar && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.98rem', fontWeight: 800 }}>
                          <Activity size={17} className="text-primary" /> Competency Spider Radar
                          <FeatureInfoButton featureId="radar-analytics" size="sm" tooltipText="Competency Radar Guide" />
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                          Class rubric benchmarks vs individual team averages.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overlay:</span>
                        <CustomSelect
                          value={radarTeamFilter}
                          onChange={(val) => setRadarTeamFilter(val)}
                          options={[
                            { value: 'All', label: 'Class Average' },
                            ...uniqueGroups.filter(g => g && g !== 'Unassigned').map(g => ({ value: g, label: g }))
                          ]}
                          style={{ width: 'auto', minWidth: '140px' }}
                          triggerStyle={{ height: '30px', fontSize: '0.76rem', padding: '0 0.55rem' }}
                        />
                      </div>
                    </div>

                    {activeClass.fields.length >= 3 ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '0.5rem 0' }}>
                        <RadarChart
                          metrics={activeClass.fields.map(f => ({ id: f.id, name: f.name, max: f.max }))}
                          series={[
                            {
                              id: 'class_avg',
                              name: 'Class Average',
                              color: 'var(--primary)',
                              values: (() => {
                                const res: Record<string, number | null> = {};
                                activeClass.fields.forEach(f => {
                                  let sum = 0, count = 0;
                                  activeClass.students.forEach(s => {
                                    const m = calculateStudentMetrics(s, activeClass);
                                    const val = m.fieldAverages[f.id];
                                    if (val !== null) { sum += val; count++; }
                                  });
                                  res[f.id] = count > 0 ? sum / count : null;
                                });
                                return res;
                              })()
                            },
                            ...(radarTeamFilter !== 'All' ? [{
                              id: 'team_avg',
                              name: `${radarTeamFilter} Average`,
                              color: 'var(--accent-teal)',
                              values: (() => {
                                const res: Record<string, number | null> = {};
                                const teamStudents = activeClass.students.filter(s => s.groupName === radarTeamFilter);
                                activeClass.fields.forEach(f => {
                                  let sum = 0, count = 0;
                                  teamStudents.forEach(s => {
                                    const m = calculateStudentMetrics(s, activeClass);
                                    const val = m.fieldAverages[f.id];
                                    if (val !== null) { sum += val; count++; }
                                  });
                                  res[f.id] = count > 0 ? sum / count : null;
                                });
                                return res;
                              })()
                            }] : [])
                          ]}
                          size={270}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px dashed var(--border-color)', margin: '0.5rem 0' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                          <Activity size={22} />
                        </div>
                        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Multi-Axis Radar Requires 3+ Criteria
                        </h4>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.45 }}>
                          Your classroom currently has {activeClass.fields.length} {activeClass.fields.length === 1 ? 'criterion' : 'criteria'}. A multi-axis spider radar requires at least 3 evaluation axes to construct its geometric benchmark polygon.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              handleApplyPreset('ipaf_research_synthesized');
                              addToast('Loaded 6-criteria research rubric preset! Spider radar is now active.', 'success');
                            }}
                            style={{ fontSize: '0.78rem', gap: '0.35rem', height: '32px' }}
                          >
                            <Sparkles size={13} /> Load 6-Axis Rubric Preset
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setActiveTab('grading')}
                            style={{ fontSize: '0.78rem', gap: '0.35rem', height: '32px' }}
                          >
                            <Plus size={13} /> Add Criteria in Review System
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Column 2: Johari Alignment & Qualitative Feedback Insights - Only rendered if enabled */}
                {(featureToggles.showJohariMatrix || featureToggles.showQualitativeFeedback) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Card 2: Johari Alignment */}
                    {featureToggles.showJohariMatrix && (() => {
                      const johariList = activeClass.students.map(s => calculateJohariWindowMetric(s.id, activeClass));
                      const calibrated = johariList.filter(j => j.category === 'calibrated').length;
                      const overestimating = johariList.filter(j => j.category === 'overestimating').length;
                      const underestimating = johariList.filter(j => j.category === 'underestimating').length;
                      const totalActive = calibrated + overestimating + underestimating;

                      return (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', flex: 1 }}>
                          <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800 }}>
                              <UserCheck size={17} className="text-teal" /> Self-Awareness &amp; Johari Alignment
                              <FeatureInfoButton featureId="johari-window" size="sm" tooltipText="Johari Alignment Guide" />
                              <ContextHelpPopover topicKey="johari" />
                            </h3>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                              Self-evaluation alignment vs anonymous peer consensus (±7.5% threshold).
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>Accurately Calibrated</span>
                                <b>{calibrated} ({totalActive > 0 ? Math.round((calibrated / totalActive) * 100) : 0}%)</b>
                              </div>
                              <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${totalActive > 0 ? (calibrated / totalActive) * 100 : 0}%`, backgroundColor: 'var(--accent-teal)', height: '100%', borderRadius: '3px' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>Blind Spot (Overestimating)</span>
                                <b>{overestimating} ({totalActive > 0 ? Math.round((overestimating / totalActive) * 100) : 0}%)</b>
                              </div>
                              <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${totalActive > 0 ? (overestimating / totalActive) * 100 : 0}%`, backgroundColor: 'var(--accent-amber)', height: '100%', borderRadius: '3px' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Imposter (Underestimating)</span>
                                <b>{underestimating} ({totalActive > 0 ? Math.round((underestimating / totalActive) * 100) : 0}%)</b>
                              </div>
                              <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${totalActive > 0 ? (underestimating / totalActive) * 100 : 0}%`, backgroundColor: 'var(--primary)', height: '100%', borderRadius: '3px' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card 3: Qualitative Feedback Themes */}
                    {featureToggles.showQualitativeFeedback && (() => {
                      const insights = extractClassFeedbackInsights(activeClass);
                      return (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', flex: 1 }}>
                          <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800 }}>
                              <MessageSquare size={17} className="text-primary" /> Qualitative Feedback Themes
                              <FeatureInfoButton featureId="feedback-sentiment" size="sm" tooltipText="Feedback Themes Guide" />
                            </h3>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                              Automated keyword extraction across all written teammate comments.
                            </p>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Top Strengths:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                                {insights.topStrengthsThemes.length === 0 ? (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No strengths feedback yet</span>
                                ) : (
                                  insights.topStrengthsThemes.slice(0, 4).map(t => (
                                    <span key={t.word} className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}>
                                      {t.word} ({t.count})
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Growth Areas:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                                {insights.topGrowthThemes.length === 0 ? (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No constructive feedback yet</span>
                                ) : (
                                  insights.topGrowthThemes.slice(0, 4).map(t => (
                                    <span key={t.word} className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}>
                                      {t.word} ({t.count})
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                )}
              </div>
            )}

            {/* Tier 2: WebPA Calibration, Anomaly Audit & Milestones (3 Equal Columns) */}
            {(featureToggles.showWebPACalibration || featureToggles.showAnomalyAudit || featureToggles.showMilestonesHistory) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>

                {/* Card 4: WebPA Grade Calibration */}
                {featureToggles.showWebPACalibration && (
                  <div className="card" data-tour="webpa-calibrator-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800 }}>
                        <Sliders size={17} className="text-teal" /> WebPA Grade Calibration
                        <FeatureInfoButton featureId="webpa-calibration" size="sm" tooltipText="WebPA Calibration & Fudge Weight Guide" />
                        <ContextHelpPopover topicKey="webpa" />
                      </h3>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.85rem 0', lineHeight: 1.35 }}>
                        Compare peer vs team averages to calculate individual multipliers.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Default Project Base Mark */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', margin: 0 }}>
                            Default Project Base Mark
                          </label>
                          {classTeams.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                const newGrades: Record<string, number> = {};
                                classTeams.forEach(t => { newGrades[t] = baseGroupGrade; });
                                setAllTeamBaseGrades(activeClass.id, newGrades);
                              }}
                              style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', height: '22px', fontWeight: 700 }}
                              title="Set all teams in the class to this default base mark"
                            >
                              Apply to All Teams
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          max={1000}
                          value={baseGroupGrade}
                          onChange={(e) => setBaseGroupGrade(Number(e.target.value))}
                          style={{ height: '34px', fontSize: '0.85rem', fontWeight: 700 }}
                        />
                      </div>

                      {/* Team-Specific Project Base Marks Quick Inputs */}
                      {classTeams.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Users size={12} className="text-teal" /> Team Base Marks ({classTeams.length})
                            </span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm"
                              onClick={() => setIsTeamBaseGradesModalOpen(true)}
                              style={{ fontSize: '0.72rem', padding: 0, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
                            >
                              Manage All &rarr;
                            </button>
                          </div>

                          <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.35rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            {classTeams.map(team => {
                              const teamMark = activeClass?.teamBaseGrades?.[team] ?? baseGroupGrade;
                              const isCustom = activeClass?.teamBaseGrades && typeof activeClass.teamBaseGrades[team] === 'number';
                              const members = activeClass.students.filter(s => s.groupName === team);
                              return (
                                <div key={team} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', fontSize: '0.74rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0, overflow: 'hidden' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={team}>
                                      {team}
                                    </span>
                                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>({members.length})</span>
                                    {isCustom && <span className="badge badge-teal" style={{ fontSize: '0.58rem', padding: '0.02rem 0.25rem', whiteSpace: 'nowrap' }}>Custom</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                    <TeamBaseGradeInput
                                      initialValue={teamMark}
                                      onCommit={(val) => updateTeamBaseGrade(activeClass.id, team, val)}
                                      compact
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fudge Weight Slider */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.78rem' }}>Calibrator Fudge Weight</label>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(fudgeWeight * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          className="custom-slider"
                          min={0}
                          max={1}
                          step={0.05}
                          value={fudgeWeight}
                          onChange={(e) => setFudgeWeight(Number(e.target.value))}
                          style={{
                            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${fudgeWeight * 100}%, var(--border-color) ${fudgeWeight * 100}%, var(--border-color) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Card 5: Anomaly Conflict Audit */}
                {featureToggles.showAnomalyAudit && (
                  <div className="card" data-tour="anomaly-audit-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800 }}>
                        <ShieldCheck size={17} className="text-rose" /> Anomaly &amp; Collusion Audit
                        <FeatureInfoButton featureId="anomaly-detection" size="sm" tooltipText="Anomaly Audit Guide" />
                      </h3>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.85rem 0', lineHeight: 1.35 }}>
                        Statistical auditing flags collusion, outlier ratings, and uniform grades.
                      </p>
                    </div>

                    <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {detectClassAnomalies(activeClass).length === 0 ? (
                        <div style={{ backgroundColor: 'var(--accent-teal-light)', border: '1px solid hsl(173, 80%, 90%)', color: 'var(--accent-teal)', fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', gap: '0.35rem', alignItems: 'center', fontWeight: 600 }}>
                          <CheckCircle size={13} /> No scoring conflicts detected.
                        </div>
                      ) : (
                        detectClassAnomalies(activeClass).map((anomaly) => (
                          <div
                            key={anomaly.id}
                            style={{
                              backgroundColor: anomaly.severity === 'high' ? 'var(--accent-rose-light)' : 'var(--accent-amber-light)',
                              border: `1px solid ${anomaly.severity === 'high' ? 'hsl(346, 84%, 90%)' : 'hsl(45, 90%, 90%)'}`,
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem'
                            }}
                          >
                            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
                              <AlertTriangle size={12} style={{ color: anomaly.severity === 'high' ? 'var(--accent-rose)' : 'var(--accent-amber)', flexShrink: 0 }} />
                              {anomaly.studentName} ({anomaly.type.toUpperCase()})
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{anomaly.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Card 6: Milestone Archive Card */}
                {featureToggles.showMilestonesHistory && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800 }}>
                        <RefreshCw size={17} className="text-indigo" /> Milestone &amp; Sprints History
                        <FeatureInfoButton featureId="milestones-sprints" size="sm" tooltipText="Milestone History Guide" />
                      </h3>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.85rem 0', lineHeight: 1.35 }}>
                        Archive evaluations into permanent records to freeze sprint marks.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', height: '34px', fontSize: '0.78rem' }}
                        onClick={() => setIsArchiveModalOpen(true)}
                      >
                        Archive Active Session
                      </button>
                      <div style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                        {(activeClass.milestones || []).length === 0 ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No archived sprint records.</span>
                        ) : (
                          (activeClass.milestones || []).map((m) => (
                            <div
                              key={m.id}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}
                            >
                              <span style={{ fontWeight: 600 }}>{m.name}</span>
                              <button
                                className="btn btn-sm text-rose"
                                style={{ padding: '2px', border: 'none', background: 'transparent' }}
                                onClick={() => {
                                  triggerConfirm(
                                    'Delete Historical Milestone',
                                    `Are you sure you want to permanently delete the archived milestone "${m.name}"? This will delete all of its scoring history. This action cannot be undone.`,
                                    () => deleteMilestone(activeClass.id, m.id),
                                    'Delete Milestone',
                                    'Cancel'
                                  );
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
            </div>
          )}

          {/* LMS Gradebook Integration & Smart Export Formats */}
          {featureToggles.showLmsExport && (
            <div
              className="card"
              data-tour="lms-export-card"
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                      <GraduationCap size={22} className="text-teal" /> LMS Gradebook Integration &amp; Smart Export Formats
                      <FeatureInfoButton featureId="lms-export" size="sm" tooltipText="LMS Gradebook Integration Guide" />
                    </h3>
                    <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                      Smart LMS Sync
                    </span>
                    {selectedLmsTab === 'custom' && (
                      <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '12px', color: '#8B5CF6', borderColor: '#8B5CF6' }}>
                        Custom Schema Builder
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                    Export formatted gradebook files for Canvas, Blackboard, Moodle, Brightspace D2L, or build a custom schema tailored to your institution's LMS with team &amp; student filters.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setLmsGuideActiveTab(selectedLmsTab);
                      setShowLmsGuideModal(true);
                    }}
                    style={{ fontSize: '0.78rem', height: '34px', padding: '0 0.85rem', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <BookOpen size={14} className="text-primary" /> LMS Import Step-by-Step Guide
                  </button>
                </div>
              </div>

              {/* Tab Selector & Controls Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                {/* LMS Platform Tabs */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-primary)',
                    padding: '0.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    gap: '0.25rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLmsTab('canvas')}
                    className={`btn btn-sm ${selectedLmsTab === 'canvas' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      height: '32px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#E13F2B',
                        display: 'inline-block'
                      }}
                    />
                    Canvas LMS
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLmsTab('blackboard')}
                    className={`btn btn-sm ${selectedLmsTab === 'blackboard' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      height: '32px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#D4AF37',
                        display: 'inline-block'
                      }}
                    />
                    Blackboard Learn
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLmsTab('moodle')}
                    className={`btn btn-sm ${selectedLmsTab === 'moodle' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      height: '32px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#F98012',
                        display: 'inline-block'
                      }}
                    />
                    Moodle
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLmsTab('brightspace')}
                    className={`btn btn-sm ${selectedLmsTab === 'brightspace' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      height: '32px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#006FBF',
                        display: 'inline-block'
                      }}
                    />
                    Brightspace D2L
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLmsTab('custom')}
                    className={`btn btn-sm ${selectedLmsTab === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      height: '32px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: selectedLmsTab === 'custom' ? '#8B5CF6' : undefined,
                      color: selectedLmsTab === 'custom' ? '#fff' : undefined
                    }}
                  >
                    <Sliders size={13} style={{ color: selectedLmsTab === 'custom' ? '#fff' : '#8B5CF6' }} />
                    Custom LMS Format
                  </button>
                </div>

                {/* Score Type Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Grade Output:
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '0.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      gap: '0.2rem'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setLmsScoreType('calibrated')}
                      className={`btn btn-sm ${lmsScoreType === 'calibrated' ? 'btn-secondary' : 'btn-ghost'}`}
                      style={{
                        height: '28px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0 0.65rem',
                        borderRadius: '6px'
                      }}
                      title="Calibrated grade using WebPA multipliers and team base mark"
                    >
                      WebPA Calibrated ({baseGroupGrade} max)
                    </button>

                    <button
                      type="button"
                      onClick={() => setLmsScoreType('scale')}
                      className={`btn btn-sm ${lmsScoreType === 'scale' ? 'btn-secondary' : 'btn-ghost'}`}
                      style={{
                        height: '28px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0 0.65rem',
                        borderRadius: '6px'
                      }}
                      title="Score scaled to rubric max scale"
                    >
                      Rubric Scale (/{getTargetScale(activeClass)})
                    </button>

                    <button
                      type="button"
                      onClick={() => setLmsScoreType('percent')}
                      className={`btn btn-sm ${lmsScoreType === 'percent' ? 'btn-secondary' : 'btn-ghost'}`}
                      style={{
                        height: '28px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0 0.65rem',
                        borderRadius: '6px'
                      }}
                      title="Standard 0 - 100% percentage grade"
                    >
                      Percentage (100%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtering Bar (Team Filter & Status Filter) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  {/* Team Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Filter size={14} className="text-teal" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Team Filter:
                    </span>
                    <select
                      className="form-input"
                      value={lmsTeamFilter}
                      onChange={(e) => setLmsTeamFilter(e.target.value)}
                      style={{
                        height: '30px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '0 0.5rem',
                        minWidth: '150px',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="all">All Teams (Entire Class - {activeClass.students.length})</option>
                      {classTeams.map(t => {
                        const count = activeClass.students.filter(s => s.groupName === t).length;
                        return (
                          <option key={t} value={t}>
                            {t} ({count} student{count === 1 ? '' : 's'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Submission Status Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Student Status:
                    </span>
                    <select
                      className="form-input"
                      value={lmsStatusFilter}
                      onChange={(e) => setLmsStatusFilter(e.target.value as any)}
                      style={{
                        height: '30px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        padding: '0 0.5rem',
                        minWidth: '130px',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="all">All Students ({activeClass.students.length})</option>
                      <option value="submitted">Evaluated Only ({stats.submittedCount})</option>
                      <option value="pending">Pending Reviews ({activeClass.students.filter(s => !s.submitted).length})</option>
                    </select>
                  </div>

                  {/* Clear Filter Button */}
                  {(lmsTeamFilter !== 'all' || lmsStatusFilter !== 'all') && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setLmsTeamFilter('all');
                        setLmsStatusFilter('all');
                      }}
                      style={{ height: '28px', fontSize: '0.72rem', padding: '0 0.5rem', gap: '0.25rem', color: 'var(--accent-amber)' }}
                      title="Reset filters back to all teams"
                    >
                      <X size={12} /> Reset Filter
                    </button>
                  )}
                </div>

                {/* Scope Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {lmsTeamFilter !== 'all' ? (
                    <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      Scope: Team "{lmsTeamFilter}"
                    </span>
                  ) : (
                    <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      Scope: Entire Classroom
                    </span>
                  )}
                </div>
              </div>

              {/* CUSTOM LMS SCHEMA BUILDER PANEL (Only shown when selectedLmsTab === 'custom') */}
              {selectedLmsTab === 'custom' && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    border: '1px solid #8B5CF6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Custom Schema Header & Quick Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={16} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          Custom LMS Column Schema Builder
                        </span>
                        <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', fontWeight: 700, fontSize: '0.7rem' }}>
                          {customLmsConfig.columns.length} Columns
                        </span>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        Define column headers, data mappings, order, and delimiter required by your institution's LMS or SIS portal.
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Presets:</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCustomLmsConfig({
                            ...customLmsConfig,
                            columns: [
                              { id: 'c1', field: 'student_id', header: 'Student ID' },
                              { id: 'c2', field: 'score', header: 'Final Grade' }
                            ]
                          });
                          addToast('Loaded "Simple ID + Grade" preset', 'info');
                        }}
                        style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.5rem' }}
                      >
                        ID + Grade
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCustomLmsConfig({
                            ...customLmsConfig,
                            columns: [
                              { id: 'c1', field: 'email', header: 'Email' },
                              { id: 'c2', field: 'score', header: 'Grade' }
                            ]
                          });
                          addToast('Loaded "Email + Grade" preset', 'info');
                        }}
                        style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.5rem' }}
                      >
                        Email + Grade
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCustomLmsConfig({
                            ...customLmsConfig,
                            columns: [
                              { id: 'c1', field: 'student_id', header: 'Student ID' },
                              { id: 'c2', field: 'full_name_last_first', header: 'Student Name' },
                              { id: 'c3', field: 'email', header: 'Email' },
                              { id: 'c4', field: 'group_name', header: 'Team' },
                              { id: 'c5', field: 'score', header: 'Peer Assessment Grade' }
                            ]
                          });
                          addToast('Loaded "Standard Roster + Grade" preset', 'info');
                        }}
                        style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.5rem' }}
                      >
                        Default Roster
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCustomLmsConfig({
                            ...customLmsConfig,
                            columns: [
                              { id: 'c1', field: 'student_id', header: 'Student ID' },
                              { id: 'c2', field: 'full_name_first_last', header: 'Name' },
                              { id: 'c3', field: 'email', header: 'Email' },
                              { id: 'c4', field: 'group_name', header: 'Team' },
                              { id: 'c5', field: 'submission_status', header: 'Submission' },
                              { id: 'c6', field: 'multiplier', header: 'WebPA Ratio' },
                              { id: 'c7', field: 'score', header: 'Calibrated Score' }
                            ]
                          });
                          addToast('Loaded "Full Audit Dossier" preset', 'info');
                        }}
                        style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.5rem' }}
                      >
                        Full Audit
                      </button>
                    </div>
                  </div>

                  {/* Schema Settings Bar (Delimiter, Headers, Quotes, Points Row) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Delimiter */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Delimiter:</span>
                        <select
                          className="form-input"
                          value={customLmsConfig.delimiter}
                          onChange={(e) => setCustomLmsConfig({ ...customLmsConfig, delimiter: e.target.value as any })}
                          style={{ height: '28px', fontSize: '0.74rem', padding: '0 0.4rem', borderRadius: '4px' }}
                        >
                          <option value=",">Comma (,)</option>
                          <option value=";">Semicolon (;)</option>
                          <option value="&#9;">Tab (\t - TSV)</option>
                        </select>
                      </div>

                      {/* Include Header */}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={customLmsConfig.includeHeader}
                          onChange={(e) => setCustomLmsConfig({ ...customLmsConfig, includeHeader: e.target.checked })}
                        />
                        Include Header Row
                      </label>

                      {/* Quote Values */}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={customLmsConfig.quoteValues}
                          onChange={(e) => setCustomLmsConfig({ ...customLmsConfig, quoteValues: e.target.checked })}
                        />
                        Quote All Cells ("")
                      </label>

                      {/* Points Possible Row */}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(customLmsConfig.includePointsPossibleRow)}
                          onChange={(e) => setCustomLmsConfig({ ...customLmsConfig, includePointsPossibleRow: e.target.checked })}
                        />
                        Include Points Possible Row
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={() => {
                        const newCol: CustomLmsColumn = {
                          id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                          field: 'score',
                          header: 'New Column'
                        };
                        setCustomLmsConfig({
                          ...customLmsConfig,
                          columns: [...customLmsConfig.columns, newCol]
                        });
                      }}
                      style={{ height: '28px', fontSize: '0.74rem', padding: '0 0.65rem', gap: '0.3rem', fontWeight: 700 }}
                    >
                      <Plus size={13} /> Add Column
                    </button>
                  </div>

                  {/* Columns List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {customLmsConfig.columns.map((col, idx) => (
                      <div
                        key={col.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '32px 180px 1fr auto auto',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.65rem',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {/* Index */}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
                          #{idx + 1}
                        </span>

                        {/* Field Selector */}
                        <select
                          className="form-input"
                          value={col.field}
                          onChange={(e) => {
                            const newField = e.target.value as CustomLmsColumnField;
                            const defaultH = {
                              student_id: 'Student ID',
                              full_name_last_first: 'Student Name',
                              full_name_first_last: 'Student Name',
                              first_name: 'First Name',
                              last_name: 'Last Name',
                              email: 'Email',
                              username: 'Username',
                              group_name: 'Team',
                              score: 'Peer Assessment Grade',
                              multiplier: 'WebPA Factor',
                              submission_status: 'Status',
                              university: 'University',
                              static_text: 'Tag'
                            }[newField] || 'Column';

                            const updated = customLmsConfig.columns.map((c, i) =>
                              i === idx ? { ...c, field: newField, header: c.header || defaultH } : c
                            );
                            setCustomLmsConfig({ ...customLmsConfig, columns: updated });
                          }}
                          style={{ height: '30px', fontSize: '0.76rem', fontWeight: 600, padding: '0 0.4rem', borderRadius: '4px' }}
                        >
                          <option value="student_id">Student ID / Roll No.</option>
                          <option value="full_name_last_first">Full Name ("Last, First")</option>
                          <option value="full_name_first_last">Full Name ("First Last")</option>
                          <option value="first_name">First Name only</option>
                          <option value="last_name">Last Name only</option>
                          <option value="email">Email Address</option>
                          <option value="username">Login Username</option>
                          <option value="group_name">Team / Group / Section</option>
                          <option value="score">Peer Assessment Grade</option>
                          <option value="multiplier">WebPA Factor (Multiplier)</option>
                          <option value="submission_status">Submission Status</option>
                          <option value="university">University / Institution</option>
                          <option value="static_text">Custom Constant Text</option>
                        </select>

                        {/* Editable Column Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={col.header}
                            onChange={(e) => {
                              const updated = customLmsConfig.columns.map((c, i) =>
                                i === idx ? { ...c, header: e.target.value } : c
                              );
                              setCustomLmsConfig({ ...customLmsConfig, columns: updated });
                            }}
                            placeholder="Enter column header name..."
                            style={{ height: '30px', fontSize: '0.78rem', padding: '0 0.5rem', fontWeight: 700, borderRadius: '4px' }}
                          />

                          {/* If static text, allow entering static text value */}
                          {col.field === 'static_text' && (
                            <input
                              type="text"
                              className="form-input"
                              value={col.staticValue || ''}
                              onChange={(e) => {
                                const updated = customLmsConfig.columns.map((c, i) =>
                                  i === idx ? { ...c, staticValue: e.target.value } : c
                                );
                                setCustomLmsConfig({ ...customLmsConfig, columns: updated });
                              }}
                              placeholder="Constant value (e.g. #)..."
                              style={{ height: '30px', fontSize: '0.74rem', width: '130px', padding: '0 0.4rem', borderRadius: '4px' }}
                            />
                          )}
                        </div>

                        {/* Reorder Buttons */}
                        <div style={{ display: 'inline-flex', gap: '0.15rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const cols = [...customLmsConfig.columns];
                              const temp = cols[idx - 1];
                              cols[idx - 1] = cols[idx];
                              cols[idx] = temp;
                              setCustomLmsConfig({ ...customLmsConfig, columns: cols });
                            }}
                            style={{ width: '24px', height: '24px', padding: 0 }}
                            title="Move column up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={idx === customLmsConfig.columns.length - 1}
                            onClick={() => {
                              if (idx === customLmsConfig.columns.length - 1) return;
                              const cols = [...customLmsConfig.columns];
                              const temp = cols[idx + 1];
                              cols[idx + 1] = cols[idx];
                              cols[idx] = temp;
                              setCustomLmsConfig({ ...customLmsConfig, columns: cols });
                            }}
                            style={{ width: '24px', height: '24px', padding: 0 }}
                            title="Move column down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        {/* Delete Column Button */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={customLmsConfig.columns.length <= 1}
                          onClick={() => {
                            if (customLmsConfig.columns.length <= 1) return;
                            const cols = customLmsConfig.columns.filter((_, i) => i !== idx);
                            setCustomLmsConfig({ ...customLmsConfig, columns: cols });
                          }}
                          style={{ width: '24px', height: '24px', padding: 0, color: 'var(--accent-red, #ef4444)' }}
                          title="Remove column"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Format Information Callout */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
                  <Info size={16} className="text-teal" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {selectedLmsTab === 'canvas' && (
                      <span>
                        <strong style={{ color: 'var(--text-primary)' }}>Canvas LMS Format:</strong> Standard import with <code style={{ fontSize: '0.74rem' }}>Student</code>, <code style={{ fontSize: '0.74rem' }}>ID</code>, <code style={{ fontSize: '0.74rem' }}>SIS User ID</code>, <code style={{ fontSize: '0.74rem' }}>SIS Login ID</code>, <code style={{ fontSize: '0.74rem' }}>Section</code>, and line 2 <code style={{ fontSize: '0.74rem' }}>Points Possible</code> row.
                      </span>
                    )}
                    {selectedLmsTab === 'blackboard' && (
                      <span>
                        <strong style={{ color: 'var(--text-primary)' }}>Blackboard Learn Grade Center:</strong> Quoted CSV standard with <code style={{ fontSize: '0.74rem' }}>Last Name</code>, <code style={{ fontSize: '0.74rem' }}>First Name</code>, <code style={{ fontSize: '0.74rem' }}>Username</code>, <code style={{ fontSize: '0.74rem' }}>Student ID</code>, and <code style={{ fontSize: '0.74rem' }}>Peer Evaluation [Total Pts: ...]</code> column header.
                      </span>
                    )}
                    {selectedLmsTab === 'moodle' && (
                      <span>
                        <strong style={{ color: 'var(--text-primary)' }}>Moodle Grader Report:</strong> Standard CSV with <code style={{ fontSize: '0.74rem' }}>First name</code>, <code style={{ fontSize: '0.74rem' }}>Last name</code>, <code style={{ fontSize: '0.74rem' }}>ID number</code>, <code style={{ fontSize: '0.74rem' }}>Email address</code>, and <code style={{ fontSize: '0.74rem' }}>Peer Assessment (Real)</code>.
                      </span>
                    )}
                    {selectedLmsTab === 'brightspace' && (
                      <span>
                        <strong style={{ color: 'var(--text-primary)' }}>Brightspace D2L Gradebook:</strong> Formatted with hash-prefixed <code style={{ fontSize: '0.74rem' }}>OrgDefinedId</code>, <code style={{ fontSize: '0.74rem' }}>Username</code>, <code style={{ fontSize: '0.74rem' }}>Peer Assessment Points Grade</code>, and terminal <code style={{ fontSize: '0.74rem' }}>End-of-Line Indicator</code>.
                      </span>
                    )}
                    {selectedLmsTab === 'custom' && (
                      <span>
                        <strong style={{ color: '#8B5CF6' }}>Custom LMS Schema:</strong> Outputting {customLmsConfig.columns.length} columns using '{customLmsConfig.delimiter === '\t' ? '\\t (Tab)' : customLmsConfig.delimiter}' delimiter with custom headers.
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const filters: LmsExportFilterOptions = {
                        teamFilter: lmsTeamFilter,
                        statusFilter: lmsStatusFilter
                      };
                      let csvStr = '';
                      if (selectedLmsTab === 'canvas') csvStr = generateCanvasLMSCSV(activeClass, lmsScoreType, filters);
                      else if (selectedLmsTab === 'blackboard') csvStr = generateBlackboardCSV(activeClass, lmsScoreType, filters);
                      else if (selectedLmsTab === 'moodle') csvStr = generateMoodleCSV(activeClass, lmsScoreType, filters);
                      else if (selectedLmsTab === 'brightspace') csvStr = generateBrightspaceCSV(activeClass, lmsScoreType, filters);
                      else csvStr = generateCustomLMSCSV(activeClass, lmsScoreType, customLmsConfig, filters);

                      navigator.clipboard.writeText(csvStr);
                      setCopiedLms(true);
                      setTimeout(() => setCopiedLms(false), 2000);
                      addToast(`Copied ${selectedLmsTab.toUpperCase()} gradebook text to clipboard!`, 'info');
                    }}
                    style={{ fontSize: '0.75rem', height: '30px', padding: '0 0.65rem', gap: '0.35rem' }}
                    title="Copy full CSV text to clipboard"
                  >
                    {copiedLms ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    <span>{copiedLms ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      try {
                        const filters: LmsExportFilterOptions = {
                          teamFilter: lmsTeamFilter,
                          statusFilter: lmsStatusFilter
                        };
                        exportLMSGradebook(selectedLmsTab, activeClass, lmsScoreType, filters, customLmsConfig);
                        addToast(`Exported ${selectedLmsTab.toUpperCase()} gradebook successfully!`, 'success');
                      } catch (e) {
                        addToast('Failed to export LMS gradebook.', 'error');
                      }
                    }}
                    style={{
                      fontSize: '0.75rem',
                      height: '30px',
                      padding: '0 0.85rem',
                      gap: '0.35rem',
                      fontWeight: 700,
                      backgroundColor: selectedLmsTab === 'custom' ? '#8B5CF6' : undefined
                    }}
                    title={`Download ${selectedLmsTab.toUpperCase()} Gradebook File`}
                  >
                    <Download size={13} />
                    <span>
                      Download {selectedLmsTab === 'canvas' ? 'Canvas' : selectedLmsTab === 'blackboard' ? 'Blackboard' : selectedLmsTab === 'moodle' ? 'Moodle' : selectedLmsTab === 'brightspace' ? 'Brightspace' : 'Custom'} {customLmsConfig.delimiter === '\t' ? 'TSV' : 'CSV'}
                      {lmsTeamFilter !== 'all' ? ` (${lmsTeamFilter})` : ''}
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Preview Table */}
              {(() => {
                const filters: LmsExportFilterOptions = {
                  teamFilter: lmsTeamFilter,
                  statusFilter: lmsStatusFilter
                };
                const preview = generateLMSPreview(selectedLmsTab, activeClass, lmsScoreType, filters, customLmsConfig, 4);

                if (preview.headers.length === 0 || preview.rows.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                      No students match the selected filter {lmsTeamFilter !== 'all' ? `("${lmsTeamFilter}")` : ''}.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Live CSV Preview (First {preview.rows.length} of {preview.totalFilteredCount} matching students)
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {lmsTeamFilter !== 'all' ? `Filtered to Team: ${lmsTeamFilter}` : `Total ${activeClass.students.length} students enrolled`}
                      </span>
                    </div>

                    <div
                      style={{
                        overflowX: 'auto',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                    >
                      <table className="table" style={{ margin: 0, fontSize: '0.75rem', width: '100%' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
                            {preview.headers.map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  padding: '0.45rem 0.65rem',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  fontSize: '0.72rem',
                                  color: 'var(--text-primary)',
                                  borderBottom: '1px solid var(--border-color)'
                                }}
                              >
                                {h || `(col ${i + 1})`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, rIdx) => {
                            const isPointsRow = row[0]?.includes('Points Possible');
                            return (
                              <tr
                                key={rIdx}
                                style={{
                                  backgroundColor: isPointsRow
                                    ? 'var(--accent-teal-light, rgba(13, 148, 136, 0.08))'
                                    : rIdx % 2 === 0
                                    ? 'transparent'
                                    : 'var(--bg-surface)'
                                }}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    style={{
                                      padding: '0.4rem 0.65rem',
                                      whiteSpace: 'nowrap',
                                      fontFamily: 'monospace',
                                      fontSize: '0.74rem',
                                      color: isPointsRow && cIdx === row.length - 1
                                        ? 'var(--accent-teal)'
                                        : 'var(--text-secondary)',
                                      fontWeight: isPointsRow ? 700 : 500,
                                      borderBottom: '1px solid var(--border-color)'
                                    }}
                                  >
                                    {cell || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>empty</span>}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Grades Matrix Sheet */}
          {featureToggles.showResultsSummarySheet && (
            <div className="card" data-tour="results-summary-card" style={{ padding: '1.25rem' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                    <Award size={20} className="text-indigo" /> Results Summary Sheet &amp; Gradebook
                    <FeatureInfoButton featureId="results-summary-sheet" size="sm" tooltipText="Gradebook & Results Matrix Guide" />
                  </h3>
                  <span className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {stats.submittedCount} of {stats.totalStudents} evaluated
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {featureToggles.showGradebookSearchFilter && (
                    <CustomSelect
                      options={groupOptions}
                      value={groupFilter}
                      onChange={(val) => setGroupFilter(val)}
                      style={{ width: 'auto', minWidth: '150px' }}
                      triggerStyle={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem' }}
                    />
                  )}

                  {featureToggles.showExportReportButtons && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-teal btn-sm"
                        onClick={handleExportExcel}
                        style={{ fontSize: '0.8rem', padding: '0 0.85rem', gap: '0.35rem', fontWeight: 700, height: '36px', borderRadius: '8px' }}
                        title="Export complete 2-sheet Excel report with WebPA metrics and written comments"
                      >
                        <Download size={14} /> Export Excel Report
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          try {
                            const csv = generateResultsCSV(activeClass);
                            downloadFileContent(csv, `${activeClass.name.replace(/\s+/g, '_')}_grades.csv`);
                            addToast('Results summary CSV downloaded successfully!', 'success');
                          } catch (e) {
                            addToast('Failed to export CSV results.', 'error');
                          }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0 0.75rem', gap: '0.35rem', height: '36px', borderRadius: '8px', fontWeight: 600 }}
                        title="Export results summary to CSV"
                      >
                        <Download size={14} /> CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>

            {activeClass.students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'hsla(45,93%,58%,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  <Award size={28} style={{ color: 'var(--accent-amber)' }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>No results to compute</p>
                <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '300px', lineHeight: 1.5 }}>Add participants to the roster and collect peer evaluations before viewing the performance matrix.</p>
              </div>
            ) : (
              <div className="table-container table-container-sticky">
                <table className="custom-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th className="freeze-col-1" style={{ minWidth: '180px' }}>Participant &amp; Team</th>
                      <th style={{ minWidth: '110px' }}>Review Status</th>
                      {activeClass.fields.map(f => (
                        <th key={f.id} style={{ minWidth: '120px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.78rem', textTransform: 'none', fontWeight: 700 }}>{f.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>Mean &amp; StdDev</span>
                          </div>
                        </th>
                      ))}
                      <th style={{ minWidth: '160px' }}>Strengths &amp; Praise</th>
                      <th style={{ minWidth: '120px' }}>WebPA Mark</th>
                      <th style={{ minWidth: '110px' }}>Weighted Score</th>
                      <th style={{ minWidth: '130px' }}>Johari Alignment</th>
                      <th style={{ textAlign: 'right', minWidth: '180px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      const metrics = calculateStudentMetrics(s, activeClass);

                      // Calculate anonymized praise tags
                      const teammates = activeClass.students
                        .filter((stud) => stud.groupName === s.groupName && stud.id !== s.id)
                        .map((stud) => stud.id);
                      const receivedReviews = activeClass.reviews.filter(
                        (r) => r.recipientId === s.id && teammates.includes(r.reviewerId)
                      );
                      const tagCounts: Record<string, number> = {};
                      receivedReviews.forEach((r) => {
                        if (Array.isArray(r.praiseTags)) {
                          r.praiseTags.forEach((tag) => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                          });
                        }
                      });
                      const tagEntries = Object.entries(tagCounts);

                      const { ratio, adjustedGrade, teamBaseGrade } = calculateStudentWebPAScore(
                        s.id,
                        s.groupName,
                        activeClass,
                        baseGroupGrade,
                        fudgeWeight
                      );

                      return (
                        <tr key={s.id}>
                          {/* Participant & Team */}
                          <td className="freeze-col-1">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{s.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span className="badge badge-teal" style={{ fontSize: '0.66rem', padding: '0.1rem 0.35rem', fontWeight: 700 }}>
                                  {s.groupName}
                                </span>
                                {s.university && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                    &bull; {s.university}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Review Status & Submission */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                {metrics.reviewsReceived} / {metrics.expectedReviewsCount}
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                                  ({metrics.gradeProgress}%)
                                </span>
                              </span>
                              <div>
                                {s.submitted ? (
                                  <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '0.08rem 0.35rem', gap: '0.2rem' }}>
                                    <CheckCircle size={9} /> Completed
                                  </span>
                                ) : (
                                  <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.08rem 0.35rem', gap: '0.2rem' }}>
                                    <Clock size={9} /> Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Rubric Criteria Columns (Unified Mean + StdDev) */}
                          {activeClass.fields.map(f => {
                            const val = metrics.fieldAverages[f.id];
                            const std = metrics.fieldStdDevs[f.id];
                            return (
                              <td key={f.id}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: val !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {val !== null ? `${val} / ${f.max}` : '—'}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {std !== null ? `±${std} dev` : '±0.0'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Received Praise & Strengths */}
                          <td>
                            <div className="praise-badge-list">
                              {tagEntries.length === 0 ? (
                                <span className="praise-badge-pill empty">No feedback yet</span>
                              ) : (
                                tagEntries.map(([tagText, count]) => {
                                  const tagInfo = getPraiseTagInfo(tagText);
                                  const TagIcon = tagInfo.icon;
                                  return (
                                    <span
                                      key={tagText}
                                      className="praise-badge-pill"
                                      style={{
                                        backgroundColor: tagInfo.bg,
                                        color: tagInfo.color,
                                        borderColor: tagInfo.border,
                                        fontSize: '0.7rem',
                                        padding: '0.15rem 0.4rem'
                                      }}
                                    >
                                      <TagIcon size={10} />
                                      <span>{tagInfo.text}</span>
                                      <span style={{ opacity: 0.8, marginLeft: '0.15rem' }}>x{count}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          {/* WebPA Calibrated Mark */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: adjustedGrade < (teamBaseGrade * 0.7) ? 'var(--accent-rose)' : 'hsl(142, 70%, 35%)' }}>
                                {metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${teamBaseGrade}` : '—'}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)' }}>
                                {metrics.reviewsReceived > 0 ? `WebPA: ${ratio.toFixed(2)}x` : 'WebPA: 1.00x'}
                              </span>
                            </div>
                          </td>

                          {/* Overall Weighted Score */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: metrics.overallPercentage !== null ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {metrics.overallPercentage !== null ? `${metrics.overallPercentage}%` : 'N/A'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                                {metrics.overallPercentage !== null ? `${((metrics.overallPercentage / 100) * activeClass.fields.reduce((acc, f) => acc + (f.max ?? 0), 0)).toFixed(1)} / ${activeClass.fields.reduce((acc, f) => acc + (f.max ?? 0), 0)}` : '—'}
                              </span>
                            </div>
                          </td>

                          {/* Self-Awareness (Johari) */}
                          <td>
                            {(() => {
                              const johari = calculateJohariWindowMetric(s.id, activeClass);
                              return (
                                <span
                                  className={`badge ${johari.badgeClass}`}
                                  style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', whiteSpace: 'nowrap', display: 'inline-flex' }}
                                  title={johari.description}
                                >
                                  {johari.label} {johari.gapPct !== null && `(${johari.gapPct > 0 ? '+' : ''}${johari.gapPct}%)`}
                                </span>
                              );
                            })()}
                          </td>

                          {/* 1-Click Minimal Segmented Action Dock */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-action-dock">
                              <button
                                type="button"
                                className="table-action-btn btn-text-action action-report"
                                onClick={() => openReportModal(s.id)}
                                title="View & Download PDF Report Card"
                              >
                                <FileText size={12} />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                className="table-action-btn btn-text-action action-details"
                                onClick={() => setSelectedStudentReport(s)}
                                title="View individual evaluation details"
                              >
                                <Eye size={12} />
                                <span>Details</span>
                              </button>
                              <button
                                type="button"
                                className="table-action-btn btn-text-action action-team"
                                onClick={() => {
                                  setSelectedTeamAnalysis(s.groupName);
                                  setActiveAuditMetric('overall');
                                }}
                                title="View team evaluation breakdown"
                              >
                                <Users size={12} />
                                <span>Team</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* TAB CONTENT: AUTOMATION & LINKS */}
      {activeTab === 'automation' && (() => {
        const submittedStudentsCount = activeClass.students.filter(s => s.submitted).length;
        const totalStudentsCount = activeClass.students.length;
        const submissionRate = totalStudentsCount > 0 ? Math.round((submittedStudentsCount / totalStudentsCount) * 100) : 0;
        const isDeadlineOpen = activeClass.deadline ? new Date(activeClass.deadline) > new Date() : true;

        return (
          <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Top Status & Overview Ribbon */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalStudentsCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classroom Members</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                    {submittedStudentsCount} / {totalStudentsCount} ({submissionRate}%)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submissions Completed</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: activeClass.deadline ? (isDeadlineOpen ? 'rgba(20, 184, 166, 0.12)' : 'rgba(244, 63, 94, 0.12)') : 'var(--bg-app)', color: activeClass.deadline ? (isDeadlineOpen ? 'var(--accent-teal)' : 'var(--accent-rose)') : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeClass.deadline ? (isDeadlineOpen ? <Clock size={20} /> : <Lock size={20} />) : <Unlock size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: activeClass.deadline ? (isDeadlineOpen ? 'var(--accent-teal)' : 'var(--accent-rose)') : 'var(--text-primary)' }}>
                    {activeClass.deadline ? (isDeadlineOpen ? 'Window Open' : 'Submissions Locked') : 'Always Open'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {activeClass.deadline ? new Date(activeClass.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Cutoff Date'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {emailService === 'simulator' ? 'Demo Sandbox' : emailService === 'emailjs' ? 'EmailJS Live' : 'Brevo SMTP'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Mailing Adapter</div>
                </div>
              </div>
            </div>

            {/* Main Command Center Deck */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

              {/* Card 1: Submission Window & Deadlines */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Clock size={18} className="text-rose" /> Submission Window &amp; Cutoff
                    </h3>
                    <span className={`badge ${activeClass.deadline ? (isDeadlineOpen ? 'badge-teal' : 'badge-rose') : 'badge-secondary'}`} style={{ fontSize: '0.72rem' }}>
                      {activeClass.deadline ? (isDeadlineOpen ? 'Active Countdown' : 'Locked') : 'Open (No Limit)'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                    Configure a strict closing date. Once passed, the student grading portal automatically displays a locked status and blocks new responses.
                  </p>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} className="text-indigo" /> Closing Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={activeClass.deadline ? new Date(new Date(activeClass.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          saveClassDeadline(activeClass.id, new Date(val).toISOString());
                        } else {
                          saveClassDeadline(activeClass.id, null);
                        }
                      }}
                    />
                  </div>

                  {/* Quick Presets */}
                  <div style={{ marginTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                      Quick Deadline Presets:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const in24h = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
                          saveClassDeadline(activeClass.id, in24h);
                        }}
                      >
                        +24 Hours
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const in48h = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
                          saveClassDeadline(activeClass.id, in48h);
                        }}
                      >
                        +48 Hours
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const in7d = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
                          saveClassDeadline(activeClass.id, in7d);
                        }}
                      >
                        +1 Week
                      </button>
                      {activeClass.deadline && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-rose"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => saveClassDeadline(activeClass.id, null)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  {activeClass.deadline ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: isDeadlineOpen ? 'var(--accent-teal)' : 'var(--accent-rose)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isDeadlineOpen ? <Clock size={14} /> : <Lock size={14} />}
                        {isDeadlineOpen ? 'Submission Clock Running' : 'Window Closed (Locked)'}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          if (isDeadlineOpen) {
                            saveClassDeadline(activeClass.id, new Date(Date.now() - 1000).toISOString());
                          } else {
                            saveClassDeadline(activeClass.id, null);
                          }
                        }}
                      >
                        {isDeadlineOpen ? 'Lock Submissions Now' : 'Re-open Submissions'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Unlock size={14} className="text-teal" /> Submissions always accepted
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Email Notification Engine */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={18} className="text-teal" /> Email Engine &amp; API
                    </h3>
                    <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                      Direct Links
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                    Send individualized evaluation links to students with unique tokens for secure anonymous submissions.
                  </p>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Active Mailing Provider</label>
                    <CustomSelect
                      options={emailServiceOptions}
                      value={emailService}
                      onChange={(val) => setEmailService(val as any)}
                    />
                  </div>

                  {emailService === 'emailjs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="EmailJS Service ID (e.g. service_xyz)"
                        className="form-input"
                        value={emailjsServiceId}
                        onChange={(e) => setEmailjsServiceId(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="EmailJS Template ID (e.g. template_abc)"
                        className="form-input"
                        value={emailjsTemplateId}
                        onChange={(e) => setEmailjsTemplateId(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="EmailJS Public Key / User ID"
                        className="form-input"
                        value={emailjsUserId}
                        onChange={(e) => setEmailjsUserId(e.target.value)}
                      />
                      <a
                        href="https://www.emailjs.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', textAlign: 'right', display: 'block' }}
                      >
                        How do I get these free keys?
                      </a>
                    </div>
                  )}

                  {emailService === 'brevo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="password"
                        placeholder="Brevo SMTP API Key"
                        className="form-input"
                        value={brevoApiKey}
                        onChange={(e) => setBrevoApiKey(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Verified Sender Email (e.g. prof@uni.edu)"
                        className="form-input"
                        value={brevoSenderEmail}
                        onChange={(e) => setBrevoSenderEmail(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Sender Name (Optional, e.g. Course Instructor)"
                        className="form-input"
                        value={brevoSenderName}
                        onChange={(e) => setBrevoSenderName(e.target.value)}
                      />
                      <a
                        href="https://www.brevo.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', textAlign: 'right', display: 'block' }}
                      >
                        How do I get my free Brevo API Key?
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <button
                    className={`btn btn-primary ${isSendingEmails ? 'btn-disabled' : ''}`}
                    onClick={() => triggerEmailAutomation(false)}
                    disabled={isSendingEmails}
                    style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Mail size={16} /> Send Links to All ({totalStudentsCount})
                  </button>
                  <button
                    className={`btn btn-secondary ${isSendingEmails ? 'btn-disabled' : ''}`}
                    style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => triggerEmailAutomation(true)}
                    disabled={isSendingEmails}
                  >
                    <Bell size={15} /> Send Reminders to Incomplete ({totalStudentsCount - submittedStudentsCount})
                  </button>
                </div>
              </div>

              {/* Card 3: Email Invitation Mockup */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FileText size={18} className="text-indigo" /> Email Invitation Mockup
                    </h3>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => setIsEditTemplateModalOpen(true)}
                    >
                      <Edit2 size={12} /> Edit Template
                    </button>
                  </div>

                  {/* Email Client Mockup Frame */}
                  <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontSize: '0.78rem' }}><b>To:</b> <span style={{ color: 'var(--text-secondary)' }}>student.name@university.edu</span></div>
                      <div style={{ fontSize: '0.78rem' }}><b>Subject:</b> <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{substitutePlaceholders(customEmailSubject, 'Student Name', activeClass.name)}</span></div>
                    </div>

                    <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word', fontSize: '0.82rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {substitutePlaceholders(customEmailBody, 'Student Name', activeClass.name)}
                    </div>

                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                      <span
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', boxShadow: 'var(--shadow-sm)' }}
                      >
                        <Zap size={14} /> Open Grading Portal
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0.75rem 0 0', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', lineHeight: 1.4 }}>
                      <Lock size={10} style={{ display: 'inline', marginRight: '3px' }} /> Anonymous feedback guaranteed. Team members only view aggregated scores.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      const text = `Subject: ${substitutePlaceholders(customEmailSubject, '[Student Name]', activeClass.name)}\n\n${substitutePlaceholders(customEmailBody, '[Student Name]', activeClass.name)}`;
                      navigator.clipboard.writeText(text);
                      addToast('Email template text copied to clipboard! (Ready to paste in LMS/Canvas)', 'success');
                    }}
                  >
                    <Copy size={13} /> Copy Template Text for Canvas / LMS
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Logs */}
            {(isSendingEmails || emailLogs.length > 0) && (
              <div className="card" style={{ animation: 'fadeIn 200ms ease' }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <RefreshCw size={16} className={isSendingEmails ? 'spin' : ''} /> Email Transmission Status
                </h4>

                <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ height: '100%', width: `${emailProgress}%`, backgroundColor: 'var(--accent-teal)', transition: 'width 200ms ease' }} />
                </div>

                <div
                  style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8rem', height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '0.25rem' }}
                >
                  {[...emailLogs].reverse().map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB CONTENT: CLOUD CONFIG */}
      {activeTab === 'cloud' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Database size={18} className={isCloudSynced ? 'text-teal' : 'text-indigo'} />
                Cloud Database Configurations
              </h3>
              <div>
                {isCloudSynced ? (
                  <span className="badge badge-teal" style={{ gap: '0.25rem' }}><CheckCircle size={12} /> Sync Enabled (Spark Free)</span>
                ) : (
                  <span className="badge badge-primary">Local-First Sandbox Mode</span>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              By default, this web application stores everything in your local browser sandbox (LocalStorage).
              If you want to host it online and have your students submit evaluations, simply setup a <b>Free Firebase Project</b> and paste your web application keys below.
            </p>

            <form onSubmit={handleFirebaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Firebase API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSyA1..."
                    className="form-input"
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project ID</label>
                  <input
                    type="text"
                    placeholder="peer-grading-f9c32"
                    className="form-input"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Auth Domain (Optional)</label>
                  <input
                    type="text"
                    placeholder="peer-grading.firebaseapp.com"
                    className="form-input"
                    value={fbAuthDomain}
                    onChange={(e) => setFbAuthDomain(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">App ID</label>
                  <input
                    type="text"
                    placeholder="1:84712:web:a91f..."
                    className="form-input"
                    value={fbAppId}
                    onChange={(e) => setFbAppId(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  <Database size={16} /> Link Firebase & Sync
                </button>
                {isCloudSynced && (
                  <button
                    type="button"
                    className="btn btn-secondary text-rose"
                    style={{ borderColor: 'var(--accent-rose)' }}
                    onClick={() => {
                      saveFirebaseConfig(null);
                      setFbApiKey('');
                      setFbProjectId('');
                      setFbAuthDomain('');
                      setFbAppId('');
                    }}
                  >
                    Disable Cloud Sync
                  </button>
                )}
              </div>
            </form>

            <div style={{ marginTop: '2rem', backgroundColor: 'var(--accent-amber-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-amber)', display: 'flex', gap: '0.75rem' }}>
              <AlertCircle size={24} className="text-amber" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <b>Safety Notice:</b> Your credentials are saved securely inside your local browser. No third-party servers see these keys. They are utilized directly by the Firestore SDK client within this window to push records to your project instance.
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* MODAL: CREATE CLASSROOM */}
      <Modal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
        title="Create New Classroom Group"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsNewClassModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (newClassName.trim()) {
                  createClass(newClassName.trim());
                  setNewClassName('');
                  setIsNewClassModalOpen(false);
                } else {
                  addToast('Classroom name cannot be empty.', 'warning');
                }
              }}
            >
              Add Classroom
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Classroom / Course Group Title Name</label>
          <input
            type="text"
            placeholder="e.g. Algorithms Design - Spring 2026"
            className="form-input"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL: ARCHIVE MILESTONE */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title="Archive Current Feedback as Milestone"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsArchiveModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (newMilestoneName.trim()) {
                  archiveActiveMilestone(activeClass.id, newMilestoneName.trim());
                  setNewMilestoneName('');
                  setIsArchiveModalOpen(false);
                } else {
                  addToast('Milestone name cannot be empty.', 'warning');
                }
              }}
            >
              Archive & Reset Active
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Milestone / Sprint Name</label>
          <input
            type="text"
            placeholder="e.g. Sprint 1, Midterm Review"
            className="form-input"
            value={newMilestoneName}
            onChange={(e) => setNewMilestoneName(e.target.value)}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.45 }}>
            <b>Notice:</b> Archiving saves all active student reviews and anonymous strengths comments into a permanent historical archive. It resets the active evaluation states so students can perform a fresh review cycle for the next sprint.
          </p>
        </div>
      </Modal>

      {/* MODAL: ADD STUDENT MANUALLY */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        title="Add Class Participant Manually"
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddStudentSubmit} style={{ gap: '0.35rem', fontWeight: 700 }}>
              <Plus size={15} /> Enroll Participant
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* SECTION 1: IDENTITY & CONTACT */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>1</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Identity &amp; Contact
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Full Student Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alice Johnson"
                  className="form-input"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Institutional Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. alice@university.edu"
                  className="form-input"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Student ID <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(Auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. std_8291"
                  className="form-input"
                  value={newStudent.id}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, id: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Assigned Team / Group Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Alpha, Group Gamma"
                  className="form-input"
                  value={newStudent.groupName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, groupName: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Gender Segmented Control */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Gender Identity
              </label>
              <div style={{ display: 'flex', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '3px' }}>
                {GENDER_OPTIONS.map((g) => {
                  const isSel = newStudent.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setNewStudent(prev => ({ ...prev, gender: g.value }))}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.25rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSel ? 'var(--primary)' : 'transparent',
                        color: isSel ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: isSel ? 700 : 600,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: GEOGRAPHIC & STUDENT STATUS */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>2</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Geographic &amp; Diversity Status
              </span>
            </div>

            {/* Toggle Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: newStudent.isInternational ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                  border: `1.5px solid ${newStudent.isInternational ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={newStudent.isInternational}
                  onChange={(e) => setNewStudent(prev => ({
                    ...prev,
                    isInternational: e.target.checked,
                    currentCountry: (e.target.checked && prev.currentCountry === prev.nationality) ? '' : prev.currentCountry
                  }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <div>
                  <b style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block' }}>International Student</b>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Studying outside home country</span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: newStudent.isExchange ? 'rgba(20, 184, 166, 0.08)' : '#ffffff',
                  border: `1.5px solid ${newStudent.isExchange ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={newStudent.isExchange}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, isExchange: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
                />
                <div>
                  <b style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Plane size={13} className="text-teal" /> Exchange / Erasmus
                  </b>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visiting / exchange semester</span>
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Nationality / Passport Country
                </label>
                <SearchableSelect
                  value={newStudent.nationality}
                  onChange={(val) => setNewStudent(prev => ({
                    ...prev,
                    nationality: val,
                    currentCountry: (!prev.currentCountry && !prev.isInternational) ? val : prev.currentCountry
                  }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select nationality..."
                  searchPlaceholder="Search 195+ countries..."
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Current Country of Residence / Study
                </label>
                <SearchableSelect
                  value={newStudent.currentCountry}
                  onChange={(val) => setNewStudent(prev => ({ ...prev, currentCountry: val }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select current country..."
                  searchPlaceholder="Search countries..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ACADEMIC BACKGROUND & LANGUAGE */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>3</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Academic Background &amp; Language
              </span>
            </div>

            {/* CEFR English Proficiency Level */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                CEFR English Proficiency Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.45rem' }}>
                {CEFR_LEVELS.map((cefr) => {
                  const isSel = newStudent.englishProficiency === cefr.value;
                  return (
                    <div
                      key={cefr.value}
                      onClick={() => setNewStudent(prev => ({ ...prev, englishProficiency: cefr.value }))}
                      style={{
                        padding: '0.55rem 0.65rem',
                        borderRadius: '7px',
                        backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                        border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isSel ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {cefr.code}
                        </span>
                        {isSel && <Check size={12} className="text-primary" />}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.2 }}>
                        {cefr.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Degree & Suggestions */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Degree / Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Mechanical Engineering, MBA"
                className="form-input"
                value={newStudent.degree}
                onChange={(e) => setNewStudent(prev => ({ ...prev, degree: e.target.value }))}
                style={{ height: '36px', fontSize: '0.82rem', marginBottom: '0.35rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {DEGREE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNewStudent(prev => ({ ...prev, degree: item }))}
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: newStudent.degree === item ? 'rgba(99, 102, 241, 0.12)' : '#ffffff',
                      color: newStudent.degree === item ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* University Details: Regular vs Exchange */}
            {!newStudent.isExchange ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  University / Institution Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University, TU Munich"
                  className="form-input"
                  value={newStudent.university}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, university: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.65rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Home Sending University (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sorbonne University, TU Munich"
                      className="form-input"
                      value={newStudent.originalUniversity}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, originalUniversity: e.target.value }))}
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Home Country <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <SearchableSelect
                      value={newStudent.originalCountry}
                      onChange={(val) => setNewStudent(prev => ({ ...prev, originalCountry: val }))}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select home country..."
                      searchPlaceholder="Search countries..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Host / Destination University <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University, Oxford"
                      className="form-input"
                      value={newStudent.currentUniversity}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, currentUniversity: e.target.value }))}
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Host Destination Country
                    </label>
                    <SearchableSelect
                      value={newStudent.currentCountry}
                      onChange={(val) => setNewStudent(prev => ({ ...prev, currentCountry: val }))}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select host country..."
                      searchPlaceholder="Search countries..."
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT STUDENT DETAILS */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        title="Edit Student Profile Details"
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setIsEditStudentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditStudentSubmit} style={{ gap: '0.35rem', fontWeight: 700 }}>
              <Check size={15} /> Save Changes
            </button>
          </div>
        }
      >
        <form onSubmit={handleEditStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* SECTION 1: IDENTITY & CONTACT */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>1</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Identity &amp; Contact
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Full Student Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alice Johnson"
                  className="form-input"
                  required
                  value={editStudentData.name}
                  onChange={(e) => setEditStudentData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Institutional Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. alice@university.edu"
                  className="form-input"
                  required
                  value={editStudentData.email}
                  onChange={(e) => setEditStudentData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Student ID <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(Read-only)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={editStudentData.id}
                  style={{ height: '36px', fontSize: '0.82rem', backgroundColor: '#ffffff', opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Assigned Team / Group Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Alpha, Group Gamma"
                  className="form-input"
                  value={editStudentData.groupName}
                  onChange={(e) => setEditStudentData(prev => ({ ...prev, groupName: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Gender Segmented Control */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Gender Identity
              </label>
              <div style={{ display: 'flex', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '3px' }}>
                {GENDER_OPTIONS.map((g) => {
                  const isSel = editStudentData.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setEditStudentData(prev => ({ ...prev, gender: g.value }))}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.25rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSel ? 'var(--primary)' : 'transparent',
                        color: isSel ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: isSel ? 700 : 600,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: GEOGRAPHIC & STUDENT STATUS */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>2</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Geographic &amp; Diversity Status
              </span>
            </div>

            {/* Toggle Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: editStudentData.isInternational ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                  border: `1.5px solid ${editStudentData.isInternational ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={editStudentData.isInternational}
                  onChange={(e) => setEditStudentData(prev => ({
                    ...prev,
                    isInternational: e.target.checked,
                    currentCountry: (e.target.checked && prev.currentCountry === prev.nationality) ? '' : prev.currentCountry
                  }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <div>
                  <b style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block' }}>International Student</b>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Studying outside home country</span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: editStudentData.isExchange ? 'rgba(20, 184, 166, 0.08)' : '#ffffff',
                  border: `1.5px solid ${editStudentData.isExchange ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={editStudentData.isExchange}
                  onChange={(e) => setEditStudentData(prev => ({ ...prev, isExchange: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
                />
                <div>
                  <b style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Plane size={13} className="text-teal" /> Exchange / Erasmus
                  </b>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visiting / exchange semester</span>
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Nationality / Passport Country
                </label>
                <SearchableSelect
                  value={editStudentData.nationality || ''}
                  onChange={(val) => setEditStudentData(prev => ({
                    ...prev,
                    nationality: val,
                    currentCountry: (!prev.currentCountry && !prev.isInternational) ? val : prev.currentCountry
                  }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select nationality..."
                  searchPlaceholder="Search 195+ countries..."
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Current Country of Residence / Study
                </label>
                <SearchableSelect
                  value={editStudentData.currentCountry || ''}
                  onChange={(val) => setEditStudentData(prev => ({ ...prev, currentCountry: val }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select current country..."
                  searchPlaceholder="Search countries..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ACADEMIC BACKGROUND & LANGUAGE */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>3</div>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Academic Background &amp; Language
              </span>
            </div>

            {/* CEFR English Proficiency Level */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                CEFR English Proficiency Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.45rem' }}>
                {CEFR_LEVELS.map((cefr) => {
                  const isSel = editStudentData.englishProficiency === cefr.value;
                  return (
                    <div
                      key={cefr.value}
                      onClick={() => setEditStudentData(prev => ({ ...prev, englishProficiency: cefr.value }))}
                      style={{
                        padding: '0.55rem 0.65rem',
                        borderRadius: '7px',
                        backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                        border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isSel ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {cefr.code}
                        </span>
                        {isSel && <Check size={12} className="text-primary" />}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.2 }}>
                        {cefr.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Degree & Suggestions */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Degree / Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Mechanical Engineering, MBA"
                className="form-input"
                value={editStudentData.degree || ''}
                onChange={(e) => setEditStudentData(prev => ({ ...prev, degree: e.target.value }))}
                style={{ height: '36px', fontSize: '0.82rem', marginBottom: '0.35rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {DEGREE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setEditStudentData(prev => ({ ...prev, degree: item }))}
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: editStudentData.degree === item ? 'rgba(99, 102, 241, 0.12)' : '#ffffff',
                      color: editStudentData.degree === item ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* University Details: Regular vs Exchange */}
            {!editStudentData.isExchange ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  University / Institution Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University, TU Munich"
                  className="form-input"
                  value={editStudentData.university || ''}
                  onChange={(e) => setEditStudentData(prev => ({ ...prev, university: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.65rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Home Sending University (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sorbonne University, TU Munich"
                      className="form-input"
                      value={editStudentData.originalUniversity || ''}
                      onChange={(e) => setEditStudentData(prev => ({ ...prev, originalUniversity: e.target.value }))}
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Home Country <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <SearchableSelect
                      value={editStudentData.originalCountry || ''}
                      onChange={(val) => setEditStudentData(prev => ({ ...prev, originalCountry: val }))}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select home country..."
                      searchPlaceholder="Search countries..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Host / Destination University <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University, Oxford"
                      className="form-input"
                      value={editStudentData.currentUniversity || editStudentData.university || ''}
                      onChange={(e) => setEditStudentData(prev => ({ ...prev, currentUniversity: e.target.value }))}
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Host Destination Country
                    </label>
                    <SearchableSelect
                      value={editStudentData.currentCountry || ''}
                      onChange={(val) => setEditStudentData(prev => ({ ...prev, currentCountry: val }))}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select host country..."
                      searchPlaceholder="Search countries..."
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT EMAIL TEMPLATE */}
      <Modal
        isOpen={isEditTemplateModalOpen}
        onClose={() => setIsEditTemplateModalOpen(false)}
        title="Edit Email Template"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset the template to the professional default? Your current customizations will be overwritten.")) {
                  setCustomEmailSubject('Evaluation Invitation: Anonymous Peer Assessment - {{courseName}}');
                  setCustomEmailBody(`Dear {{studentName}},\n\nYour Professor has initiated the anonymous Peer-to-Peer grading session for the course {{courseName}}. Peer assessment is a vital component of this course, designed to ensure fair, objective, and collaborative feedback within your team.\n\nPlease use the secure, personal link below to evaluate your teammates on their contributions. Your feedback is completely confidential: teammates will only see aggregated group scores, and individual ratings are strictly anonymous.\n\nBest regards,\nYour Professor`);
                  addToast('Reset to professional default values!', 'success');
                }
              }}
              style={{ padding: '0.5rem 1rem' }}
            >
              Reset to Default
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditTemplateModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                setIsEditTemplateModalOpen(false);
                addToast('Custom email template saved successfully!', 'success');
              }}>Save Template</button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
            Customize the invitation email sent to students. You can use dynamic placeholders which will be automatically replaced for each student:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <code style={{ fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setCustomEmailSubject(p => p + ' {{courseName}}')} title="Click to append placeholder to subject">{"{{courseName}}"}</code>
            <code style={{ fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setCustomEmailBody(p => p + ' {{studentName}}')} title="Click to append placeholder to body">{"{{studentName}}"}</code>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Email Subject</label>
            <input
              type="text"
              className="form-input"
              value={customEmailSubject}
              onChange={(e) => setCustomEmailSubject(e.target.value)}
              placeholder="Enter subject line..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Email Body Content</label>
            <textarea
              className="form-input"
              value={customEmailBody}
              onChange={(e) => setCustomEmailBody(e.target.value)}
              rows={8}
              style={{ fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical', minHeight: '180px', lineHeight: 1.5 }}
              placeholder="Write your email body..."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: CREATE ADMIN PROFILE */}
      <Modal
        isOpen={isNewProfileModalOpen}
        onClose={() => setIsNewProfileModalOpen(false)}
        title="Create New Admin Profile"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsNewProfileModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (newProfileName.trim()) {
                  createAdminProfile(newProfileName.trim());
                  setNewProfileName('');
                  setIsNewProfileModalOpen(false);
                } else {
                  addToast('Profile name cannot be empty.', 'warning');
                }
              }}
            >
              Create & Switch
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Admin Profile Name / Title</label>
          <input
            type="text"
            placeholder="e.g. Prof. Miller, CS-102 Admin"
            className="form-input"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.45 }}>
            <b>Notice:</b> Workspace profiles are 100% free and offline-first! It creates an isolated sandbox environment inside your browser local storage. This profile will have its own private course list, student lists, evaluations, and grading settings, completely independent of all other profiles.
          </p>
        </div>
      </Modal>

      {/* MODAL: GLASSMORPHIC DYNAMIC CONFIRMATION DIALOG */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              {confirmModal.cancelText || 'Cancel'}
            </button>
            <button
              className="btn btn-rose"
              onClick={confirmModal.onConfirm}
            >
              {confirmModal.confirmText || 'Confirm'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--accent-rose-light)',
              color: 'var(--accent-rose)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 6px hsl(346, 84%, 97%)',
              marginBottom: '0.5rem'
            }}
          >
            <AlertCircle size={28} />
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {confirmModal.message}
          </p>
          <div style={{ width: '100%', backgroundColor: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'left', marginTop: '0.5rem' }}>
            <Info size={16} className="text-indigo" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              <b>Security Safeguard:</b> Actions are processed locally and replicated securely to your workspace configuration database.
            </span>
          </div>
        </div>
      </Modal>

      {/* MODAL: ROSTER ONBOARDING WIZARD */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          resetWizardState();
        }}
        title="Roster Onboarding Wizard"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsWizardOpen(false);
                resetWizardState();
              }}
            >
              Cancel
            </button>

            {wizardStep === 2 && (
              <>
                <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={handleWizardVerifyClick}>Verify Column Map</button>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <button className="btn btn-secondary" onClick={() => setWizardStep(2)}>Back</button>
                <button
                  className="btn btn-primary"
                  onClick={handleWizardFinalize}
                  disabled={Object.keys(wizardErrors).length > 0}
                  style={Object.keys(wizardErrors).length > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Import {wizardStudents.length} Members
                </button>
              </>
            )}
          </>
        }
      >
        <div className="wizard-stepper-header" style={{ marginBottom: '1.5rem' }}>
          <div className={`wizard-step-node ${wizardStep === 1 ? 'active' : 'completed'}`}>
            <div className="wizard-step-icon">1</div>
            <span>Upload or Paste</span>
          </div>
          <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem', minWidth: '20px' }} />
          <div className={`wizard-step-node ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''}`}>
            <div className="wizard-step-icon">2</div>
            <span>Schema Mapper</span>
          </div>
          <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem', minWidth: '20px' }} />
          <div className={`wizard-step-node ${wizardStep === 3 ? 'active' : ''}`}>
            <div className="wizard-step-icon">3</div>
            <span>Verification Grid</span>
          </div>
        </div>

        {wizardStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Format Guide (collapsible) ─────────────────────────────── */}
            <div className="format-guide-wrapper">
              <button
                type="button"
                className="format-guide-toggle"
                onClick={() => setShowFormatGuide(v => !v)}
              >
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>Format Guide &amp; Column Requirements</span>
                <span className={`format-guide-chevron ${showFormatGuide ? 'open' : ''}`}>▾</span>
              </button>

              {showFormatGuide && (
                <div className="format-guide-body">

                  {/* Required Columns Legend */}
                  <div className="format-guide-legend">
                    <div className="format-guide-legend-item required">
                      <span className="fgl-badge req">Required</span>
                      <span className="fgl-text">Full Name, Email</span>
                    </div>
                    <div className="format-guide-legend-item">
                      <span className="fgl-badge opt">Optional</span>
                      <span className="fgl-text">Student ID, Group / Team, University, Degree, Student Type</span>
                    </div>
                    <div className="format-guide-legend-item" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn btn-teal"
                        onClick={handleDownloadTemplate}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', gap: '0.35rem', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Download size={13} /> Download CSV Template
                      </button>
                    </div>
                  </div>

                  {/* Format tabs */}
                  <div className="format-guide-tabs">
                    {(['csv', 'xlsx', 'pdf', 'paste'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        className={`format-guide-tab ${formatGuideTab === tab ? 'active' : ''}`}
                        onClick={() => setFormatGuideTab(tab)}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {formatGuideTab === 'csv' && (
                    <div className="format-guide-panel">
                      <p className="fgp-desc">A plain-text file where each column is separated by a <strong>comma</strong>. The first row must be the header row. Save as <code>.csv</code> from Excel, Google Sheets, or any text editor.</p>
                      <div className="fgp-sample-label">Sample <code>roster.csv</code></div>
                      <pre className="fgp-code">{`Student ID,Full Name,Email,Group / Team,University,Degree,Student Type
101,Alice Johnson,alice.johnson@uni.edu,Team Alpha,MIT,Computer Science,Erasmus
102,Bob Martinez,bob.martinez@uni.edu,Team Beta,Stanford,Software Engineering,Normal
103,Carol Lee,carol.lee@uni.edu,Team Alpha,Oxford,Physics,Normal`}</pre>
                      <div className="fgp-tips">
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Header row is mandatory</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Column order doesn't matter — you'll map them in the next step</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Emails must be unique per student</span>
                      </div>
                    </div>
                  )}

                  {formatGuideTab === 'xlsx' && (
                    <div className="format-guide-panel">
                      <p className="fgp-desc">A native Microsoft Excel workbook (<code>.xlsx</code> or <code>.xls</code>). The system reads the <strong>first sheet</strong> automatically. Row 1 must contain column headers.</p>
                      <div className="fgp-sample-label">How to prepare your Excel file</div>
                      <div className="fgp-steps">
                        <div className="fgp-step"><span className="fgp-step-num">1</span><span>Open your class list in Microsoft Excel or Google Sheets.</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">2</span><span>Make sure <strong>Row 1</strong> contains column headers (e.g. Name, Email, Group).</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">3</span><span>Fill student data from <strong>Row 2</strong> downwards, one student per row.</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">4</span><span>Save as <em>Excel Workbook (.xlsx)</em> and upload the file.</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">5</span><span>Only the <strong>first sheet/tab</strong> is read — move your data there if needed.</span></div>
                      </div>
                      <div className="fgp-tips">
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Merged cells are not supported — unmerge before uploading</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Remove any empty rows at the top of the sheet</span>
                      </div>
                    </div>
                  )}

                  {formatGuideTab === 'pdf' && (
                    <div className="format-guide-panel">
                      <p className="fgp-desc">PDF tables are extracted using a text-layer scan. This works best when the PDF was <strong>exported from Excel / Google Sheets</strong> (not scanned from paper).</p>
                      <div className="fgp-sample-label">PDF compatibility tips</div>
                      <div className="fgp-steps">
                        <div className="fgp-step"><span className="fgp-step-num">1</span><span>Open your spreadsheet in Excel or Google Sheets.</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">2</span><span>Go to <strong>File → Export → PDF</strong> (or Print → Save as PDF).</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">3</span><span>Ensure the table is on a <strong>single page</strong> or consecutive pages (no page-break splits mid-row).</span></div>
                        <div className="fgp-step"><span className="fgp-step-num">4</span><span>Do NOT upload scanned images — text must be selectable in the PDF viewer.</span></div>
                      </div>
                      <div className="fgp-tips">
                        <span><AlertTriangle size={12} style={{ display: 'inline', color: 'var(--accent-amber)', marginRight: '4px' }} /> Scanned / image PDFs are not supported</span>
                        <span><AlertTriangle size={12} style={{ display: 'inline', color: 'var(--accent-amber)', marginRight: '4px' }} /> Password-protected PDFs cannot be read</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Best results: export directly from Excel or Google Sheets</span>
                      </div>
                    </div>
                  )}

                  {formatGuideTab === 'paste' && (
                    <div className="format-guide-panel">
                      <p className="fgp-desc">Select cells in <strong>Excel or Google Sheets</strong>, press <kbd>Ctrl+C</kbd>, then paste into the text area below. Column values will be tab-separated automatically.</p>
                      <div className="fgp-sample-label">What your clipboard paste should look like</div>
                      <pre className="fgp-code">{`101\tAlice Johnson\talice@uni.edu\tTeam Alpha
102\tBob Martinez\tbob@uni.edu\tTeam Beta
103\tCarol Lee\tcarol@uni.edu\tTeam Alpha`}</pre>
                      <div className="fgp-tips">
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> You can include or exclude a header row — you'll map columns in Step 2</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Works with both Excel and Google Sheets copy-paste</span>
                        <span><Check size={12} style={{ display: 'inline', color: 'var(--accent-teal)', marginRight: '4px' }} /> Each row = one student; columns separated by Tab</span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
            {/* ── End Format Guide ────────────────────────────────────────── */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginTop: '0.25rem' }}>
              {/* Option A: File Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Option A: Upload Roster File</span>
                <label className="csv-dropzone" style={{ minHeight: '170px', padding: '1.5rem' }}>
                  <Upload size={28} className="text-teal" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '0.35rem' }}>Select Spreadsheet / PDF</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Accepts XLSX, XLS, PDF, or CSV formats</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={handleWizardFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Option B: Direct Paste Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Option B: Paste Spreadsheet Cells</span>
                <textarea
                  className="wizard-paste-area"
                  placeholder={`Paste columns from Excel or Google Sheets here...\ne.g.\n101\tAlice\talice@univ.edu\tTeam A\n102\tBob\tbob@univ.edu\tTeam B`}
                  value={wizardPasteText}
                  onChange={(e) => setWizardPasteText(e.target.value)}
                  style={{ minHeight: '115px', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={handleWizardPasteSubmit}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                >
                  Parse Clipboard Data
                </button>
              </div>

              {/* Option C: Pre-built Diverse Sample Dataset */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Option C: Demo Sample Dataset</span>
                <div style={{ minHeight: '170px', padding: '1.25rem', border: '1px dashed var(--accent-teal)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(20, 184, 166, 0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-teal)', fontWeight: 800, fontSize: '0.88rem' }}>
                      <Sparkles size={16} /> 100 Diverse Students
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                      Pre-generated diverse dataset with 35+ nationalities, gender balance, and English levels.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const csv = getSampleStudentsCSV();
                        const parsed = parseRawPastedText(csv);
                        if (parsed.length > 0) {
                          setWizardFileName('diverse_100_students_sample.csv');
                          handleParsedRawMatrix(parsed);
                          addToast('Loaded 100-student diverse sample dataset into wizard!', 'success');
                        }
                      }}
                      style={{ fontSize: '0.78rem', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Sparkles size={13} /> Load Sample into Wizard
                    </button>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          downloadSampleStudentsFile('xlsx');
                          addToast('Downloaded sample spreadsheet template (.xlsx)!', 'success');
                        }}
                        style={{ flex: 1, fontSize: '0.74rem', padding: '0.35rem 0.4rem', justifyContent: 'center', gap: '0.3rem' }}
                        title="Download sample student spreadsheet (.xlsx)"
                      >
                        <Download size={12} className="text-teal" /> Excel Template
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          downloadSampleStudentsFile('csv');
                          addToast('Downloaded sample CSV template (.csv)!', 'success');
                        }}
                        style={{ flex: 1, fontSize: '0.74rem', padding: '0.35rem 0.4rem', justifyContent: 'center', gap: '0.3rem' }}
                        title="Download sample CSV file (.csv)"
                      >
                        <Download size={12} className="text-indigo" /> CSV Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                File parsed: <b>{wizardFileName}</b> ({wizardRawData.length - 1} rows found). Match standard roster fields to the columns of your file:
              </p>
              <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                {wizardHeaders.length} Columns Detected
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                Profile Fields Mapping
              </div>

              {[
                { key: 'name', label: 'Full Name', required: true, hint: 'Student legal or display name' },
                { key: 'email', label: 'Email Address', required: true, hint: 'University or personal email' },
                { key: 'gender', label: 'Gender', required: true, hint: 'Female, Male, Non-binary, etc.' },
                { key: 'nationality', label: 'Nationality / Country', required: true, hint: 'Country of origin' },
                { key: 'englishProficiency', label: 'English Proficiency Level', required: true, hint: 'CEFR skill level (C1, B2, etc.)' },
                { key: 'id', label: 'Unique Student ID', required: false, hint: 'Auto-generated if unmapped' },
                { key: 'groupName', label: 'Roster Group / Team', required: false, hint: 'Default: Unassigned' },
                { key: 'university', label: 'University / School', required: false, hint: 'Institution name' },
                { key: 'degree', label: 'Degree / Program', required: false, hint: 'Field of study / major' },
                { key: 'studentType', label: 'Student Type', required: false, hint: 'Normal or Erasmus' }
              ].map(({ key, label, required, hint }) => (
                <div key={key} className="schema-mapping-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {label} {required && <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</span>
                  </div>
                  <select
                    className="form-select"
                    value={wizardMapping[key]}
                    onChange={(e) => setWizardMapping(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 2rem 0.4rem 0.75rem', height: 'auto', border: '1px solid var(--border-color)', maxWidth: '300px', width: '100%' }}
                  >
                    <option value="-1">-- Unmapped / Skip --</option>
                    {wizardHeaders.map((headerText, hIdx) => {
                      const sampleVal = wizardRawData[1] && wizardRawData[1][hIdx] ? wizardRawData[1][hIdx] : '';
                      const sampleSnippet = sampleVal ? ` (e.g. "${sampleVal.length > 18 ? sampleVal.slice(0, 18) + '...' : sampleVal}")` : '';
                      return (
                        <option key={hIdx} value={hIdx}>Col {hIdx + 1}: {headerText}{sampleSnippet}</option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Review, verify, or edit parsed participant records. Errors are highlighted in red.
              </p>
              <button
                type="button"
                className="btn btn-teal btn-sm"
                onClick={handleWizardAddRow}
                style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
              >
                <Plus size={12} /> Add Participant
              </button>
            </div>

            <div className="verify-grid-container">
              <table className="verify-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Student ID</th>
                    <th>Student Name *</th>
                    <th>Email ID *</th>
                    <th style={{ width: '110px' }}>Gender *</th>
                    <th>Nationality *</th>
                    <th style={{ width: '130px' }}>English Level *</th>
                    <th>University</th>
                    <th>Degree</th>
                    <th style={{ width: '100px' }}>Type</th>
                    <th style={{ width: '110px' }}>Roster Group</th>
                    <th style={{ width: '40px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wizardStudents.map((studentItem, idx) => {
                    const rowErrs = wizardErrors[idx] || [];
                    const hasIdErr = rowErrs.some(e => e.includes('ID'));
                    const hasNameErr = rowErrs.some(e => e.includes('Name'));
                    const hasEmailErr = rowErrs.some(e => e.includes('email') || e.includes('Email'));

                    return (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            className={`verify-input ${hasIdErr ? 'cell-error' : ''}`}
                            value={studentItem.id}
                            title={rowErrs.find(e => e.includes('ID'))}
                            onChange={(e) => handleWizardCellChange(idx, 'id', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`verify-input ${hasNameErr ? 'cell-error' : ''}`}
                            value={studentItem.name}
                            title={rowErrs.find(e => e.includes('Name'))}
                            onChange={(e) => handleWizardCellChange(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`verify-input ${hasEmailErr ? 'cell-error' : ''}`}
                            value={studentItem.email}
                            title={rowErrs.find(e => e.includes('email') || e.includes('Email'))}
                            onChange={(e) => handleWizardCellChange(idx, 'email', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="verify-input"
                            value={studentItem.gender || 'Female'}
                            onChange={(e) => handleWizardCellChange(idx, 'gender', e.target.value)}
                            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem' }}
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="verify-input"
                            value={studentItem.nationality || ''}
                            placeholder="e.g. Germany"
                            onChange={(e) => handleWizardCellChange(idx, 'nationality', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="verify-input"
                            value={studentItem.englishProficiency || 'Fluent (C1/C2)'}
                            onChange={(e) => handleWizardCellChange(idx, 'englishProficiency', e.target.value)}
                            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem' }}
                          >
                            <option value="Native / Bilingual">Native / Bilingual</option>
                            <option value="Fluent (C1/C2)">Fluent (C1/C2)</option>
                            <option value="Advanced (B2)">Advanced (B2)</option>
                            <option value="Intermediate (B1)">Intermediate (B1)</option>
                            <option value="Basic (A1/A2)">Basic (A1/A2)</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="verify-input"
                            value={studentItem.university || ''}
                            onChange={(e) => handleWizardCellChange(idx, 'university', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="verify-input"
                            value={studentItem.degree || ''}
                            onChange={(e) => handleWizardCellChange(idx, 'degree', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="verify-input"
                            value={studentItem.studentType || 'Normal'}
                            onChange={(e) => handleWizardCellChange(idx, 'studentType', e.target.value)}
                            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem' }}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Erasmus">Erasmus</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="verify-input"
                            value={studentItem.groupName}
                            onChange={(e) => handleWizardCellChange(idx, 'groupName', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-rose btn-sm"
                            onClick={() => handleWizardRemoveRow(idx)}
                            style={{ padding: '0.2rem', minWidth: 'auto', background: 'transparent', color: 'var(--accent-rose)', border: 'none', cursor: 'pointer' }}
                            title="Delete Row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {Object.keys(wizardErrors).length > 0 && (
              <div className="alert-banner-rose" style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0 0 0', padding: '0.75rem 1rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div style={{ fontSize: '0.78rem' }}>
                  <b>Roster Verification Warnings:</b> Found {Object.keys(wizardErrors).length} rows with validation errors. Hover over red input boxes to view specific warnings and correct them.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: INTERACTIVE VISUAL PERFORMANCE REPORT */}
      <Modal
        isOpen={selectedStudentReport !== null}
        onClose={() => setSelectedStudentReport(null)}
        title={`Student Performance Report: ${selectedStudentReport?.name || ''}`}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: '1rem' }} className="hide-on-print">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedStudentReport(null)}
            >
              Close Report
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={14} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        }
      >
        {selectedStudentReport && (() => {
          const s = selectedStudentReport;
          const metrics = calculateStudentMetrics(s, activeClass);

          // Compile teammates
          const teammates = activeClass.students.filter(
            (stud) => stud.groupName === s.groupName && stud.id !== s.id
          );
          const teammateIds = teammates.map(t => t.id);

          // Get peer and self reviews
          const receivedReviews = activeClass.reviews.filter(
            (r) => r.recipientId === s.id && teammateIds.includes(r.reviewerId)
          );

          const selfReview = activeClass.reviews.find(
            (r) => r.reviewerId === s.id && r.recipientId === s.id
          );
          const selfScores = selfReview ? selfReview.scores : {};

          // Calculate praise tags
          const tagCounts: Record<string, number> = {};
          receivedReviews.forEach((r) => {
            if (Array.isArray(r.praiseTags)) {
              r.praiseTags.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
          const tagEntries = Object.entries(tagCounts);

          const { ratio, adjustedGrade, teamBaseGrade } = calculateStudentWebPAScore(
            s.id,
            s.groupName,
            activeClass,
            baseGroupGrade,
            fudgeWeight
          );

          const maxScale = getTargetScale(activeClass);
          const scaledScoreVal = metrics.overallPercentage !== null
            ? ((metrics.overallPercentage / 100) * maxScale).toFixed(1)
            : 'N/A';

          const activeTier = getTierInfo(metrics.overallPercentage ?? 0);
          const TierIcon = activeTier.icon;

          return (
            <div id="print-report-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '0.5rem' }}>
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  html, body {
                    overflow: visible !important;
                    height: auto !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #print-report-modal, #print-report-modal * {
                    visibility: visible !important;
                  }
                  #print-report-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 1.2cm !important;
                    box-shadow: none !important;
                    border: none !important;
                    background: white !important;
                    color: black !important;
                  }
                  .hide-on-print {
                    display: none !important;
                  }
                  .modal-overlay {
                    background: white !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                    display: block !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .modal-content {
                    box-shadow: none !important;
                    border: none !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                    overflow: visible !important;
                    height: auto !important;
                  }
                  .modal-header, .modal-footer {
                    display: none !important;
                  }
                  .card, .card-premium {
                    border: 1px solid #cbd5e1 !important;
                    box-shadow: none !important;
                    background: white !important;
                    page-break-inside: avoid;
                    margin-bottom: 1rem !important;
                  }
                  .table-container {
                    overflow: visible !important;
                    overflow-x: visible !important;
                    width: 100% !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .custom-table {
                    border: 1px solid #cbd5e1 !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: auto !important;
                    white-space: normal !important;
                  }
                  .custom-table th, .custom-table td {
                    border: 1px solid #cbd5e1 !important;
                    padding: 6px 8px !important;
                    font-size: 0.8rem !important;
                    white-space: normal !important;
                    word-break: break-word !important;
                  }
                }
              ` }} />

              {/* Student Header Summary */}
              <div className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{s.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0.5rem 0' }}>{s.email}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {s.university && (
                      <span className="badge badge-primary" style={{ gap: '0.25rem' }}>
                        <BookOpen size={11} /> {s.university}
                      </span>
                    )}
                    {s.degree && (
                      <span className="badge badge-teal" style={{ gap: '0.25rem' }}>
                        <Sliders size={11} /> {s.degree}
                      </span>
                    )}
                    <span className="badge badge-secondary">{s.studentType || 'Normal'}</span>
                    <span className="badge badge-primary">Group: {s.groupName}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>WebPA Ratio: <b className="text-primary">{metrics.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : '—'}</b></span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Calibrated Grade: <b className="text-teal">{metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${teamBaseGrade}` : '—'}</b></span>
                </div>
              </div>

              {/* Analytics Core Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                {/* Left Panel: Circular Dial and Praise Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Rating Dial */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Overall Teammate Rating</h3>

                    <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '1rem' }}>
                      <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="75"
                          cy="75"
                          r="50"
                          stroke="var(--border-color)"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="75"
                          cy="75"
                          r="50"
                          stroke={activeTier.color}
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray="314.16"
                          strokeDashoffset={314.16 - (314.16 * (metrics.overallPercentage ?? 0)) / 100}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                          {metrics.overallPercentage !== null ? `${metrics.overallPercentage}%` : 'N/A'}
                        </span>
                        {metrics.overallPercentage !== null && (
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-teal)', marginTop: '0.2rem' }}>
                            {scaledScoreVal} / {maxScale}
                          </span>
                        )}
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem', letterSpacing: '0.025em' }}>
                          Peer Average
                        </span>
                      </div>
                    </div>

                    <div className={`gamified-card ${activeTier.className}`} style={{ width: '100%', padding: '1rem', borderWidth: '2px', cursor: 'default', transform: 'none', boxShadow: 'none' }}>
                      <div className="gamified-card-icon" style={{ backgroundColor: activeTier.color, color: '#fff', width: '28px', height: '28px', padding: '5px', borderRadius: '50%', margin: '0 auto 0.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TierIcon size={14} />
                      </div>
                      <span className="gamified-card-title" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeTier.title}</span>
                      <p className="gamified-card-desc" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.3 }}>{activeTier.desc}</p>
                    </div>
                  </div>

                  {/* Praise Badges Cloud */}
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={16} className="text-teal" /> Teammate Praise Badges
                    </h3>
                    {tagEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        No praise tags selected by teammates.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {tagEntries.map(([tagText, count]) => {
                          const tagInfo = getPraiseTagInfo(tagText);
                          const TagIcon = tagInfo.icon;
                          return (
                            <span
                              key={tagText}
                              className="praise-badge-pill"
                              style={{
                                backgroundColor: tagInfo.bg,
                                color: tagInfo.color,
                                borderColor: tagInfo.border,
                                padding: '0.3rem 0.5rem',
                                fontSize: '0.7rem'
                              }}
                            >
                              <TagIcon size={11} />
                              <span>{tagInfo.text}</span>
                              <span style={{ opacity: 0.8, marginLeft: '0.2rem', fontWeight: 700 }}>x{count}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Panel: Calibration comparison bars */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BarChart2 size={16} className="text-teal" /> Self vs. Peer Calibration
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Side-by-side view comparing <b style={{ color: 'var(--primary)' }}>Teammate Average</b> and <b style={{ color: 'var(--accent-teal)' }}>Self Ratings</b>. Use this to check for inflation/deflation calibration alignment!
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeClass.fields.map(field => {
                      const fieldAvg = metrics.fieldAverages[field.id] ?? field.min;
                      const selfVal = selfScores[field.id] ?? field.min;

                      const peerPct = ((fieldAvg - field.min) / (field.max - field.min || 1)) * 100;
                      const selfPct = ((selfVal - field.min) / (field.max - field.min || 1)) * 100;

                      return (
                        <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{field.name}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', backgroundColor: 'var(--bg-app)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>

                            {/* Teammates */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Teammates:</span>
                              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${peerPct}%`, backgroundColor: 'var(--primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', width: '35px', textAlign: 'right' }}>{fieldAvg.toFixed(1)}</span>
                            </div>

                            {/* Self */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>Self Rating:</span>
                              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${selfPct}%`, backgroundColor: 'var(--accent-teal)' }} />
                              </div>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-teal)', width: '35px', textAlign: 'right' }}>{selfVal.toFixed(1)}</span>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Written Comments Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>

                {/* Strengths Comments */}
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-teal)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={16} className="text-teal" /> Teammate Strengths Feedback
                  </h3>
                  {receivedReviews.filter(r => r.strengthsText).length === 0 ? (
                    <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      No written strengths comments received.
                    </div>
                  ) : (
                    <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {receivedReviews.filter(r => r.strengthsText).map((r, i) => (
                        <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
                          "{r.strengthsText}"
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Growth Comments */}
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-rose)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <TrendingUp size={16} className="text-rose" /> Opportunities for Growth
                  </h3>
                  {receivedReviews.filter(r => r.growthText).length === 0 ? (
                    <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      No written constructive suggestions received.
                    </div>
                  ) : (
                    <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {receivedReviews.filter(r => r.growthText).map((r, i) => (
                        <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
                          "{r.growthText}"
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

            </div>
          );
        })()}
      </Modal>

      {/* MODAL: IN-DEPTH TEAM ASSESSMENT ANALYSIS */}
      <Modal
        isOpen={selectedTeamAnalysis !== null}
        onClose={() => setSelectedTeamAnalysis(null)}
        title={`Team Evaluation Analysis & Audit: ${selectedTeamAnalysis || ''}`}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: '1rem' }} className="hide-on-print">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedTeamAnalysis(null)}
            >
              Close Analysis
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={14} />
              <span>Print Team Dossier</span>
            </button>
          </div>
        }
      >
        {selectedTeamAnalysis && (() => {
          const teamName = selectedTeamAnalysis;
          const teamStudents = activeClass.students.filter(s => s.groupName === teamName);

          return (
            <div id="print-team-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', padding: '0.5rem' }}>
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  html, body {
                    overflow: visible !important;
                    height: auto !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #print-team-modal, #print-team-modal * {
                    visibility: visible !important;
                  }
                  #print-team-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 1.2cm !important;
                    box-shadow: none !important;
                    border: none !important;
                    background: white !important;
                    color: black !important;
                  }
                  .hide-on-print {
                    display: none !important;
                  }
                  .modal-overlay {
                    background: white !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                    display: block !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .modal-content {
                    box-shadow: none !important;
                    border: none !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                    overflow: visible !important;
                    height: auto !important;
                  }
                  .modal-header, .modal-footer {
                    display: none !important;
                  }
                  .card, .card-premium {
                    border: 1px solid #cbd5e1 !important;
                    box-shadow: none !important;
                    background: white !important;
                    page-break-inside: avoid;
                    margin-bottom: 1.25rem !important;
                  }
                  .table-container {
                    overflow: visible !important;
                    overflow-x: visible !important;
                    width: 100% !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .custom-table {
                    border: 1px solid #cbd5e1 !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                    table-layout: auto !important;
                    white-space: normal !important;
                  }
                  .custom-table th, .custom-table td {
                    border: 1px solid #cbd5e1 !important;
                    padding: 6px 8px !important;
                    font-size: 0.8rem !important;
                    white-space: normal !important;
                    word-break: break-word !important;
                  }
                }
              ` }} />

              {/* Roster & Progress Overview */}
              <div className="card-premium">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={20} className="text-teal" /> Team Roster & Submission Status
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Team Project Base Mark: <b style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{activeClass?.teamBaseGrades?.[radarTeamFilter] ?? baseGroupGrade}</b>
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsTeamBaseGradesModalOpen(true)}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', gap: '0.3rem' }}
                    >
                      <Sliders size={11} /> Edit Base Mark
                    </button>
                  </div>
                </div>
                <div className="table-container">
                  <table className="custom-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Email</th>
                        <th>Submission Status</th>
                        <th>Peer Reviews Received</th>
                        <th>Peer Average</th>
                        <th>WebPA Ratio</th>
                        <th>Calibrated Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStudents.map(ts => {
                        const m = calculateStudentMetrics(ts, activeClass);
                        const { ratio, adjustedGrade, teamBaseGrade } = calculateStudentWebPAScore(ts.id, ts.groupName, activeClass, baseGroupGrade, fudgeWeight);
                        return (
                          <tr key={ts.id}>
                            <td style={{ fontWeight: 600 }}>{ts.name}</td>
                            <td>{ts.email}</td>
                            <td>
                              {ts.submitted ? (
                                <span className="badge badge-teal" style={{ gap: '0.2rem', padding: '0.25rem 0.5rem' }}><CheckCircle size={10} /> Completed</span>
                              ) : (
                                <span className="badge badge-amber" style={{ gap: '0.2rem', padding: '0.25rem 0.5rem' }}><Clock size={10} /> Pending</span>
                              )}
                            </td>
                            <td>{m.reviewsReceived} / {m.expectedReviewsCount}</td>
                            <td style={{ fontWeight: 700 }}>{m.overallPercentage !== null ? `${m.overallPercentage}%` : 'N/A'}</td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : '—'}</td>
                            <td style={{ fontWeight: 800, color: adjustedGrade < (teamBaseGrade * 0.7) ? 'var(--accent-rose)' : 'hsl(142, 70%, 35%)' }}>
                              {m.reviewsReceived > 0 ? `${adjustedGrade} / ${teamBaseGrade}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Team Contribution Comparison Chart */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart2 size={18} className="text-teal" /> Team Contribution Comparison
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  Contrasting peer averages received by each team member. Ideal contribution levels represent equal balance across all team players.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {teamStudents.map(ts => {
                    const m = calculateStudentMetrics(ts, activeClass);
                    const peerPct = m.overallPercentage ?? 0;
                    return (
                      <div key={ts.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {ts.name}
                        </span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${peerPct}%`,
                              backgroundColor: peerPct >= 80 ? 'var(--accent-teal)' : peerPct >= 50 ? 'var(--primary)' : 'var(--accent-rose)',
                              borderRadius: '9999px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', width: '50px', textAlign: 'right', flexShrink: 0 }}>
                          {peerPct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Cross-Grid Matrix (Who Rated Whom Audit Matrix) - Only rendered if enabled */}
              {featureToggles.showDetailedReviewMatrix && (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sliders size={18} className="text-teal" /> Who Rated Whom: Evaluation Audit Matrix
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.4 }}>
                        Select a specific rubric metric to inspect individual raw ratings. Rows represent **Reviewers** and columns represent **Recipients**.
                      </p>
                    </div>
                    <div className="hide-on-print" style={{ minWidth: '180px' }}>
                      <select
                        className="form-input"
                        value={activeAuditMetric}
                        onChange={(e) => setActiveAuditMetric(e.target.value)}
                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.82rem', width: '100%' }}
                      >
                        <option value="overall">Overall Averages (%)</option>
                        {activeClass.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="custom-table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', backgroundColor: 'var(--bg-app)' }}>Reviewer \ Recipient</th>
                          {teamStudents.map(ts => (
                            <th key={ts.id} style={{ backgroundColor: 'var(--bg-app)' }}>{ts.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teamStudents.map(reviewer => {
                          return (
                            <tr key={reviewer.id}>
                              <td style={{ fontWeight: 700, textAlign: 'left', backgroundColor: 'var(--bg-app)' }}>{reviewer.name}</td>
                              {teamStudents.map(recipient => {
                                // Find evaluation
                                const review = activeClass.reviews.find(r => r.reviewerId === reviewer.id && r.recipientId === recipient.id);
                                const isSelf = reviewer.id === recipient.id;

                                let cellText = '—';
                                if (review) {
                                  if (activeAuditMetric === 'overall') {
                                    // Compute overall percentage of this review
                                    let sum = 0, max = 0;
                                    activeClass.fields.forEach(f => {
                                      sum += review.scores[f.id] ?? 0;
                                      max += f.max;
                                    });
                                    cellText = max > 0 ? `${((sum / max) * 100).toFixed(0)}%` : '—';
                                  } else {
                                    // Single field score
                                    const score = review.scores[activeAuditMetric];
                                    const fieldObj = activeClass.fields.find(f => f.id === activeAuditMetric);
                                    cellText = score !== undefined && fieldObj ? `${score} / ${fieldObj.max}` : '—';
                                  }
                                }

                                return (
                                  <td
                                    key={recipient.id}
                                    style={{
                                      fontWeight: 600,
                                      backgroundColor: isSelf ? 'hsla(173, 80%, 50%, 0.05)' : 'transparent',
                                      border: isSelf ? '1.5px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                                      color: isSelf ? 'var(--accent-teal)' : 'var(--text-primary)',
                                      position: 'relative',
                                      padding: '0.75rem 1rem'
                                    }}
                                  >
                                    <div className="tooltip-container" style={{ display: 'inline-block', width: '100%', height: '100%' }}>
                                      <span>{cellText}</span>
                                      <span className="tooltip-text">
                                        {isSelf ? 'Self Evaluation Rating' : `${reviewer.name} rated ${recipient.name}`}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detailed Peer Evaluations Card Feed */}
              {featureToggles.showTeammateAuditLog && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={20} className="text-indigo" /> Teammate Evaluation Audit Log
                  </h3>

                {teamStudents.map(reviewer => {
                  // Get all reviews written by this reviewer
                  const written = activeClass.reviews.filter(r => r.reviewerId === reviewer.id);

                  return (
                    <div
                      key={reviewer.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        borderLeft: '4px solid var(--primary)',
                        backgroundColor: 'var(--bg-surface)',
                        pageBreakInside: 'avoid'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Evaluations Written by: {reviewer.name}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Email: {reviewer.email} • Status: {reviewer.submitted ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                        <span className="badge badge-primary">
                          {written.length} review(s) logged
                        </span>
                      </div>

                      {written.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          This student has not submitted any evaluations yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {written.map(rev => {
                            const recipient = activeClass.students.find(s => s.id === rev.recipientId);
                            if (!recipient) return null;
                            const isSelfEval = reviewer.id === recipient.id;

                            // Calculate peer review percentage
                            let rSum = 0, rMax = 0;
                            activeClass.fields.forEach(f => {
                              rSum += rev.scores[f.id] ?? 0;
                              rMax += f.max;
                            });
                            const scorePct = rMax > 0 ? ((rSum / rMax) * 100).toFixed(0) : 0;

                            return (
                              <div
                                key={rev.recipientId}
                                style={{
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '1rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelfEval ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                                    {isSelfEval ? 'Self Assessment Evaluation' : `Target: ${recipient.name}`}
                                  </span>
                                  <span className="badge" style={{ backgroundColor: isSelfEval ? 'var(--accent-teal-light)' : 'var(--primary-light)', color: isSelfEval ? 'var(--accent-teal)' : 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                                    Review Score: {scorePct}% ({rSum} / {rMax})
                                  </span>
                                </div>

                                {/* Metric list */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                  {activeClass.fields.map(f => (
                                    <span key={f.id} style={{ color: 'var(--text-secondary)' }}>
                                      {f.name}: <b style={{ color: 'var(--text-primary)' }}>{rev.scores[f.id] ?? 'N/A'} / {f.max}</b>
                                    </span>
                                  ))}
                                </div>

                                {/* Praise tags if any */}
                                {Array.isArray(rev.praiseTags) && rev.praiseTags.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                    {rev.praiseTags.map(tagText => {
                                      const tagInfo = getPraiseTagInfo(tagText);
                                      const TagIcon = tagInfo.icon;
                                      return (
                                        <span
                                          key={tagText}
                                          className="praise-badge-pill"
                                          style={{
                                            backgroundColor: tagInfo.bg,
                                            color: tagInfo.color,
                                            borderColor: tagInfo.border,
                                            padding: '0.15rem 0.4rem',
                                            fontSize: '0.68rem'
                                          }}
                                        >
                                          <TagIcon size={9} />
                                          <span>{tagInfo.text}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Written Text Feed */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', lineHeight: 1.4 }}>
                                  {rev.strengthsText && (
                                    <div>
                                      <b className="text-teal">Strengths Comment:</b>
                                      <p style={{ margin: '0.1rem 0 0 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{rev.strengthsText}"</p>
                                    </div>
                                  )}
                                  {rev.growthText && (
                                    <div style={{ marginTop: '0.2rem' }}>
                                      <b className="text-rose">Growth Comment:</b>
                                      <p style={{ margin: '0.1rem 0 0 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{rev.growthText}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          );
        })()}
      </Modal>

      {/* MODAL: CLASS QR CODE & SELF-ENROLLMENT */}
      <ClassQRCodeModal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        classNameTitle={activeClass.name}
        enrollUrl={getClassEnrollmentUrl(activeClass.id)}
        enrolledCount={activeClass.students.length}
      />

      {/* MODAL: INTELLIGENT AUTO-GROUP DIVERSITY STUDIO */}
      <AutoGroupModal
        isOpen={isAutoGroupModalOpen}
        onClose={() => setIsAutoGroupModalOpen(false)}
        students={activeClass.students}
        onApplyGroups={(updatedStudents) => {
          importRoster(activeClass.id, updatedStudents, true);
          const uniqueTeamCount = new Set(updatedStudents.map(s => s.groupName)).size;
          addToast(`Successfully organized ${updatedStudents.length} students into ${uniqueTeamCount} balanced, diverse teams!`, 'success');
        }}
      />

      {/* MODAL: INDIVIDUAL STUDENT PDF REPORT CARDS & PREVIEWS */}
      <StudentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialStudentId={selectedReportStudentId}
        classData={activeClass}
        onToast={addToast}
      />

      {/* MODAL: LIVE CLASSROOM PROJECTOR / PRESENTATION MODE */}
      {isProjectorModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'var(--bg-app)', overflowY: 'auto' }}>
          <ProjectorView
            classData={activeClass}
            onClose={() => setIsProjectorModalOpen(false)}
            isStandalone={false}
          />
        </div>,
        document.body
      )}

      {/* MODAL: FAST LINK DISPATCHER & BULK ROSTER LINKS */}
      <LinkDispatcherModal
        isOpen={isLinkDispatcherOpen}
        onClose={() => setIsLinkDispatcherOpen(false)}
        classData={activeClass}
        onToast={addToast}
      />

      {/* MODAL: UNIFIED SETTINGS HUB (EMAIL, CLOUD, SHORTCUTS & PREFERENCES) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab={settingsInitialTab}
        shortcuts={shortcuts}
        onUpdateShortcuts={handleUpdateShortcuts}
        onResetShortcuts={handleResetShortcuts}
        showChecklist={showOnboardingChecklist}
        onToggleChecklist={(show) => setShowOnboardingChecklist(show)}
      />

      {/* MODAL: QUICK COMMAND PALETTE & FINDER (CTRL/CMD + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        classData={activeClass}
        featureToggles={featureToggles}
        onToggleFeature={(key, value) => {
          const updated = { ...featureToggles, [key]: value };
          saveFeatureToggles(updated);
        }}
        onApplyMode={(mode) => {
          if (mode === 'minimal') saveFeatureToggles(MINIMAL_FEATURE_TOGGLES);
          else if (mode === 'full') saveFeatureToggles(FULL_FEATURE_TOGGLES);
          else saveFeatureToggles(DEFAULT_FEATURE_TOGGLES);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenProjector={() => setIsProjectorModalOpen(true)}
        onOpenDispatcher={() => setIsLinkDispatcherOpen(true)}
        onOpenSettings={(tab) => {
          if (tab) setSettingsInitialTab(tab);
          setIsSettingsModalOpen(true);
        }}
        onOpenShortcuts={() => {
          setSettingsInitialTab('shortcuts');
          setIsSettingsModalOpen(true);
        }}
        onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
        onOpenReportModal={(studentId) => openReportModal(studentId)}
        onExportExcel={handleExportExcel}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenGuideCenter={(tab) => openGuideCenter(tab || 'system')}
        onSelectTeamFilter={(teamName) => {
          setGroupFilter(teamName);
          setSearchTerm('');
        }}
        onSetFilter={({ group, search, duplicatesOnly }) => {
          if (group !== undefined) setGroupFilter(group);
          if (search !== undefined) setSearchTerm(search);
          if (duplicatesOnly !== undefined) setShowOnlyDuplicates(duplicatesOnly);
        }}
        onApplyRubricPreset={(presetId) => {
          handleApplyPreset(presetId);
          setActiveTab('grading');
        }}
        onSetTargetScale={(scale) => {
          if (activeClass) {
            updateGradingConfig(activeClass.id, activeClass.fields, scale);
            addToast(`Target Scale set to ${scale === 0 ? 'Raw Sum' : `Out of ${scale}`}`, 'success');
          }
        }}
        onSetFudgeWeight={(weight) => {
          setFudgeWeight(weight);
          localStorage.setItem('peer_fudge_weight', String(weight));
          addToast(`WebPA Calibrator set to ${Math.round(weight * 100)}% fudge weight`, 'success');
        }}
        onExportLMS={(platform) => {
          if (activeClass) {
            try {
              exportLMSGradebook(platform, activeClass, 'calibrated');
              addToast(`Exported ${platform.toUpperCase()} gradebook successfully!`, 'success');
            } catch (e) {
              addToast('Failed to export LMS gradebook', 'error');
            }
          }
        }}
        onExportResultsCSV={() => {
          if (activeClass) {
            try {
              const csv = generateResultsCSV(activeClass);
              downloadFileContent(csv, `${activeClass.name.replace(/\s+/g, '_')}_grades.csv`);
              addToast('Results summary CSV downloaded successfully!', 'success');
            } catch (e) {
              addToast('Failed to export CSV results', 'error');
            }
          }
        }}
        onExportPDFSummary={() => {
          if (activeClass && activeClass.students.length > 0) {
            try {
              downloadStudentReportPDF(activeClass.students[0], activeClass);
              addToast('Downloaded evaluation report PDF successfully!', 'success');
            } catch (e) {
              addToast('Failed to generate PDF report', 'error');
            }
          } else {
            addToast('No students enrolled to export PDF report', 'warning');
          }
        }}
        onToast={addToast}
        onOpenNewClass={() => setIsNewClassModalOpen(true)}
        onOpenImportWizard={() => setIsWizardOpen(true)}
        onOpenAutoGroup={() => setIsAutoGroupModalOpen(true)}
        onOpenQRCode={() => setIsQRCodeModalOpen(true)}
        onOpenDeadline={() => {
          setActiveTab('automation');
          addToast('Navigated to Milestone & Deadline controls', 'info');
        }}
        onResetSubmissions={() => {
          triggerConfirm(
            'Reset All Peer Evaluations',
            'Are you sure you want to wipe all submitted peer reviews for this classroom? This will reset all student review statuses to pending. This action cannot be undone.',
            () => resetClassReviews(activeClass.id),
            'Reset Submissions',
            'Cancel'
          );
        }}
      />

      {/* ACADEMIC GUIDANCE & INTERACTIVE TUTORIAL CENTER */}
      <GuideCenterModal
        isOpen={isGuideCenterOpen}
        onClose={() => setIsGuideCenterOpen(false)}
        onStartTour={handleStartTour}
        initialTab={guideCenterInitialTab}
      />

      {/* INTERACTIVE STEP-BY-STEP PRODUCT WALKTHROUGH & SPOTLIGHT TOUR */}
      <InteractiveTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setCustomTourStepIds(null);
          handleRestoreTourSnapshot();
        }}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        activeTab={activeTab}
        customStepIds={customTourStepIds}
        onRestoreSnapshot={handleRestoreTourSnapshot}
        hasSnapshot={!!tourSnapshot}
        onExecuteDemoStep={handleExecuteTourDemoStep}
        featureToggles={featureToggles}
      />

      {/* INTERACTIVE STUDENT SMARTPHONE PORTAL SIMULATOR */}
      <StudentPortalPreviewModal
        isOpen={!!previewingStudent}
        onClose={() => setPreviewingStudent(null)}
        student={previewingStudent}
        classroom={activeClass}
      />

      {/* TEAM-SPECIFIC PROJECT BASE MARKS MODAL */}
      {isTeamBaseGradesModalOpen && activeClass && createPortal(
        <div className="modal-overlay" onClick={() => { setIsTeamBaseGradesModalOpen(false); setTeamSearchQuery(''); }}>
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.05rem', fontWeight: 800 }}>
                <Sliders size={18} className="text-teal" /> Team Project Base Marks (WebPA)
              </h3>
              <button
                type="button"
                onClick={() => { setIsTeamBaseGradesModalOpen(false); setTeamSearchQuery(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Award different project scores to different teams. Individual student grades are automatically scaled using each team's base mark multiplied by their peer contribution ratio (with fudge weight applied).
              </div>

              {/* Bulk Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Set All Teams:</span>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    className="form-input"
                    value={baseGroupGrade}
                    onChange={(e) => setBaseGroupGrade(Number(e.target.value))}
                    style={{ width: '70px', height: '32px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'right' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const newGrades: Record<string, number> = {};
                      classTeams.forEach(t => { newGrades[t] = baseGroupGrade; });
                      setAllTeamBaseGrades(activeClass.id, newGrades);
                    }}
                    style={{ height: '32px', fontWeight: 700 }}
                  >
                    Apply to All
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setAllTeamBaseGrades(activeClass.id, {});
                  }}
                  style={{ height: '32px', gap: '0.3rem' }}
                  title="Remove custom marks and revert all teams to default"
                >
                  <RotateCcw size={12} /> Reset to Default
                </button>
              </div>

              {/* Search & Stats Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by team name or student member..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.1rem', paddingRight: teamSearchQuery ? '2rem' : '0.75rem', height: '34px', fontSize: '0.82rem', width: '100%' }}
                  />
                  {teamSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTeamSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredTeams.length}</strong> of {classTeams.length} teams</span>
                  {teamSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTeamSearchQuery('')}
                      className="btn btn-link btn-sm"
                      style={{ fontSize: '0.72rem', padding: 0, textDecoration: 'underline', color: 'var(--primary)' }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Teams Table */}
              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.82rem', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', whiteSpace: 'nowrap', minWidth: '135px' }}>Team</th>
                      <th style={{ textAlign: 'left', whiteSpace: 'nowrap', minWidth: '100px' }}>Members</th>
                      <th style={{ textAlign: 'center', whiteSpace: 'nowrap', minWidth: '105px' }}>Peer Avg %</th>
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: '150px' }}>Project Base Mark</th>
                      <th style={{ textAlign: 'center', whiteSpace: 'nowrap', minWidth: '165px' }}>Calibrated Grade Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classTeams.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
                          No teams found in this classroom. Assign students to teams in Section 1 (Roster).
                        </td>
                      </tr>
                    ) : filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
                          No teams match &ldquo;{teamSearchQuery}&rdquo;. <button type="button" className="btn btn-link btn-sm" onClick={() => setTeamSearchQuery('')} style={{ fontSize: '0.78rem', textDecoration: 'underline' }}>Clear search</button>
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map(team => {
                        const members = activeClass.students.filter(s => s.groupName === team);
                        const currentMark = activeClass?.teamBaseGrades?.[team] ?? baseGroupGrade;
                        const isCustom = activeClass?.teamBaseGrades && typeof activeClass.teamBaseGrades[team] === 'number';

                        // Compute calibrated student scores in this team
                        const studentGrades = members.map(m => {
                          const { adjustedGrade } = calculateStudentWebPAScore(m.id, m.groupName, activeClass, baseGroupGrade, fudgeWeight);
                          return adjustedGrade;
                        });
                        const minGrade = studentGrades.length > 0 ? Math.min(...studentGrades) : currentMark;
                        const maxGrade = studentGrades.length > 0 ? Math.max(...studentGrades) : currentMark;

                        return (
                          <tr key={team}>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                                <span style={{ whiteSpace: 'nowrap' }}>{team}</span>
                                {isCustom && <span className="badge badge-teal" style={{ fontSize: '0.62rem', padding: '0.08rem 0.3rem', whiteSpace: 'nowrap' }}>Custom</span>}
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} title={members.map(m => m.name).join(', ')}>
                                {members.length} {members.length === 1 ? 'student' : 'students'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {members.length > 0 ? (
                                <span>
                                  {(members.reduce((acc, m) => acc + (calculateStudentMetrics(m, activeClass).overallPercentage || 0), 0) / members.length).toFixed(1)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <TeamBaseGradeInput
                                initialValue={currentMark}
                                onCommit={(val) => updateTeamBaseGrade(activeClass.id, team, val)}
                              />
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--primary)' }}>
                                {minGrade === maxGrade ? `${minGrade.toFixed(1)}` : `${minGrade.toFixed(1)} – ${maxGrade.toFixed(1)}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {Object.keys(activeClass?.teamBaseGrades || {}).length > 0 ? (
                  <span>
                    <strong style={{ color: 'var(--text-teal, #0d9488)' }}>{Object.keys(activeClass.teamBaseGrades || {}).length}</strong> of {classTeams.length} teams have custom base marks
                  </span>
                ) : (
                  <span>All {classTeams.length} teams using default base mark ({baseGroupGrade})</span>
                )}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
                onClick={() => { setIsTeamBaseGradesModalOpen(false); setTeamSearchQuery(''); }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* LMS UPLOAD STEP-BY-STEP INSTRUCTIONS MODAL */}
      <Modal
        isOpen={showLmsGuideModal}
        onClose={() => setShowLmsGuideModal(false)}
        title="LMS Gradebook Upload & Synchronization Guide"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLmsGuideModal(false)}
            >
              Close Guide
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                try {
                  const filters: LmsExportFilterOptions = {
                    teamFilter: lmsTeamFilter,
                    statusFilter: lmsStatusFilter
                  };
                  exportLMSGradebook(lmsGuideActiveTab, activeClass, lmsScoreType, filters, customLmsConfig);
                  addToast(`Exported ${lmsGuideActiveTab.toUpperCase()} gradebook!`, 'success');
                } catch (e) {
                  addToast('Failed to export LMS file.', 'error');
                }
              }}
              style={{ gap: '0.4rem', fontWeight: 700 }}
            >
              <Download size={15} /> Download {lmsGuideActiveTab === 'canvas' ? 'Canvas' : lmsGuideActiveTab === 'blackboard' ? 'Blackboard' : lmsGuideActiveTab === 'moodle' ? 'Moodle' : lmsGuideActiveTab === 'brightspace' ? 'Brightspace' : 'Custom'} {customLmsConfig.delimiter === '\t' ? 'TSV' : 'CSV'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* LMS Tab Bar inside modal */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            {[
              { id: 'canvas', name: 'Canvas LMS', color: '#E13F2B' },
              { id: 'blackboard', name: 'Blackboard Learn', color: '#D4AF37' },
              { id: 'moodle', name: 'Moodle', color: '#F98012' },
              { id: 'brightspace', name: 'Brightspace D2L', color: '#006FBF' },
              { id: 'custom', name: 'Custom / Other LMS', color: '#8B5CF6' }
            ].map(lms => (
              <button
                key={lms.id}
                type="button"
                onClick={() => setLmsGuideActiveTab(lms.id as LmsPlatform)}
                className={`btn btn-sm ${lmsGuideActiveTab === lms.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  height: '32px',
                  padding: '0 0.85rem',
                  gap: '0.45rem'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lms.color, display: 'inline-block' }} />
                {lms.name}
              </button>
            ))}
          </div>

          {/* Canvas Guide */}
          {lmsGuideActiveTab === 'canvas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-teal" style={{ fontWeight: 800 }}>Canvas CSV Import</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Standard Gradebook Import Process</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <div>
                    <strong>Download the CSV:</strong> Use the <em>Download Canvas CSV</em> button to save your formatted gradebook file.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <div>
                    <strong>Open Canvas Grades:</strong> In Canvas, navigate to your course and select <strong>Grades</strong> from the left-hand navigation.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <div>
                    <strong>Click Import:</strong> In the upper right corner of the gradebook, click the <strong>Actions</strong> menu and select <strong>Import</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                  <div>
                    <strong>Upload and Review:</strong> Choose the downloaded file and click <strong>Upload Data</strong>. Canvas will match students via <em>SIS User ID</em> and <em>SIS Login ID</em>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>5</span>
                  <div>
                    <strong>Confirm Assignment Mapping:</strong> Choose to link scores to an existing Assignment or create a new assignment named <em>Peer Assessment Final Score</em>. Click <strong>Save Changes</strong>.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Canvas Tip:</strong> PeerLens automatically includes the required <code style={{ fontSize: '0.74rem' }}>Points Possible</code> definition on line 2, ensuring Canvas does not trigger missing column or formatting errors.
              </div>
            </div>
          )}

          {/* Blackboard Guide */}
          {lmsGuideActiveTab === 'blackboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-teal" style={{ fontWeight: 800 }}>Blackboard Full Grade Center</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Work Offline Upload Workflow</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <div>
                    <strong>Download CSV:</strong> Download the Blackboard Learn formatted CSV file from PeerLens.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <div>
                    <strong>Navigate to Grade Center:</strong> Under Course Management, expand <strong>Grade Center</strong> and click <strong>Full Grade Center</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <div>
                    <strong>Work Offline &gt; Upload:</strong> Click the <strong>Work Offline</strong> button in the upper right action bar and select <strong>Upload</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                  <div>
                    <strong>Select File:</strong> Choose <strong>Attach Local File</strong>, browse for your downloaded file, set Delimiter Type to <em>Comma</em>, and click <strong>Submit</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>5</span>
                  <div>
                    <strong>Finalize Import:</strong> Blackboard will display the column preview and confirm matched usernames. Click <strong>Submit</strong> to save the grades.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Blackboard Tip:</strong> The grade column name automatically includes <code style={{ fontSize: '0.74rem' }}>[Total Pts: ...]</code> which enables Blackboard to configure points possible automatically on import.
              </div>
            </div>
          )}

          {/* Moodle Guide */}
          {lmsGuideActiveTab === 'moodle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-teal" style={{ fontWeight: 800 }}>Moodle Grader Report</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>CSV Grader Import Workflow</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <div>
                    <strong>Download Moodle CSV:</strong> Download the Moodle formatted CSV file with first name, last name, and ID number columns.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <div>
                    <strong>Open Course Grades:</strong> In your Moodle course, click the <strong>Grades</strong> tab in the course navigation bar.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <div>
                    <strong>Choose Import &gt; CSV:</strong> From the top dropdown menu, select <strong>Import</strong>, then choose <strong>CSV file</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                  <div>
                    <strong>Upload File:</strong> Drag and drop the CSV file into the file upload box, keep Encoding as <em>UTF-8</em> and separator as <em>Comma</em>, then click <strong>Upload grades</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>5</span>
                  <div>
                    <strong>Map Fields:</strong> Under <em>Identify user by</em>, map <em>ID number</em> (or <em>Email address</em>) to your user profile field, and under <em>Grade item mappings</em>, map <em>Peer Assessment (Real)</em> to your target grade item. Click <strong>Upload grades</strong>.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Moodle Tip:</strong> Both <em>ID number</em> and <em>Email address</em> are included so you can map whichever identifier your institution uses for student accounts.
              </div>
            </div>
          )}

          {/* Brightspace D2L Guide */}
          {lmsGuideActiveTab === 'brightspace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-teal" style={{ fontWeight: 800 }}>Brightspace D2L Gradebook</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Enter Grades Import Workflow</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <div>
                    <strong>Download D2L CSV:</strong> Download the Brightspace D2L formatted CSV file from PeerLens.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <div>
                    <strong>Open Brightspace Grades:</strong> In your course, click <strong>Assessments</strong> in the navbar and select <strong>Grades</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <div>
                    <strong>Click Import:</strong> On the <strong>Enter Grades</strong> tab, click the <strong>Import</strong> button near the top.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                  <div>
                    <strong>Browse File:</strong> Select your CSV file and optionally check <em>"Create new grade item for unrecognized columns"</em> if you want D2L to auto-create the peer assessment column. Click <strong>Continue</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>5</span>
                  <div>
                    <strong>Review and Finish:</strong> Review the grade import preview screen and click <strong>Finish</strong> to apply the scores.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Brightspace Tip:</strong> D2L strictly requires the <code style={{ fontSize: '0.74rem' }}>#</code> OrgDefinedId prefix and terminal <code style={{ fontSize: '0.74rem' }}>#</code> End-of-Line Indicator, which PeerLens automatically formats for you.
              </div>
            </div>
          )}

          {/* Custom LMS Guide */}
          {lmsGuideActiveTab === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', fontWeight: 800 }}>Custom / Proprietary LMS Format</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>User-Defined Column Mapping &amp; Delimiter</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <div>
                    <strong>Configure Column Schema:</strong> In the <em>Custom LMS Format</em> panel, add or remove columns to match your institution's required gradebook structure.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <div>
                    <strong>Rename Headers:</strong> Type the exact column header expected by your LMS (e.g. <em>"Assignment 2 Marks"</em>, <em>"Student_ID"</em>, <em>"Username"</em>).
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <div>
                    <strong>Select Delimiter &amp; Options:</strong> Choose Comma (,), Semicolon (;), or Tab (\t - TSV), and toggle quotation marks or header rows as needed.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                  <div>
                    <strong>Filter by Team or Status:</strong> Use the Team filter to export only a single group (e.g., <em>Team Alpha</em>) or filter by evaluated students only.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>5</span>
                  <div>
                    <strong>Download &amp; Import:</strong> Click <em>Download Custom CSV/TSV</em> and upload directly into Sakai, Schoology, Populi, PowerSchool, or your university's student information system.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Persistent Customization:</strong> Your custom column mappings and delimiter options are automatically saved in your browser so you don't need to reconfigure them each time.
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* GLOBAL KEYBOARD SHORTCUTS CHEAT SHEET MODAL (? or / key) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={shortcuts}
        onOpenCustomize={() => {
          setIsShortcutsModalOpen(false);
          setSettingsInitialTab('shortcuts');
          setIsSettingsModalOpen(true);
        }}
      />
    </div>
  );
};
export default AdminDashboard;
