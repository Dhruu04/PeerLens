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
}

export const CONTEXT_HELP_ITEMS: Record<string, ContextHelpItem> = {
  webpa: {
    id: 'webpa',
    topic: 'WebPA Non-Linear Calibrator (Loughborough Algorithm)',
    badge: 'Grading Algorithm',
    summary: 'Adjusts individual grades based on peer assessment contributions while strictly excluding self-evaluations to eliminate bias.',
    howItWorks: 'The individual student factor is calculated by comparing each student\'s received peer ratings against the team\'s average peer rating. A factor of 1.00 represents equal contribution.',
    standardValue: 'Fudge Weight = 0.50 (50% Group Deliverable + 50% WebPA Individual Peer Factor)',
    formula: 'Final Grade = Group Grade × (1 - W) + (Group Grade × WebPA Factor × W)',
    proTip: 'Higher STEM capstone projects commonly use 0.50. Use 0.25 for intro courses.'
  },
  johari: {
    id: 'johari',
    topic: 'Johari Perception Window & Blind Spot Detection',
    badge: 'Perception Diagnostic',
    summary: 'Identifies cognitive dissonance between how students perceive their own teamwork vs how peers rate them.',
    howItWorks: 'Uses a ±7.5% threshold between Self-Rating and Peer-Rating. Students with high self-rating and low peer ratings are flagged as "Blind Spots" (overestimating), while students with high peer ratings and low self-rating are flagged as "Imposters".',
    standardValue: 'Threshold: ±7.5% Self-vs-Peer Delta',
    formula: 'Delta = (Self Rating Score - Peer Average Score) / Max Score',
    proTip: 'Early blind spot identification allows instructors to intervene before team conflict escalates.'
  },
  synergy: {
    id: 'synergy',
    topic: 'Combinatorial Diversity Synergy Score',
    badge: 'Optimization Metric',
    summary: 'Evaluates the cross-cultural dispersion, gender parity, and English proficiency balance across partitioned teams.',
    howItWorks: 'Simulated annealing algorithm optimizes team distributions to ensure no single international nationality is isolated (minimum 2 or zero per team) and gender ratios approximate 50/50.',
    standardValue: 'Synergy Target: 85% to 98% (High Balance)',
    formula: 'Synergy = 100 - (Nationality Penalty + Gender Variance Penalty + CEFR Dispersion Penalty)',
    proTip: 'Click "Re-Shuffle" to re-seed the combinatorial partitioner with a new random seed.'
  },
  rubricWeight: {
    id: 'rubricWeight',
    topic: '100% Criteria Weightage Balancing',
    badge: 'Assessment Standard',
    summary: 'Ensures that multi-dimensional criteria sum exactly to 100% for mathematical validity in academic peer grading.',
    howItWorks: 'By default, weights are distributed equally (e.g. 5 criteria = 20% each). When you edit one criterion\'s weight, the validation bar immediately confirms whether the total equals 100%.',
    standardValue: 'Target: Exactly 100%',
    formula: 'Sum(Weight_i) = 100%',
    proTip: 'Click "AAC&U VALUE" to instantly load 5 accredited teamwork criteria balanced at 20% each.'
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
        title={`How it works: ${info.topic}`}
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
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4f46e5', backgroundColor: '#eef2ff', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                {info.badge}
              </span>
              <h5 style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                {info.topic}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '1px' }}
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
              <b>Standard Value:</b> <span style={{ color: '#4f46e5' }}>{info.standardValue}</span>
            </div>
          )}

          {info.formula && (
            <div style={{ padding: '0.35rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.68rem', color: '#0f172a' }}>
              {info.formula}
            </div>
          )}

          {info.proTip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '0.35rem 0.55rem', borderRadius: '5px', border: '1px solid #bbf7d0' }}>
              <Sparkles size={11} style={{ flexShrink: 0 }} /> <span><b>Tip:</b> {info.proTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ContextHelpPopover;
