import React from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  X,
  UserCheck,
  MessageSquare,
  Sparkles,
  Tag,
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  Zap,
  Info,
  ShieldCheck
} from 'lucide-react';
import type { ClassData, EvaluationFormControls } from '../utils/math';
import { getEvaluationControls, DEFAULT_EVALUATION_CONTROLS } from '../utils/math';

interface EvaluationControlsContentProps {
  activeClass: ClassData | null;
  onUpdateControls: (controls: Partial<EvaluationFormControls>) => void;
  compact?: boolean;
}

export const EvaluationControlsContent: React.FC<EvaluationControlsContentProps> = ({
  activeClass,
  onUpdateControls,
  compact = false
}) => {
  const controls = getEvaluationControls(activeClass);

  const toggle = (key: keyof EvaluationFormControls) => {
    onUpdateControls({ [key]: !controls[key] });
  };

  const handleSetAll = (val: boolean) => {
    onUpdateControls({
      allowSelfReview: val,
      showGrowthSuggestions: val,
      showPraiseTags: val,
      showStrengthsFeedback: val,
      showRoleBaseline: val,
      allowProfileEditing: val
    });
  };

  const handleApplyRatingOnly = () => {
    onUpdateControls({
      allowSelfReview: false,
      showGrowthSuggestions: false,
      showPraiseTags: false,
      showStrengthsFeedback: false,
      showRoleBaseline: false,
      allowProfileEditing: controls.allowProfileEditing
    });
  };

  const toggleItems: Array<{
    key: keyof EvaluationFormControls;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: 'Evaluation Form' | 'Student Permissions';
    badge?: string;
  }> = [
    {
      key: 'allowSelfReview',
      title: 'Self-Review Calibration',
      description: 'Require students to evaluate their own contributions, strengths, and perceived grade.',
      icon: <UserCheck size={18} className="text-teal" />,
      category: 'Evaluation Form',
      badge: 'Calibration'
    },
    {
      key: 'showStrengthsFeedback',
      title: 'Primary Strengths Feedback',
      description: 'Prompt: "What are this teammate\'s primary strengths?" (Qualitative peer praise)',
      icon: <Sparkles size={18} className="text-amber" />,
      category: 'Evaluation Form',
      badge: 'Qualitative'
    },
    {
      key: 'showGrowthSuggestions',
      title: 'Constructive Improvement Suggestions',
      description: 'Prompt: "What is one constructive suggestion for their improvement?" (Actionable growth guidance)',
      icon: <MessageSquare size={18} className="text-primary" />,
      category: 'Evaluation Form',
      badge: 'Qualitative'
    },
    {
      key: 'showPraiseTags',
      title: 'Strengths & Praise Tags',
      description: 'Quick-select recognition chips (e.g., Code Quality, Dependable, Problem Solver, Team Player).',
      icon: <Tag size={18} className="text-indigo" />,
      category: 'Evaluation Form',
      badge: 'Micro-Recognition'
    },
    {
      key: 'showRoleBaseline',
      title: 'Starting Role Baseline',
      description: 'Self-selected role archetypes (Project Lead, Architect, Researcher, Implementer, Presenter).',
      icon: <Compass size={18} className="text-purple" />,
      category: 'Evaluation Form',
      badge: 'Context'
    },
    {
      key: 'allowProfileEditing',
      title: 'Student Profile Self-Editing',
      description: 'When enabled, students can update their name, role, email, and tags. Disable to freeze student identities and avoid tampering.',
      icon: controls.allowProfileEditing ? <Unlock size={18} className="text-emerald" /> : <Lock size={18} className="text-rose" />,
      category: 'Student Permissions',
      badge: controls.allowProfileEditing ? 'Editable' : 'Frozen'
    }
  ];

  const evalFormItems = toggleItems.filter(i => i.category === 'Evaluation Form');
  const permissionItems = toggleItems.filter(i => i.category === 'Student Permissions');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Quick Action Preset Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.65rem 0.85rem',
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Zap size={14} className="text-teal" />
          <span style={{ fontWeight: 600 }}>Quick Presets:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => handleSetAll(true)}
            title="Enable all feedback questions and permissions"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
          >
            <CheckCircle2 size={12} className="text-emerald" /> Full Experience
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleApplyRatingOnly}
            title="Disable qualitative questions and self-review for faster numeric scoring"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
          >
            <SlidersHorizontal size={12} className="text-teal" /> Numeric Only
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => onUpdateControls({ allowProfileEditing: false })}
            title="Lock down student profiles to prevent edits"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
          >
            <Lock size={12} className="text-rose" /> Lock Roster
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => onUpdateControls(DEFAULT_EVALUATION_CONTROLS)}
            title="Reset to default settings"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Evaluation Form Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <SlidersHorizontal size={13} className="text-teal" /> Peer Evaluation Form Fields
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.65rem' }}>
          {evalFormItems.map(item => {
            const isChecked = controls[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  backgroundColor: isChecked ? 'var(--bg-surface)' : 'var(--bg-app)',
                  border: isChecked ? '1px solid var(--border-color)' : '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  opacity: isChecked ? 1 : 0.75
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
                  <div style={{
                    marginTop: '2px',
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: isChecked ? 'var(--bg-app)' : 'transparent',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div
                  style={{
                    width: '38px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                    position: 'relative',
                    flexShrink: 0,
                    marginTop: '4px',
                    transition: 'background-color 200ms ease'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: isChecked ? '20px' : '2px',
                      transition: 'left 200ms ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Permissions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={13} className="text-emerald" /> Student Identity &amp; Profile Permissions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
          {permissionItems.map(item => {
            const isChecked = controls[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  backgroundColor: isChecked ? 'var(--bg-surface)' : 'rgba(239, 68, 68, 0.05)',
                  border: isChecked ? '1px solid var(--border-color)' : '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
                  <div style={{
                    marginTop: '2px',
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: isChecked ? 'var(--bg-app)' : 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {item.title}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                        color: isChecked ? 'var(--emerald)' : 'var(--rose)',
                        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {item.badge}
                      </span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div
                  style={{
                    width: '38px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                    position: 'relative',
                    flexShrink: 0,
                    marginTop: '4px',
                    transition: 'background-color 200ms ease'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: isChecked ? '20px' : '2px',
                      transition: 'left 200ms ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.8, marginTop: '0.25rem' }}>
        <Info size={13} className="text-teal" />
        <span>Settings update in real time and automatically sync across all student portals.</span>
      </div>
    </div>
  );
};

interface EvaluationControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassData | null;
  onUpdateControls: (controls: Partial<EvaluationFormControls>) => void;
}

export const EvaluationControlsModal: React.FC<EvaluationControlsModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  onUpdateControls
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(20, 184, 166, 0.12)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SlidersHorizontal size={17} className="text-teal" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Evaluation Form Controls &amp; Permissions
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {activeClass ? `Active Classroom: ${activeClass.name}` : 'Course Configuration'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          <EvaluationControlsContent
            activeClass={activeClass}
            onUpdateControls={onUpdateControls}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
