import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Command, X, Search, Sliders, Settings, 
  ExternalLink, Sparkles, AlertCircle, CornerDownLeft
} from 'lucide-react';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import { formatShortcutDisplay, getStoredShortcuts, DEFAULT_KEYBOARD_SHORTCUTS } from '../utils/keyboardShortcuts';
import { getShortcutsEnabled, setShortcutsEnabled as saveShortcutsEnabled, subscribeShortcutsEnabled } from '../utils/customViewProfiles';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
  onOpenCustomize?: () => void;
  onExecuteAction?: (actionId: string) => void;
}

const CATEGORY_ORDER = [
  'all',
  'Navigation',
  'Tools & Modals',
  'Roster & Teams',
  'Rubric & Scales',
  'Grading & Analytics',
  'Layout & Presets',
  'General',
  'Custom Shortcuts'
] as const;

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts: propsShortcuts,
  onOpenCustomize,
  onExecuteAction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(getShortcutsEnabled);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeShortcutsEnabled((enabled) => setShortcutsEnabled(enabled));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setSearchQuery('');
      setSelectedCategory('all');
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  const activeShortcuts = useMemo(() => {
    const rawList = propsShortcuts && propsShortcuts.length > 0 ? propsShortcuts : getStoredShortcuts();
    const list = [...rawList];
    DEFAULT_KEYBOARD_SHORTCUTS.forEach(def => {
      const found = list.some(s => (s.actionId || s.id) === (def.actionId || def.id));
      if (!found) {
        list.push({ ...def });
      }
    });
    return list.filter(s => !s.disabled);
  }, [propsShortcuts, isOpen]);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeShortcuts.length };
    activeShortcuts.forEach(s => {
      const cat = s.isCustom ? 'Custom Shortcuts' : s.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [activeShortcuts]);

  const filteredShortcuts = useMemo(() => {
    let list = activeShortcuts;

    // Filter by category tab
    if (selectedCategory !== 'all') {
      list = list.filter(s => {
        const cat = s.isCustom ? 'Custom Shortcuts' : s.category;
        return cat === selectedCategory;
      });
    }

    // Filter by search query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(s => {
      const formattedKey = formatShortcutDisplay(s.key, s.modifiers).toLowerCase();
      return (
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        formattedKey.includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.actionId && s.actionId.toLowerCase().includes(q))
      );
    });
  }, [activeShortcuts, selectedCategory, searchQuery]);

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

  const renderKeycaps = (key: string, modifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean }) => {
    const parts: string[] = [];
    if (modifiers?.ctrl) parts.push('Ctrl');
    if (modifiers?.alt) parts.push('Alt');
    if (modifiers?.shift) parts.push('Shift');
    if (key === ' ') parts.push('Space');
    else if (key === 'Escape') parts.push('Esc');
    else if (key.length === 1) parts.push(key.toUpperCase());
    else if (key) parts.push(key);

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
        {parts.map((p, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, margin: '0 1px' }}>+</span>}
            <kbd
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--primary)',
                backgroundColor: 'var(--bg-surface)',
                padding: '2px 6px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1.5px 0 var(--border-color), 0 2px 4px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap',
                lineHeight: 1.3
              }}
            >
              {p}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10010, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(7px)' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94%',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Command size={17} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Keyboard Shortcuts Reference
                </h3>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}
                >
                  {activeShortcuts.length} Active
                </span>
              </div>
              <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Fast keyboard navigation across all course workflows · Click any action to launch it
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => {
                const next = !shortcutsEnabled;
                setShortcutsEnabled(next);
                saveShortcutsEnabled(next);
              }}
              className="btn btn-secondary btn-sm"
              style={{
                height: '28px',
                fontSize: '0.72rem',
                fontWeight: 700,
                gap: '0.3rem',
                border: shortcutsEnabled ? '1px solid #10b981' : '1px solid var(--border-color)',
                backgroundColor: shortcutsEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: shortcutsEnabled ? '#059669' : 'var(--text-muted)'
              }}
              title={shortcutsEnabled ? 'Shortcuts are currently enabled. Click to disable.' : 'Shortcuts are currently disabled. Click to enable.'}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: shortcutsEnabled ? '#10b981' : '#94a3b8' }} />
              <span>{shortcutsEnabled ? 'Active' : 'Disabled'}</span>
            </button>
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

        {/* Warning banner when shortcuts are disabled */}
        {!shortcutsEnabled && (
          <div
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>Keybindings are currently paused/disabled. Click &quot;Enable Now&quot; to restore hotkeys.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShortcutsEnabled(true);
                saveShortcutsEnabled(true);
              }}
              style={{
                background: '#10b981',
                border: 'none',
                color: '#fff',
                borderRadius: '5px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Enable Now
            </button>
          </div>
        )}

        {/* Search filter input */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, key, or category (e.g. 'alt+q', 'roster', 'rubric', 'questions')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', paddingRight: searchQuery ? '30px' : '10px', height: '34px', fontSize: '0.8rem', borderRadius: '8px' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {CATEGORY_ORDER.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (cat !== 'all' && count === 0) return null;
            const isSelected = selectedCategory === cat;
            const label = cat === 'all' ? 'All' : cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  height: '25px',
                  padding: '0 0.55rem',
                  borderRadius: '14px',
                  fontSize: '0.7rem',
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-app)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 120ms ease'
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    opacity: isSelected ? 0.9 : 0.7,
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                    padding: '0 4px',
                    borderRadius: '8px'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '2px' }}>
          {groupedShortcuts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No shortcuts found matching &quot;{searchQuery}&quot;
              <div style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  style={{ fontSize: '0.72rem', height: '26px' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            groupedShortcuts.map(([category, items]) => (
              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: category === 'Custom Shortcuts' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {category}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    ({items.length})
                  </span>
                  {category === 'Custom Shortcuts' && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      User Defined
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                  {items.map((sc) => {
                    const isHovered = hoveredId === sc.id;
                    const actionToRun = sc.actionId || sc.id;

                    return (
                      <div
                        key={sc.id}
                        onMouseEnter={() => setHoveredId(sc.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => {
                          if (onExecuteAction && actionToRun) {
                            onExecuteAction(actionToRun);
                          }
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.48rem 0.75rem',
                          borderRadius: '8px',
                          backgroundColor: isHovered ? 'var(--primary-light)' : 'var(--bg-app)',
                          border: `1px solid ${isHovered ? 'var(--primary)' : 'var(--border-color)'}`,
                          gap: '0.5rem',
                          cursor: onExecuteAction ? 'pointer' : 'default',
                          transition: 'all 120ms ease'
                        }}
                        title={onExecuteAction ? `Click to run "${sc.label}"` : undefined}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isHovered ? 'var(--primary)' : 'var(--text-primary)' }}>
                              {sc.label}
                            </span>
                            {sc.id === 'open_enrollment_builder' && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                New
                              </span>
                            )}
                          </div>
                          {sc.description && (
                            <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '1px' }}>
                              {sc.description}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {isHovered && onExecuteAction && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-surface)'
                              }}
                            >
                              Run <CornerDownLeft size={10} />
                            </span>
                          )}
                          {renderKeycaps(sc.key, sc.modifiers)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={12} className="text-primary" /> Press keys anytime outside text inputs · Click row to execute
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
