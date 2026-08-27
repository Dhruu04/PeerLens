import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Users, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Award, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Check, 
  ExternalLink,
  Plus,
  UserPlus,
  Globe,
  GraduationCap,
  Plane,
  Languages,
  Search,
  LayoutGrid,
  Tv,
  CheckCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { useClass } from '../context/ClassContext';
import type { ClassData, Student } from '../utils/math';
import { calculateGroupReport, type GroupDiversityReport } from '../utils/grouping';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { NATIONALITY_OPTIONS } from '../utils/nationalities';
import { normalizeNationality } from '../utils/math';

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const CEFR_LEVELS = [
  { value: 'Native / Bilingual', code: 'C2+', title: 'Native / Bilingual' },
  { value: 'Fluent (C1/C2)', code: 'C1/C2', title: 'Fluent (C1/C2)' },
  { value: 'Intermediate (B1/B2)', code: 'B1/B2', title: 'Intermediate (B1/B2)' },
  { value: 'Basic (A1/A2)', code: 'A1/A2', title: 'Basic (A1/A2)' }
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

interface ProjectorViewProps {
  classData?: ClassData;
  onClose?: () => void;
  isStandalone?: boolean;
}

type ProjectorTab = 'matrix' | 'diversity' | 'qr_focus';

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  classData: propClassData,
  onClose,
  isStandalone = false
}) => {
  const { classes, activeClass, updateStudent, addStudent } = useClass();
  const currentClass = propClassData || activeClass || classes[0];

  const [activeTab, setActiveTab] = useState<ProjectorTab>('matrix');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Search & Filter in Matrix View
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Dynamic Add Team & Add Student Modal State
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedStudentForTeam, setSelectedStudentForTeam] = useState<string>('');

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [targetTeamForNewStudent, setTargetTeamForNewStudent] = useState<string>('');
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    groupName: '',
    gender: 'Female',
    isInternational: false,
    isExchange: false,
    nationality: '',
    currentCountry: '',
    englishProficiency: 'Fluent (C1/C2)',
    degree: '',
    university: '',
    currentUniversity: '',
    originalUniversity: '',
    originalCountry: ''
  });

  const enrollUrl = currentClass 
    ? `${window.location.origin}${window.location.pathname}?enrollClassId=${currentClass.id}`
    : '';

  // Clock ticker & QR Generator (Light theme only)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    if (enrollUrl) {
      QRCode.toDataURL(enrollUrl, {
        width: 600,
        margin: 1,
        color: { 
          dark: '#1e1b4b', 
          light: '#ffffff' 
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }

    return () => clearInterval(timer);
  }, [enrollUrl]);

  // Lock background scrolling and Escape key handler
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((e) => console.log(e));
      setIsFullscreen(false);
    }
  };

  const handleCopyLink = () => {
    if (!enrollUrl) return;
    navigator.clipboard.writeText(enrollUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenInNewWindow = () => {
    if (!currentClass) return;
    const url = `${window.location.origin}${window.location.pathname}?projector=true&classId=${currentClass.id}`;
    window.open(url, '_blank', 'width=1400,height=900,menubar=no,toolbar=no,location=no');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !newTeamName.trim()) return;
    const trimmed = newTeamName.trim();
    if (selectedStudentForTeam) {
      updateStudent(currentClass.id, selectedStudentForTeam, { groupName: trimmed });
    }
    setNewTeamName('');
    setSelectedStudentForTeam('');
    setIsAddTeamModalOpen(false);
  };

  const handleQuickAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !newStudent.name.trim()) return;
    const autoId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    addStudent(currentClass.id, {
      id: autoId,
      name: newStudent.name.trim(),
      email: newStudent.email.trim() || `${newStudent.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      groupName: newStudent.groupName || targetTeamForNewStudent || groupStats[0]?.groupName || 'Team 1',
      gender: newStudent.gender.trim() || 'Prefer not to say',
      isInternational: newStudent.isInternational,
      isExchange: newStudent.isExchange,
      nationality: normalizeNationality(newStudent.nationality) || undefined,
      currentCountry: normalizeNationality(newStudent.currentCountry || newStudent.nationality) || undefined,
      englishProficiency: newStudent.englishProficiency.trim() || 'Fluent (C1/C2)',
      university: newStudent.isExchange ? (newStudent.currentUniversity.trim() || newStudent.university.trim() || undefined) : (newStudent.university.trim() || undefined),
      degree: newStudent.degree.trim() || undefined,
      originalUniversity: newStudent.isExchange ? newStudent.originalUniversity.trim() || undefined : undefined,
      originalCountry: newStudent.isExchange ? normalizeNationality(newStudent.originalCountry) || undefined : undefined,
      currentUniversity: newStudent.isExchange ? newStudent.currentUniversity.trim() || undefined : undefined,
      studentType: newStudent.isExchange ? 'Erasmus' : newStudent.isInternational ? 'International' : 'Normal'
    });

    setNewStudent({
      name: '',
      email: '',
      groupName: '',
      gender: 'Female',
      isInternational: false,
      isExchange: false,
      nationality: '',
      currentCountry: '',
      englishProficiency: 'Fluent (C1/C2)',
      degree: '',
      university: '',
      currentUniversity: '',
      originalUniversity: '',
      originalCountry: ''
    });
    setIsAddStudentModalOpen(false);
  };

  // Group breakdown calculations (with natural alphanumeric sorting: Team 1, Team 2... Team 10)
  const groupStats = useMemo(() => {
    if (!currentClass) return [];
    const groupNames = Array.from(new Set(currentClass.students.map(s => s.groupName).filter(g => Boolean(g) && g !== 'Unassigned' && g !== 'None')))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    return groupNames.map(groupName => {
      const members = currentClass.students.filter(s => s.groupName === groupName);
      const completedMembers = members.filter(s => s.submitted).length;
      const isFullyCompleted = members.length > 0 && completedMembers === members.length;
      const report: GroupDiversityReport = calculateGroupReport(groupName, members);

      return {
        groupName,
        members,
        total: members.length,
        completed: completedMembers,
        isFullyCompleted,
        progressPct: members.length > 0 ? Math.round((completedMembers / members.length) * 100) : 0,
        report
      };
    });
  }, [currentClass]);

  // Unassigned / Incoming students queue awaiting team placement
  const unassignedStudents = useMemo(() => {
    if (!currentClass) return [];
    return currentClass.students.filter(s => !s.groupName || s.groupName === 'Unassigned' || s.groupName === 'None' || s.groupName.trim() === '');
  }, [currentClass]);

  // Fast direct team assignment handler for incoming students
  const handleAssignStudentToTeam = (studentId: string, targetTeam: string) => {
    if (!currentClass || !studentId || !targetTeam) return;
    if (targetTeam === '__create_new__') {
      setSelectedStudentForTeam(studentId);
      setIsAddTeamModalOpen(true);
      return;
    }
    updateStudent(currentClass.id, studentId, { groupName: targetTeam });
  };

  // Auto-assign one student to the smallest existing team
  const handleAutoAssignToSmallestTeam = (studentId: string) => {
    if (!currentClass || groupStats.length === 0) return;
    const sorted = [...groupStats].sort((a, b) => a.total - b.total);
    if (sorted[0]) {
      updateStudent(currentClass.id, studentId, { groupName: sorted[0].groupName });
    }
  };

  // Auto-balance all unassigned students across existing teams
  const handleAutoAssignAllUnassigned = () => {
    if (!currentClass || groupStats.length === 0 || unassignedStudents.length === 0) return;
    const teams = [...groupStats].map(g => ({ name: g.groupName, count: g.total }));
    unassignedStudents.forEach((student) => {
      teams.sort((a, b) => a.count - b.count);
      const chosen = teams[0];
      if (chosen) {
        updateStudent(currentClass.id, student.id, { groupName: chosen.name });
        chosen.count += 1;
      }
    });
  };

  // Overall classroom demographic aggregations for Diversity Wall
  const demographicStats = useMemo(() => {
    if (!currentClass) return null;
    const students = currentClass.students;
    const total = students.length;

    const natMap: Record<string, number> = {};
    const genderMap: Record<string, number> = { Female: 0, Male: 0, 'Non-binary': 0 };
    const englishMap: Record<string, number> = {};
    const uniMap: Record<string, number> = {};
    let exchangeCount = 0;
    let internationalCount = 0;

    students.forEach(s => {
      const nat = s.nationality || 'Unspecified';
      natMap[nat] = (natMap[nat] || 0) + 1;

      const g = s.gender || 'Female';
      if (g.toLowerCase().includes('female')) genderMap.Female = (genderMap.Female || 0) + 1;
      else if (g.toLowerCase().includes('male')) genderMap.Male = (genderMap.Male || 0) + 1;
      else genderMap['Non-binary'] = (genderMap['Non-binary'] || 0) + 1;

      const eng = s.englishProficiency || 'Fluent (C1/C2)';
      englishMap[eng] = (englishMap[eng] || 0) + 1;

      const uni = s.university || s.currentUniversity || s.originalUniversity || 'Unassigned';
      uniMap[uni] = (uniMap[uni] || 0) + 1;

      if (s.isExchange || s.studentType?.toLowerCase() === 'erasmus') exchangeCount++;
      if (s.isInternational) internationalCount++;
    });

    const sortedNationalities = Object.entries(natMap).sort((a, b) => b[1] - a[1]);
    const sortedUniversities = Object.entries(uniMap).sort((a, b) => b[1] - a[1]);
    const sortedEnglish = Object.entries(englishMap).sort((a, b) => b[1] - a[1]);

    return {
      total,
      uniqueCountriesCount: Object.keys(natMap).length,
      sortedNationalities,
      genderMap,
      sortedEnglish,
      sortedUniversities,
      exchangeCount,
      internationalCount
    };
  }, [currentClass]);

  if (!currentClass) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>No classroom found</h2>
        <button className="btn btn-primary" onClick={() => window.location.href = window.location.origin + window.location.pathname}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const totalStudents = currentClass.students.length;
  const submittedStudents = currentClass.students.filter(s => s.submitted).length;
  const submissionPct = totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0;
  const fullyCompletedGroups = groupStats.filter(g => g.isFullyCompleted).length;

  // Filtered group cards for search & status
  const filteredGroups = groupStats.filter(g => {
    if (statusFilter === 'completed' && !g.isFullyCompleted) return false;
    if (statusFilter === 'in_progress' && g.isFullyCompleted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTeam = g.groupName.toLowerCase().includes(q);
      const matchesStudent = g.members.some(m => m.name.toLowerCase().includes(q) || (m.nationality && m.nationality.toLowerCase().includes(q)));
      return matchesTeam || matchesStudent;
    }
    return true;
  });

  // Calculate live praise tag cloud
  const tagCounts: Record<string, number> = {};
  currentClass.reviews.forEach(r => {
    if (Array.isArray(r.praiseTags)) {
      r.praiseTags.forEach(tag => {
        const cleanTag = tag.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
    }
  });
  const topPraiseList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Helper to format student university text cleanly
  const renderStudentUniText = (student: Student) => {
    if (student.isExchange && student.originalUniversity && student.currentUniversity) {
      return (
        <span 
          style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          title={`Exchange: ${student.originalUniversity} ➔ ${student.currentUniversity}`}
        >
          <Plane size={11} className="text-teal" style={{ flexShrink: 0 }} />
          <span>{student.originalUniversity} ➔ {student.currentUniversity}</span>
        </span>
      );
    }
    const uni = student.university || student.currentUniversity || student.originalUniversity;
    if (uni) {
      return (
        <span 
          style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          title={uni}
        >
          <GraduationCap size={11} style={{ flexShrink: 0, opacity: 0.75 }} />
          <span>{uni}</span>
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
        University Unassigned
      </span>
    );
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        background: '#f8fafc',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 2rem',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* --- TOP HEADER & CONTROLS --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)', flexShrink: 0 }}>
            <Tv size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>
                {currentClass.name}
              </h1>
              <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#0891b2', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
                LIVE CLASSROOM MONITOR
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Real-Time Peer Assessment Tracker • {totalStudents} Students Enrolled
            </p>
          </div>
        </div>

        {/* Essential Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 800, color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            {currentTime.toLocaleTimeString()}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddTeamModalOpen(true)}
            style={{ gap: '0.35rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '0.45rem 0.85rem' }}
          >
            <Plus size={14} className="text-primary" /> Add Team
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setTargetTeamForNewStudent('');
              setIsAddStudentModalOpen(true);
            }}
            style={{ gap: '0.35rem', padding: '0.45rem 0.85rem', fontWeight: 700 }}
            title="Enroll a new student directly into this classroom"
          >
            <UserPlus size={14} /> Enroll Student
          </button>

          {!isStandalone && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenInNewWindow}
              style={{ gap: '0.35rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '0.45rem 0.85rem' }}
              title="Pop out to an external projector display"
            >
              <ExternalLink size={14} /> Pop Out
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleFullscreen}
            style={{ gap: '0.35rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '0.45rem 0.85rem' }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#dc2626',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <X size={15} /> Close
            </button>
          )}
        </div>
      </div>

      {/* --- SUB-HEADER: VIEW TABS & LIVE FILTER BAR --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Clean Mode Tab Selector */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '10px', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'matrix' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'matrix' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 150ms ease'
            }}
          >
            <LayoutGrid size={14} /> Team Matrix
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diversity')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'diversity' ? 'var(--accent-teal)' : 'transparent',
              color: activeTab === 'diversity' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 150ms ease'
            }}
          >
            <Globe size={14} /> Diversity Wall
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr_focus')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'qr_focus' ? '#0284c7' : 'transparent',
              color: activeTab === 'qr_focus' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 150ms ease'
            }}
          >
            <QrCode size={14} /> Big QR Screen
          </button>
        </div>

        {/* Matrix Filter & Search Bar */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search team or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.38rem 0.6rem 0.38rem 1.8rem',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  width: '190px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'all' ? '#ffffff' : 'transparent',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                All ({groupStats.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'in_progress' ? '#d97706' : 'transparent',
                  color: statusFilter === 'in_progress' ? '#ffffff' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Pending ({groupStats.length - fullyCompletedGroups})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'completed' ? '#0d9488' : 'transparent',
                  color: statusFilter === 'completed' ? '#ffffff' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Done ({fullyCompletedGroups})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- INCOMING & UNASSIGNED STUDENTS DOCK --- */}
      {unassignedStudents.length > 0 && (
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            border: '2px solid #f59e0b', 
            borderRadius: '14px', 
            padding: '0.85rem 1.15rem', 
            marginBottom: '1.25rem', 
            boxShadow: '0 4px 18px rgba(217, 119, 6, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', padding: '0.2rem 0.55rem' }}>
                <Users size={12} style={{ marginRight: '4px' }} /> {unassignedStudents.length} Incoming
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                New Incoming Students (Awaiting Team Assignment)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAutoAssignAllUnassigned}
                style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem' }}
                title="Automatically distribute all unassigned incoming students across existing teams"
              >
                <Zap size={13} className="text-amber" /> Auto-Balance All
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setTargetTeamForNewStudent('');
                  setIsAddStudentModalOpen(true);
                }}
                style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem' }}
              >
                <Plus size={13} /> Enroll Student
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {unassignedStudents.map((s) => (
              <div
                key={s.id}
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '0.5rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: '0.82rem', color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </b>
                  <span style={{ fontSize: '0.7rem', color: '#b45309', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.nationality || s.degree || s.email}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  <select
                    className="form-input"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignStudentToTeam(s.id, e.target.value);
                      }
                    }}
                    style={{ height: '28px', fontSize: '0.74rem', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 700, backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #f59e0b', cursor: 'pointer' }}
                  >
                    <option value="">Assign Team...</option>
                    {groupStats.map((g) => (
                      <option key={g.groupName} value={g.groupName}>
                        → {g.groupName} ({g.total} members)
                      </option>
                    ))}
                    <option value="__create_new__">+ Create New Team</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAutoAssignToSmallestTeam(s.id)}
                    title="Auto-assign to smallest team"
                    style={{
                      height: '28px',
                      padding: '0 0.4rem',
                      borderRadius: '6px',
                      border: '1px solid #f59e0b',
                      backgroundColor: '#ffffff',
                      color: '#d97706',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Zap size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STREAMLINED 3-CARD HERO METRICS RIBBON --- */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.25rem' 
        }}
      >
        {/* Metric 1: Circular Progress Gauge */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="84" height="84" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="transparent"
                stroke="url(#projGradLight)"
                strokeWidth="8"
                strokeDasharray={238.76}
                strokeDashoffset={238.76 - (238.76 * submissionPct) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="projGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ position: 'absolute', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
              {submissionPct}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Class Submissions
            </span>
            <b style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 900 }}>
              {submittedStudents} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>/ {totalStudents} completed</span>
            </b>
            <span style={{ fontSize: '0.75rem', color: submissionPct === 100 ? '#0d9488' : '#d97706', fontWeight: 700 }}>
              {totalStudents - submittedStudents === 0 ? '✨ 100% Evaluations Complete!' : `${totalStudents - submittedStudents} evaluations pending`}
            </span>
          </div>
        </div>

        {/* Metric 2: Team Breakdown Stats */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Teams Status
            </span>
            <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
              {groupStats.length} Total Teams
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <b style={{ fontSize: '1.3rem', color: '#0d9488', fontWeight: 900 }}>{fullyCompletedGroups}</b>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.35rem' }}>Completed</span>
            </div>
            <div>
              <b style={{ fontSize: '1.3rem', color: '#d97706', fontWeight: 900 }}>{groupStats.length - fullyCompletedGroups}</b>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.35rem' }}>Active</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${groupStats.length > 0 ? (fullyCompletedGroups / groupStats.length) * 100 : 0}%`, 
                backgroundColor: '#0d9488',
                transition: 'width 0.5s ease'
              }} 
            />
          </div>
        </div>

        {/* Metric 3: Quick Scan Smartphone QR Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '70px', height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Classroom Access QR" style={{ width: '100%', height: '100%', display: 'block' }} />
            ) : (
              <QrCode size={32} color="#6366f1" />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <QrCode size={14} /> Scan from Mobile
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              Scan from seat to access peer evaluation portal.
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                padding: '0.22rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                width: 'fit-content'
              }}
            >
              {copiedLink ? <Check size={11} className="text-teal" /> : <Copy size={11} />}
              {copiedLink ? 'Copied Link!' : 'Copy Portal URL'}
            </button>
          </div>
        </div>
      </div>

      {/* Accolades Ticker Banner (Displays if tags exist) */}
      {topPraiseList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 0.85rem', marginBottom: '1rem', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>
            <Award size={14} /> Live Recognition:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
            {topPraiseList.slice(0, 8).map(([tag, count]) => (
              <span 
                key={tag}
                style={{
                  backgroundColor: 'hsl(270, 100%, 96%)',
                  border: '1px solid hsl(270, 75%, 85%)',
                  color: '#7e22ce',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '14px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Zap size={10} color="#9333ea" /> {tag} <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>x{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 1: TEAM MATRIX (DEFAULT VIEW) --- */}
      {activeTab === 'matrix' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {filteredGroups.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
              <Users size={40} className="text-primary" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>No Matching Teams</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Try adjusting your search query or status filter.</p>
              </div>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', 
                gap: '1rem',
                overflowY: 'auto',
                flex: 1,
                alignContent: 'start',
                paddingBottom: '1rem',
                paddingRight: '0.25rem'
              }}
            >
              {filteredGroups.map((grp) => (
                <div 
                  key={grp.groupName}
                  style={{
                    backgroundColor: grp.isFullyCompleted ? 'hsl(150, 80%, 98%)' : '#ffffff',
                    border: `1.5px solid ${grp.isFullyCompleted ? '#10b981' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Team Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <b style={{ fontSize: '1rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {grp.groupName}
                      </b>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                        {grp.total} members
                      </span>
                    </div>

                    {grp.isFullyCompleted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0d9488', fontSize: '0.74rem', fontWeight: 800, backgroundColor: 'rgba(13, 148, 136, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '12px', flexShrink: 0 }}>
                        <CheckCheck size={13} /> 100% Done
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontSize: '0.74rem', fontWeight: 800, backgroundColor: 'rgba(217, 119, 6, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '12px', flexShrink: 0 }}>
                        <Clock size={13} /> {grp.completed} / {grp.total} Done
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${grp.progressPct}%`, 
                        backgroundColor: grp.isFullyCompleted ? '#0d9488' : '#4f46e5',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>

                  {/* Team Diversity & CEFR Metric Ribbon */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '0.25rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.3rem 0.45rem',
                      fontSize: '0.68rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', overflow: 'hidden', whiteSpace: 'nowrap' }} title={Object.entries(grp.report.genderCounts).map(([g, c]) => `${c} ${g}`).join(', ')}>
                      <Users size={11} className="text-primary" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {Object.entries(grp.report.genderCounts).map(([g, c]) => `${c}${g[0]}`).join('/')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'center' }} title={`${grp.report.uniqueNationalityCount} Countries`}>
                      <Globe size={11} className="text-teal" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {grp.report.uniqueNationalityCount} {grp.report.uniqueNationalityCount === 1 ? 'Country' : 'Countries'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'flex-end' }} title={`Avg English CEFR: ${grp.report.avgEnglishCEFR}`}>
                      <Languages size={11} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>
                        {grp.report.avgEnglishCEFR?.split(' ')[0] || 'C1'}
                      </span>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.1rem' }}>
                    {grp.members.map(member => (
                      <div 
                        key={member.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '0.4rem 0.55rem',
                          fontSize: '0.78rem',
                          gap: '0.4rem'
                        }}
                      >
                        {/* Student Name & University */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', overflow: 'hidden', minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.name}
                          </span>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {renderStudentUniText(member)}
                          </div>
                        </div>

                        {/* Right Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          {member.nationality && (
                            <span 
                              style={{ 
                                fontSize: '0.66rem', 
                                padding: '0.1rem 0.35rem', 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '4px', 
                                color: '#64748b',
                                maxWidth: '75px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={member.nationality}
                            >
                              {member.nationality}
                            </span>
                          )}
                          {member.submitted ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#0d9488', fontSize: '0.7rem', fontWeight: 800 }}>
                              <CheckCircle2 size={12} /> Done
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#d97706', fontSize: '0.7rem', fontWeight: 700 }}>
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Add Student Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetTeamForNewStudent(grp.groupName);
                      setIsAddStudentModalOpen(true);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.35rem',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      marginTop: 'auto'
                    }}
                  >
                    <Plus size={12} /> Add Student to {grp.groupName}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: DIVERSITY & GLOBAL DEMOGRAPHICS WALL --- */}
      {activeTab === 'diversity' && demographicStats && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingBottom: '1rem' }}>
          
          {/* Top Demographic Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Countries Represented</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{demographicStats.uniqueCountriesCount}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gender Balance</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {demographicStats.genderMap.Female}F / {demographicStats.genderMap.Male}M {demographicStats.genderMap['Non-binary'] > 0 ? `/ ${demographicStats.genderMap['Non-binary']}NB` : ''}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plane size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Exchange Students</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{demographicStats.exchangeCount}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Languages size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>English Skill Spread</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {demographicStats.sortedEnglish.length} CEFR Tiers
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
            {/* Nationalities Breakdown */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <Globe size={16} className="text-teal" /> Nationality &amp; Geographic Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                {demographicStats.sortedNationalities.map(([nat, count]) => {
                  const pct = Math.round((count / demographicStats.total) * 100);
                  return (
                    <div key={nat} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{nat}</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0d9488', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Academic Institutions Representation */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <GraduationCap size={16} className="text-indigo" /> Academic Institutions Represented
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                {demographicStats.sortedUniversities.map(([uni, count]) => {
                  const pct = Math.round((count / demographicStats.total) * 100);
                  return (
                    <div key={uni} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{uni}</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: BIG SCREEN QR CODE ACCESS FOCUS --- */}
      {activeTab === 'qr_focus' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textAlign: 'center' }}>
          <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              CLASSROOM ACCESS PORTAL
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Scan from your Mobile Device
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0 }}>
              Point your smartphone camera at the QR code below to enroll, view your group, and submit your peer evaluations.
            </p>

            {/* Giant QR Card */}
            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Classroom Access QR" style={{ width: '280px', height: '280px', display: 'block' }} />
              ) : (
                <QrCode size={200} color="#4f46e5" />
              )}
            </div>

            {/* URL Display and Copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '440px' }}>
              <input
                type="text"
                readOnly
                value={enrollUrl}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  textAlign: 'center'
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopyLink}
                style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 700, gap: '0.35rem' }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER PRIVACY NOTICE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#0d9488" /> Privacy Protected: Confidential student scores, marks, and personal feedback are strictly hidden.
        </span>
        <span>PeerLens Broadcast &amp; Projector Studio</span>
      </div>

      {/* --- MODAL: QUICK ADD TEAM --- */}
      {isAddTeamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTeamModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', backgroundColor: '#ffffff', color: '#0f172a' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#0f172a' }}>Create New Team</h3>
              <button className="modal-close" onClick={() => setIsAddTeamModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Team / Group Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Team Alpha or Group 7"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Assign Existing Student (Optional)</label>
                  <select
                    className="form-select"
                    value={selectedStudentForTeam}
                    onChange={(e) => setSelectedStudentForTeam(e.target.value)}
                  >
                    <option value="">-- None (Create Empty Team) --</option>
                    {currentClass.students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Current: {s.groupName || 'Unassigned'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTeamModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: QUICK ENROLL STUDENT --- */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        title={`Enroll Participant in ${targetTeamForNewStudent || 'Class'}`}
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleQuickAddStudent} style={{ gap: '0.35rem', fontWeight: 700 }}>
              <Plus size={15} /> Enroll Student
            </button>
          </div>
        }
      >
        <form onSubmit={handleQuickAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
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
                  placeholder="e.g. Alex Morgan" 
                  className="form-input" 
                  required
                  autoFocus
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Institutional Email
                </label>
                <input 
                  type="email" 
                  placeholder="e.g. alex.morgan@university.edu" 
                  className="form-input" 
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Assigned Team
              </label>
              <select
                className="form-select"
                value={newStudent.groupName || targetTeamForNewStudent}
                onChange={(e) => {
                  setNewStudent(prev => ({ ...prev, groupName: e.target.value }));
                  setTargetTeamForNewStudent(e.target.value);
                }}
                style={{ height: '38px', fontSize: '0.84rem', padding: '0 2.25rem 0 0.85rem', backgroundColor: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              >
                {groupStats.map(g => (
                  <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                ))}
                <option value="New Team">Create New Team...</option>
              </select>
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
                  onChange={(e) => setNewStudent(prev => ({ ...prev, isInternational: e.target.checked }))}
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
                    currentCountry: prev.currentCountry || val
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
    </div>
  );
};

export default ProjectorView;
