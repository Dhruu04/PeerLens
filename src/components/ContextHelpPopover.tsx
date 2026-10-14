import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Sparkles, X } from 'lucide-react';

export interface ContextHelpItem {
  id: string;
  topic: string;
  badge: string;
  summary: string;
  howItWorks: string;
  standardValue?: string;
  formula?: string;
  proTip?: string;
  icon?: string;
}

export const CONTEXT_HELP_ITEMS: Record<string, ContextHelpItem> = {
  webpa: {
    id: 'webpa',
    topic: 'Peer Score Adjustment',
    badge: 'Grading',
    summary: 'Adjusts individual student grades up or down based on teammate reviews while excluding self-evaluations.',
    howItWorks: 'The individual adjustment factor is calculated by comparing each student\'s received peer ratings against the team\'s combined average. A multiplier of 1.00 represents exact expected contribution. Above 1.00 indicates high contribution, while below 1.00 indicates lower contribution.',
    standardValue: '50% Peer Review Impact (Recommended)',
    formula: 'Peer Multiplier = (Student Received Peer Avg) ÷ (Team Average Peer Rating)',
    proTip: 'Peer score adjustment ensures individual grades reflect true contributions without subjective guesswork.'
  },
  fudgeFactor: {
    id: 'fudgeFactor',
    topic: 'Peer Review Impact (0–100%)',
    badge: 'Grading',
    summary: 'How heavily peer reviews influence the final group grade.',
    howItWorks: 'The impact slider ranges from 0% (everyone receives the exact team deliverable mark with zero individual adjustment) to 100% (grade is fully scaled by peer reviews). At 50% (recommended), half the grade is based on team performance and half on individual peer reviews.',
    standardValue: '50% (Optimal balance between teamwork and individual accountability)',
    formula: 'Final Grade = Base Team Mark × [ (1 - Impact Weight) + (Impact Weight × Peer Multiplier) ]',
    proTip: 'A 50% impact provides meaningful reward for outstanding effort while keeping final marks within a fair distribution.'
  },
  johari: {
    id: 'johari',
    topic: 'Self vs. Peer Rating Comparison',
    badge: 'Perception Gap',
    summary: 'Shows if students rate themselves much higher or lower than teammates rated them.',
    howItWorks: 'Compares a student\'s self-rating with anonymous teammate ratings. Students are categorized into: Accurately Calibrated (self matches peers), Blind Spot (rated themselves higher than teammates did), or Underestimating (teammates rated them higher).',
    standardValue: 'Threshold: ±7.5% Self-vs-Peer Delta',
    formula: 'Delta = (Self Rating Score - Peer Average Score) ÷ Max Score',
    proTip: 'Identifying perception gaps helps instructors provide constructive coaching before team friction escalates.'
  },
  synergy: {
    id: 'synergy',
    topic: 'Team Balance Score',
    badge: 'Team Balance',
    summary: 'Evaluates the balance of gender, nationality, and skills across formed student teams.',
    howItWorks: 'The auto-grouping algorithm balances team distributions to avoid isolating students and ensures fair demographic spread.',
    standardValue: 'Target: 85% to 100% (Optimal Balance)',
    formula: 'Balance Score = 100 - (Demographic Imbalance Penalties)',
    proTip: 'Click "Reshuffle Teams" in Auto-Group Teams to instantly try another balanced layout.'
  },
  rubricWeight: {
    id: 'rubricWeight',
    topic: 'Weight Total (100%)',
    badge: 'Rubric Balance',
    summary: 'Shows whether your criteria percentages add up to 100%.',
    howItWorks: 'Criteria weights determine how much each dimension affects the final grade. When unbalanced, click "Auto-Balance" to distribute weights equally.',
    standardValue: 'Target: Exactly 100.0%',
    formula: 'Total Weight = ∑(Criteria Weight_i) = 100%',
    proTip: 'Keeping criteria balanced at 100% guarantees transparent and fair grade calculations.'
  },
  anomaly: {
    id: 'anomaly',
    topic: 'Suspicious Ratings Alert',
    badge: 'Integrity Alert',
    summary: 'Detects students who trade high scores, grade randomly, or give uniform marks.',
    howItWorks: 'Scans submission patterns to flag potential score trading (giving each other max scores), self-inflation (giving oneself 100% while team gives low marks), and outlier harsh grading.',
    standardValue: 'Alert Threshold: > 1.5 Standard Deviations',
    formula: 'Alert Flag = |Reviewer Score - Team Consensus Mean| > 1.5 · σ',
    proTip: 'Alerts highlight items for instructor review and never change grades automatically without approval.'
  },
  density: {
    id: 'density',
    topic: 'Layout Presets (Essentials, Recommended, Show All)',
    badge: 'Layout Control',
    summary: 'Switch between Essentials Only, Recommended, and Show All Modules to keep the interface clean.',
    howItWorks: 'Recommended mode gives a balanced classroom layout with essential tools. Essentials Only hides advanced analytics to keep things simple. Show All Modules turns on every available tool.',
    standardValue: 'Recommended (Balanced classroom layout)',
    formula: 'Preset buttons on header or quick tools dock',
    proTip: 'Use Essentials Only during initial setup to focus purely on student roster and rubric setup.'
  },
  radar: {
    id: 'radar',
    topic: 'Skills Radar Chart',
    badge: 'Chart',
    summary: 'Visual chart comparing team strengths across all rubric criteria.',
    howItWorks: 'Plots student and team ratings on a polygon chart across all rubric dimensions to easily spot strengths and skill gaps.',
    standardValue: 'Benchmark: Class Average Overlay',
    formula: 'Normalized Radius = (Criterion Score ÷ Max Scale) × 100%',
    proTip: 'Use the Team dropdown to compare any specific group directly against the class average.'
  }
};

