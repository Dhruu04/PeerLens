// src/components/StudentSubReviewModal.tsx
// Formative Sub Peer Review evaluation modal for students
// Supports active editing and strict read-only locked mode once milestone checkpoint is closed.
// Respects activeClass.evaluationControls (show/hide praise tags, strengths, growth suggestions, self-review).

import React, { useState, useEffect, useMemo } from 'react';
import type { ClassData, Student, Review } from '../utils/math';
import { getEvaluationControls } from '../utils/math';
import type { SubPeerReviewRound } from '../utils/subPeerReview';
import Modal from './Modal';
import { 
  Send, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Lock,
  UserCheck,
  MessageSquare,
  Sparkles,
  Check
} from 'lucide-react';

interface StudentSubReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassData;
  round: SubPeerReviewRound;
  student: Student;
  onSubmitSubReview: (roundId: string, reviews: Review[]) => Promise<void>;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const PRAISE_TAG_OPTIONS = [
  'Proactive Communicator',
  'Reliable & Punctual',
  'Creative Problem Solver',
  'High Quality Deliverables',
  'Supportive Team Player',
  'Stepped Up During Crunch'
];

// Trigger lightweight vibration for tactile mobile feedback
const triggerHaptic = (ms = 10) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch (e) {}
};

// Generate initials from student name
const getInitials = (name: string) => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Consistent colorful avatar gradients
const getAvatarGradient = (str: string) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0d9488, #14b8a6)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return gradients[Math.abs(hash) % gradients.length];
};

// Qualitative descriptors and visual accents for ratings
const getScoreDescriptor = (score: number, max: number = 5) => {
  const pct = (score / max) * 100;
  if (pct <= 25) {
    return {
      label: 'Needs Growth',
      fullLabel: 'Needs Growth / Below Standard',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.35)',
      activeBtnBg: '#ef4444',
      activeBtnColor: '#ffffff'
    };
  } else if (pct <= 50) {
    return {
      label: 'Developing',
      fullLabel: 'Developing / Inconsistent',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.35)',
      activeBtnBg: '#f59e0b',
      activeBtnColor: '#ffffff'
    };
  } else if (pct <= 75) {
    return {
      label: 'Proficient',
      fullLabel: 'Proficient / Meets Expectations',
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      border: 'rgba(99, 102, 241, 0.35)',
      activeBtnBg: 'var(--primary)',
      activeBtnColor: '#ffffff'
    };
  } else if (pct <= 95) {
    return {
      label: 'Advanced',
      fullLabel: 'Advanced / Exceeds Expectations',
      color: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.1)',
      border: 'rgba(13, 148, 136, 0.35)',
      activeBtnBg: '#0d9488',
      activeBtnColor: '#ffffff'
    };
  } else {
    return {
      label: 'Exceptional',
      fullLabel: 'Exceptional / Role Model',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      activeBtnBg: '#10b981',
      activeBtnColor: '#ffffff'
    };
  }
};

