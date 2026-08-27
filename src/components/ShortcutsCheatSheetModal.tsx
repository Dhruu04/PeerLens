import React from 'react';
import { Keyboard, Sliders } from 'lucide-react';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import { formatShortcutDisplay } from '../utils/keyboardShortcuts';

interface ShortcutsCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  onOpenSettings: () => void;
}

export const ShortcutsCheatSheetModal: React.FC<ShortcutsCheatSheetModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                Keyboard Shortcuts Quick Reference
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Press any key to navigate and execute actions instantly.
              </span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} title="Close">×</button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(['Navigation', 'Tools', 'Actions', 'General'] as const).map(category => {
            const group = shortcuts.filter(s => s.category === category);
            if (group.length === 0) return null;

            return (
              <div key={category} style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  {category}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem' }}>
                  {group.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
                      <kbd 
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.74rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.08)'
                        }}
                      >
                        {formatShortcutDisplay(item.key, item.modifiers)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            style={{ fontSize: '0.78rem', gap: '0.35rem', fontWeight: 600 }}
          >
            <Sliders size={13} /> Customize Keys in Settings
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: '34px', padding: '0 1.25rem', fontWeight: 700 }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsCheatSheetModal;
