import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Download, Upload, Sliders, Mail, 
  Database, RefreshCw, CheckCircle, Clock, BookOpen, 
  Award, TrendingUp, AlertCircle, FileText, 
  Search, Eye, Sparkles, Edit2, User, Info,
  Lightbulb, Heart, MessageSquare, Target, Minus,
  ThumbsUp, ShieldCheck, Rocket, Trophy, BarChart2
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useClass } from '../context/ClassContext';
import type { FirebaseConfig } from '../context/ClassContext';
import { calculateClassStats, calculateStudentMetrics, calculateStudentWebPAScore, detectClassAnomalies, getTargetScale } from '../utils/math';
import type { GradingScaleField, Student } from '../utils/math';
import { 
  parseCSV as _parseCSV, 
  exportClassroomToExcel,
  extractRosterMatrix, 
  parseRawPastedText, 
  validateEmail,
  hashCode 
} from '../utils/csv';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';


const getPraiseTagInfo = (tagText: string) => {
  // Strip historical emojis if any
  const cleanText = tagText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
  
  if (cleanText.includes('Creative')) return { icon: Lightbulb, color: 'hsl(45, 90%, 45%)', bg: 'hsl(45, 90%, 96%)', border: 'hsl(45, 90%, 90%)', text: 'Creative Ideas' };
  if (cleanText.includes('Punctual')) return { icon: Clock, color: 'hsl(14, 90%, 50%)', bg: 'hsl(14, 90%, 96%)', border: 'hsl(14, 90%, 90%)', text: 'Always Punctual' };
  if (cleanText.includes('Supportive')) return { icon: Heart, color: 'var(--accent-rose)', bg: 'var(--accent-rose-light)', border: 'hsl(346, 84%, 90%)', text: 'Super Supportive' };
  if (cleanText.includes('Quality')) return { icon: Award, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'hsl(243, 75%, 92%)', text: 'High Quality Work' };
  if (cleanText.includes('Communicator')) return { icon: MessageSquare, color: 'hsl(199, 89%, 40%)', bg: 'hsl(199, 89%, 95%)', border: 'hsl(199, 89%, 90%)', text: 'Great Communicator' };
  return { icon: Target, color: 'var(--accent-teal)', bg: 'var(--accent-teal-light)', border: 'hsl(173, 80%, 90%)', text: 'Detail Oriented' };
};