export const StudentSubReviewModal: React.FC<StudentSubReviewModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  round,
  student,
  onSubmitSubReview,
  onToast
}) => {
  const evalControls = getEvaluationControls(activeClass);
  const isClosed = round.status === 'closed';

  // Target list of students: peers in group + self if instructor enabled allowSelfReview
  const targetStudents = useMemo(() => {
    const peers = activeClass.students.filter(
      s => s.groupName === student.groupName && s.id !== student.id
    );
    if (evalControls.allowSelfReview) {
      return [...peers, student];
    }
    return peers;
  }, [activeClass.students, student, evalControls.allowSelfReview]);

  // Determine rubric fields to evaluate
  const rubricFields = useMemo(() => {
    if (activeClass.fields && activeClass.fields.length > 0) {
      return activeClass.fields;
    }
    return [
      { id: 'contrib', name: 'Contribution & Work Ethic', description: 'Produces thorough, accurate deliverables on schedule.', min: 1, max: 5 },
      { id: 'quality', name: 'Deliverable Quality', description: 'Attention to detail, robustness, and meeting milestone requirements.', min: 1, max: 5 },
      { id: 'collab', name: 'Communication & Collaboration', description: 'Active transparency, responsiveness, and constructive teamwork.', min: 1, max: 5 }
    ];
  }, [activeClass.fields]);

  // Check if student already submitted reviews for this round
  const existingSubmissions = useMemo(() => {
    return round.reviews?.filter(r => r.reviewerId === student.id) || [];
  }, [round.reviews, student.id]);

  // State
  const [activeTeammateIndex, setActiveTeammateIndex] = useState<number>(0);
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, number>>>({});
  const [strengthsText, setStrengthsText] = useState<Record<string, string>>({});
  const [growthText, setGrowthText] = useState<Record<string, string>>({});
  const [praiseTags, setPraiseTags] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or prefill state whenever modal or round changes
  useEffect(() => {
    const initScores: Record<string, Record<string, number>> = {};
    const initStrengths: Record<string, string> = {};
    const initGrowth: Record<string, string> = {};
    const initTags: Record<string, string[]> = {};

    targetStudents.forEach(t => {
      const existing = existingSubmissions.find((s: Review) => s.recipientId === t.id);
      if (existing) {
        initScores[t.id] = { ...existing.scores };
        initStrengths[t.id] = existing.strengthsText || '';
        initGrowth[t.id] = existing.growthText || '';
        initTags[t.id] = existing.praiseTags || [];
      } else {
        const defaultScores: Record<string, number> = {};
        rubricFields.forEach((f: { id: string; min: number; max: number }) => {
          defaultScores[f.id] = Math.round((f.min + f.max) / 2);
        });
        initScores[t.id] = defaultScores;
        initStrengths[t.id] = '';
        initGrowth[t.id] = '';
        initTags[t.id] = [];
      }
    });

    setEvaluations(initScores);
    setStrengthsText(initStrengths);
    setGrowthText(initGrowth);
    setPraiseTags(initTags);
    setActiveTeammateIndex(0);
  }, [round.id, targetStudents, rubricFields, existingSubmissions]);

  const currentTarget = targetStudents[activeTeammateIndex] || null;
  const isSelf = currentTarget?.id === student.id;

  const handleScoreChange = (targetId: string, fieldId: string, value: number) => {
    if (isClosed) return; // Strictly locked when closed
    setEvaluations(prev => ({
      ...prev,
      [targetId]: {
        ...(prev[targetId] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleToggleTag = (targetId: string, tag: string) => {
    if (isClosed) return; // Strictly locked when closed
    setPraiseTags(prev => {
      const current = prev[targetId] || [];
      const updated = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [targetId]: updated };
    });
  };

  const isTeammateComplete = (targetId: string) => {
    const scores = evaluations[targetId];
    if (!scores) return false;
    return rubricFields.every((f: { id: string }) => scores[f.id] !== undefined && scores[f.id] !== null);
  };

  const completedTeammatesCount = useMemo(() => {
    return targetStudents.filter(t => isTeammateComplete(t.id)).length;
  }, [targetStudents, evaluations, rubricFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed) {
      onToast('This milestone checkpoint is closed and locked.', 'warning');
      return;
    }
    if (targetStudents.length === 0) {
      onToast('No teammates or self found to evaluate.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Review[] = targetStudents.map(t => ({
        reviewerId: student.id,
        recipientId: t.id,
        scores: evaluations[t.id] || {},
        strengthsText: evalControls.showStrengthsFeedback ? (strengthsText[t.id] || '').trim() : '',
        growthText: evalControls.showGrowthSuggestions ? (growthText[t.id] || '').trim() : '',
        praiseTags: evalControls.showPraiseTags ? (praiseTags[t.id] || []) : []
      }));

      await onSubmitSubReview(round.id, payload);
      onToast(`Milestone evaluation for "${round.title}" submitted successfully!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Failed to save milestone review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyQualitative = evalControls.showPraiseTags || evalControls.showStrengthsFeedback || evalControls.showGrowthSuggestions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isClosed ? `Milestone Review: ${round.title} (Closed)` : `Milestone Review: ${round.title}`}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.1rem 0' }}>
        
        {isClosed && (
          <div 
            style={{ 
              padding: '0.5rem 0.85rem', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.22)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.75rem',
              color: 'var(--accent-rose)',
              fontWeight: 700
            }}
          >
            <Lock size={13} />
            <span>Evaluation Closed &bull; Read-Only</span>
          </div>
        )}

        {targetStudents.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.92rem', fontWeight: 700 }}>No teammates found in your team ({student.groupName || 'Unassigned'}).</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>If you are working solo or your group hasn't been configured yet, check back later.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Responsive Stepper Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.74rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  Evaluating Teammate {activeTeammateIndex + 1} of {targetStudents.length}
                </span>

                {evalControls.allowSelfReview && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                    <UserCheck size={11} /> Includes Self-Calibration
                  </span>
                )}
              </div>

              {/* Teammate Stepper Tabs Strip */}
              <div 
                className="subreview-teammate-tabs"
                style={{ 
                  display: 'flex', 
                  gap: '0.45rem', 
                  overflowX: 'auto', 
                  paddingBottom: '0.25rem',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none'
                }}
              >
                {targetStudents.map((t, idx) => {
                  const isSelected = activeTeammateIndex === idx;
                  const isItemSelf = t.id === student.id;
                  const isDone = isTeammateComplete(t.id);
                  const firstName = t.name.trim().split(/\s+/)[0];

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveTeammateIndex(idx);
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        minHeight: '36px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : isDone ? 'rgba(20, 184, 166, 0.4)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : isDone ? 'rgba(20, 184, 166, 0.05)' : 'var(--bg-app)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                        boxShadow: isSelected ? '0 2px 8px var(--primary-glow)' : 'none'
                      }}
                    >
                      {/* Avatar Initials Pill */}
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: isItemSelf ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : getAvatarGradient(t.name),
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isItemSelf ? <UserCheck size={11} /> : getInitials(t.name)}
                      </div>

                      <span>
                        {isItemSelf ? `${firstName} (You)` : t.name}
                      </span>

                      {/* Status Checkmark Pill */}
                      {isDone ? (
                        <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                      ) : (
                        <span 
                          style={{ 
                            fontSize: '0.64rem', 
                            color: 'var(--text-muted)', 
                            backgroundColor: 'rgba(0,0,0,0.05)', 
                            padding: '1px 5px', 
                            borderRadius: '4px' 
                          }}
                        >
                          {idx + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentTarget && (
              <div 
                style={{ 
                  padding: '1.1rem 1.25rem', 
                  borderRadius: '14px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Evaluating Header with Previous / Next Step Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'nowrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isSelf ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : getAvatarGradient(currentTarget.name),
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isSelf ? <UserCheck size={18} /> : getInitials(currentTarget.name)}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isClosed ? 'Review for:' : 'Evaluating:'} {currentTarget.name}
                        </h4>
                        {isSelf && (
                          <span className="badge badge-teal" style={{ fontSize: '0.66rem', fontWeight: 800, padding: '0.15rem 0.45rem', flexShrink: 0 }}>
                            Self-Calibration
                          </span>
                        )}
                        {isTeammateComplete(currentTarget.id) && (
                          <span className="badge badge-teal" style={{ fontSize: '0.64rem', fontWeight: 750, gap: '0.2rem', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            <Check size={10} /> Completed
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isSelf 
                          ? 'Reflect honestly on your contributions, teamwork, and milestones achieved.'
                          : `Team: ${currentTarget.groupName || student.groupName} \u2022 Teammate ${activeTeammateIndex + 1} of ${targetStudents.length}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Prev / Next Navigator on Card Top */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={activeTeammateIndex === 0}
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveTeammateIndex(prev => Math.max(0, prev - 1));
                      }}
                      style={{ fontSize: '0.74rem', height: '30px', padding: '0 0.55rem', opacity: activeTeammateIndex === 0 ? 0.35 : 1, borderRadius: '7px' }}
                      title="Previous member"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={activeTeammateIndex >= targetStudents.length - 1}
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveTeammateIndex(prev => Math.min(targetStudents.length - 1, prev + 1));
                      }}
                      style={{ fontSize: '0.74rem', height: '30px', padding: '0 0.55rem', opacity: activeTeammateIndex >= targetStudents.length - 1 ? 0.35 : 1, borderRadius: '7px' }}
                      title="Next member"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Rubric Criteria Sliders / Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                  {rubricFields.map((field: { id: string; name: string; min: number; max: number; description?: string }) => {
                    const currentScore = evaluations[currentTarget.id]?.[field.id] ?? Math.round((field.min + field.max) / 2);
                    const rangeCount = field.max - field.min + 1;
                    const options = Array.from({ length: rangeCount }, (_, i) => field.min + i);

                    return (
                      <div 
                        key={field.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '11px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 750, color: 'var(--text-primary)', display: 'block' }}>
                            {field.name}
                          </span>
                          {field.description && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem', lineHeight: 1.35 }}>
                              {field.description}
                            </span>
                          )}
                        </div>

                        {/* Rating button strip - Touch & Phone Friendly */}
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
                          {options.map(val => {
                            const isValSelected = currentScore === val;
                            const optDescriptor = getScoreDescriptor(val, field.max);

                            return (
                              <button
                                key={val}
                                type="button"
                                disabled={isClosed}
                                onClick={() => {
                                  triggerHaptic(12);
                                  handleScoreChange(currentTarget.id, field.id, val);
                                }}
                                style={{
                                  minHeight: '44px',
                                  padding: '0.4rem 0',
                                  borderRadius: '9px',
                                  border: `1.5px solid ${isValSelected ? (isClosed ? 'var(--border-color)' : optDescriptor.color) : 'var(--border-color)'}`,
                                  backgroundColor: isValSelected ? (isClosed ? 'var(--primary-light)' : optDescriptor.activeBtnBg) : 'var(--bg-surface)',
                                  color: isValSelected ? (isClosed ? 'var(--primary)' : optDescriptor.activeBtnColor) : (isClosed ? 'var(--text-muted)' : 'var(--text-primary)'),
                                  fontWeight: isValSelected ? 900 : 700,
                                  fontSize: '0.96rem',
                                  cursor: isClosed ? 'default' : 'pointer',
                                  opacity: isClosed && !isValSelected ? 0.4 : 1,
                                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: isValSelected && !isClosed ? `0 4px 14px rgba(99, 102, 241, 0.35)` : 'none',
                                  transform: isValSelected && !isClosed ? 'scale(1.02)' : 'none',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '1px'
                                }}
                                title={`${val} of ${field.max}: ${optDescriptor.fullLabel}`}
                              >
                                <span>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', padding: '0 0.15rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lowest ({field.min})</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Highest ({field.max})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Qualitative Feedback Sections (Conditionally rendered per evaluationControls) */}
                {hasAnyQualitative && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.95rem' }}>
                    
                    {/* Praise Tags */}
                    {evalControls.showPraiseTags && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Sparkles size={13} className="text-amber" />
                            {isSelf ? 'Key Strengths & Praise Tags (Self-Recognition)' : 'Commendations & Praise Tags'}
                          </label>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {isClosed ? '(Submitted)' : 'Select recognition tags (Optional)'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {PRAISE_TAG_OPTIONS.map(tag => {
                            const isTagSelected = (praiseTags[currentTarget.id] || []).includes(tag);
                            if (isClosed && !isTagSelected) return null; // Only show given tags when closed

                            return (
                              <button
                                key={tag}
                                type="button"
                                disabled={isClosed}
                                onClick={() => {
                                  triggerHaptic(8);
                                  handleToggleTag(currentTarget.id, tag);
                                }}
                                style={{
                                  padding: '5px 12px',
                                  minHeight: '32px',
                                  borderRadius: '16px',
                                  fontSize: '0.75rem',
                                  fontWeight: isTagSelected ? 750 : 500,
                                  border: `1.5px solid ${isTagSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                                  backgroundColor: isTagSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                                  color: isTagSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                  cursor: isClosed ? 'default' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  transition: 'all 0.12s ease'
                                }}
                              >
                                <Star size={12} className={isTagSelected ? 'text-primary' : 'text-muted'} />
                                {tag}
                                {isTagSelected && <Check size={11} style={{ marginLeft: '2px' }} />}
                              </button>
                            );
                          })}
                          {isClosed && (praiseTags[currentTarget.id] || []).length === 0 && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No commendation tags were attached.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strengths Text */}
                    {evalControls.showStrengthsFeedback && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <label htmlFor={`subreview-strengths-${currentTarget.id}`} style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MessageSquare size={13} className="text-teal" />
                            {isSelf ? 'Key Contributions & Strengths This Milestone (Self-Review)' : 'Key Strengths During This Milestone'}
                          </label>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {isClosed ? 'Read only' : 'Qualitative Praise'}
                          </span>
                        </div>
                        <textarea
                          id={`subreview-strengths-${currentTarget.id}`}
                          name={`strengths-${currentTarget.id}`}
                          rows={2}
                          readOnly={isClosed}
                          value={strengthsText[currentTarget.id] || ''}
                          onChange={(e) => setStrengthsText(prev => ({ ...prev, [currentTarget.id]: e.target.value }))}
                          placeholder={isClosed 
                            ? 'No strengths feedback was recorded.' 
                            : isSelf 
                              ? 'Reflect on your primary contributions, solved roadblocks, or key deliverables in this milestone...'
                              : 'e.g. Consistently finished their assigned tasks on time and helped debug the team repo...'}
                          className="form-input"
                          style={{ 
                            fontSize: '0.82rem', 
                            width: '100%', 
                            minHeight: '64px',
                            resize: isClosed ? 'none' : 'vertical',
                            backgroundColor: isClosed ? 'var(--bg-app)' : undefined,
                            cursor: isClosed ? 'default' : undefined,
                            borderRadius: '9px'
                          }}
                        />
                      </div>
                    )}

                    {/* Constructive Growth Feedback */}
                    {evalControls.showGrowthSuggestions && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <label htmlFor={`subreview-growth-${currentTarget.id}`} style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MessageSquare size={13} className="text-primary" />
                            {isSelf ? 'Personal Growth & Improvement Focus (Self-Review)' : 'Constructive Suggestions for Next Milestone'}
                          </label>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {isClosed ? 'Read only' : 'Actionable Guidance'}
                          </span>
                        </div>
                        <textarea
                          id={`subreview-growth-${currentTarget.id}`}
                          name={`growth-${currentTarget.id}`}
                          rows={2}
                          readOnly={isClosed}
                          value={growthText[currentTarget.id] || ''}
                          onChange={(e) => setGrowthText(prev => ({ ...prev, [currentTarget.id]: e.target.value }))}
                          placeholder={isClosed 
                            ? 'No constructive growth suggestions were recorded.' 
                            : isSelf
                              ? 'Reflect on skills, communication, or timing you want to improve in next milestones...'
                              : 'e.g. Could share commit drafts earlier in our discord channel so we have time to review...'}
                          className="form-input"
                          style={{ 
                            fontSize: '0.82rem', 
                            width: '100%', 
                            minHeight: '64px',
                            resize: isClosed ? 'none' : 'vertical',
                            backgroundColor: isClosed ? 'var(--bg-app)' : undefined,
                            cursor: isClosed ? 'default' : undefined,
                            borderRadius: '9px'
                          }}
                        />
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* Bottom Actions - Phone Friendly, Responsive, and Ergonomic */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: isClosed ? 'flex-end' : 'space-between', 
                alignItems: 'center', 
                marginTop: '0.5rem', 
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                flexWrap: 'wrap', 
                gap: '0.65rem' 
              }}
            >
              {isClosed ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ minHeight: '42px', padding: '0 1.6rem', fontSize: '0.84rem', fontWeight: 750, borderRadius: '9px' }}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{ fontSize: '0.82rem', minHeight: '42px', padding: '0 1.1rem', borderRadius: '9px' }}
                  >
                    Cancel
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {activeTeammateIndex > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          triggerHaptic(8);
                          setActiveTeammateIndex(prev => prev - 1);
                        }}
                        style={{ minHeight: '42px', fontSize: '0.82rem', fontWeight: 700, gap: '0.35rem', display: 'inline-flex', alignItems: 'center', borderRadius: '9px' }}
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                    )}

                    {activeTeammateIndex < targetStudents.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          triggerHaptic(10);
                          setActiveTeammateIndex(prev => prev + 1);
                        }}
                        style={{ minHeight: '42px', fontSize: '0.84rem', fontWeight: 800, gap: '0.4rem', display: 'inline-flex', alignItems: 'center', borderRadius: '9px', padding: '0 1.3rem' }}
                      >
                        Next ({targetStudents[activeTeammateIndex + 1]?.name.split(' ')[0] || 'Teammate'}) <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        style={{
                          minHeight: '42px',
                          padding: '0 1.5rem',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          gap: '0.45rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '9px'
                        }}
                      >
                        <Send size={14} />
                        {isSubmitting 
                          ? 'Saving Evaluations...' 
                          : existingSubmissions.length > 0 
                            ? 'Update Milestone Evaluations' 
                            : 'Submit Milestone Evaluations'}
                      </button>
                    )}

                    {/* Secondary Submit button visible anytime if student has evaluated everyone and wants to submit early */}
                    {activeTeammateIndex < targetStudents.length - 1 && completedTeammatesCount === targetStudents.length && (
                      <button
                        type="submit"
                        className="btn btn-teal"
                        disabled={isSubmitting}
                        style={{
                          minHeight: '42px',
                          padding: '0 1rem',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          gap: '0.35rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '9px'
                        }}
                        title="All teammates have been evaluated. Click to submit directly."
                      >
                        <CheckCircle size={14} /> Submit All
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

          </form>
        )}

      </div>
    </Modal>
  );
};

export default StudentSubReviewModal;
