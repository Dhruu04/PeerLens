import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Send, AlertCircle, TrendingUp, 
  ThumbsUp, Rocket, Trophy, Lightbulb, Clock, Heart, 
  Award, MessageSquare, Target, Minus, Plus, CheckCircle, CheckCircle2,
  GraduationCap, Users, Info, BarChart2, Download, Lock, BookOpen,
  Check, Star, AlertTriangle, ChevronLeft, ChevronRight, WifiOff,
  Layers, ListFilter, Sparkles, CheckSquare, SlidersHorizontal, Wand2, RefreshCw,
  ChevronDown, ChevronUp, Edit3, LayoutDashboard, ArrowRight, Globe, Mail, X,
  Activity, Frown, Meh, Smile, Flame
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { calculateStudentMetrics, getTargetScale, normalizeNationality, getEvaluationControls, type Student, PULSE_SCALE_PRESETS } from '../utils/math';
import FeatureInfoButton from '../components/FeatureInfoButton';


interface StudentPortalProps {
  classId: string;
  studentId: string;
  isPreview?: boolean;
  onForcedLogout?: (reason: 'deleted' | 'expired') => void;
}

// Professional mapping for contribution expectation tiers
const getTierInfo = (pct: number) => {
  if (pct <= 25) {
    return {
      icon: AlertCircle,
      title: 'Needs Improvement',
      desc: 'Limited contribution or inconsistent delivery; required substantial guidance.',
      color: 'var(--accent-rose)',
      bgColor: 'var(--accent-rose-light)',
      className: 'active-rose',
      index: 0
    };
  } else if (pct <= 50) {
    return {
      icon: TrendingUp,
      title: 'Developing',
      desc: 'Met baseline requirements; opportunities exist to improve consistency and collaboration.',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-light)',
      className: 'active-amber',
      index: 1
    };
  } else if (pct <= 75) {
    return {
      icon: ThumbsUp,
      title: 'Proficient / Meets Expectations',
      desc: 'Consistently met established standards; dependable, communicative, and collaborative.',
      color: 'var(--primary)',
      bgColor: 'var(--primary-light)',
      className: 'active-indigo',
      index: 2
    };
  } else if (pct <= 90) {
    return {
      icon: Rocket,
      title: 'Exemplary / Exceeds Expectations',
      desc: 'Delivered high-quality contributions; took initiative and actively supported teammates.',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      className: 'active-teal',
      index: 3
    };
  } else {
    return {
      icon: Trophy,
      title: 'Distinguished Leadership',
      desc: 'Exceptional technical rigor and leadership; drove significant team outcomes.',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      className: 'active-emerald',
      index: 4
    };
  }
};

const getPraiseTagInfo = (tagText: string) => {
  // Strip historical emojis if any
  const cleanText = tagText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
  
  if (cleanText.includes('Creative') || cleanText.includes('Problem')) return { icon: Lightbulb, color: 'var(--accent-amber)', bg: 'var(--accent-amber-light)', border: 'var(--border-color)', text: 'Creative Problem Solver' };
  if (cleanText.includes('Punctual') || cleanText.includes('Reliable')) return { icon: Clock, color: 'var(--accent-amber)', bg: 'var(--accent-amber-light)', border: 'var(--border-color)', text: 'Reliable & Punctual' };
  if (cleanText.includes('Supportive') || cleanText.includes('Player')) return { icon: Heart, color: 'var(--accent-rose)', bg: 'var(--accent-rose-light)', border: 'var(--border-color)', text: 'Supportive Team Player' };
  if (cleanText.includes('Quality') || cleanText.includes('Deliverables')) return { icon: Award, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border-color)', text: 'High Quality Deliverables' };
  if (cleanText.includes('Communicat')) return { icon: MessageSquare, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'var(--border-color)', text: 'Clear Communicator' };
  return { icon: Target, color: 'var(--accent-teal)', bg: 'var(--accent-teal-light)', border: 'var(--border-color)', text: 'Detail Oriented' };
};

const AVAILABLE_TAGS = [
  'Creative Problem Solver',
  'Reliable & Punctual',
  'Supportive Team Player',
  'High Quality Deliverables',
  'Clear Communicator',
  'Detail Oriented'
];

export interface RoleArchetype {
  id: string;
  name: string;
  badge: string;
  desc: string;
  color: string;
  bgColor: string;
  calculateScore: (field: { name: string; min: number; max: number }) => number;
}

export const ROLE_ARCHETYPES: RoleArchetype[] = [
  {
    id: 'tech_driver',
    name: 'Technical Driver',
    badge: 'Code & Execution',
    desc: 'Led technical implementation, debugging, and high-quality deliverables.',
    color: 'var(--accent-teal)',
    bgColor: 'var(--accent-teal-light)',
    calculateScore: (field) => {
      const lower = field.name.toLowerCase();
      if (lower.includes('tech') || lower.includes('code') || lower.includes('quality') || lower.includes('problem') || lower.includes('deliver')) {
        return Math.round(field.min + 0.92 * (field.max - field.min));
      }
      if (lower.includes('communicat') || lower.includes('team')) {
        return Math.round(field.min + 0.80 * (field.max - field.min));
      }
      return Math.round(field.min + 0.85 * (field.max - field.min));
    }
  },
  {
    id: 'coordinator',
    name: 'Coordinator & Lead',
    badge: 'Communication & Process',
    desc: 'Facilitated communication, tracked deadlines, and kept everyone aligned.',
    color: 'var(--primary)',
    bgColor: 'var(--primary-light)',
    calculateScore: (field) => {
      const lower = field.name.toLowerCase();
      if (lower.includes('communicat') || lower.includes('team') || lower.includes('punctual') || lower.includes('deadline') || lower.includes('reliab')) {
        return Math.round(field.min + 0.95 * (field.max - field.min));
      }
      if (lower.includes('tech') || lower.includes('code') || lower.includes('problem')) {
        return Math.round(field.min + 0.82 * (field.max - field.min));
      }
      return Math.round(field.min + 0.88 * (field.max - field.min));
    }
  },
  {
    id: 'core_contributor',
    name: 'Core Contributor',
    badge: 'Consistent All-Rounder',
    desc: 'Dependable team member who steadily delivered on all assigned milestone tasks.',
    color: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    calculateScore: (field) => {
      return Math.round(field.min + 0.82 * (field.max - field.min));
    }
  },
  {
    id: 'developing_support',
    name: 'Developing Contributor',
    badge: 'Support & Growth',
    desc: 'Contributed baseline effort; has opportunities to increase initiative and proactive delivery.',
    color: 'var(--accent-amber)',
    bgColor: 'var(--accent-amber-light)',
    calculateScore: (field) => {
      const lower = field.name.toLowerCase();
      if (lower.includes('communicat') || lower.includes('initiative')) {
        return Math.round(field.min + 0.65 * (field.max - field.min));
      }
      return Math.round(field.min + 0.70 * (field.max - field.min));
    }
  }
];

const STRENGTH_SUGGESTIONS = [
  'Completed deliverables accurately and on time',
  'Communicated proactively in team chats and standups',
  'Led technical problem-solving and documentation',
  'Helped troubleshoot blockers for teammates',
  'Consistently supportive, reliable, and positive'
];

const GROWTH_SUGGESTIONS = [
  'Could share working drafts earlier for peer review',
  'Could participate more actively in brainstorming',
  'Could flag roadblocks sooner so the team can assist',
  'Could provide more detailed notes on task progress',
  'Could coordinate milestone handoffs more explicitly'
];

// Combinatorial sentence builder banks ensuring non-generic, high-variance feedback
const STRENGTH_DOMAINS = [
  'In technical deliverables & code quality,',
  'During group discussions & sprint standups,',
  'When troubleshooting complex project blockers,',
  'In project documentation & presentation materials,',
  'Throughout milestone planning & task execution,'
];

const STRENGTH_ACTIONS = [
  'consistently produced dependable, high-standard deliverables',
  'facilitated structured discussions and kept the team focused',
  'stepped up proactively to solve challenging technical roadblocks',
  'translated complex requirements into clear, manageable tasks',
  'communicated transparently and kept teammates continuously updated'
];

const STRENGTH_IMPACTS = [
  'which noticeably elevated our final deliverable quality.',
  'which kept the entire team on schedule with zero friction.',
  'which reduced team stress during crunch periods.',
  'which made integration with the rest of the project effortless.'
];

const GROWTH_DOMAINS = [
  'For upcoming project milestones,',
  'During team discussions and standups,',
  'When planning milestone deliverables,',
  'When encountering technical roadblocks,',
  'Regarding deliverable handoffs,'
];

const GROWTH_ACTIONS = [
  'sharing working drafts earlier would allow the team to give timely feedback',
  'flagging blockers in group chat sooner would help teammates assist faster',
  'speaking up more actively in brainstorming would ensure all insights are heard',
  'providing more regular progress notes would keep everyone aligned',
  'clarifying task ownership explicitly would prevent overlapping work'
];

const GROWTH_IMPACTS = [
  'and ensure smoother sprint completions.',
  'to help the team iterate together with higher velocity.',
  'which will strengthen our collaborative momentum.',
  'and reduce last-minute deadline pressure.'
];

const GENERIC_PHRASES = [
  'good', 'fine', 'ok', 'okay', 'nice', 'great', 'cool', 'did fine', 'good job',
  'good teammate', 'great teammate', 'did good', 'did nothing', 'nothing',
  'none', 'n/a', 'na', 'no comments', 'idk', 'satisfactory', 'average', 'alright'
];

// Clean parenthesized emails and trailing spaces from student names
const cleanStudentName = (fullName: string | undefined): string => {
  if (!fullName) return '';
  return fullName.replace(/\s*\([^)]*\)/g, '').trim();
};

interface ConstructiveFeedbackFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  type: 'strengths' | 'growth';
  teammateName: string;
  triggerHaptic: (ms?: number) => void;
}

