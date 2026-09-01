import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ExternalLink, Smartphone, Wifi, BatteryCharging,
  ChevronDown
} from 'lucide-react';
import type { Student, ClassData } from '../utils/math';
import StudentPortal from '../views/StudentPortal';

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
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
    }
  }, [student]);

  // Strictly disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const origBody = document.body.style.overflow;
      const origHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.smartphone-simulator-screen')) {
          e.preventDefault();
        }
      };

      const handleTouch = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.smartphone-simulator-screen')) {
          e.preventDefault();
        }
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

  const studentOptions = classroom.students.map(s => ({
    value: s.id,
    label: `${s.name} (${s.groupName || 'Unassigned'})`
  }));

  const openInNewTab = () => {
    const url = `${window.location.origin}${window.location.pathname}?classId=${classroom.id}&studentId=${currentStudent.id}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 10005,
        backgroundColor: 'rgba(15, 23, 42, 0.40)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        overflow: 'hidden'
      }}
    >
      {/* Top Simulator Control Bar — Clean Light Theme */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '385px',
          marginBottom: '0.65rem',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          borderRadius: '14px',
          padding: '0.4rem 0.75rem',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
          color: '#0f172a',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Smartphone size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              Student Mobile Preview
            </div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>
              Live 1:1 Smartphone View
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Quick Student Switcher Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                color: '#1e293b',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 1.3rem 0.25rem 0.5rem',
                cursor: 'pointer',
                maxWidth: '120px',
                outline: 'none'
              }}
              title="Switch previewing student"
            >
              {studentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: 'absolute', right: '5px', pointerEvents: 'none', color: '#64748b' }} />
          </div>

          {/* External Tab Link */}
          <button
            type="button"
            onClick={openInNewTab}
            title="Open in real browser tab for mobile device test"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              color: '#475569',
              cursor: 'pointer',
              padding: '0.25rem 0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
              padding: '0.25rem 0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Preview Simulator"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Realistic Average Smartphone Chassis — Light Silver / Natural Titanium */}
      <div
        className="smartphone-chassis"
        onClick={e => e.stopPropagation()}
        style={{
          width: '375px',
          maxWidth: '94vw',
          height: '740px',
          maxHeight: 'calc(88vh - 55px)',
          backgroundColor: '#f8fafc',
          borderRadius: '46px',
          border: '3.5px solid #cbd5e1',
          boxShadow: '0 25px 65px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 0 0 2px #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Phone Status Bar & Dynamic Island (Light Theme) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            padding: '0.55rem 1.25rem 0.35rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100,
            flexShrink: 0
          }}
        >
          {/* Time */}
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', width: '40px' }}>
            9:41
          </span>

          {/* Dynamic Island Capsule */}
          <div
            style={{
              width: '86px',
              height: '20px',
              backgroundColor: '#0f172a',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 7px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Camera lens */}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            {/* Sensor dot */}
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#312e81' }} />
          </div>

          {/* Status Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a', width: '40px', justifyContent: 'flex-end' }}>
            <Wifi size={12} />
            <BatteryCharging size={13} style={{ color: '#10b981' }} />
          </div>
        </div>

        {/* Real Live Student Portal Screen Container */}
        <div
          className="smartphone-simulator-screen"
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overscrollBehavior: 'contain'
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .smartphone-simulator-screen .student-portal-wrapper {
              padding: 0 0.65rem 2.5rem 0.65rem !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
            .smartphone-simulator-screen .progression-timeline-container {
              position: sticky !important;
              top: 0 !important;
              margin: 0 -0.65rem 0.85rem -0.65rem !important;
              border-radius: 0 !important;
              border-top: none !important;
              border-left: none !important;
              border-right: none !important;
              border-bottom: 1px solid #e2e8f0 !important;
              background: rgba(255, 255, 255, 0.98) !important;
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              padding: 0.45rem 0.75rem !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
              z-index: 100 !important;
            }
            .smartphone-simulator-screen .card,
            .smartphone-simulator-screen .card-premium {
              padding: 0.85rem 0.75rem !important;
              border-radius: 12px !important;
              margin-bottom: 0.85rem !important;
              scroll-margin-top: 80px !important;
            }
          ` }} />

          {/* Render the ACTUAL real StudentPortal component */}
          <StudentPortal
            classId={classroom.id}
            studentId={currentStudent.id}
          />
        </div>

        {/* Smartphone Bottom Home Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <div style={{ width: '100px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '10px', opacity: 0.7 }} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StudentPortalPreviewModal;