const getTierInfo = (pct: number) => {
  if (pct <= 20) {
    return {
      icon: AlertCircle,
      title: 'Below Expectations',
      desc: 'Minimal contribution, barely participated or was hard to reach.',
      color: 'var(--accent-rose)',
      bgColor: 'var(--accent-rose-light)',
      className: 'active-rose',
      index: 0
    };
  } else if (pct <= 50) {
    return {
      icon: TrendingUp,
      title: 'Progressing',
      desc: 'Completed basic tasks, but needed active prompting or reminders.',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-light)',
      className: 'active-amber',
      index: 1
    };
  } else if (pct <= 75) {
    return {
      icon: ThumbsUp,
      title: 'Meets Expectations',
      desc: 'Met all standards, cooperative, communicative, reliable teamwork.',
      color: 'var(--primary)',
      bgColor: 'var(--primary-light)',
      className: 'active-indigo',
      index: 2
    };
  } else if (pct <= 90) {
    return {
      icon: Rocket,
      title: 'Exceeds Expectations',
      desc: 'Highly active contributor, went above and beyond, excellent work.',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      className: 'active-teal',
      index: 3
    };
  } else {
    return {
      icon: Trophy,
      title: 'Distinguished Performer',
      desc: 'Phenomenal drive, carried complex items, inspiring team commitment!',
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

export const AdminDashboard: React.FC = () => {
  const {
    classes,
    activeClass,
    createClass,
    deleteClass,
    selectClass,
    updateGradingConfig,
    importRoster,
    addStudent,
    updateStudent,
    deleteStudent,
    resetClassReviews,
    saveClassDeadline,
    archiveActiveMilestone,
    deleteMilestone,
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
    addToast
  } = useClass();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'roster' | 'grading' | 'results' | 'automation' | 'cloud'>('roster');

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
    studentType: -1
  });
  const [wizardStudents, setWizardStudents] = useState<any[]>([]);
  const [wizardErrors, setWizardErrors] = useState<Record<number, string[]>>({});
  const [wizardPasteText, setWizardPasteText] = useState('');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [formatGuideTab, setFormatGuideTab] = useState<'csv' | 'xlsx' | 'pdf' | 'paste'>('csv');

  // Download a pre-built CSV template for the admin
  const handleDownloadTemplate = () => {
    const header = 'Student ID,Full Name,Email,Group / Team,University,Degree,Student Type';
    const rows = [
      '101,Alice Johnson,alice.johnson@university.edu,Team Alpha,MIT,Computer Science,Erasmus',
      '102,Bob Martinez,bob.martinez@university.edu,Team Beta,Stanford,Software Engineering,Normal',
      '103,Carol Lee,carol.lee@university.edu,Team Alpha,Oxford,Physics,Normal',
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
    university: '',
    degree: '',
    studentType: 'Normal'
  });

  // UI Filtering and Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');

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
    university: '',
    degree: '',
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
  const [autoGroupSize, setAutoGroupSize] = useState<number>(3);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');

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
    onConfirm: () => {}
  });

  const [selectedStudentReport, setSelectedStudentReport] = useState<Student | null>(null);
  const [selectedTeamAnalysis, setSelectedTeamAnalysis] = useState<string | null>(null);
  const [activeAuditMetric, setActiveAuditMetric] = useState<string>('overall');

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
      roster: 'Enrollment & Teams',
      grading: 'Evaluation Rubric',
      results: 'Grade Analytics',
      automation: 'Notification Center',
      cloud: 'Data & Sync'
    };
    const classNamePart = activeClass ? ` | ${activeClass.name}` : '';
    document.title = `${tabTitles[activeTab] || 'Dashboard'}${classNamePart} - PeerLens`;
  }, [activeTab, activeClass, isCloudSynced, user]);

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1.5rem' }}>
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

  // Calculate quick stats
  const stats = calculateClassStats(activeClass);

  // Group list compilation
  const uniqueGroups = Array.from(new Set(activeClass.students.map(s => s.groupName)));

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
    
    // Fuzzy guess mapping for common field titles
    const newMapping = {
      name: -1,
      email: -1,
      id: -1,
      groupName: -1,
      university: -1,
      degree: -1,
      studentType: -1
    };
    
    headersList.forEach((header, idx) => {
      const norm = header.toLowerCase().replace(/[\s_-]+/g, '');
      if (['name', 'studentname', 'fullname', 'member'].some(s => norm.includes(s))) {
        newMapping.name = idx;
      } else if (['email', 'emailid', 'mail', 'address'].some(s => norm.includes(s))) {
        newMapping.email = idx;
      } else if (['id', 'uniqueid', 'rollno', 'studentid', 'number'].some(s => norm.includes(s))) {
        newMapping.id = idx;
      } else if (['group', 'team', 'groupname', 'teamname', 'classgroup'].some(s => norm.includes(s))) {
        newMapping.groupName = idx;
      } else if (['university', 'uni', 'college', 'institution', 'school'].some(s => norm.includes(s))) {
        newMapping.university = idx;
      } else if (['degree', 'major', 'program', 'course', 'degreefield'].some(s => norm.includes(s))) {
        newMapping.degree = idx;
      } else if (['studenttype', 'type', 'status', 'erasmus'].some(s => norm.includes(s))) {
        newMapping.studentType = idx;
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
      
      const rawId = idVal || 'std_' + Math.abs(hashCode(emailVal || nameVal || String(Math.random())));
      
      return {
        id: String(rawId),
        name: nameVal,
        email: emailVal,
        groupName: groupVal || 'Unassigned',
        university: uniVal || undefined,
        degree: degreeVal || undefined,
        studentType: studentTypeVal || 'Normal',
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
      [key]: value
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
      studentType: -1
    });
    setWizardStudents([]);
    setWizardErrors({});
    setWizardPasteText('');
  };

  // Add individual student manually
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }
    
    addStudent(activeClass.id, {
      id: newStudent.id.trim() || 'std_' + Math.floor(Math.random() * 100000),
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      groupName: newStudent.groupName.trim() || 'Unassigned',
      university: newStudent.university.trim() || undefined,
      degree: newStudent.degree.trim() || undefined,
      studentType: newStudent.studentType.trim() || 'Normal'
    });

    // Reset inputs
    setNewStudent({ id: '', name: '', email: '', groupName: '', university: '', degree: '', studentType: 'Normal' });
    setIsAddStudentModalOpen(false);
  };

  // Submit student edits
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentData.name || !editStudentData.email) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }
    
    updateStudent(activeClass.id, editStudentData.id, {
      name: editStudentData.name.trim(),
      email: editStudentData.email.trim(),
      groupName: editStudentData.groupName.trim() || 'Unassigned',
      university: editStudentData.university.trim() || undefined,
      degree: editStudentData.degree.trim() || undefined,
      studentType: editStudentData.studentType.trim() || 'Normal'
    });

    setIsEditStudentModalOpen(false);
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
      min: 1,
      max: 10,
      weight: 1
    };
    updateGradingConfig(activeClass.id, [...activeClass.fields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<GradingScaleField>) => {
    const updated = activeClass.fields.map(f => {
      if (f.id === id) return { ...f, ...updates };
      return f;
    });
    updateGradingConfig(activeClass.id, updated);
  };

  const handleDeleteField = (id: string) => {
    if (activeClass.fields.length === 1) {
      addToast('At least one grading metric is required.', 'warning');
      return;
    }
    const filtered = activeClass.fields.filter(f => f.id !== id);
    updateGradingConfig(activeClass.id, filtered);
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

  // Auto-group builder partitioning
  const handleAutoGrouping = () => {
    if (activeClass.students.length === 0) {
      addToast('Roster is empty. Add students before running grouping.', 'warning');
      return;
    }

    if (autoGroupSize < 2) {
      addToast('Target group size must be at least 2.', 'warning');
      return;
    }

    const studentsCopy = [...activeClass.students];
    // Shuffle students to distribute dynamically
    for (let i = studentsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [studentsCopy[i], studentsCopy[j]] = [studentsCopy[j], studentsCopy[i]];
    }

    const totalStudents = studentsCopy.length;
    const numGroups = Math.ceil(totalStudents / autoGroupSize);
    const updatedStudents = studentsCopy.map((s, index) => {
      const groupNum = (index % numGroups) + 1;
      return {
        ...s,
        groupName: `Team ${groupNum}`
      };
    });

    importRoster(activeClass.id, updatedStudents, true);
    addToast(`Successfully partitioned ${totalStudents} students into ${numGroups} balanced teams!`, 'success');
  };

  // Filter roster list
  const filteredStudents = activeClass.students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.university && student.university.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (student.degree && student.degree.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (student.studentType && student.studentType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = groupFilter === 'All Groups' || student.groupName === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const profileOptions = [
    ...adminProfiles.map(p => ({ value: p, label: `Admin: ${p.toUpperCase()}` })),
    { value: '__new__', label: '+ New Workspace' }
  ];

  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));

  const groupOptions = [
    { value: 'All Groups', label: 'All Groups' },
    ...uniqueGroups.map(g => ({ value: g, label: g }))
  ];

  const emailServiceOptions = [
    { value: 'simulator', label: 'Demo Mode — No emails sent' },
    { value: 'emailjs', label: 'EmailJS Adapter (Send live emails)' },
    { value: 'brevo', label: 'Brevo API Service (300 Free Mails/Day)' }
  ];

  return (
    <div className="main-content tab-pane">
      {/* Top Controls Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen className="text-indigo" />
            {activeClass.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Classroom ID: <code style={{ backgroundColor: 'var(--bg-app)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>{activeClass.id}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* User Sign Out controls if cloud sync and logged in */}
          {isCloudSynced && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <ShieldCheck size={15} className="text-teal" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {user.email}
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', minWidth: 'auto' }}
                onClick={logoutAdmin}
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Admin Workspace Profile Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <User size={15} className="text-indigo" />
            <CustomSelect
              options={profileOptions}
              value={activeAdminProfile}
              onChange={(val) => {
                if (val === '__new__') {
                  setIsNewProfileModalOpen(true);
                } else {
                  switchAdminProfile(val);
                }
              }}
              style={{ width: 'auto', minWidth: '145px' }}
              triggerStyle={{
                border: 'none',
                backgroundColor: 'var(--bg-app)',
                padding: '0.35rem 2.2rem 0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--primary)',
                boxShadow: 'none',
                height: 'auto'
              }}
            />
            {activeAdminProfile !== 'default' && (
              <button
                style={{ padding: '0.15rem', minWidth: 'auto', background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => {
                  triggerConfirm(
                    'Delete Admin Workspace Profile',
                    `Are you sure you want to permanently delete the admin workspace profile "${activeAdminProfile}" and ALL of its associated classroom groups? This action cannot be undone.`,
                    () => deleteAdminProfile(activeAdminProfile),
                    'Delete Workspace',
                    'Cancel'
                  );
                }}
                title="Delete Admin Profile"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <CustomSelect
            options={classOptions}
            value={activeClass.id}
            onChange={(val) => selectClass(val)}
            style={{ width: 'auto', minWidth: '220px' }}
          />
          <button className="btn btn-secondary" onClick={() => setIsNewClassModalOpen(true)}>
            <Plus size={16} /> New Class
          </button>
          <button 
            className="btn btn-rose" 
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
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Users size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.totalStudents}</div>
            <div className="stat-label">Enrolled Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-teal">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.groupCount}</div>
            <div className="stat-label">Active Groups</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.completionRate}%</div>
            <div className="stat-label">Submission Rate ({stats.submittedCount} submitted)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.averagePercentage !== null ? `${stats.averagePercentage}%` : 'N/A'}</div>
            <div className="stat-label">Class Average Score</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`btn tab-btn ${activeTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('roster')}
        >
          <Users size={16} /> Enrollment & Teams
        </button>
        <button 
          className={`btn tab-btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('grading')}
        >
          <Sliders size={16} /> Evaluation Rubric
        </button>
        <button 
          className={`btn tab-btn ${activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('results')}
        >
          <Award size={16} /> Grade Analytics
        </button>
        <button 
          className={`btn tab-btn ${activeTab === 'automation' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('automation')}
        >
          <Mail size={16} /> Notification Center
        </button>
        <button 
          className={`btn tab-btn ${activeTab === 'cloud' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('cloud')}
        >
          <Database size={16} /> Data & Sync
        </button>
      </div>

      {/* TAB CONTENT: ROSTER MANAGER */}
      {activeTab === 'roster' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Import Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><Upload size={18} className="text-teal" /> Import Enrollment Wizard</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Onboard your student roster using our interactive, multi-format wizard. Supports files or copy-paste data with dynamic headers.
              </p>
              
              <button 
                className="btn btn-primary"
                onClick={() => setIsWizardOpen(true)}
                style={{ width: '100%', justifyContent: 'center', padding: '1rem', gap: '0.75rem', borderRadius: 'var(--radius-md)' }}
              >
                <Sparkles size={20} /> Import Student Roster
              </button>
              
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)' }} title="Microsoft Excel (.xlsx)">
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-teal)' }}>XLSX</span>
                </div>
                <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)' }} title="Portable Document Format (.pdf)">
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-rose)' }}>PDF</span>
                </div>
                <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)' }} title="Comma Separated Values (.csv)">
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>CSV</span>
                </div>
                <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)' }} title="Excel Clipboard Direct Paste">
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-amber)' }}>PASTE</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title"><Sliders size={18} className="text-indigo" /> Quick Actions</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Quickly populate testing data or clear existing entries to start fresh.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsAddStudentModalOpen(true)}
                  style={{ width: '100%' }}
                >
                  <Plus size={16} /> Add Member Manually
                </button>
                <button 
                  className="btn btn-secondary text-rose" 
                  style={{ width: '100%', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}
                  onClick={() => {
                    triggerConfirm(
                      'Clear Class Roster',
                      'Are you sure you want to delete all students and peer evaluations for this class? This will wipe the slate completely clean for this classroom group.',
                      () => {
                        importRoster(activeClass.id, [], true);
                        resetClassReviews(activeClass.id);
                      },
                      'Clear Roster',
                      'Cancel'
                    );
                  }}
                >
                  <Trash2 size={16} /> Clear Class Roster
                </button>
              </div>
            </div>

            {/* Evaluation Window & Deadline */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={18} className="text-rose" /> Submission Window
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Enforce strict deadlines. The student portal displays a live countdown timer and automatically blocks incoming reviews once locked.
                </p>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Closing Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={activeClass.deadline ? new Date(new Date(activeClass.deadline).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0, 16) : ''}
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

              {activeClass.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: new Date(activeClass.deadline) > new Date() ? 'var(--accent-teal)' : 'var(--accent-rose)', fontWeight: 700 }}>
                    {new Date(activeClass.deadline) > new Date() ? 'Submission Clock Running' : 'Window Closed (Locked)'}
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                    onClick={() => saveClassDeadline(activeClass.id, null)}
                  >
                    Clear Limit
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Dynamic Auto-Grouping Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={18} className="text-teal" /> Intelligent Auto-Group Builder
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Partition your classroom roster automatically. Shuffles the student body and distributes participants using balanced round-robin clustering, ensuring teammate counts are mathematically aligned.
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Team Size:</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '80px', textAlign: 'center' }} 
                    min={2} 
                    max={20}
                    value={autoGroupSize}
                    onChange={(e) => setAutoGroupSize(Math.max(2, Number(e.target.value)))}
                  />
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleAutoGrouping}
                >
                  <Sparkles size={16} /> Auto-Generate Balanced Teams
                </button>
              </div>
            </div>
          </div>

          {/* Roster Filter & List Table */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title"><Users size={18} className="text-indigo" /> Classroom Roster ({filteredStudents.length} members)</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by ID, Name or Email..." 
                    className="form-input" 
                    style={{ paddingLeft: '2.25rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <CustomSelect
                  options={groupOptions}
                  value={groupFilter}
                  onChange={(val) => setGroupFilter(val)}
                  style={{ width: 'auto', minWidth: '150px' }}
                />
              </div>
            </div>

            {activeClass.students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  <Users size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>No participants yet</p>
                <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '300px', lineHeight: 1.5 }}>Use the <strong>Roster Onboarding Wizard</strong> to upload a spreadsheet, or click <strong>Add Member Manually</strong> to add students one by one.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Unique ID</th>
                      <th>Name</th>
                      <th>Email ID</th>
                      <th>University</th>
                      <th>Degree</th>
                      <th>Student Type</th>
                      <th>Roster Group</th>
                      <th>Evaluation Link</th>
                      <th>Actions</th>
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
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}><code>{s.id}</code></td>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                          <td>
                            {s.university ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.university}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            {s.degree ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.degree}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            {s.studentType === 'Erasmus' ? (
                              <span className="badge badge-secondary" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Erasmus</span>
                            ) : (
                              <span className="badge badge-secondary" style={{ opacity: 0.85 }}>Normal</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-primary">{s.groupName}</span>
                          </td>
                          <td>
                            <a 
                               href={gradingUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              <Eye size={12} /> Open Portal
                            </a>
                          </td>
                          <td style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => {
                                setEditStudentData({
                                  id: s.id,
                                  name: s.name,
                                  email: s.email,
                                  groupName: s.groupName,
                                  university: s.university || '',
                                  degree: s.degree || '',
                                  studentType: s.studentType || 'Normal'
                                });
                                setIsEditStudentModalOpen(true);
                              }}
                              title="Edit student details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              className="btn btn-rose btn-sm"
                              style={{ padding: '0.25rem 0.5rem' }}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: GRADING SCALE CONFIG */}
      {activeTab === 'grading' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title"><Sliders size={18} className="text-indigo" /> Configure Grading Scales</h3>
                <p className="card-subtitle">Define multi-field rubrics. Dynamic sliding parameters scale instantly inside both administrative reports and student submission cards.</p>
              </div>
              <button className="btn btn-primary" onClick={handleAddField}>
                <Plus size={16} /> Add Custom Metric
              </button>
            </div>

            {/* Target final scale setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--primary-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid hsla(243, 75%, 59%, 0.15)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ maxWidth: '520px' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sliders size={15} /> Final Grade Scaling Target Scale
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                    Choose the custom scale value for student results. The system will automatically convert overall averages to display out of this target scale (e.g. 20, 100, 10) instead of simply summing up all grading rubrics' maximums.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px', flexWrap: 'wrap' }}>
                  <select
                    className="form-select"
                    value={activeClass.targetScale === 0 ? 'sum' : activeClass.targetScale ? 'custom' : 'default'}
                    onChange={(e) => {
                      if (e.target.value === 'default') {
                        updateGradingConfig(activeClass.id, activeClass.fields, null);
                      } else if (e.target.value === 'sum') {
                        updateGradingConfig(activeClass.id, activeClass.fields, 0);
                      } else {
                        updateGradingConfig(activeClass.id, activeClass.fields, 20); // Default to custom scale of 20
                      }
                    }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto', minWidth: '160px' }}
                  >
                    <option value="default">Default Scale (Out of 20)</option>
                    <option value="sum">Sum of rubrics' maximums ({activeClass.fields.reduce((sum, f) => sum + f.max, 0)})</option>
                    <option value="custom">Custom scaling target...</option>
                  </select>
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
                            updateGradingConfig(activeClass.id, activeClass.fields, val);
                          }
                        }}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '70px', textAlign: 'center' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeClass.fields.map((field) => (
                <div 
                  key={field.id} 
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                >
                  <div>
                    <label className="form-label">Metric Label Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={field.name}
                      placeholder="e.g. Collaboration, Contribution..."
                      onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Minimum Scale Value</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={field.min}
                      onChange={(e) => handleUpdateField(field.id, { min: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Maximum Scale Value</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={field.max}
                      onChange={(e) => handleUpdateField(field.id, { max: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ paddingTop: '1.5rem' }}>
                    <button 
                      className="btn btn-rose" 
                      onClick={() => handleDeleteField(field.id)}
                      title="Delete rubric scale"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Scale visual simulation */}
            <div style={{ marginTop: '2rem', backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--primary)' }}>
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
          </div>
        </div>
      )}

      {/* TAB CONTENT: INSTANT CALCULATIONS & RESULTS */}
      {activeTab === 'results' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Header Card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title"><Award size={18} className="text-teal" /> Real-time Calculation Matrix</h3>
              <p className="card-subtitle">Self-excluded student averages recalculate instantly as submissions arrive. Calculations do not count self-grading reviews.</p>
            </div>
            
            <div className="responsive-btn-group">
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
              
              <button 
                className="btn btn-primary" 
                onClick={handleExportExcel}
                title="Download comprehensive multi-sheet Excel workbook with grades and written reviews"
              >
                <Download size={16} /> Download Excel Report (.xlsx)
              </button>
            </div>
          </div>

          {/* Advanced Analytics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* Fudge Factor Calibration Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sliders size={18} className="text-teal" /> WebPA Grade Calibration
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Compare peer averages against team averages to yield multipliers. Use base marks and calibrate the scaling factor weight.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Project Base Mark (Base Grade)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min={0}
                    max={1000}
                    value={baseGroupGrade}
                    onChange={(e) => setBaseGroupGrade(Number(e.target.value))}
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0, fontSize: '0.8rem' }}>Calibrator Fudge Weight</label>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(fudgeWeight * 100)}%</span>
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

            {/* Anomaly Conflict Audit Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} className="text-rose" /> Anomaly & Collusion Audit
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Our statistical auditing engine flags positive collusion, extreme outlier ratings, or non-differentiated uniform grades.
                </p>
              </div>

              <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {detectClassAnomalies(activeClass).length === 0 ? (
                  <div style={{ backgroundColor: 'var(--accent-teal-light)', border: '1px solid hsl(173, 80%, 90%)', color: 'var(--accent-teal)', fontSize: '0.78rem', padding: '0.5rem 0.75rem', borderRadius: '4px', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <CheckCircle size={12} /> No scoring conflicts detected.
                  </div>
                ) : (
                  detectClassAnomalies(activeClass).map((anomaly) => (
                    <div 
                      key={anomaly.id} 
                      style={{ 
                        backgroundColor: anomaly.severity === 'high' ? 'var(--accent-rose-light)' : 'var(--accent-amber-light)', 
                        border: `1px solid ${anomaly.severity === 'high' ? 'hsl(346, 84%, 90%)' : 'hsl(45, 90%, 90%)'}`, 
                        padding: '0.4rem 0.6rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                        ⚠️ {anomaly.studentName} ({anomaly.type.toUpperCase()})
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{anomaly.description}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Milestone Archive Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={18} className="text-indigo" /> Milestone & Sprints History
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Archive evaluations into permanent records (e.g. <i>Sprint 1</i>) to reset active reviewer markers and begin fresh sprints.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
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
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
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

          </div>

          {/* Grades Matrix Sheet */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Award size={18} className="text-indigo" /> Results Summary Sheet</h3>
              
              <CustomSelect
                options={groupOptions}
                value={groupFilter}
                onChange={(val) => setGroupFilter(val)}
                style={{ width: 'auto', minWidth: '150px' }}
              />
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
              <div className="table-container">
                <table className="custom-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th>Participant Name</th>
                      <th>University</th>
                      <th>Degree</th>
                      <th>Student Type</th>
                      <th>Team Group</th>
                      <th>State</th>
                      <th>Reviews Received</th>
                      {activeClass.fields.map(f => (
                        <th key={f.id} style={{ fontSize: '0.75rem' }}>Avg: {f.name}</th>
                      ))}
                      {activeClass.fields.map(f => (
                        <th key={f.id} style={{ fontSize: '0.75rem' }}>StdDev: {f.name}</th>
                      ))}
                      <th>Received Praise & Strengths</th>
                      <th>WebPA Ratio</th>
                      <th>Calibrated Mark</th>
                      <th>Overall Weighted Avg %</th>
                      <th>Subjective Scaled Score</th>
                      <th>Actions</th>
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

                      const { ratio, adjustedGrade } = calculateStudentWebPAScore(
                        s.id,
                        s.groupName,
                        activeClass,
                        baseGroupGrade,
                        fudgeWeight
                      );

                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>
                            {s.university ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.university}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            {s.degree ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.degree}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            {s.studentType === 'Erasmus' ? (
                              <span className="badge badge-secondary" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Erasmus</span>
                            ) : (
                              <span className="badge badge-secondary" style={{ opacity: 0.85 }}>Normal</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-primary">{s.groupName}</span>
                          </td>
                          <td>
                            {s.submitted ? (
                              <span className="badge badge-teal" style={{ gap: '0.25rem' }}><CheckCircle size={10} /> Completed</span>
                            ) : (
                              <span className="badge badge-amber" style={{ gap: '0.25rem' }}><Clock size={10} /> Pending</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {metrics.reviewsReceived} / {metrics.expectedReviewsCount}
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                              ({metrics.gradeProgress}%)
                            </span>
                          </td>
                          {activeClass.fields.map(f => {
                            const val = metrics.fieldAverages[f.id];
                            return (
                              <td key={f.id} style={{ fontWeight: 600, color: val !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {val !== null ? `${val} / ${f.max}` : '-'}
                              </td>
                            );
                          })}
                          {activeClass.fields.map(f => {
                            const val = metrics.fieldStdDevs[f.id];
                            return (
                              <td key={f.id} style={{ fontStyle: val !== null ? 'normal' : 'italic', color: 'var(--text-muted)' }}>
                                {val !== null ? val : '-'}
                              </td>
                            );
                          })}
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
                                          borderColor: tagInfo.border 
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
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {metrics.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : '—'}
                          </td>
                          <td style={{ fontWeight: 800, color: adjustedGrade < (baseGroupGrade * 0.7) ? 'var(--accent-rose)' : 'hsl(142, 70%, 35%)' }}>
                            {metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${baseGroupGrade}` : '—'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: '0.95rem', color: metrics.overallPercentage !== null ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {metrics.overallPercentage !== null ? `${metrics.overallPercentage}%` : 'N/A'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-teal)' }}>
                            {metrics.overallPercentage !== null ? `${((metrics.overallPercentage / 100) * activeClass.fields.reduce((acc, f) => acc + (f.max ?? 0), 0)).toFixed(1)} / ${activeClass.fields.reduce((acc, f) => acc + (f.max ?? 0), 0)}` : 'N/A'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.3rem', 
                                  padding: '0.35rem 0.6rem', 
                                  fontSize: '0.8rem',
                                  border: '1px solid var(--primary)',
                                  color: 'var(--primary)',
                                  cursor: 'pointer',
                                  background: 'transparent',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                                onClick={() => setSelectedStudentReport(s)}
                                title="View individual student self vs peer evaluation report"
                              >
                                <Eye size={13} />
                                <span>View Student</span>
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.3rem', 
                                  padding: '0.35rem 0.6rem', 
                                  fontSize: '0.8rem',
                                  border: '1px solid var(--accent-teal)',
                                  color: 'var(--accent-teal)',
                                  cursor: 'pointer',
                                  background: 'transparent',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                                onClick={() => {
                                  setSelectedTeamAnalysis(s.groupName);
                                  setActiveAuditMetric('overall');
                                }}
                                title="View in-depth team evaluation metrics, audit matrix, and all reviews logs"
                              >
                                <Users size={13} />
                                <span>View Team</span>
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
        </div>
      )}

      {/* TAB CONTENT: AUTOMATION & LINKS */}
      {activeTab === 'automation' && (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Automation Setup */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header">
                  <h3 className="card-title"><Mail size={18} className="text-teal" /> Email Dispatcher</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Launch automated peer evaluation requests. The engine constructs a unique, secure URL for each student which enables secure anonymous submissions.
                </p>

                <div className="form-group">
                  <label className="form-label">Active Mailing Mode</label>
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
                      placeholder="EmailJS Service ID" 
                      className="form-input" 
                      value={emailjsServiceId}
                      onChange={(e) => setEmailjsServiceId(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="EmailJS Template ID" 
                      className="form-input" 
                      value={emailjsTemplateId}
                      onChange={(e) => setEmailjsTemplateId(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="EmailJS User ID (Public Key)" 
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
                      placeholder="Verified Sender Email (e.g., prof@uni.edu)" 
                      className="form-input" 
                      value={brevoSenderEmail}
                      onChange={(e) => setBrevoSenderEmail(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Sender Name (Optional, e.g. Instructor)" 
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

              <div className="responsive-btn-group" style={{ marginTop: '1.5rem' }}>
                <button 
                  className={`btn btn-primary ${isSendingEmails ? 'btn-disabled' : ''}`}
                  onClick={() => triggerEmailAutomation(false)}
                  disabled={isSendingEmails}
                  style={{ flex: 1 }}
                >
                  <Mail size={16} /> Send Links to All
                </button>
                <button 
                  className={`btn btn-secondary ${isSendingEmails ? 'btn-disabled' : ''}`}
                  style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', flex: 1 }}
                  onClick={() => triggerEmailAutomation(true)}
                  disabled={isSendingEmails}
                >
                  <Clock size={16} /> Send Reminders
                </button>
              </div>
            </div>

            {/* Email Preview Card */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title"><FileText size={18} className="text-indigo" /> Invitation Mail Mockup</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  onClick={() => setIsEditTemplateModalOpen(true)}
                >
                  <Edit2 size={12} /> Edit Template
                </button>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><b>To:</b> student.name@university.edu</div>
                  <div><b>Subject:</b> {substitutePlaceholders(customEmailSubject, 'Student Name', activeClass.name)}</div>
                </div>
                
                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {substitutePlaceholders(customEmailBody, 'Student Name', activeClass.name)}
                </div>
                
                <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
                  <span 
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'default', display: 'inline-block', fontSize: '0.8rem' }}
                  >
                    Open Grading Portal
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  Important: This feedback is completely anonymous. Your team members will only see aggregated scores.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Logs */}
          {(isSendingEmails || emailLogs.length > 0) && (
            <div className="card">
              <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <RefreshCw size={16} className={isSendingEmails ? 'spin' : ''} /> Dispatching Pipeline Status
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
      )}

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
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddStudentSubmit}>Add Member</button>
          </>
        }
      >
        <form onSubmit={handleAddStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Unique Student ID <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(Optional — auto-generated if blank)</span></label>
            <input 
              type="text" 
              placeholder="e.g. std_8291" 
              className="form-input" 
              value={newStudent.id}
              onChange={(e) => setNewStudent(prev => ({ ...prev, id: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Student Name *</label>
            <input 
              type="text" 
              placeholder="Alice Johnson" 
              className="form-input" 
              required
              value={newStudent.name}
              onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">University Email ID *</label>
            <input 
              type="email" 
              placeholder="alice@univ.edu" 
              className="form-input" 
              required
              value={newStudent.email}
              onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Roster Group Name (Team Title)</label>
            <input 
              type="text" 
              placeholder="e.g. Group Gamma, Team Alpha" 
              className="form-input" 
              value={newStudent.groupName}
              onChange={(e) => setNewStudent(prev => ({ ...prev, groupName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">University / Institution <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(Optional)</span></label>
            <input 
              type="text" 
              placeholder="e.g. Stanford University" 
              className="form-input" 
              value={newStudent.university}
              onChange={(e) => setNewStudent(prev => ({ ...prev, university: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Degree / Major <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(Optional)</span></label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science, MBA" 
              className="form-input" 
              value={newStudent.degree}
              onChange={(e) => setNewStudent(prev => ({ ...prev, degree: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student Type</label>
            <select 
              className="form-input"
              value={newStudent.studentType}
              onChange={(e) => setNewStudent(prev => ({ ...prev, studentType: e.target.value }))}
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem' }}
            >
              <option value="Normal">Normal Student</option>
              <option value="Erasmus">Erasmus Student</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT STUDENT DETAILS */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        title="Edit Student Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditStudentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditStudentSubmit}>Save Changes</button>
          </>
        }
      >
        <form onSubmit={handleEditStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Student Name *</label>
            <input 
              type="text" 
              placeholder="Alice Johnson" 
              className="form-input" 
              required
              value={editStudentData.name}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">University Email ID *</label>
            <input 
              type="email" 
              placeholder="alice@univ.edu" 
              className="form-input" 
              required
              value={editStudentData.email}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Roster Group Name (Team Title)</label>
            <input 
              type="text" 
              placeholder="e.g. Group Gamma, Team Alpha" 
              className="form-input" 
              value={editStudentData.groupName}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, groupName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">University / Institution (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Stanford University" 
              className="form-input" 
              value={editStudentData.university}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, university: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Degree / Major (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science, MBA" 
              className="form-input" 
              value={editStudentData.degree}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, degree: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student Type</label>
            <select 
              className="form-input"
              value={editStudentData.studentType}
              onChange={(e) => setEditStudentData(prev => ({ ...prev, studentType: e.target.value }))}
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem' }}
            >
              <option value="Normal">Normal Student</option>
              <option value="Erasmus">Erasmus Student</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unique Student ID (Read-only)</label>
            <input 
              type="text" 
              className="form-input" 
              disabled
              value={editStudentData.id}
              style={{ backgroundColor: 'var(--bg-app)', cursor: 'not-allowed', opacity: 0.7 }}
            />
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
                        <span>✔ Header row is mandatory</span>
                        <span>✔ Column order doesn't matter — you'll map them in the next step</span>
                        <span>✔ Emails must be unique per student</span>
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
                        <span>✔ Merged cells are not supported — unmerge before uploading</span>
                        <span>✔ Remove any empty rows at the top of the sheet</span>
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
                        <span>⚠ Scanned / image PDFs are not supported</span>
                        <span>⚠ Password-protected PDFs cannot be read</span>
                        <span>✔ Best results: export directly from Excel or Google Sheets</span>
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
                        <span>✔ You can include or exclude a header row — you'll map columns in Step 2</span>
                        <span>✔ Works with both Excel and Google Sheets copy-paste</span>
                        <span>✔ Each row = one student; columns separated by Tab</span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
            {/* ── End Format Guide ────────────────────────────────────────── */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '0.25rem' }}>
              {/* Left Column: File Selector */}
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

              {/* Right Column: Direct Paste Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Option B: Paste Spreadsheet Cells</span>
                <textarea
                  className="wizard-paste-area"
                  placeholder={`Paste columns from Excel or Google Sheets here...\ne.g.\n101\tAlice\talice@univ.edu\tTeam A\n102\tBob\tbob@univ.edu\tTeam B`}
                  value={wizardPasteText}
                  onChange={(e) => setWizardPasteText(e.target.value)}
                  style={{ minHeight: '135px', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={handleWizardPasteSubmit}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Parse Clipboard Data
                </button>
              </div>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              File parsed: <b>{wizardFileName}</b> ({wizardRawData.length - 1} rows found). Match standard roster fields to the columns of your file:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              {Object.entries({
                name: 'Full Name * (Required)',
                email: 'Email ID * (Required)',
                id: 'Unique Student ID (Optional)',
                groupName: 'Roster Group / Team (Optional)',
                university: 'University / School (Optional)',
                degree: 'Degree / Program (Optional)',
                studentType: 'Student Type (Optional)'
              }).map(([fieldKey, labelText]) => (
                <div key={fieldKey} className="schema-mapping-row">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{labelText}</span>
                  <select
                    className="form-select"
                    value={wizardMapping[fieldKey]}
                    onChange={(e) => setWizardMapping(prev => ({ ...prev, [fieldKey]: Number(e.target.value) }))}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 2rem 0.4rem 0.75rem', height: 'auto', border: '1px solid var(--border-color)' }}
                  >
                    <option value="-1">-- Unmapped / Skip --</option>
                    {wizardHeaders.map((headerText, hIdx) => (
                      <option key={hIdx} value={hIdx}>Col {hIdx + 1}: {headerText}</option>
                    ))}
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
                    <th style={{ width: '120px' }}>Student ID</th>
                    <th>Student Name *</th>
                    <th>Email ID *</th>
                    <th>University</th>
                    <th>Degree</th>
                    <th style={{ width: '120px' }}>Student Type</th>
                    <th style={{ width: '130px' }}>Roster Group</th>
                    <th style={{ width: '45px', textAlign: 'center' }}>Action</th>
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

          const { ratio, adjustedGrade } = calculateStudentWebPAScore(
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
              <style dangerouslySetInnerHTML={{ __html: `
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Calibrated Grade: <b className="text-teal">{metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${baseGroupGrade}` : '—'}</b></span>
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
          const maxScale = getTargetScale(activeClass);

          return (
            <div id="print-team-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', padding: '0.5rem' }}>
              <style dangerouslySetInnerHTML={{ __html: `
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={20} className="text-teal" /> Team Roster & Submission Status
                </h3>
                <div className="table-container">
                  <table className="custom-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Email</th>
                        <th>Submission Status</th>
                        <th>Peer Reviews Received</th>
                        <th>Peer Average</th>
                        <th>Subjective Scaled Score</th>
                        <th>WebPA Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStudents.map(ts => {
                        const m = calculateStudentMetrics(ts, activeClass);
                        const { ratio } = calculateStudentWebPAScore(ts.id, ts.groupName, activeClass, baseGroupGrade, fudgeWeight);
                        const scaled = m.overallPercentage !== null 
                          ? `${((m.overallPercentage / 100) * maxScale).toFixed(1)} / ${maxScale}`
                          : 'N/A';
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
                            <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{scaled}</td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : '—'}</td>
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

              {/* Dynamic Cross-Grid Matrix (Who Rated Whom Audit Matrix) */}
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

              {/* Detailed Peer Evaluations Card Feed */}
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
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
export default AdminDashboard;
