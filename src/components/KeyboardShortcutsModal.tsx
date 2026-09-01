import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Command, X, Search, BookOpen, Sliders, Award, Mail, Maximize2, Settings } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', action: 'Quick Command Palette & Student Finder', icon: <Search size={14} className="text-primary" /> },
    { key: '1', action: 'Switch to Enrollment & Teams Tab', icon: <BookOpen size={14} className="text-indigo" /> },
    { key: '2', action: 'Switch to Evaluation Rubrics Tab', icon: <Sliders size={14} className="text-teal" /> },
    { key: '3', action: 'Switch to Grade Analytics & Radar Tab', icon: <Award size={14} className="text-primary" /> },
    { key: 'E', action: 'Open Email Notification & Link Dispatcher', icon: <Mail size={14} className="text-primary" /> },
    { key: 'P', action: 'Launch Auditorium Projector Mode', icon: <Maximize2 size={14} className="text-teal" /> },
    { key: 'S', action: 'Open Workspace Settings & Cloud Sync', icon: <Settings size={14} className="text-primary" /> },
    { key: '? or /', action: 'Open Keyboard Shortcuts Cheat Sheet', icon: <Command size={14} className="text-indigo" /> },
    { key: 'Esc', action: 'Close Any Open Modal Dialog or Spotlight Tour', icon: <X size={14} className="text-secondary" /> }
  ];

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10010, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Command size={15} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Keyboard Shortcuts Reference
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Press any of these keys anywhere on your dashboard
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Shortcut Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: '#0f172a', fontWeight: 600 }}>
                {sc.icon}
                <span>{sc.action}</span>
              </div>

              <kbd
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
export default KeyboardShortcutsModal;
