import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Users, 
  Sliders, 
  Award, 
  Tv, 
  Send, 
  Download, 
  Settings, 
  Keyboard, 
  UserPlus, 
  FileText,
  Globe,
  CornerDownLeft,
  X
} from 'lucide-react';
import type { ClassData } from '../utils/math';

export interface CommandPaletteAction {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Students' | 'Teams';
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  onExecute: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  onNavigateTab: (tab: 'roster' | 'grading' | 'results') => void;
  onOpenProjector: () => void;
  onOpenDispatcher: () => void;
  onOpenSettings: (tab?: 'email' | 'cloud' | 'shortcuts') => void;
  onOpenShortcuts: () => void;
  onOpenAddStudent: () => void;
  onOpenReportModal: (studentId?: string) => void;
  onExportExcel: () => void;
  onSelectTeamFilter?: (teamName: string) => void;
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  classData,
  onNavigateTab,
  onOpenProjector,
  onOpenDispatcher,
  onOpenSettings,
  onOpenShortcuts,
  onOpenAddStudent,
  onOpenReportModal,
  onExportExcel,
  onSelectTeamFilter
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Background scroll lock
  useEffect(() => {
    if (isOpen) {
      const prevBody = document.body.style.overflow;
      const prevDoc = document.documentElement.style.overflow;
      const prevTouch = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);

      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevDoc;
        document.body.style.touchAction = prevTouch;
      };
    }
  }, [isOpen]);

  // Construct search items
  const items: CommandPaletteAction[] = useMemo(() => {
    const list: CommandPaletteAction[] = [
      // Navigation Actions
      {
        id: 'nav_roster',
        title: 'Switch to Classroom Roster',
        category: 'Navigation',
        subtitle: 'Manage enrolled participants and team assignments',
        icon: Users,
        badge: 'Tab 1',
        onExecute: () => {
          onNavigateTab('roster');
          onClose();
        }
      },
      {
        id: 'nav_grading',
        title: 'Switch to Evaluation Rubric',
        category: 'Navigation',
        subtitle: 'Configure criteria scales and accredited templates',
        icon: Sliders,
        badge: 'Tab 2',
        onExecute: () => {
          onNavigateTab('grading');
          onClose();
        }
      },
      {
        id: 'nav_results',
        title: 'Switch to Grade Analytics',
        category: 'Navigation',
        subtitle: 'Real-time calculation matrix, spider radar, and gradebook',
        icon: Award,
        badge: 'Tab 3',
        onExecute: () => {
          onNavigateTab('results');
          onClose();
        }
      },
      {
        id: 'act_projector',
        title: 'Open Live Classroom Projector Mode',
        category: 'Actions',
        subtitle: 'Full-screen monitor with QR code for student self-registration',
        icon: Tv,
        badge: 'Display',
        onExecute: () => {
          onOpenProjector();
          onClose();
        }
      },
      {
        id: 'act_dispatcher',
        title: 'Dispatch Student Evaluation Links',
        category: 'Actions',
        subtitle: 'Distribute customized personal access links via email',
        icon: Send,
        badge: 'Email',
        onExecute: () => {
          onOpenDispatcher();
          onClose();
        }
      },
      {
        id: 'act_add_student',
        title: 'Enroll New Student',
        category: 'Actions',
        subtitle: 'Manually add a student member to the classroom roster',
        icon: UserPlus,
        badge: 'Roster',
        onExecute: () => {
          onOpenAddStudent();
          onClose();
        }
      },
      {
        id: 'act_export_excel',
        title: 'Download Excel Gradebook Report (.xlsx)',
        category: 'Actions',
        subtitle: 'Export 2-sheet formatted workbook with WebPA metrics',
        icon: Download,
        badge: 'Export',
        onExecute: () => {
          onExportExcel();
          onClose();
        }
      },
      {
        id: 'act_settings',
        title: 'Open Settings & Cloud Sync',
        category: 'Actions',
        subtitle: 'Firebase sync, email API configuration, and shortcuts',
        icon: Settings,
        badge: 'Config',
        onExecute: () => {
          onOpenSettings('email');
          onClose();
        }
      },
      {
        id: 'act_shortcuts',
        title: 'Keyboard Shortcuts Reference',
        category: 'Actions',
        subtitle: 'View full cheat sheet of hotkeys and fast controls',
        icon: Keyboard,
        badge: 'Help',
        onExecute: () => {
          onOpenShortcuts();
          onClose();
        }
      }
    ];

    if (classData) {
      // Teams
      const uniqueTeams = Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean)));
      uniqueTeams.forEach(team => {
        const memberCount = classData.students.filter(s => s.groupName === team).length;
        list.push({
          id: `team_${team}`,
          title: `Filter Team: ${team}`,
          category: 'Teams',
          subtitle: `${memberCount} members enrolled in this team`,
          icon: Globe,
          badge: `${memberCount} Students`,
          onExecute: () => {
            onNavigateTab('roster');
            if (onSelectTeamFilter) onSelectTeamFilter(team);
            onClose();
          }
        });
      });

      // Students
      classData.students.forEach(student => {
        list.push({
          id: `student_${student.id}`,
          title: student.name,
          category: 'Students',
          subtitle: `${student.groupName || 'Unassigned'} • ${student.email || student.id} ${student.degree ? `• ${student.degree}` : ''}`,
          icon: FileText,
          badge: student.submitted ? 'Submitted' : 'Pending',
          onExecute: () => {
            onOpenReportModal(student.id);
            onClose();
          }
        });
      });
    }

    return list;
  }, [classData, onNavigateTab, onOpenProjector, onOpenDispatcher, onOpenSettings, onOpenShortcuts, onOpenAddStudent, onOpenReportModal, onExportExcel, onSelectTeamFilter, onClose]);

  // Filter based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Handle keyboard navigation inside palette
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onExecute();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const portalTarget = (typeof document !== 'undefined' && (document.fullscreenElement || document.body)) || document.body;

  return createPortal(
    <div 
      className="modal-overlay" 
      style={{ 
        zIndex: 999999, 
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5vh 1rem 2rem',
        position: 'fixed',
        inset: 0,
        animation: 'fadeIn 140ms ease'
      }} 
      onClick={onClose}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '620px', 
          width: '100%', 
          maxHeight: '80vh', 
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          animation: 'scaleIn 160ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '1rem 1.25rem', 
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-app, #f8fafc)'
          }}
        >
          <Search size={18} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a student name, team, or command (e.g. Export, Projector, Alpha)..."
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary, #0f172a)',
              outline: 'none',
              boxShadow: 'none',
              width: '100%'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: '5px', backgroundColor: 'var(--border-color, #e2e8f0)', color: 'var(--text-secondary, #64748b)', flexShrink: 0 }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          style={{ 
            padding: '0.5rem', 
            overflowY: 'auto', 
            maxHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <Search size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No matching commands or students found</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>Try searching by student ID, team name, or navigation actions.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.onExecute()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.09)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}`,
                    transition: 'all 120ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        backgroundColor: isSelected ? 'var(--primary, #6366f1)' : 'var(--bg-app, #f1f5f9)', 
                        color: isSelected ? '#ffffff' : 'var(--text-secondary, #64748b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 120ms ease'
                      }}
                    >
                      <IconComp size={16} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.1rem 0.4rem', 
                              backgroundColor: item.badge === 'Submitted' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                              color: item.badge === 'Submitted' ? 'var(--accent-teal, #14b8a6)' : 'var(--primary, #6366f1)',
                              fontWeight: 700,
                              borderRadius: '12px'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary, #6366f1)', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                      <span>Select</span>
                      <CornerDownLeft size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0.6rem 1.25rem', 
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            backgroundColor: 'var(--bg-app, #f8fafc)',
            fontSize: '0.72rem',
            color: 'var(--text-secondary, #64748b)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span><kbd style={{ padding: '0.15rem 0.35rem', borderRadius: '4px', background: 'var(--border-color, #e2e8f0)', fontWeight: 700 }}>↑</kbd> <kbd style={{ padding: '0.15rem 0.35rem', borderRadius: '4px', background: 'var(--border-color, #e2e8f0)', fontWeight: 700 }}>↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '0.15rem 0.35rem', borderRadius: '4px', background: 'var(--border-color, #e2e8f0)', fontWeight: 700 }}>↵</kbd> Select</span>
            <span><kbd style={{ padding: '0.15rem 0.35rem', borderRadius: '4px', background: 'var(--border-color, #e2e8f0)', fontWeight: 700 }}>ESC</kbd> Close</span>
          </div>
          <span style={{ fontWeight: 600 }}>{filteredItems.length} results</span>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default CommandPaletteModal;
