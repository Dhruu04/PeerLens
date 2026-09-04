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
    topic: 'WebPA Non-Linear Calibrator (Loughborough Algorithm)',
    badge: 'Grading Algorithm',
    summary: 'Adjusts individual student grades based on peer assessment contributions while strictly excluding self-evaluations to eliminate bias.',
    howItWorks: 'The individual student factor is calculated by comparing each student\'s received peer rating against the team\'s combined average peer rating. A factor of 1.00 represents exact expected contribution. Factors > 1.00 indicate above-average leadership and output, while < 1.00 flags under-contribution.',
    standardValue: 'Fudge Weight = 0.50 (50% Shared Deliverable + 50% WebPA Peer Factor)',
    formula: 'WebPA Factor = (Student Received Peer Avg) ÷ (Team Average Peer Rating)',
    proTip: 'Higher STEM capstone projects commonly use 0.50. For introductory group courses, use 0.25 to soften grade variance.'
  },
  fudgeFactor: {
    id: 'fudgeFactor',
    topic: 'WebPA Calibrator Fudge Factor & Sensitivity Tuning',
    badge: 'Grade Calibration',
    summary: 'Controls the mathematical balance between the shared group deliverable mark and individual peer contribution multipliers.',
    howItWorks: 'The Fudge Factor slider ranges from 0% (everyone receives the exact team deliverable mark with zero individual adjustment) to 100% (grade is fully scaled by peer reviews). At 50% (recommended standard), half the mark is based on team performance and half is scaled by individual accountability.',
    standardValue: '50% (Optimal balance between teamwork and individual accountability)',
    formula: 'Final Grade = Base Team Mark × [ (1 - Fudge Weight) + (Fudge Weight × WebPA Factor) ]',
    proTip: 'A 50% Fudge Factor provides meaningful reward for outstanding effort while keeping final marks within a defensible distribution.'
  },
  johari: {
    id: 'johari',
    topic: 'Johari Perception Window & Blind Spot Detection',
    badge: 'Psychological Diagnostic',
    summary: 'Identifies cognitive dissonance between how students perceive their own teamwork vs how teammates rate them anonymously.',
    howItWorks: 'Uses a strict ±7.5% delta threshold between Self-Rating and Anonymous Peer Consensus. Students are categorized into 3 psychological quadrants: Accurately Calibrated (delta within ±7.5%), Blind Spot / Overestimating (self > peers by >7.5%), or Imposter / Underestimating (peers > self by >7.5%).',
    standardValue: 'Threshold: ±7.5% Self-vs-Peer Delta',
    formula: 'Delta = (Self Rating Score - Peer Average Score) ÷ Max Score',
    proTip: 'Early blind spot identification allows instructors to provide constructive mentoring before interpersonal team friction escalates.'
  },
  synergy: {
    id: 'synergy',
    topic: 'Combinatorial Diversity Synergy Score',
    badge: 'Optimization Metric',
    summary: 'Evaluates the cross-cultural dispersion, gender parity, and English proficiency balance across partitioned teams.',
    howItWorks: 'Simulated annealing algorithm optimizes team distributions to ensure no single international nationality is isolated (minimum 2 or zero per team), university affiliations are dispersed, and gender ratios approximate 50/50 balance.',
    standardValue: 'Synergy Target: 85% to 98% (Optimal Diversity)',
    formula: 'Synergy = 100 - (Nationality Penalty + Gender Variance Penalty + Language Dispersion Penalty)',
    proTip: 'Click "Re-Shuffle" in the AutoGroup Studio to re-seed the combinatorial partitioner with a new random seed.'
  },
  rubricWeight: {
    id: 'rubricWeight',
    topic: '100% Criteria Weightage Balancing',
    badge: 'Assessment Standard',
    summary: 'Ensures that multi-dimensional criteria sum exactly to 100% for mathematical validity in academic peer grading.',
    howItWorks: 'By default, weights are distributed equally (e.g., 5 criteria = 20% each). When you edit one criterion\'s weight, the validation bar immediately confirms whether the total equals 100%. If unbalanced, click "Auto-Balance Weights" to automatically normalize weights to 100%.',
    standardValue: 'Target: Exactly 100.0%',
    formula: 'Total Weight = ∑(Criteria Weight_i) = 100%',
    proTip: 'Click "AAC&U VALUE" to instantly load 5 accredited teamwork criteria balanced at 20% each.'
  },
  anomaly: {
    id: 'anomaly',
    topic: 'Statistical Anomaly & Collusion Audit',
    badge: 'Integrity Audit',
    summary: 'Automated detection of score manipulation, collusion rings, extreme bias, and retaliatory ratings.',
    howItWorks: 'Continuously scans submission patterns for statistical discrepancies that deviate from normal grading distributions. Flags self-inflation (rating oneself 100% while peers give low marks), collusion rings (reciprocal maximum scores), and retaliatory outliers (>1.5 StdDev from consensus).',
    standardValue: 'Flag Threshold: > 1.5 Standard Deviations',
    formula: 'Anomaly Flag = |Reviewer Score - Team Consensus Mean| > 1.5 · σ',
    proTip: 'Flags serve as instructor alerts for review and do not alter grades automatically without instructor approval.'
  },
  density: {
    id: 'density',
    topic: 'Interface Density & Layout Presets',
    badge: 'Layout Control',
    summary: 'Switch between Minimal, Standard, and Full Suite interface modes to tailor the workspace density.',
    howItWorks: 'Standard Mode provides an intuitive, balanced layout for daily grading. Minimal Mode hides non-essential meters and secondary controls for an ultra-clean view. Full Suite unlocks all 40+ granular diagnostic modules. Individual elements can be toggled via "Customize View".',
    standardValue: 'Standard Default (Recommended)',
    formula: 'Settings → Interface & Modules → Instant Preset Switch',
    proTip: 'Use Minimal Mode on smaller laptops or during live classroom lectures to maximize screen space.'
  },
  radar: {
    id: 'radar',
    topic: 'Multi-Axis Competency Spider Radar',
    badge: 'Analytics Visualizer',
    summary: 'Interactive polygon comparing student and team performance across multi-dimensional rubric criteria.',
    howItWorks: 'Plots normalized peer ratings across all rubric criteria on concentric radial axes. Allows instructors and students to visualize skill balance, identify team-wide strengths, and pinpoint growth areas at a glance.',
    standardValue: 'Benchmark: Class Mean Overlay',
    formula: 'Normalized Radius = (Criterion Score ÷ Max Scale) × 100%',
    proTip: 'Use the Team Overlay dropdown to compare any specific group\'s polygon directly against the entire cohort average.'
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
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            padding: '0.85rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#334155',
            boxSizing: 'border-box',
            textAlign: 'left'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4f46e5', backgroundColor: '#eef2ff', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {info.badge}
              </span>
              <h5 style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                {info.topic}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close popover"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '1px', borderRadius: '4px' }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Summary & How it works */}
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
            {info.summary}
          </p>

          <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.15rem' }}>
              How It Calculates:
            </span>
            <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.38 }}>
              {info.howItWorks}
            </div>
          </div>

          {info.standardValue && (
            <div style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 600 }}>
              <b>Standard Setting:</b> <span style={{ color: '#4f46e5' }}>{info.standardValue}</span>
            </div>
          )}

          {info.formula && (
            <div style={{ padding: '0.35rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.68rem', color: '#0f172a', wordBreak: 'break-all' }}>
              {info.formula}
            </div>
          )}

          {info.proTip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '0.35rem 0.55rem', borderRadius: '5px', border: '1px solid #bbf7d0' }}>
              <Sparkles size={11} style={{ flexShrink: 0 }} /> <span><b>Tip:</b> {info.proTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextHelpPopover;
