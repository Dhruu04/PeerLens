import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Command, X, Search, Sliders, Settings, 
  ExternalLink, Sparkles
} from 'lucide-react';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import { formatShortcutDisplay, getStoredShortcuts } from '../utils/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
  onOpenCustomize?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts: propsShortcuts,
  onOpenCustomize
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setSearchQuery('');
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  const activeShortcuts = useMemo(() => {
    const list = propsShortcuts && propsShortcuts.length > 0 ? propsShortcuts : getStoredShortcuts();
    return list.filter(s => !s.disabled);
  }, [propsShortcuts, isOpen]);

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return activeShortcuts;
    const q = searchQuery.toLowerCase().trim();
    return activeShortcuts.filter(s => 
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.key.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [activeShortcuts, searchQuery]);

  const groupedShortcuts = useMemo(() => {
    const map = new Map<string, KeyboardShortcut[]>();
    filteredShortcuts.forEach(s => {
      const cat = s.isCustom ? 'Custom Shortcuts' : s.category;
      const arr = map.get(cat) || [];
      arr.push(s);
      map.set(cat, arr);
    });
    return Array.from(map.entries());
  }, [filteredShortcuts]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10010, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '92%',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Command size={16} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Keyboard Shortcuts Reference
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Fast keyboard navigation across all course workflows
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {onOpenCustomize && (
              <button
                type="button"
                onClick={onOpenCustomize}
                className="btn btn-secondary btn-sm"
                style={{ height: '28px', fontSize: '0.72rem', fontWeight: 700, gap: '0.3rem' }}
                title="Customize or add your own shortcuts"
              >
                <Sliders size={12} /> Customize <ExternalLink size={10} />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.5rem', height: '28px' }}
              title="Close (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search filter input */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search shortcuts (e.g. roster, excel, rubric, projector)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
          />
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '52vh', overflowY: 'auto', paddingRight: '2px' }}>
          {groupedShortcuts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No shortcuts found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            groupedShortcuts.map(([category, items]) => (
              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: category === 'Custom Shortcuts' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {category}
                  </span>
                  {category === 'Custom Shortcuts' && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      User Defined
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {items.map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sc.label}
                        </span>
                        {sc.description && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {sc.description}
                          </span>
                        )}
                      </div>

                      <kbd
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          backgroundColor: 'var(--bg-surface)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        {formatShortcutDisplay(sc.key, sc.modifiers)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} className="text-primary" /> Press keys anytime outside inputs
          </span>
          {onOpenCustomize ? (
            <button
              type="button"
              onClick={onOpenCustomize}
              className="btn btn-primary btn-sm"
              style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem' }}
            >
              <Settings size={13} /> Add &amp; Edit Keybindings
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700 }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KeyboardShortcutsModal;
