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
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import type { ClassData } from '../utils/math';

interface ClassroomProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  enrollUrl: string;
}

export const ClassroomProjectorModal: React.FC<ClassroomProjectorModalProps> = ({
  isOpen,
  onClose,
  classData,
  enrollUrl
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Clock ticker & QR Generator
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    if (enrollUrl) {
      QRCode.toDataURL(enrollUrl, {
        width: 480,
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
  }, [isOpen, enrollUrl, isDarkTheme]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    navigator.clipboard.writeText(enrollUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const totalStudents = classData.students.length;
  const submittedStudents = classData.students.filter(s => s.submitted).length;
  const submissionPct = totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0;

  // Group breakdown calculations
  const groupNames = Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean))).sort();
  const groupStats = groupNames.map(groupName => {
    const members = classData.students.filter(s => s.groupName === groupName);
    const completedMembers = members.filter(s => s.submitted).length;
    const isFullyCompleted = members.length > 0 && completedMembers === members.length;
    return {
      groupName,
      total: members.length,
      completed: completedMembers,
      isFullyCompleted,
      progressPct: members.length > 0 ? Math.round((completedMembers / members.length) * 100) : 0
    };
  });

  // Calculate live praise tag cloud across all submitted reviews
  const tagCounts: Record<string, number> = {};
  classData.reviews.forEach(r => {
    if (Array.isArray(r.praiseTags)) {
      r.praiseTags.forEach(tag => {
        const cleanTag = tag.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
    }
  });
  const topPraiseList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Dynamic Theme Colors
  const bg = isDarkTheme ? '#090d16' : 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 50%, #f1f5f9 100%)';
  const textPrimary = isDarkTheme ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkTheme ? '#94a3b8' : '#64748b';
  const cardBg = isDarkTheme ? '#131b2e' : '#ffffff';
  const cardBorder = isDarkTheme ? '#1e293b' : '#e2e8f0';
  const cardShadow = isDarkTheme ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)';
  const trackBg = isDarkTheme ? '#1e293b' : '#e2e8f0';
  const miniCardBg = isDarkTheme ? '#0f172a' : '#f8fafc';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bg,
        color: textPrimary,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 2.25rem',
        overflowY: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      {/* --- TOP BANNER & CONTROLS --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)' }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: textPrimary, letterSpacing: '-0.025em' }}>
                {classData.name}
              </h1>
              <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#0891b2', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
                LIVE CLASSROOM MONITOR
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: textSecondary }}>
              Real-time Peer Evaluation &amp; Collaboration Progress
            </p>
          </div>
        </div>

        {/* Action Buttons (Theme Toggle, Fullscreen, Clock, Exit) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '8px', padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700, color: textSecondary, boxShadow: cardShadow }}>
            {currentTime.toLocaleTimeString()}
          </div>

          <button
            type="button"
            onClick={() => setIsDarkTheme(prev => !prev)}
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '8px',
              color: textPrimary,
              padding: '0.5rem 0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: cardShadow
            }}
            title="Toggle Light / Dark Theme"
          >
            {isDarkTheme ? <Sun size={15} className="text-amber" /> : <Moon size={15} className="text-indigo" />}
            <span>{isDarkTheme ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '8px',
              color: textPrimary,
              padding: '0.5rem 0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: cardShadow
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#dc2626',
              padding: '0.5rem 0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <X size={16} /> Exit
          </button>
        </div>
      </div>

      {/* --- MAIN DASHBOARD GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: '1.5rem', flex: 1 }}>
        
        {/* LEFT COLUMN: LIVE SUBMISSION PROGRESS RING & QR CODE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Progress Circular Hero */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: cardShadow }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              Submission Completion Rate
            </span>

            {/* Circular Progress Meter */}
            <div style={{ position: 'relative', width: '175px', height: '175px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="175" height="175" viewBox="0 0 175 175" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="87.5"
                  cy="87.5"
                  r="72"
                  fill="transparent"
                  stroke={trackBg}
                  strokeWidth="14"
                />
                <circle
                  cx="87.5"
                  cy="87.5"
                  r="72"
                  fill="transparent"
                  stroke="url(#progressGrad)"
                  strokeWidth="14"
                  strokeDasharray={452.4}
                  strokeDashoffset={452.4 - (452.4 * submissionPct) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 900, color: textPrimary, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {submissionPct}%
                </span>
                <span style={{ fontSize: '0.78rem', color: textSecondary, fontWeight: 700, marginTop: '4px' }}>
                  {submittedStudents} / {totalStudents} Submitted
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', marginTop: '1.5rem', borderTop: `1px solid ${cardBorder}`, paddingTop: '1rem', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, display: 'block', fontWeight: 600 }}>ENROLLED</span>
                <b style={{ fontSize: '1.25rem', color: textPrimary, fontWeight: 900 }}>{totalStudents}</b>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, display: 'block', fontWeight: 600 }}>COMPLETED</span>
                <b style={{ fontSize: '1.25rem', color: '#0d9488', fontWeight: 900 }}>{submittedStudents}</b>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, display: 'block', fontWeight: 600 }}>PENDING</span>
                <b style={{ fontSize: '1.25rem', color: '#d97706', fontWeight: 900 }}>{totalStudents - submittedStudents}</b>
              </div>
            </div>
          </div>

          {/* QR Code Quick Scan for Students */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <QrCode size={16} /> Scan with Smartphone Camera
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '0.75rem', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Classroom Access QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
              ) : (
                <div style={{ fontSize: '0.75rem', color: textSecondary }}>Generating QR...</div>
              )}
            </div>

            <span style={{ fontSize: '0.78rem', color: textSecondary, maxWidth: '280px', lineHeight: 1.45, marginBottom: '0.75rem' }}>
              Scan from your seat to register or access your anonymous peer evaluation portal.
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: miniCardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: textPrimary,
                cursor: 'pointer'
              }}
            >
              {copiedLink ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
              {copiedLink ? 'Portal Link Copied!' : 'Copy Portal URL'}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE TEAM COMPLETION MATRIX & PRAISE TAGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Teams Status Board */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} className="text-teal" /> Team Submissions Status ({groupStats.length} Teams)
              </span>
              <span style={{ fontSize: '0.75rem', color: textSecondary, fontWeight: 500 }}>
                Live auto-updating feed
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem', overflowY: 'auto', maxHeight: '380px', paddingRight: '0.25rem' }}>
              {groupStats.map((grp) => (
                <div 
                  key={grp.groupName}
                  style={{
                    backgroundColor: grp.isFullyCompleted ? (isDarkTheme ? 'rgba(20, 184, 166, 0.15)' : 'hsl(173, 80%, 96%)') : miniCardBg,
                    border: `1px solid ${grp.isFullyCompleted ? '#0d9488' : cardBorder}`,
                    borderRadius: '10px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '0.88rem', color: textPrimary }}>{grp.groupName}</b>
                    {grp.isFullyCompleted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0d9488', fontSize: '0.72rem', fontWeight: 800 }}>
                        <CheckCircle2 size={13} /> 100% Done
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontSize: '0.72rem', fontWeight: 700 }}>
                        <Clock size={13} /> {grp.completed}/{grp.total}
                      </span>
                    )}
                  </div>

                  {/* Team mini progress bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: trackBg, borderRadius: '4px', overflow: 'hidden' }}>
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
                </div>
              ))}
            </div>
          </div>

          {/* Live Praise & Recognition Cloud */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '1.25rem 1.5rem', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <Award size={16} /> Anonymous Recognition &amp; Accolades Cloud
            </div>

            {topPraiseList.length === 0 ? (
              <div style={{ color: textSecondary, fontSize: '0.82rem', fontStyle: 'italic' }}>
                Recognition tags will populate live as teammates submit evaluations...
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {topPraiseList.map(([tag, count]) => (
                  <span 
                    key={tag}
                    style={{
                      backgroundColor: isDarkTheme ? 'rgba(99, 102, 241, 0.15)' : 'hsl(243, 100%, 96%)',
                      border: `1px solid ${isDarkTheme ? 'rgba(99, 102, 241, 0.3)' : 'hsl(243, 75%, 85%)'}`,
                      color: isDarkTheme ? '#c7d2fe' : '#4338ca',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Zap size={12} color={isDarkTheme ? '#818cf8' : '#4f46e5'} /> {tag} <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>x{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* --- FOOTER PRIVACY NOTICE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: `1px solid ${cardBorder}`, fontSize: '0.75rem', color: textSecondary }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#0d9488" /> Privacy Protected Mode: Individual grades, scores, and confidential comments are hidden.
        </span>
        <span>PeerLens Live Classroom Presentation Mode</span>
      </div>
    </div>
  );
};

export default ClassroomProjectorModal;
