import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import type { ClassData, EvaluationFormControls } from '../utils/math';
import { getEvaluationControls } from '../utils/math';
import { EvaluationControlsContent } from './EvaluationControlsModal';

interface CollapsibleEvaluationControlsProps {
  activeClass: ClassData | null;
  onUpdateControls: (controls: Partial<EvaluationFormControls>) => void;
  defaultExpanded?: boolean;
  title?: string;
  description?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export const CollapsibleEvaluationControls: React.FC<CollapsibleEvaluationControlsProps> = ({
  activeClass,
  onUpdateControls,
  defaultExpanded = false,
  title = 'Peer Evaluation Form Fields & Student Permissions',
  description = 'Configure which questions, praise tags, and self-review steps appear on student portals.',
  style,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const controls = getEvaluationControls(activeClass);

  const activeCount = Object.values(controls).filter(Boolean).length;
  const isAllEnabled = activeCount === 6;
  const isRatingOnly = !controls.allowSelfReview && !controls.showStrengthsFeedback && !controls.showGrowthSuggestions && !controls.showPraiseTags && !controls.showRoleBaseline;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 200ms ease',
        ...style
      }}
    >
      {/* Minimal Header Bar - Clickable to Expand / Contract */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '0.8rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isExpanded ? 'rgba(20, 184, 166, 0.04)' : 'var(--bg-app)',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : '1px solid transparent',
          transition: 'all 150ms ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(20, 184, 166, 0.12)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <SlidersHorizontal size={16} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {title}
              </span>

              {/* Minimal Status Pills */}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.12rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: isAllEnabled ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                  color: isAllEnabled ? '#059669' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {isAllEnabled ? <CheckCircle2 size={11} className="text-emerald" /> : <Sliders size={11} />}
                {isAllEnabled ? 'Full Experience (6/6)' : isRatingOnly ? 'Numeric Only' : `${activeCount}/6 Active`}
              </span>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.12rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: controls.allowProfileEditing ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: controls.allowProfileEditing ? '#2563eb' : '#dc2626',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {controls.allowProfileEditing ? <Unlock size={11} /> : <Lock size={11} />}
                {controls.allowProfileEditing ? 'Profile Editable' : 'Profile Frozen'}
              </span>
            </div>

            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.73rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {description}
            </p>
          </div>
        </div>

        {/* Expand / Contract Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              gap: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <span>{isExpanded ? 'Contract' : 'Expand'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Drawer */}
      {isExpanded && (
        <div style={{ padding: '1rem 1.15rem', backgroundColor: 'var(--bg-surface)' }}>
          <EvaluationControlsContent
            activeClass={activeClass}
            onUpdateControls={onUpdateControls}
            compact={compact}
          />
        </div>
      )}
    </div>
  );
};
export default CollapsibleEvaluationControls;
