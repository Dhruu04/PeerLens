import React, { useState } from 'react';
import {
  CheckCircle, Circle, ChevronDown, ChevronUp, Sparkles, X, Play
} from 'lucide-react';

interface OnboardingChecklistProps {
  studentCount: number;
  rubricWeightSum: number;
  hasEvaluations: boolean;
  onNavigateTab: (tab: 'roster' | 'grading' | 'results' | 'automation' | 'cloud') => void;
  onStartTour?: () => void;
  onLaunchSandbox: () => void;
  onDismiss?: () => void;
}

export const OnboardingChecklistWidget: React.FC<OnboardingChecklistProps> = ({
  studentCount,
  rubricWeightSum,
  hasEvaluations,
  onNavigateTab,
  onStartTour,
  onLaunchSandbox,
  onDismiss
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('peer_onboarding_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('peer_onboarding_collapsed', String(next));
      return next;
    });
  };

  const steps = [
    {
      id: 'workspace',
      num: 1,
      title: 'Workspace Active',
      isCompleted: true,
      hint: 'Course section ready',
      actionLabel: 'Settings',
      onClick: () => onNavigateTab('cloud')
    },
    {
      id: 'roster',
      num: 2,
      title: 'Section 1: Enrollment & Teams',
      isCompleted: studentCount > 0,
      hint: studentCount > 0 ? `${studentCount} students enrolled` : 'Add students, demo cohort, or import file',
      actionLabel: studentCount > 0 ? 'View' : 'Enroll',
      onClick: () => onNavigateTab('roster')
    },
    {
      id: 'rubrics',
      num: 3,
      title: 'Section 2: 100% Balanced Rubric',
      isCompleted: Math.abs(rubricWeightSum - 100) < 0.1,
      hint: Math.abs(rubricWeightSum - 100) < 0.1 ? 'Weights balanced at 100%' : `Current sum: ${rubricWeightSum}%`,
      actionLabel: 'Rubric',
      onClick: () => onNavigateTab('grading')
    },
    {
      id: 'analytics',
      num: 4,
      title: 'Section 3: WebPA & Analytics',
      isCompleted: hasEvaluations,
      hint: hasEvaluations ? 'Evaluations & WebPA active' : 'WebPA Calibrator, Radars & Reports',
      actionLabel: 'Analytics',
      onClick: () => onNavigateTab('results')
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        marginBottom: '1rem',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Sleek Minimal Header */}
      <div
        style={{
          padding: '0.55rem 0.95rem',
          backgroundColor: 'var(--bg-surface-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: completedCount === steps.length ? 'var(--accent-teal-light)' : 'var(--primary-light)',
              color: completedCount === steps.length ? 'var(--accent-teal)' : 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 800,
              border: '1px solid var(--border-color)'
            }}
          >
            {completedCount === steps.length ? <CheckCircle size={13} /> : `${completedCount}/${steps.length}`}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Course Setup Checklist
              </span>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: completedCount === steps.length ? 'var(--accent-teal)' : 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '4px' }}>
                {progressPercent}% Complete
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Start Interactive Guided Tour"
            >
              <Play size={11} /> Tour
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchSandbox}
            style={{
              padding: '0.25rem 0.55rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: 'var(--accent-teal-light)',
              color: 'var(--accent-teal)',
              border: '1px solid var(--accent-teal)',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Launch Interactive Hands-on Sandbox"
          >
            <Sparkles size={11} /> Sandbox Test-Drive
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              padding: '0.2rem 0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
            title={isCollapsed ? 'Expand Checklist' : 'Collapse Checklist'}
          >
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)'
              }}
              title="Hide Checklist (Can be re-enabled in Settings anytime)"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Minimal Cards */}
      {!isCollapsed && (
        <div style={{ padding: '0.65rem 0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.5rem', backgroundColor: 'var(--bg-surface)' }}>
          {steps.map(step => (
            <div
              key={step.id}
              onClick={step.onClick}
              style={{
                padding: '0.55rem 0.7rem',
                borderRadius: '7px',
                backgroundColor: step.isCompleted ? 'var(--accent-teal-light)' : 'var(--bg-app)',
                border: step.isCompleted ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.45rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                {step.isCompleted ? (
                  <CheckCircle size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                ) : (
                  <Circle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.hint}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                {step.actionLabel} &rarr;
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default OnboardingChecklistWidget;
