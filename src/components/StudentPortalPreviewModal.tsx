import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ExternalLink, Smartphone, Wifi, Lock, Unlock, RefreshCw, Shuffle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import type { Student, ClassData } from '../utils/math';
import { getEvaluationControls } from '../utils/math';
import { useClass } from '../context/ClassContext';
import StudentPortal from '../views/StudentPortal';
import CustomSelect from './CustomSelect';
import FeatureInfoButton from './FeatureInfoButton';

interface StudentPortalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classroom: ClassData | null;
}

export const StudentPortalPreviewModal: React.FC<StudentPortalPreviewModalProps> = ({
  isOpen,
  onClose,
  student,
  classroom
}) => {
  const { updateEvaluationControls } = useClass();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
    }
  }, [student]);

  // Strictly disable background scrolling when modal is open, but allow scrolling inside scrollable containers
  useEffect(() => {
    if (isOpen) {
      const origBody = document.body.style.overflow;
      const origHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const isScrollable = (target: HTMLElement | null): boolean => {
        if (!target) return false;
        if (
          target.closest('.smartphone-simulator-screen') ||
          target.closest('.custom-select-dropdown') ||
          target.closest('.custom-select-container') ||
          target.closest('[role="listbox"]') ||
          target.closest('.custom-select-option') ||
          target.closest('.modal-overlay') ||
          target.closest('.modal-content') ||
          target.closest('.modal-body') ||
          target.closest('[role="dialog"]')
        ) {
          return true;
        }
        let el: HTMLElement | null = target;
        while (el && el !== document.body) {
          const style = window.getComputedStyle(el);
          if (['auto', 'scroll'].includes(style.overflowY) && el.scrollHeight > el.clientHeight) {
            return true;
          }
          el = el.parentElement;
        }
        return false;
      };

      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement | null;
        if (isScrollable(target)) {
          return; // Allow natural scrolling inside dropdown and smartphone screen!
        }
        e.preventDefault();
      };

      const handleTouch = (e: TouchEvent) => {
        const target = e.target as HTMLElement | null;
        if (isScrollable(target)) {
          return;
        }
        e.preventDefault();
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('touchmove', handleTouch, { passive: false });

      return () => {
        document.body.style.overflow = origBody;
        document.documentElement.style.overflow = origHtml;
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchmove', handleTouch);
      };
    }
  }, [isOpen]);

  if (!isOpen || !classroom) return null;

  const currentStudent = classroom.students.find(s => s.id === selectedStudentId) || student || classroom.students[0];
  if (!currentStudent) return null;

  const evalControls = getEvaluationControls(classroom);

  const studentOptions = classroom.students.map(s => ({
    value: s.id,
    label: s.name,
    sublabel: s.groupName ? `Team: ${s.groupName}` : 'Unassigned',
    badge: s.groupName || 'Solo'
  }));

  const openInNewTab = () => {
    const url = `${window.location.origin}${window.location.pathname}?classId=${classroom.id}&studentId=${currentStudent.id}`;
    window.open(url, '_blank');
  };

  const handleToggleLock = () => {
    updateEvaluationControls(classroom.id, {
      unlockMainPeerReview: !evalControls.unlockMainPeerReview
    });
    setRefreshKey(k => k + 1);
  };

  const currentStudentIndex = classroom.students.findIndex(s => s.id === currentStudent.id);

  const handlePrevStudent = () => {
    if (!classroom?.students?.length) return;
    const prevIdx = currentStudentIndex > 0 ? currentStudentIndex - 1 : classroom.students.length - 1;
    setSelectedStudentId(classroom.students[prevIdx].id);
    setRefreshKey(k => k + 1);
  };

  const handleNextStudent = () => {
    if (!classroom?.students?.length) return;
    const nextIdx = currentStudentIndex < classroom.students.length - 1 ? currentStudentIndex + 1 : 0;
    setSelectedStudentId(classroom.students[nextIdx].id);
    setRefreshKey(k => k + 1);
  };

  const handleRandomStudent = () => {
    if (!classroom?.students?.length) return;
    const pool = classroom.students.filter(s => s.id !== currentStudent.id);
    const candidate = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : classroom.students[0];
    if (candidate) {
      setSelectedStudentId(candidate.id);
      setRefreshKey(k => k + 1);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 10005,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.65rem',
        overflow: 'hidden'
      }}
    >
      {/* Top Simulator Control Bar — Clean 2-Tier Layout with Zero Overlap */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '392px',
          maxWidth: 'calc(100vw - 28px)',
          marginBottom: '0.55rem',
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '0.55rem 0.75rem',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text-primary)',
          flexShrink: 0,
          gap: '0.45rem',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 50
        }}
      >
        {/* Tier 1: Title, Guide Button, and Action Group */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <Smartphone size={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                Student Simulator
              </span>
              <FeatureInfoButton featureId="eval-simulator" size="sm" tooltipText="Student View Simulator Guide" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            {/* Random student switcher */}
            <button
              type="button"
              onClick={handleRandomStudent}
              title="Switch to random student (Quick test different perspectives)"
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '7px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.28rem 0.45rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                transition: 'all 0.15s ease'
              }}
            >
              <Shuffle size={11} className="text-primary" />
              <span>Random</span>
            </button>

            {/* Refresh Screen */}
            <button
              type="button"
              onClick={() => setRefreshKey(k => k + 1)}
              title="Reload phone portal screen"
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '7px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.28rem 0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={12} />
            </button>

            {/* External Tab Link */}
            <button
              type="button"
              onClick={openInNewTab}
              title="Open student portal in standalone mobile tab"
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '7px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.28rem 0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <ExternalLink size={12} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.10)',
                border: '1px solid rgba(239, 68, 68, 0.20)',
                borderRadius: '7px',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '0.28rem 0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Close Preview Simulator"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Tier 2: Real-Time Round Toggle & Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem' }}>
          {/* Quick Real-Time Round Unlock/Lock Switcher */}
          <button
            type="button"
            onClick={handleToggleLock}
            title={evalControls.unlockMainPeerReview ? "Round is currently OPEN for students. Click to simulate LOCKED round." : "Round is currently LOCKED for students. Click to simulate OPEN round."}
            style={{
              height: '28px',
              padding: '0 0.5rem',
              borderRadius: '7px',
              fontSize: '0.71rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              backgroundColor: evalControls.unlockMainPeerReview ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: evalControls.unlockMainPeerReview ? '#059669' : '#dc2626',
              border: `1px solid ${evalControls.unlockMainPeerReview ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 150ms ease'
            }}
          >
            {evalControls.unlockMainPeerReview ? <Unlock size={11} className="text-emerald" /> : <Lock size={11} className="text-rose" />}
            <span>{evalControls.unlockMainPeerReview ? 'Round Open' : 'Round Locked'}</span>
          </button>

          {/* Stepper Prev Button */}
          <button
            type="button"
            onClick={handlePrevStudent}
            title="Previous student persona"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronLeft size={13} />
          </button>

          {/* Quick Student Switcher Dropdown - Expands across remaining width */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 60 }}>
            <CustomSelect
              value={currentStudent.id}
              onChange={(val) => {
                setSelectedStudentId(val);
                setRefreshKey(k => k + 1);
              }}
              options={studentOptions}
              searchable={true}
              searchPlaceholder="Search student or team..."
              triggerLabel={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentStudent.name}</span>
                  <span style={{ opacity: 0.75, fontWeight: 500, fontSize: '0.69rem', color: 'var(--text-secondary)' }}>
                    ({currentStudent.groupName || 'Unassigned'})
                  </span>
                </span>
              }
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.15rem 0.25rem 0.35rem 0.25rem', fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Switch Student Persona</span>
                  <span>{classroom.students.length} Total</span>
                </div>
              }
              triggerStyle={{
                height: '28px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0 0.5rem',
                width: '100%',
                boxSizing: 'border-box'
              }}
              dropdownAlign="right"
              dropDirection="down"
              dropdownMinWidth="260px"
              dropdownMaxWidth="340px"
              dropdownStyle={{
                zIndex: 100000,
                maxHeight: '300px',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-color)',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '6px',
                overflowY: 'auto'
              }}
              title="Switch previewing student persona (Scroll or use Up/Down arrows to navigate)"
            />
          </div>

          {/* Stepper Next Button */}
          <button
            type="button"
            onClick={handleNextStudent}
            title="Next student persona"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Realistic Smartphone Chassis — Precision Titanium Bezel with Dynamic Island */}
      <div
        className="smartphone-chassis"
        onClick={e => e.stopPropagation()}
        style={{
          width: '392px',
          maxWidth: 'calc(100vw - 28px)',
          height: 'min(820px, calc(96vh - 90px))',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '48px',
          border: '4px solid #1e293b',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Phone Status Bar & Dynamic Island */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.65rem 1.35rem 0.4rem 1.35rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100,
            flexShrink: 0
          }}
        >
          {/* Time (Apple SF Pro Style) */}
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', width: '42px' }}>
            9:41
          </span>

          {/* Dynamic Island Capsule */}
          <div
            style={{
              width: '110px',
              height: '24px',
              backgroundColor: '#000000',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Front camera lens with reflective aperture */}
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#0f172a', border: '1.5px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#38bdf8', opacity: 0.8 }} />
            </div>

            {/* Subtle mic/speaker slit */}
            <div style={{ width: '30px', height: '2px', borderRadius: '2px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

            {/* Sensor dot */}
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1e1b4b', border: '1px solid #312e81' }} />
          </div>

          {/* Status Icons: Wi-Fi, 5G, Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', width: '48px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: '-0.04em' }}>5G</span>
            <Wifi size={12} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <div style={{ width: '18px', height: '9px', borderRadius: '3px', border: '1px solid var(--text-secondary)', padding: '1px', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '1.5px', backgroundColor: '#10b981' }} />
              </div>
              <div style={{ width: '1.5px', height: '4px', backgroundColor: 'var(--text-secondary)', borderRadius: '0 1px 1px 0' }} />
            </div>
          </div>
        </div>

        {/* Real Live Student Portal Screen Container */}
        <div
          className="smartphone-simulator-screen"
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--bg-app)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .smartphone-simulator-screen::-webkit-scrollbar {
              display: none !important;
            }
            .smartphone-simulator-screen .student-portal-root {
              padding: 0.5rem 0.65rem 4rem 0.65rem !important;
              max-width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            .smartphone-simulator-screen .main-content {
              padding: 0.5rem 0.15rem 4rem 0.15rem !important;
              max-width: 100% !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            .smartphone-simulator-screen h1 {
              font-size: 1.22rem !important;
              line-height: 1.25 !important;
            }
            .smartphone-simulator-screen h2 {
              font-size: 1.08rem !important;
              line-height: 1.25 !important;
            }
            .smartphone-simulator-screen .card,
            .smartphone-simulator-screen .card-premium {
              padding: 0.85rem 0.75rem !important;
              border-radius: 13px !important;
              margin-bottom: 0.75rem !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            .smartphone-simulator-screen .analytics-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 1rem !important;
              width: 100% !important;
            }
            .smartphone-simulator-screen .analytics-col-left,
            .smartphone-simulator-screen .analytics-col-right {
              width: 100% !important;
              max-width: 100% !important;
            }
            .smartphone-simulator-screen .student-dashboard-content {
              width: 100% !important;
              max-width: 100% !important;
              gap: 0.75rem !important;
            }
            .smartphone-simulator-screen .score-fine-tuner {
              padding: 0.65rem !important;
            }
            .smartphone-simulator-screen .card-navigation-bar {
              margin-top: 0.35rem !important;
              bottom: 0.35rem !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 0.4rem !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid .kpi-tile {
              padding: 0.55rem 0.2rem !important;
              border-radius: 9px !important;
              min-width: 0 !important;
              width: 100% !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid .kpi-label {
              font-size: 0.58rem !important;
              letter-spacing: 0.01em !important;
              line-height: 1.15 !important;
              height: 20px !important;
              text-align: center !important;
              white-space: normal !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              max-width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid .kpi-number {
              font-size: 1.15rem !important;
              line-height: 1.15 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 100% !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid .kpi-number.kpi-text-value {
              font-size: 0.92rem !important;
            }
            .smartphone-simulator-screen .kpi-stats-grid .kpi-subtext {
              font-size: 0.55rem !important;
              line-height: 1.15 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 100% !important;
              width: 100% !important;
              text-align: center !important;
            }
            .smartphone-simulator-screen .subpeer-active-banner-btn {
              width: 100% !important;
              justify-content: center !important;
            }
          ` }} />

          {/* Render the EXACT, authentic StudentPortal component */}
          <StudentPortal
            key={refreshKey}
            classId={classroom.id}
            studentId={currentStudent.id}
            isPreview={true}
          />
        </div>

        {/* Smartphone Bottom Home Bar */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderTop: '1px solid var(--border-color)',
            zIndex: 100
          }}
        >
          <div style={{ width: '134px', height: '4.5px', backgroundColor: 'var(--text-muted)', borderRadius: '10px', opacity: 0.65 }} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StudentPortalPreviewModal;
