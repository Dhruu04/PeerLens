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
      title: 'Profile Ready',
      isCompleted: true,
      hint: 'Course workspace active',
      actionLabel: 'Settings',
      onClick: () => onNavigateTab('cloud')
    },
    {
      id: 'roster',
      num: 2,
      title: 'Enroll Students & Teams',
      isCompleted: studentCount > 0,
      hint: studentCount > 0 ? `${studentCount} students enrolled` : 'Add students or import spreadsheet',
      actionLabel: studentCount > 0 ? 'View' : 'Enroll',
      onClick: () => onNavigateTab('roster')
    },
    {
      id: 'rubrics',
      num: 3,
      title: '100% Balanced Rubric',
      isCompleted: Math.abs(rubricWeightSum - 100) < 0.1,
      hint: Math.abs(rubricWeightSum - 100) < 0.1 ? 'Weights equal 100%' : `Current: ${rubricWeightSum}%`,
      actionLabel: 'Rubric',
      onClick: () => onNavigateTab('grading')
    },
    {
      id: 'analytics',
      num: 4,
      title: 'WebPA Analytics Matrix',
      isCompleted: hasEvaluations,
      hint: hasEvaluations ? 'Peer ratings active' : 'WebPA factor & perception charts',
      actionLabel: 'Analytics',
      onClick: () => onNavigateTab('results')
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        marginBottom: '1rem',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Sleek Minimal Header */}
      <div
        style={{
          padding: '0.55rem 0.95rem',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderBottom: isCollapsed ? 'none' : '1px solid #f1f5f9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: completedCount === steps.length ? '#dcfce7' : '#eef2ff',
              color: completedCount === steps.length ? '#16a34a' : '#4f46e5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 800
            }}
          >
            {completedCount === steps.length ? <CheckCircle size={13} /> : `${completedCount}/${steps.length}`}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                Course Setup Checklist
              </span>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: completedCount === steps.length ? '#16a34a' : '#64748b', backgroundColor: completedCount === steps.length ? '#f0fdf4' : '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
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
                backgroundColor: '#ffffff',
                color: '#4f46e5',
                border: '1px solid #c7d2fe',
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
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
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
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '0.2rem 0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#64748b'
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
                color: '#94a3b8'
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
        <div style={{ padding: '0.65rem 0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.5rem', backgroundColor: '#ffffff' }}>
          {steps.map(step => (
            <div
              key={step.id}
              onClick={step.onClick}
              style={{
                padding: '0.55rem 0.7rem',
                borderRadius: '7px',
                backgroundColor: step.isCompleted ? '#f0fdf4' : '#fafafa',
                border: step.isCompleted ? '1px solid #dcfce7' : '1px solid #f1f5f9',
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
                  <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                ) : (
                  <Circle size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: step.isCompleted ? '#166534' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: step.isCompleted ? '#15803d' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.hint}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
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
