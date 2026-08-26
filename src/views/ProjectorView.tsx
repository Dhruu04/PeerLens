import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Users, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  ExternalLink,
  Plus,
  UserPlus
} from 'lucide-react';
import QRCode from 'qrcode';
import { useClass } from '../context/ClassContext';
import type { ClassData } from '../utils/math';

interface ProjectorViewProps {
  classData?: ClassData;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  classData: propClassData,
  onClose,
  isStandalone = false
}) => {
  const { classes, activeClass, updateStudent, addStudent } = useClass();
  const currentClass = propClassData || activeClass || classes[0];

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Dynamic Add Team & Add Student Modal State
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedStudentForTeam, setSelectedStudentForTeam] = useState<string>('');

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [targetTeamForNewStudent, setTargetTeamForNewStudent] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGender, setNewStudentGender] = useState('Female');
  const [newStudentNationality, setNewStudentNationality] = useState('United States');

  const enrollUrl = currentClass 
    ? `${window.location.origin}${window.location.pathname}?enrollClassId=${currentClass.id}`
    : '';

  // Clock ticker & QR Generator
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    if (enrollUrl) {
      QRCode.toDataURL(enrollUrl, {
        width: 440,
        margin: 1,
        color: { 
          dark: isDarkTheme ? '#090d16' : '#1e1b4b', 
          light: '#ffffff' 
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }

    return () => clearInterval(timer);
  }, [enrollUrl, isDarkTheme]);

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
    window.open(url, '_blank', 'width=1280,height=800,menubar=no,toolbar=no,location=no');
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
    if (!currentClass || !newStudentName.trim()) return;
    const autoId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    addStudent(currentClass.id, {
      id: autoId,
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      groupName: targetTeamForNewStudent || 'Team 1',
      gender: newStudentGender,
      nationality: newStudentNationality,
      englishProficiency: 'Fluent (C1/C2)'
    });
    setNewStudentName('');
    setNewStudentEmail('');
    setIsAddStudentModalOpen(false);
  };

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

  // Group breakdown calculations (with natural alphanumeric sorting: Team 1, Team 2... Team 10)
  const groupNames = Array.from(new Set(currentClass.students.map(s => s.groupName).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const groupStats = groupNames.map(groupName => {
    const members = currentClass.students.filter(s => s.groupName === groupName);
    const completedMembers = members.filter(s => s.submitted).length;
    const isFullyCompleted = members.length > 0 && completedMembers === members.length;
    return {
      groupName,
      members,
      total: members.length,
      completed: completedMembers,
      isFullyCompleted,
      progressPct: members.length > 0 ? Math.round((completedMembers / members.length) * 100) : 0
    };
  });

  const fullyCompletedGroups = groupStats.filter(g => g.isFullyCompleted).length;

  // Calculate live praise tag cloud across all submitted reviews
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

  // Dynamic Theme Styling
  const bg = isDarkTheme ? '#090d16' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)';
  const textPrimary = isDarkTheme ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkTheme ? '#94a3b8' : '#64748b';
  const cardBg = isDarkTheme ? '#131b2e' : '#ffffff';
  const cardBorder = isDarkTheme ? '#1e293b' : '#e2e8f0';
  const cardShadow = isDarkTheme ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)';
  const trackBg = isDarkTheme ? '#1e293b' : '#e2e8f0';
  const miniCardBg = isDarkTheme ? '#0f172a' : '#f8fafc';

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        background: bg,
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 2rem',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      {/* --- TOP HEADER & CONTROLS --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)' }}>
            <Sparkles size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: textPrimary, letterSpacing: '-0.025em' }}>
                {currentClass.name}
              </h1>
              <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#0891b2', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
                LIVE CLASSROOM MONITOR
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: textSecondary }}>
              Real-Time Peer Assessment &amp; Team Collaboration Tracker
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: textSecondary, boxShadow: cardShadow }}>
            {currentTime.toLocaleTimeString()}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddTeamModalOpen(true)}
            style={{ gap: '0.35rem', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, padding: '0.45rem 0.85rem', boxShadow: cardShadow }}
          >
            <Plus size={14} className="text-primary" /> Add Team
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddStudentModalOpen(true)}
            style={{ gap: '0.35rem', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, padding: '0.45rem 0.85rem', boxShadow: cardShadow }}
          >
            <UserPlus size={14} className="text-teal" /> Enroll Student
          </button>

          {!isStandalone && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenInNewWindow}
              style={{ gap: '0.35rem', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, padding: '0.45rem 0.85rem', boxShadow: cardShadow }}
              title="Pop out Live Projector to an external monitor or projector screen"
            >
              <ExternalLink size={14} /> Pop Out
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsDarkTheme(prev => !prev)}
            style={{ gap: '0.35rem', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, padding: '0.45rem 0.85rem', boxShadow: cardShadow }}
            title="Toggle Light / Dark Theme"
          >
            {isDarkTheme ? <Sun size={14} className="text-amber" /> : <Moon size={14} className="text-indigo" />}
            <span>{isDarkTheme ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleFullscreen}
            style={{ gap: '0.35rem', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, padding: '0.45rem 0.85rem', boxShadow: cardShadow }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
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

      {/* --- HERO METRICS RIBBON (FULL WIDTH - NO DEAD SPACE) --- */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.25rem' 
        }}
      >
        {/* Metric 1: Circular Progress Gauge */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: cardShadow }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="38" fill="transparent" stroke={trackBg} strokeWidth="8" />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="transparent"
                stroke="url(#projGrad)"
                strokeWidth="8"
                strokeDasharray={238.76}
                strokeDashoffset={238.76 - (238.76 * submissionPct) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="projGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ position: 'absolute', fontSize: '1.35rem', fontWeight: 900, color: textPrimary }}>
              {submissionPct}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completion Rate
            </span>
            <b style={{ fontSize: '1.35rem', color: textPrimary, fontWeight: 900 }}>
              {submittedStudents} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: textSecondary }}>/ {totalStudents} submitted</span>
            </b>
            <span style={{ fontSize: '0.75rem', color: submissionPct === 100 ? '#0d9488' : '#d97706', fontWeight: 700 }}>
              {totalStudents - submittedStudents === 0 ? 'All submissions complete!' : `${totalStudents - submittedStudents} evaluations pending`}
            </span>
          </div>
        </div>

        {/* Metric 2: Team Breakdown Stats */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', boxShadow: cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Teams Status
            </span>
            <span className="badge badge-teal" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
              {groupStats.length} Total Teams
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <b style={{ fontSize: '1.35rem', color: '#0d9488', fontWeight: 900 }}>{fullyCompletedGroups}</b>
              <span style={{ fontSize: '0.75rem', color: textSecondary, marginLeft: '0.35rem' }}>Finished</span>
            </div>
            <div>
              <b style={{ fontSize: '1.35rem', color: '#d97706', fontWeight: 900 }}>{groupStats.length - fullyCompletedGroups}</b>
              <span style={{ fontSize: '0.75rem', color: textSecondary, marginLeft: '0.35rem' }}>In Progress</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '7px', backgroundColor: trackBg, borderRadius: '4px', overflow: 'hidden' }}>
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
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: cardShadow }}>
          <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '74px', height: '74px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Classroom Access QR" style={{ width: '100%', height: '100%', display: 'block' }} />
            ) : (
              <QrCode size={32} color="#6366f1" />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <QrCode size={14} /> Scan from Phone
            </span>
            <span style={{ fontSize: '0.72rem', color: textSecondary, lineHeight: 1.3 }}>
              Scan from seat to access peer evaluation portal.
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: miniCardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '5px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: textPrimary,
                cursor: 'pointer',
                width: 'fit-content'
              }}
            >
              {copiedLink ? <Check size={11} className="text-teal" /> : <Copy size={11} />}
              {copiedLink ? 'Copied!' : 'Copy Portal URL'}
            </button>
          </div>
        </div>

        {/* Metric 4: Accolades & Praise Cloud */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: cardShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 800 }}>
            <Award size={15} /> Real-Time Peer Recognition
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', overflowY: 'auto', maxHeight: '60px' }}>
            {topPraiseList.length === 0 ? (
              <span style={{ fontSize: '0.72rem', color: textSecondary, fontStyle: 'italic' }}>
                Recognition tags appear live as reviews are submitted...
              </span>
            ) : (
              topPraiseList.slice(0, 6).map(([tag, count]) => (
                <span 
                  key={tag}
                  style={{
                    backgroundColor: isDarkTheme ? 'rgba(99, 102, 241, 0.15)' : 'hsl(243, 100%, 96%)',
                    border: `1px solid ${isDarkTheme ? 'rgba(99, 102, 241, 0.3)' : 'hsl(243, 75%, 85%)'}`,
                    color: isDarkTheme ? '#c7d2fe' : '#4338ca',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '16px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Zap size={10} color={isDarkTheme ? '#818cf8' : '#4f46e5'} /> {tag} <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>x{count}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- FLUID FULL-WIDTH TEAMS GRID (FILLS 100% OF AVAILABLE SPACE) --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={18} className="text-teal" /> Team Completion Matrix ({groupStats.length} Teams)
          </span>
          <span style={{ fontSize: '0.75rem', color: textSecondary }}>
            Updated live with anonymous peer review indicators
          </span>
        </div>

        {groupStats.length === 0 ? (
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            <Users size={40} className="text-primary" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>No Teams Formed Yet</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: textSecondary }}>Create teams or run Intelligent Auto-Grouping to populate this live monitor.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddTeamModalOpen(true)}>
              <Plus size={16} /> Create First Team
            </button>
          </div>
        ) : (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1rem',
              overflowY: 'auto',
              flex: 1,
              alignContent: 'start',
              paddingBottom: '1rem'
            }}
          >
            {groupStats.map((grp) => (
              <div 
                key={grp.groupName}
                style={{
                  backgroundColor: grp.isFullyCompleted ? (isDarkTheme ? 'rgba(20, 184, 166, 0.12)' : 'hsl(173, 80%, 97%)') : cardBg,
                  border: `1.5px solid ${grp.isFullyCompleted ? '#0d9488' : cardBorder}`,
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: cardShadow,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Team Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <b style={{ fontSize: '1.05rem', color: textPrimary }}>{grp.groupName}</b>
                    <span style={{ fontSize: '0.75rem', color: textSecondary }}>({grp.total} members)</span>
                  </div>

                  {grp.isFullyCompleted ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0d9488', fontSize: '0.78rem', fontWeight: 800, backgroundColor: 'rgba(13, 148, 136, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                      <CheckCircle2 size={13} /> 100% Done
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontSize: '0.78rem', fontWeight: 800, backgroundColor: 'rgba(217, 119, 6, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                      <Clock size={13} /> {grp.completed} / {grp.total}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '7px', backgroundColor: trackBg, borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${grp.progressPct}%`, 
                      backgroundColor: grp.isFullyCompleted ? '#0d9488' : '#6366f1',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>

                {/* Team Member Cards (Clean & Privacy-Safe) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {grp.members.map(member => (
                    <div 
                      key={member.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: miniCardBg,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: '6px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: textPrimary }}>
                        {member.name}
                      </span>
                      {member.submitted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0d9488', fontSize: '0.72rem', fontWeight: 700 }}>
                          <CheckCircle2 size={12} /> Submitted
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontSize: '0.72rem', fontWeight: 600 }}>
                          <Clock size={12} /> In Progress
                        </span>
                      )}
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
                    border: `1px dashed ${cardBorder}`,
                    borderRadius: '6px',
                    padding: '0.35rem',
                    fontSize: '0.72rem',
                    color: textSecondary,
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

      {/* --- FOOTER PRIVACY NOTICE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${cardBorder}`, fontSize: '0.75rem', color: textSecondary }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#0d9488" /> Privacy Protected Live Presentation: Confidential student marks, grades, and peer reviews are strictly hidden.
        </span>
        <span>PeerLens Real-Time Classroom Experience</span>
      </div>

      {/* --- MODAL: QUICK ADD TEAM --- */}
      {isAddTeamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTeamModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Team</h3>
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
      {isAddStudentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddStudentModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Enroll Student in {targetTeamForNewStudent || 'Class'}</h3>
              <button className="modal-close" onClick={() => setIsAddStudentModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleQuickAddStudent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Full Student Name <span className="text-rose">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Morgan"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Student Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. alex.morgan@university.edu"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Assigned Team</label>
                    <select
                      className="form-select"
                      value={targetTeamForNewStudent}
                      onChange={(e) => setTargetTeamForNewStudent(e.target.value)}
                    >
                      {groupNames.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="New Team">Create New Team...</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Gender</label>
                    <select
                      className="form-select"
                      value={newStudentGender}
                      onChange={(e) => setNewStudentGender(e.target.value)}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-Binary">Non-Binary</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Nationality</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. United States, India, Brazil..."
                    value={newStudentNationality}
                    onChange={(e) => setNewStudentNationality(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddStudentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectorView;