const ConstructiveFeedbackField: React.FC<ConstructiveFeedbackFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type,
  teammateName,
  triggerHaptic
}) => {
  const suggestions = type === 'strengths' ? STRENGTH_SUGGESTIONS : GROWTH_SUGGESTIONS;
  const domains = type === 'strengths' ? STRENGTH_DOMAINS : GROWTH_DOMAINS;
  const actions = type === 'strengths' ? STRENGTH_ACTIONS : GROWTH_ACTIONS;
  const impacts = type === 'strengths' ? STRENGTH_IMPACTS : GROWTH_IMPACTS;

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(0);
  const [selectedAction, setSelectedAction] = useState(0);
  const [selectedImpact, setSelectedImpact] = useState(0);

  const words = value.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isGeneric = GENERIC_PHRASES.some(
    p => value.trim().toLowerCase() === p || value.trim().toLowerCase() === `${p}.`
  );
  const isShort = wordCount < 15;
  const isBenchmarkMet = wordCount >= 15 && !isGeneric;

  const previewSentence = `${domains[selectedDomain % domains.length]} ${actions[selectedAction % actions.length]}, ${impacts[selectedImpact % impacts.length]}`;

  const handleInsertSuggestion = (suggestion: string) => {
    triggerHaptic(12);
    if (!value.trim()) {
      onChange(suggestion);
    } else {
      const endsWithPunct = /[.!?]$/.test(value.trim());
      onChange(`${value.trim()}${endsWithPunct ? ' ' : '. '}${suggestion}.`);
    }
  };

  const handleShuffle = () => {
    triggerHaptic(10);
    setSelectedDomain(Math.floor(Math.random() * domains.length));
    setSelectedAction(Math.floor(Math.random() * actions.length));
    setSelectedImpact(Math.floor(Math.random() * impacts.length));
  };

  const handleInsertBuiltSentence = () => {
    triggerHaptic(15);
    if (!value.trim()) {
      onChange(previewSentence);
    } else {
      const endsWithPunct = /[.!?]$/.test(value.trim());
      onChange(`${value.trim()}${endsWithPunct ? ' ' : '. '}${previewSentence}`);
    }
  };

  const peerFirstName = cleanStudentName(teammateName).split(' ')[0] || 'teammate';

  return (
    <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
        <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setIsBuilderOpen(prev => !prev);
            }}
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              border: `1px solid ${isBuilderOpen ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: isBuilderOpen ? 'var(--primary-light)' : 'var(--bg-surface)',
              color: isBuilderOpen ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            title="Open sentence builder to assemble tailored peer feedback"
          >
            <Wand2 size={11} style={{ color: 'var(--primary)' }} />
            <span>{isBuilderOpen ? 'Close Builder' : 'Sentence Builder'}</span>
            <span style={{ fontSize: '0.6rem', padding: '0.04rem 0.28rem', borderRadius: '3px', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>
              100+
            </span>
          </button>

          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '0.12rem 0.45rem',
              borderRadius: '9999px',
              backgroundColor: isBenchmarkMet
                ? 'rgba(16, 185, 129, 0.12)'
                : wordCount > 0
                ? 'rgba(245, 158, 11, 0.12)'
                : 'var(--bg-app)',
              color: isBenchmarkMet
                ? '#10b981'
                : wordCount > 0
                ? '#d97706'
                : 'var(--text-muted)',
              border: `1px solid ${
                isBenchmarkMet
                  ? 'rgba(16, 185, 129, 0.25)'
                  : wordCount > 0
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'var(--border-color)'
              }`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {isBenchmarkMet ? <CheckCircle size={10} /> : <MessageSquare size={10} />}
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
      </div>

      {/* Interactive Combinatorial Sentence Builder Panel */}
      {isBuilderOpen && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            animation: 'peerCardSlideIn 0.18s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wand2 size={12} className="text-primary" />
              <span>Tap components to assemble unique feedback for {peerFirstName}:</span>
            </span>
            <button
              type="button"
              onClick={handleShuffle}
              style={{
                fontSize: '0.66rem',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.1rem 0.3rem'
              }}
              title="Generate random fresh combination"
            >
              <RefreshCw size={10} />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Part 1: Context / Domain */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. Project Domain / Moment
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {domains.map((dom, dIdx) => {
                const isSelected = selectedDomain === dIdx;
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setSelectedDomain(dIdx);
                    }}
                    style={{
                      fontSize: '0.66rem',
                      padding: '0.22rem 0.45rem',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {dom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part 2: Specific Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. Specific Observable Contribution
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {actions.map((act, aIdx) => {
                const isSelected = selectedAction === aIdx;
                return (
                  <button
                    key={aIdx}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setSelectedAction(aIdx);
                    }}
                    style={{
                      fontSize: '0.66rem',
                      padding: '0.22rem 0.45rem',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {act}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part 3: Team Impact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              3. Measurable Outcome / Value
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {impacts.map((imp, iIdx) => {
                const isSelected = selectedImpact === iIdx;
                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setSelectedImpact(iIdx);
                    }}
                    style={{
                      fontSize: '0.66rem',
                      padding: '0.22rem 0.45rem',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {imp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Callout */}
          <div
            style={{
              padding: '0.55rem 0.7rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Sentence Preview:
              </span>
              <button
                type="button"
                onClick={handleInsertBuiltSentence}
                className="btn btn-primary btn-sm"
                style={{
                  fontSize: '0.68rem',
                  padding: '0.2rem 0.55rem',
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Plus size={11} />
                <span>Insert into Feedback</span>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              "{previewSentence}"
            </p>
          </div>
        </div>
      )}

      {/* Text area with clean mobile sizing */}
      <textarea
        className="form-input"
        placeholder={placeholder}
        rows={2}
        style={{
          resize: 'vertical',
          fontSize: '14px',
          lineHeight: 1.45,
          padding: '0.55rem 0.7rem',
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '8px',
          borderColor: isBenchmarkMet ? '#10b981' : undefined,
          boxShadow: isBenchmarkMet ? '0 0 0 1px rgba(16, 185, 129, 0.2)' : 'none'
        }}
        maxLength={500}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Smart Nudge / Quality Indicator Banner */}
      <div
        style={{
          fontSize: '0.72rem',
          lineHeight: 1.35,
          padding: '0.45rem 0.65rem',
          borderRadius: '7px',
          backgroundColor: isBenchmarkMet
            ? 'rgba(16, 185, 129, 0.08)'
            : isGeneric || (wordCount > 0 && isShort)
            ? 'rgba(245, 158, 11, 0.09)'
            : 'var(--bg-app)',
          border: `1px solid ${
            isBenchmarkMet
              ? 'rgba(16, 185, 129, 0.25)'
              : isGeneric || (wordCount > 0 && isShort)
              ? 'rgba(245, 158, 11, 0.25)'
              : 'var(--border-color)'
          }`,
          color: isBenchmarkMet
            ? '#059669'
            : isGeneric || (wordCount > 0 && isShort)
            ? '#b45309'
            : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'all 0.2s ease'
        }}
      >
        {isBenchmarkMet ? (
          <>
            <CheckCircle size={13} style={{ flexShrink: 0, color: '#10b981' }} />
            <span><strong>Constructive benchmark reached!</strong> Thank you for providing specific, valuable feedback.</span>
          </>
        ) : isGeneric ? (
          <>
            <Lightbulb size={13} style={{ flexShrink: 0, color: '#d97706' }} />
            <span><strong>Smart Nudge:</strong> Avoid generic words like "{value.trim()}". Detail specific deliverables or communication examples so {peerFirstName} can take action.</span>
          </>
        ) : wordCount > 0 && isShort ? (
          <>
            <Lightbulb size={13} style={{ flexShrink: 0, color: '#d97706' }} />
            <span><strong>Smart Nudge:</strong> Consider mentioning specific tasks or sprint contributions ({wordCount}/15 words to benchmark).</span>
          </>
        ) : (
          <>
            <Sparkles size={12} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            <span><strong>Pedagogy Tip:</strong> Specific, balanced observations help teammates grow without guesswork.</span>
          </>
        )}
      </div>

      {/* Quick Inspiration Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.15rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tap to insert quick phrase:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {suggestions.map((s, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleInsertSuggestion(s)}
              style={{
                fontSize: '0.68rem',
                padding: '0.22rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Plus size={10} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StudentPortal: React.FC<StudentPortalProps> = ({
  classId,
  studentId,
  isPreview = false,
  onForcedLogout
}) => {
  const { classes, submitPeerReviews, addToast, enrollStudent, submitPulseResponse } = useClass();

  // Active student view: 'dashboard' (home) | 'evaluate' (peer reviews) | 'report' (performance analytics)
  const [portalTab, setPortalTab] = useState<'dashboard' | 'evaluate' | 'report'>('dashboard');

  // Find class and student
  const activeClass = classes.find((c) => c.id === classId);
  const student = activeClass?.students.find((s) => s.id === studentId);
  const evalControls = getEvaluationControls(activeClass);

  // Immediate real-time deletion listener across tabs and database updates
  useEffect(() => {
    if (isPreview) return;

    // 1. Reactive check against updated classes state
    if (classes.length > 0 && activeClass && !student) {
      try {
        localStorage.removeItem('peer_active_student_session');
        localStorage.removeItem(`peer_enrolled_student_${classId}`);
        localStorage.removeItem(`peer_draft_${classId}_${studentId}`);
      } catch (e) {}
      if (onForcedLogout) {
        onForcedLogout('deleted');
      }
      return;
    }

    // 2. BroadcastChannel real-time multi-tab listener
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('peerlens_roster_channel');
        bc.onmessage = (e) => {
          const data = e.data;
          if (!data) return;
          if (
            (data.type === 'STUDENT_DELETED' && data.classId === classId && data.studentId === studentId) ||
            (data.type === 'STUDENTS_DELETED' && data.classId === classId && Array.isArray(data.studentIds) && data.studentIds.includes(studentId)) ||
            (data.type === 'ROSTER_CLEARED' && data.classId === classId)
          ) {
            try {
              localStorage.removeItem('peer_active_student_session');
              localStorage.removeItem(`peer_enrolled_student_${classId}`);
              localStorage.removeItem(`peer_draft_${classId}_${studentId}`);
            } catch (err) {}
            if (onForcedLogout) {
              onForcedLogout('deleted');
            }
          }
        };
      }
    } catch (err) {}

    // 3. Window CustomEvent listener
    const handleLocalDeleted = (ev: Event) => {
      const customEv = ev as CustomEvent;
      const detail = customEv.detail;
      if (detail && detail.classId === classId && (detail.studentId === studentId || (Array.isArray(detail.studentIds) && detail.studentIds.includes(studentId)))) {
        try {
          localStorage.removeItem('peer_active_student_session');
          localStorage.removeItem(`peer_enrolled_student_${classId}`);
          localStorage.removeItem(`peer_draft_${classId}_${studentId}`);
        } catch (err) {}
        if (onForcedLogout) {
          onForcedLogout('deleted');
        }
      }
    };
    const handleLocalRosterCleared = (ev: Event) => {
      const customEv = ev as CustomEvent;
      if (customEv.detail && customEv.detail.classId === classId) {
        try {
          localStorage.removeItem('peer_active_student_session');
          localStorage.removeItem(`peer_enrolled_student_${classId}`);
          localStorage.removeItem(`peer_draft_${classId}_${studentId}`);
        } catch (err) {}
        if (onForcedLogout) {
          onForcedLogout('deleted');
        }
      }
    };

    window.addEventListener('peerlens_student_deleted', handleLocalDeleted);
    window.addEventListener('peerlens_students_deleted', handleLocalDeleted);
    window.addEventListener('peerlens_roster_cleared', handleLocalRosterCleared);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('peerlens_student_deleted', handleLocalDeleted);
      window.removeEventListener('peerlens_students_deleted', handleLocalDeleted);
      window.removeEventListener('peerlens_roster_cleared', handleLocalRosterCleared);
    };
  }, [classes, activeClass, student, classId, studentId, isPreview, onForcedLogout]);

  // Profile Edit modal states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    gender: student?.gender || 'Prefer not to say',
    englishProficiency: student?.englishProficiency || 'Fluent (C1/C2)',
    degree: student?.degree || '',
    university: student?.university || '',
    nationality: student?.nationality || '',
    isInternational: !!student?.isInternational,
    isExchange: !!student?.isExchange
  });

  // Keep profile form synced with student record
  useEffect(() => {
    if (student) {
      setProfileForm({
        name: student.name || '',
        email: student.email || '',
        gender: student.gender || 'Prefer not to say',
        englishProficiency: student.englishProficiency || 'Fluent (C1/C2)',
        degree: student.degree || '',
        university: student.university || '',
        nationality: student.nationality || '',
        isInternational: !!student.isInternational,
        isExchange: !!student.isExchange
      });
    }
  }, [student]);

  // Compile teammates
  const teammates = activeClass && student
    ? activeClass.students.filter((s) => s.groupName === student.groupName && s.id !== student.id)
    : [];

  // Selected peer for viewing their profile details modal
  const [viewingPeer, setViewingPeer] = useState<Student | null>(null);

  // State to hold evaluation scores: teammateId/selfId -> { fieldId -> score }
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    if (activeClass && teammates.length > 0 && student) {
      // Teammates evaluations
      teammates.forEach((t) => {
        initial[t.id] = {};
        activeClass.fields.forEach((f) => {
          initial[t.id][f.id] = Math.round((f.min + f.max) / 2);
        });
      });
      // Self evaluation scores
      initial[student.id] = {};
      activeClass.fields.forEach((f) => {
        initial[student.id][f.id] = Math.round((f.min + f.max) / 2);
      });
    }
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [praiseTags, setPraiseTags] = useState<Record<string, string[]>>({});
  
  // Qualitative feedback text blocks
  const [strengthsText, setStrengthsText] = useState<Record<string, string>>({});
  const [growthText, setGrowthText] = useState<Record<string, string>>({});

  // Countdown timer clock, self calibration, and autosave tracker
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selfTouched, setSelfTouched] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<number | null>(null);

  // Mobile-first Swipeable Card Flow & Network states
  const [viewMode, setViewMode] = useState<'card' | 'continuous'>('card');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Applied role archetype per peer: peerId -> archetypeId | 'custom' | null
  const [appliedArchetype, setAppliedArchetype] = useState<Record<string, string | null>>({});

  // Collapsible qualitative feedback drawer per peer card: peerId -> boolean
  const [expandedFeedbackCards, setExpandedFeedbackCards] = useState<Record<string, boolean>>({});

  // Self-service editing mode for previously submitted evaluations
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);

  // Active Pulse Round for Quick Team Health Check-in (appears directly on Dashboard when instructor opens a round)
  const activePulseRound = activeClass?.pulseRounds?.find(r => r.status === 'active') || activeClass?.pulseRounds?.find(r => !r.status && (r as any).status !== 'closed');
  const existingPulseResponse = activePulseRound?.responses.find(r => r.studentId === student?.id);
  const hasSubmittedPulse = !!existingPulseResponse;

  const [pulseMoraleScore, setPulseMoraleScore] = useState<number>(4);
  const [pulseStatus, setPulseStatus] = useState<'on_track' | 'minor_roadblock' | 'blocked'>('on_track');
  const [pulseBlockerNote, setPulseBlockerNote] = useState<string>('');
  const [pulseCustomAnswers, setPulseCustomAnswers] = useState<Record<string, string | number>>({});
  const [isSubmittingPulse, setIsSubmittingPulse] = useState<boolean>(false);
  const [isEditingExistingPulse, setIsEditingExistingPulse] = useState<boolean>(false);

  useEffect(() => {
    if (existingPulseResponse) {
      setPulseMoraleScore(existingPulseResponse.moraleScore);
      setPulseStatus(existingPulseResponse.status);
      setPulseBlockerNote(existingPulseResponse.blockerNote || '');
      setPulseCustomAnswers(existingPulseResponse.customAnswers || {});
    } else {
      setPulseMoraleScore(4);
      setPulseStatus('on_track');
      setPulseBlockerNote('');
      setPulseCustomAnswers({});
    }
  }, [existingPulseResponse, activePulseRound?.id]);

  const handleDashboardPulseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePulseRound || !student || !activeClass) return;
    setIsSubmittingPulse(true);
    submitPulseResponse(activeClass.id, activePulseRound.id, {
      studentId: student.id,
      studentName: student.name,
      groupName: student.groupName,
      moraleScore: pulseMoraleScore,
      scaleType: activePulseRound.config?.scaleType || 'stars_5',
      status: pulseStatus,
      blockerNote: pulseBlockerNote.trim() ? pulseBlockerNote.trim() : undefined,
      customAnswers: Object.keys(pulseCustomAnswers).length > 0 ? pulseCustomAnswers : undefined
    });
    setTimeout(() => {
      setIsSubmittingPulse(false);
      setIsEditingExistingPulse(false);
      addToast('Your team health mini-review has been recorded! Thank you.', 'success');
    }, 350);
  };

  const renderPulseScaleIcon = (iconName?: string, isSelected?: boolean, color?: string) => {
    const size = 20;
    const style = { color: isSelected ? color || 'var(--primary)' : 'var(--text-secondary)' };
    switch (iconName) {
      case 'alert-circle': return <AlertCircle size={size} style={style} />;
      case 'alert-triangle': return <AlertTriangle size={size} style={style} />;
      case 'check-circle': return <CheckCircle2 size={size} style={style} />;
      case 'sparkles': return <Sparkles size={size} style={style} />;
      case 'frown': return <Frown size={22} style={style} />;
      case 'meh': return <Meh size={22} style={style} />;
      case 'smile': return <Smile size={22} style={style} />;
      case 'flame': return <Flame size={22} style={style} />;
      case 'star': return <Star size={size} style={{ ...style, fill: isSelected ? color || '#f59e0b' : 'transparent' }} />;
      default: return <Activity size={size} style={style} />;
    }
  };

  // Safe haptic feedback for mobile devices
  const triggerHaptic = (ms: number = 15) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  // Launch self-service edit mode for submitted evaluations
  const handleStartEditReview = () => {
    triggerHaptic(15);
    if (!activeClass || !student) return;
    const myExistingReviews = activeClass.reviews.filter((r) => r.reviewerId === student.id);
    if (myExistingReviews.length > 0) {
      const loadedEvals: Record<string, Record<string, number>> = { ...evaluations };
      const loadedTags: Record<string, string[]> = { ...praiseTags };
      const loadedStrengths: Record<string, string> = { ...strengthsText };
      const loadedGrowth: Record<string, string> = { ...growthText };

      myExistingReviews.forEach((rev) => {
        loadedEvals[rev.recipientId] = { ...(loadedEvals[rev.recipientId] || {}), ...rev.scores };
        if (rev.praiseTags) loadedTags[rev.recipientId] = rev.praiseTags;
        if (rev.strengthsText) loadedStrengths[rev.recipientId] = rev.strengthsText;
        if (rev.growthText) loadedGrowth[rev.recipientId] = rev.growthText;
      });

      setEvaluations(loadedEvals);
      setPraiseTags(loadedTags);
      setStrengthsText(loadedStrengths);
      setGrowthText(loadedGrowth);
    }
    setIsEditingSubmitted(true);
    setIsSubmitted(false);
    setActiveCardIndex(0);
  };

  // Online / Offline synchronization listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Internet connection restored. Synchronized.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Working offline. Changes are safely saved locally on this phone.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  const draftKey = `peer_draft_${classId}_${studentId}`;

  // Restore unsaved draft on load
  useEffect(() => {
    if (!student || student.submitted || isSubmitted) return;
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.evaluations) setEvaluations(parsed.evaluations);
        if (parsed.praiseTags) setPraiseTags(parsed.praiseTags);
        if (parsed.strengthsText) setStrengthsText(parsed.strengthsText);
        if (parsed.growthText) setGrowthText(parsed.growthText);
        if (parsed.selfTouched) setSelfTouched(parsed.selfTouched);
        if (parsed.savedAt) setLastDraftSaved(parsed.savedAt);
      }
    } catch (e) {
      console.warn('Failed to restore draft', e);
    }
  }, [draftKey, student?.submitted, isSubmitted]);

  // Real-time debounce auto-save to localStorage
  useEffect(() => {
    if (!student || student.submitted || isSubmitted) return;
    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(draftKey, JSON.stringify({
          evaluations,
          praiseTags,
          strengthsText,
          growthText,
          selfTouched,
          savedAt: now
        }));
        setLastDraftSaved(now);
      } catch (e) {
        console.warn('Failed to auto-save draft', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [evaluations, praiseTags, strengthsText, growthText, selfTouched, draftKey, student?.submitted, isSubmitted]);

  useEffect(() => {
    if (!activeClass || !activeClass.deadline) return;

    const updateTimer = () => {
      const diff = new Date(activeClass.deadline!).getTime() - new Date().getTime();
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeClass]);

  const isLocked = activeClass && activeClass.deadline && new Date(activeClass.deadline) <= new Date();
  const showLockoutScreen = isLocked && student && !student.submitted && !isSubmitted;

  // Synchronize dynamic browser document tab titles based on active student status/view
  useEffect(() => {
    if (!activeClass || !student) {
      document.title = 'Access Denied - PeerLens';
      return;
    }
    if (showLockoutScreen) {
      document.title = 'Evaluation Window Closed - PeerLens';
      return;
    }
    if ((student.submitted || isSubmitted) && !isEditingSubmitted) {
      document.title = `My Evaluation Report | ${cleanStudentName(student.name)} - PeerLens`;
      return;
    }
    document.title = `Peer Evaluation | ${activeClass.name} - PeerLens`;
  }, [activeClass, student, showLockoutScreen, isSubmitted, isEditingSubmitted]);

  // If class or student is invalid, show elegant error card
  if (!activeClass || !student) {
    return (
      <div className="tab-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} className="text-rose" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Invalid Credentials</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            The secure grading portal link you entered is incorrect or expired. Please contact your instructor to receive your personal grading credentials.
          </p>
        </div>
      </div>
    );
  }

  // Enforce Lockout Screen if timer expired
  if (showLockoutScreen) {
    return (
      <div className="tab-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '3rem 2.5rem', borderLeft: '4px solid var(--accent-rose)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-rose-light)', color: 'var(--accent-rose)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Submission Period Closed</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            The closing deadline for this evaluation round (<b>{new Date(activeClass.deadline!).toLocaleString()}</b>) has been reached. 
            All submissions are now locked and closed. If you need an extension, please contact your instructor.
          </p>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left' }}>
            <Info size={16} className="text-rose" style={{ flexShrink: 0 }} />
            <span><b>Access restricted:</b> Form editing was locked on final deadline trigger.</span>
          </div>
        </div>
      </div>
    );
  }

  // Pre-calculate analytical metrics for Student Dashboard & Report
  const {
    fieldAverages,
    fieldStdDevs,
    overallPercentage,
    reviewsReceived,
    expectedReviewsCount,
    gradeProgress
  } = calculateStudentMetrics(student, activeClass);

  const maxRubricScore = getTargetScale(activeClass);

  const renderReportView = () => {
    if (reviewsReceived === 0) {
      return (
        <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh', padding: '1.5rem', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: '540px', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { triggerHaptic(8); setPortalTab('dashboard'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <div className="card-premium" style={{ maxWidth: '540px', width: '100%', textAlign: 'center', padding: '3.5rem 2.5rem' }}>
            <div 
              style={{ 
                width: '72px', 
                height: '72px', 
                backgroundColor: 'var(--accent-teal-light)', 
                color: 'var(--accent-teal)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 0 0 8px hsl(173, 80%, 97%)'
              }}
            >
              <ShieldCheck size={36} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Evaluation Submitted Successfully
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Thank you, <b>{cleanStudentName(student.name)}</b>! Your peer evaluations for <b>{activeClass.name}</b> have been recorded successfully.
            </p>

            {/* Geographic & Institutional Context Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {student.university && (
                <span className="badge badge-primary" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                  <GraduationCap size={13} /> {student.university}
                </span>
              )}
              {student.degree && (
                <span className="badge badge-teal" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                  <BookOpen size={13} /> {student.degree}
                </span>
              )}
              {student.studentType === 'Erasmus' ? (
                <span className="badge" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 'bold' }}>
                  Erasmus
                </span>
              ) : (
                <span className="badge" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  Normal
                </span>
              )}
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                <Users size={13} /> Group: {student.groupName}
              </span>
            </div>

            {/* Teammate Submissions Progress bar */}
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', paddingTop: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                <span style={{ letterSpacing: '0.05em' }}>TEAM COMPLETION PROGRESS</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{reviewsReceived} / {expectedReviewsCount}</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${gradeProgress}%`, 
                    backgroundColor: 'var(--primary)', 
                    borderRadius: '9999px', 
                    transition: 'width 0.4s ease' 
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Your analytical feedback report will unlock automatically as soon as your team members submit their evaluations.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              <ShieldCheck size={18} className="text-teal" style={{ flexShrink: 0 }} /> 
              <span><b>Absolute Anonymity:</b> Teammates only see computed aggregates. Individual score selections are completely hidden.</span>
            </div>

            {/* Self-Service Edit Option */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleStartEditReview}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1rem',
                fontWeight: 700,
                fontSize: '0.86rem',
                borderRadius: '10px',
                borderColor: 'var(--border-color)'
              }}
            >
              <Edit3 size={15} /> Edit / Update My Evaluation
            </button>
          </div>
        </div>
      );
    }

    // reviewsReceived > 0: Render Gorgeous Performance Analytics Dashboard!
    const peerReviews = activeClass.reviews.filter(
      (r) => r.recipientId === student.id && teammates.some((t) => t.id === r.reviewerId)
    );

    // Compile praise tags count
    const receivedPraiseTagCounts: Record<string, number> = {};
    peerReviews.forEach((review) => {
      if (review.praiseTags) {
        review.praiseTags.forEach((tag) => {
          receivedPraiseTagCounts[tag] = (receivedPraiseTagCounts[tag] || 0) + 1;
        });
      }
    });

    // Compile self scores for side-by-side calibration mapping
    const selfReview = activeClass.reviews.find((r) => r.reviewerId === student.id && r.recipientId === student.id);
    const selfScores = selfReview ? selfReview.scores : {};

    // Milestone history compilation
    const milestoneHistory = (() => {
      const milestones = activeClass.milestones || [];
      const history = milestones.map((m) => {
        const mReviews = m.reviews.filter((r) => r.recipientId === student.id && teammates.some((t) => t.id === r.reviewerId));
        let sum = 0, max = 0;
        mReviews.forEach((r) => {
          activeClass.fields.forEach((f) => {
            if (r.scores[f.id] !== undefined) {
              sum += r.scores[f.id];
              max += f.max;
            }
          });
        });
        const pct = max > 0 ? Number(((sum / max) * 100).toFixed(1)) : null;
        return { name: m.name, pct };
      }).filter((x) => x.pct !== null) as { name: string; pct: number }[];

      if (overallPercentage !== null) {
        history.push({ name: 'Current Cycle', pct: overallPercentage });
      }
      return history;
    })();

    // Anonymized written comments extraction
    const strengthsComments = peerReviews.map((r) => r.strengthsText).filter(Boolean) as string[];
    const growthComments = peerReviews.map((r) => r.growthText).filter(Boolean) as string[];

    const shuffledStrengths = strengthsComments;
    const shuffledGrowth = growthComments;

    // Dynamic gamified achievements badges hub calculations
    const badges = (() => {
      const list = [];
      const reliabilityAvg = fieldAverages['f_reliability'] ?? 0;
      const collaborationAvg = fieldAverages['f_collaboration'] ?? 0;
      const qualityAvg = fieldAverages['f_quality'] ?? 0;

      // 1. Dependable Anchor
      const hasAnchor = (reliabilityAvg >= 8.5) || (overallPercentage !== null && overallPercentage >= 85);
      list.push({
        id: 'anchor',
        title: 'Dependable Anchor',
        desc: 'Highly reliable and consistent contributor.',
        icon: ShieldCheck,
        unlocked: hasAnchor,
        color: 'var(--primary)',
        bg: 'var(--primary-light)'
      });

      // 2. Creative Catalyst
      const creativeCount = receivedPraiseTagCounts['Creative Ideas'] || 0;
      list.push({
        id: 'creative',
        title: 'Creative Catalyst',
        desc: 'Supplied outstanding creative strategies.',
        icon: Lightbulb,
        unlocked: creativeCount >= 1,
        color: 'var(--accent-amber)',
        bg: 'var(--accent-amber-light)'
      });

      // 3. Super Supportive
      const supportiveCount = receivedPraiseTagCounts['Super Supportive'] || 0;
      list.push({
        id: 'supportive',
        title: 'Super Supportive',
        desc: 'Assisted team members and raised team morale.',
        icon: Heart,
        unlocked: supportiveCount >= 1,
        color: 'var(--accent-rose)',
        bg: 'var(--accent-rose-light)'
      });

      // 4. Quality Driver
      const qualityCount = receivedPraiseTagCounts['High Quality Work'] || 0;
      list.push({
        id: 'quality',
        title: 'Quality Driver',
        desc: 'Completed project milestones with premium quality.',
        icon: Award,
        unlocked: qualityCount >= 1 || (qualityAvg >= 8.5),
        color: 'var(--accent-teal)',
        bg: 'var(--accent-teal-light)'
      });

      // 5. Great Communicator
      const commCount = receivedPraiseTagCounts['Great Communicator'] || 0;
      list.push({
        id: 'communicator',
        title: 'Great Communicator',
        desc: 'Helped align group standing with robust communication.',
        icon: MessageSquare,
        unlocked: commCount >= 1 || (collaborationAvg >= 8.5),
        color: 'var(--primary)',
        bg: 'var(--primary-light)'
      });

      // 6. Stellar Drive
      const isStellar = overallPercentage !== null && overallPercentage >= 90;
      list.push({
        id: 'stellar',
        title: 'Stellar Leader',
        desc: 'Obtained exceptional overall teammate averages.',
        icon: Trophy,
        unlocked: isStellar,
        color: 'var(--accent-amber)',
        bg: 'var(--accent-amber-light)'
      });

      return list;
    })();

    const activeTier = getTierInfo(overallPercentage ?? 0);
    const TierIcon = activeTier.icon;

    const getConsensusInfo = (stdDev: number | null) => {
      if (stdDev === null) {
        return {
          label: 'Awaiting Submissions',
          color: 'var(--text-muted)',
          bgColor: 'var(--bg-app)',
          desc: 'More reviews are needed to measure teammate consensus.',
          icon: Info
        };
      }
      if (stdDev < 1.0) {
        return {
          label: 'High Agreement',
          color: 'var(--accent-teal)',
          bgColor: 'var(--accent-teal-light)',
          desc: 'Teammates graded your contributions very consistently.',
          icon: CheckCircle
        };
      }
      if (stdDev <= 2.0) {
        return {
          label: 'Normal Consensus',
          color: 'var(--primary)',
          bgColor: 'var(--primary-light)',
          desc: 'Teammates show consistent average alignment.',
          icon: Users
        };
      }
      return {
        label: 'Diverse Views',
        color: 'var(--accent-amber)',
        bgColor: 'var(--accent-amber-light)',
        desc: 'Teammates hold diverse perspectives on this metric.',
        icon: Info
      };
    };

    const strokeDashoffset = 314.16 - (314.16 * (overallPercentage ?? 0)) / 100;

    return (
      <div className="main-content tab-pane" style={{ maxWidth: '960px', padding: '2rem 1.5rem', width: '100%' }}>
        
        {/* Style block for print layout calibration */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .app-header, .app-footer, .hide-on-print, button { display: none !important; }
            .main-content { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
            .card, .card-premium { border: 1px solid #cbd5e1 !important; box-shadow: none !important; background: white !important; page-break-inside: avoid; margin-bottom: 1.5rem !important; }
          }
        ` }} />

        {/* Back to Dashboard Navigation Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }} className="hide-on-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { triggerHaptic(8); setPortalTab('dashboard'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
        </div>

        {/* Profile Card / Dashboard Banner */}
        <div className="card-premium" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: '-1.5rem', right: '-1.5rem', width: '160px', height: '160px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', opacity: 0.4, zIndex: 0 }} />
          
          <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <span className="badge badge-teal" style={{ gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                  <ShieldCheck size={12} /> Analytics Unlocked
                </span>
                <span className="badge badge-primary" style={{ gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                  <BarChart2 size={12} /> Performance Report
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                My Evaluation Report
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Peer Assessment Results for: <b>{cleanStudentName(student.name)}</b>
              </p>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary hide-on-print"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--border-color)', fontWeight: 600 }}
                  onClick={handleStartEditReview}
                >
                  <Edit3 size={14} /> Edit My Reviews
                </button>
                <button 
                  className="btn btn-secondary hide-on-print"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--border-color)', fontWeight: 600 }}
                  onClick={() => window.print()}
                >
                  <Download size={14} /> Download PDF Portfolio
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REPORT COMPILATION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                  <Users size={16} /> {reviewsReceived} of {expectedReviewsCount} Reviews Received
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', zIndex: 1 }}>
            {student.university && (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <GraduationCap size={14} className="text-indigo" /> {student.university}
              </span>
            )}
            {student.degree && (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <BookOpen size={14} className="text-teal" /> {student.degree}
              </span>
            )}
            {student.studentType === 'Erasmus' ? (
              <span className="badge" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', border: 'none', color: '#fff', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}>
                Erasmus
              </span>
            ) : (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                Normal
              </span>
            )}
            <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
              <Users size={14} className="text-amber" /> Group: {student.groupName}
            </span>
          </div>
        </div>

        {/* Analytics Breakdown Columns */}
        <div className="analytics-grid">
          
          {/* Left Column (Percentage score & RPG card) */}
          <div className="analytics-col-left">
            
            {/* Average score dial & tier */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Overall Teammate Rating</h3>
              
              {/* Concentric Circle SVG */}
              <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '1.5rem' }}>
                <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                  <circle 
                    cx="75" 
                    cy="75" 
                    r="50" 
                    stroke="var(--border-color)" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="75" 
                    cy="75" 
                    r="50" 
                    stroke={activeTier.color} 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray="314.16" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                </svg>
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {overallPercentage}%
                  </span>
                  {overallPercentage !== null && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-teal)', marginTop: '0.2rem' }}>
                      {((overallPercentage / 100) * maxRubricScore).toFixed(1)} / {maxRubricScore}
                    </span>
                  )}
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem', letterSpacing: '0.025em' }}>
                    Peer Average
                  </span>
                </div>
              </div>

              {/* RPG contribution card */}
              <div 
                className={`gamified-card ${activeTier.className}`} 
                style={{ 
                  width: '100%', 
                  cursor: 'default', 
                  transform: 'none', 
                  boxShadow: 'none', 
                  padding: '1.25rem 1rem',
                  borderWidth: '2px'
                }}
              >
                <div className="gamified-card-icon" style={{ backgroundColor: activeTier.color, color: '#fff', width: '32px', height: '32px', padding: '6px' }}>
                  <TierIcon size={18} />
                </div>
                <span className="gamified-card-title" style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  {activeTier.title}
                </span>
                <p className="gamified-card-desc" style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                  {activeTier.desc}
                </p>
              </div>
            </div>

            {/* Praise cloud card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} className="text-teal" /> Peer Recognition
              </h3>
              
              {Object.keys(receivedPraiseTagCounts).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)' }}>
                  <Info size={18} className="text-muted" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No specific praise tags selected by teammates.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(receivedPraiseTagCounts).map(([tagText, count]) => {
                    const tagInfo = getPraiseTagInfo(tagText);
                    const TagIcon = tagInfo.icon;
                    
                    return (
                      <div
                        key={tagText}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: tagInfo.bg,
                          color: tagInfo.color,
                          border: `1px solid ${tagInfo.border}`,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <TagIcon size={12} />
                        <span>{tagInfo.text}</span>
                        <span style={{ 
                          marginLeft: '0.2rem', 
                          backgroundColor: tagInfo.color, 
                          color: '#fff', 
                          borderRadius: '50%', 
                          width: '18px', 
                          height: '18px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.65rem',
                          fontWeight: 800 
                        }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gamified Achievements Badges Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={18} className="text-amber" /> Achievement Badges
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {badges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div 
                      key={b.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem', 
                        borderRadius: '8px', 
                        border: `1px solid ${b.unlocked ? b.color + '30' : 'var(--border-color)'}`,
                        backgroundColor: b.unlocked ? b.bg : 'var(--bg-app)',
                        opacity: b.unlocked ? 1 : 0.4,
                        filter: b.unlocked ? 'none' : 'grayscale(100%)',
                        boxShadow: b.unlocked ? '0 4px 6px rgba(0,0,0,0.02)' : 'none',
                        transition: 'all 200ms ease'
                      }}
                      title={b.unlocked ? b.desc : `Locked: ${b.desc}`}
                    >
                      <div 
                        style={{ 
                          backgroundColor: b.unlocked ? b.color : 'var(--text-muted)', 
                          color: '#fff', 
                          borderRadius: '50%', 
                          width: '32px', 
                          height: '32px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '0.4rem'
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.1 }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'block', lineHeight: 1.1 }}>
                        {b.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (Detailed scales breakdown) */}
          <div className="analytics-col-right">
            
            {/* Side-by-Side Calibration Graph Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={18} className="text-teal" /> Self vs. Peer Comparison
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                Compare your scores **side-by-side**: the <span style={{ color: 'var(--primary)', fontWeight: 700 }}>blue bars</span> represent the average ratings given to you by your teammates, while the <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>teal bars</span> represent your own self-evaluations. Use this comparison to calibrate your self-perception and reconcile alignment gaps!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeClass.fields.map(field => {
                  const fieldAvg = fieldAverages[field.id] ?? field.min;
                  const selfVal = selfScores[field.id] ?? field.min;
                  
                  const peerPct = ((fieldAvg - field.min) / (field.max - field.min || 1)) * 100;
                  const selfPct = ((selfVal - field.min) / (field.max - field.min || 1)) * 100;

                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{field.name}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        
                        {/* Teammate Average Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>Teammates:</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${peerPct}%`, backgroundColor: 'var(--primary)', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', width: '40px', textAlign: 'right' }}>{fieldAvg.toFixed(1)}</span>
                        </div>

                        {/* Self-Rating Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>Self Rating:</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${selfPct}%`, backgroundColor: 'var(--accent-teal)', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-teal)', width: '40px', textAlign: 'right' }}>{selfVal.toFixed(1)}</span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rubrics details */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={20} className="text-indigo" /> Rubric Performance Details
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>PEER SCORES</span>
            </div>

            {activeClass.fields.map((field) => {
              const fieldAvg = fieldAverages[field.id];
              const fieldStdDev = fieldStdDevs[field.id];
              const pct = fieldAvg !== null ? ((fieldAvg - field.min) / (field.max - field.min || 1)) * 100 : 0;
              
              const consensus = getConsensusInfo(fieldStdDev);
              const ConsensusIcon = consensus.icon;
              
              const barColor = fieldAvg !== null ? getTierInfo(pct).color : 'var(--text-muted)';

              return (
                <div key={field.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {field.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Scale: {field.min} to {field.max} • Weight: {field.weight}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: barColor }}>
                        {fieldAvg !== null ? `${fieldAvg} / ${field.max}` : 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {fieldAvg !== null ? `${Math.round(pct)}% success` : 'No reviews'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {fieldAvg !== null && (
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${pct}%`, 
                          backgroundColor: barColor, 
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    )}
                  </div>

                  {/* Agreement indicator */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.65rem 0.85rem', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Info size={13} className="text-muted" /> Teammate Agreement
                    </span>
                    
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: consensus.bgColor, 
                        color: consensus.color, 
                        gap: '0.25rem', 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.72rem',
                        border: `1px solid ${consensus.color}25`
                      }}
                      title={consensus.desc}
                    >
                      <ConsensusIcon size={12} /> {consensus.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Historical Milestone Growth Card */}
            {milestoneHistory.length >= 2 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={18} className="text-indigo" /> Milestone Performance Growth
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Track your overall teammate grading averages chronologically over archived class sprints.
                </p>

                {/* SVG Milestone Growth line chart */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox="0 0 500 150" style={{ width: '100%', minWidth: '400px', height: '150px', display: 'block' }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />

                    {(() => {
                      const width = 500;
                      const height = 150;
                      const paddingLeft = 40;
                      const paddingRight = 40;
                      const paddingTop = 30;
                      const paddingBottom = 30;
                      
                      const chartWidth = width - paddingLeft - paddingRight;
                      const chartHeight = height - paddingTop - paddingBottom;
                      const len = milestoneHistory.length;

                      const points = milestoneHistory.map((m, idx) => {
                        const x = paddingLeft + (idx * (chartWidth / (len - 1 || 1)));
                        const y = paddingTop + (chartHeight - (m.pct / 100) * chartHeight);
                        return { x, y, name: m.name, pct: m.pct };
                      });

                      const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
                      const fillPoints = `${points[0].x},${height - paddingBottom} ` + polylinePoints + ` ${points[len-1].x},${height - paddingBottom}`;

                      return (
                        <>
                          <polygon points={fillPoints} fill="url(#growthGrad)" />
                          <polyline points={polylinePoints} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--primary)" strokeWidth="3" />
                              <circle cx={p.x} cy={p.y} r="8" fill="var(--primary)" opacity="0.15" />
                              
                              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--text-primary)">
                                {p.pct.toFixed(1)}%
                              </text>
                              <text x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-muted)">
                                {p.name}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* Security banner */}
            <div 
              className="card" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                backgroundColor: 'var(--primary-light)', 
                borderColor: 'var(--primary)',
                padding: '1.25rem' 
              }}
            >
              <ShieldCheck size={20} className="text-primary" style={{ flexShrink: 0 }} />
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.15rem' }}>
                  Absolute Anonymity Ensured
                </h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Individual teammate ratings, names, and profiles are completely hidden. Your report only displays self-excluded team averages to ensure open and helpful peer reviews.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Shuffled Anonymous Teammate Comments Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {/* Strengths Comments */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-teal)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={20} className="text-teal" /> Teammate Strengths & Praise Feedback
            </h3>
            {shuffledStrengths.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Teammates did not submit written strengths praise comments in this round.
              </div>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shuffledStrengths.map((c, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{c}"
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Growth Comments */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-rose)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={20} className="text-rose" /> Opportunities for Growth & Improvement
            </h3>
            {shuffledGrowth.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Teammates did not submit constructive improvement comments in this round.
              </div>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shuffledGrowth.map((c, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{c}"
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem', textAlign: 'center' }}>
          * Teammate written reviews are shuffled randomly to prevent linking commentary to particular reviewers.
        </p>

      </div>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (str: string) => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #0d9488, #14b8a6)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #3b82f6, #06b6d4)'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !student) return;
    if (!profileForm.name.trim()) {
      addToast('Please enter your full name.', 'warning');
      return;
    }
    if (!profileForm.email.trim() || !profileForm.email.includes('@')) {
      addToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (!evalControls.allowProfileEditing) {
      addToast('Profile editing is currently locked by your instructor.', 'warning');
      setIsEditingProfile(false);
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedData = {
        ...student,
        id: student.id,
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        gender: profileForm.gender,
        englishProficiency: profileForm.englishProficiency,
        degree: profileForm.degree.trim(),
        university: profileForm.university.trim(),
        nationality: normalizeNationality(profileForm.nationality) || undefined,
        isInternational: profileForm.isInternational,
        isExchange: profileForm.isExchange,
        studentType: profileForm.isExchange ? 'Erasmus' : (profileForm.isInternational ? 'International' : 'Normal'),
        groupName: student.groupName,
        submitted: student.submitted
      };
      const res = await enrollStudent(activeClass.id, updatedData);
      if (res.success) {
        addToast('Profile updated successfully!', 'success');
        setIsEditingProfile(false);
      } else {
        addToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to update student profile:', err);
      addToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderProfileEditModal = () => (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setIsEditingProfile(false)}
    >
      <div 
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Edit Profile Information
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Update your registered details for {activeClass?.name}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditingProfile(false)}
            style={{ padding: '0.35rem', borderRadius: '50%', minWidth: '30px', minHeight: '30px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
              Email Address *
            </label>
            <input
              type="email"
              className="form-input"
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Degree / Major
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science"
                value={profileForm.degree}
                onChange={(e) => setProfileForm(prev => ({ ...prev, degree: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                University / College
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Stanford University"
                value={profileForm.university}
                onChange={(e) => setProfileForm(prev => ({ ...prev, university: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Nationality / Country
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Germany"
                value={profileForm.nationality}
                onChange={(e) => setProfileForm(prev => ({ ...prev, nationality: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Gender
              </label>
              <select
                className="form-select"
                value={profileForm.gender}
                onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
              English Proficiency
            </label>
            <select
              className="form-select"
              value={profileForm.englishProficiency}
              onChange={(e) => setProfileForm(prev => ({ ...prev, englishProficiency: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Native Speaker">Native Speaker</option>
              <option value="Fluent (C1/C2)">Fluent (C1/C2)</option>
              <option value="Intermediate (B1/B2)">Intermediate (B1/B2)</option>
              <option value="Basic (A1/A2)">Basic (A1/A2)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profileForm.isInternational}
                onChange={(e) => setProfileForm(prev => ({ ...prev, isInternational: e.target.checked }))}
              />
              <span>International Student (studying abroad from home country)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profileForm.isExchange}
                onChange={(e) => setProfileForm(prev => ({ ...prev, isExchange: e.target.checked }))}
              />
              <span>Exchange / Erasmus Student</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditingProfile(false)}
              disabled={isSavingProfile}
              style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingProfile}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.84rem', fontWeight: 800 }}
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPeerProfileModal = () => {
    if (!viewingPeer) return null;
    const isDone = (student.submitted || isSubmitted);
    const hasReview = evaluations[viewingPeer.id] && Object.keys(evaluations[viewingPeer.id]).length > 0;
    const peerFirstName = cleanStudentName(viewingPeer.name).split(' ')[0];

    return (
      <div 
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0.75rem'
        }}
        onClick={() => setViewingPeer(null)}
      >
        <div 
          className="modal-content"
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: getAvatarColor(viewingPeer.name || viewingPeer.id), 
                  color: '#fff', 
                  fontSize: '1rem', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0 
                }}
              >
                {getInitials(viewingPeer.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cleanStudentName(viewingPeer.name)}
                  </h3>
                  {viewingPeer.studentType === 'Erasmus' ? (
                    <span className="badge" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.6rem', padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                      Erasmus
                    </span>
                  ) : viewingPeer.studentType === 'International' ? (
                    <span className="badge badge-teal" style={{ fontSize: '0.6rem', padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                      International
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Group {viewingPeer.groupName || student.groupName} &bull; Teammate
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setViewingPeer(null)}
              style={{ padding: '0.3rem', borderRadius: '50%', minWidth: '28px', minHeight: '28px', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Clean Information List */}
          <div style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* University & Degree */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <GraduationCap size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block' }}>
                  Education
                </span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {viewingPeer.degree || 'Student'}
                </div>
                {viewingPeer.university && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                    {viewingPeer.university}
                  </div>
                )}
              </div>
            </div>

            {/* Country & Language */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Globe size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block' }}>
                  Origin &amp; Language
                </span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {viewingPeer.nationality || 'Not specified'}
                </div>
                {viewingPeer.englishProficiency && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                    English: {viewingPeer.englishProficiency}
                  </div>
                )}
              </div>
            </div>

            {/* Subtle metadata tags (Gender, Exchange) */}
            {(viewingPeer.gender || viewingPeer.isExchange || (viewingPeer.originalCountry && viewingPeer.originalCountry !== viewingPeer.nationality)) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingTop: '0.15rem' }}>
                {viewingPeer.gender && (
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    {viewingPeer.gender}
                  </span>
                )}
                {viewingPeer.isExchange && (
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 700 }}>
                    Exchange Student
                  </span>
                )}
                {viewingPeer.originalCountry && viewingPeer.originalCountry !== viewingPeer.nationality && (
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    Home: {viewingPeer.originalCountry}
                  </span>
                )}
              </div>
            )}

            {/* Review Status Banner */}
            <div 
              style={{ 
                padding: '0.5rem 0.75rem', 
                borderRadius: '8px', 
                backgroundColor: isDone ? 'rgba(20, 184, 166, 0.08)' : hasReview ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-app)',
                border: `1px solid ${isDone ? 'rgba(20, 184, 166, 0.22)' : hasReview ? 'rgba(99, 102, 241, 0.22)' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.74rem',
                marginTop: '0.2rem'
              }}
            >
              {isDone ? (
                <>
                  <CheckCircle size={14} className="text-teal" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--accent-teal)', fontWeight: 650 }}>Evaluation submitted for {peerFirstName}</span>
                </>
              ) : hasReview ? (
                <>
                  <Edit3 size={14} className="text-indigo" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--primary)', fontWeight: 650 }}>Draft saved &bull; Ready to submit</span>
                </>
              ) : (
                <>
                  <Clock size={14} className="text-muted" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)' }}>Evaluation pending</span>
                </>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', backgroundColor: 'var(--bg-surface)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setViewingPeer(null)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const peerIndex = teammates.findIndex(t => t.id === viewingPeer.id);
                setViewingPeer(null);
                if (peerIndex !== -1) {
                  setActiveCardIndex(peerIndex);
                }
                if (student.submitted || isSubmitted) {
                  handleStartEditReview();
                } else {
                  setPortalTab('evaluate');
                }
              }}
              style={{ padding: '0.4rem 0.95rem', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>{isDone ? 'Edit Review' : `Evaluate ${peerFirstName}`}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const isUnassigned = !student.groupName || student.groupName === 'Unassigned' || student.groupName === 'General Team';

    return (
      <div className="student-dashboard-content" style={{ width: '100%', maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.25s ease' }}>
        
        {/* Sleek Minimal Profile Card */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem 1.35rem', 
            borderRadius: '14px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)', 
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: getAvatarColor(student.name || student.id), 
                  color: '#fff', 
                  fontSize: '1.15rem', 
                  fontWeight: 900, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  flexShrink: 0
                }}
              >
                {getInitials(student.name)}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 850, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                    {cleanStudentName(student.name)}
                  </h1>
                  {student.studentType === 'Erasmus' ? (
                    <span className="badge" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.62rem', padding: '0.1rem 0.45rem', borderRadius: '5px' }}>
                      Erasmus
                    </span>
                  ) : student.studentType === 'International' ? (
                    <span className="badge badge-teal" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', borderRadius: '5px' }}>
                      International
                    </span>
                  ) : null}
                </div>

                {/* Typographic academic line instead of heavy boxes */}
                {(student.degree || student.university) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {student.degree && <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{student.degree}</span>}
                    {student.degree && student.university && <span style={{ color: 'var(--text-muted)' }}>&bull;</span>}
                    {student.university && <span>{student.university}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={12} className="text-muted" /> {student.email}
                  </span>
                  <span>&bull;</span>
                  <span>ID: {student.id}</span>
                </div>
              </div>
            </div>

            {evalControls.allowProfileEditing ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { triggerHaptic(10); setIsEditingProfile(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', fontWeight: 700, padding: '0.35rem 0.65rem', borderRadius: '8px', flexShrink: 0 }}
              >
                <Edit3 size={13} /> Edit
              </button>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}
                title="Profile info editing has been locked by your instructor."
              >
                <Lock size={12} /> Locked
              </span>
            )}
          </div>

          {/* Understated metadata pill strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 750, color: 'var(--accent-teal)', backgroundColor: 'rgba(20, 184, 166, 0.08)', padding: '0.22rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(20, 184, 166, 0.22)' }}>
              <Users size={11} /> Group: {student.groupName}
            </span>
            {student.nationality && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-app)', padding: '0.22rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Globe size={11} className="text-amber" /> {student.nationality}
              </span>
            )}
            {student.englishProficiency && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-app)', padding: '0.22rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <MessageSquare size={11} className="text-teal" /> {student.englishProficiency}
              </span>
            )}
            {student.gender && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '0.22rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {student.gender}
              </span>
            )}
          </div>
        </div>

        {/* Active Team Health Micro-Pulse Completed Status Banner */}
        {activePulseRound && hasSubmittedPulse && !isEditingExistingPulse && (
          <div
            className="card"
            style={{
              padding: '0.9rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              backgroundColor: 'rgba(20, 184, 166, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(20, 184, 166, 0.15)',
                  color: 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {activePulseRound.title}: Check-in Recorded
                  </span>
                  <span className="badge badge-teal" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                    {existingPulseResponse?.status === 'on_track' ? 'On Track' : existingPulseResponse?.status === 'minor_roadblock' ? 'Minor Roadblock' : 'Blocked'}
                  </span>
                </div>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Thank you! Your feedback helps your instructor ensure your team is thriving.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditingExistingPulse(true)}
              style={{ fontSize: '0.74rem', height: '30px', padding: '0 0.75rem', borderRadius: '6px' }}
            >
              Update Check-in
            </button>
          </div>
        )}

        {/* Active Team Health Micro-Pulse Form Card Directly on Dashboard */}
        {activePulseRound && (!hasSubmittedPulse || isEditingExistingPulse) && (() => {
          const scaleType = activePulseRound.config?.scaleType || 'stars_5';
          const scalePreset = PULSE_SCALE_PRESETS[scaleType] || PULSE_SCALE_PRESETS.stars_5;
          const options = activePulseRound.config?.scaleOptions || scalePreset.options;

          return (
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1.5px solid rgba(20, 184, 166, 0.35)',
                borderLeft: '5px solid var(--accent-teal)',
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                      color: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {activePulseRound.title}
                      </h3>
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                        30s Mini Review
                      </span>
                    </div>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Quick check-in on how you are feeling with your team so far. Takes 30 seconds.
                    </p>
                  </div>
                </div>

                {isEditingExistingPulse && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditingExistingPulse(false)}
                    style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.6rem' }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Form Content */}
              <form onSubmit={handleDashboardPulseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Question 1: Morale & Alignment Rating */}
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      1. {activePulseRound.config?.moralePrompt || 'How are you feeling about team collaboration & morale?'}
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {scalePreset.title}
                    </span>
                  </div>

                  {/* Stars 5 */}
                  {scaleType === 'stars_5' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isFilled = starVal <= pulseMoraleScore;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setPulseMoraleScore(starVal)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <Star
                                size={28}
                                style={{
                                  fill: isFilled ? '#f59e0b' : 'transparent',
                                  color: isFilled ? '#f59e0b' : 'var(--border-color)',
                                  strokeWidth: 2
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: options[pulseMoraleScore - 1]?.color || '#f59e0b' }}>
                        {options[pulseMoraleScore - 1]?.label || `${pulseMoraleScore} Stars`}
                      </span>
                    </div>
                  )}

                  {/* Likert 5 */}
                  {scaleType === 'likert_5' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {options.map((opt) => {
                        const isSelected = pulseMoraleScore === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPulseMoraleScore(opt.value)}
                            style={{
                              padding: '0.5rem 0.25rem',
                              borderRadius: '7px',
                              border: `1.5px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                              backgroundColor: isSelected ? `${opt.color}15` : 'var(--bg-surface)',
                              color: isSelected ? opt.color : 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{opt.value}</span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.1 }}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* RAG Traffic Light Icons */}
                  {scaleType === 'traffic_rag' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.45rem', marginTop: '0.35rem' }}>
                      {options.map((opt) => {
                        const isSelected = pulseMoraleScore === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPulseMoraleScore(opt.value)}
                            style={{
                              padding: '0.6rem 0.4rem',
                              borderRadius: '9px',
                              border: `1.5px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                              backgroundColor: isSelected ? `${opt.color}18` : 'var(--bg-surface)',
                              color: isSelected ? opt.color : 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            {renderPulseScaleIcon(opt.iconName, isSelected, opt.color)}
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textAlign: 'center' }}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Sentiment Pulse Icons */}
                  {scaleType === 'emoji_sentiment' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginTop: '0.35rem' }}>
                      {options.map((opt) => {
                        const isSelected = pulseMoraleScore === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPulseMoraleScore(opt.value)}
                            style={{
                              padding: '0.7rem 0.35rem',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                              backgroundColor: isSelected ? `${opt.color}18` : 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            {renderPulseScaleIcon(opt.iconName, isSelected, opt.color)}
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isSelected ? opt.color : 'var(--text-primary)', textAlign: 'center' }}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Slider 10 */}
                  {scaleType === 'slider_10' && (
                    <div style={{ padding: '0.4rem 0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>1 (Low)</span>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>{pulseMoraleScore} / 10</span>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>10 (Peak)</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={pulseMoraleScore}
                        onChange={(e) => setPulseMoraleScore(Number(e.target.value))}
                        style={{ width: '100%', height: '7px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  )}
                </div>

                {/* Question 2: Milestone Status */}
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    2. {activePulseRound.config?.progressPrompt || 'Is your team on track for this milestone?'}
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => setPulseStatus('on_track')}
                      style={{
                        padding: '0.65rem 0.4rem',
                        borderRadius: '8px',
                        border: `2px solid ${pulseStatus === 'on_track' ? '#10b981' : 'var(--border-color)'}`,
                        backgroundColor: pulseStatus === 'on_track' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                        color: pulseStatus === 'on_track' ? '#059669' : 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      <span>On Track</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPulseStatus('minor_roadblock')}
                      style={{
                        padding: '0.65rem 0.4rem',
                        borderRadius: '8px',
                        border: `2px solid ${pulseStatus === 'minor_roadblock' ? '#f59e0b' : 'var(--border-color)'}`,
                        backgroundColor: pulseStatus === 'minor_roadblock' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface)',
                        color: pulseStatus === 'minor_roadblock' ? '#d97706' : 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                      <span>Minor Roadblock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPulseStatus('blocked')}
                      style={{
                        padding: '0.65rem 0.4rem',
                        borderRadius: '8px',
                        border: `2px solid ${pulseStatus === 'blocked' ? '#ef4444' : 'var(--border-color)'}`,
                        backgroundColor: pulseStatus === 'blocked' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface)',
                        color: pulseStatus === 'blocked' ? '#dc2626' : 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      <AlertCircle size={16} style={{ color: '#ef4444' }} />
                      <span>Blocked</span>
                    </button>
                  </div>
                </div>

                {/* Custom Questions if added by professor */}
                {activePulseRound.config?.customQuestions && activePulseRound.config.customQuestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activePulseRound.config.customQuestions.map((q, idx) => (
                      <div key={q.id} style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                          {idx + 3}. {q.title} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>

                        {q.type === 'scale' && (
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            {[1, 2, 3, 4, 5].map((val) => {
                              const isSel = pulseCustomAnswers[q.id] === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setPulseCustomAnswers(prev => ({ ...prev, [q.id]: val }))}
                                  style={{
                                    flex: 1,
                                    height: '34px',
                                    borderRadius: '7px',
                                    border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                                    backgroundColor: isSel ? 'var(--primary-light)' : 'var(--bg-surface)',
                                    color: isSel ? 'var(--primary)' : 'var(--text-primary)',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'choice' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {(q.options || ['Yes', 'Partially', 'No']).map((opt) => {
                              const isSel = pulseCustomAnswers[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setPulseCustomAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  style={{
                                    padding: '0.5rem 0.65rem',
                                    borderRadius: '7px',
                                    border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                                    backgroundColor: isSel ? 'var(--primary-light)' : 'var(--bg-surface)',
                                    color: isSel ? 'var(--primary)' : 'var(--text-primary)',
                                    fontWeight: isSel ? 700 : 500,
                                    fontSize: '0.78rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span>{opt}</span>
                                  {isSel && <CheckCircle2 size={13} style={{ color: 'var(--primary)' }} />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'text' && (
                          <input
                            type="text"
                            value={(pulseCustomAnswers[q.id] as string) || ''}
                            onChange={(e) => setPulseCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Your answer..."
                            className="form-input"
                            style={{ height: '34px', fontSize: '0.8rem' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Blocker Notes */}
                {activePulseRound.config?.allowBlockerNotes !== false && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      {activePulseRound.config?.notePrompt || 'Any blockers or dependencies you want your instructor to know? (optional)'}
                    </label>
                    <input
                      type="text"
                      value={pulseBlockerNote}
                      onChange={(e) => setPulseBlockerNote(e.target.value)}
                      placeholder="e.g. Need help resolving library conflict, or waiting on API specs..."
                      className="form-input"
                      style={{ height: '36px', fontSize: '0.8rem' }}
                    />
                  </div>
                )}

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingPulse}
                    className="btn btn-teal"
                    style={{ fontSize: '0.82rem', fontWeight: 800, gap: '0.4rem', height: '36px', padding: '0 1.25rem' }}
                  >
                    <Send size={13} /> {isSubmittingPulse ? 'Recording...' : isEditingExistingPulse ? 'Update Check-in' : 'Submit 30-Second Check-in'}
                  </button>
                </div>
              </form>
            </div>
          );
        })()}

        {/* Peer Evaluation Status & Action Card */}
        <div 
          className="card" 
          style={{ 
            padding: '1.4rem', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)', 
            borderLeft: (student.submitted || isSubmitted) ? '4px solid var(--accent-teal)' : '4px solid var(--primary)',
            backgroundColor: 'var(--bg-surface)', 
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  backgroundColor: (student.submitted || isSubmitted) ? 'rgba(20, 184, 166, 0.12)' : 'rgba(99, 102, 241, 0.12)', 
                  color: (student.submitted || isSubmitted) ? 'var(--accent-teal)' : 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {(student.submitted || isSubmitted) ? <CheckCircle size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {(student.submitted || isSubmitted) ? 'Peer Evaluations Completed & Recorded' : 'Peer Evaluation Round Open'}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {(student.submitted || isSubmitted)
                    ? 'Your feedback has been submitted. You can update and fine-tune your responses anytime before deadline.'
                    : `Please complete evaluations for your ${teammates.length} teammates in ${student.groupName}. Ratings are 100% anonymous.`}
                </p>
              </div>
            </div>

            {activeClass?.deadline && (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '0.74rem', padding: '0.35rem 0.65rem', borderRadius: '8px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={12} className="text-amber" /> 
                {timeLeft !== null && timeLeft > 0 ? (
                  <span>Deadline: <b>{Math.floor(timeLeft / (1000 * 60 * 60 * 24))}d {Math.floor((timeLeft / (1000 * 60 * 60)) % 24)}h left</b></span>
                ) : (
                  <span>Deadline passed</span>
                )}
              </span>
            )}
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {(student.submitted || isSubmitted) ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleStartEditReview}
                  style={{ flex: 1, minHeight: '44px', minWidth: '160px', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', borderRadius: '10px' }}
                >
                  <Edit3 size={15} /> Edit My Submitted Reviews
                </button>
                {reviewsReceived > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { triggerHaptic(10); setPortalTab('report'); }}
                    style={{ flex: 1, minHeight: '44px', minWidth: '160px', fontWeight: 800, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', borderRadius: '10px', backgroundColor: 'var(--accent-teal)', borderColor: 'var(--accent-teal)' }}
                  >
                    <BarChart2 size={15} /> Open Full Analytical Report
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { triggerHaptic(15); setPortalTab('evaluate'); }}
                style={{ width: '100%', minHeight: '46px', fontSize: '0.94rem', fontWeight: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '10px' }}
              >
                Start Peer Review <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Teammates Section */}
        <div 
          className="card" 
          style={{ 
            padding: '1.4rem', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)', 
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={17} className="text-primary" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                My Assigned Team Roster
              </h2>
            </div>
            <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              {isUnassigned ? 'Unassigned' : `${teammates.length + 1} Members`}
            </span>
          </div>

          {isUnassigned ? (
            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={32} className="text-muted" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 0.3rem', color: 'var(--text-primary)' }}>
                Team Assignment in Progress
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Your instructor is currently organizing student groups. Once assigned, your teammates will appear here and you will be able to evaluate them.
              </p>
            </div>
          ) : teammates.length === 0 ? (
            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '0.82rem' }}>
                No other teammates are currently enrolled in <b>{student.groupName}</b>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {teammates.map((t) => {
                const hasReview = evaluations[t.id] && Object.keys(evaluations[t.id]).length > 0;
                return (
                  <div 
                    key={t.id}
                    onClick={() => { triggerHaptic(8); setViewingPeer(t); }}
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'none';
                    }}
                    title={`Click to view ${cleanStudentName(t.name)}'s profile`}
                  >
                    <div 
                      style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        background: getAvatarColor(t.name || t.id), 
                        color: '#fff', 
                        fontSize: '0.95rem', 
                        fontWeight: 800, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0 
                      }}
                    >
                      {getInitials(t.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cleanStudentName(t.name)}
                        </strong>
                        <Info size={12} className="text-muted" style={{ flexShrink: 0 }} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.degree || t.university || 'Teammate'}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {(student.submitted || isSubmitted) ? (
                        <span className="badge badge-teal" style={{ fontSize: '0.66rem', padding: '0.2rem 0.45rem', borderRadius: '6px', gap: '0.25rem' }}>
                          <Check size={10} /> Evaluated
                        </span>
                      ) : hasReview ? (
                        <span className="badge badge-indigo" style={{ fontSize: '0.66rem', padding: '0.2rem 0.45rem', borderRadius: '6px' }}>
                          Drafted
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.66rem', padding: '0.2rem 0.45rem', borderRadius: '6px' }}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance & Analytics Preview Hub */}
        <div 
          className="card" 
          style={{ 
            padding: '1.4rem', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)', 
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BarChart2 size={17} className="text-teal" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Performance &amp; Feedback Analytics
              </h2>
            </div>
            {reviewsReceived > 0 && (
              <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                Unlocked
              </span>
            )}
          </div>

          {reviewsReceived > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Metric Quick-Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contribution Score</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.25rem' }}>
                    {Math.round(overallPercentage ?? 0)}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reviews Received</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-teal)', marginTop: '0.25rem' }}>
                    {reviewsReceived} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {expectedReviewsCount}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Team Completion</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {gradeProgress}%
                  </div>
                </div>
              </div>

              {/* View Full Report Button */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { triggerHaptic(10); setPortalTab('report'); }}
                style={{ width: '100%', minHeight: '44px', fontWeight: 750, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', borderRadius: '10px' }}
              >
                <BarChart2 size={15} /> View Full Analytical Report &amp; Portfolio <ArrowRight size={15} />
              </button>
            </div>
          ) : (student.submitted || isSubmitted) ? (
            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                <span style={{ letterSpacing: '0.04em' }}>TEAM SUBMISSION PROGRESS</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{reviewsReceived} / {expectedReviewsCount}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                <div style={{ height: '100%', width: `${gradeProgress}%`, backgroundColor: 'var(--primary)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                Your analytical feedback report will unlock automatically as soon as your team members submit their evaluations.
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Lock size={22} style={{ margin: '0 auto 0.4rem auto', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.82rem' }}>
                Complete your peer evaluations above to unlock your personalized performance analytics and feedback portfolio.
              </p>
            </div>
          )}
        </div>

      </div>
    );
  };

  const handleSliderChange = (teammateId: string, fieldId: string, value: number) => {
    if (teammateId === student.id) {
      setSelfTouched(true);
    } else {
      if (appliedArchetype[teammateId]) {
        setAppliedArchetype((prev) => ({ ...prev, [teammateId]: 'custom' }));
      }
    }
    setEvaluations((prev) => ({
      ...prev,
      [teammateId]: {
        ...prev[teammateId],
        [fieldId]: value,
      },
    }));
  };

  const handleApplyArchetype = (peerId: string, arch: RoleArchetype) => {
    triggerHaptic(15);
    setEvaluations((prev) => {
      const current = { ...(prev[peerId] || {}) };
      activeClass.fields.forEach((f) => {
        current[f.id] = arch.calculateScore(f);
      });
      return { ...prev, [peerId]: current };
    });
    setAppliedArchetype((prev) => ({ ...prev, [peerId]: arch.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Map evaluations state to Review array structure expected by the context
      const reviewPayload = Object.entries(evaluations)
        .filter(([recipientId]) => evalControls.allowSelfReview || recipientId !== student.id)
        .map(([recipientId, scores]) => ({
          recipientId,
          scores,
          praiseTags: praiseTags[recipientId] || [],
          strengthsText: strengthsText[recipientId] || '',
          growthText: growthText[recipientId] || ''
        }));

      // Submit feedback via our context engine
      await submitPeerReviews(activeClass.id, student.id, reviewPayload);
      localStorage.removeItem(draftKey);
      setIsEditingSubmitted(false);
      setIsSubmitted(true);
      addToast(isEditingSubmitted ? 'Peer evaluation updated successfully!' : 'Peer evaluation submitted successfully!', 'success');
      setPortalTab('dashboard');
    } catch (err) {
      console.error(err);
      addToast('Failed to submit peer evaluations. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress progression timeline variables
  const completedTeammatesCount = teammates.filter(t => {
    return (strengthsText[t.id] || '').trim().length > 0 ||
           (growthText[t.id] || '').trim().length > 0 ||
           (praiseTags[t.id] || []).length > 0;
  }).length;
  
  const totalCompleted = completedTeammatesCount + (evalControls.allowSelfReview ? (selfTouched ? 1 : 0) : 0);
  const totalTarget = teammates.length + (evalControls.allowSelfReview ? 1 : 0);
  const progressPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 100;
  
  const reviewSubmitCardIndex = evalControls.allowSelfReview ? teammates.length + 1 : teammates.length;
  const totalCards = reviewSubmitCardIndex + 1;

  // Touch swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY) * 1.4) {
      if (distanceX > 0) {
        // Swiped Left -> Next Card
        if (activeCardIndex < totalCards - 1) {
          triggerHaptic(12);
          setActiveCardIndex(prev => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Swiped Right -> Previous Card
        if (activeCardIndex > 0) {
          triggerHaptic(12);
          setActiveCardIndex(prev => prev - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const renderEvaluationForm = () => (
    <div className="main-content tab-pane student-portal-wrapper" style={{ maxWidth: '800px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.25s ease' }}>
      
      {/* Top Header with Back to Dashboard */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => { triggerHaptic(10); setPortalTab('dashboard'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700 }}
        >
          <ChevronLeft size={14} /> Back to Dashboard
        </button>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          Evaluating Group {student.groupName} &bull; {teammates.length} Peers
        </span>
      </div>

      {/* Editing Mode Active Notice */}
      {isEditingSubmitted && (
        <div 
          style={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.08)', 
            color: 'var(--primary)', 
            border: '1px solid var(--primary)', 
            padding: '0.65rem 0.9rem', 
            borderRadius: '12px', 
            fontSize: '0.78rem', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '0.6rem', 
            marginBottom: '0.85rem' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Edit3 size={15} style={{ flexShrink: 0 }} />
            <span><b>Editing Mode Active:</b> You can modify your scores and comments. When finished, tap "Update &amp; Save".</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setIsEditingSubmitted(false);
              triggerHaptic(10);
            }}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', flexShrink: 0, borderColor: 'var(--border-color)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div 
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.12)', 
            color: 'var(--accent-rose)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '0.5rem 0.85rem', 
            borderRadius: '10px', 
            fontSize: '0.74rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            marginBottom: '0.75rem' 
          }}
        >
          <WifiOff size={15} style={{ flexShrink: 0 }} />
          <span>Offline Mode &bull; Your evaluation draft is safely auto-saved on this device. Submissions will transmit once internet reconnects.</span>
        </div>
      )}

      {/* Integrated Sticky Top Header & Tracker — 100% Mobile Optimized */}
      {teammates.length > 0 && (
        <div 
          className="progression-timeline-container" 
          style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 90,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            padding: '0.45rem 0.75rem',
            margin: '0 0 1rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: '12px'
          }}
        >
          {/* Row 1: Student Metadata, Mode Switcher & Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.4rem', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.12rem 0.45rem', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Group {student.groupName}
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cleanStudentName(student.name)}
              </span>
              {lastDraftSaved && (
                <span 
                  className="badge badge-teal" 
                  style={{ 
                    fontSize: '0.6rem', 
                    padding: '0.08rem 0.3rem', 
                    gap: '0.15rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Your rating changes and text are automatically saved locally"
                >
                  <Check size={8} /> Saved
                </span>
              )}

              {timeLeft !== null && (
                <span 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 700, 
                    color: timeLeft < 3600000 ? 'var(--accent-rose)' : 'var(--accent-amber)',
                    backgroundColor: timeLeft < 3600000 ? 'var(--accent-rose-light)' : 'var(--accent-amber-light)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    padding: '0.08rem 0.3rem',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Time remaining"
                >
                  <Clock size={9} />
                  {(() => {
                    const s = Math.floor(timeLeft / 1000);
                    const mins = Math.floor(s / 60);
                    const hrs = Math.floor(mins / 60);
                    const days = Math.floor(hrs / 24);
                    if (days > 0) return `${days}d`;
                    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
                    return `${mins}m`;
                  })()}
                </span>
              )}
            </div>

            {/* Right: View Mode Toggle & Progress Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              {/* Card Flow / All View Mode Switch */}
              <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-app)', padding: '2px', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => { setViewMode('card'); triggerHaptic(10); }}
                  style={{
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.64rem',
                    fontWeight: viewMode === 'card' ? 800 : 600,
                    backgroundColor: viewMode === 'card' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'card' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}
                  title="Card by Card Swipe View"
                >
                  <Layers size={10} /> Card
                </button>
                <button
                  type="button"
                  onClick={() => { setViewMode('continuous'); triggerHaptic(10); }}
                  style={{
                    padding: '0.15rem 0.4rem',
                    fontSize: '0.64rem',
                    fontWeight: viewMode === 'continuous' ? 800 : 600,
                    backgroundColor: viewMode === 'continuous' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'continuous' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}
                  title="Continuous Full Scroll View"
                >
                  <ListFilter size={10} /> All
                </button>
              </div>

              {/* Progress badge */}
              <div style={{ width: '38px', height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-teal) 0%, hsl(142, 70%, 45%) 100%)', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-teal)', backgroundColor: 'var(--accent-teal-light)', padding: '0.08rem 0.32rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Row 2: Swipeable Horizontal Stepper List */}
          <div
            className="progression-nodes-list"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              width: '100%',
              paddingBottom: '2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none'
            }}
          >
            {teammates.map((t, idx) => {
              const isDone = (strengthsText[t.id] || '').trim().length > 0 ||
                             (growthText[t.id] || '').trim().length > 0 ||
                             (praiseTags[t.id] || []).length > 0;
              const isActive = viewMode === 'card' && activeCardIndex === idx;
              
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`progression-node-bubble ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  style={{ 
                    padding: '0.18rem 0.5rem', 
                    fontSize: '0.68rem', 
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: `1px solid ${isActive ? 'var(--primary)' : isDone ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    backgroundColor: isActive ? 'var(--primary-light)' : isDone ? 'var(--accent-teal-light)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--primary)' : isDone ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 800 : 600,
                    boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
                    transition: 'all 150ms ease'
                  }}
                  onClick={() => {
                    triggerHaptic(10);
                    if (viewMode === 'card') {
                      setActiveCardIndex(idx);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      const el = document.getElementById(`card-peer-${t.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  title={`Evaluate ${cleanStudentName(t.name)}`}
                >
                  <div 
                    className="progression-node-badge"
                    style={{
                      width: '13px',
                      height: '13px',
                      fontSize: '0.55rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontWeight: 800,
                      backgroundColor: isActive ? 'var(--primary)' : isDone ? 'var(--accent-teal)' : 'var(--border-color)',
                      color: (isActive || isDone) ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {isDone ? <Check size={8} /> : idx + 1}
                  </div>
                  <span style={{ fontWeight: 600 }}>{cleanStudentName(t.name).split(' ')[0]}</span>
                </button>
              );
            })}

            {/* Self-Reflection Node (Optional - Enabled by Professor) */}
            {evalControls.allowSelfReview && (
              <button
                key="self-node"
                type="button"
                className={`progression-node-bubble ${selfTouched ? 'completed' : ''} ${viewMode === 'card' && activeCardIndex === teammates.length ? 'active' : ''}`}
                style={{ 
                  padding: '0.18rem 0.5rem', 
                  fontSize: '0.68rem', 
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  border: `1px solid ${viewMode === 'card' && activeCardIndex === teammates.length ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  backgroundColor: viewMode === 'card' && activeCardIndex === teammates.length ? 'var(--accent-teal-light)' : selfTouched ? 'var(--accent-teal-light)' : 'var(--bg-surface)',
                  color: (viewMode === 'card' && activeCardIndex === teammates.length) || selfTouched ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'card' && activeCardIndex === teammates.length ? '0 0 0 1px var(--accent-teal)' : 'none',
                  transition: 'all 150ms ease'
                }}
                onClick={() => {
                  triggerHaptic(10);
                  if (viewMode === 'card') {
                    setActiveCardIndex(teammates.length);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const el = document.getElementById('card-self-calibration');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                title="Self Evaluation"
              >
                <div 
                  className="progression-node-badge"
                  style={{
                    width: '13px',
                    height: '13px',
                    fontSize: '0.55rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontWeight: 800,
                    backgroundColor: viewMode === 'card' && activeCardIndex === teammates.length ? 'var(--accent-teal)' : selfTouched ? 'var(--accent-teal)' : 'var(--border-color)',
                    color: (viewMode === 'card' && activeCardIndex === teammates.length) || selfTouched ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {selfTouched ? <Check size={8} /> : <Star size={8} />}
                </div>
                <span style={{ fontWeight: 600 }}>Self</span>
              </button>
            )}

            {/* Review & Submit Node */}
            <button
              key="review-node"
              type="button"
              className={`progression-node-bubble ${viewMode === 'card' && activeCardIndex === reviewSubmitCardIndex ? 'active' : ''}`}
              style={{ 
                padding: '0.18rem 0.5rem', 
                fontSize: '0.68rem', 
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: `1px solid ${viewMode === 'card' && activeCardIndex === reviewSubmitCardIndex ? 'var(--primary)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: viewMode === 'card' && activeCardIndex === reviewSubmitCardIndex ? 'var(--primary-light)' : 'var(--bg-surface)',
                color: viewMode === 'card' && activeCardIndex === reviewSubmitCardIndex ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'card' && activeCardIndex === reviewSubmitCardIndex ? '0 0 0 1px var(--primary)' : 'none',
                transition: 'all 150ms ease'
              }}
              onClick={() => {
                triggerHaptic(10);
                if (viewMode === 'card') {
                  setActiveCardIndex(reviewSubmitCardIndex);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  const el = document.getElementById('card-submission-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              title="Review & Submit"
            >
              <div 
                className="progression-node-badge"
                style={{
                  width: '13px',
                  height: '13px',
                  fontSize: '0.55rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontWeight: 800,
                  backgroundColor: viewMode === 'card' && activeCardIndex === teammates.length + 1 ? 'var(--primary)' : 'var(--border-color)',
                  color: viewMode === 'card' && activeCardIndex === teammates.length + 1 ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <Send size={7} />
              </div>
              <span style={{ fontWeight: 600 }}>Review</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner for Solo Groups (Fallback) */}
      {teammates.length === 0 && (
        <div style={{ padding: '0.5rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            <span>{activeClass.name}</span>
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            Peer Evaluation
          </h1>
        </div>
      )}

      {teammates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <AlertCircle size={36} className="text-amber" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Solo Group Detected</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.82rem' }}>
            You are currently the only member assigned to the team <b>{student.groupName}</b>. Peer evaluations require at least 2 team members.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Swipeable Cards Wrapper for Mobile Gesture Handling */}
          <div 
            className="swipeable-cards-wrapper"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <style>{`
              @keyframes peerCardSlideIn {
                from {
                  opacity: 0;
                  transform: translateY(8px) scale(0.99);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}</style>

            {/* Peer Evaluator Cards List */}
            {teammates.map((peer, idx) => {
              const isVisible = viewMode === 'continuous' || activeCardIndex === idx;
              if (!isVisible) return null;

              return (
                <div 
                  key={peer.id} 
                  id={`card-peer-${peer.id}`} 
                  className="card" 
                  style={{ 
                    borderLeft: '4px solid var(--primary)', 
                    position: 'relative', 
                    padding: '1.1rem 0.95rem', 
                    scrollMarginTop: '80px',
                    animation: 'peerCardSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{cleanStudentName(peer.name)}</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Teammate ID: {peer.id} &bull; Card {idx + 1} of {teammates.length}</span>
                      </div>
                    </div>
                    <FeatureInfoButton featureId="student-grading-matrix" size="sm" tooltipText="How Peer Grading Works" />
                  </div>

                  {/* Quick Role Baseline Archetypes (Optional - Enabled by Professor) */}
                  {evalControls.showRoleBaseline && (
                    <div 
                      style={{ 
                        marginBottom: '1.1rem', 
                        padding: '0.65rem 0.75rem', 
                        backgroundColor: 'var(--bg-app)', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-color)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <SlidersHorizontal size={13} style={{ color: 'var(--primary)' }} />
                          <span>Starting Role Baseline</span>
                          <span style={{ fontSize: '0.64rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Optional quick-start)</span>
                        </span>
                        {appliedArchetype[peer.id] && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(8);
                              setAppliedArchetype(prev => ({ ...prev, [peer.id]: null }));
                            }}
                            style={{ fontSize: '0.66rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Clear Baseline
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                        {ROLE_ARCHETYPES.map(arch => {
                          const isSelected = appliedArchetype[peer.id] === arch.id;
                          return (
                            <button
                              key={arch.id}
                              type="button"
                              onClick={() => handleApplyArchetype(peer.id, arch)}
                              style={{
                                padding: '0.45rem 0.6rem',
                                borderRadius: '8px',
                                border: `1px solid ${isSelected ? arch.color : 'var(--border-color)'}`,
                                backgroundColor: isSelected ? arch.bgColor : 'var(--bg-surface)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.15rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isSelected ? arch.color : 'var(--text-primary)' }}>
                                  {arch.name}
                                </span>
                                {isSelected && <Check size={12} style={{ color: arch.color }} />}
                              </div>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                {arch.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {appliedArchetype[peer.id] === 'custom' ? (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={11} style={{ color: 'var(--primary)' }} />
                          <span>Customized baseline active. Individual slider values are preserved.</span>
                        </div>
                      ) : appliedArchetype[peer.id] ? (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={11} style={{ color: 'var(--primary)' }} />
                          <span>Baseline loaded. Fine-tune any criteria slider below to reflect {cleanStudentName(peer.name).split(' ')[0]}'s exact deliverables.</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          Select a starting project role above or freely adjust criteria sliders below.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rubric Sliders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {activeClass.fields.map((field) => {
                      const currentVal = evaluations[peer.id]?.[field.id] ?? Math.round((field.min + field.max) / 2);
                      const pct = ((currentVal - field.min) / (field.max - field.min || 1)) * 100;
                      const tier = getTierInfo(pct);
                      
                      const range = field.max - field.min;
                      const isNarrowRange = range <= 15;
                      const scoreNodes = [];
                      for (let val = field.min; val <= field.max; val++) {
                        scoreNodes.push(val);
                      }

                      const TierIcon = tier.icon;
                      return (
                        <div key={field.id} className="grading-slider-container" style={{ margin: 0 }}>
                          <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                                {field.name}
                              </span>
                              {field.description && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem', lineHeight: 1.3 }}>
                                  {field.description}
                                </span>
                              )}
                            </div>
                            <span className="slider-value-bubble" style={{ backgroundColor: tier.color, fontSize: '0.78rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0, color: '#fff' }}>
                              {currentVal} / {field.max}
                            </span>
                          </div>

                          {/* Quick Expectation Tier Snapping Grid */}
                          <div className="score-fine-tuner" style={{ marginTop: '0.2rem' }}>
                            <div 
                              style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                                gap: '0.35rem', 
                                marginBottom: '0.6rem' 
                              }}
                            >
                              {[
                                { label: 'Exemplary', sub: '100%', pct: 1.0, color: 'var(--accent-teal)', icon: Trophy },
                                { label: 'Proficient', sub: '75%', pct: 0.75, color: 'var(--primary)', icon: ThumbsUp },
                                { label: 'Developing', sub: '50%', pct: 0.5, color: 'var(--accent-amber)', icon: TrendingUp },
                                { label: 'Needs Work', sub: '25%', pct: 0.25, color: 'var(--accent-rose)', icon: AlertCircle }
                              ].map((t) => {
                                const targetVal = Math.round(field.min + t.pct * (field.max - field.min));
                                const isCurrent = 
                                  (t.pct === 0.25 && pct <= 25) ||
                                  (t.pct === 0.5 && pct > 25 && pct <= 50) ||
                                  (t.pct === 0.75 && pct > 50 && pct <= 75) ||
                                  (t.pct === 1.0 && pct > 75);
                                const TierIcon = t.icon;
                                return (
                                  <button
                                    key={t.label}
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      triggerHaptic(10);
                                      handleSliderChange(peer.id, field.id, targetVal);
                                    }}
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '0.35rem 0.55rem',
                                      minHeight: '32px',
                                      borderRadius: '8px',
                                      fontWeight: isCurrent ? 800 : 600,
                                      backgroundColor: isCurrent ? `${t.color}1c` : 'var(--bg-surface)',
                                      borderColor: isCurrent ? t.color : 'var(--border-color)',
                                      color: isCurrent ? t.color : 'var(--text-secondary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '0.35rem',
                                      width: '100%',
                                      boxSizing: 'border-box',
                                      boxShadow: isCurrent ? `0 0 0 1px ${t.color}` : 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title={`Set to ${t.label} (${t.sub} = ${targetVal} pts)`}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      <TierIcon size={12} style={{ flexShrink: 0, color: t.color }} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                                    </span>
                                    <span 
                                      style={{ 
                                        fontSize: '0.62rem', 
                                        fontWeight: 800, 
                                        color: isCurrent ? t.color : 'var(--text-muted)', 
                                        backgroundColor: isCurrent ? `${t.color}25` : 'var(--bg-surface-hover)', 
                                        padding: '0.08rem 0.3rem', 
                                        borderRadius: '4px',
                                        flexShrink: 0 
                                      }}
                                    >
                                      {t.sub}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Dynamic Qualitative Tier Indicator */}
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.6rem', 
                                padding: '0.5rem 0.65rem', 
                                borderRadius: '8px', 
                                backgroundColor: tier.bgColor, 
                                color: tier.color,
                                border: `1px solid ${tier.color}25`,
                                marginBottom: '0.75rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tier.color, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}>
                                <TierIcon size={12} />
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)', lineHeight: 1.2 }}>{tier.title}</strong>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.25, marginTop: '2px' }}>{tier.desc}</span>
                              </div>
                            </div>

                            {isNarrowRange ? (
                              <div className="score-nodes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center' }}>
                                {scoreNodes.map((nodeVal) => {
                                  const isActive = currentVal === nodeVal;
                                  return (
                                    <button
                                      key={nodeVal}
                                      type="button"
                                      className={`score-node-btn ${isActive ? 'active' : ''}`}
                                      style={isActive ? { backgroundColor: tier.color, borderColor: tier.color, color: '#fff' } : {}}
                                      onClick={() => {
                                        triggerHaptic(8);
                                        handleSliderChange(peer.id, field.id, nodeVal);
                                      }}
                                    >
                                      {nodeVal}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="score-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    className="score-stepper-btn"
                                    disabled={currentVal <= field.min}
                                    onClick={() => {
                                      triggerHaptic(8);
                                      handleSliderChange(peer.id, field.id, Math.max(field.min, currentVal - 1));
                                    }}
                                    style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                  >
                                    <Minus size={13} />
                                  </button>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '38px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>{currentVal}</span>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                      {Math.round(pct)}%
                                    </span>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    className="score-stepper-btn"
                                    disabled={currentVal >= field.max}
                                    onClick={() => {
                                      triggerHaptic(8);
                                      handleSliderChange(peer.id, field.id, Math.min(field.max, currentVal + 1));
                                    }}
                                    style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>

                                <div style={{ flex: 1, minWidth: '80px' }}>
                                  <input
                                    type="range"
                                    className="custom-slider"
                                    min={field.min}
                                    max={field.max}
                                    value={currentVal}
                                    style={{
                                      width: '100%',
                                      background: `linear-gradient(to right, ${tier.color} 0%, ${tier.color} ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`
                                    }}
                                    onChange={(e) => {
                                      handleSliderChange(peer.id, field.id, Number(e.target.value));
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible Qualitative Feedback & Comments Drawer (Conditional on Professor Controls) */}
                  {(() => {
                    const hasAnyQualitative = evalControls.showPraiseTags || evalControls.showStrengthsFeedback || evalControls.showGrowthSuggestions;
                    if (!hasAnyQualitative) return null;

                    const isExpanded = !!expandedFeedbackCards[peer.id];
                    const pTags = praiseTags[peer.id] || [];
                    const pStrengths = (strengthsText[peer.id] || '').trim();
                    const pGrowth = (growthText[peer.id] || '').trim();
                    const hasContent = pTags.length > 0 || pStrengths.length > 0 || pGrowth.length > 0;
                    const wordCount = (pStrengths ? pStrengths.split(/\s+/).filter(Boolean).length : 0) +
                                      (pGrowth ? pGrowth.split(/\s+/).filter(Boolean).length : 0);

                    return (
                      <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                        {/* Expand / Collapse Header Bar */}
                        <div
                          onClick={() => {
                            triggerHaptic(10);
                            setExpandedFeedbackCards(prev => ({ ...prev, [peer.id]: !prev[peer.id] }));
                          }}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            backgroundColor: hasContent ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-app)',
                            border: `1px solid ${hasContent ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: hasContent ? 'var(--primary-light)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: hasContent ? 'var(--primary)' : 'var(--text-muted)' }}>
                              <MessageSquare size={13} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Written Feedback &amp; Praise Tags
                                </span>
                                {hasContent && (
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)' }}>
                                    Recorded
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                {hasContent
                                  ? `${pTags.length} tags &bull; ${wordCount} words &bull; Tap to ${isExpanded ? 'collapse' : 'view/edit'}`
                                  : 'Strengths, growth tips & praise tags (Tap to expand)'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.72rem' }}>
                            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'peerCardSlideIn 0.2s ease-out' }}>
                            {/* Positive Praise Tag Selector (Optional - Enabled by Professor) */}
                            {evalControls.showPraiseTags && (
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Award size={13} className="text-teal" /> Strengths &amp; Praise Tags <span style={{ fontSize: '0.66rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Anonymous)</span>
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {AVAILABLE_TAGS.map(tag => {
                                    const selectedList = praiseTags[peer.id] || [];
                                    const isSelected = selectedList.includes(tag);
                                    const tagInfo = getPraiseTagInfo(tag);
                                    const TagIcon = tagInfo.icon;
                                    
                                    return (
                                      <button
                                        key={tag}
                                        type="button"
                                        className="btn btn-sm"
                                        style={{
                                          borderRadius: '16px',
                                          fontSize: '0.74rem',
                                          padding: '0.35rem 0.65rem',
                                          minHeight: '32px',
                                          border: `1px solid ${isSelected ? tagInfo.color : 'var(--border-color)'}`,
                                          backgroundColor: isSelected ? tagInfo.bg : 'var(--bg-surface)',
                                          color: isSelected ? tagInfo.color : 'var(--text-secondary)',
                                          fontWeight: isSelected ? 700 : 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          touchAction: 'manipulation',
                                          transition: 'all 150ms ease',
                                          boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'
                                        }}
                                        onClick={() => {
                                          triggerHaptic(10);
                                          const list = praiseTags[peer.id] || [];
                                          const next = list.includes(tag)
                                            ? list.filter(item => item !== tag)
                                            : [...list, tag];
                                          setPraiseTags(prev => ({ ...prev, [peer.id]: next }));
                                        }}
                                      >
                                        <TagIcon size={12} /> {tagInfo.text} {isSelected && <Check size={11} style={{ marginLeft: '2px' }} />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Smart Constructive Written Comments Assistant (Optional - Enabled by Professor) */}
                            {(evalControls.showStrengthsFeedback || evalControls.showGrowthSuggestions) && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: evalControls.showPraiseTags ? '1px dashed var(--border-color)' : 'none', paddingTop: evalControls.showPraiseTags ? '0.85rem' : '0' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                                  <MessageSquare size={13} className="text-primary" /> Written Constructive Feedback <span style={{ fontSize: '0.66rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Anonymous)</span>
                                </span>
                                
                                {evalControls.showStrengthsFeedback && (
                                  <ConstructiveFeedbackField
                                    label="What are this teammate's primary strengths?"
                                    placeholder="e.g. Completed documentation accurately, communicated proactively in standups..."
                                    value={strengthsText[peer.id] || ''}
                                    onChange={(val) => setStrengthsText(prev => ({ ...prev, [peer.id]: val }))}
                                    type="strengths"
                                    teammateName={peer.name}
                                    triggerHaptic={triggerHaptic}
                                  />
                                )}

                                {evalControls.showGrowthSuggestions && (
                                  <ConstructiveFeedbackField
                                    label="What is one constructive suggestion for their improvement?"
                                    placeholder="e.g. Could share code drafts earlier, or contribute more actively in brainstorming..."
                                    value={growthText[peer.id] || ''}
                                    onChange={(val) => setGrowthText(prev => ({ ...prev, [peer.id]: val }))}
                                    type="growth"
                                    teammateName={peer.name}
                                    triggerHaptic={triggerHaptic}
                                  />
                                )}

                                <details style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.15rem' }}>
                                  <summary style={{ outline: 'none', fontWeight: 700, color: 'var(--accent-amber)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <AlertTriangle size={12} className="text-amber" /> <span>Anonymity Guidelines (Tap to view)</span>
                                  </summary>
                                  <p style={{ marginTop: '0.35rem', lineHeight: 1.4, padding: '0.45rem', backgroundColor: 'var(--accent-amber-light)', borderRadius: '4px', border: '1px solid hsla(35, 92%, 47%, 0.15)' }}>
                                    Maintain strictly constructive, gender-neutral peer vocabulary to preserve complete anonymity.
                                  </p>
                                </details>
                              </div>
                            )}

                              {/* Collapse button when finished */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    triggerHaptic(8);
                                    setExpandedFeedbackCards(prev => ({ ...prev, [peer.id]: false }));
                                  }}
                                  style={{ fontSize: '0.72rem', padding: '0.22rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <ChevronUp size={12} />
                                  <span>Done with Feedback (Collapse)</span>
                                </button>
                              </div>
                            </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              );
            })}

            {/* SELF-EVALUATION CALIBRATION CARD (Optional - Enabled by Professor) */}
            {evalControls.allowSelfReview && (viewMode === 'continuous' || activeCardIndex === teammates.length) && (
              <div 
                id="card-self-calibration" 
                className="card" 
                style={{ 
                  borderLeft: '4px solid var(--accent-teal)', 
                  backgroundColor: 'var(--bg-surface)', 
                  padding: '1.1rem 0.95rem', 
                  scrollMarginTop: '80px',
                  animation: 'peerCardSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      <Star size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Self-Evaluation Calibration</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Objective self-reflection of your contributions</span>
                    </div>
                  </div>
                  <FeatureInfoButton featureId="webpa-scoring" size="sm" tooltipText="Why Self-Calibration Matters" />
                </div>

                <details style={{ backgroundColor: 'var(--primary-light)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-primary)', marginBottom: '1rem', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', userSelect: 'none' }}>
                    <Lightbulb size={13} className="text-primary" /> <span>Why evaluate myself? (Tap to expand)</span>
                  </summary>
                  <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.74rem' }}>
                    Your scores will be compared side-by-side with anonymous peer feedback to calibrate self-perception. <i>Classmates never see your self-ratings.</i>
                  </p>
                </details>

                {/* Rubric Sliders for Self */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {activeClass.fields.map((field) => {
                    const currentVal = evaluations[student.id]?.[field.id] ?? Math.round((field.min + field.max) / 2);
                    const pct = ((currentVal - field.min) / (field.max - field.min || 1)) * 100;
                    const tier = getTierInfo(pct);
                    const range = field.max - field.min;
                    const isNarrowRange = range <= 15;
                    const scoreNodes = [];
                    for (let val = field.min; val <= field.max; val++) {
                      scoreNodes.push(val);
                    }

                    const TierIcon = tier.icon;
                    return (
                      <div key={field.id} className="grading-slider-container" style={{ margin: 0 }}>
                        <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                              Self-Rating: {field.name}
                            </span>
                            {field.description && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem', lineHeight: 1.3 }}>
                                {field.description}
                              </span>
                            )}
                          </div>
                          <span className="slider-value-bubble" style={{ backgroundColor: 'var(--accent-teal)', color: '#fff', fontSize: '0.78rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                            {currentVal} / {field.max}
                          </span>
                        </div>

                        {/* Quick Expectation Tier Snapping Grid */}
                        <div className="score-fine-tuner" style={{ marginTop: '0.2rem' }}>
                          <div 
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                              gap: '0.35rem', 
                              marginBottom: '0.6rem' 
                            }}
                          >
                            {[
                              { label: 'Exemplary', sub: '100%', pct: 1.0, color: 'var(--accent-teal)', icon: Trophy },
                              { label: 'Proficient', sub: '75%', pct: 0.75, color: 'var(--primary)', icon: ThumbsUp },
                              { label: 'Developing', sub: '50%', pct: 0.5, color: 'var(--accent-amber)', icon: TrendingUp },
                              { label: 'Needs Work', sub: '25%', pct: 0.25, color: 'var(--accent-rose)', icon: AlertCircle }
                            ].map((t) => {
                              const targetVal = Math.round(field.min + t.pct * (field.max - field.min));
                              const isCurrent = 
                                (t.pct === 0.25 && pct <= 25) ||
                                (t.pct === 0.5 && pct > 25 && pct <= 50) ||
                                (t.pct === 0.75 && pct > 50 && pct <= 75) ||
                                (t.pct === 1.0 && pct > 75);
                              const TierIcon = t.icon;
                              return (
                                <button
                                  key={t.label}
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    triggerHaptic(10);
                                    handleSliderChange(student.id, field.id, targetVal);
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.35rem 0.55rem',
                                    minHeight: '32px',
                                    borderRadius: '8px',
                                    fontWeight: isCurrent ? 800 : 600,
                                    backgroundColor: isCurrent ? `${t.color}1c` : 'var(--bg-surface)',
                                    borderColor: isCurrent ? t.color : 'var(--border-color)',
                                    color: isCurrent ? t.color : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.35rem',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    boxShadow: isCurrent ? `0 0 0 1px ${t.color}` : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={`Set to ${t.label} (${t.sub} = ${targetVal} pts)`}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <TierIcon size={12} style={{ flexShrink: 0, color: t.color }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                                  </span>
                                  <span 
                                    style={{ 
                                      fontSize: '0.62rem', 
                                      fontWeight: 800, 
                                      color: isCurrent ? t.color : 'var(--text-muted)', 
                                      backgroundColor: isCurrent ? `${t.color}25` : 'var(--bg-surface-hover)', 
                                      padding: '0.08rem 0.3rem', 
                                      borderRadius: '4px',
                                      flexShrink: 0 
                                    }}
                                  >
                                    {t.sub}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic Qualitative Tier Indicator */}
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              padding: '0.5rem 0.65rem', 
                              borderRadius: '8px', 
                              backgroundColor: tier.bgColor, 
                              color: tier.color,
                              border: `1px solid ${tier.color}25`,
                              marginBottom: '0.75rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tier.color, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}>
                              <TierIcon size={12} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)', lineHeight: 1.2 }}>{tier.title}</strong>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.25, marginTop: '2px' }}>{tier.desc}</span>
                            </div>
                          </div>

                          {isNarrowRange ? (
                            <div className="score-nodes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center' }}>
                              {scoreNodes.map((nodeVal) => {
                                const isActive = currentVal === nodeVal;
                                return (
                                  <button
                                    key={nodeVal}
                                    type="button"
                                    className={`score-node-btn ${isActive ? 'active' : ''}`}
                                    style={isActive ? { backgroundColor: 'var(--accent-teal)', borderColor: 'var(--accent-teal)', color: '#fff' } : {}}
                                    onClick={() => {
                                      triggerHaptic(8);
                                      handleSliderChange(student.id, field.id, nodeVal);
                                    }}
                                  >
                                    {nodeVal}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="score-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className="score-stepper-btn"
                                  disabled={currentVal <= field.min}
                                  onClick={() => {
                                    triggerHaptic(8);
                                    handleSliderChange(student.id, field.id, Math.max(field.min, currentVal - 1));
                                  }}
                                  style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                >
                                  <Minus size={13} />
                                </button>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '38px' }}>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>{currentVal}</span>
                                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    {Math.round(pct)}%
                                  </span>
                                </div>
                                
                                <button
                                  type="button"
                                  className="score-stepper-btn"
                                  disabled={currentVal >= field.max}
                                  onClick={() => {
                                    triggerHaptic(8);
                                    handleSliderChange(student.id, field.id, Math.min(field.max, currentVal + 1));
                                  }}
                                  style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <div style={{ flex: 1, minWidth: '80px' }}>
                                <input
                                  type="range"
                                  className="custom-slider"
                                  min={field.min}
                                  max={field.max}
                                  value={currentVal}
                                  style={{
                                    width: '100%',
                                    background: `linear-gradient(to right, var(--accent-teal) 0%, var(--accent-teal) ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`
                                  }}
                                  onChange={(e) => handleSliderChange(student.id, field.id, Number(e.target.value))}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REVIEW & SUBMIT CONFIRMATION CARD */}
            {(viewMode === 'continuous' || activeCardIndex === reviewSubmitCardIndex) && (
              <div 
                id="card-submission-panel" 
                className="card" 
                style={{ 
                  borderLeft: '4px solid var(--accent-teal)', 
                  backgroundColor: 'var(--bg-surface)', 
                  padding: '1.2rem 1rem', 
                  scrollMarginTop: '80px',
                  animation: 'peerCardSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem'
                }}
              >
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      <CheckSquare size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Review &amp; Final Submission</h3>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confirm your feedback before locking. Submissions are 100% anonymous.</span>
                    </div>
                  </div>
                </div>

                {/* Teammate Evaluation Review Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {teammates.map((t, tIdx) => {
                    const tStrengths = strengthsText[t.id] || '';
                    const tGrowth = growthText[t.id] || '';
                    const tTags = praiseTags[t.id] || [];
                    const isComplete = tStrengths.trim().length > 0 || tGrowth.trim().length > 0 || tTags.length > 0;

                    return (
                      <div
                        key={t.id}
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          padding: '0.75rem 0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: isComplete ? 'var(--accent-teal-light)' : 'var(--bg-surface)', color: isComplete ? 'var(--accent-teal)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                              {isComplete ? <Check size={12} /> : tIdx + 1}
                            </div>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{cleanStudentName(t.name)}</strong>
                            {appliedArchetype[t.id] && (() => {
                              const arch = ROLE_ARCHETYPES.find(a => a.id === appliedArchetype[t.id]);
                              if (arch) {
                                return (
                                  <span style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem', borderRadius: '4px', backgroundColor: arch.bgColor, color: arch.color, fontWeight: 700 }}>
                                    {arch.name}
                                  </span>
                                );
                              }
                              if (appliedArchetype[t.id] === 'custom') {
                                return (
                                  <span style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Customized
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {viewMode === 'card' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                triggerHaptic(10);
                                setActiveCardIndex(tIdx);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                            >
                              Edit Card
                            </button>
                          )}
                        </div>

                        {/* Criteria scores chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {activeClass.fields.map(f => {
                            const score = evaluations[t.id]?.[f.id] ?? Math.round((f.min + f.max) / 2);
                            return (
                              <span
                                key={f.id}
                                style={{
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.68rem'
                                }}
                              >
                                {f.name}: <strong>{score}/{f.max}</strong>
                              </span>
                            );
                          })}
                        </div>

                        {/* Tags and qualitative snippet */}
                        {(tTags.length > 0 || tStrengths.trim() || tGrowth.trim()) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                            {tTags.length > 0 && (
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>Praise Tags: </span>
                                {tTags.join(', ')}
                              </div>
                            )}
                            {tStrengths.trim() && (
                              <div style={{ fontStyle: 'italic' }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Strengths: </span>
                                "{tStrengths.trim()}"
                              </div>
                            )}
                            {tGrowth.trim() && (
                              <div style={{ fontStyle: 'italic' }}>
                                <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>Growth: </span>
                                "{tGrowth.trim()}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Self-Evaluation Reflection Row (if enabled) */}
                  {evalControls.allowSelfReview && (
                    <div 
                      style={{ 
                        padding: '0.65rem 0.8rem', 
                        backgroundColor: 'var(--bg-app)', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Star size={12} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>Self-Evaluation Reflection</strong>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {selfTouched ? 'Custom self-calibrated ratings recorded' : 'Standard baseline calibration'}
                          </span>
                        </div>
                      </div>
                      {viewMode === 'card' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            triggerHaptic(10);
                            setActiveCardIndex(teammates.length);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                        >
                          Edit Self
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Peer Differentiation Guardrail & Analysis */}
                {teammates.length >= 2 && (() => {
                  const averages = teammates.map(t => {
                    const scores = activeClass.fields.map(f => evaluations[t.id]?.[f.id] ?? Math.round((f.min + f.max) / 2));
                    const avg = scores.reduce((sum, s) => sum + s, 0) / (scores.length || 1);
                    return { id: t.id, name: cleanStudentName(t.name), avg };
                  });

                  const allIdentical = averages.every(a => Math.abs(a.avg - averages[0].avg) < 0.05);
                  
                  // Check for duplicate feedback comments
                  const commentList = teammates
                    .map(t => (strengthsText[t.id] || '').trim().toLowerCase())
                    .filter(c => c.length > 5);
                  const hasDuplicateComments = new Set(commentList).size < commentList.length;

                  if (allIdentical || hasDuplicateComments) {
                    return (
                      <div 
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(245, 158, 11, 0.09)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, fontSize: '0.8rem' }}>
                          <Lightbulb size={15} style={{ flexShrink: 0 }} />
                          <span>Evaluation Nuance &amp; Differentiation Tip</span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#92400e', margin: 0, lineHeight: 1.4 }}>
                          {allIdentical && hasDuplicateComments
                            ? "You gave identical scores and feedback to multiple teammates. In team projects, teammates contribute in distinct ways (e.g., technical execution vs. coordination and organization). Differentiating feedback ensures honest, meaningful recognition."
                            : allIdentical
                            ? `All ${teammates.length} teammates currently share the exact same average score (${averages[0].avg.toFixed(1)} pts). Consider fine-tuning sliders to distinguish each member's unique strengths.`
                            : "Duplicate comments detected across multiple teammates. Personalizing each review with specific tasks provides more actionable feedback."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div 
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle size={14} style={{ flexShrink: 0 }} />
                      <span>Evaluations show healthy, balanced differentiation across teammate contributions.</span>
                    </div>
                  );
                })()}

                {/* Review Anonymity Assurance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                  <h4 style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.88rem' }}>
                    <ShieldCheck size={16} /> 100% Anonymity &amp; Academic Integrity Guarantee
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    Once submitted, your peer reviews are encrypted, locked, and aggregated into anonymous cohort metrics. Teammates never see individual score selections or reviewer identities.
                  </p>
                </div>

                {/* Big Submit Button */}
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'btn-disabled' : ''}`}
                  disabled={isSubmitting}
                  onClick={() => triggerHaptic(20)}
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    fontSize: '0.96rem', 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    borderRadius: '10px', 
                    boxShadow: '0 4px 18px var(--primary-glow)',
                    backgroundColor: 'var(--accent-teal)',
                    borderColor: 'var(--accent-teal)'
                  }}
                >
                  {isSubmitting ? 'Saving Evaluations...' : isEditingSubmitted ? 'Update & Save Evaluations' : 'Submit Anonymous Evaluations'} <Send size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Sticky Mobile Card Navigation Bar (Active in Card Flow Mode) */}
          {viewMode === 'card' && (
            <div 
              style={{
                position: 'sticky',
                bottom: '0.75rem',
                zIndex: 95,
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '0.55rem 0.75rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={activeCardIndex === 0}
                onClick={() => {
                  if (activeCardIndex > 0) {
                    triggerHaptic(10);
                    setActiveCardIndex(prev => prev - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ minWidth: '78px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem' }}
              >
                <ChevronLeft size={14} /> Back
              </button>

              {/* Step indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {activeCardIndex < teammates.length
                    ? `Teammate ${activeCardIndex + 1} of ${teammates.length}`
                    : evalControls.allowSelfReview && activeCardIndex === teammates.length
                    ? 'Self-Reflection'
                    : 'Review & Submit'}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Card {activeCardIndex + 1} of {totalCards}
                </span>
              </div>

              {activeCardIndex < totalCards - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    triggerHaptic(12);
                    setActiveCardIndex(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ minWidth: '78px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem' }}
                >
                  {activeCardIndex === teammates.length - 1 
                    ? (evalControls.allowSelfReview ? 'Self' : 'Review') 
                    : activeCardIndex === teammates.length 
                    ? 'Review' 
                    : 'Next'} <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  className={`btn btn-primary btn-sm ${isSubmitting ? 'btn-disabled' : ''}`}
                  disabled={isSubmitting}
                  onClick={() => triggerHaptic(20)}
                  style={{ minWidth: '95px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 800, backgroundColor: 'var(--accent-teal)', borderColor: 'var(--accent-teal)' }}
                >
                  {isSubmitting ? 'Saving...' : isEditingSubmitted ? 'Update & Save' : 'Submit'} <Send size={12} />
                </button>
              )}
            </div>
          )}

        </form>
      )}
    </div>
  );

  return (
    <div className="student-portal-root" style={{ width: '100%', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0.75rem 2.5rem' }}>
      {/* Sleek Mobile-First Segmented Tab Switcher */}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '840px', 
          marginBottom: '0.85rem', 
          position: 'sticky',
          top: '0.25rem',
          zIndex: 80,
          background: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
          <button
            type="button"
            onClick={() => { triggerHaptic(8); setPortalTab('dashboard'); }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.35rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: portalTab === 'dashboard' ? 800 : 600,
              backgroundColor: portalTab === 'dashboard' ? 'var(--primary)' : 'transparent',
              color: portalTab === 'dashboard' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutDashboard size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Dashboard</span>
            {activePulseRound && !hasSubmittedPulse && (
              <span 
                style={{ 
                  width: '7px', 
                  height: '7px', 
                  borderRadius: '50%', 
                  backgroundColor: portalTab === 'dashboard' ? '#a7f3d0' : 'var(--accent-teal)',
                  boxShadow: '0 0 6px rgba(20, 184, 166, 0.6)',
                  flexShrink: 0 
                }} 
                title="Active 30s Team Health Check waiting on Dashboard"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              if (student.submitted || isSubmitted) {
                handleStartEditReview();
              } else {
                setPortalTab('evaluate');
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.35rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: portalTab === 'evaluate' ? 800 : 600,
              backgroundColor: portalTab === 'evaluate' ? 'var(--primary)' : 'transparent',
              color: portalTab === 'evaluate' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckSquare size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.submitted || isSubmitted ? 'Edit Reviews' : 'Peer Reviews'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (reviewsReceived > 0 || student.submitted || isSubmitted) {
                triggerHaptic(8);
                setPortalTab('report');
              } else {
                addToast('Complete your peer evaluations to unlock your report.', 'info');
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.35rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: portalTab === 'report' ? 800 : 600,
              backgroundColor: portalTab === 'report' ? 'var(--primary)' : 'transparent',
              color: portalTab === 'report' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart2 size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>My Report</span>
            {reviewsReceived === 0 && !(student.submitted || isSubmitted) && (
              <Lock size={10} style={{ opacity: 0.6, flexShrink: 0 }} />
            )}
          </button>
        </div>
      </div>

      {/* Persistent notification banner if student is on Evaluate or Report tab when a pulse check is pending */}
      {portalTab !== 'dashboard' && activePulseRound && !hasSubmittedPulse && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => { triggerHaptic(8); setPortalTab('dashboard'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { triggerHaptic(8); setPortalTab('dashboard'); } }}
          style={{
            width: '100%',
            maxWidth: '840px',
            marginBottom: '0.85rem',
            padding: '0.65rem 1rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(20, 184, 166, 0.08)',
            border: '1.5px solid rgba(20, 184, 166, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Activity size={14} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activePulseRound.title}:
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                Quick 30-second team health check is waiting on your dashboard.
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: 'var(--accent-teal)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0
            }}
          >
            Take Check-in &rarr;
          </span>
        </div>
      )}

      {/* Modals */}
      {isEditingProfile && renderProfileEditModal()}
      {viewingPeer && renderPeerProfileModal()}

      {/* Main Dynamic View */}
      {portalTab === 'dashboard' && renderDashboard()}
      {portalTab === 'evaluate' && renderEvaluationForm()}
      {portalTab === 'report' && renderReportView()}
    </div>
  );
};
export default StudentPortal;