interface ContextHelpPopoverProps {
  topicKey: keyof typeof CONTEXT_HELP_ITEMS;
  size?: number;
  inline?: boolean;
}

export const ContextHelpPopover: React.FC<ContextHelpPopoverProps> = ({
  topicKey,
  size = 13,
  inline = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = CONTEXT_HELP_ITEMS[topicKey];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  if (!info) return null;

  return (
    <div style={{ display: inline ? 'inline-flex' : 'block', position: 'relative', verticalAlign: 'middle' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Help & Explanations: ${info.topic}`}
        aria-label={`Help: ${info.topic}`}
        style={{
          background: 'transparent',
          border: 'none',
          color: isOpen ? '#4f46e5' : '#94a3b8',
          cursor: 'pointer',
          padding: '2px 4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s ease'
        }}
      >
        <HelpCircle size={size} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-premium, 0 12px 30px -5px rgba(0, 0, 0, 0.25))',
            padding: '0.85rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            boxSizing: 'border-box',
            textAlign: 'left'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {info.badge}
              </span>
              <h5 style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                {info.topic}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close popover"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', borderRadius: '4px' }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Summary & How it works */}
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {info.summary}
          </p>

          <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>
              How It Calculates:
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
              {info.howItWorks}
            </div>
          </div>

          {info.standardValue && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <b>Standard Setting:</b> <span style={{ color: 'var(--primary)' }}>{info.standardValue}</span>
            </div>
          )}

          {info.formula && (
            <div style={{ padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', wordBreak: 'break-all' }}>
              {info.formula}
            </div>
          )}

          {info.proTip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--accent-teal)', backgroundColor: 'var(--accent-teal-light)', padding: '0.35rem 0.55rem', borderRadius: '5px', border: '1px solid var(--accent-teal)' }}>
              <Sparkles size={11} style={{ flexShrink: 0 }} /> <span><b>Tip:</b> {info.proTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextHelpPopover;
